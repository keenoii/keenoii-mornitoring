import { ProjectScanResult } from '../collector/types';

export interface HealthDimensionDetail {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  reason: string;
  howToImprove: string;
  potentialGain: number;
}

export interface NextActionItem {
  type: 'urgent' | 'next' | 'later';
  title: string;
  action: string;
  potentialGain: number;
}

export interface HealthBreakdown {
  gitActivity: number;
  documentation: number;
  buildStatus: number;
  tests: number;
  deployment: number;
  openTasks: number;
  freshness: number;
  total: number;
  tier: 'Excellent' | 'Healthy' | 'Attention' | 'Risk' | 'Critical';
  color: 'emerald' | 'amber' | 'rose' | 'slate';
  dimensions: HealthDimensionDetail[];
  nextActions: {
    urgent?: NextActionItem;
    next?: NextActionItem;
    later?: NextActionItem;
  };
  estimatedPotentialTotal: number;
  isSmartStale: boolean;
  smartStaleReason?: string;
}

export function computeProjectHealth(project: ProjectScanResult): HealthBreakdown {
  let gitActivity = 0;
  let documentation = 0;
  let buildStatus = 15;
  let tests = 0;
  let deployment = 8;
  let openTasks = 10;
  let freshness = 0;

  const dimensions: HealthDimensionDetail[] = [];
  const nextActionsList: NextActionItem[] = [];

  // 1. Git Activity (max 15)
  let gitReason = 'ไม่พบ Git Repository';
  let gitImprove = 'ทำการ git init และสร้าง Repository เพื่อเก็บประวัติการทำงาน';
  let lastCommitDays = 999;

  if (project.git.isRepo) {
    if (project.git.lastCommitDate) {
      lastCommitDays = Math.floor(
        (Date.now() - new Date(project.git.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (lastCommitDays <= 3) {
        gitActivity = 15;
        gitReason = `Commit ล่าสุดเมื่อ ${lastCommitDays} วันที่ผ่านมา (Active มาก)`;
        gitImprove = 'รักษาความต่อเนื่องของการ Commit';
      } else if (lastCommitDays <= 7) {
        gitActivity = 12;
        gitReason = `Commit ล่าสุดเมื่อ ${lastCommitDays} วันก่อน`;
        gitImprove = 'Commit งานใหม่ภายในสัปดาห์นี้';
      } else if (lastCommitDays <= 14) {
        gitActivity = 8;
        gitReason = `Commit ล่าสุดเมื่อ ${lastCommitDays} วันก่อน`;
        gitImprove = 'เริ่มมีประวัติค้าง ควร Commit อัปเดตงาน';
      } else if (lastCommitDays <= 30) {
        gitActivity = 4;
        gitReason = `ไม่มี Commit ใหม่มา ${lastCommitDays} วัน`;
        gitImprove = 'Commit งานล่าสุดหรือบันทึกความคืบหน้า';
      } else {
        gitActivity = 1;
        gitReason = `ไม่มี Commit ใหม่มา ${lastCommitDays} วัน (> 30 วัน)`;
        gitImprove = 'Commit การเปลี่ยนแปลง หรือทบทวนสถานะโปรเจกต์';
      }
    } else {
      gitActivity = 8;
      gitReason = 'มี Git แต่ยังไม่พบประวัติ Commit';
      gitImprove = 'สร้าง Initial Commit แรกของโปรเจกต์';
    }

    // Penalty for uncommitted files
    if (project.git.uncommittedFiles > 5) {
      const penalty = Math.min(6, Math.floor(project.git.uncommittedFiles / 3));
      gitActivity = Math.max(0, gitActivity - penalty);
      gitReason += ` • มี ${project.git.uncommittedFiles} ไฟล์ค้างยังไม่ได้ Commit`;
      nextActionsList.push({
        type: 'urgent',
        title: 'Commit Uncommitted Changes',
        action: `Commit งานที่ค้างอยู่ ${project.git.uncommittedFiles} ไฟล์เพื่อลดความเสี่ยงโค้ดสูญหาย`,
        potentialGain: penalty + 2,
      });
    }
  }

  dimensions.push({
    key: 'gitActivity',
    label: 'Git Activity',
    score: gitActivity,
    maxScore: 15,
    reason: gitReason,
    howToImprove: gitImprove,
    potentialGain: 15 - gitActivity,
  });

  // 2. Documentation (max 10)
  let docReason = 'ไม่พบไฟล์ README.md';
  let docImprove = 'สร้างไฟล์ README.md ระบุวิธีรันและโครงสร้างโปรเจกต์';
  if (project.metrics.hasReadme) {
    documentation = 10;
    docReason = 'มีไฟล์ README.md ครบถ้วน';
    docImprove = 'อัปเดต README.md ให้ตรงกับเวอร์ชันปัจจุบันสม่ำเสมอ';
  } else if (project.hasConfigYaml) {
    documentation = 6;
    docReason = 'มีไฟล์ .project-monitor.yaml แต่ยังไม่มี README.md';
    docImprove = 'สร้างไฟล์ README.md เสริมเพื่อความสมบูรณ์ของเอกสาร';
    nextActionsList.push({
      type: 'urgent',
      title: 'Create README.md',
      action: 'สร้างไฟล์ README.md อธิบายภาพรวมโปรเจกต์และวิธีติดตั้ง',
      potentialGain: 4,
    });
  } else {
    documentation = 0;
    nextActionsList.push({
      type: 'urgent',
      title: 'Create README.md',
      action: 'สร้างไฟล์ README.md อธิบายภาพรวมโปรเจกต์และวิธีติดตั้ง',
      potentialGain: 10,
    });
  }

  dimensions.push({
    key: 'documentation',
    label: 'Documentation',
    score: documentation,
    maxScore: 10,
    reason: docReason,
    howToImprove: docImprove,
    potentialGain: 10 - documentation,
  });

  // 3. Build Status (max 20)
  dimensions.push({
    key: 'buildStatus',
    label: 'Build Status',
    score: buildStatus,
    maxScore: 20,
    reason: 'โครงสร้าง Package ถูกต้อง ไม่มีสัญญาณ Build Fail',
    howToImprove: 'ทดสอบ Build สม่ำเสมอเพื่อป้องกัน Dependency Drift',
    potentialGain: 20 - buildStatus,
  });

  // 4. Tests (max 20)
  let testReason = 'ไม่พบชุด Automated Test ในโปรเจกต์';
  let testImprove = 'เพิ่ม Vitest / Jest / Pytest สำหรับทดสอบ Core Logic';
  if (project.metrics.hasTests) {
    tests = 18;
    testReason = 'ตรวจพบไฟล์ Test ในโปรเจกต์';
    testImprove = 'เพิ่ม Test Coverage ให้ครอบคลุมจุดสำคัญ';
  } else {
    tests = 0;
    nextActionsList.push({
      type: 'later',
      title: 'Add Automated Tests',
      action: 'เพิ่ม Basic Unit / Integration Tests สำหรับ Core Logic',
      potentialGain: 18,
    });
  }

  dimensions.push({
    key: 'tests',
    label: 'Tests & QA',
    score: tests,
    maxScore: 20,
    reason: testReason,
    howToImprove: testImprove,
    potentialGain: 20 - tests,
  });

  // 5. Deployment & Runtime (max 15)
  let deployReason = 'โปรเจกต์ระดับ Local Codebase ทั่วไป';
  let deployImprove = 'เพิ่ม Dockerfile หรือตั้งค่า Deployment URL ใน .project-monitor.yaml';
  if (project.healthUrl) {
    deployment = 15;
    deployReason = `เชื่อมต่อ Live Deployment URL (${project.healthUrl})`;
    deployImprove = 'ตรวจสอบ SSL และ Latency สม่ำเสมอ';
  } else if (project.metrics.hasDocker || project.metrics.hasKubernetes) {
    deployment = 13;
    deployReason = 'ตรวจพบ Dockerfile / docker-compose.yml พร้อม Deploy';
    deployImprove = 'ระบุ Deployment URL เพื่อให้ Sentinel ตรวจสถานะ Live Online';
  } else {
    deployment = 8;
  }

  dimensions.push({
    key: 'deployment',
    label: 'Deployment & Runtime',
    score: deployment,
    maxScore: 15,
    reason: deployReason,
    howToImprove: deployImprove,
    potentialGain: 15 - deployment,
  });

  // 6. Open Tasks & Code Debt (max 10)
  const todo = project.metrics.todoCount;
  const fixme = project.metrics.fixmeCount;
  let taskReason = `TODO: ${todo}, FIXME: ${fixme}`;
  let taskImprove = 'เคลียร์จุด FIXME และแปลง TODO เป็น Milestone';

  if (todo <= 5 && fixme === 0) openTasks = 10;
  else if (todo <= 15 && fixme === 0) openTasks = 8;
  else if (todo <= 30) openTasks = 5;
  else openTasks = 2;
  openTasks = Math.max(0, openTasks - fixme * 2);

  if (fixme > 0) {
    nextActionsList.push({
      type: 'urgent',
      title: 'Resolve Critical FIXMEs',
      action: `แก้ไขจุด FIXME วิกฤต ${fixme} จุดในโค้ดก่อนนำขึ้น Production`,
      potentialGain: fixme * 2,
    });
  }

  dimensions.push({
    key: 'openTasks',
    label: 'Code Debt & Tasks',
    score: openTasks,
    maxScore: 10,
    reason: taskReason,
    howToImprove: taskImprove,
    potentialGain: 10 - openTasks,
  });

  // 7. Freshness (max 10)
  const lastMod = new Date(project.metrics.lastModifiedDate).getTime();
  const modDays = Math.floor((Date.now() - lastMod) / (1000 * 60 * 60 * 24));
  let freshReason = `ไฟล์มีการแก้ไขล่าสุดเมื่อ ${modDays} วันที่ผ่านมา`;
  let freshImprove = 'รักษาความต่อเนื่องของการพัฒนา';

  if (modDays <= 7) freshness = 10;
  else if (modDays <= 30) freshness = 7;
  else if (modDays <= 90) freshness = 4;
  else freshness = 0;

  dimensions.push({
    key: 'freshness',
    label: 'Project Freshness',
    score: freshness,
    maxScore: 10,
    reason: freshReason,
    howToImprove: freshImprove,
    potentialGain: 10 - freshness,
  });

  const total = Math.min(
    100,
    Math.max(0, gitActivity + documentation + buildStatus + tests + deployment + openTasks + freshness)
  );

  // Smart Stale Engine (Stage-aware)
  let isSmartStale = false;
  let smartStaleReason: string | undefined = undefined;

  if (project.stage === 'Development' || project.stage === 'Testing') {
    if (lastCommitDays > 14 && modDays > 14) {
      isSmartStale = true;
      smartStaleReason = `ระยะ ${project.stage} ไม่มีความเคลื่อนไหวเกิน 14 วัน (ล่าสุด ${Math.min(lastCommitDays, modDays)} วัน)`;
    }
  } else if (project.stage === 'Production') {
    // Production with health URL or Docker is NOT considered stale even if inactive for months
    isSmartStale = false;
  } else if (project.stage === 'Maintenance') {
    if (lastCommitDays > 90 && modDays > 90) {
      isSmartStale = true;
      smartStaleReason = 'ระยะ Maintenance ไม่มีความเคลื่อนไหวเกิน 90 วัน ควรพิจารณา Archive';
    }
  }

  // Tiers & Colors
  let tier: HealthBreakdown['tier'] = 'Attention';
  let color: HealthBreakdown['color'] = 'amber';

  if (total >= 90) {
    tier = 'Excellent';
    color = 'emerald';
  } else if (total >= 75) {
    tier = 'Healthy';
    color = 'emerald';
  } else if (total >= 60) {
    tier = 'Attention';
    color = 'amber';
  } else if (total >= 40) {
    tier = 'Risk';
    color = 'rose';
  } else {
    tier = 'Critical';
    color = 'rose';
  }

  // Extract structured Next Actions (1 Urgent, 1 Next, 1 Later)
  const urgent = nextActionsList.find((a) => a.type === 'urgent');
  const next =
    nextActionsList.find((a) => a.type === 'next') ||
    (nextActionsList.filter((a) => a.type === 'urgent')[1]
      ? { ...nextActionsList.filter((a) => a.type === 'urgent')[1], type: 'next' as const }
      : undefined);
  const later = nextActionsList.find((a) => a.type === 'later');

  const potentialGains = (urgent?.potentialGain || 0) + (next?.potentialGain || 0) + (later?.potentialGain || 0);
  const estimatedPotentialTotal = Math.min(100, total + Math.max(10, potentialGains));

  return {
    gitActivity,
    documentation,
    buildStatus,
    tests,
    deployment,
    openTasks,
    freshness,
    total,
    tier,
    color,
    dimensions,
    nextActions: {
      urgent,
      next,
      later,
    },
    estimatedPotentialTotal,
    isSmartStale,
    smartStaleReason,
  };
}
