import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  Sparkles,
  Droplets,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  Calculator,
  Leaf,
  Cpu,
  RefreshCw,
  Scale,
  ShieldCheck,
  Flame,
  ArrowRight
} from 'lucide-react';
import {
  SOIL_TYPES_DETAILED,
  NUTRIENT_DEFICIENCIES,
  calculateSoilHealthScore,
  calculateFertilizerSchedule,
  getOrganicSoilRemedies
} from '../../services/soilIntelligenceService';
import { CROPS_DATABASE } from '../../services/cropPlanningService';
import SoilMonitoringDashboard from './SoilMonitoringDashboard';

export default function SoilHealthPage() {
  const { t } = useTranslation();

  // Mode: 'intelligence' (Soil Health Card & Calculator) vs 'hardware_telemetry' (ESP32 In-situ Bus)
  const [viewMode, setViewMode] = useState('intelligence');

  // Soil Test Values State
  const [selectedSoilType, setSelectedSoilType] = useState('black_soil');
  const [ph, setPh] = useState(7.4);
  const [nitrogen, setNitrogen] = useState(240); // kg/ha
  const [phosphorus, setPhosphorus] = useState(16); // kg/ha
  const [potassium, setPotassium] = useState(260); // kg/ha
  const [organicCarbon, setOrganicCarbon] = useState(0.55); // %
  const [ec, setEc] = useState(0.45); // dS/m

  // Fertilizer Calculator State
  const [targetCropId, setTargetCropId] = useState('cotton');
  const [acreage, setAcreage] = useState(2.0);

  // Active Tab within Soil Intelligence: 'report' | 'calculator' | 'deficiencies' | 'organic'
  const [subTab, setSubTab] = useState('report');

  const currentSoilData = useMemo(() => ({
    soilType: selectedSoilType,
    ph,
    nitrogen,
    phosphorus,
    potassium,
    organicCarbon,
    ec
  }), [selectedSoilType, ph, nitrogen, phosphorus, potassium, organicCarbon, ec]);

  // Derived Calculations
  const soilReport = useMemo(() => calculateSoilHealthScore(currentSoilData), [currentSoilData]);
  const fertSchedule = useMemo(() => calculateFertilizerSchedule(targetCropId, acreage, currentSoilData), [targetCropId, acreage, currentSoilData]);
  const organicRemedies = useMemo(() => getOrganicSoilRemedies(currentSoilData, acreage), [currentSoilData, acreage]);

  const activeSoilMeta = SOIL_TYPES_DETAILED.find(s => s.id === selectedSoilType) || SOIL_TYPES_DETAILED[0];

  const handleApplyPreset = (soilId) => {
    const preset = SOIL_TYPES_DETAILED.find(s => s.id === soilId);
    if (preset) {
      setSelectedSoilType(preset.id);
      setPh(preset.defaultPh);
      setOrganicCarbon(parseFloat(preset.defaultOC));
      setNitrogen(preset.id === 'alluvial_loam' ? 310 : preset.id === 'black_soil' ? 220 : 190);
      setPhosphorus(preset.id === 'alluvial_loam' ? 18 : preset.id === 'black_soil' ? 16 : 10);
      setPotassium(preset.id === 'alluvial_loam' ? 320 : preset.id === 'black_soil' ? 380 : 160);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. HEADER HERO BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-[#26150b] to-emerald-950 text-white p-5 sm:p-7 border border-amber-500/20 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-800/60 border border-amber-400/30 text-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>ICAR & National Soil Health Card (SHC) Protocol</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            Soil Health & Precision Fertilizer Assistant
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-1 max-w-2xl font-medium">
            Analyze soil test parameters (pH, N-P-K, OC, EC), identify nutrient deficiencies from leaf symptoms, and compute growth-stage fertilizer bag requirements.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-white/10 p-1.5 rounded-2xl border border-white/15">
          <button
            onClick={() => setViewMode('intelligence')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'intelligence'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-amber-200 hover:text-white'
            }`}
          >
            Soil Health Card & Dosing
          </button>
          <button
            onClick={() => setViewMode('hardware_telemetry')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              viewMode === 'hardware_telemetry'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-amber-200 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>ESP32 Telemetry</span>
          </button>
        </div>
      </div>

      {viewMode === 'hardware_telemetry' ? (
        <SoilMonitoringDashboard />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* 2. INTERACTIVE SOIL TEST INPUT PANEL */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-900/10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/10">
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Soil Test Parameters (మట్టి పరీక్ష వివరాలు / मृदा परीक्षण)</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                  Enter Your Soil Test Report Values
                </h2>
              </div>

              {/* Quick Soil Preset Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-500">Preset Soil Type:</span>
                <select
                  value={selectedSoilType}
                  onChange={(e) => handleApplyPreset(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {SOIL_TYPES_DETAILED.map(st => (
                    <option key={st.id} value={st.id}>{st.name.split(' (')[0]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input Grid: pH, N, P, K, OC, EC */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* Soil pH */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Soil pH (ఆమ్ల-క్షారత)</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    step="0.1"
                    min="4.0"
                    max="10.0"
                    value={ph}
                    onChange={(e) => setPh(parseFloat(e.target.value) || 7.0)}
                    className="w-full text-xl font-black text-slate-900 bg-transparent focus:outline-none"
                  />
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    ph < 6.0 ? 'bg-amber-100 text-amber-800' : ph > 7.8 ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ph < 6.0 ? 'Acidic' : ph > 7.8 ? 'Alkaline' : 'Neutral'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block">Ideal: 6.5 - 7.5</span>
              </div>

              {/* Nitrogen (N) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nitrogen (నత్రజని - N)</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={nitrogen}
                    onChange={(e) => setNitrogen(parseFloat(e.target.value) || 0)}
                    className="w-full text-xl font-black text-slate-900 bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">kg/ha</span>
                </div>
                <span className={`text-[10px] font-bold ${nitrogen < 200 ? 'text-rose-600' : nitrogen > 400 ? 'text-indigo-600' : 'text-emerald-700'}`}>
                  {nitrogen < 200 ? 'Low (< 280)' : nitrogen > 400 ? 'High (> 560)' : 'Medium (Optimal)'}
                </span>
              </div>

              {/* Phosphorus (P) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phosphorus (భాస్వరం - P)</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={phosphorus}
                    onChange={(e) => setPhosphorus(parseFloat(e.target.value) || 0)}
                    className="w-full text-xl font-black text-slate-900 bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">kg/ha</span>
                </div>
                <span className={`text-[10px] font-bold ${phosphorus < 10 ? 'text-rose-600' : phosphorus > 25 ? 'text-indigo-600' : 'text-emerald-700'}`}>
                  {phosphorus < 10 ? 'Low (< 10)' : phosphorus > 25 ? 'High (> 25)' : 'Medium (Optimal)'}
                </span>
              </div>

              {/* Potassium (K) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Potassium (పొటాష్ - K)</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={potassium}
                    onChange={(e) => setPotassium(parseFloat(e.target.value) || 0)}
                    className="w-full text-xl font-black text-slate-900 bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">kg/ha</span>
                </div>
                <span className={`text-[10px] font-bold ${potassium < 120 ? 'text-rose-600' : potassium > 280 ? 'text-emerald-700' : 'text-emerald-700'}`}>
                  {potassium < 120 ? 'Low (< 120)' : potassium > 280 ? 'High (Sufficient)' : 'Medium'}
                </span>
              </div>

              {/* Organic Carbon (OC %) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Organic Carbon (సేంద్రీయ కర్బనం)</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    step="0.05"
                    value={organicCarbon}
                    onChange={(e) => setOrganicCarbon(parseFloat(e.target.value) || 0.5)}
                    className="w-full text-xl font-black text-slate-900 bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
                <span className={`text-[10px] font-bold ${organicCarbon < 0.5 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {organicCarbon < 0.5 ? 'Low (< 0.5%)' : 'Desirable (> 0.75%)'}
                </span>
              </div>

              {/* Electrical Conductivity (EC) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Salinity EC (లవణీయత)</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    step="0.05"
                    value={ec}
                    onChange={(e) => setEc(parseFloat(e.target.value) || 0.4)}
                    className="w-full text-xl font-black text-slate-900 bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">dS/m</span>
                </div>
                <span className={`text-[10px] font-bold ${ec > 1.5 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {ec > 1.5 ? 'Saline Danger' : 'Normal (< 1.0)'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. SUB-TABS: HEALTH REPORT | FERTILIZER CALCULATOR | DEFICIENCIES | ORGANIC REMEDIES */}
          <div className="flex items-center space-x-2 border-b border-emerald-900/10 pb-2">
            {[
              { id: 'report', label: 'Soil Health Card & Score' },
              { id: 'calculator', label: 'Fertilizer Bag Schedule' },
              { id: 'deficiencies', label: 'Nutrient Deficiency Guide' },
              { id: 'organic', label: 'Organic Soil Conditioning' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  subTab === tab.id
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: SOIL HEALTH REPORT & SCORE */}
          {subTab === 'report' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {/* Score Card */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Overall Soil Vitality Score</span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-5xl font-black text-slate-900">{soilReport.score}</span>
                    <span className="text-sm font-bold text-slate-400">/ 100</span>
                  </div>
                  <div className="mt-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase">
                      {soilReport.rating}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <p className="font-bold text-slate-800">Current Soil Type: {activeSoilMeta.name}</p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{activeSoilMeta.description}</p>
                </div>
              </div>

              {/* Limiting Factors & Improvement Suggestions */}
              <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-sm space-y-4">
                <h3 className="text-base font-black text-slate-900">
                  Soil Diagnostic Findings & Corrective Protocol
                </h3>

                {soilReport.limitingFactors.length > 0 ? (
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Identified Soil Constraints:</span>
                    {soilReport.limitingFactors.map((factor, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All macro and micro-nutrients are within the optimal physiological production range!</span>
                  </div>
                )}

                {soilReport.suggestions.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Recommended Soil Amendments:</span>
                    {soilReport.suggestions.map((sug, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start space-x-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{sug}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FERTILIZER CALCULATOR */}
          {subTab === 'calculator' && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-900/10 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-900/10">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Scientific Fertilizer Bag Calculator & Application Schedule
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated specifically for your soil test status to avoid fertilizer overuse and reduce chemical expenditure
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-1">Target Crop:</span>
                    <select
                      value={targetCropId}
                      onChange={(e) => setTargetCropId(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    >
                      {CROPS_DATABASE.map(c => (
                        <option key={c.id} value={c.id}>{c.name.split(' (')[0]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-1">Farm Area (Acres):</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.25"
                      value={acreage}
                      onChange={(e) => setAcreage(parseFloat(e.target.value) || 1)}
                      className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Total Bags Display */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Urea (46% N)</span>
                  <div className="text-3xl font-black text-emerald-950 mt-1">
                    {fertSchedule.fertilizerBags.urea.bags} Bags
                  </div>
                  <span className="text-xs text-emerald-700">({fertSchedule.fertilizerBags.urea.totalKg} kg) • ~₹{Math.round(fertSchedule.fertilizerBags.urea.bags * 266)}</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">DAP (18-46-0)</span>
                  <div className="text-3xl font-black text-amber-950 mt-1">
                    {fertSchedule.fertilizerBags.dap.bags} Bags
                  </div>
                  <span className="text-xs text-amber-700">({fertSchedule.fertilizerBags.dap.totalKg} kg) • ~₹{Math.round(fertSchedule.fertilizerBags.dap.bags * 1350)}</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">MOP Potash (60% K2O)</span>
                  <div className="text-3xl font-black text-rose-950 mt-1">
                    {fertSchedule.fertilizerBags.mop.bags} Bags
                  </div>
                  <span className="text-xs text-rose-700">({fertSchedule.fertilizerBags.mop.totalKg} kg) • ~₹{Math.round(fertSchedule.fertilizerBags.mop.bags * 1650)}</span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Total Fertilizer Cost</span>
                  <div className="text-3xl font-black text-indigo-950 mt-1">
                    ₹{fertSchedule.estimatedCost.toLocaleString('en-IN')}
                  </div>
                  <span className="text-xs text-indigo-700">Subsidized statutory MRP</span>
                </div>
              </div>

              {/* Stage-wise Split Application Timetable */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Stage-Wise Split Application Timetable:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fertSchedule.splits.map((split, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                        <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-black text-slate-900">{split.stage}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">Timing: {split.timing}</p>
                      <div className="space-y-1 pt-1 border-t border-slate-200 text-slate-700">
                        <p><strong>Urea:</strong> {split.ureaPct}</p>
                        <p><strong>DAP:</strong> {split.dapPct}</p>
                        <p><strong>Potash (MOP):</strong> {split.mopPct}</p>
                        {split.micronutrients !== 'None' && <p><strong>Micro:</strong> {split.micronutrients}</p>}
                      </div>
                      <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-xl border border-slate-200 mt-2">
                        {split.instructions}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NUTRIENT DEFICIENCY GUIDANCE (WITH PHOTOS) */}
          {subTab === 'deficiencies' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {NUTRIENT_DEFICIENCIES.map((def, idx) => (
                  <div key={idx} className="bg-white rounded-3xl overflow-hidden border border-emerald-900/10 shadow-sm flex flex-col justify-between">
                    <div className="h-44 relative bg-slate-100">
                      <img
                        src={def.photoUrl}
                        alt={def.nutrient}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold">
                        {def.nutrient}
                      </div>
                    </div>

                    <div className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div>
                          <strong className="text-slate-800">Visual Leaf Symptoms:</strong>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">{def.symptoms}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
                          <strong>Chemical Corrective Action:</strong> {def.correctiveAction}
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                          <strong>Organic Management:</strong> {def.organicRemedy}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ORGANIC SOIL CONDITIONING */}
          {subTab === 'organic' && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-900/10 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Organic Soil Improvement & Microbial Health Protocols
                </h3>
                <p className="text-xs text-slate-500">
                  Recommended practices to build organic carbon, soil microflora, and moisture retention for {acreage} acres
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {organicRemedies.map((remedy, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-black text-emerald-950">{remedy.title}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold">
                        {remedy.quantity}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 font-medium">
                      <strong>Application Window:</strong> {remedy.applicationTiming}
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {remedy.benefit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
