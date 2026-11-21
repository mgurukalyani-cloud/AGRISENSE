import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  History,
  Calendar,
  Droplets,
  Thermometer,
  Wind,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Database,
  Info,
  Radio,
  FileSpreadsheet,
  LineChart as ChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import WeatherIcon from './WeatherIcon';
import {
  formatTemp,
  formatTempRaw,
  formatRain,
  getWmoInfo,
  formatForecastDay
} from '../services/weatherUtils';
import { fetchHistoricalArchive } from '../services/weatherApi';

export default function HistoricalWeatherView({
  historicalData,
  location,
  tempUnit
}) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('7d'); // '7d' | '14d' | '30d' | 'custom'
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [customData, setCustomData] = useState(null);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [archiveError, setArchiveError] = useState(null);

  // Active data source: customData if custom, otherwise slice historicalData
  const getActiveDataset = () => {
    if (period === 'custom' && customData) {
      return customData;
    }

    if (!historicalData || !historicalData.time) {
      return {
        time: [],
        temperature_2m_max: [],
        temperature_2m_min: [],
        precipitation_sum: [],
        et0_fao_evapotranspiration: [],
        dataType: 'STATION_ANALYSIS',
        sourceLabel: 'WMO Ground Station Observations'
      };
    }

    const daysCount = period === '7d' ? 7 : period === '14d' ? 14 : 30;
    const len = historicalData.time.length;
    const start = Math.max(0, len - daysCount);

    const isLongerReanalysis = daysCount > 14;

    return {
      time: historicalData.time.slice(start),
      temperature_2m_max: historicalData.temperature_2m_max.slice(start),
      temperature_2m_min: historicalData.temperature_2m_min.slice(start),
      precipitation_sum: historicalData.precipitation_sum?.slice(start) || [],
      weather_code: historicalData.weather_code?.slice(start) || [],
      et0_fao_evapotranspiration: historicalData.et0_fao_evapotranspiration?.slice(start) || [],
      dataType: isLongerReanalysis ? 'REANALYSIS_ESTIMATE' : 'STATION_ANALYSIS',
      sourceLabel: isLongerReanalysis
        ? 'ECMWF ERA5-Land Reanalysis Estimates'
        : 'WMO Ground Station Observations & Operational Analysis',
      sourceDescription: isLongerReanalysis
        ? 'Derived from ECMWF ERA5-Land global high-resolution (9 km) physical reanalysis models.'
        : 'Recorded by calibrated WMO surface meteorological stations and physical analysis.'
    };
  };

  const activeData = getActiveDataset();

  // Compute key historical summary statistics
  const maxTemps = activeData.temperature_2m_max.filter(v => v !== null && !isNaN(v));
  const minTemps = activeData.temperature_2m_min.filter(v => v !== null && !isNaN(v));
  const rainSums = activeData.precipitation_sum.filter(v => v !== null && !isNaN(v));

  const highestRecordedTemp = maxTemps.length > 0 ? Math.max(...maxTemps) : null;
  const lowestRecordedTemp = minTemps.length > 0 ? Math.min(...minTemps) : null;

  const highestIdx = highestRecordedTemp !== null ? activeData.temperature_2m_max.indexOf(highestRecordedTemp) : -1;
  const lowestIdx = lowestRecordedTemp !== null ? activeData.temperature_2m_min.indexOf(lowestRecordedTemp) : -1;
  const highestDate = highestIdx !== -1 ? activeData.time[highestIdx] : '--';
  const lowestDate = lowestIdx !== -1 ? activeData.time[lowestIdx] : '--';

  const totalRainfall = rainSums.reduce((acc, curr) => acc + curr, 0);
  const rainDaysCount = rainSums.filter(r => r > 0.2).length;
  const avgMaxTemp = maxTemps.length > 0 ? maxTemps.reduce((a, b) => a + b, 0) / maxTemps.length : null;
  const avgMinTemp = minTemps.length > 0 ? minTemps.reduce((a, b) => a + b, 0) / minTemps.length : null;

  // Format Recharts data with cumulative precipitation and thermal averages
  let cumulativeSum = 0;
  const chartData = activeData.time.map((d, i) => {
    const rain = Math.round((activeData.precipitation_sum[i] || 0) * 10) / 10;
    cumulativeSum += rain;
    const maxT = formatTempRaw(activeData.temperature_2m_max[i], tempUnit);
    const minT = formatTempRaw(activeData.temperature_2m_min[i], tempUnit);
    const meanT = Math.round(((maxT + minT) / 2) * 10) / 10;

    return {
      date: formatForecastDay(d),
      fullDate: d,
      maxTemp: maxT,
      minTemp: minT,
      meanTemp: meanT,
      rain,
      cumulativeRain: Math.round(cumulativeSum * 10) / 10,
      et0: Math.round((activeData.et0_fao_evapotranspiration?.[i] || 0) * 10) / 10
    };
  });

  // Handle custom date range fetch
  const handleFetchCustomArchive = async () => {
    setIsLoadingArchive(true);
    setArchiveError(null);
    try {
      const result = await fetchHistoricalArchive(location, customStart, customEnd);
      setCustomData(result);
    } catch (err) {
      setArchiveError('Failed to fetch historical archive data. Please check date range.');
    } finally {
      setIsLoadingArchive(false);
    }
  };

  const isStationObservation = activeData.dataType === 'STATION_ANALYSIS';

  return (
    <div className="space-y-6">
      {/* View Header & Period Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-600" />
            <span>{t('history.title', 'Historical Agrometeorological Records')}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {t('history.subtitle', 'Published meteorological history from physical station readings and calibrated reanalysis models')}
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          {[
            { id: '7d', label: t('history.last7Days', 'Last 7 Days (Station)') },
            { id: '14d', label: t('history.last14Days', 'Last 14 Days (Station)') },
            { id: '30d', label: t('history.last30Days', 'Last 30 Days (Reanalysis)') },
            { id: 'custom', label: t('history.customRange', 'Custom Range (Archive)') }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                period === item.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prominent Station Observations vs Reanalysis Estimates Identifier Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isStationObservation
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          : 'bg-blue-50/80 border-blue-200 text-blue-950'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
            isStationObservation ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
          }`}>
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isStationObservation
                  ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                  : 'bg-blue-200 text-blue-900 border border-blue-300'
              }`}>
                {isStationObservation ? t('history.groundStationObservations', 'Ground Station Observations') : t('history.reanalysisEstimates', 'Reanalysis Estimates')}
              </span>
              <strong className="text-xs sm:text-sm font-bold">
                {activeData.sourceLabel}
              </strong>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {activeData.sourceDescription}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 hidden sm:block text-[11px] text-slate-500 font-mono">
          {t('history.spatialResolution', 'Spatial Resolution: ~9 km Grid')}
        </div>
      </div>

      {/* Custom Date Range Picker Bar (if custom period selected) */}
      {period === 'custom' && (
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">{t('history.from', 'From:')}</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-700">{t('history.to', 'To:')}</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={handleFetchCustomArchive}
            disabled={isLoadingArchive}
            className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
          >
            {isLoadingArchive && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{t('history.queryArchive', 'Query Open-Meteo Archive')}</span>
          </button>

          {archiveError && (
            <span className="text-xs text-rose-600 font-medium">{archiveError}</span>
          )}
        </div>
      )}

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Cumulative Rain */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('history.totalRainfall', 'Total Rainfall')}</span>
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {formatRain(totalRainfall)}
          </p>
          <span className="text-[11px] text-slate-500">
            {t('history.across', 'Across')} {rainDaysCount} {t('history.rainDays', 'rain days')}
          </span>
        </div>

        {/* Highest Recorded Temp */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('history.peakHighTemp', 'Peak High Temp')}</span>
            <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-600">
            {highestRecordedTemp !== null ? formatTemp(highestRecordedTemp, tempUnit) : '--'}
          </p>
          <span className="text-[11px] text-slate-500">
            {t('history.recorded', 'Recorded:')} {highestDate}
          </span>
        </div>

        {/* Lowest Recorded Temp */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('history.lowestNightLow', 'Lowest Night Low')}</span>
            <TrendingDown className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-teal-700">
            {lowestRecordedTemp !== null ? formatTemp(lowestRecordedTemp, tempUnit) : '--'}
          </p>
          <span className="text-[11px] text-slate-500">
            {t('history.recorded', 'Recorded:')} {lowestDate}
          </span>
        </div>

        {/* Average High / Low */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('history.meanDailyTemp', 'Mean Daily Temp')}</span>
            <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900">
            {avgMaxTemp !== null ? formatTemp(avgMaxTemp, tempUnit) : '--'} / {avgMinTemp !== null ? formatTemp(avgMinTemp, tempUnit) : '--'}
          </p>
          <span className="text-[11px] text-slate-500">
            {t('history.avgHighLow', 'Avg High / Low')}
          </span>
        </div>

        {/* Data Source Quality Metric */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t('history.dataSource', 'Data Source')}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1 truncate">
            {isStationObservation ? 'Surface Stations' : 'ERA5-Land Grid'}
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {t('history.verifiedArchive', 'Verified Provider Archive')}
          </span>
        </div>
      </div>

      {/* Historical Temperature Range Chart */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ChartIcon className="w-4 h-4 text-emerald-600" />
              <span>{t('history.dailyTempRange', 'Historical Daily Maximum, Minimum & Mean Thermal Curves')}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {t('history.dailyTempSubtitle', 'Calibrated thermal records and baseline diurnal variations for the selected time window')}
            </p>
          </div>
          {avgMaxTemp !== null && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 self-start sm:self-auto">
              Period Mean: {((avgMaxTemp + avgMinTemp) / 2).toFixed(1)}°{tempUnit}
            </span>
          )}
        </div>

        <div className="h-64 sm:h-72 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#059669"
                fontSize={11}
                tickLine={false}
                unit={`°${tempUnit}`}
                domain={['dataMin - 3', 'dataMax + 3']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-white/10 text-xs space-y-1.5">
                        <p className="font-bold text-slate-200 border-b border-white/10 pb-1">{d.fullDate}</p>
                        <p className="text-rose-400 font-bold">Max Temperature: {d.maxTemp}°{tempUnit}</p>
                        <p className="text-teal-400 font-bold">Min Temperature: {d.minTemp}°{tempUnit}</p>
                        <p className="text-emerald-300 font-bold">Mean Temperature: {d.meanTemp}°{tempUnit}</p>
                        <p className="text-slate-300">Daily Diurnal Range: {(d.maxTemp - d.minTemp).toFixed(1)}°{tempUnit}</p>
                        <p className="text-blue-300">Measured Rainfall: {d.rain} mm</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10, fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="maxTemp"
                name={`Daily Max Temp (°${tempUnit})`}
                stroke="#e11d48"
                strokeWidth={2.8}
                dot={{ r: 3, fill: '#e11d48' }}
              />
              <Line
                type="monotone"
                dataKey="meanTemp"
                name={`Daily Mean Temp (°${tempUnit})`}
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="minTemp"
                name={`Daily Min Temp (°${tempUnit})`}
                stroke="#0d9488"
                strokeWidth={2.8}
                dot={{ r: 3, fill: '#0d9488' }}
              />
              {avgMaxTemp !== null && (
                <ReferenceLine
                  y={Math.round((avgMaxTemp + avgMinTemp) / 2)}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  label={{ value: 'Period Mean Baseline', fill: '#64748b', fontSize: 10 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Rainfall Bar & Cumulative Accumulation Chart */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span>{t('history.dailyPrecipEvents', 'Historical Daily Rainfall & Cumulative Accumulation')}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {t('history.dailyPrecipSubtitle', 'Measured daily precipitation depth (bars) alongside running total seasonal volume (line)')}
            </p>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
              Total Recorded: {formatRain(totalRainfall)} ({rainDaysCount} Rain Days)
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis yAxisId="rain" stroke="#2563eb" fontSize={11} tickLine={false} unit=" mm" domain={[0, 'auto']} />
              <YAxis yAxisId="cum" orientation="right" stroke="#0284c7" fontSize={11} tickLine={false} unit=" mm" domain={[0, 'auto']} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-white/10 text-xs space-y-1.5">
                        <p className="font-bold text-slate-200 border-b border-white/10 pb-1">{d.fullDate}</p>
                        <p className="text-blue-400 font-bold">Daily Precipitation: {d.rain} mm</p>
                        <p className="text-cyan-300 font-bold">Cumulative Rain to Date: {d.cumulativeRain} mm</p>
                        <p className="text-amber-400">Crop Water Loss (ET₀): {d.et0} mm/day</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10, fontSize: 11 }} />
              <Bar
                yAxisId="rain"
                dataKey="rain"
                name="Daily Rainfall (mm)"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="cum"
                type="monotone"
                dataKey="cumulativeRain"
                name="Cumulative Total (mm)"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0284c7' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Technical Methodology Note distinguishing Station Data vs Reanalysis */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center space-x-2 font-bold text-slate-900">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>{t('history.scientificMethodology', 'Scientific Methodology & Observation Source Definitions')}</span>
        </div>
        <p className="leading-relaxed">
          {t('history.methodologyStation', '1. Station Observations (Last 1–14 Days): Sourced from land surface stations managed by national meteorological services (WMO Global Observing System). Data points represent calibrated physical thermometer, rain gauge, and anemometer readings.')}
        </p>
        <p className="leading-relaxed">
          {t('history.methodologyReanalysis', '2. Reanalysis Estimates (ECMWF ERA5-Land Archive): Reanalysis blends historical surface station observations with satellite scatterometry and numerical physical conservation laws to fill spatial and temporal gaps on an equidistant 9 km grid.')}
        </p>
      </div>
    </div>
  );
}
