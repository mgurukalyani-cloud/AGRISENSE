import fs from 'fs';
import path from 'path';

const file = path.resolve('src/services/voiceAssistantService.js');
let code = fs.readFileSync(file, 'utf8');

const startMarker = 'async askAssistant({';
const endMarker = 'generateAnswer({';

const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers in voiceAssistantService.js');
  process.exit(1);
}

const newMethod = `async askAssistant({
    query = '',
    conversationHistory = [],
    langCode = 'en',
    currentWeather,
    dailyWeather,
    historicalWeather,
    farmTelemetry,
    plantHealthResult,
    location,
    forceErrorTest = null,
    apiKeyOverride = null,
    providerOverride = null
  }) {
    // 1. Diagnostic test flag handler
    if (forceErrorTest) {
      return {
        success: false,
        errorCode: 'DIAGNOSTIC_TEST',
        message: 'Simulated AI Assistant diagnostic error test.',
        retryable: true
      };
    }

    const isStaticHosting =
      typeof window !== 'undefined' &&
      (window.location.hostname.endsWith('github.io') ||
       window.location.hostname.includes('github') ||
       window.location.protocol === 'file:' ||
       window.location.hostname.includes('pages'));

    // 2. Only attempt backend call if NOT on static hosting (e.g. running local development with FastAPI on 8000)
    if (!isStaticHosting) {
      const backendUrl =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        !window.location.origin.includes('github.io')
          ? \`\${window.location.origin}/api/assistant/chat\`
          : 'http://127.0.0.1:8000/api/assistant/chat';

      const farmContext = {
        location: location || { name: 'Your Farm Location' },
        weather: currentWeather,
        dailyWeather,
        historicalWeather,
        soil: farmTelemetry?.soilAnalysis,
        waterTank: farmTelemetry?.waterTank,
        zones: farmTelemetry?.zones,
        plantHealthResult
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);

        const res = await fetch(backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            conversation_history: conversationHistory,
            language: langCode,
            farm_context: farmContext,
            force_error_test: forceErrorTest,
            api_key_override: apiKeyOverride,
            provider_override: providerOverride
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.success !== false && (data.answer || data.speechText)) {
            return {
              success: true,
              title: data.title || 'AgriSense Farm Intelligence',
              speechText: data.speechText || data.answer,
              answer: data.answer,
              displayCards: data.display_cards || [
                { label: 'Provider', value: data.provider || 'AgriSense' },
                { label: 'Engine', value: data.model || 'agri-reasoning-v2' },
                { label: 'Status', value: 'Active' }
              ],
              provider: data.provider,
              model: data.model
            };
          }
        } else {
          console.warn(\`[VoiceAssistant] Backend returned status \${res.status}. Falling back to client-side agricultural reasoning engine.\`);
        }
      } catch (err) {
        console.warn('[VoiceAssistant] Backend unreachable, falling back to client-side agricultural reasoning engine:', err.message);
      }
    }

    // 3. Fallback to Built-in Contextual Agricultural Intelligence Engine
    try {
      const localResult = this.generateAnswer({
        query,
        langCode,
        currentWeather,
        dailyWeather,
        historicalWeather,
        farmTelemetry,
        plantHealthResult,
        location
      });

      return {
        ...localResult,
        success: true,
        isOfflineFallback: true
      };
    } catch (err) {
      console.error('[VoiceAssistant] Error in local agronomic reasoning fallback:', err);
      return {
        success: true,
        title: 'AgriSense Farm Advisory',
        speechText: 'Please ask a question related to farm irrigation, weather, crop planning, or plant disease diagnosis.',
        answer: 'Please ask a question related to farm irrigation, weather, crop planning, or plant disease diagnosis.\\n\\nOur system can assist you with:\\n• Which irrigation zone needs water?\\n• Will it rain tomorrow?\\n• Why are my tomato leaves turning yellow?\\n• What are the current mandi prices?',
        displayCards: [
          { label: 'Status', value: 'Ready' },
          { label: 'Scope', value: 'Agriculture & Weather' }
        ]
      };
    }
  }

  /**
   * Agricultural Intent Detection & Context-Aware Multilingual Answer Synthesis
   */
  `;

code = code.slice(0, startIdx) + newMethod + code.slice(endIdx);
fs.writeFileSync(file, code);
console.log('✓ Successfully updated askAssistant in voiceAssistantService.js!');
