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
  ArrowRight
} from 'lucide-react';
import { classifySampleAudioFile } from '../../services/animalSoundService';
import { safePlayer } from '../../services/safeAudioPlayer';

const TEST_SAMPLES = [
  {
    key: 'cow',
    name: 'Cow (Bovine Vocalization)',
    category: 'beneficial',
    categoryLabel: 'Protected Farm Animal',
    url: '/audio/samples/cow_sample.wav',
    freqRange: '100 - 450 Hz',
    harmonics: 'Rich low-order odd & even harmonics',
    expectedAction: 'BENEFICIAL_PROTECTED (Never Repel)'
  },
  {
    key: 'sparrow',
    name: 'House Sparrow (Call & Chirp)',
    category: 'beneficial',
    categoryLabel: 'Protected Beneficial Bird',
    url: '/audio/samples/sparrow_sample.wav',
    freqRange: '2,800 - 6,500 Hz',
    harmonics: 'High-pitch frequency-modulated trill',
    expectedAction: 'BENEFICIAL_PROTECTED (Never Repel)'
  },
  {
    key: 'wild_boar',
    name: 'Wild Boar (Grunt & Squeal)',
    category: 'harmful',
    categoryLabel: 'Target Crop Pest',
    url: '/audio/samples/wild_boar_sample.wav',
    freqRange: '150 - 1,200 Hz',
    harmonics: 'Guttural grunt formant + rough vocal fry',
    expectedAction: 'DETERRENT_ACTIVATED (Safe Apex Bio-Acoustic)'
  },
  {
    key: 'monkey',
    name: 'Rhesus Macaque (Alarm & Chatter)',
    category: 'harmful',
    categoryLabel: 'Target Crop Pest',
    url: '/audio/samples/monkey_sample.wav',
    freqRange: '700 - 3,200 Hz',
    harmonics: 'Shrill pant-screams + chaotic frequency flutter',
    expectedAction: 'DETERRENT_ACTIVATED (Safe Raptor Bio-Acoustic)'
  },
  {
    key: 'crow',
    name: 'Crow (Harsh Cawing)',
    category: 'harmful',
    categoryLabel: 'Target Crop Pest',
    url: '/audio/samples/crow_sample.wav',
    freqRange: '900 - 2,600 Hz',
    harmonics: 'Wide harmonic formant bursts + pulsed caws',
    expectedAction: 'DETERRENT_ACTIVATED (Corvid Dispersal Pulse)'
  },
  {
    key: 'deer',
    name: 'Spotted Deer (Snort & Bark)',
    category: 'harmful',
    categoryLabel: 'Target Crop Grazer',
    url: '/audio/samples/deer_sample.wav',
    freqRange: '400 - 1,800 Hz',
    harmonics: 'Sudden explosive onset + breathy air turbulence',
    expectedAction: 'DETERRENT_ACTIVATED (Predator Rustle Tone)'
  },
  {
    key: 'rodent',
    name: 'Field Rat (High Squeak)',
    category: 'harmful',
    categoryLabel: 'Target Crop Pest',
    url: '/audio/samples/rodent_sample.wav',
    freqRange: '4,200 - 8,500 Hz',
    harmonics: 'Ultrasonic fringe pulses + rapid burst cadence',
    expectedAction: 'DETERRENT_ACTIVATED (Barn Owl Screech Snippet)'
  },
  {
    key: 'farm_machinery',
    name: 'Farm Tractor / Diesel Pump',
    category: 'ignore',
    categoryLabel: 'Ambient Farm Machinery',
    url: '/audio/samples/farm_machinery_sample.wav',
    freqRange: '40 - 250 Hz',
    harmonics: 'Continuous low-frequency diesel engine strokes',
    expectedAction: 'AMBIENT_IGNORED (Normal Farm Noise)'
  },
  {
    key: 'wind_rain',
    name: 'Weather Noise (Wind & Rain)',
    category: 'ignore',
    categoryLabel: 'Ambient Weather Noise',
    url: '/audio/samples/wind_rain_sample.wav',
    freqRange: '20 - 8,000 Hz',
    harmonics: 'Broadband pink noise + droplet transients',
    expectedAction: 'AMBIENT_IGNORED (Weather Filtered)'
  },
  {
    key: 'human_voice',
    name: 'Human Voice (Farmer Speech)',
    category: 'ignore',
    categoryLabel: 'Ambient Human Voice',
    url: '/audio/samples/human_voice_sample.wav',
    freqRange: '100 - 3,400 Hz',
    harmonics: 'Vowel formants (F1/F2) + speech cadence',
    expectedAction: 'AMBIENT_IGNORED (Speech Filtered)'
  }
];

