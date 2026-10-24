import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Flame,
  Info,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { classifyAudioData, encodeWavBlob } from '../../services/animalSoundService';
import { safePlayer } from '../../services/safeAudioPlayer';

export default function LiveAudioMonitor({
  latestDetection: externalLatestDetection,
  onDetectionEvent,
  systemStatus,
  onRefreshStatus
}) {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [micPermission, setMicPermission] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveSplDb, setLiveSplDb] = useState(0);
  const [peakSplDb, setPeakSplDb] = useState(0);
  const [internalLatestDetection, setInternalLatestDetection] = useState(null);
  const [vadActive, setVadActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pipelineStage, setPipelineStage] = useState('idle');

  // Use external detection if provided, otherwise internal
  const latestDetection = externalLatestDetection !== undefined ? externalLatestDetection : internalLatestDetection;

  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const scriptNodeRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const pcmBufferRef = useRef([]);
  const vadActiveRef = useRef(false);

  // Synchronize VAD ref for audio processing loop
  useEffect(() => {
    vadActiveRef.current = vadActive;
  }, [vadActive]);

  // Initialize or stop live microphone audio stream
  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  const startListening = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Web Audio microphone access is not supported on this browser.');
      }

      setPipelineStage('requesting_permission');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Preserve authentic animal bio-acoustics
          autoGainControl: false,
          sampleRate: 16000
        }
      });

      mediaStreamRef.current = stream;
      setMicPermission('granted');
      setPipelineStage('stream_acquired');

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Real-time raw PCM accumulator via ScriptProcessorNode
      // Directly captures Float32Array samples without relying on WebM container encoding
      const scriptNode = ctx.createScriptProcessor(4096, 1, 1);
      scriptNodeRef.current = scriptNode;
      pcmBufferRef.current = [];

      scriptNode.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        for (let i = 0; i < inputData.length; i++) {
          pcmBufferRef.current.push(inputData[i]);
        }

        // When ~1.5s of audio is collected (24,000 samples at 16kHz)
        if (pcmBufferRef.current.length >= 24000) {
          const chunk = pcmBufferRef.current.splice(0, 24000);
          // Trigger classification when audio energy was detected during the window
          if (vadActiveRef.current) {
            const wavBlob = encodeWavBlob(chunk, 16000);
            analyzeAudioChunk(wavBlob);
          }
        }
      };

      source.connect(scriptNode);
      scriptNode.connect(ctx.destination);

      setIsListening(true);
      startVisualizer();

    } catch (err) {
      console.error('[LiveAudioMonitor] Microphone access error:', err);
      setMicPermission('denied');
      setPipelineStage('permission_denied');
      setErrorMsg(`Microphone access notice: ${err.message}. You can still use the 1-Click Animal Soundboard and Demo Controls below.`);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    if (scriptNodeRef.current) {
      try {
        scriptNodeRef.current.disconnect();
      } catch (_) {}
      scriptNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }

    pcmBufferRef.current = [];
    setIsListening(false);
    setVadActive(false);
    setLiveSplDb(0);
    setPipelineStage('idle');
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // Analyze audio chunk with backend ML classifier
  const analyzeAudioChunk = async (wavBlob) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setPipelineStage('features_extracting');

    try {
      const result = await classifyAudioData(wavBlob, 16000, 'Live Audio');
      if (result && result.success) {
        setPipelineStage('result_produced');
        setInternalLatestDetection(result.event || result);
        if (onDetectionEvent) onDetectionEvent(result.event || result);
        if (onRefreshStatus) onRefreshStatus();

        // If automated repellent was triggered by backend and sound payload returned
        if (result.action_taken === 'DETERRENT_ACTIVATED' && result.deterrent_payload) {
          safePlayer.playSound(
            result.deterrent_payload.sound_file,
            result.deterrent_payload.description,
            result.deterrent_payload.duration_sec || 3.0
          );
        } else if (result.action_taken === 'FARMER_ALERT_BUZZER' && result.deterrent_payload) {
          safePlayer.playSound(
            result.deterrent_payload.sound_file,
            'Farmer Alert Buzzer',
            3.0
          );
        }
      } else {
        setPipelineStage('model_unavailable');
      }
    } catch (err) {
      console.warn('[LiveAudioMonitor] Classifier invocation failed or offline:', err);
      setPipelineStage('model_unavailable');
    } finally {
      setIsProcessing(false);
    }
  };

  // 60 FPS Real-time Oscilloscope & Frequency Canvas Visualizer
  const startVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    let localPeak = 0;

    const render = () => {
      animFrameIdRef.current = requestAnimationFrame(render);

      analyser.getByteTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);

      // Compute RMS and Decibel Level
      let sumSq = 0;
      for (let i = 0; i < bufferLength; i++) {
        const norm = (timeData[i] - 128) / 128;
        sumSq += norm * norm;
      }
      const rms = Math.sqrt(sumSq / bufferLength);
      const db = Math.round(20 * Math.log10(Math.max(0.001, rms)) + 70); // Adjusted scale ~ 20-90 dB
      setLiveSplDb(Math.max(18, db));
      if (db > localPeak) {
        localPeak = db;
        setPeakSplDb(localPeak);
      }
      // VAD indicator threshold (above ~36 dB indicates active bio-acoustics)
      const isVoiceOrSound = db > 36;
      setVadActive(isVoiceOrSound);

      // Canvas Rendering
      const width = canvas.width;
      const height = canvas.height;

      // Dark emerald background
      ctx.fillStyle = '#062817';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw subtle frequency grid lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.lineWidth = 1;
      for (let y = height / 4; y < height; y += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Frequency Spectrum Bars in the background (Mel/FFT)
      const barCount = 48;
      const barWidth = width / barCount;
      for (let i = 0; i < barCount; i++) {
        const binIndex = Math.floor(Math.pow(i / barCount, 1.8) * (bufferLength / 2));
        const val = freqData[binIndex] || 0;
        const barHeight = (val / 255) * (height * 0.7);

        // Color gradient based on frequency
        const hue = 145 + (i / barCount) * 45; // Emerald to lime
        ctx.fillStyle = `hsla(${hue}, 85%, 45%, 0.35)`;
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1.5, barHeight);
      }

      // 3. Draw Center Glow Oscilloscope Waveform
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#34d399'; // Bright emerald green
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow for next frame
    };

    render();
  };

  // Pipeline Stages definition (8-stage bio-acoustic detection flow)
  const PIPELINE_STEPS = [
    { id: 1, label: 'Mic Permission', active: micPermission === 'granted' || !!latestDetection },
    { id: 2, label: 'Audio Stream', active: isListening || !!latestDetection },
    { id: 3, label: 'Signal Detected', active: vadActive || !!latestDetection },
    { id: 4, label: 'Feature Extraction', active: isProcessing || Boolean(latestDetection?.audio_metrics && Object.keys(latestDetection.audio_metrics).length > 0) },
    { id: 5, label: 'Neural Model', active: systemStatus?.is_model_ready !== false && latestDetection?.category !== 'error' },
    { id: 6, label: 'Species Prediction', active: Boolean(latestDetection?.species && latestDetection.species !== 'unknown') },
    { id: 7, label: 'Rules Evaluated', active: Boolean(latestDetection?.action && latestDetection.action !== 'MODEL_ERROR') },
    { id: 8, label: 'Event Output', active: Boolean(latestDetection) }
  ];

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-emerald-900/10 shadow-sm space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/10">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
            isListening ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-500/20' : 'bg-slate-100 text-slate-500'
          }`}>
            <Radio className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              {t('animalRepellent.liveMonitorTitle', 'Live Farm Audio Acquisition')}
              {isListening && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 animate-pulse">
                  ● LIVE STREAM
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              16kHz PCM Stream · Hardware I2S / Web Audio · PyTorch 131-Feature Spectral Analysis
            </p>
          </div>
        </div>

        {/* Master Listen Action Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer shadow-sm ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 ring-2 ring-rose-400/40'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>{t('animalRepellent.stopListening', 'Stop Microphone')}</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>{t('animalRepellent.startListening', 'Start Microphone')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error alert if mic was blocked */}
      {errorMsg && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Visualizer Canvas & Metrics Box */}
      <div className="relative rounded-2xl overflow-hidden border border-emerald-950/20 bg-slate-950 shadow-inner">
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full h-44 sm:h-52 block"
        />

        {/* Overlay HUD Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
          <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-white text-xs font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>SPL: {isListening ? `${liveSplDb} dB` : '-- dB'}</span>
          </div>

          <div className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
            vadActive
              ? 'bg-amber-500/80 border-amber-400 text-white shadow-lg shadow-amber-500/30'
              : 'bg-slate-900/80 border-white/10 text-slate-300'
          }`}>
            <Flame className={`w-3.5 h-3.5 ${vadActive ? 'text-amber-200' : 'text-slate-400'}`} />
            <span>VAD: {vadActive ? 'Sound Detected' : 'Quiet Farm Noise'}</span>
          </div>

          {isProcessing && (
            <div className="bg-emerald-600/90 text-white px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Harmonics...</span>
            </div>
          )}
        </div>

        {/* Live Status Overlay Footer */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-emerald-300/80 font-mono bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
          <span>SAMPLING: 16,000 Hz / 16-BIT PCM MONO</span>
          <span>WINDOW: 1024-PT STFT / 40-MEL FILTERBANK</span>
        </div>
      </div>

      {/* Section 5: Audio Processing Pipeline Stage Tracker */}
      <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-700" />
            Audio Processing Pipeline Status
          </span>
          <span className="font-mono text-slate-400">
            {isListening ? (vadActive ? 'Stage 3-4 Active' : 'Stage 1-2 Ready') : 'Pipeline Standby'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
          {PIPELINE_STEPS.map((s) => (
            <div
              key={s.id}
              className={`p-2 rounded-xl text-center border transition-all ${
                s.active
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider">
                Step {s.id}
              </div>
              <div className="text-[11px] font-black truncate mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Detection Result Display Panel */}
      {latestDetection ? (
        <div className={`p-4 rounded-2xl border transition-all animate-in fade-in ${
          latestDetection.category === 'beneficial'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : latestDetection.category === 'harmful'
            ? 'bg-rose-50 border-rose-200 text-rose-950'
            : latestDetection.category === 'error'
            ? 'bg-slate-100 border-slate-300 text-slate-900'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3 min-w-0">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                latestDetection.category === 'beneficial'
                  ? 'bg-emerald-600 text-white'
                  : latestDetection.category === 'harmful'
                  ? 'bg-rose-600 text-white'
                  : latestDetection.category === 'error'
                  ? 'bg-slate-700 text-white'
                  : 'bg-amber-600 text-white'
              }`}>
                {latestDetection.category === 'beneficial' ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : latestDetection.category === 'harmful' ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-black text-base sm:text-lg truncate">
                    {latestDetection.species_name || latestDetection.species || latestDetection.predicted_class || 'Sound detected — species not identified'}
                  </h4>

                  {/* Section 3B: Visual Indicator Badge */}
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    latestDetection.category === 'beneficial'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : latestDetection.category === 'harmful'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : latestDetection.category === 'error'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-amber-600 text-white shadow-xs'
                  }`}>
                    {latestDetection.category === 'beneficial' ? (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        <span>Protected</span>
                      </>
                    ) : latestDetection.category === 'harmful' ? (
                      <>
                        <ShieldAlert className="w-3 h-3" />
                        <span>Target Alert</span>
                      </>
                    ) : latestDetection.category === 'error' ? (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        <span>Model Error</span>
                      </>
                    ) : (
                      <>
                        <Info className="w-3 h-3" />
                        <span>Uncertain</span>
                      </>
                    )}
                  </span>

                  {/* Event Source Tag */}
                  <span className="text-[10px] font-mono font-bold bg-white/90 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    Source: {latestDetection.source || (latestDetection.is_simulated ? 'Simulation' : 'AI Classifier')}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                  <span className="font-mono">
                    Time: {latestDetection.timestamp || 'Just now'}
                  </span>
                  <span>•</span>
                  <span>Category: <strong className="capitalize">{latestDetection.category || 'Unknown'}</strong></span>
                </div>

                {/* Status Message */}
                <p className="text-xs text-slate-700 font-semibold mt-1.5 leading-relaxed bg-white/60 p-2 rounded-xl border border-black/5">
                  {latestDetection.status_message || (latestDetection.is_simulated ? 'Simulated test event processed successfully.' : 'Sound pattern detected and evaluated.')}
                </p>

                {/* Acoustic feature breakdown pill */}
                {latestDetection.audio_metrics && (
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500 mt-2">
                    {latestDetection.audio_metrics.dominant_frequency_hz && (
                      <span className="bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                        Dominant Freq: {latestDetection.audio_metrics.dominant_frequency_hz} Hz
                      </span>
                    )}
                    {latestDetection.audio_metrics.spectral_centroid_hz && (
                      <span className="bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                        Spectral Centroid: {latestDetection.audio_metrics.spectral_centroid_hz} Hz
                      </span>
                    )}
                    {latestDetection.audio_metrics.rms_energy && (
                      <span className="bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                        RMS Energy: {latestDetection.audio_metrics.rms_energy}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Confidence Score Pill */}
            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-slate-400">Classifier Confidence</div>
              <div className={`text-2xl font-black ${
                latestDetection.confidence === null || latestDetection.confidence === undefined
                  ? 'text-slate-400 text-sm italic'
                  : latestDetection.confidence >= 80
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}>
                {latestDetection.confidence !== null && latestDetection.confidence !== undefined
                  ? `${latestDetection.confidence}%`
                  : 'N/A (Simulated / Unclassified)'}
              </div>
              <div className="text-[10px] font-semibold text-slate-500">
                {latestDetection.is_persistent ? '✓ Persistence Confirmed' : latestDetection.action === 'PERSISTENCE_PENDING' ? '1/2 Sample Awaiting' : 'Single Event'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Radio className={`w-4 h-4 ${isListening ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span className="font-semibold">
              {isListening
                ? pipelineStage === 'model_unavailable' || systemStatus?.is_model_ready === false
                  ? 'Classification model unavailable — audio input is working, but species identification is not available'
                  : vadActive
                  ? 'Sound detected — species not identified'
                  : 'Microphone connected — listening'
                : 'Microphone is currently idle. Click "Start Microphone" above or use the demo controls below.'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {isListening ? (vadActive ? 'Analyzing Harmonics...' : 'Monitoring Farm') : 'Ready'}
          </span>
        </div>
      )}
    </div>
  );
}
