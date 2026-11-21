/**
 * AgriSense Soil Health & Fertilizer Intelligence Service
 * 
 * Compliant with Indian Council of Agricultural Research (ICAR) & 
 * National Soil Health Card (SHC) Ministry of Agriculture standards.
 */

export const SOIL_TYPES_DETAILED = [
  {
    id: 'alluvial_loam',
    name: 'Alluvial Loam Soil (జలమట్టి / जलोढ़ मिट्टी)',
    description: 'Found across Indo-Gangetic plains, delta regions of Krishna-Godavari. Highly fertile with balanced silt, sand and clay.',
    defaultPh: 7.2,
    defaultN: 'Medium (310 kg/ha)',
    defaultP: 'Medium (18 kg/ha)',
    defaultK: 'High (320 kg/ha)',
    defaultOC: '0.65%',
    drainage: 'Good',
    waterHolding: 'High',
    bestCrops: ['wheat', 'paddy_rice', 'sugarcane', 'mustard', 'maize', 'potato']
  },
  {
    id: 'black_soil',
    name: 'Black Cotton Soil / Regur (నల్లరేగడి మట్టి / काली मिट्टी)',
    description: 'Deep basaltic clay soils dominant in Deccan plateau (Maharashtra, Telangana, MP, Gujarat). Highly expansive and moisture-retentive.',
    defaultPh: 7.8,
    defaultN: 'Low (220 kg/ha)',
    defaultP: 'Medium (16 kg/ha)',
    defaultK: 'High (380 kg/ha)',
    defaultOC: '0.55%',
    drainage: 'Slow / Poor during monsoons',
    waterHolding: 'Very High',
    bestCrops: ['cotton', 'soybean', 'gram_chickpea', 'pigeonpea_redgram', 'wheat', 'chilli']
  },
  {
    id: 'red_soil',
    name: 'Red Lateritic Soil (ఎర్ర నేలలు / लाल मिट्टी)',
    description: 'Rich in ferric oxides; light textured, porous and non-retentive of water. Common in Andhra Pradesh, Telangana, Karnataka, Tamil Nadu.',
    defaultPh: 6.2,
    defaultN: 'Low (190 kg/ha)',
    defaultP: 'Low (9 kg/ha)',
    defaultK: 'Medium (160 kg/ha)',
    defaultOC: '0.40%',
    drainage: 'Excessive / Fast',
    waterHolding: 'Low',
    bestCrops: ['groundnut', 'pearl_millet', 'chilli', 'tomato', 'pigeonpea_redgram', 'maize']
  },
  {
    id: 'sandy_loam',
    name: 'Sandy Loam Soil (ఇసుక నేలలు / बलुई दोमट)',
    description: 'Easily workable, rapid warming in spring, well-aerated. Ideal for root and tuber crops under micro-irrigation.',
    defaultPh: 6.8,
    defaultN: 'Low (180 kg/ha)',
    defaultP: 'Medium (15 kg/ha)',
    defaultK: 'Low (110 kg/ha)',
    defaultOC: '0.35%',
    drainage: 'Rapid',
    waterHolding: 'Low to Moderate',
    bestCrops: ['potato', 'groundnut', 'onion', 'pearl_millet', 'mustard']
  },
  {
    id: 'clay_loam',
    name: 'Clay Loam Soil (బంకమట్టి నేలలు / चिकनी दोमट)',
    description: 'Heavy texture with substantial clay content. Retains fertilizers and moisture for long durations; suited for wetland crops.',
    defaultPh: 7.4,
    defaultN: 'Medium (290 kg/ha)',
    defaultP: 'Medium (17 kg/ha)',
    defaultK: 'High (310 kg/ha)',
    defaultOC: '0.70%',
    drainage: 'Moderate to Slow',
    waterHolding: 'High',
    bestCrops: ['paddy_rice', 'wheat', 'sugarcane', 'gram_chickpea']
  },
  {
    id: 'laterite_soil',
    name: 'Laterite Soil (లాటరైట్ నేలలు / लैटेराइट मिट्टी)',
    description: 'Formed under high temperature and intense monsoon leaching. Low in lime, magnesium, and nitrogen; moderately acidic.',
    defaultPh: 5.4,
    defaultN: 'Very Low (140 kg/ha)',
    defaultP: 'Low (7 kg/ha)',
    defaultK: 'Low (95 kg/ha)',
    defaultOC: '0.45%',
    drainage: 'Free-draining',
    waterHolding: 'Low',
    bestCrops: ['groundnut', 'pearl_millet', 'chilli']
  }
];

