import { NextResponse } from 'next/server';
import { getAIAdvisor } from '@/advisor';
import { AIAnalysisRequest } from '@/advisor/types';
import db from '@/lib/sqlite-db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project, provider = 'auto', apiKey } = body;

    if (!project) {
      return NextResponse.json({ error: 'Missing project data' }, { status: 400 });
    }

    const payload: AIAnalysisRequest = {
      projectName: project.name,
      type: project.detectedType?.primaryType || 'Node.js',
      stage: project.stage || 'Development',
      status: project.status || 'ACTIVE',
      progress: project.progress || 0,
      healthScore: project.health?.total || 0,
      healthTier: project.health?.tier || 'Healthy',
      healthBreakdown: {
        gitActivity: project.health?.gitActivity || 0,
        documentation: project.health?.documentation || 0,
        buildStatus: project.health?.buildStatus || 0,
        tests: project.health?.tests || 0,
        deployment: project.health?.deployment || 0,
        openTasks: project.health?.openTasks || 0,
        freshness: project.health?.freshness || 0,
      },
      gitInfo: {
        branch: project.git?.branch || 'unknown',
        lastCommitDate: project.git?.lastCommitDate || null,
        uncommittedFiles: project.git?.uncommittedFiles || 0,
        isDirty: Boolean(project.git?.isDirty),
      },
      metrics: {
        todoCount: project.metrics?.todoCount || 0,
        fixmeCount: project.metrics?.fixmeCount || 0,
        hasReadme: Boolean(project.metrics?.hasReadme),
        hasTests: Boolean(project.metrics?.hasTests),
        hasDocker: Boolean(project.metrics?.hasDocker),
        hasKubernetes: Boolean(project.metrics?.hasKubernetes),
      },
      milestones: project.milestones?.map((m: any) => ({ name: m.name, status: m.status })),
      readmeSummary: project.metrics?.readmePreview,
      todoSamples: project.metrics?.todoSamples?.map((t: any) => t.text || t),
    };

    const advisor = await getAIAdvisor(provider, apiKey);
    const analysis = await advisor.analyzeProject(payload);

    // Save advice snapshot to SQLite DB
    try {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS ai_advices (
          id TEXT PRIMARY KEY,
          projectId TEXT NOT NULL,
          overallStatus TEXT NOT NULL,
          findings TEXT NOT NULL,
          recommendations TEXT NOT NULL,
          riskLevel TEXT NOT NULL,
          reasoning TEXT NOT NULL,
          provider TEXT NOT NULL,
          model TEXT,
          generatedAt TEXT NOT NULL
        )
      `).run();

      const insertAdviceStmt = db.prepare(`
        INSERT INTO ai_advices (
          id, projectId, overallStatus, findings, recommendations,
          riskLevel, reasoning, provider, model, generatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertAdviceStmt.run(
        `advice-${project.id}-${Date.now()}`,
        project.id,
        analysis.overallStatus,
        JSON.stringify(analysis.findings),
        JSON.stringify(analysis.recommendations),
        analysis.riskLevel,
        analysis.reasoning,
        analysis.provider,
        analysis.model || null,
        analysis.generatedAt
      );
    } catch (e) {
      console.warn('Could not save advice to SQLite:', e);
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate AI advice' },
      { status: 500 }
    );
  }
}
