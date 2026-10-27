import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

export default function CoverPage({ onFinish }) {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 5000; // 5 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingSecs = Math.max(0, Math.ceil((duration - elapsed) / 1000));
      const currentProgress = Math.min(100, (elapsed / duration) * 100);

      setSecondsLeft(remainingSecs);
      setProgress(currentProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        triggerExit();
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const triggerExit = () => {
    setIsFading(true);
    setTimeout(() => {
      onFinish();
    }, 600);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white overflow-hidden select-none transition-opacity duration-700 ease-in-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Blurred atmospheric backdrop based on cover image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}klh-farms-cover.jpg`}
          alt="KLH Farms Backdrop"
          className="w-full h-full object-cover blur-2xl opacity-40 scale-110"
          onError={(e) => {
            e.currentTarget.src = './klh-farms-cover.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/60" />
      </div>

      {/* Main High-Resolution Cover Image Container */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-2 sm:p-6 md:p-10">
        <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xs">
          <img
            src={`${import.meta.env.BASE_URL}klh-farms-cover.jpg`}
            alt="KLH Farms — Fresh Farms, Healthy Lives, A Greener Tomorrow"
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = './klh-farms-cover.jpg';
            }}
          />
        </div>
      </div>

      {/* Top Banner / Skip Button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center space-x-3">
        <button
          onClick={triggerExit}
          className="flex items-center space-x-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/25 text-xs sm:text-sm font-bold shadow-lg transition-all transform hover:scale-105 cursor-pointer"
        >
          <span>Skip to Website ({secondsLeft}s)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Progress Bar & Timing Indicator */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-xl mx-auto mb-3 sm:mb-5 px-4 flex items-center justify-between text-xs text-emerald-200/90 font-medium">
          <span className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>KLH FARMS • Precision Agriculture Platform</span>
          </span>
          <span className="font-mono text-white/80">Launching in {secondsLeft}s...</span>
        </div>
        <div className="w-full bg-white/10 h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-green-300 to-lime-400 transition-all duration-75 ease-linear shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
