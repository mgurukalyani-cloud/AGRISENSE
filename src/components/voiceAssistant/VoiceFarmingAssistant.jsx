import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Send,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  Key,
  Cpu,
  Bot,
  User,
  ExternalLink,
  ChevronDown,
  Layers,
  Info,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { INDIAN_LANGUAGES, getLanguageByCode } from '../../i18n/languages';
import { voiceAssistantService } from '../../services/voiceAssistantService';
import { farmTelemetryService } from '../../services/farmTelemetryService';
import MarkdownRenderer from './MarkdownRenderer';

const CHAT_STORAGE_KEY = 'agrisense_chat_conversation_v2';
const API_KEY_OVERRIDE_KEY = 'agrisense_api_key_override';
const PROVIDER_OVERRIDE_KEY = 'agrisense_provider_override';

export default function VoiceFarmingAssistant({
  currentWeather,
  dailyWeather,
  historicalWeather,
  plantHealthResult,
  location,
  onClose,
  isModal = false
}) {
  const { t, i18n } = useTranslation();

  // Selected language for speech & LLM responses
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const [langCapabilities, setLangCapabilities] = useState(
    voiceAssistantService.getLanguageCapabilities(i18n.language || 'en')
  );

  // Assistant State: 'idle' | 'listening' | 'processing' | 'error'
  const [assistantState, setAssistantState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState(null);
  const [interimTranscript, setInterimTranscript] = useState('');

  // Conversation history persisted in localStorage
  const [conversationHistory, setConversationHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved chat history:', e);
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hello! I am your **AgriSense AI Assistant**.\n\nI can answer questions across **General Knowledge**, **Science**, **Computer Programming**, **Mathematics**, and **Precision Agriculture**. Feel free to ask me anything or try follow-up questions!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'AgriSense AI'
      }
    ];
  });

  const [textInput, setTextInput] = useState('');
  const [isSpeakingActive, setIsSpeakingActive] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);

  // Backend status: checks live provider and configured keys
  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    is_configured: false,
    provider: null,
    active_model: null,
    message: null
  });

  // API Key Settings Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem(API_KEY_OVERRIDE_KEY) || '');
  const [providerChoice, setProviderChoice] = useState(() => localStorage.getItem(PROVIDER_OVERRIDE_KEY) || 'gemini');

  // Copy message state tracking
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  // Telemetry snapshot
  const [telemetry, setTelemetry] = useState({
    zones: farmTelemetryService.getIrrigationZones(),
    waterTank: farmTelemetryService.getWaterTankStatus(),
    soilAnalysis: farmTelemetryService.getSoilMeasurements()
  });

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const isMountedRef = useRef(true);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, assistantState, scrollToBottom]);

  // Persist conversation history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversationHistory));
    } catch (e) {
      console.warn('Failed to persist chat history:', e);
    }
  }, [conversationHistory]);

  // Check backend status on mount
  const checkStatus = useCallback(async () => {
    const status = await voiceAssistantService.getStatus();
    if (isMountedRef.current) {
      setBackendStatus({
        checked: true,
        is_configured: status.is_configured || false,
        provider: status.provider || null,
        active_model: status.active_model || null,
        message: status.message || null
      });
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Sync telemetry with current weather
  useEffect(() => {
    if (currentWeather) {
      farmTelemetryService.syncWithWeatherData(currentWeather);
      setTelemetry({
        zones: farmTelemetryService.getIrrigationZones(),
        waterTank: farmTelemetryService.getWaterTankStatus(),
        soilAnalysis: farmTelemetryService.getSoilMeasurements()
      });
    }
  }, [currentWeather]);

  // Sync language capabilities
  useEffect(() => {
    const caps = voiceAssistantService.getLanguageCapabilities(selectedLang);
    setLangCapabilities(caps);
  }, [selectedLang]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      voiceAssistantService.stopListening();
      voiceAssistantService.stopSpeaking();
    };
  }, []);

  // Process user message via genuine LLM backend
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || textInput || '').trim();
    if (!query) return;

    voiceAssistantService.stopSpeaking();
    setIsSpeakingActive(false);
    setCurrentlySpeakingId(null);
    setErrorMessage(null);
    setAssistantState('processing');
    setTextInput('');

    const userMsgId = `user-${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append user message immediately
    const updatedHistory = [...conversationHistory, userMessage];
    setConversationHistory(updatedHistory);

    // Prepare previous turns for LLM multi-turn context (exclude initial welcome)
    const contextForLLM = updatedHistory
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

    try {
      const res = await voiceAssistantService.askAssistant({
        query,
        conversationHistory: contextForLLM.slice(-10),
        langCode: selectedLang,
        currentWeather,
        dailyWeather,
        historicalWeather,
        farmTelemetry: telemetry,
        plantHealthResult,
        location,
        apiKeyOverride: apiKeyInput.trim() || null,
        providerOverride: providerChoice || null
      });

      if (!isMountedRef.current) return;

      if (!res.success) {
        setAssistantState('error');
        setErrorMessage(res.message || 'LLM communication error. Please check your API key or connection.');
        setLastFailedQuestion(query);
        return;
      }

      // Successful LLM response
      const assistantMsgId = `ai-${Date.now()}`;
      const assistantMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: res.provider ? `${res.provider.toUpperCase()} (${res.model || 'LLM'})` : 'AI Assistant',
        model: res.model
      };

      setConversationHistory((prev) => [...prev, assistantMessage]);
      setAssistantState('idle');
      setLastFailedQuestion(null);

      // Re-check backend status
      checkStatus();
    } catch (err) {
      if (isMountedRef.current) {
        setAssistantState('error');
        setErrorMessage(err.message || 'An unexpected error occurred while communicating with the AI assistant.');
        setLastFailedQuestion(query);
      }
    }
  };

  // Keyboard Enter handler
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start Voice Input (STT)
  const handleToggleVoice = () => {
    if (assistantState === 'listening') {
      voiceAssistantService.stopListening();
      setAssistantState('idle');
      setInterimTranscript('');
      return;
    }

    voiceAssistantService.stopSpeaking();
    setIsSpeakingActive(false);
    setErrorMessage(null);
    setInterimTranscript('');

    const started = voiceAssistantService.startListening({
      langCode: selectedLang,
      onStart: () => {
        if (isMountedRef.current) setAssistantState('listening');
      },
      onResult: ({ finalTranscript, interimTranscript: interim }) => {
        if (!isMountedRef.current) return;
        setInterimTranscript(interim);
        if (finalTranscript) {
          setTextInput(finalTranscript);
          handleSendMessage(finalTranscript);
        }
      },
      onError: (err) => {
        if (!isMountedRef.current) return;
        setAssistantState('idle');
        setInterimTranscript('');
        if (err.error !== 'no-speech') {
          setErrorMessage(`Microphone error (${err.error || 'speech failed'}). You can type your question directly.`);
        }
      },
      onEnd: () => {
        if (isMountedRef.current && assistantState === 'listening') {
          setAssistantState('idle');
          setInterimTranscript('');
        }
      }
    });

    if (!started) {
      setErrorMessage('Speech recognition is not supported in this browser. Please type your message.');
    }
  };

  // Speak aloud an AI response
  const handleSpeakMessage = (msgId, text) => {
    if (currentlySpeakingId === msgId && isSpeakingActive) {
      voiceAssistantService.stopSpeaking();
      setIsSpeakingActive(false);
      setCurrentlySpeakingId(null);
      return;
    }

    voiceAssistantService.stopSpeaking();
    setIsSpeakingActive(true);
    setCurrentlySpeakingId(msgId);

    voiceAssistantService.speak({
      text,
      langCode: selectedLang,
      onStart: () => setIsSpeakingActive(true),
      onEnd: () => {
        setIsSpeakingActive(false);
        setCurrentlySpeakingId(null);
      },
      onError: () => {
        setIsSpeakingActive(false);
        setCurrentlySpeakingId(null);
      }
    });
  };

  // Copy message text to clipboard
  const handleCopyMessage = (msgId, content) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  // Start New Chat (clears active session history)
  const handleNewChat = () => {
    voiceAssistantService.stopSpeaking();
    setIsSpeakingActive(false);
    setCurrentlySpeakingId(null);
    setErrorMessage(null);
    setAssistantState('idle');

    const freshWelcome = [
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `🌱 **New conversation started.**\n\nHow can I help you today? Ask any question about **artificial intelligence**, **programming**, **science**, **math**, or **farming**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'AgriSense AI'
      }
    ];
    setConversationHistory(freshWelcome);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(freshWelcome));
  };

  // Clear all conversation history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your conversation history?')) {
      handleNewChat();
    }
  };

  // Save in-app API key override
  const handleSaveConfig = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem(API_KEY_OVERRIDE_KEY, apiKeyInput.trim());
      localStorage.setItem(PROVIDER_OVERRIDE_KEY, providerChoice);
    } else {
      localStorage.removeItem(API_KEY_OVERRIDE_KEY);
      localStorage.removeItem(PROVIDER_OVERRIDE_KEY);
    }
    setShowConfigModal(false);
    setErrorMessage(null);
    checkStatus();
  };

  // Sample prompt chips
  const samplePrompts = [
    'What is artificial intelligence?',
    'What are its applications?',
    'Explain photosynthesis',
    'Write a Java program to check prime numbers',
    'What is the difference between HTML and CSS?',
    'Which crops require less water in Rabi season?',
    'Can I spray pesticide tomorrow?'
  ];

  return (
    <div className={`flex flex-col bg-slate-950 text-white rounded-3xl border border-emerald-500/25 shadow-2xl overflow-hidden ${isModal ? 'max-h-[90vh] h-[780px]' : 'min-h-[720px]'}`}>
      
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-[#072518] to-slate-950 border-b border-emerald-800/40 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-700/30 ring-2 ring-emerald-400/40">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                AgriSense AI Assistant
              </h2>
              {/* Connection Status Pill */}
              {backendStatus.is_configured ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-900/80 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{backendStatus.provider?.toUpperCase()} • {backendStatus.active_model}</span>
                </span>
              ) : (
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-900/60 text-amber-300 border border-amber-500/40 hover:bg-amber-800/70 cursor-pointer transition-colors"
                >
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  <span>Configure API Key</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-emerald-300/80 font-medium">
              Real LLM Conversational Intelligence • Multi-Turn Memory • 22 Indian Languages
            </p>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center space-x-2">
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-700/50 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Start a new chat session with fresh context"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {/* API Key Settings Button */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Configure LLM Provider (Gemini / Groq / OpenAI)"
          >
            <Key className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Clear History Button */}
          <button
            onClick={handleClearHistory}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 border border-white/10 hover:border-rose-800/50 transition-colors cursor-pointer"
            title="Clear conversation history"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Language Selector Dropdown */}
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-emerald-700/50 text-emerald-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            {INDIAN_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                {l.nativeName} ({l.code.toUpperCase()})
              </option>
            ))}
          </select>

          {/* Close Button if Modal */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Chat Message Feed (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-emerald-800/60 bg-[#07130e]/70">
        {conversationHistory.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isUser
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-400" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-md transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white rounded-tr-xs'
                    : 'bg-[#0f281e] text-slate-100 border border-emerald-800/50 rounded-tl-xs shadow-emerald-950/40'
                }`}
              >
                {/* Header Meta Info on AI Message */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 border-b border-emerald-800/40 pb-2 mb-2 text-[10px] text-emerald-400 font-mono">
                    <span className="font-bold flex items-center space-x-1.5">
                      <Sparkles className="w-3 h-3 text-emerald-300" />
                      <span>{msg.provider || 'AgriSense AI'}</span>
                    </span>
                    <span className="text-slate-400">{msg.timestamp}</span>
                  </div>
                )}

                {/* Body Content */}
                {isUser ? (
                  <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}

                {/* Footer Controls for AI Message */}
                {!isUser && (
                  <div className="flex items-center justify-end space-x-2 pt-3 mt-3 border-t border-emerald-800/30 text-xs">
                    {/* Copy Response Button */}
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 hover:text-white transition-colors text-[11px] cursor-pointer"
                      title="Copy response to clipboard"
                    >
                      {copiedMsgId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Listen Aloud Button (TTS) */}
                    <button
                      onClick={() => handleSpeakMessage(msg.id, msg.content)}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-colors text-[11px] cursor-pointer ${
                        currentlySpeakingId === msg.id && isSpeakingActive
                          ? 'bg-emerald-600 text-white font-bold animate-pulse'
                          : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 hover:text-white'
                      }`}
                      title={currentlySpeakingId === msg.id && isSpeakingActive ? 'Stop reading' : 'Read aloud in selected language'}
                    >
                      {currentlySpeakingId === msg.id && isSpeakingActive ? (
                        <>
                          <VolumeX className="w-3 h-3" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Real-Time Processing Indicator */}
        {assistantState === 'processing' && (
          <div className="flex items-start space-x-3 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-emerald-400 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-xs bg-[#0f281e] border border-emerald-800/60 text-emerald-200 text-xs sm:text-sm flex items-center space-x-3 shadow-md">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-semibold text-emerald-300">
                AgriSense AI is analyzing context and formulating answer...
              </span>
            </div>
          </div>
        )}

        {/* Listening Speech Bubble */}
        {assistantState === 'listening' && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/80 to-slate-900 border border-red-500/50 text-white text-xs flex items-center justify-between shadow-lg animate-pulse">
            <div className="flex items-center space-x-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="font-extrabold text-red-200">
                Listening in {getLanguageByCode(selectedLang)?.nativeName || selectedLang.toUpperCase()}... Speak now.
              </span>
              {interimTranscript && (
                <span className="italic text-slate-300 truncate max-w-xs">"{interimTranscript}"</span>
              )}
            </div>
            <button
              onClick={() => voiceAssistantService.stopListening()}
              className="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs cursor-pointer"
            >
              Stop
            </button>
          </div>
        )}

        {/* Error Alert with Quick Actions */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-white text-xs space-y-2 shadow-lg animate-in fade-in duration-200">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-extrabold text-rose-200 text-sm">AI Connection Notice</p>
                <p className="text-rose-100/90 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition-colors"
              >
                Configure API Key
              </button>
              {lastFailedQuestion && (
                <button
                  onClick={() => handleSendMessage(lastFailedQuestion)}
                  className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold cursor-pointer transition-colors"
                >
                  Retry Question
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Suggested Prompts Carousel */}
      <div className="p-2.5 bg-slate-900/90 border-t border-emerald-950 flex items-center space-x-2 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider shrink-0 pl-2">
          Suggestions:
        </span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-2.5 py-1 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-200 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* 4. Chat Message Input Bar */}
      <div className="p-3 sm:p-4 bg-slate-950 border-t border-emerald-800/40 shrink-0">
        <div className="flex items-end space-x-2 bg-slate-900 rounded-2xl p-2 border border-emerald-700/60 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-inner">
          {/* Microphone Voice Toggle */}
          <button
            onClick={handleToggleVoice}
            disabled={assistantState === 'processing'}
            className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              assistantState === 'listening'
                ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/40'
                : 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 hover:text-white border border-emerald-700/60'
            }`}
            title="Speak using voice recognition (STT)"
          >
            {assistantState === 'listening' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask AgriSense AI anything in ${getLanguageByCode(selectedLang)?.nativeName || 'English'}... (Enter to send, Shift+Enter for new line)`}
            className="flex-1 max-h-32 bg-transparent text-white placeholder-slate-500 text-xs sm:text-sm px-2 py-1.5 resize-none focus:outline-none scrollbar-thin"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={assistantState === 'processing' || !textInput.trim()}
            className={`p-2.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              textInput.trim() && assistantState !== 'processing'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-700/30 hover:scale-105'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 5. API Key Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-emerald-800/40 pb-3">
              <div className="flex items-center space-x-2 text-white">
                <Key className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-base">Configure AI LLM Provider</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                AgriSense connects directly to genuine Large Language Models via backend REST APIs.
                Select your preferred provider:
              </p>

              {/* Provider Selection */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'gemini', label: 'Google Gemini', desc: 'gemini-1.5-flash' },
                  { id: 'groq', label: 'Groq Cloud', desc: 'llama-3.3-70b' },
                  { id: 'openai', label: 'OpenAI', desc: 'gpt-4o-mini' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProviderChoice(p.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      providerChoice === p.id
                        ? 'bg-emerald-900/60 border-emerald-400 text-white shadow-xs'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-white">{p.label}</div>
                    <div className="text-[10px] text-emerald-300 font-mono mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>

              {/* API Key Input */}
              <div className="space-y-1 pt-1">
                <label className="block text-slate-300 font-bold text-xs">
                  {providerChoice.toUpperCase()} API Key:
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={`Enter your ${providerChoice} API key...`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-700/50 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <p className="text-[10px] text-slate-400 pt-0.5">
                  Stored securely in your local session or configure <code className="text-emerald-300">backend/.env</code> for server-side persistence.
                </p>
              </div>

              {/* Quick Key Links */}
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/50 space-y-1.5 text-[11px]">
                <p className="font-bold text-emerald-300">Need a free API Key?</p>
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  <li>
                    <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-300">
                      Google AI Studio (Gemini Free Tier)
                    </a>
                  </li>
                  <li>
                    <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-300">
                      Groq Cloud (Llama 3.3 70B Fast Free Tier)
                    </a>
                  </li>
                  <li>
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-emerald-400 underline hover:text-emerald-300">
                      OpenAI Developer Platform
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md cursor-pointer"
              >
                Save &amp; Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
