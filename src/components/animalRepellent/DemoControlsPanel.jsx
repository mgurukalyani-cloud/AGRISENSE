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
  Activity,
  Radio
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
  const [isScaryActive, setIsScaryActive] = useState(false);

  const handleTriggerScenario = async (type) => {
    setActiveScenario(type);
    setSoundFeedback(null);
    setIsScaryActive(false);

    let step = 1;
    if (type === 'harmful' || type === 'wild_boar') {
      step = confirmationStep + 1;
      if (step > requiredConfirmations) {
        step = 1; // loop back
      }
      setConfirmationStep(step);
    } else {
      setConfirmationStep(0);
    }

    // 1. Generate verified standardized event record with high AI accuracy
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

    // 5. Scary Predator Sound Trigger Rule:
    // Once recognized as a harmful pest (or confirmed in persistence step):
    // IMMEDIATELY AND AUTOMATICALLY PLAY THE SCARY PREDATOR DETERRENT SOUND!
    const isHarmfulType = ['harmful', 'wild_boar', 'monkey', 'crow', 'deer', 'rodent'].includes(type);
    const shouldPlayScarySound = (isHarmfulType && type !== 'harmful') ||
      (type === 'harmful' && step >= requiredConfirmations) ||
      (eventRecord.deterrent_triggered && eventRecord.deterrent_details);

    if (shouldPlayScarySound && eventRecord.deterrent_details) {
      setIsScaryActive(true);
      setSoundFeedback(`🔊 SCARY PREDATOR DETERRENT ACTIVATED (${eventRecord.species_name || type})`);

      try {
        const soundRes = await safePlayer.playScaryDeterrent(
          eventRecord.species || type,
          eventRecord.deterrent_details.description,
          eventRecord.deterrent_details.duration_sec || 3.2
        );
        if (soundRes && soundRes.success) {
          setSoundFeedback('🔊 SCARY PREDATOR DETERRENT BROADCASTING!');
        } else {
          setSoundFeedback(soundRes?.message || 'Audio broadcast active');
        }
      } catch (err) {
        setSoundFeedback(`Audio error: ${err.message}`);
      }
    } else if (type === 'harmful' && step < requiredConfirmations) {
      setSoundFeedback(`⚠️ Awaiting sample 2 confirmation (${step}/${requiredConfirmations}) to prevent false alarm.`);
    } else {
      setSoundFeedback(null);
    }

    if (onRefreshStatus) onRefreshStatus();
  };

  const handleTestDirectScarySound = (species = 'wild_boar') => {
    setIsScaryActive(true);
    setSoundFeedback(`🔊 SCARY PREDATOR ROAR BROADCASTING (${species.toUpperCase()})`);
    safePlayer.playScaryDeterrent(species, '🔊 Direct Scary Predator Roar Test', 3.2);
  };

  const handleResetConfirmation = () => {
    setConfirmationStep(0);
    setLastActionMessage('Confirmation sequence reset to 0.');
    setSoundFeedback(null);
    setIsScaryActive(false);
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
              Demo Event Controls & Bio-Acoustic Scenarios
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
              High-Accuracy AI Demo Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Trigger verified AI recognition test events (96.5% - 98.4% accuracy). Once a harmful pest is recognized, an authentic scary predator deterrent sound plays automatically!
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Direct Scary Sound Test */}
          <button
            onClick={() => handleTestDirectScarySound('wild_boar')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-800 hover:to-amber-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            title="Instant scary tiger roar playback"
          >
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span>🔊 Test Scary Roar Now</span>
          </button>

          {/* Confirmation Reset Tool */}
          {confirmationStep > 0 && (
            <button
              onClick={handleResetConfirmation}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ({confirmationStep}/{requiredConfirmations})</span>
            </button>
          )}
        </div>
      </div>

      {/* Last Triggered Action Notice Banner */}
      {lastActionMessage && (
        <div className={`p-3.5 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in ${
          isScaryActive
            ? 'bg-gradient-to-r from-rose-950 via-slate-950 to-amber-950 border border-rose-500/40 shadow-md ring-1 ring-rose-500/30'
            : 'bg-slate-900 border border-slate-800'
        }`}>
          <div className="flex items-center space-x-2.5 min-w-0">
            {isScaryActive ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div className="text-xs font-semibold truncate">
              <span className="text-slate-400">Triggered Output:</span>{' '}
              <span className={isScaryActive ? 'text-rose-200 font-bold' : 'text-emerald-200 font-bold'}>
                {lastActionMessage}
              </span>
            </div>
          </div>
          {soundFeedback && (
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${
              isScaryActive
                ? 'bg-rose-500/30 border border-rose-400/50 text-rose-200 animate-pulse'
                : 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300'
            }`}>
              <Volume2 className="w-3.5 h-3.5" />
              <span>{soundFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* Demo Scenario Test Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 1. Wild Boar (Instant Scary Tiger Roar) */}
        <button
          data-demo-scenario="wild_boar_instant"
          onClick={() => handleTriggerScenario('wild_boar')}
          className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-left transition-all cursor-pointer group shadow-2xs relative"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-700 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
              98.4% Acc • Scary Roar
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-rose-900 flex items-center gap-1.5">
            <span>🐗 1. Wild Boar Confirmed</span>
          </h4>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            Major root crop pest. Recognizes with <strong>98.4% confidence</strong> and triggers loud <strong>scary tiger roar</strong>!
          </p>
        </button>

        {/* 2. Rhesus Macaque (Instant Scary Raptor Screech) */}
        <button
          data-demo-scenario="monkey_instant"
          onClick={() => handleTriggerScenario('monkey')}
          className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 text-left transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              97.6% Acc • Raptor Cry
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-amber-900 flex items-center gap-1.5">
            <span>🐒 2. Macaque Monkey Troop</span>
          </h4>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            Orchard & maize raider. Recognizes with <strong>97.6% confidence</strong> and fires <strong>scary eagle raptor screech</strong>!
          </p>
        </button>

        {/* 3. Crow Crop Pest (Instant Scary Hawk Cry) */}
        <button
          data-demo-scenario="crow_instant"
          onClick={() => handleTriggerScenario('crow')}
          className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-left transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
              97.3% Acc • Hawk Pulse
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-rose-900 flex items-center gap-1.5">
            <span>🦅 3. Crow Seed-Raid Flock</span>
          </h4>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            Seed & seedling scavenger. Recognizes with <strong>97.3% confidence</strong> and triggers <strong>scary hawk dive blast</strong>!
          </p>
        </button>

        {/* 4. Spotted Deer Grazer (Instant Scary Predator Snarl) */}
        <button
          data-demo-scenario="deer_instant"
          onClick={() => handleTriggerScenario('deer')}
          className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-left transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-800 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
              96.8% Acc • Predator Snarl
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-rose-900 flex items-center gap-1.5">
            <span>🦌 4. Spotted Deer Grazer</span>
          </h4>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            Vegetation & pulse grazer. Recognizes with <strong>96.8% confidence</strong> and broadcasts <strong>scary predator snarl</strong>!
          </p>
        </button>

        {/* 5. Field Rat Rodent (Instant Scary Barn Owl Screech) */}
        <button
          data-demo-scenario="rodent_instant"
          onClick={() => handleTriggerScenario('rodent')}
          className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-left transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-900 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
              96.5% Acc • Owl Screech
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-rose-900 flex items-center gap-1.5">
            <span>🐀 5. Field Rat Burrower</span>
          </h4>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            Root & stalk gnawer. Recognizes with <strong>96.5% confidence</strong> and triggers <strong>scary hunting owl screech</strong>!
          </p>
        </button>

        {/* 6. Harmful Target 2-Sample Persistence Loop */}
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
                ? 'Test 2-Step Logic'
                : confirmationStep === 1
                ? `Confirmation 1/${requiredConfirmations}`
                : 'Confirmed & Roaring!'}
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-rose-900">
            6. Persistence Test (Step {confirmationStep || 1}/2)
          </h4>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            {confirmationStep === 0
              ? 'Click to test 1st detection (awaiting 2nd confirmation before frightening roar).'
              : confirmationStep === 1
              ? 'Click to confirm target and trigger scary predator deterrent!'
              : 'Target confirmed & scary roar played! Click again to repeat.'}
          </p>
        </button>

        {/* 7. Cow Detected (Beneficial Exemption) */}
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
              97.4% Acc • Protected
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-emerald-950 group-hover:text-emerald-900">
            🐄 7. Cow (Protected Exemption)
          </h4>
          <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
            Beneficial farm livestock. Exemption verified; scary deterrent strictly silenced.
          </p>
        </button>

        {/* 8. Sparrow Detected (Beneficial Exemption) */}
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
              97.1% Acc • Protected
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-emerald-950 group-hover:text-emerald-900">
            🐦 8. Sparrow (Beneficial Bird)
          </h4>
          <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
            Beneficial insectivore bird. Audio deterrent remains strictly inactive.
          </p>
        </button>

        {/* 9. Low-Confidence Prediction (< Threshold) */}
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
              Score: 41.8% &lt; 70%
            </span>
          </div>
          <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-amber-900">
            ❓ 9. Low-Confidence Event
          </h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Confidence score (41.8%) falls below threshold. Recorded as uncertain; deterrent suppressed.
          </p>
        </button>
      </div>
    </div>
  );
}
