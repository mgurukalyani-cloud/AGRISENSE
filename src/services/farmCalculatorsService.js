/**
 * AgriSense Comprehensive Farm Calculators Service
 * 
 * Includes all 7 required agricultural calculators:
 * 1. Land Area Calculator (multi-unit Indian regional conversion)
 * 2. Seed Requirement Calculator (scientific plant population & germination adjustment)
 * 3. Fertilizer Dose Calculator (bags of Urea, DAP, MOP, SSP)
 * 4. Irrigation Water Calculator (liters, cubic meters, pump run hours, drip savings)
 * 5. Crop Investment & Cultivation Budgeting Calculator (itemized input costs)
 * 6. Yield Calculator (genetic potential, agro-climate, water factor)
 * 7. Profit & Margin Calculator (Gross revenue, Net profit, ROI %)
 */

// 1. LAND AREA CONVERSIONS
export const LAND_UNITS = [
  { id: 'acre', name: 'Acre (ఎకరం / एकड़)', toAcre: 1 },
  { id: 'guntha', name: 'Guntha / Gunta (గుంట / गुंठा)', toAcre: 1 / 40 }, // 1 Acre = 40 Guntas
  { id: 'bigha_pucca', name: 'Bigha - Pucca (पक्का बीघा)', toAcre: 0.625 }, // Standard northern Bigha (approx 0.625 acre)
  { id: 'bigha_kuchha', name: 'Bigha - Kuchha (कच्चा बीघा)', toAcre: 0.2083 }, // 1/3 of pucca bigha
  { id: 'hectare', name: 'Hectare (హెక్టారు / हेक्टेयर)', toAcre: 2.47105 }, // 1 Hectare = 2.471 Acres
  { id: 'cent', name: 'Cent (సెంట్ / सेंट)', toAcre: 1 / 100 }, // 1 Acre = 100 Cents
  { id: 'sq_yard', name: 'Square Yards / Gaj (గజాలు / गज)', toAcre: 1 / 4840 }, // 1 Acre = 4840 Sq Yards
  { id: 'sq_meter', name: 'Square Meters (చదరపు మీటర్లు / वर्ग मीटर)', toAcre: 1 / 4046.86 }
];

export function convertLandArea(value, fromUnitId) {
  const num = parseFloat(value) || 0;
  const unit = LAND_UNITS.find(u => u.id === fromUnitId) || LAND_UNITS[0];
  const acreValue = num * unit.toAcre;

  return LAND_UNITS.map(targetUnit => ({
    id: targetUnit.id,
    name: targetUnit.name,
    value: (acreValue / targetUnit.toAcre).toFixed(3)
  }));
}

// 2. SEED REQUIREMENT CALCULATOR
export const SEED_RATE_STANDARDS = {
  wheat: { defaultKgPerAcre: 42, defaultSpacingCm: '20 x 5 cm', seedWeight1000g: 40, germinationDefault: 90 },
  paddy_rice: { defaultKgPerAcre: 15, defaultSpacingCm: '20 x 15 cm (transplanted)', seedWeight1000g: 25, germinationDefault: 85 },
  cotton: { defaultKgPerAcre: 1.8, defaultSpacingCm: '90 x 60 cm', seedWeight1000g: 90, germinationDefault: 80 }, // Bt Cotton packets
  chilli: { defaultKgPerAcre: 0.25, defaultSpacingCm: '60 x 45 cm', seedWeight1000g: 5, germinationDefault: 80 }, // nursery seedlings
  mustard: { defaultKgPerAcre: 2.0, defaultSpacingCm: '30 x 10 cm', seedWeight1000g: 4, germinationDefault: 85 },
  gram_chickpea: { defaultKgPerAcre: 30, defaultSpacingCm: '30 x 10 cm', seedWeight1000g: 220, germinationDefault: 90 },
  maize: { defaultKgPerAcre: 8, defaultSpacingCm: '60 x 20 cm', seedWeight1000g: 280, germinationDefault: 90 },
  soybean: { defaultKgPerAcre: 30, defaultSpacingCm: '45 x 5 cm', seedWeight1000g: 130, germinationDefault: 80 },
  groundnut: { defaultKgPerAcre: 45, defaultSpacingCm: '30 x 10 cm', seedWeight1000g: 450, germinationDefault: 85 },
  onion: { defaultKgPerAcre: 4.0, defaultSpacingCm: '15 x 10 cm', seedWeight1000g: 3.5, germinationDefault: 80 },
  tomato: { defaultKgPerAcre: 0.15, defaultSpacingCm: '60 x 45 cm', seedWeight1000g: 3.0, germinationDefault: 85 },
  potato: { defaultKgPerAcre: 1000, defaultSpacingCm: '60 x 20 cm', seedWeight1000g: 45000, germinationDefault: 95 }, // seed tubers
  pigeonpea_redgram: { defaultKgPerAcre: 5.0, defaultSpacingCm: '90 x 20 cm', seedWeight1000g: 110, germinationDefault: 85 },
  green_gram: { defaultKgPerAcre: 8.0, defaultSpacingCm: '30 x 10 cm', seedWeight1000g: 40, germinationDefault: 85 },
  pearl_millet: { defaultKgPerAcre: 2.0, defaultSpacingCm: '45 x 12 cm', seedWeight1000g: 8, germinationDefault: 85 },
  sugarcane: { defaultKgPerAcre: 3000, defaultSpacingCm: '90 cm furrow', seedWeight1000g: 50000, germinationDefault: 90 }
};

