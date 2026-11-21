/**
 * AgriSense Weather Utility Functions
 * Handles WMO code interpretation, unit conversions, and agricultural metrics.
 */

export const WMO_CODES = {
  0: { label: 'Clear Sky', icon: 'Sun', theme: 'sunny', agriNotes: 'Optimal solar radiation for photosynthesis and crop drying.' },
  1: { label: 'Mainly Clear', icon: 'SunMedium', theme: 'sunny', agriNotes: 'Favorable field work conditions with mild solar intensity.' },
  2: { label: 'Partly Cloudy', icon: 'CloudSun', theme: 'partly_cloudy', agriNotes: 'Balanced transpiration conditions; minimal heat stress.' },
  3: { label: 'Overcast', icon: 'Cloud', theme: 'cloudy', agriNotes: 'Reduced solar radiation; slow crop drying; stable humidity.' },
  45: { label: 'Foggy', icon: 'CloudFog', theme: 'foggy', agriNotes: 'High leaf wetness; increased spore germination risk.' },
  48: { label: 'Depositing Rime Fog', icon: 'CloudFog', theme: 'foggy', agriNotes: 'Prolonged canopy wetness; delay chemical applications.' },
  51: { label: 'Light Drizzle', icon: 'CloudDrizzle', theme: 'rainy', agriNotes: 'Light foliar moisture; avoid foliar spray wash-off.' },
  53: { label: 'Moderate Drizzle', icon: 'CloudDrizzle', theme: 'rainy', agriNotes: 'Continuous leaf dampness; fungal risk moderate.' },
  55: { label: 'Dense Drizzle', icon: 'CloudDrizzle', theme: 'rainy', agriNotes: 'Postpone spraying; light soil surface moistening.' },
  56: { label: 'Freezing Light Drizzle', icon: 'CloudSnow', theme: 'snowy', agriNotes: 'Risk of ice crusting on plant stems and orchard branches.' },
  57: { label: 'Dense Freezing Drizzle', icon: 'CloudSnow', theme: 'snowy', agriNotes: 'Severe freezing hazard; frost protection advised.' },
  61: { label: 'Slight Rain', icon: 'CloudRain', theme: 'rainy', agriNotes: 'Replenishing topsoil; reduces immediate irrigation necessity.' },
  63: { label: 'Moderate Rain', icon: 'CloudRain', theme: 'rainy', agriNotes: 'Effective soil moisture recharge; delay planned irrigation.' },
  65: { label: 'Heavy Rain', icon: 'CloudRain', theme: 'rainy', agriNotes: 'Soil runoff and erosion risk; avoid heavy machinery in fields.' },
  66: { label: 'Light Freezing Rain', icon: 'CloudSnow', theme: 'snowy', agriNotes: 'Tissue damage risk on tender horticultural foliage.' },
  67: { label: 'Heavy Freezing Rain', icon: 'CloudSnow', theme: 'snowy', agriNotes: 'Severe ice accumulation risk; inspect greenhouse structures.' },
  71: { label: 'Slight Snow Fall', icon: 'CloudSnow', theme: 'snowy', agriNotes: 'Provides soil insulation; protect sensitive seedlings.' },
  73: { label: 'Moderate Snow Fall', icon: 'CloudSnow', theme: 'snowy', agriNotes: 'Insulating snowpack; low evaporation.' },
  75: { label: 'Heavy Snow Fall', icon: 'CloudSnow', theme: 'snowy', agriNotes: 'Structural load risk on polytunnels and polyhouses.' },
  77: { label: 'Snow Grains', icon: 'CloudSnow', theme: 'snowy', agriNotes: 'Sub-zero temperatures; dormant period for seasonal crops.' },
  80: { label: 'Slight Rain Showers', icon: 'CloudRain', theme: 'rainy', agriNotes: 'Intermittent moisture; pause harvesting and grain drying.' },
  81: { label: 'Moderate Rain Showers', icon: 'CloudRain', theme: 'rainy', agriNotes: 'Delay fertilizer side-dressing to prevent leaching.' },
  82: { label: 'Violent Rain Showers', icon: 'CloudRain', theme: 'rainy', agriNotes: 'High soil compaction risk; check drainage culverts.' },
  85: { label: 'Slight Snow Showers', icon: 'CloudSnow', theme: 'snowy', agriNotes: 'Cold front passing; protect nursery stocks.' },
  86: { label: 'Heavy Snow Showers', icon: 'CloudSnow', theme: 'snowy', agriNotes: 'Freezing hazard for winter vegetables.' },
  95: { label: 'Thunderstorm', icon: 'CloudLightning', theme: 'stormy', agriNotes: 'High wind and lightning danger; cease field machinery operations.' },
  96: { label: 'Thunderstorm with Slight Hail', icon: 'CloudHail', theme: 'stormy', agriNotes: 'Hail damage danger to fruit trees and broadleaf canopies.' },
  99: { label: 'Thunderstorm with Heavy Hail', icon: 'CloudHail', theme: 'stormy', agriNotes: 'Severe crop bruising and lodging threat; deploy hail netting if available.' },
};

