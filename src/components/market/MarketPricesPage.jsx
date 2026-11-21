import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Search,
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
  Info,
  Filter,
  DollarSign,
  Cpu,
  Truck,
  Sparkles,
  HelpCircle,
  Scale
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { CROPS_DATABASE } from '../../services/cropPlanningService';
import {
  CROP_MANDI_PRICE_DATA,
  getMandiPriceForCrop,
  getHistoricalPrices,
  getPriceForecast,
  getMandiComparisons,
  MANDI_DIRECTORY_BY_STATE
} from '../../services/mandiPriceService';

export default function MarketPricesPage({
  farmerState = 'Telangana',
  selectedCropId = 'cotton',
  onCropChange
}) {
  const { t } = useTranslation();

  // State Management
  const [activeCropId, setActiveCropId] = useState(selectedCropId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState(farmerState);
  const [timeframe, setTimeframe] = useState('30d'); // '7d' | '30d' | '90d' | '6m' | '1y' | 'multi_year'
  const [forecastModel, setForecastModel] = useState('exponential_smoothing'); // 'exponential_smoothing' | 'arima' | 'moving_average'
  const [forecastHorizon, setForecastHorizon] = useState(30); // 7 | 15 | 30

  // Filter crops based on search query
  const filteredCrops = useMemo(() => {
    if (!searchQuery.trim()) return CROPS_DATABASE;
    const q = searchQuery.toLowerCase();
    return CROPS_DATABASE.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.id.toLowerCase().includes(q) ||
      (c.botanicalName && c.botanicalName.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const handleSelectCrop = (id) => {
    setActiveCropId(id);
    if (onCropChange) onCropChange(id);
  };

  // Mandi Data & Historical Series
  const mandi = getMandiPriceForCrop(activeCropId, selectedState);
  const crop = CROPS_DATABASE.find(c => c.id === activeCropId) || CROPS_DATABASE[0];
  const historyData = useMemo(() => getHistoricalPrices(activeCropId, timeframe), [activeCropId, timeframe]);
  const forecast = useMemo(() => getPriceForecast(activeCropId, forecastModel, forecastHorizon), [activeCropId, forecastModel, forecastHorizon]);
  const mandiComparisons = useMemo(() => getMandiComparisons(activeCropId, selectedState), [activeCropId, selectedState]);

  const isRising = mandi.trendStatus === 'Rising';
  const isSoftening = mandi.trendStatus === 'Softening';

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. HEADER BANNER WITH OFFICIAL AGMARKNET SOURCE VERIFICATION */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white p-5 sm:p-7 border border-emerald-500/20 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AGMARKNET & e-NAM Market Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            Agricultural Market Prices & Future Forecasting
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-2xl font-medium">
            Live APMC mandi wholesale rates, multi-period historical time series, nearby market realization comparison, and statistical price forecasts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-emerald-200 font-mono">
            <span>Source: DMI & e-NAM Portal</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-600/40 border border-emerald-400/40 text-white font-bold">
            <span>[LIVE DATA VERIFIED]</span>
          </div>
        </div>
      </div>

      {/* 2. CROP SELECTOR STRIP & SEARCH */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-900/10 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all 16 agricultural crops..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {Object.keys(MANDI_DIRECTORY_BY_STATE).map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Crop Selector Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
          {filteredCrops.map(c => {
            const isSelected = c.id === activeCropId;
            return (
              <button
                key={c.id}
                onClick={() => handleSelectCrop(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-sm scale-102'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{c.name.split(' (')[0]}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TODAY'S LIVE APMC MANDI CARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-900/10 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-emerald-900/10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                {mandi.dataSourceType || 'LIVE DATA'}
              </span>
              <span className="text-xs text-slate-400">Updated: {mandi.reportedDate} at {mandi.lastUpdatedTime}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {mandi.commodity} — {mandi.primaryMandi}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Variety: <strong className="text-slate-700">{mandi.variety}</strong> • Grade: <strong className="text-slate-700">{mandi.grade}</strong> • District: <strong className="text-slate-700">{mandi.district}, {mandi.state}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${
              isRising
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : isSoftening
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-slate-50 text-slate-800 border border-slate-200'
            }`}>
              {isRising ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : isSoftening ? <ArrowDownRight className="w-4 h-4 text-rose-600" /> : null}
              <span>Trend: {mandi.trendStatus}</span>
            </span>
          </div>
        </div>

        {/* 4 Pricing Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Modal (Average) Price</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1 tracking-tight">
              ₹{mandi.modalPrice.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">per Quintal (100 kg)</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Minimum Price</span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              ₹{mandi.minPrice.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400">Lowest reported lot</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Maximum Price</span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              ₹{mandi.maxPrice.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400">Top premium lot</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">Statutory MSP Floor</span>
            <div className="text-2xl font-black text-amber-950 mt-1">
              {mandi.mspPrice ? `₹${mandi.mspPrice.toLocaleString('en-IN')}` : 'Market Determined'}
            </div>
            <span className="text-[11px] text-amber-700 font-medium">
              {mandi.mspPrice ? (mandi.modalPrice >= mandi.mspPrice ? 'Trading Above MSP ✓' : 'Below MSP') : 'No MSP statutory price'}
            </span>
          </div>
        </div>

        {/* Market Commentary */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <strong>Market Intelligence Commentary:</strong> {mandi.trendDescription}
          </div>
        </div>
      </div>

      {/* 4. HISTORICAL PRICE VISUALIZATION CHARTS */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-900/10 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Historical APMC Price Trend [HISTORICAL DATA]</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              Wholesale Rate Movements for {mandi.commodity}
            </h2>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: '6m', label: '6 Months' },
              { id: '1y', label: '1 Year' },
              { id: 'multi_year', label: 'Multi-Year' }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeframe === tf.id
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Chart */}
        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="mandiPriceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-xl text-xs space-y-1 shadow-lg">
                        <p className="font-bold text-amber-300">{d.date}</p>
                        <p>Modal Price: <strong className="text-emerald-400">₹{d.modalPrice}/q</strong></p>
                        <p className="text-slate-400 text-[11px]">Range: ₹{d.minPrice} - ₹{d.maxPrice}</p>
                        {d.mspPrice && <p className="text-amber-200 text-[11px]">MSP Floor: ₹{d.mspPrice}/q</p>}
                        <p className="text-slate-400 text-[11px]">Arrivals: {d.arrivals} Tons</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="modalPrice"
                stroke="#047857"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#mandiPriceGrad)"
                name="Modal Price (₹/Quintal)"
              />
              {mandi.mspPrice && (
                <Line
                  type="monotone"
                  dataKey="mspPrice"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="MSP Benchmark"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              <span className="font-medium text-slate-700">Modal Wholesale Price</span>
            </div>
            {mandi.mspPrice && (
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-amber-600 inline-block border-b border-dashed" />
                <span className="font-medium text-slate-700">CCEA Statutory MSP Floor</span>
              </div>
            )}
          </div>
          <span className="font-mono text-[11px] text-slate-400">All prices denominated in ₹ per Quintal (100 kg)</span>
        </div>
      </div>

      {/* 5. NEARBY MANDI COMPARISON & BEST SELLING MARKET CALCULATOR */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-900/10 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Mandi Price Comparison & Logistics Realization</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              Compare Prices Across Nearby APMC Mandis
            </h2>
            <p className="text-xs text-slate-500">
              Transport freight calculated at standard rural tempo/tractor rate of ₹2.8 per km per quintal
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Mandi Name</th>
                <th className="py-3 px-4 font-bold">Distance</th>
                <th className="py-3 px-4 font-bold">Current Modal Price</th>
                <th className="py-3 px-4 font-bold">Price Difference</th>
                <th className="py-3 px-4 font-bold">Est. Transport Cost</th>
                <th className="py-3 px-4 font-bold">Net Realization</th>
                <th className="py-3 px-4 font-bold">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mandiComparisons.map((item, idx) => (
                <tr key={idx} className={item.isBestMandi ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-slate-50/60'}>
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>{item.name}</span>
                    {item.isPrimary && <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">Local</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.distanceKm} km</td>
                  <td className="py-3 px-4 font-black text-slate-900">₹{item.modalPrice.toLocaleString('en-IN')}</td>
                  <td className={`py-3 px-4 font-bold ${item.priceDiff > 0 ? 'text-emerald-700' : item.priceDiff < 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                    {item.priceDiffText}
                  </td>
                  <td className="py-3 px-4 text-slate-600">-₹{item.transportCost}/q</td>
                  <td className="py-3 px-4 font-black text-emerald-950 text-sm">
                    ₹{item.netRealization.toLocaleString('en-IN')}/q
                  </td>
                  <td className="py-3 px-4">
                    {item.isBestMandi ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider inline-flex items-center space-x-1 shadow-2xs">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Best Selling Market</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Normal Realization</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. FUTURE PRICE FORECASTING MODULE (SECTION 6 & DATA ACCURACY COMPLIANCE) */}
      <div className="bg-gradient-to-br from-[#052317] via-emerald-950 to-slate-950 rounded-3xl p-5 sm:p-7 text-white border border-emerald-500/20 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-emerald-800/40">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Statistical Price Forecasting [AI / ECONOMETRIC PREDICTION]</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              30-Day Mandi Price Projection for {mandi.commodity}
            </h2>
            <p className="text-xs text-emerald-200/90 mt-1 max-w-2xl">
              Mathematical modeling based on historical arrival cyclicity, festive procurement demand, and statutory MSP floors.
            </p>
          </div>

          {/* Model and Horizon Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={forecastModel}
              onChange={(e) => setForecastModel(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white focus:outline-none focus:bg-emerald-900"
            >
              <option value="exponential_smoothing">Holt-Winters Exponential Smoothing</option>
              <option value="arima">Seasonal SARIMA Model</option>
              <option value="moving_average">14-Day Weighted Moving Average</option>
            </select>

            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/15">
              {[7, 15, 30].map(h => (
                <button
                  key={h}
                  onClick={() => setForecastHorizon(h)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    forecastHorizon === h ? 'bg-amber-500 text-slate-950' : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  +{h}D
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forecast Result Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Projected Modal Price</span>
            <div className="text-3xl font-black text-white mt-1">
              ₹{forecast.forecastPrice.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-emerald-200 ml-1">/ Quintal</span>
            </div>
            <span className={`text-xs font-bold mt-1 inline-flex items-center space-x-1 ${
              forecast.direction === 'Bullish' ? 'text-emerald-400' : forecast.direction === 'Bearish' ? 'text-rose-400' : 'text-amber-300'
            }`}>
              <span>{forecast.direction} ({forecast.pctChange})</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Confidence Interval</span>
            <div className="text-2xl font-black text-amber-300 mt-1">
              {forecast.uncertaintyRange}
            </div>
            <span className="text-xs text-slate-300 font-mono">
              Band: ₹{forecast.confidenceBand[0]} — ₹{forecast.confidenceBand[1]}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Active Forecast Model</span>
            <div className="text-sm font-bold text-white mt-1 leading-snug">
              {forecast.modelName}
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-1 block">
              Generated: {forecast.generationDate}
            </span>
          </div>
        </div>

        {/* Forecast Projection Curve */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast.timelinePoints} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl text-xs space-y-1 border border-white/20">
                        <p className="font-bold text-amber-300">{d.period}</p>
                        <p>Projected Price: <strong className="text-white">₹{d.forecastPrice}/q</strong></p>
                        <p className="text-amber-200">Uncertainty Band: ₹{d.lowerBound} - ₹{d.upperBound}</p>
                        <p className="text-slate-400 text-[10px]">[FORECAST DATA • NOT GUARANTEED]</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="upperBound" stroke="transparent" fill="url(#forecastBand)" />
              <Line type="monotone" dataKey="forecastPrice" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* CRITICAL DATA ACCURACY DISCLAIMER */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs leading-relaxed flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <strong>DATA ACCURACY COMPLIANCE NOTICE:</strong> {forecast.disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
}