export function calculateSeedRequirement({ cropId, acreage = 1, germinationPct = 85, customSeedRate = null }) {
  const std = SEED_RATE_STANDARDS[cropId] || SEED_RATE_STANDARDS['wheat'];
  const acres = Math.max(0.25, parseFloat(acreage) || 1);
  const germ = Math.max(50, Math.min(100, parseFloat(germinationPct) || std.germinationDefault));
  
  const baseRate = customSeedRate ? parseFloat(customSeedRate) : std.defaultKgPerAcre;
  // Adjust rate if germination is below 85%
  const adjustedRate = (baseRate * (85 / germ));
  const totalKg = Math.round(adjustedRate * acres * 10) / 10;

  return {
    cropId,
    acres,
    seedRateKgPerAcre: adjustedRate.toFixed(1),
    totalSeedRequiredKg: totalKg,
    recommendedSpacing: std.defaultSpacingCm,
    germinationUsed: `${germ}%`,
    note: germ < 80 ? 'Warning: Low germination reported. Seed rate has been automatically adjusted higher to ensure optimal plant population.' : 'Standard recommended plant population guaranteed.'
  };
}

// 3. FERTILIZER CALCULATOR (FAST STANDARDS)
export function calculateFertilizerQuick(cropId, acreage = 1) {
  const acres = Math.max(0.25, parseFloat(acreage) || 1);
  // Default bag requirements per acre
  const BAGS_PER_ACRE = {
    wheat: { urea: 2.5, dap: 1.1, mop: 0.5 },
    paddy_rice: { urea: 2.2, dap: 1.0, mop: 0.7 },
    cotton: { urea: 3.0, dap: 1.3, mop: 1.0 },
    chilli: { urea: 3.5, dap: 1.5, mop: 1.2 },
    mustard: { urea: 1.8, dap: 0.8, mop: 0.4 },
    gram_chickpea: { urea: 0.5, dap: 0.9, mop: 0.3 },
    maize: { urea: 2.7, dap: 1.1, mop: 0.7 },
    soybean: { urea: 0.6, dap: 1.1, mop: 0.5 },
    groundnut: { urea: 0.5, dap: 0.9, mop: 0.7 },
    onion: { urea: 2.0, dap: 0.9, mop: 1.0 },
    tomato: { urea: 3.0, dap: 1.3, mop: 1.0 },
    potato: { urea: 3.5, dap: 1.8, mop: 1.7 },
    pigeonpea_redgram: { urea: 0.5, dap: 0.9, mop: 0.3 },
    green_gram: { urea: 0.4, dap: 0.8, mop: 0.3 },
    pearl_millet: { urea: 1.7, dap: 0.8, mop: 0.4 },
    sugarcane: { urea: 5.0, dap: 2.0, mop: 1.5 }
  };

  const b = BAGS_PER_ACRE[cropId] || BAGS_PER_ACRE['wheat'];
  const ureaBags = Math.round(b.urea * acres * 10) / 10;
  const dapBags = Math.round(b.dap * acres * 10) / 10;
  const mopBags = Math.round(b.mop * acres * 10) / 10;

  const cost = Math.round((ureaBags * 266) + (dapBags * 1350) + (mopBags * 1650));

  return {
    cropId,
    acres,
    ureaBags,
    dapBags,
    mopBags,
    totalBags: Math.round((ureaBags + dapBags + mopBags) * 10) / 10,
    estimatedCost: cost
  };
}

