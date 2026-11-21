/**
 * AgriSense Verified Agricultural Knowledge Base & Calculation Engine
 * Standards: ICAR, PJTSAU, ANGRAU, PAU, and CIBRC (Central Insecticides Board & Registration Committee).
 * Provides deterministic agronomic calculations for:
 * 1. Variety-specific crop growth stages and duration scaling
 * 2. Days After Sowing (DAS) / Days After Transplanting (DAT) calculation
 * 3. Soil-test-based nutrient adjustment (N-P-K-S-Zn) with organic manure credits
 * 4. Commercial fertilizer product dose conversion (Urea, DAP, MOP, SSP, NPK complexes)
 * 5. CIBRC-registered crop protection & IPM non-chemical advisory
 */

export const SOIL_TYPES = [
  { id: 'clay_loam', name: 'Clay Loam (Heavy Black Cotton / Regur)', waterHolding: 'High', drainage: 'Moderate', cationExchange: 'High' },
  { id: 'sandy_loam', name: 'Sandy Loam (Red Chalkas / Light Soils)', waterHolding: 'Moderate-Low', drainage: 'Rapid', cationExchange: 'Medium' },
  { id: 'alluvial', name: 'Alluvial Loam (River Basin / Indo-Gangetic)', waterHolding: 'High', drainage: 'Good', cationExchange: 'High' },
  { id: 'red_laterite', name: 'Red Laterite (Acidic / Upland)', waterHolding: 'Low-Moderate', drainage: 'Free', cationExchange: 'Low' },
  { id: 'black_clay', name: 'Deep Black Clay (Vertisols)', waterHolding: 'Very High', drainage: 'Slow', cationExchange: 'Very High' }
];

export const IRRIGATION_METHODS = [
  { id: 'canal_flood', name: 'Canal / Basin Flood Irrigation', efficiency: 0.55 },
  { id: 'borewell_flood', name: 'Borewell / Furrow Irrigation', efficiency: 0.65 },
  { id: 'drip_fertigation', name: 'Drip Irrigation with Fertigation', efficiency: 0.90 },
  { id: 'sprinkler', name: 'Sprinkler Irrigation', efficiency: 0.80 },
  { id: 'rainfed', name: 'Purely Rainfed (Monsoon Dependent)', efficiency: 0.50 }
];

// Commercial Fertilizer Formulations Database
export const FERTILIZER_PRODUCTS = {
  urea: { id: 'urea', name: 'Urea (Prilled/Granular)', nPct: 46.0, pPct: 0.0, kPct: 0.0, sPct: 0.0, znPct: 0.0, bagWeightKg: 45, form: 'Solid granules' },
  dap: { id: 'dap', name: 'Di-Ammonium Phosphate (DAP)', nPct: 18.0, pPct: 46.0, kPct: 0.0, sPct: 0.0, znPct: 0.0, bagWeightKg: 50, form: 'Granular' },
  mop: { id: 'mop', name: 'Muriate of Potash (MOP / KCl)', nPct: 0.0, pPct: 0.0, kPct: 60.0, sPct: 0.0, znPct: 0.0, bagWeightKg: 50, form: 'Crystalline red' },
  ssp: { id: 'ssp', name: 'Single Super Phosphate (SSP)', nPct: 0.0, pPct: 16.0, kPct: 0.0, sPct: 11.0, znPct: 0.0, bagWeightKg: 50, form: 'Powder / Granular' },
  npk_20_20_0_13: { id: 'npk_20_20_0_13', name: 'Ammonium Phosphate Sulphate (20-20-0-13)', nPct: 20.0, pPct: 20.0, kPct: 0.0, sPct: 13.0, znPct: 0.0, bagWeightKg: 50, form: 'Granular' },
  npk_10_26_26: { id: 'npk_10_26_26', name: 'Complex NPK (10-26-26)', nPct: 10.0, pPct: 26.0, kPct: 26.0, sPct: 0.0, znPct: 0.0, bagWeightKg: 50, form: 'Granular' },
  zinc_sulphate_21: { id: 'zinc_sulphate_21', name: 'Zinc Sulphate Heptahydrate (Zn 21%)', nPct: 0.0, pPct: 0.0, kPct: 0.0, sPct: 10.0, znPct: 21.0, bagWeightKg: 25, form: 'Crystals' },
  zinc_sulphate_33: { id: 'zinc_sulphate_33', name: 'Zinc Sulphate Monohydrate (Zn 33%)', nPct: 0.0, pPct: 0.0, kPct: 0.0, sPct: 15.0, znPct: 33.0, bagWeightKg: 10, form: 'Micro-granules' }
};

