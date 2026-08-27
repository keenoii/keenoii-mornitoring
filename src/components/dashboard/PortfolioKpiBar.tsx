'use client';

import React from 'react';
import { Folder, Flame, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PortfolioKpiBarProps {
  totalProjects: number;
  activeCount: number;
  needAttentionCount: number;
  staleCount: number;
  blockedCount: number;
  completedCount: number;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  activeTab: 'portfolio' | 'attention';
  onSelectAttentionTab: () => void;
}

export const PortfolioKpiBar: React.FC<PortfolioKpiBarProps> = ({
  totalProjects,
  activeCount,
  needAttentionCount,
  staleCount,
  blockedCount,
  completedCount,
  selectedStatus,
  onSelectStatus,
  activeTab,
  onSelectAttentionTab,
}) => {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Projects in Folder */}
      <div
        onClick={() => onSelectStatus('ALL')}
        className={`cursor-pointer p-4 rounded-2xl bg-slate-900/80 border transition-all hover:-translate-y-0.5 shadow-sm ${
          selectedStatus === 'ALL' && activeTab === 'portfolio'
            ? 'border-emerald-500/50 bg-emerald-950/10'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium">Projects in Folder</span>
          <Folder className="w-4 h-4 text-slate-500" />
        </div>
        <div className="text-2xl font-black text-white">{totalProjects}</div>
        <div className="text-[10px] text-slate-500 mt-1">ในโฟลเดอร์ที่เลือก</div>
      </div>

      {/* 2. Active */}
      <div
        onClick={() => onSelectStatus('ACTIVE')}
        className={`cursor-pointer p-4 rounded-2xl bg-slate-900/80 border transition-all hover:-translate-y-0.5 shadow-sm ${
          selectedStatus === 'ACTIVE'
            ? 'border-emerald-500/50 bg-emerald-950/20'
            : 'border-slate-800 hover:border-emerald-500/30'
        }`}
      >
        <div className="flex items-center justify-between text-emerald-400 mb-1.5">
          <span className="text-xs font-medium">Active</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
        <div className="text-[10px] text-emerald-400/70 mt-1">กำลังพัฒนา / ใช้งาน</div>
      </div>

      {/* 3. Need Attention */}
      <div
        onClick={onSelectAttentionTab}
        className={`cursor-pointer p-4 rounded-2xl bg-slate-900/80 border transition-all hover:-translate-y-0.5 shadow-sm ${
          activeTab === 'attention'
            ? 'border-amber-500 bg-amber-950/20 shadow-amber-500/10 shadow-lg'
            : 'border-amber-500/30 hover:border-amber-500/60'
        }`}
      >
        <div className="flex items-center justify-between text-amber-400 mb-1.5">
          <span className="text-xs font-semibold">Need Attention</span>
          <Flame className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-black text-amber-400">{needAttentionCount}</div>
        <div className="text-[10px] text-amber-400/80 mt-1">ต้องเข้าไปตรวจสอบ</div>
      </div>

      {/* 4. Smart Stale */}
      <div
        onClick={() => onSelectStatus('STALE')}
        className={`cursor-pointer p-4 rounded-2xl bg-slate-900/80 border transition-all hover:-translate-y-0.5 shadow-sm ${
          selectedStatus === 'STALE'
            ? 'border-slate-600 bg-slate-800/40'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium">Smart Stale</span>
          <Clock className="w-4 h-4 text-slate-500" />
        </div>
        <div className="text-2xl font-black text-slate-300">{staleCount}</div>
        <div className="text-[10px] text-slate-500 mt-1">ไม่มีความเคลื่อนไหว</div>
      </div>

      {/* 5. Blocked */}
      <div
        onClick={() => onSelectStatus('BLOCKED')}
        className={`cursor-pointer p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 transition-all hover:-translate-y-0.5 shadow-sm ${
          selectedStatus === 'BLOCKED' ? 'border-rose-500 bg-rose-950/20' : ''
        }`}
      >
        <div className="flex items-center justify-between text-rose-400 mb-1.5">
          <span className="text-xs font-medium">Blocked</span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-2xl font-black text-slate-400">{blockedCount}</div>
        <div className="text-[10px] text-slate-500 mt-1">ติดปัญหาคอขวด</div>
      </div>

      {/* 6. Completed */}
      <div
        onClick={() => onSelectStatus('COMPLETED')}
        className={`cursor-pointer p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 transition-all hover:-translate-y-0.5 shadow-sm ${
          selectedStatus === 'COMPLETED' ? 'border-teal-500 bg-teal-950/20' : ''
        }`}
      >
        <div className="flex items-center justify-between text-teal-400 mb-1.5">
          <span className="text-xs font-medium">Completed</span>
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
        </div>
        <div className="text-2xl font-black text-slate-400">{completedCount}</div>
        <div className="text-[10px] text-slate-500 mt-1">บรรลุเป้าหมายแล้ว</div>
      </div>
    </section>
  );
};
