import React, { useState, useEffect } from 'react';
import { 
  X, Sprout, Calendar, MapPin, Droplets, Layers, FlaskConical, CheckCircle, 
  HelpCircle, ChevronRight, AlertTriangle 
} from 'lucide-react';
import { 
  CROP_KNOWLEDGE_BASE, SOIL_TYPES, IRRIGATION_METHODS, saveRegisteredCrop 
} from '../../services/cropLifecycleService';

export default function CropRegistrationModal({ isOpen, onClose, initialCrop, onSaved, lang = 'en' }) {
  const isTe = lang === 'te';

  const [formData, setFormData] = useState({
    cropId: 'paddy',
    varietyId: 'bpt_5204',
    cultivationMethod: 'transplanted',
    sowingDate: new Date().toISOString().split('T')[0],
    areaAcres: 2.5,
    expectedDurationDays: 145,
    location: {
      village: 'Kothapalli',
      mandal: 'Miryalaguda',
      district: 'Nalgonda',
      state: 'Telangana'
    },
    irrigationMethod: 'canal_flood',
    soilType: 'clay_loam',
    soilTest: {
      hasSoilTest: false,
      nKgAcre: 110,
      pKgAcre: 6.5,
      kKgAcre: 90,
      ph: 7.2,
      organicCarbonPct: 0.50
    },
    fymAppliedTonnes: 2.0,
    notes: ''
  });

  const [activeStep, setActiveStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialCrop) {
      setFormData({
        ...initialCrop,
        soilTest: initialCrop.soilTest || {
          hasSoilTest: false,
          nKgAcre: 110,
          pKgAcre: 6.5,
          kKgAcre: 90,
          ph: 7.2,
          organicCarbonPct: 0.50
        }
      });
    } else {
      // Default reset
      setFormData({
        cropId: 'paddy',
        varietyId: 'bpt_5204',
        cultivationMethod: 'transplanted',
        sowingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        areaAcres: 3.0,
        expectedDurationDays: 145,
        location: {
          village: 'Gundlapally',
          mandal: 'Nalgonda',
          district: 'Nalgonda',
          state: 'Telangana'
        },
        irrigationMethod: 'canal_flood',
        soilType: 'clay_loam',
        soilTest: {
          hasSoilTest: true,
          nKgAcre: 105,
          pKgAcre: 5.8,
          kKgAcre: 85,
          ph: 7.2,
          organicCarbonPct: 0.45
        },
        fymAppliedTonnes: 2.0,
        notes: ''
      });
    }
  }, [initialCrop, isOpen]);

  // When cropId changes, update variety list & default variety
  const handleCropChange = (newCropId) => {
    const cropSpec = CROP_KNOWLEDGE_BASE[newCropId];
    const defaultVar = cropSpec?.varieties[0];
    const defaultMethod = cropSpec?.cultivationMethods[0]?.id || 'direct_sown';
    
    setFormData((prev) => ({
      ...prev,
      cropId: newCropId,
      varietyId: defaultVar ? defaultVar.id : '',
      expectedDurationDays: defaultVar ? defaultVar.durationDays : 120,
      cultivationMethod: defaultMethod
    }));
  };

  // When varietyId changes, update expected duration
  const handleVarietyChange = (newVarId) => {
    const cropSpec = CROP_KNOWLEDGE_BASE[formData.cropId];
    const selectedVar = cropSpec?.varieties.find((v) => v.id === newVarId);
    setFormData((prev) => ({
      ...prev,
      varietyId: newVarId,
      expectedDurationDays: selectedVar ? selectedVar.durationDays : prev.expectedDurationDays
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cropId || !formData.varietyId) {
      setErrorMsg(isTe ? 'దయచేసి పంట మరియు రకాన్ని ఎంచుకోండి' : 'Please select both crop and variety');
      return;
    }
    if (!formData.sowingDate) {
      setErrorMsg(isTe ? 'దయచేసి విత్తిన తేదీని నమోదు చేయండి' : 'Please select planting/sowing date');
      return;
    }
    if (!formData.areaAcres || Number(formData.areaAcres) <= 0) {
      setErrorMsg(isTe ? 'దయచేసి చెల్లుబాటు అయ్యే విస్తీర్ణాన్ని నమోదు చేయండి' : 'Please enter a valid farm area in acres');
      return;
    }

    const saved = saveRegisteredCrop(formData);
    if (onSaved) onSaved(saved);
    onClose();
  };

  if (!isOpen) return null;

  const currentCropSpec = CROP_KNOWLEDGE_BASE[formData.cropId] || CROP_KNOWLEDGE_BASE.paddy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-6 bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {initialCrop 
                  ? (isTe ? 'పంట వివరాల సవరణ' : 'Edit Registered Crop') 
                  : (isTe ? 'నూతన పంట నమోదు & జీవిత చక్ర ట్రాకింగ్' : 'Register Crop & Lifecycle Tracking')}
              </h2>
              <p className="text-xs text-emerald-400/80">
                {isTe ? 'ఖచ్చితమైన ఎరువులు & సస్యరక్షణ సిఫార్సుల కోసం వివరాలు' : 'ICAR & SAU Scientifically Validated Crop Advisory Engine'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step Navigation tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 pt-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all ${
              activeStep === 1 
                ? 'border-emerald-500 text-emerald-400 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-[11px]">1</span>
            {isTe ? 'పంట & రకం' : 'Crop & Variety'}
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all ${
              activeStep === 2 
                ? 'border-emerald-500 text-emerald-400 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-[11px]">2</span>
            {isTe ? 'పొలం & నీటిపారుదల' : 'Farm & Irrigation'}
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all ${
              activeStep === 3 
                ? 'border-emerald-500 text-emerald-400 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-[11px]">3</span>
            {isTe ? 'మట్టి పరీక్ష & సేంద్రియ ఎరువు' : 'Soil Health & FYM'}
          </button>
        </div>

        {/* Content Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Crop, Variety, Method, Date */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Crop Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                    {isTe ? '1. పంట పేరు (Crop Name)' : '1. Crop Name'} *
                  </label>
                  <select
                    value={formData.cropId}
                    onChange={(e) => handleCropChange(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {Object.values(CROP_KNOWLEDGE_BASE).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.scientificName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Variety */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    {isTe ? '2. పంట రకం (Crop Variety)' : '2. Crop Variety'} *
                  </label>
                  <select
                    value={formData.varietyId}
                    onChange={(e) => handleVarietyChange(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {currentCropSpec.varieties.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.durationDays} days - {v.group})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 3. Cultivation Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                    {isTe ? '3. సాగు పద్ధతి (Cultivation Method)' : '3. Cultivation Method'} *
                  </label>
                  <select
                    value={formData.cultivationMethod}
                    onChange={(e) => setFormData({ ...formData, cultivationMethod: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {currentCropSpec.cultivationMethods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Sowing or Transplanting Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    {isTe ? '4. విత్తిన / నాటిన తేదీ (Sowing/Transplanting Date)' : '4. Sowing / Transplanting Date'} *
                  </label>
                  <input
                    type="date"
                    value={formData.sowingDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Expected Duration adjustment */}
              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-emerald-300">{isTe ? 'అంచనా పంట కాలం:' : 'Estimated Duration:'}</span>{' '}
                    <span>{formData.expectedDurationDays} {isTe ? 'రోజులు' : 'Days'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{isTe ? 'సవరించు:' : 'Override (Days):'}</span>
                  <input
                    type="number"
                    min="60"
                    max="300"
                    value={formData.expectedDurationDays}
                    onChange={(e) => setFormData({ ...formData, expectedDurationDays: Number(e.target.value) })}
                    className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-center text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Farm Area, Location, Irrigation, Soil */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 5. Farm Area */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">A</span>
                    {isTe ? '5. సాగు విస్తీర్ణం (Farm Area - Acres)' : '5. Farm Area (Acres)'} *
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="500"
                    value={formData.areaAcres}
                    onChange={(e) => setFormData({ ...formData, areaAcres: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 3.0"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* 6. Irrigation Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                    {isTe ? '6. నీటిపారుదల పద్ధతి (Irrigation Method)' : '6. Irrigation Method'} *
                  </label>
                  <select
                    value={formData.irrigationMethod}
                    onChange={(e) => setFormData({ ...formData, irrigationMethod: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {IRRIGATION_METHODS.map((im) => (
                      <option key={im.id} value={im.id}>
                        {im.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 7. Soil Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  {isTe ? '7. నేల రకం (Soil Type)' : '7. Soil Type'} *
                </label>
                <select
                  value={formData.soilType}
                  onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {SOIL_TYPES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} (Water Holding: {st.waterHolding})
                    </option>
                  ))}
                </select>
              </div>

              {/* 8. Location Details */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{isTe ? '8. పొలం స్థానిక వివరాలు (Farm Location)' : '8. Farm Location'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{isTe ? 'గ్రామం' : 'Village'}</label>
                    <input
                      type="text"
                      value={formData.location.village}
                      onChange={(e) => setFormData({ ...formData, location: { ...formData.location, village: e.target.value } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{isTe ? 'మండలం' : 'Mandal'}</label>
                    <input
                      type="text"
                      value={formData.location.mandal}
                      onChange={(e) => setFormData({ ...formData, location: { ...formData.location, mandal: e.target.value } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{isTe ? 'జిల్లా' : 'District'}</label>
                    <input
                      type="text"
                      value={formData.location.district}
                      onChange={(e) => setFormData({ ...formData, location: { ...formData.location, district: e.target.value } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{isTe ? 'రాష్ట్రం' : 'State'}</label>
                    <input
                      type="text"
                      value={formData.location.state}
                      onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Soil Health Card & FYM */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Soil Health Card Toggle */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-400" />
                    {isTe ? 'భూసార పరీక్ష పత్రం ఉందా? (Soil Health Card)' : 'Do you have Soil Health Card test values?'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isTe 
                      ? 'మట్టి పరీక్ష విలువల ఆధారంగా ఎరువుల మోతాదును 25% సర్దుబాటు చేస్తాం' 
                      : 'Precise ±25% fertilizer adjustments based on ICAR laboratory soil test standards'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.soilTest.hasSoilTest}
                    onChange={(e) => setFormData({
                      ...formData,
                      soilTest: { ...formData.soilTest, hasSoilTest: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {formData.soilTest.hasSoilTest && (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
                  <div className="text-xs font-semibold text-emerald-300">
                    {isTe ? 'ప్రయోగశాల మట్టి విలువల నమోదు (Available Nutrients):' : 'Laboratory Soil Test Values:'}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        {isTe ? 'నత్రజని (Available N)' : 'Available N (kg/acre)'}
                      </label>
                      <input
                        type="number"
                        value={formData.soilTest.nKgAcre}
                        onChange={(e) => setFormData({
                          ...formData,
                          soilTest: { ...formData.soilTest, nKgAcre: Number(e.target.value) }
                        })}
                        placeholder="e.g. 105"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">&lt;112: Low | &gt;224: High</span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        {isTe ? 'భాస్వరం (Available P)' : 'Available P (kg/acre)'}
                      </label>
                      <input
                        type="number"
                        value={formData.soilTest.pKgAcre}
                        onChange={(e) => setFormData({
                          ...formData,
                          soilTest: { ...formData.soilTest, pKgAcre: Number(e.target.value) }
                        })}
                        placeholder="e.g. 5.8"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">&lt;4.5: Low | &gt;9.0: High</span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        {isTe ? 'పొటాష్ (Available K)' : 'Available K (kg/acre)'}
                      </label>
                      <input
                        type="number"
                        value={formData.soilTest.kKgAcre}
                        onChange={(e) => setFormData({
                          ...formData,
                          soilTest: { ...formData.soilTest, kKgAcre: Number(e.target.value) }
                        })}
                        placeholder="e.g. 85"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">&lt;50: Low | &gt;120: High</span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        {isTe ? 'భూమి పి.హెచ్ (Soil pH)' : 'Soil pH (1-14)'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.soilTest.ph}
                        onChange={(e) => setFormData({
                          ...formData,
                          soilTest: { ...formData.soilTest, ph: Number(e.target.value) }
                        })}
                        placeholder="e.g. 7.2"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">6.5-7.5: Neutral</span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        {isTe ? 'సేంద్రియ కర్బనం (Organic Carbon %)' : 'Organic Carbon (%)'}
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={formData.soilTest.organicCarbonPct}
                        onChange={(e) => setFormData({
                          ...formData,
                          soilTest: { ...formData.soilTest, organicCarbonPct: Number(e.target.value) }
                        })}
                        placeholder="e.g. 0.45"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* FYM applied */}
              <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>{isTe ? 'పశువుల ఎరువు / కంపోస్టు వాడకం (FYM Applied in Tonnes/Acre)' : 'Farm Yard Manure Applied (Tonnes/Acre)'}</span>
                  <span className="text-emerald-400 font-bold">{formData.fymAppliedTonnes} t/ac</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={formData.fymAppliedTonnes}
                  onChange={(e) => setFormData({ ...formData, fymAppliedTonnes: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  {isTe 
                    ? '1 టన్ను పశువుల ఎరువు నేలకు 5 కేజీల నత్రజని, 2.5 కేజీల భాస్వరం, 5 కేజీల పొటాష్ సరఫరా చేస్తుంది.' 
                    : '1 Tonne FYM credits 5 kg N, 2.5 kg P₂O₅, and 5 kg K₂O, reducing synthetic chemical fertilizer requirement.'}
                </p>
              </div>

              {/* Farmer field notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isTe ? 'రైతు అదనపు గమనికలు (Field Notes / Observations)' : 'Field Notes / Special Observations'}
                </label>
                <textarea
                  rows="2"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={isTe ? 'గత పంట వివరాలు, నీటి ఎద్దడి లేదా తెగుళ్ళ చరిత్ర...' : 'Previous crop residues, drainage issues, pest history...'}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                {isTe ? 'వెనుకకు' : 'Back'}
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              {activeStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center gap-1.5"
                >
                  <span>{isTe ? 'తదుపరి' : 'Next Step'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isTe ? 'పంటను నమోదు చేయి & లెక్కించు' : 'Save & Calculate Precision Advisory'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
