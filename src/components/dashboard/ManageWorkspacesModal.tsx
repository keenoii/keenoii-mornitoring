'use client';

import React from 'react';
import { X, FolderPlus, Trash2 } from 'lucide-react';
import { MonitoredRoot } from './WorkspaceRootsBar';

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
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-emerald-400" />
            <span>จัดการโฟลเดอร์สำหรับมอนิเตอร์ (Workspace Roots)</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Roots List */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">โฟลเดอร์ที่มอนิเตอร์อยู่:</label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
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
                  <div className="text-[11px] text-slate-400 font-mono truncate">{root.path}</div>
                </div>

                {monitoredRoots.length > 1 && (
                  <button
                    onClick={() => onDeleteRoot(root.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add New Root Form */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2 text-xs">
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
            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold"
          >
            เพิ่มโฟลเดอร์นี้
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