// Crop Knowledge Base covering package of practices from ICAR & SAUs
export const CROP_KNOWLEDGE_BASE = {
  paddy: {
    id: 'paddy',
    name: 'Paddy / Rice (వరి)',
    teluguName: 'వరి పంట',
    scientificName: 'Oryza sativa',
    varieties: [
      { id: 'bpt_5204', name: 'BPT 5204 (Samba Mahsuri)', teluguName: 'బి.పి.టి 5204 (సాంబ మసూరి)', durationDays: 145, group: 'Medium-Late', type: 'Fine Grain' },
      { id: 'mtu_1010', name: 'MTU 1010 (Cottondora Sannalu)', teluguName: 'ఎం.టి.యు 1010', durationDays: 120, group: 'Short Duration', type: 'Semi-Dwarf' },
      { id: 'rnr_15048', name: 'RNR 15048 (Telangana Sona - Low GI)', teluguName: 'ఆర్.ఎన్.ఆర్ 15048 (తెలంగాణ సోనా)', durationDays: 125, group: 'Short Duration', type: 'Super Fine' },
      { id: 'ir_64', name: 'IR 64 (High Yielding)', teluguName: 'ఐ.ఆర్ 64', durationDays: 120, group: 'Short Duration', type: 'Standard Medium' }
    ],
    cultivationMethods: [
      { id: 'transplanted', name: 'Puddled Transplanted Rice (సాధారణ నాట్లు)', nurseryDays: 25 },
      { id: 'direct_sown', name: 'Direct Seeded Rice (DSR - వెదజల్లే పద్ధతి)', nurseryDays: 0 },
      { id: 'sri', name: 'SRI (System of Rice Intensification - శ్రీ వరి)', nurseryDays: 12 }
    ],
    baseNutrientDosePerAcre: {
      n: 48.0, // 120 kg N/ha = 48 kg N/acre
      p: 24.0, // 60 kg P2O5/ha = 24 kg P2O5/acre
      k: 16.0, // 40 kg K2O/ha = 16 kg K2O/acre
      zn: 10.0 // 25 kg/ha ZnSO4 = 10 kg/acre
    },
    stages: [
      {
        id: 'nursery_germination',
        name: 'Germination & Nursery',
        teluguName: 'మొలక & నారుమడి దశ',
        pctStart: 0,
        pctEnd: 15,
        description: 'Seed sprouting, radical emergence, and tender 2-3 leaf seedling development.',
        teluguDescription: 'విత్తనాలు మొలకెత్తడం మరియు 2-3 ఆకుల నారుమడి పెరుగుదల దశ.',
        activities: [
          'Maintain 1-2 cm shallow water film in nursery bed',
          'Treat seeds with Carbendazim 2g/kg or Trichoderma viride 5g/kg',
          'Scout for thrips and armyworm in nursery'
        ],
        irrigationNote: 'Keep nursery bed saturated without submerging leaf tips.'
      },
      {
        id: 'seedling_transplanting',
        name: 'Transplanting & Root Establishment',
        teluguName: 'నాట్లు & వేర్లు నిలదొక్కుకునే దశ',
        pctStart: 15,
        pctEnd: 25,
        description: 'Seedling transplanting into puddled field, root anchoring, and initial greening.',
        teluguDescription: 'నారును ప్రధాన పొలంలో నాటడం మరియు వేర్లు పట్టుకునే దశ.',
        activities: [
          'Transplant 2-3 seedlings per hill at 2-3 cm depth (spacing 20x15 cm)',
          'Apply 100% Recommended Phosphorus (DAP/SSP) and 50% Potash as basal dose',
          'Apply Zinc Sulphate (10 kg/acre) separately (never mix directly with DAP)'
        ],
        irrigationNote: 'Maintain 2 cm thin water layer for 5 days after transplanting.'
      },
      {
        id: 'active_tillering',
        name: 'Active Tillering',
        teluguName: 'పిలకలు పెట్టే దశ (యాక్టివ్ టిల్లరింగ్)',
        pctStart: 25,
        pctEnd: 48,
        description: 'Vigorous productive tiller formation, rapid leaf canopy expansion, and root proliferation.',
        teluguDescription: 'మొక్కలు అధికంగా పిలకలు వేసే దశ. సమృద్ధిగా నత్రజని అవసరం.',
        activities: [
          'Apply 1st top dressing: 25% Nitrogen (Urea 25-30 kg/acre)',
          'Weed thoroughly using cono-weeder or recommended post-emergence herbicide',
          'Scout for Yellow Stem Borer dead hearts and Leaf Folder folded leaf tips'
        ],
        irrigationNote: 'Maintain 3-5 cm water depth. Drain water 1 day before fertilizer application.'
      },
      {
        id: 'panicle_initiation',
        name: 'Panicle Initiation & Stem Elongation',
        teluguName: 'చిరుపొట్ట / చిరువెన్ను దశ',
        pctStart: 48,
        pctEnd: 68,
        description: 'Microscopic panicle primordia differentiation inside stem sheath and rapid node elongation.',
        teluguDescription: 'వెన్ను ఏర్పడే కీలకమైన చిరుపొట్ట దశ. నీటి ఎద్దడి అస్సలు రాకూడదు.',
        activities: [
          'Apply 2nd top dressing: 25% Nitrogen (Urea 25 kg/acre) + remaining 50% Potash (MOP 15 kg/acre)',
          'Ensure continuous water supply (most drought-sensitive stage)',
          'Monitor flag leaf for Leaf Blast diamond lesions and Sheath Blight water-soaked spots'
        ],
        irrigationNote: 'Critical moisture window: Maintain 5 cm continuous ponding water.'
      },
      {
        id: 'flowering_heading',
        name: 'Flowering & Anthesis',
        teluguName: 'ఈనడం & పూత దశ',
        pctStart: 68,
        pctEnd: 82,
        description: 'Panicle emergence from boot leaf, anther extrusion, pollen dehiscence, and fertilization.',
        teluguDescription: 'వెన్ను పూర్తిగా బయటకు వచ్చి పుప్పొడి రాలే పూత దశ.',
        activities: [
          'Avoid any chemical spraying during morning anthesis (9:00 AM - 12:00 PM)',
          'Scout for Gundhi Bug (earhead bug) feeding on tender milk florets',
          'Foliar spray of 13-0-45 (Potassium Nitrate) @ 5g/L if flag leaf vigor is low'
        ],
        irrigationNote: 'Maintain saturated to shallow water level (2-3 cm).'
      },
      {
        id: 'milking_dough',
        name: 'Milking & Grain Filling',
        teluguName: 'పాలుపోసుకునే & గింజగట్టిపడే దశ',
        pctStart: 82,
        pctEnd: 92,
        description: 'Starch deposition inside grains, transitioning from milky liquid to soft dough and firm grain.',
        teluguDescription: 'గింజలో పాలు నిండి క్రమంగా గట్టిపడే దశ.',
        activities: [
          'Protect crop from late Brown Plant Hopper (BPH) hopperburn in dense canopies',
          'Do not apply any further chemical pesticides to avoid residue issues',
          'Begin planning harvest logistics and machinery'
        ],
        irrigationNote: 'Alternate wetting and drying. Drain field completely 10-12 days before harvest.'
      },
      {
        id: 'maturity_harvest',
        name: 'Maturity & Harvesting',
        teluguName: 'కోత & మాగిన దశ',
        pctStart: 92,
        pctEnd: 100,
        description: '85-90% panicles turn golden yellow, grain moisture drops to 18-20%, ready for harvest.',
        teluguDescription: 'కంకులు 85% బంగారు రంగులోకి మారినప్పుడు పంటను కోయాలి.',
        activities: [
          'Harvest when grains in upper 85% of panicles are firm and golden',
          'Thresh and dry grain on clean threshing floor to 13-14% storage moisture',
          'Store grain in dry, ventilated jute bags elevated on wooden pallets'
        ],
        irrigationNote: 'Field must be completely dry for easy combine harvester or manual movement.'
      }
    ]
  },

  cotton: {
    id: 'cotton',
    name: 'Cotton (ప్రత్తి)',
    teluguName: 'ప్రత్తి పంట',
    scientificName: 'Gossypium hirsutum',
    varieties: [
      { id: 'bt_hybrid', name: 'Bt Cotton Hybrid (Bollgard II)', teluguName: 'బి.టి ప్రత్తి హైబ్రిడ్', durationDays: 165, group: 'Medium Duration', type: 'Hybrid' },
      { id: 'desi_cotton', name: 'Desi Cotton / Rainfed (HD 123)', teluguName: 'దేశీ ప్రత్తి', durationDays: 140, group: 'Short Duration', type: 'Rainfed' },
      { id: 'dch_32', name: 'DCH 32 (Long Staple Hybrid)', teluguName: 'డి.సి.హెచ్ 32 (పొడుగు పింజ)', durationDays: 180, group: 'Long Duration', type: 'Extra Long Staple' }
    ],
    cultivationMethods: [
      { id: 'dibbled', name: 'Dibbling on Ridges & Furrows (బోదెలు-కాలువల పద్ధతి)', nurseryDays: 0 },
      { id: 'flat_sowing', name: 'Flat Bed Tractor Drilling (సాధారణ విత్తే పద్ధతి)', nurseryDays: 0 }
    ],
    baseNutrientDosePerAcre: {
      n: 60.0,
      p: 30.0,
      k: 30.0,
      zn: 10.0,
      mg: 10.0, // Magnesium sulphate critical for cotton reddening
      b: 2.5    // Borax for boll retention
    },
    stages: [
      {
        id: 'cotton_germination',
        name: 'Germination & Emergence',
        teluguName: 'మొలక & ఆరంభ దశ',
        pctStart: 0,
        pctEnd: 12,
        description: 'Cotyledon emergence and initial tap root elongation into moist soil.',
        teluguDescription: 'విత్తనాలు మొలకెత్తి మొదటి రెండు ఆకులు బయటకు వచ్చే దశ.',
        activities: ['Gap filling within 10 days of sowing', 'Thinning to single vigorous seedling per hill at 12 DAS'],
        irrigationNote: 'Irrigate only if soil crusting impedes emergence.'
      },
      {
        id: 'cotton_vegetative',
        name: 'Early Vegetative & Branching',
        teluguName: 'శాకీయ పెరుగుదల & కొమ్మలు తొడిగే దశ',
        pctStart: 12,
        pctEnd: 30,
        description: 'Development of monopodial (vegetative) and sympodial (fruiting) branches.',
        teluguDescription: 'మొక్క ఏपुగా పెరిగి కొమ్మలు వేసే దశ.',
        activities: [
          'Apply 1st split Nitrogen (25% Urea)',
          'Install yellow sticky traps (10/acre) for whiteflies & jassids',
          'Inter-cultivation with bullock/tractor hoe for soil aeration'
        ],
        irrigationNote: 'Maintain moderate moisture; avoid water stagnation.'
      },
      {
        id: 'cotton_squaring',
        name: 'Squaring (Flower Bud Formation)',
        teluguName: 'మొగ్గ తొడిగే దశ (స్క్వేరింగ్)',
        pctStart: 30,
        pctEnd: 48,
        description: 'Appearance of pyramidal flower buds (squares) enclosed in bracteoles.',
        teluguDescription: 'కాయ మొగ్గలు ఏర్పడే దశ. రసం పీల్చే పురుగుల నుండి కాపాడాలి.',
        activities: [
          'Apply 2nd split Nitrogen (35% Urea) + 50% Potash (MOP)',
          'Scout for sucking pests: Jassids (hopperburn) and Thrips (upward leaf curling)',
          'Spray 19-19-19 @ 5g/L + Boron 20% @ 1g/L for square retention'
        ],
        irrigationNote: 'Crucial irrigation stage; moisture stress triggers heavy square drop.'
      },
      {
        id: 'cotton_flowering_boll',
        name: 'Peak Flowering & Boll Development',
        teluguName: 'పూత & కాయల అభివృద్ధి దశ',
        pctStart: 48,
        pctEnd: 75,
        description: 'Cream flowers blooming, pinking on day 2, and rapid boll enlargement.',
        teluguDescription: 'పూత వికసించి పత్తి కాయలు సైజు పెరిగే కీలక దశ.',
        activities: [
          'Apply 3rd split Nitrogen (40% Urea) + remaining 50% Potash',
          'Install pheromone traps (5/acre) for Pink Bollworm monitoring',
          'Spray Magnesium Sulphate (10g/L) + Urea (15g/L) to prevent leaf reddening'
        ],
        irrigationNote: 'Irrigate at 10-12 day intervals. Avoid dry-wet extremes.'
      },
      {
        id: 'cotton_bursting_picking',
        name: 'Boll Bursting & Fiber Picking',
        teluguName: 'కాయలు పగిలి దూది విచ్చుకునే & ఏరివేత దశ',
        pctStart: 75,
        pctEnd: 100,
        description: 'Bolls dehisce along 4-5 locks, fluffing white lint in warm sun.',
        teluguDescription: 'పత్తి కాయలు పగిలి తెల్లటి దూది బయటకు వచ్చే దశ.',
        activities: [
          'Pick clean seed-cotton in early morning without dry leaves/bracts',
          'Do not pick wet cotton after morning dews or rain',
          'Store in moisture-free bags; terminate crop after 2nd/3rd picking to break PBW cycle'
        ],
        irrigationNote: 'Cease irrigation completely once 30% bolls open.'
      }
    ]
  },

  maize: {
    id: 'maize',
    name: 'Maize / Corn (మొక్కజొన్న)',
    teluguName: 'మొక్కజొన్న పంట',
    scientificName: 'Zea mays',
    varieties: [
      { id: 'dekalb_9108', name: 'Dekalb 9108 Plus Hybrid', teluguName: 'డెకాల్బ్ 9108 హైబ్రిడ్', durationDays: 110, group: 'Medium', type: 'Yellow Flint' },
      { id: 'pioneer_3396', name: 'Pioneer P3396 Hybrid', teluguName: 'పయనీర్ 3396', durationDays: 115, group: 'Medium-Late', type: 'High Yield' },
      { id: 'sweet_corn', name: 'Madhuri / Sugar 75 (Sweet Corn)', teluguName: 'స్వీట్ కార్న్ (తీపి మొక్కజొన్న)', durationDays: 85, group: 'Short Duration', type: 'Sweet Corn' }
    ],
    cultivationMethods: [
      { id: 'ridge_furrow', name: 'Ridge and Furrow Drilling (బోదెలపై విత్తే పద్ధతి)', nurseryDays: 0 },
      { id: 'flat_sowing', name: 'Flat Sowing (సాధారణ విత్తడం)', nurseryDays: 0 }
    ],
    baseNutrientDosePerAcre: {
      n: 60.0,
      p: 24.0,
      k: 20.0,
      zn: 8.0
    },
    stages: [
      {
        id: 'maize_germination',
        name: 'Emergence & V3 (3-Leaf Stage)',
        teluguName: 'మొలక & 3 ఆకుల దశ',
        pctStart: 0,
        pctEnd: 15,
        description: 'Collar of 3rd leaf visible, nodal root system initiating.',
        teluguDescription: 'విత్తనాలు మొలకెత్తి 3 ఆకులు విచ్చుకునే దశ.',
        activities: ['Monitor early whorls for Fall Armyworm (FAW) pin-hole scratches'],
        irrigationNote: 'Moist seedbed required.'
      },
      {
        id: 'maize_knee_high',
        name: 'Knee-High Stage (V6-V8)',
        teluguName: 'మోకాలు లోతు ఎదుగుదల దశ',
        pctStart: 15,
        pctEnd: 40,
        description: 'Rapid stem elongation, internode expansion, and tassel initiation inside whorl.',
        teluguDescription: 'మొక్క మోకాలు లోతు పెరిగే దశ. మొదటి విడత ఎరువు వేయాలి.',
        activities: [
          'Apply 1st top dressing: 40% Nitrogen (Urea 45 kg/acre)',
          'Scout central whorls for FAW frass and larvae; apply whorl poison bait if infested',
          'Earthing up along crop rows for lodging prevention'
        ],
        irrigationNote: 'Irrigate thoroughly before and after fertilizer application.'
      },
      {
        id: 'maize_tasseling_silking',
        name: 'Tasseling & Silking',
        teluguName: 'పూత & కంకి పట్టు దశ (టాస్సెలింగ్ & సిల్కింగ్)',
        pctStart: 40,
        pctEnd: 65,
        description: 'Male tassel shedding pollen; female silks emerging from ear shoots to catch pollen.',
        teluguDescription: 'మగ పూత వికసించి ఆడ కంకి పట్టు బయటకు వచ్చే అత్యంత కీలక దశ.',
        activities: [
          'Apply 2nd top dressing: 30% Nitrogen + Potash at tassel emergence',
          'Never allow moisture stress; drought at silking causes blank ears / poor grain set'
        ],
        irrigationNote: 'CRITICAL MOISTURE PERIOD: 50-60 mm irrigation every 7-8 days.'
      },
      {
        id: 'maize_grain_fill',
        name: 'Milking, Dough & Dent',
        teluguName: 'గింజ పాలుపోసుకునే & గట్టిపడే దశ',
        pctStart: 65,
        pctEnd: 90,
        description: 'Starch accumulating in kernels, progressing from milk to dough to dent stage.',
        teluguDescription: 'కంకిలో గింజలు పాలు పోసుకుని గట్టిబడే దశ.',
        activities: ['Monitor cob borers and stem rot', 'Maintain soil moisture until black layer formation'],
        irrigationNote: 'Light irrigation until physiological maturity.'
      },
      {
        id: 'maize_harvest',
        name: 'Physiological Maturity & Harvest',
        teluguName: 'కోత & పక్వత దశ',
        pctStart: 90,
        pctEnd: 100,
        description: 'Black abscission layer forms at kernel base, husk leaves turn dry and papery.',
        teluguDescription: 'కంకి పైన పొట్టు ఎండిపోయి గింజలు కోతకు సిద్ధమయ్యే దశ.',
        activities: ['Harvest cobs, de-husk and sun dry cobs to 12% grain moisture before shelling'],
        irrigationNote: 'Dry field conditions.'
      }
    ]
  },

  chilli: {
    id: 'chilli',
    name: 'Chilli / Red Pepper (మిరప)',
    teluguName: 'మిరప పంట',
    scientificName: 'Capsicum annuum',
    varieties: [
      { id: 'guntur_teja', name: 'Guntur Teja (S-17 Hot)', teluguName: 'గుంటూరు తేజ (ఎస్-17)', durationDays: 160, group: 'Medium', type: 'Pungent Red' },
      { id: 'byadgi', name: 'Byadgi Dabbi (Deep Color)', teluguName: 'బ్యాడగి డబ్బి', durationDays: 155, group: 'Medium', type: 'High Color Value' },
      { id: 'armour_hybrid', name: 'Armour / Mahyco Tejaswini Hybrid', teluguName: 'తేజస్విని హైబ్రిడ్', durationDays: 170, group: 'Long Duration', type: 'Export Quality' }
    ],
    cultivationMethods: [
      { id: 'transplanted_ridge', name: 'Transplanted on Raised Beds with Drip/Mulch (మల్చింగ్ బెడ్లపై నాట్లు)', nurseryDays: 35 },
      { id: 'traditional_transplanted', name: 'Traditional Flat Transplanted (సాంప్రదాయ నాట్లు)', nurseryDays: 40 }
    ],
    baseNutrientDosePerAcre: {
      n: 60.0,
      p: 24.0,
      k: 30.0,
      zn: 8.0,
      s: 15.0
    },
    stages: [
      {
        id: 'chilli_nursery',
        name: 'Nursery & Seedling',
        teluguName: 'నారుమడి దశ (35-40 రోజులు)',
        pctStart: 0,
        pctEnd: 22,
        description: 'Pro-tray or raised bed nursery growth until 5-6 true leaf stage.',
        teluguDescription: '5-6 ఆకుల ఆరోగ్యకరమైన నారు సిద్ధమయ్యే దశ.',
        activities: ['Drench seedlings with Trichoderma viride or Metalaxyl to prevent damping-off'],
        irrigationNote: 'Light daily sprinkling.'
      },
      {
        id: 'chilli_transplanting',
        name: 'Transplanting & Rooting',
        teluguName: 'ప్రధాన పొలంలో నాట్లు & వేర్లు పట్టే దశ',
        pctStart: 22,
        pctEnd: 35,
        description: 'Transplanting hardened seedlings into field and vigorous rooting.',
        teluguDescription: 'నారును ప్రధాన పొలంలో నాటే దశ.',
        activities: ['Dip seedling roots in Pseudomonas fluorescens (10g/L)', 'Apply basal DAP + MOP'],
        irrigationNote: 'Immediate life-saving irrigation followed by 3rd day wetting.'
      },
      {
        id: 'chilli_vegetative_flowering',
        name: 'Vegetative Branching & Flowering',
        teluguName: 'కొమ్మలు వేసి పూత పూసే దశ',
        pctStart: 35,
        pctEnd: 60,
        description: 'Dichotomous branching with white flowers blooming at nodal junctions.',
        teluguDescription: 'మిరప మొక్క కొమ్మలు వేసి తెల్లటి పూత పూసే కీలక దశ.',
        activities: [
          'Install blue sticky traps for Western Flower Thrips (Thrips parvispinus)',
          'Apply 2nd split Nitrogen + Micronutrient spray (19-19-19 + Zn-EDTA)'
        ],
        irrigationNote: 'Regulated moisture via drip or shallow furrows.'
      },
      {
        id: 'chilli_fruit_harvest',
        name: 'Fruit Set & Consecutive Pickings',
        teluguName: 'కాయలు కాసే & కోతల దశ',
        pctStart: 60,
        pctEnd: 100,
        description: 'Berry enlargement, green chilli harvesting or ripening to deep crimson red.',
        teluguDescription: 'కాయలు సైజు పెరిగి ఎర్రగా పండి కోతలకు సిద్ధమయ్యే దశ.',
        activities: [
          'Multiple pickings at 12-15 day intervals',
          'Sun dry red chillies on clean tarpaulins until moisture reaches 10-11%'
        ],
        irrigationNote: 'Irrigate after every picking.'
      }
    ]
  },

  groundnut: {
    id: 'groundnut',
    name: 'Groundnut / Peanut (వేరుశనగ)',
    teluguName: 'వేరుశనగ పంట',
    scientificName: 'Arachis hypogaea',
    varieties: [
      { id: 'kadiri_6', name: 'Kadiri 6 (K-6 Spanish Bunch)', teluguName: 'కదిరి 6', durationDays: 105, group: 'Short Duration', type: 'Bunch Type' },
      { id: 'tmv_2', name: 'TMV 2 (Standard Rainfed)', teluguName: 'టి.ఎం.వి 2', durationDays: 105, group: 'Short Duration', type: 'Bunch Type' },
      { id: 'tag_24', name: 'TAG 24 (Semi-Dwarf High Shelling)', teluguName: 'టి.ఎ.జి 24', durationDays: 100, group: 'Very Short', type: 'Semi-Dwarf' }
    ],
    cultivationMethods: [
      { id: 'broad_bed_furrow', name: 'Broad Bed and Furrow (BBF పద్ధతి)', nurseryDays: 0 },
      { id: 'flat_drill', name: 'Flat Sowing with Tractor/Bullock Seed Drill', nurseryDays: 0 }
    ],
    baseNutrientDosePerAcre: {
      n: 12.0, // Legume fixes atmospheric nitrogen; requires less chemical N
      p: 20.0,
      k: 20.0,
      gypsum: 200.0 // Gypsum (Calcium & Sulphur) is CRITICAL at pegging stage
    },
    stages: [
      {
        id: 'groundnut_germination',
        name: 'Germination & Seedling',
        teluguName: 'మొలక & ఆరంభ దశ',
        pctStart: 0,
        pctEnd: 20,
        description: 'Hypogeal emergence, cotyledon unfolding, and Rhizobium root nodule initiation.',
        teluguDescription: 'విత్తనాలు మొలకెత్తి వేర్లలో నత్రజని బుడిపెలు ఏర్పడే దశ.',
        activities: ['Seed treatment with Rhizobium + PSB biofertilizers + Imidacloprid (2ml/kg)'],
        irrigationNote: 'Sow in moist seedbed.'
      },
      {
        id: 'groundnut_flowering_pegging',
        name: 'Flowering & Peg Penetration',
        teluguName: 'పూత & ఊడలు దిగే దశ (పెగ్గింగ్)',
        pctStart: 20,
        pctEnd: 55,
        description: 'Yellow flowers self-pollinating and geotropic pegs penetrating soil to form pods.',
        teluguDescription: 'పసుపు పూత పూసి ఊడలు నేలలోకి చొచ్చుకుపోయే అత్యంత కీలక దశ.',
        activities: [
          'CRITICAL: Apply Gypsum @ 200 kg/acre around plant base at 40-45 DAS and incorporate into soil',
          'Strictly STOP inter-cultivation or hoeing after peg initiation to avoid snapping pegs',
          'Scout for Spodoptera leaf-eating caterpillar and Tikka leaf spot'
        ],
        irrigationNote: 'CRITICAL MOISTURE: Keep top 5cm soil friable and moist for easy peg entry.'
      },
      {
        id: 'groundnut_pod_fill',
        name: 'Pod Development & Kernel Filling',
        teluguName: 'కాయలు ఊరే & గింజ నిండే దశ',
        pctStart: 55,
        pctEnd: 85,
        description: 'Underground pods expanding with calcium uptake directly through pod wall.',
        teluguDescription: 'నేలలో కాయలు పెరిగి లోపల గింజలు పుష్టిగా నిండే దశ.',
        activities: ['Monitor Tikka leaf spot (Cercospora); spray Tebuconazole if spots exceed 5% area'],
        irrigationNote: 'Moisture deficit during pod filling causes empty shells (pops).'
      },
      {
        id: 'groundnut_maturity_harvest',
        name: 'Pod Maturity & Pulling',
        teluguName: 'పంట పరిపక్వత & పీకే దశ',
        pctStart: 85,
        pctEnd: 100,
        description: 'Vines turn yellowish, inner pod shell develops dark brown-black network.',
        teluguDescription: 'కాయ లోపలి భాగం నల్లగా మారి పంట పీకడానికి సిద్ధమయ్యే దశ.',
        activities: [
          'Crack sample pods: inner shell must show brown-black coloration',
          'Pull plants in moist soil, strip pods, and dry pods to 8% moisture for storage'
        ],
        irrigationNote: 'Light pre-harvest irrigation makes pulling easy without leaving pods in soil.'
      }
    ]
  }
};