// 4. IRRIGATION WATER CALCULATOR
export function calculateIrrigationWater({
  acreage = 1,
  soilType = 'alluvial_loam',
  irrigationMethod = 'drip',
  pumpHorsePower = 5
}) {
  const acres = Math.max(0.25, parseFloat(acreage) || 1);
  const hp = parseFloat(pumpHorsePower) || 5;

  // 1 acre-inch of water = 102,790 liters (~102.8 cubic meters)
  // Standard crop watering depth: 50mm (~2 inches) for flood, 20mm for drip
  const depthMm = irrigationMethod === 'drip' ? 20 : irrigationMethod === 'sprinkler' ? 32 : 50;
  const litersPerAcre = depthMm * 4046.86; // 1 mm on 1 m2 = 1 liter; 1 acre = 4046.86 m2
  const totalLiters = Math.round(litersPerAcre * acres);
  const cubicMeters = Math.round(totalLiters / 1000);

  // Pump discharge capacity: 5 HP motor typically yields ~600 liters/minute (36,000 liters/hour)
  const dischargeLitersPerHour = hp * 7200;
  const pumpingHoursRequired = (totalLiters / dischargeLitersPerHour).toFixed(1);

  // Water savings vs traditional flood irrigation
  const floodLiters = 50 * 4046.86 * acres;
  const savingsPct = irrigationMethod === 'drip' ? 60 : irrigationMethod === 'sprinkler' ? 36 : 0;
  const waterSavedLiters = Math.round(floodLiters - totalLiters);

  return {
    acres,
    irrigationMethod,
    totalWaterLiters: totalLiters.toLocaleString('en-IN'),
    totalCubicMeters: cubicMeters,
    pumpingHoursRequired: `${pumpingHoursRequired} Hours`,
    pumpDischarge: `${dischargeLitersPerHour.toLocaleString('en-IN')} L/hr (${hp} HP)`,
    waterSavingsPct: `${savingsPct}%`,
    waterSavedLiters: waterSavedLiters > 0 ? waterSavedLiters.toLocaleString('en-IN') : '0',
    energyTip: irrigationMethod === 'drip' 
      ? 'Drip system operates at 1.5 - 2.0 bar pressure. Running in early morning reduces evaporative losses by 18%.'
      : 'Flood irrigation loses ~40% to deep percolation and evaporation. Switching to drip saves pumping electricity.'
  };
}

// 5. CROP INVESTMENT & BUDGETING CALCULATOR
export function calculateCropInvestment({
  cropId,
  acreage = 1,
  landPrepCost = 2800,
  seedsCost = 1500,
  fertilizersCost = 3500,
  cropProtectionCost = 2200,
  laborCost = 4500,
  irrigationEnergyCost = 1800,
  harvestingBaggingCost = 3200
}) {
  const acres = Math.max(0.25, parseFloat(acreage) || 1);

  const prep = parseFloat(landPrepCost) * acres;
  const seed = parseFloat(seedsCost) * acres;
  const fert = parseFloat(fertilizersCost) * acres;
  const prot = parseFloat(cropProtectionCost) * acres;
  const lab = parseFloat(laborCost) * acres;
  const irr = parseFloat(irrigationEnergyCost) * acres;
  const harv = parseFloat(harvestingBaggingCost) * acres;

  const totalCost = Math.round(prep + seed + fert + prot + lab + irr + harv);
  const costPerAcre = Math.round(totalCost / acres);

  const breakdown = [
    { item: 'Land Preparation & Tillage', cost: prep, pct: ((prep / totalCost) * 100).toFixed(1) },
    { item: 'Certified Seeds & Nursery', cost: seed, pct: ((seed / totalCost) * 100).toFixed(1) },
    { item: 'Fertilizers & Soil Amendments', cost: fert, pct: ((fert / totalCost) * 100).toFixed(1) },
    { item: 'Pesticides, Bio-agents & Sprays', cost: prot, pct: ((prot / totalCost) * 100).toFixed(1) },
    { item: 'Manual & Tractor Labor', cost: lab, pct: ((lab / totalCost) * 100).toFixed(1) },
    { item: 'Irrigation Pumping & Electricity', cost: irr, pct: ((irr / totalCost) * 100).toFixed(1) },
    { item: 'Harvesting, Threshing & Transport', cost: harv, pct: ((harv / totalCost) * 100).toFixed(1) }
  ];

  return {
    cropId,
    acres,
    totalInvestment: totalCost,
    costPerAcre,
    breakdown
  };
}

