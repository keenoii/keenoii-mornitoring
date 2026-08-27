'use client';

import React from 'react';
import { Bot, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { MorningBriefing } from '@/collector/diff';
import { ProjectWithHealth } from '@/lib/project-repository';

interface MorningIntelligenceBannerProps {
  intelligence: MorningBriefing | undefined;
  focusProjects: Array<{
    project: ProjectWithHealth;
    focusReason: string;
    actionHighlight: string;
  }>;
  onSelectProject: (project: ProjectWithHealth) => void;
}

export const MorningIntelligenceBanner: React.FC<MorningIntelligenceBannerProps> = ({
  intelligence,
  focusProjects,
  onSelectProject,
}) => {
  if (!intelligence) return null;

  const headline = `สรุปความเคลื่อนไหว: ${intelligence.changedCount} โครงการมีการอัปเดต • ${intelligence.improvedCount} ดีขึ้น • ${intelligence.staleCount} ขาดการอัปเดต`;

  return (
    <section className="p-4 md:p-5 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 border border-indigo-500/30 shadow-xl space-y-4">
      {/* Morning Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs md:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>🧠 PROJECT INTELLIGENCE</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Morning Cockpit
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{headline}</p>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono self-end sm:self-center">
          Last Synced: {intelligence.generatedAt.slice(11, 19)}
        </div>
      </div>

      {/* AI Focus Today (3 Key Projects) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>🎯 AI Focus Today (3 โปรเจกต์ที่ควรสนใจก่อนวันนี้):</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {focusProjects.map(({ project, focusReason, actionHighlight }, idx) => {
            if (!project) return null;
            const isCritical = project.health.total < 60;
            const isAttention = project.health.total >= 60 && project.health.total < 75;

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="group p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5 truncate">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono text-slate-400">
                        {idx + 1}
                      </span>
                      <span className="truncate">{project.name}</span>
                    </span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300'
                          : isAttention
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {project.health.total}/100
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 mb-2 truncate">{focusReason}</p>

                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-200">
                    <div className="line-clamp-2 text-[10px] text-amber-300/90 font-mono">
                      {actionHighlight}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-900 mt-2">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-400" />
                    <span>
                      Est: {project.health.total} → {project.health.estimatedPotentialTotal}
                    </span>
                  </span>
                  <span className="text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                    ดูงาน <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
