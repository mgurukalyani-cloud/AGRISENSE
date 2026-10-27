import { detectLeavesOnDevice, detectPlantLeaves, CROP_DISEASE_DATABASE } from '../src/services/plantDiseaseService.js';

console.log('=== AgriSense Unit Test: Comprehensive Leaf Vision Engine ===\n');

// 1. Verify CROP_DISEASE_DATABASE exists
console.log('1. Checking CROP_DISEASE_DATABASE...');
const diseases = Object.keys(CROP_DISEASE_DATABASE);
console.log(`Found ${diseases.length} disease profiles in knowledge base.`);

// Helper to create mock canvas where drawImage properly copies source data
function createMockCanvas(width, height, pixelFn) {
  const data = new Uint8ClampedArray(width * height * 4);
  if (pixelFn) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const [r, g, b, a] = pixelFn(x, y);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a !== undefined ? a : 255;
      }
    }
  }

  const canvasObj = {
    width,
    height,
    _data: data,
    getContext: () => ({
      drawImage: (source) => {
        if (source && source._data) {
          canvasObj._data.set(source._data);
        }
      },
      getImageData: () => ({ data: canvasObj._data })
    }),
    toDataURL: () => 'data:image/jpeg;base64,mock'
  };
  return canvasObj;
}

global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') return createMockCanvas(160, 120, null);
    return {};
  }
};

// 2. Test: Healthy Leaf in Center of Box
console.log('\n2. Testing Leaf in Center of Box:');
const centeredLeafCanvas = createMockCanvas(160, 120, (x, y) => {
  // Leaf occupies center: x from 45 to 115, y from 30 to 90
  if (x >= 45 && x <= 115 && y >= 30 && y <= 90) {
    return [40, 155, 35]; // Chlorophyll green
  }
  return [120, 120, 120]; // Neutral gray desk
});

const leafRes = await detectLeavesOnDevice(centeredLeafCanvas);
console.log('  Leaf detected:', leafRes.has_leaves);
console.log('  Leaf is centered:', leafRes.is_centered);
console.log('  Confidence:', leafRes.detections?.[0]?.confidence + '%');
console.log('  Bounding box:', leafRes.detections?.[0]?.box_percent);
if (!leafRes.has_leaves || !leafRes.is_centered) {
  throw new Error('Test 2 Failed: Centered leaf was not recognized or centered!');
}

// 3. Test: Empty Background (No Leaf)
console.log('\n3. Testing Empty Background (No Leaf):');
const emptyCanvas = createMockCanvas(160, 120, () => [130, 130, 130]);
const emptyRes = await detectLeavesOnDevice(emptyCanvas);
console.log('  Leaf detected:', emptyRes.has_leaves);
console.log('  Leaf count:', emptyRes.leaf_count);
if (emptyRes.has_leaves) {
  throw new Error('Test 3 Failed: Plain background was falsely identified as a leaf!');
}

// 4. Test: Diseased Leaf with Chlorosis and Necrosis
console.log('\n4. Testing Diseased Leaf (Yellow Halo + Brown Necrotic Lesions):');
const diseasedCanvas = createMockCanvas(160, 120, (x, y) => {
  if (x >= 50 && x <= 110 && y >= 35 && y <= 85) {
    if (x >= 70 && x <= 90 && y >= 50 && y <= 70) {
      return [110, 60, 30]; // Brown necrotic
    }
    if (x >= 65 && x <= 95 && y >= 45 && y <= 75) {
      return [180, 160, 40]; // Yellow chlorosis
    }
    return [55, 140, 45]; // Green foliar tissue
  }
  return [100, 100, 100];
});

const diseasedRes = await detectLeavesOnDevice(diseasedCanvas);
console.log('  Diseased leaf detected:', diseasedRes.has_leaves);
console.log('  Diseased leaf centered:', diseasedRes.is_centered);
if (!diseasedRes.has_leaves || !diseasedRes.is_centered) {
  throw new Error('Test 4 Failed: Diseased leaf was not recognized!');
}

// 5. Test detectPlantLeaves offline fallback
console.log('\n5. Testing detectPlantLeaves offline fallback:');
const fallbackRes = await detectPlantLeaves(centeredLeafCanvas);
console.log('  Fallback success:', fallbackRes.success);
console.log('  Fallback has_leaves:', fallbackRes.has_leaves);
console.log('  Fallback is_centered:', fallbackRes.is_centered);
if (!fallbackRes.success || !fallbackRes.has_leaves || !fallbackRes.is_centered) {
  throw new Error('Test 5 Failed: detectPlantLeaves fallback failed!');
}

console.log('\n*** ALL AGRO-VISION TESTS PASSED WITH 100% SUCCESS! ***');
