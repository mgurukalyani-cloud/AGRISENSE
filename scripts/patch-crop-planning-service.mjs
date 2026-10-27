import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/services/cropPlanningService.js');
let content = fs.readFileSync(filePath, 'utf8');

const cropImageMap = {
  wheat: {
    imageUrl: './crops/wheat.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Golden wheat crop ear heads ready for harvest'
  },
  mustard: {
    imageUrl: './crops/mustard.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1508784411316-02b8cd4d3a3a?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Vibrant yellow flowering mustard crop in farm field'
  },
  gram_chickpea: {
    imageUrl: './crops/gram_chickpea.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Chickpea chana pods and foliage'
  },
  cotton: {
    imageUrl: './crops/cotton.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Fluffy white cotton bolls on cotton plant'
  },
  paddy_rice: {
    imageUrl: './crops/paddy_rice.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Lush green wetland paddy rice field'
  },
  maize: {
    imageUrl: './crops/maize.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Ripe golden maize corn cob on stalk'
  },
  soybean: {
    imageUrl: './crops/soybean.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Green soybean pods developing on agricultural plant'
  },
  pigeonpea_redgram: {
    imageUrl: './crops/pigeonpea_redgram.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Red gram arhar pigeonpea pods and crop'
  },
  groundnut: {
    imageUrl: './crops/groundnut.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1587334274328-64186a80aeee?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Harvested groundnut pods in shell'
  },
  green_gram: {
    imageUrl: './crops/green_gram.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Green gram moong pulse crop'
  },
  pearl_millet: {
    imageUrl: './crops/pearl_millet.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Pearl millet bajra earhead in dryland field'
  },
  tomato: {
    imageUrl: './crops/tomato.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Clusters of red ripe tomatoes on vine'
  },
  potato: {
    imageUrl: './crops/potato.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Freshly harvested potatoes in farm soil'
  },
  onion: {
    imageUrl: './crops/onion.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Red onions harvested in agricultural field'
  },
  sugarcane: {
    imageUrl: './crops/sugarcane.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Tall green sugarcane crop stalks'
  },
  chilli: {
    imageUrl: './crops/chilli.jpg',
    fallbackImageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Hot red and green chillies on bush'
  }
};

// Inject imageUrl and fallbackImageUrl into each crop in CROPS_DATABASE
for (const [id, meta] of Object.entries(cropImageMap)) {
  const targetStr = `id: '${id}',`;
  if (content.includes(targetStr)) {
    const replacementStr = `id: '${id}',\n    imageUrl: '${meta.imageUrl}',\n    fallbackImageUrl: '${meta.fallbackImageUrl}',\n    imageAlt: '${meta.imageAlt}',`;
    // Only replace first occurrence if not already present
    if (!content.includes(`imageUrl: '${meta.imageUrl}'`)) {
      content = content.replace(targetStr, replacementStr);
    }
  }
}

// Now replace recommendCrops scoring and suitability logic
const oldRecommendCropsRegex = /export function recommendCrops\(farmerProfile, currentWeatherData = null\) \{[\s\S]*?\n\}/;

