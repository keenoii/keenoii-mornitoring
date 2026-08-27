import db from '../lib/sqlite-db';
import { ProjectWithHealth } from '../lib/project-repository';

export interface ProjectChangeDelta {
  projectId: string;
  projectName: string;
  previousHealth?: number;
  currentHealth: number;
  healthDelta: number;
  isImproved: boolean;
  isDecreased: boolean;
  uncommittedFiles: number;
  changeHighlights: string[];
}

export interface MorningBriefing {
  totalProjects: number;
  changedCount: number;
  improvedCount: number;
  decreasedCount: number;
  staleCount: number;
  changes: ProjectChangeDelta[];
  topFocusProjects: Array<{
    project: ProjectWithHealth;
    focusReason: string;
    actionHighlight: string;
    estimatedHealth: string;
  }>;
  generatedAt: string;
}

/**
 * Compare current scan results against previous snapshot in SQLite
 */
export function computeScanDiff(currentProjects: ProjectWithHealth[]): MorningBriefing {
  // 1. Fetch previous snapshot from SQLite
  let previousSummaryMap = new Map<string, { healthScore: number; uncommittedFiles: number; totalFiles: number }>();

  try {
    const latestSnapshot = db.prepare(`SELECT * FROM scan_snapshots ORDER BY timestamp DESC LIMIT 1`).get() as any;
    if (latestSnapshot && latestSnapshot.summaryJson) {
      const parsed = JSON.parse(latestSnapshot.summaryJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((p: any) => {
          previousSummaryMap.set(p.id, {
            healthScore: p.healthScore,
            uncommittedFiles: p.uncommittedFiles || 0,
            totalFiles: p.totalFiles || 0,
          });
        });
      }
    }
  } catch {}

  const changes: ProjectChangeDelta[] = [];
  let improvedCount = 0;
  let decreasedCount = 0;
  let staleCount = 0;

  for (const p of currentProjects) {
    if (p.health.isSmartStale) staleCount++;

    const prev = previousSummaryMap.get(p.id);
    const highlights: string[] = [];
    let healthDelta = 0;

    if (prev) {
      healthDelta = p.health.total - prev.healthScore;
      if (healthDelta > 0) {
        improvedCount++;
        highlights.push(`Health เพิ่มขึ้น ${prev.healthScore} → ${p.health.total} (+${healthDelta})`);
      } else if (healthDelta < 0) {
        decreasedCount++;
        highlights.push(`Health ลดลง ${prev.healthScore} → ${p.health.total} (${healthDelta})`);
      }

      if (p.git.uncommittedFiles > prev.uncommittedFiles) {
        highlights.push(`พบไฟล์ค้าง Commit เพิ่มขึ้น (${p.git.uncommittedFiles} files)`);
      }

      if (p.metrics.totalFiles !== prev.totalFiles) {
        const fileDiff = p.metrics.totalFiles - prev.totalFiles;
        highlights.push(`${fileDiff > 0 ? `+${fileDiff}` : fileDiff} files`);
      }
    } else {
      highlights.push('ตรวจพบโปรเจกต์ใหม่ในระบบ');
    }

    if (highlights.length > 0) {
      changes.push({
        projectId: p.id,
        projectName: p.name,
        previousHealth: prev?.healthScore,
        currentHealth: p.health.total,
        healthDelta,
        isImproved: healthDelta > 0,
        isDecreased: healthDelta < 0,
        uncommittedFiles: p.git.uncommittedFiles,
        changeHighlights: highlights,
      });
    }
  }

  // 2. Determine Top 3 Focus Projects for the Owner today based on RECENT ACTIVITY & URGENCY
  const scoredProjects = currentProjects.map((p) => {
    let focusScore = 0;
    let focusReason = '';
    let actionHighlight = '';

    // A. Recency Score (Recent Commits & File Edits)
    const lastActiveTime = p.git.lastCommitDate
      ? new Date(p.git.lastCommitDate).getTime()
      : p.metrics.lastModifiedDate
      ? new Date(p.metrics.lastModifiedDate).getTime()
      : 0;

    const hoursSinceActive = lastActiveTime > 0 ? (Date.now() - lastActiveTime) / (1000 * 60 * 60) : 9999;
    const daysSinceActive = hoursSinceActive / 24;

    // Active within 24 hours: Highest recency priority
    if (hoursSinceActive <= 24) {
      focusScore += 100;
      focusReason = '🔥 มีความเคลื่อนไหวล่าสุดในวันนี้';
    } else if (daysSinceActive <= 3) {
      focusScore += 70;
      focusReason = `⚡ มีการพัฒนาต่อเนื่อง (${Math.round(daysSinceActive)} วันที่แล้ว)`;
    } else if (daysSinceActive <= 7) {
      focusScore += 40;
      focusReason = '💻 โปรเจกต์ที่กำลังพัฒนาในสัปดาห์นี้';
    } else if (p.health.isSmartStale || p.status === 'STALE' || daysSinceActive > 30) {
      // Stale projects get penalized so they don't block current active work
      focusScore -= 50;
    }

    // B. Dirty Git Drift in Active Projects (Currently being coded)
    if (p.git.isDirty && p.git.uncommittedFiles > 0) {
      focusScore += Math.min(30, p.git.uncommittedFiles * 3);
      if (!focusReason) focusReason = `มี ${p.git.uncommittedFiles} ไฟล์ที่ค้างยังไม่ได้ Commit`;
      actionHighlight = `🔴 Commit งานที่กำลังทำอยู่ ${p.git.uncommittedFiles} ไฟล์ (+${Math.min(6, p.git.uncommittedFiles)})`;
    }

    // C. Action Highlight & Urgent Actions
    if (p.metrics.fixmeCount > 0 && !p.health.isSmartStale) {
      focusScore += 25 + p.metrics.fixmeCount * 2;
      focusReason = focusReason || `พบจุดวิกฤต FIXME ${p.metrics.fixmeCount} จุดในโค้ด`;
      actionHighlight = actionHighlight || `🔴 เคลียร์จุด FIXME ${p.metrics.fixmeCount} จุด (+${p.metrics.fixmeCount * 2})`;
    } else if (p.health.nextActions.urgent && !p.health.isSmartStale) {
      focusScore += 20;
      focusReason = focusReason || p.health.nextActions.urgent.title;
      actionHighlight = actionHighlight || `🔴 ${p.health.nextActions.urgent.action} (+${p.health.nextActions.urgent.potentialGain})`;
    } else if (!p.metrics.hasReadme && !p.health.isSmartStale) {
      focusScore += 15;
      focusReason = focusReason || 'ยังไม่มีเอกสาร README.md';
      actionHighlight = actionHighlight || '🔴 สร้าง README.md (+10)';
    } else if (p.health.nextActions.next && !p.health.isSmartStale) {
      focusScore += 10;
      focusReason = focusReason || p.health.nextActions.next.title;
      actionHighlight = actionHighlight || `🟡 ${p.health.nextActions.next.action} (+${p.health.nextActions.next.potentialGain})`;
    } else {
      actionHighlight = actionHighlight || '🟢 พัฒนาต่อตาม Roadmap';
      focusReason = focusReason || `ดูแลความต่อเนื่องของโปรเจกต์ในระยะ ${p.stage}`;
    }

    const estimatedHealth = `${p.health.total} → ${p.health.estimatedPotentialTotal}`;

    return {
      project: p,
      focusScore,
      focusReason,
      actionHighlight,
      estimatedHealth,
    };
  });

  scoredProjects.sort((a, b) => b.focusScore - a.focusScore);
  const topFocusProjects = scoredProjects.slice(0, 3);

  // 3. Save new snapshot to SQLite for future diffing
  try {
    const summaryList = currentProjects.map((p) => ({
      id: p.id,
      healthScore: p.health.total,
      uncommittedFiles: p.git.uncommittedFiles,
      totalFiles: p.metrics.totalFiles,
    }));

    db.prepare(`
      INSERT INTO scan_snapshots (id, timestamp, totalProjects, summaryJson)
      VALUES (?, ?, ?, ?)
    `).run(
      `snap-${Date.now()}`,
      new Date().toISOString(),
      currentProjects.length,
      JSON.stringify(summaryList)
    );
  } catch {}

  return {
    totalProjects: currentProjects.length,
    changedCount: changes.length,
    improvedCount,
    decreasedCount,
    staleCount,
    changes,
    topFocusProjects,
    generatedAt: new Date().toISOString(),
  };
}