export function getWmoInfo(code) {
  return WMO_CODES[code] || {
    label: 'Variable Conditions',
    icon: 'Cloud',
    theme: 'cloudy',
    agriNotes: 'Monitor local canopy microclimate closely.',
  };
}

/**
 * Format temperatures based on user unit preference
 */
export function formatTemp(celsius, unit = 'C') {
  if (celsius === null || celsius === undefined || isNaN(celsius)) return '--';
  if (unit === 'F') {
    const f = (celsius * 9) / 5 + 32;
    return `${Math.round(f)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function formatTempRaw(celsius, unit = 'C') {
  if (celsius === null || celsius === undefined || isNaN(celsius)) return 0;
  if (unit === 'F') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

/**
 * Format wind speed
 */
export function formatWind(kmh, unit = 'metric') {
  if (kmh === null || kmh === undefined || isNaN(kmh)) return '--';
  if (unit === 'imperial') {
    const mph = kmh * 0.621371;
    return `${mph.toFixed(1)} mph`;
  }
  return `${kmh.toFixed(1)} km/h`;
}

/**
 * Format rainfall / precipitation
 */
export function formatRain(mm, unit = 'metric') {
  if (mm === null || mm === undefined || isNaN(mm)) return '--';
  if (unit === 'imperial') {
    const inches = mm * 0.0393701;
    return `${inches.toFixed(2)} in`;
  }
  return `${mm.toFixed(1)} mm`;
}

/**
 * Convert degree wind direction (0-360) into compass direction (N, NE, E...)
 */
export function getWindCompass(degrees) {
  if (degrees === null || degrees === undefined) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return directions[index];
}

/**
 * Format time from ISO string (e.g. 2026-10-16T14:00)
 */
export function formatHourTime(isoString) {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return isoString.split('T')[1] || isoString;
  }
}

/**
 * Format concise timeline label for chart axis (e.g. "3 PM", "Tom 6 AM")
 */
export function formatHourTimeline(isoString) {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
    const isTomorrow = d.getDate() === (new Date(now.getTime() + 86400000).getDate()) && d.getMonth() === now.getMonth();
    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    if (isToday) return timeStr;
    if (isTomorrow) return `+1d ${timeStr}`;
    return d.toLocaleDateString([], { weekday: 'short' }) + ` ${timeStr}`;
  } catch {
    return formatHourTime(isoString);
  }
}

/**
 * Format short day for forecast cards (e.g. "Fri, Oct 16" or "Today")
 */
export function formatForecastDay(isoDate, isToday = false) {
  if (isToday) return 'Today';
  try {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return isoDate;
  }
}

/**
 * Format day of week
 */
export function getDayOfWeek(isoDate) {
  try {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString([], { weekday: 'long' });
  } catch {
    return isoDate;
  }
}

/**
 * Calculate Vapor Pressure Deficit (VPD in kPa)
 * Crucial agricultural metric for plant transpiration stress
 */
export function calculateVpd(tempC, humidityPct) {
  if (tempC === null || humidityPct === null || isNaN(tempC) || isNaN(humidityPct)) return null;
  // Saturated vapor pressure (es) in kPa using Tetens equation
  const es = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  // Actual vapor pressure (ea)
  const ea = es * (humidityPct / 100);
  const vpd = es - ea;
  return Math.max(0, Math.round(vpd * 100) / 100);
}

/**
 * Categorize VPD for agriculture
 */
export function getVpdCategory(vpd) {
  if (vpd === null) return { level: 'Normal', desc: 'VPD within standard range', color: 'text-slate-600' };
  if (vpd < 0.4) {
    return { level: 'Low (High Humidity)', desc: 'Stagnant transpiration; fungal sporulation risk high.', color: 'text-blue-600' };
  } else if (vpd <= 1.2) {
    return { level: 'Optimal Transpiration', desc: 'Ideal stomatal opening & nutrient transport.', color: 'text-emerald-600' };
  } else if (vpd <= 1.6) {
    return { level: 'Moderate Water Demand', desc: 'Increased crop water uptake; ensure adequate soil water.', color: 'text-amber-600' };
  } else {
    return { level: 'High Atmospheric Stress', desc: 'Stomatal closure likely; extreme wilting risk.', color: 'text-rose-600' };
  }
}

/**
 * Categorize UV Index
 */
export function getUvCategory(uv) {
  if (uv === null || uv === undefined) return { label: 'N/A', color: 'text-slate-500', bg: 'bg-slate-100' };
  if (uv < 3) return { label: 'Low', color: 'text-emerald-700', bg: 'bg-emerald-100' };
  if (uv < 6) return { label: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-100' };
  if (uv < 8) return { label: 'High', color: 'text-orange-700', bg: 'bg-orange-100' };
  if (uv < 11) return { label: 'Very High', color: 'text-rose-700', bg: 'bg-rose-100' };
  return { label: 'Extreme', color: 'text-purple-700', bg: 'bg-purple-100' };
}
