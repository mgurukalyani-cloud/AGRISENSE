import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sprout,
  ShieldCheck,
  Cpu,
  Layers,
  Heart,
  ExternalLink
} from 'lucide-react';

export default function Footer({ onOpenModulesDrawer, onOpenSettings }) {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 bg-white border-t border-slate-200/90 text-slate-600 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Branding & Description */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                <Sprout className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                {t('app.title', 'AgriSense')} — {t('app.subtitle', 'Smart Agriculture')}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              {t('footer.desc', 'A high-precision agrometeorological platform designed for farmers, agronomists, and researchers. Synthesizes atmospheric data, soil thermodynamics, and numerical forecasts to guide daily farm decisions.')}
            </p>
            <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-400">
              <span>{t('footer.modularArchitecture', 'Modular Architecture:')}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                {t('footer.module1Active', 'Module 01: Weather Intelligence (Active)')}
              </span>
            </div>
          </div>

          {/* Col 2: Platform Modules Navigation */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              {t('footer.platformModules', 'Platform Modules')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="font-semibold text-emerald-700">1. {t('app.liveWeather', 'Weather Monitoring')} (Live)</span>
              </li>
              <li>
                <button
                  onClick={onOpenModulesDrawer}
                  className="hover:text-emerald-700 text-slate-600 transition-colors text-left flex items-center space-x-1 cursor-pointer"
                >
                  <span>2. IoT Soil Telemetry (ESP32)</span>
                  <span className="text-[10px] text-blue-600 font-mono">[Ready]</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenModulesDrawer}
                  className="hover:text-emerald-700 text-slate-600 transition-colors text-left flex items-center space-x-1 cursor-pointer"
                >
                  <span>3. AI Crop Recommendation</span>
                  <span className="text-[10px] text-slate-400 font-mono">[Next]</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenModulesDrawer}
                  className="hover:text-emerald-700 text-slate-600 transition-colors text-left flex items-center space-x-1 cursor-pointer"
                >
                  <span>4. Solenoid Valve Control</span>
                  <span className="text-[10px] text-slate-400 font-mono">[Next]</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenModulesDrawer}
                  className="hover:text-emerald-700 text-slate-600 transition-colors text-left flex items-center space-x-1 cursor-pointer"
                >
                  <span className="font-semibold text-emerald-700">5. {t('app.plantHealth', 'Plant Health')} (AI Vision)</span>
                  <span className="text-[10px] text-emerald-600 font-mono font-bold">[Live]</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Standards & Attributions */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              {t('footer.standardsTitle', 'Meteorological Standards')}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li>• Open-Meteo High-Resolution Numerical API</li>
              <li>• WMO 4677 Meteorological Classification</li>
              <li>• FAO-56 Penman-Monteith Evapotranspiration</li>
              <li>• Tetens Vapor Pressure Deficit (VPD)</li>
              <li>• Global Agrometeorological Reanalysis</li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <p>© {new Date().getFullYear()} {t('footer.copyright', 'AgriSense Platform. Built for precision agricultural stewardship.')}</p>
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenSettings}
              className="hover:text-slate-600 transition-colors cursor-pointer"
            >
              {t('footer.systemSettings', 'System Settings & Units')}
            </button>
            <span>•</span>
            <button
              onClick={onOpenModulesDrawer}
              className="hover:text-slate-600 transition-colors cursor-pointer"
            >
              {t('footer.hardwareRoadmap', 'Hardware Roadmap')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
