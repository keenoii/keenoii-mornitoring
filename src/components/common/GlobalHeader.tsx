'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Search, Building2, RefreshCw, Flame, LayoutDashboard } from 'lucide-react';
import { SITE_NAVIGATION_CONFIG } from '@/config/site-navigation';

interface GlobalHeaderProps {
  activeWorkspacePath?: string;
  totalProjectsCount?: number;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  activeView?: 'portfolio' | 'office';
  attentionCount?: number;
  onToggleAttention?: () => void;
  isAttentionActive?: boolean;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  activeWorkspacePath,
  totalProjectsCount,
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading = false,
  activeView = 'portfolio',
  attentionCount = 0,
  onToggleAttention,
  isAttentionActive = false,
}) => {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
      {/* Brand & App Info */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20 flex-shrink-0">
          <Shield className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg md:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent whitespace-nowrap">
              {SITE_NAVIGATION_CONFIG.appName}
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
              Command Center {SITE_NAVIGATION_CONFIG.appVersion}
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            {activeWorkspacePath ? (
              <span className="truncate">
                Active: <span className="text-slate-200 font-mono font-medium">{activeWorkspacePath}</span> •{' '}
                <strong className="text-slate-300">{totalProjectsCount ?? 0} Projects</strong>
              </span>
            ) : (
              'Connecting to Local Collector...'
            )}
          </p>
        </div>
      </div>

      {/* Actions & Navigation */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
        {/* Search */}
        <div className="relative w-full sm:w-44 md:w-56 lg:w-60">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาโปรเจกต์ (redis, nextjs)..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>

        {/* View Switcher */}
        {activeView === 'portfolio' ? (
          <Link
            href="/office"
            className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-950/30 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Virtual Office (2.5D)</span>
          </Link>
        ) : (
          <Link
            href="/"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Command View</span>
          </Link>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/30 transition-all active:scale-95 cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'กำลังสแกน...' : 'สแกนทั้งหมด'}</span>
          </button>
        )}

        {/* Attention Badge Button */}
        {onToggleAttention && (
          <button
            onClick={onToggleAttention}
            className={`relative px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border whitespace-nowrap flex-shrink-0 ${
              isAttentionActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${attentionCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Attention</span>
            {attentionCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                {attentionCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
