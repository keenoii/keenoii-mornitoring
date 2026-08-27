'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

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
  const [inputVal, setInputVal] = useState<string>(currentBg);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <span>🖼️ เปลี่ยนภาพพื้นหลังสำนักงาน</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <label className="text-slate-300 font-semibold block">
            พาธไฟล์รูปภาพ (Relative หรือ URL):
          </label>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="/room/room-office.png หรือ https://..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="text-[11px] text-slate-400">
            นำภาพใหม่ไปวางในโฟลเดอร์ <code className="text-indigo-300 font-mono">public/room/</code> แล้วระบุชื่อไฟล์ เช่น <code className="text-indigo-300 font-mono">/room/my-new-room.png</code>
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onApply(inputVal)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            นำภาพมาใช้
          </button>
        </div>
      </div>
    </div>
  );
};
