import React, { useState, useEffect } from 'react';
import { 
  Volume2, VolumeX, Play, Pause, Square, Globe, Sparkles, AlertCircle 
} from 'lucide-react';
import cropVoiceService from '../../services/cropVoiceService';

export default function CropVoicePlayerBar({ 
  cropRecord, 
  lifecycle, 
  fertilizerResult, 
  cropProtectionData, 
  lang = 'en', 
  onLangChange 
}) {
  const isTe = lang === 'te';

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('full'); // 'full', 'fertilizer', 'stage', 'pest'
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [voiceAvailable, setVoiceAvailable] = useState(true);

  useEffect(() => {
    const handleStart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    const handleEnd = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    const handlePause = () => setIsPaused(true);
    const handleResume = () => setIsPaused(false);

    cropVoiceService.on('start', handleStart);
    cropVoiceService.on('end', handleEnd);
    cropVoiceService.on('pause', handlePause);
    cropVoiceService.on('resume', handleResume);

    return () => {
      cropVoiceService.off('start', handleStart);
      cropVoiceService.off('end', handleEnd);
      cropVoiceService.off('pause', handlePause);
      cropVoiceService.off('resume', handleResume);
      cropVoiceService.stop();
    };
  }, []);

  const getTopicScript = (topic) => {
    if (!cropRecord || !lifecycle) return '';

    if (topic === 'stage') {
      return cropVoiceService.generateLifecycleScript(cropRecord, lifecycle, lang);
    }
    if (topic === 'fertilizer' && fertilizerResult) {
      return cropVoiceService.generateFertilizerScript(cropRecord, fertilizerResult, lang);
    }
    if (topic === 'pest' && cropProtectionData?.activeDiagnosis) {
      return cropVoiceService.generatePestProtectionScript(cropProtectionData.activeDiagnosis, lang);
    }

    // Default 'full' combines all 3
    const stageScript = cropVoiceService.generateLifecycleScript(cropRecord, lifecycle, lang);
    const fertScript = fertilizerResult ? cropVoiceService.generateFertilizerScript(cropRecord, fertilizerResult, lang) : '';
    const pestScript = cropProtectionData?.activeDiagnosis 
      ? cropVoiceService.generatePestProtectionScript(cropProtectionData.activeDiagnosis, lang) 
      : '';

    return `${stageScript} ${fertScript} ${pestScript}`;
  };

  const handlePlay = (topicToPlay = selectedTopic) => {
    if (isPaused) {
      cropVoiceService.resume();
      return;
    }

    const script = getTopicScript(topicToPlay);
    if (!script) return;

    cropVoiceService.setRate(playbackSpeed);
    cropVoiceService.speak({
      text: script,
      lang: lang,
      onError: (err) => {
        console.warn('TTS narration error:', err);
        setIsPlaying(false);
        setIsPaused(false);
      }
    });
  };

  const handlePause = () => {
    cropVoiceService.pause();
  };

  const handleStop = () => {
    cropVoiceService.stop();
  };

  const handleSpeedToggle = () => {
    const nextSpeed = playbackSpeed === 1.0 ? 1.2 : playbackSpeed === 1.2 ? 0.85 : 1.0;
    setPlaybackSpeed(nextSpeed);
    cropVoiceService.setRate(nextSpeed);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Indicator & Language Toggle */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isPlaying 
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40 animate-pulse' 
              : 'bg-slate-800 text-emerald-400'
          }`}>
            <Volume2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">
                {isTe ? 'స్వర వ్యవసాయ సలహాదారు (Voice Advisory)' : 'Voice Agricultural Assistant'}
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isPlaying 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse' 
                  : isPaused 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-slate-800 text-slate-400'
              }`}>
                {isPlaying 
                  ? (isTe ? 'మాట్లాడుతున్నది...' : `Speaking (${lang.toUpperCase()})...`) 
                  : isPaused 
                    ? (isTe ? 'ఆపబడింది' : 'Paused') 
                    : (isTe ? 'సిద్ధంగా ఉంది' : 'Ready')}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isTe 
                ? 'ఎరువుల బస్తాల వివరాలు & సస్యరక్షణ సూచనలను మీ భాషలో వినండి' 
                : 'Listen to exact bag dosages and crop stages in Telugu or English'}
            </p>
          </div>
        </div>

        {/* Center: Topic selector pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => { setSelectedTopic('full'); if (isPlaying) handlePlay('full'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTopic === 'full' 
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isTe ? 'పూర్తి సలహా' : 'Full Advisory'}
          </button>
          <button
            type="button"
            onClick={() => { setSelectedTopic('fertilizer'); if (isPlaying) handlePlay('fertilizer'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTopic === 'fertilizer' 
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isTe ? 'ఎరువుల మోతాదు' : 'Fertilizer Dose'}
          </button>
          <button
            type="button"
            onClick={() => { setSelectedTopic('stage'); if (isPlaying) handlePlay('stage'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTopic === 'stage' 
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isTe ? 'పంట దశ' : 'Growth Stage'}
          </button>
          <button
            type="button"
            onClick={() => { setSelectedTopic('pest'); if (isPlaying) handlePlay('pest'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTopic === 'pest' 
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isTe ? 'సస్యరక్షణ' : 'Pest Advice'}
          </button>
        </div>

        {/* Right: Audio Controls & Language Toggle */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextLang = lang === 'en' ? 'te' : 'en';
              if (onLangChange) onLangChange(nextLang);
              if (isPlaying) {
                cropVoiceService.stop();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'te' ? 'తెలుగు (Active)' : 'English'}</span>
          </button>

          {/* Speed Toggle */}
          <button
            type="button"
            onClick={handleSpeedToggle}
            className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition-colors"
            title="Speech Speed"
          >
            {playbackSpeed}x
          </button>

          {/* Play / Pause Button */}
          {!isPlaying || isPaused ? (
            <button
              type="button"
              onClick={() => handlePlay(selectedTopic)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isPaused ? (isTe ? 'కొనసాగించు' : 'Resume') : (isTe ? 'వినండి' : 'Listen')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>{isTe ? 'ఆపు' : 'Pause'}</span>
            </button>
          )}

          {/* Stop Button */}
          {(isPlaying || isPaused) && (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 transition-colors"
              title="Stop Narration"
            >
              <Square className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Visual Waveform Animation when playing */}
      {isPlaying && !isPaused && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1">
          {[16, 24, 12, 32, 20, 28, 14, 30, 22, 18, 26, 12, 34, 18, 24].map((h, i) => (
            <span
              key={i}
              className="w-1 bg-emerald-400 rounded-full animate-pulse"
              style={{
                height: `${h}px`,
                animationDelay: `${(i * 0.08).toFixed(2)}s`,
                animationDuration: '0.8s'
              }}
            />
          ))}
          <span className="ml-2 text-[11px] text-emerald-400 font-medium">
            {isTe ? 'స్వర ప్రసారం జరుగుతోంది...' : 'Transmitting agricultural voice advisory...'}
          </span>
        </div>
      )}
    </div>
  );
}
