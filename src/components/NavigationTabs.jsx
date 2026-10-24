import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sun,
  History,
  CalendarDays,
  Compass,
  Leaf,
  ScanLine,
  LayoutDashboard,
  Sparkles,
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
      sublabel: 'Summary & Hero',
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
      sublabel: 'Historical Trends',
      icon: History,
      badge: null
    },
    {
      id: 'forecast',
      label: t('app.weatherForecast', 'Weather Forecast'),
      sublabel: '7-10 Day Outlook',
      icon: CalendarDays,
      badge: null
    },
    {
      id: 'plant_health',
      label: t('app.plantHealth', 'Plant Health'),
      sublabel: 'Leaf Disease AI',
      icon: Leaf,
      badge: 'AI Vision'
    },
    {
      id: 'crop_planning',
      label: t('app.cropPlanning', 'Crop Planning'),
      sublabel: 'Mandi & Profit AI',
      icon: Sprout,
      badge: 'Market AI'
    },
    {
      id: 'animal_repellent',
      label: t('app.animalRepellent', 'Animal Sound Detection & Alerts'),
      sublabel: 'Bio-Acoustic Defense',
      icon: Volume2,
      badge: 'Bio-AI'
    },
    {
      id: 'farm_insights',
      label: t('app.farmInsights', 'Farm Insights'),
      sublabel: 'Agronomic Advisor',
      icon: Compass,
      badge: `${advisorScore}/100`
    },
    {
      id: 'voice_assistant',
      label: t('app.voiceAssistant', 'Voice Assistant'),
      sublabel: 'Speak in 22 Languages',
      icon: Mic,
      badge: 'Voice AI'
    }
  ];

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-1.5 sm:p-2 border border-emerald-900/10 shadow-xs">
      <nav className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-1.5 sm:gap-2" aria-label="Smart Agriculture Navigation Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl min-h-[58px] h-full transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-800 to-green-800 text-white shadow-md shadow-emerald-900/20 ring-1 ring-emerald-500/30'
                  : 'bg-transparent hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-950 border border-transparent hover:border-emerald-200/50'
              }`}
            >
              <div className="flex items-center space-x-2 truncate min-w-0">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/20 text-emerald-100'
                      : tab.id === 'plant_health'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-emerald-100/70 text-emerald-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="text-left truncate min-w-0">
                  <p className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {tab.label}
                  </p>
                  <p className={`text-[10px] truncate ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {tab.sublabel}
                  </p>
                </div>
              </div>

              {tab.badge && (
                <span
                  className={`hidden xl:inline-flex text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${
                    isActive
                      ? 'bg-emerald-700 text-white'
                      : tab.id === 'plant_health'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
