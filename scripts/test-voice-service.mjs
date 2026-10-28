import { voiceAssistantService } from '../src/services/voiceAssistantService.js';

// Mock browser window environment matching GitHub Pages
globalThis.window = {
  location: {
    hostname: 'mgurukalyani-cloud.github.io',
    origin: 'https://mgurukalyani-cloud.github.io',
    protocol: 'https:'
  }
};

const mockTelemetry = {
  zones: [
    { name: 'Zone 1 (North Field - Cotton)', status: 'OPTIMAL', soilMoisturePct: 52 },
    { name: 'Zone 2 (Vegetable Garden)', status: 'NEEDS_WATER', soilMoisturePct: 22 },
    { name: 'Zone 3 (Orchard)', status: 'OPTIMAL', soilMoisturePct: 48 }
  ],
  waterTank: { fillPercentage: 74, currentLevelLiters: 11100, capacityLiters: 15000 },
  soilAnalysis: { farmAveragePh: 6.8, nitrogenStatus: 'OPTIMAL' }
};

const mockWeather = {
  temperature_2m: 29.5,
  relative_humidity_2m: 64,
  wind_speed_10m: 11.2
};

const mockDaily = {
  precipitation_sum: [0.0, 1.2, 0.0],
  precipitation_probability_max: [10, 45, 15],
  temperature_2m_max: [33, 31, 32],
  temperature_2m_min: [22, 21, 22]
};

async function runTests() {
  const queries = [
    { q: 'Which irrigation zone needs water?', lang: 'en' },
    { q: 'Why are tomato leaves turning yellow?', lang: 'en' },
    { q: 'Will it rain tomorrow?', lang: 'en' },
    { q: 'What is the stock price of Apple?', lang: 'en' },
    { q: 'ఈ సీజన్లో ఏ పంట వేయాలి?', lang: 'te' }
  ];

  console.log('--- Testing Voice Assistant on GitHub Pages simulation ---');
  let allPassed = true;

  for (const { q, lang } of queries) {
    console.log(`\nQuery [${lang}]: "${q}"`);
    const res = await voiceAssistantService.askAssistant({
      query: q,
      langCode: lang,
      currentWeather: mockWeather,
      dailyWeather: mockDaily,
      farmTelemetry: mockTelemetry,
      location: { name: 'Khammam, Telangana' }
    });

    console.log(`- Success: ${res.success}`);
    console.log(`- Title: ${res.title}`);
    console.log(`- Speech Text: ${res.speechText?.substring(0, 80)}...`);
    console.log(`- Display Cards: ${JSON.stringify(res.displayCards?.map(c => `${c.label}: ${c.value}`))}`);

    if (!res.success || !res.speechText || !res.title) {
      console.error(`FAIL: response incomplete for query "${q}"`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\n✓ ALL TESTS PASSED! Voice Assistant works seamlessly without any 405 error.');
  } else {
    process.exit(1);
  }
}

runTests();
