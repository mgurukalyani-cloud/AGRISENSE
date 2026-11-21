/**
 * AgriSense Voice Agricultural Advisory Service (TTS Engine)
 * Dual-language Text-to-Speech support: English and Telugu (తెలుగు).
 * Converts complex agronomic calculations, stage progressions, fertilizer bag counts,
 * and CIBRC safety precautions into clear spoken audio for farmers.
 */

class CropVoiceService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.playbackRate = 1.0;
    this.listeners = {
      start: [],
      end: [],
      pause: [],
      resume: [],
      error: [],
      boundary: []
    };
  }

  getAvailableVoices() {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  findBestVoice(lang = 'te') {
    const voices = this.getAvailableVoices();
    if (lang === 'te') {
      // Prioritize Telugu voices (e.g. te-IN, Telugu)
      const teluguVoice = voices.find(
        (v) => v.lang.toLowerCase().includes('te') || v.name.toLowerCase().includes('telugu')
      );
      if (teluguVoice) return teluguVoice;
      // Fallback to Indian English voice for clear local accent
      const indianVoice = voices.find(
        (v) => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india')
      );
      if (indianVoice) return indianVoice;
    }
    // Default English / system voice
    const enVoice = voices.find(
      (v) => v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en-us') || v.lang.toLowerCase().includes('en')
    );
    return enVoice || voices[0] || null;
  }

  /**
   * Generates bilingual script for Crop Lifecycle & Growth Stage
   */
  generateLifecycleScript(cropRecord, lifecycle, lang = 'en') {
    const cropName = cropRecord.cropId === 'paddy' ? 'Paddy' : cropRecord.cropId === 'cotton' ? 'Cotton' : cropRecord.cropId;
    const stage = lifecycle.currentStage;
    const das = lifecycle.daysAfterSowing;
    const daysLeft = lifecycle.daysRemaining;

    if (lang === 'te') {
      const cropTe = cropName === 'Paddy' ? 'వరి' : cropName === 'Cotton' ? 'ప్రత్తి' : 'పంట';
      return `నమస్కారం రైతు సోదరులారా. మీ ${cropTe} పంట ప్రస్తుతం ${stage.teluguName}లో ఉంది. ` +
        `విత్తనం వేసిన తర్వాత ఇది ${das}వ రోజు. ` +
        `కోతకు ఇంకా సుమారు ${daysLeft} రోజుల సమయం ఉంది. ` +
        `ఈ దశలో ప్రధాన పనులు: ${stage.activities[0] || 'పంటను నిరంతరం గమనించండి'}. ` +
        `నీటి యాజమాన్యం: ${stage.irrigationNote || 'నేలలో తగినంత తేమను కాపాడండి'}.`;
    }

    return `Hello Farmer. Your ${cropName} crop is currently in the ${stage.name} stage, at ${das} days after sowing. ` +
      `Estimated maturity is in approximately ${daysLeft} days. ` +
      `Key activity for today: ${stage.activities[0] || 'Monitor crop health regularly'}. ` +
      `Irrigation guidance: ${stage.irrigationNote || 'Maintain optimal field moisture'}.`;
  }

  /**
   * Generates bilingual script for Stage-wise Fertilizer Recommendations
   */
  generateFertilizerScript(cropRecord, fertilizerResult, lang = 'en') {
    const area = cropRecord.areaAcres;
    const prods = fertilizerResult.commercialProducts;
    const activeSplit = fertilizerResult.stageSplits.find((s) => s.isCurrentStage) || fertilizerResult.stageSplits[0];

    if (lang === 'te') {
      return `ఎరువుల సిఫార్సు వివరాలు: మీ ${area} ఎకరాల పొలానికి మొత్తం అవసరమైన ఎరువులు: ` +
        `యూరియా ${prods.urea.totalBags} బస్తాలు, ` +
        `డి.ఎ.పి ${prods.dap.totalBags} బస్తాలు, మరియు ` +
        `పొటాష్ ఎం.ఓ.పి ${prods.mop.totalBags} బస్తాలు. ` +
        `ప్రస్తుత దశ కోసం సిఫార్సు: ${activeSplit.teluguStageName}. ` +
        (activeSplit.ureaBagsFarm > 0 ? `ఈ దశలో ${activeSplit.ureaBagsFarm} బస్తాల యూరియా చల్లాలి. ` : '') +
        (activeSplit.dapBagsFarm > 0 ? `మరియు ${activeSplit.dapBagsFarm} బస్తాల డి.ఎ.పి వేయాలి. ` : '') +
        (activeSplit.mopBagsFarm > 0 ? `మరియు ${activeSplit.mopBagsFarm} బస్తాల పొటాష్ వేయాలి. ` : '') +
        `ముఖ్య సూచన: ${fertilizerResult.teluguPrecautions[0] || 'ఎరువులను తగిన తేమ ఉన్నప్పుడే వేయాలి'}.`;
    }

    return `Fertilizer advisory for your ${area} acre farm: Total seasonal requirement is ` +
      `${prods.urea.totalBags} bags of Urea, ` +
      `${prods.dap.totalBags} bags of DAP, and ` +
      `${prods.mop.totalBags} bags of MOP Potash. ` +
      `For the current stage: ${activeSplit.stageName}. ` +
      (activeSplit.ureaBagsFarm > 0 ? `Apply ${activeSplit.ureaBagsFarm} bags of Urea. ` : '') +
      (activeSplit.dapBagsFarm > 0 ? `Apply ${activeSplit.dapBagsFarm} bags of DAP. ` : '') +
      (activeSplit.mopBagsFarm > 0 ? `Apply ${activeSplit.mopBagsFarm} bags of MOP. ` : '') +
      `Critical safety rule: ${fertilizerResult.generalPrecautions[0] || 'Always apply in moist soil'}.`;
  }

  /**
   * Generates bilingual script for Pest/Disease Diagnosis & Prescription
   */
  generatePestProtectionScript(diagnosis, lang = 'en') {
    if (!diagnosis) return '';

    if (lang === 'te') {
      const chem = diagnosis.chemicalManagement;
      return `రక్షణ మరియు సస్యరక్షణ సూచనలు: గమనించిన సమస్య: ${diagnosis.teluguName}. ` +
        `లక్షణాలు: ${diagnosis.symptoms}. ` +
        `మొదట జీవనియంత్రణ పద్ధతి: ${diagnosis.preventiveAndCultural[0]}. ` +
        (chem ? `సిఫార్సు చేసిన పురుగు మందు: ${chem.commercialBrand} (${chem.activeIngredient}). ` +
          `మోతాదు: ఒక ఎకరానికి ${chem.dosePerAcre}. 200 లీటర్ల నీటిలో కలిపి పిచికారీ చేయండి. ` +
          `సురక్షిత వ్యవధి కోతకు ముందు ${chem.phiDays} రోజులు.` : 'రసాయన మందులు అవసరం లేదు.');
    }

    const chem = diagnosis.chemicalManagement;
    return `Crop protection advisory for: ${diagnosis.name}. ` +
      `Visible symptoms: ${diagnosis.symptoms}. ` +
      `First, practice non-chemical IPM: ${diagnosis.preventiveAndCultural[0]}. ` +
      (chem ? `Recommended chemical treatment: ${chem.commercialBrand} containing ${chem.activeIngredient}. ` +
        `Approved dose: ${chem.dosePerAcre}. Dilute in 200 liters of water per acre. ` +
        `Pre-harvest interval is ${chem.phiDays} days. Always wear protective equipment during spraying.` : 'No chemical spray required.');
  }

  speak({ text, lang = 'en', onStart, onEnd, onError, onBoundary }) {
    if (!this.synth) {
      if (onError) onError(new Error('SpeechSynthesis not supported'));
      return;
    }

    // Cancel any existing utterance
    this.stop();

    if (!text || text.trim() === '') return;

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    const voice = this.findBestVoice(lang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = lang === 'te' ? 'te-IN' : 'en-IN';
    }

    utterance.rate = this.playbackRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      if (onStart) onStart();
      this.emit('start');
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
      this.emit('end');
    };

    utterance.onerror = (e) => {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      if (onError) onError(e);
      this.emit('error', e);
    };

    utterance.onboundary = (e) => {
      if (onBoundary) onBoundary(e);
      this.emit('boundary', e);
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis speak error:', err);
      if (onError) onError(err);
    }
  }

  pause() {
    if (this.synth && this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.emit('pause');
    }
  }

  resume() {
    if (this.synth && this.isPlaying && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.emit('resume');
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.emit('end');
    }
  }

  setRate(rate) {
    this.playbackRate = Math.max(0.7, Math.min(1.5, rate));
  }

  on(event, fn) {
    if (this.listeners[event]) {
      this.listeners[event].push(fn);
    }
  }

  off(event, fn) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== fn);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }
}

export const cropVoiceService = new CropVoiceService();
export default cropVoiceService;
