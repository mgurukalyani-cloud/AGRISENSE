import fs from 'fs';
import path from 'path';

const file = path.resolve('src/App.jsx');
let code = fs.readFileSync(file, 'utf8');

// 1. Add CoverPage import if missing
if (!code.includes("import CoverPage from './components/splash/CoverPage';")) {
  code = code.replace(
    "import SplashScreen from './components/splash/SplashScreen';",
    "import SplashScreen from './components/splash/SplashScreen';\nimport CoverPage from './components/splash/CoverPage';"
  );
}

// 2. Add showCoverPage state if missing
if (!code.includes('const [showCoverPage, setShowCoverPage] = useState(true);')) {
  code = code.replace(
    'const [showSplash, setShowSplash] = useState(false);',
    'const [showSplash, setShowSplash] = useState(false);\n  const [showCoverPage, setShowCoverPage] = useState(true);'
  );
}

// 3. Ensure Header receives onNavigateHome
if (!code.includes('onNavigateHome=')) {
  code = code.replace(
    "onOpenSplash={() => setShowSplash(true)}",
    "onOpenSplash={() => setShowSplash(true)}\n        onNavigateHome={() => { setActiveTab('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}"
  );
}

// 4. Ensure Droplets and Sun are imported in lucide-react in App.jsx
code = code.replace(
  "import { Loader2, AlertCircle, ScanLine, Leaf, ArrowRight, Sprout, Cpu, Volume2 } from 'lucide-react';",
  "import { Loader2, AlertCircle, ScanLine, Leaf, ArrowRight, Sprout, Cpu, Volume2, Sparkles, Droplets, Sun, CalendarDays, Compass } from 'lucide-react';"
);

// 5. Replace TAB CONTENT: 1. WEATHER OVERVIEW section
const overviewStartMarker = "{/* TAB CONTENT: 1. WEATHER OVERVIEW */}";
const overviewEndMarker = "{/* TAB CONTENT: 2. LIVE WEATHER */}";