const newRecommendCrops = `export function recommendCrops(farmerProfile, currentWeatherData = null) {
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
        \`Off-Season Photoperiod: \${crop.name} is a \${crop.season.toUpperCase()} crop (sowing: \${crop.sowingMonths.join(', ')}). Sowing during \${season.toUpperCase()} (\${sowingMonth}) disrupts photoperiod, causing premature heading or complete floral sterility.\`
      );
    }

    if (thermalStress) {
      unsuitableReasons.push(
        \`Severe Heat Stress (\${currentTemp.toFixed(1)}°C): Ambient heat exceeds the 25°C germination ceiling for \${crop.name}, causing rapid seed desiccation and thermal shock.\`
      );
    }

    if (chillingStress) {
      unsuitableReasons.push(
        \`Chilling Injury Risk: Temperatures below 15°C severely impede vegetative elongation and cause spikelet drop in tropical \${crop.name}.\`
      );
    }

    // Reason 2: Severe Water Deficit / Drought Risk
    if (severeWaterDeficit) {
      isSuitable = false;
      unsuitableReasons.push(
        \`Severe Water Inadequacy: \${crop.name} requires \${crop.waterRequirementMm} of assured standing water. Rain-fed / dryland cultivation without dedicated canal or tube-well irrigation carries catastrophic risk of drought failure (>85% yield reduction).\`
      );
    } else if (isRainfed && crop.waterRequirementLevel === 'Medium' && season === 'zaid') {
      unsuitableReasons.push(
        \`Summer Evapotranspiration Deficit: Dryland moisture retention in summer (Zaid) is insufficient to support \${crop.name} through flowering without supplemental irrigation.\`
      );
    }

    // Reason 3: Soil Structure & Drainage Compaction
    if (!isSoilMatch) {
      if (soilType === 'clay_loam' && (crop.id === 'potato' || crop.id === 'groundnut' || crop.id === 'cotton')) {
        isSuitable = false;
        unsuitableReasons.push(
          \`Waterlogging & Soil Compaction: Heavy clay soil retains excessive moisture, causing root rot and physical impedance to underground \${crop.id === 'potato' ? 'tuber' : crop.id === 'groundnut' ? 'pod pegging' : 'taproot'} development.\`
        );
      } else if (soilType === 'sandy_loam' && crop.waterRequirementLevel === 'High') {
        unsuitableReasons.push(
          \`Excessive Water Percolation: Sandy loam drains rapidly, making it difficult to maintain the continuous saturation needed by \${crop.name}.\`
        );
      } else {
        unsuitableReasons.push(
          \`Sub-optimal Soil Texture: \${getSoilName(soilType)} does not provide the ideal physical structure or aeration required by \${crop.name}.\`
        );
      }
    }

    // Reason 4: Soil pH Disparity
    if (severePhMismatch) {
      isSuitable = false;
      unsuitableReasons.push(
        \`Severe Nutrient Lockout (pH \${soilPh}): \${crop.name} thrives in pH \${phMin} - \${phMax}. Current pH causes phosphorus and zinc fixation, leading to acute chlorosis.\`
      );
    } else if (phMismatch) {
      unsuitableReasons.push(
        \`Marginal Soil pH (pH \${soilPh}): Outside optimal range (\${phMin} - \${phMax}); requires soil buffering.\`
      );
    }

    // Reason 5: Financial / Working Capital Shortfall
    if (budgetDeficit) {
      const deficit = baselineCostPerAcre - budgetPerAcre;
      unsuitableReasons.push(
        \`Working Capital Gap: Estimated cost (₹\${baselineCostPerAcre.toLocaleString()}/acre) exceeds your operational budget by ₹\${deficit.toLocaleString()}/acre, risking inability to purchase certified seed, basal fertilizers, or pest protection.\`
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
        disqualificationSummary = \`Off-season \${crop.season.toUpperCase()} crop; high thermal & photoperiod risk\`;
        mitigationAdvice = \`Wait for verified \${crop.season.toUpperCase()} sowing (\${crop.sowingMonths.join('/')}), or consider season-adapted alternatives: \${(crop.alternativeResilientCrops || []).map(c => c.replace(/_/g, ' ')).join(', ')}.\`;
      } else if (severeWaterDeficit) {
        disqualificationSummary = \`High water requirement (\${crop.waterRequirementMm}) unviable for rainfed dryland\`;
        mitigationAdvice = \`Do not sow without assured tube-well / drip irrigation, or switch to drought-hardy millets / pulses.\`;
      } else if (severePhMismatch) {
        disqualificationSummary = \`Soil pH \${soilPh} outside acceptable range (\${phMin} - \${phMax})\`;
        mitigationAdvice = \`Apply gypsum / agricultural lime to adjust pH before planting.\`;
      } else {
        disqualificationSummary = \`Incompatible with current soil texture or climatic conditions\`;
        mitigationAdvice = \`Adopt raised beds, organic mulching, and certified resilient varieties.\`;
      }
    }

    // Generate Explanatory Human Justification for Recommended Crops
    const reasons = [];
    if (isSuitable) {
      if (seasonScore >= 80) reasons.push(\`Matches optimal \${season.toUpperCase()} sowing calendar (\${sowingMonth})\`);
      if (crop.suitableSoils.includes(soilType)) reasons.push(\`Naturally suited to \${getSoilName(soilType)} with optimal root penetration\`);
      if (isRainfed && crop.waterRequirementLevel === 'Low') reasons.push(\`Low moisture footprint (\${crop.waterRequirementMm}) resilient to dryland conditions\`);
      if (!isRainfed && crop.waterRequirementLevel === 'High') reasons.push(\`Supported by reliable \${getIrrigationName(irrigationType)} infrastructure\`);
      if (budgetScore >= 90) reasons.push(\`Estimated cultivation cost (₹\${baselineCostPerAcre.toLocaleString()}/acre) fits your budget\`);
      if (crop.mspPerQuintal) {
        reasons.push(\`Protected by statutory CCEA Minimum Support Price (₹\${crop.mspPerQuintal.toLocaleString()}/quintal)\`);
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
}`;

content = content.replace(oldRecommendCropsRegex, newRecommendCrops);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated cropPlanningService.js with images and unsuitable crops logic!');