export const NUTRIENT_DEFICIENCIES = [
  {
    nutrient: 'Nitrogen (N) Deficiency',
    symptoms: 'Older (lower) leaves show uniform pale yellowing (chlorosis) progressing from leaf tip backward in a V-shape. Stunted crop stature and thin stems.',
    photoUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80',
    affectedCrops: ['paddy_rice', 'wheat', 'maize', 'sugarcane'],
    correctiveAction: 'Top dress with 20-25 kg Urea/acre, or spray 2% Urea solution (20g Urea in 1 liter water) for immediate leaf absorption.',
    organicRemedy: 'Apply well-decomposed Farmyard Manure (FYM @ 5 tons/acre) or spray Jeevamrutha / vermiwash.'
  },
  {
    nutrient: 'Phosphorus (P) Deficiency',
    symptoms: 'Leaves exhibit dark bluish-green hue with purplish or bronze pigmentation along edges and stems. Poor root establishment and delayed flowering.',
    photoUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=80',
    affectedCrops: ['wheat', 'gram_chickpea', 'tomato', 'maize'],
    correctiveAction: 'Incorporate Single Super Phosphate (SSP @ 50 kg/acre) or DAP as basal placement near the root zone.',
    organicRemedy: 'Apply Phosphate Solubilizing Bacteria (PSB biofertilizer @ 2 kg/acre) mixed with 100 kg compost; incorporate rock phosphate.'
  },
  {
    nutrient: 'Potassium (K) Deficiency',
    symptoms: 'Marginal leaf scorch or firing on older leaves; leaf tips and borders turn brown and dry as if scorched by flame. Lodging susceptibility increases.',
    photoUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    affectedCrops: ['cotton', 'paddy_rice', 'potato', 'chilli', 'sugarcane'],
    correctiveAction: 'Apply Muriate of Potash (MOP 60% K2O @ 25 kg/acre) or foliar spray of Potassium Nitrate (13-0-45 @ 10g/liter).',
    organicRemedy: 'Incorporate wood ash (rich in potash), banana pseudo-stem compost, or vermicompost.'
  },
  {
    nutrient: 'Zinc (Zn) Micronutrient Deficiency',
    symptoms: 'Known as "Khaira" disease in rice: rusty brown spots appearing on third leaf; "Little Leaf" and bleached white bands in maize and chilli.',
    photoUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
    affectedCrops: ['paddy_rice', 'maize', 'wheat', 'chilli', 'cotton'],
    correctiveAction: 'Foliar spray of 0.5% Zinc Sulphate (5g ZnSO4 + 2.5g slaked lime per liter water) twice at 15-day intervals.',
    organicRemedy: 'Soil application of enriched zinc-compost (Zinc Sulphate 10 kg mixed with 200 kg FYM fermented for 1 month).'
  },
  {
    nutrient: 'Iron (Fe) & Boron Micronutrient Deficiency',
    symptoms: 'Interveinal chlorosis on the youngest (top) leaves turning paper-white; Boron deficiency causes hollow heart in potato and fruit cracking in tomato.',
    photoUrl: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=600&q=80',
    affectedCrops: ['groundnut', 'tomato', 'potato', 'mustard'],
    correctiveAction: 'Foliar spray of Ferrous Sulphate (0.5% FeSO4) with citric acid; spray Borax / Solubor (1g/liter) at pre-flowering.',
    organicRemedy: 'Apply green manure crops (Sunhemp / Dhaincha) to lower soil pH in alkaline soils and unlock native micronutrients.'
  }
];

/**
 * Calculate overall soil health score (0-100) and limiting factors
 */