// CIBRC Approved Crop Protection & Integrated Pest Management (IPM) Database
export const CROP_PROTECTION_KNOWLEDGE_BASE = {
  paddy: [
    {
      id: 'paddy_stem_borer',
      pestName: 'Yellow Stem Borer (Scirpophaga incertulas)',
      teluguName: 'కాండం తొలిచే పురుగు (మొవ్వు కుళ్ళు / తెల్లకంకి)',
      category: 'pest',
      targetStages: ['active_tillering', 'panicle_initiation', 'flowering_heading'],
      symptoms: [
        'Central shoot dries up forming "Dead Heart" at vegetative stage',
        'Panicles emerge completely empty, upright and white ("White Earhead") at heading stage',
        'Small bore-holes on stem with brownish larval frass'
      ],
      teluguSymptoms: [
        'పిలక దశలో మొవ్వు చనిపోయి ఎండిపోవడం (డెడ్ హార్ట్)',
        'ఈనిన తర్వాత కంకులు తెల్లగా మారి తాలుగా మారడం (తెల్లకంకి)'
      ],
      deficiencyDifferential: 'Nutrient deficiencies affect whole leaf blades uniformly; stem borer leaves can be easily pulled out by hand with rotten base.',
      ipmNonChemical: [
        'Install Yellow Stem Borer pheromone traps @ 5 per acre to monitor moth catches (ETL: 1 egg mass/m²)',
        'Release egg parasitoid Trichogramma japonicum @ 40,000/acre at weekly intervals',
        'Clip seedling tips before transplanting to eliminate egg masses'
      ],
      chemicalCIBRC: {
        activeIngredient: 'Chlorantraniliprole 18.5% SC',
        brandExample: 'Coragen / Cover',
        cibrcRegistrationNumber: 'CIR-61,421/2009',
        labelDosagePerAcre: '60 ml in 200 Litres of water',
        dilutionRatePerLiter: '0.3 ml / L water',
        phiDays: 47, // Pre-Harvest Interval
        reEntryIntervalHours: 24,
        ppeRequirements: 'Wear protective rubber gloves, mask, and full-sleeve apron during spraying.',
        environmentalPrecautions: 'Do not spray near fish ponds or open water streams; highly toxic to aquatic life.'
      }
    },
    {
      id: 'paddy_blast',
      pestName: 'Rice Blast (Pyricularia oryzae)',
      teluguName: 'మెడవిరుపు తెగులు / అగ్గి తెగులు',
      category: 'disease',
      targetStages: ['active_tillering', 'panicle_initiation', 'flowering_heading'],
      symptoms: [
        'Spindle-shaped / diamond-shaped lesions with grey center and brownish border on leaf blade',
        'Blackening and rotting of node at panicle base (Neck Blast), causing panicle breakage'
      ],
      teluguSymptoms: [
        'ఆకులపై కంటి ఆకారపు మచ్చలు ఏర్పడి నల్లగా మాడటం (అగ్గి తెగులు)',
        'కంకి మెడ భాగం నల్లగా కుళ్ళి విరిగిపోవడం (మెడవిరుపు)'
      ],
      deficiencyDifferential: 'Zinc deficiency causes rusty brown patches without spindle shape, starting on lower leaves.',
      ipmNonChemical: [
        'Avoid excess split Nitrogen applications (excess Urea increases blast vulnerability)',
        'Foliar spray with Pseudomonas fluorescens @ 5g/L at early tillering',
        'Burn or compost infected straw; do not leave on field bunds'
      ],
      chemicalCIBRC: {
        activeIngredient: 'Tricyclazole 75% WP',
        brandExample: 'Beam / Sivic / Baan',
        cibrcRegistrationNumber: 'CIR-28,912/1997',
        labelDosagePerAcre: '120 grams in 200 Litres of water',
        dilutionRatePerLiter: '0.6 g / L water',
        phiDays: 30,
        reEntryIntervalHours: 24,
        ppeRequirements: 'Wear eye protection goggles and face respirator mask.',
        environmentalPrecautions: 'Avoid drift onto non-target crops and nearby water bodies.'
      }
    },
    {
      id: 'paddy_bph',
      pestName: 'Brown Plant Hopper - BPH (Nilaparvata lugens)',
      teluguName: 'సుడిదోమ (బ్రౌన్ ప్లాంట్ హాప్పర్)',
      category: 'pest',
      targetStages: ['panicle_initiation', 'flowering_heading', 'milking_dough'],
      symptoms: [
        'Hoppers congregate in thousands at plant base near water level',
        'Circular patches of crop turn yellow, dry up rapidly and lodge, looking like burnt circles ("Hopperburn")'
      ],
      teluguSymptoms: [
        'మొక్కల మొదళ్ల వద్ద వేలాది దోమలు చేరి రసం పీల్చడం',
        'పొలంలో అక్కడక్కడ గుండ్రటి ఆకారంలో పైరు కాలిపోయినట్లు ఎండిపోవడం (సుడిదోమ సుడులు)'
      ],
      deficiencyDifferential: 'Hopperburn appears in sudden circular patches; potassium deficiency causes margin scorching on older leaves across the entire plot.',
      ipmNonChemical: [
        'Form "Alleyways" (1 foot walking path every 2 meters) during transplanting for aeration and sunlight',
        'Drain water completely from field for 3-4 days to disturb hopper breeding',
        'Avoid synthetic pyrethroid sprays which cause massive BPH resurgence by killing spiders'
      ],
      chemicalCIBRC: {
        activeIngredient: 'Trifiumezo-pyram (Pexalon 10.6% SC) OR Pymetrozine 50% WDG',
        brandExample: 'Pexalon (DuPont/Corteva) / Chess (Syngenta)',
        cibrcRegistrationNumber: 'CIR-145,210/2018',
        labelDosagePerAcre: '94 ml in 200 Litres of water (Direct spray at plant base)',
        dilutionRatePerLiter: '0.47 ml / L water',
        phiDays: 21,
        reEntryIntervalHours: 48,
        ppeRequirements: 'Protective face shield, rubber boots, and chemical resistant gloves.',
        environmentalPrecautions: 'Conserve natural wolf spiders and mirid bugs.'
      }
    }
  ],

  cotton: [
    {
      id: 'cotton_pink_bollworm',
      pestName: 'Pink Bollworm (Pectinophora gossypiella)',
      teluguName: 'గులాబీ రంగు కాయ తొలిచే పురుగు',
      category: 'pest',
      targetStages: ['cotton_squaring', 'cotton_flowering_boll'],
      symptoms: [
        'Flowers fail to open fully, petals twist into a rosette ("Rosetted Flower")',
        'Small pin-hole entry holes on developing bolls that heal over',
        'Larva bores into seeds inside green bolls, staining and ruining lint'
      ],
      teluguSymptoms: [
        'పూలు విచ్చుకోకుండా ముడుచుకుపోయి రోసెట్ ఆకారంలో మారడం',
        'పత్తి కాయలపై రంధ్రాలు చేసి లోపల గింజలను మరియు దూదిని నాశనం చేయడం'
      ],
      deficiencyDifferential: 'Boron deficiency causes flower bud drop without larval web or rosette twisting.',
      ipmNonChemical: [
        'Install Pink Bollworm pheromone traps (Pectino-lure) @ 8 traps/acre',
        'Inspect 20 green bolls per acre weekly; ETL is 10% infested bolls or 8 moths/trap/day for 3 days',
        'Destroy crop stalks immediately after 2 pickings (strictly avoid ratoon crop)'
      ],
      chemicalCIBRC: {
        activeIngredient: 'Emamectin Benzoate 5% SG',
        brandExample: 'Proclaim / Missel',
        cibrcRegistrationNumber: 'CIR-48,112/2004',
        labelDosagePerAcre: '88 grams in 200 Litres of water',
        dilutionRatePerLiter: '0.44 g / L water',
        phiDays: 14,
        reEntryIntervalHours: 24,
        ppeRequirements: 'Mask and full protective gloves.',
        environmentalPrecautions: 'Toxic to bees; spray only in late evening hours after bee foraging ends.'
      }
    },
    {
      id: 'cotton_whitefly_jassids',
      pestName: 'Sucking Pests (Whitefly & Jassids)',
      teluguName: 'రసం పీల్చే పురుగులు (తెల్లదోమ & పచ్చదోమ)',
      category: 'pest',
      targetStages: ['cotton_vegetative', 'cotton_squaring'],
      symptoms: [
        'Jassid nymph feeding causes downward curling of leaf edges and marginal yellowing ("Hopperburn")',
        'Whiteflies secrete sticky honeydew on upper leaf surface leading to black sooty mold'
      ],
      teluguSymptoms: [
        'ఆకుల అంచులు క్రిందికి ముడుచుకుని పసుపు రంగులోకి మారడం (పచ్చదోమ)',
        'ఆకుల వెనుక భాగంలో తెల్లటి దోమలు చేరి జిగట పదార్థాన్ని విడుదల చేయడం'
      ],
      deficiencyDifferential: 'Potassium deficiency shows leaf margin yellowing without honeydew or downward curling.',
      ipmNonChemical: [
        'Install yellow sticky traps @ 10 per acre above crop canopy',
        'Spray Neem seed kernel extract (NSKE 5%) or Azadirachtin 10,000 ppm @ 1 ml/L'
      ],
      chemicalCIBRC: {
        activeIngredient: 'Afidopyropen 50 g/L DC OR Diafenthiuron 50% WP',
        brandExample: 'Sefina (BASF) / Pegasus (Syngenta)',
        cibrcRegistrationNumber: 'CIR-152,980/2019',
        labelDosagePerAcre: '400 ml (Sefina) in 200 Litres of water',
        dilutionRatePerLiter: '2.0 ml / L water',
        phiDays: 20,
        reEntryIntervalHours: 24,
        ppeRequirements: 'Full apron, respirator mask, chemical resistant goggles.',
        environmentalPrecautions: 'Do not spray during peak bee pollination.'
      }
    }
  ],

  groundnut: [
    {
      id: 'groundnut_tikka',
      pestName: 'Tikka Leaf Spot (Cercospora arachidicola & C. personatum)',
      teluguName: 'తిక్కా ఆకుమచ్చ తెగులు',
      category: 'disease',
      targetStages: ['groundnut_flowering_pegging', 'groundnut_pod_fill'],
      symptoms: [
        'Early leaf spot: circular reddish-brown to dark spots with prominent bright yellow halo',
        'Late leaf spot: smaller, nearly circular black spots on lower surface without prominent halo',
        'Severe infection leads to premature leaf drop (defoliation), leaving bare stems'
      ],
      teluguSymptoms: [
        'ఆకులపై గుండ్రటి నల్లటి మచ్చలు ఏర్పడి వాటి చుట్టూ పసుపు రంగు వలయం రావడం',
        'తీవ్రమైతే ఆకులన్నీ రాలిపోయి కేవలం కాండాలు మాత్రమే మిగలడం'
      ],
      deficiencyDifferential: 'Nitrogen deficiency causes general uniform chlorosis of entire leaves without black circular necrotic spots.',
      ipmNonChemical: [
        'Crop rotation with non-leguminous cereals (sorghum, pearl millet)',
        'Seed treatment with Trichoderma viride (10g/kg seed)'
      ],
      chemicalCIBRC: {
        activeIngredient: 'Tebuconazole 25.9% m/m EC OR Mancozeb 75% WP',
        brandExample: 'Folicur (Bayer) / Dithane M-45',
        cibrcRegistrationNumber: 'CIR-42,109/2003',
        labelDosagePerAcre: '200 ml in 200 Litres of water',
        dilutionRatePerLiter: '1.0 ml / L water',
        phiDays: 30,
        reEntryIntervalHours: 24,
        ppeRequirements: 'Protective mask and gloves.',
        environmentalPrecautions: 'Toxic to aquatic organisms.'
      }
    }
  ]
};

