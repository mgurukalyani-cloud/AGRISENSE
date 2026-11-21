import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  MapPin,
  Layers,
  Droplets,
  Sprout,
  CheckCircle2,
  Save,
  Sparkles,
  ShieldCheck,
  Compass,
  ArrowRight
} from 'lucide-react';
import { SOIL_TYPES_DETAILED } from '../../services/soilIntelligenceService';
import { CROPS_DATABASE, IRRIGATION_TYPES } from '../../services/cropPlanningService';
import { MANDI_DIRECTORY_BY_STATE } from '../../services/mandiPriceService';

export default function MyFarmProfilePage({ onSaveProfile, onNavigateTab }) {
  const { t } = useTranslation();

  // Load profile from localStorage
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('agrisense_farmer_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Ramesh Patel',
      phone: '',
      village: 'Khammam Rural',
      district: 'Khammam',
      state: 'Telangana',
      acres: 4.5,
      soilType: 'black_soil',
      irrigationSource: 'borewell',
      crops: ['cotton', 'chilli', 'paddy_rice'],
      farmingMethod: 'conventional' // 'conventional' | 'natural_farming' | 'organic'
    };
  });

  const [savedNotification, setSavedNotification] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('agrisense_farmer_profile', JSON.stringify(profile));
      setSavedNotification(true);
      if (onSaveProfile) onSaveProfile(profile);
      setTimeout(() => setSavedNotification(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const toggleCrop = (cropId) => {
    setProfile(prev => {
      const current = prev.crops || [];
      const exists = current.includes(cropId);
      const updated = exists ? current.filter(c => c !== cropId) : [...current, cropId];
      return { ...prev, crops: updated };
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. HERO BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-[#072517] to-slate-950 text-white p-5 sm:p-7 border border-emerald-500/20 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>Farm Telemetry & Personalization</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            My Farm Profile & Land Holdings
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-2xl font-medium">
            Personalize weather advisories, seasonal crop recommendations, mandi market tracking, and fertilizer dosages according to your specific land parcels.
          </p>
        </div>

        {savedNotification && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile Saved Successfully!</span>
          </div>
        )}
      </div>

      {/* 2. PROFILE CONFIGURATION FORM */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-5 sm:p-8 border border-emerald-900/10 shadow-sm space-y-6">
        {/* Section 1: Farmer & Geographical Location */}
        <div className="space-y-4">
          <h3 className="text-base font-black text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-emerald-700" />
            <span>Farmer Identity & Location Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Farmer Full Name:</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter farmer name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Village / Town / Mandal:</label>
              <input
                type="text"
                value={profile.village}
                onChange={(e) => setProfile({ ...profile, village: e.target.value })}
                placeholder="Village name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">District:</label>
              <input
                type="text"
                value={profile.district}
                onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                placeholder="District name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">State:</label>
              <select
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                {Object.keys(MANDI_DIRECTORY_BY_STATE).map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Farm Land & Agronomic Soil Attributes */}
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-black text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>Land Area, Soil Type & Water Source</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Cultivated Land Area (Acres):</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={profile.acres}
                onChange={(e) => setProfile({ ...profile, acres: parseFloat(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Dominant Soil Type:</label>
              <select
                value={profile.soilType}
                onChange={(e) => setProfile({ ...profile, soilType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                {SOIL_TYPES_DETAILED.map(st => (
                  <option key={st.id} value={st.id}>{st.name.split(' (')[0]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Primary Irrigation Infrastructure:</label>
              <select
                value={profile.irrigationSource}
                onChange={(e) => setProfile({ ...profile, irrigationSource: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                {IRRIGATION_TYPES.map(it => (
                  <option key={it.id} value={it.id}>{it.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Crops Cultivated & Farming Methodology */}
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-black text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Sprout className="w-4 h-4 text-emerald-700" />
            <span>Currently Cultivated Crops & Farming Style</span>
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Crops Currently Sown or Planned (Click to toggle):
            </label>
            <div className="flex flex-wrap gap-2">
              {CROPS_DATABASE.map(c => {
                const isSelected = (profile.crops || []).includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCrop(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{c.name.split(' (')[0]}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-w-md pt-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">Farming Methodology:</label>
            <select
              value={profile.farmingMethod}
              onChange={(e) => setProfile({ ...profile, farmingMethod: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              <option value="conventional">Integrated / Conventional (Chemical + Organic)</option>
              <option value="natural_farming">Zero Budget Natural Farming (ZBNF / Prakritik Krishi)</option>
              <option value="organic">Certified Organic (Jaivik Bharat / NPOP)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Settings are safely saved to local device storage and used across all AgriSense intelligence engines.
          </p>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md hover:shadow-lg"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>Save My Farm Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}
