import fg from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';
import { TodoItem } from './types';
import { FORBIDDEN_DIRECTORIES, isSensitiveFile, sanitizeText } from './privacy';

const SCAN_EXTENSIONS = [
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'py', 'go', 'rs', 'php', 'java', 'kt',
  'c', 'cpp', 'h', 'hpp', 'cs', 'rb',
  'sh', 'yaml', 'yml', 'json', 'md', 'html', 'css', 'scss', 'vue', 'svelte'
];

const MAX_FILES_TO_SCAN = 100;
const MAX_FILE_SIZE_BYTES = 256 * 1024; // 256 KB
const MAX_SAMPLES = 15;

export async function scanTodosAndFixmes(projectPath: string): Promise<{
  todoCount: number;
  fixmeCount: number;
  samples: TodoItem[];
  totalScannedFiles: number;
}> {
  const ignorePatterns = FORBIDDEN_DIRECTORIES.map((dir) => `**/${dir}/**`);
  const pattern = `**/*.{${SCAN_EXTENSIONS.join(',')}}`;

  let files: string[] = [];
  try {
    files = await fg(pattern, {
      cwd: projectPath,
      ignore: ignorePatterns,
      onlyFiles: true,
      dot: false,
      deep: 4, // Limit depth to prevent infinite traversals
      followSymbolicLinks: false,
      suppressErrors: true,
    });
  } catch {
    return { todoCount: 0, fixmeCount: 0, samples: [], totalScannedFiles: 0 };
  }

  const totalFiles = files.length;
  // Scan up to MAX_FILES_TO_SCAN for fast response
  const targetFiles = files.slice(0, MAX_FILES_TO_SCAN);

  let todoCount = 0;
  let fixmeCount = 0;
  const samples: TodoItem[] = [];

  const todoRegex = /\bTODO\b[:\s-]*(.*)/i;
  const fixmeRegex = /\bFIXME\b[:\s-]*(.*)/i;

  for (const relativeFile of targetFiles) {
    const fileName = path.basename(relativeFile);
    if (isSensitiveFile(fileName)) continue;

    const fullPath = path.join(projectPath, relativeFile);

    try {
      const stat = fs.statSync(fullPath);
      if (stat.size > MAX_FILE_SIZE_BYTES) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const fixmeMatch = line.match(fixmeRegex);
        if (fixmeMatch) {
          fixmeCount++;
          if (samples.length < MAX_SAMPLES) {
            samples.push({
              type: 'FIXME',
              file: relativeFile.replace(/\\/g, '/'),
              line: i + 1,
              text: sanitizeText(fixmeMatch[1]?.trim() || line.trim()).slice(0, 150),
            });
          }
          continue;
        }

        const todoMatch = line.match(todoRegex);
        if (todoMatch) {
          todoCount++;
          if (samples.length < MAX_SAMPLES) {
            samples.push({
              type: 'TODO',
              file: relativeFile.replace(/\\/g, '/'),
              line: i + 1,
              text: sanitizeText(todoMatch[1]?.trim() || line.trim()).slice(0, 150),
            });
          }
        }
      }
    } catch {
      // Ignore unreadable files
    }
  }

  return {
    todoCount,
    fixmeCount,
    samples,
    totalScannedFiles: files.length,
  };
}
