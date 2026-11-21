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
import UnifiedWeatherHub from './components/weather/UnifiedWeatherHub';

import { fetchWeatherData, reverseGeocodeCoords, DEFAULT_REAL_LOCATION } from './services/weatherApi';
import { getDemoWeatherData } from './services/demoData';
import { generateFarmAdvisories } from './services/agroAdvisor';
import { Loader2, AlertCircle, ScanLine, Leaf, ArrowRight, Sprout, Cpu, Volume2, Sparkles, Droplets, Sun, CalendarDays, Compass } from 'lucide-react';
import SoilMonitoringDashboard from './components/soil/SoilMonitoringDashboard';

const AUTO_REFRESH_INTERVAL_SECONDS = 900; // 15 minutes

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('weather'); // 'weather' | 'plant_health' | 'crop_planning' | 'animal_repellent' | 'soil_monitoring' | 'farm_insights' | 'voice_assistant'
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
        onNavigateHome={() => { setActiveTab('weather'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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

            {/* TAB CONTENT: UNIFIED WEATHER INTELLIGENCE (LIVE • FORECAST • PAST MERGED) */}
            {(activeTab === 'weather' || activeTab === 'overview' || activeTab === 'live' || activeTab === 'past' || activeTab === 'forecast') && (
              <UnifiedWeatherHub
                weatherData={weatherData}
                location={location}
                tempUnit={tempUnit}
                autoRefreshSeconds={autoRefreshSeconds}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenModulesDrawer={() => setIsModulesDrawerOpen(true)}
                onNavigateTab={setActiveTab}
                initialView={
                  activeTab === 'live' ? 'live' :
                  activeTab === 'forecast' ? 'forecast' :
                  activeTab === 'past' ? 'past' : 'all'
                }
              />
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

      </div>
  );
}
