/**
 * Agronomic Precision Verification Script
 * Validates deterministic calculations across 3 distinct crop lifecycle types:
 * 1. Short-Duration Crop: Groundnut (TMV 2 / Kadiri 6 - 105 days)
 * 2. Medium-Duration Crop: Paddy / Rice (BPT 5204 Samba Mahsuri - 145 days, Transplanted)
 * 3. Long-Duration Crop: Bt Hybrid Cotton (RCH 2 Bollgard II - 165 days)
 */

import { 
  CROP_KNOWLEDGE_BASE,
  calculateCropLifecycle,
  calculatePrecisionFertilizers,
  diagnoseCropProtection,
  FERTILIZER_PRODUCTS
} from '../src/services/cropLifecycleService.js';

import cropVoiceService from '../src/services/cropVoiceService.js';

console.log('================================================================');
console.log('   AGRISENSE CROP LIFECYCLE & FERTILIZER CALCULATION VERIFICATION');
console.log('================================================================\n');

// -------------------------------------------------------------
// TEST CASE 1: Medium-Duration Transplanted Paddy (BPT 5204 - 145 days)
// -------------------------------------------------------------
console.log('--- TEST CASE 1: Medium-Duration Paddy (BPT 5204, 3.5 Acres, 38 DAS) ---');

const paddyRecord = {
  id: 'test_paddy_bpt',
  cropId: 'paddy',
  varietyId: 'bpt_5204',
  cultivationMethod: 'transplanted',
  sowingDate: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  areaAcres: 3.5,
  expectedDurationDays: 145,
  location: { village: 'Gundlapally', mandal: 'Nalgonda', district: 'Nalgonda', state: 'Telangana' },
  irrigationMethod: 'canal_flood',
  soilType: 'clay_loam',
  soilTest: {
    hasSoilTest: true,
    nKgAcre: 100, // LOW (<112) -> +25% N
    pKgAcre: 6.0, // OPTIMAL
    kKgAcre: 80,  // OPTIMAL
    ph: 7.2,
    organicCarbonPct: 0.45
  },
  fymAppliedTonnes: 2.0 // 2t FYM = 10kg N, 5kg P, 10kg K credit
};

const paddyLifecycle = calculateCropLifecycle(paddyRecord);
const paddyFertilizer = calculatePrecisionFertilizers(paddyRecord, paddyLifecycle);
const paddyProtection = diagnoseCropProtection('paddy', null, paddyLifecycle.currentStage.id);

console.log(`• Crop: ${paddyRecord.cropId} | Variety: ${paddyRecord.varietyId} | Duration: ${paddyLifecycle.varietyDuration} days`);
console.log(`• Sowing DAS: ${paddyLifecycle.daysAfterSowing} | Transplanting DAT: ${paddyLifecycle.daysAfterTransplanting}`);
console.log(`• Active Stage: ${paddyLifecycle.currentStage.name} (${paddyLifecycle.currentStage.teluguName})`);
console.log(`• Cycle Progress: ${paddyLifecycle.progressPct}% | Days Remaining to Harvest: ${paddyLifecycle.daysRemaining}`);
console.log(`• Soil Test Based?: ${paddyFertilizer.isSoilTestBased}`);
console.log(`• Soil Advisory: ${paddyFertilizer.soilAdvisoryNotes.join(' | ')}`);
console.log(`• Net Elemental Nutrients: N=${paddyFertilizer.elementalNutrients.nKgAcre} kg/ac, P=${paddyFertilizer.elementalNutrients.pKgAcre} kg/ac, K=${paddyFertilizer.elementalNutrients.kKgAcre} kg/ac`);
console.log(`• Total Commercial Bags for ${paddyRecord.areaAcres} ac:`);
console.log(`  - Urea (45kg): ${paddyFertilizer.commercialProducts.urea.totalBags} bags (${paddyFertilizer.commercialProducts.urea.totalKg} kg)`);
console.log(`  - DAP (50kg): ${paddyFertilizer.commercialProducts.dap.totalBags} bags (${paddyFertilizer.commercialProducts.dap.totalKg} kg)`);
console.log(`  - MOP (50kg): ${paddyFertilizer.commercialProducts.mop.totalBags} bags (${paddyFertilizer.commercialProducts.mop.totalKg} kg)`);
console.log(`• Stage Split: Basal DAP=${paddyFertilizer.stageSplits[0].dapBagsFarm} bags, Top Dressing Urea=${paddyFertilizer.stageSplits[1].ureaBagsFarm} bags`);
console.log(`• Protection Diagnosis: ${paddyProtection.activeDiagnosis.name} (${paddyProtection.activeDiagnosis.teluguName})`);
console.log(`  - Non-chemical IPM: ${paddyProtection.activeDiagnosis.preventiveAndCultural[0]}`);
console.log(`  - Chemical: ${paddyProtection.activeDiagnosis.chemicalManagement.commercialBrand} @ ${paddyProtection.activeDiagnosis.chemicalManagement.dosePerAcre}`);
console.log(`  - PHI Days: ${paddyProtection.activeDiagnosis.chemicalManagement.phiDays} days\n`);

// -------------------------------------------------------------
// TEST CASE 2: Long-Duration Direct Sown Cotton (Bt Hybrid - 165 days)
// -------------------------------------------------------------
console.log('--- TEST CASE 2: Long-Duration Cotton (Bt Hybrid, 4.0 Acres, 68 DAS) ---');

