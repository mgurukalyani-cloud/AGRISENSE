/**
 * AgriSense Safe Bio-Acoustic Audio Player
 * Enforces non-injurious volume clamps (max gain 0.70), duration timers (3.0s max),
 * automatic base URL resolution for GitHub Pages / subpaths, and Web Audio synthesis fallback.
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

  async playSound(url, label = 'Acoustic Signal', maxDurationSec = 3.0) {
    this.stop();

    try {
      const audio = new Audio();
      const resolved = this.resolveUrl(url);
      audio.src = resolved;
      audio.volume = this.maxSafeVolume;
      audio.crossOrigin = 'anonymous';

      this.currentAudioElement = audio;
      this.isPlaying = true;
      this.activeTrack = { url: resolved, label, maxDurationSec };
      this.notify();

      audio.onended = () => {
        this.stop();
      };

      audio.onerror = (e) => {
        console.warn(`[SafeAudioPlayer] HTML5 audio load failed for ${resolved}, playing synthetic bio-acoustic tone...`);
        this.playSyntheticTone(label, maxDurationSec);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise.catch((e) => {
          console.warn('[SafeAudioPlayer] Play promise rejected, using Web Audio synthesizer:', e);
          this.playSyntheticTone(label, maxDurationSec);
        });
      }

      if (this.playbackTimeout) clearTimeout(this.playbackTimeout);
      this.playbackTimeout = setTimeout(() => {
        this.stop();
      }, maxDurationSec * 1000);

      return { success: true, message: 'Test sound played' };

    } catch (err) {
      console.warn('[SafeAudioPlayer] HTML5 audio failed, falling back to Web Audio synth:', err);
      this.playSyntheticTone(label, maxDurationSec);
      return { success: true, message: 'Synthetic test tone played' };
    }
  }

  playSyntheticTone(label, durationSec = 2.5) {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      let freq = 200;
      const lower = label.toLowerCase();
      if (lower.includes('boar')) freq = 140;
      else if (lower.includes('monkey')) freq = 1800;
      else if (lower.includes('crow')) freq = 1450;
      else if (lower.includes('sparrow')) freq = 4200;
      else if (lower.includes('deer')) freq = 650;
      else if (lower.includes('rat') || lower.includes('rodent')) freq = 5500;
      else if (lower.includes('tractor') || lower.includes('machinery')) freq = 80;
      else if (lower.includes('cow')) freq = 220;
      else if (lower.includes('chime') || lower.includes('deterrent')) freq = 587;

      osc.type = freq > 1000 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Safe envelope
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this.maxSafeVolume * 0.45, ctx.currentTime + 0.1);
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
