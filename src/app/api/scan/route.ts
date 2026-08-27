import { NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import { scanWorkspaceRoots } from '@/collector/scanner';
import { computeProjectHealth } from '@/lib/health';
import { saveScanResultsToDb, getProjectsFromDb } from '@/lib/project-repository';
import { computeScanDiff } from '@/collector/diff';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const customRoot = searchParams.get('root');
  const customRoots = searchParams.get('roots');

  let rootsToScan: string[] = [];
  if (customRoots) {
    rootsToScan = customRoots
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r && fs.existsSync(r));
  } else if (customRoot && fs.existsSync(customRoot)) {
    rootsToScan = [customRoot];
  } else {
    // Default to parent workspace directory (e.g. D:\MyProject)
    const parentDir = path.resolve(process.cwd(), '..');
    rootsToScan = [parentDir];
  }

  // 1. If not forcing a refresh, check SQLite database first for instant 0ms load!
  if (!forceRefresh) {
    try {
      const allDbProjects = await getProjectsFromDb();
      let dbProjects: typeof allDbProjects = [];

      if (customRoot) {
        const norm = customRoot.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
        dbProjects = allDbProjects.filter((p) =>
          p.path.replace(/\\/g, '/').toLowerCase().startsWith(norm)
        );
      } else if (customRoots) {
        const normRoots = rootsToScan.map((r) =>
          r.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
        );
        dbProjects = allDbProjects.filter((p) => {
          const pNorm = p.path.replace(/\\/g, '/').toLowerCase();
          return normRoots.some((r) => pNorm.startsWith(r));
        });
      } else {
        dbProjects = allDbProjects;
      }

      // Deduplicate by path
      const uniqueMap = new Map<string, (typeof allDbProjects)[0]>();
      for (const p of dbProjects) {
        const key = p.path.replace(/\\/g, '/').toLowerCase();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, p);
        }
      }
      dbProjects = Array.from(uniqueMap.values());

      if (dbProjects.length > 0) {
        let activeCount = 0;
        let needAttentionCount = 0;
        let staleCount = 0;
        let blockedCount = 0;
        let completedCount = 0;

        for (const p of dbProjects) {
          const isCompleted =
            p.status === 'COMPLETED' ||
            p.stage === 'Production' ||
            Boolean(p.healthUrl || p.config?.health_url) ||
            p.progress === 100;
          const isStale = p.status === 'STALE' || p.health.isSmartStale;

          if (isCompleted) completedCount++;
          else if (p.status === 'BLOCKED') blockedCount++;
          else if (isStale) staleCount++;
          else if (p.status === 'ACTIVE') activeCount++;

          if (p.attentionItems && p.attentionItems.length > 0) needAttentionCount++;
        }

        const intelligence = computeScanDiff(dbProjects);

        return NextResponse.json({
          scannedRoots: rootsToScan,
          totalProjects: dbProjects.length,
          activeCount,
          needAttentionCount,
          staleCount,
          blockedCount,
          completedCount,
          projects: dbProjects,
          intelligence,
          scanDurationMs: 5,
          scannedAt: dbProjects[0]?.scannedAt || new Date().toISOString(),
          fromDatabase: true,
        });
      }
    } catch {
      // Fallback to live scan if DB query fails
    }
  }

  // 2. Perform live filesystem scan
  try {
    const summary = await scanWorkspaceRoots({
      roots: rootsToScan,
    });

    // Augment with computed Health Scores
    const projectsWithHealth = summary.projects.map((p) => {
      const health = computeProjectHealth(p);
      return {
        ...p,
        health,
      };
    });

    // Compute Scan Diff & Morning Intelligence Briefing
    const intelligence = computeScanDiff(projectsWithHealth);

    // Persist scanned results into SQLite database synchronously
    try {
      await saveScanResultsToDb(projectsWithHealth);
    } catch (err) {
      console.error('Failed to save scan results to SQLite:', err);
    }

    return NextResponse.json({
      ...summary,
      projects: projectsWithHealth,
      intelligence,
      fromDatabase: false,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to scan projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
