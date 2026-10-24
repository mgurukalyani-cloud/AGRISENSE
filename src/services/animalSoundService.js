/**
 * AgriSense AI Animal Sound Recognition & Intelligent Farm Repellent Service
 * Interfaces with backend PyTorch Bio-Acoustic Inference Engine and manages
 * live microphone acquisition, persistence filtering, and safe deterrent coordination.
 */

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Fetch current status of the audio recognition system
 */
export async function getAudioSystemStatus() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/audio/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] Could not reach backend status:', err);
    return {
      success: false,
      is_model_ready: false,
      system_enabled: true,
      response_mode: 'audio_deterrent',
      confidence_threshold: 70,
      persistence_required_samples: 2,
      cooldown_period_sec: 60,
      cooldown_remaining_sec: 0,
      in_cooldown: false,
      offline_fallback: true
    };
  }
}

/**
 * Fetch supported species profiles, bio-acoustic ranges, and farmer category rules
 */
export async function getSpeciesProfiles() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/audio/species`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] Backend species fetch failed, using local registry:', err);
    return {
      success: true,
      species: [
        {
          key: 'cow',
          name: 'Cow (Bovine Vocalization)',
          scientific_name: 'Bos taurus',
          description: 'Beneficial dairy & draft livestock. Low-frequency harmonic moo (100-450 Hz).',
          min_freq: 100,
          max_freq: 450,
          default_category: 'beneficial',
          farmer_category: 'beneficial',
          is_protected: true
        },
        {
          key: 'sparrow',
          name: 'Sparrow (House Sparrow Chirp)',
          scientific_name: 'Passer domesticus',
          description: 'Beneficial insectivore farmland bird. High-pitch modulated chirp (2800-6500 Hz).',
          min_freq: 2800,
          max_freq: 6500,
          default_category: 'beneficial',
          farmer_category: 'beneficial',
          is_protected: true
        },
        {
          key: 'wild_boar',
          name: 'Wild Boar (Grunt & Squeal)',
          scientific_name: 'Sus scrofa',
          description: 'Major crop-damaging pest that roots up tubers, groundnuts, maize and sugarcane.',
          min_freq: 150,
          max_freq: 1200,
          default_category: 'harmful',
          farmer_category: 'harmful',
          is_protected: false
        },
        {
          key: 'monkey',
          name: 'Rhesus Macaque (Alarm & Chatter)',
          scientific_name: 'Macaca mulatta',
          description: 'Agile troop pest that raids orchards, vegetables, pulses, and maize fields.',
          min_freq: 700,
          max_freq: 3200,
          default_category: 'harmful',
          farmer_category: 'harmful',
          is_protected: false
        },
        {
          key: 'crow',
          name: 'Crow (Harsh Cawing)',
          scientific_name: 'Corvus splendens',
          description: 'Scavenger bird that consumes sown seeds, ripening grains, and tender seedlings.',
          min_freq: 900,
          max_freq: 2600,
          default_category: 'harmful',
          farmer_category: 'harmful',
          is_protected: false
        },
        {
          key: 'deer',
          name: 'Spotted Deer / Nilgai (Snort & Bark)',
          scientific_name: 'Axis axis / Boselaphus tragocamelus',
          description: 'Nocturnal ungulate that grazes young crop leaves, cotton, and pulses.',
          min_freq: 400,
          max_freq: 1800,
          default_category: 'harmful',
          farmer_category: 'harmful',
          is_protected: false
        },
        {
          key: 'rodent',
          name: 'Field Rat / Rodent (High Squeak)',
          scientific_name: 'Bandicota bengalensis',
          description: 'Gnaws root systems, stalks, and stored produce in field burrows.',
          min_freq: 4200,
          max_freq: 8500,
          default_category: 'harmful',
          farmer_category: 'harmful',
          is_protected: false
        },
        {
          key: 'farm_machinery',
          name: 'Farm Machinery (Tractor / Pump)',
          scientific_name: 'Mechanical',
          description: 'Continuous low-frequency diesel engine and water pump hum.',
          min_freq: 40,
          max_freq: 250,
          default_category: 'ignore',
          farmer_category: 'ignore',
          is_protected: false
        },
        {
          key: 'wind_rain',
          name: 'Weather Noise (Wind & Rain)',
          scientific_name: 'Meteorological',
          description: 'Broadband ambient turbulence and precipitation background noise.',
          min_freq: 20,
          max_freq: 8000,
          default_category: 'ignore',
          farmer_category: 'ignore',
          is_protected: false
        },
        {
          key: 'human_voice',
          name: 'Human Voice (Farmer Speech)',
          scientific_name: 'Homo sapiens',
          description: 'Farmer speech or bystander calls across the field.',
          min_freq: 100,
          max_freq: 3400,
          default_category: 'ignore',
          farmer_category: 'ignore',
          is_protected: false
        }
      ]
    };
  }
}

/**
 * Configure farmer category for an animal species (beneficial, harmful, or ignore)
 */
export async function updateSpeciesCategory(speciesKey, newCategory) {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/audio/species/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ species: speciesKey, category: newCategory })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] Failed to update category on backend:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update repellent guard parameters (mode, sensitivity, cooldown, enabled)
 */
export async function updateRepellentConfig(settings) {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/repellent/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] Failed to update repellent config on backend:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Classify an audio Blob or ArrayBuffer via PyTorch bio-acoustic backend
 */
export async function classifyAudioData(audioBlob, sampleRate = 16000, sourceLabel = 'Live Farm Microphone') {
  try {
    // Convert blob to base64
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
    });
    reader.readAsDataURL(audioBlob);
    const base64Audio = await base64Promise;

    const res = await fetch(`${BACKEND_BASE_URL}/api/audio/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_base64: base64Audio,
        sample_rate: sampleRate,
        source_label: sourceLabel
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Inference Error (${res.status}): ${errText}`);
    }

    return await res.json();
  } catch (err) {
    console.error('[AnimalSoundService] Classification request failed:', err);
    throw err;
  }
}

/**
 * Classify a sample WAV file path (e.g. from /audio/samples/)
 */
export async function classifySampleAudioFile(sampleUrl, sampleName) {
  try {
    const base = import.meta.env.BASE_URL || '/';
    const cleanUrl = sampleUrl.startsWith('/') ? sampleUrl.slice(1) : sampleUrl;
    const resolvedUrl = base + cleanUrl;
    const audioRes = await fetch(resolvedUrl);
    if (!audioRes.ok) throw new Error(`Could not load audio sample from ${resolvedUrl}`);
    const blob = await audioRes.blob();
    return await classifyAudioData(blob, 16000, `Audio Sample (${sampleName})`);
  } catch (err) {
    console.error('[AnimalSoundService] Sample file classification failed:', err);
    throw err;
  }
}


/**
 * Manually trigger safe deterrent
 */
export async function triggerManualRepellent(speciesKey = 'wild_boar') {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/repellent/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ species: speciesKey })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] Manual trigger failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Emergency Killswitch: stops all active audio deterrents immediately
 */
export async function emergencyStopRepellents() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/repellent/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] Emergency stop failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch detection event history log
 */
export async function getDetectionHistory(filters = {}) {
  try {
    const query = new URLSearchParams();
    if (filters.species) query.append('species', filters.species);
    if (filters.category) query.append('category', filters.category);
    if (filters.action) query.append('action', filters.action);
    query.append('limit', filters.limit || 50);

    const res = await fetch(`${BACKEND_BASE_URL}/api/audio/history?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] History fetch failed:', err);
    return { success: false, events: [], total_available: 0 };
  }
}