/**
 * Calculates current crop age, growth stage, maturity date, and remaining duration.
 */
export function calculateCropLifecycle(cropRecord) {
  if (!cropRecord || !cropRecord.sowingDate) return null;

  const sowing = new Date(cropRecord.sowingDate);
  const today = new Date();
  
  // Calculate raw calendar days
  const diffTime = today.getTime() - sowing.getTime();
  const rawDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  const cropMeta = CROP_KNOWLEDGE_BASE[cropRecord.cropId] || CROP_KNOWLEDGE_BASE.paddy;
  const varietyMeta = (cropMeta.varieties || []).find((v) => v.id === cropRecord.varietyId) || cropMeta.varieties[0];
  const methodId = cropRecord.cultivationMethodId || cropRecord.cultivationMethod || 'direct_sown';
  const methodMeta = (cropMeta.cultivationMethods || []).find((m) => m.id === methodId) || cropMeta.cultivationMethods[0];

  const totalDurationDays = cropRecord.customDurationDays || cropRecord.expectedDurationDays || varietyMeta?.durationDays || 120;
  const nurseryOffset = (methodMeta && methodMeta.nurseryDays) ? methodMeta.nurseryDays : 0;

  // Days After Sowing (DAS) vs Days After Transplanting (DAT)
  const isTransplanted = methodId === 'transplanted' || methodId === 'sri';
  const effectiveDAS = isTransplanted ? (rawDays + nurseryOffset) : rawDays;
  const effectiveDAT = isTransplanted ? rawDays : null;

  // Progress percentage (0 - 100%)
  const progressPct = Math.min(100, Math.max(0, Math.round((effectiveDAS / totalDurationDays) * 100)));

  // Calculate current growth stage from variety duration scaled boundaries
  let currentStage = cropMeta.stages[0];
  for (const stg of cropMeta.stages) {
    if (progressPct >= stg.pctStart && progressPct <= stg.pctEnd) {
      currentStage = stg;
      break;
    }
  }
  if (progressPct >= 100) {
    currentStage = cropMeta.stages[cropMeta.stages.length - 1];
  }

  // Expected maturity date
  const maturityDate = new Date(sowing.getTime() + (totalDurationDays - (isTransplanted ? nurseryOffset : 0)) * 24 * 60 * 60 * 1000);
  const remainingDays = Math.max(0, totalDurationDays - effectiveDAS);

  return {
    rawDays,
    effectiveDAS,
    daysAfterSowing: effectiveDAS,
    effectiveDAT,
    daysAfterTransplanting: effectiveDAT,
    isTransplanted,
    totalDurationDays,
    varietyDuration: totalDurationDays,
    progressPct,
    currentStage,
    allStages: cropMeta.stages,
    stages: cropMeta.stages,
    maturityDate: maturityDate.toISOString().split('T')[0],
    remainingDays,
    daysRemaining: remainingDays,
    cropMeta,
    varietyMeta,
    methodMeta
  };
}

