import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Sun,
  Sprout,
  TrendingUp,
  Layers,
  Mic,
  Calendar,
  AlertTriangle,
  Calculator,
  User,
  Settings,
  Leaf
} from 'lucide-react';

export default function NavigationTabs({
  activeTab,
  onChangeTab,
  advisorScore = 85,
  alertCount = 3
}) {
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'home',
      label: t('nav.home', 'Home'),
      sublabel: 'Command Center',
      icon: Home,
      badge: null
    },
    {
      id: 'weather',
      label: t('nav.weather', 'Weather'),
      sublabel: 'Live & Forecast',
      icon: Sun,
      badge: 'Live'
    },
    {
      id: 'crop_recommendations',
      label: t('nav.crops', 'Crop Matcher'),
      sublabel: 'Seasonal Recommendations',
      icon: Sprout,
      badge: 'Season'
    },
    {
      id: 'market_prices',
      label: t('nav.market', 'Market Prices'),
      sublabel: 'Mandi Rates & Forecast',
      icon: TrendingUp,
      badge: 'e-NAM'
    },
    {
      id: 'soil_health',
      label: t('nav.soil', 'Soil Health'),
      sublabel: 'Fertilizer Assistant',
      icon: Layers,
      badge: null
    },
    {
      id: 'voice_assistant',
      label: t('nav.assistant', 'AI Assistant'),
      sublabel: 'Farming Companion',
      icon: Mic,
      badge: 'Voice'
    },
    {
      id: 'crop_planning',
      label: t('nav.planning', 'Crop Planning'),
      sublabel: 'Calendar & Rotations',
      icon: Calendar,
      badge: null
    },
    {
      id: 'alerts',
      label: t('nav.alerts', 'Alerts'),
      sublabel: 'Pest & Weather Warnings',
      icon: AlertTriangle,
      badge: alertCount > 0 ? `${alertCount}` : null,
      badgeColor: 'bg-amber-500 text-slate-950'
    },
    {
      id: 'farm_calculators',
      label: t('nav.calculators', 'Calculators'),
      sublabel: '7 Precision Tools',
      icon: Calculator,
      badge: '7 Tools'
    },
    {
      id: 'my_farm',
      label: t('nav.myFarm', 'My Farm'),
      sublabel: 'Land & Preferences',
      icon: User,
      badge: null
    },
    {
      id: 'settings',
      label: t('nav.settings', 'Settings'),
      sublabel: 'Language & Units',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 border border-emerald-900/10 shadow-xs">
      {/* Mobile Scrollable Strip / Desktop Responsive Grid */}
      <nav
        className="flex lg:grid lg:grid-cols-11 gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 lg:pb-0 scrollbar-thin"
        aria-label="AgriSense Main Navigation"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center p-2 sm:py-2.5 sm:px-2 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer group shrink-0 min-w-[76px] lg:min-w-0 ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm ring-1 ring-emerald-600 scale-102'
                  : 'bg-transparent text-slate-600 hover:text-emerald-950 hover:bg-emerald-50/70'
              }`}
            >
              {/* Badge */}
              {tab.badge && (
                <span
                  className={`absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold shadow-2xs ${
                    tab.badgeColor || (isActive ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-100 text-emerald-800')
                  }`}
                >
                  {tab.badge}
                </span>
              )}

              {/* Icon */}
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-amber-300'
                    : 'text-emerald-700 group-hover:scale-110'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              {/* Label */}
              <span
                className={`text-[11px] font-bold tracking-tight text-center truncate max-w-full leading-tight mt-0.5 ${
                  isActive ? 'text-white' : 'text-slate-800'
                }`}
              >
                {tab.label}
              </span>

              {/* Active Indicator dot */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
