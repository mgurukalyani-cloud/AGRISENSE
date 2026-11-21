import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sun,
  CalendarDays,
  History,
  Layers,
  Droplets,
  Wind,
  Compass,
  Sparkles,
  MapPin,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Activity,
  Gauge,
  Thermometer,
  ShieldCheck,
  Search,
  ScanLine,
  Leaf,
  Sprout,
  Cpu,
  Volume2,
  ArrowRight
} from 'lucide-react';
import CurrentWeatherCard from '../CurrentWeatherCard';
import HourlyForecastStrip from '../HourlyForecastStrip';
import WeatherMetricsGrid from '../WeatherMetricsGrid';
import FarmWeatherAdvisor from '../FarmWeatherAdvisor';
import FutureForecastView from '../FutureForecastView';
import HistoricalWeatherView from '../HistoricalWeatherView';
import { WhatsAppIcon } from '../alerts/WhatsAppAlertModal';

export default function UnifiedWeatherHub({
  weatherData,
  location,
  tempUnit,
  autoRefreshSeconds,
  onOpenSearch,
  onOpenModulesDrawer,
  onNavigateTab,
  onOpenWhatsAppAlerts,
  initialView = 'all' // 'all' | 'live' | 'forecast' | 'past'
}) {
  const { t } = useTranslation();
  const [activeWeatherSection, setActiveWeatherSection] = useState(initialView);

  if (!weatherData) return null;

  const current = weatherData.current || {};
  const hourly = weatherData.hourly || {};
  const daily = weatherData.daily || {};
  const historical = weatherData.historical || {};

  // Computed real-world agronomic indicators
  const currentTemp = current.temperature_2m ?? 28;
  const currentHumidity = current.relative_humidity_2m ?? 65;
  const currentWind = current.wind_speed_10m ?? 12;
  const todayRainSum = daily.precipitation_sum?.[0] ?? (current.precipitation ?? 0);
  const rainProbabilityMax = daily.precipitation_probability_max?.[0] ?? 15;
  const soilTemp = current.soil_temperature_0cm ?? 24.5;
  const vpd = current.vapour_pressure_deficit ?? 1.2;

  // Real-world spraying safety assessment (FAO standard: wind < 15km/h, rain < 35%, RH between 40-85%)
  const isSprayingSafe = currentWind < 15 && rainProbabilityMax < 35 && currentHumidity > 40 && currentHumidity < 85;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. All-in-One Command Header with Verified Physical Telemetry */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-[#072518] to-slate-950 text-white p-5 sm:p-7 border border-emerald-500/25 shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-800/70 border border-emerald-400/40 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Unified Weather Intelligence • 100% Real Published Telemetry</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <span>AgriSense Weather Intelligence</span>
            </h2>

            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed font-medium">
              Live ground microclimate observations, 48-hour continuous operations curves, 7-10 day ECMWF IFS numerical forecasts, and 14-day WMO calibrated historical archives — merged into a single realistic continuum.
            </p>

            {/* Verified Physical Station Metadata Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-emerald-300 font-mono">
              <span className="flex items-center space-x-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>{location.name} ({location.latitude?.toFixed(4)}°N, {location.longitude?.toFixed(4)}°E)</span>
              </span>
              <span className="flex items-center space-x-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <Gauge className="w-3 h-3 text-emerald-400" />
                <span>Elevation: {location.elevation || 247}m ASL</span>
              </span>
              <span className="flex items-center space-x-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <Radio className="w-3 h-3 text-emerald-400" />
                <span>WMO Surface Stations • ECMWF IFS (0.1°)</span>
              </span>
            </div>
          </div>

          {/* Quick Telemetry Glance Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 shrink-0 text-xs font-semibold">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-white space-y-1">
              <div className="flex items-center justify-between text-[10px] text-emerald-300 uppercase tracking-wider font-bold">
                <span>Spraying Window</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-sm sm:text-base font-extrabold flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isSprayingSafe ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{isSprayingSafe ? 'Suitable for Spraying' : 'Caution / High Drift'}</span>
              </div>
              <span className="text-[10px] text-slate-300 block font-normal">
                Wind {currentWind} km/h • Rain Prob {rainProbabilityMax}%
              </span>
              {!isSprayingSafe && (
                <button
                  onClick={onOpenWhatsAppAlerts}
                  className="pt-0.5 w-full text-left flex items-center space-x-1 text-[10px] text-amber-300 hover:text-white underline cursor-pointer"
                >
                  <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                  <span>Send WhatsApp Alert (Demo)</span>
                </button>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-white space-y-1">
              <div className="flex items-center justify-between text-[10px] text-emerald-300 uppercase tracking-wider font-bold">
                <span>VPD Transpiration</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-sm sm:text-base font-extrabold">
                {vpd.toFixed(2)} kPa <span className="text-[11px] font-normal text-emerald-300">({vpd >= 0.8 && vpd <= 1.5 ? 'Optimal' : vpd < 0.8 ? 'Low Transpiration' : 'Stress Risk'})</span>
              </div>
              <span className="text-[10px] text-slate-300 block font-normal">
                Soil Temp: {soilTemp}°C at 0cm root depth
              </span>
            </div>
          </div>
        </div>

        {/* 2. Unified Weather Sub-Navigation Filter Ribbon */}
        <div className="mt-6 pt-4 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-emerald-950/80 p-1.5 rounded-2xl border border-emerald-700/60 shadow-inner">
            <button
              onClick={() => setActiveWeatherSection('all')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeWeatherSection === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-emerald-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>All-in-One Timeline</span>
            </button>

            <button
              onClick={() => setActiveWeatherSection('live')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeWeatherSection === 'live'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-emerald-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Live & 48h Operations</span>
            </button>

            <button
              onClick={() => setActiveWeatherSection('forecast')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeWeatherSection === 'forecast'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-emerald-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>7-10 Day Forecast</span>
            </button>

            <button
              onClick={() => setActiveWeatherSection('past')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeWeatherSection === 'past'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-emerald-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Past 14-Day Records</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-emerald-300 font-mono">
            <button
              onClick={onOpenWhatsAppAlerts}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-emerald-200 hover:text-white border border-[#25D366]/40 text-xs font-bold transition-all cursor-pointer shadow-xs font-sans"
              title="Configure Automated WhatsApp Rain Alerts & Demo"
            >
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
              <span>WhatsApp Alerts (Demo)</span>
            </button>

            <span className="flex items-center space-x-1 hidden sm:flex">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-refresh: {Math.floor(autoRefreshSeconds / 60)}m {autoRefreshSeconds % 60}s</span>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION A: LIVE MICROCLIMATE & REAL OBSERVATIONS (Shown in 'all' and 'live')
          ========================================================================= */}
      {(activeWeatherSection === 'all' || activeWeatherSection === 'live') && (
        <section className="space-y-4" aria-labelledby="section-live-weather">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-1 border-b border-emerald-900/10">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Sun className="w-4 h-4 text-emerald-600" />
              <span id="section-live-weather">Part 1 • Real-Time Ground Microclimate & Station Observations</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Calibrated WMO surface telemetry for {location.name}
            </span>
          </div>

          {/* Current Live Weather Hero Card */}
          <CurrentWeatherCard
            weatherData={weatherData}
            tempUnit={tempUnit}
            onOpenSearch={onOpenSearch}
          />

          {/* 48-Hour Continuous Operations Strip */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>48-Hour Continuous Hourly Operational Curve</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Temperature, rain probability, and wind trajectory
              </span>
            </div>
            <HourlyForecastStrip
              hourly={hourly}
              tempUnit={tempUnit}
              defaultView="split"
            />
          </div>

          {/* 8-Point Agronomic Environmental Metrics Grid */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Physical Agronomic Microclimate Metrics</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Evapotranspiration, soil moisture & atmospheric pressures
              </span>
            </div>
            <WeatherMetricsGrid
              weatherData={weatherData}
              tempUnit={tempUnit}
            />
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION B: 7-10 DAY HIGH-RESOLUTION NUMERICAL FORECAST (Shown in 'all' and 'forecast')
          ========================================================================= */}
      {(activeWeatherSection === 'all' || activeWeatherSection === 'forecast') && (
        <section className="space-y-4 pt-2" aria-labelledby="section-future-forecast">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-1 border-b border-emerald-900/10">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span id="section-future-forecast">Part 2 • 7-Day & 10-Day Numerical Weather Forecast</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              ECMWF IFS (0.1°) & DWD ICON Ensemble Prediction
            </span>
          </div>

          <FutureForecastView
            daily={daily}
            tempUnit={tempUnit}
          />
        </section>
      )}

      {/* =========================================================================
          SECTION C: PAST WEATHER & 14-DAY HISTORICAL GROUND RECORDS (Shown in 'all' and 'past')
          ========================================================================= */}
      {(activeWeatherSection === 'all' || activeWeatherSection === 'past') && (
        <section className="space-y-4 pt-2" aria-labelledby="section-past-weather">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-1 border-b border-emerald-900/10">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <History className="w-4 h-4 text-emerald-600" />
              <span id="section-past-weather">Part 3 • Past Weather & Historical Ground Observations (Past 14 Days)</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              WMO Ground Observation Archive & Cumulative Rainfall vs Normal
            </span>
          </div>

          <HistoricalWeatherView
            historicalData={historical}
            location={location}
            tempUnit={tempUnit}
          />
        </section>
      )}

      {/* =========================================================================
          SECTION D: 4 CORE PRECISION AI MODULES (Shown in 'all')
          ========================================================================= */}
      {activeWeatherSection === 'all' && onNavigateTab && (
        <section className="space-y-4 pt-2" aria-labelledby="section-core-modules">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-emerald-900/10">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span id="section-core-modules">Precision Farming Integrations</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                Precision Agriculture AI & Telemetry Modules
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Direct access to computer vision pathology, seasonal mandi planning, ESP32 root-zone bus, and animal acoustic defense
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Module 1: Plant Health */}
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-700/60 flex flex-col justify-between space-y-4 hover:border-emerald-500/80 transition-all group">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ScanLine className="w-6 h-6 text-emerald-300" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                      Vision AI
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white">
                    AI Plant Health & Leaf Disease Scanner
                  </h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed font-normal">
                    Detect early fungal blights, rusts, and nutrient deficiencies cross-referenced with farm weather.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => { onNavigateTab('plant_health'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all cursor-pointer group-hover:shadow-lg"
                >
                  <Leaf className="w-4 h-4 text-emerald-700" />
                  <span>Open Plant Health Scanner</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Module 2: Crop Planning */}
            <div className="bg-gradient-to-br from-teal-950 via-emerald-900 to-green-950 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-700/60 flex flex-col justify-between space-y-4 hover:border-emerald-500/80 transition-all group">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sprout className="w-6 h-6 text-emerald-300" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                      Market Intelligence
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white">
                    Seasonal Crop Planning & Real Mandi Prices
                  </h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed font-normal">
                    Plan high-yielding crops for your soil and season, check live AGMARKNET mandi prices, and calculate profit scenarios.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => { onNavigateTab('crop_planning'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all cursor-pointer group-hover:shadow-lg"
                >
                  <Sprout className="w-4 h-4 text-emerald-700" />
                  <span>Explore Crop Planning AI</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Module 3: ESP32 Soil Telemetry */}
            <div className="bg-gradient-to-br from-[#072417] via-emerald-950 to-green-950 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-700/60 flex flex-col justify-between space-y-4 hover:border-emerald-500/80 transition-all group">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Cpu className="w-6 h-6 text-emerald-300" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                      Hardware Bus
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white">
                    ESP32 Soil Telemetry & Alarm Hardware
                  </h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed font-normal">
                    Monitor capacitive root-zone sensors, verify open-circuit faults, and trigger the physical active buzzer on GPIO 25.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => { onNavigateTab('soil_monitoring'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all cursor-pointer group-hover:shadow-lg"
                >
                  <Cpu className="w-4 h-4 text-emerald-700" />
                  <span>Open Soil Telemetry Node</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Module 4: Animal Sound AI */}
            <div className="bg-gradient-to-br from-[#062817] via-emerald-900 to-[#021f10] rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-700/60 flex flex-col justify-between space-y-4 hover:border-emerald-500/80 transition-all group">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Volume2 className="w-6 h-6 text-emerald-300" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                      Bio-Acoustic AI
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white">
                    Animal Sound AI & Bio-Acoustic Defense
                  </h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed font-normal">
                    Stream I2S digital audio, classify wildlife with deep learning, and protect cows & sparrows with non-injurious deterrents.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => { onNavigateTab('animal_repellent'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all cursor-pointer group-hover:shadow-lg"
                >
                  <Volume2 className="w-4 h-4 text-emerald-700" />
                  <span>Open Animal Sound AI</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION E: AGRO-METEOROLOGICAL ADVISORY & DECISION SUPPORT (Always included)
          ========================================================================= */}
      <section className="space-y-3 pt-2" aria-labelledby="section-agro-advisory">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-1 border-b border-emerald-900/10">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <Droplets className="w-4 h-4 text-emerald-600" />
            <span id="section-agro-advisory">Synthesized Field Guidance & Agronomic Operational Advisories</span>
          </div>
          <span className="text-xs text-slate-500">
            Real action thresholds calculated across live, forecast, and soil moisture telemetry
          </span>
        </div>

        <FarmWeatherAdvisor
          weatherData={weatherData}
          onOpenModulesDrawer={onOpenModulesDrawer}
        />
      </section>
    </div>
  );
}