/**
 * Deterministic Soil-Test-Based Fertilizer Recommendation Engine
 * Converts elemental N-P-K nutrient doses into exact commercial product bags
 * using soil test rating adjustment and organic manure credits.
 */
export function calculatePrecisionFertilizers(cropRecord, param2 = null, param3 = null, param4 = null) {
  const cropMeta = CROP_KNOWLEDGE_BASE[cropRecord.cropId] || CROP_KNOWLEDGE_BASE.paddy;
  
  let lifecycle = null;
  let soilTestData = null;
  let farmAreaAcres = null;

  if (param2 && (param2.currentStage || param2.stages)) {
    lifecycle = param2;
    soilTestData = param3;
    farmAreaAcres = param4;
  } else {
    soilTestData = param2;
    farmAreaAcres = param3;
  }

  if (!lifecycle) {
    lifecycle = calculateCropLifecycle(cropRecord);
  }

  if (!soilTestData) {
    soilTestData = cropRecord.soilTest || null;
  }

  const area = Math.max(
    0.1, 
    Number(farmAreaAcres) || Number(cropRecord.areaAcres) || Number(cropRecord.farmAreaAcres) || 1.0
  );

  // 1. Base Recommended Dose of Fertilizer (RDF in kg/acre)
  const baseRDF = { ...cropMeta.baseNutrientDosePerAcre };

  // 2. Soil Health Card rating adjustment multipliers
  // Rating rule: Low: +25% nutrient; Medium: 100% recommended; High: -25% nutrient
  let nMultiplier = 1.0;
  let pMultiplier = 1.0;
  let kMultiplier = 1.0;
  let soilAdvisoryNotes = [];
  let isSoilTestBased = false;

  if (soilTestData && (soilTestData.nKgAcre || soilTestData.nitrogen || soilTestData.ph)) {
    isSoilTestBased = true;
    
    // Nitrogen evaluation (Medium range in Indian soil test: 112 - 224 kg/acre)
    const nVal = Number(soilTestData.nKgAcre || soilTestData.nitrogen);
    if (!isNaN(nVal) && nVal > 0) {
      if (nVal < 112) {
        nMultiplier = 1.25;
        soilAdvisoryNotes.push('Soil Available N is LOW (<112 kg/ac): Increased Nitrogen dose by +25%');
      } else if (nVal > 224) {
        nMultiplier = 0.75;
        soilAdvisoryNotes.push('Soil Available N is HIGH (>224 kg/ac): Reduced Nitrogen dose by -25% to prevent vegetative lodging');
      } else {
        soilAdvisoryNotes.push('Soil Available N is OPTIMAL/MEDIUM: Standard recommended dose applies');
      }
    }

    // Phosphorus evaluation (Medium range: 4.5 - 9.0 kg/acre P)
    const pVal = Number(soilTestData.pKgAcre || soilTestData.phosphorus);
    if (!isNaN(pVal) && pVal > 0) {
      if (pVal < 4.5) {
        pMultiplier = 1.25;
        soilAdvisoryNotes.push('Soil Available P is LOW: Increased Phosphorus dose by +25%');
      } else if (pVal > 9.0) {
        pMultiplier = 0.75;
        soilAdvisoryNotes.push('Soil Available P is HIGH: Reduced Phosphorus dose by -25%');
      }
    }

    // Potassium evaluation (Medium range: 50 - 120 kg/acre K)
    const kVal = Number(soilTestData.kKgAcre || soilTestData.potassium);
    if (!isNaN(kVal) && kVal > 0) {
      if (kVal < 50) {
        kMultiplier = 1.25;
        soilAdvisoryNotes.push('Soil Available K is LOW: Increased Potash dose by +25% for disease resistance');
      } else if (kVal > 120) {
        kMultiplier = 0.75;
        soilAdvisoryNotes.push('Soil Available K is HIGH: Reduced Potash dose by -25%');
      }
    }

    // Soil pH check
    const phVal = Number(soilTestData.ph);
    if (!isNaN(phVal)) {
      if (phVal < 6.0) {
        soilAdvisoryNotes.push(`Soil is ACIDIC (pH ${phVal}): Apply Agricultural Lime or Dolomite @ 200 kg/acre before final ploughing; use Rock Phosphate instead of DAP`);
      } else if (phVal > 8.0) {
        soilAdvisoryNotes.push(`Soil is CALCAREOUS/ALKALINE (pH ${phVal}): Apply Gypsum @ 150 kg/acre and foliar Zinc Sulphate to counteract zinc fixation`);
      }
    }
  } else {
    soilAdvisoryNotes.push('No soil test card uploaded: Standard Agro-Climatic University package of practices applied (General Advisory).');
  }

  // 3. Organic manure credit (e.g. Farm Yard Manure applied in tonnes/acre)
  // 1 tonne FYM supplies approx 5 kg N, 2.5 kg P2O5, 5 kg K2O
  let fymCreditN = 0;
  let fymCreditP = 0;
  let fymCreditK = 0;
  const fymTonnes = Number(cropRecord.fymAppliedTonnes) || 0;
  if (fymTonnes > 0) {
    fymCreditN = Math.min(baseRDF.n * 0.35, fymTonnes * 5.0);
    fymCreditP = Math.min(baseRDF.p * 0.40, fymTonnes * 2.5);
    fymCreditK = Math.min(baseRDF.k * 0.50, fymTonnes * 5.0);
    soilAdvisoryNotes.push(`Organic Credit (${fymTonnes} t/ac FYM): Deducted ${fymCreditN.toFixed(1)}kg N, ${fymCreditP.toFixed(1)}kg P, ${fymCreditK.toFixed(1)}kg K from chemical requirements`);
  }

  // Net Elemental Nutrient Requirement per acre (kg/acre)
  const netNPerAcre = Math.max(0, +(baseRDF.n * nMultiplier - fymCreditN).toFixed(1));
  const netPPerAcre = Math.max(0, +(baseRDF.p * pMultiplier - fymCreditP).toFixed(1));
  const netKPerAcre = Math.max(0, +(baseRDF.k * kMultiplier - fymCreditK).toFixed(1));

  // 4. Conversion to Commercial Fertilizer Products (DAP + Urea + MOP Strategy)
  // Step A: Supply all P2O5 through DAP (46% P2O5, 18% N)
  const dapKgPerAcre = +(netPPerAcre / 0.46).toFixed(1);
  const nSuppliedByDap = +(dapKgPerAcre * 0.18).toFixed(1);

  // Step B: Remaining N supplied through Urea (46% N)
  const remainingNPerAcre = Math.max(0, +(netNPerAcre - nSuppliedByDap).toFixed(1));
  const ureaKgPerAcre = +(remainingNPerAcre / 0.46).toFixed(1);

  // Step C: All K2O supplied through MOP (60% K2O)
  const mopKgPerAcre = +(netKPerAcre / 0.60).toFixed(1);

  // Total farm requirements
  const totalDapKg = +(dapKgPerAcre * area).toFixed(1);
  const totalUreaKg = +(ureaKgPerAcre * area).toFixed(1);
  const totalMopKg = +(mopKgPerAcre * area).toFixed(1);

  // Commercial bag counts (Urea: 45 kg bag; DAP & MOP: 50 kg bags)
  const ureaBags = +(totalUreaKg / FERTILIZER_PRODUCTS.urea.bagWeightKg).toFixed(1);
  const dapBags = +(totalDapKg / FERTILIZER_PRODUCTS.dap.bagWeightKg).toFixed(1);
  const mopBags = +(totalMopKg / FERTILIZER_PRODUCTS.mop.bagWeightKg).toFixed(1);

  // 5. Stage-wise Split Application Schedule
  const currentStageId = lifecycle?.currentStage?.id || '';
  
  const stageSplits = [
    {
      stageId: 'basal',
      stageName: 'Basal / At Sowing & Transplanting',
      teluguStageName: 'నాట్లు / విత్తే సమయంలో (ఆఖరి దుక్కిలో)',
      timingDays: '0 - 15 DAS / DAT',
      dapKgAcre: dapKgPerAcre, // 100% P applied basal
      dapBagsFarm: +(dapBags).toFixed(1),
      ureaKgAcre: +(ureaKgPerAcre * 0.25).toFixed(1), // 25% Urea basal
      ureaBagsFarm: +(ureaBags * 0.25).toFixed(1),
      mopKgAcre: +(mopKgPerAcre * 0.50).toFixed(1), // 50% MOP basal
      mopBagsFarm: +(mopBags * 0.50).toFixed(1),
      micronutrientNote: 'Zinc Sulphate (21%) @ 10 kg/acre apply separately',
      applicationMethod: 'Soil incorporation during final ploughing; broadcast in standing mud for transplanted rice',
      isCurrentStage: ['nursery_germination', 'seedling_transplanting', 'cotton_germination', 'maize_germination', 'groundnut_germination'].includes(currentStageId)
    },
    {
      stageId: 'active_vegetative',
      stageName: 'Active Tillering / Branching (1st Top Dressing)',
      teluguStageName: 'మొదటి విడత పైపాటు ఎరువు (పిలకల / కొమ్మల దశ)',
      timingDays: '25 - 35 DAS / DAT',
      dapKgAcre: 0,
      dapBagsFarm: 0,
      ureaKgAcre: +(ureaKgPerAcre * 0.40).toFixed(1), // 40% Urea at active vegetative
      ureaBagsFarm: +(ureaBags * 0.40).toFixed(1),
      mopKgAcre: 0,
      mopBagsFarm: 0,
      micronutrientNote: 'If yellowing occurs, spray 19-19-19 @ 5g/L',
      applicationMethod: 'Top dressing in moist soil. Drain field 1 day before application in paddy; irrigate on 2nd day',
      isCurrentStage: ['active_tillering', 'cotton_vegetative', 'maize_knee_high', 'chilli_vegetative_flowering'].includes(currentStageId)
    },
    {
      stageId: 'reproductive',
      stageName: 'Panicle Initiation / Squaring / Silking (2nd Top Dressing)',
      teluguStageName: 'రెండవ విడత పైపాటు ఎరువు (చిరుపొట్ట / పూత దశ)',
      timingDays: '50 - 65 DAS / DAT',
      dapKgAcre: 0,
      dapBagsFarm: 0,
      ureaKgAcre: +(ureaKgPerAcre * 0.35).toFixed(1), // 35% Urea
      ureaBagsFarm: +(ureaBags * 0.35).toFixed(1),
      mopKgAcre: +(mopKgPerAcre * 0.50).toFixed(1), // Remaining 50% MOP for grain weight & disease resistance
      mopBagsFarm: +(mopBags * 0.50).toFixed(1),
      micronutrientNote: 'Spray Borax 20% @ 1g/L for flower retention',
      applicationMethod: 'Band placement or broadcasting along crop rows when soil is adequately moist',
      isCurrentStage: ['panicle_initiation', 'flowering_heading', 'cotton_squaring', 'cotton_flowering_boll', 'maize_tasseling_silking', 'groundnut_flowering_pegging'].includes(currentStageId)
    }
  ];

  return {
    isSoilTestBased,
    soilAdvisoryNotes,
    farmAreaAcres: area,
    elementalNutrients: {
      nKgAcre: netNPerAcre,
      pKgAcre: netPPerAcre,
      kKgAcre: netKPerAcre,
      totalFarmN: +(netNPerAcre * area).toFixed(1),
      totalFarmP: +(netPPerAcre * area).toFixed(1),
      totalFarmK: +(netKPerAcre * area).toFixed(1)
    },
    commercialProducts: {
      urea: {
        name: 'Urea (46% N)',
        kgPerAcre: ureaKgPerAcre,
        totalKg: totalUreaKg,
        bagWeightKg: 45,
        totalBags: ureaBags
      },
      dap: {
        name: 'DAP (18-46-0)',
        kgPerAcre: dapKgPerAcre,
        totalKg: totalDapKg,
        bagWeightKg: 50,
        totalBags: dapBags
      },
      mop: {
        name: 'MOP Potash (60% K2O)',
        kgPerAcre: mopKgPerAcre,
        totalKg: totalMopKg,
        bagWeightKg: 50,
        totalBags: mopBags
      }
    },
    stageSplits,
    generalPrecautions: [
      'Never mix Zinc Sulphate directly with DAP or SSP in the same basket; zinc reacts with phosphate and forms insoluble zinc phosphate.',
      'Always apply Urea in moist soil; avoid applying in standing water to prevent nitrogen volatilization.',
      'Split nitrogen application into 3 doses ensures 25% higher nitrogen use efficiency and prevents lodging.'
    ],
    teluguPrecautions: [
      'జింక్ సల్ఫేట్ మరియు డి.ఎ.పి ఎరువులను ఎప్పుడూ కలిపి చల్లకూడదు. విడివిడిగా వేయాలి.',
      'యూరియాను తేమ ఉన్నప్పుడు మాత్రమే వేయాలి. నిల్వ నీటిలో వేస్తే వాయు రూపంలో ఆవిరవుతుంది.',
      'నత్రజనిని మూడు విడతలుగా వేయడం వల్ల పంట ఏपुగా పెరిగి దిగుబడి పెరుగుతుంది.'
    ]
  };
}