const startIdx = code.indexOf(overviewStartMarker);
const endIdx = code.indexOf(overviewEndMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const newOverview = `{/* TAB CONTENT: 1. WEATHER OVERVIEW (REDESIGNED PROFESSIONAL HOME PAGE) */}
            {activeTab === 'overview' && (
              <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-300">
                {/* 1. Command Center Welcome & Telemetry Status Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-[#0a2318] to-slate-950 text-white p-5 sm:p-7 border border-emerald-500/20 shadow-md">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="space-y-2 max-w-2xl">
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>KLH Farms Precision Agriculture</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                        AgriSense Smart Farming Command Center
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed font-medium">
                        Real-world meteorological observations, ECMWF IFS 0.1° high-resolution numerical forecasts, AI leaf diagnostics, seasonal crop market intelligence, and bio-acoustic wildlife defense.
                      </p>
                    </div>

                    <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2.5 shrink-0 text-xs font-semibold">
                      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-emerald-200 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>ECMWF IFS (0.1°) Verified</span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-emerald-200 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Edge AI Telemetry Active</span>
                      </div>
                      <button
                        onClick={() => setShowCoverPage(true)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-500/40 cursor-pointer transition-colors shadow-xs"
                        title="View 5-Second KLH Farms Cover Page"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>View Cover Page</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Hero Current Weather Section */}
                <section className="space-y-3" aria-labelledby="section-current-weather">
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-900/10">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <Sun className="w-4 h-4 text-emerald-600" />
                      <span id="section-current-weather">Live Farm Microclimate & Observations</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Auto-Refresh: {Math.floor(autoRefreshSeconds / 60)}m {autoRefreshSeconds % 60}s
                    </span>
                  </div>

                  <CurrentWeatherCard
                    weatherData={weatherData}
                    tempUnit={tempUnit}
                    onOpenSearch={() => setIsSearchOpen(true)}
                  />
                </section>

                {/* 3. Core Precision AI & Telemetry Modules (Balanced 2x2 Grid) */}
                <section className="space-y-4" aria-labelledby="section-core-modules">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-emerald-900/10">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span id="section-core-modules">Intelligent Farm Operations</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                        Precision Agriculture AI & Telemetry Modules
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Direct access to computer vision pathology, seasonal mandi planning, ESP32 root-zone bus, and animal acoustic defense
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Module 1: Plant Health & Leaf Disease Scanner */}
                    <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-700/60 flex flex-col justify-between space-y-4 hover:border-emerald-500/80 transition-all group">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <ScanLine className="w-6 h-6 text-emerald-300" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                              {t('plantHealth.spotlightTag', 'AI Vision')}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-white">
                            {t('plantHealth.spotlightTitle', 'AI Plant Health & Leaf Disease Scanner')}
                          </h4>
                          <p className="text-xs text-emerald-200/90 leading-relaxed font-normal">
                            {t('plantHealth.spotlightDesc', 'Use your camera or upload leaf photographs to detect early fungal blights, rusts, and nutrient deficiencies cross-referenced with farm weather.')}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('plant_health')}
                          className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all cursor-pointer group-hover:shadow-lg"
                        >
                          <Leaf className="w-4 h-4 text-emerald-700" />
                          <span>Open Plant Health Scanner</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>

                    {/* Module 2: Seasonal Crop Planning & Real Mandi Prices */}
                    <div className="bg-gradient-to-br from-teal-950 via-emerald-900 to-green-950 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-700/60 flex flex-col justify-between space-y-4 hover:border-emerald-500/80 transition-all group">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Sprout className="w-6 h-6 text-emerald-300" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                              {t('cropPlanning.spotlightTag', 'Market Intelligence')}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-white">
                            {t('cropPlanning.spotlightTitle', 'Seasonal Crop Planning & Real Mandi Prices')}
                          </h4>
                          <p className="text-xs text-emerald-200/90 leading-relaxed font-normal">
                            {t('cropPlanning.spotlightDesc', 'Plan high-yielding crops for your soil and season, check live AGMARKNET mandi prices, and calculate cultivation expenditure, yield scenarios, and net profit.')}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('crop_planning')}
                          className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all cursor-pointer group-hover:shadow-lg"
                        >
                          <Sprout className="w-4 h-4 text-emerald-700" />
                          <span>Explore Crop Planning AI</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>

                    {/* Module 3: ESP32 Soil Telemetry & Active Buzzer */}
                    <div className="bg-gradient-to-br from-[#072417] via-emerald-950 to-green-950 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-700/60 flex flex-col justify-between space-y-4 hover:border-emerald-500/80 transition-all group">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Cpu className="w-6 h-6 text-emerald-300" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                              Hardware Bus
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-white">
                            ESP32 Soil Telemetry & Alarm Hardware
                          </h4>
                          <p className="text-xs text-emerald-200/90 leading-relaxed font-normal">
                            Monitor 4 physical capacitive root-zones (ADC1 pins 34, 35, 36, 39), verify open-circuit faults, and trigger the physical active buzzer on GPIO 25 with confirmed hardware ACK.
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('soil_monitoring')}
                          className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all cursor-pointer group-hover:shadow-lg"
                        >
                          <Cpu className="w-4 h-4 text-emerald-700" />
                          <span>Open Soil Telemetry Node</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>

                    {/* Module 4: Bio-Acoustic Wildlife Defense (INMP441 + AI Repellent) */}
                    <div className="bg-gradient-to-br from-[#062817] via-emerald-900 to-[#021f10] rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-700/60 flex flex-col justify-between space-y-4 hover:border-emerald-500/80 transition-all group">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Volume2 className="w-6 h-6 text-emerald-300" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/60 border border-emerald-400/40 text-emerald-100">
                              Bio-Acoustic AI
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-white">
                            Animal Sound AI & Bio-Acoustic Defense
                          </h4>
                          <p className="text-xs text-emerald-200/90 leading-relaxed font-normal">
                            Stream 16kHz I2S digital audio (SCK: 14, WS: 15, SD: 32), classify wildlife with PyTorch deep learning, and protect cows & sparrows with non-injurious deterrents.
                          </p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('animal_repellent')}
                          className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all cursor-pointer group-hover:shadow-lg"
                        >
                          <Volume2 className="w-4 h-4 text-emerald-700" />
                          <span>Open Animal Sound AI</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Atmospheric & Agronomic Metrics Grid */}
                <section className="space-y-3" aria-labelledby="section-agronomic-metrics">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-1 border-b border-emerald-900/10">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <Compass className="w-4 h-4 text-emerald-600" />
                      <span id="section-agronomic-metrics">8-Point Agronomic Environmental Metrics</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Evapotranspiration, Dew Point, Soil Moisture & Atmospheric Pressures
                    </span>
                  </div>

                  <WeatherMetricsGrid
                    weatherData={weatherData}
                    tempUnit={tempUnit}
                  />
                </section>

                {/* 5. 24-Hour Operations Timeline & Hourly Forecast */}
                <section className="space-y-3" aria-labelledby="section-hourly-forecast">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-1 border-b border-emerald-900/10">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <CalendarDays className="w-4 h-4 text-emerald-600" />
                      <span id="section-hourly-forecast">24-Hour Hourly Operations Forecast</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Hourly temperature trend, precipitation probability, and wind trajectory
                    </span>
                  </div>

                  <HourlyForecastStrip
                    hourly={weatherData.hourly}
                    tempUnit={tempUnit}
                  />
                </section>

                {/* 6. Smart Agro-Advisory & Field Operations */}
                <section className="space-y-3" aria-labelledby="section-agro-advisory">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-1 border-b border-emerald-900/10">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <Droplets className="w-4 h-4 text-emerald-600" />
                      <span id="section-agro-advisory">Agro-Meteorological Advisory & Field Guidance</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Suitability index for spraying, irrigation, and field machinery
                    </span>
                  </div>

                  <FarmWeatherAdvisor
                    weatherData={weatherData}
                    onOpenModulesDrawer={() => setIsModulesDrawerOpen(true)}
                  />
                </section>
              </div>
            )}

            `;
  code = code.slice(0, startIdx) + newOverview + code.slice(endIdx);
}

// 6. Add CoverPage rendering near SplashScreen
if (!code.includes('{showCoverPage && (')) {
  code = code.replace(
    '{showSplash && (',
    `{/* 5-Second KLH Farms Cover Page */}
      {showCoverPage && (
        <CoverPage onFinish={() => setShowCoverPage(false)} />
      )}

      {showSplash && (`
  );
}

fs.writeFileSync(file, code);
console.log('✓ App.jsx updated with CoverPage, Clickable Logo handler, and redesigned Home page layout!');
