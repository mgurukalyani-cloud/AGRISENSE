/**
 * AgriSense Seasonal Crop Planning & Recommendation Engine
 * 
 * Built with verified data from:
 * - Indian Council of Agricultural Research (ICAR) Crop Guides
 * - State Agricultural Universities (PAU Ludhiana, PJTSAU Hyderabad, TNAU Coimbatore, IARI New Delhi)
 * - Directorate of Economics and Statistics, Ministry of Agriculture & Farmers Welfare (CACP Cost Norms)
 * - Government of India CCEA Minimum Support Price (MSP) Schedules (2024-25 / 2025-26)
 */

export const SEASONS = [
  { id: 'kharif', name: 'Kharif (Monsoon)', months: ['June', 'July', 'August', 'September', 'October'], icon: 'CloudRain' },
  { id: 'rabi', name: 'Rabi (Winter)', months: ['October', 'November', 'December', 'January', 'February', 'March', 'April'], icon: 'Snowflake' },
  { id: 'zaid', name: 'Zaid / Summer', months: ['March', 'April', 'May', 'June'], icon: 'Sun' }
];

export const SOIL_TYPES = [
  { id: 'alluvial_loam', name: 'Alluvial / Loamy Soil', description: 'Deep, fertile soil with balanced silt, clay and sand. High moisture retention and organic matter.', defaultPh: 7.0 },
  { id: 'black_soil', name: 'Black Cotton Soil (Regur)', description: 'Rich in montmorillonite clay, calcium and potassium. Swells when wet and shrinks when dry.', defaultPh: 7.8 },
  { id: 'red_soil', name: 'Red & Yellow Soil', description: 'Formed from crystalline metamorphic rocks; rich in iron and potash, low in nitrogen and phosphorus.', defaultPh: 6.2 },
  { id: 'sandy_loam', name: 'Sandy Loam Soil', description: 'Well-draining, easy tillage, warms up rapidly; requires regular irrigation or organic mulching.', defaultPh: 6.5 },
  { id: 'laterite_soil', name: 'Laterite Soil', description: 'High in iron and aluminum oxides; acidic to neutral; common in high-rainfall Western/Eastern Ghats.', defaultPh: 5.5 },
  { id: 'clay_loam', name: 'Heavy Clay Soil', description: 'Dense with fine particles; holds water long; ideal for wetland rice, requires proper drainage for pulses.', defaultPh: 7.4 }
];

export const IRRIGATION_TYPES = [
  { id: 'canal', name: 'Canal Irrigation', waterAvailability: 'High', reliability: 'Seasonal Scheduled' },
  { id: 'borewell', name: 'Borewell / Tube-well', waterAvailability: 'High to Medium', reliability: 'On-Demand Ground Water' },
  { id: 'drip_sprinkler', name: 'Micro-Irrigation (Drip / Sprinkler)', waterAvailability: 'High Efficiency', reliability: 'Optimal Water Savings (40-60%)' },
  { id: 'rainfed', name: 'Rain-Fed / Dryland', waterAvailability: 'Dependent on Monsoon', reliability: 'Vulnerable to Dry Spells' }
];

export const CROP_CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'cereals', name: 'Cereals & Millets' },
  { id: 'pulses', name: 'Pulses & Legumes' },
  { id: 'oilseeds', name: 'Oilseeds' },
  { id: 'commercial', name: 'Commercial & Fiber Crops' },
  { id: 'vegetables', name: 'Vegetables & Spices' }
];

/**
 * Master Agricultural Knowledge Base of 16 Major Indian Crops
 */
