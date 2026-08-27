'use client';

import React from 'react';
import { Eye, Play, Pause, ZoomIn, ZoomOut, RotateCcw, Sliders, Maximize2, Minimize2 } from 'lucide-react';

interface OfficeTopToolbarProps {
  overlayMode: 'none' | 'health' | 'activity' | 'progress';
  setOverlayMode: (mode: 'none' | 'health' | 'activity' | 'progress') => void;
  isEditMode: boolean;
  setIsEditMode: (edit: boolean) => void;
  isTourRunning: boolean;
  onStartTour: () => void;
  onStopTour: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const OfficeTopToolbar: React.FC<OfficeTopToolbarProps> = ({
  overlayMode,
  setOverlayMode,
  isEditMode,
  setIsEditMode,
  isTourRunning,
  onStartTour,
  onStopTour,
  onZoomIn,
  onZoomOut,
  onResetView,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  return (
    <div className="p-3.5 px-4 z-30 flex items-center justify-between pointer-events-none flex-wrap gap-2">
      {/* Left: Overlays Selector */}
      <div className="p-1.5 rounded-2xl bg-slate-900/95 border border-slate-800/90 shadow-xl backdrop-blur-md flex items-center gap-1.5 pointer-events-auto text-xs">
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 pl-2 pr-1">
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span>Overlay:</span>
        </span>

        <button
          onClick={() => setOverlayMode('none')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            overlayMode === 'none' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Realistic
        </button>
        <button
          onClick={() => setOverlayMode('health')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            overlayMode === 'health' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          🟢 Health
        </button>
        <button
          onClick={() => setOverlayMode('activity')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            overlayMode === 'activity' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          ⚡ Activity
        </button>
        <button
          onClick={() => setOverlayMode('progress')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            overlayMode === 'progress' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          🎯 Progress
        </button>
      </div>

      {/* Right: Edit Mode, Tour & Zoom Controls */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
            isEditMode
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-300'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isEditMode ? '🛠️ โหมดแก้ไขผังห้อง (Active)' : '🛠️ ปรับแต่งผังห้อง'}</span>
        </button>

        {!isEditMode && (
          <>
            {!isTourRunning ? (
              <button
                onClick={onStartTour}
                className="px-4 py-1.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-950/40 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Office Tour</span>
              </button>
            ) : (
              <button
                onClick={onStopTour}
                className="px-4 py-1.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span>หยุดทัวร์</span>
              </button>
            )}
          </>
        )}

        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
          <button
            onClick={onZoomIn}
            className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
            title="ซูมเข้า"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomOut}
            className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
            title="ซูมออก"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onResetView}
            className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
            title="รีเซ็ตมุมมอง"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={`p-1.5 rounded-xl cursor-pointer transition-all ${
                isFullscreen
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={isFullscreen ? 'ออกจากโหมดเต็มจอ 16:9 (ESC)' : 'แสดงผลเต็มจอ 16:9 (Fullscreen)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
