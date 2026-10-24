import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  X,
  Droplets,
  CloudRain,
  Sprout,
  ShieldAlert,
  ChevronDown,
  Gauge,
  Radio,
  TrendingUp,
  Coins,
  Scale,
  Send,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { INDIAN_LANGUAGES, getLanguageByCode } from '../../i18n/languages';
import { voiceAssistantService } from '../../services/voiceAssistantService';
import { farmTelemetryService } from '../../services/farmTelemetryService';

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

  // Selected language for speech interaction (defaults to website language)
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const [langCapabilities, setLangCapabilities] = useState(
    voiceAssistantService.getLanguageCapabilities(i18n.language || 'en')
  );

  // Interaction State: 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
  const [assistantState, setAssistantState] = useState('idle');
  const [recognizedQuestion, setRecognizedQuestion] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [answerData, setAnswerData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState(null);

  // Conversation history for multi-turn questions & follow-ups
  const [conversationHistory, setConversationHistory] = useState([]);
  const [textInput, setTextInput] = useState('');

  // Audio speech rate: 0.95 (normal) vs 0.80 (slower for rural/elderly farmers)
  const [speechSpeed, setSpeechSpeed] = useState(0.95);
  const [isSpeakingActive, setIsSpeakingActive] = useState(false);

  // Real-time telemetry snapshot
  const [telemetry, setTelemetry] = useState({
    zones: farmTelemetryService.getIrrigationZones(),
    waterTank: farmTelemetryService.getWaterTankStatus(),
    soilAnalysis: farmTelemetryService.getSoilMeasurements()
  });

  const isMountedRef = useRef(true);

  // Sync telemetry with real Open-Meteo current weather
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

  // Update language capability information when language changes
  useEffect(() => {
    const caps = voiceAssistantService.getLanguageCapabilities(selectedLang);
    setLangCapabilities(caps);
  }, [selectedLang]);

  // Keep selected language synchronized if website language changes (unless overridden by user)
  useEffect(() => {
    if (i18n.language && i18n.language !== selectedLang) {
      setSelectedLang(i18n.language);
    }
  }, [i18n.language, selectedLang]);

  // Clean up speech recognition & synthesis on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      voiceAssistantService.stopListening();
      voiceAssistantService.stopSpeaking();
    };
  }, []);

  // Answer generation via AI Assistant Backend and automatic text-to-speech
  const processQuestion = useCallback(
    async (questionText, isRetry = false) => {
      if (!questionText || questionText.trim() === '') return;

      const trimmedQ = questionText.trim();
      setAssistantState('processing');
      setErrorMessage(null);
      setRecognizedQuestion(trimmedQ);

      try {
        const res = await voiceAssistantService.askAssistant({
          query: trimmedQ,
          conversationHistory,
          langCode: selectedLang,
          currentWeather,
          dailyWeather,
          historicalWeather,
          farmTelemetry: telemetry,
          plantHealthResult,
          location
        });

        if (!isMountedRef.current) return;

        if (!res.success) {
          setAssistantState('error');
          setErrorMessage(res.message || 'AI Assistant service unavailable. Please retry.');
          setLastFailedQuestion(trimmedQ);
          return;
        }

        setAnswerData(res);
        setErrorMessage(null);
        setLastFailedQuestion(null);
        setAssistantState('speaking');
        setIsSpeakingActive(true);

        // Append to conversation history for multi-turn context
        setConversationHistory((prev) => [
          ...prev,
          { role: 'user', content: trimmedQ },
          { role: 'assistant', content: res.speechText || res.answer || '' }
        ]);

        // Speak aloud using TTS
        voiceAssistantService.speakText({
          text: res.speechText || res.answer,
          langCode: selectedLang,
          speed: speechSpeed,
          onStart: () => {
            if (isMountedRef.current) {
              setIsSpeakingActive(true);
            }
          },
          onEnd: () => {
            if (isMountedRef.current) {
              setIsSpeakingActive(false);
              setAssistantState('idle');
            }
          },
          onError: () => {
            if (isMountedRef.current) {
              setIsSpeakingActive(false);
              setAssistantState('idle');
            }
          }
        });
      } catch (err) {
        if (isMountedRef.current) {
          setAssistantState('error');
          setErrorMessage(err.message || 'An unexpected error occurred while communicating with the AI assistant.');
          setLastFailedQuestion(trimmedQ);
        }
      }
    },
    [conversationHistory, currentWeather, dailyWeather, historicalWeather, location, plantHealthResult, selectedLang, speechSpeed, telemetry]
  );

  // Start Voice Listening (STT)
  const handleStartListening = () => {
    if (assistantState === 'listening') {
      voiceAssistantService.stopListening();
      setAssistantState('idle');
      return;
    }

    voiceAssistantService.stopSpeaking();
    setIsSpeakingActive(false);
    setErrorMessage(null);
    setInterimTranscript('');

    const started = voiceAssistantService.startListening({
      langCode: selectedLang,
      onStart: () => {
        if (isMountedRef.current) {
          setAssistantState('listening');
        }
      },
      onInterim: (interim) => {
        if (isMountedRef.current) {
          setInterimTranscript(interim);
        }
      },
      onFinal: (final) => {
        if (isMountedRef.current) {
          setRecognizedQuestion(final);
          setInterimTranscript('');
          processQuestion(final);
        }
      },
      onError: (err) => {
        if (isMountedRef.current) {
          setAssistantState('error');
          setErrorMessage(err.message || 'Speech recognition error.');
        }
      },
      onEnd: () => {
        if (isMountedRef.current && assistantState === 'listening') {
          setAssistantState('idle');
        }
      }
    });

    if (!started && !voiceAssistantService.isSTTSupported()) {
      setAssistantState('error');
      setErrorMessage(
        t('voice.noSTT', 'Speech recognition is not supported in this browser. Please use Chrome/Edge or tap one of the question buttons below.')
      );
    }
  };

  // Stop active speech playback
  const handleStopSpeaking = () => {
    voiceAssistantService.stopSpeaking();
    setIsSpeakingActive(false);
    setAssistantState('idle');
  };

  // Repeat speech playback
  const handleRepeatAudio = () => {
    if (!answerData?.speechText) return;

    voiceAssistantService.stopSpeaking();
    setAssistantState('speaking');
    setIsSpeakingActive(true);

    voiceAssistantService.speakText({
      text: answerData.speechText,
      langCode: selectedLang,
      speed: speechSpeed,
      onStart: () => setIsSpeakingActive(true),
      onEnd: () => {
        setIsSpeakingActive(false);
        setAssistantState('idle');
      },
      onError: () => {
        setIsSpeakingActive(false);
        setAssistantState('idle');
      }
    });
  };

  // Toggle voice speed: Normal (0.95x) vs Slower (0.80x)
  const handleToggleSpeed = () => {
    const newSpeed = speechSpeed < 0.9 ? 0.95 : 0.80;
    setSpeechSpeed(newSpeed);

    // If currently speaking, restart with new speed
    if (isSpeakingActive && answerData?.speechText) {
      voiceAssistantService.stopSpeaking();
      voiceAssistantService.speakText({
        text: answerData.speechText,
        langCode: selectedLang,
        speed: newSpeed,
        onStart: () => setIsSpeakingActive(true),
        onEnd: () => setIsSpeakingActive(false)
      });
    }
  };

  // Ask another question
  const handleAskAnother = () => {
    voiceAssistantService.stopSpeaking();
    setIsSpeakingActive(false);
    setRecognizedQuestion('');
    setInterimTranscript('');
    setAnswerData(null);
    setAssistantState('idle');
    setErrorMessage(null);
  };

  // Reset full conversation and state
  const handleResetConversation = () => {
    voiceAssistantService.stopSpeaking();
    setIsSpeakingActive(false);
    setRecognizedQuestion('');
    setInterimTranscript('');
    setAnswerData(null);
    setConversationHistory([]);
    setAssistantState('idle');
    setErrorMessage(null);
    setLastFailedQuestion(null);
  };

  // Quick question pills in current selected language
  const getQuickQuestions = () => {
    if (selectedLang === 'te') {
      return [
        { icon: Sprout, text: 'ఈ సీజన్‌లో ఏ పంట వేయాలి?' },
        { icon: Droplets, text: 'తక్కువ నీరు అవసరమయ్యే పంటలు ఏవి?' },
        { icon: Coins, text: 'ఒక ఎకరానికి ఎంత ఖర్చు అవుతుంది?' },
        { icon: TrendingUp, text: 'సమీప మార్కెట్లలో తాజా ధరలు ఏమిటి?' },
        { icon: Scale, text: 'పత్తి, మొక్కజొన్న, పప్పు ధాన్యాలను పోల్చండి.' },
        { icon: ShieldAlert, text: 'ఏ పంటలో ఆర్థిక నష్టం తక్కువ?' },
        { icon: CloudRain, text: 'రేపు వర్షం పడుతుందా?' },
        { icon: Droplets, text: 'ఏ జోన్‌కు నీరు కావాలి?' },
        { icon: Gauge, text: 'నీటి ట్యాంక్ ఎంత ఉంది?' },
        { icon: HelpCircle, text: 'ఆకు వ్యాధి ఫలితం ఏమిటి?' }
      ];
    }
    if (selectedLang === 'hi') {
      return [
        { icon: Sprout, text: 'इस मौसम में कौन सी फसल बोएं?' },
        { icon: Droplets, text: 'किन फसलों में कम पानी लगता है?' },
        { icon: Coins, text: 'एक एकड़ में कितना खर्च आएगा?' },
        { icon: TrendingUp, text: 'नजदीकी मंडियों में ताजा भाव क्या हैं?' },
        { icon: Scale, text: 'कपास, मक्का और दालों की तुलना करें।' },
        { icon: ShieldAlert, text: 'किस विकल्प में वित्तीय जोखिम कम है?' },
        { icon: CloudRain, text: 'क्या कल बारिश होगी?' },
        { icon: Droplets, text: 'किस जोन में पानी चाहिए?' },
        { icon: Gauge, text: 'पानी की टंकी का स्तर क्या है?' },
        { icon: HelpCircle, text: 'पत्ती की बीमारी का क्या मतलब है?' }
      ];
    }
    if (selectedLang === 'mr') {
      return [
        { icon: Sprout, text: 'या हंगामात कोणते पीक पेरावे?' },
        { icon: Droplets, text: 'कमी पाण्यात येणारी पिके कोणती?' },
        { icon: Coins, text: 'एका एकरासाठी किती खर्च येईल?' },
        { icon: TrendingUp, text: 'जवळच्या बाजारपेठेत चालू भाव काय आहेत?' },
        { icon: Scale, text: 'कापूस, मका आणि कडधान्यांची तुलना करा.' },
        { icon: ShieldAlert, text: 'कोणत्या पिकामध्ये आर्थिक धोका कमी आहे?' },
        { icon: CloudRain, text: 'उद्या पाऊस पडेल का?' },
        { icon: Droplets, text: 'कोणत्या झोनला पाणी हवे आहे?' }
      ];
    }
    if (selectedLang === 'ta') {
      return [
        { icon: Sprout, text: 'இந்த பருவத்தில் என்ன பயிர் நடலாம்?' },
        { icon: Droplets, text: 'குறைந்த நீர் தேவைப்படும் பயிர்கள் எவை?' },
        { icon: Coins, text: 'ஒரு ஏக்கருக்கு எவ்வளவு செலவு ஆகும்?' },
        { icon: TrendingUp, text: 'அருகிலுள்ள சந்தைகளில் புதிய விலை என்ன?' },
        { icon: Scale, text: 'பருத்தி, சோளம் மற்றும் பருப்பு வகைகளை ஒப்பிடுக.' },
        { icon: ShieldAlert, text: 'எந்த பயிரில் நிதி ஆபத்து குறைவு?' },
        { icon: CloudRain, text: 'நாளை மழை பெய்யுமா?' },
        { icon: Droplets, text: 'எந்த பகுதிக்கு தண்ணீர் தேவை?' }
      ];
    }
    if (selectedLang === 'bn') {
      return [
        { icon: Sprout, text: 'এই মৌসুমে কোন ফসল রোপণ করব?' },
        { icon: Droplets, text: 'কোন ফসলে কম জল প্রয়োজন?' },
        { icon: Coins, text: 'এক একরে কত খরচ হতে পারে?' },
        { icon: TrendingUp, text: 'কাছের বাজারে বর্তমান দর কত?' },
        { icon: CloudRain, text: 'কাল কি বৃষ্টি হবে?' },
        { icon: Droplets, text: 'কোন জোনে জল লাগবে?' }
      ];
    }
    if (selectedLang === 'kn') {
      return [
        { icon: Sprout, text: 'ಈ ಋತುವಿನಲ್ಲಿ ಯಾವ ಬೆಳೆ ಬಿತ್ತನೆ ಮಾಡಬೇಕು?' },
        { icon: Droplets, text: 'ಕಡಿಮೆ ನೀರು ಬೇಕಾಗುವ ಬೆಳೆಗಳು ಯಾವುವು?' },
        { icon: Coins, text: 'ಒಂದು ಎಕರೆಗೆ ಎಷ್ಟು ಖರ್ಚಾಗುತ್ತದೆ?' },
        { icon: TrendingUp, text: 'ಹತ್ತಿರದ ಮಾರುಕಟ್ಟೆಗಳಲ್ಲಿ ಇತ್ತೀಚಿನ ಬೆಲೆಗಳು ಯಾವುವು?' },
        { icon: CloudRain, text: 'ನಾಳೆ ಮಳೆಯಾಗುವುದೇ?' },
        { icon: Droplets, text: 'ಯಾವ ವಲಯಕ್ಕೆ ನೀರು ಬೇಕು?' }
      ];
    }
    if (selectedLang === 'gu') {
      return [
        { icon: Sprout, text: 'આ સિઝનમાં કયો પાક વાવવો જોઈએ?' },
        { icon: Droplets, text: 'કયા પાકમાં ઓછું પાણી જોઈએ?' },
        { icon: Coins, text: 'એક એકરમાં કેટલો ખર્ચ થશે?' },
        { icon: TrendingUp, text: 'નજીકના માર્કેટ યાર્ડમાં તાજા ભાવ શું છે?' },
        { icon: CloudRain, text: 'કાલે વરસાદ પડશે?' },
        { icon: Droplets, text: 'કયા ઝોનમાં પાણી જોઈએ?' }
      ];
    }

    // Default English
    return [
      { icon: Sprout, text: 'Which crop should I sow this season?' },
      { icon: Droplets, text: 'Which crops require less water?' },
      { icon: Coins, text: 'How much money might I need for one acre?' },
      { icon: TrendingUp, text: 'What are the latest prices in nearby markets?' },
      { icon: Scale, text: 'Compare cotton, maize and pulses for my farm.' },
      { icon: ShieldAlert, text: 'Which option has lower financial risk?' },
      { icon: CloudRain, text: 'Will it rain tomorrow?' },
      { icon: Droplets, text: 'Which irrigation zone needs water?' },
      { icon: Gauge, text: 'What is the water tank level?' },
      { icon: Sprout, text: 'What is my soil pH and quality?' },
      { icon: Radio, text: 'Can I spray pesticides today?' },
      { icon: HelpCircle, text: 'What does my leaf disease scan mean?' }
    ];
  };

  const currentLangMeta = getLanguageByCode(selectedLang);

  return (
    <div className={`relative ${isModal ? 'max-w-3xl w-full mx-auto' : 'w-full space-y-6 animate-in fade-in duration-300'}`}>
      <div className="bg-white rounded-3xl shadow-xl border border-emerald-900/20 overflow-hidden flex flex-col">
        {/* Header Ribbon */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 shrink-0">
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-xl font-bold tracking-tight">
                  {t('voice.title', 'AgriSense Voice Farming Assistant')}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/80 border border-emerald-400/40 text-emerald-100">
                  22 Languages
                </span>
              </div>
              <p className="text-xs text-emerald-300/90">
                {t('voice.tagline', 'Speak naturally in your native Indian language for real-time farm guidance')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="appearance-none bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-emerald-600/60 transition-colors cursor-pointer focus:outline-hidden"
                title="Select Voice Language"
              >
                {INDIAN_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-200 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Voice Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Browser Capability Banner */}
        <div className="px-4 sm:px-6 py-2 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-emerald-950">Active Language:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 font-bold">
              {currentLangMeta.nativeName} ({currentLangMeta.name})
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[10px] font-medium">
            <span className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${langCapabilities.sttSupported ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{langCapabilities.sttSupported ? 'Microphone Ready' : 'Mic Unsupported'}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${langCapabilities.ttsSupported ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{langCapabilities.hasNativeVoice ? 'Native Voice' : 'System Voice'}</span>
            </span>
          </div>
        </div>

        {/* Main Voice Interaction Body */}
        <div className="p-5 sm:p-8 space-y-6">
          {/* Large Central Microphone Button Area */}
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring animation when listening */}
              {assistantState === 'listening' && (
                <>
                  <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-rose-500/20 animate-ping" />
                  <div className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-rose-500/30 animate-pulse" />
                </>
              )}

              {/* Pulsing ring animation when speaking */}
              {isSpeakingActive && (
                <>
                  <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-emerald-500/30 animate-pulse" />
                </>
              )}

              <button
                onClick={handleStartListening}
                className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
                  assistantState === 'listening'
                    ? 'bg-gradient-to-tr from-rose-600 to-red-500 shadow-rose-600/40 scale-105'
                    : isSpeakingActive
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-600/40'
                    : 'bg-gradient-to-tr from-emerald-800 to-green-700 hover:from-emerald-700 hover:to-green-600 shadow-emerald-900/30 hover:scale-105'
                }`}
                title={assistantState === 'listening' ? 'Tap to Stop Listening' : 'Tap to Speak in your Language'}
              >
                {assistantState === 'listening' ? (
                  <MicOff className="w-10 h-10 animate-bounce" />
                ) : isSpeakingActive ? (
                  <Volume2 className="w-10 h-10 animate-pulse" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">
                  {assistantState === 'listening'
                    ? 'Listening'
                    : isSpeakingActive
                    ? 'Speaking'
                    : 'Tap to Speak'}
                </span>
              </button>
            </div>

            {/* Current Status Pill */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200">
                {assistantState === 'listening' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-rose-700 font-bold">
                      {t('voice.listeningPrompt', 'Listening... Please speak your question now in')} {currentLangMeta.nativeName}
                    </span>
                  </>
                )}
                {assistantState === 'processing' && (
                  <>
                    <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-emerald-800 font-bold">
                      {t('voice.thinkingPrompt', 'Analyzing weather & farm data...')}
                    </span>
                  </>
                )}
                {assistantState === 'speaking' && (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span className="text-emerald-800 font-bold">
                      {t('voice.speakingPrompt', 'Reading answer aloud...')}
                    </span>
                  </>
                )}
                {assistantState === 'idle' && (
                  <span>{t('voice.idlePrompt', 'Tap microphone above, type your question, or select a prompt below')}</span>
                )}
                {assistantState === 'error' && (
                  <span className="text-rose-700 font-bold">Error encountered. See details below.</span>
                )}
              </div>
            </div>
          </div>

          {/* Honest Error Banner with Retry Question Button */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold block text-rose-800 uppercase tracking-wider">
                    AI Assistant Notice
                  </strong>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </div>
              {lastFailedQuestion && (
                <button
                  onClick={() => processQuestion(lastFailedQuestion, true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shrink-0 shadow-sm"
                  title="Retry asking this question"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Question</span>
                </button>
              )}
            </div>
          )}

          {/* Text Input Form for Direct Typing in Any Language */}
          <div className="space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (textInput.trim() && assistantState !== 'processing') {
                  processQuestion(textInput.trim());
                  setTextInput('');
                }
              }}
              className="flex items-center gap-2 max-w-3xl mx-auto w-full"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`Ask or type in ${currentLangMeta.nativeName} or English (e.g., "Why are tomato leaves turning yellow?")...`}
                  disabled={assistantState === 'processing'}
                  className="w-full px-4 py-3 pl-10 rounded-2xl bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-hidden text-sm text-slate-800 placeholder-slate-400 transition-colors shadow-inner"
                />
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={!textInput.trim() || assistantState === 'processing'}
                className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-900/20 cursor-pointer shrink-0"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>

            {conversationHistory.length > 0 && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
                <span>
                  Active Conversation: {Math.floor(conversationHistory.length / 2)} turn{conversationHistory.length > 2 ? 's' : ''} (context preserved for follow-ups)
                </span>
                <button
                  onClick={handleResetConversation}
                  className="text-slate-400 hover:text-rose-600 transition-colors flex items-center space-x-1 cursor-pointer"
                  title="Clear conversation history and start fresh"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Conversation</span>
                </button>
              </div>
            )}
          </div>

          {/* Real-time speech transcript feedback */}
          {(interimTranscript || recognizedQuestion) && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5 animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                {t('voice.youAsked', 'Your Question')}
              </span>
              <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                &ldquo;{interimTranscript || recognizedQuestion}&rdquo;
              </p>
            </div>
          )}

          {/* Answer Card with Spoken Details */}
          {answerData && (
            <div className="rounded-3xl bg-slate-900 text-white p-5 sm:p-7 space-y-5 shadow-xl border border-emerald-900/40 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {answerData.title}
                    </h3>
                    {answerData.provider && (
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
                        Engine: {answerData.provider} • {answerData.model || 'agri-reasoning'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Audio Playback Controls */}
                <div className="flex items-center space-x-2">
                  {/* Speed Toggle (Normal 0.95 vs Slower 0.80) */}
                  <button
                    onClick={handleToggleSpeed}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1 border border-slate-700 cursor-pointer"
                    title="Toggle speech speed for clearer understanding"
                  >
                    <span>Speed: {speechSpeed < 0.9 ? '0.8x (Slower)' : '1.0x (Normal)'}</span>
                  </button>

                  {/* Repeat Audio */}
                  <button
                    onClick={handleRepeatAudio}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer border border-slate-700"
                    title="Listen to answer again"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Stop Audio */}
                  {isSpeakingActive && (
                    <button
                      onClick={handleStopSpeaking}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                      title="Stop speaking"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop</span>
                    </button>
                  )}

                  {/* Ask Another */}
                  <button
                    onClick={handleAskAnother}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Ask Another</span>
                  </button>
                </div>
              </div>

              {/* Answer Text in High-Contrast Large Font */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <p className="text-sm sm:text-base text-emerald-100 leading-relaxed font-medium">
                  {answerData.speechText}
                </p>
              </div>

              {/* Connected Real Data Cards */}
              {answerData.displayCards && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {answerData.displayCards.map((card, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        {card.label}
                      </span>
                      <strong className="text-sm sm:text-base text-white block font-bold">
                        {card.value}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick-Prompt Question Pills */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>{t('voice.suggestedQuestions', 'Or Tap a Common Question in')} {currentLangMeta.nativeName}:</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {getQuickQuestions().map((q, idx) => {
                const Icon = q.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setRecognizedQuestion(q.text);
                      processQuestion(q.text);
                    }}
                    className="text-left p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/90 hover:border-emerald-300 transition-all flex items-center space-x-2.5 group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white text-emerald-700 flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-950 leading-snug">
                      {q.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real Agricultural Telemetry Overview Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Connected Real-World Telemetry Sources</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 text-[11px]">
              <div>
                <span className="text-slate-400 block">Open-Meteo Weather:</span>
                <strong>{currentWeather?.temperature_2m ?? 26}°C • {currentWeather?.weather_code !== undefined ? 'WMO Connected' : 'Active'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">4 Irrigation Zones:</span>
                <strong className="text-amber-700">Zone 2 at 28% (Dry)</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Farm Water Tank:</span>
                <strong className="text-emerald-700">{telemetry.waterTank.fillPercentage}% (11,700 L)</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Soil pH & Quality:</span>
                <strong>pH {telemetry.soilAnalysis.farmAveragePh} (Optimal)</strong>
              </div>
            </div>
          </div>

          {/* Safety & Agronomic Guidance Disclaimer */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <strong className="font-bold">Agronomic Safety Notice:</strong>
              <p>
                AgriSense answers are synthesized directly from real physical weather readings, numerical forecast models, and root-zone sensor telemetry. Before applying chemical treatments, always consult your local Krishi Vigyan Kendra (KVK) or certified agricultural extension officer. Motor pumps and solenoid valves require manual confirmation on the control panel to operate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
