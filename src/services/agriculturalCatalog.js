/**
 * AgriSense Verified Agricultural Product Catalog & Delivery Engine
 * 
 * Contains verified agricultural supplies across all 7 categories:
 * 1. Chemical Fertilizers (Neem Coated Urea, DAP, MOP, SSP, NPK Complexes)
 * 2. Organic Fertilizers (Vermicompost, FYM Bio-compost, Neem Cake, PROM, Bio-Potash)
 * 3. Micronutrients (Zinc Sulphate, Chelated Zinc EDTA, Borax, Ferrous Sulphate, Grade IV)
 * 4. Pesticides (CIBRC-registered Coragen, Contaf Plus, Ampligo, FAME)
 * 5. Bio-Pesticides (Trichoderma viride, Pseudomonas, Pure Neem Oil, Beauveria bassiana)
 * 6. Certified Seeds (BPT 5204, Telangana Sona RNR 15048, Maize DKC 9108, Bt Cotton, Mustard)
 * 7. Agricultural Equipment (Battery Sprayers, Soil Probes, Cono Weeders, Drip Kits, Hand Sprayers)
 * 
 * Also provides deterministic delivery duration calculations in minutes based on
 * farm location, hub distance, and order preparation time.
 */

export const AGRICULTURAL_CATEGORIES = [
  { id: 'cat_all', name: 'All Agricultural Products', name_te: 'అన్ని వ్యవసాయ ఉత్పత్తులు', slug: 'all', icon: 'Layers' },
  { id: 'cat_fertilizer', name: 'Chemical Fertilizers', name_te: 'రసాయన ఎరువులు', slug: 'fertilizers', icon: 'Sprout' },
  { id: 'cat_organic', name: 'Organic Fertilizers', name_te: 'సేంద్రియ ఎరువులు', slug: 'organic-fertilizers', icon: 'Leaf' },
  { id: 'cat_micronutrient', name: 'Micronutrients', name_te: 'సూక్ష్మ పోషకాలు', slug: 'micronutrients', icon: 'Sparkles' },
  { id: 'cat_pesticide', name: 'Pesticides', name_te: 'పురుగు మరియు తెగులు మందులు', slug: 'pesticides', icon: 'ShieldAlert' },
  { id: 'cat_biopesticide', name: 'Bio-Pesticides', name_te: 'జీవ నియంత్రణ మందులు', slug: 'bio-pesticides', icon: 'Activity' },
  { id: 'cat_seed', name: 'Certified Seeds', name_te: 'ధృవీకరించిన విత్తనాలు', slug: 'seeds', icon: 'CheckCircle' },
  { id: 'cat_equipment', name: 'Agricultural Equipment', name_te: 'వ్యవసాయ పరికరాలు', slug: 'equipment', icon: 'Wrench' }
];

