'use client';

import React from 'react';
import { Sparkles, Activity } from 'lucide-react';
import { APP_SETTINGS } from '@/config/app-settings';

interface OfficeStatusFooterProps {
  avgHealth: number;
  activeCount: number;
  onlineCount?: number;
  totalCount: number;
  loungePage?: number;
  totalLoungePages?: number;
  totalLoungeProjects?: number;
  isAutoCycleEnabled?: boolean;
  onPrevLoungePage?: () => void;
  onNextLoungePage?: () => void;
  onToggleAutoCycle?: () => void;
}

export const OfficeStatusFooter: React.FC<OfficeStatusFooterProps> = ({
  avgHealth,
  activeCount,
  onlineCount = 0,
  totalCount,
  loungePage = 0,
  totalLoungePages = 1,
  totalLoungeProjects = 0,
  isAutoCycleEnabled = true,
  onPrevLoungePage,
  onNextLoungePage,
  onToggleAutoCycle,
}) => {
  const healthColor =
    avgHealth >= APP_SETTINGS.healthThresholds.healthy
      ? APP_SETTINGS.statusColors.healthy
      : avgHealth >= APP_SETTINGS.healthThresholds.attention
      ? APP_SETTINGS.statusColors.attention
      : APP_SETTINGS.statusColors.critical;

  return (
    <div className="p-3.5 px-4 z-20 flex items-center justify-between pointer-events-none flex-wrap gap-2">
      {/* Left Legend */}
      <div className="p-2 rounded-2xl bg-slate-900/95 border border-slate-800/90 shadow-xl backdrop-blur-md flex items-center gap-3 text-[11px] font-semibold text-slate-300 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: APP_SETTINGS.statusColors.healthy,
              boxShadow: `0 0 8px ${APP_SETTINGS.statusColors.healthy}`,
            }}
          />
          <span>Healthy (75+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: APP_SETTINGS.statusColors.attention,
              boxShadow: `0 0 8px ${APP_SETTINGS.statusColors.attention}`,
            }}
          />
          <span>Attention (60-74)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: APP_SETTINGS.statusColors.critical,
              boxShadow: `0 0 8px ${APP_SETTINGS.statusColors.critical}`,
            }}
          />
          <span>Critical (&lt;60)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: APP_SETTINGS.statusColors.dormant }}
          />
          <span>Dormant</span>
        </div>
      </div>

      {/* Center: Title Badge & Lounge Carousel Controller */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 text-indigo-300 font-extrabold text-xs shadow-xl backdrop-blur-md uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>VIRTUAL OFFICE</span>
        </div>

        {totalLoungePages > 1 && onPrevLoungePage && onNextLoungePage && (
          <div className="flex items-center gap-1.5 bg-slate-900/95 border border-slate-700/80 px-3 py-1 rounded-2xl text-[10px] font-mono text-slate-300 shadow-xl backdrop-blur-md">
            <button
              onClick={onPrevLoungePage}
              className="hover:text-sky-300 px-1 cursor-pointer font-bold transition-colors"
              title="โซฟาก่อนหน้า"
            >
              ◀
            </button>
            <span className="text-emerald-400 font-bold">
              โซฟา {loungePage + 1}/{totalLoungePages} ({totalLoungeProjects} เว็บ)
            </span>
            <button
              onClick={onNextLoungePage}
              className="hover:text-sky-300 px-1 cursor-pointer font-bold transition-colors"
              title="โซฟาถัดไป"
            >
              ▶
            </button>
            {onToggleAutoCycle && (
              <button
                onClick={onToggleAutoCycle}
                className={`ml-1 text-[9px] px-2 py-0.5 rounded-full border cursor-pointer font-semibold transition-all ${
                  isAutoCycleEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-950'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="เปิด/ปิด การหมุนเวียนอัตโนมัติทุก 12 วิ"
              >
                {isAutoCycleEnabled ? '🔄 Auto' : '⏸️'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Live Health & System Stats */}
      <div className="p-2 px-3 rounded-2xl bg-slate-900/95 border border-slate-800/90 shadow-xl backdrop-blur-md flex items-center gap-3.5 text-xs font-bold pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[10px]">Office Health</span>
          <span className="font-black text-sm flex items-center gap-1" style={{ color: healthColor }}>
            <Activity className="w-3.5 h-3.5" />
            {avgHealth}/100
          </span>
        </div>

        {onlineCount > 0 && (
          <>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
              <span className="text-emerald-300 font-bold text-xs">{onlineCount} Online</span>
            </div>
          </>
        )}

        <div className="h-4 w-px bg-slate-800" />
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[10px]">กำลังพัฒนา</span>
          <span className="text-cyan-400 font-bold text-xs">
            {activeCount} / {totalCount}
          </span>
        </div>
      </div>
    </div>
  );
};
