import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calculator,
  Compass,
  Sprout,
  Droplets,
  DollarSign,
  TrendingUp,
  Scale,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Sparkles,
  PieChart as PieIcon
} from 'lucide-react';
import {
  LAND_UNITS,
  convertLandArea,
  calculateSeedRequirement,
  calculateFertilizerQuick,
  calculateIrrigationWater,
  calculateCropInvestment,
  calculateExpectedYield,
  calculateProfitAndMargin
} from '../../services/farmCalculatorsService';
import { CROPS_DATABASE } from '../../services/cropPlanningService';
import { CROP_MANDI_PRICE_DATA } from '../../services/mandiPriceService';

export default function FarmCalculatorsPage() {
  const { t } = useTranslation();

  // Active Calculator Tab
  const [activeCalc, setActiveCalc] = useState('land');

  // 1. Land Area State
  const [landVal, setLandVal] = useState('1');
  const [landFromUnit, setLandFromUnit] = useState('acre');

  // 2. Seed State
  const [seedCrop, setSeedCrop] = useState('wheat');
  const [seedAcres, setSeedAcres] = useState(2);
  const [seedGerm, setSeedGerm] = useState(85);

  // 3. Fertilizer State
  const [fertCrop, setFertCrop] = useState('paddy_rice');
  const [fertAcres, setFertAcres] = useState(2);

  // 4. Irrigation State
  const [irrAcres, setIrrAcres] = useState(3);
  const [irrMethod, setIrrMethod] = useState('drip');
  const [irrPumpHp, setIrrPumpHp] = useState(5);

  // 5. Investment State
  const [invCrop, setInvCrop] = useState('cotton');
  const [invAcres, setInvAcres] = useState(2);
  const [invPrep, setInvPrep] = useState(2800);
  const [invSeeds, setInvSeeds] = useState(1600);
  const [invFert, setInvFert] = useState(3600);
  const [invProt, setInvProt] = useState(2400);
  const [invLabor, setInvLabor] = useState(4800);
  const [invIrr, setInvIrr] = useState(1800);
  const [invHarv, setInvHarv] = useState(3400);

  // 6. Yield State
  const [yieldCrop, setYieldCrop] = useState('wheat');
  const [yieldAcres, setYieldAcres] = useState(2);
  const [yieldVariety, setYieldVariety] = useState('hybrid');
  const [yieldIrr, setYieldIrr] = useState('optimal');

  // 7. Profit State
  const [profitYieldQtl, setProfitYieldQtl] = useState(48); // e.g. 24 q/acre * 2 acres
  const [profitPriceQtl, setProfitPriceQtl] = useState(2360);
  const [profitTotalCost, setProfitTotalCost] = useState(42000);
  const [profitAcres, setProfitAcres] = useState(2);

  // Calculations
  const landResults = convertLandArea(landVal, landFromUnit);
  const seedResults = calculateSeedRequirement({ cropId: seedCrop, acreage: seedAcres, germinationPct: seedGerm });
  const fertResults = calculateFertilizerQuick(fertCrop, fertAcres);
  const irrResults = calculateIrrigationWater({ acreage: irrAcres, irrigationMethod: irrMethod, pumpHorsePower: irrPumpHp });
  const invResults = calculateCropInvestment({
    cropId: invCrop,
    acreage: invAcres,
    landPrepCost: invPrep,
    seedsCost: invSeeds,
    fertilizersCost: invFert,
    cropProtectionCost: invProt,
    laborCost: invLabor,
    irrigationEnergyCost: invIrr,
    harvestingBaggingCost: invHarv
  });
  const yieldResults = calculateExpectedYield({
    cropId: yieldCrop,
    acreage: yieldAcres,
    varietyType: yieldVariety,
    irrigationStatus: yieldIrr
  });
  const profitResults = calculateProfitAndMargin({
    yieldQuintals: profitYieldQtl,
    mandiPricePerQuintal: profitPriceQtl,
    totalCultivationCost: profitTotalCost,
    acreage: profitAcres
  });

  const calculatorsList = [
    { id: 'land', name: '1. Land Area Converter', icon: Compass, desc: 'Acres, Guntas, Bigha & Hectares' },
    { id: 'seed', name: '2. Seed Requirement', icon: Sprout, desc: 'Exact seed kg based on germination' },
    { id: 'fertilizer', name: '3. Fertilizer Dosing', icon: Layers, desc: 'Bags of Urea, DAP & Potash' },
    { id: 'irrigation', name: '4. Irrigation Water', icon: Droplets, desc: 'Liters, pumping hours & drip savings' },
    { id: 'investment', name: '5. Cultivation Budget', icon: DollarSign, desc: 'Itemized expenditure by activity' },
    { id: 'yield', name: '6. Expected Yield', icon: TrendingUp, desc: 'Harvest potential by condition' },
    { id: 'profit', name: '7. Net Profit & Margin', icon: Scale, desc: 'Gross revenue, net profit & ROI %' }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. HEADER HERO */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white p-5 sm:p-7 border border-emerald-500/20 shadow-md">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
          <Calculator className="w-3.5 h-3.5 text-emerald-400" />
          <span>Complete Precision Suite</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
          7 Essential Agricultural Farm Calculators
        </h1>
        <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-2xl font-medium">
          Accurate agricultural mathematical modeling designed for Indian farmers. Eliminate guesswork in land conversion, seed rate, fertilizer dosing, irrigation run-time, and harvest profit margins.
        </p>
      </div>

      {/* 2. CALCULATOR SELECTOR BUTTONS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {calculatorsList.map(calc => {
          const Icon = calc.icon;
          const isActive = activeCalc === calc.id;
          return (
            <button
              key={calc.id}
              onClick={() => setActiveCalc(calc.id)}
              className={`p-3 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-emerald-800 text-white border-emerald-600 shadow-sm scale-102'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 mb-2 ${isActive ? 'text-amber-300' : 'text-emerald-700'}`} />
              <div>
                <h4 className="text-xs font-bold leading-tight">{calc.name}</h4>
                <p className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {calc.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE CALCULATOR CONTENT */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-900/10 shadow-sm">
        {/* CALC 1: LAND AREA CONVERTER */}
        {activeCalc === 'land' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">Land Area Multi-Unit Converter</h2>
              <p className="text-xs text-slate-500">Converts seamlessly between Indian regional land measuring units and metric standards.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Enter Area Value:</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={landVal}
                  onChange={(e) => setLandVal(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">From Unit:</label>
                <select
                  value={landFromUnit}
                  onChange={(e) => setLandFromUnit(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {LAND_UNITS.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {landResults.map(res => (
                <div key={res.id} className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800">{res.name}</span>
                  <div className="text-xl font-black text-emerald-950 mt-1 font-mono">{res.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALC 2: SEED REQUIREMENT */}
        {activeCalc === 'seed' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">Seed Requirement Calculator</h2>
              <p className="text-xs text-slate-500">Computes the certified seed quantity in kilograms required based on crop and germination test percentage.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Crop:</label>
                <select
                  value={seedCrop}
                  onChange={(e) => setSeedCrop(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {CROPS_DATABASE.map(c => (
                    <option key={c.id} value={c.id}>{c.name.split(' (')[0]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Plot Area (Acres):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.25"
                  value={seedAcres}
                  onChange={(e) => setSeedAcres(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Certified Germination (%):</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={seedGerm}
                  onChange={(e) => setSeedGerm(parseFloat(e.target.value) || 85)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Seed Required</span>
                <div className="text-3xl font-black text-emerald-950 mt-1">{seedResults.totalSeedRequiredKg} kg</div>
                <span className="text-xs text-emerald-700">For {seedAcres} acres</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seed Rate / Acre</span>
                <div className="text-2xl font-black text-slate-800 mt-1">{seedResults.seedRateKgPerAcre} kg/acre</div>
                <span className="text-xs text-slate-400">At {seedResults.germinationUsed} germination</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recommended Spacing</span>
                <div className="text-base font-black text-slate-800 mt-2">{seedResults.recommendedSpacing}</div>
                <span className="text-xs text-slate-400">Optimal plant density</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              {seedResults.note}
            </div>
          </div>
        )}

        {/* CALC 3: FERTILIZER DOSING */}
        {activeCalc === 'fertilizer' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">Quick Fertilizer Dose & Bag Calculator</h2>
              <p className="text-xs text-slate-500">Calculates statutory 45kg/50kg commercial fertilizer bag requirements.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Crop:</label>
                <select
                  value={fertCrop}
                  onChange={(e) => setFertCrop(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {CROPS_DATABASE.map(c => (
                    <option key={c.id} value={c.id}>{c.name.split(' (')[0]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Area (Acres):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.25"
                  value={fertAcres}
                  onChange={(e) => setFertAcres(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Urea (45 kg)</span>
                <div className="text-2xl font-black text-emerald-950 mt-1">{fertResults.ureaBags} Bags</div>
                <span className="text-xs text-emerald-700">~₹{Math.round(fertResults.ureaBags * 266)}</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">DAP (50 kg)</span>
                <div className="text-2xl font-black text-amber-950 mt-1">{fertResults.dapBags} Bags</div>
                <span className="text-xs text-amber-700">~₹{Math.round(fertResults.dapBags * 1350)}</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">MOP Potash (50 kg)</span>
                <div className="text-2xl font-black text-rose-950 mt-1">{fertResults.mopBags} Bags</div>
                <span className="text-xs text-rose-700">~₹{Math.round(fertResults.mopBags * 1650)}</span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Total Investment</span>
                <div className="text-2xl font-black text-indigo-950 mt-1">₹{fertResults.estimatedCost.toLocaleString('en-IN')}</div>
                <span className="text-xs text-indigo-700">For {fertAcres} acres</span>
              </div>
            </div>
          </div>
        )}

        {/* CALC 4: IRRIGATION WATER */}
        {activeCalc === 'irrigation' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">Irrigation Water & Pump Run-Time Calculator</h2>
              <p className="text-xs text-slate-500">Calculates irrigation water volumes, pump run hours, and water savings under micro-irrigation.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Area (Acres):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.25"
                  value={irrAcres}
                  onChange={(e) => setIrrAcres(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Irrigation Method:</label>
                <select
                  value={irrMethod}
                  onChange={(e) => setIrrMethod(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="drip">Drip Irrigation (High Efficiency)</option>
                  <option value="sprinkler">Sprinkler Irrigation</option>
                  <option value="flood">Flood / Furrow Irrigation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Borewell Pump Power:</label>
                <select
                  value={irrPumpHp}
                  onChange={(e) => setIrrPumpHp(parseFloat(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="3">3 HP (~21,600 L/hr)</option>
                  <option value="5">5 HP (~36,000 L/hr)</option>
                  <option value="7.5">7.5 HP (~54,000 L/hr)</option>
                  <option value="10">10 HP (~72,000 L/hr)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Water Required</span>
                <div className="text-2xl font-black text-blue-950 mt-1">{irrResults.totalWaterLiters} L</div>
                <span className="text-xs text-blue-700">({irrResults.totalCubicMeters} m³) per watering</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Pumping Hours</span>
                <div className="text-2xl font-black text-emerald-950 mt-1">{irrResults.pumpingHoursRequired}</div>
                <span className="text-xs text-emerald-700">Pump discharge: {irrResults.pumpDischarge}</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Water Savings vs Flood</span>
                <div className="text-2xl font-black text-amber-950 mt-1">{irrResults.waterSavingsPct}</div>
                <span className="text-xs text-amber-700">{irrResults.waterSavedLiters} L saved</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              {irrResults.energyTip}
            </div>
          </div>
        )}

        {/* CALC 5: CROP INVESTMENT & BUDGETING */}
        {activeCalc === 'investment' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">Crop Cultivation Investment & Budgeting Calculator</h2>
              <p className="text-xs text-slate-500">Itemized financial expenditure projection across all field operations.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Land Prep (₹/acre):</label>
                <input
                  type="number"
                  value={invPrep}
                  onChange={(e) => setInvPrep(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Seeds & Nursery (₹/acre):</label>
                <input
                  type="number"
                  value={invSeeds}
                  onChange={(e) => setInvSeeds(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Fertilizers (₹/acre):</label>
                <input
                  type="number"
                  value={invFert}
                  onChange={(e) => setInvFert(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Pesticides/Sprays (₹/acre):</label>
                <input
                  type="number"
                  value={invProt}
                  onChange={(e) => setInvProt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Labor & Weeding (₹/acre):</label>
                <input
                  type="number"
                  value={invLabor}
                  onChange={(e) => setInvLabor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Irrigation Electricity (₹/acre):</label>
                <input
                  type="number"
                  value={invIrr}
                  onChange={(e) => setInvIrr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Harvesting & Bagging (₹/acre):</label>
                <input
                  type="number"
                  value={invHarv}
                  onChange={(e) => setInvHarv(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Acreage:</label>
                <input
                  type="number"
                  step="0.5"
                  value={invAcres}
                  onChange={(e) => setInvAcres(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Total Production Investment</span>
                <div className="text-3xl font-black text-indigo-950 mt-1">₹{invResults.totalInvestment.toLocaleString('en-IN')}</div>
                <span className="text-xs text-indigo-700">₹{invResults.costPerAcre.toLocaleString('en-IN')} / acre</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <span className="font-bold text-slate-700">Top Expenditure Breakdown:</span>
                {invResults.breakdown.slice(0, 4).map((b, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>{b.item}:</span>
                    <span className="font-mono font-bold text-slate-900">₹{b.cost.toLocaleString('en-IN')} ({b.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CALC 6: EXPECTED YIELD */}
        {activeCalc === 'yield' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">Expected Crop Yield Estimator</h2>
              <p className="text-xs text-slate-500">Estimates production harvest ranges based on variety hybrid vigor and irrigation availability.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Crop:</label>
                <select
                  value={yieldCrop}
                  onChange={(e) => setYieldCrop(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {CROPS_DATABASE.map(c => (
                    <option key={c.id} value={c.id}>{c.name.split(' (')[0]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Area (Acres):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.25"
                  value={yieldAcres}
                  onChange={(e) => setYieldAcres(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Seed Variety Type:</label>
                <select
                  value={yieldVariety}
                  onChange={(e) => setYieldVariety(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="hybrid">High-Yielding Hybrid (+15% vigor)</option>
                  <option value="improved">State University Certified (Normal)</option>
                  <option value="traditional">Traditional / Saved Farm Seed (-15%)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Irrigation Supply:</label>
                <select
                  value={yieldIrr}
                  onChange={(e) => setYieldIrr(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="optimal">Optimal Canal / Tube-well (+10%)</option>
                  <option value="rainfed">Rainfed / Monsoon Dependent (-25%)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Average Expected Yield</span>
                <div className="text-3xl font-black text-emerald-950 mt-1">{yieldResults.avgYieldQuintals} Quintals</div>
                <span className="text-xs text-emerald-700">{yieldResults.avgYieldMetricTons} Metric Tons</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expected Yield Range</span>
                <div className="text-2xl font-black text-slate-800 mt-1">{yieldResults.minYieldQuintals} - {yieldResults.maxYieldQuintals} Qtl</div>
                <span className="text-xs text-slate-400">{yieldResults.avgYieldPerAcre} Qtl / acre</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Calculation Standard</span>
                <p className="text-xs text-amber-950 mt-1 leading-relaxed">{yieldResults.confidenceNote}</p>
              </div>
            </div>
          </div>
        )}

        {/* CALC 7: PROFIT & MARGIN */}
        {activeCalc === 'profit' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">Profit, Revenue & ROI % Margin Calculator</h2>
              <p className="text-xs text-slate-500">Computes gross revenue, net profit, cost per quintal, and return on capital investment.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Total Yield (Quintals):</label>
                <input
                  type="number"
                  value={profitYieldQtl}
                  onChange={(e) => setProfitYieldQtl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mandi Selling Price (₹/q):</label>
                <input
                  type="number"
                  value={profitPriceQtl}
                  onChange={(e) => setProfitPriceQtl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Total Cultivation Cost (₹):</label>
                <input
                  type="number"
                  value={profitTotalCost}
                  onChange={(e) => setProfitTotalCost(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Acreage:</label>
                <input
                  type="number"
                  step="0.5"
                  value={profitAcres}
                  onChange={(e) => setProfitAcres(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
                <div className="text-2xl font-black text-slate-900 mt-1">₹{profitResults.grossRevenue.toLocaleString('en-IN')}</div>
                <span className="text-xs text-slate-400">{profitYieldQtl} Qtl @ ₹{profitPriceQtl}</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Net Farm Profit</span>
                <div className="text-3xl font-black text-emerald-950 mt-1">₹{profitResults.netProfit.toLocaleString('en-IN')}</div>
                <span className="text-xs text-emerald-700">₹{profitResults.profitPerAcre.toLocaleString('en-IN')} / acre</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Return on Investment (ROI)</span>
                <div className="text-2xl font-black text-amber-950 mt-1">{profitResults.roiPct}</div>
                <span className="text-xs text-amber-700">Profit margin: {profitResults.profitMarginPct}</span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Cost of Production</span>
                <div className="text-2xl font-black text-indigo-950 mt-1">₹{profitResults.costPerQuintal}</div>
                <span className="text-xs text-indigo-700">per Quintal produced</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              <strong>Financial Analysis:</strong> {profitResults.summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
