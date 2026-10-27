import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Volume2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Radio,
  VolumeX,
  X
} from 'lucide-react';
import { classifySampleAudioFile } from '../../services/animalSoundService';
import { safePlayer } from '../../services/safeAudioPlayer';

const TEST_SAMPLES = [
  {
    key: 'cow',
    name: 'Cow (Bovine Vocalization)',
    category: 'beneficial',
    categoryLabel: 'Protected Farm Animal',
    url: './audio/samples/cow_sample.wav',
    freqRange: '100 - 450 Hz',
    harmonics: 'Rich low-order odd & even harmonics',
    expectedAction: 'BENEFICIAL_PROTECTED (Never Repel)'
  },
  {
    key: 'sparrow',
    name: 'House Sparrow (Call & Chirp)',
    category: 'beneficial',
    categoryLabel: 'Protected Beneficial Bird',
    url: './audio/samples/sparrow_sample.wav',
    freqRange: '2,800 - 6,500 Hz',
    harmonics: 'High-pitch frequency-modulated trill',
    expectedAction: 'BENEFICIAL_PROTECTED (Never Repel)'
  },
  {
    key: 'wild_boar',
    name: 'Wild Boar (Grunt & Squeal)',
    category: 'harmful',
    categoryLabel: 'Target Crop Pest',
    url: './audio/samples/wild_boar_sample.wav',
    freqRange: '150 - 1,200 Hz',
    harmonics: 'Guttural grunt formant + rough vocal fry',
    expectedAction: 'DETERRENT_ACTIVATED (Safe Apex Bio-Acoustic)'
  },
  {
    key: 'monkey',
    name: 'Rhesus Macaque (Alarm & Chatter)',
    category: 'harmful',
    categoryLabel: 'Target Crop Pest',
    url: './audio/samples/monkey_sample.wav',
    freqRange: '700 - 3,200 Hz',
    harmonics: 'Shrill pant-screams + chaotic frequency flutter',
    expectedAction: 'DETERRENT_ACTIVATED (Safe Raptor Bio-Acoustic)'
  },
  {
    key: 'crow',
    name: 'Crow (Harsh Cawing)',
    category: 'harmful',
    categoryLabel: 'Target Crop Pest',
    url: './audio/samples/crow_sample.wav',
    freqRange: '900 - 2,600 Hz',
    harmonics: 'Wide harmonic formant bursts + pulsed caws',
    expectedAction: 'DETERRENT_ACTIVATED (Corvid Dispersal Pulse)'
  },
  {
    key: 'deer',
    name: 'Spotted Deer (Snort & Bark)',
    category: 'harmful',
    categoryLabel: 'Target Crop Grazer',
    url: './audio/samples/deer_sample.wav',
    freqRange: '400 - 1,800 Hz',
    harmonics: 'Sudden explosive onset + breathy air turbulence',
    expectedAction: 'DETERRENT_ACTIVATED (Predator Rustle Tone)'
  },
  {
    key: 'rodent',
    name: 'Field Rat (High Squeak)',
    category: 'harmful',
    categoryLabel: 'Target Crop Pest',
    url: './audio/samples/rodent_sample.wav',
    freqRange: '4,200 - 8,500 Hz',
    harmonics: 'Ultrasonic fringe pulses + rapid burst cadence',
    expectedAction: 'DETERRENT_ACTIVATED (Barn Owl Screech Snippet)'
  },
  {
    key: 'farm_machinery',
    name: 'Farm Tractor / Diesel Pump',
    category: 'ignore',
    categoryLabel: 'Ambient Farm Machinery',
    url: './audio/samples/farm_machinery_sample.wav',
    freqRange: '40 - 250 Hz',
    harmonics: 'Continuous low-frequency diesel engine strokes',
    expectedAction: 'AMBIENT_IGNORED (Normal Farm Noise)'
  },
  {
    key: 'wind_rain',
    name: 'Weather Noise (Wind & Rain)',
    category: 'ignore',
    categoryLabel: 'Ambient Weather Noise',
    url: './audio/samples/wind_rain_sample.wav',
    freqRange: '20 - 8,000 Hz',
    harmonics: 'Broadband pink noise + droplet transients',
    expectedAction: 'AMBIENT_IGNORED (Weather Filtered)'
  },
  {
    key: 'human_voice',
    name: 'Human Voice (Farmer Speech)',
    category: 'ignore',
    categoryLabel: 'Ambient Human Voice',
    url: './audio/samples/human_voice_sample.wav',
    freqRange: '100 - 3,400 Hz',
    harmonics: 'Vowel formants (F1/F2) + speech cadence',
    expectedAction: 'AMBIENT_IGNORED (Speech Filtered)'
  }
];

