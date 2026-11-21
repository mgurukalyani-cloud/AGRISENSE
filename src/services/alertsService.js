/**
 * AgriSense Agricultural Alerts & Early Warning Service
 * 
 * Aggregates real-time agro-meteorological advisories, pest & disease outbreak alerts,
 * mandi price surges, and central/state government scheme updates.
 */

export const ALERT_CATEGORIES = [
  { id: 'all', label: 'All Alerts (అన్ని హెచ్చరికలు / सभी अलर्ट)' },
  { id: 'weather', label: 'Weather Hazards (వాతావరణ ముప్పు / मौसम चेतावनी)' },
  { id: 'pest_disease', label: 'Pest & Disease Outbreaks (తెగుళ్ల ముప్పు / कीट एवं रोग)' },
  { id: 'market', label: 'Mandi Price Fluctuations (మార్కెట్ ధరలు / मंडी भाव)' },
  { id: 'schemes', label: 'Govt Schemes & MSP (ప్రభుత్వ పథకాలు / सरकारी योजनाएं)' }
];

export const STATIC_AGRICULTURAL_ALERTS = [
  {
    id: 'alert-pink-bollworm',
    category: 'pest_disease',
    severity: 'CRITICAL',
    title: 'Pink Bollworm (గులాబీ రంగు పురుగు) Warning in Cotton',
    date: '21 Nov 2026',
    applicableCrops: ['cotton'],
    states: ['Telangana', 'Andhra Pradesh', 'Maharashtra', 'Gujarat'],
    description: 'Pheromone trap catches exceed economic threshold level (ETL) of 8 moths/trap/night for 3 consecutive days in Warangal, Adilabad, and Yavatmal districts.',
    actionRequired: 'Install 5 pheromone traps per acre. Spray Profenofos 50 EC @ 2 ml/liter or Emamectin Benzoate 5 SG @ 0.4 g/liter. Avoid synthetic pyrethroid overdose to prevent resurgence.',
    source: 'Central Institute for Cotton Research (CICR) Pest Advisory'
  },
  {
    id: 'alert-yellow-rust',
    category: 'pest_disease',
    severity: 'WARNING',
    title: 'Yellow Rust (పసుపు కుంకుమ తెగులు) Vigilance in Wheat',
    date: '20 Nov 2026',
    applicableCrops: ['wheat'],
    states: ['Punjab', 'Haryana', 'Uttar Pradesh'],
    description: 'Recent night condensation and cool day temperatures (15-22°C) in sub-mountainous tracts favor stripe rust spore germination on susceptible wheat cultivars.',
    actionRequired: 'Inspect lower leaf canopies for yellow powdery linear stripes. On first appearance, spray Propiconazole 25 EC (Tilt) @ 1 ml/liter (200 ml in 200 liters water/acre).',
    source: 'Indian Institute of Wheat & Barley Research (IIWBR)'
  },
  {
    id: 'alert-chilli-thrips',
    category: 'pest_disease',
    severity: 'WARNING',
    title: 'Invasive Black Thrips (నల్ల తామర పురుగు) in Red Chilli',
    date: '19 Nov 2026',
    applicableCrops: ['chilli'],
    states: ['Andhra Pradesh', 'Telangana', 'Karnataka'],
    description: 'Reports of Thrips parvispinus infesting floral buds and tender foliage causing flower drop and upward leaf curling in Guntur, Khammam, and Prakasam belts.',
    actionRequired: 'Erect 20-25 blue and yellow sticky traps per acre at crop height. Spray Spinetoram 11.7 SC @ 1 ml/liter or Fipronil 5 SC @ 2 ml/liter during twilight hours.',
    source: 'Dr. YSR Horticultural University Advisory'
  },
  {
    id: 'alert-market-chilli-surge',
    category: 'market',
    severity: 'OPPORTUNITY',
    title: 'Teja Red Chilli Modal Price Surges +₹600/q in Guntur Yard',
    date: '21 Nov 2026',
    applicableCrops: ['chilli'],
    states: ['Andhra Pradesh', 'Telangana'],
    description: 'Strong export bidding for deep red premium grades pushed modal rates to ₹19,800/quintal today with 860 tons market arrivals.',
    actionRequired: 'Farmers with well-cured, dried stocks (>10% moisture) can realize top price tiers by grading pods into Deluxe stemless lots before dispatch.',
    source: 'Guntur APMC Mirchi Yard Daily Bulletin'
  },
  {
    id: 'alert-pm-kisan',
    category: 'schemes',
    severity: 'INFO',
    title: 'PM-KISAN 19th Installment Direct Benefit Transfer Notice',
    date: '18 Nov 2026',
    applicableCrops: ['all'],
    states: ['All States'],
    description: 'e-KYC verification and Aadhaar-seeded bank account status check mandatory for eligible landholding farmer families to receive the upcoming ₹2,000 DBT credit.',
    actionRequired: 'Verify your Aadhaar-bank link status on pmkisan.gov.in or visit the nearest Common Service Center (CSC) with your biometrics.',
    source: 'Ministry of Agriculture & Farmers Welfare, GoI'
  },
  {
    id: 'alert-pmfby-cutoff',
    category: 'schemes',
    severity: 'IMPORTANT',
    title: 'PMFBY Rabi 2026-27 Crop Insurance Enrolment Window Open',
    date: '16 Nov 2026',
    applicableCrops: ['wheat', 'mustard', 'gram_chickpea'],
    states: ['All States'],
    description: 'Farmers cultivating notify crops can insure against localized natural calamities, mid-season adversity, and post-harvest losses at only 1.5% premium for Rabi crops.',
    actionRequired: 'Enroll via the National Crop Insurance Portal (ncip.gov.in), Primary Agricultural Credit Societies (PACS), or scheduled commercial bank branches before 31st December.',
    source: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)'
  }
];