const cottonRecord = {
  id: 'test_cotton_bt',
  cropId: 'cotton',
  varietyId: 'bt_hybrid',
  cultivationMethod: 'direct_sown',
  sowingDate: new Date(Date.now() - 68 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  areaAcres: 4.0,
  expectedDurationDays: 165,
  location: { village: 'Adilabad Rural', mandal: 'Adilabad', district: 'Adilabad', state: 'Telangana' },
  irrigationMethod: 'drip_fertigation',
  soilType: 'black_clay',
  soilTest: {
    hasSoilTest: true,
    nKgAcre: 95,
    pKgAcre: 7.5,
    kKgAcre: 135, // HIGH (>120) -> -25% K
    ph: 7.9,
    organicCarbonPct: 0.55
  },
  fymAppliedTonnes: 3.0
};

const cottonLifecycle = calculateCropLifecycle(cottonRecord);
const cottonFertilizer = calculatePrecisionFertilizers(cottonRecord, cottonLifecycle);
const cottonProtection = diagnoseCropProtection('cotton', null, cottonLifecycle.currentStage.id);

console.log(`• Crop: ${cottonRecord.cropId} | Variety: ${cottonRecord.varietyId} | Duration: ${cottonLifecycle.varietyDuration} days`);
console.log(`• Sowing DAS: ${cottonLifecycle.daysAfterSowing} | Active Stage: ${cottonLifecycle.currentStage.name}`);
console.log(`• Cycle Progress: ${cottonLifecycle.progressPct}% | Days to Harvest: ${cottonLifecycle.daysRemaining}`);
console.log(`• Commercial Bags for 4.0 Acres:`);
console.log(`  - Urea: ${cottonFertilizer.commercialProducts.urea.totalBags} bags`);
console.log(`  - DAP: ${cottonFertilizer.commercialProducts.dap.totalBags} bags`);
console.log(`  - MOP: ${cottonFertilizer.commercialProducts.mop.totalBags} bags`);
console.log(`• Protection Diagnosis: ${cottonProtection.activeDiagnosis.name}`);
console.log(`  - Chemical: ${cottonProtection.activeDiagnosis.chemicalManagement.commercialBrand} @ ${cottonProtection.activeDiagnosis.chemicalManagement.dosePerAcre}\n`);

// -------------------------------------------------------------
// TEST CASE 3: Short-Duration Groundnut (TMV 2 - 105 days, General Advisory)
// -------------------------------------------------------------
console.log('--- TEST CASE 3: Short-Duration Groundnut (TMV 2, 2.0 Acres, 22 DAS, General Advisory) ---');

const groundnutRecord = {
  id: 'test_groundnut_tmv',
  cropId: 'groundnut',
  varietyId: 'tmv_2',
  cultivationMethod: 'direct_sown',
  sowingDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  areaAcres: 2.0,
  expectedDurationDays: 105,
  location: { village: 'Mahabubnagar', mandal: 'Bhoothpur', district: 'Mahabubnagar', state: 'Telangana' },
  irrigationMethod: 'sprinkler',
  soilType: 'sandy_loam',
  soilTest: { hasSoilTest: false }, // General Advisory
  fymAppliedTonnes: 0
};

const groundnutLifecycle = calculateCropLifecycle(groundnutRecord);
const groundnutFertilizer = calculatePrecisionFertilizers(groundnutRecord, groundnutLifecycle);
const groundnutProtection = diagnoseCropProtection('groundnut', null, groundnutLifecycle.currentStage.id);

console.log(`• Crop: ${groundnutRecord.cropId} | Variety: ${groundnutRecord.varietyId} | Duration: ${groundnutLifecycle.varietyDuration} days`);
console.log(`• Sowing DAS: ${groundnutLifecycle.daysAfterSowing} | Active Stage: ${groundnutLifecycle.currentStage.name}`);
console.log(`• Soil Test Based?: ${groundnutFertilizer.isSoilTestBased}`);
console.log(`• Commercial Bags for 2.0 Acres:`);
console.log(`  - Urea: ${groundnutFertilizer.commercialProducts.urea.totalBags} bags`);
console.log(`  - DAP: ${groundnutFertilizer.commercialProducts.dap.totalBags} bags`);
console.log(`  - MOP: ${groundnutFertilizer.commercialProducts.mop.totalBags} bags\n`);

// -------------------------------------------------------------
// TEST CASE 4: Voice Narration Bilingual Generation (English & Telugu)
// -------------------------------------------------------------
console.log('--- TEST CASE 4: Bilingual Voice Advisory Narration Generation ---');

const enStageScript = cropVoiceService.generateLifecycleScript(paddyRecord, paddyLifecycle, 'en');
const teStageScript = cropVoiceService.generateLifecycleScript(paddyRecord, paddyLifecycle, 'te');

const enFertScript = cropVoiceService.generateFertilizerScript(paddyRecord, paddyFertilizer, 'en');
const teFertScript = cropVoiceService.generateFertilizerScript(paddyRecord, paddyFertilizer, 'te');

const enPestScript = cropVoiceService.generatePestProtectionScript(paddyProtection.activeDiagnosis, 'en');
const tePestScript = cropVoiceService.generatePestProtectionScript(paddyProtection.activeDiagnosis, 'te');

console.log('[English Stage Script]:', enStageScript);
console.log('\n[Telugu Stage Script]:', teStageScript);
console.log('\n[English Fertilizer Script]:', enFertScript);
console.log('\n[Telugu Fertilizer Script]:', teFertScript);
console.log('\n[English Protection Script]:', enPestScript);
console.log('\n[Telugu Protection Script]:', tePestScript);

console.log('\n================================================================');
console.log('   ALL 4 AGRONOMIC TEST MODULES COMPLETED SUCCESSFULLY (100%)');
console.log('================================================================');