export default function AudioSampleTesterCard({ onDetectionEvent, onRefreshStatus }) {
  const { t } = useTranslation();
  const [testingSampleKey, setTestingSampleKey] = useState(null);
  const [sampleResult, setSampleResult] = useState(null);
  const [cardResults, setCardResults] = useState({});
  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all' | 'beneficial' | 'harmful' | 'ambient'
  const [scenarioRunning, setScenarioRunning] = useState(false);

  const handleTestSample = async (sample) => {
    setTestingSampleKey(sample.key);

    try {
      // 1. Play audio safely
      safePlayer.playSound(sample.url, sample.name, 2.5);

      // 2. Classify via bio-acoustic pipeline
      const result = await classifySampleAudioFile(sample.url, sample.name);
      
      setSampleResult(result);
      setCardResults((prev) => ({ ...prev, [sample.key]: result }));

      if (onDetectionEvent) {
        onDetectionEvent(result.event || result);
      }
      if (onRefreshStatus) {
        onRefreshStatus();
      }

      // If automated repellent was triggered and sound payload returned
      if (result.action_taken === 'DETERRENT_ACTIVATED' && result.deterrent_payload) {
        setTimeout(() => {
          safePlayer.playSound(
            result.deterrent_payload.sound_file,
            result.deterrent_payload.description,
            result.deterrent_payload.duration_sec || 3.0
          );
        }, 900);
      }
    } catch (err) {
      console.error('[AudioSampleTester] Error testing sample:', err);
    } finally {
      setTestingSampleKey(null);
    }
  };

  // Run automated 2-sample persistence demonstration
  const handleRunPersistenceScenario = async () => {
    setScenarioRunning(true);
    try {
      const boarSample = TEST_SAMPLES.find((s) => s.key === 'wild_boar');
      if (!boarSample) return;

      // Sample 1: First detection
      safePlayer.playSound(boarSample.url, 'Wild Boar (Sample 1/2)', 2.0);
      const res1 = await classifySampleAudioFile(boarSample.url, 'Wild Boar (Sample 1/2)');
      setSampleResult(res1);
      setCardResults((prev) => ({ ...prev, [boarSample.key]: res1 }));
      if (onDetectionEvent) onDetectionEvent(res1.event || res1);

      await new Promise((r) => setTimeout(r, 1500));

      // Sample 2: Persistent detection
      safePlayer.playSound(boarSample.url, 'Wild Boar (Sample 2/2 - Persistent)', 2.0);
      const res2 = await classifySampleAudioFile(boarSample.url, 'Wild Boar (Sample 2/2 - Persistent)');
      setSampleResult(res2);
      setCardResults((prev) => ({ ...prev, [boarSample.key]: res2 }));
      if (onDetectionEvent) onDetectionEvent(res2.event || res2);
      if (onRefreshStatus) onRefreshStatus();

      if (res2.deterrent_payload) {
        setTimeout(() => {
          safePlayer.playSound(
            res2.deterrent_payload.sound_file,
            res2.deterrent_payload.description,
            res2.deterrent_payload.duration_sec || 3.0
          );
        }, 1000);
      }
    } catch (e) {
      console.error('[Scenario] Persistence test error:', e);
    } finally {
      setScenarioRunning(false);
    }
  };

  const filteredSamples = TEST_SAMPLES.filter((sample) => {
    if (activeTabFilter === 'beneficial') return sample.category === 'beneficial';
    if (activeTabFilter === 'harmful') return sample.category === 'harmful';
    if (activeTabFilter === 'ambient') return sample.category === 'ignore';
    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-emerald-900/10 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/10">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            {t('animalRepellent.soundboardTitle', '1-Click Bio-Acoustic Soundboard & Classifier')}
          </h3>
          <p className="text-xs text-slate-500">
            Click any animal call to test real audio feature extraction, multi-sample persistence, and safe deterrent logic.
          </p>
        </div>

        {/* Demo Persistence Scenario Runner */}
        <button
          onClick={handleRunPersistenceScenario}
          disabled={scenarioRunning}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-green-800 hover:from-emerald-900 hover:to-green-900 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
        >
          <RotateCw className={`w-3.5 h-3.5 ${scenarioRunning ? 'animate-spin' : ''}`} />
          <span>{scenarioRunning ? 'Running Persistence Scenario...' : 'Test 2-Sample Boar Persistence'}</span>
        </button>
      </div>

      {/* Prominent Latest Recognition Result Banner (Appears as soon as test sound is clicked) */}
      {sampleResult && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white space-y-3 border border-emerald-500/30 shadow-lg animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                Acoustic Recognition Output
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded-full text-emerald-300 border border-white/10">
                Confidence: {sampleResult.confidence}%
              </span>
              <button
                onClick={() => setSampleResult(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Dismiss result"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{sampleResult.species_info?.name || sampleResult.predicted_class}</span>
                <span className="text-xs text-emerald-300/80 italic font-normal">
                  ({sampleResult.species_info?.scientific_name})
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {sampleResult.status_message}
              </p>
              
              {sampleResult.audio_metrics && (
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono mt-1.5">
                  <span>Dominant Peak: <strong className="text-white">{sampleResult.audio_metrics.dominant_frequency_hz || 320} Hz</strong></span>
                  <span>•</span>
                  <span>RMS Energy: <strong className="text-white">{sampleResult.audio_metrics.rms_energy || 0.25}</strong></span>
                </div>
              )}
            </div>

            <div className="shrink-0 flex flex-col sm:items-end gap-1.5">
              <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm ${
                sampleResult.category === 'beneficial'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : sampleResult.category === 'harmful'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 ring-1 ring-rose-500/30'
                  : 'bg-slate-700/60 text-slate-300 border border-slate-600'
              }`}>
                {sampleResult.category === 'beneficial' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                {sampleResult.category === 'harmful' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
                {sampleResult.category === 'ignore' && <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />}
                <span>{sampleResult.action_taken}</span>
              </span>

              {sampleResult.deterrent_payload && (
                <button
                  onClick={() => safePlayer.playSound(
                    sampleResult.deterrent_payload.sound_file,
                    sampleResult.deterrent_payload.description,
                    3.0
                  )}
                  className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center space-x-1 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30 cursor-pointer"
                >
                  <Volume2 className="w-3 h-3 text-amber-400" />
                  <span>Replay Deterrent Sound</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Sounds (10)' },
          { id: 'beneficial', label: 'Beneficial (Cow & Sparrow)' },
          { id: 'harmful', label: 'Harmful Pests (5 Species)' },
          { id: 'ambient', label: 'Ambient & Machinery (3)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTabFilter === tab.id
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sample Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSamples.map((sample) => {
          const isBeneficial = sample.category === 'beneficial';
          const isHarmful = sample.category === 'harmful';
          const isTesting = testingSampleKey === sample.key;
          const cardResult = cardResults[sample.key];

          return (
            <div
              key={sample.key}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                cardResult
                  ? cardResult.category === 'beneficial'
                    ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-300/40 shadow-xs'
                    : cardResult.category === 'harmful'
                    ? 'bg-rose-50/80 border-rose-400 ring-1 ring-rose-300/40 shadow-xs'
                    : 'bg-slate-100/80 border-slate-300 shadow-xs'
                  : isBeneficial
                  ? 'bg-emerald-50/50 border-emerald-200/80 hover:border-emerald-400'
                  : isHarmful
                  ? 'bg-amber-50/50 border-amber-200/80 hover:border-amber-400'
                  : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs ${
                      isBeneficial ? 'bg-emerald-700' : isHarmful ? 'bg-amber-600' : 'bg-slate-500'
                    }`}>
                      {isBeneficial ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : isHarmful ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-tight">
                        {sample.name}
                      </h4>
                      <span className={`inline-block text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md mt-0.5 ${
                        isBeneficial
                          ? 'bg-emerald-100 text-emerald-800'
                          : isHarmful
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {sample.categoryLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio-Acoustic specs */}
                <div className="mt-2.5 space-y-1 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Frequency Band:</span>
                    <span className="font-semibold text-slate-700 font-mono">{sample.freqRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Acoustic Rule:</span>
                    <span className={`font-bold ${isBeneficial ? 'text-emerald-700' : isHarmful ? 'text-amber-700' : 'text-slate-600'}`}>
                      {isBeneficial ? 'Never Repel' : isHarmful ? 'Safe Deterrent' : 'Filter / Ignore'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Area: Trigger Button & Inline Result Badge */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
                <button
                  data-sample-key={sample.key}
                  onClick={() => handleTestSample(sample)}
                  disabled={isTesting}
                  className={`w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                    isBeneficial
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : isHarmful
                      ? 'bg-amber-700 hover:bg-amber-800 text-white'
                      : 'bg-slate-700 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Analyzing Sound Wave...' : 'Test Sound'}</span>
                </button>

                {/* Direct Inline Result Card after clicking Test Sound */}
                {cardResult && (
                  <div className={`p-2 rounded-xl text-[10px] font-bold border flex items-center justify-between gap-1.5 shadow-2xs animate-in fade-in duration-200 ${
                    cardResult.category === 'beneficial'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                      : cardResult.category === 'harmful'
                      ? 'bg-rose-100 text-rose-950 border-rose-300'
                      : 'bg-slate-200 text-slate-800 border-slate-300'
                  }`}>
                    <div className="flex items-center space-x-1.5 truncate">
                      {cardResult.category === 'beneficial' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                      {cardResult.category === 'harmful' && <ShieldAlert className="w-3.5 h-3.5 text-rose-700 shrink-0" />}
                      {cardResult.category === 'ignore' && <CheckCircle2 className="w-3.5 h-3.5 text-slate-700 shrink-0" />}
                      <span className="truncate">
                        {cardResult.category === 'beneficial'
                          ? 'Protected Animal • Repellent Suppressed'
                          : cardResult.category === 'harmful'
                          ? 'Target Confirmed • Deterrent Dispatched'
                          : 'Ambient Machinery • Filtered Out'}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded bg-white/80 border border-black/10 shrink-0">
                      {cardResult.confidence}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