/**
 * Clear history log
 */
export async function clearDetectionHistory() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/audio/history`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] Clear history failed:', err);
    return { success: false };
  }
}

/**
 * Fetch ESP32 hardware specification and wiring schematics
 */
export async function getHardwareSpecification() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/audio/hardware-spec`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] Hardware spec fetch failed:', err);
    return { success: false };
  }
}

/**
 * Encodes Float32Array PCM samples into a standard 16-bit Mono RIFF WAV Blob
 */
export function encodeWavBlob(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF identifier
  writeString(0, 'RIFF');
  // file length
  view.setUint32(4, 36 + samples.length * 2, true);
  // RIFF type
  writeString(8, 'WAVE');
  // format chunk identifier
  writeString(12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * 2 * 1)
  view.setUint32(28, sampleRate * 2, true);
  // block align (2 bytes)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(36, 'data');
  // data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit PCM samples with clipping protection
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Persists an event record to the backend audit log
 */
export async function postDetectionEvent(eventRecord) {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/audio/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventRecord)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] Could not persist event to backend:', err);
    return { success: false, offline: true, event: eventRecord };
  }
}

/**
 * Generates verified, standardized test events matching exact simulation criteria
 */
export function createSimulatedEvent(scenarioType, confirmationStep = 1, requiredConfirmations = 2) {
  const now = Date.now();
  const timestamp = new Date(now).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const eventId = `evt-sim-${now}-${Math.floor(Math.random() * 10000)}`;

  switch (scenarioType) {
    case 'cow':
      return {
        eventId,
        id: eventId,
        timestamp,
        timestamp_epoch: now / 1000,
        species: 'cow',
        predicted_class: 'cow',
        species_name: 'Cow (Bovine Vocalization)',
        scientific_name: 'Bos taurus',
        category: 'beneficial',
        confidence: null, // Confidence omitted for simulation
        source: 'Simulation',
        action: 'BENEFICIAL_PROTECTED',
        action_taken: 'BENEFICIAL_PROTECTED',
        status: 'Protected Exemption',
        status_message: 'Cow detected [SIMULATED] — protected species; repellent not activated',
        is_simulated: true,
        is_uncertain: false,
        is_persistent: true,
        deterrent_triggered: false,
        deterrent_details: null,
        audio_metrics: { dominant_frequency_hz: 180, rms_energy: 0.12 }
      };

    case 'sparrow':
      return {
        eventId,
        id: eventId,
        timestamp,
        timestamp_epoch: now / 1000,
        species: 'sparrow',
        predicted_class: 'sparrow',
        species_name: 'House Sparrow (Farmland Bird)',
        scientific_name: 'Passer domesticus',
        category: 'beneficial',
        confidence: null,
        source: 'Simulation',
        action: 'BENEFICIAL_PROTECTED',
        action_taken: 'BENEFICIAL_PROTECTED',
        status: 'Protected Exemption',
        status_message: 'Sparrow detected [SIMULATED] — protected species; repellent not activated',
        is_simulated: true,
        is_uncertain: false,
        is_persistent: true,
        deterrent_triggered: false,
        deterrent_details: null,
        audio_metrics: { dominant_frequency_hz: 4200, rms_energy: 0.08 }
      };

    case 'harmful': {
      const isConfirmed = confirmationStep >= requiredConfirmations;
      if (!isConfirmed) {
        return {
          eventId,
          id: eventId,
          timestamp,
          timestamp_epoch: now / 1000,
          species: 'wild_boar',
          predicted_class: 'wild_boar',
          species_name: 'Wild Boar (Target Pest)',
          scientific_name: 'Sus scrofa',
          category: 'harmful',
          confidence: null,
          source: 'Simulation',
          action: 'PERSISTENCE_PENDING',
          action_taken: 'PERSISTENCE_PENDING',
          status: 'Pending Confirmation',
          status_message: `Harmful target [SIMULATED] — confirmation ${confirmationStep} of ${requiredConfirmations}`,
          is_simulated: true,
          is_uncertain: false,
          is_persistent: false,
          deterrent_triggered: false,
          deterrent_details: null,
          audio_metrics: { dominant_frequency_hz: 320, rms_energy: 0.22 }
        };
      } else {
        const deterrentDetails = {
          sound_file: '/audio/deterrents/boar_apex_deterrent.wav',
          description: 'Safe apex predator territorial acoustic pattern (~95 Hz) + startle percussion',
          safe_decibel_limit: 75,
          duration_sec: 3.0
        };
        return {
          eventId,
          id: eventId,
          timestamp,
          timestamp_epoch: now / 1000,
          species: 'wild_boar',
          predicted_class: 'wild_boar',
          species_name: 'Wild Boar (Target Pest)',
          scientific_name: 'Sus scrofa',
          category: 'harmful',
          confidence: null,
          source: 'Simulation',
          action: 'DETERRENT_ACTIVATED',
          action_taken: 'DETERRENT_ACTIVATED',
          status: 'Active Alert',
          status_message: 'Target confirmed [SIMULATED] — alert activated',
          is_simulated: true,
          is_uncertain: false,
          is_persistent: true,
          deterrent_triggered: true,
          deterrent_details: deterrentDetails,
          audio_metrics: { dominant_frequency_hz: 320, rms_energy: 0.35 }
        };
      }
    }

    case 'unknown':
      return {
        eventId,
        id: eventId,
        timestamp,
        timestamp_epoch: now / 1000,
        species: 'unknown',
        predicted_class: 'unknown',
        species_name: 'Unknown Acoustic Signal',
        scientific_name: 'Unclassified',
        category: 'unknown',
        confidence: null,
        source: 'Simulation',
        action: 'LOG_ONLY',
        action_taken: 'LOG_ONLY',
        status: 'Uncertain Event',
        status_message: 'Unknown sound [SIMULATED] — logged; no deterrent',
        is_simulated: true,
        is_uncertain: true,
        is_persistent: false,
        deterrent_triggered: false,
        deterrent_details: null,
        audio_metrics: { dominant_frequency_hz: 1100, rms_energy: 0.05 }
      };

    case 'low_confidence':
      return {
        eventId,
        id: eventId,
        timestamp,
        timestamp_epoch: now / 1000,
        species: 'wild_boar',
        predicted_class: 'wild_boar',
        species_name: 'Low-Confidence Acoustic Signal',
        scientific_name: 'Unconfirmed',
        category: 'unknown',
        confidence: 38.5,
        source: 'Simulation',
        action: 'UNCERTAIN_LOGGED',
        action_taken: 'UNCERTAIN_LOGGED',
        status: 'Uncertain Event',
        status_message: 'Low-confidence prediction (38.5% < 70%) [SIMULATED] — uncertain result; deterrent not activated',
        is_simulated: true,
        is_uncertain: true,
        is_persistent: false,
        deterrent_triggered: false,
        deterrent_details: null,
        audio_metrics: { dominant_frequency_hz: 280, rms_energy: 0.09 }
      };

    case 'error':
      return {
        eventId,
        id: eventId,
        timestamp,
        timestamp_epoch: now / 1000,
        species: null,
        predicted_class: null,
        species_name: 'Classification Model Unavailable',
        scientific_name: 'Offline Diagnostic',
        category: 'error',
        confidence: null,
        source: 'Simulation',
        action: 'MODEL_ERROR',
        action_taken: 'MODEL_ERROR',
        status: 'Classification Model Unavailable',
        status_message: 'Classification model unavailable — audio input is working, but species identification is not available',
        is_simulated: true,
        is_uncertain: true,
        is_persistent: false,
        deterrent_triggered: false,
        deterrent_details: null,
        audio_metrics: {}
      };

    default:
      return null;
  }
}

/**
 * Fetch INMP441 I2S Hardware Microphone telemetry & status from FastAPI backend
 */
export async function getMicHardwareStatus() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/hardware/audio/mic-status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] Could not fetch INMP441 mic hardware status:', err);
    return {
      status: 'disconnected',
      hardware: {
        type: 'INMP441 Omnidirectional MEMS',
        interface: 'I2S Digital (Inter-IC Sound)',
        pin_sck_bclk: 14,
        pin_ws_lrcl: 15,
        pin_sd_din: 32,
        channel: 'Left Channel (L/R grounded)',
        sample_rate_hz: 16000
      },
      is_streaming: false,
      features: {
        rms_dbfs: -65.0,
        estimated_spl_db: 38.0,
        vad_active: false
      }
    };
  }
}

/**
 * Fetch overall hardware status (Soil, Buzzer, Mic, MQTT)
 */
export async function getHardwareStatus() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/hardware/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] Could not fetch hardware status:', err);
    return null;
  }
}

/**
 * Toggle backend hardware mode between 'live' and 'simulated'
 */
export async function setHardwareMode(mode) {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/hardware/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[AnimalSoundService] Could not update hardware mode:', err);
    return null;
  }
}

