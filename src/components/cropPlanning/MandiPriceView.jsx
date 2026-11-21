import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { CROPS_DATABASE } from '../../services/cropPlanningService';
import { getMandiPriceForCrop } from '../../services/mandiPriceService';

export default function MandiPriceView({
  selectedCropId = 'wheat',
  onCropChange,
  farmerState = 'Punjab'
}) {
  const { t } = useTranslation();
  const [activeCropId, setActiveCropId] = useState(selectedCropId);

  const handleCropSelect = (id) => {
    setActiveCropId(id);
    if (onCropChange) onCropChange(id);
  };

  const mandi = getMandiPriceForCrop(activeCropId, farmerState);
  const crop = CROPS_DATABASE.find(c => c.id === activeCropId) || CROPS_DATABASE[0];

  const getTrendStyle = (status) => {
    switch (status) {
      case 'Rising':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          badge: 'bg-emerald-700 text-white',
          icon: ArrowUpRight,
          label: 'Price Trending Higher (Bullish)'
        };
      case 'Softening':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          badge: 'bg-rose-700 text-white',
          icon: ArrowDownRight,
          label: 'Price Softening (Heavy Supply)'
        };
      default:
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          badge: 'bg-blue-700 text-white',
          icon: TrendingUp,
          label: 'Rangebound / Stable'
        };
    }
  };

  const trendStyle = getTrendStyle(mandi.trendStatus);
  const TrendIcon = trendStyle.icon;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Crop Selector */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {t('cropPlanning.mandiPricesTitle', 'Authentic Mandi Prices & Market Intelligence')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('cropPlanning.mandiSubtitle', 'AGMARKNET & e-NAM real wholesale data with nearby APMC comparisons and price trends')}
            </p>
          </div>
        </div>

        {/* Crop Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">Commodity:</span>
          <select
            value={activeCropId}
            onChange={(e) => handleCropSelect(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-black text-slate-800 bg-slate-50 cursor-pointer"
          >
            {CROPS_DATABASE.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Grid: Primary Market Card (Left) + Historical Chart & Forecast (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PRIMARY APMC MANDI CARD (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-5 flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* Header info with verified source badge */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${trendStyle.badge}`}>
                {mandi.trendStatus.toUpperCase()} TREND
              </span>

              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{mandi.reportedDate} • {mandi.lastUpdatedTime}</span>
              </div>
            </div>

            {/* Mandi Name & Commodity */}
            <div>
              <span className="text-xs font-bold text-emerald-800 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{mandi.primaryMandi}</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {mandi.commodity}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Variety: <strong>{mandi.variety}</strong> • Grade: <span className="font-semibold">{mandi.grade}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Distance: Approx. <strong>{mandi.distanceKm} km</strong> from selected farm location
              </p>
            </div>

            {/* 3 Price Cards: Min, Modal, Max */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Min Price</span>
                <p className="text-sm font-black text-slate-700 font-mono">₹{mandi.minPrice.toLocaleString()}</p>
                <span className="text-[9px] text-slate-400">₹/quintal</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-0.5 ring-1 ring-emerald-400/40">
                <span className="text-[10px] font-black text-emerald-800 uppercase">Modal Price</span>
                <p className="text-base sm:text-lg font-black text-emerald-900 font-mono">₹{mandi.modalPrice.toLocaleString()}</p>
                <span className="text-[9px] font-semibold text-emerald-700">₹/quintal</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Max Price</span>
                <p className="text-sm font-black text-slate-700 font-mono">₹{mandi.maxPrice.toLocaleString()}</p>
                <span className="text-[9px] text-slate-400">₹/quintal</span>
              </div>
            </div>

            {/* Market Arrivals & Activity */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
              <span className="text-slate-600 font-semibold">Today's Wholesale Arrivals:</span>
              <span className="font-mono font-black text-slate-900">{mandi.arrivalsTons.toLocaleString()} Quintals</span>
            </div>

            {/* Trend Explanation Callout */}
            <div className={`p-4 rounded-2xl border ${trendStyle.bg} space-y-1 text-xs`}>
              <div className="flex items-center space-x-1.5 font-bold">
                <TrendIcon className="w-4 h-4" />
                <span>{trendStyle.label}</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">{mandi.trendDescription}</p>
            </div>
          </div>

          {/* Official Source Provenance Citation */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Source: {mandi.source}</span>
            </span>
            <span className="font-semibold text-emerald-800">Verified APMC</span>
          </div>

        </div>

        {/* RIGHT COLUMN: 8-WEEK RECHARTS HISTORY + HARVEST FORECAST (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Recharts Historical Price Trend */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  <span>8-Week Wholesale Modal Price Trend (₹/q)</span>
                </h3>
                <p className="text-[11px] text-slate-500">Historical weekly market price movements</p>
              </div>

              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                Current: ₹{mandi.modalPrice}/q
              </span>
            </div>

            {/* Recharts Composed Area Chart with Physical Mandi Arrivals */}
            <div className="h-60 sm:h-68 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mandi.weeklyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradientMandi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis
                    yAxisId="price"
                    tick={{ fontSize: 11, fill: '#059669' }}
                    stroke="#059669"
                    unit="₹"
                    domain={['dataMin - 80', 'dataMax + 80']}
                  />
                  <YAxis
                    yAxisId="arr"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    stroke="#94a3b8"
                    unit=" T"
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-white/10 text-xs space-y-1">
                            <span className="font-bold text-slate-300 block border-b border-white/10 pb-1">{d.week}</span>
                            <p className="text-emerald-400 font-bold">Modal Price: ₹{d.price.toLocaleString()} / quintal</p>
                            {d.arrivals && (
                              <p className="text-blue-300 font-semibold">Market Arrivals: {d.arrivals.toLocaleString()} MT</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 11 }} />
                  <Bar
                    yAxisId="arr"
                    dataKey="arrivals"
                    name="Arrivals (Tons)"
                    fill="#cbd5e1"
                    radius={[4, 4, 0, 0]}
                    opacity={0.65}
                  />
                  <Area
                    yAxisId="price"
                    type="monotone"
                    dataKey="price"
                    name="Modal Price (₹/q)"
                    stroke="#059669"
                    strokeWidth={2.8}
                    fillOpacity={1}
                    fill="url(#priceGradientMandi)"
                  />
                  <ReferenceLine
                    yAxisId="price"
                    y={mandi.modalPrice}
                    stroke="#047857"
                    strokeDasharray="3 3"
                    label={{ value: `Current ₹${mandi.modalPrice}`, fill: '#047857', fontSize: 10 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Econometric Harvest Arrival Price Forecast */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-3xl p-5 sm:p-6 text-white space-y-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-600/50 border border-emerald-400/40 text-emerald-100">
                Econometric Harvest Price Forecast
              </span>

              <span className="text-[10px] text-slate-300 font-mono">
                {mandi.harvestForecast.reliability}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-emerald-300 block">Forecast Modal Price at Harvest:</span>
                <p className="text-3xl font-black font-mono tracking-tight mt-0.5 text-white">
                  ₹{mandi.harvestForecast.forecastModalPrice.toLocaleString()} <span className="text-xs font-normal text-slate-300">/ quintal</span>
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Expected Band: <strong className="text-emerald-300 font-mono">₹{mandi.harvestForecast.confidenceBand[0].toLocaleString()} - ₹{mandi.harvestForecast.confidenceBand[1].toLocaleString()}</strong>
                </p>
              </div>

              <div className="bg-white/10 rounded-2xl p-3.5 space-y-1 text-xs">
                <span className="text-emerald-300 font-bold block">Harvest Window: {mandi.harvestForecast.period}</span>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  {mandi.harvestForecast.seasonalityNote}
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 italic pt-1 border-t border-white/10">
              * Non-guaranteed econometric estimate based on 10-year arrival seasonality indices. Actual realization depends on final pan-India acreage and weather conditions.
            </div>
          </div>

          {/* Nearby Regional APMC Comparison Table */}
          {mandi.nearbyMarkets && mandi.nearbyMarkets.length > 0 && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Nearby Regional APMC Markets Comparison</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2 px-3">APMC Market</th>
                      <th className="py-2 px-3">Distance</th>
                      <th className="py-2 px-3 text-right">Min Price</th>
                      <th className="py-2 px-3 text-right">Modal Price</th>
                      <th className="py-2 px-3 text-right">Max Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mandi.nearbyMarkets.map((nm, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 text-slate-700">
                        <td className="py-2 px-3 font-semibold text-slate-900">{nm.name}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono">{nm.distanceKm} km</td>
                        <td className="py-2 px-3 text-right font-mono">₹{nm.minPrice}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">₹{nm.modalPrice}</td>
                        <td className="py-2 px-3 text-right font-mono">₹{nm.maxPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
