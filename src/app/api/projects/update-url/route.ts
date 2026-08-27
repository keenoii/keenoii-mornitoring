import { NextResponse } from 'next/server';
import db from '@/lib/sqlite-db';
import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, healthUrl, projectPath } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const cleanUrl = healthUrl ? healthUrl.trim() : null;

    // 1. Update in SQLite database
    const updateStmt = db.prepare(`
      UPDATE projects
      SET healthUrl = ?, updatedAt = datetime('now')
      WHERE id = ? OR path = ?
    `);
    updateStmt.run(cleanUrl, projectId, projectPath || '');

    // 2. If .project-monitor.yaml exists in project directory, update it as well (Single Source of Truth)
    let yamlUpdated = false;
    let targetPath = projectPath;

    if (!targetPath) {
      const proj = db.prepare(`SELECT path FROM projects WHERE id = ?`).get(projectId) as any;
      if (proj) targetPath = proj.path;
    }

    if (targetPath && fs.existsSync(targetPath)) {
      const yamlFileCandidates = ['.project-monitor.yaml', '.project-monitor.yml'];
      for (const yName of yamlFileCandidates) {
        const fullYamlPath = path.join(targetPath, yName);
        if (fs.existsSync(fullYamlPath)) {
          try {
            const rawYaml = fs.readFileSync(fullYamlPath, 'utf-8');
            let doc = (YAML.parse(rawYaml) as any) || {};
            if (cleanUrl) {
              doc.health_url = cleanUrl;
            } else {
              delete doc.health_url;
            }
            fs.writeFileSync(fullYamlPath, YAML.stringify(doc), 'utf-8');
            yamlUpdated = true;
          } catch (e) {
            console.error('Failed to update YAML health_url:', e);
          }
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      projectId,
      healthUrl: cleanUrl,
      yamlUpdated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update project URL' }, { status: 500 });
  }
}
