'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, CheckCircle2, ChevronRight, ExternalLink } from 'lucide-react';
import { ProjectWithHealth } from '@/lib/project-repository';

interface AttentionQueueTableProps {
  projects: ProjectWithHealth[];
  onOpenProject: (project: ProjectWithHealth) => void;
}

export const AttentionQueueTable: React.FC<AttentionQueueTableProps> = ({
  projects,
  onOpenProject,
}) => {
  // Aggregate all attention items
  const allAttentionItems = projects.flatMap((p) =>
    (p.attentionItems || []).map((item) => ({
      ...item,
      projectName: p.name,
      projectPath: p.path,
      project: p,
    }))
  );

  return (
    <div className="space-y-3">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              รายการที่ต้องตรวจสอบและแก้ไขเร่งด่วน (Attention Queue)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {allAttentionItems.length} รายการที่ต้องสะสาง
          </span>
        </div>

        {allAttentionItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">ยอดเยี่ยม! ไม่มีปัญหาคั่งค้างในพอร์ตโฟลิโอของคุณ</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {allAttentionItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 hover:bg-slate-800/30 transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 ${
                      item.severity === 'urgent'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : item.severity === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.severity}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-bold text-white text-xs">{item.projectName}</span>
                      <span className="text-[11px] font-mono text-slate-400">• {item.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{item.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onOpenProject(item.project)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                    title="เปิดดูรายละเอียด"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/projects/${item.project.id}`}
                    className="p-2 text-pink-400 hover:text-pink-300 rounded-xl hover:bg-pink-950/40 transition-colors cursor-pointer"
                    title="ไปที่ Project Memory"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
