import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Snowflake,
  Wind,
  CloudHail,
  CloudLightning,
  X,
  ShieldAlert
} from 'lucide-react';
import { formatTemp } from '../services/weatherUtils';
import { WhatsAppIcon } from './alerts/WhatsAppAlertModal';

export default function WeatherAlertBanner({ weatherData, tempUnit, onOpenWhatsAppAlerts }) {
  const [dismissed, setDismissed] = useState(false);

  if (!weatherData || !weatherData.current || dismissed) return null;

  const { current, daily } = weatherData;
  const temp = current.temperature_2m || 25;
  const windGusts = current.wind_gusts_10m || 0;
  const rainExpected = daily?.precipitation_sum?.[0] || 0;
  const code = current.weather_code;

  let alert = null;

  // Check Thunderstorm with Hail
  if (code === 96 || code === 99) {
    alert = {
      type: 'HAIL',
      level: 'SEVERE',
      icon: CloudHail,
      title: 'Severe Thunderstorm & Hail Warning',
      detail: 'Hail risk detected. Threat of physical damage to fruit clusters and leafy canopies. Secure polyhouse covers.',
      bg: 'bg-rose-50 border-rose-300 text-rose-950',
      badge: 'bg-rose-600 text-white'
    };
  } else if (code === 95) {
    alert = {
      type: 'THUNDERSTORM',
      level: 'HIGH',
      icon: CloudLightning,
      title: 'Thunderstorm & Lightning Advisory',
      detail: 'Active electrical storm in the sector. Suspend all tractor and elevated irrigation pivot operations immediately.',
      bg: 'bg-indigo-50 border-indigo-300 text-indigo-950',
      badge: 'bg-indigo-600 text-white'
    };
  } else if (temp >= 36) {
    alert = {
      type: 'HEAT',
      level: 'CRITICAL',
      icon: Flame,
      title: `Extreme Heat Stress Warning (${formatTemp(temp, tempUnit)})`,
      detail: 'Ambient temperatures exceed critical crop physiological limits. High risk of blossom drop and wilting. Provide cooling irrigation.',
      bg: 'bg-orange-50 border-orange-300 text-orange-950',
      badge: 'bg-orange-600 text-white'
    };
  } else if (temp <= 2) {
    alert = {
      type: 'FROST',
      level: 'CRITICAL',
      icon: Snowflake,
      title: `Critical Frost Hazard Warning (${formatTemp(temp, tempUnit)})`,
      detail: 'Freezing hazard for orchards and sensitive vegetables. Activate preventative micro-sprinklers or deploy crop covers.',
      bg: 'bg-sky-50 border-sky-300 text-sky-950',
      badge: 'bg-sky-700 text-white'
    };
  } else if (windGusts >= 35) {
    alert = {
      type: 'WIND',
      level: 'WARNING',
      icon: Wind,
      title: `Gale Force Wind Gust Advisory (${Math.round(windGusts)} km/h)`,
      detail: 'Strong gusts can cause crop lodging and tear protective polytunnels. Complete ban on foliar chemical spraying.',
      bg: 'bg-amber-50 border-amber-300 text-amber-950',
      badge: 'bg-amber-600 text-white'
    };
  } else if (rainExpected >= 25) {
    alert = {
      type: 'HEAVY_RAIN',
      level: 'WARNING',
      icon: AlertTriangle,
      title: `Heavy Precipitation Event Forecast (~${rainExpected.toFixed(1)} mm)`,
      detail: 'Potential soil waterlogging and topsoil erosion. Inspect perimeter drainage canals and culverts.',
      bg: 'bg-blue-50 border-blue-300 text-blue-950',
      badge: 'bg-blue-600 text-white'
    };
  }

  if (!alert) return null;

  const Icon = alert.icon;

  return (
    <div className={`p-4 rounded-2xl border shadow-xs transition-all duration-300 ${alert.bg} flex items-start justify-between gap-3`}>
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-white shadow-2xs shrink-0 mt-0.5">
          <Icon className="w-5 h-5 text-current" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${alert.badge}`}>
              {alert.level}
            </span>
            <h3 className="text-sm font-bold tracking-tight">
              {alert.title}
            </h3>
          </div>
          <p className="text-xs mt-1 text-slate-700 leading-relaxed max-w-3xl">
            {alert.detail}
          </p>

          <div className="pt-2">
            <button
              onClick={() => onOpenWhatsAppAlerts && onOpenWhatsAppAlerts(alert)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-emerald-950 font-black text-xs shadow-xs transition-all cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-950" />
              <span>Send Alert to WhatsApp (Demo)</span>
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors shrink-0"
        title="Dismiss alert"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
