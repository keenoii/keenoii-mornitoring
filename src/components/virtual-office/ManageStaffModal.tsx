'use client';

import React, { useState } from 'react';
import {
  Users,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  MapPin,
  FolderGit2,
  Smile,
  Shield,
  Activity,
} from 'lucide-react';
import {
  OfficeStaffMember,
  STAFF_ROLES,
  AVAILABLE_EMOJIS,
} from '@/lib/office-buildings-config';
import { DEFAULT_OFFICE_LAYOUT } from '@/lib/office-layout-config';
import { ProjectWithHealth } from '@/lib/project-repository';

interface ManageStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: OfficeStaffMember[];
  activeBuildingId: string;
  allProjects: ProjectWithHealth[];
  onAddStaff: (newStaff: OfficeStaffMember) => void;
  onUpdateStaff: (updated: OfficeStaffMember) => void;
  onDeleteStaff: (staffId: string) => void;
}

const DESK_OPTIONS = [
  // War Room
  { id: 'war-1', label: '🔴 War Room Desk 1 (Lead Desk)', roomType: 'warroom' },
  { id: 'war-2', label: '🔴 War Room Desk 2', roomType: 'warroom' },
  { id: 'war-3', label: '🔴 War Room Desk 3', roomType: 'warroom' },
  // Web Studio
  { id: 'web-1', label: '🌐 Web Studio Desk 1', roomType: 'web' },
  { id: 'web-2', label: '🌐 Web Studio Desk 2', roomType: 'web' },
  { id: 'web-3', label: '🌐 Web Studio Desk 3', roomType: 'web' },
  // AI Lab
  { id: 'ai-1', label: '🤖 AI Research Desk 1', roomType: 'ai' },
  { id: 'ai-2', label: '🤖 AI Research Desk 2', roomType: 'ai' },
  { id: 'ai-3', label: '🤖 AI Research Desk 3', roomType: 'ai' },
  // NOC / Server Room
  { id: 'noc-1', label: '⚡ NOC Server Desk 1', roomType: 'noc' },
  { id: 'noc-2', label: '⚡ NOC Server Desk 2', roomType: 'noc' },
  // Dormant Lounge
  { id: 'sofa-1', label: '🛋️ Sofa Lounge 1', roomType: 'dormant' },
  { id: 'sofa-2', label: '🛋️ Sofa Lounge 2', roomType: 'dormant' },
  { id: 'sofa-3', label: '🛋️ Sofa Lounge 3', roomType: 'dormant' },
  { id: 'sofa-4', label: '🛋️ Sofa Lounge 4', roomType: 'dormant' },
] as const;

