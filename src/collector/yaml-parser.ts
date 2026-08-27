import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import { z } from 'zod';
import { MonitorYamlConfig, MilestoneStatus, ProjectStatus, ProjectStage, ProjectPriority } from './types';

const MilestoneSchema = z.object({
  name: z.string(),
  status: z.enum(['todo', 'doing', 'done', 'blocked']).default('todo'),
  description: z.string().optional(),
});

const MonitorConfigSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['discovered', 'active', 'blocked', 'stale', 'completed', 'archived'])
    .transform((val) => val.toUpperCase() as ProjectStatus)
    .optional(),
  stage: z.enum(['planning', 'development', 'testing', 'deployment', 'production', 'maintenance'])
    .transform((val) => (val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()) as ProjectStage)
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  progress: z.number().min(0).max(100).optional(),
  health_url: z.string().url().optional().or(z.literal('')),
  repository: z.object({
    type: z.string().optional(),
    url: z.string().optional(),
  }).optional(),
  milestones: z.array(MilestoneSchema).optional(),
  monitor: z.object({
    git: z.boolean().optional(),
    build: z.boolean().optional(),
    health: z.boolean().optional(),
    todo: z.boolean().optional(),
  }).optional(),
  ai: z.object({
    enabled: z.boolean().optional(),
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
  }).optional(),
});

export function parseProjectMonitorYaml(projectPath: string): {
  hasConfig: boolean;
  config?: MonitorYamlConfig;
  filePath?: string;
  error?: string;
} {
  const yamlNames = ['.project-monitor.yaml', '.project-monitor.yml'];
  let targetFile: string | null = null;

  for (const name of yamlNames) {
    const fullPath = path.join(projectPath, name);
    if (fs.existsSync(fullPath)) {
      targetFile = fullPath;
      break;
    }
  }

  if (!targetFile) {
    return { hasConfig: false };
  }

  try {
    const rawContent = fs.readFileSync(targetFile, 'utf-8');
    const parsed = YAML.parse(rawContent);
    if (!parsed || typeof parsed !== 'object') {
      return { hasConfig: true, filePath: targetFile };
    }

    const validated = MonitorConfigSchema.parse(parsed);

    return {
      hasConfig: true,
      config: validated as MonitorYamlConfig,
      filePath: targetFile,
    };
  } catch (err: any) {
    return {
      hasConfig: true,
      filePath: targetFile,
      error: err?.message || 'Failed to parse .project-monitor.yaml',
    };
  }
}
