'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Trash2, Eye, EyeOff, Search, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { MonitoredRoot } from './WorkspaceRootsBar';
import { ProjectWithHealth } from '@/lib/project-repository';

interface ManageWorkspacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  monitoredRoots: MonitoredRoot[];
  newRootName: string;
  setNewRootName: (name: string) => void;
  newRootPath: string;
  setNewRootPath: (path: string) => void;
  onAddRoot: () => void;
  onDeleteRoot: (id: string) => void;
  allProjects?: ProjectWithHealth[];
  hiddenProjectIds?: string[];
  onToggleHideProject?: (id: string) => void;
  onUnhideAll?: () => void;
}

export const ManageWorkspacesModal: React.FC<ManageWorkspacesModalProps> = ({
  isOpen,
  onClose,
  monitoredRoots,
  newRootName,
  setNewRootName,
  newRootPath,
  setNewRootPath,
  onAddRoot,
  onDeleteRoot,
  allProjects = [],
  hiddenProjectIds = [],
  onToggleHideProject,
  onUnhideAll,
}) => {
  const [activeTab, setActiveTab] = useState<'roots' | 'hide'>('roots');
  const [hideSearchQuery, setHideSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredHideList = allProjects.filter((p) => {
    if (!hideSearchQuery.trim()) return true;
    const q = hideSearchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.path.toLowerCase().includes(q) ||
      p.detectedType.primaryType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col justify-between">
        {/* Header with Tabs */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-emerald-400" />
              <span>การตั้งค่าและจัดการโฟลเดอร์</span>
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('roots')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'roots'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>โฟลเดอร์หลัก ({monitoredRoots.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('hide')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'hide'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>ซ่อน/ปิดใช้งานโฟลเดอร์ ({hiddenProjectIds.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Monitored Roots */}
        {activeTab === 'roots' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Existing Roots List */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">โฟลเดอร์ที่มอนิเตอร์อยู่:</label>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {monitoredRoots.map((root) => (
                  <div
                    key={root.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{root.icon || '📁'}</span>
                        <span>{root.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-sm">{root.path}</div>
                    </div>

                    {monitoredRoots.length > 1 && (
                      <button
                        onClick={() => onDeleteRoot(root.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="ลบโฟลเดอร์นี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Root Form */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5 text-xs">
              <span className="font-bold text-emerald-400 block">+ เพิ่มโฟลเดอร์ใหม่:</span>
              <div>
                <label className="text-slate-400 block mb-0.5">ชื่อโฟลเดอร์ (Label):</label>
                <input
                  type="text"
                  value={newRootName}
                  onChange={(e) => setNewRootName(e.target.value)}
                  placeholder="เช่น My Client Projects"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Absolute Path บนเครื่อง:</label>
                <input
                  type="text"
                  value={newRootPath}
                  onChange={(e) => setNewRootPath(e.target.value)}
                  placeholder="เช่น D:\MyProject\clients"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
              <button
                onClick={onAddRoot}
                disabled={!newRootName.trim() || !newRootPath.trim()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold cursor-pointer transition-all"
              >
                เพิ่มโฟลเดอร์นี้
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Hide / Disable Projects & Subfolders */}
        {activeTab === 'hide' && (
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={hideSearchQuery}
                  onChange={(e) => setHideSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อโฟลเดอร์หรือ subfolder เพื่อซ่อน..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500"
                />
              </div>
              {hiddenProjectIds.length > 0 && onUnhideAll && (
                <button
                  onClick={onUnhideAll}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>กู้คืนทั้งหมด</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              ติ๊ก <span className="text-emerald-400 font-bold">เปิดใช้งาน</span> หรือ <span className="text-rose-400 font-bold">ซ่อน</span> โฟลเดอร์ย่อยที่ไม่ต้องการให้แสดงบน Portfolio:
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {filteredHideList.map((p) => {
                const isHidden = hiddenProjectIds.includes(p.id) || hiddenProjectIds.includes(p.path);
                return (
                  <div
                    key={p.id}
                    onClick={() => onToggleHideProject && onToggleHideProject(p.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isHidden
                        ? 'bg-slate-950/60 border-rose-900/40 text-slate-500 opacity-60 hover:opacity-100'
                        : 'bg-slate-950 border-slate-800 text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isHidden ? (
                        <Square className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      ) : (
                        <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold flex items-center gap-1.5 truncate">
                          <span className={isHidden ? 'line-through text-slate-400' : 'text-white'}>
                            {p.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded text-slate-400">
                            {p.detectedType.primaryType}
                          </span>
                          {isHidden && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded font-mono font-bold">
                              ซ่อนอยู่
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-sm">
                          {p.path}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHideProject && onToggleHideProject(p.id);
                      }}
                      className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${
                        isHidden
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isHidden ? 'ซ่อน' : 'แสดง'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-800/80">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
