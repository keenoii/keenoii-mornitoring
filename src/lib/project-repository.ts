import db from './sqlite-db';
import { ProjectScanResult, AttentionItem, Milestone, SubmoduleInfo } from '../collector/types';
import { HealthBreakdown, computeProjectHealth } from './health';

export interface ProjectWithHealth extends ProjectScanResult {
  health: HealthBreakdown;
}

/**
 * Upsert a batch of scanned projects into the SQLite database in a single fast transaction.
 */
export async function saveScanResultsToDb(projects: ProjectWithHealth[]): Promise<void> {
  db.exec('PRAGMA foreign_keys = OFF;');

  // Load existing project rows from DB so we NEVER overwrite custom settings or manual URLs!
  const existingProjectMap = new Map<string, any>();
  try {
    const existingRows = db.prepare(`SELECT * FROM projects`).all() as any[];
    for (const r of existingRows) {
      existingProjectMap.set(r.path.replace(/\\/g, '/').toLowerCase(), r);
    }
  } catch {}

  const insertProjectStmt = db.prepare(`
    INSERT INTO projects (
      id, name, slug, path, relativePath, primaryType, frameworks,
      status, stage, priority, progress, healthScore, healthTier, healthColor,
      healthUrl, hasConfigYaml, description, lastActivityAt, scannedAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, datetime('now')
    )
    ON CONFLICT(path) DO UPDATE SET
      name = excluded.name,
      slug = excluded.slug,
      relativePath = excluded.relativePath,
      primaryType = excluded.primaryType,
      frameworks = excluded.frameworks,
      status = excluded.status,
      stage = excluded.stage,
      priority = excluded.priority,
      progress = excluded.progress,
      healthScore = excluded.healthScore,
      healthTier = excluded.healthTier,
      healthColor = excluded.healthColor,
      healthUrl = coalesce(excluded.healthUrl, projects.healthUrl),
      hasConfigYaml = excluded.hasConfigYaml,
      description = coalesce(excluded.description, projects.description),
      lastActivityAt = excluded.lastActivityAt,
      scannedAt = excluded.scannedAt,
      updatedAt = datetime('now')
  `);

  const insertMetricStmt = db.prepare(`
    INSERT OR REPLACE INTO project_metrics (
      projectId, todoCount, fixmeCount, totalFiles, hasReadme, hasDocker,
      hasKubernetes, hasTests, gitBranch, gitIsDirty, gitUncommittedFiles,
      gitLastCommitDate, gitLastCommitMsg, gitLastCommitAuthor, gitRemoteUrl,
      readmePreview, todoSamples
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
  `);

  const insertHealthStmt = db.prepare(`
    INSERT OR REPLACE INTO health_breakdowns (
      projectId, gitActivity, documentation, buildStatus, tests, deployment,
      openTasks, freshness, total
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const deleteMilestonesStmt = db.prepare(`DELETE FROM milestones WHERE projectId = ?`);
  const insertMilestoneStmt = db.prepare(`
    INSERT OR REPLACE INTO milestones (id, projectId, name, status, description, ordering)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const deleteAttentionStmt = db.prepare(`DELETE FROM attention_items WHERE projectId = ?`);
  const insertAttentionStmt = db.prepare(`
    INSERT OR REPLACE INTO attention_items (id, projectId, itemKey, severity, title, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const deleteSubmodulesStmt = db.prepare(`DELETE FROM submodules WHERE projectId = ?`);
  const insertSubmoduleStmt = db.prepare(`
    INSERT OR REPLACE INTO submodules (id, projectId, name, relativePath, type, frameworks)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const p of projects) {
    try {
      const normPath = p.path.replace(/\\/g, '/').toLowerCase();
      const existing = existingProjectMap.get(normPath);
      const effectiveId = existing?.id || p.id;

      const effectiveUrl = p.healthUrl || existing?.healthUrl || null;
      const effectiveStage = p.hasConfigYaml ? p.stage : (effectiveUrl ? 'Production' : (existing?.stage || p.stage));
      const effectiveStatus = p.hasConfigYaml ? p.status : (effectiveUrl ? 'COMPLETED' : (existing?.status || p.status));
      const effectivePriority = p.hasConfigYaml ? p.priority : (existing?.priority || p.priority);
      const effectiveProgress = p.hasConfigYaml ? p.progress : (effectiveUrl ? 100 : (existing?.progress ?? p.progress));
      const effectiveDescription = p.hasConfigYaml ? p.config?.description : (existing?.description || p.config?.description || null);

      // 1. Project Core
      insertProjectStmt.run(
        effectiveId,
        p.name,
        p.slug,
        p.path,
        p.relativePath,
        p.detectedType.primaryType,
        JSON.stringify(p.detectedType.frameworks || []),
        effectiveStatus,
        effectiveStage,
        effectivePriority,
        effectiveProgress,
        p.health.total,
        p.health.tier,
        p.health.color,
        effectiveUrl,
        p.hasConfigYaml ? 1 : 0,
        effectiveDescription,
        p.metrics.lastModifiedDate || null,
        p.scannedAt
      );

      // 2. Metrics
      insertMetricStmt.run(
        effectiveId,
        p.metrics.todoCount || 0,
        p.metrics.fixmeCount || 0,
        p.metrics.totalFiles || 0,
        p.metrics.hasReadme ? 1 : 0,
        p.metrics.hasDocker ? 1 : 0,
        p.metrics.hasKubernetes ? 1 : 0,
        p.metrics.hasTests ? 1 : 0,
        p.git.branch || null,
        p.git.isDirty ? 1 : 0,
        p.git.uncommittedFiles || 0,
        p.git.lastCommitDate || null,
        p.git.lastCommitMessage || null,
        p.git.lastCommitAuthor || null,
        p.git.remoteUrl || null,
        p.metrics.readmePreview || null,
        JSON.stringify(p.metrics.todoSamples || [])
      );

      // 3. Health Breakdown
      insertHealthStmt.run(
        effectiveId,
        p.health.gitActivity,
        p.health.documentation,
        p.health.buildStatus,
        p.health.tests,
        p.health.deployment,
        p.health.openTasks,
        p.health.freshness,
        p.health.total
      );

      // 4. Milestones
      deleteMilestonesStmt.run(effectiveId);
      if (p.milestones && p.milestones.length > 0) {
        p.milestones.forEach((m, idx) => {
          insertMilestoneStmt.run(
            `${effectiveId}-m-${idx}`,
            effectiveId,
            m.name,
            m.status,
            m.description || null,
            idx
          );
        });
      }

      // 5. Attention Items
      deleteAttentionStmt.run(effectiveId);
      if (p.attentionItems && p.attentionItems.length > 0) {
        p.attentionItems.forEach((item, idx) => {
          insertAttentionStmt.run(
            `${effectiveId}-att-${idx}`,
            effectiveId,
            item.id,
            item.severity,
            item.title,
            item.reason
          );
        });
      }

      // 6. Submodules
      deleteSubmodulesStmt.run(effectiveId);
      if (p.submodules && p.submodules.length > 0) {
        p.submodules.forEach((sub, idx) => {
          insertSubmoduleStmt.run(
            `${effectiveId}-sub-${idx}`,
            effectiveId,
            sub.name,
            sub.relativePath,
            sub.type,
            JSON.stringify(sub.frameworks || [])
          );
        });
      }
    } catch (itemErr) {
      console.error(`Error saving project ${p.name} to DB:`, itemErr);
    }
  }

  // 7. Cleanup ONLY folders that no longer exist physically on disk
  try {
    const existingRows = db.prepare(`SELECT id, path FROM projects`).all() as { id: string; path: string }[];
    for (const row of existingRows) {
      const fs = require('fs');
      if (!fs.existsSync(row.path)) {
        db.prepare(`DELETE FROM projects WHERE id = ?`).run(row.id);
        db.prepare(`DELETE FROM project_metrics WHERE projectId = ?`).run(row.id);
        db.prepare(`DELETE FROM health_breakdowns WHERE projectId = ?`).run(row.id);
        db.prepare(`DELETE FROM milestones WHERE projectId = ?`).run(row.id);
        db.prepare(`DELETE FROM attention_items WHERE projectId = ?`).run(row.id);
        db.prepare(`DELETE FROM submodules WHERE projectId = ?`).run(row.id);
      }
    }
  } catch {}
  finally {
    db.exec('PRAGMA foreign_keys = ON;');
  }
}

/**
 * Retrieve all projects from SQLite database.
 */
export async function getProjectsFromDb(filterRootPath?: string): Promise<ProjectWithHealth[]> {
  let query = `SELECT * FROM projects`;
  const params: any[] = [];

  if (filterRootPath) {
    const normalizedFilter = filterRootPath.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
    query += ` WHERE lower(replace(path, '\\', '/')) LIKE ?`;
    params.push(`${normalizedFilter}%`);
  }

  query += ` ORDER BY healthScore DESC`;

  const projectRows: any[] = (db.prepare(query) as any).all(...params);
  if (projectRows.length === 0) return [];

  const metricsRows: any[] = (db.prepare(`SELECT * FROM project_metrics`) as any).all();
  const metricsMap = new Map(metricsRows.map((m: any) => [m.projectId, m]));

  const healthRows: any[] = (db.prepare(`SELECT * FROM health_breakdowns`) as any).all();
  const healthMap = new Map(healthRows.map((h: any) => [h.projectId, h]));

  const milestoneRows: any[] = (db.prepare(`SELECT * FROM milestones ORDER BY ordering ASC`) as any).all();
  const milestoneMap = new Map<string, Milestone[]>();
  for (const m of milestoneRows) {
    if (!milestoneMap.has(m.projectId)) milestoneMap.set(m.projectId, []);
    milestoneMap.get(m.projectId)!.push({
      name: m.name,
      status: m.status,
      description: m.description || undefined,
    });
  }

  const attentionRows: any[] = (db.prepare(`SELECT * FROM attention_items`) as any).all();
  const attentionMap = new Map<string, AttentionItem[]>();
  for (const a of attentionRows) {
    if (!attentionMap.has(a.projectId)) attentionMap.set(a.projectId, []);
    attentionMap.get(a.projectId)!.push({
      id: a.itemKey,
      projectId: a.projectId,
      projectName: '',
      severity: a.severity,
      title: a.title,
      reason: a.reason,
    });
  }

  const submoduleRows: any[] = (db.prepare(`SELECT * FROM submodules`) as any).all();
  const submoduleMap = new Map<string, SubmoduleInfo[]>();
  for (const s of submoduleRows) {
    if (!submoduleMap.has(s.projectId)) submoduleMap.set(s.projectId, []);
    let fw: string[] = [];
    try {
      fw = JSON.parse(s.frameworks || '[]');
    } catch {}
    submoduleMap.get(s.projectId)!.push({
      name: s.name,
      relativePath: s.relativePath,
      type: s.type,
      frameworks: fw,
    });
  }

  return projectRows.map((r: any): ProjectWithHealth => {
    let frameworks: string[] = [];
    try {
      frameworks = JSON.parse(r.frameworks || '[]');
    } catch {}

    const m = metricsMap.get(r.id) || {};
    const h = healthMap.get(r.id) || {};
    const milestones = milestoneMap.get(r.id) || [];
    const attentionItems = (attentionMap.get(r.id) || []).map((item) => ({
      ...item,
      projectName: r.name,
    }));
    const submodules = submoduleMap.get(r.id);

    let todoSamples: any[] = [];
    try {
      todoSamples = JSON.parse(m.todoSamples || '[]');
    } catch {}

    const baseProject: ProjectScanResult = {
      id: r.id,
      name: r.name,
      slug: r.slug,
      path: r.path,
      relativePath: r.relativePath,
      detectedType: {
        primaryType: r.primaryType,
        frameworks,
        languages: [],
        indicatorFiles: [],
      },
      status: r.status,
      stage: r.stage,
      priority: r.priority,
      progress: r.progress,
      hasConfigYaml: Boolean(r.hasConfigYaml),
      healthUrl: r.healthUrl || undefined,
      git: {
        isRepo: Boolean(m.gitBranch),
        branch: m.gitBranch || '',
        isDirty: Boolean(m.gitIsDirty),
        uncommittedFiles: m.gitUncommittedFiles || 0,
        lastCommitDate: m.gitLastCommitDate || null,
        lastCommitMessage: m.gitLastCommitMsg || null,
        lastCommitAuthor: m.gitLastCommitAuthor || null,
        remoteUrl: m.gitRemoteUrl || null,
      },
      metrics: {
        todoCount: m.todoCount || 0,
        fixmeCount: m.fixmeCount || 0,
        totalFiles: m.totalFiles || 0,
        hasReadme: Boolean(m.hasReadme),
        hasDocker: Boolean(m.hasDocker),
        hasKubernetes: Boolean(m.hasKubernetes),
        hasTests: Boolean(m.hasTests),
        lastModifiedDate: r.lastActivityAt || r.scannedAt,
        todoSamples,
        readmePreview: m.readmePreview || undefined,
      },
      milestones,
      attentionItems,
      submodules,
      scannedAt: r.scannedAt,
    };

    const health = computeProjectHealth(baseProject);

    return {
      ...baseProject,
      health,
    };
  });
}
