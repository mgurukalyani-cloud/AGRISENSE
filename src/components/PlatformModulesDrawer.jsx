import React, { useState } from 'react';
import {
  Layers,
  X,
  Cpu,
  Droplets,
  Sprout,
  ScanLine,
  Sliders,
  CheckCircle2,
  Clock,
  Code,
  Radio,
  Server,
  ChevronRight,
  ShieldCheck,
  Zap,
  Volume2
} from 'lucide-react';


export default function PlatformModulesDrawer({ isOpen, onClose, onNavigateTab }) {
  const [activeModuleTab, setActiveModuleTab] = useState('esp32');

  const [simulatedSensorActive, setSimulatedSensorActive] = useState(false);

  if (!isOpen) return null;

  const modules = [
    {
      id: 'weather',
      number: 'Module 01',
      title: 'Weather & Agro-Climatic Advisory',
      status: 'ACTIVE',
      statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: Droplets,
      desc: 'High-resolution live, hourly, and 7-day numerical meteorological forecasting combined with agronomic operational advisories.'
    },
    {
      id: 'esp32',
      number: 'Module 02',
      title: 'IoT Soil & Root-Zone Telemetry (ESP32)',
      status: 'ACTIVE & INTEGRATED',
      statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: Cpu,
      desc: 'In-situ ESP32 microcontroller nodes transmitting capacitive soil moisture, soil temperature, and NPK nutrients over MQTT/HTTP.'
    },
    {
      id: 'crop',
      number: 'Module 03',
      title: 'Seasonal Crop Planning & Mandi Intelligence',
      status: 'ACTIVE & INTEGRATED',
      statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: Sprout,
      desc: 'University crop calendar recommendations, live AGMARKNET/e-NAM mandi wholesale prices, CACP/SAU cultivation expenditure sheets, and 3x3 profit sensitivity matrices.'
    },
    {
      id: 'irrigation',
      number: 'Module 04',
      title: 'Automated Solenoid Valve Actuation',
      status: 'ARCHITECTED',
      statusColor: 'bg-teal-100 text-teal-800 border-teal-300',
      icon: Sliders,
      desc: 'Closed-loop irrigation controller switching solenoid relays when soil moisture drops below threshold AND rain is not imminent.'
    },
    {
      id: 'disease',
      number: 'Module 05',
      title: 'AI Plant Disease & Leaf Health Scanner',
      status: 'ACTIVE & INTEGRATED',
      statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: ScanLine,
      desc: 'Computer-vision leaf pathology analyzer and camera scanner cross-referenced with live atmospheric temperature and humidity.'
    },
    {
      id: 'animal_repellent',
      number: 'Module 06',
      title: 'AI Animal Sound Recognition & Farm Repellent',
      status: 'ACTIVE & INTEGRATED',
      statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: Volume2,
      desc: 'PyTorch deep neural audio model analyzing 131 bio-acoustic features to identify crop-damaging wildlife while strictly protecting cattle and beneficial birds.'
    }
  ];


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-emerald-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  AgriSense Modular Platform Roadmap
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                  Microservice Architecture
                </span>
              </div>
              <p className="text-xs text-emerald-300/80">
                Designed for seamless expansion with ESP32 field microcontrollers, solenoid controllers, and AI models
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body: 2-Column Module Selector & Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Column: Module Navigation List */}
          <div className="md:col-span-5 p-4 border-r border-slate-100 bg-slate-50/70 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-2">
              Platform Modules
            </span>
            {modules.map((m) => {
              const Icon = m.icon;
              const isSelected = activeModuleTab === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModuleTab(m.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer ${
                    isSelected
                      ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                      : 'bg-white/60 hover:bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {m.number}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${m.statusColor}`}>
                        {m.status}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm font-bold truncate mt-0.5 ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                      {m.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Architectural Spec */}
          <div className="md:col-span-7 p-5 sm:p-6 space-y-5 bg-white">
            {activeModuleTab === 'esp32' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      IoT Hardware Integration
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      Module 2: ESP32 Field Telemetry
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    MQTT / HTTP Ready
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  This module connects battery- or solar-powered ESP32 nodes installed in farm fields. Each node samples capacitive soil moisture sensors, DS18B20 soil temperature probes, and RS485 NPK sensors at scheduled intervals (e.g., every 15 minutes).
                </p>

                {/* Expected JSON Schema */}
                <div className="rounded-2xl bg-slate-900 p-4 text-xs font-mono text-emerald-300 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800 mb-2">
                    <span className="flex items-center space-x-1.5">
                      <Code className="w-3.5 h-3.5 text-blue-400" />
                      <span>Expected Telemetry Webhook Payload</span>
                    </span>
                    <span className="text-[10px] text-slate-500">POST /api/v1/telemetry/esp32</span>
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed">
{`{
  "node_id": "esp32-field-sector-04",
  "battery_v": 3.95,
  "soil_moisture_pct": 38.4,
  "soil_temperature_c": 21.8,
  "nitrogen_ppm": 48,
  "phosphorus_ppm": 19,
  "potassium_ppm": 37,
  "ambient_light_lux": 42000
}`}
                  </pre>
                </div>

                {/* Simulated Sensor Interactive Widget */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                      <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                      <span>Live Sensor Synthesis Simulation</span>
                    </span>
                    <button
                      onClick={() => setSimulatedSensorActive(!simulatedSensorActive)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        simulatedSensorActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-blue-700 border border-blue-300'
                      }`}
                    >
                      {simulatedSensorActive ? 'Simulating Active' : 'Toggle Mock Probe'}
                    </button>
                  </div>

                  {simulatedSensorActive ? (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="p-2 rounded-xl bg-white border border-blue-200">
                        <span className="text-[10px] text-slate-400 block">Capacitive Moisture</span>
                        <strong className="text-sm text-blue-700 font-extrabold">38.4%</strong>
                        <span className="text-[10px] text-emerald-600 block">Optimal Zone</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-blue-200">
                        <span className="text-[10px] text-slate-400 block">Probe Depth 15cm</span>
                        <strong className="text-sm text-slate-800 font-extrabold">21.8°C</strong>
                        <span className="text-[10px] text-slate-500 block">Root Temperature</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-blue-200">
                        <span className="text-[10px] text-slate-400 block">NPK Ratio</span>
                        <strong className="text-sm text-slate-800 font-extrabold">48:19:37</strong>
                        <span className="text-[10px] text-slate-500 block">mg/kg</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-blue-800">
                      Click &ldquo;Toggle Mock Probe&rdquo; to test how AgriSense renders live ESP32 root-zone readings alongside meteorological weather data.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('soil_monitoring');
                    onClose();
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-green-800 text-white font-bold text-xs sm:text-sm shadow-md hover:from-emerald-900 hover:to-green-900 transition-all cursor-pointer"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Launch Live Soil Monitoring & Buzzer Dashboard</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}

            {activeModuleTab === 'weather' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    Module 1: Weather Intelligence & Advisory
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Fully Deployed
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Currently running in this application. Powers real-time observations, hourly forecast strips, 7-day outlooks, historical archives, and the Farm Weather Advisor engine.
                </p>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <span className="font-bold block">Integrated Capabilities:</span>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Live WMO 4677 weather interpretation</li>
                    <li>FAO-56 Penman-Monteith Evapotranspiration (ET₀)</li>
                    <li>Vapor Pressure Deficit (VPD) transpiration modeling</li>
                    <li>Dynamic agrochemical spraying windows & drift risk</li>
                    <li>Fungal blight disease warning index</li>
                  </ul>
                </div>
              </div>
            )}

            {activeModuleTab === 'crop' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    Module 3: Seasonal Crop Planning & Mandi Intelligence
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Fully Deployed
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Synthesizes farmer soil type, pH, water availability, and agro-climatic zones across 16 major Indian crops with verified varieties from PAU, IARI, PJTSAU, and IIHR.
                </p>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <span className="font-bold block">Live Capabilities:</span>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Multi-factor agronomic recommendation matching soil pH, climate, and water depth</li>
                    <li>Authentic AGMARKNET / e-NAM wholesale mandi prices with 8-week trend charts</li>
                    <li>Itemized 8-head CACP/SAU cultivation expenditure sheets per acre & total holding</li>
                    <li>3×3 sensitivity scenario matrix (Yields × Market Prices) computing net profit & ROI</li>
                    <li>CCEA Minimum Support Price (MSP) benchmarks and harvest arrival price forecasts</li>
                  </ul>
                </div>
              </div>
            )}

            {activeModuleTab === 'irrigation' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Module 4: Automated Solenoid Valve Control
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Acts as the actuator hub. Listens to decisions made by the Farm Weather Advisor: if rain is forecast within 24 hours, irrigation schedules are paused automatically to conserve power and prevent runoff.
                </p>
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1">
                  <span className="font-bold">Actuation Architecture:</span>
                  <p>MQTT broker connected to 12V latching solenoid valves via optoisolated relays.</p>
                </div>
              </div>
            )}
            {activeModuleTab === 'disease' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Module 5: AI Plant Disease & Pest Vision
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Integrates computer vision convolutional neural networks (CNNs) for instant leaf diagnosis. Combines high-humidity warnings from Module 1 with image analysis to detect Early Blight, Powdery Mildew, and leaf miners.
                </p>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold">Edge Vision Pipeline:</span>
                  <p>Accepts mobile camera uploads or field camera feeds and outputs confidence scores with bio-pesticide recommendations.</p>
                </div>
              </div>
            )}

            {activeModuleTab === 'animal_repellent' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    Module 6: Animal Sound Detection & Alerts
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active & Integrated
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time bio-acoustic monitoring system that identifies crop-damaging wildlife (wild boars, macaques, crows, deer, rodents) using trained PyTorch neural networks and 131 audio features, while strictly exempting beneficial farm animals (cows and sparrows).
                </p>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                  <span className="font-bold block">Integrated Capabilities:</span>
                  <ul className="space-y-1 list-disc list-inside text-[11px] text-emerald-900">
                    <li>131-Dimensional Bio-Acoustic Feature Extraction (MFCCs, Mel-banks, Centroid, ZCR)</li>
                    <li>Strict Livestock & Bird Protection: Cows and Sparrows are never repelled</li>
                    <li>2-Sample Persistence Filter: Prevents false alarms from transient noises</li>
                    <li>60s Protective Cooldown & Safety Gain Clamps (&le;75 dB SPL)</li>
                    <li>ESP32 I2S Digital Audio Sampling & Web Audio Oscilloscope Visualizer</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('animal_repellent');
                    onClose();
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-800 to-green-800 text-white font-bold text-xs sm:text-sm shadow-md hover:from-emerald-900 hover:to-green-900 transition-all cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Launch Animal Sound Detection & Alerts</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>


        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>AgriSense Architecture • Modular Smart Agriculture Platform</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-semibold hover:bg-emerald-900 transition-colors cursor-pointer"
          >
            Close Roadmap
          </button>
        </div>
      </div>
    </div>
  );
}
