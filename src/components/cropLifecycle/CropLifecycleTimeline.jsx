import React from 'react';
import { 
  CheckCircle2, Clock, Calendar, Droplets, CheckSquare, Sparkles, ChevronRight, AlertCircle 
} from 'lucide-react';

export default function CropLifecycleTimeline({ cropRecord, lifecycle, lang = 'en' }) {
  const isTe = lang === 'te';
  if (!lifecycle || !lifecycle.stages) return null;

  const { currentStage, daysAfterSowing, daysAfterTransplanting, daysRemaining, progressPct, stages } = lifecycle;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Background ambient glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {isTe ? 'ప్రస్తుత దశ' : 'Active Growth Stage'}
            </span>
            <span className="text-xs text-slate-400">
              {daysAfterTransplanting 
                ? `${daysAfterTransplanting} DAT (${daysAfterSowing} DAS)` 
                : `${daysAfterSowing} DAS`}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            {isTe ? currentStage.teluguName : currentStage.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isTe ? currentStage.teluguDescription : currentStage.description}
          </p>
        </div>

        {/* Harvest countdown widget */}
        <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800/90 rounded-xl px-4 py-2.5 shrink-0">
          <div className="text-center">
            <span className="block text-2xl font-black text-emerald-400 leading-none">
              {daysRemaining}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {isTe ? 'కోతకు మిగిలిన రోజులు' : 'Days to Harvest'}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div className="text-center">
            <span className="block text-2xl font-black text-teal-400 leading-none">
              {progressPct}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {isTe ? 'పూర్తయిన చక్రం' : 'Cycle Completed'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Timeline Nodes */}
      <div className="relative mb-6">
        {/* Continuous Progress Bar Background */}
        <div className="absolute top-5 left-4 right-4 h-1.5 bg-slate-800 rounded-full z-0 hidden md:block">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
          />
        </div>

        {/* Stages Grid / Flex */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 relative z-10">
          {stages.map((stg, idx) => {
            const isCompleted = progressPct >= stg.pctEnd;
            const isCurrent = stg.id === currentStage.id;
            const isPending = progressPct < stg.pctStart;

            return (
              <div 
                key={stg.id}
                className={`flex flex-col p-3 rounded-xl border transition-all ${
                  isCurrent 
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-900/30 ring-1 ring-emerald-500/40' 
                    : isCompleted 
                      ? 'bg-slate-900/50 border-slate-800 text-slate-400' 
                      : 'bg-slate-950/30 border-slate-800/50 text-slate-500 opacity-70'
                }`}
              >
                {/* Node icon & badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    isCurrent 
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/40 animate-pulse' 
                      : isCompleted 
                        ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-400' 
                        : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                    {stg.pctStart}% - {stg.pctEnd}%
                  </span>
                </div>

                <div className="font-semibold text-xs leading-tight mb-1 text-slate-200">
                  {isTe ? stg.teluguName : stg.name}
                </div>

                <div className="text-[10px] text-slate-400 font-mono mt-auto">
                  {Math.round((stg.pctStart / 100) * lifecycle.varietyDuration)} - {Math.round((stg.pctEnd / 100) * lifecycle.varietyDuration)} {isTe ? 'రోజులు' : 'Days'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Stage Deep-Dive Card (Activities + Water Guidance) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stage Agricultural Operations */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5">
            <CheckSquare className="w-4 h-4" />
            <span>{isTe ? 'ఈ దశలో చేపట్టవలసిన పనులు (Recommended Activities)' : 'Current Stage Field Operations'}</span>
          </div>
          <ul className="space-y-2">
            {currentStage.activities.map((act, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-[10px] text-emerald-400 shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Irrigation & Water Management */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-2.5">
              <Droplets className="w-4 h-4" />
              <span>{isTe ? 'నీటి యాజమాన్యం & తేమ నిర్వహణ' : 'Irrigation & Water Regimen'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentStage.irrigationNote}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{isTe ? 'పద్ధతి:' : 'Method:'} <strong className="text-slate-200">{cropRecord.irrigationMethod || 'Standard'}</strong></span>
            <span>{isTe ? 'నేల రకం:' : 'Soil:'} <strong className="text-slate-200">{cropRecord.soilType || 'Loam'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
