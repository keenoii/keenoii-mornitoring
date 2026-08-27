'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Gamepad2,
  Monitor,
  Flame,
  Activity,
  AlertTriangle,
  ExternalLink,
  Compass,
  ArrowUpRight,
  Info,
  X,
  Star,
  Globe,
} from 'lucide-react';
import { ProjectWithHealth } from '@/lib/project-repository';
import {
  VIRTUAL_STUDIOS,
  StudioDefinition,
  classifyProjectStudio,
  ClassificationResult,
} from '@/lib/studio-classifier';
import { ProjectWorker } from '@/components/virtual-office/ProjectWorker';
import { IsometricOfficeView } from '@/components/virtual-office/IsometricOfficeView';
import { StudioMatrixCockpit } from '@/components/virtual-office/StudioMatrixCockpit';
import { GlobalHeader } from '@/components/common/GlobalHeader';
import { WorkspaceRootsBar, MonitoredRoot } from '@/components/dashboard/WorkspaceRootsBar';
import { APP_SETTINGS } from '@/config/app-settings';
import { ManageWorkspacesModal } from '@/components/dashboard/ManageWorkspacesModal';
import { HealthExplainerModal } from '@/components/dashboard/HealthExplainerModal';
import { ProjectAiAdvisorModal } from '@/components/dashboard/ProjectAiAdvisorModal';
import { ProjectServicesModal } from '@/components/dashboard/ProjectServicesModal';
import { EditProjectUrlModal } from '@/components/dashboard/EditProjectUrlModal';
import { LiveHealthStatus } from '@/services/live-health-service';
import {
  OfficeBuilding,
  DEFAULT_BUILDINGS,
} from '@/lib/office-buildings-config';
import { OfficeBuildingsBar } from '@/components/virtual-office/OfficeBuildingsBar';
import { ManageBuildingsModal } from '@/components/virtual-office/ManageBuildingsModal';
import { OfficeChangeBgModal } from '@/components/virtual-office/OfficeChangeBgModal';

const DEFAULT_ROOTS: MonitoredRoot[] = [
  { id: 'srru', name: 'SRRU Projects', path: 'D:\\MyProject\\srru', icon: '🏛️' },
  { id: 'myproject', name: 'MyProject (Root)', path: 'D:\\MyProject', icon: '📁' },
];

