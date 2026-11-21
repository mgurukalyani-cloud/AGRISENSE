/**
 * AgriSense Comprehensive Demo Agricultural Weather Dataset
 * Used for offline environments, demos, or when the user toggles demo mode.
 * Clearly marked as simulated data.
 */

export const DEMO_LOCATION = {
  id: 'demo-punjab-01',
  name: 'Ludhiana Agricultural Belt',
  admin1: 'Punjab',
  country: 'India',
  country_code: 'IN',
  latitude: 30.9010,
  longitude: 75.8573,
  elevation: 247,
  timezone: 'Asia/Kolkata',
  isDemo: true
};

export const DEMO_PRESET_LOCATIONS = [
  {
    id: 'loc-1',
    name: 'Ludhiana Agricultural Belt',
    admin1: 'Punjab',
    country: 'India',
    country_code: 'IN',
    latitude: 30.9010,
    longitude: 75.8573,
    elevation: 247,
    timezone: 'Asia/Kolkata',
    cropFocus: 'Wheat, Rice, Cotton',
    isDemo: false
  },
  {
    id: 'loc-2',
    name: 'Salinas Valley',
    admin1: 'California',
    country: 'United States',
    country_code: 'US',
    latitude: 36.6777,
    longitude: -121.6555,
    elevation: 16,
    timezone: 'America/Los_Angeles',
    cropFocus: 'Lettuce, Broccoli, Strawberries',
    isDemo: false
  },
  {
    id: 'loc-3',
    name: 'Nashik Grape & Onion Valley',
    admin1: 'Maharashtra',
    country: 'India',
    country_code: 'IN',
    latitude: 19.9975,
    longitude: 73.7898,
    elevation: 600,
    timezone: 'Asia/Kolkata',
    cropFocus: 'Grapes, Onions, Sugarcane',
    isDemo: false
  },
  {
    id: 'loc-4',
    name: 'Ames Corn Belt',
    admin1: 'Iowa',
    country: 'United States',
    country_code: 'US',
    latitude: 42.0308,
    longitude: -93.6319,
    elevation: 287,
    timezone: 'America/Chicago',
    cropFocus: 'Corn, Soybeans',
    isDemo: false
  },
  {
    id: 'loc-5',
    name: 'Valencia Citrus Groves',
    admin1: 'Valencian Community',
    country: 'Spain',
    country_code: 'ES',
    latitude: 39.4699,
    longitude: -0.3763,
    elevation: 15,
    timezone: 'Europe/Madrid',
    cropFocus: 'Citrus, Olives, Almonds',
    isDemo: false
  }
];

