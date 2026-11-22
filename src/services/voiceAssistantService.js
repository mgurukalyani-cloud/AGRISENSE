/**
 * AgriSense Real AI Conversational Assistant Service
 * Provides:
 * 1. Web Speech API Speech-to-Text (STT) and Text-to-Speech (TTS) for 22 Indian languages
 * 2. Multi-tier Intelligent Conversational Execution:
 *    - Tier 1: Direct in-browser LLM API calls (Google Gemini 1.5 Flash / Groq / OpenAI) when custom key is provided
 *    - Tier 2: FastAPI backend connection when running on local development server
 *    - Tier 3: Resilient Autonomous AgriSense AI Intelligence Engine (weather microclimate, agronomy, programming, science, general AI)
 * 3. Multi-turn conversation history dispatch & memory
 * 4. Transparent, reliable operation across both local development and static cloud hosting (GitHub Pages)
 */

import { INDIAN_LANGUAGES, getLanguageByCode } from '../i18n/languages.js';
import { 
  getRegisteredCrops, getActiveCropId, calculateCropLifecycle, calculatePrecisionFertilizers 
} from './cropLifecycleService.js';
import { generateAutonomousResponse } from './agrisenseAiEngine.js';

// Map Indian language codes to standard Web Speech BCP-47 tags
export const SPEECH_LOCALES = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  bn: 'bn-IN',
  pa: 'pa-IN',
  gu: 'gu-IN',
  ml: 'ml-IN',
  or: 'or-IN',
  as: 'as-IN',
  ur: 'ur-IN',
  sa: 'sa-IN',
  ne: 'ne-NP',
  sd: 'sd-IN',
  ks: 'ks-IN',
  kok: 'kok-IN',
  mai: 'mai-IN',
  doi: 'doi-IN',
  brx: 'brx-IN',
  mni: 'mni-IN',
  sat: 'sat-IN'
};

const API_KEY_OVERRIDE_KEY = 'agrisense_api_key_override';
const PROVIDER_OVERRIDE_KEY = 'agrisense_provider_override';

class VoiceAssistantService {
  constructor() {
    this.recognitionInstance = null;
    this.isListening = false;
    this.availableVoices = [];

    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.loadVoices();
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  // Load available system TTS voices
  loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.availableVoices = window.speechSynthesis.getVoices() || [];
  }

  // Check if browser supports Web Speech Recognition (STT)
  isSTTSupported() {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // Check if browser supports Web Speech Synthesis (TTS)
  isTTSSupported() {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  // Detect capability status for a specific Indian language
  getLanguageCapabilities(langCode) {
    const hasSTT = this.isSTTSupported();
    const hasTTS = this.isTTSSupported();
    const targetLocale = SPEECH_LOCALES[langCode] || `${langCode}-IN`;

    const voiceMatch = this.availableVoices.find(v => {
      const vLang = v.lang.toLowerCase();
      return (
        vLang === targetLocale.toLowerCase() ||
        vLang.startsWith(langCode.toLowerCase()) ||
        vLang.startsWith(targetLocale.split('-')[0].toLowerCase())
      );
    });

    return {
      langCode,
      targetLocale,
      sttSupported: hasSTT,
      ttsSupported: hasTTS,
      hasNativeVoice: Boolean(voiceMatch),
      matchedVoiceName: voiceMatch?.name || null
    };
  }

  /**
   * Start Speech-to-Text Recognition
   */
  startListening({
    langCode = 'en',
    onStart,
    onResult,
    onError,
    onEnd
  }) {
    if (!this.isSTTSupported()) {
      onError?.({ type: 'NOT_SUPPORTED', message: 'Speech recognition is not supported in this browser.' });
      return false;
    }

    try {
      this.stopListening();

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = SPEECH_LOCALES[langCode] || `${langCode}-IN`;

      recognition.onstart = () => {
        this.isListening = true;
        onStart?.();
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        onResult?.({
          finalTranscript: finalTranscript.trim(),
          interimTranscript: interimTranscript.trim()
        });
      };

      recognition.onerror = (event) => {
        this.isListening = false;
        onError?.(event);
      };

      recognition.onend = () => {
        this.isListening = false;
        onEnd?.();
      };

      this.recognitionInstance = recognition;
      recognition.start();
      return true;
    } catch (err) {
      this.isListening = false;
      onError?.(err);
      return false;
    }
  }

  // Stop active speech recognition
  stopListening() {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.abort();
      } catch (e) {
        // Ignore abort errors
      }
      this.recognitionInstance = null;
    }
    this.isListening = false;
  }

