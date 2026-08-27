'use client';

import React from 'react';
import { Flame, Star } from 'lucide-react';

interface PortfolioFilterTabsProps {
  activeTab: 'portfolio' | 'attention';
  onTabChange: (tab: 'portfolio' | 'attention') => void;
  portfolioCount: number;
  attentionCount: number;
  activeQuickFilter: string | null;
  onToggleQuickFilter: (filter: string) => void;
  starredCount: number;
}

export const PortfolioFilterTabs: React.FC<PortfolioFilterTabsProps> = ({
  activeTab,
  onTabChange,
  portfolioCount,
  attentionCount,
  activeQuickFilter,
  onToggleQuickFilter,
  starredCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onTabChange('portfolio')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'portfolio'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          Portfolio Overview ({portfolioCount})
        </button>
        <button
          onClick={() => onTabChange('attention')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'attention'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Follow-up Queue</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
            {attentionCount}
          </span>
        </button>
      </div>

      {/* Quick Filter Badges */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs">
        <button
          onClick={() => onToggleQuickFilter('starred')}
          className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
            activeQuickFilter === 'starred'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-sm shadow-amber-950/30'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-white'
          }`}
        >
          <Star className={`w-3 h-3 ${starredCount > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
          <span>กำลังทำอยู่ ({starredCount})</span>
        </button>
        <button
          onClick={() => onToggleQuickFilter('dirty')}
          className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-all cursor-pointer border ${
            activeQuickFilter === 'dirty'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-medium'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
          }`}
        >
          🌿 Dirty Git
        </button>
        <button
          onClick={() => onToggleQuickFilter('nextjs')}
          className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-all cursor-pointer border ${
            activeQuickFilter === 'nextjs'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-medium'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
          }`}
        >
          ⚡ Next.js
        </button>
        <button
          onClick={() => onToggleQuickFilter('hasConfig')}
          className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-all cursor-pointer border ${
            activeQuickFilter === 'hasConfig'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-medium'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
          }`}
        >
          📄 Has .project-monitor.yaml
        </button>
      </div>
    </div>
  );
};
