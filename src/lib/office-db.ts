import db from './sqlite-db';
import { ProjectWithHealth, getProjectsFromDb } from './project-repository';

// Initialize Office physical operations tables
db.exec(`
  CREATE TABLE IF NOT EXISTS buildings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    totalFloors INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS floors (
    id TEXT PRIMARY KEY,
    buildingId TEXT NOT NULL,
    floorNumber INTEGER NOT NULL,
    name TEXT NOT NULL,
    planWidth INTEGER NOT NULL DEFAULT 1600,
    planHeight INTEGER NOT NULL DEFAULT 900,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (buildingId) REFERENCES buildings(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    floorId TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL, -- 'office', 'meeting', 'server', 'lab', 'helpdesk', 'executive'
    operationalStatus TEXT NOT NULL DEFAULT 'normal', -- 'normal', 'maintenance', 'alert', 'offline'
    occupancyStatus TEXT NOT NULL DEFAULT 'empty', -- 'empty', 'occupied', 'reserved'
    capacity INTEGER NOT NULL DEFAULT 6,
    ownerTeam TEXT,
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,
    width INTEGER NOT NULL DEFAULT 200,
    height INTEGER NOT NULL DEFAULT 150,
    color TEXT NOT NULL DEFAULT '#10b981',
    shapeType TEXT NOT NULL DEFAULT 'rect',
    shapeData TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (floorId) REFERENCES floors(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS room_projects (
    id TEXT PRIMARY KEY,
    roomId TEXT NOT NULL,
    projectId TEXT NOT NULL,
    relationshipType TEXT NOT NULL DEFAULT 'primary_dev', -- 'primary_dev', 'deployment_target', 'infrastructure_host'
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS room_members (
    id TEXT PRIMARY KEY,
    roomId TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    team TEXT NOT NULL,
    presenceStatus TEXT NOT NULL DEFAULT 'in-office', -- 'in-office', 'remote', 'site-visit', 'leave'
    externalUserId TEXT,
    presenceSource TEXT NOT NULL DEFAULT 'MANUAL', -- 'MANUAL', 'ARIT_TRACKING', 'SENTINEL'
    presenceUpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS room_assets (
    id TEXT PRIMARY KEY,
    roomId TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'server', 'switch', 'ap', 'ups', 'pc', 'firewall', 'display'
    status TEXT NOT NULL DEFAULT 'normal', -- 'normal', 'warning', 'critical'
    ipAddress TEXT,
    serialNumber TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS room_bookings (
    id TEXT PRIMARY KEY,
    roomId TEXT NOT NULL,
    title TEXT NOT NULL,
    organizer TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed'
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS office_audit_logs (
    id TEXT PRIMARY KEY,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    action TEXT NOT NULL,
    changesJson TEXT NOT NULL,
    performedBy TEXT NOT NULL DEFAULT 'system',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_rooms_floorId ON rooms(floorId);
  CREATE INDEX IF NOT EXISTS idx_room_projects_roomId ON room_projects(roomId);
  CREATE INDEX IF NOT EXISTS idx_room_members_roomId ON room_members(roomId);
  CREATE INDEX IF NOT EXISTS idx_room_assets_roomId ON room_assets(roomId);
  CREATE INDEX IF NOT EXISTS idx_room_bookings_roomId ON room_bookings(roomId);
`);

export interface RoomMember {
  id: string;
  roomId: string;
  name: string;
  role: string;
  team: string;
  presenceStatus: 'in-office' | 'remote' | 'site-visit' | 'leave';
  externalUserId?: string;
  presenceSource: string;
  presenceUpdatedAt: string;
}

export interface RoomAsset {
  id: string;
  roomId: string;
  name: string;
  category: 'server' | 'switch' | 'ap' | 'ups' | 'pc' | 'firewall' | 'display';
  status: 'normal' | 'warning' | 'critical';
  ipAddress?: string;
  serialNumber?: string;
}

export interface RoomBooking {
  id: string;
  roomId: string;
  title: string;
  organizer: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed';
}

