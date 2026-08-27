'use client';

import React from 'react';
import Link from 'next/link';
import { X, Layers, Box, ChevronRight, ExternalLink, Sparkles, Folder } from 'lucide-react';
import { ProjectWithHealth } from '@/lib/project-repository';
import { SubmoduleInfo } from '@/collector/types';

interface ProjectServicesModalProps {
  project: ProjectWithHealth | null;
  onClose: () => void;
  allProjects?: ProjectWithHealth[];
  onOpenSubproject?: (sub: ProjectWithHealth) => void;
}

export const ProjectServicesModal: React.FC<ProjectServicesModalProps> = ({
  project,
  onClose,
  allProjects = [],
  onOpenSubproject,
}) => {
  if (!project) return null;

  const services: SubmoduleInfo[] = project.submodules || [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
                <Box className="w-3 h-3" />
                <span>Multi-Service Architecture</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {services.length} Microservices / Submodules
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              <span>{project.name}</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono truncate">{project.path}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Services List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>รายการ Services ทั้งหมดในโปรเจกต์นี้:</span>
            <span className="text-purple-400 font-bold">{services.length} บริการย่อย</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {services.map((sub, idx) => {
              // 1. Try to find if this sub-service is indexed as a full scanned project
              const subClean = sub.relativePath.replace(/[\\/]/g, '/').toLowerCase();
              const matchedProject = allProjects.find((p) => {
                const pClean = p.path.replace(/[\\/]/g, '/').toLowerCase();
                const pName = p.name.toLowerCase();
                return (
                  pClean.endsWith(`/${subClean}`) ||
                  pClean.endsWith(`\\${subClean}`) ||
                  pClean.includes(`/${subClean}`) ||
                  pName === sub.name.toLowerCase()
                );
              });

              // 2. If not indexed separately, generate a virtual target project representation
              const targetProject: ProjectWithHealth = matchedProject || {
                id: `${project.id}--${sub.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`,
                name: `${project.name} / ${sub.name}`,
                slug: `${project.slug}-${sub.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`,
                path: `${project.path}\\${sub.relativePath}`,
                relativePath: `${project.relativePath}/${sub.relativePath}`,
                status: project.status,
                stage: project.stage,
                priority: 'medium',
                progress: project.progress,
                hasConfigYaml: false,
                detectedType: {
                  primaryType: sub.type,
                  frameworks: sub.frameworks || [],
                  languages: [],
                  indicatorFiles: [],
                },
                git: {
                  isRepo: false,
                  branch: project.git?.branch || 'main',
                  isDirty: false,
                  uncommittedFiles: 0,
                  lastCommitDate: project.git?.lastCommitDate || null,
                  lastCommitMessage: null,
                  lastCommitAuthor: null,
                  remoteUrl: null,
                },
                metrics: {
                  todoCount: 0,
                  fixmeCount: 0,
                  todoSamples: [],
                  hasReadme: false,
                  hasDocker: sub.frameworks?.includes('Docker') || false,
                  hasKubernetes: false,
                  hasTests: false,
                  lastModifiedDate: new Date().toISOString(),
                  totalFiles: 0,
                },
                health: {
                  ...project.health,
                },
                attentionItems: [],
                milestones: [],
                scannedAt: project.scannedAt || new Date().toISOString(),
              };

              return (
                <div
                  key={idx}
                  onClick={() => onOpenSubproject && onOpenSubproject(targetProject)}
                  className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/60 transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-sm hover:shadow-purple-950/30"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0 mt-0.5 group-hover:bg-purple-500/20 transition-colors">
                      <Layers className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h4 className="font-bold text-white text-xs group-hover:text-purple-300 transition-colors truncate">
                          {sub.name}
                        </h4>
                        <span className="px-2 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/50">
                          {sub.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono truncate">
                        <Folder className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{sub.relativePath}</span>
                      </div>

                      {sub.frameworks && sub.frameworks.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {sub.frameworks.map((f, fIdx) => (
                            <span
                              key={fIdx}
                              className="px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-500/30 text-[9px] font-mono text-purple-300"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenSubproject) onOpenSubproject(targetProject);
                    }}
                    className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer flex-shrink-0 shadow-sm"
                    title="เปิดวิเคราะห์คะแนนสุขภาพและสถานะของ Service นี้"
                  >
                    <span>เจาะลึก</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <Link
            href={`/projects/${project.id}`}
            className="text-pink-400 hover:text-pink-300 text-xs font-semibold flex items-center gap-1"
          >
            <span>🧠 ดูโครงสร้างใน Project Memory</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