export const ManageStaffModal: React.FC<ManageStaffModalProps> = ({
  isOpen,
  onClose,
  staffList,
  activeBuildingId,
  allProjects,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
}) => {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<OfficeStaffMember['role']>('Fullstack');
  const [avatarEmoji, setAvatarEmoji] = useState<string>('👨‍💻');
  const [deskId, setDeskId] = useState<string>('web-1');
  const [status, setStatus] = useState<OfficeStaffMember['status']>('active');
  const [statusText, setStatusText] = useState<string>('');
  const [assignedProjectId, setAssignedProjectId] = useState<string>('');

  if (!isOpen) return null;

  const currentBuildingStaff = staffList.filter(
    (s) => s.buildingId === activeBuildingId
  );

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingStaffId(null);
    setName('');
    setRole('Fullstack');
    setAvatarEmoji('👨‍💻');
    // Pick first unoccupied desk
    const occupiedDesks = currentBuildingStaff.map((s) => s.deskId);
    const freeDesk = DESK_OPTIONS.find((d) => !occupiedDesks.includes(d.id));
    setDeskId(freeDesk?.id || 'web-1');
    setStatus('active');
    setStatusText('');
    setAssignedProjectId('');
  };

  const handleStartEdit = (staff: OfficeStaffMember) => {
    setEditingStaffId(staff.id);
    setIsCreating(false);
    setName(staff.name);
    setRole(staff.role);
    setAvatarEmoji(staff.avatarEmoji);
    setDeskId(staff.deskId);
    setStatus(staff.status);
    setStatusText(staff.statusText || '');
    setAssignedProjectId(staff.assignedProjectId || '');
  };

  const handleSaveForm = () => {
    if (!name.trim()) return;

    const matchedDesk = DESK_OPTIONS.find((d) => d.id === deskId);
    const roomType = (matchedDesk?.roomType || 'web') as OfficeStaffMember['roomType'];
    const matchedProject = allProjects.find((p) => p.id === assignedProjectId);

    if (isCreating) {
      const newStaff: OfficeStaffMember = {
        id: `staff-${Date.now()}`,
        name: name.trim(),
        role,
        avatarEmoji,
        buildingId: activeBuildingId,
        deskId,
        roomType,
        status,
        statusText: statusText.trim() || undefined,
        assignedProjectId: assignedProjectId || undefined,
        assignedProjectName: matchedProject?.name || undefined,
        createdAt: new Date().toISOString(),
      };
      onAddStaff(newStaff);
      setIsCreating(false);
    } else if (editingStaffId) {
      const existing = staffList.find((s) => s.id === editingStaffId);
      if (existing) {
        const updated: OfficeStaffMember = {
          ...existing,
          name: name.trim(),
          role,
          avatarEmoji,
          deskId,
          roomType,
          status,
          statusText: statusText.trim() || undefined,
          assignedProjectId: assignedProjectId || undefined,
          assignedProjectName: matchedProject?.name || undefined,
        };
        onUpdateStaff(updated);
        setEditingStaffId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-lg">
                👥 จัดการพนักงานประจำโต๊ะ (Desk Staff & Workers)
              </h3>
              <p className="text-xs text-slate-400">
                เพิ่ม ลบ หรือย้ายตำแหน่งพนักงานและ AI Bot ประจำแต่ละโต๊ะในอาคาร
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create / Edit Form */}
        {(isCreating || editingStaffId) && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>{isCreating ? '➕ บรรจุพนักงานใหม่ลงโต๊ะ (Add Staff)' : '✏️ แก้ไขข้อมูลพนักงาน'}</span>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingStaffId(null);
                }}
                className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  ชื่อพนักงาน / บอท (Name):
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น สมชาย หรือ AI Co-pilot"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  ตำแหน่ง (Role):
                </label>
                <select
                  value={role}
                  onChange={(e) => {
                    const r = e.target.value as OfficeStaffMember['role'];
                    setRole(r);
                    const matchedRole = STAFF_ROLES.find((ro) => ro.id === r);
                    if (matchedRole) setAvatarEmoji(matchedRole.defaultEmoji);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.defaultEmoji} {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Emoji Selector */}
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1 flex items-center justify-between">
                  <span>เลือก Avatar / Sprite:</span>
                  <span className="text-lg">{avatarEmoji}</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900 rounded-xl border border-slate-800">
                  {AVAILABLE_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatarEmoji(emoji)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all cursor-pointer ${
                        avatarEmoji === emoji
                          ? 'bg-emerald-500/30 border border-emerald-400 scale-110'
                          : 'bg-slate-950 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  โต๊ะทำงานที่นั่ง (Assigned Desk):
                </label>
                <select
                  value={deskId}
                  onChange={(e) => setDeskId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-xs"
                >
                  {DESK_OPTIONS.map((d) => {
                    const isOccupied = currentBuildingStaff.some(
                      (s) => s.deskId === d.id && s.id !== editingStaffId
                    );
                    return (
                      <option key={d.id} value={d.id}>
                        {d.label} {isOccupied ? '(มีคนนั่งแล้ว)' : '✨ (โต๊ะว่าง)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  สถานะการทำงาน (Status):
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-xs"
                >
                  <option value="active">🟢 Active (กำลังพิมพ์งาน/เขียนโค้ด)</option>
                  <option value="thinking">🧠 Thinking (กำลังคิด/รัน AI)</option>
                  <option value="fixing">🔧 Fixing (กำลังแก้บั๊ก/DevOps)</option>
                  <option value="meeting">👥 Meeting (กำลังประชุม)</option>
                  <option value="coffee">☕ Coffee Break (พักดื่มกาแฟ)</option>
                  <option value="offline">💤 Offline (หลับ/โซฟา)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1">
                  ผูกกับโปรเจกต์ที่รับผิดชอบ (Optional Project Link):
                </label>
                <select
                  value={assignedProjectId}
                  onChange={(e) => setAssignedProjectId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-xs"
                >
                  <option value="">-- ไม่ได้ผูกโปรเจกต์ (พนักงานอิสระ) --</option>
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.detectedType.primaryType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleSaveForm}
                disabled={!name.trim()}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกพนักงาน</span>
              </button>
            </div>
          </div>
        )}

        {/* Existing Staff List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>
              พนักงานในอาคารนี้ ({currentBuildingStaff.length} คน):
            </span>
            {!isCreating && !editingStaffId && (
              <button
                onClick={handleStartCreate}
                className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มพนักงานลงโต๊ะ</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {currentBuildingStaff.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>ยังไม่มีพนักงานในอาคารนี้ กดปุ่ม <strong>[+ เพิ่มพนักงานลงโต๊ะ]</strong> เพื่อเริ่มบรรจุทีมงาน</p>
              </div>
            ) : (
              currentBuildingStaff.map((staff) => {
                const roleBadge = STAFF_ROLES.find((r) => r.id === staff.role);
                const deskLabel =
                  DESK_OPTIONS.find((d) => d.id === staff.deskId)?.label ||
                  staff.deskId;

                return (
                  <div
                    key={staff.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                        {staff.avatarEmoji}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white text-xs truncate">
                            {staff.name}
                          </h4>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${
                              roleBadge?.color || 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {staff.role}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1 font-mono text-emerald-300/90 truncate">
                            <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <span>{deskLabel}</span>
                          </span>
                        </div>

                        {staff.assignedProjectName && (
                          <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-mono mt-0.5 truncate">
                            <FolderGit2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                            <span className="truncate">ดูแล: {staff.assignedProjectName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleStartEdit(staff)}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                        title="แก้ไขข้อมูลหรือย้ายโต๊ะ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (
                            confirm(`คุณต้องการลบพนักงาน "${staff.name}" ออกจากโต๊ะใช่หรือไม่?`)
                          ) {
                            onDeleteStaff(staff.id);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-rose-400 border border-slate-700 hover:border-rose-700 text-xs transition-colors cursor-pointer"
                        title="ลบพนักงานออกจากโต๊ะ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
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
