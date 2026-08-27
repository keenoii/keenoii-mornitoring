'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ProjectWithHealth } from '@/lib/project-repository';
import { MorningBriefing } from '@/collector/diff';
import { GlobalHeader } from '@/components/common/GlobalHeader';
import { MorningIntelligenceBanner } from '@/components/dashboard/MorningIntelligenceBanner';
import { WorkspaceRootsBar, MonitoredRoot } from '@/components/dashboard/WorkspaceRootsBar';
import { ManageWorkspacesModal } from '@/components/dashboard/ManageWorkspacesModal';
import { PortfolioKpiBar } from '@/components/dashboard/PortfolioKpiBar';
import { PortfolioFilterTabs } from '@/components/dashboard/PortfolioFilterTabs';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { AttentionQueueTable } from '@/components/dashboard/AttentionQueueTable';
import { HealthExplainerModal } from '@/components/dashboard/HealthExplainerModal';
import { ProjectAiAdvisorModal } from '@/components/dashboard/ProjectAiAdvisorModal';
import { ProjectServicesModal } from '@/components/dashboard/ProjectServicesModal';
import { EditProjectUrlModal } from '@/components/dashboard/EditProjectUrlModal';
import { LiveHealthStatus } from '@/services/live-health-service';

interface ScanResponse {
  scannedRoots: string[];
  totalProjects: number;
  activeCount: number;
  needAttentionCount: number;
  staleCount: number;
  blockedCount: number;
  completedCount: number;
  projects: ProjectWithHealth[];
  intelligence?: MorningBriefing;
  scanDurationMs: number;
  scannedAt: string;
}

const DEFAULT_ROOTS: MonitoredRoot[] = [
  { id: 'srru', name: 'SRRU Projects', path: 'D:\\MyProject\\srru', icon: '🏛️' },
  { id: 'myproject', name: 'MyProject (Root)', path: 'D:\\MyProject', icon: '📁' },
];