/**
 * Intelligent Symptom-Driven Crop Protection & Pest Advisory Engine
 */
export function diagnoseCropProtection(cropId, observedSymptomKey = null, currentStageId = null) {
  const protectionList = CROP_PROTECTION_KNOWLEDGE_BASE[cropId] || CROP_PROTECTION_KNOWLEDGE_BASE.paddy;

  const normalizedList = protectionList.map((item) => ({
    ...item,
    name: item.name || item.pestName,
    teluguName: item.teluguName,
    scientificName: item.scientificName || item.pestName,
    symptoms: Array.isArray(item.symptoms) ? item.symptoms.join('; ') : (item.symptoms || ''),
    differentialDiagnosis: item.differentialDiagnosis || item.deficiencyDifferential || '',
    preventiveAndCultural: item.preventiveAndCultural || item.ipmNonChemical || [],
    chemicalManagement: item.chemicalManagement || (item.chemicalCIBRC ? {
      activeIngredient: item.chemicalCIBRC.activeIngredient,
      commercialBrand: item.chemicalCIBRC.brandExample,
      dosePerAcre: item.chemicalCIBRC.labelDosagePerAcre,
      dosePerLitre: item.chemicalCIBRC.dilutionRatePerLiter,
      waterRequirementLiters: 200,
      phiDays: item.chemicalCIBRC.phiDays,
      sprayTiming: 'Early morning (6-9 AM) or calm evening (4-6 PM)',
      ppePrecautions: item.chemicalCIBRC.ppeRequirements
    } : null),
    severityLevel: item.severityLevel || (item.category === 'disease' ? 'High' : 'Moderate')
  }));

  // Filter or prioritize based on current growth stage
  const stageRelevant = normalizedList.filter((item) => {
    if (!currentStageId) return true;
    return item.targetStages && item.targetStages.includes(currentStageId);
  });

  const matchingItems = stageRelevant.length > 0 ? stageRelevant : normalizedList;

  let activeDiagnosis = matchingItems[0];
  if (observedSymptomKey) {
    const found = normalizedList.find((p) => p.id === observedSymptomKey);
    if (found) activeDiagnosis = found;
  }

  return {
    allAvailableDiagnoses: normalizedList,
    stageRelevantDiagnoses: matchingItems,
    activeDiagnosis
  };
}

