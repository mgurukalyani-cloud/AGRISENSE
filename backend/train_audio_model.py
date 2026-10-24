"""
Train AgriSense PyTorch Animal Sound Neural Network Classifier
Generates bio-acoustic training & validation distributions, extracts 131 features,
trains PyTorch Deep Neural Network, evaluates precision/recall/F1, and saves model weights.
"""

import os
import sys
import json

# Ensure project root is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import numpy as np
from scipy import signal
import scipy.io.wavfile as wavfile
import torch

import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader

try:
    from backend.audio_features import extract_acoustic_features
except ImportError:
    from audio_features import extract_acoustic_features


CLASSES = [
    "cow",              # 0: Beneficial cattle
    "sparrow",          # 1: Beneficial bird
    "wild_boar",        # 2: Crop damaging pest
    "monkey",           # 3: Crop pest (macaque)
    "crow",             # 4: Scavenger bird
    "deer",             # 5: Crop grazer
    "rodent",           # 6: Field rat/rodent
    "farm_machinery",   # 7: Ambient tractor/diesel
    "wind_rain",        # 8: Ambient weather
    "human_voice"       # 9: Ambient speech
]

CLASS_INFO = {
    "cow": {
        "category": "beneficial",
        "name": "Cow (Bovine Vocalization)",
        "scientific_name": "Bos taurus",
        "description": "Beneficial dairy and draft livestock. Low-frequency harmonic moo.",
        "default_action": "protect",
        "min_freq": 100,
        "max_freq": 450
    },
    "sparrow": {
        "category": "beneficial",
        "name": "Sparrow (House Sparrow Call)",
        "scientific_name": "Passer domesticus",
        "description": "Beneficial insect-eating farmland bird. High-pitch frequency-modulated chirp.",
        "default_action": "protect",
        "min_freq": 2800,
        "max_freq": 6500
    },
    "wild_boar": {
        "category": "harmful",
        "name": "Wild Boar (Grunt & Squeal)",
        "scientific_name": "Sus scrofa",
        "description": "Major crop-damaging pest that roots out tubers, groundnuts, maize and sugarcane.",
        "default_action": "repel",
        "min_freq": 150,
        "max_freq": 1200
    },
    "monkey": {
        "category": "harmful",
        "name": "Rhesus Macaque (Alarm & Chatter)",
        "scientific_name": "Macaca mulatta",
        "description": "Agile troop pest that raids orchards, vegetables, pulses, and maize fields.",
        "default_action": "repel",
        "min_freq": 700,
        "max_freq": 3200
    },
    "crow": {
        "category": "harmful",
        "name": "Crow (Harsh Cawing)",
        "scientific_name": "Corvus splendens",
        "description": "Scavenger bird that consumes sown seeds, ripening grains, and seedlings.",
        "default_action": "repel",
        "min_freq": 900,
        "max_freq": 2600
    },
    "deer": {
        "category": "harmful",
        "name": "Spotted Deer / Nilgai (Snort & Bark)",
        "scientific_name": "Axis axis / Boselaphus tragocamelus",
        "description": "Nocturnal ungulate that grazes young crop leaves, cotton, and pulses.",
        "default_action": "repel",
        "min_freq": 400,
        "max_freq": 1800
    },
    "rodent": {
        "category": "harmful",
        "name": "Field Rat / Rodent (High Squeak)",
        "scientific_name": "Bandicota bengalensis",
        "description": "Gnaws roots, stalks, and stored produce in field burrows.",
        "default_action": "repel",
        "min_freq": 4200,
        "max_freq": 8500
    },
    "farm_machinery": {
        "category": "ambient",
        "name": "Farm Machinery (Tractor / Pump)",
        "scientific_name": "Mechanical",
        "description": "Continuous low-frequency diesel engine and water pump hum.",
        "default_action": "ignore",
        "min_freq": 40,
        "max_freq": 250
    },
    "wind_rain": {
        "category": "ambient",
        "name": "Weather Noise (Wind & Rain)",
        "scientific_name": "Meteorological",
        "description": "Broadband ambient turbulence and precipitation background noise.",
        "default_action": "ignore",
        "min_freq": 20,
        "max_freq": 8000
    },
    "human_voice": {
        "category": "ambient",
        "name": "Human Voice (Farmer Speech)",
        "scientific_name": "Homo sapiens",
        "description": "Farmer speech or bystander calls across the field.",
        "default_action": "ignore",
        "min_freq": 100,
        "max_freq": 3400
    }
}


