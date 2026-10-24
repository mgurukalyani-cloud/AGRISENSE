import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Bell,
  Volume2,
  VolumeX,
  Sliders,
  Power,
  AlertOctagon,
  Timer,
  Play,
  RotateCcw,
  Check,
  AlertTriangle
} from 'lucide-react';
import {
  updateRepellentConfig,
  triggerManualRepellent,
  emergencyStopRepellents
} from '../../services/animalSoundService';
import { safePlayer } from '../../services/safeAudioPlayer';

export default function RepellentControlPanel({ systemStatus, onRefreshStatus }) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState('audio_deterrent');
  const [threshold, setThreshold] = useState(70);
  const [volume, setVolume] = useState(0.65);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [manualSpecies, setManualSpecies] = useState('wild_boar');
  const [isUpdating, setIsUpdating] = useState(false);

  const [maxDurationSec, setMaxDurationSec] = useState(3.0);

  // Sync with systemStatus prop
  useEffect(() => {
    if (systemStatus) {
      if (typeof systemStatus.system_enabled === 'boolean') setEnabled(systemStatus.system_enabled);
      else if (typeof systemStatus.enabled === 'boolean') setEnabled(systemStatus.enabled);

      if (systemStatus.response_mode) setMode(systemStatus.response_mode);
      else if (systemStatus.mode) setMode(systemStatus.mode);

      if (systemStatus.confidence_threshold) setThreshold(systemStatus.confidence_threshold);
      if (systemStatus.cooldown_remaining_sec !== undefined) setCooldownSec(systemStatus.cooldown_remaining_sec);
    }
  }, [systemStatus]);

  // Subscribe to safeAudioPlayer state
  useEffect(() => {
    const unsubscribe = safePlayer.subscribe((state) => {
      setIsAudioPlaying(state.isPlaying);
    });
    return unsubscribe;
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = setInterval(() => {
      setCooldownSec((prev) => {
        if (prev <= 1) {
          if (onRefreshStatus) onRefreshStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSec, onRefreshStatus]);

  const handleToggleEnable = async () => {
    const next = !enabled;
    setEnabled(next);
    await updateRepellentConfig({ enabled: next });
    if (onRefreshStatus) onRefreshStatus();
  };

  const handleModeChange = async (newMode) => {
    setMode(newMode);
    await updateRepellentConfig({ mode: newMode });
    if (onRefreshStatus) onRefreshStatus();
  };

  const handleThresholdChange = async (newVal) => {
    setThreshold(newVal);
    await updateRepellentConfig({ confidence_threshold: newVal });
  };

  const handleVolumeChange = (newVol) => {
    const clamped = Math.min(0.70, Math.max(0.1, newVol));
    setVolume(clamped);
    safePlayer.setVolume(clamped);
  };

  const handleDurationChange = (newDur) => {
    const clamped = Math.min(3.0, Math.max(1.0, newDur));
    setMaxDurationSec(clamped);
  };

  const handleEmergencyStop = async () => {
    safePlayer.stop();
    await emergencyStopRepellents();
    if (onRefreshStatus) onRefreshStatus();
  };

  const handleManualDispatch = async () => {
    const res = await triggerManualRepellent(manualSpecies);
    if (res && res.success && res.deterrent_details) {
      safePlayer.playSound(
        res.deterrent_details.sound_file,
        res.deterrent_details.description,
        maxDurationSec
      );
    }
    if (onRefreshStatus) onRefreshStatus();
  };

  const MODES = [
    {
      id: 'monitoring',
      label: 'Monitoring Mode',
      desc: 'Silent observation. Records all acoustic events and updates farmer dashboard without sounds.',
      icon: Shield
    },
    {
      id: 'alert',
      label: 'Alert Mode',
      desc: 'Visual alert banner and gentle dashboard chime for the farmer. No outdoor repellent sound.',
      icon: Bell
    },
    {
      id: 'audio_deterrent',
      label: 'Audio Deterrent Mode',
      desc: 'Automated safe species-specific bio-acoustic sound (predator calls/distress pulses) with volume clamps.',
      icon: Volume2
    },
    {
      id: 'manual',
      label: 'Manual Mode',
      desc: 'Detections require farmer confirmation click before firing any deterrent.',
      icon: Sliders
    }
  ];

  // Derive current alarm status
  const alarmStatusText = !enabled
    ? 'System Paused'
    : isAudioPlaying
    ? 'Alarm Active (Audio Playing)'
    : cooldownSec > 0
    ? `In Cooldown (${cooldownSec}s)`
    : 'Standby / Armed';

  const alarmStatusBadgeClass = !enabled
    ? 'bg-slate-100 text-slate-700 border-slate-200'
    : isAudioPlaying
    ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
    : cooldownSec > 0
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-emerald-100 text-emerald-800 border-emerald-300';

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-emerald-900/10 shadow-sm space-y-6">
      {/* Top Header & Emergency Killswitch */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-emerald-900/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              {t('animalRepellent.controlTitle', 'Repellent Guard Safety & Mode Controller')}
            </h3>
            {/* Current Alarm Status Badge */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black border ${alarmStatusBadgeClass}`}>
              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current"></span>
              {alarmStatusText}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Control automated deterrence protocols, emergency killswitch, cooldown timers, and safety volume clamps.
          </p>
        </div>

        {/* Master Killswitch Button & Master Switch */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            data-action="emergency-stop"
            onClick={handleEmergencyStop}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md ${
              isAudioPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/40 animate-pulse'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Emergency Stop Sounds</span>
          </button>

          {/* Master Enable/Pause Switch */}
          <button
            onClick={handleToggleEnable}
            className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              enabled
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{enabled ? 'System Armed' : 'System Paused'}</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Cards */}
      <div className="space-y-2">
        <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
          1. Select Farm Protection Operating Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-md shadow-emerald-900/20 ring-2 ring-emerald-500/40'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-emerald-800 shadow-xs'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </div>
                <h4 className="font-bold text-xs sm:text-sm">{m.label}</h4>
                <p className={`text-[11px] mt-1 leading-relaxed ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cooldown, Threshold, Volume & Max Duration Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
        {/* 1. Cooldown Timer Status */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-emerald-700" />
              Protective Cooldown
            </span>
            <span className={`font-mono font-black ${cooldownSec > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {cooldownSec > 0 ? `${cooldownSec}s Active` : 'Ready / 0s'}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                cooldownSec > 0 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${(cooldownSec / 60) * 100}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400">
            Prevents animal habituation and noise fatigue. Cooldown enforced after activation.
          </p>
        </div>

        {/* 2. Confidence Threshold Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-700" />
              Rejection Threshold
            </span>
            <span className="font-mono font-black text-slate-900">{threshold}%</span>
          </div>
          <input
            type="range"
            min="40"
            max="95"
            step="5"
            value={threshold}
            onChange={(e) => handleThresholdChange(Number(e.target.value))}
            className="w-full accent-emerald-700 cursor-pointer h-2"
          />
          <p className="text-[10px] text-slate-400">
            Detections below {threshold}% are marked as uncertain and never trigger automated repellents.
          </p>
        </div>

        {/* 3. Volume Safety Clamp Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-700" />
              Safe Output Volume
            </span>
            <span className="font-mono font-black text-emerald-800">
              {Math.round(volume * 100)}% (Max 70%)
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.70"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-full accent-emerald-700 cursor-pointer h-2"
          />
          <p className="text-[10px] text-slate-400">
            Hard volume clamp (&le;70% / ~75 dB SPL) strictly prevents hearing damage to livestock and humans.
          </p>
        </div>

        {/* 4. Max Playback Duration Clamp Slider (Section 3E) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-emerald-700" />
              Max Duration Clamp
            </span>
            <span className="font-mono font-black text-emerald-800">
              {maxDurationSec.toFixed(1)}s (Max 3.0s)
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.5"
            value={maxDurationSec}
            onChange={(e) => handleDurationChange(Number(e.target.value))}
            className="w-full accent-emerald-700 cursor-pointer h-2"
          />
          <p className="text-[10px] text-slate-400">
            Hard playback duration clamp (&le;3.0 seconds) ensures brief non-distressing acoustic deterrence pulses.
          </p>
        </div>
      </div>

      {/* Section 3E: Test Alert Control with Clear Browser-Only Speaker Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-amber-900">
              Local Audio Testing Disclaimer:
            </span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              The <strong>Test Alert</strong> button below tests audio on your <strong>computer / browser speaker only</strong>. It does not trigger physical outdoor horn speakers or farm field hardware unless an ESP32 hardware node is physically wired and connected to your network.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-amber-200/60">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-700">Target Pest Sound:</label>
            <select
              value={manualSpecies}
              onChange={(e) => setManualSpecies(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="wild_boar">Wild Boar (Apex Predator Rumble)</option>
              <option value="monkey">Macaque Monkey (Eagle Raptor Cry)</option>
              <option value="crow">Crow / Corvid (Dispersal Distress)</option>
              <option value="deer">Spotted Deer (Predator Rustle)</option>
            </select>
          </div>

          <button
            data-action="test-alert"
            onClick={handleManualDispatch}
            disabled={!enabled || cooldownSec > 0}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Test Alert (Browser Audio Only)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
