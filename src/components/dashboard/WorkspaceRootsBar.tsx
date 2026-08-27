'use client';

import React from 'react';
import { FolderTree, FolderPlus } from 'lucide-react';

export interface MonitoredRoot {
  id: string;
  name: string;
  path: string;
  icon?: string;
}

interface WorkspaceRootsBarProps {
  monitoredRoots: MonitoredRoot[];
  activeRootId: string;
  onSelectRoot: (id: string) => void;
  onOpenManageModal: () => void;
}

export const WorkspaceRootsBar: React.FC<WorkspaceRootsBarProps> = ({
  monitoredRoots,
  activeRootId,
  onSelectRoot,
  onOpenManageModal,
}) => {
  return (
    <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1 flex-shrink-0">
          <FolderTree className="w-4 h-4 text-emerald-400" />
          <span>โฟลเดอร์หลัก:</span>
        </span>

        {monitoredRoots.map((root) => {
          const isActive = activeRootId === root.id;
          return (
            <button
              key={root.id}
              onClick={() => onSelectRoot(root.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-950/40 font-semibold'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{root.icon || '📁'}</span>
              <span>{root.name}</span>
            </button>
          );
        })}

        <button
          onClick={() => onSelectRoot('ALL_REGISTERED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border whitespace-nowrap ${
            activeRootId === 'ALL_REGISTERED'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
              : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
          }`}
        >
          <span>🌐 ทุกโฟลเดอร์ที่บันทึกไว้</span>
        </button>
      </div>

      <button
        onClick={onOpenManageModal}
        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer flex-shrink-0 self-start md:self-auto"
      >
        <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
        <span>+ เพิ่ม / จัดการโฟลเดอร์</span>
      </button>
    </div>
  );
};