def synthesize_bioacoustic_sample(class_name: str, sr: int = 16000, duration: float = 2.0) -> np.ndarray:
    """
    Synthesizes authentic bio-acoustic signal waveforms incorporating physical formant filters,
    harmonic series, frequency modulations, temporal envelopes, and farm background noise.
    """
    num_samples = int(sr * duration)
    t = np.linspace(0, duration, num_samples, endpoint=False)
    y = np.zeros(num_samples, dtype=np.float32)

    # Ambient farm background noise in all recordings
    noise = np.random.randn(num_samples) * 0.02
    # Slight low-frequency atmospheric rumble
    noise += 0.015 * np.sin(2 * np.pi * 60 * t + np.random.rand())

    if class_name == "cow":
        # Low frequency bovine moo: fundamental 120-250 Hz with rich integer harmonics
        f0 = np.random.uniform(130, 220)
        # Pitch glide: slight drop towards end of moo
        pitch_contour = f0 * (1.0 - 0.15 * (t / duration) ** 1.5)
        phase = 2 * np.pi * np.cumsum(pitch_contour) / sr
        # Vowel formant resonances: harmonics H1, H2, H3, H4, H5
        harmonics = [1.0, 0.75, 0.55, 0.40, 0.25, 0.15, 0.08]
        for idx, h_amp in enumerate(harmonics, start=1):
            y += h_amp * np.sin(idx * phase + np.random.uniform(0, np.pi))
        # Formant resonance peak around 500 Hz and 1300 Hz
        y += 0.4 * np.sin(phase * (500.0 / f0))
        # Natural envelope: slow attack (0.3s), long sustain, smooth decay (0.4s)
        envelope = np.ones_like(t)
        attack_idx = int(0.25 * sr)
        decay_idx = int(0.35 * sr)
        envelope[:attack_idx] = np.sin(np.linspace(0, np.pi / 2, attack_idx))
        envelope[-decay_idx:] = np.cos(np.linspace(0, np.pi / 2, decay_idx))
        y = y * envelope

    elif class_name == "sparrow":
        # House sparrow chirp: high frequency chirp pulse 3200-5800 Hz
        # Series of short chirp syllables
        num_chirps = np.random.randint(3, 6)
        y_chirps = np.zeros(num_samples, dtype=np.float32)
        chirp_dur = np.random.uniform(0.12, 0.22)
        chirp_len = int(chirp_dur * sr)
        gap_len = int((duration - num_chirps * chirp_dur) / (num_chirps + 1) * sr)

        cur_idx = gap_len
        for _ in range(num_chirps):
            if cur_idx + chirp_len >= num_samples:
                break
            t_chirp = np.linspace(0, chirp_dur, chirp_len, endpoint=False)
            f_start = np.random.uniform(3200, 4200)
            f_end = np.random.uniform(4800, 6200)
            # Upward or downward trill sweep with micro-vibrato
            freq_sweep = np.linspace(f_start, f_end, chirp_len) + 250 * np.sin(2 * np.pi * 30 * t_chirp)
            phase = 2 * np.pi * np.cumsum(freq_sweep) / sr
            chirp_wave = np.sin(phase) + 0.3 * np.sin(2 * phase)
            # Hanning window envelope for syllable
            chirp_wave = chirp_wave * np.hanning(chirp_len)
            y_chirps[cur_idx:cur_idx + chirp_len] += chirp_wave
            cur_idx += chirp_len + np.random.randint(int(0.08 * sr), int(0.25 * sr))
        y = y_chirps

    elif class_name == "wild_boar":
        # Low guttural rhythmic grunt / harsh pig squeal
        # Formants at 200-600 Hz with high roughness and vocal fry
        num_grunts = np.random.randint(2, 5)
        grunt_dur = np.random.uniform(0.25, 0.45)
        grunt_len = int(grunt_dur * sr)
        y_grunts = np.zeros(num_samples, dtype=np.float32)
        cur_idx = int(0.1 * sr)

        for _ in range(num_grunts):
            if cur_idx + grunt_len >= num_samples:
                break
            t_g = np.linspace(0, grunt_dur, grunt_len, endpoint=False)
            f0 = np.random.uniform(180, 360)
            # Grunt vocal fry + raspiness (amplitude modulation + noise bursts)
            fry = np.sin(2 * np.pi * 25 * t_g)
            phase = 2 * np.pi * f0 * t_g
            grunt_wave = (
                np.sin(phase) +
                0.7 * np.sin(2 * phase) +
                0.5 * np.sin(3 * phase) +
                0.3 * np.sin(4 * phase) +
                0.4 * np.random.randn(grunt_len) * (0.5 + 0.5 * np.sin(phase))
            )
            # Attack and decay
            env = signal.windows.tukey(grunt_len, alpha=0.3)
            y_grunts[cur_idx:cur_idx + grunt_len] += grunt_wave * env * (1.0 + 0.3 * fry)
            cur_idx += grunt_len + int(np.random.uniform(0.15, 0.35) * sr)
        y = y_grunts

    elif class_name == "monkey":
        # Rhesus macaque shrill shrieks and pant-threats (800 - 3200 Hz)
        # Fast repeated staccato cries
        num_screams = np.random.randint(3, 7)
        scream_dur = np.random.uniform(0.15, 0.28)
        scream_len = int(scream_dur * sr)
        y_screams = np.zeros(num_samples, dtype=np.float32)
        cur_idx = int(0.05 * sr)

        for _ in range(num_screams):
            if cur_idx + scream_len >= num_samples:
                break
            t_s = np.linspace(0, scream_dur, scream_len, endpoint=False)
            f_base = np.random.uniform(900, 2200)
            # High flutter / frequency modulation
            f_mod = f_base + 400 * np.sin(2 * np.pi * 45 * t_s)
            phase = 2 * np.pi * np.cumsum(f_mod) / sr
            scream_wave = (
                np.sin(phase) +
                0.6 * np.sin(2 * phase) +
                0.4 * np.sin(3 * phase) +
                0.3 * np.random.randn(scream_len)
            )
            env = np.hanning(scream_len) ** 0.8
            y_screams[cur_idx:cur_idx + scream_len] += scream_wave * env
            cur_idx += scream_len + int(np.random.uniform(0.05, 0.18) * sr)
        y = y_screams

    elif class_name == "crow":
        # Harsh pulsed cawing: 1100 - 2400 Hz formant bands
        num_caws = np.random.randint(2, 4)
        caw_dur = np.random.uniform(0.35, 0.55)
        caw_len = int(caw_dur * sr)
        y_caws = np.zeros(num_samples, dtype=np.float32)
        cur_idx = int(0.15 * sr)

        for _ in range(num_caws):
            if cur_idx + caw_len >= num_samples:
                break
            t_c = np.linspace(0, caw_dur, caw_len, endpoint=False)
            f0 = np.random.uniform(1150, 1550)
            # Wideband raspiness
            phase = 2 * np.pi * f0 * t_c
            caw_wave = (
                np.sin(phase) +
                0.8 * np.sin(1.6 * phase) +
                0.6 * np.sin(2.3 * phase) +
                0.4 * np.sin(3.1 * phase) +
                0.35 * np.random.randn(caw_len)
            )
            # Slight pitch slide down
            caw_wave *= np.linspace(1.1, 0.9, caw_len)
            env = signal.windows.tukey(caw_len, alpha=0.4)
            y_caws[cur_idx:cur_idx + caw_len] += caw_wave * env
            cur_idx += caw_len + int(np.random.uniform(0.2, 0.4) * sr)
        y = y_caws

    elif class_name == "deer":
        # Ungulate explosive alarm snort/bark: 450 - 1600 Hz
        # Very sharp explosive onset (<25ms) followed by turbulent air expiration
        bark_dur = np.random.uniform(0.25, 0.40)
        bark_len = int(bark_dur * sr)
        t_b = np.linspace(0, bark_dur, bark_len, endpoint=False)
        f_tonal = np.random.uniform(500, 950)
        tonal = np.sin(2 * np.pi * f_tonal * t_b) + 0.5 * np.sin(2 * np.pi * 2 * f_tonal * t_b)
        air_blast = np.random.randn(bark_len) * 0.8
        bark_wave = tonal * 0.6 + air_blast * 0.4
        # Exponential fast decay
        env = np.exp(-t_b * 7.0)
        y_bark = np.zeros(num_samples, dtype=np.float32)
        st = int(0.2 * sr)
        if st + bark_len < num_samples:
            y_bark[st:st + bark_len] = bark_wave * env
        y = y_bark

    elif class_name == "rodent":
        # Rodent high-frequency squeaks: 4500 - 8200 Hz
        num_squeaks = np.random.randint(4, 9)
        squeak_dur = np.random.uniform(0.06, 0.12)
        squeak_len = int(squeak_dur * sr)
        y_rodent = np.zeros(num_samples, dtype=np.float32)
        cur_idx = int(0.1 * sr)

        for _ in range(num_squeaks):
            if cur_idx + squeak_len >= num_samples:
                break
            t_r = np.linspace(0, squeak_dur, squeak_len, endpoint=False)
            f_sq = np.random.uniform(4800, 7500)
            phase = 2 * np.pi * f_sq * t_r
            sq_wave = np.sin(phase) + 0.3 * np.sin(2 * phase)
            env = np.hanning(squeak_len)
            y_rodent[cur_idx:cur_idx + squeak_len] += sq_wave * env
            cur_idx += squeak_len + int(np.random.uniform(0.05, 0.15) * sr)
        y = y_rodent

    elif class_name == "farm_machinery":
        # Continuous diesel engine tractor hum / pump
        # Strong low frequencies 45-180 Hz with rhythmic stroke pulsations (cylinder firing ~12 Hz)
        f_engine = np.random.uniform(55, 120)
        strokes = np.sin(2 * np.pi * 14 * t)
        y = (
            np.sin(2 * np.pi * f_engine * t) +
            0.6 * np.sin(2 * np.pi * 2 * f_engine * t) +
            0.4 * np.sin(2 * np.pi * 3 * f_engine * t) +
            0.3 * np.sin(2 * np.pi * 4 * f_engine * t)
        ) * (1.0 + 0.3 * strokes) + 0.15 * np.random.randn(num_samples)

    elif class_name == "wind_rain":
        # Pink/brownian turbulence noise + rain droplets
        # Brownian noise: cumulative sum of white noise with leakage
        white = np.random.randn(num_samples)
        b, a = signal.butter(2, 0.15, 'low')
        wind = signal.lfilter(b, a, white) * 1.5
        # Intermittent rain splatters
        splatters = (np.random.rand(num_samples) > 0.98).astype(np.float32) * np.random.randn(num_samples)
        y = wind + splatters * 0.4

    elif class_name == "human_voice":
        # Human speech: formants at 500 Hz, 1500 Hz, 2500 Hz with f0 ~120-220 Hz
        f0 = np.random.uniform(120, 240)
        phase = 2 * np.pi * f0 * t
        glottal = signal.sawtooth(phase)
        # Formants
        y = (
            np.sin(2 * np.pi * 500 * t) * 0.5 +
            np.sin(2 * np.pi * 1500 * t) * 0.3 +
            np.sin(2 * np.pi * 2500 * t) * 0.15 +
            0.2 * glottal
        )
        # Speech cadence envelope (words and pauses)
        cadence = np.sin(2 * np.pi * 2.5 * t) ** 2
        y = y * cadence

    # Add background noise to the synthesized signal
    y = y + noise

    # Normalize to [-1.0, 1.0]
    peak = np.max(np.abs(y))
    if peak > 0:
        y = y / peak * 0.95

    return y.astype(np.float32)


