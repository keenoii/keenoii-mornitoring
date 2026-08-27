'use client';

import React, { useState } from 'react';
import { Building2, X, Plus, Trash2, Edit2, Check, Image as ImageIcon, Sparkles, Layers } from 'lucide-react';
import { OfficeBuilding, BACKGROUND_PRESETS } from '@/lib/office-buildings-config';

interface ManageBuildingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: OfficeBuilding[];
  activeBuildingId: string;
  onSelectBuilding: (id: string) => void;
  onAddBuilding: (newBuilding: OfficeBuilding) => void;
  onDeleteBuilding: (id: string) => void;
  onUpdateBuilding: (updated: OfficeBuilding) => void;
}

export const ManageBuildingsModal: React.FC<ManageBuildingsModalProps> = ({
  isOpen,
  onClose,
  buildings,
  activeBuildingId,
  onSelectBuilding,
  onAddBuilding,
  onDeleteBuilding,
  onUpdateBuilding,
}) => {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formBg, setFormBg] = useState<string>('/room/room-office.png');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingBuildingId(null);
    setFormName('');
    setFormCode(`BLDG-0${buildings.length + 1}`);
    setFormDesc('');
    setFormBg('/room/room-office.png');
  };

  const handleStartEdit = (b: OfficeBuilding) => {
    setEditingBuildingId(b.id);
    setIsCreating(false);
    setFormName(b.name);
    setFormCode(b.code);
    setFormDesc(b.description || '');
    setFormBg(b.bgImageSrc);
  };

  const handleSaveForm = () => {
    if (!formName.trim()) return;

    if (isCreating) {
      const newBldg: OfficeBuilding = {
        id: `bldg-${Date.now()}`,
        name: formName.trim(),
        code: formCode.trim() || `BLDG-0${buildings.length + 1}`,
        description: formDesc.trim(),
        bgImageSrc: formBg.trim() || '/room/room-office.png',
        totalFloors: 1,
      };
      onAddBuilding(newBldg);
      onSelectBuilding(newBldg.id);
      setIsCreating(false);
    } else if (editingBuildingId) {
      const existing = buildings.find((b) => b.id === editingBuildingId);
      if (existing) {
        const updated: OfficeBuilding = {
          ...existing,
          name: formName.trim(),
          code: formCode.trim() || existing.code,
          description: formDesc.trim(),
          bgImageSrc: formBg.trim() || existing.bgImageSrc,
        };
        onUpdateBuilding(updated);
        setEditingBuildingId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-lg">🏢 จัดการอาคารและผังสำนักงาน (Buildings Manager)</h3>
              <p className="text-xs text-slate-400">เพิ่ม ลบ หรือสลับอาคารทำงาน พร้อมกำหนดภาพพื้นหลังเฉพาะของแต่ละอาคาร</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create / Edit Form */}
        {(isCreating || editingBuildingId) && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-3.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-purple-300">
              <span>{isCreating ? '➕ เพิ่มอาคารใหม่ (New Building)' : '✏️ แก้ไขข้อมูลอาคาร'}</span>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingBuildingId(null);
                }}
                className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">ชื่ออาคาร (Building Name):</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น อาคาร 2: SRRU Innovation Lab"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">รหัสอาคาร (Code):</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="เช่น LAB-02 หรือ HQ-01"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1">คำอธิบายอาคาร (Description):</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="เช่น ศูนย์วิจัยและพัฒนา AI, Machine Learning และระบบเว็บแอปพลิเคชัน"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1">ภาพพื้นหลัง (Background Theme):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formBg}
                    onChange={(e) => setFormBg(e.target.value)}
                    placeholder="/room/room-office.png"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <select
                    onChange={(e) => setFormBg(e.target.value)}
                    value={formBg}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                  >
                    {BACKGROUND_PRESETS.map((p) => (
                      <option key={p.id} value={p.imageSrc}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleSaveForm}
                disabled={!formName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกอาคาร</span>
              </button>
            </div>
          </div>
        )}

        {/* Existing Buildings List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>รายการอาคารทั้งหมด ({buildings.length} อาคาร):</span>
            {!isCreating && !editingBuildingId && (
              <button
                onClick={handleStartCreate}
                className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มอาคารใหม่</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {buildings.map((bldg) => {
              const isActive = bldg.id === activeBuildingId;
              return (
                <div
                  key={bldg.id}
                  onClick={() => onSelectBuilding(bldg.id)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/30 ring-1 ring-purple-500/40'
                      : 'bg-slate-950/80 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl border flex-shrink-0 ${
                        isActive
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-xs truncate">{bldg.name}</h4>
                        <span className="px-2 py-0.2 rounded bg-slate-800 text-purple-300 text-[10px] font-mono font-bold border border-slate-700">
                          {bldg.code}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                            กำลังเปิดดู ✓
                          </span>
                        )}
                      </div>
                      {bldg.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{bldg.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-1">
                        <span>🖼️ {bldg.bgImageSrc}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(bldg);
                      }}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                      title="แก้ไขข้อมูลอาคาร"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {buildings.length > 1 && !bldg.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`คุณต้องการลบ "${bldg.name}" ใช่หรือไม่?`)) {
                            onDeleteBuilding(bldg.id);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-rose-400 border border-slate-700 hover:border-rose-700 text-xs transition-colors cursor-pointer"
                        title="ลบอาคารนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