export default function VirtualProjectOfficePage() {
  const [projects, setProjects] = useState<ProjectWithHealth[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dual View Mode: 'virtual' | 'command'
  const [viewMode, setViewMode] = useState<'virtual' | 'command'>('virtual');

  // Workspace Roots
  const [monitoredRoots, setMonitoredRoots] = useState<MonitoredRoot[]>(DEFAULT_ROOTS);
  const [activeRootId, setActiveRootId] = useState<string>('ALL_REGISTERED');
  const [showManageModal, setShowManageModal] = useState<boolean>(false);
  const [newRootPath, setNewRootPath] = useState<string>('');
  const [newRootName, setNewRootName] = useState<string>('');

  // Live HTTP/HTTPS Uptime
  const [liveStatuses, setLiveStatuses] = useState<Record<string, LiveHealthStatus>>({});
  const [selectedProjectForUrl, setSelectedProjectForUrl] = useState<ProjectWithHealth | null>(null);

  // Modals & Project Selection
  const [selectedStudio, setSelectedStudio] = useState<StudioDefinition | null>(null);
  const [inspectProject, setInspectProject] = useState<ProjectWithHealth | null>(null);
  const [quickProject, setQuickProject] = useState<ProjectWithHealth | null>(null);
  const [servicesProject, setServicesProject] = useState<ProjectWithHealth | null>(null);
  const [advisorProject, setAdvisorProject] = useState<ProjectWithHealth | null>(null);
  const [starredProjectIds, setStarredProjectIds] = useState<string[]>([]);
  const [hiddenProjectIds, setHiddenProjectIds] = useState<string[]>([]);
  const [customStudioOverrides, setCustomStudioOverrides] = useState<Record<string, string>>({});
  const [overrideSavedSuccess, setOverrideSavedSuccess] = useState<boolean>(false);

  // Buildings States
  const [buildings, setBuildings] = useState<OfficeBuilding[]>(DEFAULT_BUILDINGS);
  const [activeBuildingId, setActiveBuildingId] = useState<string>('bldg-main-hq');

  // Modals for Building
  const [showManageBuildingsModal, setShowManageBuildingsModal] = useState<boolean>(false);
  const [showChangeBgModal, setShowChangeBgModal] = useState<boolean>(false);

  // AI Advisor States
  const [aiAdvice, setAiAdvice] = useState<any | null>(null);
  const [generatingAdvice, setGeneratingAdvice] = useState<boolean>(false);
  const [selectedAiProvider, setSelectedAiProvider] = useState<string>('typhoon');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);

  // Load Starred, Roots, Hidden, Buildings & Staff from localStorage
  useEffect(() => {
    let targetActiveId = 'ALL_REGISTERED';
    let targetRootsList = DEFAULT_ROOTS;

    try {
      const savedRoots = localStorage.getItem('sentinel_monitored_roots');
      if (savedRoots) {
        const parsed = JSON.parse(savedRoots);
        if (Array.isArray(parsed) && parsed.length > 0) {
          targetRootsList = parsed;
          setMonitoredRoots(parsed);
        }
      }

      const savedActiveRootId = localStorage.getItem('sentinel_active_root_id');
      if (savedActiveRootId) {
        targetActiveId = savedActiveRootId;
        setActiveRootId(savedActiveRootId);
      } else {
        targetActiveId = 'ALL_REGISTERED';
        setActiveRootId('ALL_REGISTERED');
      }

      const savedStars = localStorage.getItem('sentinel_starred_projects');
      if (savedStars) setStarredProjectIds(JSON.parse(savedStars));

      const savedHidden = localStorage.getItem('sentinel_hidden_projects');
      if (savedHidden) setHiddenProjectIds(JSON.parse(savedHidden));

      const savedOverrides = localStorage.getItem('sentinel_studio_overrides');
      if (savedOverrides) setCustomStudioOverrides(JSON.parse(savedOverrides));

      const savedMode = localStorage.getItem('sentinel_office_mode');
      if (savedMode === 'command' || savedMode === 'virtual') setViewMode(savedMode);

      const savedKey = localStorage.getItem('sentinel_ai_key');
      if (savedKey) setCustomApiKey(savedKey);

      const savedBuildings = localStorage.getItem('sentinel_office_buildings');
      if (savedBuildings) setBuildings(JSON.parse(savedBuildings));

      const savedActiveBldg = localStorage.getItem('sentinel_active_building_id');
      if (savedActiveBldg) setActiveBuildingId(savedActiveBldg);
    } catch {}

    fetchOfficeProjects(false, targetActiveId, targetRootsList);
  }, []);

  const activeBuilding = useMemo(() => {
    return buildings.find((b) => b.id === activeBuildingId) || buildings[0] || DEFAULT_BUILDINGS[0];
  }, [buildings, activeBuildingId]);

  const handleSelectBuilding = (id: string) => {
    setActiveBuildingId(id);
    try {
      localStorage.setItem('sentinel_active_building_id', id);
    } catch {}
  };

  const handleAddBuilding = (newBuilding: OfficeBuilding) => {
    const updated = [...buildings, newBuilding];
    setBuildings(updated);
    try {
      localStorage.setItem('sentinel_office_buildings', JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteBuilding = (id: string) => {
    const updated = buildings.filter((b) => b.id !== id);
    setBuildings(updated);
    if (activeBuildingId === id && updated.length > 0) {
      setActiveBuildingId(updated[0].id);
    }
    try {
      localStorage.setItem('sentinel_office_buildings', JSON.stringify(updated));
    } catch {}
  };

  const handleUpdateBuilding = (updatedBldg: OfficeBuilding) => {
    const updated = buildings.map((b) => (b.id === updatedBldg.id ? updatedBldg : b));
    setBuildings(updated);
    try {
      localStorage.setItem('sentinel_office_buildings', JSON.stringify(updated));
    } catch {}
  };

  const handleApplyBackground = (newSrc: string) => {
    if (!activeBuilding) return;
    const updated = buildings.map((b) =>
      b.id === activeBuilding.id ? { ...b, bgImageSrc: newSrc } : b
    );
    setBuildings(updated);
    try {
      localStorage.setItem('sentinel_office_buildings', JSON.stringify(updated));
    } catch {}
  };

  const toggleHideProject = (projectId: string) => {
    setHiddenProjectIds((prev) => {
      const next = prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId];
      try {
        localStorage.setItem('sentinel_hidden_projects', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const unhideAllProjects = () => {
    setHiddenProjectIds([]);
    try {
      localStorage.removeItem('sentinel_hidden_projects');
    } catch {}
  };

  const handleToggleStar = (projectId: string) => {
    setStarredProjectIds((prev) => {
      const next = prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId];
      try {
        localStorage.setItem('sentinel_starred_projects', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const currentRoot = useMemo(() => {
    if (activeRootId === 'ALL_REGISTERED') return null;
    return monitoredRoots.find((r) => r.id === activeRootId) || monitoredRoots[0] || DEFAULT_ROOTS[0];
  }, [monitoredRoots, activeRootId]);

  // Fetch scanned projects for active workspace
  const fetchOfficeProjects = async (force = false, targetRootId?: string, rootsList?: MonitoredRoot[]) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/scan';
      const params = new URLSearchParams();
      if (force) params.set('refresh', 'true');

      const currentActiveId = targetRootId !== undefined ? targetRootId : activeRootId;
      const currentList = rootsList || monitoredRoots;

      if (currentActiveId === 'ALL_REGISTERED') {
        const allPaths = currentList.map((r) => r.path).join(',');
        params.set('roots', allPaths);
      } else {
        const foundRoot = currentList.find((r) => r.id === currentActiveId);
        if (foundRoot) {
          params.set('root', foundRoot.path);
        }
      }

      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      if (!res.ok) throw new Error('Failed to load project portfolio');
      const json = await res.json();
      setProjects(json.projects || []);
    } catch (err: any) {
      setError(err?.message || 'Error loading virtual studio');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoot = (id: string) => {
    setActiveRootId(id);
    try {
      localStorage.setItem('sentinel_active_root_id', id);
    } catch {}
    fetchOfficeProjects(false, id);
  };

  const handleToggleMode = (mode: 'virtual' | 'command') => {
    setViewMode(mode);
    try {
      localStorage.setItem('sentinel_office_mode', mode);
    } catch {}
  };

  // Auto-refresh virtual office data & live status every 5 minutes (from APP_SETTINGS)
  useEffect(() => {
    const intervalMs = APP_SETTINGS.officeAutoRefreshIntervalMs || 5 * 60 * 1000;
    const timer = setInterval(() => {
      fetchOfficeProjects(true);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [activeRootId, monitoredRoots]);

  // Live HTTP/HTTPS Health Checks for projects with URLs
  useEffect(() => {
    if (!projects || projects.length === 0) return;
    const projectsWithUrl = projects.filter(
      (p) => Boolean(p.healthUrl || p.config?.health_url)
    );

    projectsWithUrl.forEach(async (p) => {
      const url = p.healthUrl || p.config?.health_url;
      if (!url) return;
      try {
        const res = await fetch('/api/health-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        if (res.ok) {
          const statusResult: LiveHealthStatus = await res.json();
          setLiveStatuses((prev) => ({
            ...prev,
            [p.id]: statusResult,
          }));
        }
      } catch {}
    });
  }, [projects]);

  const handleUrlUpdated = async (projectId: string, newUrl: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, healthUrl: newUrl } : p))
    );

    if (newUrl.trim()) {
      try {
        const res = await fetch('/api/health-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: newUrl }),
        });
        if (res.ok) {
          const statusResult: LiveHealthStatus = await res.json();
          setLiveStatuses((prev) => ({
            ...prev,
            [projectId]: statusResult,
          }));
        }
      } catch {}
    } else {
      setLiveStatuses((prev) => {
        const copy = { ...prev };
        delete copy[projectId];
        return copy;
      });
    }
  };

  // AI Advice Generator
  const handleGenerateAiAdvice = async () => {
    if (!advisorProject) return;
    setGeneratingAdvice(true);
    try {
      const res = await fetch('/api/advisor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: advisorProject,
          provider: selectedAiProvider,
          apiKey: customApiKey || undefined,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiAdvice(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAdvice(false);
    }
  };

  // Save Custom Studio Override
  const handleSaveStudioOverride = (projectId: string, newStudioId: string) => {
    const updated = { ...customStudioOverrides, [projectId]: newStudioId };
    setCustomStudioOverrides(updated);
    try {
      localStorage.setItem('sentinel_studio_overrides', JSON.stringify(updated));
    } catch {}
    setOverrideSavedSuccess(true);
    setTimeout(() => setOverrideSavedSuccess(false), 2000);
  };

  // Classify all projects into studios
  const classifiedData = useMemo(() => {
    const studioMap: Record<
      string,
      Array<{
        project: ProjectWithHealth;
        workerState: 'active_typer' | 'thinking' | 'fixing' | 'healthy' | 'alert' | 'sleeping';
        classification: ClassificationResult;
      }>
    > = {
      web: [],
      ai: [],
      infra: [],
      data: [],
      media: [],
      poc: [],
      warroom: [],
      archive: [],
      lab: [],
    };

    const visibleProjects = projects.filter(
      (p) => !hiddenProjectIds.includes(p.id) && !hiddenProjectIds.includes(p.path)
    );

    visibleProjects.forEach((p) => {
      const override = customStudioOverrides[p.id] || customStudioOverrides[p.name];
      const classification = classifyProjectStudio(p, override);

      const liveStatus = liveStatuses[p.id];
      const isLiveOffline = liveStatus && !liveStatus.isOnline;
      const isCriticalOrBlocked =
        isLiveOffline ||
        p.health.total < APP_SETTINGS.healthThresholds.risk ||
        p.status === 'BLOCKED';

      const isCompletedOrDormant =
        p.health.isSmartStale ||
        p.status === 'STALE' ||
        p.status === 'COMPLETED' ||
        p.stage === 'Production';

      // 1. Emergency: Live Outage / Health < 60 / Blocked -> War Room
      if (isCriticalOrBlocked) {
        studioMap.warroom.push({
          project: p,
          workerState: isLiveOffline ? 'alert' : 'fixing',
          classification,
        });
        return;
      }

      // 2. Production / Completed / Stale (>14d) with Healthy Score -> Archive & Dormant Lounge (ห้องนอน)
      if (isCompletedOrDormant) {
        studioMap.archive.push({ project: p, workerState: 'sleeping', classification });
        return;
      }

      // 3. Active In-Development Projects -> Work Studios (Web, AI, NOC, Data, Media, Lab)
      if (studioMap[classification.primaryStudioId]) {
        studioMap[classification.primaryStudioId].push({
          project: p,
          workerState: classification.workerState === 'sleeping' ? 'active_typer' : classification.workerState,
          classification,
        });
      } else {
        studioMap.lab.push({
          project: p,
          workerState: classification.workerState,
          classification,
        });
      }
    });

    // Sort every room: Starred ⭐ first, Live Online 🟢 second, Health Score third
    Object.keys(studioMap).forEach((studioKey) => {
      studioMap[studioKey].sort((a, b) => {
        const aStarred = starredProjectIds.includes(a.project.id);
        const bStarred = starredProjectIds.includes(b.project.id);
        if (aStarred && !bStarred) return -1;
        if (!aStarred && bStarred) return 1;

        const aOnline = Boolean(a.project.healthUrl || a.project.config?.health_url);
        const bOnline = Boolean(b.project.healthUrl || b.project.config?.health_url);
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;

        return b.project.health.total - a.project.health.total;
      });
    });

    return studioMap;
  }, [projects, customStudioOverrides, liveStatuses, starredProjectIds]);

  // Aggregated KPIs
  const stats = useMemo(() => {
    const total = projects.length;
    const warRoomCount = classifiedData.warroom.length;
    const dormantCount = projects.filter((p) => p.health.isSmartStale || p.status === 'STALE').length;
    const activeWorkers = projects.filter(
      (p) => !p.health.isSmartStale && p.status !== 'STALE' && p.status !== 'ARCHIVED'
    ).length;
    const starredCount = projects.filter((p) => starredProjectIds.includes(p.id)).length;

    return {
      total,
      activeWorkers,
      warRoomCount,
      dormantCount,
      starredCount,
    };
  }, [projects, classifiedData, starredProjectIds]);

  // Search Filter
  const isProjectMatchSearch = (p: ProjectWithHealth) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.detectedType.primaryType.toLowerCase().includes(q) ||
      (p.detectedType.frameworks || []).some((f) => f.toLowerCase().includes(q))
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* 1. GLOBAL HEADER */}
      <GlobalHeader
        activeWorkspacePath={currentRoot?.path || 'All Workspaces'}
        totalProjectsCount={projects.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={() => fetchOfficeProjects(true)}
        isLoading={loading}
        activeView="office"
      />

      {/* 2. WORKSPACE ROOTS SELECTOR BAR */}
      <WorkspaceRootsBar
        monitoredRoots={monitoredRoots}
        activeRootId={activeRootId}
        onSelectRoot={handleSelectRoot}
        onOpenManageModal={() => setShowManageModal(true)}
      />

      {/* 2.5 OFFICE BUILDINGS BAR */}
      <OfficeBuildingsBar
        buildings={buildings}
        activeBuildingId={activeBuildingId}
        onSelectBuilding={handleSelectBuilding}
        onOpenManageBuildings={() => setShowManageBuildingsModal(true)}
        onOpenChangeBg={() => setShowChangeBgModal(true)}
      />

      {/* 3. DUAL VIEW MODE SWITCHER & CONTROLS */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-1 shadow-inner">
            <button
              onClick={() => handleToggleMode('virtual')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'virtual'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>🏢 Virtual 2.5D Office</span>
            </button>

            <button
              onClick={() => handleToggleMode('command')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'command'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>📊 Studio Matrix Cockpit</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active: <strong className="text-emerald-400">{stats.activeWorkers}</strong></span>
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>War Room: <strong className="text-rose-400">{stats.warRoomCount}</strong></span>
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Dormant: <strong className="text-slate-400">{stats.dormantCount}</strong></span>
          </span>
        </div>
      </div>

      {/* 4. MAIN VIEWPORT */}
      {viewMode === 'virtual' ? (
        <section className="space-y-3">
          <IsometricOfficeView
            classifiedData={classifiedData}
            starredProjectIds={starredProjectIds}
            searchQuery={searchQuery}
            onSelectStudio={(studio) => setSelectedStudio(studio)}
            onSelectProject={(project) => setQuickProject(project)}
            liveStatuses={liveStatuses}
            bgImageSrc={activeBuilding?.bgImageSrc}
            onOpenChangeBg={() => setShowChangeBgModal(true)}
          />
        </section>
      ) : (
        <section className="space-y-4">
          <StudioMatrixCockpit
            projects={projects}
            classifiedData={classifiedData}
            starredProjectIds={starredProjectIds}
            liveStatuses={liveStatuses}
            onSelectProject={(project) => setQuickProject(project)}
            onOpenAdvisor={(project) => {
              setAdvisorProject(project);
              setAiAdvice(null);
            }}
            onEditUrl={(project) => setSelectedProjectForUrl(project)}
            onToggleStar={handleToggleStar}
            searchQuery={searchQuery}
          />
        </section>
      )}

      {/* 5. STUDIO DRAWER / COCKPIT MODAL */}
      {selectedStudio && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedStudio.icon}</span>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedStudio.name}</h2>
                  <p className="text-xs text-slate-400">{selectedStudio.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudio(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(classifiedData[selectedStudio.id] || [])
                .filter((item) => isProjectMatchSearch(item.project))
                .map(({ project, workerState }) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      setSelectedStudio(null);
                      setQuickProject(project);
                    }}
                    className="cursor-pointer"
                  >
                    <ProjectWorker
                      project={project}
                      workerState={workerState}
                      isStarred={starredProjectIds.includes(project.id)}
                    />
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedStudio(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. HEALTH EXPLAINER MODAL */}
      <HealthExplainerModal
        project={quickProject}
        onClose={() => setQuickProject(null)}
        onOpenAdvisor={(proj) => {
          setQuickProject(null);
          setAdvisorProject(proj);
          setAiAdvice(null);
        }}
      />

      {/* 7. AI ADVISOR MODAL */}
      <ProjectAiAdvisorModal
        project={advisorProject}
        onClose={() => setAdvisorProject(null)}
        aiAdvice={aiAdvice}
        generatingAdvice={generatingAdvice}
        onGenerateAdvice={handleGenerateAiAdvice}
        selectedAiProvider={selectedAiProvider}
        onSelectAiProvider={setSelectedAiProvider}
        customApiKey={customApiKey}
        onSaveApiKey={(key) => {
          setCustomApiKey(key);
          try {
            localStorage.setItem('sentinel_ai_key', key);
          } catch {}
        }}
        showApiKeyInput={showApiKeyInput}
        onToggleApiKeyInput={() => setShowApiKeyInput(!showApiKeyInput)}
      />

      {/* 8. SERVICES / SUBMODULES MODAL */}
      <ProjectServicesModal
        project={servicesProject}
        onClose={() => setServicesProject(null)}
        allProjects={projects}
        onOpenSubproject={(sub) => {
          setServicesProject(null);
          setQuickProject(sub);
        }}
      />

      {/* 9. EDIT LIVE URL MODAL */}
      <EditProjectUrlModal
        project={selectedProjectForUrl}
        onClose={() => setSelectedProjectForUrl(null)}
        onUrlUpdated={handleUrlUpdated}
      />

      {/* 10. MANAGE WORKSPACES & HIDDEN PROJECTS MODAL */}
      <ManageWorkspacesModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        monitoredRoots={monitoredRoots}
        newRootName={newRootName}
        setNewRootName={setNewRootName}
        newRootPath={newRootPath}
        setNewRootPath={setNewRootPath}
        allProjects={projects}
        hiddenProjectIds={hiddenProjectIds}
        onToggleHideProject={toggleHideProject}
        onUnhideAll={unhideAllProjects}
        onAddRoot={() => {
          if (!newRootName.trim() || !newRootPath.trim()) return;
          const newRoot: MonitoredRoot = {
            id: `root-${Date.now()}`,
            name: newRootName.trim(),
            path: newRootPath.trim(),
            icon: '📁',
          };
          const updated = [...monitoredRoots, newRoot];
          setMonitoredRoots(updated);
          setActiveRootId(newRoot.id);
          try {
            localStorage.setItem('sentinel_monitored_roots', JSON.stringify(updated));
            localStorage.setItem('sentinel_active_root_id', newRoot.id);
          } catch {}
          setNewRootName('');
          setNewRootPath('');
          setShowManageModal(false);
          fetchOfficeProjects(true, newRoot.id, updated);
        }}
        onDeleteRoot={(id) => {
          const updated = monitoredRoots.filter((r) => r.id !== id);
          setMonitoredRoots(updated);
          try {
            localStorage.setItem('sentinel_monitored_roots', JSON.stringify(updated));
          } catch {}
        }}
      />

      {/* 11. MANAGE BUILDINGS MODAL */}
      <ManageBuildingsModal
        isOpen={showManageBuildingsModal}
        onClose={() => setShowManageBuildingsModal(false)}
        buildings={buildings}
        activeBuildingId={activeBuildingId}
        onSelectBuilding={handleSelectBuilding}
        onAddBuilding={handleAddBuilding}
        onDeleteBuilding={handleDeleteBuilding}
        onUpdateBuilding={handleUpdateBuilding}
      />

      {/* 12. CHANGE BACKGROUND MODAL */}
      <OfficeChangeBgModal
        isOpen={showChangeBgModal}
        onClose={() => setShowChangeBgModal(false)}
        currentBg={activeBuilding?.bgImageSrc || '/room/room-office.png'}
        onApply={handleApplyBackground}
      />
    </div>
  );
}
