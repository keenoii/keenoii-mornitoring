import { ProjectWithHealth } from './project-repository';

export interface StudioDefinition {
  id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
  themeColor: string;
  borderColor: string;
  bgGradient: string;
  isDynamic?: boolean;
}

export interface ClassificationResult {
  primaryStudioId: string;
  genres: string[];
  workerState: 'active_typer' | 'thinking' | 'fixing' | 'healthy' | 'alert' | 'sleeping';
  confidence: number;
  evidence: Array<{ factor: string; points: number }>;
}

export const VIRTUAL_STUDIOS: StudioDefinition[] = [
  {
    id: 'web',
    name: 'Web Development Studio',
    code: 'WEB-DEV',
    icon: '🌐',
    description: 'Next.js, React, Tailwind, Frontend & Fullstack Web Applications',
    themeColor: '#38bdf8',
    borderColor: 'border-sky-500/40',
    bgGradient: 'from-sky-950/40 via-slate-900 to-slate-950',
  },
  {
    id: 'ai',
    name: 'AI & Automation Lab',
    code: 'AI-LAB',
    icon: '🤖',
    description: 'Typhoon LLM, Ollama, n8n, AI Agents & Python Automation',
    themeColor: '#a855f7',
    borderColor: 'border-purple-500/40',
    bgGradient: 'from-purple-950/40 via-slate-900 to-slate-950',
  },
  {
    id: 'infra',
    name: 'Network & Infrastructure NOC',
    code: 'NOC-OPS',
    icon: '🛰️',
    description: 'Docker, Kubernetes, Go, Reverse Proxies & System Monitoring',
    themeColor: '#06b6d4',
    borderColor: 'border-cyan-500/40',
    bgGradient: 'from-cyan-950/40 via-slate-900 to-slate-950',
  },
  {
    id: 'data',
    name: 'Data & Database Room',
    code: 'DATA-OPS',
    icon: '🗄️',
    description: 'PostgreSQL, MariaDB, SQLite, Migration Scripts & ETL Pipelines',
    themeColor: '#f59e0b',
    borderColor: 'border-amber-500/40',
    bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
  },
  {
    id: 'media',
    name: 'Media & Creative Studio',
    code: 'MEDIA-LAB',
    icon: '🎨',
    description: 'OBS Overlays, Graphic Generators, Video Tools & Digital Assets',
    themeColor: '#ec4899',
    borderColor: 'border-pink-500/40',
    bgGradient: 'from-pink-950/40 via-slate-900 to-slate-950',
  },
  {
    id: 'lab',
    name: 'Experimental & POC Lab',
    code: 'POC-LAB',
    icon: '🧪',
    description: 'Prototypes, Research Sandboxes, CLI Scripts & Early Exploration',
    themeColor: '#10b981',
    borderColor: 'border-emerald-500/40',
    bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-950',
  },
  {
    id: 'warroom',
    name: '🚨 WAR ROOM (Emergency Center)',
    code: 'WAR-ROOM',
    icon: '🚨',
    description: 'Projects with Health < 60, Blocked, or Urgent Attention Items',
    themeColor: '#f43f5e',
    borderColor: 'border-rose-500/60 shadow-lg shadow-rose-950/50',
    bgGradient: 'from-rose-950/60 via-slate-900 to-slate-950',
    isDynamic: true,
  },
  {
    id: 'archive',
    name: 'Archive & Dormant Lounge',
    code: 'DORMANT',
    icon: '😴',
    description: 'Stale (>14-30d inactive) or Completed Projects Rest Area',
    themeColor: '#64748b',
    borderColor: 'border-slate-700/60',
    bgGradient: 'from-slate-950 via-slate-900 to-slate-950',
    isDynamic: true,
  },
];

/**
 * Classify a project into a virtual studio with domain intent precedence
 */
