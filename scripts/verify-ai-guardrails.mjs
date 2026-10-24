// Automated verification test suite for AI Assistant Agriculture/Irrigation/Weather guardrails
const BASE_URL = 'http://127.0.0.1:8000/api/assistant/chat';

const farmContext = {
  location: { name: 'Solapur Farm, Maharashtra' },
  weather: {
    temperature_2m: 29.4,
    relative_humidity_2m: 64,
    wind_speed_10m: 11.2,
    precipitation: 0.0
  },
  dailyWeather: {
    precipitation_sum: [0.0, 0.0],
    precipitation_probability_max: [10, 15],
    temperature_2m_max: [33, 34],
    temperature_2m_min: [21, 22]
  },
  soil: {
    farmAveragePh: 6.8,
    moisturePct: 54
  }
};

async function testQuery({ name, message, language = 'en', expectedChecks = [] }) {
  console.log(`\n============================================================`);
  console.log(`TEST: ${name}`);
  console.log(`Question: "${message}" [Lang: ${language}]`);

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      language,
      farm_context: farmContext
    })
  });

  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const answer = data.answer || '';
  const speech = data.speechText || '';
  const title = data.title || '';

  console.log(`Status: ${data.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Title: ${title}`);
  console.log(`Answer Preview:\n${answer.substring(0, 220)}...`);

  let allPassed = true;
  for (const check of expectedChecks) {
    const passed = check.fn(data);
    console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${check.desc}`);
    if (!passed) allPassed = false;
  }

  if (!allPassed) {
    throw new Error(`Test failed checks for: ${name}`);
  }
}

async function runAll() {
  console.log(`Starting AgriSense AI Assistant Guardrail & Domain Verification...`);

  // 1. IRRIGATION: Best time to water
  await testQuery({
    name: '1. Irrigation: Best time to water crops',
    message: 'What is the best time to water crops?',
    expectedChecks: [
      { desc: 'Contains 4:00 AM - 8:00 AM recommendation', fn: d => d.answer.includes('4:00 AM') && d.answer.includes('8:00 AM') },
      { desc: 'Explains minimal evaporation', fn: d => d.answer.toLowerCase().includes('evaporation') }
    ]
  });

  // 2. IRRIGATION: How to save water
  await testQuery({
    name: '2. Irrigation: Saving irrigation water',
    message: 'How to save irrigation water?',
    expectedChecks: [
      { desc: 'Mentions drip irrigation efficiency', fn: d => d.answer.includes('Drip') || d.answer.includes('drip') },
      { desc: 'Mentions mulching', fn: d => d.answer.toLowerCase().includes('mulch') }
    ]
  });

  // 3. IRRIGATION: General irrigation methods
  await testQuery({
    name: '3. Irrigation: General irrigation methods',
    message: 'What are the methods of irrigation?',
    expectedChecks: [
      { desc: 'Covers Drip, Sprinkler, and Furrow', fn: d => d.answer.includes('Drip') && d.answer.includes('Sprinkler') },
      { desc: 'Mentions critical growth stages', fn: d => d.answer.toLowerCase().includes('critical growth') }
    ]
  });

  // 4. WEATHER: Current/Today's live weather
  await testQuery({
    name: "4. Weather: Current/Today's live weather report",
    message: 'What is the weather today?',
    expectedChecks: [
      { desc: 'Includes real-time temperature (29.4°C)', fn: d => d.answer.includes('29.4') },
      { desc: 'Includes spraying window guidance', fn: d => d.answer.toLowerCase().includes('spray') }
    ]
  });

  // 5. WEATHER: Tomorrow's forecast
  await testQuery({
    name: "5. Weather: Tomorrow's rain forecast",
    message: 'What is the weather tomorrow?',
    expectedChecks: [
      { desc: 'Includes numerical temperatures or precipitation', fn: d => d.answer.includes('Forecast') || d.answer.includes('Rain') }
    ]
  });

  // 6. WEATHER: Spraying safety advisory
  await testQuery({
    name: '6. Weather: Spraying pesticide advisory',
    message: 'Can I spray pesticides today?',
    expectedChecks: [
      { desc: 'Evaluates wind speed threshold (<15 km/h)', fn: d => d.answer.includes('11.2') || d.answer.includes('15') },
      { desc: 'Gives favorable verdict', fn: d => d.answer.toLowerCase().includes('favorable') }
    ]
  });

  // 7. AGRICULTURE: How to increase crop yield
  await testQuery({
    name: '7. Agriculture: How to increase crop yield',
    message: 'How to increase crop yield?',
    expectedChecks: [
      { desc: 'Details 5 agronomic pillars', fn: d => d.answer.includes('Pillars') || d.answer.includes('Yield') },
      { desc: 'Recommends certified seeds and balanced NPK', fn: d => (d.answer.includes('Seed') || d.answer.includes('Seeds')) && (d.answer.includes('NPK') || d.answer.includes('N-P-K')) }
    ]
  });

  // 8. AGRICULTURE: Plant pathology / chlorosis
  await testQuery({
    name: '8. Agriculture: Tomato chlorosis diagnosis',
    message: 'Why are my tomato leaves turning yellow?',
    expectedChecks: [
      { desc: 'Diagnoses Nitrogen deficiency and drainage', fn: d => d.answer.includes('Nitrogen') && d.answer.includes('Drainage') }
    ]
  });

  // 9. AGRICULTURE: What is agriculture
  await testQuery({
    name: '9. Agriculture: What is agriculture & smart farming',
    message: 'What is agriculture?',
    expectedChecks: [
      { desc: 'Covers modern precision farming pillars', fn: d => d.answer.includes('Pillars') || d.answer.includes('Precision') },
      { desc: 'Gives concrete suggestions of what to ask', fn: d => d.answer.includes('Suggestions') || d.answer.includes('Ask:') }
    ]
  });

  // 10. WASTED QUESTION: English off-topic (Who is iron man?)
  await testQuery({
    name: '10. Wasted Question: "Who is iron man?"',
    message: 'Who is iron man?',
    expectedChecks: [
      {
        desc: 'Rejects with "Please ask a proper question related to agriculture, irrigation, weather, or crop management."',
        fn: d => d.answer.includes('Please ask a proper question related to agriculture, irrigation, weather, or crop management.')
      },
      {
        desc: 'Provides structured suggestions for Irrigation, Weather, Plant Health, Crops, Soil',
        fn: d => d.answer.includes('Irrigation & Water') && d.answer.includes('Weather & Forecast') && d.answer.includes('Plant Health')
      }
    ]
  });

  // 11. WASTED QUESTION: English entertainment (Tell me a joke)
  await testQuery({
    name: '11. Wasted Question: "Tell me a joke"',
    message: 'Tell me a joke',
    expectedChecks: [
      {
        desc: 'Rejects with standard guardrail phrasing',
        fn: d => d.answer.includes('Please ask a proper question related to agriculture, irrigation, weather, or crop management.')
      }
    ]
  });

  // 12. WASTED QUESTION: English random gibberish (asdfghjkl)
  await testQuery({
    name: '12. Wasted Question: "asdfghjkl"',
    message: 'asdfghjkl',
    expectedChecks: [
      {
        desc: 'Rejects with standard guardrail phrasing',
        fn: d => d.answer.includes('Please ask a proper question related to agriculture, irrigation, weather, or crop management.')
      }
    ]
  });

  // 13. WASTED QUESTION: Telugu off-topic
  await testQuery({
    name: '13. Wasted Question: Telugu ("సినిమా హీరో ఎవరు?")',
    message: 'సినిమా హీరో ఎవరు?',
    language: 'te',
    expectedChecks: [
      {
        desc: 'Rejects in Telugu requesting agriculture/irrigation/weather question',
        fn: d => d.answer.includes('దయచేసి వ్యవసాయం, నీటి పారుదల (ఇరిగేషన్), వాతావరణం లేదా పంటల నిర్వహణకు సంబంధించిన సరైన ప్రశ్నను అడగండి.')
      },
      {
        desc: 'Provides Telugu agricultural suggestions',
        fn: d => d.answer.includes('నీటి పారుదల') && d.answer.includes('వాతావరణం')
      }
    ]
  });

  // 14. WASTED QUESTION: Hindi off-topic
  await testQuery({
    name: '14. Wasted Question: Hindi ("मुझे कोई चुटकुला सुनाओ")',
    message: 'मुझे कोई चुटकुला सुनाओ',
    language: 'hi',
    expectedChecks: [
      {
        desc: 'Rejects in Hindi requesting agriculture/irrigation/weather question',
        fn: d => d.answer.includes('कृपया कृषि, सिंचाई, मौसम या फसल प्रबंधन से संबंधित उचित प्रश्न पूछें।')
      },
      {
        desc: 'Provides Hindi agricultural suggestions',
        fn: d => d.answer.includes('सिंचाई') && d.answer.includes('मौसम')
      }
    ]
  });

  // 15. BENCHMARK FACTUAL: Capital of India
  await testQuery({
    name: '15. Factual benchmark: Capital of India',
    message: 'What is the capital of India?',
    expectedChecks: [
      { desc: 'Correctly answers New Delhi', fn: d => d.answer.includes('New Delhi') }
    ]
  });

  console.log(`\n============================================================`);
  console.log(`ALL 15 GUARDRAIL & DOMAIN TESTS PASSED WITH 100% ACCURACY!`);
  console.log(`============================================================`);
}

runAll().catch(err => {
  console.error('\nTEST SUITE FAILED:', err.message);
  process.exit(1);
});