// 6. EXPECTED YIELD CALCULATOR
export function calculateExpectedYield({
  cropId,
  acreage = 1,
  varietyType = 'hybrid', // 'hybrid' | 'improved' | 'traditional'
  irrigationStatus = 'optimal', // 'optimal' | 'moderate' | 'rainfed'
  managementFactor = 1.0 // 0.8 to 1.2
}) {
  const acres = Math.max(0.25, parseFloat(acreage) || 1);

  // Baseline yield per acre in Quintals (1 Quintal = 100 kg)
  const BASE_YIELDS = {
    wheat: { min: 18, avg: 22, max: 26 },
    paddy_rice: { min: 22, avg: 28, max: 34 },
    cotton: { min: 8, avg: 12, max: 15 },
    chilli: { min: 14, avg: 18, max: 24 },
    mustard: { min: 7, avg: 9, max: 12 },
    gram_chickpea: { min: 7, avg: 9.5, max: 12 },
    maize: { min: 25, avg: 32, max: 40 },
    soybean: { min: 8, avg: 11, max: 14 },
    groundnut: { min: 9, avg: 12, max: 16 },
    onion: { min: 90, avg: 120, max: 150 },
    tomato: { min: 120, avg: 160, max: 210 },
    potato: { min: 100, avg: 135, max: 170 },
    pigeonpea_redgram: { min: 6, avg: 8, max: 11 },
    green_gram: { min: 4, avg: 5.5, max: 7.5 },
    pearl_millet: { min: 11, avg: 14, max: 18 },
    sugarcane: { min: 320, avg: 380, max: 450 }
  };

  const b = BASE_YIELDS[cropId] || BASE_YIELDS['wheat'];

  let multiplier = 1.0;
  if (varietyType === 'hybrid') multiplier *= 1.15;
  else if (varietyType === 'traditional') multiplier *= 0.85;

  if (irrigationStatus === 'optimal') multiplier *= 1.10;
  else if (irrigationStatus === 'rainfed') multiplier *= 0.75;

  multiplier *= parseFloat(managementFactor) || 1.0;

  const minQtl = Math.round(b.min * multiplier * acres * 10) / 10;
  const avgQtl = Math.round(b.avg * multiplier * acres * 10) / 10;
  const maxQtl = Math.round(b.max * multiplier * acres * 10) / 10;

  return {
    cropId,
    acres,
    minYieldQuintals: minQtl,
    avgYieldQuintals: avgQtl,
    maxYieldQuintals: maxQtl,
    avgYieldMetricTons: (avgQtl / 10).toFixed(2),
    avgYieldPerAcre: (avgQtl / acres).toFixed(1),
    confidenceNote: 'Yield estimates are calculated based on ICAR field trial baselines adjusted for your irrigation and hybrid vigor selection.'
  };
}

// 7. PROFIT & MARGIN CALCULATOR
export function calculateProfitAndMargin({
  yieldQuintals,
  mandiPricePerQuintal,
  totalCultivationCost,
  acreage = 1
}) {
  const yieldQtl = parseFloat(yieldQuintals) || 0;
  const price = parseFloat(mandiPricePerQuintal) || 0;
  const cost = parseFloat(totalCultivationCost) || 0;
  const acres = Math.max(0.25, parseFloat(acreage) || 1);

  const grossRevenue = Math.round(yieldQtl * price);
  const netProfit = Math.round(grossRevenue - cost);
  const profitPerAcre = Math.round(netProfit / acres);
  const roiPct = cost > 0 ? ((netProfit / cost) * 100).toFixed(1) : '0';
  const costPerQuintal = yieldQtl > 0 ? Math.round(cost / yieldQtl) : 0;
  const profitMarginPct = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0';

  return {
    grossRevenue,
    totalCost: cost,
    netProfit,
    profitPerAcre,
    roiPct: `${roiPct}%`,
    profitMarginPct: `${profitMarginPct}%`,
    costPerQuintal,
    isProfitable: netProfit > 0,
    summary: netProfit > 0
      ? `Net profit of ₹${netProfit.toLocaleString('en-IN')} (₹${profitPerAcre.toLocaleString('en-IN')}/acre) with an ROI of ${roiPct}%.`
      : `Cultivation cost exceeds revenue by ₹${Math.abs(netProfit).toLocaleString('en-IN')}. Consider reducing input costs or waiting for higher mandi price realization.`
  };
}
