import * as path from 'path';
import { scanWorkspaceRoots } from './scanner';

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes('--json');
  const targetPaths = args.filter((arg) => !arg.startsWith('--'));

  const rootsToScan = targetPaths.length > 0 ? targetPaths : [process.cwd()];

  if (!isJson) {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║       🛡️  KEENOII Project Sentinel - Project Collector      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`🔍 Scanning roots: ${rootsToScan.map((r) => path.resolve(r)).join(', ')}\n`);
  }

  const summary = await scanWorkspaceRoots({
    roots: rootsToScan,
  });

  if (isJson) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  // Summary Metrics Banner
  console.log('📊 COMMAND CENTER SUMMARY:');
  console.log(`   📁 Total Projects Found : ${summary.totalProjects}`);
  console.log(`   🟢 Active               : ${summary.activeCount}`);
  console.log(`   🔥 Need Attention       : ${summary.needAttentionCount}`);
  console.log(`   🟡 Stale                : ${summary.staleCount}`);
  console.log(`   🔴 Blocked              : ${summary.blockedCount}`);
  console.log(`   ✅ Completed            : ${summary.completedCount}`);
  console.log(`   ⚡ Scan Time            : ${summary.scanDurationMs}ms\n`);

  console.log('════════════════════════════════════════════════════════════════');
  console.log('📦 DISCOVERED PROJECTS:');
  console.log('════════════════════════════════════════════════════════════════\n');

  for (const project of summary.projects) {
    const statusIcon =
      project.status === 'ACTIVE'
        ? '🟢'
        : project.status === 'BLOCKED'
        ? '🔴'
        : project.status === 'STALE'
        ? '🟡'
        : project.status === 'COMPLETED'
        ? '✅'
        : '⚪';

    const gitBadge = project.git.isRepo
      ? `🌿 ${project.git.branch}${project.git.isDirty ? ` (dirty: ${project.git.uncommittedFiles} uncommitted)` : ' (clean)'}`
      : '⚠️ No Git Repo';

    const configBadge = project.hasConfigYaml ? '📄 .project-monitor.yaml' : '🔍 Auto-detected';

    console.log(`${statusIcon} ${project.name.toUpperCase()} [${project.detectedType.primaryType}]`);
    console.log(`   Path       : ${project.path}`);
    console.log(`   Stage      : ${project.stage} | Status: ${project.status} | Priority: ${project.priority}`);
    console.log(`   Progress   : ${project.progress}% [${'█'.repeat(Math.floor(project.progress / 10))}${'░'.repeat(10 - Math.floor(project.progress / 10))}]`);
    console.log(`   Git        : ${gitBadge}`);
    console.log(`   Config     : ${configBadge}`);
    console.log(`   Code Stats : TODO: ${project.metrics.todoCount} | FIXME: ${project.metrics.fixmeCount} | Scanned Files: ${project.metrics.totalFiles}`);
    console.log(`   Features   : Docker: ${project.metrics.hasDocker ? '✅' : '❌'} | Tests: ${project.metrics.hasTests ? '✅' : '❌'} | Readme: ${project.metrics.hasReadme ? '✅' : '❌'}`);

    if (project.milestones.length > 0) {
      console.log('   Milestones :');
      for (const ms of project.milestones) {
        const msIcon = ms.status === 'done' ? '✅' : ms.status === 'doing' ? '🟡' : ms.status === 'blocked' ? '🔴' : '⚪';
        console.log(`      ${msIcon} ${ms.name} (${ms.status})`);
      }
    }

    if (project.attentionItems.length > 0) {
      console.log('   ⚠️  Attention Required:');
      for (const item of project.attentionItems) {
        const alertIcon = item.severity === 'urgent' ? '🚨' : item.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`      ${alertIcon} [${item.severity.toUpperCase()}] ${item.title} - ${item.reason}`);
      }
    }

    console.log('─'.repeat(64));
  }
}

main().catch((err) => {
  console.error('❌ Collector error:', err);
  process.exit(1);
});
