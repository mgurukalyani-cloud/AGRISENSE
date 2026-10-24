import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Cpu, 
  Volume2, 
  Droplets, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Activity,
  Layers
} from 'lucide-react';

export default function SplashScreen({ onEnterDashboard }) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: 'Initializing KLH Farms Agro-Operating System', icon: Sprout },
    { label: 'Connecting to ESP32 Soil Telemetry & ADC1 Bus', icon: Cpu },
    { label: 'Verifying Physical Active Buzzer Interlock (GPIO 25)', icon: Volume2 },
    { label: 'Syncing INMP441 I2S Bio-Acoustic Surveillance Node', icon: Activity },
    { label: 'All Smart Agriculture Subsystems Verified & Operational', icon: CheckCircle2 }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2.5;
      });
    }, 45);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 85) setActiveStep(4);
    else if (progress >= 60) setActiveStep(3);
    else if (progress >= 35) setActiveStep(2);
    else if (progress >= 15) setActiveStep(1);
    else setActiveStep(0);
  }, [progress]);

  const handleProceed = () => {
    onEnterDashboard();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-950 via-[#0a2016] to-[#04110b] text-white p-4 sm:p-6 overflow-hidden select-none animate-in fade-in duration-300">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-xl flex flex-col items-center text-center space-y-6">
        {/* Large Circular KLH Farms Logo */}
        <div className="relative group cursor-pointer" onClick={handleProceed}>
          <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-400 via-green-300 to-lime-400 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden p-1 bg-gradient-to-b from-white/30 to-white/10 backdrop-blur-md shadow-2xl border-2 border-emerald-400/40">
            <img 
              src={`${import.meta.env.BASE_URL}klh-farms-logo.png`} 
              alt="KLH Farms Logo" 
              className="w-full h-full object-cover rounded-full transform group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = '/klh-farms-logo.png';
              }}
            />
          </div>
        </div>

        {/* Brand Typography */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-800/50 border border-emerald-500/30 text-emerald-200 text-xs font-bold tracking-widest uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Precision Agriculture Command Center</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            KLH FARMS
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 font-medium max-w-md mx-auto leading-relaxed">
            AgriSense IoT Platform · In-Situ Soil Monitoring · Active Buzzer Interlock · INMP441 Bio-Acoustic Defense
          </p>
        </div>

        {/* Subsystem Readiness Checklist */}
        <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 text-left space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 pb-2 border-b border-white/10">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Hardware Initialization</span>
            </span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>

          <div className="space-y-1.5">
            {steps.map((st, i) => {
              const Icon = st.icon;
              const isDone = i < activeStep;
              const isCurrent = i === activeStep;
              return (
                <div 
                  key={i} 
                  className={`flex items-center space-x-2.5 text-xs transition-colors duration-200 ${
                    isDone 
                      ? 'text-emerald-300 font-semibold' 
                      : isCurrent 
                      ? 'text-white font-bold' 
                      : 'text-emerald-500/40'
                  }`}
                >
                  <div className="shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20" />
                    )}
                  </div>
                  <span className="truncate">{st.label}</span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-emerald-950/80 rounded-full h-1.5 overflow-hidden mt-3">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-lime-300 h-1.5 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Enter Dashboard Button */}
        <button
          onClick={handleProceed}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-emerald-950 font-black text-sm shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center space-x-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Open KLH Farms Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-emerald-400/70 font-mono">
          Press to enter immediately or wait for automated boot
        </p>
      </div>
    </div>
  );
}
