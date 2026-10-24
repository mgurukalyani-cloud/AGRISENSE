/**
 * Comprehensive verification of AgriSense AI Assistant
 * Testing the 7 user-specified questions and edge cases.
 */

const BACKEND_URL = 'http://127.0.0.1:8000/api/assistant/chat';

async function queryAssistant(payload) {
  const res = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

const OLD_GENERIC_FRAGMENT = "To provide the most accurate agronomic advice, please let me know your specific crop";

async function runTests() {
  console.log('======================================================================');
  console.log('    AgriSense AI Assistant - 7 Core Questions & Edge Cases Verification');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name, condition, details = '') {
    total++;
    if (condition) {
      console.log(`[PASS] ${name}`);
      if (details) console.log(`       ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      if (details) console.error(`       Details: ${details}`);
    }
    console.log('');
  }

  // -------------------------------------------------------------
  // Case 1: Jowar crop status (previous year)
  // -------------------------------------------------------------
  console.log('--- Case 1: Jowar Crop Status ---');
  const c1 = await queryAssistant({
    message: "My crop is jowar. Send me the previous year's crop status.",
    language: 'en'
  });
  const c1HasDES = c1.success && c1.answer.includes('Directorate of Economics & Statistics') || c1.answer.includes('DES');
  const c1HasStats = c1.answer.includes('4.89') && c1.answer.includes('4.12') && c1.answer.includes('1,186');
  const c1HasSeasons = c1.answer.includes('Kharif') && c1.answer.includes('Rabi');
  const c1HasStates = c1.answer.includes('Maharashtra') && c1.answer.includes('Karnataka');
  const c1NoGeneric = !c1.answer.includes(OLD_GENERIC_FRAGMENT);
  assert(
    'Case 1: "My crop is jowar. Send me the previous year\'s crop status."',
    c1HasDES && c1HasStats && c1HasSeasons && c1HasStates && c1NoGeneric,
    `Stats found: DES=${c1HasDES}, 4.89M MT/4.12M ha/1186kg/ha=${c1HasStats}, Kharif/Rabi=${c1HasSeasons}, States=${c1HasStates}`
  );

  // -------------------------------------------------------------
  // Case 2: Weather tomorrow
  // -------------------------------------------------------------
  console.log('--- Case 2: Weather Tomorrow ---');
  // 2a: With farm context containing Open-Meteo daily weather
  const mockDailyWeather = {
    precipitation_sum: [0.0, 6.5],
    precipitation_probability_max: [10, 75],
    temperature_2m_max: [31.5, 29.0],
    temperature_2m_min: [22.0, 21.0]
  };
  const c2WithContext = await queryAssistant({
    message: 'What is the weather tomorrow?',
    language: 'en',
    farm_context: {
      location: { name: 'Ludhiana Agricultural District' },
      dailyWeather: mockDailyWeather
    }
  });
  const c2HasPrecip = c2WithContext.success && c2WithContext.answer.includes('6.5') && c2WithContext.answer.includes('75%');
  const c2HasTemps = c2WithContext.answer.includes('29') && c2WithContext.answer.includes('21');
  const c2HasAction = c2WithContext.answer.includes('Postpone') || c2WithContext.answer.includes('Irrigation');
  assert(
    'Case 2a: "What is the weather tomorrow?" with dailyWeather telemetry',
    c2HasPrecip && c2HasTemps && c2HasAction,
    `Forecast numerical values rendered: rain=6.5mm, prob=75%, temps=21-29C, action advised`
  );

  // 2b: Without context (should ask for district/location politely, not generic advice)
  const c2NoContext = await queryAssistant({
    message: 'What is the weather tomorrow?',
    language: 'en'
  });
  const c2AsksLoc = c2NoContext.success && (c2NoContext.answer.includes('location') || c2NoContext.answer.includes('district'));
  assert(
    'Case 2b: "What is the weather tomorrow?" without farm context',
    c2AsksLoc,
    `Politely requests location: "${c2NoContext.answer.substring(0, 80)}..."`
  );

  // -------------------------------------------------------------
  // Case 3: Why are my tomato leaves yellow?
  // -------------------------------------------------------------
  console.log('--- Case 3: Tomato Leaves Yellow ---');
  const c3 = await queryAssistant({
    message: 'Why are my tomato leaves yellow?',
    language: 'en'
  });
  const c3HasNitrogen = c3.success && c3.answer.includes('Nitrogen') && c3.answer.includes('lower leaves');
  const c3HasOverwatering = c3.answer.includes('Overwatering') || c3.answer.includes('drainage');
  const c3HasBlight = c3.answer.includes('Early Blight') || c3.answer.includes('Alternaria');
  const c3HasDiagnostic = c3.answer.includes('Diagnostic') || c3.answer.includes('Check');
  const c3NoGeneric = !c3.answer.includes(OLD_GENERIC_FRAGMENT);
  assert(
    'Case 3: "Why are my tomato leaves yellow?"',
    c3HasNitrogen && c3HasOverwatering && c3HasBlight && c3HasDiagnostic && c3NoGeneric,
    `Causes identified (Nitrogen, Overwatering, Blight) with practical diagnostic steps`
  );

  // -------------------------------------------------------------
  // Case 4: Explain soil pH in Telugu
  // -------------------------------------------------------------
  console.log('--- Case 4: Soil pH in Telugu ---');
  const c4 = await queryAssistant({
    message: 'Explain soil pH in Telugu.',
    language: 'te'
  });
  const c4HasTelugu = c4.success && c4.answer.includes('నేల') && c4.answer.includes('pH');
  const c4HasRange = c4.answer.includes('6.0') && c4.answer.includes('7.0');
  const c4HasRemedies = (c4.answer.includes('సున్నం') || c4.answer.includes('సున్నము')) && c4.answer.includes('జిప్సం');
  const c4NoGeneric = !c4.answer.includes(OLD_GENERIC_FRAGMENT);
  assert(
    'Case 4: "Explain soil pH in Telugu."',
    c4HasTelugu && c4HasRange && c4HasRemedies && c4NoGeneric,
    `Telugu explanation with optimal pH range 6.0-7.0 and Lime/Gypsum management`
  );

  // -------------------------------------------------------------
  // Case 5: What is the current market price of jowar?
  // -------------------------------------------------------------
  console.log('--- Case 5: Market Price of Jowar ---');
  const c5 = await queryAssistant({
    message: 'What is the current market price of jowar?',
    language: 'en'
  });
  const c5HasMSP = c5.success && (c5.answer.includes('3,180') || c5.answer.includes('3,371')) && (c5.answer.includes('3,225') || c5.answer.includes('3,421'));
  const c5HasAPMC = c5.answer.includes('3,100') && c5.answer.includes('3,650');
  const c5HasNotice = c5.answer.includes('APMC') || c5.answer.includes('Mandi');
  const c5NoGeneric = !c5.answer.includes(OLD_GENERIC_FRAGMENT);
  assert(
    'Case 5: "What is the current market price of jowar?"',
    c5HasMSP && c5HasAPMC && c5HasNotice && c5NoGeneric,
    `MSP benchmarks (Hybrid ₹3180-3371, Maldandi ₹3225-3421) and APMC modal range ₹3100-3650/qtl`
  );

  // -------------------------------------------------------------
  // Case 6: What is the capital of India? (Non-agri general question)
  // -------------------------------------------------------------
  console.log('--- Case 6: Capital of India (Non-agricultural) ---');
  const c6 = await queryAssistant({
    message: 'What is the capital of India?',
    language: 'en'
  });
  const c6IsDelhi = c6.success && c6.answer.includes('New Delhi');
  const c6NoFarmSpam = !c6.answer.includes('irrigation timing') && !c6.answer.includes('soil conditions');
  assert(
    'Case 6: "What is the capital of India?"',
    c6IsDelhi && c6NoFarmSpam,
    `Direct answer: "The capital of India is New Delhi" with zero farming spam`
  );

  // -------------------------------------------------------------
  // Case 7: Follow-up question preserving context
  // -------------------------------------------------------------
  console.log('--- Case 7: Contextual Follow-up Question ---');
  // 7a: Water follow-up
  const c7a = await queryAssistant({
    message: 'What about in the evening?',
    language: 'en',
    conversation_history: [
      { role: 'user', content: 'What is the best time to water my crop?' },
      { role: 'assistant', content: 'The best time to water crops is early in the morning between 4:00 AM and 8:00 AM.' }
    ]
  });
  const c7aSuccess = c7a.success && c7a.answer.toLowerCase().includes('evening') &&
                     (c7a.answer.includes('fungal') || c7a.answer.includes('drip') || c7a.answer.includes('evaporation'));
  assert(
    'Case 7a: Follow-up "What about in the evening?" after watering query',
    c7aSuccess,
    `Correctly interpreted as evening irrigation with fungal foliar warnings and drip advice`
  );

  // 7b: Jowar follow-up: "What is its market price?"
  const c7b = await queryAssistant({
    message: 'What is its market price?',
    language: 'en',
    conversation_history: [
      { role: 'user', content: 'My crop is jowar. Send me the previous year\'s crop status.' },
      { role: 'assistant', content: 'Historical Jowar Cultivation & Production Status: Total Production was 4.89 million MT...' }
    ]
  });
  const c7bSuccess = c7b.success && c7b.answer.includes('Jowar') && (c7b.answer.includes('3,180') || c7b.answer.includes('3,371') || c7b.answer.includes('MSP'));
  assert(
    'Case 7b: Follow-up "What is its market price?" after Jowar inquiry',
    c7bSuccess,
    `Understood "its" refers to Jowar and provided Jowar MSP and mandi benchmarks`
  );

  // -------------------------------------------------------------
  // Case 8: Error handling & simulation
  // -------------------------------------------------------------
  console.log('--- Case 8: Error Handling (Honest reporting & Retries) ---');
  const c8a = await queryAssistant({
    message: 'Test query',
    force_error_test: 'missing_key'
  });
  const c8b = await queryAssistant({
    message: 'Test query',
    force_error_test: 'api_failure'
  });
  const c8Success = !c8a.success && c8a.error_code === 'MISSING_API_KEY' &&
                    !c8b.success && c8b.error_code === 'UPSTREAM_API_FAILURE' &&
                    c8a.retryable === true && c8b.retryable === true;
  assert(
    'Case 8: Error reporting (missing API key & upstream failure)',
    c8Success,
    `Proper error_code and retryable flag returned without crashes`
  );

  // -------------------------------------------------------------
  // Case 9: Uniqueness & Zero Repetitions
  // -------------------------------------------------------------
  console.log('--- Case 9: Uniqueness & Anti-Repetition Check ---');
  const collectedAnswers = [
    c1.answer,
    c2WithContext.answer,
    c2NoContext.answer,
    c3.answer,
    c4.answer,
    c5.answer,
    c6.answer,
    c7a.answer,
    c7b.answer
  ];
  const uniqueSet = new Set(collectedAnswers);
  const allUnique = uniqueSet.size === collectedAnswers.length;
  const noRepeatedGeneric = collectedAnswers.every(ans => !ans.includes(OLD_GENERIC_FRAGMENT));
  assert(
    'Case 9: All answers are distinct and unique (No repetitive template fallback)',
    allUnique && noRepeatedGeneric,
    `${uniqueSet.size} unique responses out of ${collectedAnswers.length} queries tested`
  );

  // -------------------------------------------------------------
  // Case 10: Anti-hallucination Telemetry Check
  // -------------------------------------------------------------
  console.log('--- Case 10: Anti-hallucination Telemetry Check ---');
  const c10Disc = await queryAssistant({
    message: 'What is the water tank level?'
  });
  const c10Conn = await queryAssistant({
    message: 'What is the water tank level?',
    farm_context: {
      waterTank: { fillPercentage: 72, currentVolumeLiters: 10800 }
    }
  });
  const c10Success = c10Disc.success && c10Disc.answer.includes('No ultrasonic water level sensor is currently connected') &&
                     c10Conn.success && c10Conn.answer.includes('72%') && c10Conn.answer.includes('10800 Liters');
  assert(
    'Case 10: Water tank telemetry honesty (Connected vs Disconnected)',
    c10Success,
    `Never invents tank level when disconnected; accurately uses telemetry when connected`
  );

  console.log('======================================================================');
  console.log(`SUMMARY: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('======================================================================');

  if (passed !== total) {
    process.exitCode = 1;
  }
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exitCode = 1;
});