class AnimalAudioClassifierNet(nn.Module):
    """
    Deep PyTorch Neural Network for Bio-Acoustic Signal Classification.
    Accepts 131 acoustic features (MFCCs, Mel-banks, Spectral Centroid, Rolloff, ZCR, RMS)
    and predicts probabilities across 10 animal/sound classes.
    """
    def __init__(self, input_dim: int = 131, num_classes: int = 10):
        super(AnimalAudioClassifierNet, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.BatchNorm1d(256),
            nn.LeakyReLU(0.1),
            nn.Dropout(0.25),

            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.LeakyReLU(0.1),
            nn.Dropout(0.20),

            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.LeakyReLU(0.1),
            nn.Dropout(0.10),

            nn.Linear(64, num_classes)
        )

    def forward(self, x):
        return self.network(x)


def build_and_train_model():
    print("================================================================")
    print("AgriSense AI Animal Sound Recognition Model Training")
    print("================================================================")

    # Output directory
    model_dir = "backend/models"
    os.makedirs(model_dir, exist_ok=True)
    sample_dir = "public/audio/samples"
    deterrent_dir = "public/audio/deterrents"
    os.makedirs(sample_dir, exist_ok=True)
    os.makedirs(deterrent_dir, exist_ok=True)

    sr = 16000
    samples_per_class = 120  # 1200 total samples
    print(f"Generating {samples_per_class} acoustic samples per class across {len(CLASSES)} classes...")

    features_list = []
    labels_list = []

    # Also save one representative reference WAV file for each class for user/reviewer testing
    for c_idx, c_name in enumerate(CLASSES):
        print(f"  Generating and extracting features for class [{c_idx}]: {c_name}...")
        for i in range(samples_per_class):
            dur = np.random.uniform(1.8, 2.5)
            audio = synthesize_bioacoustic_sample(c_name, sr=sr, duration=dur)

            # If first sample, write reference audio file for demo/UI
            if i == 0:
                wav_path = os.path.join(sample_dir, f"{c_name}_sample.wav")
                # Scale to 16-bit integer for standard WAV compatibility
                scaled_wav = (audio * 32767).astype(np.int16)
                wavfile.write(wav_path, sr, scaled_wav)

            # Extract 131 features
            feat = extract_acoustic_features(audio, sample_rate=sr)
            features_list.append(feat["feature_vector"])
            labels_list.append(c_idx)

    # Generate safe non-injurious bio-acoustic deterrent files
    print("\nGenerating Safe Species-Specific Bio-Acoustic Deterrent Soundwaves...")
    t_det = np.linspace(0, 3.0, int(sr * 3.0), endpoint=False)

    # 1. Wild Boar Deterrent: Natural apex predator warning rumble + low startle percussion (~85-180 Hz)
    predator_rumble = np.sin(2 * np.pi * 95 * t_det) * (1.0 + 0.4 * np.sin(2 * np.pi * 4 * t_det))
    percussion = np.sin(2 * np.pi * 65 * t_det) * np.exp(-((t_det % 0.8) * 8.0))
    boar_det = (predator_rumble * 0.6 + percussion * 0.4) * 0.7  # Clamped to safe volume
    wavfile.write(os.path.join(deterrent_dir, "boar_apex_deterrent.wav"), sr, (boar_det * 32767).astype(np.int16))

    # 2. Monkey Deterrent: Natural black eagle / crested hawk bio-acoustic raptor cry (~1800-2800 Hz)
    raptor_f = 2400 + 600 * np.sin(2 * np.pi * 3 * t_det)
    raptor_cry = np.sin(2 * np.pi * np.cumsum(raptor_f) / sr) * np.hanning(len(t_det)) * 0.65
    wavfile.write(os.path.join(deterrent_dir, "monkey_raptor_deterrent.wav"), sr, (raptor_cry * 32767).astype(np.int16))

    # 3. Crow Deterrent: Natural corvid dispersal distress acoustics (~1200-1800 Hz pulses)
    crow_f = 1450 + 200 * np.sin(2 * np.pi * 6 * t_det)
    crow_pulse = np.sin(2 * np.pi * np.cumsum(crow_f) / sr) * (np.sin(2 * np.pi * 3.5 * t_det) ** 4) * 0.65
    wavfile.write(os.path.join(deterrent_dir, "crow_dispersal_deterrent.wav"), sr, (crow_pulse * 32767).astype(np.int16))

    # 4. Gentle Farmer Buzzer / Chime for Alert Mode (440Hz / 880Hz pleasant bell)
    chime = (np.sin(2 * np.pi * 587.33 * t_det) * 0.6 + np.sin(2 * np.pi * 880.0 * t_det) * 0.4) * np.exp(-t_det * 2.0) * 0.6
    wavfile.write(os.path.join(deterrent_dir, "farmer_alert_chime.wav"), sr, (chime * 32767).astype(np.int16))

    X = np.array(features_list, dtype=np.float32)
    y = np.array(labels_list, dtype=np.int64)

    # Standardize features using feature-wise mean and std
    feat_mean = np.mean(X, axis=0)
    feat_std = np.std(X, axis=0) + 1e-7
    X_norm = (X - feat_mean) / feat_std

    # Split: 80% train, 20% test
    indices = np.random.permutation(len(X))
    split_idx = int(0.8 * len(X))
    train_idx, test_idx = indices[:split_idx], indices[split_idx:]

    X_train, y_train = torch.tensor(X_norm[train_idx]), torch.tensor(y[train_idx])
    X_test, y_test = torch.tensor(X_norm[test_idx]), torch.tensor(y[test_idx])

    train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=32, shuffle=True)

    # Initialize model
    model = AnimalAudioClassifierNet(input_dim=X.shape[1], num_classes=len(CLASSES))
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.002, weight_decay=1e-4)

    print(f"\nTraining PyTorch Neural Network for 30 epochs on {len(X_train)} training instances...")
    model.train()
    for epoch in range(1, 31):
        total_loss = 0.0
        correct = 0
        total = 0
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * batch_x.size(0)
            _, predicted = torch.max(outputs.data, 1)
            total += batch_y.size(0)
            correct += (predicted == batch_y).sum().item()

        if epoch % 5 == 0 or epoch == 1:
            train_acc = correct / total * 100
            print(f"  Epoch {epoch:2d}/30 | Loss: {total_loss / total:.4f} | Train Acc: {train_acc:.2f}%")

    # Evaluation on holdout test set
    model.eval()
    with torch.no_grad():
        test_outputs = model(X_test)
        test_probs = torch.softmax(test_outputs, dim=1)
        _, test_preds = torch.max(test_outputs, 1)

        test_correct = (test_preds == y_test).sum().item()
        test_acc = test_correct / len(y_test) * 100.0

        print("\n================================================================")
        print(f"Evaluation on Holdout Test Set ({len(y_test)} samples):")
        print(f"Overall Accuracy: {test_acc:.2f}%")
        print("================================================================")

        # Per-class precision, recall, and false positive analysis
        for c_idx, c_name in enumerate(CLASSES):
            true_mask = (y_test == c_idx)
            pred_mask = (test_preds == c_idx)

            tp = (true_mask & pred_mask).sum().item()
            fp = ((~true_mask) & pred_mask).sum().item()
            fn = (true_mask & (~pred_mask)).sum().item()

            precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

            tag = "[PROTECTED]" if CLASS_INFO[c_name]["category"] == "beneficial" else "[TARGET PEST]" if CLASS_INFO[c_name]["category"] == "harmful" else "[AMBIENT]"
            print(f"  Class {c_idx:2d} ({c_name:14s}) {tag:14s}: Precision={precision * 100:5.1f}%, Recall={recall * 100:5.1f}%, F1={f1 * 100:5.1f}%")

    # Save model weights and normalizer
    model_save_path = os.path.join(model_dir, "animal_sound_classifier.pt")
    torch.save({
        "model_state_dict": model.state_dict(),
        "input_dim": X.shape[1],
        "num_classes": len(CLASSES),
        "classes": CLASSES,
        "feat_mean": feat_mean.tolist(),
        "feat_std": feat_std.tolist()
    }, model_save_path)
    print(f"\nModel weights & feature normalizers saved to: {model_save_path}")

    # Save class metadata JSON for frontend & backend
    meta_path = os.path.join(model_dir, "animal_classes.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({
            "classes": CLASSES,
            "class_info": CLASS_INFO,
            "feature_dim": X.shape[1],
            "sample_rate": sr,
            "test_accuracy": round(test_acc, 2)
        }, f, indent=2)
    print(f"Class metadata saved to: {meta_path}")
    print("AI Animal Sound Classifier successfully built and verified!")


if __name__ == "__main__":
    build_and_train_model()
