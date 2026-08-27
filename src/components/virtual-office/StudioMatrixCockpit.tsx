'use client';

import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  GitBranch,
  GitCommit,
  Globe,
  Layers,
  LayoutGrid,
  Radio,
  Search,
  Server,
  ShieldAlert,
  Sparkles,
  Star,
  Terminal,
  Zap,
} from 'lucide-react';
import { ProjectWithHealth } from '@/lib/project-repository';
import { VIRTUAL_STUDIOS, StudioDefinition, ClassificationResult } from '@/lib/studio-classifier';
import { LiveHealthStatus } from '@/services/live-health-service';
import { APP_SETTINGS } from '@/config/app-settings';

interface StudioMatrixCockpitProps {
  projects: ProjectWithHealth[];
  classifiedData: Record<
    string,
    Array<{
      project: ProjectWithHealth;
      workerState: 'active_typer' | 'thinking' | 'fixing' | 'healthy' | 'alert' | 'sleeping';
      classification: ClassificationResult;
    }>
  >;
  starredProjectIds: string[];
  liveStatuses?: Record<string, LiveHealthStatus>;
  onSelectProject: (project: ProjectWithHealth) => void;
  onOpenAdvisor: (project: ProjectWithHealth) => void;
  onEditUrl?: (project: ProjectWithHealth) => void;
  onToggleStar?: (projectId: string) => void;
  searchQuery: string;
}

