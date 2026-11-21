import React, { useState } from 'react';
import { 
  Package, AlertTriangle, ShieldCheck, CheckCircle2, Info, ChevronDown, 
  ChevronUp, Scale, ArrowRight, Sparkles, Layers 
} from 'lucide-react';

export default function FertilizerAdvisoryCard({ cropRecord, fertilizerResult, lang = 'en' }) {
  const isTe = lang === 'te';
  const [showElementalDetails, setShowElementalDetails] = useState(false);

  if (!fertilizerResult) return null;

  const {
    isSoilTestBased,
    soilAdvisoryNotes,
    farmAreaAcres,
    elementalNutrients,
    commercialProducts,
    stageSplits,
    generalPrecautions,
    teluguPrecautions
  } = fertilizerResult;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative backdrop-blur-sm">
      {/* Header with Soil Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-white">
              {isTe ? 'ఖచ్చితమైన ఎరువుల సిఫార్సు (Precision Fertilizer Advisory)' : 'Precision Fertilizer Advisory & Bag Calculator'}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {isTe 
              ? `${farmAreaAcres} ఎకరాల విస్తీర్ణానికి శాస్త్రీయంగా లెక్కించబడిన ఎరువుల బస్తాల వివరాలు` 
              : `Commercial product quantities and split schedule formulated for ${farmAreaAcres} Acres`}
          </p>
        </div>

        {/* Prescription type badge */}
        <div>
          {isSoilTestBased ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-semibold shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isTe ? 'భూసార పరీక్ష ఆధారిత సిఫార్సు' : 'Soil-Test-Based Prescription'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold">
              <Info className="w-4 h-4 text-amber-400" />
              <span>{isTe ? 'సాధారణ సిఫార్సు (మట్టి పరీక్ష రికార్డు లేదు)' : 'General Crop-Stage Advisory (No Soil Card)'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Soil Adjustment Notes Banner */}
      {soilAdvisoryNotes && soilAdvisoryNotes.length > 0 && (
        <div className="mb-6 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isTe ? 'భూసార సర్దుబాటు & సేంద్రియ క్రెడిట్ గమనికలు' : 'Soil Health & Organic FYM Adjustments Applied'}</span>
          </div>
          <ul className="space-y-1">
            {soilAdvisoryNotes.map((note, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Commercial Fertilizer Bags Grid (Urea, DAP, MOP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Urea Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-xl p-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {isTe ? 'యూరియా (నత్రజని)' : 'Urea (Nitrogen)'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
              46% N
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-white">
              {commercialProducts.urea.totalBags}
            </span>
            <span className="text-xs font-bold text-emerald-400">
              {isTe ? 'బస్తాలు (45 kg)' : 'Bags (45 kg)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isTe ? `ఎకరానికి: ${commercialProducts.urea.kgPerAcre} kg | మొత్తం: ${commercialProducts.urea.totalKg} kg` : `${commercialProducts.urea.kgPerAcre} kg/acre | Total: ${commercialProducts.urea.totalKg} kg`}
          </p>
        </div>

        {/* DAP Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-teal-500/30 rounded-xl p-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              {isTe ? 'డి.ఎ.పి (భాస్వరం + నత్రజని)' : 'DAP (Phosphate + N)'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 border border-teal-500/30 text-teal-300">
              18-46-0
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-white">
              {commercialProducts.dap.totalBags}
            </span>
            <span className="text-xs font-bold text-teal-400">
              {isTe ? 'బస్తాలు (50 kg)' : 'Bags (50 kg)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isTe ? `ఎకరానికి: ${commercialProducts.dap.kgPerAcre} kg | మొత్తం: ${commercialProducts.dap.totalKg} kg` : `${commercialProducts.dap.kgPerAcre} kg/acre | Total: ${commercialProducts.dap.totalKg} kg`}
          </p>
        </div>

        {/* MOP Potash Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {isTe ? 'పొటాష్ ఎం.ఓ.పి (K₂O)' : 'MOP Potash (K₂O)'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-500/30 text-amber-300">
              60% K₂O
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-white">
              {commercialProducts.mop.totalBags}
            </span>
            <span className="text-xs font-bold text-amber-400">
              {isTe ? 'బస్తాలు (50 kg)' : 'Bags (50 kg)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isTe ? `ఎకరానికి: ${commercialProducts.mop.kgPerAcre} kg | మొత్తం: ${commercialProducts.mop.totalKg} kg` : `${commercialProducts.mop.kgPerAcre} kg/acre | Total: ${commercialProducts.mop.totalKg} kg`}
          </p>
        </div>
      </div>

      {/* Stage-wise Split Application Schedule */}
      <div className="mb-6">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>{isTe ? 'విడతల వారీ ఎరువుల మోతాదు ప్రణాళిక (Split Application Schedule)' : 'Stage-wise Split Application Schedule'}</span>
          <span className="text-[11px] font-normal text-emerald-400">
            {isTe ? 'ప్రస్తుత దశ హైలైట్ చేయబడింది' : 'Current stage highlighted'}
          </span>
        </div>

        <div className="space-y-3">
          {stageSplits.map((split, idx) => (
            <div 
              key={split.stageId}
              className={`p-4 rounded-xl border transition-all ${
                split.isCurrentStage 
                  ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30' 
                  : 'bg-slate-950/40 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    split.isCurrentStage ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="text-sm font-bold text-white">
                      {isTe ? split.teluguStageName : split.stageName}
                    </h5>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {split.timingDays}
                    </span>
                  </div>
                </div>

                {split.isCurrentStage && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/40 self-start sm:self-center">
                    {isTe ? 'ప్రస్తుతం చల్లవలసిన ఎరువులు' : 'Action Required Now'}
                  </span>
                )}
              </div>

              {/* Quantities in this split */}
              <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-900/60 rounded-lg p-2 mb-2.5">
                <div>
                  <span className="block text-[10px] text-slate-400">Urea</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {split.ureaBagsFarm > 0 ? `${split.ureaBagsFarm} bags` : '—'}
                  </span>
                  <span className="block text-[9px] text-slate-500">({split.ureaKgAcre} kg/ac)</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">DAP</span>
                  <span className="text-sm font-bold text-teal-400">
                    {split.dapBagsFarm > 0 ? `${split.dapBagsFarm} bags` : '—'}
                  </span>
                  <span className="block text-[9px] text-slate-500">({split.dapKgAcre} kg/ac)</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">MOP Potash</span>
                  <span className="text-sm font-bold text-amber-400">
                    {split.mopBagsFarm > 0 ? `${split.mopBagsFarm} bags` : '—'}
                  </span>
                  <span className="block text-[9px] text-slate-500">({split.mopKgAcre} kg/ac)</span>
                </div>
              </div>

              {/* Application instructions */}
              <div className="text-xs text-slate-300 flex items-start gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-200">{isTe ? 'విధానం:' : 'Method:'}</strong> {split.applicationMethod}</span>
              </div>
              {split.micronutrientNote && (
                <div className="mt-1 text-xs text-teal-300 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span><strong>{isTe ? 'సూక్ష్మ పోషకాలు:' : 'Micronutrient Note:'}</strong> {split.micronutrientNote}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Precautions Alert Box */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 mb-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>{isTe ? 'అత్యంత ముఖ్యమైన జాగ్రత్తలు (Crucial Precautions)' : 'Critical Agronomic Precautions'}</span>
        </div>
        <ul className="space-y-1.5 text-xs text-slate-300">
          {(isTe ? teluguPrecautions : generalPrecautions).map((prec, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>{prec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Collapsible Elemental Nutrient Breakdown (for Agronomists / Advanced Farmers) */}
      <div className="border-t border-slate-800 pt-3">
        <button
          type="button"
          onClick={() => setShowElementalDetails(!showElementalDetails)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1"
        >
          <span className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            {isTe ? 'మౌలిక పోషక విశ్లేషణ (Elemental N-P-K Breakdown)' : 'View Elemental N-P-K Nutrient Balance'}
          </span>
          {showElementalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showElementalDetails && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 space-y-2 animate-in fade-in duration-150">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="block text-[10px] text-slate-400">Net N</span>
                <span className="font-bold text-white">{elementalNutrients.nKgAcre} kg/ac</span>
                <span className="block text-[10px] text-emerald-400">Total: {elementalNutrients.totalFarmN} kg</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="block text-[10px] text-slate-400">Net P₂O₅</span>
                <span className="font-bold text-white">{elementalNutrients.pKgAcre} kg/ac</span>
                <span className="block text-[10px] text-teal-400">Total: {elementalNutrients.totalFarmP} kg</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="block text-[10px] text-slate-400">Net K₂O</span>
                <span className="font-bold text-white">{elementalNutrients.kKgAcre} kg/ac</span>
                <span className="block text-[10px] text-amber-400">Total: {elementalNutrients.totalFarmK} kg</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              * Calculations follow standard ICAR conversion formulas: 100 kg DAP provides 46 kg P₂O₅ and 18 kg N. Urea provides 46% N. MOP provides 60% K₂O.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
