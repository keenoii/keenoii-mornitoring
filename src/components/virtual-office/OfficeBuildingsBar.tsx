'use client';

import React from 'react';
import {
  Building2,
  Plus,
  Image as ImageIcon,
} from 'lucide-react';
import { OfficeBuilding } from '@/lib/office-buildings-config';

interface OfficeBuildingsBarProps {
  buildings: OfficeBuilding[];
  activeBuildingId: string;
  onSelectBuilding: (id: string) => void;
  onOpenManageBuildings: () => void;
  onOpenChangeBg: () => void;
}

export const OfficeBuildingsBar: React.FC<OfficeBuildingsBarProps> = ({
  buildings,
  activeBuildingId,
  onSelectBuilding,
  onOpenManageBuildings,
  onOpenChangeBg,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
      {/* Left: Building Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 pl-1 pr-1.5 flex-shrink-0">
          <Building2 className="w-4 h-4 text-purple-400" />
          <span>อาคารสำนักงาน:</span>
        </span>

        {buildings.map((bldg) => {
          const isActive = bldg.id === activeBuildingId;
          return (
            <button
              key={bldg.id}
              onClick={() => onSelectBuilding(bldg.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer flex-shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/40 ring-1 ring-white/20'
                  : 'bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              <span>🏢</span>
              <span className="truncate">{bldg.name}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-900 text-purple-300'
                }`}
              >
                {bldg.code}
              </span>
            </button>
          );
        })}

        <button
          onClick={onOpenManageBuildings}
          className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-800 border border-dashed border-purple-500/40 hover:border-purple-400 text-purple-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
          title="เพิ่มอาคารใหม่ หรือจัดการรายชื่ออาคาร"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>เพิ่มอาคาร</span>
        </button>
      </div>

      {/* Right: Quick Tool Buttons */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
        {/* Change Background Button */}
        <button
          onClick={onOpenChangeBg}
          className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/60 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          title="เปลี่ยนภาพพื้นหลังของอาคารนี้"
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>🖼️ เปลี่ยนพื้นหลัง</span>
        </button>
      </div>
    </div>
  );
};