export interface RoomProjectLink {
  id: string;
  roomId: string;
  projectId: string;
  relationshipType: string;
  project?: ProjectWithHealth;
}

export interface RoomWithDetails {
  id: string;
  floorId: string;
  name: string;
  code: string;
  type: 'office' | 'meeting' | 'server' | 'lab' | 'helpdesk' | 'executive';
  operationalStatus: 'normal' | 'maintenance' | 'alert' | 'offline';
  occupancyStatus: 'empty' | 'occupied' | 'reserved';
  computedStatus: 'healthy' | 'occupied' | 'available' | 'maintenance' | 'alert';
  capacity: number;
  ownerTeam?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shapeType: string;
  shapeData?: string;
  members: RoomMember[];
  assets: RoomAsset[];
  bookings: RoomBooking[];
  projects: RoomProjectLink[];
  createdAt: string;
  updatedAt: string;
}

export interface FloorWithRooms {
  id: string;
  buildingId: string;
  floorNumber: number;
  name: string;
  planWidth: number;
  planHeight: number;
  rooms: RoomWithDetails[];
}

export interface BuildingData {
  id: string;
  name: string;
  code: string;
  description?: string;
  totalFloors: number;
  floors: FloorWithRooms[];
}

/**
 * Idempotent seeder for ARIT Building & SRRU Floors
 */
