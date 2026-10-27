import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import NavigationTabs from './components/NavigationTabs';
import CurrentWeatherCard from './components/CurrentWeatherCard';
import WeatherMetricsGrid from './components/WeatherMetricsGrid';
import FarmWeatherAdvisor from './components/FarmWeatherAdvisor';
import HourlyForecastStrip from './components/HourlyForecastStrip';
import FutureForecastView from './components/FutureForecastView';
import HistoricalWeatherView from './components/HistoricalWeatherView';
import PlantHealthPage from './components/plantHealth/PlantHealthPage';
import CropPlanningPage from './components/cropPlanning/CropPlanningPage';
import AnimalSoundPage from './components/animalRepellent/AnimalSoundPage';
import PlatformModulesDrawer from './components/PlatformModulesDrawer';

import LocationSearchModal from './components/LocationSearchModal';
import SettingsModal from './components/SettingsModal';
import LanguageSelectorModal from './components/LanguageSelectorModal';
import VoiceFarmingAssistant from './components/voiceAssistant/VoiceFarmingAssistant';
import FloatingVoiceButton from './components/voiceAssistant/FloatingVoiceButton';
import WeatherAlertBanner from './components/WeatherAlertBanner';
import Footer from './components/Footer';

import { fetchWeatherData, reverseGeocodeCoords, DEFAULT_REAL_LOCATION } from './services/weatherApi';
import { getDemoWeatherData } from './services/demoData';
import { generateFarmAdvisories } from './services/agroAdvisor';
import { Loader2, AlertCircle, ScanLine, Leaf, ArrowRight, Sprout, Cpu, Volume2, Sparkles, Droplets, Sun, CalendarDays, Compass } from 'lucide-react';
import SoilMonitoringDashboard from './components/soil/SoilMonitoringDashboard';
import SplashScreen from './components/splash/SplashScreen';
import CoverPage from './components/splash/CoverPage';

