'use client';

import React from 'react';
import Link from 'next/link';
import { Star, AlertTriangle, Sparkles, Zap, Shield } from 'lucide-react';
import { ProjectWithHealth } from '@/lib/project-repository';

interface ProjectWorkerProps {
  project: ProjectWithHealth;
  isStarred?: boolean;
  workerState: 'active_typer' | 'thinking' | 'fixing' | 'healthy' | 'alert' | 'sleeping';
  onClick?: () => void;
}

export const ProjectWorker: React.FC<ProjectWorkerProps> = ({
  project,
  isStarred = false,
  workerState,
  onClick,
}) => {
  const isHealthy = project.health.total >= 75;
  const isWarRoom = project.health.total < 60;

  // Character Avatar Emoji & Animation
  let avatarEmoji = '🧑‍💻';
  let statusBadge = '🟢 Active';
  let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  if (workerState === 'sleeping') {
    avatarEmoji = '😴';
    statusBadge = '💤 Stale';
    badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
  } else if (workerState === 'alert') {
    avatarEmoji = '🚨🧑‍💻';
    statusBadge = '⚠️ Attention';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
  } else if (workerState === 'fixing') {
    avatarEmoji = '🧑‍🔧';
    statusBadge = '🔧 Fixing';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  } else if (workerState === 'healthy') {
    avatarEmoji = '🧑‍💻✨';
    statusBadge = '🏆 Healthy';
    badgeColor = 'bg-teal-500/20 text-teal-300 border-teal-500/40';
  } else if (workerState === 'thinking') {
    avatarEmoji = '🧑‍💻💭';
    statusBadge = '🧠 Planning';
    badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
  }

  return (
    <div
      onClick={onClick}
      className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
        isStarred
          ? 'bg-gradient-to-b from-amber-950/40 to-slate-900/90 border-amber-500/60 shadow-lg shadow-amber-950/30'
          : isWarRoom
          ? 'bg-gradient-to-b from-rose-950/30 to-slate-900/90 border-rose-500/50 hover:border-rose-400 shadow-md'
          : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/90 hover:shadow-xl'
      } hover:-translate-y-1`}
    >
      {/* Starred Pin Crown */}
      {isStarred && (
        <div className="absolute -top-2.5 -right-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] flex items-center gap-0.5 shadow-md">
          <Star className="w-2.5 h-2.5 fill-slate-950" />
          <span>FOCUS</span>
        </div>
      )}

      {/* WORKSPACE DESK VISUAL */}
      <div className="flex items-center gap-3">
        {/* Worker Character Sitting at Monitor */}
        <div className="relative flex-shrink-0">
          {/* Monitor Screen Frame */}
          <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center justify-center text-xl shadow-inner relative overflow-hidden group-hover:border-indigo-400 transition-colors">
            {/* Monitor Scanlines & Screen Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent pointer-events-none" />
            <span className={`transform transition-transform ${workerState === 'active_typer' ? 'animate-bounce' : ''}`}>
              {avatarEmoji}
            </span>
          </div>

          {/* Activity Status Dot */}
          <span
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
              isWarRoom
                ? 'bg-rose-500 animate-ping'
                : isHealthy
                ? 'bg-emerald-400'
                : 'bg-amber-400'
            }`}
          />
        </div>

        {/* Project & Desk Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5 mb-0.5">
            <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
              {project.name}
            </h4>
            <span className="text-[11px] font-black text-emerald-400 flex-shrink-0 font-mono">
              {project.health.total}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold ${badgeColor}`}>
              {statusBadge}
            </span>
            <span className="truncate">{project.detectedType.primaryType}</span>
          </div>

          {/* Next Action Snippet on Hover */}
          <div className="text-[10px] text-slate-400 mt-1.5 truncate border-t border-slate-800/60 pt-1 flex items-center justify-between">
            <span className="truncate text-slate-300">
              {project.health.nextActions.urgent?.action || project.health.nextActions.next?.action || 'พร้อมพัฒนาต่อ'}
            </span>
            <span className="text-[9px] font-bold text-teal-400 ml-1 flex-shrink-0">
              {project.progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
