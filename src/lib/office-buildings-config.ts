/**
 * Office Buildings, Background Presets, and Staff Member Configuration
 */

export interface BackgroundPreset {
  id: string;
  name: string;
  imageSrc: string;
  thumbnail: string;
  description: string;
  tag: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'cyberpunk-diorama',
    name: 'Cyberpunk Command Center',
    imageSrc: '/room/room-office.png',
    thumbnail: '/room/room-office.png',
    description: 'ห้องทำงานสไตล์ Cyberpunk 2.5D พร้อมจอ Hologram และห้องเซิร์ฟเวอร์',
    tag: 'Classic Default',
  },
  {
    id: 'neon-matrix-studio',
    name: 'Neon Matrix Tech Lab',
    imageSrc: '/room/room-office.png',
    thumbnail: '/room/room-office.png',
    description: 'ศูนย์วิจัยเทคโนโลยี AI และ Data Lab แสงนีออนสีม่วงเข้ม',
    tag: 'AI & Data Lab',
  },
  {
    id: 'minimal-dark-penthouse',
    name: 'Dark Minimalist HQ',
    imageSrc: '/room/room-office.png',
    thumbnail: '/room/room-office.png',
    description: 'สำนักงานสไตล์ Dark Modern เรียบหรูสำหรับทีมบริหารและสถาปัตยกรรมระบบ',
    tag: 'Executive',
  },
];

export interface OfficeStaffMember {
  id: string;
  name: string;
  role: 'Frontend' | 'Backend' | 'Fullstack' | 'DevOps' | 'QA' | 'PM' | 'Lead' | 'AI Agent' | 'Designer';
  avatarEmoji: string;
  buildingId: string;
  deskId: string; // Coordinate id e.g. 'web-1', 'ai-2', 'war-1', 'noc-1'
  roomType: 'warroom' | 'web' | 'ai' | 'noc' | 'dormant';
  status: 'active' | 'thinking' | 'fixing' | 'meeting' | 'offline' | 'coffee';
  statusText?: string;
  assignedProjectId?: string;
  assignedProjectName?: string;
  createdAt: string;
}

export interface OfficeBuilding {
  id: string;
  name: string;
  code: string;
  description?: string;
  bgImageSrc: string;
  isDefault?: boolean;
  totalFloors?: number;
  assignedWorkspaceRoot?: string;
}

export const DEFAULT_BUILDINGS: OfficeBuilding[] = [
  {
    id: 'bldg-main-hq',
    name: 'อาคาร 1: Command Center & Main HQ',
    code: 'HQ-01',
    description: 'ศูนย์บัญชาการหลัก ตรวจสอบสถานะโปรเจกต์เว็บและเซิร์ฟเวอร์ทั้งหมด',
    bgImageSrc: '/room/room-office.png',
    isDefault: true,
    totalFloors: 1,
  },
  {
    id: 'bldg-innovation-lab',
    name: 'อาคาร 2: SRRU Innovation & AI Lab',
    code: 'LAB-02',
    description: 'ศูนย์วิจัยและพัฒนา AI, Machine Learning และระบบอัจฉริยะ',
    bgImageSrc: '/room/room-office.png',
    isDefault: false,
    totalFloors: 1,
  },
];

export const DEFAULT_STAFF_MEMBERS: OfficeStaffMember[] = [
  {
    id: 'staff-1',
    name: 'กิตติ (Lead Architect)',
    role: 'Lead',
    avatarEmoji: '👨‍💻',
    buildingId: 'bldg-main-hq',
    deskId: 'war-1',
    roomType: 'warroom',
    status: 'active',
    statusText: 'กำลังตรวจสอบ Roadmap & Code Health',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'staff-2',
    name: 'สมชาย (Next.js Dev)',
    role: 'Frontend',
    avatarEmoji: '👨‍🎨',
    buildingId: 'bldg-main-hq',
    deskId: 'web-1',
    roomType: 'web',
    status: 'active',
    statusText: 'กำลังแก้ UI Responsive',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'staff-3',
    name: 'วิภา (AI Prompt Engineer)',
    role: 'AI Agent',
    avatarEmoji: '🤖',
    buildingId: 'bldg-main-hq',
    deskId: 'ai-1',
    roomType: 'ai',
    status: 'thinking',
    statusText: 'กำลังเทรน Typhoon v2.5 Advisor',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'staff-4',
    name: 'อนุชา (DevOps & K8s)',
    role: 'DevOps',
    avatarEmoji: '⚡',
    buildingId: 'bldg-main-hq',
    deskId: 'noc-1',
    roomType: 'noc',
    status: 'active',
    statusText: 'มอนิเตอร์ Docker Containers',
    createdAt: new Date().toISOString(),
  },
];

export const STAFF_ROLES = [
  { id: 'Frontend', label: 'Frontend Developer', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', defaultEmoji: '👨‍🎨' },
  { id: 'Backend', label: 'Backend Engineer', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', defaultEmoji: '👨‍💻' },
  { id: 'Fullstack', label: 'Fullstack Developer', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', defaultEmoji: '🚀' },
  { id: 'DevOps', label: 'DevOps & Infra', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', defaultEmoji: '⚡' },
  { id: 'QA', label: 'QA & Software Tester', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', defaultEmoji: '🔍' },
  { id: 'PM', label: 'Project Manager', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', defaultEmoji: '📋' },
  { id: 'Lead', label: 'Lead Architect', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', defaultEmoji: '👑' },
  { id: 'AI Agent', label: 'AI Agent / Bot', color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30', defaultEmoji: '🤖' },
  { id: 'Designer', label: 'UI/UX Designer', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30', defaultEmoji: '🎨' },
] as const;

export const AVAILABLE_EMOJIS = [
  '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '🤖', '⚡', '👑', '🚀', 
  '🧠', '🔥', '🛡️', '☕', '🐱', '🐶', '🦊', '🦁',
  '🥷', '🧑‍🚀', '🧙‍♂️', '💼', '💻', '🎮', '💡', '✨'
];
