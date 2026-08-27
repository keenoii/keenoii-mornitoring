'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Bot,
  Sparkles,
  SlidersHorizontal,
  ExternalLink,
  CheckSquare,
  Square,
  Bookmark,
  Check,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { ProjectWithHealth } from '@/lib/project-repository';

interface ProjectAiAdvisorModalProps {
  project: ProjectWithHealth | null;
  onClose: () => void;
  aiAdvice: any | null;
  generatingAdvice: boolean;
  onGenerateAdvice: () => void;
  selectedAiProvider: string;
  onSelectAiProvider: (provider: string) => void;
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
  showApiKeyInput: boolean;
  onToggleApiKeyInput: () => void;
}

export const ProjectAiAdvisorModal: React.FC<ProjectAiAdvisorModalProps> = ({
  project,
  onClose,
  aiAdvice,
  generatingAdvice,
  onGenerateAdvice,
  selectedAiProvider,
  onSelectAiProvider,
  customApiKey,
  onSaveApiKey,
  showApiKeyInput,
  onToggleApiKeyInput,
}) => {
  const [selectedDoNextIndices, setSelectedDoNextIndices] = useState<number[]>([]);
  const [savedMemoryIds, setSavedMemoryIds] = useState<Record<string, boolean>>({});
  const [savingMemory, setSavingMemory] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!project) return null;

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
        if (itemKey) {
          setSavedMemoryIds((prev) => ({ ...prev, [itemKey]: true }));
        }
        setSaveSuccessMsg(`บันทึก "${title.slice(0, 30)}..." ลงความทรงจำเรียบร้อยแล้ว`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save memory:', err);
    } finally {
      setSavingMemory(false);
    }
  };

  const handleSaveSelectedDoNext = async () => {
    if (!aiAdvice || !aiAdvice.doNext || !Array.isArray(aiAdvice.doNext)) return;
    setSavingMemory(true);
    let count = 0;

    for (const idx of selectedDoNextIndices) {
      const item = aiAdvice.doNext[idx];
      if (!item) continue;
      const title = typeof item === 'object' ? item.action || item.title : String(item);
      const content = typeof item === 'object' ? item.reason || 'AI Advisor Action Step' : 'AI Advice';

      try {
        await fetch(`/api/projects/${encodeURIComponent(project.id)}/memory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_memory',
            title,
            type: 'note',
            content,
          }),
        });
        setSavedMemoryIds((prev) => ({ ...prev, [`donext-${idx}`]: true }));
        count++;
      } catch {}
    }

    setSavingMemory(false);
    setSaveSuccessMsg(`บันทึก ${count} คำแนะนำลงในความทรงจำของโปรเจกต์เรียบร้อยแล้ว 🧠✨`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/30">
                AI Engineering Advisor
              </span>
              <span className="text-xs text-slate-400 font-mono">Evidence-Based</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{project.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Provider Control Bar */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">LLM Provider:</span>
            <select
              value={selectedAiProvider}
              onChange={(e) => onSelectAiProvider(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="typhoon">🇹🇭 Typhoon v2.5 (30B Agentic)</option>
              <option value="ollama">💻 Local Ollama (qwen2.5-coder)</option>
              <option value="gemini">🌐 Google Gemini 1.5</option>
              <option value="rules">📐 Rule Engine (100% Offline)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleApiKeyInput}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              title="ตั้งค่า API Key"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={onGenerateAdvice}
              disabled={generatingAdvice}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-all"
            >
              <Bot className={`w-3.5 h-3.5 ${generatingAdvice ? 'animate-spin' : ''}`} />
              <span>{generatingAdvice ? 'กำลังวิเคราะห์...' : 'ขอคำแนะนำ AI'}</span>
            </button>
          </div>
        </div>

        {/* API Key Input Accordion */}
        {showApiKeyInput && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
            <label className="text-slate-400 block font-mono">Custom API Key (Saved locally in browser):</label>
            <input
              type="password"
              value={customApiKey}
              onChange={(e) => onSaveApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
            />
          </div>
        )}

        {/* Global Save Success Notification */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center gap-2 text-xs text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
        )}

        {/* AI Advice Output Content */}
        {aiAdvice ? (
          <div className="space-y-3 text-xs animate-fadeIn">
            {/* Diagnosis */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="font-bold text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>🩺 การวินิจฉัย (Diagnosis):</span>
                </div>
                <button
                  onClick={() =>
                    handleSaveItemToMemory(
                      `Diagnosis: ${project.name}`,
                      aiAdvice.diagnosis || 'AI Diagnosis',
                      'note',
                      'diag-1'
                    )
                  }
                  disabled={savedMemoryIds['diag-1']}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    savedMemoryIds['diag-1']
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {savedMemoryIds['diag-1'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Bookmark className="w-3 h-3" />}
                  <span>{savedMemoryIds['diag-1'] ? 'บันทึกแล้ว ✓' : 'บันทึกลงความทรงจำ'}</span>
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed">{aiAdvice.diagnosis}</p>
            </div>

            {/* DO NEXT Actions */}
            {aiAdvice.doNext && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                    <span>✅ สิ่งที่ควรทำต่อไป (DO NEXT):</span>
                  </div>
                  {Array.isArray(aiAdvice.doNext) && selectedDoNextIndices.length > 0 && (
                    <button
                      onClick={handleSaveSelectedDoNext}
                      disabled={savingMemory}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-all"
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
                      const isSaved = savedMemoryIds[`donext-${idx}`];
                      const title = typeof item === 'object' ? item.action : String(item);
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
                                  `donext-${idx}`
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

            {/* DO NOT PRIORITIZE YET */}
            {aiAdvice.doNotPrioritizeYet && (
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-400 flex items-center gap-1">
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
                        'nopriority-1'
                      )
                    }
                    disabled={savedMemoryIds['nopriority-1']}
                    className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      savedMemoryIds['nopriority-1']
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {savedMemoryIds['nopriority-1'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Bookmark className="w-3 h-3" />}
                    <span>{savedMemoryIds['nopriority-1'] ? 'บันทึกแล้ว ✓' : 'บันทึกเป็นการตัดสินใจ'}</span>
                  </button>
                </div>

                {Array.isArray(aiAdvice.doNotPrioritizeYet) ? (
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    {aiAdvice.doNotPrioritizeYet.map((item: any, idx: number) => (
                      <li key={idx} className="text-[11px]">
                        {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 leading-relaxed">{String(aiAdvice.doNotPrioritizeYet)}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <Bot className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>กดปุ่ม &quot;ขอคำแนะนำ AI&quot; เพื่อวิเคราะห์คำแนะนำและเลือกติ๊กบันทึกลงความทรงจำของโปรเจกต์</p>
          </div>
        )}

        {/* Bottom Link */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
          <div className="text-[11px] text-slate-500">
            💡 คำแนะนำที่บันทึกจะไปปรากฏในไทม์ไลน์ Project Memory & Cockpit ถาวร
          </div>
          <Link
            href={`/projects/${project.id}`}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>🧠 เปิดหน้า Project Memory เต็มรูปแบบ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
