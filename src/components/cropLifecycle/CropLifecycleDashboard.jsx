import React, { useState, useEffect } from 'react';
import { 
  Sprout, Plus, Edit3, Trash2, History, Globe, Sparkles, AlertTriangle, 
  CheckCircle, Droplets, Layers, Calendar, MessageSquare, RefreshCw 
} from 'lucide-react';

import { 
  getRegisteredCrops, getActiveCropId, setActiveCropId, deleteRegisteredCrop,
  calculateCropLifecycle, calculatePrecisionFertilizers, diagnoseCropProtection,
  CROP_KNOWLEDGE_BASE 
} from '../../services/cropLifecycleService';

import CropRegistrationModal from './CropRegistrationModal';
import CropLifecycleTimeline from './CropLifecycleTimeline';
import FertilizerAdvisoryCard from './FertilizerAdvisoryCard';
import PestDiseaseAdvisoryCard from './PestDiseaseAdvisoryCard';
import CropVoicePlayerBar from './CropVoicePlayerBar';
import ApplicationHistoryModal from './ApplicationHistoryModal';

export default function CropLifecycleDashboard({ onOpenAssistantWithContext }) {
  const [lang, setLang] = useState('en'); // 'en' or 'te'
  const isTe = lang === 'te';

  const [crops, setCrops] = useState([]);
  const [activeCropId, setActiveCropIdState] = useState(null);

  // Modals state
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Active crop derived calculations
  const [lifecycle, setLifecycle] = useState(null);
  const [fertilizerResult, setFertilizerResult] = useState(null);
  const [cropProtectionData, setCropProtectionData] = useState(null);

  // Load registered crops from local storage
  const reloadCrops = () => {
    const list = getRegisteredCrops();
    setCrops(list);
    const activeId = getActiveCropId();
    if (activeId && list.some((c) => c.id === activeId)) {
      setActiveCropIdState(activeId);
    } else if (list.length > 0) {
      setActiveCropIdState(list[0].id);
      setActiveCropId(list[0].id);
    } else {
      setActiveCropIdState(null);
    }
  };

  useEffect(() => {
    reloadCrops();
  }, []);

  const activeCrop = crops.find((c) => c.id === activeCropId) || crops[0] || null;

  // Recalculate agronomic models whenever activeCrop changes
  useEffect(() => {
    if (!activeCrop) {
      setLifecycle(null);
      setFertilizerResult(null);
      setCropProtectionData(null);
      return;
    }

    // 1. Calculate Crop Lifecycle
    const lc = calculateCropLifecycle(activeCrop);
    setLifecycle(lc);

    // 2. Calculate Precision Fertilizer & Bag Counts
    const fert = calculatePrecisionFertilizers(activeCrop, lc);
    setFertilizerResult(fert);

    // 3. Calculate Pest & Protection Data
    const prot = diagnoseCropProtection(activeCrop.cropId, null, lc?.currentStage?.id);
    setCropProtectionData(prot);
  }, [activeCrop]);

  const handleSwitchCrop = (id) => {
    setActiveCropIdState(id);
    setActiveCropId(id);
  };

  const handleEditActiveCrop = () => {
    setEditingCrop(activeCrop);
    setIsRegModalOpen(true);
  };

  const handleAddNewCrop = () => {
    setEditingCrop(null);
    setIsRegModalOpen(true);
  };

  const handleDeleteActiveCrop = () => {
    if (!activeCrop) return;
    const confirmText = isTe 
      ? `మీరు "${activeCrop.cropId.toUpperCase()}" పంట రికార్డును తొలగించాలనుకుంటున్నారా?` 
      : `Are you sure you want to delete this ${activeCrop.cropId.toUpperCase()} crop record?`;
    if (window.confirm(confirmText)) {
      deleteRegisteredCrop(activeCrop.id);
      reloadCrops();
    }
  };

  const handleCropSaved = () => {
    reloadCrops();
  };

  const handleDiagnosisSelected = (diag) => {
    if (cropProtectionData) {
      setCropProtectionData({
        ...cropProtectionData,
        activeDiagnosis: diag
      });
    }
  };

  const handleAskAssistant = () => {
    if (!onOpenAssistantWithContext || !activeCrop || !lifecycle || !fertilizerResult) return;
    
    const cropSpec = CROP_KNOWLEDGE_BASE[activeCrop.cropId];
    const cropName = cropSpec ? cropSpec.name : activeCrop.cropId;
    const stageName = lifecycle.currentStage.name;
    const ureaBags = fertilizerResult.commercialProducts.urea.totalBags;
    const dapBags = fertilizerResult.commercialProducts.dap.totalBags;
    const mopBags = fertilizerResult.commercialProducts.mop.totalBags;

    const initialQuery = isTe 
      ? `నా ${cropName} పంట (${activeCrop.areaAcres} ఎకరాలు, ${lifecycle.daysAfterSowing} రోజుల వయస్సు) ప్రస్తుతం ${lifecycle.currentStage.teluguName}లో ఉంది. దీనికి ఎరువులు, నీటి యాజమాన్యం మరియు చీడపీడల నివారణ గురించి పూర్తి వివరాలు తెలపండి.` 
      : `My registered ${cropName} crop (${activeCrop.areaAcres} acres, ${lifecycle.daysAfterSowing} DAS) is at ${stageName}. Tell me complete advice on fertilizer dose (${ureaBags} bags Urea, ${dapBags} bags DAP, ${mopBags} bags MOP) and pest precautions.`;

    onOpenAssistantWithContext({
      query: initialQuery,
      activeCrop,
      lifecycle,
      fertilizerResult
    });
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {isTe ? 'పంట జీవిత చక్రం & ఖచ్చిత ఎరువుల సిఫార్సు' : 'Crop Lifecycle & Precision Advisory'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ICAR / SAU
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTe 
                  ? 'శాస్త్రీయ వ్యవసాయ సిఫార్సులు, ఎరువుల బస్తాల లెక్కింపు మరియు సస్యరక్షణ' 
                  : 'Deterministic agronomic calculation engine with bilingual voice support'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls: Language Toggle & Add Crop */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dual Language Switcher */}
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Globe className="w-4 h-4" />
            <span>{isTe ? 'భాష: తెలుగు' : 'Lang: English'}</span>
          </button>

          {/* Ask AI Button */}
          {onOpenAssistantWithContext && (
            <button
              type="button"
              onClick={handleAskAssistant}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-900/40 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isTe ? 'AI సహాయకుడిని అడగండి' : 'Ask AI Assistant'}</span>
            </button>
          )}

          {/* Add Crop Button */}
          <button
            type="button"
            onClick={handleAddNewCrop}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isTe ? 'కొత్త పంట నమోదు' : 'Register New Crop'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Crop Switcher Tabs */}
      {crops.length > 0 && (
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-2 shrink-0">
            {crops.map((c) => {
              const isActive = c.id === activeCropId;
              const cropSpec = CROP_KNOWLEDGE_BASE[c.cropId];
              const varietySpec = cropSpec?.varieties.find((v) => v.id === c.varietyId);
              const label = `${cropSpec ? cropSpec.name.split(' ')[0] : c.cropId} (${varietySpec ? varietySpec.name.split(' ')[0] : ''})`;

              return (
                <button
                  key={c.id}
                  onClick={() => handleSwitchCrop(c.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                    isActive 
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-950' 
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${isActive ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {c.areaAcres} ac
                  </span>
                </button>
              );
            })}
          </div>

          {/* Crop Action Buttons (Edit / Delete / Logs) */}
          {activeCrop && (
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors"
                title="View Field Application History"
              >
                <History className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">{isTe ? 'వాడకం చరిత్ర' : 'Field Log'}</span>
              </button>

              <button
                type="button"
                onClick={handleEditActiveCrop}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors"
                title="Edit Crop Details"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{isTe ? 'సవరణ' : 'Edit'}</span>
              </button>

              {crops.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteActiveCrop}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                  title="Delete Crop Record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* When no crop is registered */}
      {crops.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <Sprout className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            {isTe ? 'ఇంకా ఎటువంటి పంట నమోదు కాలేదు' : 'No Crops Registered Yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {isTe 
              ? 'మీ పంట వివరాలను నమోదు చేసి ఖచ్చితమైన ఎరువుల బస్తాల లెక్కింపు మరియు సస్యరక్షణ సలహాలను పొందండి.' 
              : 'Register your crop to track its lifecycle, calculate commercial fertilizer bag doses, and receive CIBRC verified protection advice.'}
          </p>
          <button
            type="button"
            onClick={handleAddNewCrop}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
          >
            {isTe ? 'మొదటి పంటను నమోదు చేయండి' : 'Register Your First Crop'}
          </button>
        </div>
      )}

      {/* Main Content Area when Crop is Active */}
      {activeCrop && lifecycle && fertilizerResult && (
        <>
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <span className="block text-[11px] text-slate-400">{isTe ? 'విస్తీర్ణం & స్థలం' : 'Farm Area & Location'}</span>
              <span className="text-sm font-bold text-white">
                {activeCrop.areaAcres} {isTe ? 'ఎకరాలు' : 'Acres'}
              </span>
              <span className="block text-[10px] text-slate-500 truncate">
                {activeCrop.location?.village || 'Field 1'}, {activeCrop.location?.district || ''}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <span className="block text-[11px] text-slate-400">{isTe ? 'పంట వయస్సు' : 'Crop Age'}</span>
              <span className="text-sm font-bold text-emerald-400">
                {lifecycle.daysAfterTransplanting ? `${lifecycle.daysAfterTransplanting} DAT` : `${lifecycle.daysAfterSowing} DAS`}
              </span>
              <span className="block text-[10px] text-slate-500">
                {lifecycle.daysRemaining} {isTe ? 'రోజుల్లో కోత' : 'days to harvest'}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <span className="block text-[11px] text-slate-400">{isTe ? 'సాగు & నీరు' : 'Method & Irrigation'}</span>
              <span className="text-sm font-bold text-white truncate block">
                {activeCrop.cultivationMethod.replace('_', ' ')}
              </span>
              <span className="block text-[10px] text-slate-500 truncate">
                {activeCrop.irrigationMethod.replace('_', ' ')}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <span className="block text-[11px] text-slate-400">{isTe ? 'మట్టి స్థితి' : 'Soil Health Status'}</span>
              <span className="text-sm font-bold text-teal-400 truncate block">
                {fertilizerResult.isSoilTestBased ? (isTe ? 'పరీక్ష రికార్డు ఉంది' : 'Soil Card Active') : (isTe ? 'సాధారణ సిఫార్సు' : 'Standard RDF')}
              </span>
              <span className="block text-[10px] text-slate-500">
                FYM: {activeCrop.fymAppliedTonnes || 0} t/ac
              </span>
            </div>
          </div>

          {/* Voice Player Bar with Telugu & English Audio */}
          <CropVoicePlayerBar
            cropRecord={activeCrop}
            lifecycle={lifecycle}
            fertilizerResult={fertilizerResult}
            cropProtectionData={cropProtectionData}
            lang={lang}
            onLangChange={(newLang) => setLang(newLang)}
          />

          {/* Visual Lifecycle Timeline */}
          <CropLifecycleTimeline
            cropRecord={activeCrop}
            lifecycle={lifecycle}
            lang={lang}
          />

          {/* Fertilizer Advisory & Commercial Bag Calculator */}
          <FertilizerAdvisoryCard
            cropRecord={activeCrop}
            fertilizerResult={fertilizerResult}
            lang={lang}
          />

          {/* Crop Protection & Pest Advisory */}
          {cropProtectionData && (
            <PestDiseaseAdvisoryCard
              cropRecord={activeCrop}
              lifecycle={lifecycle}
              cropProtectionData={cropProtectionData}
              onSelectDiagnosis={handleDiagnosisSelected}
              lang={lang}
            />
          )}
        </>
      )}

      {/* Registration & Edit Modal */}
      <CropRegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => {
          setIsRegModalOpen(false);
          setEditingCrop(null);
        }}
        initialCrop={editingCrop}
        onSaved={handleCropSaved}
        lang={lang}
      />

      {/* Field Application Log Modal */}
      <ApplicationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        cropRecord={activeCrop}
        lang={lang}
      />
    </div>
  );
}