export function seedOfficeDataIfEmpty() {
  const existingBuilding = db.prepare(`SELECT id FROM buildings WHERE code = 'ARIT' LIMIT 1`).get();
  if (existingBuilding) return;

  const now = new Date().toISOString();

  // 1. Insert ARIT Building
  const buildingId = 'bld-arit';
  db.prepare(`
    INSERT INTO buildings (id, name, code, description, totalFloors, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    buildingId,
    'อาคารวิทยบริการและเทคโนโลยีสารสนเทศ (ARIT Building)',
    'ARIT',
    'สำนักวิทยบริการและเทคโนโลยีสารสนเทศ มหาวิทยาลัยราชภัฏสุรินทร์',
    3,
    now,
    now
  );

  // 2. Insert Floors (Floor 2 & Floor 3)
  const floor2Id = 'flr-arit-2';
  const floor3Id = 'flr-arit-3';

  db.prepare(`
    INSERT INTO floors (id, buildingId, floorNumber, name, planWidth, planHeight, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(floor2Id, buildingId, 2, 'ชั้น 2 (Digital Center & Development)', 1600, 900, now, now);

  db.prepare(`
    INSERT INTO floors (id, buildingId, floorNumber, name, planWidth, planHeight, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(floor3Id, buildingId, 3, 'ชั้น 3 (Executive & Training Labs)', 1600, 900, now, now);

  // 3. Insert Rooms for Floor 2
  const roomsFloor2 = [
    {
      id: 'room-dev',
      floorId: floor2Id,
      name: 'Software Development & AI Lab',
      code: 'ARIT-201',
      type: 'office',
      operationalStatus: 'normal',
      occupancyStatus: 'occupied',
      capacity: 12,
      ownerTeam: 'Software Development Team',
      x: 60,
      y: 80,
      width: 480,
      height: 340,
      color: '#10b981',
    },
    {
      id: 'room-network',
      floorId: floor2Id,
      name: 'Network Operations & NOC',
      code: 'ARIT-202',
      type: 'office',
      operationalStatus: 'normal',
      occupancyStatus: 'occupied',
      capacity: 8,
      ownerTeam: 'Network Engineering Team',
      x: 580,
      y: 80,
      width: 440,
      height: 340,
      color: '#06b6d4',
    },
    {
      id: 'room-server',
      floorId: floor2Id,
      name: 'Data Center & Main Server Room',
      code: 'ARIT-203',
      type: 'server',
      operationalStatus: 'alert',
      occupancyStatus: 'empty',
      capacity: 4,
      ownerTeam: 'Infrastructure & Cloud Team',
      x: 1060,
      y: 80,
      width: 480,
      height: 340,
      color: '#f43f5e',
    },
    {
      id: 'room-helpdesk',
      floorId: floor2Id,
      name: 'IT Helpdesk & User Support',
      code: 'ARIT-204',
      type: 'helpdesk',
      operationalStatus: 'normal',
      occupancyStatus: 'occupied',
      capacity: 6,
      ownerTeam: 'Helpdesk Support Team',
      x: 60,
      y: 480,
      width: 360,
      height: 340,
      color: '#3b82f6',
    },
    {
      id: 'room-meeting-1',
      floorId: floor2Id,
      name: 'ห้องประชุมย่อย 1 (Meeting Room 1)',
      code: 'ARIT-205',
      type: 'meeting',
      operationalStatus: 'normal',
      occupancyStatus: 'reserved',
      capacity: 10,
      ownerTeam: 'ARIT Central',
      x: 460,
      y: 480,
      width: 340,
      height: 340,
      color: '#8b5cf6',
    },
    {
      id: 'room-training-1',
      floorId: floor2Id,
      name: 'ห้องปฏิบัติการคอมพิวเตอร์ 1 (Lab 1)',
      code: 'ARIT-206',
      type: 'lab',
      operationalStatus: 'normal',
      occupancyStatus: 'empty',
      capacity: 35,
      ownerTeam: 'Academic Training',
      x: 840,
      y: 480,
      width: 700,
      height: 340,
      color: '#6366f1',
    },
  ];

  const insertRoomStmt = db.prepare(`
    INSERT INTO rooms (id, floorId, name, code, type, operationalStatus, occupancyStatus, capacity, ownerTeam, x, y, width, height, color, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const r of roomsFloor2) {
    insertRoomStmt.run(
      r.id, r.floorId, r.name, r.code, r.type, r.operationalStatus, r.occupancyStatus,
      r.capacity, r.ownerTeam, r.x, r.y, r.width, r.height, r.color, now, now
    );
  }

  // 4. Insert Room Members
  const members = [
    // Dev Team
    { id: 'm-1', roomId: 'room-dev', name: 'สุรศักดิ์ (Dev Lead)', role: 'Senior Fullstack & AI Engineer', team: 'Dev', presenceStatus: 'in-office' },
    { id: 'm-2', roomId: 'room-dev', name: 'วิภาดา (Frontend)', role: 'Next.js Frontend Developer', team: 'Dev', presenceStatus: 'in-office' },
    { id: 'm-3', roomId: 'room-dev', name: 'ธนวัฒน์ (Backend)', role: 'Node.js / Go Backend Developer', team: 'Dev', presenceStatus: 'remote' },
    { id: 'm-4', roomId: 'room-dev', name: 'ณภัทร (Mobile/App)', role: 'Mobile Application Engineer', team: 'Dev', presenceStatus: 'site-visit' },

    // Network Team
    { id: 'm-5', roomId: 'room-network', name: 'เกียรติศักดิ์ (NOC Lead)', role: 'Network & Security Architect', team: 'Network', presenceStatus: 'in-office' },
    { id: 'm-6', roomId: 'room-network', name: 'อภิสิทธิ์ (Network Ops)', role: 'Core Network Engineer', team: 'Network', presenceStatus: 'in-office' },
    { id: 'm-7', roomId: 'room-network', name: 'สุริยา (WiFi/Fiber)', role: 'Campus Infrastructure Technician', team: 'Network', presenceStatus: 'leave' },

    // Helpdesk
    { id: 'm-8', roomId: 'room-helpdesk', name: 'กิตติพงษ์ (Helpdesk)', role: 'IT Support Specialist', team: 'Helpdesk', presenceStatus: 'in-office' },
    { id: 'm-9', roomId: 'room-helpdesk', name: 'วรัญญา (Support)', role: 'Service Desk Coordinator', team: 'Helpdesk', presenceStatus: 'in-office' },
  ];

  const insertMemberStmt = db.prepare(`
    INSERT INTO room_members (id, roomId, name, role, team, presenceStatus, presenceSource, presenceUpdatedAt, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, 'MANUAL', ?, ?, ?)
  `);

  for (const m of members) {
    insertMemberStmt.run(m.id, m.roomId, m.name, m.role, m.team, m.presenceStatus, now, now, now);
  }

  // 5. Insert Assets & Infrastructure
  const assets = [
    // Server Room
    { id: 'a-1', roomId: 'room-server', name: 'Core Server Rack A (HPE ProLiant)', category: 'server', status: 'normal', ipAddress: '10.0.1.10' },
    { id: 'a-2', roomId: 'room-server', name: 'Storage SAN Cluster (TrueNAS)', category: 'server', status: 'normal', ipAddress: '10.0.1.20' },
    { id: 'a-3', roomId: 'room-server', name: 'Online UPS 20kVA (APC)', category: 'ups', status: 'warning', ipAddress: '10.0.1.250' },
    { id: 'a-4', roomId: 'room-server', name: 'Fortinet FortiGate 200F', category: 'firewall', status: 'normal', ipAddress: '10.0.0.1' },

    // Network Room
    { id: 'a-5', roomId: 'room-network', name: 'Cisco Core Switch Nexus 9300', category: 'switch', status: 'normal', ipAddress: '10.0.0.2' },
    { id: 'a-6', roomId: 'room-network', name: 'Aruba Central Controller', category: 'ap', status: 'normal', ipAddress: '10.0.0.15' },

    // Dev Room
    { id: 'a-7', roomId: 'room-dev', name: 'Dev Staging Server (Ubuntu/Docker)', category: 'server', status: 'normal', ipAddress: '10.0.2.100' },
    { id: 'a-8', roomId: 'room-dev', name: 'Apple Studio Display & Workstations', category: 'display', status: 'normal', ipAddress: '10.0.2.45' },
  ];

  const insertAssetStmt = db.prepare(`
    INSERT INTO room_assets (id, roomId, name, category, status, ipAddress, serialNumber, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const a of assets) {
    insertAssetStmt.run(a.id, a.roomId, a.name, a.category, a.status, a.ipAddress, `SN-${a.id.toUpperCase()}`, now, now);
  }

  // 6. Insert Junction: Room <-> Project Links
  const roomProjects = [
    { id: 'rp-1', roomId: 'room-dev', projectId: 'SRRU-Website', relationshipType: 'primary_dev' },
    { id: 'rp-2', roomId: 'room-dev', projectId: 'keenoii-mornitoring', relationshipType: 'primary_dev' },
    { id: 'rp-3', roomId: 'room-dev', projectId: 'visit-surin', relationshipType: 'primary_dev' },
    { id: 'rp-4', roomId: 'room-network', projectId: 'arit-tracking', relationshipType: 'infrastructure_host' },
    { id: 'rp-5', roomId: 'room-server', projectId: 'SRRU-Website', relationshipType: 'deployment_target' },
  ];

  const insertRoomProjStmt = db.prepare(`
    INSERT INTO room_projects (id, roomId, projectId, relationshipType, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const rp of roomProjects) {
    insertRoomProjStmt.run(rp.id, rp.roomId, rp.projectId, rp.relationshipType, now);
  }

  // 7. Insert Today's Meeting Bookings
  const todayStr = new Date().toISOString().slice(0, 10);
  const bookings = [
    {
      id: 'bk-1',
      roomId: 'room-meeting-1',
      title: 'SRRU-Website v3.0 Sprint Review & Deployment',
      organizer: 'ทีมพัฒนาระบบ (Dev Team)',
      startTime: `${todayStr}T10:00:00`,
      endTime: `${todayStr}T11:30:00`,
      status: 'confirmed',
    },
    {
      id: 'bk-2',
      roomId: 'room-meeting-1',
      title: 'ประชุมวางแผน Campus Network Fiber 10G',
      organizer: 'ทีมเครือข่าย (NOC)',
      startTime: `${todayStr}T13:30:00`,
      endTime: `${todayStr}T15:00:00`,
      status: 'confirmed',
    },
  ];

  const insertBookingStmt = db.prepare(`
    INSERT INTO room_bookings (id, roomId, title, organizer, startTime, endTime, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const b of bookings) {
    insertBookingStmt.run(b.id, b.roomId, b.title, b.organizer, b.startTime, b.endTime, b.status, now, now);
  }
}

/**
 * Fetch full office data with Sentinel projects joined
 */
export async function getOfficeData(buildingCode = 'ARIT', floorNum?: number): Promise<BuildingData | null> {
  seedOfficeDataIfEmpty();

  const building = db.prepare(`SELECT * FROM buildings WHERE code = ? LIMIT 1`).get(buildingCode) as any;
  if (!building) return null;

  let floorsQuery = `SELECT * FROM floors WHERE buildingId = ? ORDER BY floorNumber ASC`;
  const floors = db.prepare(floorsQuery).all(building.id) as any[];

  // Fetch Sentinel projects for joining
  const sentinelProjects = await getProjectsFromDb();
  const projectMap = new Map(sentinelProjects.map((p) => [p.name, p]));
  const projectByIdMap = new Map(sentinelProjects.map((p) => [p.id, p]));

  const floorsWithRooms: FloorWithRooms[] = [];

  for (const flr of floors) {
    if (floorNum && flr.floorNumber !== floorNum) continue;

    const rooms = db.prepare(`SELECT * FROM rooms WHERE floorId = ? ORDER BY code ASC`).all(flr.id) as any[];
    const roomDetails: RoomWithDetails[] = [];

    for (const r of rooms) {
      const members = db.prepare(`SELECT * FROM room_members WHERE roomId = ?`).all(r.id) as unknown as RoomMember[];
      const assets = db.prepare(`SELECT * FROM room_assets WHERE roomId = ?`).all(r.id) as unknown as RoomAsset[];
      const bookings = db.prepare(`SELECT * FROM room_bookings WHERE roomId = ?`).all(r.id) as unknown as RoomBooking[];
      const rawLinks = db.prepare(`SELECT * FROM room_projects WHERE roomId = ?`).all(r.id) as any[];

      const projectLinks: RoomProjectLink[] = rawLinks.map((link) => {
        const p = projectMap.get(link.projectId) || projectByIdMap.get(link.projectId);
        return {
          id: link.id,
          roomId: link.roomId,
          projectId: link.projectId,
          relationshipType: link.relationshipType,
          project: p,
        };
      });

      // Compute status via Rule Engine
      let computedStatus: RoomWithDetails['computedStatus'] = 'available';
      if (r.operationalStatus === 'maintenance') {
        computedStatus = 'maintenance';
      } else if (r.operationalStatus === 'alert' || assets.some((a) => a.status === 'critical' || a.status === 'warning')) {
        computedStatus = 'alert';
      } else if (r.occupancyStatus === 'occupied' || members.some((m) => m.presenceStatus === 'in-office')) {
        computedStatus = 'occupied';
      } else {
        computedStatus = 'available';
      }

      roomDetails.push({
        id: r.id,
        floorId: r.floorId,
        name: r.name,
        code: r.code,
        type: r.type,
        operationalStatus: r.operationalStatus,
        occupancyStatus: r.occupancyStatus,
        computedStatus,
        capacity: r.capacity,
        ownerTeam: r.ownerTeam,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        color: r.color,
        shapeType: r.shapeType,
        shapeData: r.shapeData,
        members,
        assets,
        bookings,
        projects: projectLinks,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      });
    }

    floorsWithRooms.push({
      id: flr.id,
      buildingId: flr.buildingId,
      floorNumber: flr.floorNumber,
      name: flr.name,
      planWidth: flr.planWidth,
      planHeight: flr.planHeight,
      rooms: roomDetails,
    });
  }

  return {
    id: building.id,
    name: building.name,
    code: building.code,
    description: building.description,
    totalFloors: building.totalFloors,
    floors: floorsWithRooms,
  };
}
