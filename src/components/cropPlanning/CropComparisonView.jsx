import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Scale,
  Droplets,
  Coins,
  TrendingUp,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Award,
  ArrowRight
} from 'lucide-react';
import { CROPS_DATABASE } from '../../services/cropPlanningService';
import { getMandiPriceForCrop } from '../../services/mandiPriceService';
import { calculateProfitabilityScenarios } from '../../services/cultivationCostService';

export default function CropComparisonView({
  recommendations = [],
  landAreaAcres = 2.0,
  onSelectCropForCosting,
  farmerState = 'Punjab'
}) {
  const { t } = useTranslation();

  const [sortBy, setSortBy] = useState('netReturn'); // 'netReturn' | 'suitability' | 'water' | 'cost' | 'duration'
  const [filterWater, setFilterWater] = useState('all'); // 'all' | 'Low' | 'Medium' | 'High'

  // Pre-calculate comparative metrics for top crops
  const comparedCrops = recommendations.map(rec => {
    const profitData = calculateProfitabilityScenarios(rec.crop.id, landAreaAcres);
    const mandi = getMandiPriceForCrop(rec.crop.id, farmerState);

    return {
      crop: rec.crop,
      scores: rec.scores,
      suitabilityTier: rec.suitabilityTier,
      riskLevel: rec.riskLevel,
      primaryJustification: rec.primaryJustification,
      costPerAcre: profitData.costBreakdown.totalCostPerAcre,
      totalCost: profitData.totalFarmExpenditure,
      modalPrice: mandi.modalPrice,
      expectedYield: rec.crop.benchmarkYieldQuintalsPerAcre?.avg || 20,
      netReturnPerAcre: profitData.baseScenario.netReturnPerAcre,
      totalNetReturn: profitData.baseScenario.netReturn,
      roiPercent: profitData.baseScenario.roiPercent,
      breakEvenPrice: profitData.breakEvenPricePerQuintal,
      msp: rec.crop.mspPerQuintal,
      durationDaysNum: rec.crop.durationDaysNum || 120,
      waterLevel: rec.crop.waterRequirementLevel,
      waterMm: rec.crop.waterRequirementMm
    };
  });

  // Filter
  const filtered = comparedCrops.filter(item => {
    if (filterWater !== 'all' && item.waterLevel !== filterWater) return false;
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'suitability':
        return b.scores.composite - a.scores.composite;
      case 'water':
        return (a.waterLevel === 'Low' ? 1 : a.waterLevel === 'Medium' ? 2 : 3) - 
               (b.waterLevel === 'Low' ? 1 : b.waterLevel === 'Medium' ? 2 : 3);
      case 'cost':
        return a.costPerAcre - b.costPerAcre;
      case 'duration':
        return a.durationDaysNum - b.durationDaysNum;
      default:
        // netReturn
        return b.netReturnPerAcre - a.netReturnPerAcre;
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Filter & Sorting Controls */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {t('cropPlanning.compareCropsTitle', 'Cross-Crop Multi-Dimensional Matrix')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('cropPlanning.compareSubtitle', 'Compare economics, water demands, durations, and market returns across suitable candidates with actual crop photos')}
              </p>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-2 rounded-2xl">
            Calculated for <strong>{landAreaAcres} Acres</strong>
          </div>
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Sorting Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-500 flex items-center space-x-1 mr-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort By:</span>
            </span>
            {[
              { id: 'netReturn', label: 'Highest Net Return' },
              { id: 'suitability', label: 'Top Match Score' },
              { id: 'water', label: 'Lowest Water Need' },
              { id: 'cost', label: 'Lowest Cultivation Cost' },
              { id: 'duration', label: 'Shortest Duration' }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setSortBy(btn.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  sortBy === btn.id
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Water Need Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-500 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Water:</span>
            </span>
            {['all', 'Low', 'Medium', 'High'].map(w => (
              <button
                key={w}
                onClick={() => setFilterWater(w)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterWater === w
                    ? 'bg-blue-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {w === 'all' ? 'All' : `${w}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.slice(0, 6).map((item, idx) => (
          <div
            key={item.crop.id}
            className={`bg-white rounded-3xl border ${
              idx === 0
                ? 'border-emerald-400 shadow-md ring-1 ring-emerald-400/40'
                : 'border-slate-200/90 shadow-xs'
            } p-5 space-y-4 flex flex-col justify-between`}
          >
            <div className="space-y-3">
              {/* Header with Crop Thumbnail */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="relative">
                    <img
                      src={item.crop.imageUrl || item.crop.fallbackImageUrl}
                      alt={item.crop.name}
                      className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                      onError={(e) => {
                        if (item.crop.fallbackImageUrl) e.currentTarget.src = item.crop.fallbackImageUrl;
                      }}
                    />
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-bold text-[10px] flex items-center justify-center border border-white">
                      #{idx + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">{item.crop.name}</h3>
                    <span className="text-[10px] text-slate-500 italic block">{item.crop.botanicalName}</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  {item.scores.composite}% Match
                </span>
              </div>

              {/* Economic Snapshot */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200/70 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Projected Net Return:</span>
                  <span className={`font-mono font-black text-sm ${item.netReturnPerAcre > 0 ? 'text-emerald-800' : 'text-rose-600'}`}>
                    {item.netReturnPerAcre > 0 ? '+' : ''}₹{item.netReturnPerAcre.toLocaleString()}<span className="text-[10px] text-slate-500 font-normal">/A</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Farm Net Return ({landAreaAcres} A):</span>
                  <span className="font-mono font-bold text-slate-900">₹{item.totalNetReturn.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Return on Investment (ROI):</span>
                  <span className="font-mono font-bold text-emerald-700">{item.roiPercent}%</span>
                </div>
              </div>

              {/* Comparison Data Table */}
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between pt-1 text-slate-700">
                  <span className="text-slate-400">Water Demand:</span>
                  <span className="font-bold flex items-center space-x-1">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    <span>{item.waterMm} ({item.waterLevel})</span>
                  </span>
                </div>
                <div className="flex justify-between pt-1 text-slate-700">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-bold">{item.crop.durationDays}</span>
                </div>
                <div className="flex justify-between pt-1 text-slate-700">
                  <span className="text-slate-400">Cost of Cultivation:</span>
                  <span className="font-mono font-bold">₹{item.costPerAcre.toLocaleString()}/acre</span>
                </div>
                <div className="flex justify-between pt-1 text-slate-700">
                  <span className="text-slate-400">Expected Yield:</span>
                  <span className="font-bold">{item.expectedYield} quintals/acre</span>
                </div>
                <div className="flex justify-between pt-1 text-slate-700">
                  <span className="text-slate-400">Modal Mandi Price:</span>
                  <span className="font-mono font-bold text-emerald-800">₹{item.modalPrice}/q</span>
                </div>
                {item.msp && (
                  <div className="flex justify-between pt-1 text-slate-700">
                    <span className="text-slate-400">Statutory CCEA MSP:</span>
                    <span className="font-mono font-bold text-slate-800">₹{item.msp}/q</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-slate-700">
                  <span className="text-slate-400">Break-Even Selling Price:</span>
                  <span className="font-mono font-bold text-amber-700">₹{item.breakEvenPrice}/q</span>
                </div>
                <div className="flex justify-between pt-1 text-slate-700">
                  <span className="text-slate-400">Risk Profile:</span>
                  <span className={`font-bold ${
                    item.riskLevel === 'LOW' ? 'text-emerald-700' : item.riskLevel === 'MODERATE' ? 'text-blue-700' : 'text-amber-700'
                  }`}>
                    {item.riskLevel.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Justification snippet */}
              <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                {item.primaryJustification}
              </p>
            </div>

            {/* Select & Costing Action */}
            <button
              onClick={() => onSelectCropForCosting(item.crop.id)}
              className="w-full flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-all shadow-xs cursor-pointer mt-3"
            >
              <span>Explore Cost & Profit Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
