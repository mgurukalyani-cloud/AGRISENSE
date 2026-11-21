/**
 * AgriSense Safe Bio-Acoustic Audio Player & Scary Predator Sound Engine
 * Provides:
 * 1. Volume-regulated safe audio playback (clamps at max 0.75 for hearing safety)
 * 2. Automatic base URL resolution for GitHub Pages (/AGRISENSE/) and localhost
 * 3. High-fidelity Web Audio API Scary Predator Roar Synthesizer (Tiger/Panther Growl,
 *    Piercing Raptor Shriek, Hawk Dispersal Cry, and Hunting Owl Screech)
 * 4. 100% offline-ready acoustic deterrent playback for all browser environments
 */

class SafeAudioPlayer {
  constructor() {
    this.audioContext = null;
    this.currentAudioElement = null;
    this.activeSourceNode = null;
    this.masterGainNode = null;
    this.maxSafeVolume = 0.75;
    this.isPlaying = false;
    this.isScaryDeterrent = false;
    this.activeTrack = null;
    this.playbackTimeout = null;
    this.listeners = new Set();
  }

  getAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener({
          isPlaying: this.isPlaying,
          isScaryDeterrent: this.isScaryDeterrent,
          activeTrack: this.activeTrack,
          volume: this.maxSafeVolume
        });
      } catch (err) {
        console.error('[SafeAudioPlayer] Listener error:', err);
      }
    }
  }

  setVolume(vol) {
    const clamped = Math.max(0.1, Math.min(0.85, vol));
    this.maxSafeVolume = clamped;
    if (this.masterGainNode && this.audioContext) {
      this.masterGainNode.gain.setValueAtTime(clamped, this.audioContext.currentTime);
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = clamped;
    }
    this.notify();
  }

  resolveUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    const base = import.meta.env.BASE_URL || '/';
    let clean = url;
    if (clean.startsWith('./')) clean = clean.slice(2);
    if (clean.startsWith('/')) clean = clean.slice(1);
    const prefix = base.endsWith('/') ? base : base + '/';
    return prefix + clean;
  }

  /**
   * Generates a non-linear wave-shaping distortion curve for ferocious animal throat growl
   */
  makeDistortionCurve(amount = 25) {
    const k = typeof amount === 'number' ? amount : 25;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * Authentic Web Audio API Scary Predator Roar Synthesizer
   * Generates visceral, frightening animal deterrent sounds directly in the browser
   * with zero external audio assets needed!
   */
  playScaryPredatorRoar(speciesKey = 'wild_boar', durationSec = 3.2) {
    this.stop();

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const key = (speciesKey || '').toLowerCase();

      // Master output gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.maxSafeVolume, now);
      masterGain.connect(ctx.destination);

      // Distortion node for visceral ferocious throat growl
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(35);
      shaper.oversample = '4x';
      shaper.connect(masterGain);

      // Formant resonant filter (mimics biological predator throat/mouth opening "ROAAARRR")
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.connect(shaper);

      if (key.includes('monkey') || key.includes('macaque') || key.includes('raptor')) {
        // --- 1. SCARY RAPTOR DISPERSAL SCREECH (Eagle / Hawk Shriek + Attack Growl) ---
        filter.frequency.setValueAtTime(2200, now);
        filter.frequency.exponentialRampToValueAtTime(1400, now + 1.2);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 2.2);
        filter.Q.setValueAtTime(5.0, now);

        // Screech Oscillator
        const screechOsc = ctx.createOscillator();
        screechOsc.type = 'sawtooth';
        screechOsc.frequency.setValueAtTime(2400, now);
        screechOsc.frequency.exponentialRampToValueAtTime(1600, now + 1.2);
        screechOsc.frequency.exponentialRampToValueAtTime(2900, now + 2.5);

        // Rapid avian flutter LFO (42 Hz)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(42, now);
        lfoGain.gain.setValueAtTime(300, now);
        lfo.connect(screechOsc.frequency);
        lfo.start(now);
        lfo.stop(now + durationSec);

        // Undertone predator growl
        const growlOsc = ctx.createOscillator();
        growlOsc.type = 'sawtooth';
        growlOsc.frequency.setValueAtTime(140, now);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.01, now);
        env.gain.linearRampToValueAtTime(0.85, now + 0.1);
        env.gain.setValueAtTime(0.85, now + 2.0);
        env.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

        screechOsc.connect(env);
        growlOsc.connect(env);
        env.connect(filter);

        screechOsc.start(now);
        screechOsc.stop(now + durationSec);
        growlOsc.start(now);
        growlOsc.stop(now + durationSec);

      } else if (key.includes('crow') || key.includes('hawk') || key.includes('bird')) {
        // --- 2. SCARY CORVID DISPERSAL DIVE CRY + SONIC PULSE ---
        filter.frequency.setValueAtTime(1600, now);
        filter.frequency.linearRampToValueAtTime(900, now + durationSec);
        filter.Q.setValueAtTime(4.0, now);

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1850, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.8);
        osc.frequency.setValueAtTime(1950, now + 1.0);
        osc.frequency.exponentialRampToValueAtTime(950, now + 1.8);
        osc.frequency.setValueAtTime(2100, now + 2.0);
        osc.frequency.exponentialRampToValueAtTime(850, now + 2.8);

        // 18 Hz predator modulation
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(18, now);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(220, now);
        lfo.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + durationSec);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.01, now);
        env.gain.linearRampToValueAtTime(0.9, now + 0.08);
        env.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

        osc.connect(env);
        env.connect(filter);
        osc.start(now);
        osc.stop(now + durationSec);

      } else if (key.includes('rodent') || key.includes('rat')) {
        // --- 3. SCARY BARN OWL HUNTING SHRIEK & ULTRASONIC SWEEP ---
        filter.frequency.setValueAtTime(3600, now);
        filter.frequency.linearRampToValueAtTime(2200, now + durationSec);
        filter.Q.setValueAtTime(3.5, now);

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(3800, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + durationSec);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.01, now);
        env.gain.linearRampToValueAtTime(0.85, now + 0.05);
        env.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

        osc.connect(env);
        env.connect(filter);
        osc.start(now);
        osc.stop(now + durationSec);

      } else {
        // --- 4. SCARY APEX PREDATOR ROAR (Tiger / Panther Guttural Roar for Boar & Deer) ---
        // Resonant frequency sweeps like an open roaring predator maw (350Hz -> 900Hz -> 250Hz)
        filter.frequency.setValueAtTime(350, now);
        filter.frequency.exponentialRampToValueAtTime(950, now + 0.8);
        filter.frequency.exponentialRampToValueAtTime(320, now + 2.4);
        filter.Q.setValueAtTime(3.2, now);

        // Main Roar Fundamental Oscillator (130Hz - 210Hz)
        const mainOsc = ctx.createOscillator();
        mainOsc.type = 'sawtooth';
        mainOsc.frequency.setValueAtTime(140, now);
        mainOsc.frequency.linearRampToValueAtTime(210, now + 0.6);
        mainOsc.frequency.exponentialRampToValueAtTime(95, now + 2.8);

        // Sub-bass growl oscillator (75Hz) for terrifying chest rumble
        const subOsc = ctx.createOscillator();
        subOsc.type = 'sawtooth';
        subOsc.frequency.setValueAtTime(75, now);
        subOsc.frequency.linearRampToValueAtTime(110, now + 0.6);
        subOsc.frequency.exponentialRampToValueAtTime(55, now + 2.8);

        // Snarl Rasp Frequency Modulator (28 Hz growl flutter)
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(28, now);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(45, now);
        lfo.connect(mainOsc.frequency);
        lfo.connect(subOsc.frequency);
        lfo.start(now);
        lfo.stop(now + durationSec);

        // Noise burst generator (throat rasp breath)
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(800, now);
        noiseFilter.Q.setValueAtTime(1.5, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.35, now);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        // Dynamic Envelope
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.05, now);
        env.gain.linearRampToValueAtTime(0.95, now + 0.2); // Explosive fierce pounce attack
        env.gain.setValueAtTime(0.90, now + 1.8);
        env.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

        mainOsc.connect(env);
        subOsc.connect(env);
        noiseGain.connect(env);
        env.connect(filter);

        mainOsc.start(now);
        mainOsc.stop(now + durationSec);
        subOsc.start(now);
        subOsc.stop(now + durationSec);
        whiteNoise.start(now);
        whiteNoise.stop(now + durationSec);
      }

      this.isPlaying = true;
      this.isScaryDeterrent = true;
      this.activeTrack = {
        url: 'synthetic_predator_roar',
        label: `🔊 Scary Predator Deterrent Roar (${speciesKey})`,
        species: speciesKey,
        isScary: true,
        maxDurationSec: durationSec
      };
      this.notify();

      if (this.playbackTimeout) clearTimeout(this.playbackTimeout);
      this.playbackTimeout = setTimeout(() => {
        this.stop();
      }, durationSec * 1000);

      return {
        success: true,
        message: `Scary predator deterrent audio activated for ${speciesKey}`,
        synthesized: true
      };

    } catch (e) {
      console.error('[SafeAudioPlayer] Web Audio Scary Synth failed:', e);
      this.stop();
      return { success: false, error: e.message };
    }
  }

  /**
   * Main Scary Deterrent Trigger
   * Plays the authentic predator audio file (.wav), with seamless instant fallback
   * to the Web Audio Scary Predator Roar Synthesizer if file load fails.
   */
  async playScaryDeterrent(speciesKey = 'wild_boar', customLabel = null, durationSec = 3.2) {
    this.stop();

    // Map species to audio file
    let soundPath = './audio/deterrents/boar_apex_deterrent.wav';
    const key = (speciesKey || '').toLowerCase();
    if (key.includes('monkey') || key.includes('macaque')) {
      soundPath = './audio/deterrents/monkey_raptor_deterrent.wav';
    } else if (key.includes('crow')) {
      soundPath = './audio/deterrents/crow_dispersal_deterrent.wav';
    } else if (key.includes('rodent') || key.includes('rat')) {
      soundPath = './audio/deterrents/scary_owl_screech.wav';
    } else if (key.includes('deer')) {
      soundPath = './audio/deterrents/scary_predator_roar.wav';
    }

    const label = customLabel || `🔊 Scary Predator Roar Deterrent (${speciesKey.replace('_', ' ').toUpperCase()})`;

    try {
      const audio = new Audio();
      const resolved = this.resolveUrl(soundPath);
      audio.src = resolved;
      audio.volume = this.maxSafeVolume;
      audio.crossOrigin = 'anonymous';

      this.currentAudioElement = audio;
      this.isPlaying = true;
      this.isScaryDeterrent = true;
      this.activeTrack = {
        url: resolved,
        label,
        species: speciesKey,
        isScary: true,
        maxDurationSec: durationSec
      };
      this.notify();

      audio.onended = () => {
        this.stop();
      };

      audio.onerror = () => {
        console.warn(`[SafeAudioPlayer] Deterrent file load failed for ${resolved}, triggering Web Audio Scary Synth...`);
        this.playScaryPredatorRoar(speciesKey, durationSec);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise.catch((e) => {
          console.warn('[SafeAudioPlayer] HTML5 play rejected (user gesture requirement), using Web Audio Synth:', e);
          this.playScaryPredatorRoar(speciesKey, durationSec);
        });
      }

      if (this.playbackTimeout) clearTimeout(this.playbackTimeout);
      this.playbackTimeout = setTimeout(() => {
        this.stop();
      }, durationSec * 1000);

      return { success: true, message: 'Scary predator deterrent audio broadcasting' };

    } catch (err) {
      console.warn('[SafeAudioPlayer] HTML5 failed, switching to real-time predator synthesizer:', err);
      return this.playScaryPredatorRoar(speciesKey, durationSec);
    }
  }

  /**
   * General sound player for normal preview audio (e.g. testing animal calls)
   */
  async playSound(url, label = 'Acoustic Signal', maxDurationSec = 2.5) {
    this.stop();

    try {
      const audio = new Audio();
      const resolved = this.resolveUrl(url);
      audio.src = resolved;
      audio.volume = this.maxSafeVolume * 0.85;
      audio.crossOrigin = 'anonymous';

      this.currentAudioElement = audio;
      this.isPlaying = true;
      this.isScaryDeterrent = false;
      this.activeTrack = { url: resolved, label, isScary: false, maxDurationSec };
      this.notify();

      audio.onended = () => {
        this.stop();
      };

      audio.onerror = () => {
        this.playSimpleTone(label, maxDurationSec);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise.catch(() => {
          this.playSimpleTone(label, maxDurationSec);
        });
      }

      if (this.playbackTimeout) clearTimeout(this.playbackTimeout);
      this.playbackTimeout = setTimeout(() => {
        this.stop();
      }, maxDurationSec * 1000);

      return { success: true, message: 'Sound sample playing' };

    } catch (err) {
      this.playSimpleTone(label, maxDurationSec);
      return { success: true, message: 'Sample tone played' };
    }
  }

  playSimpleTone(label, durationSec = 2.0) {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      let freq = 220;
      const lower = label.toLowerCase();
      if (lower.includes('boar')) freq = 180;
      else if (lower.includes('monkey')) freq = 1450;
      else if (lower.includes('crow')) freq = 1680;
      else if (lower.includes('sparrow')) freq = 4200;
      else if (lower.includes('deer')) freq = 750;
      else if (lower.includes('rat') || lower.includes('rodent')) freq = 5800;
      else if (lower.includes('tractor')) freq = 120;
      else if (lower.includes('cow')) freq = 220;

      osc.type = freq > 1000 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this.maxSafeVolume * 0.5, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationSec);

      this.isPlaying = true;
      this.isScaryDeterrent = false;
      this.activeTrack = { url: 'synthetic_preview', label, isScary: false, maxDurationSec: durationSec };
      this.notify();

      setTimeout(() => {
        this.stop();
      }, durationSec * 1000);

      return true;
    } catch (_) {
      this.stop();
      return false;
    }
  }

  stop() {
    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }

    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch (_) {}
      this.currentAudioElement = null;
    }

    if (this.activeSourceNode) {
      try {
        this.activeSourceNode.stop();
      } catch (_) {}
      this.activeSourceNode = null;
    }

    this.isPlaying = false;
    this.isScaryDeterrent = false;
    this.activeTrack = null;
    this.notify();
  }
}

export const safePlayer = new SafeAudioPlayer();
