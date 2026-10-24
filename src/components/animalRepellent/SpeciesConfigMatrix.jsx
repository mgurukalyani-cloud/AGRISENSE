import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  ShieldAlert,
  EyeOff,
  Settings2,
  Check,
  HelpCircle,
  Save,
  RotateCcw,
  Sliders,
  Timer,
  Info,
  AlertTriangle,
  Repeat
} from 'lucide-react';
import {
  getSpeciesProfiles,
  updateSpeciesCategory,
  getAudioSystemStatus,
  updateRepellentConfig
} from '../../services/animalSoundService';

export default function SpeciesConfigMatrix({ onRuleChanged }) {
  const { t } = useTranslation();
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Section 3C Validation & Rule Controls
  const [minConfidence, setMinConfidence] = useState(70);
  const [confirmationCount, setConfirmationCount] = useState(2);
  const [alertCooldown, setAlertCooldown] = useState(60);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await getSpeciesProfiles();
      if (data && data.species) {
        setSpeciesList(data.species);
      }
      const status = await getAudioSystemStatus();
      if (status) {
        if (status.confidence_threshold) setMinConfidence(status.confidence_threshold);
        if (status.persistence_required_samples) setConfirmationCount(status.persistence_required_samples);
        if (status.cooldown_period_sec) setAlertCooldown(status.cooldown_period_sec);
      }
    } catch (e) {
      console.error('[SpeciesConfigMatrix] Error loading profiles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleSaveThresholds = async () => {
    setIsSavingConfig(true);
    try {
      await updateRepellentConfig({
        confidence_threshold: minConfidence,
        persistence_required_samples: confirmationCount,
        cooldown_period_sec: alertCooldown
      });
      setSuccessMsg('Classification rules & confirmation parameters updated successfully.');
      if (onRuleChanged) onRuleChanged();
    } catch (err) {
      console.error('[SpeciesConfigMatrix] Save config error:', err);
    } finally {
      setIsSavingConfig(false);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const handleCategoryChange = async (speciesKey, newCategory) => {
    setSavingKey(speciesKey);
    setSuccessMsg(null);
    try {
      // Optimistic local update
      setSpeciesList((prev) =>
        prev.map((s) =>
          s.key === speciesKey
            ? { ...s, farmer_category: newCategory, is_protected: newCategory === 'beneficial' }
            : s
        )
      );

      const res = await updateSpeciesCategory(speciesKey, newCategory);
      if (res && res.success) {
        setSuccessMsg(`Rule updated: ${speciesKey.replace('_', ' ').toUpperCase()} marked as ${newCategory.toUpperCase()}`);
        if (onRuleChanged) onRuleChanged();
      }
    } catch (err) {
      console.error('[SpeciesConfigMatrix] Update category error:', err);
    } finally {
      setSavingKey(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-emerald-900/10 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/10">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-emerald-600" />
            {t('animalRepellent.speciesConfigTitle', 'Farmer Species Category Matrix')}
          </h3>
          <p className="text-xs text-slate-500">
            Configure how AgriSense responds to each sound. Beneficial animals are strictly protected and never repelled.
          </p>
        </div>

        {successMsg && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Section 3C: Classifier Validation & Protection Parameters */}
      <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <h4 className="font-black text-xs sm:text-sm text-slate-800">
              Protection Rule Validation & Alert Parameters
            </h4>
          </div>
          <button
            onClick={handleSaveThresholds}
            disabled={isSavingConfig}
            className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingConfig ? 'Saving...' : 'Apply Validation Rules'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Minimum Classifier Confidence Validation */}
          <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Min Classifier Confidence
              </span>
              <span className="font-mono font-black text-emerald-700">{minConfidence}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer h-2"
            />
            <p className="text-[10px] text-slate-400">
              Detections below {minConfidence}% are classified as Uncertain and never trigger automated repellents.
            </p>
          </div>

          {/* 2. Confirmation Count (Persistence Filter) */}
          <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                Confirmation Count
              </span>
              <span className="font-mono font-black text-slate-900">{confirmationCount} Samples</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={confirmationCount}
              onChange={(e) => setConfirmationCount(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer h-2"
            />
            <p className="text-[10px] text-slate-400">
              Requires {confirmationCount} consistent sound detection samples within 15 seconds to eliminate transient false alarms.
            </p>
          </div>

          {/* 3. Alert Cooldown Period */}
          <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-emerald-600" />
                Alert Cooldown
              </span>
              <span className="font-mono font-black text-slate-900">{alertCooldown}s</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="10"
              value={alertCooldown}
              onChange={(e) => setAlertCooldown(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer h-2"
            />
            <p className="text-[10px] text-slate-400">
              Enforces a {alertCooldown}s quiet interval after an activation to prevent wildlife habituation and noise pollution.
            </p>
          </div>
        </div>
      </div>

      {/* Prominent Educational Notice on Frequency Band Overlap */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h5 className="font-black text-emerald-900 text-xs uppercase tracking-wide">
            Bio-Acoustic Principle: Why Frequency Thresholds Alone Cannot Classify Animals
          </h5>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            A single frequency threshold alone <strong>cannot reliably distinguish animal species</strong> because beneficial livestock and crop pests frequently share overlapping acoustic bands. For example, <strong>wild boar grunts and cattle moos both occupy 150–400 Hz</strong>, while <strong>beneficial sparrow chirps and destructive rodent squeaks both span 3,000–6,500 Hz</strong>. AgriSense extracts <strong>131 bio-acoustic features</strong> (MFCCs, spectral centroid, spectral roll-off, zero-crossing rate, and temporal energy dynamics) processed through a trained PyTorch neural classifier to ensure protected species are never repelled.
          </p>
        </div>
      </div>

      {/* Species Matrix Table / Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
              <th className="py-2.5 px-3">Species / Sound</th>
              <th className="py-2.5 px-3">Bio-Acoustic Band</th>
              <th className="py-2.5 px-3">Farm Impact Rationale</th>
              <th className="py-2.5 px-3 text-right">Farmer Rule Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {speciesList.map((item) => {
              const currentCategory = item.farmer_category || item.default_category || 'ignore';
              const isBeneficial = currentCategory === 'beneficial';
              const isHarmful = currentCategory === 'harmful';
              const isIgnore = currentCategory === 'ignore';
              const isSaving = savingKey === item.key;

              return (
                <tr key={item.key} className="hover:bg-slate-50/80 transition-colors">
                  {/* Name & Scientific */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 italic">
                      {item.scientific_name}
                    </div>
                  </td>

                  {/* Frequencies */}
                  <td className="py-3 px-3">
                    <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                      {item.min_freq} - {item.max_freq} Hz
                    </span>
                  </td>

                  {/* Description */}
                  <td className="py-3 px-3 text-slate-600 max-w-xs">
                    <p className="line-clamp-2 text-[11px]">
                      {item.description}
                    </p>
                  </td>

                  {/* Action Segmented Toggle */}
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/80 gap-1">
                      {/* Beneficial Option */}
                      <button
                        onClick={() => handleCategoryChange(item.key, 'beneficial')}
                        disabled={isSaving}
                        title="Mark as Protected Beneficial: Never Repel"
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          isBeneficial
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-slate-500 hover:text-emerald-800 hover:bg-white/60'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Beneficial</span>
                      </button>

                      {/* Harmful Option */}
                      <button
                        onClick={() => handleCategoryChange(item.key, 'harmful')}
                        disabled={isSaving}
                        title="Mark as Harmful Pest: Repel with safe targeted deterrent"
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          isHarmful
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-amber-800 hover:bg-white/60'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Harmful</span>
                      </button>

                      {/* Ignore Option */}
                      <button
                        onClick={() => handleCategoryChange(item.key, 'ignore')}
                        disabled={isSaving}
                        title="Mark as Ambient Noise: Log only"
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          isIgnore
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                        }`}
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ignore</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
