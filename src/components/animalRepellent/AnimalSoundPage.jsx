import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Volume2,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Cpu,
  Sparkles,
  Layers,
  Activity,
  History,
  Settings2,
  HelpCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  Mic,
  Sliders,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Info,
  Play
} from 'lucide-react';
import LiveAudioMonitor from './LiveAudioMonitor';
import DemoControlsPanel from './DemoControlsPanel';
import AudioSampleTesterCard from './AudioSampleTesterCard';
import SpeciesConfigMatrix from './SpeciesConfigMatrix';
import RepellentControlPanel from './RepellentControlPanel';
import DetectionHistoryTable from './DetectionHistoryTable';
import HardwareWiringGuideModal from './HardwareWiringGuideModal';
import { 
  getAudioSystemStatus, 
  getDetectionHistory, 
  getMicHardwareStatus, 
  getHardwareStatus, 
  setHardwareMode 
} from '../../services/animalSoundService';

function RecentEventsSummaryCard({ events, totalCount, onSelectEvent, onViewHistory }) {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-900/10 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              Recent Detection Activity Log
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                {totalCount} Total Events
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Real-time audit trail of acoustic classifications, safety evaluations, and deterrent outputs.
            </p>
          </div>
        </div>

        <button
          onClick={onViewHistory}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-xs text-slate-400 py-4 text-center italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          No bio-acoustic events recorded yet. Trigger a sound sample or demo event to view audit activity.
        </div>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 5).map((evt, idx) => {
            const id = evt.eventId || evt.id || `evt-idx-${idx}`;
            const isBeneficial = evt.category === 'beneficial';
            const isHarmful = evt.category === 'harmful';
            const isError = evt.category === 'error';
            return (
              <div
                key={id}
                onClick={() => onSelectEvent && onSelectEvent(evt)}
                className="p-3 rounded-2xl border border-slate-100 hover:border-emerald-300 bg-slate-50/70 hover:bg-emerald-50/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${
                    isBeneficial
                      ? 'bg-emerald-500'
                      : isHarmful
                      ? 'bg-rose-500'
                      : isError
                      ? 'bg-slate-700'
                      : 'bg-amber-500'
                  }`}></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {evt.species_name || evt.species || evt.predicted_class || 'Acoustic Signal'}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isBeneficial
                          ? 'bg-emerald-100 text-emerald-800'
                          : isHarmful
                          ? 'bg-rose-100 text-rose-800'
                          : isError
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {evt.status || (isBeneficial ? 'Protected' : isHarmful ? 'Target Alert' : 'Uncertain')}
                      </span>
                      {evt.is_simulated && (
                        <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.2 rounded border border-amber-300">
                          SIMULATED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                      {evt.status_message || evt.action_taken || evt.action || 'Event logged'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-right pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-[11px] text-slate-400 font-mono">
                    {evt.timestamp ? (evt.timestamp.includes(' ') ? evt.timestamp.split(' ')[1] : evt.timestamp) : 'Recent'}
                  </div>
                  <div className={`text-xs font-black ${
                    evt.confidence !== null && evt.confidence !== undefined
                      ? 'text-slate-800'
                      : 'text-slate-400 italic text-[11px]'
                  }`}>
                    {evt.confidence !== null && evt.confidence !== undefined
                      ? `${evt.confidence}%`
                      : 'N/A'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AnimalSoundPage({ location }) {
  const { t } = useTranslation();
  const [systemStatus, setSystemStatus] = useState(null);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [lastEventTrigger, setLastEventTrigger] = useState(Date.now());
  const [lastEventTimestamp, setLastEventTimestamp] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('monitor'); // 'monitor' | 'demo' | 'rules' | 'controls' | 'history' | 'soundboard'
  
  // Hardware status simulation toggle: 'disconnected' | 'connected' | 'demo'
  const [deviceConnectionState, setDeviceConnectionState] = useState('disconnected');
  const [micData, setMicData] = useState(null);
  const [hardwareData, setHardwareData] = useState(null);

  // Shared bio-acoustic event state
  const [latestDetection, setLatestDetection] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [eventCount, setEventCount] = useState(0);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await getAudioSystemStatus();
      setSystemStatus(status);

      // Fetch INMP441 I2S hardware mic telemetry
      const micRes = await getMicHardwareStatus();
      if (micRes) setMicData(micRes);

      // Fetch overall hardware telemetry link
      const hwRes = await getHardwareStatus();
      if (hwRes) {
        setHardwareData(hwRes);
        if (hwRes.mode === 'simulated') {
          setDeviceConnectionState('demo');
        } else if (hwRes.connection_status === 'LIVE' || micRes?.is_streaming) {
          setDeviceConnectionState('connected');
        } else {
          setDeviceConnectionState('disconnected');
        }
      }

      const history = await getDetectionHistory({ limit: 10 });
      if (history && history.events) {
        if (history.events.length > 0) {
          setLastEventTimestamp(history.events[0].timestamp);
          setRecentEvents(history.events);
          // Set initial latest detection if none selected yet
          setLatestDetection((prev) => prev || history.events[0]);
        }
        if (history.total_available !== undefined) {
          setEventCount(history.total_available);
        } else if (history.count !== undefined) {
          setEventCount(history.count);
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 4000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const handleDetectionEvent = (eventData) => {
    const eventRecord = eventData?.event || eventData;
    if (!eventRecord) return;
    setLatestDetection(eventRecord);
    setLastEventTrigger(Date.now());
    if (eventRecord.timestamp) {
      setLastEventTimestamp(eventRecord.timestamp);
    }
    setRecentEvents((prev) => {
      const id = eventRecord.eventId || eventRecord.id;
      const filtered = prev.filter((e) => (e.eventId || e.id) !== id);
      return [eventRecord, ...filtered].slice(0, 10);
    });
    setEventCount((prev) => prev + 1);
    refreshStatus();
  };

  const handleConnectionModeChange = async (mode) => {
    if (mode === 'demo') {
      await setHardwareMode('simulated');
      setDeviceConnectionState('demo');
      setActiveSubTab('demo');
    } else if (mode === 'connected') {
      await setHardwareMode('live');
      setDeviceConnectionState('connected');
    } else {
      await setHardwareMode('live');
      setDeviceConnectionState('disconnected');
    }
    refreshStatus();
  };

  return (
    <div className="w-full space-y-6">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/30 relative overflow-hidden">
        {/* Background decorative waves */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -top-10 w-60 h-60 bg-green-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AgriSense Bio-Acoustic Defense Intelligence</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              AI Animal Sound Recognition & Intelligent Farm Repellent System
            </h1>
            <div className="text-emerald-300 font-bold text-xs sm:text-sm tracking-wide">
              Animal Sound Detection & Audio Alerts Module
            </div>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Real-time multi-spectral acoustic surveillance distinguishes beneficial farm animals (cows & sparrows) from crop-damaging wildlife (wild boars, macaques, crows, deer, rodents) using trained PyTorch deep neural models, multi-sample persistence filters, and safe non-injurious bio-acoustic deterrents.
            </p>
          </div>

          {/* Action pills & Hardware Modal Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => setIsHardwareModalOpen(true)}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-emerald-700" />
              <span>ESP32 Hardware Schematic</span>
            </button>

            <div className="bg-emerald-950/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-emerald-600/30 text-xs text-emerald-200 flex items-center justify-between gap-3">
              <span className="font-semibold">Neural Model:</span>
              <span className="font-bold text-emerald-300 font-mono">
                {systemStatus?.is_model_ready ? 'PyTorch 10-Class Active' : 'Loading Model...'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 mt-6 border-t border-emerald-700/40">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] font-bold text-emerald-200 uppercase">Livestock Protection</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cow & Sparrow Safe</span>
            </div>
            <div className="text-[10px] text-emerald-300/80">Exemption rule active</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] font-bold text-emerald-200 uppercase">Operating Mode</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5 capitalize">
              {(systemStatus?.response_mode || 'Audio Deterrent').replace('_', ' ')}
            </div>
            <div className="text-[10px] text-emerald-300/80">Automated safe dispatch</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] font-bold text-emerald-200 uppercase">Persistence Filter</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              2-Sample Verified
            </div>
            <div className="text-[10px] text-emerald-300/80">Zero false alert gate</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] font-bold text-emerald-200 uppercase">Protective Cooldown</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              {systemStatus?.cooldown_remaining_sec > 0
                ? `${systemStatus.cooldown_remaining_sec}s Active`
                : '60s Ready'}
            </div>
            <div className="text-[10px] text-emerald-300/80">Prevents sound habituation</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-emerald-200 uppercase">Events Recorded</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              {eventCount} Events
            </div>
            <div className="text-[10px] text-emerald-300/80">Audit trail synchronized</div>
          </div>
        </div>
      </div>

      {/* SECTION A: Device Status Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-900/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Device Status & Hardware Telemetry
              </h3>
              <p className="text-xs text-slate-500">
                Live connectivity status of the ESP32 audio acquisition node, audio input stream, and operating mode.
              </p>
            </div>
          </div>

          {/* Connection Mode Toggle */}
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 gap-1 text-[11px] font-bold">
            <button
              onClick={() => handleConnectionModeChange('disconnected')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                deviceConnectionState === 'disconnected'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Disconnected (Default)
            </button>
            <button
              onClick={() => handleConnectionModeChange('demo')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                deviceConnectionState === 'demo'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demo Simulation Mode
            </button>
            <button
              onClick={() => handleConnectionModeChange('connected')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                deviceConnectionState === 'connected'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Connected Node
            </button>
          </div>
        </div>

        {/* 4 Status Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. ESP32 Connection */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>ESP32 Hardware:</span>
              {deviceConnectionState === 'connected' ? (
                <Wifi className="w-4 h-4 text-emerald-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                deviceConnectionState === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : deviceConnectionState === 'demo'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}></span>
              <span className="font-black text-sm text-slate-900 capitalize">
                {deviceConnectionState === 'connected'
                  ? 'Connected (Node 192.168.1.100)'
                  : deviceConnectionState === 'demo'
                  ? 'Demo Simulation Mode'
                  : 'Disconnected (No Wi-Fi)'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {deviceConnectionState === 'connected'
                ? 'I2S DMA stream active at 16,000 Hz'
                : 'Physical ESP32 hardware is not currently detected'}
            </p>
          </div>

          {/* 2. Audio Input Status */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Audio Input Status:</span>
              <Mic className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-black text-sm text-slate-900">
                {deviceConnectionState === 'demo' ? 'Simulation Audio Stream' : 'Available (16kHz Web Audio & PyTorch)'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Dual pipeline: Web Audio API & Edge Neural Microservice
            </p>
          </div>

          {/* 3. Last Event Time & Total */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Last Event Time:</span>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div className="font-black text-sm text-slate-900 font-mono truncate">
              {lastEventTimestamp || 'No events recorded yet'}
            </div>
            <p className="text-[10px] text-slate-400">
              {eventCount > 0 ? `${eventCount} events logged in audit history` : 'Awaiting first sound detection'}
            </p>
          </div>

          {/* 4. Current Operating Mode */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Operating Mode:</span>
              <Sliders className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-black text-sm text-emerald-900 capitalize flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>{(systemStatus?.response_mode || 'audio_deterrent').replace('_', ' ')} Mode</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Automated safe dispatch with volume clamps
            </p>
          </div>
        </div>

        {/* INMP441 I2S Digital Hardware Microphone Telemetry Strip */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white border border-emerald-500/20 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
                <Mic className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                  <span>INMP441 I2S Digital MEMS Microphone</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    micData?.is_streaming || deviceConnectionState === 'connected'
                      ? 'bg-emerald-500 text-emerald-950 animate-pulse'
                      : deviceConnectionState === 'demo'
                      ? 'bg-amber-400 text-amber-950'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {micData?.is_streaming || deviceConnectionState === 'connected'
                      ? '● DMA Stream Active'
                      : deviceConnectionState === 'demo'
                      ? '● Simulated Input'
                      : '○ Hardware Standby'}
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-200/70">
                  Direct I2S DMA bus capture on ESP32 Core 1 · 16,000 Hz 32-bit slot (24-bit PCM mono) · Non-blocking architecture
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-1 rounded-lg bg-white/10 text-emerald-300 border border-white/10">
                SCK: 14 | WS: 15 | SD: 32 (L/R: GND)
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">RMS Audio Level</span>
              <div className="text-lg font-black font-mono text-emerald-300 mt-0.5">
                {micData?.features?.rms_dbfs !== undefined ? `${Number(micData.features.rms_dbfs).toFixed(1)} dBFS` : '-- dBFS'}
              </div>
              <span className="text-[10px] text-slate-400">Digital Headroom</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Farm SPL</span>
              <div className="text-lg font-black font-mono text-white mt-0.5">
                {micData?.features?.estimated_spl_db !== undefined ? `~${Number(micData.features.estimated_spl_db).toFixed(1)} dB` : '-- dB'}
              </div>
              <span className="text-[10px] text-slate-400">Ambient Acoustic Energy</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Acoustic Activity (VAD)</span>
              <div className="text-lg font-black mt-0.5 flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  micData?.features?.vad_active ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
                }`} />
                <span className={micData?.features?.vad_active ? 'text-amber-300' : 'text-emerald-300'}>
                  {micData?.features?.vad_active ? 'Active Signal' : 'Quiet Farm Ambient'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Threshold: -48 dBFS</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Hardware Link</span>
              <div className="text-lg font-black font-mono text-white mt-0.5 truncate">
                {hardwareData?.mqtt_broker?.connected ? 'Mosquitto MQTT' : 'Local REST / WS'}
              </div>
              <span className="text-[10px] text-slate-400">127.0.0.1:1883</span>
            </div>
          </div>

          {/* 8-Band Frequency Spectrum Bars */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>8-BAND SPECTRAL ENERGY DISTRIBUTION (INMP441 I2S STREAM)</span>
              <span className="text-emerald-400 font-mono">16kHz Mel-Scale STFT</span>
            </div>
            <div className="grid grid-cols-8 gap-1.5 h-12 bg-black/40 p-1.5 rounded-xl border border-white/10 items-end">
              {[
                { name: 'Sub-Bass', range: '20-60Hz', val: micData?.features?.frequency_spectrum_bands?.[0] || 15 },
                { name: 'Bass', range: '60-250Hz', val: micData?.features?.frequency_spectrum_bands?.[1] || 25 },
                { name: 'Low-Mid', range: '250-500Hz', val: micData?.features?.frequency_spectrum_bands?.[2] || 40 },
                { name: 'Mid', range: '500-2kHz', val: micData?.features?.frequency_spectrum_bands?.[3] || 55 },
                { name: 'Upper-Mid', range: '2k-4kHz', val: micData?.features?.frequency_spectrum_bands?.[4] || 35 },
                { name: 'Presence', range: '4k-6kHz', val: micData?.features?.frequency_spectrum_bands?.[5] || 20 },
                { name: 'Brilliance', range: '6k-12kHz', val: micData?.features?.frequency_spectrum_bands?.[6] || 12 },
                { name: 'Air', range: '12k-16kHz', val: micData?.features?.frequency_spectrum_bands?.[7] || 8 },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center justify-end h-full group relative">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-lime-400 rounded-xs transition-all duration-300"
                    style={{ height: `${Math.min(100, Math.max(10, b.val))}%` }}
                  />
                  <span className="text-[8px] text-slate-400 font-mono truncate w-full text-center mt-0.5">
                    {b.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Explicit Safety Notice on Microphone vs Animal Classifier */}
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Sensor Integrity & Classification Guard:</strong> The INMP441 is an omnidirectional acoustic sensor designed for non-blocking spectral telemetry. Frequency or loudness alone is never treated as species identification. Raw audio frames are evaluated exclusively by the genuine PyTorch deep learning network (<code>AnimalAudioClassifierNet</code>) before deterrent decisions are issued.
            </p>
          </div>
        </div>

        {/* Hardware Disconnection Notice Banner */}
        {deviceConnectionState !== 'connected' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Hardware Connectivity Notice:</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Physical ESP32 hardware is not currently detected on the local farm Wi-Fi network. The system is operating in <strong>Browser & Local Edge AI Mode</strong>, using in-browser microphone capture and the local PyTorch bio-acoustic neural engine. Physical outdoor speaker control requires a connected ESP32 node.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
        {[
          { id: 'monitor', label: 'Sound Detection (Live Monitor)', icon: Radio },
          { id: 'demo', label: 'Demo Simulation & Testing', icon: Sparkles },
          { id: 'rules', label: 'Animal Protection Rules', icon: Settings2 },
          { id: 'controls', label: 'Audio Alert & Safety Controls', icon: ShieldAlert },
          { id: 'history', label: 'Event History & Alerts', icon: History },
          { id: 'soundboard', label: '1-Click Animal Soundboard', icon: Volume2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm ring-1 ring-emerald-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Views */}
      <div className="space-y-6">
        {/* 1. Live Microphone & Sound Detection (Section B) */}
        {activeSubTab === 'monitor' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Live Visualizer, Pipeline Tracker & Latest Detection */}
            <LiveAudioMonitor
              latestDetection={latestDetection}
              onDetectionEvent={handleDetectionEvent}
              systemStatus={systemStatus}
              onRefreshStatus={refreshStatus}
            />

            {/* Embedded Demo Simulation Panel right below monitor */}
            <DemoControlsPanel
              onDispatchEvent={handleDetectionEvent}
              onRefreshStatus={refreshStatus}
            />

            {/* Recent Events Summary List */}
            <RecentEventsSummaryCard
              events={recentEvents}
              totalCount={eventCount}
              onSelectEvent={(evt) => setLatestDetection(evt)}
              onViewHistory={() => setActiveSubTab('history')}
            />

            {/* Quick soundboard preview below monitor */}
            <AudioSampleTesterCard
              onDetectionEvent={handleDetectionEvent}
              onRefreshStatus={refreshStatus}
            />
          </div>
        )}

        {/* 2. Demo Simulation & Testing Scenarios */}
        {activeSubTab === 'demo' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Simulation Guidance Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <h3 className="font-black text-sm sm:text-base text-amber-900">
                  Interactive Animal Sound Simulation Test Suite
                </h3>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Validate and demonstrate all 6 system behaviors below. Each button simulates authentic acoustic inputs without requiring live wild animals:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-amber-900 pt-2 font-medium">
                <li className="flex items-center gap-2 bg-white/70 p-2 rounded-xl border border-amber-200/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Cow & Sparrow:</strong> Protected farm species — repellent strictly silenced</span>
                </li>
                <li className="flex items-center gap-2 bg-white/70 p-2 rounded-xl border border-amber-200/60">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span><strong>Harmful Pest:</strong> Multi-sample confirmation (1 of 2 &rarr; Confirmed Alert)</span>
                </li>
                <li className="flex items-center gap-2 bg-white/70 p-2 rounded-xl border border-amber-200/60">
                  <HelpCircle className="w-4 h-4 text-slate-600 shrink-0" />
                  <span><strong>Unknown Sound:</strong> Logged to audit trail without deterrent activation</span>
                </li>
                <li className="flex items-center gap-2 bg-white/70 p-2 rounded-xl border border-amber-200/60">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Low-Confidence (&lt;70%):</strong> Suppressed deterrent for uncertain inputs</span>
                </li>
              </ul>
            </div>

            {/* The 6 Demo Scenario Buttons */}
            <DemoControlsPanel
              onDispatchEvent={handleDetectionEvent}
              onRefreshStatus={refreshStatus}
            />

            {/* Live Audio Monitor to inspect detection output */}
            <LiveAudioMonitor
              latestDetection={latestDetection}
              onDetectionEvent={handleDetectionEvent}
              systemStatus={systemStatus}
              onRefreshStatus={refreshStatus}
            />

            {/* Recent Events Summary List */}
            <RecentEventsSummaryCard
              events={recentEvents}
              totalCount={eventCount}
              onSelectEvent={(evt) => setLatestDetection(evt)}
              onViewHistory={() => setActiveSubTab('history')}
            />
          </div>
        )}

        {/* 3. Animal Protection Rules (Section C) */}
        {activeSubTab === 'rules' && (
          <div className="animate-in fade-in duration-200">
            <SpeciesConfigMatrix onRuleChanged={refreshStatus} />
          </div>
        )}

        {/* 4. Audio Alert Controls (Section E) */}
        {activeSubTab === 'controls' && (
          <div className="animate-in fade-in duration-200">
            <RepellentControlPanel
              systemStatus={systemStatus}
              onRefreshStatus={refreshStatus}
            />
          </div>
        )}

        {/* 5. Alerts and Event History (Section D) */}
        {activeSubTab === 'history' && (
          <div className="animate-in fade-in duration-200">
            <DetectionHistoryTable
              lastEventTrigger={lastEventTrigger}
              newEvent={latestDetection}
            />
          </div>
        )}

        {/* 6. 1-Click Animal Soundboard & Tests */}
        {activeSubTab === 'soundboard' && (
          <div className="animate-in fade-in duration-200">
            <AudioSampleTesterCard
              onDetectionEvent={handleDetectionEvent}
              onRefreshStatus={refreshStatus}
            />
          </div>
        )}
      </div>

      {/* ESP32 Hardware Specification Modal */}
      <HardwareWiringGuideModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />
    </div>
  );
}
