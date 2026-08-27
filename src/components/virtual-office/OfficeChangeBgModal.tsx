'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, X, Check, Sparkles, Plus, ExternalLink } from 'lucide-react';
import { BACKGROUND_PRESETS, BackgroundPreset } from '@/lib/office-buildings-config';

interface OfficeChangeBgModalProps {
  isOpen: boolean;
  currentBg: string;
  onClose: () => void;
  onApply: (newSrc: string) => void;
}

export const OfficeChangeBgModal: React.FC<OfficeChangeBgModalProps> = ({
  isOpen,
  currentBg,
  onClose,
  onApply,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(currentBg);
  const [customInput, setCustomInput] = useState<string>(currentBg.startsWith('http') || !BACKGROUND_PRESETS.some(p => p.imageSrc === currentBg) ? currentBg : '');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(!BACKGROUND_PRESETS.some(p => p.imageSrc === currentBg));

  if (!isOpen) return null;

  const handleApplyPreset = (preset: BackgroundPreset) => {
    setSelectedPreset(preset.imageSrc);
    setIsCustomMode(false);
    onApply(preset.imageSrc);
    onClose();
  };

  const handleApplyCustom = () => {
    if (customInput.trim()) {
      onApply(customInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ImageIcon className="w-4 h-4" />
              </span>
              <span>🖼️ เลือกภาพพื้นหลังสำนักงาน (Office Background)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              เลือกธีมสำเร็จรูป หรือระบุภาพบรรยากาศห้องทำงานที่คุณต้องการ
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Themes Gallery */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>ธีมพื้นหลังมาตรฐาน (Standard Presets):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BACKGROUND_PRESETS.map((preset) => {
              const isCurrent = currentBg === preset.imageSrc && !isCustomMode;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`group p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                    isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/80 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative">
                      <img
                        src={preset.thumbnail}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/room/room-office.png';
                        }}
                      />
                      <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-indigo-300 border border-indigo-500/30">
                        {preset.tag}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-xs group-hover:text-indigo-300 transition-colors">
                        {preset.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 mt-2 border-t border-slate-900 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">1400x788</span>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> ใช้งานอยู่
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-indigo-400 group-hover:underline">
                        เลือกใช้ธีมนี้
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Image URL / Path Input */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>🔗 หรือใช้ไฟล์รูปภาพของตนเอง (Custom Image / URL):</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                setIsCustomMode(true);
              }}
              placeholder="เช่น /room/my-studio.png หรือ https://images.unsplash.com/..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleApplyCustom}
              disabled={!customInput.trim()}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex-shrink-0"
            >
              นำภาพมาใช้
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            💡 <strong>คำแนะนำ:</strong> สามารถนำรูปภาพ <code className="text-indigo-300 font-mono">.png / .jpg</code> ไปวางไว้ในโฟลเดอร์ <code className="text-indigo-300 font-mono">public/room/</code> แล้วพิมพ์พาธได้ทันที
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