export function classifyProjectStudio(
  p: ProjectWithHealth,
  customOverrideStudioId?: string
): ClassificationResult {
  const name = p.name.toLowerCase();
  const primaryType = (p.detectedType?.primaryType || '').toLowerCase();
  const frameworks = (p.detectedType?.frameworks || []).map((f) => f.toLowerCase());
  const path = p.path.toLowerCase();
  const allText = `${name} ${primaryType} ${frameworks.join(' ')} ${path}`;

  const evidence: Array<{ factor: string; points: number }> = [];
  const genres: string[] = [];

  let webScore = 0;
  let aiScore = 0;
  let infraScore = 0;
  let dataScore = 0;
  let mediaScore = 0;
  let labScore = 0;

  // 1. AI & Automation Domain Intent (High Weight)
  if (name.includes('agent') || name.includes('ai') || name.includes('llm') || name.includes('ollama') || name.includes('typhoon') || name.includes('n8n') || name.includes('automate') || name.includes('ide')) {
    aiScore += 60;
    evidence.push({ factor: 'Domain: AI Agent & LLM Automation', points: 60 });
    genres.push('AI');
  } else if (allText.includes('ollama') || allText.includes('n8n') || allText.includes('python')) {
    aiScore += 35;
    evidence.push({ factor: 'AI Tooling / Python', points: 35 });
    genres.push('AI');
  }

  // 2. Media & Creative Domain Intent (High Weight)
  if (name.includes('media') || name.includes('video') || name.includes('movie') || name.includes('obs') || name.includes('banner') || name.includes('capture') || name.includes('stream')) {
    mediaScore += 60;
    evidence.push({ factor: 'Domain: Media Streaming & Creative Tools', points: 60 });
    genres.push('Media');
  }

  // 3. Infrastructure & DevOps Domain Intent (High Weight)
  if (name.includes('monitor') || name.includes('sentinel') || name.includes('k8s') || name.includes('proxy') || name.includes('caddy') || name.includes('noc') || name.includes('network') || name.includes('infra')) {
    infraScore += 60;
    evidence.push({ factor: 'Domain: System Operations & Monitoring', points: 60 });
    genres.push('Infrastructure');
  } else if (p.metrics.hasKubernetes || (p.metrics.hasDocker && !allText.includes('next'))) {
    infraScore += 35;
    evidence.push({ factor: 'Containerized Infrastructure', points: 35 });
    genres.push('Infrastructure');
  }

  // 4. Data & Database Domain Intent (High Weight)
  if (name.includes('sql') || name.includes('db') || name.includes('backup') || name.includes('migration') || name.includes('postgres') || name.includes('mysql') || name.includes('data')) {
    dataScore += 60;
    evidence.push({ factor: 'Domain: Database & SQL Pipelines', points: 60 });
    genres.push('Data');
  }

  // 5. Experimental & POC Domain Intent
  if (name.includes('game') || name.includes('poc') || name.includes('demo') || name.includes('test') || name.includes('simple') || name.includes('sample') || name.includes('prototype') || name.includes('alumni')) {
    labScore += 50;
    evidence.push({ factor: 'Domain: Research POC & Prototype Lab', points: 50 });
    genres.push('POC/Lab');
  }

  // 6. Web Development (Web Applications & Portals)
  if (allText.includes('next')) {
    webScore += 30;
    evidence.push({ factor: 'Next.js Web Application', points: 30 });
    genres.push('Web');
  } else if (allText.includes('react') || allText.includes('vue') || allText.includes('laravel') || allText.includes('web') || allText.includes('huso') || allText.includes('srru')) {
    webScore += 25;
    evidence.push({ factor: 'Web Frontend & Fullstack', points: 25 });
    genres.push('Web');
  }

  // Determine Worker State
  let workerState: ClassificationResult['workerState'] = 'thinking';

  if (p.health.isSmartStale || p.status === 'STALE') {
    workerState = 'sleeping';
  } else if (p.health.total < 60 || p.status === 'BLOCKED') {
    workerState = 'alert';
  } else if (p.git.isDirty || (p.git.lastCommitDate && isRecent(p.git.lastCommitDate, 3))) {
    workerState = 'active_typer';
  } else if (p.health.total >= 80) {
    workerState = 'healthy';
  } else if (p.metrics.fixmeCount > 0) {
    workerState = 'fixing';
  }

  // Score comparison
  const scores = [
    { id: 'ai', score: aiScore },
    { id: 'media', score: mediaScore },
    { id: 'infra', score: infraScore },
    { id: 'data', score: dataScore },
    { id: 'lab', score: labScore },
    { id: 'web', score: webScore },
  ];

  scores.sort((a, b) => b.score - a.score);
  let primaryStudioId = customOverrideStudioId || (scores[0].score > 0 ? scores[0].id : 'web');

  const maxScore = scores[0].score;
  const confidence = maxScore >= 50 ? 95 : maxScore >= 25 ? 85 : 75;

  return {
    primaryStudioId,
    genres: Array.from(new Set(genres)).length > 0 ? Array.from(new Set(genres)) : ['General'],
    workerState,
    confidence,
    evidence: evidence.length > 0 ? evidence : [{ factor: 'General Codebase Architecture', points: 20 }],
  };
}

function isRecent(dateStr: string, days: number): boolean {
  try {
    const d = new Date(dateStr);
    const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= days;
  } catch {
    return false;
  }
}