export const CROPS_DATABASE = [
  // 1. WHEAT (RABI)
  {
    id: 'wheat',
    imageUrl: './crops/wheat.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Golden wheat crop ear heads ready for harvest',
    name: 'Wheat (Gehun)',
    botanicalName: 'Triticum aestivum',
    category: 'cereals',
    season: 'rabi',
    sowingMonths: ['October', 'November', 'December'],
    harvestMonths: ['March', 'April', 'May'],
    durationDays: '115 - 130 days',
    durationDaysNum: 125,
    suitableSoils: ['alluvial_loam', 'clay_loam', 'black_soil', 'sandy_loam'],
    phRange: [6.0, 7.5],
    waterRequirementMm: '400 - 450 mm',
    waterRequirementLevel: 'Medium', // Low | Medium | High
    criticalIrrigationStages: [
      'Crown Root Initiation (CRI) at 21 days (most critical)',
      'Tillering stage (40-45 days)',
      'Late jointing stage (65-70 days)',
      'Flowering stage (85-90 days)',
      'Milking / Grain filling stage (100-105 days)'
    ],
    verifiedVarieties: [
      { name: 'PBW 824', university: 'PAU Ludhiana', features: 'High-yielding, resistant to yellow rust and leaf rust; average yield 23.5 q/acre.' },
      { name: 'HD 3086 (Pusa Gautami)', university: 'IARI New Delhi', features: 'Tolerant to terminal heat stress, bold lustrous grains; wide adaptability in NWPZ.' },
      { name: 'DBW 187 (Karan Vandana)', university: 'IIWBR Karnal', features: 'Rich in iron and protein; high resistance to foliar blight and rusts.' },
      { name: 'GW 322', university: 'JAU Gujarat / MP', features: 'Preferred for Central Zone; excellent chapati-making quality.' }
    ],
    seedRatePerAcreKg: '40 - 45 kg/acre',
    fertilizerDosage: {
      urea: '110 kg/acre (in 2-3 split doses)',
      dap: '55 kg/acre (basal at sowing)',
      mop: '20 kg/acre (potash)',
      zincSulphate: '10 kg/acre (21% heptahydrate)'
    },
    commonPestsAndDiseases: [
      { name: 'Yellow / Stripe Rust (Puccinia striiformis)', prevention: 'Foliar spray of Propiconazole 25% EC @ 200 ml/acre in 200L water upon first sign.' },
      { name: 'Aphids / Termites', prevention: 'Seed treatment with Imidacloprid 600 FS @ 3 ml/kg seed; spray Thiamethoxam if ear-head infested.' },
      { name: 'Karnal Bunt', prevention: 'Use certified pathogen-free seed; single spray of Tebuconazole at 50% ear emergence.' }
    ],
    alternativeResilientCrops: ['mustard', 'gram_chickpea', 'barley'],
    mspPerQuintal: 2275, // 2024-25 Rabi MSP
    mspMarketingSeason: 'Rabi Marketing Season 2024-25 (CCEA)',
    benchmarkYieldQuintalsPerAcre: { low: 16, avg: 22, high: 26 },
    culturalAdvice: 'Adopt happy seeder or zero-till drilling directly into paddy straw stubble to conserve residual soil moisture and eliminate air pollution from residue burning.'
  },

  // 2. MUSTARD / RAPESEED (RABI)
  {
    id: 'mustard',
    imageUrl: './crops/mustard.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1508784411316-02b8cd4d3a3a?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Vibrant yellow flowering mustard crop in farm field',
    name: 'Mustard / Sarson',
    botanicalName: 'Brassica juncea',
    category: 'oilseeds',
    season: 'rabi',
    sowingMonths: ['September', 'October', 'November'],
    harvestMonths: ['February', 'March'],
    durationDays: '120 - 135 days',
    durationDaysNum: 125,
    suitableSoils: ['alluvial_loam', 'sandy_loam', 'red_soil', 'black_soil'],
    phRange: [6.0, 7.5],
    waterRequirementMm: '250 - 350 mm',
    waterRequirementLevel: 'Low',
    criticalIrrigationStages: [
      'Pre-flowering / Rosette branching (30-35 days)',
      'Siliquae / Pod development (60-65 days)'
    ],
    verifiedVarieties: [
      { name: 'Pusa Bold', university: 'IARI New Delhi', features: 'Bold seeds, 41% oil content, adaptable to both rain-fed and irrigated zones.' },
      { name: 'Giriraj (DRMRIJ 31)', university: 'DRMR Bharatpur', features: 'High oil yield (40.5%), tolerant to white rust and high temperatures at seedling stage.' },
      { name: 'RH 749', university: 'HAU Hisar', features: 'High-yielding semi-dwarf variety suitable for timely sown irrigated conditions.' }
    ],
    seedRatePerAcreKg: '1.5 - 2.0 kg/acre',
    fertilizerDosage: {
      urea: '60 kg/acre',
      ssp: '150 kg/acre (Single Super Phosphate provides essential sulphur for oil synthesis)',
      mop: '15 kg/acre'
    },
    commonPestsAndDiseases: [
      { name: 'Mustard Aphid (Lipaphis erysimi)', prevention: 'Spray Dimethoate 30% EC @ 250 ml/acre or Chlorpyriphos when 20% plants show infestation.' },
      { name: 'White Rust & Downy Mildew', prevention: 'Seed treatment with Metalaxyl-M (Apron XL) @ 6g/kg; spray Mancozeb 75 WP @ 600g/acre.' },
      { name: 'Alternaria Leaf Blight', prevention: 'Clean cultivation, balanced potash application, avoid dense canopy.' }
    ],
    alternativeResilientCrops: ['gram_chickpea', 'wheat', 'safflower'],
    mspPerQuintal: 5650, // 2024-25 Rabi MSP
    mspMarketingSeason: 'Rabi Marketing Season 2024-25 (CCEA)',
    benchmarkYieldQuintalsPerAcre: { low: 6, avg: 8.5, high: 11 },
    culturalAdvice: 'Mustard is an outstanding low-water alternative to wheat requiring 50% less water, delivering 35-40% higher net profit per unit irrigation.'
  },

  // 3. CHICKPEA / BENGAL GRAM (RABI)
  {
    id: 'gram_chickpea',
    imageUrl: './crops/gram_chickpea.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Chickpea chana pods and foliage',
    name: 'Chickpea / Bengal Gram (Chana)',
    botanicalName: 'Cicer arietinum',
    category: 'pulses',
    season: 'rabi',
    sowingMonths: ['October', 'November'],
    harvestMonths: ['February', 'March', 'April'],
    durationDays: '100 - 115 days',
    durationDaysNum: 110,
    suitableSoils: ['black_soil', 'alluvial_loam', 'red_soil', 'sandy_loam'],
    phRange: [6.0, 7.8],
    waterRequirementMm: '200 - 280 mm',
    waterRequirementLevel: 'Low',
    criticalIrrigationStages: [
      'Pre-flowering branching (35-40 days)',
      'Early pod development (65-70 days, avoid during full bloom)'
    ],
    verifiedVarieties: [
      { name: 'JG 14', university: 'JNKVV Jabalpur', features: 'Heat tolerant, early maturity (100 days), ideal for late sowing after rice.' },
      { name: 'JAKI 9218', university: 'PDKV Akola', features: 'Wilt resistant desi chickpea with bold yellowish-brown grains; high yield in Central Zone.' },
      { name: 'Pusa 372', university: 'IARI New Delhi', features: 'Standard cultivar for rainfed and irrigated conditions; high protein content.' }
    ],
    seedRatePerAcreKg: '30 - 35 kg/acre',
    fertilizerDosage: {
      dap: '45 kg/acre (basal application; pulses fix atmospheric nitrogen via Rhizobium nodules)',
      urea: 'Minimal (10 kg starter dose only)',
      mop: '15 kg/acre',
      biofertilizer: 'Rhizobium + PSB seed inoculant @ 200g/10kg seed'
    },
    commonPestsAndDiseases: [
      { name: 'Gram Pod Borer (Helicoverpa armigera)', prevention: 'Install 5 pheromone traps/acre; spray HaNPV @ 200 LE/acre or Emamectin Benzoate 5% SG @ 80g/acre.' },
      { name: 'Fusarium Wilt', prevention: 'Seed treatment with Trichoderma viride @ 4g/kg seed; crop rotation with cereals.' }
    ],
    alternativeResilientCrops: ['mustard', 'lentil', 'safflower'],
    mspPerQuintal: 5440,
    mspMarketingSeason: 'Rabi Marketing Season 2024-25 (CCEA)',
    benchmarkYieldQuintalsPerAcre: { low: 6, avg: 8.5, high: 11.5 },
    culturalAdvice: 'Natural legume crop that fixes 35-45 kg nitrogen per acre into the soil, substantially lowering fertilizer costs for the subsequent Kharif crop.'
  },

  // 4. COTTON (KHARIF)
  {
    id: 'cotton',
    imageUrl: './crops/cotton.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Fluffy white cotton bolls on cotton plant',
    name: 'Cotton (Kapas)',
    botanicalName: 'Gossypium hirsutum',
    category: 'commercial',
    season: 'kharif',
    sowingMonths: ['April', 'May', 'June'],
    harvestMonths: ['October', 'November', 'December', 'January'],
    durationDays: '150 - 170 days',
    durationDaysNum: 160,
    suitableSoils: ['black_soil', 'deep_alluvial', 'red_soil'],
    phRange: [6.5, 8.2],
    waterRequirementMm: '650 - 800 mm',
    waterRequirementLevel: 'Medium',
    criticalIrrigationStages: [
      'Square / Bud initiation (45-50 days)',
      'Flowering stage (65-75 days)',
      'Boll development (90-110 days)'
    ],
    verifiedVarieties: [
      { name: 'RCH 659 BG-II', university: 'Rasi Seeds / CICR', features: 'Bollgard II technology against bollworms, high ginning outturn (36%).' },
      { name: 'Ajeet 155 BG-II', university: 'Ajeet Seeds / State Trials', features: 'High yield potential, strong boll retention under dry spells.' },
      { name: 'PAU Bt 1', university: 'PAU Ludhiana', features: 'First public sector Bt cotton variety; seed can be re-used by farmers.' }
    ],
    seedRatePerAcreKg: '1.5 - 2 packets (450g each)/acre with non-Bt refuge',
    fertilizerDosage: {
      urea: '90 kg/acre (in 3 equal splits: thinning, flowering, boll formation)',
      dap: '50 kg/acre (basal)',
      mop: '30 kg/acre',
      magnesiumSulphate: '10 kg/acre (prevents leaf reddening)'
    },
    commonPestsAndDiseases: [
      { name: 'Pink Bollworm (Pectinophora gossypiella)', prevention: 'Install 8 pheromone traps/acre; destroy rosette flowers; spray Profenofos 50 EC @ 400 ml/acre.' },
      { name: 'Whitefly & Leaf Curl Virus', prevention: 'Spray Flonicamid 50 WG @ 60g/acre or Pyriproxyfen 10 EC; install yellow sticky cards.' },
      { name: 'Boll Rot / Leaf Spot', prevention: 'Copper Oxychloride 50 WP @ 500g + Streptocycline 6g in 200L water.' }
    ],
    alternativeResilientCrops: ['soybean', 'maize', 'pigeonpea_redgram'],
    mspPerQuintal: 7121, // Medium staple 2024-25 MSP
    mspMarketingSeason: 'Kharif Marketing Season 2024-25 (CCEA)',
    benchmarkYieldQuintalsPerAcre: { low: 7, avg: 10, high: 13.5 },
    culturalAdvice: 'High commercial revenue potential in deep black soils. Strict sanitation of stalks post-harvest breaks the pink bollworm overwintering pupae cycle.'
  },

  // 5. PADDY / RICE (KHARIF)
  {
    id: 'paddy_rice',
    imageUrl: './crops/paddy_rice.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1582488667081-0152d8e777e1?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Lush green wetland paddy rice field',
    name: 'Paddy / Rice (Dhan)',
    botanicalName: 'Oryza sativa',
    category: 'cereals',
    season: 'kharif',
    sowingMonths: ['June', 'July'],
    harvestMonths: ['October', 'November'],
    durationDays: '120 - 145 days',
    durationDaysNum: 135,
    suitableSoils: ['clay_loam', 'alluvial_loam', 'heavy_clay'],
    phRange: [5.5, 7.2],
    waterRequirementMm: '1200 - 1500 mm',
    waterRequirementLevel: 'High',
    criticalIrrigationStages: [
      'Transplanting to seedling recovery (2-3 cm standing water for 7 days)',
      'Active tillering stage (20-35 days)',
      'Panicle initiation stage (50-65 days)',
      'Flowering and heading (75-85 days)',
      'Milk stage (95-105 days)'
    ],
    verifiedVarieties: [
      { name: 'PR 126', university: 'PAU Ludhiana', features: 'Short duration (123 days seed to seed), saves 20-25% groundwater; yield 30 q/acre.' },
      { name: 'Pusa Basmati 1509', university: 'IARI New Delhi', features: 'Early maturing (115 days) aromatic export quality basmati; premium mandi price.' },
      { name: 'MTU 1010 (Cottondora Sannalu)', university: 'ANGRAU Andhra Pradesh', features: 'Widely grown across South/East India; blast resistant and short duration.' },
      { name: 'BPT 5204 (Samba Mahsuri)', university: 'PJTSAU Telangana', features: 'Superfine table rice variety; high market demand and excellent cooking quality.' }
    ],
    seedRatePerAcreKg: '8 - 10 kg/acre (nursery for transplanting)',
    fertilizerDosage: {
      urea: '100 kg/acre (3 splits)',
      dap: '55 kg/acre (basal)',
      mop: '25 kg/acre',
      zincSulphate: '10 kg/acre (mandatory in paddy-wheat rotation)'
    },
    commonPestsAndDiseases: [
      { name: 'Stem Borer (Scirpophaga incertulas)', prevention: 'Broadcast Cartap Hydrochloride 4G @ 7.5 kg/acre or Chlorantraniliprole 0.4% GR.' },
      { name: 'Bacterial Leaf Blight (Xanthomonas oryzae)', prevention: 'Avoid excessive nitrogen; spray Copper Hydroxide @ 400g/acre.' },
      { name: 'Blast & Brown Spot', prevention: 'Foliar spray of Tricyclazole 75 WP @ 120g/acre at 5% panicle emergence.' }
    ],
    alternativeResilientCrops: ['maize', 'soybean', 'cotton'],
    mspPerQuintal: 2300, // Common variety 2024-25 MSP
    mspMarketingSeason: 'Kharif Marketing Season 2024-25 (CCEA)',
    benchmarkYieldQuintalsPerAcre: { low: 22, avg: 28, high: 34 },
    culturalAdvice: 'Where groundwater tables are declining, transition to Direct Seeded Rice (DSR) with seed drill to reduce water usage by 30% and eliminate nursery puddling labor.'
  },

  // 6. MAIZE / CORN (KHARIF / RABI / SUMMER)
  {
    id: 'maize',
    imageUrl: './crops/maize.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Ripe golden maize corn cob on stalk',
    name: 'Maize / Corn (Makka)',
    botanicalName: 'Zea mays',
    category: 'cereals',
    season: 'kharif',
    sowingMonths: ['June', 'July', 'October', 'February'],
    harvestMonths: ['September', 'October', 'February', 'May'],
    durationDays: '95 - 110 days',
    durationDaysNum: 100,
    suitableSoils: ['alluvial_loam', 'red_soil', 'sandy_loam', 'black_soil'],
    phRange: [6.0, 7.5],
    waterRequirementMm: '450 - 550 mm',
    waterRequirementLevel: 'Medium',
    criticalIrrigationStages: [
      'Knee-high vegetative stage (30-35 days)',
      'Tasseling and silking stage (50-60 days - highly critical)',
      'Grain filling / dough stage (70-80 days)'
    ],
    verifiedVarieties: [
      { name: 'PMH 1', university: 'PAU Ludhiana', features: 'High yielding single-cross hybrid, resistant to lodging and downy mildew.' },
      { name: 'DHM 121', university: 'PJTSAU Hyderabad', features: 'Popular in South & Central India; yellow semi-flint grain with high starch content.' },
      { name: 'DKC 9108', university: 'Commercial / ICAR Verified', features: 'Wide environmental adaptability, dense cob filling, excellent poultry feed demand.' }
    ],
    seedRatePerAcreKg: '7 - 8 kg/acre',
    fertilizerDosage: {
      urea: '100 kg/acre (1/3 basal, 1/3 knee-high, 1/3 tasseling)',
      dap: '60 kg/acre',
      mop: '25 kg/acre',
      zincSulphate: '10 kg/acre'
    },
    commonPestsAndDiseases: [
      { name: 'Fall Armyworm (Spodoptera frugiperda)', prevention: 'Whorl application of Chlorantraniliprole 18.5 SC @ 0.4 ml/L or Emamectin Benzoate @ 0.4 g/L.' },
      { name: 'Banded Leaf and Sheath Blight', prevention: 'Seed treatment with Trichoderma; foliar spray of Validamycin 3L @ 2.5 ml/L.' }
    ],
    alternativeResilientCrops: ['pearl_millet', 'sorghum', 'soybean'],
    mspPerQuintal: 2090,
    mspMarketingSeason: 'Kharif Marketing Season 2024-25 (CCEA)',
    benchmarkYieldQuintalsPerAcre: { low: 18, avg: 24, high: 29 },
    culturalAdvice: 'A water-efficient cereal consuming 60% less water than paddy with robust poultry and starch industrial feed demand providing liquidity in local mandis.'
  },

  // 7. SOYBEAN (KHARIF)
  {
    id: 'soybean',
    imageUrl: './crops/soybean.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Green soybean pods developing on agricultural plant',
    name: 'Soybean (Bhatma)',
    botanicalName: 'Glycine max',
    category: 'oilseeds',
    season: 'kharif',
    sowingMonths: ['June', 'July'],
    harvestMonths: ['September', 'October'],
    durationDays: '90 - 105 days',
    durationDaysNum: 95,
    suitableSoils: ['black_soil', 'deep_loam', 'alluvial_loam'],
    phRange: [6.5, 7.5],
    waterRequirementMm: '400 - 500 mm',
    waterRequirementLevel: 'Medium',
    criticalIrrigationStages: [
      'Flowering initiation (35-40 days)',
      'Pod elongation and bean filling (60-70 days)'
    ],
    verifiedVarieties: [
      { name: 'JS 335', university: 'JNKVV Jabalpur', features: 'Legendary benchmark variety; broad adaptation across MP, Maharashtra and Rajasthan.' },
      { name: 'JS 95-60', university: 'JNKVV Jabalpur', features: 'Ultra-early maturing (85-90 days), ideal for rainfed dry zones and potato-wheat rotations.' },
      { name: 'NRC 127', university: 'IISR Indore', features: 'Null-Kunitz trypsin inhibitor; resistant to pod shattering and lodging.' }
    ],
    seedRatePerAcreKg: '25 - 30 kg/acre',
    fertilizerDosage: {
      dap: '45 kg/acre (basal)',
      urea: '10 kg/acre (starter dose only)',
      mop: '20 kg/acre',
      gypsum: '100 kg/acre (provides calcium and sulfur for oil & protein)'
    },
    commonPestsAndDiseases: [
      { name: 'Girdle Beetle & Semilooper', prevention: 'Spray Chlorantraniliprole 18.5 SC @ 60 ml/acre or Triazophos 40 EC @ 300 ml/acre.' },
      { name: 'Yellow Mosaic Virus', prevention: 'Control whitefly vector with Thiamethoxam 25 WG @ 40g/acre; remove infected plants early.' }
    ],
    alternativeResilientCrops: ['green_gram', 'black_gram', 'pigeonpea_redgram'],
    mspPerQuintal: 4892,
    mspMarketingSeason: 'Kharif Marketing Season 2024-25 (CCEA)',
    benchmarkYieldQuintalsPerAcre: { low: 7, avg: 9.5, high: 12.5 },
    culturalAdvice: 'Key cash oilseed in Central India; leaves substantial nitrogen residue in soil for follow-up Rabi wheat or mustard crops.'
  },

  // 8. PIGEONPEA / RED GRAM (ARHAR / TUR)
  {
    id: 'pigeonpea_redgram',
    imageUrl: './crops/pigeonpea_redgram.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Red gram arhar pigeonpea pods and crop',
    name: 'Pigeonpea / Red Gram (Arhar / Tur)',
    botanicalName: 'Cajanus cajan',
    category: 'pulses',
    season: 'kharif',
    sowingMonths: ['June', 'July'],
    harvestMonths: ['December', 'January', 'February'],
    durationDays: '150 - 180 days',
    durationDaysNum: 165,
    suitableSoils: ['deep_black_soil', 'red_soil', 'alluvial_loam'],
    phRange: [6.5, 7.8],
    waterRequirementMm: '350 - 500 mm',
    waterRequirementLevel: 'Low',
    criticalIrrigationStages: [
      'Flower bud initiation (70-80 days)',
      'Pod development (110-120 days)'
    ],
    verifiedVarieties: [
      { name: 'ICPH 2740', university: 'ICRISAT Hyderabad', features: 'First commercial hybrid pigeonpea; high yield, drought resilient with 35-40% yield advantage.' },
      { name: 'BDN 711', university: 'VNMKV Parbhani', features: 'Wilt resistant, medium duration (150 days), suited for Marathwada & Vidarbha.' },
      { name: 'Pusa 992', university: 'IARI New Delhi', features: 'Early maturing (140 days), fits into pigeonpea-wheat cropping sequence in Northern plains.' }
    ],
    seedRatePerAcreKg: '4 - 5 kg/acre (sole crop) or 2 kg/acre (intercropped)',
    fertilizerDosage: {
      dap: '45 kg/acre',
      urea: '10 kg/acre',
      mop: '15 kg/acre',
      rhizobiumCulture: 'Seed inoculation with Rhizobium strain CC-1'
    },
    commonPestsAndDiseases: [
      { name: 'Pod Borer (Helicoverpa & Maruca)', prevention: 'Foliar spray of Chlorantraniliprole 18.5 SC @ 60 ml/acre or Flubendiamide 480 SC @ 40 ml/acre.' },
      { name: 'Fusarium Wilt & Sterility Mosaic', prevention: 'Plant resistant cultivars (BDN 711 / ICPH 2740); avoid deep standing water.' }
    ],
    alternativeResilientCrops: ['green_gram', 'black_gram', 'soybean'],
    mspPerQuintal: 7550,
    mspMarketingSeason: 'Kharif Marketing Season 2024-25 (CCEA)',
    benchmarkYieldQuintalsPerAcre: { low: 6, avg: 8.5, high: 11 },
    culturalAdvice: 'Deep taproot system opens hard subsoil layers and survives severe drought spells where other Kharif crops fail.'
  },

  // 9. GROUNDNUT / PEANUT (KHARIF / RABI / SUMMER)
  {
    id: 'groundnut',
    imageUrl: './crops/groundnut.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1587334274328-64186a80aeee?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Harvested groundnut pods in shell',
    name: 'Groundnut / Peanut (Mungfali)',
    botanicalName: 'Arachis hypogaea',
    category: 'oilseeds',
    season: 'kharif',
    sowingMonths: ['June', 'July', 'January'],
    harvestMonths: ['October', 'November', 'May'],
    durationDays: '105 - 120 days',
    durationDaysNum: 112,
    suitableSoils: ['sandy_loam', 'red_soil', 'light_alluvial'],
    phRange: [6.0, 7.5],
    waterRequirementMm: '400 - 550 mm',
    waterRequirementLevel: 'Medium',
    criticalIrrigationStages: [
      'Flowering stage (25-30 days)',
      'Pegging stage (40-50 days - critical for peg entry into soil)',
      'Pod development (70-80 days)'
    ],
    verifiedVarieties: [
      { name: 'Kadiri 6 (K 6)', university: 'ANGRAU Andhra Pradesh', features: 'High pod yield, drought tolerance, 48% oil content; Spanish bunch type.' },
      { name: 'TAG 24', university: 'BARC Trombay', features: 'Semi-dwarf, early maturity (100 days), high shelling turnover (72%).' },
      { name: 'GG 20', university: 'JAU Gujarat', features: 'Widely grown in Saurashtra oil belt; Virginia runner habit with bold pods.' }
    ],
    seedRatePerAcreKg: '40 - 45 kg kernels/acre',
    fertilizerDosage: {
      dap: '35 kg/acre',
      urea: '15 kg/acre',
      mop: '20 kg/acre',
      gypsum: '150 kg/acre (mandatory at 40-45 days at pegging for pod shell hardening)'
    },
    commonPestsAndDiseases: [
      { name: 'Tikka Disease (Cercospora Leaf Spot)', prevention: 'Foliar spray of Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 400g/acre.' },
      { name: 'White Grub (Holotrichia consanguinea)', prevention: 'Seed dressing with Chlorpyriphos 20 EC @ 15 ml/kg seed or Thiamethoxam.' }
    ],
    alternativeResilientCrops: ['sesame', 'soybean', 'pearl_millet'],
    mspPerQuintal: 6783,
    mspMarketingSeason: 'Kharif Marketing Season 2024-25 (CCEA)',
    benchmarkYieldQuintalsPerAcre: { low: 7, avg: 10, high: 13 },
    culturalAdvice: 'Requires friable sandy-loam soil so developing pegs can easily penetrate the surface; avoid heavy clay soils that impede pod harvesting.'
  },

  // 10. GREEN GRAM / MOONG (KHARIF / SUMMER)
  {
    id: 'green_gram',
    imageUrl: './crops/green_gram.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Green gram moong pulse crop',
    name: 'Green Gram / Moong',
    botanicalName: 'Vigna radiata',
    category: 'pulses',
    season: 'zaid',
    sowingMonths: ['March', 'April', 'July'],
    harvestMonths: ['May', 'June', 'September'],
    durationDays: '60 - 75 days',
    durationDaysNum: 65,
    suitableSoils: ['alluvial_loam', 'sandy_loam', 'red_soil', 'black_soil'],
    phRange: [6.2, 7.5],
    waterRequirementMm: '250 - 300 mm',
    waterRequirementLevel: 'Low',
    criticalIrrigationStages: [
      'Flower initiation (25-30 days)',
      'Pod filling (45-50 days)'
    ],
    verifiedVarieties: [
      { name: 'SML 668', university: 'PAU Ludhiana', features: 'Short duration (60 days), synchronous pod maturity, large shiny green grains.' },
      { name: 'IPM 02-3', university: 'IIPR Kanpur', features: 'Resistant to Mungbean Yellow Mosaic Virus (MYMV); high yield under summer heat.' },
      { name: 'Pusa Vishal', university: 'IARI New Delhi', features: 'Extra-early bold seeded variety; fits into wheat-paddy summer fallow window.' }
    ],
    seedRatePerAcreKg: '10 - 12 kg/acre (summer) or 8 kg/acre (kharif)',
    fertilizerDosage: {
      dap: '30 kg/acre',
      urea: '5 kg/acre (starter)',
      mop: '10 kg/acre',
      rhizobium: 'Bio-inoculation before sowing'
    },
    commonPestsAndDiseases: [
      { name: 'Yellow Mosaic Virus (MYMV)', prevention: 'Grow resistant varieties; control whiteflies with Acetamiprid 20 SP @ 50g/acre.' },
      { name: 'Pod Borer & Thrips', prevention: 'Spray Spinosad 45 SC @ 60 ml/acre or Emamectin Benzoate @ 70g/acre.' }
    ],
    alternativeResilientCrops: ['black_gram', 'cowpea', 'sesame'],
    mspPerQuintal: 8682,
    mspMarketingSeason: 'Kharif Marketing Season 2024-25 (CCEA)',
    benchmarkYieldQuintalsPerAcre: { low: 4, avg: 5.5, high: 7.5 },
    culturalAdvice: 'The ultimate 65-day short-cycle crop. Perfect for cultivating in the summer window between wheat harvest (April) and paddy transplanting (June).'
  },

  // 11. PEARL MILLET / BAJRA (KHARIF / SUMMER)
  {
    id: 'pearl_millet',
    imageUrl: './crops/pearl_millet.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Pearl millet bajra earhead in dryland field',
    name: 'Pearl Millet / Bajra',
    botanicalName: 'Pennisetum glaucum',
    category: 'cereals',
    season: 'kharif',
    sowingMonths: ['June', 'July', 'March'],
    harvestMonths: ['September', 'October', 'June'],
    durationDays: '75 - 90 days',
    durationDaysNum: 80,
    suitableSoils: ['sandy_loam', 'red_soil', 'light_alluvial'],
    phRange: [6.0, 8.0],
    waterRequirementMm: '250 - 350 mm',
    waterRequirementLevel: 'Low',
    criticalIrrigationStages: [
      'Tillering (20-25 days)',
      'Booting / Flag leaf (40-45 days)',
      'Grain development (60-65 days)'
    ],
    verifiedVarieties: [
      { name: 'HHB 67 Improved', university: 'HAU Hisar / ICRISAT', features: 'Ultra-early (62-65 days), drought hardy, resistant to downy mildew.' },
      { name: 'GHB 558', university: 'JAU Gujarat', features: 'High-yielding hybrid with dense ears; excellent fodder and grain quality.' },
      { name: 'RHB 177', university: 'SKNAU Jobner Rajasthan', features: 'Adapted to arid dryland zones with erratic rainfall.' }
    ],
    seedRatePerAcreKg: '1.5 - 2.0 kg/acre',
    fertilizerDosage: {
      urea: '45 kg/acre (2 splits)',
      dap: '30 kg/acre',
      mop: '10 kg/acre'
    },
    commonPestsAndDiseases: [
      { name: 'Downy Mildew / Green Ear', prevention: 'Seed treatment with Metalaxyl-M (Apron XL) @ 4 ml/kg seed.' },
      { name: 'Ergot & Smut', prevention: 'Spray Mancozeb @ 600g/acre at 50% flowering.' }
    ],
    alternativeResilientCrops: ['sorghum', 'green_gram', 'cluster_bean'],
    mspPerQuintal: 2625,
    mspMarketingSeason: 'Kharif Marketing Season 2024-25 (CCEA)',
    benchmarkYieldQuintalsPerAcre: { low: 10, avg: 14, high: 18 },
    culturalAdvice: 'Champion climate-resilient super-crop that flourishes in high heat (up to 44°C) with low rainfall and requires minimal fertilizer.'
  },

  // 12. TOMATO (KHARIF / RABI / SUMMER)
  {
    id: 'tomato',
    imageUrl: './crops/tomato.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Clusters of red ripe tomatoes on vine',
    name: 'Tomato (Tamatar)',
    botanicalName: 'Solanum lycopersicum',
    category: 'vegetables',
    season: 'rabi',
    sowingMonths: ['September', 'October', 'November', 'June', 'February'],
    harvestMonths: ['December', 'January', 'February', 'March'],
    durationDays: '110 - 130 days',
    durationDaysNum: 120,
    suitableSoils: ['alluvial_loam', 'red_soil', 'sandy_loam'],
    phRange: [6.0, 7.0],
    waterRequirementMm: '500 - 650 mm',
    waterRequirementLevel: 'Medium',
    criticalIrrigationStages: [
      'Seedling establishment (daily light sprinkler/drip)',
      'Flowering initiation',
      'Fruit development (avoid moisture fluctuations to prevent fruit cracking)'
    ],
    verifiedVarieties: [
      { name: 'Arka Rakshak', university: 'IIHR Bangalore', features: 'Triple disease resistant (ToLCV, Early Blight, Bacterial Wilt); yield up to 35 tonnes/acre.' },
      { name: 'Pusa Ruby', university: 'IARI New Delhi', features: 'Early flattish round fruits, good for local fresh market consumption.' },
      { name: 'Abhinav (Syngenta)', university: 'Commercial Benchmark', features: 'Firm square-round fruits with thick pericarp, excellent shelf-life and transportability.' }
    ],
    seedRatePerAcreKg: '40 - 50 grams/acre (hybrid nursery transplants)',
    fertilizerDosage: {
      urea: '80 kg/acre (split through fertigation or manual banding)',
      dap: '60 kg/acre',
      mop: '50 kg/acre',
      micronutrients: 'Calcium Nitrate & Boron foliar spray at fruit set prevents Blossom End Rot'
    },
    commonPestsAndDiseases: [
      { name: 'Tomato Leaf Curl Virus (ToLCV)', prevention: 'Manage whitefly vector using silver reflective mulch and Imidacloprid/Acetamiprid.' },
      { name: 'Early Blight (Alternaria solani)', prevention: 'Foliar spray of Mancozeb 75 WP or Azoxystrobin 23 SC; avoid overhead irrigation.' },
      { name: 'Fruit Borer (Helicoverpa armigera)', prevention: 'Install 6 pheromone traps; spray Spinetoram 11.7 SC @ 180 ml/acre.' }
    ],
    alternativeResilientCrops: ['chilli', 'onion', 'cabbage'],
    mspPerQuintal: null, // Perishable horticultural crop
    mspMarketingSeason: 'Perishable Horticulture (Market Determined)',
    benchmarkYieldQuintalsPerAcre: { low: 180, avg: 260, high: 340 },
    culturalAdvice: 'High-value horticultural crop with potential for exceptional returns when timed before peak regional gluts. Staking with bamboo trellising boosts marketable grade-A fruit yield by 35%.'
  },

  // 13. POTATO (RABI)
  {
    id: 'potato',
    imageUrl: './crops/potato.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Freshly harvested potatoes in farm soil',
    name: 'Potato (Aloo)',
    botanicalName: 'Solanum tuberosum',
    category: 'vegetables',
    season: 'rabi',
    sowingMonths: ['October', 'November'],
    harvestMonths: ['January', 'February', 'March'],
    durationDays: '90 - 110 days',
    durationDaysNum: 100,
    suitableSoils: ['sandy_loam', 'alluvial_loam'],
    phRange: [5.2, 6.5],
    waterRequirementMm: '450 - 550 mm',
    waterRequirementLevel: 'Medium',
    criticalIrrigationStages: [
      'Stolon formation (20-25 days)',
      'Tuber initiation (35-40 days)',
      'Tuber bulking (50-75 days - continuous moderate moisture)'
    ],
    verifiedVarieties: [
      { name: 'Kufri Jyoti', university: 'CPRI Shimla', features: 'Wide adaptability across plains and hills; moderate resistance to late blight.' },
      { name: 'Kufri Pukhraj', university: 'CPRI Shimla', features: 'Early bulking (75-80 days); yellow tubers with high yield in Northern plains.' },
      { name: 'Kufri Chipsona 1', university: 'CPRI Shimla', features: 'High dry matter, low reducing sugars; premium contract pricing from processing firms.' }
    ],
    seedRatePerAcreKg: '1000 - 1200 kg seed tubers (cut or whole 30-40g)/acre',
    fertilizerDosage: {
      urea: '110 kg/acre (half basal, half at earthing up)',
      dap: '80 kg/acre',
      mop: '60 kg/acre (potash directly governs tuber size and starch content)'
    },
    commonPestsAndDiseases: [
      { name: 'Late Blight (Phytophthora infestans)', prevention: 'Prophylactic spray of Mancozeb 75 WP @ 700g/acre; curative spray of Cymoxanil + Mancozeb (Curzate) upon outbreak.' },
      { name: 'Aphids (Myzus persicae)', prevention: 'Spray Thiamethoxam 25 WG @ 50g/acre before dehaulming for seed plot.' }
    ],
    alternativeResilientCrops: ['mustard', 'wheat', 'onion'],
    mspPerQuintal: null,
    mspMarketingSeason: 'Perishable Horticulture (Market Determined)',
    benchmarkYieldQuintalsPerAcre: { low: 80, avg: 110, high: 140 },
    culturalAdvice: 'High input capital requirement (due to seed tubers) compensated by substantial bulking output. Ensure earthing-up at 30 days to prevent tuber greening from sunlight exposure.'
  },

  // 14. ONION (RABI / KHARIF)
  {
    id: 'onion',
    imageUrl: './crops/onion.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Red onions harvested in agricultural field',
    name: 'Onion (Pyaaz)',
    botanicalName: 'Allium cepa',
    category: 'vegetables',
    season: 'rabi',
    sowingMonths: ['November', 'December', 'May'],
    harvestMonths: ['April', 'May', 'October'],
    durationDays: '125 - 140 days',
    durationDaysNum: 130,
    suitableSoils: ['alluvial_loam', 'red_soil', 'sandy_loam'],
    phRange: [6.0, 7.5],
    waterRequirementMm: '400 - 500 mm',
    waterRequirementLevel: 'Medium',
    criticalIrrigationStages: [
      'Transplanting establishment',
      'Bulb formation (50-70 days)',
      'Bulb enlargement (80-110 days; stop 15 days before harvest)'
    ],
    verifiedVarieties: [
      { name: 'Bhima Super', university: 'DOGR Rajgurunagar Pune', features: 'High yielding red onion suitable for late Kharif and Rabi with good storage ability.' },
      { name: 'Pusa Red', university: 'IARI New Delhi', features: 'Medium sized bronze-red bulbs, pungent, stores well without rotting.' },
      { name: 'Agrifound Light Red', university: 'NHRDF Nashik', features: 'Standard commercial variety in Maharashtra and MP with tight scales.' }
    ],
    seedRatePerAcreKg: '4 - 5 kg seed/acre (nursery for transplanting)',
    fertilizerDosage: {
      urea: '70 kg/acre',
      dap: '50 kg/acre',
      mop: '40 kg/acre',
      sulphur: '20 kg/acre (essential for pungency, allyl propyl disulphide synthesis, and bulb firmness)'
    },
    commonPestsAndDiseases: [
      { name: 'Onion Thrips (Thrips tabaci)', prevention: 'Foliar spray of Fipronil 5 SC @ 250 ml/acre or Spinetoram 11.7 SC.' },
      { name: 'Purple Blotch (Alternaria porri)', prevention: 'Spray Difenoconazole 25 EC @ 100 ml/acre or Mancozeb 75 WP.' }
    ],
    alternativeResilientCrops: ['garlic', 'potato', 'mustard'],
    mspPerQuintal: null,
    mspMarketingSeason: 'Perishable Horticulture (Market Determined)',
    benchmarkYieldQuintalsPerAcre: { low: 70, avg: 100, high: 135 },
    culturalAdvice: 'Curing in shade for 7-10 days after harvest dries the outer neck scales and is crucial to prevent neck rot and post-harvest storage losses.'
  },

  // 15. SUGARCANE (ANNUAL CASH CROP)
  {
    id: 'sugarcane',
    imageUrl: './crops/sugarcane.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Tall green sugarcane crop stalks',
    name: 'Sugarcane (Ganna)',
    botanicalName: 'Saccharum officinarum',
    category: 'commercial',
    season: 'rabi', // Autumn or spring planting
    sowingMonths: ['October', 'February', 'March'],
    harvestMonths: ['November', 'December', 'January', 'February'],
    durationDays: '330 - 360 days (Annual)',
    durationDaysNum: 345,
    suitableSoils: ['deep_alluvial', 'black_soil', 'clay_loam'],
    phRange: [6.5, 7.8],
    waterRequirementMm: '1500 - 2200 mm',
    waterRequirementLevel: 'High',
    criticalIrrigationStages: [
      'Germination stage (up to 45 days)',
      'Formative / tillering stage (60-120 days - high moisture demand)',
      'Grand growth elongation stage (150-270 days)'
    ],
    verifiedVarieties: [
      { name: 'Co 0238 (Karan 4)', university: 'SBI Coimbatore / Karnal', features: 'Revolutionary high-sugar early variety; dominated UP and Haryana sugar mills.' },
      { name: 'Co 86032 (Nayana)', university: 'SBI Coimbatore', features: 'Premier variety for South India; drought tolerant, excellent ratoonability.' },
      { name: 'CoLk 94184 (Birendra)', university: 'IISR Lucknow', features: 'Early maturing, waterlogging tolerant, resistant to red rot.' }
    ],
    seedRatePerAcreKg: '30,000 - 35,000 two-budded setts/acre (approx 25-30 quintals setts)',
    fertilizerDosage: {
      urea: '160 kg/acre (3 splits)',
      dap: '80 kg/acre',
      mop: '50 kg/acre'
    },
    commonPestsAndDiseases: [
      { name: 'Early Shoot Borer & Top Borer', prevention: 'Soil application of Chlorantraniliprole 0.4% GR @ 7.5 kg/acre at planting.' },
      { name: 'Red Rot (Colletotrichum falcatum)', prevention: 'Use disease-free seed setts; sett treatment in Carbendazim 50 WP @ 1g/L for 15 mins.' }
    ],
    alternativeResilientCrops: ['cotton', 'paddy_rice', 'maize'],
    mspPerQuintal: 340, // Fair and Remunerative Price (FRP) ₹340/quintal at 10.25% sugar recovery
    mspMarketingSeason: 'Fair & Remunerative Price (FRP) Central Govt Mandated',
    benchmarkYieldQuintalsPerAcre: { low: 280, avg: 360, high: 450 },
    culturalAdvice: 'Guaranteed off-take through sugar mills under statutory Fair & Remunerative Price (FRP), but ties up land for a full calendar year.'
  },

  // 16. CHILLI (KHARIF / RABI)
  {
    id: 'chilli',
    imageUrl: './crops/chilli.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Hot red and green chillies on bush',
    name: 'Chilli / Hot Pepper (Mirch)',
    botanicalName: 'Capsicum annuum',
    category: 'vegetables',
    season: 'kharif',
    sowingMonths: ['July', 'August', 'October'],
    harvestMonths: ['November', 'December', 'January', 'March'],
    durationDays: '140 - 160 days',
    durationDaysNum: 150,
    suitableSoils: ['black_soil', 'red_soil', 'alluvial_loam'],
    phRange: [6.5, 7.5],
    waterRequirementMm: '500 - 650 mm',
    waterRequirementLevel: 'Medium',
    criticalIrrigationStages: [
      'Transplant establishment',
      'Flowering and fruit set',
      'Fruit development and ripening'
    ],
    verifiedVarieties: [
      { name: 'Guntur Hope (LCA 334)', university: 'ANGRAU Lam Guntur', features: 'Export grade dry chilli; high capsaicin and oleoresin content.' },
      { name: 'Pusa Jwala', university: 'IARI New Delhi', features: 'High pungency, curved green fruits, tolerant to mosaic and leaf curl.' },
      { name: 'Byadgi Dabbi', university: 'UAS Dharwad', features: 'Deep red color, low pungency, world-famous for spice and oleoresin extraction.' }
    ],
    seedRatePerAcreKg: '250 - 300 grams/acre (hybrid nursery transplants)',
    fertilizerDosage: {
      urea: '90 kg/acre',
      dap: '60 kg/acre',
      mop: '45 kg/acre',
      zincBoron: 'Foliar micronutrient spray during peak flowering'
    },
    commonPestsAndDiseases: [
      { name: 'Chilli Thrips & Mites (Murda Disease)', prevention: 'Foliar spray of Fipronil 5 SC @ 300 ml/acre or Diafenthiuron 50 WP @ 250g/acre.' },
      { name: 'Anthracnose / Fruit Rot (Colletotrichum)', prevention: 'Spray Azoxystrobin 18.2% + Difenoconazole 11.4% SC (Amistar Top) @ 200 ml/acre.' }
    ],
    alternativeResilientCrops: ['tomato', 'cotton', 'soybean'],
    mspPerQuintal: null,
    mspMarketingSeason: 'Spice Commodity Market (Guntur / Byadgi Benchmarks)',
    benchmarkYieldQuintalsPerAcre: { low: 12, avg: 18, high: 25 }, // Dry chilli
    culturalAdvice: 'High commercial cash crop with steady export and domestic demand in southern and western trading hubs.'
  }
];

