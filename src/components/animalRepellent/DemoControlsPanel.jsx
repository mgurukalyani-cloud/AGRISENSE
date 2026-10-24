import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Volume2,
  ArrowRight,
  Flame,
  Activity
} from 'lucide-react';
import { createSimulatedEvent, postDetectionEvent } from '../../services/animalSoundService';
import { safePlayer } from '../../services/safeAudioPlayer';

export default function DemoControlsPanel({
  onDispatchEvent,
  requiredConfirmations = 2,
  onRefreshStatus
}) {
  const { t } = useTranslation();
  const [activeScenario, setActiveScenario] = useState(null);
  const [confirmationStep, setConfirmationStep] = useState(0);
  const [lastActionMessage, setLastActionMessage] = useState(null);
  const [soundFeedback, setSoundFeedback] = useState(null);

  const handleTriggerScenario = async (type) => {
    setActiveScenario(type);
    setSoundFeedback(null);

    let step = 1;
    if (type === 'harmful') {
      step = confirmationStep + 1;
      if (step > requiredConfirmations) {
        step = 1; // loop back or start over
      }
      setConfirmationStep(step);
    } else {
      setConfirmationStep(0);
    }

    // 1. Generate verified standardized event record
    const eventRecord = createSimulatedEvent(type, step, requiredConfirmations);
    if (!eventRecord) return;

    // 2. Dispatch to parent dashboard state (immediate UI update)
    if (onDispatchEvent) {
      onDispatchEvent(eventRecord);
    }

    // 3. Persist to backend history
    postDetectionEvent(eventRecord).catch((e) =>
      console.warn('[DemoControls] Backend persist note:', e)
    );

    // 4. Update status display message
    setLastActionMessage(eventRecord.status_message);

    // 5. Sound trigger rule:
    // Strictly ONLY play audio when a harmful target is confirmed!
    // NEVER trigger repellent audio for Cow, Sparrow, Unknown, Low-Confidence, or Error!
    if (type === 'harmful' && step >= requiredConfirmations && eventRecord.deterrent_details) {
      try {
        const soundRes = await safePlayer.playSound(
          eventRecord.deterrent_details.sound_file,
          eventRecord.deterrent_details.description,
          eventRecord.deterrent_details.duration_sec || 3.0
        );
        if (soundRes && soundRes.success) {
          setSoundFeedback('Test sound played');
        } else {
          setSoundFeedback(soundRes?.message || 'Audio playback unavailable');
        }
      } catch (err) {
        setSoundFeedback(`Playback error: ${err.message}`);
      }
    }

    if (onRefreshStatus) onRefreshStatus();
  };

  const handleResetConfirmation = () => {
    setConfirmationStep(0);
    setLastActionMessage('Confirmation sequence reset to 0.');
    setSoundFeedback(null);
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-emerald-900/10 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Demo Event Controls & Simulation Scenarios
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
              Simulation Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Trigger verified test events to validate safety exemptions, confirmation logic, and repellent suppression without requiring live animal sounds.
          </p>
        </div>

        {/* Confirmation Reset Tool */}
        {confirmationStep > 0 && (
          <button
            onClick={handleResetConfirmation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Confirmation ({confirmationStep}/{requiredConfirmations})</span>
          </button>
        )}
      </div>

      {/* Last Triggered Action Notice Banner */}
      {lastActionMessage && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center space-x-2.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs font-semibold truncate">
              <span className="text-slate-400">Triggered Output:</span>{' '}
              <span className="text-emerald-200 font-bold">{lastActionMessage}</span>
            </div>
          </div>
          {soundFeedback && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold shrink-0">
              <Volume2 className="w-3.5 h-3.5" />
              <span>{soundFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* 6 Mandatory Scenario Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 1. Cow Detected (Protected) */}
        <button
          data-demo-scenario="cow"
          onClick={() => handleTriggerScenario('cow')}
          className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-left transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              Protected
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-emerald-950 group-hover:text-emerald-900">
            1. Cow Detected [SIMULATED]
          </h4>
          <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
            Protected species. Safe bio-acoustic exemption verified; repellent strictly silenced.
          </p>
        </button>

        {/* 2. Sparrow Detected (Protected) */}
        <button
          data-demo-scenario="sparrow"
          onClick={() => handleTriggerScenario('sparrow')}
          className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-left transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              Protected
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-emerald-950 group-hover:text-emerald-900">
            2. Sparrow Detected [SIMULATED]
          </h4>
          <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
            Beneficial farmland bird. Audio deterrent remains strictly inactive.
          </p>
        </button>

        {/* 3. Harmful Target Detected (Confirmation Logic) */}
        <button
          data-demo-scenario="harmful"
          onClick={() => handleTriggerScenario('harmful')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer group shadow-2xs relative ${
            confirmationStep === 1
              ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-400/30'
              : confirmationStep >= requiredConfirmations
              ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-400/30'
              : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              confirmationStep === 1
                ? 'bg-amber-200 text-amber-900'
                : confirmationStep >= requiredConfirmations
                ? 'bg-rose-200 text-rose-900'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {confirmationStep === 0
                ? 'Step 1: Test Confirmation'
                : confirmationStep === 1
                ? `Confirmation 1 of ${requiredConfirmations}`
                : 'Target Confirmed!'}
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-rose-900">
            3. Harmful Target [SIMULATED]
          </h4>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            {confirmationStep === 0
              ? 'Click to trigger 1st detection (awaiting 2nd confirmation to prevent false alarm).'
              : confirmationStep === 1
              ? 'Click again to confirm target and activate safe deterrent alert!'
              : 'Target confirmed & alert activated! Click again to repeat scenario.'}
          </p>
        </button>

        {/* 4. Unknown Sound (Log Only) */}
        <button
          data-demo-scenario="unknown"
          onClick={() => handleTriggerScenario('unknown')}
          className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-left transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-xs">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              Uncertain
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-slate-800">
            4. Unknown Sound [SIMULATED]
          </h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Unclassified acoustic pattern. Logged to history without activating repellent.
          </p>
        </button>

        {/* 5. Low-Confidence Prediction (< Threshold) */}
        <button
          data-demo-scenario="low_confidence"
          onClick={() => handleTriggerScenario('low_confidence')}
          className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-left transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              Confidence &lt; 70%
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-amber-900">
            5. Low-Confidence [SIMULATED]
          </h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Confidence score (38.5%) falls below threshold. Recorded as uncertain; deterrent suppressed.
          </p>
        </button>

        {/* 6. Simulated Classifier Error */}
        <button
          data-demo-scenario="error"
          onClick={() => handleTriggerScenario('error')}
          className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-left transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-700 text-white flex items-center justify-center shadow-xs">
              <XCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
              Model Diagnostic
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-rose-950 group-hover:text-rose-900">
            6. Classifier Error [SIMULATED]
          </h4>
          <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
            Displays honest explanation: &ldquo;Classification model unavailable &mdash; audio input is working, but species identification is not available.&rdquo;
          </p>
        </button>
      </div>
    </div>
  );
}
