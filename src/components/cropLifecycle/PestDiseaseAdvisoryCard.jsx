import React, { useState } from 'react';
import { 
  ShieldAlert, Bug, Leaf, AlertOctagon, CheckCircle2, ChevronRight, 
  HelpCircle, Eye, Droplet, Clock, ShieldCheck, Thermometer 
} from 'lucide-react';

export default function PestDiseaseAdvisoryCard({ cropRecord, lifecycle, cropProtectionData, onSelectDiagnosis, lang = 'en' }) {
  const isTe = lang === 'te';
  const { allAvailableDiagnoses, stageRelevantDiagnoses, activeDiagnosis } = cropProtectionData || {};

  const [selectedKey, setSelectedKey] = useState(activeDiagnosis?.id || '');

  if (!cropProtectionData || !activeDiagnosis) return null;

  const currentItem = allAvailableDiagnoses.find((d) => d.id === selectedKey) || activeDiagnosis;

  const handleSelect = (key) => {
    setSelectedKey(key);
    if (onSelectDiagnosis) {
      const found = allAvailableDiagnoses.find((d) => d.id === key);
      onSelectDiagnosis(found);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-white">
              {isTe ? 'సస్యరక్షణ & తెగుళ్ళ నిర్ధారణ (Pest & Disease Advisory)' : 'Crop Protection & Diagnostic Advisory'}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {isTe 
              ? 'లక్షణాల ఆధారంగా నిర్ధారణ — ఎల్లప్పుడూ జీవనియంత్రణకు మొదటి ప్రాధాన్యత' 
              : 'Symptom-driven diagnosis with ICAR & CIBRC approved IPM management'}
          </p>
        </div>

        {/* Severity indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{isTe ? 'ప్రమాద తీవ్రత:' : 'Severity:'}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
            currentItem.severityLevel === 'High' 
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' 
              : currentItem.severityLevel === 'Moderate'
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
          }`}>
            {currentItem.severityLevel}
          </span>
        </div>
      </div>

      {/* Symptom / Problem Selector Pills */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>{isTe ? 'గమనించిన లక్షణాలు / సమస్యను ఎంచుకోండి:' : 'Select Observed Crop Symptoms or Pest Problem:'}</span>
          <span className="text-[11px] font-normal text-emerald-400">
            {stageRelevantDiagnoses.length} {isTe ? 'ప్రస్తుత దశకు సంబంధించినవి' : 'relevant for current stage'}
          </span>
        </label>
        
        <div className="flex flex-wrap gap-2">
          {allAvailableDiagnoses.map((item) => {
            const isSelected = item.id === (selectedKey || activeDiagnosis.id);
            const isRelevant = stageRelevantDiagnoses.some((d) => d.id === item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-950'
                    : isRelevant
                      ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:bg-slate-800'
                }`}
              >
                {item.type === 'pest' ? <Bug className="w-3.5 h-3.5" /> : <Leaf className="w-3.5 h-3.5" />}
                <span>{isTe ? item.teluguName : item.name}</span>
                {isRelevant && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Diagnosis Overview */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {isTe ? currentItem.teluguName : currentItem.name}
              </span>
              <span className="text-[11px] font-mono text-slate-400 italic">
                ({currentItem.scientificName})
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              <strong className="text-slate-200">{isTe ? 'క్షేత్ర లక్షణాలు:' : 'Visible Symptoms:'}</strong> {currentItem.symptoms}
            </p>
          </div>
        </div>

        {/* Differential diagnosis vs nutrient deficiency */}
        {currentItem.differentialDiagnosis && (
          <div className="p-3 rounded-lg bg-teal-950/30 border border-teal-500/30 flex items-start gap-2.5 text-xs text-teal-200">
            <HelpCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-teal-300">{isTe ? 'పోషక లోపంతో పోల్చి చూసే విధానం:' : 'Differential Diagnosis vs Nutrient Deficiency:'}</strong>{' '}
              <span>{currentItem.differentialDiagnosis}</span>
            </div>
          </div>
        )}
      </div>

      {/* Two-Column Management: Non-Chemical IPM vs CIBRC Chemical Treatment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Step 1: Non-Chemical Preventive & Cultural Controls */}
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5">
              <ShieldCheck className="w-4 h-4" />
              <span>{isTe ? '1. జీవ & సేంద్రియ నివారణ పద్ధతులు (IPM First)' : '1. Non-Chemical & Cultural IPM (First Priority)'}</span>
            </div>
            <ul className="space-y-2">
              {currentItem.preventiveAndCultural.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-300/80 italic">
            {isTe ? 'రసాయన మందులు పిచికారీ చేయడానికి ముందు ఈ నివారణ చర్యలను పాటించండి.' : 'Adopt biological controls and sticky traps before attempting synthetic sprays.'}
          </p>
        </div>

        {/* Step 2: CIBRC-Approved Chemical Prescription */}
        <div className="bg-slate-950/80 border border-rose-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-2.5">
            <AlertOctagon className="w-4 h-4" />
            <span>{isTe ? '2. సి.ఐ.బి.ఆర్.సి ధృవీకరించిన రసాయన మందు' : '2. CIBRC-Registered Chemical Treatment'}</span>
          </div>

          {currentItem.chemicalManagement ? (
            <div className="space-y-2.5">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-400">{isTe ? 'సిఫార్సు చేసిన బ్రాండ్ & కాంపౌండ్' : 'Recommended Commercial Brand & Chemical'}</span>
                <span className="text-sm font-bold text-white block">
                  {currentItem.chemicalManagement.commercialBrand}
                </span>
                <span className="text-xs text-rose-300 font-mono">
                  {currentItem.chemicalManagement.activeIngredient}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">{isTe ? 'ఎకరానికి మోతాదు' : 'Dose per Acre'}</span>
                  <strong className="text-white">{currentItem.chemicalManagement.dosePerAcre}</strong>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">{isTe ? 'లీటరు నీటికి' : 'Dose per Litre'}</span>
                  <strong className="text-white">{currentItem.chemicalManagement.dosePerLitre}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 p-2 rounded-lg flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isTe ? 'నీటి పరిమాణం' : 'Water Volume'}</span>
                    <strong className="text-white">{currentItem.chemicalManagement.waterRequirementLiters} L / Acre</strong>
                  </div>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isTe ? 'సురక్షిత వ్యవధి (PHI)' : 'Waiting Period (PHI)'}</span>
                    <strong className="text-white">{currentItem.chemicalManagement.phiDays} {isTe ? 'రోజులు' : 'Days'}</strong>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 flex items-start gap-1.5 pt-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">{isTe ? 'పిచికారీ సమయం:' : 'Timing:'}</strong> {currentItem.chemicalManagement.sprayTiming}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 p-4 text-center">
              {isTe ? 'ఈ దశలో రసాయన పిచికారీ అవసరం లేదు.' : 'No chemical intervention justified at current economic threshold.'}
            </div>
          )}
        </div>
      </div>

      {/* Safety & PPE Precautions */}
      {currentItem.chemicalManagement && (
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{isTe ? 'పిచికారీ జాగ్రత్తలు & వ్యక్తిగత రక్షణ పరికరాలు (PPE)' : 'Mandatory Spraying Safety & Protective Equipment'}</span>
          </div>
          <p>
            {currentItem.chemicalManagement.ppePrecautions}
          </p>
        </div>
      )}
    </div>
  );
}
