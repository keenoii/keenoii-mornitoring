export interface AIAnalysisRequest {
  projectName: string;
  type: string;
  stage: string;
  status: string;
  progress: number;
  healthScore: number;
  healthTier: string;
  healthBreakdown: Record<string, number>;
  gitInfo: {
    branch: string;
    lastCommitDate: string | null;
    uncommittedFiles: number;
    isDirty: boolean;
  };
  metrics: {
    todoCount: number;
    fixmeCount: number;
    hasReadme: boolean;
    hasTests: boolean;
    hasDocker: boolean;
    hasKubernetes: boolean;
  };
  milestones?: Array<{ name: string; status: string }>;
  readmeSummary?: string;
  todoSamples?: string[];
}

export interface AIAnalysisResponse {
  overallStatus: string;
  diagnosis: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  doNext: Array<{ action: string; estimatedGain: number; reason: string }>;
  estimatedHealth: string;
  doNotPrioritizeYet: string[];
  evidence: string[];
  confidence: number;
  findings: string[];
  recommendations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string;
  provider: string;
  model?: string;
  generatedAt: string;
}

export interface AIProvider {
  name: 'ollama' | 'gemini' | 'openai' | 'typhoon' | 'rule-engine';
  analyzeProject(data: AIAnalysisRequest): Promise<AIAnalysisResponse>;
  isAvailable(): Promise<boolean>;
}