export function calculateSoilHealthScore(soil) {
  let score = 85;
  const limitingFactors = [];
  const suggestions = [];

  // 1. pH evaluation
  const ph = parseFloat(soil.ph) || 7.0;
  if (ph < 5.5) {
    score -= 15;
    limitingFactors.push('Strongly acidic soil (pH < 5.5): restricts Phosphorus and Molybdenum uptake; causes Aluminum toxicity.');
    suggestions.push('Apply Agricultural Grade Lime or Dolomite (@ 300 - 500 kg/acre) during pre-monsoon field preparation.');
  } else if (ph > 8.2) {
    score -= 14;
    limitingFactors.push('Alkaline/Calcareous soil (pH > 8.2): ties up Phosphorus, Zinc, and Iron into insoluble forms.');
    suggestions.push('Incorporate Agricultural Gypsum (@ 400 kg/acre) or cultivate Dhaincha green manure before transplanting.');
  } else if (ph >= 6.5 && ph <= 7.5) {
    score += 5; // Optimal pH
  }

  // 2. Nitrogen status
  const nVal = parseFloat(soil.nitrogen) || 240;
  if (nVal < 200) {
    score -= 10;
    limitingFactors.push('Low available Nitrogen (< 200 kg/ha): will depress tillering and vegetative growth.');
    suggestions.push('Increase basal organic manure and inoculate seed with Azotobacter / Rhizobium cultures.');
  }

  // 3. Phosphorus status
  const pVal = parseFloat(soil.phosphorus) || 16;
  if (pVal < 10) {
    score -= 10;
    limitingFactors.push('Low available Phosphorus (< 10 kg/ha): will compromise root development and tillering.');
    suggestions.push('Band place Single Super Phosphate (SSP) at root depth rather than broadcasting.');
  }

  // 4. Potassium status
  const kVal = parseFloat(soil.potassium) || 220;
  if (kVal < 120) {
    score -= 8;
    limitingFactors.push('Low Potassium (< 120 kg/ha): reduces crop disease resistance and drought tolerance.');
    suggestions.push('Apply MOP in split doses rather than full basal application on light soils.');
  }

  // 5. Organic Carbon (OC %)
  const ocVal = parseFloat(soil.organicCarbon) || 0.55;
  if (ocVal < 0.40) {
    score -= 12;
    limitingFactors.push('Critically low Organic Carbon (< 0.40%): poor biological activity and low water holding capacity.');
    suggestions.push('Apply 5-8 tons of Farmyard Manure (FYM) or 2 tons Vermicompost per acre annually.');
  } else if (ocVal >= 0.75) {
    score += 5;
  }

  // 6. Electrical Conductivity (EC)
  const ecVal = parseFloat(soil.ec) || 0.45;
  if (ecVal > 1.5) {
    score -= 15;
    limitingFactors.push('Salinity risk: Electrical conductivity exceeds 1.5 dS/m, risking osmotic root burn.');
    suggestions.push('Ensure proper subsurface drainage and flush salts with low-salinity canal irrigation.');
  }

  const finalScore = Math.max(30, Math.min(98, score));
  let rating = 'Good';
  if (finalScore >= 80) rating = 'Excellent';
  else if (finalScore >= 65) rating = 'Satisfactory';
  else rating = 'Needs Soil Conditioning';

  return {
    score: finalScore,
    rating,
    limitingFactors,
    suggestions
  };
}

/**
 * Fertilizer Dosage Calculator considering Crop, Soil Test adjustments, and Growth Stage Schedule
 */
