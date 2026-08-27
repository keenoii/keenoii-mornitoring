'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ArrowLeft,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Bot,
  Sparkles,
  GitBranch,
  Calendar,
  Layers,
  Plus,
  Save,
  MessageSquare,
  FileCode,
  Check,
  Star,
  Activity,
  Zap,
  CheckSquare,
  Square,
  Bookmark,
} from 'lucide-react';
import { ProjectWithHealth } from '@/lib/project-repository';
import { ProjectGoal, ProjectMemoryEntry } from '@/lib/project-memory';

export default function ProjectMemoryCockpitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = use(params);
  const [project, setProject] = useState<ProjectWithHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Goal & Blocker State
  const [goal, setGoal] = useState<ProjectGoal | null>(null);
  const [currentGoalInput, setCurrentGoalInput] = useState<string>('');
  const [blockerInput, setBlockerInput] = useState<string>('');
  const [followUpDateInput, setFollowUpDateInput] = useState<string>('');
  const [savingGoal, setSavingGoal] = useState<boolean>(false);

  // AI Advice & Memory Selection State
  const [selectedDoNextIndices, setSelectedDoNextIndices] = useState<number[]>([]);
  const [savedMemoryIds, setSavedMemoryIds] = useState<Record<string, boolean>>({});
  const [savingMemory, setSavingMemory] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [goalSavedSuccess, setGoalSavedSuccess] = useState<boolean>(false);

  // Memory Timeline State
  const [memories, setMemories] = useState<ProjectMemoryEntry[]>([]);
  const [showAddMemoryModal, setShowAddMemoryModal] = useState<boolean>(false);
  const [newMemoryTitle, setNewMemoryTitle] = useState<string>('');
  const [newMemoryContent, setNewMemoryContent] = useState<string>('');
  const [newMemoryType, setNewMemoryType] = useState<ProjectMemoryEntry['type']>('note');
  const [newMemoryDate, setNewMemoryDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // AI Advisor State
  const [aiAdvice, setAiAdvice] = useState<any | null>(null);
  const [generatingAdvice, setGeneratingAdvice] = useState<boolean>(false);
  const [selectedAiProvider, setSelectedAiProvider] = useState<string>('typhoon');

  // Starred state
  const [isStarred, setIsStarred] = useState<boolean>(false);

  // Fetch Project details & Memory
  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch project list from scan API
      const res = await fetch('/api/scan');
      if (!res.ok) throw new Error('Failed to load project metadata');
      const json = await res.json();

      const decodedSlug = decodeURIComponent(slug);
      const match = json.projects.find(
        (p: ProjectWithHealth) =>
          p.id === decodedSlug ||
          p.name.toLowerCase() === decodedSlug.toLowerCase() ||
          p.slug === decodedSlug
      );

      if (!match) {
        throw new Error(`Project "${decodedSlug}" not found`);
      }

      setProject(match);

      // Check if starred in localStorage
      try {
        const savedStars = localStorage.getItem('sentinel_starred_projects');
        if (savedStars) {
          const stars: string[] = JSON.parse(savedStars);
          setIsStarred(stars.includes(match.id));
        }
      } catch {}

      // 2. Fetch Project Memory & Goals
      const memRes = await fetch(`/api/projects/${encodeURIComponent(match.id)}/memory`);
      if (memRes.ok) {
        const memJson = await memRes.json();
        if (memJson.goal) {
          setGoal(memJson.goal);
          setCurrentGoalInput(memJson.goal.currentGoal || '');
          setBlockerInput(memJson.goal.blockerText || '');
          setFollowUpDateInput(memJson.goal.followUpDate || '');
        }
        if (memJson.memories) {
          setMemories(memJson.memories);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading project cockpit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [slug]);

  const toggleStar = () => {
    if (!project) return;
    try {
      const savedStars = localStorage.getItem('sentinel_starred_projects');
      let stars: string[] = savedStars ? JSON.parse(savedStars) : [];
      if (isStarred) {
        stars = stars.filter((id) => id !== project.id);
        setIsStarred(false);
      } else {
        stars.push(project.id);
        setIsStarred(true);
      }
      localStorage.setItem('sentinel_starred_projects', JSON.stringify(stars));
    } catch {}
  };

  // Save Goal & Blocker
  const handleSaveGoal = async () => {
    if (!project) return;
    setSavingGoal(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(project.id)}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_goal',
          currentGoal: currentGoalInput,
          blockerText: blockerInput,
          followUpDate: followUpDateInput,
        }),
      });
      if (res.ok) {
        setGoalSavedSuccess(true);
        setTimeout(() => setGoalSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingGoal(false);
    }
  };

  // Add Memory Entry
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newMemoryTitle.trim()) return;

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(project.id)}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_memory',
          title: newMemoryTitle,
          content: newMemoryContent,
          type: newMemoryType,
          eventDate: newMemoryDate,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setMemories((prev) => [json.memory, ...prev]);
        setNewMemoryTitle('');
        setNewMemoryContent('');
        setShowAddMemoryModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate AI Advice
  const handleGenerateAdvice = async () => {
    if (!project) return;
    setGeneratingAdvice(true);
    try {
      const savedKey = localStorage.getItem('sentinel_ai_key') || undefined;
      const res = await fetch('/api/advisor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          provider: selectedAiProvider,
          apiKey: savedKey,
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

  const toggleDoNextSelect = (idx: number) => {
    setSelectedDoNextIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSaveItemToMemory = async (
    title: string,
    content: string,
    type: 'note' | 'decision' | 'blocker' | 'milestone' = 'note',
    itemKey?: string
  ) => {
    if (!project) return;
    setSavingMemory(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(project.id)}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_memory',
          title: title.slice(0, 100),
          type,
          content,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.memory) {
          setMemories((prev) => [json.memory, ...prev]);
        }
        if (itemKey) {
          setSavedMemoryIds((prev) => ({ ...prev, [itemKey]: true }));
        }
        setSaveSuccessMsg(`บันทึก "${title.slice(0, 30)}..." ลงความทรงจำเรียบร้อยแล้ว 🧠✨`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save memory:', err);
    } finally {
      setSavingMemory(false);
    }
  };

  const handleSaveSelectedDoNext = async () => {
    if (!project || !aiAdvice || !aiAdvice.doNext || !Array.isArray(aiAdvice.doNext)) return;
    setSavingMemory(true);
    let count = 0;

    for (const idx of selectedDoNextIndices) {
      const item = aiAdvice.doNext[idx];
      if (!item) continue;
      const title = typeof item === 'object' ? item.action || item.title : String(item);
      const content = typeof item === 'object' ? item.reason || 'AI Advisor Action Step' : 'AI Advice';

      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(project.id)}/memory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_memory',
            title,
            type: 'note',
            content,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.memory) {
            setMemories((prev) => [json.memory, ...prev]);
          }
          setSavedMemoryIds((prev) => ({ ...prev, [`cockpit-donext-${idx}`]: true }));
          count++;
        }
      } catch {}
    }

    setSavingMemory(false);
    setSaveSuccessMsg(`บันทึก ${count} คำแนะนำลงในความทรงจำของโปรเจกต์เรียบร้อยแล้ว 🧠✨`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">กำลังโหลด Project Memory & Cockpit...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-sm">
          ⚠️ {error || 'ไม่พบโปรเจกต์นี้ในระบบ'}
        </div>
        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← ย้อนกลับ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* TOP HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-2">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium cursor-pointer mb-1 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>← ย้อนกลับ</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleStar}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isStarred
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-amber-400'
              }`}
              title={isStarred ? 'ยกเลิกติดดาว' : 'ติดดาวโปรเจกต์นี้'}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white">{project.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  {project.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                  {project.detectedType.primaryType}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{project.path}</p>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddMemoryModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ บันทึก Memory / Note</span>
          </button>
        </div>
      </header>

      {/* DUAL METRIC SCORE CARDS */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
            <span>Roadmap Progress</span>
            <Target className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-400">{project.progress}%</div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-teal-400 rounded-full" style={{ width: `${Math.max(5, project.progress)}%` }} />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
            <span>Project Health</span>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {project.health.total} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Tier: {project.health.tier}</div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
            <span>Git Branch</span>
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-slate-200 truncate font-mono">{project.git.branch || 'main'}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            {project.git.isDirty ? `🌿 ${project.git.uncommittedFiles} uncommitted files` : '✨ Working tree clean'}
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
            <span>Open Tasks & Debt</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base font-bold text-slate-200">
            {project.metrics.todoCount} TODOs • {project.metrics.fixmeCount} FIXMEs
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Stage: {project.stage}</div>
        </div>
      </section>

      {/* 🎯 CURRENT GOAL & 📌 NEXT ACTION (The Developer Cockpit Core) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Goal Box (Editable) */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-teal-400" />
              <span>CURRENT GOAL (เป้าหมายปัจจุบัน):</span>
            </h3>
            {goalSavedSuccess && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> บันทึกแล้ว!
              </span>
            )}
          </div>

          <textarea
            rows={2}
            value={currentGoalInput}
            onChange={(e) => setCurrentGoalInput(e.target.value)}
            placeholder="ระบุเป้าหมายของ Sprint นี้ เช่น พัฒนา Video Call ให้ใช้งานได้สมบูรณ์..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500">
              อัปเดตล่าสุด: {goal?.updatedAt ? new Date(goal.updatedAt).toLocaleDateString('th-TH') : 'ยังไม่มีการบันทึก'}
            </span>
            <button
              onClick={handleSaveGoal}
              disabled={savingGoal}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingGoal ? 'กำลังบันทึก...' : 'บันทึกเป้าหมาย'}</span>
            </button>
          </div>
        </div>

        {/* Next Action Box */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl space-y-3 shadow-md">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>NEXT ACTION (สิ่งที่ควรทำต่อ):</span>
          </h3>

          <div className="space-y-2">
            {project.health.nextActions.urgent && (
              <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-2xl flex items-start justify-between gap-2 text-xs">
                <div>
                  <span className="text-rose-400 font-bold text-[10px] uppercase block mb-0.5">🔴 ต้องทำก่อน</span>
                  <p className="text-slate-200 font-medium">{project.health.nextActions.urgent.action}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold flex-shrink-0">
                  +{project.health.nextActions.urgent.potentialGain} pts
                </span>
              </div>
            )}

            {project.health.nextActions.next && (
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-2xl flex items-start justify-between gap-2 text-xs">
                <div>
                  <span className="text-amber-400 font-bold text-[10px] uppercase block mb-0.5">🟡 ควรทำต่อ</span>
                  <p className="text-slate-200 font-medium">{project.health.nextActions.next.action}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex-shrink-0">
                  +{project.health.nextActions.next.potentialGain} pts
                </span>
              </div>
            )}

            {!project.health.nextActions.urgent && !project.health.nextActions.next && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl text-xs text-emerald-300">
                🟢 สุขภาพโปรเจกต์ดีเยี่ยม พร้อมพัฒนาต่อตาม Roadmap!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 🔥 BLOCKERS & ⏰ FOLLOW-UP SECTION */}
      <section className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>BLOCKERS & FOLLOW-UP (คอขวดและกำหนดการติดตาม):</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              จุดที่ติดปัญหา (Blocker Text):
            </label>
            <input
              type="text"
              value={blockerInput}
              onChange={(e) => setBlockerInput(e.target.value)}
              placeholder="เช่น WebRTC connection issue on NAT / รอ API สัญญาณจากทีม..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              กำหนดติดตาม (Follow-up Due Date):
            </label>
            <input
              type="date"
              value={followUpDateInput}
              onChange={(e) => setFollowUpDateInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>
      </section>

      {/* 🤖 AI ADVISOR BOX */}
      <section className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">AI Project Advisor Analysis</h4>
              <span className="text-[10px] text-slate-400">
                {aiAdvice ? `วิเคราะห์โดย: ${aiAdvice.provider}` : 'คำแนะนำทางเทคนิคประจำโปรเจกต์'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAiProvider}
              onChange={(e) => setSelectedAiProvider(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
            >
              <option value="typhoon">🇹🇭 Typhoon v2.5 (30B Agentic)</option>
              <option value="auto">⚡ Auto (Ollama/Rule)</option>
              <option value="ollama">💻 Local Ollama (Offline)</option>
              <option value="gemini">🌐 Google Gemini</option>
              <option value="rule-engine">📐 Rule Engine</option>
            </select>

            <button
              onClick={handleGenerateAdvice}
              disabled={generatingAdvice}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${generatingAdvice ? 'animate-spin' : ''}`} />
              <span>{generatingAdvice ? 'กำลังคิด...' : 'ขอคำแนะนำ AI'}</span>
            </button>
          </div>
        </div>

        {/* Global Save Success Notification */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center gap-2 text-xs text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
        )}

        {aiAdvice ? (
          <div className="space-y-3 text-xs animate-fadeIn">
            {/* 1. Diagnosis */}
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🩺 Diagnosis: {aiAdvice.diagnosis || aiAdvice.overallStatus}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">Est. Health: </span>
                    <span className="text-xs font-black text-emerald-400">{aiAdvice.estimatedHealth}</span>
                  </div>
                  <button
                    onClick={() =>
                      handleSaveItemToMemory(
                        `Diagnosis: ${project.name}`,
                        aiAdvice.diagnosis || aiAdvice.overallStatus || 'AI Diagnosis',
                        'note',
                        'cockpit-diag-1'
                      )
                    }
                    disabled={savedMemoryIds['cockpit-diag-1']}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      savedMemoryIds['cockpit-diag-1']
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {savedMemoryIds['cockpit-diag-1'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Bookmark className="w-3 h-3" />}
                    <span>{savedMemoryIds['cockpit-diag-1'] ? 'บันทึกแล้ว ✓' : 'บันทึกลงความทรงจำ'}</span>
                  </button>
                </div>
              </div>
              {aiAdvice.reasoning && <p className="text-[11px] text-slate-300 leading-relaxed">{aiAdvice.reasoning}</p>}
            </div>

            {/* 2. DO NEXT Recommendations */}
            {aiAdvice.doNext && (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                    <span>✅ สิ่งที่ควรทำต่อไป (DO NEXT):</span>
                  </div>
                  {Array.isArray(aiAdvice.doNext) && selectedDoNextIndices.length > 0 && (
                    <button
                      onClick={handleSaveSelectedDoNext}
                      disabled={savingMemory}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-all text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>บันทึกที่เลือก ({selectedDoNextIndices.length}) ลงความทรงจำ</span>
                    </button>
                  )}
                </div>

                {Array.isArray(aiAdvice.doNext) ? (
                  <div className="space-y-2">
                    {aiAdvice.doNext.map((item: any, idx: number) => {
                      const isSelected = selectedDoNextIndices.includes(idx);
                      const isSaved = savedMemoryIds[`cockpit-donext-${idx}`];
                      const title = typeof item === 'object' ? item.action || item.title : String(item);
                      const reason = typeof item === 'object' ? item.reason : undefined;
                      const gain = typeof item === 'object' ? item.estimatedGain : undefined;

                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500/50'
                              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              onClick={() => toggleDoNextSelect(idx)}
                              className="flex items-start gap-2 flex-1 cursor-pointer"
                            >
                              <button type="button" className="mt-0.5 text-slate-400 hover:text-emerald-400">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                )}
                              </button>
                              <div>
                                <div className="font-bold text-emerald-300 text-xs">
                                  <span>{title}</span>
                                  {gain && (
                                    <span className="text-[10px] font-mono text-emerald-400 ml-2 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                      +{gain} pts
                                    </span>
                                  )}
                                </div>
                                {reason && <p className="text-[11px] text-slate-400 mt-0.5">{reason}</p>}
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                handleSaveItemToMemory(
                                  title,
                                  reason || 'AI Advisor Action Step',
                                  'note',
                                  `cockpit-donext-${idx}`
                                )
                              }
                              disabled={isSaved}
                              className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer flex-shrink-0 ${
                                isSaved
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {isSaved ? <Check className="w-3 h-3 text-emerald-400" /> : <Bookmark className="w-3 h-3" />}
                              <span>{isSaved ? 'บันทึกแล้ว' : 'บันทึก'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-200 leading-relaxed font-mono">{String(aiAdvice.doNext)}</p>
                )}
              </div>
            )}

            {/* 3. DO NOT PRIORITIZE YET */}
            {aiAdvice.doNotPrioritizeYet && (
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-slate-400 font-bold text-xs flex items-center gap-1">
                    <span>🛡️ DO NOT PRIORITIZE YET (ยังไม่ต้องทำตอนนี้):</span>
                  </div>
                  <button
                    onClick={() =>
                      handleSaveItemToMemory(
                        `Decision: ไม่ต้องรีบทำ (${project.name})`,
                        Array.isArray(aiAdvice.doNotPrioritizeYet)
                          ? aiAdvice.doNotPrioritizeYet.join('\n• ')
                          : String(aiAdvice.doNotPrioritizeYet),
                        'decision',
                        'cockpit-nopriority-1'
                      )
                    }
                    disabled={savedMemoryIds['cockpit-nopriority-1']}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      savedMemoryIds['cockpit-nopriority-1']
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {savedMemoryIds['cockpit-nopriority-1'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Bookmark className="w-3 h-3" />}
                    <span>{savedMemoryIds['cockpit-nopriority-1'] ? 'บันทึกแล้ว ✓' : 'บันทึกเป็นการตัดสินใจ'}</span>
                  </button>
                </div>

                {Array.isArray(aiAdvice.doNotPrioritizeYet) ? (
                  <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-1">
                    {aiAdvice.doNotPrioritizeYet.map((item: any, idx: number) => (
                      <li key={idx}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 leading-relaxed">{String(aiAdvice.doNotPrioritizeYet)}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            💡 กดปุ่ม <strong>[✨ ขอคำแนะนำ AI]</strong> เพื่อให้ Typhoon วิเคราะห์ลำดับงานที่ควรทำ ติ๊กเลือกข้อที่ต้องการ แล้วกดบันทึกลงไทม์ไลน์ความทรงจำได้ทันที!
          </p>
        )}
      </section>

      {/* 🧠 PROJECT MEMORY TIMELINE (Timeline of Notes, Decisions & Progress) */}
      <section className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">🧠 PROJECT MEMORY TIMELINE (ความจำและประวัติการตัดสินใจ)</h3>
              <p className="text-[11px] text-slate-400">เปิดกลับมาอีก 3 เดือนก็รู้ว่าทำไมถึงตัดสินใจแบบนั้น</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddMemoryModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ บันทึกความจำ</span>
          </button>
        </div>

        {/* Timeline Items */}
        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800 pl-8">
          {memories.map((entry) => (
            <div key={entry.id} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-8 top-1.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                  entry.type === 'decision'
                    ? 'bg-amber-400'
                    : entry.type === 'milestone'
                    ? 'bg-emerald-400'
                    : entry.type === 'blocker'
                    ? 'bg-rose-400'
                    : 'bg-indigo-400'
                }`}
              />

              <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-all space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{entry.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-slate-800 text-slate-300">
                      {entry.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{entry.eventDate}</span>
                </div>
                {entry.content && <p className="text-xs text-slate-300">{entry.content}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ADD MEMORY MODAL */}
      {showAddMemoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">🧠 บันทึก Project Memory / Decision</h3>

            <form onSubmit={handleAddMemory} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">หัวข้อเหตุการณ์ / การตัดสินใจ:</label>
                <input
                  type="text"
                  required
                  value={newMemoryTitle}
                  onChange={(e) => setNewMemoryTitle(e.target.value)}
                  placeholder="เช่น ตัดสินใจย้ายมาใช้ SQLite Native..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">ประเภท (Type):</label>
                  <select
                    value={newMemoryType}
                    onChange={(e) => setNewMemoryType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="decision">💡 Decision (การตัดสินใจ)</option>
                    <option value="note">📝 Note (บันทึกงาน)</option>
                    <option value="milestone">🏆 Milestone (ความสำเร็จ)</option>
                    <option value="blocker">⚠️ Blocker (ปัญหาที่พบ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">วันที่ (Date):</label>
                  <input
                    type="date"
                    required
                    value={newMemoryDate}
                    onChange={(e) => setNewMemoryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">รายละเอียดเพิ่มเติม:</label>
                <textarea
                  rows={3}
                  value={newMemoryContent}
                  onChange={(e) => setNewMemoryContent(e.target.value)}
                  placeholder="เช่น เพื่อลดความหน่วงในการสแกนลงเหลือต่ำกว่า 5ms..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemoryModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold shadow-md cursor-pointer"
                >
                  บันทึก Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
