import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sprout,
  ShieldCheck,
  Heart,
  ExternalLink,
  MapPin,
  TrendingUp,
  Sun,
  Layers,
  Calculator,
  Mic,
  AlertTriangle
} from 'lucide-react';

export default function Footer({ onNavigateTab, onOpenSettings }) {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 bg-white border-t border-slate-200/90 text-slate-600 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Branding & The FOF Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-xs">
                <Sprout className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="text-lg font-black text-slate-900 tracking-tight">
                  AgriSense
                </span>
                <span className="text-xs font-bold text-amber-700 ml-2">
                  By The FOF (Friends of Farmers)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-semibold italic">
              "Smarter Farming. Better Decisions. Higher Profits."
            </p>

            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              AgriSense is an intelligent digital agricultural technology platform created to empower Indian farmers with live weather intelligence, seasonal crop matching, mandi market prices, future price forecasting, soil nutrient science, and 24/7 AI farming assistance in English, Telugu, and Hindi.
            </p>

            <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Production Agritech Standard • Mobile-First Rural Architecture</span>
            </div>
          </div>

          {/* Col 2: Platform Navigation */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Platform Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('weather')}
                  className="hover:text-emerald-700 text-slate-600 transition-colors text-left cursor-pointer"
                >
                  Live Weather & 7-Day Forecast
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('crop_recommendations')}
                  className="hover:text-emerald-700 text-slate-600 transition-colors text-left cursor-pointer"
                >
                  Seasonal Crop Recommendations
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('market_prices')}
                  className="hover:text-emerald-700 text-slate-600 transition-colors text-left cursor-pointer"
                >
                  Mandi Prices & 30-Day Forecasts
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('soil_health')}
                  className="hover:text-emerald-700 text-slate-600 transition-colors text-left cursor-pointer"
                >
                  Soil Health & Fertilizer Dosing
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('farm_calculators')}
                  className="hover:text-emerald-700 text-slate-600 transition-colors text-left cursor-pointer"
                >
                  7 Agricultural Calculators
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Data Sources & Accuracy */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Verified Data Sources
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li>• Open-Meteo & WMO Meteorological Stations</li>
              <li>• AGMARKNET & e-NAM (Ministry of Agriculture)</li>
              <li>• ICAR & State Agricultural Universities</li>
              <li>• Commission for Agricultural Costs & Prices (CACP)</li>
              <li>• National Soil Health Card (SHC) Norms</li>
              <li>• Pradhan Mantri Fasal Bima Yojana (PMFBY)</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <div>
            © 2026 AgriSense. Powered by The FOF — Friends of Farmers. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-700 font-semibold">Telugu (తెలుగు) • Hindi (हिंदी) • English</span>
            <span>•</span>
            <button
              onClick={onOpenSettings}
              className="hover:text-slate-700 cursor-pointer"
            >
              Preferences
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