  /**
   * Text-to-Speech playback for responses
   */
  speak({
    text,
    langCode = 'en',
    speed = 0.95,
    onStart,
    onEnd,
    onError
  }) {
    if (!this.isTTSSupported() || !text) {
      onError?.({ type: 'UNSUPPORTED' });
      return false;
    }

    this.stopSpeaking();

    try {
      // Strip markdown code blocks and symbols for clean spoken speech
      const cleanSpeech = text
        .replace(/```[\s\S]*?```/g, 'Code block omitted from audio speech.')
        .replace(/[*#`_>•-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanSpeech.slice(0, 500));
      const targetLocale = SPEECH_LOCALES[langCode] || `${langCode}-IN`;

      if (this.availableVoices.length === 0) {
        this.loadVoices();
      }

      const matchedVoice = this.availableVoices.find(v => {
        const vLang = v.lang.toLowerCase();
        return (
          vLang === targetLocale.toLowerCase() ||
          vLang.startsWith(langCode.toLowerCase()) ||
          vLang.startsWith(targetLocale.split('-')[0].toLowerCase())
        );
      }) || this.availableVoices.find(v => v.default) || this.availableVoices[0];

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = targetLocale;
      }

      utterance.rate = Math.max(0.7, Math.min(1.2, speed));
      utterance.pitch = 1.0;

      utterance.onstart = () => onStart?.();
      utterance.onend = () => onEnd?.();
      utterance.onerror = (e) => onError?.(e);

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn('AgriSense TTS error:', err);
      onError?.(err);
      return false;
    }
  }

  // Stop audio synthesis
  stopSpeaking() {
    if (this.isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Check LLM configuration and connection status
   * Seamlessly reports status whether using custom API key, local backend, or autonomous engine
   */
  async getStatus() {
    // 1. Check local storage / env custom API key
    try {
      const storedKey = typeof window !== 'undefined' ? localStorage.getItem(API_KEY_OVERRIDE_KEY) : null;
      const storedProvider = typeof window !== 'undefined' ? localStorage.getItem(PROVIDER_OVERRIDE_KEY) || 'gemini' : 'gemini';
      if (storedKey && storedKey.trim().length > 6) {
        return {
          success: true,
          is_configured: true,
          provider: storedProvider.toLowerCase(),
          active_model: storedProvider === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-1.5-flash',
          message: 'Direct in-browser LLM active'
        };
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    // 2. If running locally (not on github.io), check FastAPI backend
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch('http://127.0.0.1:8000/api/assistant/status', {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data && data.is_configured) {
            return data;
          }
        }
      } catch (e) {
        // Backend offline, fallback to autonomous
      }
    }

    // 3. Autonomous AgriSense Intelligence Engine
    return {
      success: true,
      is_configured: true,
      provider: 'agrisense',
      active_model: 'Built-in Precision AI',
      message: 'Autonomous AgriSense Intelligence Engine active'
    };
  }

  /**
   * Direct in-browser call to Google Gemini 1.5 Flash REST API
   */
  async callDirectGemini({ apiKey, message, conversationHistory = [], farmContext, langCode }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Construct system instruction
    const systemPrompt = `You are AgriSense AI Assistant, an advanced agronomic and conversational AI.
You answer questions accurately across Artificial Intelligence, general science, programming (Java, Python, HTML/CSS), and precision agriculture.
Active Location: ${farmContext?.location?.name || 'Agricultural Region'}
Live Temperature: ${farmContext?.weather?.temperature_2m || farmContext?.weather?.temperature || 28}°C
Live Humidity: ${farmContext?.weather?.relative_humidity_2m || farmContext?.weather?.humidity || 62}%
Respond in ${langCode === 'te' ? 'Telugu (తెలుగు)' : langCode === 'hi' ? 'Hindi (हिन्दी)' : 'English'}.
Use clear markdown formatting with bullet points and code blocks.`;

    const contents = [];
    for (const msg of (conversationHistory || []).slice(-6)) {
      const role = msg.role === 'user' ? 'user' : 'model';
      const text = (msg.content || '').trim();
      if (text) {
        contents.push({ role, parts: [{ text }] });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.95
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API returned status ${res.status}`);
    }

    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!answer) throw new Error('Empty response received from Gemini API');

    return {
      success: true,
      title: 'AgriSense AI (Gemini 1.5 Flash)',
      speechText: answer.replace(/[*#`_>•-]/g, ' ').slice(0, 300),
      answer,
      displayCards: [
        { label: 'Provider', value: 'GOOGLE GEMINI' },
        { label: 'Model', value: 'gemini-1.5-flash' },
        { label: 'Latency', value: 'Direct Client API' }
      ],
      provider: 'gemini',
      model: 'gemini-1.5-flash'
    };
  }

  /**
   * Direct in-browser call to Groq Cloud REST API
   */
  async callDirectGroq({ apiKey, message, conversationHistory = [], farmContext, langCode }) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const systemPrompt = `You are AgriSense AI Assistant, an advanced agronomic and conversational AI.
Active Location: ${farmContext?.location?.name || 'Agricultural Region'}
Live Temperature: ${farmContext?.weather?.temperature_2m || farmContext?.weather?.temperature || 28}°C
Respond in ${langCode === 'te' ? 'Telugu (తెలుగు)' : langCode === 'hi' ? 'Hindi (हिन्दी)' : 'English'}. Use clean markdown.`;

    const messages = [{ role: 'system', content: systemPrompt }];
    for (const msg of (conversationHistory || []).slice(-6)) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content || ''
      });
    }
    messages.push({ role: 'user', content: message });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 2048
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Groq API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content;
    if (!answer) throw new Error('Empty response received from Groq API');

    return {
      success: true,
      title: 'AgriSense AI (Groq Llama 3.3)',
      speechText: answer.replace(/[*#`_>•-]/g, ' ').slice(0, 300),
      answer,
      displayCards: [
        { label: 'Provider', value: 'GROQ' },
        { label: 'Model', value: 'llama-3.3-70b' },
        { label: 'Latency', value: 'Direct Ultra-Fast API' }
      ],
      provider: 'groq',
      model: 'llama-3.3-70b-versatile'
    };
  }

  /**
   * Ask the Real AI Assistant
   * Guaranteed to ALWAYS return a helpful, high-quality answer.
   * Never crashes or shows broken connection errors on static deployments.
   */
  async askAssistant({
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
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) {
      return {
        success: false,
        errorCode: 'EMPTY_QUERY',
        message: 'Please enter a message or question.'
      };
    }

    // Resolve active crop context
    let activeRegisteredCrop = null;
    let activeLifecycle = null;
    let activeFertilizerResult = null;
    try {
      const allCrops = getRegisteredCrops();
      const activeId = getActiveCropId();
      activeRegisteredCrop = allCrops.find((c) => c.id === activeId) || allCrops[0] || null;
      if (activeRegisteredCrop) {
        activeLifecycle = calculateCropLifecycle(activeRegisteredCrop);
        activeFertilizerResult = calculatePrecisionFertilizers(activeRegisteredCrop, activeLifecycle);
      }
    } catch (e) {
      console.warn('Failed to resolve active crop context for LLM:', e);
    }

    const farmContext = {
      location: location || { name: 'Active Agricultural District' },
      weather: currentWeather,
      dailyWeather,
      historicalWeather,
      soil: farmTelemetry?.soilAnalysis,
      waterTank: farmTelemetry?.waterTank,
      zones: farmTelemetry?.zones,
      plantHealthResult,
      registeredCrop: activeRegisteredCrop,
      lifecycle: activeLifecycle,
      fertilizerResult: activeFertilizerResult
    };

    // 1. Check for user-provided API key (Direct in-browser execution)
    const effectiveKey = (apiKeyOverride || (typeof window !== 'undefined' ? localStorage.getItem(API_KEY_OVERRIDE_KEY) : ''))?.trim();
    const effectiveProvider = (providerOverride || (typeof window !== 'undefined' ? localStorage.getItem(PROVIDER_OVERRIDE_KEY) : 'gemini'))?.toLowerCase();

    if (effectiveKey && effectiveKey.length > 6) {
      try {
        if (effectiveProvider === 'groq') {
          return await this.callDirectGroq({
            apiKey: effectiveKey,
            message: cleanQuery,
            conversationHistory,
            farmContext,
            langCode
          });
        } else {
          return await this.callDirectGemini({
            apiKey: effectiveKey,
            message: cleanQuery,
            conversationHistory,
            farmContext,
            langCode
          });
        }
      } catch (directApiErr) {
        console.warn('Direct LLM API call failed, falling back to autonomous engine:', directApiErr);
        // Fall through to autonomous engine
      }
    }

    // 2. If running locally on localhost, try the local backend with a fast 2.5s timeout
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch('http://127.0.0.1:8000/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: cleanQuery,
            conversation_history: conversationHistory,
            language: langCode,
            farm_context: farmContext
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.success !== false) {
            return {
              success: true,
              title: data.title || 'AgriSense AI Assistant',
              speechText: data.speechText || data.answer,
              answer: data.answer,
              displayCards: data.display_cards || [
                { label: 'Provider', value: data.provider ? data.provider.toUpperCase() : 'LLM' },
                { label: 'Model', value: data.model || 'Active Model' },
                { label: 'Status', value: 'Live Response' }
              ],
              provider: data.provider,
              model: data.model
            };
          }
        }
      } catch (backendErr) {
        // Local backend unreachable, fall through to autonomous engine
      }
    }

    // 3. Autonomous AgriSense Intelligence Engine
    // Solves questions on weather, artificial intelligence, programming, crops, fertilizers, and science
    const autonomousResult = generateAutonomousResponse({
      query: cleanQuery,
      conversationHistory,
      langCode,
      farmContext
    });

    return {
      success: true,
      title: autonomousResult.title,
      speechText: autonomousResult.speechText,
      answer: autonomousResult.answer,
      displayCards: autonomousResult.displayCards,
      provider: 'AgriSense AI',
      model: 'Built-in Precision Agronomy & Knowledge Engine'
    };
  }
}

export const voiceAssistantService = new VoiceAssistantService();
export default voiceAssistantService;
