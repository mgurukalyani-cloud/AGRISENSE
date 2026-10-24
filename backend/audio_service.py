"""
AgriSense AI Animal Sound Recognition & Farm Repellent Service
Handles:
1. PyTorch model inference on bio-acoustic audio features (MFCCs, Mel-banks, Centroid, ZCR, RMS)
2. Multi-sample persistence filter & decision logic
3. Safe repellent response coordination (Monitoring, Alert, Audio Deterrent, Manual)
4. Cooldown timer and emergency killswitch
5. Farmer-configurable species profiles
6. Complete ESP32 hardware telemetry & pinout specs
"""

import io
import os
import sys
import json
import time
import base64
from typing import Dict, Any, List, Optional
from datetime import datetime

# Ensure paths
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import numpy as np
import scipy.io.wavfile as wavfile
import soundfile as sf
import torch
import torch.nn as nn

try:
    from backend.audio_features import extract_acoustic_features
    from backend.train_audio_model import AnimalAudioClassifierNet, CLASS_INFO
except ImportError:
    from audio_features import extract_acoustic_features
    from train_audio_model import AnimalAudioClassifierNet, CLASS_INFO

try:
    from backend.hardware_service import hardware_manager
except ImportError:
    try:
        from hardware_service import hardware_manager
    except ImportError:
        hardware_manager = None

MODEL_WEIGHTS_PATH = os.path.join(current_dir, "models", "animal_sound_classifier.pt")
METADATA_PATH = os.path.join(current_dir, "models", "animal_classes.json")

# Default Farmer Species Configuration
DEFAULT_FARMER_RULES = {
    "cow": "beneficial",         # Never repel - protected livestock
    "sparrow": "beneficial",     # Never repel - beneficial pollinator/insectivore
    "wild_boar": "harmful",      # Repel - roots up crops, tubers, groundnuts
    "monkey": "harmful",         # Repel - raids maize, fruit trees, pulses
    "crow": "harmful",           # Repel - steals seedlings and grains
    "deer": "harmful",           # Repel - grazes foliage, pulses, vegetables
    "rodent": "harmful",         # Repel - gnaws root systems and stalks
    "farm_machinery": "ignore",  # Ambient farm noise
    "wind_rain": "ignore",       # Ambient weather
    "human_voice": "ignore"      # Ambient farm worker voices
}

# Bio-acoustic deterrent mapping
SPECIES_DETERRENT_MAP = {
    "wild_boar": {
        "sound_file": "/audio/deterrents/boar_apex_deterrent.wav",
        "description": "Safe natural apex predator territorial acoustic pattern (~95 Hz) + low-frequency startle percussion.",
        "safe_decibel_limit": 75,
        "duration_sec": 3.0
    },
    "monkey": {
        "sound_file": "/audio/deterrents/monkey_raptor_deterrent.wav",
        "description": "Natural black eagle / crested hawk bio-acoustic raptor cry (~2400 Hz), non-injurious.",
        "safe_decibel_limit": 75,
        "duration_sec": 3.0
    },
    "crow": {
        "sound_file": "/audio/deterrents/crow_dispersal_deterrent.wav",
        "description": "Targeted corvid dispersal bio-acoustic distress pulse (~1450 Hz), non-injurious.",
        "safe_decibel_limit": 72,
        "duration_sec": 3.0
    },
    "deer": {
        "sound_file": "/audio/deterrents/boar_apex_deterrent.wav",
        "description": "Simulated predator presence rustle and low-frequency crackle, non-injurious.",
        "safe_decibel_limit": 70,
        "duration_sec": 3.0
    },
    "rodent": {
        "sound_file": "/audio/deterrents/monkey_raptor_deterrent.wav",
        "description": "Intermittent natural barn owl screech snippet (natural rodent predator).",
        "safe_decibel_limit": 70,
        "duration_sec": 3.0
    }
}


