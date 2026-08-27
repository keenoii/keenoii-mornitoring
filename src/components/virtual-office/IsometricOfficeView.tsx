'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProjectWithHealth } from '@/lib/project-repository';
import { VIRTUAL_STUDIOS, StudioDefinition, ClassificationResult } from '@/lib/studio-classifier';
import { DEFAULT_OFFICE_LAYOUT, OfficeLayoutTheme, PanelCoordinate } from '@/lib/office-layout-config';
import { APP_SETTINGS } from '@/config/app-settings';
import { Server, Star } from 'lucide-react';
import { OfficeTopToolbar } from './OfficeTopToolbar';
import { OfficeTourBanner } from './OfficeTourBanner';
import { OfficeLayoutStudioToolbar } from './OfficeLayoutStudioToolbar';
import { OfficePanelInspector } from './OfficePanelInspector';
import { OfficeChangeBgModal } from './OfficeChangeBgModal';
import { OfficeStatusFooter } from './OfficeStatusFooter';
import { LiveHealthStatus } from '@/services/live-health-service';

const IDLE_DESK_MESSAGES: Record<string, { tag: string; title: string; subtitle: string }[]> = {
  warroom: [
    { tag: '☕ สบายใจ', title: 'ไม่มีงานด่วน', subtitle: 'ระบบเสถียร ไร้วิกฤต 555' },
    { tag: '🧘 สงบสุข', title: 'ไร้บั๊กกวนใจ', subtitle: 'ยังไม่มีระบบไหนระเบิด' },
    { tag: '🛡️ สแตนด์บาย', title: 'โต๊ะนี้ว่างจ้า', subtitle: 'นั่งชิลล์ จิบชาเขียว' },
  ],
  web: [
    { tag: '💤 ว่างเปล่า', title: 'ไม่มีการทำงาน', subtitle: 'โต๊ะว่าง รอโปรเจกต์ใหม่' },
    { tag: '☕ จิบกาแฟ', title: 'แอบอู้งานแป๊บ', subtitle: 'ไม่มีบั๊ก เพราะไม่มีโค้ด 555' },
    { tag: '🎮 ชิลล์ๆ', title: 'โต๊ะนี้ว่างอยู่นะ', subtitle: 'นั่งส่อง YouTube เพลินๆ' },
  ],
  ai: [
    { tag: '🤖 พัก GPU', title: 'AI กำลังหลับ', subtitle: 'อุณหภูมิลดเหลือ 25°C' },
    { tag: '🧠 ว่างงาน', title: 'ไม่มีโมเดลรัน', subtitle: 'ไม่มี Token ให้เผา 555' },
    { tag: '🔋 ชาร์จแบต', title: 'นั่งทำสมาธิ', subtitle: 'พร้อมรับ Prompt ใหม่' },
  ],
  noc: [
    { tag: '🟢 นิ่งสนิท', title: 'Server หลับปุ๋ย', subtitle: 'CPU 0.1% นั่งตบยุง' },
    { tag: '🛋️ ว่างระดับ 9', title: 'ไม่มีงาน Dev', subtitle: 'Docker Container ว่าง' },
    { tag: '🌐 ไร้งาน', title: 'โต๊ะนี้ว่างจ้า', subtitle: 'สายแลนยังไม่ได้เสียบ' },
  ],
  infra: [
    { tag: '🟢 นิ่งสนิท', title: 'Server หลับปุ๋ย', subtitle: 'CPU 0.1% นั่งตบยุง' },
    { tag: '🛋️ ว่างระดับ 9', title: 'ไม่มีงาน Dev', subtitle: 'Docker Container ว่าง' },
    { tag: '🌐 ไร้งาน', title: 'โต๊ะนี้ว่างจ้า', subtitle: 'สายแลนยังไม่ได้เสียบ' },
  ],
  dormant: [
    { tag: '🛋️ โซฟาว่าง', title: 'ไม่มีงานดอง', subtitle: 'มานอนกลางวันได้ 555' },
    { tag: '😴 เงียบสงบ', title: 'ไร้โปรเจกต์หลับ', subtitle: 'ทุกคนตื่นมาทำงานหมด' },
    { tag: '✨ สะอาดเอี่ยม', title: 'โซฟาว่างจ้า', subtitle: 'ไร้ฝุ่น ไร้งานค้าง' },
  ],
};