/**
 * Generate active alert feed combined with live meteorological triggers
 */
export function getAgriculturalAlerts({ weatherData, farmerCrops = [], farmerState = 'Telangana' }) {
  const dynamicWeatherAlerts = [];

  if (weatherData?.current) {
    const temp = weatherData.current.temperature_2m || 25;
    const wind = weatherData.current.wind_speed_10m || 10;
    const rainSum = weatherData.daily?.precipitation_sum?.[0] || 0;
    const code = weatherData.current.weather_code;

    if (rainSum >= 20 || code >= 63) {
      dynamicWeatherAlerts.push({
        id: 'weather-rain-heavy',
        category: 'weather',
        severity: 'CRITICAL',
        title: `Heavy Rain Alert (${rainSum} mm Expected Today)`,
        date: 'Today',
        applicableCrops: ['all'],
        states: [farmerState],
        description: `Widespread precipitation will saturate fields in ${farmerState}. Standing water can cause root asphyxiation in cotton and pulses.`,
        actionRequired: 'Clear field drainage trenches immediately. Suspend all chemical spraying, fertilizer broadcasting, and transplanting operations.',
        source: 'India Meteorological Department (IMD) Station Bulletin'
      });
    }

    if (temp >= 36) {
      dynamicWeatherAlerts.push({
        id: 'weather-heat-stress',
        category: 'weather',
        severity: 'WARNING',
        title: `High Temperature & Heat Stress Warning (${temp}°C)`,
        date: 'Today',
        applicableCrops: ['all'],
        states: [farmerState],
        description: 'Atmospheric vapor pressure deficit (VPD) is elevated. Crops are at risk of pollen desiccation and accelerated evapotranspiration.',
        actionRequired: 'Provide light and frequent micro-irrigation during early morning or late evening. Maintain organic mulch on fruit orchards.',
        source: 'Agro-Meteorological Advisory Service'
      });
    }

    if (wind >= 28) {
      dynamicWeatherAlerts.push({
        id: 'weather-high-wind',
        category: 'weather',
        severity: 'WARNING',
        title: `Strong Gusty Winds (${wind} km/h) Detected`,
        date: 'Today',
        applicableCrops: ['sugarcane', 'maize', 'banana'],
        states: [farmerState],
        description: 'High wind velocity poses mechanical lodging danger to tall standing crops and causes severe drift during knapsack pesticide applications.',
        actionRequired: 'Postpone all chemical spraying. Provide earthing up and propping to sugarcane and banana plants.',
        source: 'Surface Anemometer Station'
      });
    }
  }

  // Combine dynamic weather alerts with curated pest and market alerts
  const combined = [...dynamicWeatherAlerts, ...STATIC_AGRICULTURAL_ALERTS];

  // If farmer has specified crops, prioritize them
  if (farmerCrops && farmerCrops.length > 0) {
    return combined.sort((a, b) => {
      const aMatch = a.applicableCrops.includes('all') || a.applicableCrops.some(c => farmerCrops.includes(c));
      const bMatch = b.applicableCrops.includes('all') || b.applicableCrops.some(c => farmerCrops.includes(c));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  return combined;
}