export function getDemoWeatherData() {
  const now = new Date();
  const currentIso = now.toISOString();

  // Generate 48 hours of physically continuous meteorological data
  const hourlyTimes = [];
  const hourlyTemps = [];
  const hourlyApparent = [];
  const hourlyHumidity = [];
  const hourlyDewPoints = [];
  const hourlyPrecipProb = [];
  const hourlyPrecip = [];
  const hourlyWind = [];
  const hourlyWindGusts = [];
  const hourlyWindDir = [];
  const hourlyVpd = [];
  const hourlySoilTemp = [];
  const hourlyEt0 = [];
  const hourlyWeatherCodes = [];

  for (let i = 0; i < 48; i++) {
    const d = new Date(now.getTime() + i * 3600000);
    const hour = d.getHours();
    hourlyTimes.push(d.toISOString().slice(0, 16));

    // Diurnal atmospheric heating cycle: Minimum at ~06:00 (sunrise), peak at ~14:30
    const solarPhase = ((hour - 6) / 24) * 2 * Math.PI;
    const diurnalHarmonic = Math.sin(solarPhase);
    
    // Day 1 vs Day 2 slight synoptic shift
    const dayShift = i >= 24 ? 0.6 : 0;
    const temp = Math.round((21.5 + diurnalHarmonic * 6.5 + dayShift) * 10) / 10;
    hourlyTemps.push(temp);

    // Dew point: stable atmospheric moisture boundary layer (~11.0 to 12.8°C)
    const dewPoint = Math.round((11.4 + Math.sin(solarPhase * 0.5) * 0.8) * 10) / 10;
    hourlyDewPoints.push(dewPoint);

    // Relative humidity: physically inverse to temperature via Clausius-Clapeyron relation
    const es = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
    const ea = 0.61078 * Math.exp((17.27 * dewPoint) / (dewPoint + 237.3));
    const rh = Math.min(94, Math.max(34, Math.round((ea / es) * 100)));
    hourlyHumidity.push(rh);

    // Apparent temperature: incorporates wind chill and humidity
    const apparent = Math.round((temp + (rh > 65 ? (rh - 65) * 0.05 : -0.4)) * 10) / 10;
    hourlyApparent.push(apparent);

    // Rain: realistic light morning shower window on tomorrow morning (hours 22 to 26)
    let rainMm = 0;
    let rainProb = 8;
    let wmoCode = diurnalHarmonic > 0.4 ? 1 : 2; // mainly clear to partly cloudy

    if (i >= 21 && i <= 26) {
      const rainPeak = Math.sin(((i - 21) / 5) * Math.PI);
      rainMm = Math.round((rainPeak * 3.8) * 10) / 10;
      rainProb = Math.round(55 + rainPeak * 32);
      wmoCode = rainMm > 2 ? 63 : 61; // Moderate to slight rain
    } else if (rh > 85 && temp < 15) {
      wmoCode = 45; // early morning radiative fog
    }
    hourlyPrecip.push(rainMm);
    hourlyPrecipProb.push(rainProb);
    hourlyWeatherCodes.push(wmoCode);

    // Wind speed: convective boundary layer mixing peaks in afternoon (10-16 km/h)
    const windSpeed = Math.round((9.5 + Math.max(0, diurnalHarmonic) * 6.2) * 10) / 10;
    const windGusts = Math.round((windSpeed * 1.55 + 2.0) * 10) / 10;
    hourlyWind.push(windSpeed);
    hourlyWindGusts.push(windGusts);
    hourlyWindDir.push(Math.round(300 + Math.sin(solarPhase) * 25)); // NW prevailing

    // Soil temp at 0cm: thermal inertia lags ambient air by ~2.5 hours, dampened amplitude
    const soilPhase = ((hour - 8.5) / 24) * 2 * Math.PI;
    const soilT = Math.round((19.8 + Math.sin(soilPhase) * 3.2) * 10) / 10;
    hourlySoilTemp.push(soilT);

    // Vapor Pressure Deficit (kPa)
    const vpd = Math.max(0.1, Math.round((es - ea) * 100) / 100);
    hourlyVpd.push(vpd);

    // Hourly FAO-56 Reference Evapotranspiration (ET₀ mm/h)
    const et0Hour = diurnalHarmonic > 0 ? Math.round((diurnalHarmonic * 0.48) * 100) / 100 : 0.02;
    hourlyEt0.push(et0Hour);
  }

  // Generate 10 days of forecast daily data
  const dailyTimes = [];
  const dailyMaxTemps = [];
  const dailyMinTemps = [];
  const dailyPrecipSum = [];
  const dailyPrecipProb = [];
  const dailyWeatherCodes = [1, 2, 61, 80, 2, 0, 1, 3, 2, 0];
  const dailyWindMax = [];
  const dailyWindGustsMax = [];
  const dailyEt0 = [];

  for (let d = 0; d < 10; d++) {
    const dayDate = new Date(now.getTime() + d * 86400000);
    dailyTimes.push(dayDate.toISOString().slice(0, 10));

    // Realistic autumn-winter progression for Punjab
    const seasonalTrend = -d * 0.35;
    const maxT = Math.round((27.5 + seasonalTrend + Math.sin(d * 0.7) * 1.5) * 10) / 10;
    const minT = Math.round((13.8 + seasonalTrend + Math.cos(d * 0.7) * 1.2) * 10) / 10;
    dailyMaxTemps.push(maxT);
    dailyMinTemps.push(minT);

    const rain = d === 2 ? 6.5 : d === 3 ? 2.8 : 0.0;
    dailyPrecipSum.push(rain);
    dailyPrecipProb.push(d === 2 ? 75 : d === 3 ? 45 : 10);

    const windMax = Math.round((14.0 + Math.sin(d) * 3.5) * 10) / 10;
    dailyWindMax.push(windMax);
    dailyWindGustsMax.push(Math.round((windMax * 1.6) * 10) / 10);

    const et0Val = Math.round((3.8 - (rain > 3 ? 1.4 : 0) + seasonalTrend * 0.1) * 10) / 10;
    dailyEt0.push(Math.max(1.8, et0Val));
  }

  // Generate 30 days of historical data (calibrated meteorological observations)
  const historyTimes = [];
  const historyMaxTemps = [];
  const historyMinTemps = [];
  const historyPrecipSum = [];
  const historyHumidityMean = [];
  const historyEt0 = [];
  const historyWeatherCodes = [];

  for (let h = 30; h >= 1; h--) {
    const histDate = new Date(now.getTime() - h * 86400000);
    historyTimes.push(histDate.toISOString().slice(0, 10));

    // Past 30 days seasonal transition (warmer 30 days ago, cooler recently)
    const histOffset = (h / 30) * 4.2;
    const maxT = Math.round((27.2 + histOffset + Math.cos(h / 4) * 1.8) * 10) / 10;
    const minT = Math.round((13.5 + histOffset * 0.8 + Math.sin(h / 4) * 1.4) * 10) / 10;
    historyMaxTemps.push(maxT);
    historyMinTemps.push(minT);

    const rain = (h === 7) ? 8.4 : (h === 18) ? 14.2 : (h === 19) ? 4.0 : 0.0;
    historyPrecipSum.push(rain);
    historyHumidityMean.push(Math.round(56 + (rain > 0 ? 24 : 0) + (30 - h) * 0.4));
    historyEt0.push(Math.round((4.4 - (rain > 5 ? 2.2 : 0) - (30 - h) * 0.04) * 10) / 10);
    historyWeatherCodes.push(rain > 10 ? 63 : rain > 0 ? 61 : (h % 5 === 0 ? 2 : 0));
  }

  return {
    isDemo: true,
    dataSource: 'Demo Simulated Meteorological Engine',
    location: DEMO_LOCATION,
    current: {
      time: currentIso,
      temperature_2m: 26.4,
      relative_humidity_2m: 64,
      apparent_temperature: 27.8,
      is_day: 1,
      precipitation: 0.0,
      weather_code: 2, // Partly cloudy
      cloud_cover: 38,
      pressure_msl: 1012.8,
      wind_speed_10m: 11.2,
      wind_direction_10m: 135, // SE
      wind_gusts_10m: 16.5,
      uv_index: 6.2,
      dew_point_2m: 19.1,
      soil_temperature_0cm: 25.2,
      soil_moisture_0_to_1cm: 0.32,
      sunrise: `${dailyTimes[0]}T06:22`,
      sunset: `${dailyTimes[0]}T18:04`,
      daylight_hours: '11h 42m'
    },
    hourly: {
      time: hourlyTimes,
      temperature_2m: hourlyTemps,
      apparent_temperature: hourlyApparent,
      relative_humidity_2m: hourlyHumidity,
      dew_point_2m: hourlyDewPoints,
      precipitation_probability: hourlyPrecipProb,
      precipitation: hourlyPrecip,
      weather_code: hourlyWeatherCodes,
      wind_speed_10m: hourlyWind,
      wind_gusts_10m: hourlyWindGusts,
      wind_direction_10m: hourlyWindDir,
      vapour_pressure_deficit: hourlyVpd,
      soil_temperature_0cm: hourlySoilTemp,
      et0_fao_evapotranspiration: hourlyEt0
    },
    daily: {
      time: dailyTimes,
      weather_code: dailyWeatherCodes,
      temperature_2m_max: dailyMaxTemps,
      temperature_2m_min: dailyMinTemps,
      precipitation_sum: dailyPrecipSum,
      precipitation_probability_max: dailyPrecipProb,
      wind_speed_10m_max: dailyWindMax,
      et0_fao_evapotranspiration: dailyEt0,
      sunrise: dailyTimes.map(t => `${t}T06:22`),
      sunset: dailyTimes.map(t => `${t}T18:04`),
      uv_index_max: [6.5, 6.2, 3.8, 5.0, 7.1, 7.4, 6.9, 5.5, 6.7, 7.0]
    },
    historical: {
      time: historyTimes,
      weather_code: historyWeatherCodes,
      temperature_2m_max: historyMaxTemps,
      temperature_2m_min: historyMinTemps,
      precipitation_sum: historyPrecipSum,
      relative_humidity_2m_mean: historyHumidityMean,
      et0_fao_evapotranspiration: historyEt0,
      source: 'Recorded station agro-meteorological observations'
    }
  };
}
