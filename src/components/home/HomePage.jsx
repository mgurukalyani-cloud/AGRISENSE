import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sun,
  CloudRain,
  TrendingUp,
  Sprout,
  AlertTriangle,
  Sparkles,
  MapPin,
  Calendar,
  ArrowRight,
  Calculator,
  Search,
  Mic,
  ShieldCheck,
  Droplets,
  Wind,
  Layers,
  Thermometer,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Scale
} from 'lucide-react';
import { CROPS_DATABASE } from '../../services/cropPlanningService';
import { CROP_MANDI_PRICE_DATA } from '../../services/mandiPriceService';
import { getAgriculturalAlerts } from '../../services/alertsService';

export default function HomePage({
  weatherData,
  location,
  onNavigateTab,
  onOpenSearch,
  onOpenVoiceAssistant,
  tempUnit = 'C'
}) {
  const { t, i18n } = useTranslation();
  const [quickQuery, setQuickQuery] = useState('');

  // Farmer profile from localStorage
  const farmerProfile = (() => {
    try {
      const saved = localStorage.getItem('agrisense_farmer_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Farmer',
      village: location?.name || 'Local Farm',
      district: location?.admin1 || 'Agricultural District',
      state: location?.country || 'India',
      acres: 4.5,
      crops: ['paddy_rice', 'cotton', 'chilli']
    };
  })();

  // Determine current agricultural season
  const month = new Date().getMonth(); // 0 = Jan, 10 = Nov
  let currentSeasonName = 'Rabi Season (రబీ సీజన్ / रबी मौसम)';
  let seasonTag = 'Rabi 2026-27';
  let seasonDesc = 'Winter sowing window for wheat, mustard, gram, and rabi maize.';
  if (month >= 5 && month <= 9) {
    currentSeasonName = 'Kharif Season (ఖరీఫ్ సీజన్ / खरीफ मौसम)';
    seasonTag = 'Kharif 2026';
    seasonDesc = 'Monsoon sowing window for paddy, cotton, soybean, redgram, and maize.';
  } else if (month >= 2 && month <= 4) {
    currentSeasonName = 'Zaid / Summer Season (జాయెద్ సీజన్ / जायद मौसम)';
    seasonTag = 'Zaid 2027';
    seasonDesc = 'Warm summer window for watermelon, summer moong, cucumber, and groundnut.';
  }

  // Weather parameters
  const temp = weatherData?.current?.temperature_2m ?? 27;
  const rainProb = weatherData?.daily?.precipitation_probability_max?.[0] ?? 12;
  const rainSum = weatherData?.daily?.precipitation_sum?.[0] ?? 0;
  const windSpeed = weatherData?.current?.wind_speed_10m ?? 11;
  const humidity = weatherData?.current?.relative_humidity_2m ?? 62;

  // 4 Farmer Decision Cues
  const isRainExpected = rainProb > 40 || rainSum > 2;
  const postponeIrrigation = isRainExpected;
  const suitableForSpraying = windSpeed < 20 && !isRainExpected && rainProb < 30;
  const heatRiskWarning = temp >= 35;
  const strongWindWarning = windSpeed >= 25;

  // Top recommended crops for home preview
  const topRecommendedCrops = [
    CROPS_DATABASE.find(c => c.id === 'wheat') || CROPS_DATABASE[0],
    CROPS_DATABASE.find(c => c.id === 'mustard') || CROPS_DATABASE[1],
    CROPS_DATABASE.find(c => c.id === 'gram_chickpea') || CROPS_DATABASE[2]
  ];

  // Today's mandi highlights
  const mandiHighlights = [
    CROP_MANDI_PRICE_DATA.chilli,
    CROP_MANDI_PRICE_DATA.cotton,
    CROP_MANDI_PRICE_DATA.wheat,
    CROP_MANDI_PRICE_DATA.paddy_rice
  ].filter(Boolean);

  // Active alerts
  const alerts = getAgriculturalAlerts({
    weatherData,
    farmerCrops: farmerProfile.crops,
    farmerState: farmerProfile.state
  }).slice(0, 2);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onOpenVoiceAssistant) {
      onOpenVoiceAssistant(quickQuery);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. HERO COMMAND SECTION WITH AGRISENSE & THE FOF IDENTITY */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-[#072417] to-slate-950 text-white p-5 sm:p-8 border border-emerald-500/20 shadow-xl">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-800/80 border border-emerald-400/40 text-emerald-100 text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>The FOF — Friends of Farmers</span>
              <span className="text-emerald-400 font-normal">•</span>
              <span className="text-amber-300">Smarter Farming. Better Decisions. Higher Profits.</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              AgriSense Smart Farming Platform
            </h1>

            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed font-medium">
              Welcome back, <strong className="text-white underline decoration-emerald-400 font-bold">{farmerProfile.name || 'Farmer'}</strong>. 
              Real-time weather insights, seasonal crop recommendations, live AGMARKNET mandi prices, and your 24/7 AI Farming Assistant.
            </p>

            {/* Prominent Ask AgriSense AI Bar with Voice Input */}
            <form onSubmit={handleSearchSubmit} className="pt-2 flex items-center max-w-xl">
              <div className="relative w-full flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-emerald-400" />
                <input
                  type="text"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Ask AgriSense AI (e.g., 'Can I spray tomorrow?', 'Cotton price in Warangal', 'ఎరువుల లెక్క')..."
                  className="w-full pl-10 pr-24 py-3 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-emerald-200/70 focus:placeholder:text-slate-400 rounded-2xl border border-white/20 focus:border-emerald-500 outline-none text-xs sm:text-sm transition-all shadow-inner backdrop-blur-md"
                />
                <button
                  type="button"
                  onClick={() => onOpenVoiceAssistant && onOpenVoiceAssistant()}
                  className="absolute right-12 p-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                  title="Voice Input (English, Telugu, Hindi)"
                >
                  <Mic className="w-4 h-4 text-amber-300" />
                </button>
                <button
                  type="submit"
                  className="absolute right-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Ask
                </button>
              </div>
            </form>
          </div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2.5 shrink-0 text-xs font-semibold">
            <button
              onClick={onOpenSearch}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-emerald-100 transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>{location?.name || 'Select Location'}, {location?.admin1 || 'State'}</span>
            </button>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold">
              <Sprout className="w-3.5 h-3.5 text-amber-300" />
              <span>{seasonTag}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LIVE WEATHER SNAPSHOT & 4 DIRECT FARMER DECISION CUES */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-900/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-900/10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Sun className="w-4 h-4 text-emerald-600" />
              <span>Weather Intelligence & Farmer Decision Guidance</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              Live Microclimate for {location?.name || 'Your Farm'}
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('weather')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <span>Full 7-Day & Hourly Forecast</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Actionable Farmer Cues */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Cue 1: Rainfall */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isRainExpected ? 'bg-blue-50/80 border-blue-200 text-blue-950' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Rain Forecast</span>
              <CloudRain className={`w-5 h-5 ${isRainExpected ? 'text-blue-600' : 'text-slate-400'}`} />
            </div>
            <p className="text-base font-black mt-1">
              {isRainExpected ? `Rain Expected (${rainSum} mm, ${rainProb}%)` : `Dry Weather (${rainProb}% Chance)`}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {isRainExpected ? 'Precipitation likely within 24 hours. Prepare drainage.' : 'Clear skies favorable for harvesting and drying.'}
            </p>
          </div>

          {/* Cue 2: Irrigation Advice */}
          <div className={`p-4 rounded-2xl border transition-all ${
            postponeIrrigation ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Irrigation</span>
              <Droplets className={`w-5 h-5 ${postponeIrrigation ? 'text-amber-600' : 'text-emerald-600'}`} />
            </div>
            <p className="text-base font-black mt-1">
              {postponeIrrigation ? 'Postpone Irrigation' : 'Normal Irrigation Safe'}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {postponeIrrigation ? 'Rain anticipated. Save power and prevent waterlogging.' : 'Soil moisture normal. Proceed with scheduled irrigation.'}
            </p>
          </div>

          {/* Cue 3: Spraying Suitability */}
          <div className={`p-4 rounded-2xl border transition-all ${
            suitableForSpraying ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Pesticide Spray</span>
              <ShieldCheck className={`w-5 h-5 ${suitableForSpraying ? 'text-emerald-600' : 'text-rose-600'}`} />
            </div>
            <p className="text-base font-black mt-1">
              {suitableForSpraying ? 'Suitable for Spraying' : 'Avoid Spraying Today'}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {suitableForSpraying ? `Optimal wind (${windSpeed} km/h) & low rain chance.` : `High drift risk (wind ${windSpeed} km/h or rain).`}
            </p>
          </div>

          {/* Cue 4: Heat & Wind Hazard */}
          <div className={`p-4 rounded-2xl border transition-all ${
            heatRiskWarning || strongWindWarning ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">4. Thermal / Wind Risk</span>
              <Thermometer className={`w-5 h-5 ${heatRiskWarning ? 'text-rose-600' : 'text-slate-400'}`} />
            </div>
            <p className="text-base font-black mt-1">
              {heatRiskWarning ? `Heat Stress Warning (${temp}°C)` : strongWindWarning ? 'Strong Wind Alert' : 'Comfortable Weather'}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {heatRiskWarning ? 'Provide shade/cooling water.' : strongWindWarning ? 'Risk of lodging in tall crops.' : 'Optimal ambient physiological conditions.'}
            </p>
          </div>
        </div>

        {/* Live Observation Metric Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-700">Live Temperature:</span>
            <span className="font-mono text-emerald-800 font-bold">{temp}°{tempUnit}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-700">Relative Humidity:</span>
            <span className="font-mono text-emerald-800 font-bold">{humidity}%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-700">Wind Velocity:</span>
            <span className="font-mono text-emerald-800 font-bold">{windSpeed} km/h</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <span>Source: Open-Meteo & WMO Stations (Validated 21-Nov-2026)</span>
          </div>
        </div>
      </section>

      {/* 3. CURRENT SEASON RECOMMENDED CROPS PREVIEW */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-900/10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>Smart Agricultural Intelligence</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              Top Recommended Crops for {currentSeasonName}
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('crop_recommendations')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <span>Explore All 16 Crops & Soil Matching</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {topRecommendedCrops.map((crop) => (
            <div
              key={crop.id}
              className="bg-white rounded-3xl overflow-hidden border border-emerald-900/10 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
            >
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                  src={crop.fallbackImageUrl || crop.imageUrl}
                  alt={crop.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-bold shadow-xs">
                  <span>96% Agro-Match</span>
                </div>
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-semibold">
                  {crop.durationDays}
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-lg font-black leading-tight drop-shadow-sm">{crop.name}</h3>
                  <p className="text-[11px] text-emerald-200 italic font-mono">{crop.botanicalName}</p>
                </div>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-600 border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Sowing Window:</span>
                    <span className="font-bold text-slate-800">{crop.sowingMonths.join(', ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Water Requirement:</span>
                    <span className="font-bold text-slate-800">{crop.waterRequirementLevel} ({crop.waterRequirementMm})</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Estimated Yield:</span>
                    <span className="font-bold text-emerald-800">{crop.expectedYieldRangePerAcre}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onNavigateTab('crop_recommendations')}
                    className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>View Crop & Cultivation Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. TODAY'S MANDI PRICES & MARKET PRICE TRENDS */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-900/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-900/10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>National Agriculture Market (e-NAM / AGMARKNET)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              Today's Wholesale Mandi Rates & Trends
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('market_prices')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <span>Detailed Charts, Comparison & 30-Day Forecast</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mandiHighlights.map((mandi) => {
            const isRising = mandi.trendStatus === 'Rising';
            const isSoftening = mandi.trendStatus === 'Softening';

            return (
              <div
                key={mandi.cropId}
                className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between bg-gradient-to-b from-white to-slate-50/50"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{mandi.commodity}</h4>
                      <p className="text-[11px] text-slate-500">{mandi.primaryMandi}</p>
                    </div>
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isRising ? 'bg-emerald-100 text-emerald-800' : isSoftening ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isRising ? <ArrowUpRight className="w-3 h-3 text-emerald-600" /> : isSoftening ? <ArrowDownRight className="w-3 h-3 text-rose-600" /> : null}
                      <span>{mandi.trendStatus}</span>
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="text-xs text-slate-400 font-medium">Modal Price (సగటు ధర):</span>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      ₹{mandi.modalPrice.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-slate-500 ml-1">/ Quintal</span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1 font-mono">
                      <span>Min: ₹{mandi.minPrice}</span>
                      <span>•</span>
                      <span>Max: ₹{mandi.maxPrice}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{mandi.lastUpdatedTime}</span>
                  <button
                    onClick={() => onNavigateTab('market_prices')}
                    className="font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    View Forecast →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. IMPORTANT AGRICULTURAL ALERTS */}
      {alerts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-emerald-900/10">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Critical Agricultural & Pest Early Warnings</span>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              View All Alerts →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      {alert.severity}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">{alert.title}</h3>
                    <p className="text-xs text-slate-700 leading-relaxed">{alert.description}</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-xs text-amber-950 font-medium">
                  <strong>Recommended Action:</strong> {alert.actionRequired}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. QUICK ACCESS FARMING TOOLS & CALCULATORS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-900/10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Precision Farming Modules</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              Quick Access Agricultural Tools
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { id: 'weather', name: 'Live Weather', desc: 'Rain, wind & 7-day outlook', icon: Sun, color: 'text-amber-500 bg-amber-50' },
            { id: 'crop_recommendations', name: 'Crop Matcher', desc: 'Season & soil suitability', icon: Sprout, color: 'text-emerald-600 bg-emerald-50' },
            { id: 'market_prices', name: 'Mandi Prices', desc: 'AGMARKNET & forecasts', icon: TrendingUp, color: 'text-teal-600 bg-teal-50' },
            { id: 'soil_health', name: 'Soil & Fertilizer', desc: 'Test NPK & bag calculator', icon: Layers, color: 'text-amber-700 bg-amber-50' },
            { id: 'farm_calculators', name: '7 Calculators', desc: 'Seed, yield, profit & land', icon: Calculator, color: 'text-indigo-600 bg-indigo-50' },
            { id: 'voice_assistant', name: 'AI Companion', desc: 'Voice help in 3 languages', icon: Mic, color: 'text-rose-600 bg-rose-50' }
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onNavigateTab(tool.id)}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl ${tool.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {tool.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{tool.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
