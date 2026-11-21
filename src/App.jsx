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

// Master AgriSense Feature Pages
import HomePage from './components/home/HomePage';
import MarketPricesPage from './components/market/MarketPricesPage';
import SoilHealthPage from './components/soil/SoilHealthPage';
import FarmCalculatorsPage from './components/calculators/FarmCalculatorsPage';
import AgriculturalAlertsPage from './components/alerts/AgriculturalAlertsPage';
import MyFarmProfilePage from './components/profile/MyFarmProfilePage';
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
import { getAgriculturalAlerts } from './services/alertsService';
import { Loader2, AlertCircle, Sparkles, Sun, Compass, Sprout, TrendingUp, Layers, Calculator, ShieldCheck } from 'lucide-react';

const AUTO_REFRESH_INTERVAL_SECONDS = 900; // 15 minutes

export default function App() {
  const { t } = useTranslation();

  // Active Main Tab:
  // 'home' | 'weather' | 'crop_recommendations' | 'market_prices' | 'soil_health' | 'voice_assistant' | 'crop_planning' | 'alerts' | 'farm_calculators' | 'my_farm' | 'settings' | 'plant_health' | 'animal_repellent'
  const [activeTab, setActiveTab] = useState('home');

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

  const [isSimpleMode, setIsSimpleMode] = useState(() => {
    return localStorage.getItem('agrisense_simple_mode') === 'true';
  });

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isModulesDrawerOpen, setIsModulesDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isVoiceAssistantModalOpen, setIsVoiceAssistantModalOpen] = useState(false);
  const [latestPlantHealthResult, setLatestPlantHealthResult] = useState(null);
  const [initialVoiceQuery, setInitialVoiceQuery] = useState('');

  const timerRef = useRef(null);

  // Fetch weather data for target location
  const loadWeather = useCallback(async (targetLocation) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await fetchWeatherData(targetLocation);
      setWeatherData(data);
      setAutoRefreshSeconds(AUTO_REFRESH_INTERVAL_SECONDS);
    } catch (err) {
      console.warn('Weather fetch warning:', err);
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

  // Automatic refresh interval timer
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

  // GPS Location Handler
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
        alert(`Location access denied (${err.message}). Using selected agricultural district.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectLocation = (newLoc) => {
    setLocation(newLoc);
  };

  const handleToggleTempUnit = () => {
    const nextUnit = tempUnit === 'C' ? 'F' : 'C';
    setTempUnit(nextUnit);
    localStorage.setItem('agrisense_temp_unit', nextUnit);
  };

  const handleSetTempUnit = (unit) => {
    setTempUnit(unit);
    localStorage.setItem('agrisense_temp_unit', unit);
  };

  const handleToggleSimpleMode = () => {
    const nextVal = !isSimpleMode;
    setIsSimpleMode(nextVal);
    localStorage.setItem('agrisense_simple_mode', String(nextVal));
  };

  const handleOpenVoiceWithQuery = (queryText) => {
    setInitialVoiceQuery(queryText || '');
    setIsVoiceAssistantModalOpen(true);
  };

  // Compute advisories
  const advisories = weatherData?.current && weatherData?.daily
    ? generateFarmAdvisories(weatherData.current, weatherData.daily, weatherData.hourly)
    : null;

  // Active Alerts Count for Navigation Badge
  const alertsCount = getAgriculturalAlerts({ weatherData, farmerState: location?.admin1 || 'Telangana' }).length;

  return (
    <div className={`min-h-screen bg-[#f7faf7] text-slate-800 flex flex-col selection:bg-emerald-200 selection:text-emerald-950 font-sans antialiased ${
      isSimpleMode ? 'text-base font-medium' : ''
    }`}>
      {/* 1. Header with AgriSense & The FOF identity, fast language switcher, location & refresh */}
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
        onOpenVoiceAssistant={() => handleOpenVoiceWithQuery('')}
        onNavigateHome={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        isSimpleMode={isSimpleMode}
        onToggleSimpleMode={handleToggleSimpleMode}
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
              Querying Meteorological & Mandi Data Providers...
            </h2>
            <p className="text-xs text-slate-500">
              Fetching verified agricultural observations for {location.name}
            </p>
          </div>
        )}

        {/* Error Notification with Manual Retry */}
        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">Agricultural Telemetry Provider Update</p>
                <p className="text-slate-600 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => loadWeather(location)}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold transition-colors shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. Main 11-Item Navigation Bar */}
        <NavigationTabs
          activeTab={activeTab}
          onChangeTab={(tabId) => {
            if (tabId === 'settings') {
              setIsSettingsOpen(true);
            } else {
              setActiveTab(tabId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          advisorScore={advisories?.agriSuitabilityScore || 85}
          alertCount={alertsCount}
        />

        {/* 3. TAB ROUTING & MASTER VIEWS */}

        {/* TAB 1: HOME (COMMAND CENTER DASHBOARD) */}
        {activeTab === 'home' && (
          <HomePage
            weatherData={weatherData}
            location={location}
            onNavigateTab={(tabId) => {
              setActiveTab(tabId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenVoiceAssistant={handleOpenVoiceWithQuery}
            tempUnit={tempUnit}
          />
        )}

        {/* TAB 2: LIVE WEATHER & 7-DAY FORECAST */}
        {activeTab === 'weather' && weatherData && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Current Weather Card */}
            <CurrentWeatherCard
              weatherData={weatherData}
              tempUnit={tempUnit}
              onOpenSearch={() => setIsSearchOpen(true)}
            />

            {/* 24-Hour Operations Timeline */}
            <section className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-900/10">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>24-Hour Hourly Operations Forecast</span>
                </div>
              </div>
              <HourlyForecastStrip
                hourly={weatherData.hourly}
                tempUnit={tempUnit}
              />
            </section>

            {/* 8-Point Agronomic Environmental Metrics */}
            <section className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-900/10">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <Sun className="w-4 h-4 text-emerald-600" />
                  <span>8-Point Agronomic Environmental Metrics</span>
                </div>
              </div>
              <WeatherMetricsGrid
                weatherData={weatherData}
                tempUnit={tempUnit}
              />
            </section>

            {/* 7-Day Numerical Forecast */}
            <section className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-900/10">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>7-Day Agro-Meteorological Outlook</span>
                </div>
              </div>
              <FutureForecastView
                daily={weatherData.daily}
                tempUnit={tempUnit}
              />
            </section>

            {/* Historical Observations */}
            <HistoricalWeatherView
              historicalData={weatherData.historical}
              location={location}
              tempUnit={tempUnit}
            />

            {/* Smart Agro-Advisory */}
            <FarmWeatherAdvisor
              weatherData={weatherData}
              onOpenModulesDrawer={() => setIsModulesDrawerOpen(true)}
            />
          </div>
        )}

        {/* TAB 3: SEASONAL CROP RECOMMENDATION ENGINE (SECTION 5) */}
        {activeTab === 'crop_recommendations' && (
          <div className="animate-in fade-in duration-300">
            <CropPlanningPage
              currentWeather={weatherData?.current}
              dailyWeather={weatherData?.daily}
              location={location}
              tempUnit={tempUnit}
            />
          </div>
        )}

        {/* TAB 4: AGRICULTURAL MARKET INTELLIGENCE & FORECASTING (SECTIONS 6 & 7) */}
        {activeTab === 'market_prices' && (
          <div className="animate-in fade-in duration-300">
            <MarketPricesPage
              farmerState={location?.admin1 || 'Telangana'}
            />
          </div>
        )}

        {/* TAB 5: SOIL HEALTH & FERTILIZER ASSISTANT (SECTION 8) */}
        {activeTab === 'soil_health' && (
          <div className="animate-in fade-in duration-300">
            <SoilHealthPage />
          </div>
        )}

        {/* TAB 6: AI FARMING ASSISTANT ("AgriSense AI — Your Farming Companion") (SECTION 9) */}
        {activeTab === 'voice_assistant' && (
          <div className="animate-in fade-in duration-300">
            <VoiceFarmingAssistant
              currentWeather={weatherData?.current}
              dailyWeather={weatherData?.daily}
              historicalWeather={weatherData?.historical}
              plantHealthResult={latestPlantHealthResult}
              location={location}
              isModal={false}
            />
          </div>
        )}

        {/* TAB 7: CROP PLANNING & CALENDAR */}
        {activeTab === 'crop_planning' && (
          <div className="animate-in fade-in duration-300">
            <CropPlanningPage
              currentWeather={weatherData?.current}
              dailyWeather={weatherData?.daily}
              location={location}
              tempUnit={tempUnit}
            />
          </div>
        )}

        {/* TAB 8: AGRICULTURAL ALERTS (SECTION 13) */}
        {activeTab === 'alerts' && (
          <div className="animate-in fade-in duration-300">
            <AgriculturalAlertsPage
              weatherData={weatherData}
              location={location}
            />
          </div>
        )}

        {/* TAB 9: 7 FARM CALCULATORS (SECTION 14) */}
        {activeTab === 'farm_calculators' && (
          <div className="animate-in fade-in duration-300">
            <FarmCalculatorsPage />
          </div>
        )}

        {/* TAB 10: MY FARM PROFILE (SECTION 12) */}
        {activeTab === 'my_farm' && (
          <div className="animate-in fade-in duration-300">
            <MyFarmProfilePage
              onSaveProfile={() => {
                // Refresh weather and profile context
                loadWeather(location);
              }}
              onNavigateTab={(tabId) => {
                setActiveTab(tabId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* AUXILIARY TAB: PLANT HEALTH SCANNER */}
        {activeTab === 'plant_health' && (
          <div className="animate-in fade-in duration-300">
            <PlantHealthPage
              currentWeather={weatherData?.current}
              dailyWeather={weatherData?.daily}
              location={location}
              tempUnit={tempUnit}
              onAnalysisResultChange={setLatestPlantHealthResult}
            />
          </div>
        )}

        {/* AUXILIARY TAB: ANIMAL SOUND REPELLENT */}
        {activeTab === 'animal_repellent' && (
          <div className="animate-in fade-in duration-300">
            <AnimalSoundPage location={location} />
          </div>
        )}
      </main>

      {/* Persistent Floating Multilingual Voice Assistant Button */}
      <FloatingVoiceButton
        onClick={() => handleOpenVoiceWithQuery('')}
        isOpen={isVoiceAssistantModalOpen || activeTab === 'voice_assistant'}
      />

      {/* Footer with The FOF Identity */}
      <Footer
        onNavigateTab={(tabId) => {
          setActiveTab(tabId);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Modals and Overlays */}
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
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tempUnit={tempUnit}
        onSetTempUnit={handleSetTempUnit}
        currentLocation={location}
        onApplyCustomCoords={(lat, lon) => {
          setLocation({
            id: `custom-${lat}-${lon}`,
            name: `Custom Farm Plot (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`,
            admin1: 'Agricultural Coordinates',
            country: 'India',
            country_code: 'IN',
            latitude: lat,
            longitude: lon,
            elevation: null,
            isDemo: false
          });
        }}
        onOpenLanguageSelector={() => setIsLanguageModalOpen(true)}
      />

      {/* 22-Language Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />

      {/* Voice Assistant Modal Overlay */}
      {isVoiceAssistantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <VoiceFarmingAssistant
              currentWeather={weatherData?.current}
              dailyWeather={weatherData?.daily}
              historicalWeather={weatherData?.historical}
              plantHealthResult={latestPlantHealthResult}
              location={location}
              initialQuery={initialVoiceQuery}
              onClose={() => setIsVoiceAssistantModalOpen(false)}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