/**
 * Local Storage Persistence & Multi-Crop Management
 */
const CROPS_STORAGE_KEY = 'agrisense_registered_crops_v2';
const ACTIVE_CROP_ID_KEY = 'agrisense_active_crop_id_v2';
const APP_LOGS_STORAGE_KEY = 'agrisense_crop_application_logs_v2';

const DEFAULT_SAMPLE_CROPS = [
  {
    id: 'crop_paddy_sample_1',
    cropId: 'paddy',
    varietyId: 'bpt_5204',
    cultivationMethod: 'transplanted',
    sowingDate: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 38 days ago (Active Tillering)
    areaAcres: 3.5,
    location: {
      village: 'Gundlapally',
      mandal: 'Nalgonda',
      district: 'Nalgonda',
      state: 'Telangana'
    },
    irrigationMethod: 'canal_flood',
    soilType: 'clay_loam',
    soilTest: {
      hasSoilTest: true,
      nKgAcre: 105, // Low (<112)
      pKgAcre: 5.8, // Medium
      kKgAcre: 85,  // Medium
      ph: 7.2,
      organicCarbonPct: 0.45
    },
    fymAppliedTonnes: 2.0,
    notes: 'BPT 5204 field planted after green manure dhaincha'
  },
  {
    id: 'crop_cotton_sample_2',
    cropId: 'cotton',
    varietyId: 'bt_hybrid',
    cultivationMethod: 'direct_sown',
    sowingDate: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 65 days ago (Squaring / Flowering)
    areaAcres: 4.0,
    location: {
      village: 'Adilabad Rural',
      mandal: 'Adilabad',
      district: 'Adilabad',
      state: 'Telangana'
    },
    irrigationMethod: 'drip_fertigation',
    soilType: 'black_clay',
    soilTest: {
      hasSoilTest: true,
      nKgAcre: 98,
      pKgAcre: 7.2,
      kKgAcre: 140,
      ph: 7.8,
      organicCarbonPct: 0.52
    },
    fymAppliedTonnes: 3.0,
    notes: 'Drip fertigated Bt-Cotton with ridge and furrow'
  }
];