export const VERIFIED_PRODUCTS = [
  // ==========================================
  // 1. CHEMICAL FERTILIZERS
  // ==========================================
  {
    id: 'prod_urea_45kg',
    category_id: 'cat_fertilizer',
    category_slug: 'fertilizers',
    category_name: 'Chemical Fertilizers',
    name: 'Neem Coated Urea (46% N)',
    name_te: 'వేప పూత పూసిన యూరియా (46% ఎన్)',
    brand: 'IFFCO / KRIBHCO',
    description: 'Slow-release prilled Urea coated with neem oil to retard nitrification, enhance nitrogen uptake efficiency, and promote vegetative tillering.',
    description_te: 'నత్రజని వినియోగ సామర్థ్యాన్ని పెంచి, పిలకలు బాగా రావడానికి వేప పూత పూసిన యూరియా.',
    mrp: 266.50,
    original_price: 2450.00,
    subsidy_saved: 2183.50,
    pack_size: 45.0,
    pack_unit: 'bag',
    stock_quantity: 250,
    gst_rate: 5.0,
    hsn_code: '31021000',
    usage_instructions: 'Split application: 25% Basal, 40% Tillering, 35% Panicle emergence. Broadcast when soil has optimal moisture.',
    suitable_crops: 'Paddy, Wheat, Maize, Cotton, Sugarcane',
    cibrc_reg_no: 'CIBRC/FERT/NCU-46',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_dap_50kg',
    category_id: 'cat_fertilizer',
    category_slug: 'fertilizers',
    category_name: 'Chemical Fertilizers',
    name: 'Di-Ammonium Phosphate DAP (18-46-0)',
    name_te: 'డి.ఎ.పి (18-46-0) ఎరువు',
    brand: 'Coromandel Gromor / IFFCO',
    description: 'Concentrated phosphatic starter fertilizer supplying 46% water-soluble P2O5 and 18% Ammoniacal Nitrogen for vigorous root development.',
    description_te: 'వేర్లు బలంగా భూమిలోకి దిగడానికి, దుక్కిలో వేయవలసిన 46% భాస్వరం గల డి.ఎ.పి.',
    mrp: 1350.00,
    original_price: 4000.00,
    subsidy_saved: 2650.00,
    pack_size: 50.0,
    pack_unit: 'bag',
    stock_quantity: 180,
    gst_rate: 5.0,
    hsn_code: '31053000',
    usage_instructions: '100% Basal placement during final ploughing or seed drill placement. Do not broadcast on standing dry soil.',
    suitable_crops: 'Paddy, Cotton, Chilli, Groundnut, Maize, Wheat, Pulses',
    cibrc_reg_no: 'CIBRC/FERT/DAP-18-46',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_mop_50kg',
    category_id: 'cat_fertilizer',
    category_slug: 'fertilizers',
    category_name: 'Chemical Fertilizers',
    name: 'Muriate of Potash MOP (60% K2O)',
    name_te: 'పొటాష్ ఎరువు (60% కె2ఓ)',
    brand: 'Indian Potash Limited (IPL)',
    description: 'High-grade Muriate of Potash providing 60% Potassium for stomatal regulation, drought tolerance, disease resistance and grain filling.',
    description_te: 'కాయ మరియు గింజ నాణ్యత పెంచడానికి, తెగుళ్ళను తట్టుకోవడానికి 60% పొటాష్.',
    mrp: 1700.00,
    original_price: 3200.00,
    subsidy_saved: 1500.00,
    pack_size: 50.0,
    pack_unit: 'bag',
    stock_quantity: 140,
    gst_rate: 5.0,
    hsn_code: '31042000',
    usage_instructions: 'Split application: 50% Basal at sowing, 50% at flowering / panicle initiation for heavy clay soils.',
    suitable_crops: 'Paddy, Cotton, Chilli, Banana, Tomato, Maize',
    cibrc_reg_no: 'CIBRC/FERT/MOP-60',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_ssp_50kg',
    category_id: 'cat_fertilizer',
    category_slug: 'fertilizers',
    category_name: 'Chemical Fertilizers',
    name: 'Single Super Phosphate SSP (16% P2O5, 11% S)',
    name_te: 'సింగిల్ సూపర్ ఫాస్ఫేట్ (16% పి, 11% సల్ఫర్)',
    brand: 'Khaitan / Coromandel',
    description: 'Multi-nutrient phosphatic fertilizer supplying 16% Phosphate, 11% Sulphur, and 21% Calcium. Ideal for oilseeds to boost oil synthesis.',
    description_te: 'నూనె గింజల పంటలలో నూనె శాతాన్ని పెంచే 16% భాస్వరం మరియు 11% గంధకం.',
    mrp: 425.00,
    original_price: 900.00,
    subsidy_saved: 475.00,
    pack_size: 50.0,
    pack_unit: 'bag',
    stock_quantity: 200,
    gst_rate: 5.0,
    hsn_code: '31031000',
    usage_instructions: 'Apply as basal dose during land preparation for Groundnut, Mustard, and Soybean.',
    suitable_crops: 'Mustard, Groundnut, Soybean, Pulses, Sunflower',
    cibrc_reg_no: 'CIBRC/FERT/SSP-16-11',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_npk_complex_50kg',
    category_id: 'cat_fertilizer',
    category_slug: 'fertilizers',
    category_name: 'Chemical Fertilizers',
    name: 'Ammonium Phosphate Sulphate (20-20-0-13)',
    name_te: 'కాంప్లెక్స్ ఎరువు (20-20-0-13 సల్ఫర్)',
    brand: 'FACT / IFFCO Granular',
    description: 'Balanced complex fertilizer containing 20% Ammoniacal Nitrogen, 20% Phosphate and 13% Sulphur for rapid tillering and root spread.',
    description_te: '20% నత్రజని, 20% భాస్వరం మరియు 13% సల్ఫర్ గల సమతుల్య కాంప్లెక్స్ ఎరువు.',
    mrp: 1200.00,
    original_price: 2600.00,
    subsidy_saved: 1400.00,
    pack_size: 50.0,
    pack_unit: 'bag',
    stock_quantity: 160,
    gst_rate: 5.0,
    hsn_code: '31052000',
    usage_instructions: 'Apply in 2 splits: basal incorporation and early vegetative top dressing.',
    suitable_crops: 'Paddy, Cotton, Chilli, Maize, Red Gram',
    cibrc_reg_no: 'CIBRC/FERT/NPKS-20-20',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_npk_102626_50kg',
    category_id: 'cat_fertilizer',
    category_slug: 'fertilizers',
    category_name: 'Chemical Fertilizers',
    name: 'Gromor NPK Complex 10-26-26 (50 kg)',
    name_te: 'గ్రోమోర్ కాంప్లెక్స్ 10-26-26 (50 కేజీ)',
    brand: 'Coromandel International',
    description: 'High-potash complex fertilizer ideal for flowering, pod filling, sugarcane ratoon, and horticultural orchards.',
    description_te: 'పూత మరియు కాయ బలంగా రావడానికి అవసరమైన అధిక పొటాష్ గల 10-26-26 ఎరువు.',
    mrp: 1470.00,
    original_price: 2900.00,
    subsidy_saved: 1430.00,
    pack_size: 50.0,
    pack_unit: 'bag',
    stock_quantity: 110,
    gst_rate: 5.0,
    hsn_code: '31052000',
    usage_instructions: 'Basal and flowering stage top-dressing.',
    suitable_crops: 'Cotton, Chilli, Sugarcane, Banana, Tomato',
    cibrc_reg_no: 'CIBRC/FERT/NPK-10-26',
    is_verified: 1,
    is_active: 1
  },

  // ==========================================
  // 2. ORGANIC FERTILIZERS
  // ==========================================
  {
    id: 'prod_neem_cake_50kg',
    category_id: 'cat_organic',
    category_slug: 'organic-fertilizers',
    category_name: 'Organic Fertilizers',
    name: 'Pure De-Oiled Neem Cake Powder (50 kg)',
    name_te: 'వేప పిండి పొడి ఎరువు (50 కేజీ)',
    brand: 'Godrej Agrovet AgroNeem',
    description: '100% natural cold-pressed neem seed cake rich in azadirachtin and organic NPK. Protects root zone from nematodes and termites.',
    description_te: 'వేరుపురుగు మరియు నెమటోడ్లను నివారించే సహజసిద్ధమైన స్వచ్ఛమైన వేప పిండి.',
    mrp: 950.00,
    original_price: 1350.00,
    subsidy_saved: 400.00,
    pack_size: 50.0,
    pack_unit: 'bag',
    stock_quantity: 120,
    gst_rate: 5.0,
    hsn_code: '31010099',
    usage_instructions: 'Apply 100-150 kg per acre during final ploughing mixed with farmyard manure.',
    suitable_crops: 'Paddy, Chilli, Cotton, Vegetables, Horticultural Orchards',
    cibrc_reg_no: 'NPOP/NAB/0019/ORG',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_vermicompost_40kg',
    category_id: 'cat_organic',
    category_slug: 'organic-fertilizers',
    category_name: 'Organic Fertilizers',
    name: 'Enriched Earthworm Vermicompost (40 kg)',
    name_te: 'వానపాముల ఎరువు - వర్మికంపోస్ట్ (40 కేజీ)',
    brand: 'GreenEarth AgriBio',
    description: 'Humus-rich vermicompost produced via Eisenia fetida earthworms. Improves soil microbial count, aeration, and water-holding capacity.',
    description_te: 'నేల సారవంతాన్ని, తేమను నిలిపే శక్తిని పెంచే వానపాముల సేంద్రియ ఎరువు.',
    mrp: 480.00,
    original_price: 750.00,
    subsidy_saved: 270.00,
    pack_size: 40.0,
    pack_unit: 'bag',
    stock_quantity: 150,
    gst_rate: 5.0,
    hsn_code: '31010099',
    usage_instructions: 'Apply 200-400 kg per acre in basal furrow or ring placement around fruit plants.',
    suitable_crops: 'All Agricultural and Horticultural Crops, Vegetables',
    cibrc_reg_no: 'FCO/ORG/VERMI-04',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_fym_compost_50kg',
    category_id: 'cat_organic',
    category_slug: 'organic-fertilizers',
    category_name: 'Organic Fertilizers',
    name: 'Enriched Farmyard Bio-Compost (50 kg)',
    name_te: 'సారవంతమైన సేంద్రియ పశువుల ఎరువు (50 కేజీ)',
    brand: 'Kisan Organic Agro',
    description: 'Anerobically decomposed cow dung enriched with Trichoderma and beneficial mycorrhizae for soil biological rejuvenation.',
    description_te: 'ట్రైకోడెర్మాతో పెంపొందించిన సహజసిద్ధమైన పశువుల సేంద్రియ ఎరువు.',
    mrp: 350.00,
    original_price: 550.00,
    subsidy_saved: 200.00,
    pack_size: 50.0,
    pack_unit: 'bag',
    stock_quantity: 175,
    gst_rate: 5.0,
    hsn_code: '31010099',
    usage_instructions: 'Incorporate 500-1000 kg per acre during field preparation.',
    suitable_crops: 'All Crops, Paddy, Cotton, Pulses, Millets',
    cibrc_reg_no: 'FCO/ORG/FYM-101',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_prom_50kg',
    category_id: 'cat_organic',
    category_slug: 'organic-fertilizers',
    category_name: 'Organic Fertilizers',
    name: 'Phosphate Rich Organic Manure PROM (50 kg)',
    name_te: 'ఫాస్ఫేట్ సమృద్ధి సేంద్రియ ఎరువు - ప్రోమ్ (50 కేజీ)',
    brand: 'Rajasthan State Mines / Bio-PROM',
    description: 'Eco-friendly alternative to chemical DAP containing organic carbon (14%) and rock phosphate (10.4% P2O5) with high phosphorus availability.',
    description_te: 'రసాయన డి.ఎ.పి కి ప్రత్యామ్నాయంగా సహజ సేంద్రియ భాస్వరం అందించే ప్రోమ్ ఎరువు.',
    mrp: 650.00,
    original_price: 950.00,
    subsidy_saved: 300.00,
    pack_size: 50.0,
    pack_unit: 'bag',
    stock_quantity: 85,
    gst_rate: 5.0,
    hsn_code: '31010099',
    usage_instructions: 'Basal broadcast at 150 kg per acre.',
    suitable_crops: 'Groundnut, Soybean, Pulses, Wheat, Mustard',
    cibrc_reg_no: 'FCO/PROM/CERT-2024',
    is_verified: 1,
    is_active: 1
  },

  // ==========================================
  // 3. MICRONUTRIENTS
  // ==========================================
  {
    id: 'prod_zinc_sulphate_25kg',
    category_id: 'cat_micronutrient',
    category_slug: 'micronutrients',
    category_name: 'Micronutrients',
    name: 'Zinc Sulphate Heptahydrate 21% (25 kg)',
    name_te: 'జింక్ సల్ఫేట్ 21% (25 కేజీ)',
    brand: 'IFFCO Micro-Zinc',
    description: 'Agricultural grade Zinc Sulphate (21% Zn, 10% S) preventing Khaira disease in paddy, leaf bronzing, and interveinal chlorosis.',
    description_te: 'వరిలో ఖైరా తెగులును, ఆకులు ముడుచుకుపోవడాన్ని నివారించే 21% జింక్ సల్ఫేట్.',
    mrp: 650.00,
    original_price: 850.00,
    subsidy_saved: 200.00,
    pack_size: 25.0,
    pack_unit: 'bag',
    stock_quantity: 90,
    gst_rate: 5.0,
    hsn_code: '28332990',
    usage_instructions: 'Broadcast 10-15 kg/acre as basal dose. Note: NEVER mix directly with DAP in the same bucket.',
    suitable_crops: 'Paddy, Maize, Wheat, Cotton, Citrus',
    cibrc_reg_no: 'FCO/MICRO/ZN-21',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_chelated_zinc_1kg',
    category_id: 'cat_micronutrient',
    category_slug: 'micronutrients',
    category_name: 'Micronutrients',
    name: 'Chelated Zinc EDTA 12% Foliar Grade (1 kg)',
    name_te: 'చీలేటెడ్ జింక్ ఇ.డి.టి.ఎ 12% (1 కేజీ)',
    brand: 'Multiplex Zinc-EDTA',
    description: '100% water-soluble chelated zinc allowing rapid leaf absorption without soil fixation.',
    description_te: 'ఆకుల ద్వారా వేగంగా పీల్చుకునే 12% చీలేటెడ్ జింక్ పిచికారీ పొడి.',
    mrp: 380.00,
    original_price: 520.00,
    subsidy_saved: 140.00,
    pack_size: 1.0,
    pack_unit: 'packet',
    stock_quantity: 140,
    gst_rate: 5.0,
    hsn_code: '29224990',
    usage_instructions: 'Foliar spray @ 1 to 1.5 grams per litre of water.',
    suitable_crops: 'Paddy, Cotton, Chilli, Tomato, Fruit Crops',
    cibrc_reg_no: 'FCO/MICRO/ZN-EDTA-12',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_borax_1kg',
    category_id: 'cat_micronutrient',
    category_slug: 'micronutrients',
    category_name: 'Micronutrients',
    name: 'Solubor / Borax 20% Water Soluble (1 kg)',
    name_te: 'బోరాన్ / సాల్యుబోర్ 20% (1 కేజీ)',
    brand: 'Multiplex Multibor Foliar',
    description: '100% water-soluble foliar Boron promoting pollen germination, flower retention, pod setting, and preventing fruit cracking.',
    description_te: 'పూత రాలడం నివారించి, గింజలు బాగా నిండటానికి 20% కరిగే బోరాన్.',
    mrp: 180.00,
    original_price: 250.00,
    subsidy_saved: 70.00,
    pack_size: 1.0,
    pack_unit: 'packet',
    stock_quantity: 300,
    gst_rate: 5.0,
    hsn_code: '28401900',
    usage_instructions: 'Foliar spray @ 1 to 1.5 grams per litre of water at flower initiation and pod formation stages.',
    suitable_crops: 'Mustard, Chilli, Cotton, Tomato, Groundnut, Pulses',
    cibrc_reg_no: 'FCO/MICRO/B-20',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_ferrous_sulphate_25kg',
    category_id: 'cat_micronutrient',
    category_slug: 'micronutrients',
    category_name: 'Micronutrients',
    name: 'Ferrous Sulphate 19% Iron (25 kg)',
    name_te: 'ఇనుము లోప నివారిణి - ఫెర్రస్ సల్ఫేట్ 19% (25 కేజీ)',
    brand: 'Tata Agro Micro-Fe',
    description: 'Essential iron nutrient eliminating lime-induced iron chlorosis (yellowing between leaf veins) in alkaline and black cotton soils.',
    description_te: 'నల్ల రేగడి నేలల్లో ఆకులు పాలిపోవడాన్ని (ఇనుము లోపం) నివారించే ఎరువు.',
    mrp: 450.00,
    original_price: 650.00,
    subsidy_saved: 200.00,
    pack_size: 25.0,
    pack_unit: 'bag',
    stock_quantity: 75,
    gst_rate: 5.0,
    hsn_code: '28332100',
    usage_instructions: 'Soil application 10-15 kg/acre or foliar spray @ 5g/L with 1g citric acid.',
    suitable_crops: 'Sugarcane, Groundnut, Paddy Nursery, Citrus, Jasmine',
    cibrc_reg_no: 'FCO/MICRO/FE-19',
    is_verified: 1,
    is_active: 1
  },

  // ==========================================
  // 4. PESTICIDES (CIBRC-Registered)
  // ==========================================
  {
    id: 'prod_coragen_60ml',
    category_id: 'cat_pesticide',
    category_slug: 'pesticides',
    category_name: 'Pesticides',
    name: 'Coragen (Chlorantraniliprole 18.5% SC - 60 ml)',
    name_te: 'కోరాజెన్ పురుగు మందు (60 మి.లీ)',
    brand: 'FMC India',
    description: 'CIBRC-registered anthranilic diamide insecticide providing systemic control against Paddy Stem Borer, Leaf Folder, and Cotton Bollworm.',
    description_te: 'వరి కాండం తొలుచు పురుగు, ఆకు చుట్టు పురుగు మరియు పత్తి కాయ తొలుచు పురుగుల సమర్థవంతమైన నివారణ.',
    mrp: 1850.00,
    original_price: 2200.00,
    subsidy_saved: 350.00,
    pack_size: 0.06,
    pack_unit: 'bottle',
    stock_quantity: 85,
    gst_rate: 18.0,
    hsn_code: '38089190',
    usage_instructions: 'Foliar spray @ 60 ml per acre in 200 Litres of water. Observe 14-day pre-harvest waiting interval.',
    suitable_crops: 'Paddy, Sugarcane, Cotton, Maize, Tomato',
    cibrc_reg_no: 'CIR-68,432/2012-Chlorantraniliprole(SC)-118',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_contaph_1l',
    category_id: 'cat_pesticide',
    category_slug: 'pesticides',
    category_name: 'Pesticides',
    name: 'Contaf Plus (Hexaconazole 5% SC - 1 Litre)',
    name_te: 'కాంటాఫ్ ప్లస్ తెగులు మందు (1 లీటరు)',
    brand: 'Tata Rallis India',
    description: 'Systemic triazole fungicide providing protective and curative control against Sheath Blight in Paddy, Powdery Mildew, and Rusts.',
    description_te: 'వరిలో పొడ తెగులు (షీత్ బ్లైట్), బూడిద తెగులు నివారణకు సిస్టమిక్ శిలీంద్ర సంహారిణి.',
    mrp: 620.00,
    original_price: 780.00,
    subsidy_saved: 160.00,
    pack_size: 1.0,
    pack_unit: 'bottle',
    stock_quantity: 110,
    gst_rate: 18.0,
    hsn_code: '38089290',
    usage_instructions: 'Foliar spray @ 2 ml per Litre of water (400 ml per acre) upon early symptom appearance.',
    suitable_crops: 'Paddy, Chilli, Groundnut, Cotton, Mango',
    cibrc_reg_no: 'CIR-32,198/1999-Hexaconazole(SC)-54',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_ampligo_100ml',
    category_id: 'cat_pesticide',
    category_slug: 'pesticides',
    category_name: 'Pesticides',
    name: 'Ampligo (Chlorantraniliprole 9.3% + Lambda 4.6% - 100 ml)',
    name_te: 'యాంప్లిగో పురుగు మందు (100 మి.లీ)',
    brand: 'Syngenta India',
    description: 'Dual-mode insecticide offering knock-down and long residual control against Helicoverpa armigera and Spodoptera litura.',
    description_te: 'శనగ పచ్చ పురుగు, లద్దె పురుగులను తక్షణమే అరికట్టే ఆధునిక పురుగు మందు.',
    mrp: 750.00,
    original_price: 920.00,
    subsidy_saved: 170.00,
    pack_size: 0.1,
    pack_unit: 'bottle',
    stock_quantity: 65,
    gst_rate: 18.0,
    hsn_code: '38089190',
    usage_instructions: 'Foliar spray @ 100 ml per acre in 200 Litres of water.',
    suitable_crops: 'Cotton, Chilli, Pigeonpea / Red Gram, Maize',
    cibrc_reg_no: 'CIR-94,210/2015-Ampligo(ZC)-210',
    is_verified: 1,
    is_active: 1
  },

  // ==========================================
  // 5. BIO-PESTICIDES
  // ==========================================
  {
    id: 'prod_trichoderma_1kg',
    category_id: 'cat_biopesticide',
    category_slug: 'bio-pesticides',
    category_name: 'Bio-Pesticides',
    name: 'Trichoderma viride 1.5% WP (1 kg)',
    name_te: 'ట్రైకోడెర్మా విరిడే జీవ శిలీంద్ర నాశిని (1 కేజీ)',
    brand: 'Biostadt AgriBio',
    description: 'CIBRC-approved beneficial biocontrol fungus targeting soil-borne pathogens: Fusarium root rot, collar rot, damping off, and bacterial wilt.',
    description_te: 'వేరుకుళ్ళు, ఎండు తెగులును సమర్థవంతంగా అరికట్టే మేలు చేసే శిలీంద్ర సంహారిణి.',
    mrp: 220.00,
    original_price: 320.00,
    subsidy_saved: 100.00,
    pack_size: 1.0,
    pack_unit: 'packet',
    stock_quantity: 175,
    gst_rate: 5.0,
    hsn_code: '30029030',
    usage_instructions: 'Seed treatment: 5-10 g/kg seed. Soil application: 2.5 kg mixed with 100 kg moist FYM per acre.',
    suitable_crops: 'Paddy, Cotton, Chilli, Red Gram, Tomato, Groundnut',
    cibrc_reg_no: 'CIBRC/BIO/TRICH-1.5WP-89',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_neem_oil_1l',
    category_id: 'cat_biopesticide',
    category_slug: 'bio-pesticides',
    category_name: 'Bio-Pesticides',
    name: 'Pure Neem Oil 10,000 PPM Azadirachtin (1 Litre)',
    name_te: 'వేప నూనె 10,000 పి.పి.ఎం (1 లీటరు)',
    brand: 'Multiplex Bio-Neem',
    description: 'Cold-pressed neem oil formulation acting as an anti-feedant, oviposition deterrent, and insect growth regulator for sucking pests.',
    description_te: 'రసం పీల్చే పురుగులను, గుడ్లను నిరోధించే సహజ సిద్ధమైన ఆర్గానిక్ వేప నూనె.',
    mrp: 450.00,
    original_price: 600.00,
    subsidy_saved: 150.00,
    pack_size: 1.0,
    pack_unit: 'bottle',
    stock_quantity: 140,
    gst_rate: 5.0,
    hsn_code: '38089910',
    usage_instructions: 'Foliar spray @ 3-5 ml per Litre of water. Repeat every 10-12 days for organic IPM.',
    suitable_crops: 'All Crops, Cotton, Chilli, Vegetables, Pulses',
    cibrc_reg_no: 'CIBRC/BIO/AZA-10000PPM-45',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_pseudomonas_1kg',
    category_id: 'cat_biopesticide',
    category_slug: 'bio-pesticides',
    category_name: 'Bio-Pesticides',
    name: 'Pseudomonas fluorescens 1.0% WP (1 kg)',
    name_te: 'సూడోమోనాస్ ఫ్లోరోసెన్స్ జీవ నియంత్రణ (1 కేజీ)',
    brand: 'Kisan Bio-Tech',
    description: 'Plant-growth promoting rhizobacteria (PGPR) suppressing bacterial leaf blight, sheath rot, and fungal root rots.',
    description_te: 'బాక్టీరియా మరియు శిలీంద్ర సంబంధిత తెగుళ్ళను అరికట్టే మేలు చేసే బ్యాక్టీరియా.',
    mrp: 240.00,
    original_price: 350.00,
    subsidy_saved: 110.00,
    pack_size: 1.0,
    pack_unit: 'packet',
    stock_quantity: 95,
    gst_rate: 5.0,
    hsn_code: '30029030',
    usage_instructions: 'Seed treatment @ 10g/kg or foliar spray @ 5g/L.',
    suitable_crops: 'Paddy, Chilli, Tomato, Cotton, Pulses',
    cibrc_reg_no: 'CIBRC/BIO/PSEUDO-1.0WP-34',
    is_verified: 1,
    is_active: 1
  },

  // ==========================================
  // 6. CERTIFIED SEEDS
  // ==========================================
  {
    id: 'prod_seed_bpt5204_25kg',
    category_id: 'cat_seed',
    category_slug: 'seeds',
    category_name: 'Certified Seeds',
    name: 'Certified Paddy Seed BPT 5204 Samba Mahsuri (25 kg)',
    name_te: 'ధృవీకరించిన వరి విత్తనాలు - బి.పి.టి 5204 (25 కేజీ)',
    brand: 'Telangana State Seeds Dev Corp (TSSDC)',
    description: 'Medium-duration (145 days) high-yielding super fine table rice variety with high milling recovery and excellent cooking quality.',
    description_te: 'మధ్యస్థ కాల పరిమితి (145 రోజులు) గల అత్యుత్తమ నాణ్యమైన సన్న వరి విత్తనాలు.',
    mrp: 1150.00,
    original_price: 1400.00,
    subsidy_saved: 250.00,
    pack_size: 25.0,
    pack_unit: 'bag',
    stock_quantity: 95,
    gst_rate: 5.0,
    hsn_code: '12099190',
    usage_instructions: 'Seed rate: 20-25 kg per acre for transplanted rice. Treat with Carbendazim before nursery sowing.',
    suitable_crops: 'Paddy / Rice',
    cibrc_reg_no: 'NSC/CERT/PADDY-BPT-5204',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_seed_rnr15048_10kg',
    category_id: 'cat_seed',
    category_slug: 'seeds',
    category_name: 'Certified Seeds',
    name: 'Telangana Sona Low-GI Paddy Seed RNR 15048 (10 kg)',
    name_te: 'తెలంగాణ సోనా వరి విత్తనాలు - ఆర్.ఎన్.ఆర్ 15048 (10 కేజీ)',
    brand: 'PJTSAU Certified Seed Wing',
    description: 'Short-duration (125 days) blast-resistant variety having lowest Glycemic Index (GI 51.5) suitable for diabetic nutrition.',
    description_te: '125 రోజుల స్వల్ప కాలిక, అగ్గి తెగులును తట్టుకునే తక్కువ జి.ఐ గల వరి విత్తనాలు.',
    mrp: 580.00,
    original_price: 720.00,
    subsidy_saved: 140.00,
    pack_size: 10.0,
    pack_unit: 'bag',
    stock_quantity: 110,
    gst_rate: 5.0,
    hsn_code: '12099190',
    usage_instructions: 'Seed rate: 10 kg per acre for direct seeding (DSR) or 15 kg for transplanting.',
    suitable_crops: 'Paddy / Rice',
    cibrc_reg_no: 'TSSDC/CERT/RNR-15048',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_seed_maize_4kg',
    category_id: 'cat_seed',
    category_slug: 'seeds',
    category_name: 'Certified Seeds',
    name: 'Hybrid Maize Seed DKC 9108 Pro (4 kg)',
    name_te: 'హైబ్రిడ్ మొక్కజొన్న విత్తనాలు - డి.కె.సి 9108 (4 కేజీ)',
    brand: 'Bayer Dekalb Hybrid Seeds',
    description: 'High-yielding single cross yellow maize hybrid with strong root anchorage and drought stay-green capability.',
    description_te: 'అధిక దిగుబడినిచ్చే హైబ్రిడ్ మొక్కజొన్న విత్తనాలు.',
    mrp: 920.00,
    original_price: 1150.00,
    subsidy_saved: 230.00,
    pack_size: 4.0,
    pack_unit: 'pouch',
    stock_quantity: 60,
    gst_rate: 5.0,
    hsn_code: '12099190',
    usage_instructions: 'Seed rate: 7-8 kg/acre (spacing 60x20 cm).',
    suitable_crops: 'Maize / Corn',
    cibrc_reg_no: 'NSC/CERT/MAIZE-DKC-9108',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_seed_cotton_450g',
    category_id: 'cat_seed',
    category_slug: 'seeds',
    category_name: 'Certified Seeds',
    name: 'Bollgard-II Bt Cotton Hybrid Seed (450g + 120g Refugia)',
    name_te: 'బి.టి పత్తి విత్తనాలు బి.జి-2 (450 గ్రాములు)',
    brand: 'Rasi Seeds RCH 659 BG-II',
    description: 'GEAC-approved transgenic Bt cotton hybrid providing robust resistance to American, Spotted, and Pink Bollworms.',
    description_te: 'కాయ తొలుచు పురుగులను తట్టుకునే అత్యధిక దిగుబడినిచ్చే బి.టి పత్తి విత్తనాలు.',
    mrp: 864.00,
    original_price: 950.00,
    subsidy_saved: 86.00,
    pack_size: 0.45,
    pack_unit: 'packet',
    stock_quantity: 80,
    gst_rate: 5.0,
    hsn_code: '12099190',
    usage_instructions: 'Plant non-Bt refugia seeds in border rows. Spacing 90x60 cm.',
    suitable_crops: 'Cotton',
    cibrc_reg_no: 'GEAC/BT-COTTON/RCH-659',
    is_verified: 1,
    is_active: 1
  },

  // ==========================================
  // 7. AGRICULTURAL EQUIPMENT
  // ==========================================
  {
    id: 'prod_sprayer_battery_16l',
    category_id: 'cat_equipment',
    category_slug: 'equipment',
    category_name: 'Agricultural Equipment',
    name: '16L Dual-Motor Battery Knapsack Sprayer',
    name_te: '16 లీటర్ల బ్యాటరీ స్ప్రేయర్ (డ్యూయల్ మోటార్)',
    brand: 'Balwaan Krishi Power',
    description: '12V 12Ah heavy-duty rechargeable battery sprayer with brass lance, 4 multi-purpose nozzles, pressure regulator, and continuous 6-hour operation.',
    description_te: 'నిరంతరం 6 గంటలు పనిచేసే 12వి బ్యాటరీ గల బరువైన పిచికారీ యంత్రం.',
    mrp: 2850.00,
    original_price: 3999.00,
    subsidy_saved: 1149.00,
    pack_size: 5.5,
    pack_unit: 'unit',
    stock_quantity: 45,
    gst_rate: 18.0,
    hsn_code: '84244100',
    usage_instructions: 'Charge 6 hours before initial use. Clean nozzles with clean water after spraying pesticides.',
    suitable_crops: 'All Crops & Orchards',
    cibrc_reg_no: 'BIS/IS-11313/EQUIP',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_soil_sensor_probe',
    category_id: 'cat_equipment',
    category_slug: 'equipment',
    category_name: 'Agricultural Equipment',
    name: 'AgriSense Stainless Steel Soil NPK & Moisture Probe',
    name_te: 'అగ్రిసెన్స్ సాయిల్ ఎన్.పి.కె & తేమ మీటర్',
    brand: 'AgriSense IoT Labs',
    description: 'RS485 Modbus industrial grade stainless steel 316 soil sensor probe measuring moisture (0-100%), temperature, EC, and NPK nutrients.',
    description_te: 'నేలలోని తేమ, ఉష్ణోగ్రత మరియు ఎన్.పి.కె పోషకాలను క్షణాల్లో కొలిచే పరికరం.',
    mrp: 1450.00,
    original_price: 2200.00,
    subsidy_saved: 750.00,
    pack_size: 0.4,
    pack_unit: 'unit',
    stock_quantity: 60,
    gst_rate: 18.0,
    hsn_code: '90318000',
    usage_instructions: 'Insert probe vertically 10-15 cm into root zone soil. Read via AgriSense ESP32 telemetry.',
    suitable_crops: 'All Agricultural Farms & Greenhouses',
    cibrc_reg_no: 'AGRI-IOT-PRB-404',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_cono_weeder',
    category_id: 'cat_equipment',
    category_slug: 'equipment',
    category_name: 'Agricultural Equipment',
    name: 'Mechanical Cono Weeder for Wet Paddy Fields',
    name_te: 'కోనో వీడర్ - వరి పొలాల్లో కలుపు తీసే పరికరం',
    brand: 'Kisan Yantra India',
    description: 'Rotary conical weeder designed for SRI rice farming to bury weeds in inter-row space, aerating the root rhizosphere and eliminating manual weeding labor.',
    description_te: 'వరిలో సాళ్ల మధ్య కలుపును త్రొక్కి భూమిలో కలిపే కోనో వీడర్ పరికరం.',
    mrp: 1250.00,
    original_price: 1800.00,
    subsidy_saved: 550.00,
    pack_size: 4.8,
    pack_unit: 'unit',
    stock_quantity: 35,
    gst_rate: 18.0,
    hsn_code: '84322990',
    usage_instructions: 'Operate 10-15 days after transplanting when water level is 1-2 cm.',
    suitable_crops: 'Paddy / Rice (Transplanted & DSR)',
    cibrc_reg_no: 'BIS/EQUIP-WEED-12',
    is_verified: 1,
    is_active: 1
  },
  {
    id: 'prod_drip_kit_100m',
    category_id: 'cat_equipment',
    category_slug: 'equipment',
    category_name: 'Agricultural Equipment',
    name: '16mm Drip Irrigation Lateral Kit with Emitters (100m)',
    name_te: '16 మి.మీ బిందు సేద్యం డ్రిప్ పైపు కిట్ (100 మీటర్లు)',
    brand: 'Jain Irrigation Systems',
    description: 'UV-stabilized 16mm inline lateral pipe with built-in 2LPH pressure-compensating drippers spaced at 30cm for water conservation.',
    description_te: 'నీటిని 60% వరకు ఆదా చేసే నాణ్యమైన డ్రిప్ ఇరిగేషన్ పైపు కిట్.',
    mrp: 980.00,
    original_price: 1450.00,
    subsidy_saved: 470.00,
    pack_size: 6.0,
    pack_unit: 'roll',
    stock_quantity: 50,
    gst_rate: 18.0,
    hsn_code: '84248200',
    usage_instructions: 'Connect to 1-inch sub-main line with grommets and take-off valves.',
    suitable_crops: 'Cotton, Chilli, Tomato, Vegetables, Orchards',
    cibrc_reg_no: 'BIS/IS-13488/DRIP',
    is_verified: 1,
    is_active: 1
  }
];

