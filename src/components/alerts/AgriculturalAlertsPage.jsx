import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CloudRain,
  Flame,
  Wind,
  Bug,
  TrendingUp,
  FileText,
  Filter,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  ALERT_CATEGORIES,
  getAgriculturalAlerts
} from '../../services/alertsService';

export default function AgriculturalAlertsPage({
  weatherData,
  location
}) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load farmer profile
  const profile = (() => {
    try {
      const saved = localStorage.getItem('agrisense_farmer_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      state: location?.admin1 || 'Telangana',
      crops: ['cotton', 'chilli', 'paddy_rice']
    };
  })();

  const allAlerts = getAgriculturalAlerts({
    weatherData,
    farmerCrops: profile.crops,
    farmerState: profile.state
  });

  const filteredAlerts = selectedCategory === 'all'
    ? allAlerts
    : allAlerts.filter(a => a.category === selectedCategory);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-600 text-white border-rose-700';
      case 'WARNING':
        return 'bg-amber-500 text-slate-950 border-amber-600';
      case 'OPPORTUNITY':
        return 'bg-emerald-600 text-white border-emerald-700';
      case 'IMPORTANT':
        return 'bg-indigo-600 text-white border-indigo-700';
      default:
        return 'bg-slate-600 text-white border-slate-700';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'weather':
        return CloudRain;
      case 'pest_disease':
        return Bug;
      case 'market':
        return TrendingUp;
      case 'schemes':
        return FileText;
      default:
        return AlertTriangle;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. HERO BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-slate-950 to-emerald-950 text-white p-5 sm:p-7 border border-amber-500/20 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-800/60 border border-amber-400/30 text-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Early Warning & Farmer Protection System</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            Agricultural Alerts & Pest Surveillance Feed
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-1 max-w-2xl font-medium">
            Verified warnings for heavy rainfall, extreme heat, pest & disease emergence thresholds, sudden mandi price swings, and government DBT schemes.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-emerald-200">
            <span>Location: {location?.name || 'Local District'}</span>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY FILTER TABS */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
        {ALERT_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. ALERTS LIST */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Active Alerts in This Category</h3>
            <p className="text-xs text-slate-500">All environmental, pest, and market conditions are within normal parameters.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const Icon = getCategoryIcon(alert.category);
            return (
              <div
                key={alert.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 hover:border-amber-500/40 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getSeverityBadge(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">Issued: {alert.date}</span>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[11px] text-emerald-700 font-bold">{alert.source}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">{alert.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{alert.states.join(', ')}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-0 sm:pl-13">
                  {alert.description}
                </p>

                {/* Direct Actionable Guidance */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1 sm:ml-13">
                  <div className="font-bold flex items-center space-x-1.5 text-amber-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Actionable Agronomic Protocol for Farmers:</span>
                  </div>
                  <p className="leading-relaxed pl-5 font-medium">{alert.actionRequired}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