export function getRegisteredCrops() {
  try {
    const raw = localStorage.getItem(CROPS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CROPS_STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_CROPS));
      return DEFAULT_SAMPLE_CROPS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SAMPLE_CROPS;
  } catch {
    return DEFAULT_SAMPLE_CROPS;
  }
}

export function saveRegisteredCrop(cropData) {
  try {
    const existing = getRegisteredCrops();
    const id = cropData.id || `crop_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const updatedRecord = { ...cropData, id, updatedAt: new Date().toISOString() };
    
    const index = existing.findIndex((c) => c.id === id);
    let nextList;
    if (index >= 0) {
      nextList = [...existing];
      nextList[index] = updatedRecord;
    } else {
      nextList = [updatedRecord, ...existing];
    }
    localStorage.setItem(CROPS_STORAGE_KEY, JSON.stringify(nextList));
    localStorage.setItem(ACTIVE_CROP_ID_KEY, id);
    return updatedRecord;
  } catch (e) {
    console.error('Failed to save crop:', e);
    return cropData;
  }
}

export function deleteRegisteredCrop(cropId) {
  try {
    const existing = getRegisteredCrops();
    const nextList = existing.filter((c) => c.id !== cropId);
    localStorage.setItem(CROPS_STORAGE_KEY, JSON.stringify(nextList));
    const activeId = localStorage.getItem(ACTIVE_CROP_ID_KEY);
    if (activeId === cropId && nextList.length > 0) {
      localStorage.setItem(ACTIVE_CROP_ID_KEY, nextList[0].id);
    }
    return nextList;
  } catch (e) {
    console.error('Failed to delete crop:', e);
    return [];
  }
}

export function getActiveCropId() {
  try {
    const active = localStorage.getItem(ACTIVE_CROP_ID_KEY);
    if (active) return active;
    const crops = getRegisteredCrops();
    return crops.length > 0 ? crops[0].id : null;
  } catch {
    return null;
  }
}

export function setActiveCropId(cropId) {
  try {
    localStorage.setItem(ACTIVE_CROP_ID_KEY, cropId);
  } catch (e) {
    console.error('Failed to set active crop id:', e);
  }
}

export function getCropApplicationLogs(cropId) {
  try {
    const raw = localStorage.getItem(APP_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);
    return all.filter((entry) => entry.cropId === cropId);
  } catch {
    return [];
  }
}

export function logCropApplication(entry) {
  try {
    const raw = localStorage.getItem(APP_LOGS_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : [];
    const newRecord = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    all.unshift(newRecord);
    localStorage.setItem(APP_LOGS_STORAGE_KEY, JSON.stringify(all));
    return newRecord;
  } catch (e) {
    console.error('Failed to log application:', e);
    return null;
  }
}

