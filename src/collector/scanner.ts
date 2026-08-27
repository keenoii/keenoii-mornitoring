import * as fs from 'fs';
import * as path from 'path';
import {
  ProjectScanResult,
  ScanSummary,
  ProjectStatus,
  ProjectStage,
  ProjectPriority,
  Milestone,
  AttentionItem,
  ProjectMetrics,
  SubmoduleInfo,
} from './types';
import { detectProjectType } from './detector';
import { extractGitInfo } from './git';
import { scanTodosAndFixmes } from './todo';
import { parseProjectMonitorYaml } from './yaml-parser';
import { FORBIDDEN_DIRECTORIES, isForbiddenDirectory } from './privacy';

export interface ScanOptions {
  roots: string[];
  maxDepth?: number;
  verbose?: boolean;
}

export async function scanProjectDirectory(projectPath: string, rootDir: string): Promise<ProjectScanResult | null> {
  try {
    const stat = fs.statSync(projectPath);
    if (!stat.isDirectory()) return null;
  } catch {
    return null;
  }

  const folderName = path.basename(projectPath);
  if (isForbiddenDirectory(folderName)) return null;

  const relativePath = path.relative(rootDir, projectPath) || '.';
  const detectedType = detectProjectType(projectPath);
  const yamlResult = parseProjectMonitorYaml(projectPath);
  const gitInfo = await extractGitInfo(projectPath);
  const todoResult = await scanTodosAndFixmes(projectPath);

  // A directory is recognized as a project only if it has project indicator files, a git repository, or .project-monitor.yaml
  const isRecognized =
    detectedType.indicatorFiles.length > 0 ||
    detectedType.primaryType !== 'Unknown' ||
    gitInfo.isRepo ||
    yamlResult.hasConfig;

  if (!isRecognized) {
    return null;
  }

  // Read README if present
  let hasReadme = false;
  let readmePreview: string | undefined = undefined;
  const readmeCandidates = ['README.md', 'readme.md', 'README', 'README.txt'];
  for (const name of readmeCandidates) {
    const fullReadme = path.join(projectPath, name);
    if (fs.existsSync(fullReadme)) {
      hasReadme = true;
      try {
        const content = fs.readFileSync(fullReadme, 'utf-8');
        readmePreview = content.slice(0, 500);
      } catch {}
      break;
    }
  }

  // Detect tests
  const files = tryReadDir(projectPath);
  const hasTests =
    files.some((f) => /^(tests?|__tests__|spec|specs)$/i.test(f)) ||
    files.some((f) => /^(jest|vitest|playwright|cypress|pytest)\.config\./i.test(f));

  const hasDocker =
    detectedType.indicatorFiles.includes('Dockerfile') ||
    detectedType.indicatorFiles.includes('docker-compose.yml') ||
    files.some((f) => /^docker-compose.*\.ya?ml$/i.test(f));

  const hasKubernetes =
    detectedType.indicatorFiles.includes('Chart.yaml') ||
    detectedType.indicatorFiles.includes('deployment.yaml') ||
    files.some((f) => /^(k8s|kubernetes|helm)$/i.test(f));

  // Determine latest modified time from stats or git
  let lastModifiedDate = new Date().toISOString();
  if (gitInfo.lastCommitDate) {
    lastModifiedDate = new Date(gitInfo.lastCommitDate).toISOString();
  } else {
    try {
      lastModifiedDate = fs.statSync(projectPath).mtime.toISOString();
    } catch {}
  }

  const metrics: ProjectMetrics = {
    todoCount: todoResult.todoCount,
    fixmeCount: todoResult.fixmeCount,
    todoSamples: todoResult.samples,
    hasReadme,
    readmePreview,
    hasDocker,
    hasKubernetes,
    hasTests,
    lastModifiedDate,
    totalFiles: todoResult.totalScannedFiles,
  };

  // Determine Project Identity & Config overrides
  const cfg = yamlResult.config;
  const name = cfg?.name || folderName;

  // Generate stable, deterministic ID from normalized full path
  const normPath = projectPath.replace(/\\/g, '/').toLowerCase();
  const folderSlug = (name || folderName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  let hashVal = 5381;
  for (let i = 0; i < normPath.length; i++) {
    hashVal = ((hashVal << 5) + hashVal) + normPath.charCodeAt(i);
    hashVal = hashVal & hashVal;
  }
  const hexHash = Math.abs(hashVal).toString(16).slice(0, 6);
  const id = `${folderSlug}-${hexHash}`;
  const slug = id;

  // Status & Stage derivation
  const hasLiveDeployment = Boolean(cfg?.health_url);
  let stage: ProjectStage = cfg?.stage || (hasLiveDeployment ? 'Production' : 'Development');
  let status: ProjectStatus = cfg?.status || (hasLiveDeployment ? 'COMPLETED' : gitInfo.isRepo ? 'ACTIVE' : 'DISCOVERED');
  const priority: ProjectPriority = cfg?.priority || 'medium';

  // Calculate Progress (milestones based if available, or config override, or 100% if deployed)
  let progress = cfg?.progress ?? (hasLiveDeployment || stage === 'Production' ? 100 : 0);
  const milestones: Milestone[] = cfg?.milestones || [];

  if (milestones.length > 0 && cfg?.progress === undefined) {
    const doneCount = milestones.filter((m) => m.status === 'done').length;
    progress = Math.round((doneCount / milestones.length) * 100);
  }

  // Attention Queue Evaluation
  const attentionItems: AttentionItem[] = [];

  if (gitInfo.isRepo && gitInfo.uncommittedFiles > 10) {
    attentionItems.push({
      id: `${slug}-uncommitted`,
      projectId: slug,
      projectName: name,
      severity: 'warning',
      title: 'High uncommitted file drift',
      reason: `Found ${gitInfo.uncommittedFiles} uncommitted files in repository.`,
    });
  }

  if (metrics.fixmeCount > 0 && (stage === 'Production' || stage === 'Deployment')) {
    attentionItems.push({
      id: `${slug}-prod-fixme`,
      projectId: slug,
      projectName: name,
      severity: 'urgent',
      title: 'Unresolved FIXME in production stage',
      reason: `Found ${metrics.fixmeCount} FIXME comments while project is in ${stage} stage.`,
    });
  }

  if (status === 'BLOCKED') {
    attentionItems.push({
      id: `${slug}-blocked`,
      projectId: slug,
      projectName: name,
      severity: 'urgent',
      title: 'Project is blocked',
      reason: 'Project operational status is set to BLOCKED.',
    });
  }

  // Check staleness (> 30 days without commit in active project)
  if (gitInfo.lastCommitDate) {
    const diffDays = Math.floor(
      (Date.now() - new Date(gitInfo.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 90 && status === 'ACTIVE') {
      status = 'STALE';
      attentionItems.push({
        id: `${slug}-stale-90d`,
        projectId: slug,
        projectName: name,
        severity: 'info',
        title: 'Project inactive for > 90 days',
        reason: `No commits for ${diffDays} days. Consider archiving or updating status.`,
      });
    }
  }

  // Dynamic Submodule / Nested Service Detection (e.g. SRRU-Website -> next-srru-news, adminweb-srru)
  const submodules: SubmoduleInfo[] = [];
  const directChildDirs = tryReadDir(projectPath).filter((entry) => {
    try {
      const full = path.join(projectPath, entry);
      return fs.statSync(full).isDirectory() && !isForbiddenDirectory(entry);
    } catch {
      return false;
    }
  });

  for (const sub of directChildDirs) {
    const subDirPath = path.join(projectPath, sub);
    if (sub === 'apps' || sub === 'packages' || sub === 'services') {
      const nestedEntries = tryReadDir(subDirPath);
      for (const nested of nestedEntries) {
        const nestedPath = path.join(subDirPath, nested);
        try {
          if (fs.statSync(nestedPath).isDirectory() && !isForbiddenDirectory(nested)) {
            const subType = detectProjectType(nestedPath);
            if (subType.primaryType !== 'Unknown' || subType.indicatorFiles.length > 0) {
              submodules.push({
                name: `${sub}/${nested}`,
                relativePath: `${sub}/${nested}`,
                type: subType.primaryType,
                frameworks: subType.frameworks,
              });
            }
          }
        } catch {}
      }
    } else {
      const subType = detectProjectType(subDirPath);
      if (subType.primaryType !== 'Unknown' || subType.indicatorFiles.length > 0) {
        submodules.push({
          name: sub,
          relativePath: sub,
          type: subType.primaryType,
          frameworks: subType.frameworks,
        });
      }
    }
  }

  return {
    id: slug,
    name,
    slug,
    path: projectPath,
    relativePath,
    detectedType,
    status,
    stage,
    priority,
    progress,
    healthUrl: cfg?.health_url,
    hasConfigYaml: yamlResult.hasConfig,
    config: cfg,
    git: gitInfo,
    metrics,
    milestones,
    attentionItems,
    submodules: submodules.length > 0 ? submodules : undefined,
    scannedAt: new Date().toISOString(),
  };
}

async function discoverProjectsInDirectory(
  dirPath: string,
  rootDir: string,
  currentDepth: number,
  maxDepth: number
): Promise<ProjectScanResult[]> {
  if (currentDepth > maxDepth) return [];
  const folderName = path.basename(dirPath);
  if (isForbiddenDirectory(folderName)) return [];

  const isSelectedRoot = dirPath.toLowerCase() === rootDir.toLowerCase();

  // 1. Check if current directory itself is a recognized project
  const selfProject = await scanProjectDirectory(dirPath, rootDir);
  const results: ProjectScanResult[] = [];

  // If this directory is a project that does not contain further child projects, add it
  if (selfProject && (!selfProject.submodules || selfProject.submodules.length === 0)) {
    results.push(selfProject);
  } else if (selfProject && isSelectedRoot) {
    results.push(selfProject);
  }

  if (currentDepth < maxDepth) {
    const subEntries = tryReadDir(dirPath);
    const candidateSubDirs = subEntries
      .map((e) => path.join(dirPath, e))
      .filter((full) => {
        try {
          return fs.statSync(full).isDirectory() && !isForbiddenDirectory(path.basename(full));
        } catch {
          return false;
        }
      });

    const nestedBatch = await Promise.all(
      candidateSubDirs.map((sub) =>
        discoverProjectsInDirectory(sub, rootDir, currentDepth + 1, maxDepth)
      )
    );

    for (const nested of nestedBatch.flat()) {
      const nestedNorm = nested.path.replace(/\\/g, '/').toLowerCase();
      if (!results.some((r) => r.path.replace(/\\/g, '/').toLowerCase() === nestedNorm)) {
        results.push(nested);
      }
    }

    // If no nested projects found inside this directory, keep the parent project
    if (results.length === 0 && selfProject) {
      results.push(selfProject);
    }
  }

  return results;
}

export async function scanWorkspaceRoots(options: ScanOptions): Promise<ScanSummary> {
  const startTime = Date.now();
  const projectsMap = new Map<string, ProjectScanResult>();
  const scannedRoots = options.roots;
  const maxDepth = options.maxDepth || 3;

  for (const root of scannedRoots) {
    const resolvedRoot = path.resolve(root);
    if (!fs.existsSync(resolvedRoot)) continue;

    const discovered = await discoverProjectsInDirectory(resolvedRoot, resolvedRoot, 1, maxDepth);
    for (const p of discovered) {
      if (!projectsMap.has(p.path)) {
        projectsMap.set(p.path, p);
      }
    }
  }

  const projects = Array.from(projectsMap.values());

  let activeCount = 0;
  let needAttentionCount = 0;
  let staleCount = 0;
  let blockedCount = 0;
  let completedCount = 0;

  for (const p of projects) {
    const isCompleted = p.status === 'COMPLETED' || p.stage === 'Production' || Boolean(p.healthUrl || p.config?.health_url) || p.progress === 100;
    const isStale = p.status === 'STALE';
    if (p.status === 'ACTIVE' && !isStale && !isCompleted) activeCount++;
    if (isStale && !isCompleted) staleCount++;
    if (p.status === 'BLOCKED') blockedCount++;
    if (isCompleted) completedCount++;
    if (p.attentionItems && p.attentionItems.length > 0) needAttentionCount++;
  }

  return {
    scannedRoots,
    totalProjects: projects.length,
    activeCount,
    needAttentionCount,
    staleCount,
    blockedCount,
    completedCount,
    projects,
    scanDurationMs: Date.now() - startTime,
    scannedAt: new Date().toISOString(),
  };
}

function tryReadDir(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}
