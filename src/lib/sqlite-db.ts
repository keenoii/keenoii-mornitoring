import { DatabaseSync } from 'node:sqlite';
import * as path from 'path';
import * as fs from 'fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'sentinel.db');
const db = new DatabaseSync(DB_PATH);

// Initialize schema tables
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    path TEXT UNIQUE NOT NULL,
    relativePath TEXT NOT NULL,
    primaryType TEXT NOT NULL,
    frameworks TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    stage TEXT NOT NULL DEFAULT 'Development',
    priority TEXT NOT NULL DEFAULT 'medium',
    progress INTEGER NOT NULL DEFAULT 0,
    healthScore INTEGER NOT NULL DEFAULT 0,
    healthTier TEXT NOT NULL DEFAULT 'Attention',
    healthColor TEXT NOT NULL DEFAULT 'amber',
    healthUrl TEXT,
    hasConfigYaml INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    lastActivityAt TEXT,
    scannedAt TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_metrics (
    projectId TEXT PRIMARY KEY,
    todoCount INTEGER NOT NULL DEFAULT 0,
    fixmeCount INTEGER NOT NULL DEFAULT 0,
    totalFiles INTEGER NOT NULL DEFAULT 0,
    hasReadme INTEGER NOT NULL DEFAULT 0,
    hasDocker INTEGER NOT NULL DEFAULT 0,
    hasKubernetes INTEGER NOT NULL DEFAULT 0,
    hasTests INTEGER NOT NULL DEFAULT 0,
    gitBranch TEXT,
    gitIsDirty INTEGER NOT NULL DEFAULT 0,
    gitUncommittedFiles INTEGER NOT NULL DEFAULT 0,
    gitLastCommitDate TEXT,
    gitLastCommitMsg TEXT,
    gitLastCommitAuthor TEXT,
    gitRemoteUrl TEXT,
    readmePreview TEXT,
    todoSamples TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS health_breakdowns (
    projectId TEXT PRIMARY KEY,
    gitActivity INTEGER NOT NULL DEFAULT 0,
    documentation INTEGER NOT NULL DEFAULT 0,
    buildStatus INTEGER NOT NULL DEFAULT 0,
    tests INTEGER NOT NULL DEFAULT 0,
    deployment INTEGER NOT NULL DEFAULT 0,
    openTasks INTEGER NOT NULL DEFAULT 0,
    freshness INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo',
    description TEXT,
    ordering INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attention_items (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    itemKey TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    isResolved INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS submodules (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    name TEXT NOT NULL,
    relativePath TEXT NOT NULL,
    type TEXT NOT NULL,
    frameworks TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scan_snapshots (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    totalProjects INTEGER NOT NULL DEFAULT 0,
    summaryJson TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ai_advices (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    overallStatus TEXT NOT NULL,
    diagnosis TEXT,
    findings TEXT NOT NULL,
    recommendations TEXT NOT NULL,
    doNext TEXT,
    doNotPrioritizeYet TEXT,
    riskLevel TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    evidence TEXT,
    confidence INTEGER,
    provider TEXT NOT NULL,
    model TEXT,
    generatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS project_goals (
    projectId TEXT PRIMARY KEY,
    currentGoal TEXT,
    blockerText TEXT,
    followUpDate TEXT,
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS project_memories (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    eventDate TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'note', -- 'note', 'decision', 'blocker', 'milestone', 'git_commit'
    title TEXT NOT NULL,
    content TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS office_layouts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    layoutJson TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS office_staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatarEmoji TEXT NOT NULL DEFAULT '👨‍💻',
    buildingId TEXT NOT NULL DEFAULT 'bldg-main-hq',
    deskId TEXT NOT NULL,
    roomType TEXT NOT NULL DEFAULT 'web',
    status TEXT NOT NULL DEFAULT 'active',
    statusText TEXT,
    assignedProjectId TEXT,
    assignedProjectName TEXT,
    assignmentRole TEXT NOT NULL DEFAULT 'lead', -- 'lead', 'contributor', 'reviewer'
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
  CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(stage);
  CREATE INDEX IF NOT EXISTS idx_projects_healthTier ON projects(healthTier);
  CREATE INDEX IF NOT EXISTS idx_memories_projectId ON project_memories(projectId);
  CREATE INDEX IF NOT EXISTS idx_office_staff_building ON office_staff(buildingId);
  CREATE INDEX IF NOT EXISTS idx_office_staff_desk ON office_staff(deskId);
  CREATE INDEX IF NOT EXISTS idx_office_staff_project ON office_staff(assignedProjectId);
`);

export default db;
