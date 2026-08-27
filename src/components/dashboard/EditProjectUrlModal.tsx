'use client';

import React, { useState, useEffect } from 'react';
import { X, Globe, Zap, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { ProjectWithHealth } from '@/lib/project-repository';
import { LiveHealthStatus } from '@/services/live-health-service';

interface EditProjectUrlModalProps {
  project: ProjectWithHealth | null;
  onClose: () => void;
  onUrlUpdated: (projectId: string, newUrl: string) => void;
}

export const EditProjectUrlModal: React.FC<EditProjectUrlModalProps> = ({
  project,
  onClose,
  onUrlUpdated,
}) => {
  const [urlInput, setUrlInput] = useState<string>('');
  const [testing, setTesting] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<LiveHealthStatus | null>(null);

  useEffect(() => {
    if (project) {
      const initialUrl = project.healthUrl || project.config?.health_url || '';
      setUrlInput(initialUrl);
      setTestResult(null);
      if (initialUrl) {
        handleTestUrl(initialUrl);
      }
    }
  }, [project]);

  if (!project) return null;

  const handleTestUrl = async (urlToTest: string) => {
    if (!urlToTest.trim()) return;
    setTesting(true);
    try {
      const res = await fetch('/api/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToTest }),
      });
      if (res.ok) {
        const json = await res.json();
        setTestResult(json);
      }
    } catch {}
    finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/projects/update-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          projectPath: project.path,
          healthUrl: urlInput.trim(),
        }),
      });
      if (res.ok) {
        onUrlUpdated(project.id, urlInput.trim());
        onClose();
      }
    } catch {}
    finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fadeIn">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Live Uptime Monitor</span>
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{project.name}</h2>
            <p className="text-xs text-slate-400 font-mono truncate">{project.path}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Production / Live Deploy URL:</span>
              <span className="text-[10px] text-slate-500 font-normal">HTTP หรือ HTTPS</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://my-app.srru.ac.th หรือ https://example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                type="button"
                onClick={() => handleTestUrl(urlInput)}
                disabled={!urlInput.trim() || testing}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'ตรวจ...' : 'ทดสอบ'}</span>
              </button>
            </div>
          </div>

          {/* Test Live Result Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-2xl border text-xs space-y-1.5 animate-fadeIn ${
                testResult.isOnline
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-1.5">
                  {testResult.isOnline ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                  )}
                  <span>
                    {testResult.isOnline ? '🟢 สถานะ: ออนไลน์ (Online)' : '🔴 สถานะ: ออฟไลน์ (Offline / เข้าไม่ได้)'}
                  </span>
                </div>
                {testResult.statusCode && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    HTTP {testResult.statusCode}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                <span>ความเร็วตอบสนอง: <strong className="text-white">{testResult.responseTimeMs} ms</strong></span>
                {testResult.error && <span className="text-rose-400 font-sans">{testResult.error}</span>}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            💡 ระบบจะบันทึก Live URL ลงใน SQLite และไฟล์ <code className="text-emerald-300 font-mono">.project-monitor.yaml</code> ของโครงการโดยอัตโนมัติ เพื่อคอยตรวจสอบ Uptime ตลอดเวลา
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          {urlInput.trim() ? (
            <a
              href={urlInput.startsWith('http') ? urlInput : `https://${urlInput}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>ทดลองเปิดเว็บจริง</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึก Live URL'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
