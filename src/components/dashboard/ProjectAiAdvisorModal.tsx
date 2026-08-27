'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  Bot,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Target,
  ExternalLink,
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
  if (!project) return null;

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
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="ตั้งค่า API Key"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={onGenerateAdvice}
              disabled={generatingAdvice}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1 shadow-sm"
            >
              <Bot className={`w-3.5 h-3.5 ${generatingAdvice ? 'animate-spin' : ''}`} />
              <span>{generatingAdvice ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ด้วย AI'}</span>
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

        {/* AI Advice Output Content */}
        {aiAdvice ? (
          <div className="space-y-3 text-xs animate-fadeIn">
            {/* Diagnosis */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="font-bold text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>🩺 การวินิจฉัย (Diagnosis):</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{aiAdvice.diagnosis}</p>
            </div>

            {/* DO NEXT Actions */}
            {aiAdvice.doNext && (
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <span>✅ สิ่งที่ควรทำต่อไป (DO NEXT):</span>
                </div>
                {Array.isArray(aiAdvice.doNext) ? (
                  <div className="space-y-1.5">
                    {aiAdvice.doNext.map((item: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-emerald-500/20 text-slate-200">
                        <div className="flex items-center justify-between font-bold text-emerald-300">
                          <span>{typeof item === 'object' ? item.action : item}</span>
                          {item.estimatedGain && (
                            <span className="text-[10px] font-mono text-emerald-400">+{item.estimatedGain} pts</span>
                          )}
                        </div>
                        {item.reason && <p className="text-[11px] text-slate-400 mt-0.5">{item.reason}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-200 leading-relaxed font-mono">{String(aiAdvice.doNext)}</p>
                )}
              </div>
            )}

            {/* DO NOT PRIORITIZE YET */}
            {aiAdvice.doNotPrioritizeYet && (
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-400 flex items-center gap-1">
                  <span>🛡️ สิ่งที่ยังไม่ต้องรีบทำ (Do Not Prioritize Yet):</span>
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
            <p>กดปุ่ม &quot;วิเคราะห์ด้วย AI&quot; เพื่อสร้างคำแนะนำการพัฒนาและลดหนี้ทางเทคนิค</p>
          </div>
        )}

        {/* Bottom Link */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
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
