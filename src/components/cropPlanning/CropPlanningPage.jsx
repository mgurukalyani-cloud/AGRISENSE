import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sprout,
  Calculator,
  TrendingUp,
  Scale,
  MapPin,
  Calendar,
  Layers,
  Droplets,
  Coins,
  Settings,
  AlertCircle,
  AlertTriangle,
  CloudRain,
  Sun,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react';

import { recommendCrops, SEASONS, SOIL_TYPES, IRRIGATION_TYPES } from '../../services/cropPlanningService';
import FarmerFieldProfileModal from './FarmerFieldProfileModal';
import CropRecommendationCard from './CropRecommendationCard';
import CultivationCostCalculator from './CultivationCostCalculator';
import MandiPriceView from './MandiPriceView';
import CropComparisonView from './CropComparisonView';

export default function CropPlanningPage({
  currentWeather,
  dailyWeather,
  location,
  tempUnit = 'C'
}) {
  const { t } = useTranslation();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState('recommendations'); // 'recommendations' | 'calculator' | 'mandi_prices' | 'comparator'
  
  // Suitability Filter for Recommendations view: 'recommended' | 'unsuitable' | 'all'
  const [suitabilityFilter, setSuitabilityFilter] = useState('recommended');

  // Selected focus crop for calculator/mandi views
  const [focusCropId, setFocusCropId] = useState('wheat');

  // Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Farmer Field Profile State
  const [profile, setProfile] = useState(() => {
    // Attempt restoring from localStorage or use robust regional defaults
    try {
      const saved = localStorage.getItem('agrisense_farmer_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      state: location?.state || 'Punjab',
      district: location?.name || 'Ludhiana',
      mandal: 'Ludhiana East',
      village: 'Ayali Kalan',
      season: 'rabi',
      sowingMonth: 'November',
      soilType: 'alluvial_loam',
      soilPh: 7.0,
      irrigationType: 'borewell',
      landAreaAcres: 2.0,
      areaUnit: 'acres',
      budgetPerAcre: 25000,
      cropCategory: 'all'
    };
  });

  const handleSaveProfile = (newProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('agrisense_farmer_profile', JSON.stringify(newProfile));
    } catch {}
  };

  // Weather-Aware Sowing Advisory (uses genuine Open-Meteo forecast)
  const weatherSowingAdvisory = useMemo(() => {
    if (!dailyWeather?.precipitation_sum) return null;
    const next3DaysRain = (dailyWeather.precipitation_sum.slice(0, 3) || []).reduce((a, b) => a + (b || 0), 0);
    const avgTemp = currentWeather?.temperature_2m || 24;

    if (next3DaysRain > 12) {
      return {
        type: 'warning',
        title: 'Impending Rainfall Alert: Defer Sowing Operations',
        message: `Open-Meteo forecasts ~${next3DaysRain.toFixed(1)} mm of rainfall over the next 72 hours. We advise postponing seed drilling and fine seedbed tillage until soil achieves friable moisture to prevent seed rot and soil crusting.`
      };
    } else if (avgTemp > 35 && profile.season === 'rabi') {
      return {
        type: 'warning',
        title: 'Thermal Sowing Warning: High Temperature',
        message: `Current daytime temperature (${avgTemp.toFixed(1)}°C) exceeds the optimal threshold (18-24°C) for Rabi germination. Consider staggering sowing until evening temperatures decline to avoid seed mortality.`
      };
    } else {
      return {
        type: 'optimal',
        title: 'Favorable Agrometeorological Sowing Window',
        message: `Current microclimate (${avgTemp.toFixed(1)}°C, ${next3DaysRain.toFixed(1)} mm rain in 72h) provides stable soil moisture and thermal conditions for immediate field preparation and sowing.`
      };
    }
  }, [dailyWeather, currentWeather, profile.season]);

  // Generate Ranked Crop Recommendations (both suitable & unsuitable)
  const recommendations = useMemo(() => {
    return recommendCrops(profile, currentWeather);
  }, [profile, currentWeather]);

  // Split into suitable vs unsuitable crops
  const suitableCrops = useMemo(() => {
    return recommendations.filter(r => r.isSuitable);
  }, [recommendations]);

  const unsuitableCrops = useMemo(() => {
    return recommendations.filter(r => !r.isSuitable);
  }, [recommendations]);

  // Filtered array according to active filter pill
  const displayedRecommendations = useMemo(() => {
    if (suitabilityFilter === 'recommended') return suitableCrops;
    if (suitabilityFilter === 'unsuitable') return unsuitableCrops;
    return recommendations;
  }, [suitabilityFilter, suitableCrops, unsuitableCrops, recommendations]);

  // Sowing month label
  const seasonObj = SEASONS.find(s => s.id === profile.season);
  const soilObj = SOIL_TYPES.find(s => s.id === profile.soilType);
  const irrObj = IRRIGATION_TYPES.find(i => i.id === profile.irrigationType);

  const handleSelectForCosting = (cropId) => {
    setFocusCropId(cropId);
    setActiveSubTab('calculator');
  };

  const handleSelectForMandi = (cropId) => {
    setFocusCropId(cropId);
    setActiveSubTab('mandi_prices');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. TOP HERO BANNER: SEASONAL CROP PLANNING & MARKET INTELLIGENCE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-green-900 to-teal-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                ICAR & AGMARKNET Integrated
              </span>
              <span className="text-xs text-emerald-200">
                • Verified University Crop Calendars & Actual Photos
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              {t('cropPlanning.moduleTitle', 'Seasonal Crop Planning & Market Intelligence')}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              {t('cropPlanning.moduleDescription', 'Evaluate university-recommended and unsuitable crops for your microclimate with actual photos, agronomic disqualification warnings, authentic AGMARKNET mandi prices, and full cultivation economics.')}
            </p>
          </div>

          {/* Quick Edit Profile Action */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center space-x-2.5 px-5 py-3.5 rounded-2xl bg-white text-emerald-950 font-black text-xs sm:text-sm hover:bg-emerald-50 shadow-lg shadow-emerald-950/30 transition-all shrink-0 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-emerald-800" />
            <span>{t('cropPlanning.customizeFieldProfile', 'Edit Field & Soil Profile')}</span>
          </button>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. REAL-TIME FARMER PROFILE CHIP BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-slate-700">
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Location: <strong className="text-slate-900">{profile.village ? `${profile.village}, ` : ''}{profile.district}, {profile.state}</strong></span>
          </div>

          <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3">
            <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Season: <strong className="text-slate-900 capitalize">{seasonObj?.name.split(' ')[0]} ({profile.sowingMonth})</strong></span>
          </div>

          <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3">
            <Layers className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Soil: <strong className="text-slate-900">{soilObj?.name.split(' ')[0]} (pH {profile.soilPh})</strong></span>
          </div>

          <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3">
            <Droplets className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Water: <strong className="text-slate-900">{irrObj?.name.split(' ')[0]}</strong></span>
          </div>

          <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3">
            <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Area: <strong className="text-slate-900">{profile.landAreaAcres} Acres</strong></span>
          </div>
        </div>

        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4 cursor-pointer"
        >
          Change Parameters
        </button>
      </div>

      {/* 3. WEATHER-INTEGRATED SOWING ADVISORY NOTIFICATION */}
      {weatherSowingAdvisory && (
        <div className={`p-4 sm:p-5 rounded-3xl border flex items-start space-x-3.5 shadow-xs ${
          weatherSowingAdvisory.type === 'warning'
            ? 'bg-amber-50/80 border-amber-300 text-amber-950'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
        }`}>
          {weatherSowingAdvisory.type === 'warning' ? (
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5 text-xs">
            <h4 className="font-bold text-sm">
              {weatherSowingAdvisory.title}
            </h4>
            <p className="leading-relaxed text-slate-700">
              {weatherSowingAdvisory.message}
            </p>
          </div>
        </div>
      )}

      {/* 4. SUB-MODULE NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          {
            id: 'recommendations',
            label: t('cropPlanning.tabRecommendations', '1. Seasonal Crop Recommendations'),
            icon: Sprout,
            countText: `${suitableCrops.length} Suitable / ${unsuitableCrops.length} Unsuitable`
          },
          { id: 'calculator', label: t('cropPlanning.tabCostProfit', '2. Cultivation Cost & Profit Engine'), icon: Calculator },
          { id: 'mandi_prices', label: t('cropPlanning.tabMandi', '3. AGMARKNET Mandi Prices'), icon: TrendingUp },
          { id: 'comparator', label: t('cropPlanning.tabCompare', '4. Cross-Crop Comparator'), icon: Scale }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/20 ring-1 ring-emerald-500/30'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.countText && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {tab.countText}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. ACTIVE TAB CONTENT VIEW */}
      <div>
        {/* SUB-VIEW 1: CROP RECOMMENDATIONS & UNSUITABILITY ANALYSIS */}
        {activeSubTab === 'recommendations' && (
          <div className="space-y-5">
            
            {/* Suitability Filter Selector Bar */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                
                {/* 1. Suitable Crops Pill */}
                <button
                  onClick={() => setSuitabilityFilter('recommended')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                    suitabilityFilter === 'recommended'
                      ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-emerald-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recommended Crops</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    suitabilityFilter === 'recommended' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {suitableCrops.length}
                  </span>
                </button>

                {/* 2. Unsuitable Crops to Avoid Pill */}
                <button
                  onClick={() => setSuitabilityFilter('unsuitable')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                    suitabilityFilter === 'unsuitable'
                      ? 'bg-rose-800 text-white shadow-xs ring-1 ring-rose-600'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Unsuitable Crops to Avoid</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    suitabilityFilter === 'unsuitable' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-900'
                  }`}>
                    {unsuitableCrops.length}
                  </span>
                </button>

                {/* 3. All Crops Pill */}
                <button
                  onClick={() => setSuitabilityFilter('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                    suitabilityFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>All Verified Crops</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    suitabilityFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {recommendations.length}
                  </span>
                </button>

              </div>

              <div className="text-xs text-slate-500 font-medium">
                Showing <strong>{displayedRecommendations.length}</strong> of <strong>{recommendations.length}</strong> crops with actual photos
              </div>
            </div>

            {/* Contextual Advisory Banner for the Active Filter */}
            {suitabilityFilter === 'unsuitable' && (
              <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-xs text-rose-950 flex items-start space-x-3 animate-in fade-in duration-200">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-rose-900">
                    Why These Crops Are Unsuitable for Your Current Conditions:
                  </h4>
                  <p className="leading-relaxed text-rose-800">
                    The <strong>{unsuitableCrops.length} crops</strong> below are not recommended under your active farm profile (Season: <strong>{profile.season.toUpperCase()}</strong>, Soil: <strong>{soilObj?.name}</strong>, Water Source: <strong>{irrObj?.name}</strong>, Temperature: <strong>{currentWeather?.temperature_2m || 24}°C</strong>). Sowing these crops now poses significant risks including photoperiod mismatch, moisture stress, poor seed germination, or severe yield penalty. Inspect each card below for specific scientific reasons.
                  </p>
                </div>
              </div>
            )}

            {suitabilityFilter === 'recommended' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-center space-x-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <p className="leading-relaxed">
                  <strong>{suitableCrops.length} Crops Approved:</strong> Recommended based on high climate alignment, soil drainage/pH suitability, and water source reliability for {seasonObj?.name}.
                </p>
              </div>
            )}

            {/* Recommendations & Unsuitable Crops Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {displayedRecommendations.map((rec) => (
                <CropRecommendationCard
                  key={rec.crop.id}
                  rec={rec}
                  onSelectForCosting={handleSelectForCosting}
                  onSelectForMandi={handleSelectForMandi}
                  farmerState={profile.state}
                />
              ))}
            </div>

          </div>
        )}

        {/* SUB-VIEW 2: CULTIVATION COST & PROFIT CALCULATOR */}
        {activeSubTab === 'calculator' && (
          <CultivationCostCalculator
            selectedCropId={focusCropId}
            landAreaAcres={profile.landAreaAcres}
            onCropChange={setFocusCropId}
            farmerState={profile.state}
          />
        )}

        {/* SUB-VIEW 3: MANDI WHOLESALE MARKET PRICES */}
        {activeSubTab === 'mandi_prices' && (
          <MandiPriceView
            selectedCropId={focusCropId}
            onCropChange={setFocusCropId}
            farmerState={profile.state}
          />
        )}

        {/* SUB-VIEW 4: CROSS-CROP COMPARATOR */}
        {activeSubTab === 'comparator' && (
          <CropComparisonView
            recommendations={recommendations}
            landAreaAcres={profile.landAreaAcres}
            onSelectCropForCosting={handleSelectForCosting}
            farmerState={profile.state}
          />
        )}
      </div>

      {/* 6. MODAL: EDIT FIELD PROFILE */}
      <FarmerFieldProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        location={location}
      />

    </div>
  );
}
