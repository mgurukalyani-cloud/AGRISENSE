/**
 * AgriSense AI Assistant - Automated Verification Test Suite
 * Validates all 10 requirements and edge cases.
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

async function runTestSuite() {
  console.log('===============================================================');
  console.log('       AgriSense AI Assistant - 10-Point Verification Test     ');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 10;

  // -------------------------------------------------------------
  // Test 1: Best time to water crops
  // -------------------------------------------------------------
  console.log('Test 1: "What is the best time to water my crop?"');
  const t1 = await queryAssistant({
    message: 'What is the best time to water my crop?',
    language: 'en'
  });
  const t1Success = t1.success && t1.answer.includes('morning') && t1.answer.includes('evaporation');
  console.log(`  -> Passed: ${t1Success}`);
  console.log(`  -> Preview: ${t1.answer.substring(0, 120)}...\n`);
  if (t1Success) passed++;

  // -------------------------------------------------------------
  // Test 2: Tomato leaves turning yellow
  // -------------------------------------------------------------
  console.log('Test 2: "Why are my tomato leaves turning yellow?"');
  const t2 = await queryAssistant({
    message: 'Why are my tomato leaves turning yellow?',
    language: 'en'
  });
  const t2Success = t2.success && (t2.answer.includes('Nitrogen') || t2.answer.includes('chlorosis')) && t2.answer.includes('Overwatering');
  console.log(`  -> Passed: ${t2Success}`);
  console.log(`  -> Preview: ${t2.answer.substring(0, 120)}...\n`);
  if (t2Success) passed++;

  // -------------------------------------------------------------
  // Test 3: Soil pH in simple Telugu
  // -------------------------------------------------------------
  console.log('Test 3: "Explain soil pH in simple Telugu."');
  const t3 = await queryAssistant({
    message: 'Explain soil pH in simple Telugu.',
    language: 'te'
  });
  const t3Success = t3.success && t3.answer.includes('మట్టి') && (t3.answer.includes('పులుపుదనం') || t3.answer.includes('ఆమ్ల'));
  console.log(`  -> Passed: ${t3Success}`);
  console.log(`  -> Preview: ${t3.answer.substring(0, 120)}...\n`);
  if (t3Success) passed++;

  // -------------------------------------------------------------
  // Test 4: How humidity affects plant diseases
  // -------------------------------------------------------------
  console.log('Test 4: "How does humidity affect plant diseases?"');
  const t4 = await queryAssistant({
    message: 'How does humidity affect plant diseases?',
    language: 'en'
  });
  const t4Success = t4.success && t4.answer.includes('humidity') && (t4.answer.includes('Spore') || t4.answer.includes('fungal'));
  console.log(`  -> Passed: ${t4Success}`);
  console.log(`  -> Preview: ${t4.answer.substring(0, 120)}...\n`);
  if (t4Success) passed++;

  // -------------------------------------------------------------
  // Test 5: Organic vs Chemical fertilizers
  // -------------------------------------------------------------
  console.log('Test 5: "What is the difference between organic and chemical fertilizers?"');
  const t5 = await queryAssistant({
    message: 'What is the difference between organic and chemical fertilizers?',
    language: 'en'
  });
  const t5Success = t5.success && t5.answer.includes('Organic') && t5.answer.includes('Chemical') && t5.answer.includes('Slow-release');
  console.log(`  -> Passed: ${t5Success}`);
  console.log(`  -> Preview: ${t5.answer.substring(0, 120)}...\n`);
  if (t5Success) passed++;

  // -------------------------------------------------------------
  // Test 6: Non-agricultural question (Capital of France)
  // -------------------------------------------------------------
  console.log('Test 6: "What is the capital of France?" (Must NOT force farming fallback)');
  const t6 = await queryAssistant({
    message: 'What is the capital of France?',
    language: 'en'
  });
  const t6Success = t6.success && t6.answer.includes('Paris') && !t6.answer.includes('Ludhiana Agricultural District');
  console.log(`  -> Passed: ${t6Success}`);
  console.log(`  -> Preview: ${t6.answer.substring(0, 120)}...\n`);
  if (t6Success) passed++;

  // -------------------------------------------------------------
  // Test 7: Follow-up question with conversation history
  // -------------------------------------------------------------
  console.log('Test 7: Follow-up question ("What about in the evening?")');
  const t7 = await queryAssistant({
    message: 'What about in the evening?',
    language: 'en',
    conversation_history: [
      { role: 'user', content: 'What is the best time to water my crop?' },
      { role: 'assistant', content: 'Morning between 4:00 AM and 8:00 AM is best for irrigation...' }
    ]
  });
  const t7Success = t7.success && (t7.answer.includes('evening') || t7.answer.includes('Evening')) && t7.answer.includes('irrigation');
  console.log(`  -> Passed: ${t7Success}`);
  console.log(`  -> Preview: ${t7.answer.substring(0, 120)}...\n`);
  if (t7Success) passed++;

  // -------------------------------------------------------------
  // Test 8: Missing API credentials & API failure error display
  // -------------------------------------------------------------
  console.log('Test 8: Error handling & simulation (missing_key and api_failure)');
  const t8a = await queryAssistant({
    message: 'Test query',
    force_error_test: 'missing_key'
  });
  const t8b = await queryAssistant({
    message: 'Test query',
    force_error_test: 'api_failure'
  });
  const t8Success = !t8a.success && t8a.error_code === 'MISSING_API_KEY' &&
                    !t8b.success && t8b.error_code === 'UPSTREAM_API_FAILURE' &&
                    t8a.retryable === true && t8b.retryable === true;
  console.log(`  -> Passed: ${t8Success}`);
  console.log(`  -> Missing key msg: "${t8a.message}"`);
  console.log(`  -> Failure msg: "${t8b.message}"\n`);
  if (t8Success) passed++;

  // -------------------------------------------------------------
  // Test 9: Distinct answers across queries (Zero repeated generic answers)
  // -------------------------------------------------------------
  console.log('Test 9: Distinct answers across queries');
  const answers = [t1.answer, t2.answer, t3.answer, t4.answer, t5.answer, t6.answer, t7.answer];
  const uniqueAnswers = new Set(answers);
  const t9Success = uniqueAnswers.size === answers.length;
  console.log(`  -> Passed: ${t9Success} (${uniqueAnswers.size} unique answers out of ${answers.length})`);
  console.log(`  -> No repeated generic weather text observed.\n`);
  if (t9Success) passed++;

  // -------------------------------------------------------------
  // Test 10: Anti-hallucination telemetry check
  // -------------------------------------------------------------
  console.log('Test 10: Anti-hallucination telemetry check (Connected vs Disconnected)');
  // 10a: Disconnected
  const t10Disconnected = await queryAssistant({
    message: 'What is the water tank level?'
  });
  // 10b: Connected
  const t10Connected = await queryAssistant({
    message: 'What is the water tank level?',
    farm_context: {
      waterTank: { fillPercentage: 78, currentVolumeLiters: 11700 }
    }
  });

  const t10Success = t10Disconnected.success &&
                     t10Disconnected.answer.includes('Notice: No ultrasonic water level sensor is currently connected') &&
                     t10Connected.success &&
                     t10Connected.answer.includes('78%') &&
                     t10Connected.answer.includes('11700 Liters');
  console.log(`  -> Passed: ${t10Success}`);
  console.log(`  -> Disconnected response: "${t10Disconnected.answer.substring(0, 100)}..."`);
  console.log(`  -> Connected response: "${t10Connected.answer.substring(0, 100)}..."\n`);
  if (t10Success) passed++;

  // -------------------------------------------------------------
  // Final Results
  // -------------------------------------------------------------
  console.log('===============================================================');
  console.log(`RESULTS: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('===============================================================');

  if (passed === total) {
    console.log('ALL 10 VERIFICATION REQUIREMENTS HAVE BEEN MET SUCCESSFULLY.');
  } else {
    console.error('Some tests failed.');
    process.exitCode = 1;
  }
}

runTestSuite().catch(err => {
  console.error('Test execution failed:', err);
  process.exitCode = 1;
});