/**
 * Intelligent Multi-Factor Crop Recommendation Algorithm
 * 
 * Computes transparent, verifiable sub-scores:
 * 1. Soil Suitability Score (0-100)
 * 2. Seasonal & Thermal Alignment Score (0-100)
 * 3. Water Feasibility Score (0-100)
 * 4. Economic / Budget Compatibility Score (0-100)
 * 
 * Resulting Composite Rank:
 * Rank = 0.35 * Season/Climate + 0.25 * Soil + 0.25 * Water + 0.15 * Budget
 */
export function recommendCrops(farmerProfile, currentWeatherData = null) {
  const {
    season = 'rabi',
    sowingMonth = 'November',
    soilType = 'alluvial_loam',
    soilPh = 7.0,
    irrigationType = 'canal',
    landAreaAcres = 2.0,
    budgetPerAcre = 25000,
    cropCategory = 'all'
  } = farmerProfile;

  const currentTemp = currentWeatherData?.temperature_2m || 24;
  const isRainfed = irrigationType === 'rainfed';

  const scoredCrops = CROPS_DATABASE.map(crop => {
    // 1. Season & Sowing Month Match
    let seasonScore = 0;
    const isSeasonMatch = crop.season === season || crop.sowingMonths.includes(sowingMonth);
    if (isSeasonMatch) {
      seasonScore = 95;
    } else if (crop.season === 'all_season' || (season === 'kharif' && crop.season === 'annual')) {
      seasonScore = 80;
    } else {
      seasonScore = 35; // Severe off-season penalty
    }

    // Adjust for current ambient temperature if available
    let thermalStress = false;
    let chillingStress = false;
    if (currentTemp > 34 && crop.season === 'rabi') {
      seasonScore -= 25; // Heat stress penalty for early Rabi
      thermalStress = true;
    } else if (currentTemp < 15 && crop.season === 'kharif') {
      seasonScore -= 30; // Chilling stress
      chillingStress = true;
    }
    seasonScore = Math.max(10, Math.min(100, seasonScore));

    // 2. Soil Type & pH Match
    let soilScore = 45;
    const isSoilMatch = crop.suitableSoils.includes(soilType);
    if (isSoilMatch) {
      soilScore = 95;
    } else if (soilType === 'alluvial_loam' || soilType === 'clay_loam') {
      soilScore = 75; // Versatile soils
    }

    const phMin = crop.phRange[0];
    const phMax = crop.phRange[1];
    let phMismatch = false;
    let severePhMismatch = false;
    if (soilPh >= phMin && soilPh <= phMax) {
      soilScore += 5;
    } else if (Math.abs(soilPh - phMin) <= 0.7 || Math.abs(soilPh - phMax) <= 0.7) {
      soilScore -= 12;
      phMismatch = true;
    } else {
      soilScore -= 35; // Severe pH lockout
      severePhMismatch = true;
    }
    soilScore = Math.max(10, Math.min(100, soilScore));

    // 3. Water Feasibility Match
    let waterScore = 60;
    let severeWaterDeficit = false;
    if (isRainfed) {
      if (crop.waterRequirementLevel === 'Low') {
        waterScore = 95;
      } else if (crop.waterRequirementLevel === 'Medium') {
        waterScore = 50;
      } else {
        waterScore = 15; // High water crops (Paddy, Sugarcane) are completely unviable for rainfed
        severeWaterDeficit = true;
      }
    } else if (irrigationType === 'drip_sprinkler') {
      waterScore = 98; // Highest efficiency
    } else {
      // Canal / Borewell
      if (crop.waterRequirementLevel === 'High') {
        waterScore = 90;
      } else {
        waterScore = 85;
      }
    }

    // 4. Budget Compatibility
    const baselineCostPerAcre = estimateBaselineCost(crop.id);
    let budgetScore = 70;
    let budgetDeficit = false;
    if (budgetPerAcre >= baselineCostPerAcre) {
      budgetScore = 95;
    } else if (budgetPerAcre >= baselineCostPerAcre * 0.75) {
      budgetScore = 75;
    } else {
      budgetScore = 35; // High capital gap
      budgetDeficit = true;
    }

    // Category filter penalty if user specifically filtered
    let categoryMatch = true;
    if (cropCategory !== 'all' && crop.category !== cropCategory) {
      categoryMatch = false;
    }

    // Calculate Composite Score
    const compositeScore = Math.round(
      0.35 * seasonScore +
      0.25 * soilScore +
      0.25 * waterScore +
      0.15 * budgetScore
    );

    // ==========================================
    // UNSUITABILITY & RISK FACTOR EVALUATION
    // ==========================================
    const unsuitableReasons = [];
    let isSuitable = true;

    // Reason 1: Off-Season Photoperiod / Climate Incompatibility
    if (seasonScore <= 45 || !isSeasonMatch) {
      isSuitable = false;
      unsuitableReasons.push(
        `Off-Season Photoperiod: ${crop.name} is a ${crop.season.toUpperCase()} crop (sowing: ${crop.sowingMonths.join(', ')}). Sowing during ${season.toUpperCase()} (${sowingMonth}) disrupts photoperiod, causing premature heading or complete floral sterility.`
      );
    }

    if (thermalStress) {
      unsuitableReasons.push(
        `Severe Heat Stress (${currentTemp.toFixed(1)}°C): Ambient heat exceeds the 25°C germination ceiling for ${crop.name}, causing rapid seed desiccation and thermal shock.`
      );
    }

    if (chillingStress) {
      unsuitableReasons.push(
        `Chilling Injury Risk: Temperatures below 15°C severely impede vegetative elongation and cause spikelet drop in tropical ${crop.name}.`
      );
    }

    // Reason 2: Severe Water Deficit / Drought Risk
    if (severeWaterDeficit) {
      isSuitable = false;
      unsuitableReasons.push(
        `Severe Water Inadequacy: ${crop.name} requires ${crop.waterRequirementMm} of assured standing water. Rain-fed / dryland cultivation without dedicated canal or tube-well irrigation carries catastrophic risk of drought failure (>85% yield reduction).`
      );
    } else if (isRainfed && crop.waterRequirementLevel === 'Medium' && season === 'zaid') {
      unsuitableReasons.push(
        `Summer Evapotranspiration Deficit: Dryland moisture retention in summer (Zaid) is insufficient to support ${crop.name} through flowering without supplemental irrigation.`
      );
    }

    // Reason 3: Soil Structure & Drainage Compaction
    if (!isSoilMatch) {
      if (soilType === 'clay_loam' && (crop.id === 'potato' || crop.id === 'groundnut' || crop.id === 'cotton')) {
        isSuitable = false;
        unsuitableReasons.push(
          `Waterlogging & Soil Compaction: Heavy clay soil retains excessive moisture, causing root rot and physical impedance to underground ${crop.id === 'potato' ? 'tuber' : crop.id === 'groundnut' ? 'pod pegging' : 'taproot'} development.`
        );
      } else if (soilType === 'sandy_loam' && crop.waterRequirementLevel === 'High') {
        unsuitableReasons.push(
          `Excessive Water Percolation: Sandy loam drains rapidly, making it difficult to maintain the continuous saturation needed by ${crop.name}.`
        );
      } else {
        unsuitableReasons.push(
          `Sub-optimal Soil Texture: ${getSoilName(soilType)} does not provide the ideal physical structure or aeration required by ${crop.name}.`
        );
      }
    }

    // Reason 4: Soil pH Disparity
    if (severePhMismatch) {
      isSuitable = false;
      unsuitableReasons.push(
        `Severe Nutrient Lockout (pH ${soilPh}): ${crop.name} thrives in pH ${phMin} - ${phMax}. Current pH causes phosphorus and zinc fixation, leading to acute chlorosis.`
      );
    } else if (phMismatch) {
      unsuitableReasons.push(
        `Marginal Soil pH (pH ${soilPh}): Outside optimal range (${phMin} - ${phMax}); requires soil buffering.`
      );
    }

    // Reason 5: Financial / Working Capital Shortfall
    if (budgetDeficit) {
      const deficit = baselineCostPerAcre - budgetPerAcre;
      unsuitableReasons.push(
        `Working Capital Gap: Estimated cost (₹${baselineCostPerAcre.toLocaleString()}/acre) exceeds your operational budget by ₹${deficit.toLocaleString()}/acre, risking inability to purchase certified seed, basal fertilizers, or pest protection.`
      );
    }

    // Global cutoff threshold for suitability
    if (compositeScore < 58) {
      isSuitable = false;
    }

    // Determine Suitability Tier
    let suitabilityTier = 'SUITABLE';
    let riskLevel = 'LOW';

    if (!isSuitable) {
      suitabilityTier = 'UNSUITABLE';
      riskLevel = 'HIGH_RISK';
    } else if (compositeScore >= 80) {
      suitabilityTier = 'HIGHLY_RECOMMENDED';
      riskLevel = 'LOW';
    } else if (compositeScore >= 62) {
      suitabilityTier = 'SUITABLE';
      riskLevel = 'MODERATE';
    } else {
      suitabilityTier = 'MARGINAL';
      riskLevel = 'ELEVATED';
    }

    // Disqualification summary for quick scanning
    let disqualificationSummary = null;
    let mitigationAdvice = null;
    if (!isSuitable) {
      if (!isSeasonMatch) {
        disqualificationSummary = `Off-season ${crop.season.toUpperCase()} crop; high thermal & photoperiod risk`;
        mitigationAdvice = `Wait for verified ${crop.season.toUpperCase()} sowing (${crop.sowingMonths.join('/')}), or consider season-adapted alternatives: ${(crop.alternativeResilientCrops || []).map(c => c.replace(/_/g, ' ')).join(', ')}.`;
      } else if (severeWaterDeficit) {
        disqualificationSummary = `High water requirement (${crop.waterRequirementMm}) unviable for rainfed dryland`;
        mitigationAdvice = `Do not sow without assured tube-well / drip irrigation, or switch to drought-hardy millets / pulses.`;
      } else if (severePhMismatch) {
        disqualificationSummary = `Soil pH ${soilPh} outside acceptable range (${phMin} - ${phMax})`;
        mitigationAdvice = `Apply gypsum / agricultural lime to adjust pH before planting.`;
      } else {
        disqualificationSummary = `Incompatible with current soil texture or climatic conditions`;
        mitigationAdvice = `Adopt raised beds, organic mulching, and certified resilient varieties.`;
      }
    }

    // Generate Explanatory Human Justification for Recommended Crops
    const reasons = [];
    if (isSuitable) {
      if (seasonScore >= 80) reasons.push(`Matches optimal ${season.toUpperCase()} sowing calendar (${sowingMonth})`);
      if (crop.suitableSoils.includes(soilType)) reasons.push(`Naturally suited to ${getSoilName(soilType)} with optimal root penetration`);
      if (isRainfed && crop.waterRequirementLevel === 'Low') reasons.push(`Low moisture footprint (${crop.waterRequirementMm}) resilient to dryland conditions`);
      if (!isRainfed && crop.waterRequirementLevel === 'High') reasons.push(`Supported by reliable ${getIrrigationName(irrigationType)} infrastructure`);
      if (budgetScore >= 90) reasons.push(`Estimated cultivation cost (₹${baselineCostPerAcre.toLocaleString()}/acre) fits your budget`);
      if (crop.mspPerQuintal) {
        reasons.push(`Protected by statutory CCEA Minimum Support Price (₹${crop.mspPerQuintal.toLocaleString()}/quintal)`);
      }
    }

    return {
      crop,
      categoryMatch,
      scores: {
        composite: compositeScore,
        season: seasonScore,
        soil: soilScore,
        water: waterScore,
        budget: budgetScore
      },
      isSuitable,
      suitabilityTier,
      riskLevel,
      baselineCostPerAcre,
      totalEstimatedBudget: baselineCostPerAcre * landAreaAcres,
      primaryJustification: isSuitable ? reasons.join(' • ') : disqualificationSummary,
      disqualificationSummary,
      unsuitableReasons,
      mitigationAdvice,
      reasonsList: isSuitable ? reasons : unsuitableReasons
    };
  });

  // Filter by category if user selected one, else show all
  const filtered = scoredCrops.filter(c => cropCategory === 'all' || c.categoryMatch);

  // Sort descending by composite score
  return filtered.sort((a, b) => b.scores.composite - a.scores.composite);
}

/**
 * Baseline CACP/ICAR Cost of Cultivation estimates per acre (₹)
 */
export function estimateBaselineCost(cropId) {
  const costs = {
    wheat: 18500,
    mustard: 13500,
    gram_chickpea: 14000,
    cotton: 28000,
    paddy_rice: 24500,
    maize: 17500,
    soybean: 15500,
    pigeonpea_redgram: 15000,
    groundnut: 22000,
    green_gram: 11500,
    pearl_millet: 11000,
    tomato: 48000,
    potato: 42000,
    onion: 36000,
    sugarcane: 46000,
    chilli: 42000
  };
  return costs[cropId] || 20000;
}

export function getSoilName(id) {
  const found = SOIL_TYPES.find(s => s.id === id);
  return found ? found.name : 'Selected Soil';
}

export function getIrrigationName(id) {
  const found = IRRIGATION_TYPES.find(i => i.id === id);
  return found ? found.name : 'Selected Irrigation';
}
