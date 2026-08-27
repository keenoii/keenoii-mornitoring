'use client';

import React from 'react';
import { Move, Plus, Image as ImageIcon, Copy, Check, Save } from 'lucide-react';
import { OfficeLayoutTheme } from '@/lib/office-layout-config';

interface OfficeLayoutStudioToolbarProps {
  isEditMode: boolean;
  copiedSuccess: boolean;
  saveSuccess: boolean;
  onAddPanel: (roomKey: keyof OfficeLayoutTheme['panels']) => void;
  onOpenBgModal: () => void;
  onCopyJson: () => void;
  onResetLayout: () => void;
  onSaveLayout: () => void;
}

export const OfficeLayoutStudioToolbar: React.FC<OfficeLayoutStudioToolbarProps> = ({
  isEditMode,
  copiedSuccess,
  saveSuccess,
  onAddPanel,
  onOpenBgModal,
  onCopyJson,
  onResetLayout,
  onSaveLayout,
}) => {
  if (!isEditMode) return null;

  return (
    <div className="absolute top-16 left-4 right-4 z-40 p-3 bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between flex-wrap gap-2 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-black text-amber-400 flex items-center gap-1">
          <Move className="w-3.5 h-3.5" />
          <span>ลากย้ายตำแหน่งหน้าจอได้อิสระ</span>
        </span>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Add Desks Dropdown Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAddPanel('warroom')}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> War Room
          </button>
          <button
            onClick={() => onAddPanel('web')}
            className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/50 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Web
          </button>
          <button
            onClick={() => onAddPanel('ai')}
            className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> AI Lab
          </button>
          <button
            onClick={() => onAddPanel('infra')}
            className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> NOC
          </button>
          <button
            onClick={() => onAddPanel('dormant')}
            className="px-2.5 py-1 bg-slate-700/40 hover:bg-slate-700/60 text-slate-300 border border-slate-600 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Sofa
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenBgModal}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center gap-1 cursor-pointer border border-slate-700"
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>เปลี่ยนรูปพื้นหลัง</span>
        </button>

        <button
          onClick={onCopyJson}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center gap-1 cursor-pointer border border-slate-700"
        >
          {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedSuccess ? 'Copied!' : 'Copy JSON'}</span>
        </button>

        <button
          onClick={onResetLayout}
          className="px-3 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 rounded-xl font-semibold cursor-pointer"
        >
          รีเซ็ตค่าเริ่มต้น
        </button>

        <button
          onClick={onSaveLayout}
          className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer"
        >
          {saveSuccess ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4 text-white" />}
          <span>{saveSuccess ? 'บันทึกสำเร็จ!' : '💾 บันทึกผังห้อง'}</span>
        </button>
      </div>
    </div>
  );
};