export default function CommandCenterPage() {
  const [data, setData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'attention'>('portfolio');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  // Live URL & Health Statuses
  const [liveStatuses, setLiveStatuses] = useState<Record<string, LiveHealthStatus>>({});
  const [selectedProjectForUrl, setSelectedProjectForUrl] = useState<ProjectWithHealth | null>(null);

  // Modals & Project Selection
  const [selectedProjectForExplainer, setSelectedProjectForExplainer] = useState<ProjectWithHealth | null>(null);
  const [selectedProjectForAdvisor, setSelectedProjectForAdvisor] = useState<ProjectWithHealth | null>(null);
  const [selectedProjectForServices, setSelectedProjectForServices] = useState<ProjectWithHealth | null>(null);

  // AI Advisor States
  const [aiAdvice, setAiAdvice] = useState<any | null>(null);
  const [generatingAdvice, setGeneratingAdvice] = useState<boolean>(false);
  const [selectedAiProvider, setSelectedAiProvider] = useState<string>('typhoon');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);

  // Workspace Roots
  const [monitoredRoots, setMonitoredRoots] = useState<MonitoredRoot[]>(DEFAULT_ROOTS);
  const [activeRootId, setActiveRootId] = useState<string>('srru');
  const [showManageModal, setShowManageModal] = useState<boolean>(false);
  const [newRootPath, setNewRootPath] = useState<string>('');
  const [newRootName, setNewRootName] = useState<string>('');

  // Starred / Active Focus Projects
  const [starredProjectIds, setStarredProjectIds] = useState<string[]>([]);

  // Load user settings from localStorage on mount
  useEffect(() => {
    let targetActiveId = 'srru';
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
      } else if (targetRootsList.length > 0) {
        targetActiveId = targetRootsList[0].id;
        setActiveRootId(targetRootsList[0].id);
      }

      const savedKey = localStorage.getItem('sentinel_ai_key');
      if (savedKey) setCustomApiKey(savedKey);

      const savedStars = localStorage.getItem('sentinel_starred_projects');
      if (savedStars) setStarredProjectIds(JSON.parse(savedStars));
    } catch {}

    fetchScanData(false, targetActiveId, targetRootsList);
  }, []);

  const currentRoot = useMemo(() => {
    if (activeRootId === 'ALL_REGISTERED') return null;
    return monitoredRoots.find((r) => r.id === activeRootId) || monitoredRoots[0] || DEFAULT_ROOTS[0];
  }, [monitoredRoots, activeRootId]);

  const toggleStar = (projectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  // Fetch scan data
  const fetchScanData = async (force = false, targetRootId?: string, rootsList?: MonitoredRoot[]) => {
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

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json: ScanResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to local project scanner');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoot = (id: string) => {
    setActiveRootId(id);
    try {
      localStorage.setItem('sentinel_active_root_id', id);
    } catch {}
    fetchScanData(false, id);
  };

  useEffect(() => {
    if (monitoredRoots.length > 0) {
      fetchScanData(false);
    }
  }, []);

  // AI Advice Generator
  const handleGenerateAiAdvice = async () => {
    if (!selectedProjectForAdvisor) return;
    setGeneratingAdvice(true);
    try {
      const res = await fetch('/api/advisor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selectedProjectForAdvisor,
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

  // Filtered Projects Pipeline
  const filteredProjects = useMemo(() => {
    if (!data) return [];
    let list = [...data.projects];

    if (activeQuickFilter === 'starred') {
      list = list.filter((p) => starredProjectIds.includes(p.id));
    } else if (activeQuickFilter === 'dirty') {
      list = list.filter((p) => p.git.isDirty);
    } else if (activeQuickFilter === 'nextjs') {
      list = list.filter(
        (p) =>
          p.detectedType.primaryType.toLowerCase().includes('next') ||
          (p.detectedType.frameworks || []).some((f) => f.toLowerCase().includes('next'))
      );
    } else if (activeQuickFilter === 'hasConfig') {
      list = list.filter((p) => Boolean(p.config));
    }

    if (selectedStatus !== 'ALL') {
      list = list.filter((p) => {
        const isCompleted = p.status === 'COMPLETED' || p.stage === 'Production' || Boolean(p.healthUrl || p.config?.health_url) || p.progress === 100;
        const isStale = p.status === 'STALE' || p.health.isSmartStale;
        if (selectedStatus === 'COMPLETED') return isCompleted;
        if (selectedStatus === 'STALE') return isStale && !isCompleted;
        if (selectedStatus === 'ACTIVE') return p.status === 'ACTIVE' && !isStale && !isCompleted;
        return p.status === selectedStatus;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.path.toLowerCase().includes(q) ||
          p.detectedType.primaryType.toLowerCase().includes(q)
      );
    }

    // Sort pinned / starred projects to the top
    return list.sort((a, b) => {
      const aStarred = starredProjectIds.includes(a.id);
      const bStarred = starredProjectIds.includes(b.id);
      if (aStarred && !bStarred) return -1;
      if (!aStarred && bStarred) return 1;
      return a.health.total - b.health.total;
    });
  }, [data, selectedStatus, searchQuery, activeQuickFilter, starredProjectIds]);

  // Priority Focus Projects (AI Focus Today)
  const displayFocusProjects = useMemo(() => {
    if (!data || !data.projects || data.projects.length === 0) return [];

    // 1. If user has Starred projects in current workspace, prioritize them
    if (starredProjectIds.length > 0) {
      const starredProjects = data.projects.filter((p) => starredProjectIds.includes(p.id));
      if (starredProjects.length > 0) {
        return starredProjects.slice(0, 3).map((p) => ({
          project: p,
          focusReason: '⭐ โปรเจกต์ที่คุณติดดาวไว้ (Active Focus)',
          actionHighlight: p.health.nextActions.urgent
            ? `🔴 ${p.health.nextActions.urgent.action}`
            : p.health.nextActions.next
            ? `🟡 ${p.health.nextActions.next.action}`
            : '🟢 พัฒนาต่อตาม Roadmap',
        }));
      }
    }

    // 2. Otherwise use intelligence top focus projects from the current workspace
    if (data.intelligence?.topFocusProjects && data.intelligence.topFocusProjects.length > 0) {
      return data.intelligence.topFocusProjects.map((fp) => ({
        project: fp.project,
        focusReason: fp.focusReason,
        actionHighlight: fp.actionHighlight,
      }));
    }

    // 3. Fallback to top 3 most recently active projects in the current workspace
    return data.projects
      .filter((p) => !p.health.isSmartStale)
      .slice(0, 3)
      .map((p) => ({
        project: p,
        focusReason: '🔥 มีความเคลื่อนไหวล่าสุด',
        actionHighlight: p.health.nextActions.urgent
          ? `🔴 ${p.health.nextActions.urgent.action}`
          : p.health.nextActions.next
          ? `🟡 ${p.health.nextActions.next.action}`
          : '🟢 พัฒนาต่อตาม Roadmap',
      }));
  }, [data, starredProjectIds]);

  // Check Live HTTP/HTTPS Health Status for projects with configured URLs
  useEffect(() => {
    if (!data?.projects) return;
    const projectsWithUrl = data.projects.filter(
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
  }, [data]);

  const handleUrlUpdated = async (projectId: string, newUrl: string) => {
    if (data) {
      const updatedProjects = data.projects.map((p) =>
        p.id === projectId ? { ...p, healthUrl: newUrl } : p
      );
      setData({ ...data, projects: updatedProjects });
    }

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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* 1. GLOBAL HEADER */}
      <GlobalHeader
        activeWorkspacePath={currentRoot?.path || 'All Workspaces'}
        totalProjectsCount={data?.totalProjects ?? 0}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={() => fetchScanData(true)}
        isLoading={loading}
        activeView="portfolio"
        attentionCount={data?.needAttentionCount ?? 0}
        onToggleAttention={() => setActiveTab(activeTab === 'attention' ? 'portfolio' : 'attention')}
        isAttentionActive={activeTab === 'attention'}
      />

      {/* 2. MORNING INTELLIGENCE BRIEFING */}
      {data?.intelligence && (
        <MorningIntelligenceBanner
          intelligence={data.intelligence}
          focusProjects={displayFocusProjects}
          onSelectProject={(project) => setSelectedProjectForExplainer(project)}
        />
      )}

      {/* 3. WORKSPACE ROOTS SELECTOR BAR */}
      <WorkspaceRootsBar
        monitoredRoots={monitoredRoots}
        activeRootId={activeRootId}
        onSelectRoot={handleSelectRoot}
        onOpenManageModal={() => setShowManageModal(true)}
      />

      {/* 4. KPI SUMMARY STATS BAR */}
      <PortfolioKpiBar
        totalProjects={data?.totalProjects ?? 0}
        activeCount={data?.activeCount ?? 0}
        needAttentionCount={data?.needAttentionCount ?? 0}
        staleCount={data?.staleCount ?? 0}
        blockedCount={data?.blockedCount ?? 0}
        completedCount={data?.completedCount ?? 0}
        selectedStatus={selectedStatus}
        onSelectStatus={(st) => {
          setSelectedStatus(st);
          setActiveTab('portfolio');
        }}
        activeTab={activeTab}
        onSelectAttentionTab={() => setActiveTab('attention')}
      />

      {/* 5. FILTER TABS & QUICK BADGES */}
      <PortfolioFilterTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        portfolioCount={filteredProjects.length}
        attentionCount={data?.needAttentionCount ?? 0}
        activeQuickFilter={activeQuickFilter}
        onToggleQuickFilter={(filter) =>
          setActiveQuickFilter(activeQuickFilter === filter ? null : filter)
        }
        starredCount={starredProjectIds.length}
      />

      {/* 6. PORTFOLIO GRID / ATTENTION QUEUE */}
      {activeTab === 'portfolio' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <ProjectCard
              key={p.path || p.id}
              project={p}
              isStarred={starredProjectIds.includes(p.id)}
              onToggleStar={toggleStar}
              onOpenExplainer={(proj) => setSelectedProjectForExplainer(proj)}
              onOpenAdvisor={(proj) => {
                setSelectedProjectForAdvisor(proj);
                setAiAdvice(null);
              }}
              onOpenServices={(proj) => setSelectedProjectForServices(proj)}
              onOpenEditUrl={(proj) => setSelectedProjectForUrl(proj)}
              liveStatus={liveStatuses[p.id]}
            />
          ))}
        </div>
      ) : (
        <AttentionQueueTable
          projects={data?.projects || []}
          onOpenProject={(proj) => setSelectedProjectForExplainer(proj)}
        />
      )}

      {/* 7. HEALTH BREAKDOWN EXPLAINER MODAL */}
      <HealthExplainerModal
        project={selectedProjectForExplainer}
        onClose={() => setSelectedProjectForExplainer(null)}
        onOpenAdvisor={(proj) => {
          setSelectedProjectForExplainer(null);
          setSelectedProjectForAdvisor(proj);
          setAiAdvice(null);
        }}
      />

      {/* 7.5 SERVICES / SUBMODULES MODAL */}
      <ProjectServicesModal
        project={selectedProjectForServices}
        onClose={() => setSelectedProjectForServices(null)}
        allProjects={data?.projects || []}
        onOpenSubproject={(sub) => {
          setSelectedProjectForServices(null);
          setSelectedProjectForExplainer(sub);
        }}
      />

      {/* 7.8 EDIT LIVE URL MODAL */}
      <EditProjectUrlModal
        project={selectedProjectForUrl}
        onClose={() => setSelectedProjectForUrl(null)}
        onUrlUpdated={handleUrlUpdated}
      />

      {/* 8. AI ADVISOR MODAL */}
      <ProjectAiAdvisorModal
        project={selectedProjectForAdvisor}
        onClose={() => setSelectedProjectForAdvisor(null)}
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

      {/* 9. MANAGE WORKSPACES MODAL */}
      <ManageWorkspacesModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        monitoredRoots={monitoredRoots}
        newRootName={newRootName}
        setNewRootName={setNewRootName}
        newRootPath={newRootPath}
        setNewRootPath={setNewRootPath}
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
          fetchScanData(true, newRoot.id, updated);
        }}
        onDeleteRoot={(id) => {
          const updated = monitoredRoots.filter((r) => r.id !== id);
          setMonitoredRoots(updated);
          try {
            localStorage.setItem('sentinel_monitored_roots', JSON.stringify(updated));
          } catch {}
        }}
      />
    </div>
  );
}
