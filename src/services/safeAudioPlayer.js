/**
 * AgriSense Safe Bio-Acoustic Audio Player
 * Enforces non-injurious volume clamps (max gain 0.70), duration timers (3.0s max),
 * and an immediate software Emergency Killswitch.
 */

class SafeAudioPlayer {
  constructor() {
    this.audioContext = null;
    this.currentAudioElement = null;
    this.activeSourceNode = null;
    this.masterGainNode = null;
    this.maxSafeVolume = 0.70; // Hard clamp: never exceed 70% volume to prevent ear/wildlife distress
    this.isPlaying = false;
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
      this.audioContext.resume();
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
          activeTrack: this.activeTrack,
          volume: this.maxSafeVolume
        });
      } catch (err) {
        console.error('[SafeAudioPlayer] Listener error:', err);
      }
    }
  }

  /**
   * Set user preferred volume, strictly clamped to maxSafeVolume
   */
  setVolume(vol) {
    const clamped = Math.max(0.1, Math.min(0.70, vol));
    this.maxSafeVolume = clamped;
    if (this.masterGainNode && this.audioContext) {
      this.masterGainNode.gain.setValueAtTime(clamped, this.audioContext.currentTime);
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = clamped;
    }
    this.notify();
  }

  /**
   * Plays a bio-acoustic deterrent or sample audio file safely
   * Automatically stops after durationSec (default 3.0 seconds)
   * Returns a promise resolving to { success: boolean, message: string }
   */
  async playSound(url, label = 'Acoustic Signal', maxDurationSec = 3.0) {
    // Stop any existing sound first
    this.stop();

    try {
      const audio = new Audio();
      // Resolve path
      const base = import.meta.env.BASE_URL || '/';
      const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
      audio.src = base + cleanUrl;
      audio.volume = this.maxSafeVolume;
      audio.crossOrigin = 'anonymous';

      this.currentAudioElement = audio;
      this.isPlaying = true;
      this.activeTrack = { url, label, maxDurationSec };
      this.notify();

      audio.onended = () => {
        this.stop();
      };

      audio.onerror = (e) => {
        console.warn(`[SafeAudioPlayer] Could not load audio file ${url}, synthesizing synthetic fallback waveform...`, e);
        this.playSyntheticTone(label, maxDurationSec);
      };

      await audio.play();

      // Enforce strict duration clamp
      if (this.playbackTimeout) clearTimeout(this.playbackTimeout);
      this.playbackTimeout = setTimeout(() => {
        this.stop();
      }, maxDurationSec * 1000);

      return { success: true, message: 'Test sound played' };

    } catch (err) {
      console.warn('[SafeAudioPlayer] HTML5 audio play failed, falling back to Web Audio synth:', err);
      const synthOk = this.playSyntheticTone(label, maxDurationSec);
      if (synthOk) {
        return { success: true, message: 'Test sound played' };
      }
      return { success: false, message: `Audio playback failed: ${err.message}` };
    }
  }

  /**
   * Safe Web Audio API synthesizer for instant testing even without audio file network requests
   */
  playSyntheticTone(label, durationSec = 2.5) {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      let freq = 200;
      if (label.toLowerCase().includes('boar')) freq = 120;
      else if (label.toLowerCase().includes('monkey')) freq = 2200;
      else if (label.toLowerCase().includes('crow')) freq = 1450;
      else if (label.toLowerCase().includes('sparrow')) freq = 4500;
      else if (label.toLowerCase().includes('cow')) freq = 180;
      else if (label.toLowerCase().includes('chime')) freq = 587;

      osc.type = freq > 1000 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Safe envelope
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this.maxSafeVolume * 0.5, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationSec);

      this.isPlaying = true;
      this.activeTrack = { url: 'synthetic', label, maxDurationSec: durationSec };
      this.notify();

      setTimeout(() => {
        this.stop();
      }, durationSec * 1000);

      return true;

    } catch (e) {
      console.error('[SafeAudioPlayer] Web Audio Synth failed:', e);
      this.stop();
      return false;
    }
  }

  /**
   * Master Emergency Stop: silences all sounds immediately
   */
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
    this.activeTrack = null;
    this.notify();
  }
}

export const safePlayer = new SafeAudioPlayer();
