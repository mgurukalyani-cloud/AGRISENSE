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
  Sparkles,
  ToggleLeft,
  ToggleRight
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
  isSimpleMode = false,
  onToggleSimpleMode,
  provider = 'Open-Meteo & WMO',
  modelSources = 'ECMWF IFS / DWD ICON'
}) {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDataSourceInfo, setShowDataSourceInfo] = useState(false);

  const currentLang = i18n.language || 'en';
  const currentLangMeta = getLanguageByCode(currentLang);

  const changeLanguageFast = (langCode) => {
    i18n.changeLanguage(langCode);
    try {
      localStorage.setItem('agrisense_language', langCode);
    } catch {}
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
            <span className="font-semibold text-white">The FOF (Friends of Farmers)</span>
            <span className="text-emerald-500 font-normal">•</span>
            <span className="truncate text-emerald-300">
              Provider: <strong className="text-white">{provider}</strong> ({modelSources})
            </span>
          </div>

          <div className="flex items-center space-x-3 shrink-0 text-[10px] sm:text-[11px]">
            <button
              onClick={() => setShowDataSourceInfo(!showDataSourceInfo)}
              className="text-emerald-300 hover:text-white underline underline-offset-2 flex items-center space-x-1 cursor-pointer"
            >
              <Info className="w-3 h-3" />
              <span>Data Sources</span>
            </button>
            <span className="text-emerald-700 hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center space-x-1 text-emerald-300">
              <Timer className="w-3 h-3 text-emerald-400" />
              <span>Auto-refresh: {formatCountdown(autoRefreshSecondsLeft)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Explanatory Banner on Provider Variation */}
      {showDataSourceInfo && (
        <div className="bg-emerald-900 text-white text-xs p-3.5 border-b border-emerald-800 animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-3">
            <div className="flex items-start space-x-2.5">
              <Database className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-emerald-100">
                  AgriSense Data Transparency & Accuracy Standards:
                </p>
                <p className="text-emerald-200/90 leading-relaxed text-[11px]">
                  All observations are sourced directly from Open-Meteo & WMO ground stations. Mandi prices are fetched from AGMARKNET (DMI) and e-NAM records. Statistical price forecasts are calculated using Holt-Winters and SARIMA indicators and clearly distinguished from actual live market bids.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDataSourceInfo(false)}
              className="p-1 rounded text-emerald-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Platform Title (AgriSense by The FOF) */}
          <button
            onClick={onNavigateHome}
            type="button"
            className="flex items-center space-x-2.5 sm:space-x-3 text-left group cursor-pointer transition-transform hover:opacity-95 focus:outline-none rounded-2xl p-1 -m-1 shrink-0"
            title="Return to AgriSense Home"
          >
            {/* AgriSense Emerald Seedling Emblem */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 ring-2 ring-emerald-500/30 group-hover:scale-105 transition-all">
              <Sprout className="w-6 h-6 text-amber-300" />
            </div>

            <div className="shrink-0 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 group-hover:text-emerald-800 transition-colors whitespace-nowrap">
                  AgriSense
                </span>
                <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap shrink-0">
                  By The FOF
                </span>
              </div>
              <p className="text-[11px] text-emerald-700/80 font-medium hidden md:block whitespace-nowrap">
                Smarter Farming. Better Decisions. Higher Profits.
              </p>
            </div>
          </button>

          {/* Center Search / Location Quick Display */}
          <div className="hidden md:flex items-center flex-1 min-w-0 max-w-xs lg:max-w-md mx-2 lg:mx-4">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 text-sm bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 hover:border-emerald-300 rounded-xl text-slate-700 transition-all shadow-xs group cursor-pointer min-w-0"
            >
              <div className="flex items-center space-x-2 truncate min-w-0">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-slate-900 truncate">
                  {location.name}
                  {location.admin1 ? `, ${location.admin1}` : ''}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-medium shrink-0 ml-2">
                <Search className="w-3.5 h-3.5" />
                <span>Change</span>
              </div>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Quick 1-Click Language Switcher Pill: EN | TE | HI */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => changeLanguageFast('en')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  currentLang === 'en' ? 'bg-emerald-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => changeLanguageFast('te')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  currentLang === 'te' ? 'bg-emerald-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="తెలుగు భాషకు మారండి"
              >
                తెలుగు
              </button>
              <button
                onClick={() => changeLanguageFast('hi')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  currentLang === 'hi' ? 'bg-emerald-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="हिंदी भाषा में बदलें"
              >
                हिंदी
              </button>
            </div>

            {/* Simple Mode vs Detailed Mode Toggle */}
            {onToggleSimpleMode && (
              <button
                onClick={onToggleSimpleMode}
                className="hidden xl:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                title="Toggle Simple Farmer Mode vs Detailed Mode"
              >
                <span>{isSimpleMode ? 'Simple Mode' : 'Advanced Mode'}</span>
              </button>
            )}

            {/* Voice Assistant Launcher Button */}
            <button
              onClick={onOpenVoiceAssistant}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all bg-gradient-to-r from-emerald-800 to-green-700 hover:from-emerald-900 hover:to-green-800 text-white shadow-xs cursor-pointer border border-emerald-600/50"
              title="Open AgriSense AI Assistant"
            >
              <Mic className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* GPS My Location Button */}
            <button
              onClick={onUseMyLocation}
              disabled={isGeoLoading}
              title="Detect Current GPS Location"
              className={`p-2 rounded-xl text-xs font-medium flex items-center transition-all border ${
                isGeoLoading
                  ? 'bg-emerald-50 text-emerald-400 border-emerald-200 cursor-wait'
                  : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 shadow-2xs cursor-pointer'
              }`}
            >
              <Compass className={`w-4 h-4 text-emerald-600 ${isGeoLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Refresh Weather Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh Observations"
              className={`p-2 rounded-xl text-xs font-medium flex items-center transition-all border ${
                isRefreshing
                  ? 'bg-emerald-50 text-emerald-400 border-emerald-200 cursor-wait'
                  : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 shadow-2xs cursor-pointer'
              }`}
            >
              <RefreshCw className={`w-4 h-4 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title="Open Settings"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
