import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sun,
  Home,
  Leaf,
  Sprout,
  TrendingUp,
  Cpu,
  Volume2,
  Compass,
  Mic,
  CalendarDays,
  ShieldAlert,
  Calculator,
  ShoppingBag
} from 'lucide-react';
import { WhatsAppIcon } from './alerts/WhatsAppAlertModal';

export default function NavigationTabs({
  activeTab,
  onChangeTab,
  advisorScore = 85,
  onOpenWhatsAppAlerts
}) {
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'weather',
      label: 'Weather',
      fullLabel: t('app.weatherIntelligence', 'Weather Intelligence'),
      icon: Sun,
      badge: 'Live',
      badgeColor: 'text-emerald-700 bg-emerald-100/90 border-emerald-300'
    },
    {
      id: 'plant_health',
      label: 'Leaf Health',
      fullLabel: t('app.plantHealth', 'Leaf Health AI'),
      icon: Leaf,
      badge: 'Vision AI',
      badgeColor: 'text-teal-700 bg-teal-100/90 border-teal-300'
    },
    {
      id: 'crop_lifecycle',
      label: 'Crop Advisory',
      fullLabel: 'Crop Lifecycle & Fertilizer Advisory',
      icon: Sprout,
      badge: 'ICAR AI',
      badgeColor: 'text-emerald-800 bg-emerald-100/90 border-emerald-300'
    },
    {
      id: 'crop_planning',
      label: 'Market Prices',
      fullLabel: t('app.cropPlanning', 'Crop & Mandi AI'),
      icon: TrendingUp,
      badge: 'e-NAM',
      badgeColor: 'text-emerald-800 bg-emerald-100/90 border-emerald-300'
    },
    {
      id: 'store',
      label: 'Agri Store',
      fullLabel: 'AgriSense Store & E-Commerce',
      icon: ShoppingBag,
      badge: 'Shop',
      badgeColor: 'text-emerald-800 bg-emerald-100/90 border-emerald-300'
    },
    {
      id: 'soil_monitoring',
      label: 'Soil Telemetry',
      fullLabel: t('app.soilMonitoring', 'Soil Telemetry'),
      icon: Cpu,
      badge: 'ESP32',
      badgeColor: 'text-cyan-800 bg-cyan-100/90 border-cyan-300'
    },
    {
      id: 'animal_repellent',
      label: 'Animal Sound AI',
      fullLabel: t('app.animalRepellent', 'Animal Sound AI'),
      icon: Volume2,
      badge: 'Bio-AI',
      badgeColor: 'text-purple-800 bg-purple-100/90 border-purple-300'
    },
    {
      id: 'farm_insights',
      label: 'Farm Insights',
      fullLabel: t('app.farmInsights', 'Farm Insights'),
      icon: Compass,
      badge: `${advisorScore}/100`,
      badgeColor: 'text-amber-800 bg-amber-100/90 border-amber-300'
    },
    {
      id: 'voice_assistant',
      label: 'AI Assistant',
      fullLabel: t('app.voiceAssistant', 'Voice Assistant'),
      icon: Mic,
      badge: 'Voice',
      badgeColor: 'text-indigo-800 bg-indigo-100/90 border-indigo-300'
    },
    {
      id: 'whatsapp_alerts',
      label: 'Alerts',
      fullLabel: 'WhatsApp Weather Alerts',
      icon: WhatsAppIcon,
      badge: 'Demo',
      badgeColor: 'text-green-800 bg-green-100/90 border-green-300',
      action: onOpenWhatsAppAlerts
    }
  ];

  return (
    <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-2 sm:p-3 border border-emerald-900/10 shadow-sm shadow-emerald-950/5">
      <nav
        className="flex items-center justify-start xl:justify-center overflow-x-auto gap-2 sm:gap-2.5 py-1 px-1 scrollbar-thin scrollbar-thumb-emerald-200"
        aria-label="Smart Agriculture Navigation Tabs"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isWeatherActive =
            activeTab === 'weather' ||
            activeTab === 'overview' ||
            activeTab === 'live' ||
            activeTab === 'past' ||
            activeTab === 'forecast';
          const isActive = tab.id === 'weather' ? isWeatherActive : activeTab === tab.id;

          const handleClick = () => {
            if (tab.action) {
              tab.action();
            } else {
              onChangeTab(tab.id);
            }
          };

          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={handleClick}
              className={`flex flex-col items-center justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl transition-all duration-200 cursor-pointer text-center shrink-0 min-w-[90px] sm:min-w-[105px] group ${
                isActive
                  ? 'bg-gradient-to-b from-[#0a4d33] via-emerald-900 to-emerald-950 text-white shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/40 -translate-y-0.5'
                  : 'bg-slate-50/80 hover:bg-emerald-50/80 text-slate-700 hover:text-emerald-950 border border-slate-200/80 hover:border-emerald-300/80 shadow-2xs hover:-translate-y-0.5'
              }`}
              title={tab.fullLabel}
            >
              {/* Top Mini Pill Badge */}
              <div className="h-4 flex items-center justify-center mb-1">
                {tab.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider border leading-none ${
                      isActive
                        ? 'bg-emerald-700/80 text-emerald-200 border-emerald-500/40'
                        : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Icon */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  isActive
                    ? 'text-white'
                    : 'text-emerald-700'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              {/* Label */}
              <span
                className={`text-xs font-extrabold mt-1 leading-tight tracking-tight whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-slate-800 group-hover:text-emerald-950'
                }`}
              >
                {tab.label}
              </span>

              {/* Active Golden Indicator Dot */}
              <div className="h-1.5 flex items-center justify-center mt-1">
                {isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs shadow-amber-300 animate-pulse" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-emerald-300 transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