export const StudioMatrixCockpit: React.FC<StudioMatrixCockpitProps> = ({
  projects,
  classifiedData,
  starredProjectIds,
  liveStatuses = {},
  onSelectProject,
  onOpenAdvisor,
  onEditUrl,
  onToggleStar,
  searchQuery,
}) => {
  // Active Studio Filter (null = All Studios)
  const [selectedStudioFilter, setSelectedStudioFilter] = useState<string | null>(null);
  const [expandedStudios, setExpandedStudios] = useState<Record<string, boolean>>({
    warroom: true,
    web: true,
    ai: true,
    infra: true,
    database: true,
    media: true,
    poc: true,
    archive: false,
  });
  const [sortBy, setSortBy] = useState<'health_asc' | 'health_desc' | 'name' | 'modified'>('health_asc');

  // Toggle Collapse/Expand Studio Section
  const toggleStudioExpand = (studioId: string) => {
    setExpandedStudios((prev) => ({
      ...prev,
      [studioId]: !prev[studioId],
    }));
  };

  // Expand / Collapse All
  const expandAll = () => {
    const next: Record<string, boolean> = {};
    VIRTUAL_STUDIOS.forEach((s) => (next[s.id] = true));
    setExpandedStudios(next);
  };
  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    VIRTUAL_STUDIOS.forEach((s) => (next[s.id] = false));
    setExpandedStudios(next);
  };

  // Search filter
  const isMatch = (p: ProjectWithHealth) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.detectedType.primaryType.toLowerCase().includes(q) ||
      (p.detectedType.frameworks || []).some((f) => f.toLowerCase().includes(q))
    );
  };

  // Global KPIs Calculation
  const kpis = useMemo(() => {
    const total = projects.length;
    const warRoomProjects = classifiedData.warroom?.map((item) => item.project) || [];
    const activeProjects = projects.filter(
      (p) => !p.health.isSmartStale && p.status !== 'STALE' && p.status !== 'ARCHIVED'
    );
    const dormantProjects = projects.filter((p) => p.health.isSmartStale || p.status === 'STALE');
    const avgHealth =
      total > 0
        ? Math.round(projects.reduce((acc, curr) => acc + curr.health.total, 0) / total)
        : 0;

    const onlineServices = Object.values(liveStatuses).filter((s) => s.isOnline).length;
    const totalWithUrl = projects.filter((p) => p.healthUrl || p.config?.health_url).length;

    // Tech framework counts
    const techCounts: Record<string, number> = {};
    projects.forEach((p) => {
      const type = p.detectedType.primaryType;
      if (type) techCounts[type] = (techCounts[type] || 0) + 1;
      p.detectedType.frameworks?.forEach((f) => {
        techCounts[f] = (techCounts[f] || 0) + 1;
      });
    });

    const topTechs = Object.entries(techCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      total,
      avgHealth,
      warRoomCount: warRoomProjects.length,
      activeCount: activeProjects.length,
      dormantCount: dormantProjects.length,
      onlineServices,
      totalWithUrl,
      topTechs,
    };
  }, [projects, classifiedData, liveStatuses]);

  // Projects with live health check URLs
  const liveMonitoredProjects = useMemo(() => {
    return projects.filter((p) => Boolean(p.healthUrl || p.config?.health_url));
  }, [projects]);

  // Studio List for rendering
  const studiosToRender = useMemo(() => {
    if (selectedStudioFilter) {
      return VIRTUAL_STUDIOS.filter((s) => s.id === selectedStudioFilter);
    }
    // When showing all studios, exclude warroom from the general list
    // because it already has its dedicated Priority Attention Queue section at the top!
    return VIRTUAL_STUDIOS.filter((s) => s.id !== 'warroom');
  }, [selectedStudioFilter]);

  // Sort helper
  const sortProjects = (
    items: Array<{
      project: ProjectWithHealth;
      workerState: 'active_typer' | 'thinking' | 'fixing' | 'healthy' | 'alert' | 'sleeping';
      classification: ClassificationResult;
    }>
  ) => {
    return [...items].sort((a, b) => {
      if (sortBy === 'health_asc') return a.project.health.total - b.project.health.total;
      if (sortBy === 'health_desc') return b.project.health.total - a.project.health.total;
      if (sortBy === 'name') return a.project.name.localeCompare(b.project.name);
      return 0;
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE KPI MATRIX HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Overall Health */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Portfolio Health</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black ${
                kpis.avgHealth >= 80
                  ? 'text-emerald-400'
                  : kpis.avgHealth >= 60
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {kpis.avgHealth}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 100 pts</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                kpis.avgHealth >= 80
                  ? 'bg-emerald-500'
                  : kpis.avgHealth >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${kpis.avgHealth}%` }}
            />
          </div>
        </div>

        {/* Total Projects */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Total Projects</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{kpis.total}</span>
            <span className="text-xs text-slate-500 font-mono">repositories</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
            {kpis.activeCount} active in dev
          </div>
        </div>

        {/* War Room Alert */}
        <div
          onClick={() => setSelectedStudioFilter(selectedStudioFilter === 'warroom' ? null : 'warroom')}
          className={`p-4 rounded-2xl border shadow-md backdrop-blur-md flex flex-col justify-between cursor-pointer transition-all ${
            kpis.warRoomCount > 0
              ? 'bg-rose-950/40 border-rose-500/60 hover:border-rose-400'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-rose-300">War Room (วิกฤต)</span>
            <Flame className={`w-4 h-4 ${kpis.warRoomCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${kpis.warRoomCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {kpis.warRoomCount}
            </span>
            <span className="text-xs text-rose-300/80 font-mono">need action</span>
          </div>
          <div className="text-[10px] text-rose-400/80 font-mono mt-1">
            {kpis.warRoomCount > 0 ? '⚠️ ต้องการการแก้ไข' : '✅ ไม่มีงานเสี่ยง'}
          </div>
        </div>

        {/* Live Services & Pings */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Live HTTP Uptime</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400">{kpis.onlineServices}</span>
            <span className="text-xs text-slate-500 font-mono">/ {kpis.totalWithUrl} online</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            {kpis.totalWithUrl > 0 ? '🟢 Real-time pings active' : '⚪ ยังไม่ระบุ URL'}
          </div>
        </div>

        {/* Active Studios */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Active Studios</span>
            <LayoutGrid className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-400">
              {VIRTUAL_STUDIOS.filter((s) => (classifiedData[s.id] || []).length > 0).length}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ {VIRTUAL_STUDIOS.length} rooms</span>
          </div>
          <div className="text-[10px] text-purple-300/80 font-mono mt-1">
            🏢 All workspace hubs
          </div>
        </div>

        {/* Dormant / Stale */}
        <div
          onClick={() => setSelectedStudioFilter(selectedStudioFilter === 'archive' ? null : 'archive')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md backdrop-blur-md flex flex-col justify-between cursor-pointer hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Dormant Lounge</span>
            <span className="text-sm">😴</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-300">{kpis.dormantCount}</span>
            <span className="text-xs text-slate-500 font-mono">paused</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            💤 Stale repositories
          </div>
        </div>
      </div>

      {/* 2. WAR ROOM PRIORITY ATTENTION QUEUE (If any projects in war room) */}
      {classifiedData.warroom && classifiedData.warroom.length > 0 && !selectedStudioFilter && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-950 border border-rose-500/70 shadow-2xl shadow-rose-950/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/30 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>🚨 WAR ROOM & ATTENTION QUEUE</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/50">
                    {classifiedData.warroom.length} รายการวิกฤต
                  </span>
                </h2>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  โปรเจกต์ที่มีคะแนนสุขภาพต่ำกว่าเกณฑ์ หรือมีข้อผิดพลาดที่ควรได้รับการแก้ไขอย่างเร่งด่วน
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedStudioFilter('warroom')}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>กรองเฉพาะ War Room</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* War Room Project Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {classifiedData.warroom.map(({ project }) => {
              const liveStatus = liveStatuses[project.id];
              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="p-4 rounded-2xl bg-slate-950/90 border border-rose-500/40 hover:border-rose-400 transition-all cursor-pointer group shadow-lg flex flex-col justify-between hover:-translate-y-0.5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
                        {project.detectedType.primaryType || 'Project'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {starredProjectIds.includes(project.id) && (
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        )}
                        <span className="text-sm font-black text-rose-400 font-mono">
                          {project.health.total}/100
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-rose-200 transition-colors truncate">
                      {project.name}
                    </h4>

                    {/* Next Action Suggestion */}
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>ปัญหาหลัก:</span>
                      </div>
                      <p className="line-clamp-2 text-slate-300 text-[10px]">
                        {(() => {
                          const dirtyFiles = project.git?.uncommittedFiles || 0;
                          if (dirtyFiles > 0) {
                            return `มีไฟล์แก้ไขค้างบันทึก (${dirtyFiles} ไฟล์)`;
                          }
                          if (!project.git?.isRepo) {
                            return 'ยังไม่ได้เริ่มต้น Git Repository';
                          }
                          if (project.health?.isSmartStale || project.status === 'STALE') {
                            return 'ไม่ได้ขยับหรืออัปเดตโค้ดเป็นเวลานาน (Stale)';
                          }
                          if (!project.metrics?.hasReadme) {
                            return 'ขาดไฟล์ README.md หรือเอกสารกำกับโครงสร้าง';
                          }
                          if (!project.metrics?.hasTests) {
                            return 'ไม่มีระบบ Unit / E2E Automated Tests';
                          }
                          if (project.health?.nextActions?.urgent?.action) {
                            return project.health.nextActions.urgent.action;
                          }
                          return `คะแนนสุขภาพรวมต่ำกว่าเกณฑ์ (${project.health.total}/100)`;
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAdvisor(project);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Bot className="w-3 h-3" />
                      <span>ขอคำแนะนำ AI</span>
                    </button>

                    <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>ตรวจสอบ</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. STUDIO FILTER & VIEW CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-md">
        {/* Studio Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
          <button
            onClick={() => setSelectedStudioFilter(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 ${
              selectedStudioFilter === null
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🏢 ทั้งหมด</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-300 font-mono">
              {projects.length}
            </span>
          </button>

          {VIRTUAL_STUDIOS.map((studio) => {
            const count = (classifiedData[studio.id] || []).length;
            const isSelected = selectedStudioFilter === studio.id;
            return (
              <button
                key={studio.id}
                onClick={() => setSelectedStudioFilter(isSelected ? null : studio.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{studio.icon}</span>
                <span>{studio.name.split(' ')[0]}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Actions & Sort */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
          >
            <option value="health_asc">คะแนน: น้อยไปมาก (เสี่ยงก่อน)</option>
            <option value="health_desc">คะแนน: มากไปน้อย</option>
            <option value="name">เรียงตามชื่อ (A-Z)</option>
          </select>

          <button
            onClick={expandAll}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="ขยายทุก Studio"
          >
            ขยายทั้งหมด
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="ยุบทุก Studio"
          >
            ยุบทั้งหมด
          </button>
        </div>
      </div>

      {/* 4. FULL INLINE STUDIO PROJECT SECTIONS */}
      <div className="space-y-5">
        {studiosToRender.map((studio) => {
          const rawItems = classifiedData[studio.id] || [];
          const filteredItems = rawItems.filter((item) => isMatch(item.project));
          const sortedItems = sortProjects(filteredItems);
          const isExpanded = expandedStudios[studio.id] ?? true;

          const avgHealth =
            rawItems.length > 0
              ? Math.round(
                  rawItems.reduce((acc, curr) => acc + curr.project.health.total, 0) / rawItems.length
                )
              : 0;

          return (
            <div
              key={studio.id}
              className="rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-xl overflow-hidden backdrop-blur-md transition-all"
            >
              {/* Studio Section Header */}
              <div
                onClick={() => toggleStudioExpand(studio.id)}
                className="p-4 md:p-5 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800/80 cursor-pointer hover:bg-slate-850 transition-all select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                    {studio.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-white text-sm md:text-base">{studio.name}</h3>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {rawItems.length} โปรเจกต์
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{studio.description}</p>
                  </div>
                </div>

                {/* Studio Stats & Chevron */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {rawItems.length > 0 && (
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 justify-end">
                        <span
                          className={`text-sm font-black font-mono ${
                            avgHealth >= 80
                              ? 'text-emerald-400'
                              : avgHealth >= 60
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {avgHealth} pts
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">Avg Health</div>
                    </div>
                  )}

                  <div className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Studio Body (Cards Grid) */}
              {isExpanded && (
                <div className="p-4 md:p-5">
                  {sortedItems.length === 0 ? (
                    <div className="py-8 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                      <div className="text-2xl">{studio.icon}</div>
                      <p className="text-xs text-slate-400 font-medium">
                        {rawItems.length === 0
                          ? 'ยังไม่มีโปรเจกต์ที่ตรงกับหมวดหมู่นี้ใน Workspace ปัจจุบัน'
                          : 'ไม่พบโปรเจกต์ที่ตรงกับคำค้นหา'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                      {sortedItems.map(({ project, workerState }) => {
                        const isStarred = starredProjectIds.includes(project.id);
                        const isCritical = project.health.total < APP_SETTINGS.healthThresholds.risk;
                        const isHealthy = project.health.total >= APP_SETTINGS.healthThresholds.healthy;
                        const liveStatus = liveStatuses[project.id];
                        const hasLiveUrl = Boolean(project.healthUrl || project.config?.health_url);

                        return (
                          <div
                            key={project.id}
                            onClick={() => onSelectProject(project)}
                            className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                              isStarred
                                ? 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/50 shadow-md shadow-amber-950/20'
                                : isCritical
                                ? 'bg-slate-950/90 border-rose-500/50 hover:border-rose-400 shadow-md shadow-rose-950/20'
                                : 'bg-slate-950/90 border-slate-800 hover:border-indigo-500/60 hover:bg-slate-900 shadow-md'
                            } hover:-translate-y-0.5`}
                          >
                            <div className="space-y-2.5">
                              {/* Top Bar: Tech Tag & Health Score */}
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800 truncate max-w-[120px]">
                                  {project.detectedType.primaryType || 'Project'}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {hasLiveUrl && (
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        liveStatus?.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                                      }`}
                                      title={
                                        liveStatus
                                          ? `${liveStatus.isOnline ? 'Online' : 'Offline'} (${liveStatus.responseTimeMs}ms)`
                                          : 'Checking...'
                                      }
                                    />
                                  )}
                                  <span
                                    className={`text-xs font-black font-mono px-1.5 py-0.5 rounded ${
                                      isHealthy
                                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                        : isCritical
                                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                    }`}
                                  >
                                    {project.health.total} pts
                                  </span>
                                </div>
                              </div>

                              {/* Project Title */}
                              <div>
                                <h4 className="font-bold text-white text-sm group-hover:text-indigo-200 transition-colors truncate">
                                  {project.name}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                                  <GitBranch className="w-3 h-3 text-slate-500" />
                                  <span className="truncate">{project.metrics.gitBranch || 'main'}</span>
                                  {Boolean(project.metrics.uncommittedChanges) && (
                                    <span className="text-amber-400 font-bold">
                                      • {project.metrics.uncommittedChanges} dirty
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Health Metric Pillars */}
                              <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px] pt-1">
                                <div className="p-1 rounded bg-slate-900/80 border border-slate-800/80" title="Git Activity">
                                  <div className="text-slate-500">GIT</div>
                                  <div className="font-bold text-slate-300">{project.health?.gitActivity ?? 0}</div>
                                </div>
                                <div className="p-1 rounded bg-slate-900/80 border border-slate-800/80" title="Automated Tests">
                                  <div className="text-slate-500">TEST</div>
                                  <div className="font-bold text-slate-300">{project.health?.tests ?? 0}</div>
                                </div>
                                <div className="p-1 rounded bg-slate-900/80 border border-slate-800/80" title="Documentation">
                                  <div className="text-slate-500">DOCS</div>
                                  <div className="font-bold text-slate-300">{project.health?.documentation ?? 0}</div>
                                </div>
                                <div className="p-1 rounded bg-slate-900/80 border border-slate-800/80" title="Code Freshness">
                                  <div className="text-slate-500">TIME</div>
                                  <div className="font-bold text-slate-300">{project.health?.freshness ?? 0}</div>
                                </div>
                              </div>
                            </div>

                            {/* Quick Action Footer */}
                            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenAdvisor(project);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-[9px] font-bold flex items-center gap-1 transition-all"
                                title="เปิด AI Advisor วิเคราะห์โปรเจกต์นี้"
                              >
                                <Bot className="w-2.5 h-2.5" />
                                <span>AI</span>
                              </button>

                              {hasLiveUrl && liveStatus && (
                                <span className="text-[9px] font-mono text-emerald-400 font-bold">
                                  🟢 {liveStatus.responseTimeMs}ms
                                </span>
                              )}

                              <div className="flex items-center gap-1">
                                {onToggleStar && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleStar(project.id);
                                    }}
                                    className={`p-1 rounded-lg transition-all ${
                                      isStarred
                                        ? 'text-amber-400'
                                        : 'text-slate-500 hover:text-amber-400 hover:bg-slate-900'
                                    }`}
                                    title={isStarred ? 'ยกเลิกการปักหมุด' : 'ปักหมุดโปรเจกต์นี้'}
                                  >
                                    <Star className={`w-3 h-3 ${isStarred ? 'fill-amber-400' : ''}`} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. LIVE SERVICES & UPTIME MONITOR MATRIX */}
      {liveMonitoredProjects.length > 0 && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🛰️</span>
              <div>
                <h3 className="font-extrabold text-white text-sm">LIVE SERVICES & UPTIME MATRIX</h3>
                <p className="text-xs text-slate-400">
                  ตรวจสอบสถานะออนไลน์และการตอบสนองของเซิร์ฟเวอร์จริง (HTTP/HTTPS)
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {Object.values(liveStatuses).filter((s) => s.isOnline).length} / {liveMonitoredProjects.length} Online
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveMonitoredProjects.map((proj) => {
              const st = liveStatuses[proj.id];
              const url = proj.healthUrl || proj.config?.health_url;
              return (
                <div
                  key={proj.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{proj.name}</div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-400 hover:underline truncate block flex items-center gap-1 font-mono"
                    >
                      <span>{url}</span>
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                    </a>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {st ? (
                      <div>
                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            st.isOnline
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {st.isOnline ? `${st.statusCode || 200} OK` : 'OFFLINE'}
                        </span>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {st.responseTimeMs}ms
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono animate-pulse">Checking...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. TECH STACK DISTRIBUTION SUMMARY */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-slate-300">Technology Distribution:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {kpis.topTechs.map(([tech, count]) => (
            <div
              key={tech}
              className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5 text-slate-300 font-mono text-[11px]"
            >
              <span className="font-bold text-white">{tech}</span>
              <span className="text-indigo-400 text-[10px] font-black">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
