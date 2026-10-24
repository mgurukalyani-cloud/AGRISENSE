import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cpu,
  Radio,
  Volume2,
  VolumeX,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Wifi,
  WifiOff,
  Activity,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const BACKEND_BASE = 'http://127.0.0.1:8000';
const WS_BASE = 'ws://127.0.0.1:8000/ws/live-telemetry';

export default function SoilMonitoringDashboard() {
  const { t } = useTranslation();

  // Hardware State
  const [hardwareState, setHardwareState] = useState(null);
  const [soilData, setSoilData] = useState(null);
  const [buzzerState, setBuzzerState] = useState('OFF'); // 'ON' | 'OFF' | 'UNKNOWN'
  const [buzzerAckInfo, setBuzzerAckInfo] = useState(null);
  const [isBuzzerLoading, setIsBuzzerLoading] = useState(false);
  const [mode, setMode] = useState('live'); // 'live' | 'simulated'
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED'); // 'LIVE' | 'DISCONNECTED' | 'SIMULATED'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Selected Buzzer Test Duration
  const [testDurationSec, setTestDurationSec] = useState(2.0);

  // Recharts Historical Stream Buffer
  const [telemetryHistory, setTelemetryHistory] = useState([]);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Fetch initial REST snapshot
  const fetchHardwareSnapshot = async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/hardware/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHardwareState(data);
      setMode(data.mode || 'live');
      setConnectionStatus(data.connection_status || 'DISCONNECTED');
      setBuzzerState(data.buzzer?.state || 'OFF');
      setBuzzerAckInfo({
        timestamp: data.buzzer?.last_ack_timestamp,
        latencyMs: data.buzzer?.last_ack_latency_ms,
        isPending: data.buzzer?.pending_ack
      });
      if (data.soil_telemetry) {
        setSoilData(data.soil_telemetry);
        updateHistoryBuffer(data.soil_telemetry);
      }
    } catch (err) {
      console.warn('[SoilDashboard] Failed to fetch REST hardware status:', err);
      setErrorMsg('Edge server unreachable. Ensure python uvicorn backend is running on port 8000.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateHistoryBuffer = (soilTelemetry) => {
    if (!soilTelemetry || !soilTelemetry.zones) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const point = { time: nowTime };
    soilTelemetry.zones.forEach((z) => {
      point[`zone_${z.id}`] = z.moisture_pct !== null && z.moisture_pct !== undefined ? z.moisture_pct : null;
    });

    setTelemetryHistory((prev) => {
      const updated = [...prev, point];
      return updated.length > 20 ? updated.slice(updated.length - 20) : updated;
    });
  };

  // Connect WebSocket for low-latency live telemetry
  const connectWebSocket = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const ws = new WebSocket(WS_BASE);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[SoilDashboard] WebSocket live telemetry stream connected.');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'TELEMETRY_SNAPSHOT') {
            setMode(msg.mode);
            setConnectionStatus(msg.connection_status);
            if (msg.soil) {
              setSoilData(msg.soil);
              updateHistoryBuffer(msg.soil);
            }
            if (msg.buzzer) {
              setBuzzerState(msg.buzzer.state);
              setBuzzerAckInfo({
                timestamp: msg.buzzer.last_ack_timestamp,
                latencyMs: msg.buzzer.last_ack_latency_ms,
                isPending: msg.buzzer.is_pending
              });
            }
          }
        } catch (e) {
          console.warn('[SoilDashboard] Error parsing WebSocket packet:', e);
        }
      };

      ws.onclose = () => {
        console.log('[SoilDashboard] WebSocket disconnected. Reconnecting in 3s...');
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.warn('[SoilDashboard] WebSocket error:', err);
        ws.close();
      };
    } catch (err) {
      console.warn('[SoilDashboard] WebSocket init failed, relying on REST polling:', err);
    }
  };

  useEffect(() => {
    fetchHardwareSnapshot();
    connectWebSocket();

    // Fallback polling every 5s if WebSocket disconnects
    const pollInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        fetchHardwareSnapshot();
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Switch Mode (Live vs Simulated)
  const handleToggleMode = async (targetMode) => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/hardware/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: targetMode })
      });
      if (res.ok) {
        const data = await res.json();
        setMode(data.mode);
        setConnectionStatus(data.connection_status);
        fetchHardwareSnapshot();
      }
    } catch (err) {
      console.error('Mode toggle failed:', err);
    }
  };

  // Safe Buzzer Command Dispatch
  const handleBuzzerCommand = async (command, duration = 2.0) => {
    setIsBuzzerLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/hardware/buzzer/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          duration_sec: duration,
          source: 'web_manual'
        })
      });
      const data = await res.json();
      if (data.success) {
        setBuzzerState(data.buzzer_state);
        setBuzzerAckInfo({
          timestamp: new Date().toLocaleTimeString(),
          latencyMs: null,
          isPending: !data.hardware_acknowledged
        });
      }
    } catch (err) {
      console.error('Buzzer command error:', err);
    } finally {
      setIsBuzzerLoading(false);
    }
  };

  // Connection Badge Styling
  const isLive = connectionStatus === 'LIVE';
  const isSimulated = connectionStatus === 'SIMULATED';
  const isDisconnected = connectionStatus === 'DISCONNECTED';

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner & Diagnostics */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-400/40 text-[11px] font-black uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>ESP32 Hardware Module 02</span>
              </span>

              {/* Status Pill */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                  isLive
                    ? 'bg-emerald-500 text-emerald-950 animate-pulse'
                    : isSimulated
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-rose-500/90 text-white'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLive ? 'bg-emerald-950' : isSimulated ? 'bg-amber-950' : 'bg-white'
                  }`}
                />
                <span>
                  {isLive
                    ? 'LIVE HARDWARE CONNECTED'
                    : isSimulated
                    ? 'SIMULATION DEMO MODE'
                    : 'DEVICE DISCONNECTED'}
                </span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Root-Zone Soil Moisture & Physical Buzzer Telemetry
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
              Real-time multi-zone capacitive soil probe telemetry, active alarm buzzer actuation, and INMP441 I2S digital audio monitoring streamed directly from the field ESP32 microcontroller via local Mosquitto MQTT & WebSockets.
            </p>
          </div>

          {/* Quick Hardware Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            {/* Mode Switcher */}
            <div className="bg-emerald-950/80 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-600/40 flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => handleToggleMode('live')}
                className={`flex-1 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'live'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Real ESP32 Mode</span>
              </button>
              <button
                onClick={() => handleToggleMode('simulated')}
                className={`flex-1 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'simulated'
                    ? 'bg-amber-500 text-amber-950 shadow-sm'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulation Demo</span>
              </button>
            </div>

            <button
              onClick={fetchHardwareSnapshot}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Sensor Snapshot</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-emerald-800/50 text-xs">
          <div>
            <span className="text-emerald-300/80 text-[11px] block">Target Board</span>
            <strong className="text-white font-mono">ESP32 Dev Module (240MHz)</strong>
          </div>
          <div>
            <span className="text-emerald-300/80 text-[11px] block">Broker Link</span>
            <strong className="text-white font-mono">
              {hardwareState?.mqtt_broker?.connected ? 'Mosquitto 127.0.0.1:1883' : 'Broker Offline'}
            </strong>
          </div>
          <div>
            <span className="text-emerald-300/80 text-[11px] block">Last Received Packet</span>
            <strong className="text-white font-mono">
              {soilData?.timestamp || 'Waiting for transmission'}
            </strong>
          </div>
          <div>
            <span className="text-emerald-300/80 text-[11px] block">Active Buzzer Pin</span>
            <strong className="text-white font-mono">GPIO 25 (Active Output)</strong>
          </div>
        </div>
      </div>

      {/* Disconnection or Error Alert Banner */}
      {isDisconnected && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold text-amber-950 block">Hardware Status: Waiting for ESP32 Field Node</strong>
            <p>
              No active Wi-Fi / MQTT telemetry packets received in the last 12 seconds. Sensor readings below show the last recorded state or require powering on your ESP32 board. Readings are never fabricated while in Live Hardware Mode.
            </p>
            <p className="text-[11px] text-amber-800 font-mono">
              Flash sketch from <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">Desktop\AURDINO.IO\AgriSense_ESP32_Node</code> to connect your real hardware.
            </p>
          </div>
        </div>
      )}

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Average Soil Moisture */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Average Farm Moisture</span>
            <Droplets className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {soilData?.zones
                ? Math.round(
                    soilData.zones
                      .filter((z) => z.moisture_pct !== null)
                      .reduce((acc, z, _, arr) => acc + z.moisture_pct / arr.length, 0)
                  ) || 0
                : 0}
              %
            </span>
            <span className="text-xs font-bold text-emerald-700">Root-Zone Index</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Computed across 4 monitored agronomic zones
          </div>
        </div>

        {/* Metric 2: Active Probes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Active Probes</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {soilData?.zones?.filter((z) => z.is_connected).length || 0} / 4
            </span>
            <span className="text-xs font-bold text-blue-700">ADC1 Probes</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Open-circuit fault detection active
          </div>
        </div>

        {/* Metric 3: Physical Buzzer State */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Buzzer Hardware State</span>
            <Volume2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black font-mono px-2 py-0.5 rounded-lg ${
                buzzerState === 'ON'
                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                  : buzzerState === 'OFF'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {buzzerState}
            </span>
            <span className="text-xs font-bold text-slate-500">GPIO 25</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            {buzzerAckInfo?.isPending
              ? 'Awaiting ESP32 Confirmation...'
              : buzzerAckInfo?.latencyMs
              ? `Confirmed in ${buzzerAckInfo.latencyMs}ms`
              : 'Standby / Verified'}
          </div>
        </div>

        {/* Metric 4: INMP441 Mic Audio Level */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Bio-Acoustic Level</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {hardwareState?.microphone?.rms_level_dbfs || -65}
            </span>
            <span className="text-xs font-bold text-teal-700">dBFS (INMP441)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Estimated SPL: ~{hardwareState?.microphone?.estimated_spl_db || 42} dB
          </div>
        </div>
      </div>

      {/* 3. Four-Zone Soil Moisture Card Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Individual Soil Zone Moisture Readings</span>
            </h3>
            <p className="text-xs text-slate-500">
              Calibrated capacitive probe readings mapped across the 4 physical farm sections.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400 font-mono">
            ADC Range: 1150 (Wet) - 2950 (Dry)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {soilData?.zones?.map((zone) => {
            const hasError = !zone.is_connected;
            const isDry = zone.moisture_pct !== null && zone.moisture_pct < zone.optimal_min;
            const isSaturated = zone.moisture_pct !== null && zone.moisture_pct > zone.optimal_max;

            return (
              <div
                key={zone.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col justify-between transition-all ${
                  hasError
                    ? 'border-rose-200 bg-rose-50/20'
                    : isDry
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                    <span className="font-bold text-emerald-800 uppercase tracking-wider">
                      Zone {zone.id}
                    </span>
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {zone.gpio_pin}
                    </span>
                  </div>

                  <h4 className="font-black text-sm text-slate-900 mt-2 truncate">
                    {zone.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Crop: <strong className="text-slate-700">{zone.crop}</strong>
                  </p>

                  {/* Primary Moisture Value */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      {hasError ? (
                        <div className="flex items-center gap-1.5 text-rose-600 font-black text-base">
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>UNPLUGGED</span>
                        </div>
                      ) : (
                        <span className="text-3xl font-black text-slate-900 font-mono">
                          {zone.moisture_pct}%
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      ADC: {zone.raw_adc}
                    </span>
                  </div>

                  {/* Progress Gauge */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-3">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        hasError
                          ? 'bg-slate-300'
                          : isDry
                          ? 'bg-amber-500'
                          : isSaturated
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${hasError ? 0 : zone.moisture_pct || 0}%` }}
                    />
                  </div>

                  {/* Optimal Boundary Range */}
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1.5">
                    <span>Target: {zone.optimal_min}% - {zone.optimal_max}%</span>
                    <span>{hasError ? 'Fault' : isDry ? 'Needs Drip' : 'Healthy'}</span>
                  </div>
                </div>

                {/* Status Footer Tag */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span
                    className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
                      hasError
                        ? 'bg-rose-100 text-rose-800'
                        : isDry
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {zone.status_label || zone.error_status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {hasError ? 'Sensor Open' : '12-bit Analog'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Physical Buzzer Control Panel & Command Interlock */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                Physical Buzzer Actuator Interlock
                <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-normal">
                  GPIO 25
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Bidirectional command dispatch with hardware acknowledgement handshake and safety duration limit.
              </p>
            </div>
          </div>

          {/* Current Confirmed State */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-bold">Hardware State:</span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-black font-mono border ${
                buzzerState === 'ON'
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : buzzerState === 'OFF'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              {buzzerState}
            </span>
          </div>
        </div>

        {/* Safety & ACK Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Hardware Protection Rule:</strong> Manual and automated buzzer activations are hardware-capped to &le; 5.0 seconds to prevent coil overheating and acoustic fatigue.
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500 shrink-0">
            ACK Confirmation: {buzzerAckInfo?.latencyMs ? `${buzzerAckInfo.latencyMs}ms Verified` : 'MQTT Ready'}
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-2">
          {/* Duration Selector */}
          <div className="sm:col-span-5 flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-bold shrink-0">Pulse Duration:</span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 gap-1 w-full">
              {[1.0, 2.0, 3.0, 5.0].map((d) => (
                <button
                  key={d}
                  onClick={() => setTestDurationSec(d)}
                  className={`flex-1 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    testDurationSec === d
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sm:col-span-7 flex flex-wrap items-center gap-3 justify-end">
            <button
              onClick={() => handleBuzzerCommand('ON', testDurationSec)}
              disabled={isBuzzerLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>Test Pulse Buzzer ({testDurationSec}s)</span>
            </button>

            <button
              onClick={() => handleBuzzerCommand('OFF', 0)}
              disabled={isBuzzerLoading}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <VolumeX className="w-4 h-4" />
              <span>Emergency Silence</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Real-Time Soil Moisture Trend (Recharts) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Multi-Zone Live Soil Moisture Trend (Rolling Stream)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Continuous live stream points plotted as received from the field sensor bus.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {telemetryHistory.length} stream points
          </span>
        </div>

        <div className="w-full h-64 sm:h-72">
          {telemetryHistory.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs italic">
              <Droplets className="w-8 h-8 text-slate-300 mb-2 animate-bounce" />
              <span>Awaiting telemetry stream packets from ESP32...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} unit="%" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '11px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="zone_1" name="Zone 1 (Citrus)" stroke="#10b981" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="zone_2" name="Zone 2 (Tomato)" stroke="#f59e0b" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="zone_3" name="Zone 3 (Paddy)" stroke="#3b82f6" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="zone_4" name="Zone 4 (Nursery)" stroke="#8b5cf6" strokeWidth={2.5} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
