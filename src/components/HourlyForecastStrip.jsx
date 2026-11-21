import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Droplets,
  Wind,
  LineChart as ChartIcon,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  Thermometer,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';
import WeatherIcon from './WeatherIcon';
import {
  getWmoInfo,
  formatTemp,
  formatTempRaw,
  formatWind,
  formatRain,
  getWindCompass,
  formatHourTime,
  formatHourTimeline
} from '../services/weatherUtils';

export default function HourlyForecastStrip({ hourly, tempUnit, defaultView = 'split' }) {
  const { t } = useTranslation();
  
  // Layout mode: 'split' (both chart and cards) | 'chart' | 'cards'
  const [layoutMode, setLayoutMode] = useState(defaultView);
  // Time span: 24 or 48 hours
  const [timeHorizon, setTimeHorizon] = useState(24);
  // Chart parameter tab: 'agrometeo' | 'thermal' | 'moisture' | 'spray'
  const [activeParamTab, setActiveParamTab] = useState('agrometeo');

  if (!hourly || !hourly.time || hourly.time.length === 0) return null;

  // Process data for the selected time horizon (up to 48 hours)
  const count = Math.min(hourly.time.length, timeHorizon);
  
  const chartData = useMemo(() => {
    return hourly.time.slice(0, count).map((tVal, idx) => {
      const rawTemp = formatTempRaw(hourly.temperature_2m[idx], tempUnit);
      const rawApparent = hourly.apparent_temperature 
        ? formatTempRaw(hourly.apparent_temperature[idx], tempUnit) 
        : rawTemp;
      const rawDewPoint = hourly.dew_point_2m 
        ? formatTempRaw(hourly.dew_point_2m[idx], tempUnit) 
        : Math.round(rawTemp - 8);
      const rawSoilTemp = hourly.soil_temperature_0cm 
        ? formatTempRaw(hourly.soil_temperature_0cm[idx], tempUnit) 
        : rawTemp;
      
      const rainProb = hourly.precipitation_probability?.[idx] || 0;
      const rainMm = hourly.precipitation?.[idx] || 0;
      const humidity = hourly.relative_humidity_2m?.[idx] || 60;
      const windKmh = hourly.wind_speed_10m?.[idx] || 0;
      const windGusts = hourly.wind_gusts_10m?.[idx] || Math.round(windKmh * 1.45);
      const windDir = hourly.wind_direction_10m?.[idx] || 0;
      const weatherCode = hourly.weather_code?.[idx] ?? 0;
      const vpd = hourly.vapour_pressure_deficit?.[idx] || 1.1;
      const et0 = hourly.et0_fao_evapotranspiration?.[idx] || 0.1;

      // Real-time spraying window suitability for this exact hour
      const isSpraySafe = windKmh < 15 && rainProb < 35 && humidity > 40 && humidity < 85;

      return {
        time: formatHourTimeline(tVal),
        shortTime: formatHourTime(tVal),
        fullIso: tVal,
        temperature: rawTemp,
        apparentTemp: rawApparent,
        dewPoint: rawDewPoint,
        soilTemp: rawSoilTemp,
        precipitationProb: rainProb,
        precipitationMm: rainMm,
        relativeHumidity: humidity,
        windSpeed: Math.round(windKmh * 10) / 10,
        windGusts: Math.round(windGusts * 10) / 10,
        windDirection: getWindCompass(windDir),
        weatherCode,
        vpd,
        et0,
        isSpraySafe,
        sprayThreshold: 15
      };
    });
  }, [hourly, count, tempUnit]);

  // Key summary statistics for the selected horizon
  const stats = useMemo(() => {
    if (!chartData.length) return null;
    const temps = chartData.map(d => d.temperature);
    const rains = chartData.map(d => d.precipitationMm);
    const gusts = chartData.map(d => d.windGusts);
    const humidities = chartData.map(d => d.relativeHumidity);
    const safeSprayHours = chartData.filter(d => d.isSpraySafe).length;

    return {
      minTemp: Math.min(...temps),
      maxTemp: Math.max(...temps),
      rainTotal: Math.round(rains.reduce((a, b) => a + b, 0) * 10) / 10,
      peakGust: Math.max(...gusts),
      avgHumidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
      safeSprayHours
    };
  }, [chartData]);

  // Rich Custom Tooltip Component
  const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const wmo = getWmoInfo(d.weatherCode);

      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-white/15 text-xs space-y-2 max-w-xs pointer-events-none z-50">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 gap-2">
            <div>
              <span className="font-extrabold text-emerald-400 block text-xs">{d.time}</span>
              <span className="text-[10px] text-slate-400 block font-mono">{d.shortTime}</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold">
              <WeatherIcon iconName={wmo.icon} className="w-3.5 h-3.5 text-amber-300" />
              <span>{wmo.label}</span>
            </div>
          </div>

          {/* Metric grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Air Temp:</span>
              <strong className="text-white font-mono">{d.temperature}°{tempUnit}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Feels Like:</span>
              <strong className="text-emerald-300 font-mono">{d.apparentTemp}°{tempUnit}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Dew Point:</span>
              <strong className="text-cyan-300 font-mono">{d.dewPoint}°{tempUnit}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Soil (0cm):</span>
              <strong className="text-amber-300 font-mono">{d.soilTemp}°{tempUnit}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Rain Prob:</span>
              <strong className="text-blue-400 font-mono">{d.precipitationProb}%</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Rain Vol:</span>
              <strong className="text-blue-300 font-mono">{d.precipitationMm} mm</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Humidity:</span>
              <strong className="text-teal-300 font-mono">{d.relativeHumidity}%</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Wind:</span>
              <strong className="text-indigo-300 font-mono">{d.windSpeed} km/h ({d.windDirection})</strong>
            </div>
          </div>

          {/* Agronomic status badge */}
          <div className={`mt-1 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center space-x-1.5 ${
            d.isSpraySafe
              ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/30'
              : 'bg-amber-900/60 text-amber-200 border border-amber-500/30'
          }`}>
            {d.isSpraySafe ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Suitable Spraying Window (Wind &lt; 15 km/h, Rain &lt; 35%)</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Unfavorable Spraying (Wind {d.windSpeed} km/h / Rain {d.precipitationProb}%)</span>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
      {/* 1. Header & Controls Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center space-x-2">
              <ChartIcon className="w-5 h-5 text-emerald-700" />
              <span>48-Hour Agrometeorological Graph &amp; Operational Continuum</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Actual Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Published continuous numerical curves for ambient temperature, dew point, rainfall risk, and pesticide spraying safety windows.
          </p>
        </div>

        {/* Action Controls Group */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          {/* 24h vs 48h Horizon Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setTimeHorizon(24)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                timeHorizon === 24
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setTimeHorizon(48)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                timeHorizon === 48
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              48 Hours
            </button>
          </div>

          {/* Layout Mode Toggle (Split / Graph / Cards) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setLayoutMode('split')}
              title="Split View: Graph + Cards"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                layoutMode === 'split'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setLayoutMode('chart')}
              title="Graph View Only"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                layoutMode === 'chart'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Graph Only</span>
            </button>
            <button
              onClick={() => setLayoutMode('cards')}
              title="Cards View Only"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                layoutMode === 'cards'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Graph Parameter Tabs (Shown when in 'split' or 'chart') */}
      {(layoutMode === 'split' || layoutMode === 'chart') && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-50 border border-slate-200/80">
            {[
              { id: 'agrometeo', label: 'All-in-One Agrometeo (Temp, Rain, Wind)', icon: Activity },
              { id: 'thermal', label: 'Thermal & Dew Point Dynamics', icon: Thermometer },
              { id: 'moisture', label: 'Rain Volume & Leaf Wetness', icon: Droplets },
              { id: 'spray', label: 'Wind Velocity & Spraying Safety Window', icon: Wind }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeParamTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveParamTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Recharts Canvas */}
          <div className="h-72 sm:h-80 md:h-88 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              {activeParamTab === 'agrometeo' ? (
                /* TAB 1: ALL-IN-ONE AGROMETEO (Temp Area + Rain Bars + Wind Line) */
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGradientLive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} interval="preserveStartEnd" />
                  <YAxis
                    yAxisId="temp"
                    stroke="#059669"
                    fontSize={11}
                    tickLine={false}
                    unit={`°${tempUnit}`}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <YAxis
                    yAxisId="rain"
                    orientation="right"
                    stroke="#2563eb"
                    fontSize={11}
                    tickLine={false}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 11 }} />
                  <Bar
                    yAxisId="rain"
                    dataKey="precipitationProb"
                    name="Rain Probability (%)"
                    fill="#93c5fd"
                    radius={[4, 4, 0, 0]}
                    opacity={0.85}
                  />
                  <Area
                    yAxisId="temp"
                    type="monotone"
                    dataKey="temperature"
                    name={`Temperature (°${tempUnit})`}
                    stroke="#059669"
                    strokeWidth={2.8}
                    fillOpacity={1}
                    fill="url(#tempGradientLive)"
                  />
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="apparentTemp"
                    name={`Feels Like (°${tempUnit})`}
                    stroke="#0284c7"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    yAxisId="rain"
                    type="monotone"
                    dataKey="windSpeed"
                    name="Wind Speed (km/h)"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              ) : activeParamTab === 'thermal' ? (
                /* TAB 2: THERMAL DYNAMICS & DEW POINT */
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="thermalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} interval="preserveStartEnd" />
                  <YAxis
                    stroke="#0f766e"
                    fontSize={11}
                    tickLine={false}
                    unit={`°${tempUnit}`}
                    domain={['dataMin - 3', 'dataMax + 3']}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="temperature"
                    name={`Air Temperature (°${tempUnit})`}
                    stroke="#059669"
                    strokeWidth={2.8}
                    fill="url(#thermalGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="dewPoint"
                    name={`Dew Point (°${tempUnit})`}
                    stroke="#06b6d4"
                    strokeWidth={2.2}
                    dot={{ r: 2.5, fill: '#06b6d4' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="soilTemp"
                    name={`Root Soil Temp 0cm (°${tempUnit})`}
                    stroke="#d97706"
                    strokeWidth={2.2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <ReferenceLine y={0} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: '0°C Freezing Limit', fill: '#3b82f6', fontSize: 10 }} />
                </ComposedChart>
              ) : activeParamTab === 'moisture' ? (
                /* TAB 3: MOISTURE & PRECIPITATION */
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} interval="preserveStartEnd" />
                  <YAxis
                    yAxisId="rainMm"
                    stroke="#0284c7"
                    fontSize={11}
                    tickLine={false}
                    unit=" mm"
                    domain={[0, 'auto']}
                  />
                  <YAxis
                    yAxisId="pct"
                    orientation="right"
                    stroke="#0d9488"
                    fontSize={11}
                    tickLine={false}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 11 }} />
                  <Bar
                    yAxisId="rainMm"
                    dataKey="precipitationMm"
                    name="Rainfall Volume (mm)"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="pct"
                    type="monotone"
                    dataKey="relativeHumidity"
                    name="Relative Humidity (%)"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    yAxisId="pct"
                    type="monotone"
                    dataKey="precipitationProb"
                    name="Precipitation Probability (%)"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2 }}
                  />
                </ComposedChart>
              ) : (
                /* TAB 4: WIND & SPRAYING WINDOW */
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} interval="preserveStartEnd" />
                  <YAxis
                    stroke="#6d28d9"
                    fontSize={11}
                    tickLine={false}
                    unit=" km/h"
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="windGusts"
                    name="Peak Wind Gusts (km/h)"
                    stroke="#ec4899"
                    strokeWidth={2}
                    fill="url(#windGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="windSpeed"
                    name="Sustained Wind (km/h)"
                    stroke="#7c3aed"
                    strokeWidth={2.8}
                    dot={{ r: 3, fill: '#7c3aed' }}
                  />
                  <ReferenceLine
                    y={15}
                    stroke="#d97706"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{ value: '15 km/h Safe Spraying Limit', fill: '#b45309', fontSize: 11, fontWeight: 'bold' }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* 3. Real-Time Physical Summary Metric Strip */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Min / Max Temp</span>
                <span className="text-sm font-extrabold text-slate-900 font-mono mt-0.5 block">
                  {stats.minTemp}°{tempUnit} / {stats.maxTemp}°{tempUnit}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Rain Accumulation</span>
                <span className="text-sm font-extrabold text-blue-900 font-mono mt-0.5 block">
                  {stats.rainTotal} mm
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-purple-50/70 border border-purple-100">
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Peak Wind Gust</span>
                <span className="text-sm font-extrabold text-purple-900 font-mono mt-0.5 block">
                  {stats.peakGust} km/h
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-teal-50/70 border border-teal-100">
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Mean Humidity</span>
                <span className="text-sm font-extrabold text-teal-900 font-mono mt-0.5 block">
                  {stats.avgHumidity}% RH
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-100 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Spraying Hours</span>
                <span className="text-sm font-extrabold text-amber-900 font-mono mt-0.5 block">
                  {stats.safeSprayHours} / {count} Hours Safe
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Interactive Cards Horizontal Scroll Strip (Shown in 'split' or 'cards') */}
      {(layoutMode === 'split' || layoutMode === 'cards') && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hourly Card Breakdown ({count} Hours)</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal flex items-center space-x-1">
              <span>Scroll horizontally</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="flex space-x-3 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x">
            {hourly.time.slice(0, count).map((timeStr, idx) => {
              const code = hourly.weather_code?.[idx] ?? 0;
              const wmo = getWmoInfo(code);
              const temp = hourly.temperature_2m[idx];
              const precipProb = hourly.precipitation_probability?.[idx] || 0;
              const wind = hourly.wind_speed_10m[idx] || 0;
              const isNow = idx === 0;

              return (
                <div
                  key={timeStr}
                  className={`snap-start shrink-0 w-24 sm:w-28 p-3 rounded-2xl border text-center transition-all flex flex-col justify-between ${
                    isNow
                      ? 'bg-gradient-to-b from-emerald-50 to-emerald-100/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <span className={`text-[11px] font-bold block ${isNow ? 'text-emerald-900' : 'text-slate-700'}`}>
                      {isNow ? 'Now' : formatHourTime(timeStr)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {formatHourTimeline(timeStr)}
                    </span>

                    <div className="my-2 flex justify-center">
                      <WeatherIcon
                        iconName={wmo.icon}
                        className={`w-7 h-7 ${isNow ? 'text-emerald-700' : 'text-slate-600'}`}
                      />
                    </div>

                    <span className="text-base font-extrabold text-slate-900 block font-mono">
                      {formatTemp(temp, tempUnit)}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-1 text-[10px]">
                    <div className="flex items-center justify-between text-blue-600 font-semibold">
                      <Droplets className="w-3 h-3" />
                      <span>{precipProb}%</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <Wind className="w-3 h-3 text-slate-400" />
                      <span>{Math.round(wind)}kph</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
