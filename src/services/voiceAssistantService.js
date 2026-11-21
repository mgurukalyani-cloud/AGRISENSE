/**
 * AgriSense Real AI Conversational Assistant Service
 * Provides:
 * 1. Web Speech API Speech-to-Text (STT) and Text-to-Speech (TTS) for 22 Indian languages
 * 2. Real-time API communication with FastAPI backend connected to Google Gemini / Groq / OpenAI LLMs
 * 3. Multi-turn conversation history dispatch
 * 4. Transparent error & status reporting (no fake simulation or hardcoded rule engine)
 */

import { INDIAN_LANGUAGES, getLanguageByCode } from '../i18n/languages.js';
import { 
  getRegisteredCrops, getActiveCropId, calculateCropLifecycle, calculatePrecisionFertilizers 
} from './cropLifecycleService.js';

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
   * Check LLM configuration and connection status from backend
   */
  async getStatus() {
    try {
      const backendUrl =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        !window.location.origin.includes('github.io')
          ? `${window.location.origin}/api/assistant/status`
          : 'http://127.0.0.1:8000/api/assistant/status';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(backendUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Backend offline or unreachable
    }
    return {
      success: false,
      is_configured: false,
      provider: null,
      active_model: null,
      message: 'Backend server is offline. Run: python backend/server.py'
    };
  }

  /**
   * Ask the Real LLM-Powered AI Assistant
   * Sends actual HTTP requests to the FastAPI /api/assistant/chat endpoint.
   * Every query is processed by the configured LLM.
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

    const backendUrl =
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      !window.location.origin.includes('github.io')
        ? `${window.location.origin}/api/assistant/chat`
        : 'http://127.0.0.1:8000/api/assistant/chat';

    // Dynamically retrieve active crop lifecycle and fertilizer parameters
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

    try {
      // 40-second timeout for genuine LLM inference
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanQuery,
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
        if (data.success === false) {
          return {
            success: false,
            errorCode: data.error_code || 'API_ERROR',
            message: data.message,
            configured: data.configured,
            instructions: data.instructions,
            retryable: true
          };
        }

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
      } else {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          errorCode: `HTTP_${res.status}`,
          message: errData.detail || errData.message || `Backend service returned error code ${res.status}.`,
          retryable: true
        };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          errorCode: 'TIMEOUT',
          message: 'The AI request timed out after 40 seconds. Please check your internet connection and try again.',
          retryable: true
        };
      }

      return {
        success: false,
        errorCode: 'BACKEND_OFFLINE',
        message: 'Cannot connect to backend server on http://127.0.0.1:8000. Please start the backend service using: python backend/server.py',
        retryable: true
      };
    }
  }
}

export const voiceAssistantService = new VoiceAssistantService();
export default voiceAssistantService;
