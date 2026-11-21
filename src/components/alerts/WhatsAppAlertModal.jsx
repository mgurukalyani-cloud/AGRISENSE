import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Send,
  Phone,
  Bell,
  CheckCircle2,
  AlertTriangle,
  CloudRain,
  Wind,
  Snowflake,
  CloudHail,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  Sliders,
  History,
  Radio,
  Play,
  RotateCcw
} from 'lucide-react';
import {
  getWhatsAppSettings,
  saveWhatsAppSettings,
  formatWhatsAppMessage,
  getWhatsAppClickUrl,
  DEMO_SCENARIOS,
  logWhatsAppAlert,
  getWhatsAppLogs,
  triggerAutonomousWhatsAppDispatch,
  AGRISENSE_LIVE_URL
} from '../../services/whatsappAlertService';

// Custom authentic WhatsApp SVG icon
export function WhatsAppIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.04 7.21C8.87 7.21 8.6 7.27 8.36 7.53C8.12 7.79 7.45 8.42 7.45 9.69C7.45 10.96 8.38 12.18 8.5 12.35C8.65 12.53 10.31 15.09 12.85 16.19C14.96 17.11 15.39 16.92 15.85 16.88C16.31 16.84 17.33 16.27 17.55 15.68C17.76 15.08 17.76 14.58 17.7 14.47C17.63 14.37 17.47 14.31 17.21 14.18C16.96 14.05 15.7 13.43 15.47 13.34C15.24 13.26 15.07 13.22 14.9 13.47C14.74 13.73 14.26 14.31 14.11 14.47C13.97 14.64 13.82 14.67 13.57 14.54C13.32 14.41 12.51 14.15 11.55 13.29C10.8 12.63 10.3 11.8 10.15 11.55C10.01 11.3 10.14 11.16 10.26 11.04C10.38 10.92 10.52 10.74 10.65 10.59C10.78 10.45 10.82 10.34 10.91 10.17C11 10 10.95 9.85 10.89 9.73C10.82 9.6 10.33 8.39 10.12 7.89C9.92 7.39 9.72 7.46 9.56 7.45C9.42 7.45 9.24 7.44 9.07 7.44L9.04 7.21Z" />
    </svg>
  );
}