class AudioInferenceEngine:
    def __init__(self):
        self.model: Optional[AnimalAudioClassifierNet] = None
        self.classes: List[str] = []
        self.feat_mean: Optional[np.ndarray] = None
        self.feat_std: Optional[np.ndarray] = None
        self.is_ready: bool = False
        self.farmer_rules: Dict[str, str] = dict(DEFAULT_FARMER_RULES)
        self.history_events: List[Dict[str, Any]] = []
        self.recent_detections_buffer: List[Dict[str, Any]] = []

        # System state
        self.system_enabled: bool = True
        self.response_mode: str = "audio_deterrent"  # 'monitoring' | 'alert' | 'audio_deterrent' | 'manual'
        self.confidence_threshold: float = 70.0      # 70% default threshold
        self.persistence_required_samples: int = 2   # Require 2 samples before firing repellent
        self.cooldown_period_sec: int = 60           # 60s cooldown after trigger
        self.last_repellent_trigger_time: float = 0.0
        self.active_deterrent: Optional[Dict[str, Any]] = None

        self._load_model()

    def _load_model(self):
        if not os.path.exists(MODEL_WEIGHTS_PATH):
            print(f"[AudioService] Warning: Model file {MODEL_WEIGHTS_PATH} not found. Running training script...")
            try:
                from backend.train_audio_model import build_and_train_model
                build_and_train_model()
            except Exception as e:
                print(f"[AudioService] Failed to train model on the fly: {e}")
                return

        try:
            checkpoint = torch.load(MODEL_WEIGHTS_PATH, map_location="cpu")
            self.classes = checkpoint["classes"]
            input_dim = checkpoint["input_dim"]
            num_classes = checkpoint["num_classes"]
            self.feat_mean = np.array(checkpoint["feat_mean"], dtype=np.float32)
            self.feat_std = np.array(checkpoint["feat_std"], dtype=np.float32)

            self.model = AnimalAudioClassifierNet(input_dim=input_dim, num_classes=num_classes)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.model.eval()
            self.is_ready = True
            print(f"[AudioService] Successfully loaded PyTorch Animal Sound Model with {len(self.classes)} classes.")
        except Exception as e:
            print(f"[AudioService] Error loading model: {e}")
            self.is_ready = False

    def decode_audio_bytes(self, raw_bytes: bytes) -> Tuple[np.ndarray, int]:
        """
        Decodes audio bytes (WAV, OGG, WebM, FLAC, or raw PCM) into 1D float32 array normalized to [-1, 1].
        """
        # 1. First try SoundFile
        try:
            data, sr = sf.read(io.BytesIO(raw_bytes))
            if data.ndim > 1:
                data = np.mean(data, axis=1)
            data = data.astype(np.float32)
            peak = np.max(np.abs(data))
            if peak > 0:
                data = data / peak
            return data, sr
        except Exception:
            pass

        # 2. Second try Scipy wavfile
        try:
            sr, data = wavfile.read(io.BytesIO(raw_bytes))
            if data.ndim > 1:
                data = np.mean(data, axis=1)
            if data.dtype == np.int16:
                data = data.astype(np.float32) / 32768.0
            elif data.dtype == np.int32:
                data = data.astype(np.float32) / 2147483648.0
            elif data.dtype == np.uint8:
                data = (data.astype(np.float32) - 128.0) / 128.0
            peak = np.max(np.abs(data))
            if peak > 0:
                data = data / peak
            return data.astype(np.float32), sr
        except Exception:
            pass

        # 3. Third try: raw 16-bit PCM bytes (e.g. from Web Audio ScriptProcessor or ESP32 DMA)
        try:
            if len(raw_bytes) >= 64:
                arr16 = np.frombuffer(raw_bytes, dtype=np.int16)
                if len(arr16) >= 32:
                    data = arr16.astype(np.float32) / 32768.0
                    peak = np.max(np.abs(data))
                    if peak > 0:
                        data = data / peak
                    return data, 16000
        except Exception:
            pass

        # 4. Fourth try: raw 32-bit float PCM bytes
        try:
            if len(raw_bytes) >= 128:
                arr32 = np.frombuffer(raw_bytes, dtype=np.float32)
                if len(arr32) >= 32 and not np.isnan(arr32).any():
                    data = arr32.copy()
                    peak = np.max(np.abs(data))
                    if peak > 0:
                        data = data / peak
                    return data, 16000
        except Exception:
            pass

        raise ValueError(f"Could not parse audio format. Ensure valid WAV or PCM audio payload (received {len(raw_bytes)} bytes).")

    def record_event(self, event_record: Dict[str, Any]) -> Dict[str, Any]:
        """Record an event (genuine or simulated) into audit history."""
        self.history_events.insert(0, event_record)
        if len(self.history_events) > 100:
            self.history_events.pop()
        return {"success": True, "event": event_record}

    def classify_audio(self, audio_data: np.ndarray, sample_rate: int = 16000,
                       source_label: str = "Live Farm Microphone") -> Dict[str, Any]:
        """
        Performs genuine bio-acoustic feature extraction & PyTorch neural network classification.
        Evaluates multi-sample persistence, farmer category rules, and safe repellent logic.
        """
        if not self.is_ready or self.model is None:
            raise RuntimeError("Audio classification model is not initialized.")

        # Resample to 16kHz if necessary
        if sample_rate != 16000 and len(audio_data) > 0:
            num_target_samples = int(len(audio_data) * 16000 / sample_rate)
            from scipy import signal as sp_signal
            audio_data = sp_signal.resample(audio_data, num_target_samples)
            sample_rate = 16000

        # Extract 131 real bio-acoustic features
        feature_dict = extract_acoustic_features(audio_data, sample_rate=sample_rate)
        raw_feat = feature_dict["feature_vector"]
        metrics = feature_dict["metrics"]

        # Normalize features using saved model distributions
        norm_feat = (raw_feat - self.feat_mean) / self.feat_std
        feat_tensor = torch.tensor(norm_feat.reshape(1, -1), dtype=torch.float32)

        # Inference
        with torch.no_grad():
            logits = self.model(feat_tensor)
            probs = torch.softmax(logits, dim=1).numpy()[0]

        top_idx = int(np.argmax(probs))
        predicted_class = self.classes[top_idx]
        confidence = float(probs[top_idx] * 100.0)

        # Build full probability dictionary
        prob_dict = {
            self.classes[i]: round(float(probs[i] * 100.0), 1)
            for i in range(len(self.classes))
        }

        # Check rejection threshold for uncertain/unconfident sounds
        is_uncertain = confidence < self.confidence_threshold
        if is_uncertain:
            display_category = "unknown"
            farmer_rule = "unknown"
            predicted_class = "unknown"
            species_info = {
                "name": "Sound detected — species not identified",
                "scientific_name": "Unidentified bio-acoustic pattern",
                "description": "INMP441 audio energy recorded. Frequency/RMS features extracted, but no verified species classification exceeded the confidence threshold.",
                "category": "unknown"
            }
        else:
            farmer_rule = self.farmer_rules.get(predicted_class, "ignore")
            display_category = farmer_rule
            species_info = CLASS_INFO.get(predicted_class, {
                "name": predicted_class.replace("_", " ").title(),
                "scientific_name": "Unknown",
                "description": "Unclassified acoustic signal",
                "category": display_category
            })

        # Multi-Sample Persistence Check
        now = time.time()
        # Clean rolling buffer older than 15 seconds
        self.recent_detections_buffer = [
            item for item in self.recent_detections_buffer
            if now - item["timestamp_epoch"] < 15.0
        ]

        # Add current detection to rolling buffer
        detection_entry = {
            "class": predicted_class,
            "confidence": confidence,
            "category": display_category,
            "timestamp_epoch": now
        }
        self.recent_detections_buffer.append(detection_entry)

        # Count occurrences in rolling window
        same_class_count = sum(
            1 for item in self.recent_detections_buffer
            if item["class"] == predicted_class and item["confidence"] >= self.confidence_threshold
        )
        is_persistent = same_class_count >= self.persistence_required_samples

        # Cooldown check
        seconds_since_last_repellent = now - self.last_repellent_trigger_time
        in_cooldown = seconds_since_last_repellent < self.cooldown_period_sec
        cooldown_remaining = max(0, int(self.cooldown_period_sec - seconds_since_last_repellent))

        # Decision Logic:
        # 1. If system disabled -> no action
        # 2. If beneficial (Cow, Sparrow) -> PROTECT: NEVER repel under any circumstances!
        # 3. If uncertain/unknown -> LOG_UNCERTAIN: no automated repellent
        # 4. If ambient (machinery, weather, human) -> IGNORE
        # 5. If harmful (Wild Boar, Monkey, Crow, Deer, Rodent):
        #    - If not persistent -> PERSISTENCE_PENDING
        #    - If persistent and in cooldown -> COOLDOWN_BLOCKED
        #    - If persistent and not in cooldown:
        #      - Monitoring Mode -> LOG_ALERT (visual notice)
        #      - Alert Mode -> FARMER_BUZZER (gentle chime for farmer)
        #      - Audio Deterrent Mode -> ACTIVATE_DETERRENT (safe species-specific bio-acoustic)
        #      - Manual Mode -> APPROVAL_REQUIRED (requires farmer tap)

        action_taken = "none"
        deterrent_payload = None
        status_message = ""

        if not self.system_enabled:
            action_taken = "SYSTEM_DISABLED"
            status_message = "Farm Repellent Guard is currently paused by farmer."

        elif display_category == "beneficial":
            action_taken = "BENEFICIAL_PROTECTED"
            status_message = f"Protected {species_info['name']} recognized ({confidence:.1f}%). Safe bio-acoustic exemption active; repellent silenced."

        elif is_uncertain or display_category == "unknown":
            action_taken = "UNCERTAIN_LOGGED"
            status_message = f"Low confidence acoustic signal ({confidence:.1f}% < {self.confidence_threshold}%). Event recorded without triggering repellent."

        elif display_category == "ignore":
            action_taken = "AMBIENT_IGNORED"
            status_message = f"Ambient sound ({species_info['name']}) recognized. Normal farm background."

        elif display_category == "harmful":
            if not is_persistent:
                action_taken = "PERSISTENCE_PENDING"
                status_message = (
                    f"Harmful pest ({species_info['name']}) detected ({confidence:.1f}%). "
                    f"Awaiting 2nd sample confirmation (1/{self.persistence_required_samples}) to prevent false alarms."
                )
            elif in_cooldown:
                action_taken = "COOLDOWN_ACTIVE"
                status_message = f"Harmful pest confirmed, but system is in protective cooldown ({cooldown_remaining}s remaining). Deterrent suppressed to prevent noise habituation."
            else:
                # Target pest confirmed and persistent
                if self.response_mode == "monitoring":
                    action_taken = "MONITORING_ALERT"
                    status_message = f"[Monitoring Mode] Verified {species_info['name']} detected. Alert logged to dashboard."

                elif self.response_mode == "alert":
                    action_taken = "FARMER_ALERT_BUZZER"
                    status_message = f"[Alert Mode] Verified {species_info['name']} detected. Dashboard buzzer activated for farmer."
                    deterrent_payload = {
                        "sound_file": "/audio/deterrents/farmer_alert_chime.wav",
                        "description": "Gentle farmer notification chime.",
                        "safe_decibel_limit": 65,
                        "duration_sec": 3.0
                    }
                    self.last_repellent_trigger_time = now

                elif self.response_mode == "audio_deterrent":
                    action_taken = "DETERRENT_ACTIVATED"
                    species_det = SPECIES_DETERRENT_MAP.get(predicted_class, SPECIES_DETERRENT_MAP["wild_boar"])
                    deterrent_payload = species_det
                    self.last_repellent_trigger_time = now
                    self.active_deterrent = {
                        "species": predicted_class,
                        "species_name": species_info["name"],
                        "started_at": now,
                        "details": species_det
                    }
                    status_message = (
                        f"[Audio Deterrent Active] Targeted {species_det['description']} "
                        f"dispatched for {species_info['name']} (Volume clamped to {species_det['safe_decibel_limit']} dB)."
                    )

                elif self.response_mode == "manual":
                    action_taken = "MANUAL_APPROVAL_REQUIRED"
                    status_message = f"[Manual Mode] Verified {species_info['name']} detected. Awaiting farmer approval to fire deterrent."

        # Compute alert status
        alert_status = "Silent Log"
        if display_category == "beneficial":
            alert_status = "Protected Exemption"
        elif display_category == "harmful":
            if is_persistent and not in_cooldown:
                alert_status = "Active Alert"
            elif not is_persistent:
                alert_status = "Pending Confirmation"
            elif in_cooldown:
                alert_status = "Cooldown Suppressed"
        elif is_uncertain:
            alert_status = "Uncertain Event"

        # Compile Event Record
        event_record = {
            "id": f"evt-{int(now * 1000)}",
            "eventId": f"evt-{int(now * 1000)}",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "timestamp_epoch": now,
            "source": source_label,
            "species": predicted_class,
            "predicted_class": predicted_class,
            "species_name": species_info["name"],
            "scientific_name": species_info["scientific_name"],
            "category": display_category,
            "confidence": round(confidence, 1),
            "is_uncertain": is_uncertain,
            "is_persistent": is_persistent,
            "action_taken": action_taken,
            "action": action_taken,
            "status": alert_status,
            "status_message": status_message,
            "deterrent_triggered": deterrent_payload is not None,
            "deterrent_details": deterrent_payload,
            "audio_metrics": metrics
        }

        # Keep last 100 events in memory
        self.history_events.insert(0, event_record)
        if len(self.history_events) > 100:
            self.history_events.pop()


        return {
            "success": True,
            "event": event_record,
            "predicted_class": predicted_class,
            "species_info": species_info,
            "confidence": round(confidence, 1),
            "category": display_category,
            "probabilities": prob_dict,
            "is_uncertain": is_uncertain,
            "is_persistent": is_persistent,
            "action_taken": action_taken,
            "status_message": status_message,
            "deterrent_payload": deterrent_payload,
            "metrics": metrics,
            "cooldown_remaining_sec": max(0, int(self.cooldown_period_sec - (now - self.last_repellent_trigger_time))),
            "system_status": {
                "enabled": self.system_enabled,
                "mode": self.response_mode,
                "confidence_threshold": self.confidence_threshold,
                "in_cooldown": in_cooldown
            }
        }

    def manual_trigger_repellent(self, species_key: str = "wild_boar") -> Dict[str, Any]:
        """Manually trigger safe species-specific audio deterrent."""
        species_det = SPECIES_DETERRENT_MAP.get(species_key, SPECIES_DETERRENT_MAP["wild_boar"])
        now = time.time()
        self.last_repellent_trigger_time = now
        self.active_deterrent = {
            "species": species_key,
            "species_name": species_key.replace("_", " ").title(),
            "started_at": now,
            "details": species_det
        }
        event = {
            "id": f"evt-man-{int(now * 1000)}",
            "eventId": f"evt-man-{int(now * 1000)}",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "timestamp_epoch": now,
            "source": "Simulated Test Event (Manual Farmer Trigger)",
            "species": species_key,
            "predicted_class": species_key,
            "species_name": species_key.replace("_", " ").title(),
            "scientific_name": "Simulated Test Event",
            "category": "harmful",
            "confidence": None,  # Genuine confidence omitted for manual simulation
            "is_uncertain": False,
            "is_persistent": True,
            "action_taken": "SIMULATED_DETERRENT_FIRED",
            "action": "SIMULATED_DETERRENT_FIRED",
            "status": "Simulated Test Active",
            "status_message": f"Farmer manually simulated {species_det['description']}",
            "deterrent_triggered": True,
            "deterrent_details": species_det,
            "audio_metrics": {}
        }

        self.history_events.insert(0, event)

        if hardware_manager:
            hardware_manager.issue_buzzer_command(
                command="ON",
                duration_sec=3.0,
                source="manual_repellent"
            )

        return {"success": True, "event": event, "deterrent_details": species_det}


    def stop_all_repellents(self) -> Dict[str, Any]:
        """Emergency Killswitch: stops active repellent immediately."""
        self.active_deterrent = None
        # Reset rolling buffer
        self.recent_detections_buffer.clear()
        now = time.time()

        if hardware_manager:
            hardware_manager.issue_buzzer_command(
                command="OFF",
                source="emergency_killswitch"
            )

        event = {
            "id": f"evt-stop-{int(now * 1000)}",
            "eventId": f"evt-stop-{int(now * 1000)}",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "timestamp_epoch": now,
            "source": "Emergency Stop Killswitch",
            "species": "emergency_stop",
            "predicted_class": "emergency_stop",
            "species_name": "Emergency Stop Override",
            "scientific_name": "Safety Intervention",
            "category": "safety_stop",
            "confidence": None,
            "is_uncertain": False,
            "is_persistent": False,
            "action_taken": "EMERGENCY_STOP_EXECUTED",
            "action": "EMERGENCY_STOP_EXECUTED",
            "status": "Alarm Silenced",
            "status_message": "Immediate Emergency Stop executed by farmer. All sound deterrents halted.",
            "deterrent_triggered": False,
            "deterrent_details": None,
            "audio_metrics": {}
        }
        self.history_events.insert(0, event)
        return {"success": True, "message": "All audio deterrents immediately silenced."}



# Global singleton service instance
audio_engine = AudioInferenceEngine()
