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
      id = excluded.id,
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
      description = excluded.description,
      lastActivityAt = excluded.lastActivityAt,
      scannedAt = excluded.scannedAt,
      updatedAt = datetime('now')
  `);

  const insertMetricStmt = db.prepare(`
    INSERT INTO project_metrics (
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
    ON CONFLICT(projectId) DO UPDATE SET
      todoCount = excluded.todoCount,
      fixmeCount = excluded.fixmeCount,
      totalFiles = excluded.totalFiles,
      hasReadme = excluded.hasReadme,
      hasDocker = excluded.hasDocker,
      hasKubernetes = excluded.hasKubernetes,
      hasTests = excluded.hasTests,
      gitBranch = excluded.gitBranch,
      gitIsDirty = excluded.gitIsDirty,
      gitUncommittedFiles = excluded.gitUncommittedFiles,
      gitLastCommitDate = excluded.gitLastCommitDate,
      gitLastCommitMsg = excluded.gitLastCommitMsg,
      gitLastCommitAuthor = excluded.gitLastCommitAuthor,
      gitRemoteUrl = excluded.gitRemoteUrl,
      readmePreview = excluded.readmePreview,
      todoSamples = excluded.todoSamples
  `);

  const insertHealthStmt = db.prepare(`
    INSERT INTO health_breakdowns (
      projectId, gitActivity, documentation, buildStatus, tests, deployment,
      openTasks, freshness, total
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?
    )
    ON CONFLICT(projectId) DO UPDATE SET
      gitActivity = excluded.gitActivity,
      documentation = excluded.documentation,
      buildStatus = excluded.buildStatus,
      tests = excluded.tests,
      deployment = excluded.deployment,
      openTasks = excluded.openTasks,
      freshness = excluded.freshness,
      total = excluded.total
  `);

  const deleteMilestonesStmt = db.prepare(`DELETE FROM milestones WHERE projectId = ?`);
  const insertMilestoneStmt = db.prepare(`
    INSERT INTO milestones (id, projectId, name, status, description, ordering)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const deleteAttentionStmt = db.prepare(`DELETE FROM attention_items WHERE projectId = ?`);
  const insertAttentionStmt = db.prepare(`
    INSERT INTO attention_items (id, projectId, itemKey, severity, title, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const deleteSubmodulesStmt = db.prepare(`DELETE FROM submodules WHERE projectId = ?`);
  const insertSubmoduleStmt = db.prepare(`
    INSERT INTO submodules (id, projectId, name, relativePath, type, frameworks)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const p of projects) {
    // 1. Project Core
    insertProjectStmt.run(
      p.id,
      p.name,
      p.slug,
      p.path,
      p.relativePath,
      p.detectedType.primaryType,
      JSON.stringify(p.detectedType.frameworks || []),
      p.status,
      p.stage,
      p.priority,
      p.progress,
      p.health.total,
      p.health.tier,
      p.health.color,
      p.healthUrl || null,
      p.hasConfigYaml ? 1 : 0,
      p.config?.description || null,
      p.metrics.lastModifiedDate || null,
      p.scannedAt
    );

    // 2. Metrics
    insertMetricStmt.run(
      p.id,
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
      p.id,
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
    deleteMilestonesStmt.run(p.id);
    if (p.milestones && p.milestones.length > 0) {
      p.milestones.forEach((m, idx) => {
        insertMilestoneStmt.run(
          `${p.id}-m-${idx}`,
          p.id,
          m.name,
          m.status,
          m.description || null,
          idx
        );
      });
    }

    // 5. Attention Items
    deleteAttentionStmt.run(p.id);
    if (p.attentionItems && p.attentionItems.length > 0) {
      p.attentionItems.forEach((item, idx) => {
        insertAttentionStmt.run(
          `${p.id}-att-${idx}`,
          p.id,
          item.id,
          item.severity,
          item.title,
          item.reason
        );
      });
    }

    // 6. Submodules
    deleteSubmodulesStmt.run(p.id);
    if (p.submodules && p.submodules.length > 0) {
      p.submodules.forEach((sub, idx) => {
        insertSubmoduleStmt.run(
          `${p.id}-sub-${idx}`,
          p.id,
          sub.name,
          sub.relativePath,
          sub.type,
          JSON.stringify(sub.frameworks || [])
        );
      });
    }
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
