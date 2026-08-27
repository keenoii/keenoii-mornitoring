'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { APP_SETTINGS } from '@/config/app-settings';

interface OfficeTourBannerProps {
  isTourRunning: boolean;
  tourStep: number;
  tourName: string;
  tourNarration: string;
}

export const OfficeTourBanner: React.FC<OfficeTourBannerProps> = ({
  isTourRunning,
  tourStep,
  tourName,
  tourNarration,
}) => {
  const [typedNarration, setTypedNarration] = useState<string>('');

  useEffect(() => {
    if (!isTourRunning || !tourNarration) {
      setTypedNarration('');
      return;
    }

    setTypedNarration('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < tourNarration.length) {
        setTypedNarration(tourNarration.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, APP_SETTINGS.officeTour.typingSpeedMs);

    return () => clearInterval(interval);
  }, [tourNarration, isTourRunning]);

  if (!isTourRunning) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] px-4 pointer-events-none transition-all duration-300">
      <div className="p-4 rounded-3xl bg-slate-950/95 border-2 border-indigo-500 text-white shadow-[0_0_40px_rgba(99,102,241,0.6)] backdrop-blur-xl space-y-2 relative overflow-hidden">
        {/* Pulsing Top Ambient Bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse" />

        <div className="flex items-center justify-between">
          <div className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>
              AI TOUR GUIDE ({tourStep + 1}/5) • {tourName}
            </span>
          </div>
          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-500/40 animate-pulse">
            🎙️ Auto-navigating
          </span>
        </div>

        <p className="text-xs md:text-sm font-bold text-slate-100 min-h-[38px] leading-relaxed flex items-center">
          <span>{typedNarration}</span>
          <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-400 animate-pulse" />
        </p>
      </div>
    </div>
  );
};
