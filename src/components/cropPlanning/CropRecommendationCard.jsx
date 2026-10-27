import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sprout,
  Droplets,
  Calendar,
  Coins,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Bug,
  Compass,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { getMandiPriceForCrop } from '../../services/mandiPriceService';

export default function CropRecommendationCard({
  rec,
  onSelectForCosting,
  onSelectForMandi,
  farmerState = 'Punjab'
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('varieties'); // 'varieties' | 'inputs' | 'irrigation' | 'pests'

  const {
    crop = {},
    scores = { composite: 70 },
    suitabilityTier = 'SUITABLE',
    riskLevel = 'MODERATE',
    isSuitable = true,
    unsuitableReasons = [],
    disqualificationSummary = '',
    mitigationAdvice = '',
    primaryJustification = '',
    baselineCostPerAcre = 20000
  } = rec || {};

  const [imgSrc, setImgSrc] = useState(crop.imageUrl || crop.fallbackImageUrl);
  const [imgLoaded, setImgLoaded] = useState(false);

  const mandiPrice = getMandiPriceForCrop(crop.id, farmerState);

  const getTierBadge = () => {
    if (!isSuitable) {
      return {
        cardBorder: 'border-rose-300 ring-1 ring-rose-200/60 shadow-xs hover:border-rose-400',
        badgeBg: 'bg-rose-600 text-white',
        badgeIcon: AlertTriangle,
        label: t('cropPlanning.tierUnsuitable', 'Unsuitable to Sow'),
        subLabel: 'Agronomic Warning'
      };
    }

    switch (suitabilityTier) {
      case 'HIGHLY_RECOMMENDED':
        return {
          cardBorder: 'border-emerald-300 ring-1 ring-emerald-200/60 shadow-xs hover:border-emerald-400',
          badgeBg: 'bg-emerald-700 text-white',
          badgeIcon: CheckCircle2,
          label: t('cropPlanning.tierHighlyRecommended', 'Highly Recommended'),
          subLabel: 'Optimal Match'
        };
      case 'SUITABLE':
        return {
          cardBorder: 'border-blue-200 ring-1 ring-blue-100 shadow-xs hover:border-blue-300',
          badgeBg: 'bg-blue-700 text-white',
          badgeIcon: CheckCircle2,
          label: t('cropPlanning.tierSuitable', 'Suitable Crop'),
          subLabel: 'Viable Match'
        };
      default:
        return {
          cardBorder: 'border-amber-200 shadow-xs hover:border-amber-300',
          badgeBg: 'bg-amber-700 text-white',
          badgeIcon: Info,
          label: t('cropPlanning.tierMarginal', 'Marginal / Alternative'),
          subLabel: 'Conditional'
        };
    }
  };

  const tierMeta = getTierBadge();
  const TierIcon = tierMeta.badgeIcon;

  const displaySeason = crop.season ? (crop.season.toUpperCase() + ' SEASON') : 'SEASONAL';

  return (
    <div className={`bg-white rounded-3xl border transition-all overflow-hidden flex flex-col ${tierMeta.cardBorder}`}>
      
      {/* 1. ACTUAL CROP PHOTOGRAPH BANNER */}
      <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-900 group">
        <img
          src={imgSrc}
          alt={crop.imageAlt || crop.name}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            imgLoaded ? 'opacity-100' : 'opacity-85'
          } ${!isSuitable ? 'filter saturate-90 brightness-95' : ''}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            if (crop.fallbackImageUrl && imgSrc !== crop.fallbackImageUrl) {
              setImgSrc(crop.fallbackImageUrl);
            }
          }}
        />

        {/* Ambient Gradient Overlays for readable text & badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-black/50 pointer-events-none" />

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Category Pill */}
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 text-white/95 backdrop-blur-md border border-white/20 shadow-xs">
              {crop.category || 'Crop'}
            </span>

            {/* Suitability Tier Pill */}
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 backdrop-blur-md shadow-xs ${tierMeta.badgeBg}`}>
              <TierIcon className="w-3 h-3" />
              <span>{tierMeta.label}</span>
            </span>
          </div>

          {/* Match Score or Risk Factor Gauge */}
          {isSuitable ? (
            <div className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/40 text-right shadow-sm">
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Match Score</span>
              <span className="text-sm sm:text-base font-black text-emerald-800 font-mono leading-none">
                {scores?.composite || 75}%
              </span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-rose-950/85 backdrop-blur-md border border-rose-500/40 text-right shadow-sm">
              <span className="text-[9px] font-bold text-rose-300 uppercase block">Risk Profile</span>
              <span className="text-xs font-black text-rose-100 font-mono leading-none flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 text-rose-400 inline" />
                <span>HIGH RISK</span>
              </span>
            </div>
          )}
        </div>

        {/* Bottom Crop Name & Season Identification on Photo */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3 text-white z-10">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-md tracking-tight flex items-center space-x-2">
              <span>{crop.name}</span>
            </h3>
            <p className="text-xs text-emerald-200 font-medium italic drop-shadow-sm mt-0.5">
              {crop.botanicalName}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white px-2.5 py-1 rounded-lg border border-white/30 inline-block shadow-xs">
              {displaySeason}
            </span>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED UNSUITABILITY ALERT BOX (IF CROP IS UNSUITABLE) */}
      {!isSuitable ? (
        <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-50 via-rose-50/70 to-amber-50/40 border-b border-rose-200 text-xs space-y-3">
          <div className="flex items-start space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 border border-rose-200 shadow-2xs">
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-700 text-white tracking-wide">
                  Agronomic Disqualification
                </span>
                <span className="text-xs font-black text-rose-950">
                  {disqualificationSummary || 'Not Recommended Under Current Farm Parameters'}
                </span>
              </div>
              <p className="text-[11px] text-rose-900 leading-relaxed font-medium">
                Planting <strong>{crop.name}</strong> now is not advisable due to the following critical condition mismatches:
              </p>
            </div>
          </div>

          {/* Detailed Bullet Points of Unsuitable Reasons */}
          {unsuitableReasons && unsuitableReasons.length > 0 && (
            <div className="bg-white/95 rounded-2xl p-3.5 border border-rose-200 shadow-2xs space-y-2">
              <span className="font-extrabold text-[10px] text-rose-950 uppercase tracking-wider block flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Agronomic Conflict Analysis:</span>
              </span>
              <ul className="space-y-1.5 pl-1">
                {unsuitableReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-rose-900 leading-relaxed text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mitigation Guidance (If farmer insists on planting) */}
          {mitigationAdvice && (
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-[11px] text-amber-950 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="text-amber-900 block font-bold">Actionable Mitigation if Cultivated Anyway:</strong>
                <p className="text-amber-800 leading-relaxed">{mitigationAdvice}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Primary Agronomic Justification for Suitable Crops */
        <div className="px-5 py-3.5 bg-emerald-50/60 border-b border-emerald-100 text-xs text-slate-700 flex items-start space-x-2.5">
          <Compass className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-emerald-950">Why this crop is recommended:</strong> {primaryJustification}
          </p>
        </div>
      )}

      {/* 3. 4-METRIC KEY AGRONOMIC SNAPSHOT */}
      <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs border-b border-slate-100">
        
        {/* Sowing & Duration */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 uppercase">
            <Calendar className="w-3 h-3 text-emerald-700" />
            <span>Sowing Window</span>
          </span>
          <p className="font-black text-slate-900">
            {crop.sowingMonths ? crop.sowingMonths.slice(0, 2).join(' - ') : 'Seasonal'}
          </p>
          <p className="text-[10px] text-slate-500 font-medium">{crop.durationDays}</p>
        </div>

        {/* Water Requirement */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 uppercase">
            <Droplets className="w-3 h-3 text-blue-600" />
            <span>Water Demand</span>
          </span>
          <p className="font-black text-slate-900">{crop.waterRequirementMm}</p>
          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded ${
            crop.waterRequirementLevel === 'Low'
              ? 'bg-emerald-100 text-emerald-800'
              : crop.waterRequirementLevel === 'Medium'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {crop.waterRequirementLevel} Footprint
          </span>
        </div>

        {/* Estimated Cost / Acre */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 uppercase">
            <Coins className="w-3 h-3 text-amber-600" />
            <span>Cost / Acre</span>
          </span>
          <p className="font-black text-slate-900 font-mono">₹{baselineCostPerAcre.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 font-medium">CACP/ICAR norm</p>
        </div>

        {/* Modal Mandi Price & MSP */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 uppercase">
            <TrendingUp className="w-3 h-3 text-emerald-700" />
            <span>Modal Mandi Price</span>
          </span>
          <p className="font-black text-emerald-800 font-mono">
            ₹{mandiPrice.modalPrice.toLocaleString()}<span className="text-[10px] text-slate-500 font-normal">/q</span>
          </p>
          {crop.mspPerQuintal && (
            <p className="text-[10px] text-slate-600 font-medium">MSP: ₹{crop.mspPerQuintal}/q</p>
          )}
        </div>

      </div>

      {/* 4. EXPANDABLE AGRONOMIC ACCORDION DETAILS */}
      {isExpanded && (
        <div className="p-5 bg-slate-50/50 border-b border-slate-200/80 space-y-4 animate-in fade-in duration-200">
          
          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
            {[
              { id: 'varieties', label: 'University Varieties', icon: Award },
              { id: 'inputs', label: 'Seed & Fertilizers', icon: Layers },
              { id: 'irrigation', label: 'Critical Irrigation', icon: Droplets },
              { id: 'pests', label: 'Pests & IPM Management', icon: Bug }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: VERIFIED UNIVERSITY VARIETIES */}
          {activeTab === 'varieties' && (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(crop.verifiedVarieties || []).map((v, i) => (
                  <div key={i} className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{v.name}</span>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {v.university}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{v.features}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SEED & FERTILIZER INPUTS */}
          {activeTab === 'inputs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-900 block">Sowing & Seed Rate:</span>
                <p className="text-slate-700"><strong>Seed Quantity:</strong> {crop.seedRatePerAcreKg}</p>
                <p className="text-slate-600 text-[11px] leading-relaxed">{crop.culturalAdvice}</p>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-900 block">Fertilizer Schedule (per acre):</span>
                <ul className="space-y-1 text-slate-700 text-[11px]">
                  {Object.entries(crop.fertilizerDosage || {}).map(([k, val]) => (
                    <li key={k} className="capitalize">
                      <strong>{k.replace(/([A-Z])/g, ' $1')}:</strong> {val}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: CRITICAL IRRIGATION STAGES */}
          {activeTab === 'irrigation' && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <span className="font-bold text-slate-900 block">Moisture Critical Growth Stages:</span>
              <div className="space-y-1.5">
                {(crop.criticalIrrigationStages || []).map((stage, i) => (
                  <div key={i} className="flex items-start space-x-2 text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-[11px] leading-relaxed">{stage}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PESTS, DISEASES & ALTERNATIVES */}
          {activeTab === 'pests' && (
            <div className="space-y-3 text-xs">
              <div className="space-y-2">
                {(crop.commonPestsAndDiseases || []).map((p, i) => (
                  <div key={i} className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="font-bold text-rose-950 flex items-center space-x-1.5">
                      <Bug className="w-3.5 h-3.5 text-rose-600" />
                      <span>{p.name}</span>
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{p.prevention}</p>
                  </div>
                ))}
              </div>

              {/* Alternative Resilient Crop Callout */}
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-[11px] text-emerald-950 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Low Water / High Risk Alternatives:</strong> If water or canal supply is delayed, consider: {(crop.alternativeResilientCrops || []).map(c => c.replace('_', ' ')).join(', ')}.
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 5. CARD ACTION FOOTER */}
      <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3 mt-auto">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? t('common.hideDetails', 'Hide Technical Agronomic Details') : t('common.showDetails', 'View Varieties, Inputs & Irrigation Schedule')}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSelectForMandi(crop.id)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-800 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
            <span>Mandi Prices</span>
          </button>

          <button
            onClick={() => onSelectForCosting(crop.id)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Cost & Profit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