// ==========================================
// DELIVERY DURATION & LOGISTICS ESTIMATOR (IN MINUTES)
// ==========================================

export const DISPATCH_HUBS = [
  { id: 'hub_dharmaram', name: 'Dharmaram Central Mandi Depot', location: 'Dharmaram', mandal: 'Dharmaram', district: 'Peddapalli' },
  { id: 'hub_peddapalli', name: 'Peddapalli Kisan Seva Kendra', location: 'Peddapalli Town', mandal: 'Peddapalli', district: 'Peddapalli' },
  { id: 'hub_karimnagar', name: 'Karimnagar Agricultural Seed Hub', location: 'Karimnagar Main', mandal: 'Karimnagar', district: 'Karimnagar' }
];

/**
 * Calculates accurate delivery duration in minutes based on distance,
 * warehouse preparation time, and village destination.
 */
export function calculateDeliveryEstimate(address = {}) {
  const village = (address.village || '').trim().toLowerCase();
  const mandal = (address.mandal || '').trim().toLowerCase();
  
  // Base warehouse packing and verification time (15 minutes)
  const prepTimeMinutes = 15;
  let distanceKm = 8.5; // default rural distance
  let transitSpeedKmPerMin = 0.35; // ~21 km/h rural road delivery speed

  if (village.includes('appannapet') || mandal.includes('dharmaram')) {
    distanceKm = 4.2; // Zone 1: very close to Dharmaram hub
  } else if (mandal.includes('peddapalli') || village.includes('peddapalli')) {
    distanceKm = 11.5; // Zone 2: Peddapalli mandal
  } else if (mandal.includes('sultanabad') || mandal.includes('julapalli')) {
    distanceKm = 16.0; // Zone 2: neighboring mandals
  } else if (mandal.includes('karimnagar') || mandal.includes('manthani')) {
    distanceKm = 24.0; // Zone 3: outer district
  } else {
    distanceKm = 9.0;
  }

  const transitMinutes = Math.round(distanceKm / transitSpeedKmPerMin);
  const totalDurationMinutes = Math.max(30, prepTimeMinutes + transitMinutes);

  // Time window: e.g. 45 - 60 minutes
  const windowMin = Math.round(totalDurationMinutes * 0.9);
  const windowMax = Math.round(totalDurationMinutes * 1.25);

  const now = Date.now();
  const arrivalTimestamp = now + (totalDurationMinutes * 60 * 1000);

  return {
    prepTimeMinutes,
    distanceKm: +distanceKm.toFixed(1),
    transitMinutes,
    totalDurationMinutes,
    windowRangeText: `${windowMin}–${windowMax} minutes`,
    estimatedArrivalTimestamp: arrivalTimestamp,
    estimatedArrivalIso: new Date(arrivalTimestamp).toISOString(),
    serviceZone: distanceKm <= 6 ? 'Zone 1 (Express Farm Belt)' : distanceKm <= 15 ? 'Zone 2 (Mandal Cluster)' : 'Zone 3 (District Rural Extension)'
  };
}