export function calculateFertilizerSchedule(cropId, acreage = 1, soil = {}) {
  // Crop Recommended Dose of Fertilizers (RDF in kg N:P2O5:K2O per acre)
  const CROP_RDF = {
    wheat: { n: 50, p: 25, k: 15, sspPreferred: false, zincRequired: true },
    paddy_rice: { n: 45, p: 22, k: 22, sspPreferred: false, zincRequired: true },
    cotton: { n: 60, p: 30, k: 30, sspPreferred: true, zincRequired: true },
    chilli: { n: 70, p: 35, k: 35, sspPreferred: true, zincRequired: true },
    mustard: { n: 35, p: 18, k: 10, sspPreferred: true, zincRequired: false }, // mustard loves sulphur in SSP
    gram_chickpea: { n: 10, p: 20, k: 10, sspPreferred: true, zincRequired: false }, // legume fixes own N
    maize: { n: 55, p: 25, k: 20, sspPreferred: false, zincRequired: true },
    soybean: { n: 12, p: 25, k: 15, sspPreferred: true, zincRequired: false },
    groundnut: { n: 10, p: 20, k: 20, sspPreferred: true, zincRequired: true },
    onion: { n: 40, p: 20, k: 30, sspPreferred: true, zincRequired: false },
    tomato: { n: 60, p: 30, k: 30, sspPreferred: false, zincRequired: true },
    potato: { n: 70, p: 40, k: 50, sspPreferred: false, zincRequired: false },
    pigeonpea_redgram: { n: 10, p: 20, k: 10, sspPreferred: true, zincRequired: false },
    green_gram: { n: 8, p: 18, k: 8, sspPreferred: true, zincRequired: false },
    pearl_millet: { n: 35, p: 18, k: 12, sspPreferred: false, zincRequired: false },
    sugarcane: { n: 100, p: 45, k: 45, sspPreferred: false, zincRequired: true }
  };

  const rdf = CROP_RDF[cropId] || CROP_RDF['wheat'];
  const acres = Math.max(0.25, parseFloat(acreage) || 1);

  // Soil test modifiers: Adjust NPK based on test levels
  let nAdj = 1.0;
  let pAdj = 1.0;
  let kAdj = 1.0;

  const nVal = parseFloat(soil.nitrogen) || 240;
  const pVal = parseFloat(soil.phosphorus) || 16;
  const kVal = parseFloat(soil.potassium) || 220;

  if (nVal < 200) nAdj = 1.25; // 25% increase for low soil N
  else if (nVal > 400) nAdj = 0.80; // 20% reduction for high soil N

  if (pVal < 10) pAdj = 1.25;
  else if (pVal > 25) pAdj = 0.75;

  if (kVal < 120) kAdj = 1.25;
  else if (kVal > 300) kAdj = 0.75;

  const totalN = Math.round(rdf.n * acres * nAdj);
  const totalP = Math.round(rdf.p * acres * pAdj);
  const totalK = Math.round(rdf.k * acres * kAdj);

  // Conversion to Commercial Fertilizer Bags
  // DAP = 18% N, 46% P2O5 (50 kg bag provides 9 kg N and 23 kg P)
  const dapBags = Math.max(1, Math.round((totalP / 23) * 10) / 10);
  const nSuppliedByDap = dapBags * 9;
  const remainingN = Math.max(0, totalN - nSuppliedByDap);

  // Urea = 46% N (45 kg bag provides 20.7 kg N)
  const ureaBags = Math.max(1, Math.round((remainingN / 20.7) * 10) / 10);

  // MOP = 60% K2O (50 kg bag provides 30 kg K2O)
  const mopBags = Math.max(0.5, Math.round((totalK / 30) * 10) / 10);

  // Micronutrients
  const zincKg = rdf.zincRequired ? Math.round(10 * acres) : 0;

  // Split Application Timetable
  const splits = [
    {
      stage: 'Basal Dose (During Final Land Prep & Sowing)',
      timing: 'Day 0 (At sowing / transplanting)',
      ureaPct: '33% (1/3rd of total Urea)',
      dapPct: '100% of DAP (Full dose placed at root zone)',
      mopPct: '50% of MOP',
      micronutrients: zincKg > 0 ? `${zincKg} kg Zinc Sulphate (21%) broadcasted` : 'None',
      instructions: 'Incorporate DAP and potash deeply (5-7 cm) before seed placement. Never mix Zinc Sulphate directly with DAP in the same hopper.'
    },
    {
      stage: '1st Top Dressing (Active Vegetative / Tillering Stage)',
      timing: '21 - 30 days after sowing',
      ureaPct: '33% (1/3rd of total Urea)',
      dapPct: 'None',
      mopPct: 'None',
      micronutrients: 'Foliar micro-nutrient spray if deficiency spotted',
      instructions: 'Broadcast Urea after weeding and when soil has optimal moisture. Do not apply just before heavy rains.'
    },
    {
      stage: '2nd Top Dressing (Panicle Initiation / Pre-Flowering)',
      timing: '50 - 65 days after sowing',
      ureaPct: '33% (Final 1/3rd of Urea)',
      dapPct: 'None',
      mopPct: 'Remaining 50% of MOP',
      micronutrients: 'None',
      instructions: 'Apply before booting/flowering stage. Adequate potash during grain filling ensures bold, lustrous grains and prevents lodging.'
    }
  ];

  return {
    cropId,
    acres,
    totalN,
    totalP,
    totalK,
    fertilizerBags: {
      urea: {
        bags: ureaBags,
        bagWeight: '45 kg',
        totalKg: Math.round(ureaBags * 45),
        subsidyNote: 'Statutory subsidized rate (~₹266 per 45 kg bag)'
      },
      dap: {
        bags: dapBags,
        bagWeight: '50 kg',
        totalKg: Math.round(dapBags * 50),
        subsidyNote: 'NBS subsidized rate (~₹1,350 per 50 kg bag)'
      },
      mop: {
        bags: mopBags,
        bagWeight: '50 kg',
        totalKg: Math.round(mopBags * 50),
        subsidyNote: 'Potash subsidy (~₹1,650 per 50 kg bag)'
      },
      zincSulphateKg: zincKg
    },
    splits,
    estimatedCost: Math.round((ureaBags * 266) + (dapBags * 1350) + (mopBags * 1650) + (zincKg * 45))
  };
}

