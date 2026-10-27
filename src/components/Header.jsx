import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sprout,
  Search,
  MapPin,
  RefreshCw,
  Compass,
  SlidersHorizontal,
  Layers,
  Menu,
  X,
  Radio,
  Clock,
  Info,
  Database,
  Timer,
  Globe,
  Mic
} from 'lucide-react';
import LanguageSelectorButton from './LanguageSelectorButton';
import { getLanguageByCode } from '../i18n/languages';

export default function Header({
  location,
  onOpenSearch,
  onUseMyLocation,
  onRefresh,
  isRefreshing,
  isGeoLoading,
  lastUpdated,
  autoRefreshSecondsLeft,
  tempUnit,
  onToggleTempUnit,
  onOpenModulesDrawer,
  onOpenSettings,
  onOpenLanguageSelector,
  onOpenVoiceAssistant,
  onNavigateHome,
  provider = 'Open-Meteo & WMO',
  modelSources = 'ECMWF IFS / DWD ICON'
}) {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDataSourceInfo, setShowDataSourceInfo] = useState(false);

  const currentLang = i18n.language || 'en';
  const currentLangMeta = getLanguageByCode(currentLang);

  // Format last updated into readable time
  const formatUpdatedTime = (isoString) => {
    if (!isoString) return t('app.published', 'Published');
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  const formatCountdown = (secs) => {
    if (secs === null || secs === undefined) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs">
      {/* Topmost Data Source & Model Verification Ribbon */}
      <div className="bg-emerald-950 text-emerald-200 text-[11px] py-1 px-4 border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-white">{t('app.genuineData', 'Genuine Meteorological Data:')}</span>
            <span className="truncate text-emerald-300">
              {t('app.providerLabel', 'Provider:')} <strong className="text-white">{provider}</strong> • {t('app.modelsLabel', 'Models:')} {modelSources}
            </span>
          </div>

          <div className="flex items-center space-x-3 shrink-0 text-[10px] sm:text-[11px]">
            <button
              onClick={() => setShowDataSourceInfo(!showDataSourceInfo)}
              className="text-emerald-300 hover:text-white underline underline-offset-2 flex items-center space-x-1 cursor-pointer"
            >
              <Info className="w-3 h-3" />
              <span>{t('app.whyReadingsDiffer', 'Why readings differ across apps')}</span>
            </button>
            <span className="text-emerald-700 hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center space-x-1 text-emerald-300">
              <Timer className="w-3 h-3 text-emerald-400" />
              <span>{t('app.autoRefresh', 'Auto-refresh')}: {formatCountdown(autoRefreshSecondsLeft)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Explanatory Banner on Provider Variation (Dismissible / Toggleable) */}
      {showDataSourceInfo && (
        <div className="bg-emerald-900 text-white text-xs p-3.5 border-b border-emerald-800 animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-3">
            <div className="flex items-start space-x-2.5">
              <Database className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-emerald-100">
                  {t('app.providerNotice', 'Transparency Notice on Weather Provider Variations:')}
                </p>
                <p className="text-emerald-200/90 leading-relaxed text-[11px]">
                  {t('app.providerExplanation', 'Weather readings may differ slightly from other mobile applications because providers use different local observation stations, numerical weather models, horizontal grid resolutions, and update intervals. AgriSense directly consumes published data from Open-Meteo & WMO without modification or artificial generation.')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDataSourceInfo(false)}
              className="p-1 rounded text-emerald-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Platform Title (Clickable -> Redirects to Home) */}
          <button
            onClick={onNavigateHome}
            type="button"
            className="flex items-center space-x-2.5 sm:space-x-3 text-left group cursor-pointer transition-transform hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-2xl p-1 -m-1"
            title={t('app.returnHome', 'Return to Home Page')}
          >
            {/* KLH Farms Logo */}
            <div className="flex items-center bg-white p-0.5 rounded-full shadow-xs border border-emerald-900/10 shrink-0 overflow-hidden ring-2 ring-emerald-500/25 group-hover:ring-emerald-600 group-hover:scale-105 transition-all">
              <img
                src={`${import.meta.env.BASE_URL}klh-farms-logo.png`}
                alt="KLH Farms Logo"
                className="h-11 sm:h-13 w-11 sm:w-13 object-cover rounded-full"
                onError={(e) => {
                  e.currentTarget.src = './klh-farms-logo.png';
                }}
              />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 group-hover:text-emerald-800 transition-colors">
                  {t('app.title', 'AgriSense')}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {t('app.subtitle', 'Smart Agriculture')}
                </span>
              </div>
              <p className="text-xs text-emerald-700/80 font-medium hidden sm:block">
                {t('app.tagline', 'Real-World Weather Monitoring & Agro-Advisory')}
              </p>
            </div>
          </button>

          {/* Center Search / Location Quick Display (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 text-sm bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 hover:border-emerald-300 rounded-xl text-slate-700 transition-all shadow-xs group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-slate-900 truncate">
                  {location.name}
                  {location.admin1 ? `, ${location.admin1}` : ''}
                </span>
                {location.country_code && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200 font-mono">
                    {location.country_code}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-medium shrink-0 ml-2">
                <Search className="w-3.5 h-3.5" />
                <span>{t('app.search', 'Search')}</span>
              </div>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Global Indian Language Selector Button */}
            <LanguageSelectorButton onOpen={onOpenLanguageSelector} />

            {/* Multilingual Voice Assistant Quick Launcher */}
            <button
              onClick={onOpenVoiceAssistant}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all bg-gradient-to-r from-emerald-800 to-green-700 hover:from-emerald-900 hover:to-green-800 text-white shadow-xs cursor-pointer border border-emerald-600/50"
              title={t('voice.headerButtonTitle', 'Voice Assistant (22 Indian Languages)')}
            >
              <Mic className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">{t('voice.buttonShort', 'Voice AI')}</span>
            </button>

            {/* GPS My Location Button */}
            <button
              onClick={onUseMyLocation}
              disabled={isGeoLoading}
              title={t('app.myLocation', 'My Location')}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all border ${
                isGeoLoading
                  ? 'bg-emerald-50 text-emerald-400 border-emerald-200 cursor-wait'
                  : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 hover:border-emerald-200 shadow-2xs'
              }`}
            >
              <Compass className={`w-4 h-4 text-emerald-600 ${isGeoLoading ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">{t('app.myLocation', 'My Location')}</span>
            </button>

            {/* Manual Refresh Button & Timestamp */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title={`Last updated: ${formatUpdatedTime(lastUpdated)} (Click to refresh)`}
              className="flex items-center space-x-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-[10px] text-slate-400 leading-tight">{t('app.published', 'Published')}</span>
                <span className="text-xs font-bold text-slate-800 leading-tight">{formatUpdatedTime(lastUpdated)}</span>
              </div>
            </button>

            {/* Temp Unit Toggle °C / °F */}
            <button
              onClick={onToggleTempUnit}
              title="Toggle Celsius / Fahrenheit"
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors cursor-pointer"
            >
              °{tempUnit}
            </button>

            {/* Smart Agriculture Modules Drawer Button */}
            <button
              onClick={onOpenModulesDrawer}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-800 to-green-800 text-white hover:from-emerald-900 hover:to-green-900 shadow-sm transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t('app.platformModules', 'Platform Modules')}</span>
            </button>

            {/* Settings Modal Button */}
            <button
              onClick={onOpenSettings}
              title={t('app.settings', 'Preferences & Data Sources')}
              className="p-2 rounded-xl text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Info Bar */}
        <div className="md:hidden py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={onOpenSearch}
            className="flex-1 flex items-center justify-between px-3 py-1.5 text-xs bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-slate-700 truncate"
          >
            <div className="flex items-center space-x-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-900 truncate">{location.name}</span>
            </div>
            <Search className="w-3 h-3 text-emerald-700 shrink-0 ml-1" />
          </button>

          <div className="flex items-center space-x-1 shrink-0 text-[11px] text-slate-500 font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatUpdatedTime(lastUpdated)}</span>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 px-2 border-t border-slate-200 bg-emerald-50/40 rounded-b-2xl mb-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Voice Assistant Button */}
            <button
              onClick={() => {
                onOpenVoiceAssistant?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Mic className="w-4 h-4 text-emerald-300" />
                <span>{t('voice.title', 'Voice Farming Assistant')}</span>
              </div>
              <span className="text-[10px] bg-emerald-600 px-2 py-0.5 rounded-full text-white">
                22 Languages
              </span>
            </button>

            {/* Mobile Language Switcher Row */}
            <button
              onClick={() => {
                onOpenLanguageSelector();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-950 shadow-2xs"
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-emerald-700" />
                <span>{t('app.selectLanguage', 'Select Language')}:</span>
                <span className="text-emerald-800 font-extrabold">{currentLangMeta.nativeName} ({currentLangMeta.name})</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Change
              </span>
            </button>

            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{t('app.providerLabel', 'Data Provider:')}</span>
                <strong className="text-emerald-900">{provider}</strong>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{t('app.autoRefresh', 'Next Auto-Refresh')}:</span>
                <span className="font-mono text-emerald-700">{formatCountdown(autoRefreshSecondsLeft)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onOpenModulesDrawer();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold"
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-300" />
                <span>{t('app.platformModules', 'Platform Modules')}</span>
              </div>
              <span className="text-[10px] bg-emerald-700 px-1.5 py-0.5 rounded">1 Active / 4 Next</span>
            </button>

            <button
              onClick={() => {
                onUseMyLocation();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-medium"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>{t('app.useGpsCoords', 'Use Current Device GPS Coordinates')}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