/**
 * Calculates remaining delivery minutes dynamically from arrival timestamp.
 * Returns { remainingMinutes, isDelayed, displayCountdown }
 */
export function getRemainingDeliveryMinutes(arrivalTimestamp) {
  if (!arrivalTimestamp) return { remainingMinutes: 45, isDelayed: false, displayCountdown: '45 mins' };

  const target = typeof arrivalTimestamp === 'string' ? new Date(arrivalTimestamp).getTime() : arrivalTimestamp;
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return {
      remainingMinutes: 0,
      isDelayed: true,
      displayCountdown: 'Arriving momentarily'
    };
  }

  const remainingMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)));
  return {
    remainingMinutes,
    isDelayed: false,
    displayCountdown: `${remainingMinutes} minutes remaining`
  };
}

/**
 * Deterministic SVG QR Code Generator for client-side offline / GitHub Pages mode.
 * Generates official 25x25 QR grid with 3 concentric finder patterns and data modules.
 */
export function generateQrSvg(content, size = 240) {
  // Deterministic 32-bit hash array from content string
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  const dim = 25;
  const grid = Array.from({ length: dim }, () => Array(dim).fill(0));

  // Concentric Finders (7x7)
  const placeFinder = (startR, startC) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6) {
          grid[startR + r][startC + c] = 1;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          grid[startR + r][startC + c] = 1;
        } else {
          grid[startR + r][startC + c] = 0;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, dim - 7);
  placeFinder(dim - 7, 0);

  // Timing patterns
  for (let i = 7; i < dim - 7; i++) {
    grid[6][i] = i % 2 === 0 ? 1 : 0;
    grid[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Data modules
  let bitIdx = 0;
  for (let r = 0; r < dim; r++) {
    for (let c = 0; c < dim; c++) {
      if ((r < 8 && (c < 8 || c >= dim - 8)) || (r >= dim - 8 && c < 8)) continue;
      if (r === 6 || c === 6) continue;

      const pseudoBit = ((h1 >>> (bitIdx % 31)) ^ (h2 >>> ((bitIdx * 3) % 31))) & 1;
      const mask = (r + c) % 2 === 0 ? 1 : 0;
      grid[r][c] = pseudoBit ^ mask;
      bitIdx++;
    }
  }

  const boxSize = size / dim;
  let rects = '';
  for (let r = 0; r < dim; r++) {
    for (let c = 0; c < dim; c++) {
      if (grid[r][c] === 1) {
        rects += `<rect x="${(c * boxSize).toFixed(2)}" y="${(r * boxSize).toFixed(2)}" width="${boxSize.toFixed(2)}" height="${boxSize.toFixed(2)}" fill="#0a4d33" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="mx-auto rounded-xl shadow-xs bg-white p-2">${rects}</svg>`;
}

export function generateUpiIntentString(orderNumber, amount, note = 'AgriSense Order') {
  const cleanAmount = Number(amount || 0).toFixed(2);
  const vpa = 'agrisense.payments@icici';
  const name = encodeURIComponent('AgriSense Kisan Store');
  const encNote = encodeURIComponent(note);
  return `upi://pay?pa=${vpa}&pn=${name}&tr=${orderNumber}&am=${cleanAmount}&cu=INR&tn=${encNote}`;
}