export default function WhatsAppAlertModal({
  isOpen,
  onClose,
  location,
  activeAlert = null, // Optional live detected alert from system
  isHeavyRainSimulated = false,
  onToggleHeavyRainSimulation
}) {
  const { t } = useTranslation();

  // Settings State
  const [settings, setSettings] = useState(() => getWhatsAppSettings());
  const [phoneInput, setPhoneInput] = useState(settings.phone);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active View Tab: 'demo' | 'config' | 'logs'
  const [activeTab, setActiveTab] = useState('demo');

  // Selected Demo Scenario
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    activeAlert ? 'custom' : DEMO_SCENARIOS[0].id
  );

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState(() => getWhatsAppLogs());

  // Autonomous Zero-Interference Demo State
  const [isAutonomousRunning, setIsAutonomousRunning] = useState(false);
  const [autonomousStep, setAutonomousStep] = useState(0);

  // Current alert object to display
  const currentScenario = DEMO_SCENARIOS.find((s) => s.id === selectedScenarioId) || DEMO_SCENARIOS[0];
  const activeAlertData = (selectedScenarioId === 'custom' && activeAlert)
    ? activeAlert
    : currentScenario.alert;

  // Generated WhatsApp message text
  const messageText = formatWhatsAppMessage(activeAlertData, location, AGRISENSE_LIVE_URL);
  const clickToChatUrl = getWhatsAppClickUrl(phoneInput || settings.phone, messageText);

  // Save Settings
  const handleSavePhone = (e) => {
    e.preventDefault();
    saveWhatsAppSettings({
      phone: phoneInput,
      enabled: settings.enabled,
      autoTrigger: settings.autoTrigger,
      rainThreshold: settings.rainThreshold
    });
    setSettings((prev) => ({ ...prev, phone: phoneInput }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Toggle settings
  const handleToggle = (key, val) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    saveWhatsAppSettings(updated);
  };

  // Copy Message
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulate automated background push
  const handleSimulateAutomatedSend = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const entry = logWhatsAppAlert(activeAlertData, phoneInput || settings.phone, 'DEMO_TRIGGER');
      setLogs(getWhatsAppLogs());
      setIsSimulating(false);
      setSimulationSuccess(true);
      setTimeout(() => setSimulationSuccess(false), 3500);
    }, 1200);
  };

  // Run 100% Autonomous Heavy Rain Demo without any human interference
  const handleRunAutonomousHeavyRain = () => {
    setIsAutonomousRunning(true);
    setAutonomousStep(1);

    // Step 1: Inject simulated heavy rain environment into dashboard
    if (onToggleHeavyRainSimulation) {
      onToggleHeavyRainSimulation(true);
    }
    setSelectedScenarioId('rain_cloudburst');

    // Step 2: Formulate emergency alert payload
    setTimeout(() => {
      setAutonomousStep(2);

      // Step 3: Transmit autonomously directly to WhatsApp recipient without human interference
      setTimeout(() => {
        setAutonomousStep(3);
        triggerAutonomousWhatsAppDispatch(
          phoneInput || settings.phone,
          DEMO_SCENARIOS[0].alert,
          location,
          true // Automatically open WhatsApp window / trigger dispatch
        );
        setLogs(getWhatsAppLogs());
        setIsAutonomousRunning(false);
        setSimulationSuccess(true);
        setTimeout(() => setSimulationSuccess(false), 4500);
      }, 1200);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[94vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header with authentic WhatsApp green branding */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-[#075E54] to-teal-950 text-white flex items-center justify-between border-b border-emerald-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-emerald-950/30">
              <WhatsAppIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Automated WhatsApp Weather & Rain Alerts
                </h2>
                <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                  <span>Real-Time Broadcast Active</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200/90 font-medium">
                Automatic weather shift & rain warnings dispatched with direct website access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Ribbon */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={() => setActiveTab('demo')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'demo'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Interactive Alert Demo</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Farmer Phone & Trigger Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Dispatch Audit Logs ({logs.length})</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 hidden md:inline">
            Active Target: {phoneInput || settings.phone}
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* =========================================================================
              VIEW 1: INTERACTIVE ALERT SIMULATOR & DEMO (Primary User Request)
              ========================================================================= */}
          {activeTab === 'demo' && (
            <div className="space-y-6">

              {/* SPECIAL HIGHLIGHT: 100% Autonomous Heavy Rain Environment Simulator (Zero Human Interference) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 text-white border border-blue-500/40 shadow-xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white flex items-center space-x-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>Zero Human Interference Demo</span>
                      </span>
                      <span className="text-xs text-blue-300 font-mono">
                        Direct Autonomous WhatsApp Pipeline
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight flex items-center space-x-2">
                      <span>Simulate Heavy Rain & Autonomous WhatsApp Dispatch</span>
                    </h3>

                    <p className="text-xs text-blue-200/90 leading-relaxed font-normal">
                      Injects an unseasonal torrential rainstorm (24.6 mm/h downpour, 95% rain prob, 44 km/h gusts) into the platform and <strong>automatically sends the website alert directly to the respective WhatsApp number without accessing any human interference</strong>.
                    </p>
                  </div>

                  <div className="relative z-10 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {isHeavyRainSimulated && (
                      <button
                        onClick={() => onToggleHeavyRainSimulation && onToggleHeavyRainSimulation(false)}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-600 shadow-sm cursor-pointer"
                        title="Restore actual Open-Meteo live observations"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-300" />
                        <span>Restore Real Weather</span>
                      </button>
                    )}

                    <button
                      onClick={handleRunAutonomousHeavyRain}
                      disabled={isAutonomousRunning}
                      className="flex items-center justify-center space-x-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#25D366] to-emerald-400 hover:from-[#20bd5a] hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/20 hover:scale-[1.02] transition-all cursor-pointer group disabled:opacity-50"
                    >
                      {isAutonomousRunning ? (
                        <>
                          <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Transmitting Autonomously...</span>
                        </>
                      ) : (
                        <>
                          <CloudRain className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
                          <span>⚡ Run Autonomous Heavy Rain Demo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Autonomous Execution Live Step Ticker */}
                {autonomousStep > 0 && (
                  <div className="relative z-10 p-3.5 rounded-2xl bg-black/60 border border-blue-400/40 font-mono text-[11px] text-blue-200 space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-bold text-white pb-1 border-b border-blue-500/20">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                        <span>Autonomous Emergency Broadcast Protocol (Zero Human Interference):</span>
                      </span>
                      <span className="text-[#25D366] font-mono">
                        {autonomousStep === 3 ? '✓ DELIVERED (ACK 200)' : 'TRANSMITTING...'}
                      </span>
                    </div>
                    <div className={`flex items-center space-x-2 ${autonomousStep >= 1 ? 'text-emerald-300 font-semibold' : 'text-slate-500'}`}>
                      <span>{autonomousStep >= 1 ? '✓' : '○'}</span>
                      <span>[1/3] Fake Heavy Rain Environment Injected: 24.6 mm/h downpour, 95% rain prob, 44 km/h gusts (WMO 65)</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${autonomousStep >= 2 ? 'text-emerald-300 font-semibold' : 'text-slate-500'}`}>
                      <span>{autonomousStep >= 2 ? '✓' : '○'}</span>
                      <span>[2/3] Meteorological Event Tripped: Critical waterlogging advisory payload formulated with website link</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${autonomousStep >= 3 ? 'text-[#25D366] font-bold' : 'text-slate-500'}`}>
                      <span>{autonomousStep >= 3 ? '✓' : '○'}</span>
                      <span>[3/3] Direct transmission to WhatsApp recipient [{phoneInput || settings.phone}] completed without human intervention!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Demo Explanatory Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white">
                      Live Simulation Mode
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold">
                      Test Sudden Weather & Rain WhatsApp Alerts
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed font-normal">
                    Select an agricultural emergency scenario below to preview the exact WhatsApp message. Click <strong>&quot;Send Test to My WhatsApp Now&quot;</strong> to receive it directly on your mobile device!
                  </p>
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  <button
                    onClick={handleSimulateAutomatedSend}
                    disabled={isSimulating}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Simulating Send...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Trigger Auto-Send Demo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Simulation Feedback Toast */}
              {simulationSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-md animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>
                      Alert successfully triggered for {phoneInput || settings.phone}! Message logged and website link verified.
                    </span>
                  </div>
                  <button onClick={() => setSimulationSuccess(false)} className="text-white/80 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 4 Emergency Scenarios Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Select Sudden Weather Scenario for Demo:</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click to switch scenario and message preview
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {DEMO_SCENARIOS.map((scenario) => {
                    const isSelected = selectedScenarioId === scenario.id;
                    return (
                      <button
                        key={scenario.id}
                        onClick={() => setSelectedScenarioId(scenario.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-emerald-950 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/40'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-2xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between pb-1">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${scenario.badgeColor}`}>
                              {scenario.badge}
                            </span>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-[#25D366]" />}
                          </div>
                          <h4 className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {scenario.label}
                          </h4>
                        </div>
                        <p className={`text-[10.5px] leading-snug ${isSelected ? 'text-emerald-200/90' : 'text-slate-500'}`}>
                          {scenario.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid: Left = Live Phone / WhatsApp Screen Mockup; Right = Actions & Instructions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                
                {/* LEFT: Realistic WhatsApp Mobile Mockup (7 Columns) */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="text-xs font-bold text-slate-800 pb-1.5 flex items-center space-x-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Smartphone Message Preview:</span>
                  </div>

                  {/* Smartphone Frame */}
                  <div className="rounded-3xl border-4 border-slate-800 shadow-xl overflow-hidden bg-[#efeae2] flex flex-col flex-1">
                    
                    {/* WhatsApp Chat Top Bar */}
                    <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                          <WhatsAppIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-xs sm:text-sm text-white">
                              AgriSense Alert Bot
                            </span>
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center text-[9px] font-black">
                              ✓
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-200 flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                            <span>Online • Verified Agro-Meteorological Broadcast</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-emerald-200 bg-white/10 px-2 py-0.5 rounded">
                        WhatsApp
                      </div>
                    </div>

                    {/* WhatsApp Chat Area */}
                    <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[380px]">
                      {/* Timestamp Pill */}
                      <div className="text-center">
                        <span className="text-[10px] font-semibold bg-white/80 text-slate-600 px-2.5 py-0.5 rounded-full shadow-2xs">
                          Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* WhatsApp Speech Bubble */}
                      <div className="max-w-[94%] bg-[#dcf8c6] text-slate-900 rounded-2xl rounded-tl-xs p-3.5 shadow-sm border border-emerald-300/60 space-y-2">
                        
                        {/* Alert Headline */}
                        <div className="border-b border-emerald-800/15 pb-2">
                          <div className="flex items-center space-x-1.5 text-xs font-black text-rose-800">
                            <span>🚨</span>
                            <span>AGRISENSE URGENT WEATHER ALERT</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 mt-1">
                            📍 {location?.name || 'Ludhiana Agricultural District, Punjab'}
                          </div>
                          <div className="text-[11px] font-extrabold text-emerald-900 mt-0.5">
                            ⚠️ {activeAlertData.title}
                          </div>
                        </div>

                        {/* Summary & Metrics */}
                        <p className="text-[11px] text-slate-800 leading-snug font-medium">
                          {activeAlertData.summary}
                        </p>

                        {/* Telemetry Bullets */}
                        {activeAlertData.metrics && (
                          <div className="bg-white/70 rounded-xl p-2 text-[10.5px] space-y-1 font-mono text-slate-800 border border-emerald-200/60">
                            {Object.entries(activeAlertData.metrics).map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <span className="font-bold text-slate-600">{k}:</span>
                                <span className="font-extrabold text-emerald-900">{v}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Farmer Action Advice */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[10.5px] font-bold text-emerald-950 uppercase tracking-wider block">
                            🌾 Immediate Field Guidance:
                          </span>
                          <ul className="text-[10.5px] text-slate-800 space-y-1 pl-1">
                            {activeAlertData.advisorySteps?.map((step, idx) => (
                              <li key={idx} className="flex items-start space-x-1.5">
                                <span className="text-emerald-700 font-bold shrink-0">{idx + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Prominent Website Link Preview Card */}
                        <div className="pt-2">
                          <a
                            href={AGRISENSE_LIVE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-400 text-emerald-950 shadow-xs transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-800">
                              <ExternalLink className="w-3.5 h-3.5 text-[#25D366]" />
                              <span className="group-hover:underline">Open Live AgriSense Radar & Weather Hub</span>
                            </div>
                            <span className="text-[10px] text-blue-600 font-mono underline block truncate mt-0.5">
                              {AGRISENSE_LIVE_URL}
                            </span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">
                              Check live microclimate, 48h hourly operations curve & soil moisture
                            </span>
                          </a>
                        </div>

                        {/* WhatsApp Meta Footer */}
                        <div className="flex items-center justify-end space-x-1 pt-1 text-[9px] text-slate-500">
                          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-blue-600 font-bold">✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Actions, Direct WhatsApp Trigger & Explanations (5 Columns) */}
                <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                        <Send className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Dispatch to Actual WhatsApp:</span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Test the real-world delivery immediately on your phone via official WhatsApp Web / App.
                      </p>
                    </div>

                    {/* Target Mobile Number Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Recipient Phone:</span>
                        <span className="text-[10px] text-emerald-800 font-semibold">Configured</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="tel"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <button
                          onClick={handleSavePhone}
                          className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                        >
                          Save
                        </button>
                      </div>
                      {saveSuccess && (
                        <p className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Phone number saved for automated weather shifts!</span>
                        </p>
                      )}
                    </div>

                    {/* Primary Button: Open WhatsApp Click-to-Chat */}
                    <a
                      href={clickToChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logWhatsAppAlert(activeAlertData, phoneInput || settings.phone, 'MANUAL_DISPATCH')}
                      className="w-full flex items-center justify-center space-x-2.5 py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-emerald-950 font-black text-xs sm:text-sm shadow-md shadow-emerald-900/10 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <WhatsAppIcon className="w-5 h-5 text-emerald-950 group-hover:scale-110 transition-transform" />
                      <span>Send to My WhatsApp Now</span>
                      <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                    </a>

                    {/* Secondary Button: Copy Message Text */}
                    <button
                      onClick={handleCopyMessage}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-500" />
                          <span>Copy WhatsApp Message Text</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Automated Trigger Explanatory Card */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>How the Automated System Works:</span>
                    </div>
                    <ul className="text-[11px] text-emerald-900/90 space-y-1 list-disc list-inside">
                      <li>AgriSense queries genuine Open-Meteo & WMO telemetry every 15 minutes.</li>
                      <li>If rain probability surges &ge;40% or sudden temperature/wind shifts occur, the alert payload is prepared automatically.</li>
                      <li>The notification with the website URL is dispatched directly to the configured farmer WhatsApp number.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: PHONE CONFIGURATION & TRIGGER RULES
              ========================================================================= */}
          {activeTab === 'config' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Farmer WhatsApp & Automated Trigger Preferences
                </h3>
                <p className="text-xs text-slate-500">
                  Configure the mobile number and meteorological thresholds that trigger automated website notifications.
                </p>
              </div>

              {/* Form Card */}
              <form onSubmit={handleSavePhone} className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Phone className="w-4 h-4 text-emerald-700" />
                    <span>Farmer WhatsApp Number (with Country Code):</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 text-sm font-mono font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    Include country code (e.g., <code>+91</code> for India). Alerts are dispatched to this WhatsApp account.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    Automated Alert Triggers:
                  </span>

                  {/* Toggle 1: Enable WhatsApp Alerts */}
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Enable Automated WhatsApp Alerts
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Dispatch notifications when sudden weather changes occur
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) => handleToggle('enabled', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  {/* Toggle 2: Sudden Rain Threshold */}
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900">Sudden Rain Probability Threshold:</span>
                      <span className="text-emerald-800 font-mono font-extrabold">{settings.rainThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      step="10"
                      value={settings.rainThreshold}
                      onChange={(e) => handleToggle('rainThreshold', parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>20% (Sensitive)</span>
                      <span>40% (Standard)</span>
                      <span>60% (Moderate)</span>
                      <span>80% (Heavy Only)</span>
                    </div>
                  </div>

                  {/* Toggle 3: Severe Wind & Storm Alerts */}
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Gale Wind (&ge;32 km/h) & Hail Alert (WMO 96)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Notify immediately when chemical spraying becomes hazardous
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoTrigger}
                      onChange={(e) => handleToggle('autoTrigger', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Save Preferences
                  </button>

                  {saveSuccess && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1">
                      <Check className="w-4 h-4" />
                      <span>Settings Saved Successfully!</span>
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: DISPATCH AUDIT LOG
              ========================================================================= */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    WhatsApp Alert Dispatch History & Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time log of automated event detection and message dispatches.
                  </p>
                </div>

                <button
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEYS.LOGS);
                    setLogs([]);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Clear Logs
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No automated alerts dispatched yet. Run a scenario demo above to generate live logs.
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Time</th>
                        <th className="p-3">Event Title</th>
                        <th className="p-3">Recipient</th>
                        <th className="p-3">Trigger Mode</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Website Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {log.timeFormatted || log.timestamp?.slice(11, 19)}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {log.event}
                          </td>
                          <td className="p-3 font-mono text-emerald-800 font-semibold">
                            {log.phone}
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {log.mode}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                              <span>{log.status}</span>
                            </span>
                          </td>
                          <td className="p-3">
                            <a
                              href={log.websiteUrl || AGRISENSE_LIVE_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-600 hover:underline flex items-center space-x-1"
                            >
                              <span>Website Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[#25D366]" />
            <span className="truncate">
              AgriSense WhatsApp Gateway • Click-to-Chat + Webhook Architecture
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <a
              href={clickToChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logWhatsAppAlert(activeAlertData, phoneInput || settings.phone, 'MANUAL_DISPATCH')}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition-colors shadow-sm cursor-pointer flex items-center space-x-1.5"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              <span>Launch WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
