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
  Mic,
  Sparkles
} from 'lucide-react';
import LanguageSelectorButton from './LanguageSelectorButton';
import { getLanguageByCode } from '../i18n/languages';
import { WhatsAppIcon } from './alerts/WhatsAppAlertModal';
import agrisenseLogo from '../assets/agrisense-logo-circle.png';

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
  onOpenWhatsAppAlerts,
  onNavigateHome,
  provider = 'Open-Meteo & WMO',
  modelSources = 'ECMWF IFS (0.1°) / DWD ICON'
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-emerald-500/20 shadow-md shadow-emerald-950/5 transition-all">
      {/* 1. Topmost Telemetry & Model Verification Ribbon (Vibrant & Deep) */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#062c1a] to-slate-950 text-emerald-200 text-[11px] py-1.5 px-4 border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 truncate">
            {/* Glowing Live Signal Beacon */}
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-sm shadow-emerald-400" />
            </span>
            <span className="font-extrabold text-white tracking-wide uppercase text-[10px] sm:text-[11px]">
              The FOF (Friends of Farmers) • Live Telemetry:
            </span>
            <span className="truncate text-emerald-300 font-medium">
              {t('app.providerLabel', 'Provider:')} <strong className="text-white font-semibold">{provider}</strong> • {t('app.modelsLabel', 'Models:')} {modelSources}
            </span>
          </div>

          <div className="flex items-center space-x-3 shrink-0 text-[10px] sm:text-[11px]">
            <button
              onClick={() => setShowDataSourceInfo(!showDataSourceInfo)}
              className="text-emerald-300 hover:text-white underline underline-offset-2 flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <Info className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">{t('app.whyReadingsDiffer', 'Data Sources')}</span>
              <span className="sm:hidden">Data Info</span>
            </button>
            <span className="text-emerald-700 hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 font-mono text-[10.5px]">
              <Timer className="w-3 h-3 text-emerald-400" />
              <span>{t('app.autoRefresh', 'Auto-refresh')}: {formatCountdown(autoRefreshSecondsLeft)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Explanatory Banner on Provider Variation (Dismissible / Toggleable) */}
      {showDataSourceInfo && (
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-900 text-white text-xs p-4 border-b border-emerald-700/50 shadow-inner animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-emerald-800/80 text-emerald-200 shrink-0 mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-white text-sm">
                  {t('app.providerNotice', 'Transparency Notice on Weather Provider Variations:')}
                </p>
                <p className="text-emerald-200/90 leading-relaxed text-xs">
                  {t('app.providerExplanation', 'Weather readings may differ slightly from other mobile applications because providers use different local observation stations, numerical weather models, horizontal grid resolutions, and update intervals. AgriSense directly consumes published data from Open-Meteo & WMO without modification or artificial generation.')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDataSourceInfo(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Executive Header Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo & Platform Brand (Clickable -> Redirects to Home) */}
          <button
            onClick={onNavigateHome}
            type="button"
            className="flex items-center space-x-2.5 sm:space-x-3 text-left group cursor-pointer transition-all hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-2xl p-1 -m-1 shrink-0"
            title={t('app.returnHome', 'Return to Home Page')}
          >
            {/* AgriSense Official Emblem Logo */}
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/25 ring-2 ring-emerald-400/50 group-hover:ring-emerald-500 group-hover:scale-105 transition-all shrink-0 overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-0.5">
              <img
                src={agrisenseLogo}
                alt="AgriSense Official Logo"
                className="w-full h-full object-contain rounded-xl drop-shadow-md"
              />
            </div>

            <div className="shrink-0 min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 group-hover:text-emerald-800 transition-colors whitespace-nowrap">
                  AgriSense
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs whitespace-nowrap shrink-0">
                  By The FOF
                </span>
              </div>
              <p className="text-[10.5px] sm:text-xs text-emerald-700 font-bold hidden md:block whitespace-nowrap">
                Smart Agriculture • Better Tomorrow
              </p>
            </div>
          </button>

          {/* Center Location Search Capsule (Vibrant & Elegant, Guaranteed Width) */}
          <div className="hidden md:flex items-center shrink-0 w-64 lg:w-72 xl:w-80 mx-2">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/70 hover:from-emerald-100/90 hover:to-teal-100/70 border border-emerald-300/80 hover:border-emerald-500 rounded-2xl text-slate-800 transition-all shadow-xs hover:shadow-md hover:shadow-emerald-900/10 group cursor-pointer"
            >
              <div className="flex items-center space-x-2 truncate min-w-0">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 transition-transform">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                </div>
                <span className="font-extrabold text-slate-900 truncate text-xs sm:text-sm">
                  {location.name}
                  {location.admin1 ? `, ${location.admin1}` : ''}
                </span>
                {location.country_code && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 font-black font-mono shrink-0">
                    {location.country_code}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-xl text-emerald-700 hover:text-emerald-900 text-xs font-bold shrink-0 ml-1.5 group-hover:bg-emerald-100/60 transition-colors">
                <Search className="w-3.5 h-3.5" />
                <span>Change</span>
              </div>
            </button>
          </div>

          {/* Right Action Executive Button Group (Vibrant & Unified) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Quick 3-Language Switcher (EN, TE, HI) as shown in reference */}
            <div className="hidden lg:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/90">
              {[
                { code: 'en', label: 'EN' },
                { code: 'te', label: 'తెలుగు' },
                { code: 'hi', label: 'हिंदी' }
              ].map(({ code, label }) => {
                const isSel = (i18n.language || 'en') === code;
                return (
                  <button
                    key={code}
                    onClick={() => i18n.changeLanguage(code)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSel
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-emerald-900 hover:bg-white/80'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              
              {/* Globe button to access 22 languages modal */}
              <button
                onClick={onOpenLanguageSelector}
                title="Select from 22 Indian Languages"
                className="p-1 rounded-lg hover:bg-white/90 text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
              </button>
            </div>

            {/* Multilingual Voice Assistant Quick Launcher */}
            <button
              onClick={onOpenVoiceAssistant}
              className="px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-black flex items-center space-x-1.5 transition-all bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-700/25 border border-emerald-400/40 cursor-pointer hover:scale-[1.02]"
              title={t('voice.headerButtonTitle', 'Voice Assistant (22 Indian Languages)')}
            >
              <Mic className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* Automated WhatsApp Weather & Rain Alerts Quick Launcher */}
            <button
              onClick={onOpenWhatsAppAlerts}
              className="px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-black flex items-center space-x-1.5 transition-all bg-gradient-to-r from-[#25D366] to-emerald-600 hover:from-emerald-600 hover:to-[#25D366] text-white shadow-md shadow-green-600/25 border border-green-300/50 cursor-pointer hover:scale-[1.02]"
              title="Automated WhatsApp Weather & Rain Alerts & Demo"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
              <WhatsAppIcon className="w-4 h-4 text-white shrink-0" />
              <span className="hidden xl:inline">WhatsApp Alerts</span>
            </button>

            {/* GPS My Location Button */}
            <button
              onClick={onUseMyLocation}
              disabled={isGeoLoading}
              title={t('app.myLocation', 'My Location')}
              className={`p-2 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center justify-center transition-all border ${
                isGeoLoading
                  ? 'bg-emerald-50 text-emerald-400 border-emerald-300 cursor-wait'
                  : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-xs cursor-pointer'
              }`}
            >
              <Compass className={`w-4 h-4 text-emerald-600 ${isGeoLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title={`Last updated: ${formatUpdatedTime(lastUpdated)} (Click to refresh)`}
              className="p-2 rounded-xl sm:rounded-2xl text-xs font-bold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200/90 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Temp Unit Toggle °C / °F */}
            <button
              onClick={onToggleTempUnit}
              title="Toggle Celsius / Fahrenheit"
              className="px-2 py-1.5 rounded-xl sm:rounded-2xl text-xs font-black bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300/80 transition-colors cursor-pointer font-mono"
            >
              °{tempUnit}
            </button>

            {/* Platform Modules Drawer Button */}
            <button
              onClick={onOpenModulesDrawer}
              className="hidden 2xl:flex items-center space-x-1.5 px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white hover:from-emerald-950 hover:to-slate-950 shadow-md shadow-emerald-950/20 border border-emerald-600/40 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('app.platformModules', 'Platform Modules')}</span>
            </button>

            {/* Settings Modal Button */}
            <button
              onClick={onOpenSettings}
              title={t('app.settings', 'Preferences & Data Sources')}
              className="p-2 rounded-xl sm:rounded-2xl text-slate-600 hover:text-emerald-900 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Info Bar */}
        <div className="md:hidden py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={onOpenSearch}
            className="flex-1 flex items-center justify-between px-3 py-2 text-xs bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200 rounded-xl text-slate-800 truncate"
          >
            <div className="flex items-center space-x-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-extrabold text-slate-900 truncate">{location.name}</span>
            </div>
            <Search className="w-3.5 h-3.5 text-emerald-700 shrink-0 ml-1" />
          </button>

          <div className="flex items-center space-x-1 shrink-0 text-[11px] text-slate-600 font-mono font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>{formatUpdatedTime(lastUpdated)}</span>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 px-2 border-t border-slate-200 bg-emerald-50/60 backdrop-blur-md rounded-b-2xl mb-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Voice Assistant Button */}
            <button
              onClick={() => {
                onOpenVoiceAssistant?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Mic className="w-4 h-4 text-emerald-200" />
                <span>{t('voice.title', 'Voice Farming Assistant')}</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white font-bold">
                22 Languages
              </span>
            </button>

            {/* Mobile WhatsApp Alerts Button */}
            <button
              onClick={() => {
                onOpenWhatsAppAlerts();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-[#25D366] to-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>WhatsApp Weather &amp; Rain Alerts</span>
              </div>
              <span className="text-[10px] bg-white/30 text-white font-black px-2 py-0.5 rounded-full">
                Demo
              </span>
            </button>

            {/* Mobile Language Switcher Row */}
            <button
              onClick={() => {
                onOpenLanguageSelector();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-950 shadow-2xs"
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-emerald-700" />
                <span>{t('app.selectLanguage', 'Select Language')}:</span>
                <span className="text-emerald-800 font-extrabold">{currentLangMeta.nativeName} ({currentLangMeta.name})</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
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
                <span className="font-mono text-emerald-700 font-bold">{formatCountdown(autoRefreshSecondsLeft)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onOpenModulesDrawer();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-emerald-900 text-white rounded-xl text-xs font-bold"
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-300" />
                <span>{t('app.platformModules', 'Platform Modules')}</span>
              </div>
              <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded font-mono">7 Active</span>
            </button>

            <button
              onClick={() => {
                onUseMyLocation();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-3.5 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-bold"
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
