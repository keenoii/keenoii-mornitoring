import db from './sqlite-db';

export interface ProjectGoal {
  projectId: string;
  currentGoal?: string;
  blockerText?: string;
  followUpDate?: string;
  updatedAt: string;
}

export interface ProjectMemoryEntry {
  id: string;
  projectId: string;
  eventDate: string;
  type: 'note' | 'decision' | 'blocker' | 'milestone' | 'git_commit';
  title: string;
  content?: string;
  createdAt: string;
}

// Helper to resolve project ID by id, name, or slug
export function resolveActualProjectId(idOrName: string): string {
  try {
    const row = db.prepare(`
      SELECT id FROM projects
      WHERE id = ? OR name = ? OR slug = ?
      LIMIT 1
    `).get(idOrName, idOrName, idOrName) as any;

    if (row && row.id) return row.id;
  } catch {}
  return idOrName;
}

export function getProjectGoal(idOrName: string): ProjectGoal | null {
  try {
    const projectId = resolveActualProjectId(idOrName);
    const row = db.prepare(`
      SELECT * FROM project_goals
      WHERE projectId = ? OR projectId = ?
      LIMIT 1
    `).get(projectId, idOrName) as any;

    if (!row) return null;
    return {
      projectId: row.projectId,
      currentGoal: row.currentGoal || '',
      blockerText: row.blockerText || '',
      followUpDate: row.followUpDate || '',
      updatedAt: row.updatedAt,
    };
  } catch {
    return null;
  }
}

export function saveProjectGoal(
  idOrName: string,
  currentGoal: string,
  blockerText: string,
  followUpDate?: string
): ProjectGoal {
  const projectId = resolveActualProjectId(idOrName);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO project_goals (projectId, currentGoal, blockerText, followUpDate, updatedAt)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(projectId) DO UPDATE SET
      currentGoal = excluded.currentGoal,
      blockerText = excluded.blockerText,
      followUpDate = excluded.followUpDate,
      updatedAt = excluded.updatedAt
  `).run(projectId, currentGoal, blockerText, followUpDate || null, now);

  return {
    projectId,
    currentGoal,
    blockerText,
    followUpDate,
    updatedAt: now,
  };
}

export function getProjectMemories(idOrName: string): ProjectMemoryEntry[] {
  try {
    const projectId = resolveActualProjectId(idOrName);
    const rows = db.prepare(`
      SELECT * FROM project_memories
      WHERE projectId = ? OR projectId = ?
      ORDER BY eventDate DESC, createdAt DESC
    `).all(projectId, idOrName) as any[];

    if (rows.length === 0) {
      seedDynamicProjectMemories(projectId);
      return db.prepare(`
        SELECT * FROM project_memories
        WHERE projectId = ? OR projectId = ?
        ORDER BY eventDate DESC, createdAt DESC
      `).all(projectId, idOrName) as any[];
    }

    return rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      eventDate: r.eventDate,
      type: r.type,
      title: r.title,
      content: r.content || '',
      createdAt: r.createdAt,
    }));
  } catch {
    return [];
  }
}

export function addProjectMemory(
  idOrName: string,
  title: string,
  type: ProjectMemoryEntry['type'] = 'note',
  content?: string,
  eventDate?: string
): ProjectMemoryEntry {
  const projectId = resolveActualProjectId(idOrName);
  const id = `mem-${Date.now()}`;
  const date = eventDate || new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO project_memories (id, projectId, eventDate, type, title, content, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, projectId, date, type, title, content || null, now);

  return {
    id,
    projectId,
    eventDate: date,
    type,
    title,
    content,
    createdAt: now,
  };
}

/**
 * Generate real, dynamic initial memories from actual Git commits & SQLite scan metadata
 */
function seedDynamicProjectMemories(projectId: string) {
  try {
    const p = db.prepare(`
      SELECT p.*, m.gitLastCommitDate, m.gitLastCommitMsg, m.gitLastCommitAuthor
      FROM projects p
      LEFT JOIN project_metrics m ON p.id = m.projectId
      WHERE p.id = ?
      LIMIT 1
    `).get(projectId) as any;

    if (!p) return;

    // 1. If Git commit exists, add actual Git commit milestone
    if (p.gitLastCommitDate && p.gitLastCommitMsg) {
      const commitDate = p.gitLastCommitDate.slice(0, 10);
      addProjectMemory(
        projectId,
        `Commit: ${p.gitLastCommitMsg.slice(0, 60)}`,
        'git_commit',
        `Author: ${p.gitLastCommitAuthor || 'Developer'} • Stage: ${p.stage}`,
        commitDate
      );
    }

    // 2. Add scan registration milestone from actual scannedAt timestamp
    const scanDate = (p.scannedAt || new Date().toISOString()).slice(0, 10);
    addProjectMemory(
      projectId,
      `Project Registered (Health ${p.healthScore || 0}/100)`,
      'milestone',
      `Type: ${p.primaryType || 'Codebase'} • Priority: ${p.priority || 'Normal'}`,
      scanDate
    );
  } catch {}
}
