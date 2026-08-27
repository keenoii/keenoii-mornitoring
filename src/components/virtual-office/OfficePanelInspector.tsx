'use client';

import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { PanelCoordinate } from '@/lib/office-layout-config';

interface OfficePanelInspectorProps {
  isEditMode: boolean;
  selectedCoord: PanelCoordinate | undefined;
  onClose: () => void;
  onUpdateProperty: (panelId: string, updates: Partial<PanelCoordinate>) => void;
  onDeletePanel: (panelId: string) => void;
}

export const OfficePanelInspector: React.FC<OfficePanelInspectorProps> = ({
  isEditMode,
  selectedCoord,
  onClose,
  onUpdateProperty,
  onDeletePanel,
}) => {
  if (!isEditMode || !selectedCoord) return null;

  return (
    <div className="absolute top-32 right-4 z-40 w-72 p-4 bg-slate-900/95 border-2 border-amber-400/80 rounded-2xl shadow-2xl backdrop-blur-md space-y-3 text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="font-bold text-amber-300">
          ⚙️ ปรับแต่งจอ: <span className="font-mono text-white">{selectedCoord.id}</span>
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {/* Position X (Left) */}
        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Left (X):</span>
            <span className="text-amber-400 font-mono">{selectedCoord.left}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={parseFloat(selectedCoord.left) || 50}
            onChange={(e) => onUpdateProperty(selectedCoord.id, { left: `${e.target.value}%` })}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Position Y (Top) */}
        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Top (Y):</span>
            <span className="text-amber-400 font-mono">{selectedCoord.top}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={parseFloat(selectedCoord.top) || 50}
            onChange={(e) => onUpdateProperty(selectedCoord.id, { top: `${e.target.value}%` })}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Width & Height */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-slate-400 block mb-1">Width (กว้าง):</label>
            <input
              type="text"
              value={selectedCoord.width || '108px'}
              onChange={(e) => onUpdateProperty(selectedCoord.id, { width: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Height (สูง):</label>
            <input
              type="text"
              value={selectedCoord.height || '58px'}
              onChange={(e) => onUpdateProperty(selectedCoord.id, { height: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
        <button
          onClick={() => onDeletePanel(selectedCoord.id)}
          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>ลบจอนี้</span>
        </button>
        <span className="text-[10px] text-slate-500">ลากบนภาพได้สดๆ</span>
      </div>
    </div>
  );
};