function getIdleDeskInfo(roomType: string, coordId: string) {
  const list = IDLE_DESK_MESSAGES[roomType] || IDLE_DESK_MESSAGES.web;
  let sum = 0;
  for (let i = 0; i < coordId.length; i++) sum += coordId.charCodeAt(i);
  return list[sum % list.length];
}

interface IsometricOfficeViewProps {
  classifiedData: Record<
    string,
    Array<{
      project: ProjectWithHealth;
      workerState: 'active_typer' | 'thinking' | 'fixing' | 'healthy' | 'alert' | 'sleeping';
      classification: ClassificationResult;
    }>
  >;
  starredProjectIds: string[];
  searchQuery: string;
  onSelectStudio: (studio: StudioDefinition) => void;
  onSelectProject: (project: ProjectWithHealth) => void;
  liveStatuses?: Record<string, LiveHealthStatus>;
}

export const IsometricOfficeView: React.FC<IsometricOfficeViewProps> = ({
  classifiedData,
  starredProjectIds,
  searchQuery,
  onSelectStudio,
  onSelectProject,
  liveStatuses = {},
}) => {
  // 1. Active Layout State
  const [layout, setLayout] = useState<OfficeLayoutTheme>(DEFAULT_OFFICE_LAYOUT);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedCoordId, setSelectedCoordId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [showBgModal, setShowBgModal] = useState<boolean>(false);

  // 2. Camera Controls (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingPanelId, setDraggingPanelId] = useState<string | null>(null);
  const dioramaContainerRef = useRef<HTMLDivElement>(null);
  const officeWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fullscreen change listener & optimal 16:9 auto-fit
  useEffect(() => {
    const onFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreen(isFull);
      if (isFull) {
        setPan({ x: 0, y: 0 });
        const fitZoom = Math.min(window.innerWidth / 1400, window.innerHeight / 788);
        setZoom(Math.max(0.85, fitZoom * 0.95));
      } else {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      officeWrapperRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 3. Overlay Mode & Tour State
  const [overlayMode, setOverlayMode] = useState<'none' | 'health' | 'activity' | 'progress'>('health');
  const [isTourRunning, setIsTourRunning] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);
  const [tourNarration, setTourNarration] = useState<string>('');

  const tourStops = [
    {
      name: '🚨 WAR ROOM',
      pan: { x: 0, y: 150 },
      zoom: 1.35,
      narration: 'จุดที่ 1: 🚨 WAR ROOM — รวมโปรเจกต์วิกฤตที่คะแนนสุขภาพต่ำกว่า 60 ควรโฟกัสก่อน!',
    },
    {
      name: '🌐 WEB DEVELOPMENT STUDIO',
      pan: { x: 280, y: -30 },
      zoom: 1.4,
      narration: 'จุดที่ 2: 🌐 WEB DEV STUDIO — งานเว็บ Frontend & Fullstack Application',
    },
    {
      name: '🤖 AI & AUTOMATION LAB',
      pan: { x: 0, y: -30 },
      zoom: 1.4,
      narration: 'จุดที่ 3: 🤖 AI LAB — ระบบ AI Agent, LLM และ n8n Automation',
    },
    {
      name: '🛰️ INFRASTRUCTURE NOC',
      pan: { x: -280, y: -30 },
      zoom: 1.4,
      narration: 'จุดที่ 4: 🛰️ NOC & K8s CLUSTER — เครือข่าย เซิร์ฟเวอร์ และคลัสเตอร์หลัก',
    },
    {
      name: '😴 DORMANT LOUNGE',
      pan: { x: 0, y: -240 },
      zoom: 1.25,
      narration: 'จุดที่ 5: 😴 DORMANT LOUNGE — โซนพักผ่อนโปรเจกต์ที่ไม่ได้อัปเดตนอกเหนือ 14 วัน',
    },
  ];

  // Load Saved Layout
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await fetch('/api/office/layout');
        if (res.ok) {
          const data = await res.json();
          if (data.layout) {
            setLayout(data.layout);
            return;
          }
        }
      } catch {}

      try {
        const local = localStorage.getItem('sentinel_office_layout');
        if (local) setLayout(JSON.parse(local));
      } catch {}
    };
    fetchLayout();
  }, []);

  // Office Tour Auto-Flight Engine
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTourRunning) {
      const stop = tourStops[tourStep];
      setPan(stop.pan);
      setZoom(stop.zoom);
      setTourNarration(stop.narration);

      timer = setTimeout(() => {
        if (tourStep < tourStops.length - 1) {
          setTourStep((s) => s + 1);
        } else {
          setIsTourRunning(false);
          setTourStep(0);
          setPan({ x: 0, y: 0 });
          setZoom(1);
          setTourNarration('');
        }
      }, APP_SETTINGS.officeTour.stepDurationMs);
    }
    return () => clearTimeout(timer);
  }, [isTourRunning, tourStep]);

  // 3.5 Dormant Lounge Smart Auto-Cycle & Pagination
  const [loungePage, setLoungePage] = useState<number>(0);
  const [isAutoCycleEnabled, setIsAutoCycleEnabled] = useState<boolean>(true);

  const allLoungeItems = classifiedData.archive || [];
  const starredInLounge = allLoungeItems.filter((item) =>
    starredProjectIds.includes(item.project.id)
  );
  const unstarredInLounge = allLoungeItems.filter(
    (item) => !starredProjectIds.includes(item.project.id)
  );

  const availableRotatingSlots = Math.max(1, 6 - starredInLounge.length);
  const totalLoungePages = Math.max(
    1,
    Math.ceil(unstarredInLounge.length / availableRotatingSlots)
  );

  // Auto-cycle timer every 12 seconds
  useEffect(() => {
    if (!isAutoCycleEnabled || totalLoungePages <= 1 || isTourRunning) return;
    const interval = setInterval(() => {
      setLoungePage((p) => (p + 1) % totalLoungePages);
    }, 12000);
    return () => clearInterval(interval);
  }, [isAutoCycleEnabled, totalLoungePages, isTourRunning]);

  // Current active projects list for Dormant Lounge sofas:
  const currentLoungeProjects = useMemo(() => {
    if (allLoungeItems.length <= 6) return allLoungeItems.map((item) => item.project);
    const unstarredSlice = unstarredInLounge.slice(
      loungePage * availableRotatingSlots,
      (loungePage + 1) * availableRotatingSlots
    );
    return [...starredInLounge, ...unstarredSlice].map((item) => item.project);
  }, [allLoungeItems, starredInLounge, unstarredInLounge, loungePage, availableRotatingSlots]);

  // Layout Studio Handlers
  const handleSaveLayout = async () => {
    try {
      localStorage.setItem('sentinel_office_layout', JSON.stringify(layout));
      await fetch('/api/office/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {}
  };

  const handleResetLayout = async () => {
    if (confirm('คุณต้องการรีเซ็ตตำแหน่งผังห้องกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      setLayout(DEFAULT_OFFICE_LAYOUT);
      try {
        localStorage.removeItem('sentinel_office_layout');
        await fetch('/api/office/layout', { method: 'DELETE' });
      } catch {}
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(layout, null, 2));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleAddPanel = (roomKey: keyof OfficeLayoutTheme['panels']) => {
    const newId = `${roomKey}-${Date.now().toString().slice(-4)}`;
    const newPanel: PanelCoordinate = {
      id: newId,
      top: '50%',
      left: '50%',
      width: roomKey === 'dormant' ? '124px' : '108px',
      height: roomKey === 'warroom' ? '62px' : roomKey === 'dormant' ? '58px' : '58px',
      roomType: roomKey === 'infra' ? 'noc' : (roomKey as any),
    };

    setLayout((prev) => ({
      ...prev,
      panels: {
        ...prev.panels,
        [roomKey]: [...prev.panels[roomKey], newPanel],
      },
    }));
    setSelectedCoordId(newId);
  };

  const handleDeletePanel = (panelId: string) => {
    setLayout((prev) => {
      const updatedPanels: any = {};
      for (const [key, list] of Object.entries(prev.panels)) {
        updatedPanels[key] = (list as PanelCoordinate[]).filter((p) => p.id !== panelId);
      }
      return { ...prev, panels: updatedPanels };
    });
    setSelectedCoordId(null);
  };

  const handleUpdatePanelProperty = (panelId: string, updates: Partial<PanelCoordinate>) => {
    setLayout((prev) => {
      const updatedPanels: any = {};
      for (const [key, list] of Object.entries(prev.panels)) {
        updatedPanels[key] = (list as PanelCoordinate[]).map((p) =>
          p.id === panelId ? { ...p, ...updates } : p
        );
      }
      return { ...prev, panels: updatedPanels };
    });
  };

  // Canvas Mouse Pan & Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isTourRunning && !draggingPanelId) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (draggingPanelId && dioramaContainerRef.current) {
      const rect = dioramaContainerRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / zoom;
      const relativeY = (e.clientY - rect.top) / zoom;

      const leftPercent = Math.max(2, Math.min(98, (relativeX / 1400) * 100)).toFixed(1) + '%';
      const topPercent = Math.max(2, Math.min(98, (relativeY / 788) * 100)).toFixed(1) + '%';

      handleUpdatePanelProperty(draggingPanelId, { left: leftPercent, top: topPercent });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggingPanelId(null);
  };

  // Search & Active Stats
  const isMatch = (p: ProjectWithHealth) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.detectedType.primaryType.toLowerCase().includes(q) ||
      (p.detectedType.frameworks || []).some((f) => f.toLowerCase().includes(q))
    );
  };

  // Unique projects map & Synchronized Stats
  const uniqueProjectMap = new Map<string, ProjectWithHealth>();
  Object.values(classifiedData)
    .flat()
    .forEach((w) => {
      if (!uniqueProjectMap.has(w.project.id)) {
        uniqueProjectMap.set(w.project.id, w.project);
      }
    });

  const uniqueProjectsList = Array.from(uniqueProjectMap.values());
  const totalCount = uniqueProjectsList.length;

  const onlineCount = uniqueProjectsList.filter(
    (p) => Boolean(p.healthUrl || p.config?.health_url) && (liveStatuses[p.id]?.isOnline ?? true)
  ).length;

  const activeDevCount = uniqueProjectsList.filter(
    (p) => !p.health.isSmartStale && p.status !== 'STALE' && p.status !== 'COMPLETED' && p.stage !== 'Production'
  ).length;

  const avgHealth =
    totalCount > 0
      ? Math.round(uniqueProjectsList.reduce((acc, curr) => acc + curr.health.total, 0) / totalCount)
      : 76;

  const allLayoutPanels = Object.values(layout.panels).flat();
  const selectedCoord = allLayoutPanels.find((p) => p.id === selectedCoordId);

  // Helper to render Wall HUD Panel
  const renderPanelFromCoord = (coord: PanelCoordinate, project: ProjectWithHealth | undefined) => {
    const isSelectedInEditor = isEditMode && selectedCoordId === coord.id;
    const isMatchSearch = project ? isMatch(project) : true;
    const isStarred = project ? starredProjectIds.includes(project.id) : false;
    const isCritical = project ? project.health.total < APP_SETTINGS.healthThresholds.risk : false;
    const isAttention =
      project && !isCritical
        ? project.health.total < APP_SETTINGS.healthThresholds.healthy
        : false;

    let statusColor = APP_SETTINGS.statusColors.healthy;
    if (isCritical) statusColor = APP_SETTINGS.statusColors.critical;
    else if (isAttention) statusColor = APP_SETTINGS.statusColors.attention;

    const liveStatus = project ? liveStatuses[project.id] : undefined;
    const isLiveOffline = liveStatus ? !liveStatus.isOnline : false;
    const isLiveOnline = liveStatus ? liveStatus.isOnline : false;

    const isIdle = !project;
    const idleInfo = isIdle ? getIdleDeskInfo(coord.roomType, coord.id) : null;

    let borderClass = 'border-sky-500/60 shadow-[0_0_12px_rgba(56,189,248,0.35)]';
    if (isIdle) {
      borderClass = 'border-slate-800/80 bg-slate-950/70 opacity-70 hover:opacity-100 hover:border-slate-700 shadow-sm';
    } else if (isLiveOffline) {
      borderClass = 'border-rose-500 ring-2 ring-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.7)] animate-pulse';
    } else if (coord.roomType === 'warroom') {
      borderClass = 'border-rose-500/70 shadow-[0_0_15px_rgba(244,63,94,0.4)]';
    } else if (coord.roomType === 'ai') {
      borderClass = 'border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.35)]';
    } else if (coord.roomType === 'noc') {
      borderClass = 'border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.35)]';
    } else if (coord.roomType === 'dormant') {
      borderClass = 'border-slate-700/80 shadow-[0_0_10px_rgba(0,0,0,0.5)]';
    }

    if (isSelectedInEditor) {
      borderClass = 'border-amber-400 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.8)] scale-105';
    }

    return (
      <div
        key={coord.id}
        style={{
          top: coord.top,
          left: coord.left,
          width: coord.width || (coord.roomType === 'dormant' ? '124px' : '108px'),
          height: coord.height || 'auto',
          transform: 'translate(-50%, -50%)',
        }}
        onMouseDown={(e) => {
          if (isEditMode) {
            e.stopPropagation();
            setSelectedCoordId(coord.id);
            setDraggingPanelId(coord.id);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isEditMode) {
            setSelectedCoordId(coord.id);
          } else if (project) {
            onSelectProject(project);
          }
        }}
        className={`absolute z-10 cursor-pointer transition-all duration-150 group/panel ${
          searchQuery && !isMatchSearch ? 'opacity-20' : 'opacity-100'
        } ${isEditMode ? 'cursor-move hover:ring-2 hover:ring-amber-400' : ''}`}
      >
        <div
          className={`h-full p-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border ${borderClass} group-hover/panel:border-white group-hover/panel:shadow-[0_0_18px_rgba(255,255,255,0.4)] transition-all flex flex-col items-center justify-between text-center relative overflow-hidden`}
        >
          {isEditMode && (
            <div className="absolute top-0 right-0 p-0.5 bg-amber-500 text-black text-[7px] font-black rounded-bl">
              {coord.id}
            </div>
          )}

          {/* Top Row: Status Dot & Tech Tag */}
          <div className="w-full flex items-center justify-between gap-1 mb-0.5 text-[8px] font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLiveOffline ? 'animate-ping' : ''}`}
              style={{
                backgroundColor: isIdle
                  ? '#475569'
                  : isLiveOffline
                  ? '#f43f5e'
                  : isLiveOnline
                  ? '#10b981'
                  : statusColor,
                boxShadow: isIdle
                  ? 'none'
                  : `0 0 5px ${isLiveOffline ? '#f43f5e' : isLiveOnline ? '#10b981' : statusColor}`,
              }}
            />
            <span
              className={`truncate px-1 py-0.2 rounded text-[8px] font-bold ${
                isIdle ? 'text-slate-400 bg-slate-900/60' : 'text-slate-300'
              }`}
            >
              {isIdle
                ? idleInfo?.tag
                : isLiveOffline
                ? '🔴 OFFLINE'
                : isLiveOnline && liveStatus
                ? `🟢 ${liveStatus.responseTimeMs}ms`
                : coord.roomType === 'ai'
                ? 'AI Agent'
                : coord.roomType === 'noc'
                ? 'NOC / Server'
                : project?.detectedType.primaryType || 'Next.js'}
            </span>
            {isStarred && !isIdle ? (
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
            ) : (
              <span className="w-1" />
            )}
          </div>

          {/* Middle Row: Project Name / Idle Title */}
          <div
            className={`font-bold text-[10px] leading-normal truncate w-full px-0.5 ${
              isIdle ? 'text-slate-400 group-hover/panel:text-slate-200' : 'text-white group-hover/panel:text-sky-200'
            }`}
            title={project?.name || idleInfo?.title}
          >
            {project?.name || idleInfo?.title}
          </div>

          {/* Bottom Row: Score / Idle Subtitle */}
          {isIdle ? (
            <div className="w-full text-[8px] text-slate-500 font-mono leading-none truncate" title={idleInfo?.subtitle}>
              {idleInfo?.subtitle}
            </div>
          ) : coord.roomType === 'dormant' ? (
            <div className="w-full text-[8px] font-mono leading-none truncate">
              {isLiveOnline ? (
                <span className="text-emerald-400 font-bold">🟢 Live • {project?.health.total || 0} pts</span>
              ) : overlayMode === 'health' ? (
                <span className="text-slate-400 font-bold">{project?.health.total || 0} pts • Stale</span>
              ) : overlayMode === 'progress' ? (
                <span className="text-teal-400 font-bold">{project?.progress || 0}%</span>
              ) : (
                <span className="text-slate-400">Stale (&gt;14d)</span>
              )}
            </div>
          ) : overlayMode === 'health' ? (
            <div className="text-[9px] font-black" style={{ color: statusColor }}>
              {coord.roomType === 'warroom'
                ? `Health: ${project?.health.total || 59}/100`
                : `${project?.health.total || 77} pts`}
            </div>
          ) : overlayMode === 'progress' ? (
            <div className="text-[9px] font-black text-teal-400">{project?.progress || 0}%</div>
          ) : (
            <div className="text-[8px] text-slate-400 font-mono truncate">{project?.git.branch || 'main'}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={officeWrapperRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col justify-between select-none overflow-hidden'
          : 'relative w-full h-[840px] bg-slate-950 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl select-none flex flex-col justify-between'
      }
    >
      {/* 1. TOP VIEWPORT TOOLBAR */}
      <OfficeTopToolbar
        overlayMode={overlayMode}
        setOverlayMode={setOverlayMode}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        isTourRunning={isTourRunning}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onStartTour={() => {
          setIsTourRunning(true);
          setTourStep(0);
        }}
        onStopTour={() => {
          setIsTourRunning(false);
          setTourStep(0);
          setPan({ x: 0, y: 0 });
          setZoom(1);
        }}
        onZoomIn={() => setZoom((z) => Math.min(2.4, z + 0.2))}
        onZoomOut={() => setZoom((z) => Math.max(0.7, z - 0.2))}
        onResetView={() => {
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }}
      />

      {/* 2. IN-APP LAYOUT STUDIO TOOLBAR */}
      <OfficeLayoutStudioToolbar
        isEditMode={isEditMode}
        copiedSuccess={copiedSuccess}
        saveSuccess={saveSuccess}
        onAddPanel={handleAddPanel}
        onOpenBgModal={() => setShowBgModal(true)}
        onCopyJson={handleCopyJson}
        onResetLayout={handleResetLayout}
        onSaveLayout={handleSaveLayout}
      />

      {/* 3. SELECTED PANEL INSPECTOR SIDEBAR */}
      <OfficePanelInspector
        isEditMode={isEditMode}
        selectedCoord={selectedCoord}
        onClose={() => setSelectedCoordId(null)}
        onUpdateProperty={handleUpdatePanelProperty}
        onDeletePanel={handleDeletePanel}
      />

      {/* 4. DIORAMA WORLD CONTAINER */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden flex items-center justify-center"
      >
        <div
          ref={dioramaContainerRef}
          className="relative w-[1400px] h-[788px] mt-4 transition-transform duration-500 ease-out flex-shrink-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* High Resolution Cyberpunk Diorama Image */}
          <img
            src={layout.imageSrc}
            alt="Virtual Project Office"
            className="w-full h-full object-cover rounded-2xl shadow-2xl pointer-events-none"
          />

          {/* 🚨 1. WAR ROOM - CRITICAL SYSTEMS (Top Back Wall) */}
          <div
            onClick={() => !isEditMode && onSelectStudio(VIRTUAL_STUDIOS.find((s) => s.id === 'warroom')!)}
            style={{
              top: layout.roomClickAreas.warroom.top,
              left: layout.roomClickAreas.warroom.left,
              width: layout.roomClickAreas.warroom.width,
              height: layout.roomClickAreas.warroom.height,
            }}
            className="absolute cursor-pointer z-10 hover:bg-rose-500/10 rounded-xl transition-all"
            title="คลิกเพื่อเปิด Studio Cockpit (War Room)"
          />
          {layout.panels.warroom.map((coord, idx) =>
            renderPanelFromCoord(coord, classifiedData.warroom?.[idx]?.project)
          )}

          {/* 🌐 2. WEB DEVELOPMENT STUDIO (Middle Left Wall) */}
          <div
            onClick={() => !isEditMode && onSelectStudio(VIRTUAL_STUDIOS.find((s) => s.id === 'web')!)}
            style={{
              top: layout.roomClickAreas.web.top,
              left: layout.roomClickAreas.web.left,
              width: layout.roomClickAreas.web.width,
              height: layout.roomClickAreas.web.height,
            }}
            className="absolute cursor-pointer z-10 hover:bg-sky-500/10 rounded-xl transition-all"
            title="คลิกเพื่อเปิด Studio Cockpit (Web Studio)"
          />
          {layout.panels.web.map((coord, idx) =>
            renderPanelFromCoord(coord, classifiedData.web?.[idx]?.project)
          )}

          {/* 🤖 3. AI & AUTOMATION LAB (Middle Center Wall) */}
          <div
            onClick={() => !isEditMode && onSelectStudio(VIRTUAL_STUDIOS.find((s) => s.id === 'ai')!)}
            style={{
              top: layout.roomClickAreas.ai.top,
              left: layout.roomClickAreas.ai.left,
              width: layout.roomClickAreas.ai.width,
              height: layout.roomClickAreas.ai.height,
            }}
            className="absolute cursor-pointer z-10 hover:bg-purple-500/10 rounded-xl transition-all"
            title="คลิกเพื่อเปิด Studio Cockpit (AI Lab)"
          />
          {layout.panels.ai.map((coord, idx) =>
            renderPanelFromCoord(coord, classifiedData.ai?.[idx]?.project)
          )}

          {/* 🛰️ 4. NETWORK & INFRASTRUCTURE NOC (Middle Right Wall) */}
          <div
            onClick={() => !isEditMode && onSelectStudio(VIRTUAL_STUDIOS.find((s) => s.id === 'infra')!)}
            style={{
              top: layout.roomClickAreas.infra.top,
              left: layout.roomClickAreas.infra.left,
              width: layout.roomClickAreas.infra.width,
              height: layout.roomClickAreas.infra.height,
            }}
            className="absolute cursor-pointer z-10 hover:bg-cyan-500/10 rounded-xl transition-all"
            title="คลิกเพื่อเปิด Studio Cockpit (NOC)"
          />
          {layout.panels.infra.map((coord, idx) =>
            renderPanelFromCoord(coord, classifiedData.infra?.[idx]?.project)
          )}

          {/* K8s Cluster Hologram Tag on Server Rack */}
          <div
            style={{
              top: layout.serverRack.top,
              left: layout.serverRack.left,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
          >
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-cyan-400 text-cyan-300 font-extrabold text-[10px] flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.5)] animate-pulse">
              <Server className="w-3 h-3" />
              <span>{layout.serverRack.label}</span>
            </div>
          </div>

          {/* 😴 5. ARCHIVE & DORMANT LOUNGE (Bottom Sofas) */}
          <div
            onClick={() => !isEditMode && onSelectStudio(VIRTUAL_STUDIOS.find((s) => s.id === 'archive')!)}
            style={{
              top: layout.roomClickAreas.dormant.top,
              left: layout.roomClickAreas.dormant.left,
              width: layout.roomClickAreas.dormant.width,
              height: layout.roomClickAreas.dormant.height,
            }}
            className="absolute cursor-pointer z-10 hover:bg-slate-700/10 rounded-xl transition-all"
            title="คลิกเพื่อเปิด Studio Cockpit (Dormant Lounge)"
          />

          {layout.panels.dormant.map((coord, idx) =>
            renderPanelFromCoord(coord, currentLoungeProjects[idx])
          )}
        </div>
      </div>

      {/* 4.5 TOUR NARRATION BANNER WITH TYPEWRITER EFFECT */}
      <OfficeTourBanner
        isTourRunning={isTourRunning}
        tourStep={tourStep}
        tourName={tourStops[tourStep]?.name || ''}
        tourNarration={tourNarration}
      />

      {/* 5. BOTTOM FLOATING STATUS HUD */}
      <OfficeStatusFooter
        avgHealth={avgHealth}
        activeCount={activeDevCount}
        onlineCount={onlineCount}
        totalCount={totalCount}
        loungePage={loungePage}
        totalLoungePages={totalLoungePages}
        totalLoungeProjects={allLoungeItems.length}
        isAutoCycleEnabled={isAutoCycleEnabled}
        onPrevLoungePage={() => setLoungePage((p) => (p - 1 + totalLoungePages) % totalLoungePages)}
        onNextLoungePage={() => setLoungePage((p) => (p + 1) % totalLoungePages)}
        onToggleAutoCycle={() => setIsAutoCycleEnabled(!isAutoCycleEnabled)}
      />

      {/* 6. CHANGE BACKGROUND MODAL */}
      <OfficeChangeBgModal
        isOpen={showBgModal}
        currentBg={layout.imageSrc}
        onClose={() => setShowBgModal(false)}
        onApply={(newSrc) => {
          setLayout((prev) => ({ ...prev, imageSrc: newSrc }));
          setShowBgModal(false);
        }}
      />
    </div>
  );
};
