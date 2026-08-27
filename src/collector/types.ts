export type ProjectStatus =
  | 'DISCOVERED'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'STALE'
  | 'COMPLETED'
  | 'ARCHIVED';

export type ProjectStage =
  | 'Planning'
  | 'Development'
  | 'Testing'
  | 'Deployment'
  | 'Production'
  | 'Maintenance';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export type MilestoneStatus = 'todo' | 'doing' | 'done' | 'blocked';

export interface Milestone {
  name: string;
  status: MilestoneStatus;
  description?: string;
}

export interface GitInfo {
  isRepo: boolean;
  branch: string;
  isDirty: boolean;
  uncommittedFiles: number;
  lastCommitDate: string | null;
  lastCommitMessage: string | null;
  lastCommitAuthor: string | null;
  remoteUrl: string | null;
}

export interface TodoItem {
  type: 'TODO' | 'FIXME';
  file: string;
  line: number;
  text: string;
}

export interface ProjectMetrics {
  todoCount: number;
  fixmeCount: number;
  todoSamples: TodoItem[];
  hasReadme: boolean;
  readmePreview?: string;
  hasDocker: boolean;
  hasKubernetes: boolean;
  hasTests: boolean;
  lastModifiedDate: string;
  totalFiles: number;
}

export interface ProjectDetectorResult {
  primaryType: string;
  frameworks: string[];
  languages: string[];
  indicatorFiles: string[];
}

export interface MonitorYamlConfig {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  stage?: ProjectStage;
  priority?: ProjectPriority;
  progress?: number;
  health_url?: string;
  repository?: {
    type?: string;
    url?: string;
  };
  milestones?: Array<{
    name: string;
    status: MilestoneStatus;
    description?: string;
  }>;
  monitor?: {
    git?: boolean;
    build?: boolean;
    health?: boolean;
    todo?: boolean;
  };
  ai?: {
    enabled?: boolean;
    include?: string[];
    exclude?: string[];
  };
}

export interface AttentionItem {
  id: string;
  projectId: string;
  projectName: string;
  severity: 'urgent' | 'warning' | 'info';
  title: string;
  reason: string;
}

export interface SubmoduleInfo {
  name: string;
  relativePath: string;
  type: string;
  frameworks: string[];
}

export interface ProjectScanResult {
  id: string;
  name: string;
  slug: string;
  path: string;
  relativePath: string;
  detectedType: ProjectDetectorResult;
  status: ProjectStatus;
  stage: ProjectStage;
  priority: ProjectPriority;
  progress: number;
  healthUrl?: string;
  hasConfigYaml: boolean;
  config?: MonitorYamlConfig;
  git: GitInfo;
  metrics: ProjectMetrics;
  milestones: Milestone[];
  attentionItems: AttentionItem[];
  submodules?: SubmoduleInfo[];
  scannedAt: string;
}

export interface ScanSummary {
  scannedRoots: string[];
  totalProjects: number;
  activeCount: number;
  needAttentionCount: number;
  staleCount: number;
  blockedCount: number;
  completedCount: number;
  projects: ProjectScanResult[];
  scanDurationMs: number;
  scannedAt: string;
}
