'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Target,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';
import { ProjectWithHealth } from '@/lib/project-repository';
import { HealthDimensionDetail } from '@/lib/health';

interface HealthExplainerModalProps {
  project: ProjectWithHealth | null;
  onClose: () => void;
  onOpenAdvisor: (project: ProjectWithHealth) => void;
}

export const HealthExplainerModal: React.FC<HealthExplainerModalProps> = ({
  project,
  onClose,
  onOpenAdvisor,
}) => {
  const [selectedDimension, setSelectedDimension] = useState<HealthDimensionDetail | null>(null);

  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Health Score Explainer
              </span>
              <span className="text-xs text-slate-400 font-mono">100-Point Rule Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{project.name}</h2>
            <p className="text-xs text-slate-400 font-mono truncate">{project.path}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Summary Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-white">{project.health.total}</div>
            <div className="text-xs">
              <span className="font-bold text-slate-300">คะแนนสุขภาพรวม</span>
              <div className="text-slate-400 font-mono">เต็ม 100 คะแนน</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                project.health.tier === 'Excellent' || project.health.tier === 'Healthy'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : project.health.tier === 'Attention'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              ระดับ: {project.health.tier}
            </span>

            <div className="text-right text-xs">
              <span className="text-slate-400 text-[10px]">พัฒนาได้สูงสุด</span>
              <div className="text-emerald-400 font-bold font-mono">
                {project.health.estimatedPotentialTotal}/100
              </div>
            </div>
          </div>
        </div>

        {/* 7 Health Dimensions Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>เจาะลึก 7 มิติคะแนน (คลิกเพื่อดูวิธีปรับปรุง):</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {project.health.dimensions.map((dim) => {
              const isSelected = selectedDimension?.key === dim.key;
              const isFull = dim.score === dim.maxScore;

              return (
                <div
                  key={dim.key}
                  onClick={() => setSelectedDimension(dim)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">{dim.label}</span>
                    <span className="font-mono font-bold text-white">
                      {dim.score} / {dim.maxScore}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${
                        isFull
                          ? 'bg-emerald-400'
                          : dim.score > 0
                          ? 'bg-amber-400'
                          : 'bg-slate-700'
                      }`}
                      style={{ width: `${(dim.score / dim.maxScore) * 100}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1">{dim.reason}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Dimension Detail Card */}
        {selectedDimension && (
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between font-bold text-indigo-300 border-b border-indigo-500/20 pb-2">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>คำอธิบายมิติ: {selectedDimension.label}</span>
              </span>
              <span className="font-mono">
                {selectedDimension.score}/{selectedDimension.maxScore} pts
              </span>
            </div>

            <div className="text-slate-300">
              <span className="text-slate-400">สถานะปัจจุบัน:</span> {selectedDimension.reason}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-1 text-[11px]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>วิธีเพิ่มคะแนน (+{selectedDimension.potentialGain} pts):</span>
              </div>
              <p className="text-[11px] text-slate-200">{selectedDimension.howToImprove}</p>
            </div>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={() => onOpenAdvisor(project)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>ขอคำแนะนำจาก AI Advisor</span>
          </button>

          <Link
            href={`/projects/${project.id}`}
            className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>🧠 Project Memory Cockpit</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