const AUTO_REFRESH_INTERVAL_SECONDS = 900; // 15 minutes

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'live' | 'past' | 'forecast' | 'plant_health' | 'crop_planning' | 'animal_repellent' | 'farm_insights' | 'voice_assistant'
  const [location, setLocation] = useState(DEFAULT_REAL_LOCATION);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState(AUTO_REFRESH_INTERVAL_SECONDS);
  const [tempUnit, setTempUnit] = useState(() => {
    return localStorage.getItem('agrisense_temp_unit') || 'C';
  });

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isModulesDrawerOpen, setIsModulesDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isVoiceAssistantModalOpen, setIsVoiceAssistantModalOpen] = useState(false);
  const [latestPlantHealthResult, setLatestPlantHealthResult] = useState(null);
  const [showSplash, setShowSplash] = useState(false);
  const [showCoverPage, setShowCoverPage] = useState(true);

  const timerRef = useRef(null);

  // Fetch weather data for given location
  const loadWeather = useCallback(async (targetLocation) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await fetchWeatherData(targetLocation);
      setWeatherData(data);
      setAutoRefreshSeconds(AUTO_REFRESH_INTERVAL_SECONDS);
    } catch (err) {
      console.warn('Weather fetch warning:', err);
      // Fallback to cached observations or offline demo data to preserve complete UI styling and cards
      try {
        const cached = localStorage.getItem('agrisense_cached_weather');
        if (cached) {
          const parsed = JSON.parse(cached);
          setWeatherData(parsed);
          setError(`Notice: Live provider is temporarily unreachable (${err.message}). Displaying recent observations.`);
          return;
        }
      } catch (_) {}

      const demo = getDemoWeatherData();
      setWeatherData({ ...demo, location: { ...demo.location, ...targetLocation } });
      setError(`Notice: Live weather provider is temporarily busy (${err.message}). Displaying agricultural records.`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadWeather(location);
  }, [location, loadWeather]);

  // Automatic refresh interval timer (every second decrements, fires at 0)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setAutoRefreshSeconds((prev) => {
        if (prev <= 1) {
          loadWeather(location);
          return AUTO_REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [location, loadWeather]);

  // Handle GPS location request
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const resolvedLoc = await reverseGeocodeCoords(latitude, longitude);
          setLocation(resolvedLoc);
        } catch (e) {
          console.warn('GPS location resolution error:', e);
        } finally {
          setIsGeoLoading(false);
        }
      },
      (err) => {
        setIsGeoLoading(false);
        alert(`Location access denied or unavailable (${err.message}). Showing selected agricultural district.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle location selection from search or presets
  const handleSelectLocation = (newLoc) => {
    setLocation(newLoc);
  };

  // Handle temperature unit toggle
  const handleToggleTempUnit = () => {
    const nextUnit = tempUnit === 'C' ? 'F' : 'C';
    setTempUnit(nextUnit);
    localStorage.setItem('agrisense_temp_unit', nextUnit);
  };

  const handleSetTempUnit = (unit) => {
    setTempUnit(unit);
    localStorage.setItem('agrisense_temp_unit', unit);
  };

  const handleApplyCustomCoords = (lat, lon) => {
    const customLoc = {
      id: `custom-${lat}-${lon}`,
      name: `Custom Farm Plot (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`,
      admin1: 'Agricultural Coordinates',
      country: '',
      country_code: '',
      latitude: lat,
      longitude: lon,
      elevation: null,
      isDemo: false
    };
    setLocation(customLoc);
  };

  // Compute advisor score for tab badge
  const advisories = weatherData?.current && weatherData?.daily
    ? generateFarmAdvisories(weatherData.current, weatherData.daily, weatherData.hourly)
    : null;

  return (
    <div className="min-h-screen bg-[#f7faf7] text-slate-800 flex flex-col selection:bg-emerald-200 selection:text-emerald-950 font-sans antialiased">
      {/* 1. Header with live status, GPS, search, units, auto-refresh and Indian Language Switcher */}
      <Header
        location={location}
        onOpenSearch={() => setIsSearchOpen(true)}
        onUseMyLocation={handleUseMyLocation}
        onRefresh={() => loadWeather(location)}
        isRefreshing={isRefreshing}
        isGeoLoading={isGeoLoading}
        lastUpdated={weatherData?.fetchedAt || weatherData?.current?.time}
        autoRefreshSecondsLeft={autoRefreshSeconds}
        tempUnit={tempUnit}
        onToggleTempUnit={handleToggleTempUnit}
        onOpenModulesDrawer={() => setIsModulesDrawerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLanguageSelector={() => setIsLanguageModalOpen(true)}
        onOpenVoiceAssistant={() => setIsVoiceAssistantModalOpen(true)}
        onOpenSplash={() => setShowSplash(true)}
        onNavigateHome={() => { setActiveTab('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        provider={weatherData?.provider || 'Open-Meteo & WMO'}
        modelSources={weatherData?.modelSources || 'ECMWF IFS (0.1°) / DWD ICON'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* Weather Hazards Alert Banner */}
        {weatherData && (
          <WeatherAlertBanner
            weatherData={weatherData}
            tempUnit={tempUnit}
          />
        )}

        {/* Global Loading Spinner */}
        {isLoading && !weatherData && (
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-700" />
            <h2 className="text-base font-bold text-slate-800">
              Querying Genuine Meteorological Provider...
            </h2>
            <p className="text-xs text-slate-500">
              Fetching real-time published observations from Open-Meteo & WMO stations for {location.name}
            </p>
          </div>
        )}

        {/* Error Notification with Manual Retry */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold">Weather Provider Communication Error</p>
                <p className="text-slate-600 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => loadWeather(location)}
              className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold transition-colors shrink-0 cursor-pointer"
            >
              Retry Provider Call
            </button>
          </div>
        )}

        {weatherData && (
          <>
            {/* 2. Navigation Tabs (Overview / Live / Past / Forecast / Plant Health / Farm Insights) */}
            <NavigationTabs
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              advisorScore={advisories?.agriSuitabilityScore || 85}
            />

            {/* TAB CONTENT: 1. WEATHER OVERVIEW (REDESIGNED PROFESSIONAL HOME PAGE) */}
            {activeTab === 'overview' && (
              <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-300">
                {/* 1. Command Center Welcome & Telemetry Status Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-[#0a2318] to-slate-950 text-white p-5 sm:p-7 border border-emerald-500/20 shadow-md">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="space-y-2 max-w-2xl">
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>KLH Farms Precision Agriculture</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                        AgriSense Smart Farming Command Center
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed font-medium">
                        Real-world meteorological observations, ECMWF IFS 0.1° high-resolution numerical forecasts, AI leaf diagnostics, seasonal crop market intelligence, and bio-acoustic wildlife defense.
                      </p>
                    </div>

                    <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2.5 shrink-0 text-xs font-semibold">
                      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-emerald-200 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>ECMWF IFS (0.1°) Verified</span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-emerald-200 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Edge AI Telemetry Active</span>
                      </div>
                      <button
                        onClick={() => setShowCoverPage(true)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-500/40 cursor-pointer transition-colors shadow-xs"
                        title="View 5-Second KLH Farms Cover Page"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>View Cover Page</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Hero Current Weather Section */}
                <section className="space-y-3" aria-labelledby="section-current-weather">
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-900/10">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <Sun className="w-4 h-4 text-emerald-600" />
                      <span id="section-current-weather">Live Farm Microclimate & Observations</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Auto-Refresh: {Math.floor(autoRefreshSeconds / 60)}m {autoRefreshSeconds % 60}s
                    </span>
                  </div>

                  <CurrentWeatherCard
                    weatherData={weatherData}
                    tempUnit={tempUnit}
                    onOpenSearch={() => setIsSearchOpen(true)}
                  />
                </section>

                {/* 3. Core Precision AI & Telemetry Modules (Balanced 2x2 Grid) */}
                <section className="space-y-4" aria-labelledby="section-core-modules">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-emerald-900/10">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span id="section-core-modules">Intelligent Farm Operations</span>
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
                    {/* Module 1: Plant Health & Leaf Disease Scanner */}
                    <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-700/60 flex flex-col justify-between space-y-4 hover:border-emerald-500/80 transition-all group">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <ScanLine className="w-6 h-6 text-emerald-300" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                              {t('plantHealth.spotlightTag', 'AI Vision')}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-white">
                            {t('plantHealth.spotlightTitle', 'AI Plant Health & Leaf Disease Scanner')}
                          </h4>
                          <p className="text-xs text-emerald-200/90 leading-relaxed font-normal">
                            {t('plantHealth.spotlightDesc', 'Use your camera or upload leaf photographs to detect early fungal blights, rusts, and nutrient deficiencies cross-referenced with farm weather.')}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('plant_health')}
                          className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all cursor-pointer group-hover:shadow-lg"
                        >
                          <Leaf className="w-4 h-4 text-emerald-700" />
                          <span>Open Plant Health Scanner</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>

                    {/* Module 2: Seasonal Crop Planning & Real Mandi Prices */}
                    <div className="bg-gradient-to-br from-teal-950 via-emerald-900 to-green-950 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-700/60 flex flex-col justify-between space-y-4 hover:border-emerald-500/80 transition-all group">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Sprout className="w-6 h-6 text-emerald-300" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                              {t('cropPlanning.spotlightTag', 'Market Intelligence')}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-white">
                            {t('cropPlanning.spotlightTitle', 'Seasonal Crop Planning & Real Mandi Prices')}
                          </h4>
                          <p className="text-xs text-emerald-200/90 leading-relaxed font-normal">
                            {t('cropPlanning.spotlightDesc', 'Plan high-yielding crops for your soil and season, check live AGMARKNET mandi prices, and calculate cultivation expenditure, yield scenarios, and net profit.')}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('crop_planning')}
                          className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all cursor-pointer group-hover:shadow-lg"
                        >
                          <Sprout className="w-4 h-4 text-emerald-700" />
                          <span>Explore Crop Planning AI</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>

                    {/* Module 3: ESP32 Soil Telemetry & Active Buzzer */}
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
                            Monitor 4 physical capacitive root-zones (ADC1 pins 34, 35, 36, 39), verify open-circuit faults, and trigger the physical active buzzer on GPIO 25 with confirmed hardware ACK.
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('soil_monitoring')}
                          className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all cursor-pointer group-hover:shadow-lg"
                        >
                          <Cpu className="w-4 h-4 text-emerald-700" />
                          <span>Open Soil Telemetry Node</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>

                    {/* Module 4: Bio-Acoustic Wildlife Defense (INMP441 + AI Repellent) */}
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
                            Stream 16kHz I2S digital audio (SCK: 14, WS: 15, SD: 32), classify wildlife with PyTorch deep learning, and protect cows & sparrows with non-injurious deterrents.
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('animal_repellent')}
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

                {/* 4. Atmospheric & Agronomic Metrics Grid */}
                <section className="space-y-3" aria-labelledby="section-agronomic-metrics">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-1 border-b border-emerald-900/10">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <Compass className="w-4 h-4 text-emerald-600" />
                      <span id="section-agronomic-metrics">8-Point Agronomic Environmental Metrics</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Evapotranspiration, Dew Point, Soil Moisture & Atmospheric Pressures
                    </span>
                  </div>

                  <WeatherMetricsGrid
                    weatherData={weatherData}
                    tempUnit={tempUnit}
                  />
                </section>

                {/* 5. 24-Hour Operations Timeline & Hourly Forecast */}
                <section className="space-y-3" aria-labelledby="section-hourly-forecast">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-1 border-b border-emerald-900/10">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <CalendarDays className="w-4 h-4 text-emerald-600" />
                      <span id="section-hourly-forecast">24-Hour Hourly Operations Forecast</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Hourly temperature trend, precipitation probability, and wind trajectory
                    </span>
                  </div>

                  <HourlyForecastStrip
                    hourly={weatherData.hourly}
                    tempUnit={tempUnit}
                  />
                </section>

                {/* 6. Smart Agro-Advisory & Field Operations */}
                <section className="space-y-3" aria-labelledby="section-agro-advisory">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-1 border-b border-emerald-900/10">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <Droplets className="w-4 h-4 text-emerald-600" />
                      <span id="section-agro-advisory">Agro-Meteorological Advisory & Field Guidance</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Suitability index for spraying, irrigation, and field machinery
                    </span>
                  </div>

                  <FarmWeatherAdvisor
                    weatherData={weatherData}
                    onOpenModulesDrawer={() => setIsModulesDrawerOpen(true)}
                  />
                </section>
              </div>
            )}

            {/* TAB CONTENT: 2. LIVE WEATHER */}
            {activeTab === 'live' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                <CurrentWeatherCard
                  weatherData={weatherData}
                  tempUnit={tempUnit}
                  onOpenSearch={() => setIsSearchOpen(true)}
                />
                <HourlyForecastStrip
                  hourly={weatherData.hourly}
                  tempUnit={tempUnit}
                />
                <WeatherMetricsGrid
                  weatherData={weatherData}
                  tempUnit={tempUnit}
                />
              </div>
            )}

            {/* TAB CONTENT: 3. PAST WEATHER (HISTORICAL RECORDS) */}
            {activeTab === 'past' && (
              <div className="animate-in fade-in duration-300">
                <HistoricalWeatherView
                  historicalData={weatherData.historical}
                  location={location}
                  tempUnit={tempUnit}
                />
              </div>
            )}

            {/* TAB CONTENT: 4. WEATHER FORECAST (7-10 DAYS) */}
            {activeTab === 'forecast' && (
              <div className="animate-in fade-in duration-300">
                <FutureForecastView
                  daily={weatherData.daily}
                  tempUnit={tempUnit}
                />
              </div>
            )}

            {/* TAB CONTENT: 5. PLANT HEALTH & LEAF DISEASE ANALYSIS (EXTENSION MODULE) */}
            {activeTab === 'plant_health' && (
              <div className="animate-in fade-in duration-300">
                <PlantHealthPage
                  currentWeather={weatherData.current}
                  dailyWeather={weatherData.daily}
                  location={location}
                  tempUnit={tempUnit}
                  onAnalysisResultChange={setLatestPlantHealthResult}
                />
              </div>
            )}

            {/* TAB CONTENT: 6. SEASONAL CROP PLANNING & MARKET INTELLIGENCE */}
            {activeTab === 'crop_planning' && (
              <div className="animate-in fade-in duration-300">
                <CropPlanningPage
                  currentWeather={weatherData.current}
                  dailyWeather={weatherData.daily}
                  location={location}
                  tempUnit={tempUnit}
                />
              </div>
            )}

            {/* TAB CONTENT: SOIL & HARDWARE TELEMETRY */}
            {activeTab === 'soil_monitoring' && (
              <div className="animate-in fade-in duration-300">
                <SoilMonitoringDashboard />
              </div>
            )}

            {/* TAB CONTENT: 7. AI ANIMAL SOUND RECOGNITION & REPELLENT */}
            {activeTab === 'animal_repellent' && (
              <div className="animate-in fade-in duration-300">
                <AnimalSoundPage location={location} />
              </div>
            )}

            {/* TAB CONTENT: 8. FARM INSIGHTS (WEATHER ADVISOR) */}
            {activeTab === 'farm_insights' && (

              <div className="animate-in fade-in duration-300 space-y-6">
                <FarmWeatherAdvisor
                  weatherData={weatherData}
                  onOpenModulesDrawer={() => setIsModulesDrawerOpen(true)}
                />
              </div>
            )}

            {/* TAB CONTENT: 7. MULTILINGUAL VOICE FARMING ASSISTANT */}
            {activeTab === 'voice_assistant' && (
              <div className="animate-in fade-in duration-300">
                <VoiceFarmingAssistant
                  currentWeather={weatherData.current}
                  dailyWeather={weatherData.daily}
                  historicalWeather={weatherData.historical}
                  plantHealthResult={latestPlantHealthResult}
                  location={location}
                  isModal={false}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Multilingual Voice Assistant Button */}
      <FloatingVoiceButton
        onClick={() => setIsVoiceAssistantModalOpen(true)}
        isOpen={isVoiceAssistantModalOpen || activeTab === 'voice_assistant'}
      />

      {/* Footer */}
      <Footer
        onOpenModulesDrawer={() => setIsModulesDrawerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Modals and Drawers */}
      <LocationSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectLocation={handleSelectLocation}
        currentLocation={location}
        onUseMyLocation={handleUseMyLocation}
        isGeoLoading={isGeoLoading}
      />

      <PlatformModulesDrawer
        isOpen={isModulesDrawerOpen}
        onClose={() => setIsModulesDrawerOpen(false)}
        onNavigateTab={(tabId) => {
          setActiveTab(tabId);
          setIsModulesDrawerOpen(false);
        }}
      />


      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tempUnit={tempUnit}
        onSetTempUnit={handleSetTempUnit}
        currentLocation={location}
        onApplyCustomCoords={handleApplyCustomCoords}
        onOpenLanguageSelector={() => setIsLanguageModalOpen(true)}
      />

      {/* Global Indian Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />

      {/* Global Multilingual Voice Assistant Modal Overlay */}
      {isVoiceAssistantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <VoiceFarmingAssistant
              currentWeather={weatherData?.current}
              dailyWeather={weatherData?.daily}
              historicalWeather={weatherData?.historical}
              plantHealthResult={latestPlantHealthResult}
              location={location}
              onClose={() => setIsVoiceAssistantModalOpen(false)}
              isModal={true}
            />
          </div>
        </div>
      )}

      {/* KLH Farms Welcome / Splash Screen (Opens First) */}
      {/* 5-Second KLH Farms Cover Page */}
      {showCoverPage && (
        <CoverPage onFinish={() => setShowCoverPage(false)} />
      )}

      {showSplash && (
        <SplashScreen onEnterDashboard={() => setShowSplash(false)} />
      )}
    </div>
  );
}
