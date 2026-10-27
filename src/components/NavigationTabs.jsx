import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sun,
  History,
  CalendarDays,
  Compass,
  Leaf,
  LayoutDashboard,
  Mic,
  Sprout,
  Volume2,
  Cpu
} from 'lucide-react';

export default function NavigationTabs({ activeTab, onChangeTab, advisorScore = 85 }) {
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'overview',
      label: t('app.weatherOverview', 'Weather Overview'),
      sublabel: 'Dashboard & Metrics',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      id: 'live',
      label: t('app.liveWeather', 'Live Weather'),
      sublabel: 'Current & Hourly',
      icon: Sun,
      badge: null
    },
    {
      id: 'past',
      label: t('app.pastWeather', 'Past Weather'),
      sublabel: 'Historical Records',
      icon: History,
      badge: null
    },
    {
      id: 'forecast',
      label: t('app.weatherForecast', '7-Day Forecast'),
      sublabel: 'Weekly Outlook',
      icon: CalendarDays,
      badge: null
    },
    {
      id: 'plant_health',
      label: t('app.plantHealth', 'Leaf Health AI'),
      sublabel: 'Disease Scanner',
      icon: Leaf,
      badge: 'Vision AI'
    },
    {
      id: 'crop_planning',
      label: t('app.cropPlanning', 'Crop Planning'),
      sublabel: 'Mandi & Profit AI',
      icon: Sprout,
      badge: 'Mandi AI'
    },
    {
      id: 'animal_repellent',
      label: t('app.animalRepellent', 'Animal Sound AI'),
      sublabel: 'Bio-Acoustic Defense',
      icon: Volume2,
      badge: 'Bio-AI'
    },
    {
      id: 'soil_monitoring',
      label: t('app.soilMonitoring', 'Soil Telemetry'),
      sublabel: 'ESP32 In-Situ Bus',
      icon: Cpu,
      badge: 'ESP32'
    },
    {
      id: 'farm_insights',
      label: t('app.farmInsights', 'Farm Insights'),
      sublabel: 'Agronomic Rules',
      icon: Compass,
      badge: `${advisorScore}/100`
    },
    {
      id: 'voice_assistant',
      label: t('app.voiceAssistant', 'Voice Assistant'),
      sublabel: '22 Languages',
      icon: Mic,
      badge: 'Voice AI'
    }
  ];

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 border border-emerald-900/10 shadow-xs">
      <nav
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5"
        aria-label="Smart Agriculture Navigation Tabs"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer text-left min-h-[64px] ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-800 via-emerald-800 to-green-800 text-white shadow-md shadow-emerald-900/20 ring-1 ring-emerald-500/30'
                  : 'bg-slate-50/90 hover:bg-emerald-50/90 text-slate-700 hover:text-emerald-950 border border-slate-200/70 hover:border-emerald-300 shadow-2xs'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-white/20 text-emerald-100 shadow-inner'
                    : 'bg-emerald-100/80 text-emerald-800'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>

              {/* Labels with guaranteed visibility (no truncation) */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                  <span className={`text-xs sm:text-sm font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {tab.label}
                  </span>

                  {tab.badge && (
                    <span
                      className={`text-[8.5px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        isActive
                          ? 'bg-emerald-700/90 text-emerald-100 border border-emerald-400/30'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>

                <p className={`text-[10px] font-medium leading-tight mt-0.5 ${isActive ? 'text-emerald-200/90' : 'text-slate-400'}`}>
                  {tab.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