/**
 * Organic Soil Improvement Recommendations
 */
export function getOrganicSoilRemedies(soil, acres = 1) {
  const farmArea = Math.max(0.5, parseFloat(acres) || 1);
  const oc = parseFloat(soil.organicCarbon) || 0.55;
  const fymMin = oc < 0.5 ? Math.round(5 * farmArea) : Math.round(4 * farmArea);
  const fymMax = oc < 0.5 ? Math.round(8 * farmArea) : Math.round(6 * farmArea);

  return [
    {
      title: 'Farmyard Manure (FYM) or Well-Rotted Compost',
      quantity: `${fymMin} to ${fymMax} Tons (${oc < 0.5 ? 'Heavy dose recommended for low organic carbon' : 'Maintenance dose'})`,
      applicationTiming: '3-4 weeks prior to sowing during summer ploughing',
      benefit: 'Replenishes soil organic carbon, enhances beneficial soil microflora, and improves moisture retention in root zone by 25-35%.'
    },
    {
      title: 'Vermicompost (Earthworm Castings)',
      quantity: `${Math.round(1.5 * farmArea)} to ${Math.round(2 * farmArea)} Tons`,
      applicationTiming: 'At sowing or root zone placement near planting rows',
      benefit: 'Supplies plant-available micronutrients, plant growth hormones (auxins & gibberellins), and improves soil aggregate stability.'
    },
    {
      title: 'Green Manuring (Dhaincha / Sunhemp / Sesbania)',
      quantity: '20 kg seed/acre sown in pre-monsoon (April-May)',
      applicationTiming: 'Plough in situ at 45-50 days when crop is succulent',
      benefit: 'Adds 20-25 tons of green biomass and fixes 60-80 kg of atmospheric nitrogen per acre while reclaiming saline/sodic soils.'
    },
    {
      title: 'Bio-Fertilizer Consortia (Azotobacter + PSB + KMB)',
      quantity: `${Math.round(2 * farmArea)} kg each per acre mixed with 100 kg FYM`,
      applicationTiming: 'Basal soil application or root dip for seedlings',
      benefit: 'Saves 20% chemical nitrogen and solubilizes native fixed phosphorus in the soil.'
    },
    {
      title: 'Neem Cake Powder (Bio-Pesticide & Nitrification Inhibitor)',
      quantity: `${Math.round(100 * farmArea)} kg per acre`,
      applicationTiming: 'Incorporated into soil along with basal Urea',
      benefit: 'Acts as a natural nitrification inhibitor to prevent nitrogen leaching losses and controls soil nematodes and white grubs.'
    }
  ];
}
