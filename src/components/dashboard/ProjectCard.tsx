'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Target, ExternalLink, EyeOff } from 'lucide-react';
import { ProjectWithHealth } from '@/lib/project-repository';

interface ProjectCardProps {
  project: ProjectWithHealth;
  isStarred: boolean;
  onToggleStar: (projectId: string, e: React.MouseEvent) => void;
  onOpenExplainer: (project: ProjectWithHealth) => void;
  onOpenAdvisor: (project: ProjectWithHealth) => void;
  onOpenServices?: (project: ProjectWithHealth) => void;
  onOpenEditUrl?: (project: ProjectWithHealth) => void;
  onToggleHide?: (projectId: string, e: React.MouseEvent) => void;
  liveStatus?: { isOnline: boolean; statusCode?: number; responseTimeMs: number; error?: string };
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project: p,
  isStarred,
  onToggleStar,
  onOpenExplainer,
  onOpenAdvisor,
  onOpenServices,
  onOpenEditUrl,
  onToggleHide,
  liveStatus,
}) => {
  const isStale = p.status === 'STALE' || p.health.isSmartStale;
  const configuredUrl = p.healthUrl || p.config?.health_url;

  return (
    <div
      className={`group relative rounded-3xl p-5 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between ${
        isStarred
          ? 'bg-slate-900 border border-amber-500/40 hover:border-amber-400 shadow-amber-950/20 shadow-md ring-1 ring-amber-500/20'
          : 'bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 hover:shadow-emerald-950/20'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  p.status === 'BLOCKED'
                    ? 'bg-rose-500 ring-4 ring-rose-500/20'
                    : isStale
                    ? 'bg-amber-400 ring-4 ring-amber-400/20'
                    : p.status === 'ACTIVE'
                    ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                    : 'bg-slate-500'
                }`}
              />
              <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors truncate">
                {p.name}
              </h3>
            </div>
            <p className="text-xs text-slate-400 truncate">{p.config?.description || p.path}</p>
          </div>

          {/* Actions & Health Score Badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onToggleHide && (
              <button
                onClick={(e) => onToggleHide(p.id, e)}
                className="p-1.5 rounded-xl border border-slate-800/80 text-slate-500 hover:text-rose-300 hover:bg-slate-800/80 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                title="ซ่อนโฟลเดอร์/โปรเจกต์นี้จากมุมมอง"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={(e) => onToggleStar(p.id, e)}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                isStarred
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-500 hover:text-amber-400'
              }`}
              title={isStarred ? 'ยกเลิกการติดดาว' : 'ติดดาวโปรเจกต์นี้ (Pin to Active Focus)'}
            >
              <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            <div className="flex flex-col items-end">
              <div
                onClick={() => onOpenExplainer(p)}
                className={`px-2.5 py-1 rounded-xl border font-black text-xs flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                  p.health.tier === 'Excellent' || p.health.tier === 'Healthy'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                    : p.health.tier === 'Attention'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                }`}
                title="คลิกเพื่อดูเหตุผลและวิธีเพิ่มคะแนนสุขภาพ"
              >
                <span>{p.health.total}</span>
                <span className="text-[9px] font-normal text-slate-400">/100</span>
              </div>
              <span className="text-[9px] text-slate-400 mt-0.5">{p.health.tier}</span>
            </div>
          </div>
        </div>

        {/* Tech Pills & Live Uptime Badge */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 font-medium">
            {p.detectedType.primaryType}
          </span>

          {p.submodules && p.submodules.length > 0 && (
            <button
              onClick={() => onOpenServices && onOpenServices(p)}
              className="px-2.5 py-0.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-[11px] text-purple-300 font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
              title="คลิกเพื่อดูรายการ Services ทั้งหมดในโปรเจกต์นี้"
            >
              📦 {p.submodules.length} Services ↗
            </button>
          )}

          {/* Live URL Operational Status Badge */}
          {configuredUrl ? (
            <button
              onClick={() => onOpenEditUrl && onOpenEditUrl(p)}
              className={`px-2 py-0.5 rounded-md border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                liveStatus
                  ? liveStatus.isOnline
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30 animate-pulse'
                  : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
              }`}
              title={`Live URL: ${configuredUrl} (คลิกเพื่อแก้ไขหรือตรวจสอบ)`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  liveStatus
                    ? liveStatus.isOnline
                      ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                      : 'bg-rose-400 shadow-[0_0_6px_#f43f5e]'
                    : 'bg-indigo-400'
                }`}
              />
              <span>
                {liveStatus
                  ? liveStatus.isOnline
                    ? `Online (${liveStatus.responseTimeMs}ms)`
                    : '🔴 Offline'
                  : '🌐 Live Host'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => onOpenEditUrl && onOpenEditUrl(p)}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-[10px] text-slate-400 hover:text-emerald-300 transition-all cursor-pointer"
              title="เพิ่ม Live URL สำหรับมอนิเตอร์ Uptime"
            >
              + Live URL
            </button>
          )}

          {p.health.isSmartStale && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300">
              ⏰ Stale (&gt;14d)
            </span>
          )}
        </div>

        {/* 1. SEPARATE PROGRESS & HEALTH CLEARLY */}
        <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 mb-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-teal-400" />
              <span>Roadmap Progress:</span>
            </span>
            <span className="text-teal-400 font-bold">{p.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
              style={{ width: `${Math.max(5, p.progress)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
            <span>
              Stage: <strong className="text-slate-300">{p.stage}</strong>
            </span>
            <span>
              Status:{' '}
              <strong className={isStale ? 'text-amber-400' : 'text-slate-300'}>
                {isStale ? 'STALE' : p.status}
              </strong>
            </span>
          </div>
        </div>

        {/* 2. NEXT ACTION */}
        <div className="p-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 mb-3">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
            <span>Next Action:</span>
            {p.health.nextActions.urgent ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                ต้องทำก่อน
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">พร้อมพัฒนาต่อ</span>
            )}
          </div>
          <div className="text-[11px] text-slate-200 font-medium line-clamp-1">
            {p.health.nextActions.urgent?.action ||
              p.health.nextActions.next?.action ||
              'พัฒนาฟีเจอร์ต่อไปตาม Roadmap'}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-1">
            Est. Gain: +{p.health.nextActions.urgent?.potentialGain || p.health.nextActions.next?.potentialGain || 0} pts (
            {p.health.total} → {p.health.estimatedPotentialTotal})
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <button
          onClick={() => onOpenAdvisor(p)}
          className="text-slate-400 hover:text-emerald-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
        >
          สรุปย่อ
        </button>

        <Link
          href={`/projects/${p.id}`}
          className="text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>🧠 Project Memory</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