export default function AudioSampleTesterCard({ onDetectionEvent, onRefreshStatus }) {
  const { t } = useTranslation();
  const [testingSampleKey, setTestingSampleKey] = useState(null);
  const [sampleResult, setSampleResult] = useState(null);
  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all' | 'beneficial' | 'harmful' | 'ambient'
  const [scenarioRunning, setScenarioRunning] = useState(false);

  const handleTestSample = async (sample) => {
    setTestingSampleKey(sample.key);
    setSampleResult(null);

    try {
      // 1. Play audio safely
      safePlayer.playSound(sample.url, sample.name, 2.5);

      // 2. Classify via backend
      const result = await classifySampleAudioFile(sample.url, sample.name);
      setSampleResult(result);
      if (onDetectionEvent) onDetectionEvent(result.event || result);
      if (onRefreshStatus) onRefreshStatus();

      // If automated repellent was triggered by backend and sound payload returned
      if (result.action_taken === 'DETERRENT_ACTIVATED' && result.deterrent_payload) {
        setTimeout(() => {
          safePlayer.playSound(
            result.deterrent_payload.sound_file,
            result.deterrent_payload.description,
            result.deterrent_payload.duration_sec || 3.0
          );
        }, 800);
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

      // Sample 1: First detection -> Should result in PERSISTENCE_PENDING
      safePlayer.playSound(boarSample.url, 'Wild Boar (Sample 1/2)', 2.0);
      const res1 = await classifySampleAudioFile(boarSample.url, 'Wild Boar (Sample 1/2)');
      setSampleResult(res1);
      if (onDetectionEvent) onDetectionEvent(res1.event || res1);

      // Wait 1.5 seconds
      await new Promise((r) => setTimeout(r, 1500));

      // Sample 2: Persistent detection -> Should trigger DETERRENT_ACTIVATED
      safePlayer.playSound(boarSample.url, 'Wild Boar (Sample 2/2 - Persistent)', 2.0);
      const res2 = await classifySampleAudioFile(boarSample.url, 'Wild Boar (Sample 2/2 - Persistent)');
      setSampleResult(res2);
      if (onDetectionEvent) onDetectionEvent(res2.event || res2);
      if (onRefreshStatus) onRefreshStatus();

      // Trigger deterrent playback
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
    if (activeTabFilter === 'all') return true;
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

          return (
            <div
              key={sample.key}
              className={`p-3.5 rounded-2xl border transition-all ${
                isBeneficial
                  ? 'bg-emerald-50/60 border-emerald-200/80 hover:border-emerald-400'
                  : isHarmful
                  ? 'bg-amber-50/60 border-amber-200/80 hover:border-amber-400'
                  : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-400'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${
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

              {/* Trigger Button */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center gap-2">
                <button
                  data-sample-key={sample.key}
                  onClick={() => handleTestSample(sample)}
                  disabled={isTesting}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${

                    isBeneficial
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : isHarmful
                      ? 'bg-amber-700 hover:bg-amber-800 text-white'
                      : 'bg-slate-700 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Analyzing...' : 'Test Sound'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Result Card Banner if tested */}
      {sampleResult && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 border border-slate-800 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Latest Bio-Acoustic Test Result
            </span>
            <span className="text-xs font-mono text-slate-400">
              Confidence: {sampleResult.confidence}%
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm sm:text-base font-bold text-white">
                {sampleResult.species_info?.name || sampleResult.predicted_class}
                <span className="text-slate-400 text-xs font-normal ml-2">
                  ({sampleResult.species_info?.scientific_name})
                </span>
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                {sampleResult.status_message}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                sampleResult.category === 'beneficial'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : sampleResult.category === 'harmful'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {sampleResult.action_taken}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
