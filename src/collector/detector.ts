import * as fs from 'fs';
import * as path from 'path';
import { ProjectDetectorResult } from './types';

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export function detectProjectType(projectPath: string): ProjectDetectorResult {
  const frameworks: string[] = [];
  const languages: string[] = [];
  const indicatorFiles: string[] = [];
  let primaryType = 'Unknown';

  const filesInRoot = new Set(
    tryReadDir(projectPath)
  );

  // 1. Node.js Ecosystem
  if (filesInRoot.has('package.json')) {
    indicatorFiles.push('package.json');
    languages.push('JavaScript');
    primaryType = 'Node.js';

    try {
      const pkgRaw = fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8');
      const pkg: PackageJson = JSON.parse(pkgRaw);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      if (allDeps['next']) {
        primaryType = 'Next.js';
        frameworks.push('Next.js', 'React');
      } else if (allDeps['@nestjs/core']) {
        primaryType = 'NestJS';
        frameworks.push('NestJS');
      } else if (allDeps['nuxt']) {
        primaryType = 'Nuxt';
        frameworks.push('Nuxt', 'Vue');
      } else if (allDeps['vue']) {
        frameworks.push('Vue');
      } else if (allDeps['react']) {
        primaryType = 'React';
        frameworks.push('React');
      } else if (allDeps['express']) {
        frameworks.push('Express');
      } else if (allDeps['fastify']) {
        frameworks.push('Fastify');
      }

      if (allDeps['typescript'] || filesInRoot.has('tsconfig.json')) {
        languages.push('TypeScript');
      }
      if (allDeps['tailwindcss']) {
        frameworks.push('TailwindCSS');
      }
      if (allDeps['prisma'] || allDeps['@prisma/client']) {
        frameworks.push('Prisma');
      }
    } catch {
      // Ignore parse error
    }
  }

  // 2. Python Ecosystem
  if (filesInRoot.has('pyproject.toml') || filesInRoot.has('requirements.txt') || filesInRoot.has('Pipfile')) {
    languages.push('Python');
    if (primaryType === 'Unknown') primaryType = 'Python';

    if (filesInRoot.has('pyproject.toml')) indicatorFiles.push('pyproject.toml');
    if (filesInRoot.has('requirements.txt')) indicatorFiles.push('requirements.txt');

    const reqContent = tryReadFile(path.join(projectPath, 'requirements.txt')) +
                       tryReadFile(path.join(projectPath, 'pyproject.toml'));

    if (/fastapi/i.test(reqContent)) {
      primaryType = 'FastAPI';
      frameworks.push('FastAPI');
    } else if (/django/i.test(reqContent)) {
      primaryType = 'Django';
      frameworks.push('Django');
    } else if (/flask/i.test(reqContent)) {
      primaryType = 'Flask';
      frameworks.push('Flask');
    }
  }

  // 3. PHP / Laravel
  if (filesInRoot.has('composer.json')) {
    indicatorFiles.push('composer.json');
    languages.push('PHP');
    primaryType = 'PHP';

    const composerContent = tryReadFile(path.join(projectPath, 'composer.json'));
    if (/laravel\/framework/i.test(composerContent) || filesInRoot.has('artisan')) {
      primaryType = 'Laravel';
      frameworks.push('Laravel');
    } else if (/symfony/i.test(composerContent)) {
      primaryType = 'Symfony';
      frameworks.push('Symfony');
    }
  }

  // 4. Go
  if (filesInRoot.has('go.mod')) {
    indicatorFiles.push('go.mod');
    languages.push('Go');
    if (primaryType === 'Unknown' || primaryType === 'Node.js') primaryType = 'Go';

    const goContent = tryReadFile(path.join(projectPath, 'go.mod'));
    if (/gin-gonic/i.test(goContent)) frameworks.push('Gin');
    if (/fiber/i.test(goContent)) frameworks.push('Fiber');
    if (/echo/i.test(goContent)) frameworks.push('Echo');
  }

  // 5. Java / Kotlin
  if (filesInRoot.has('pom.xml') || filesInRoot.has('build.gradle') || filesInRoot.has('build.gradle.kts')) {
    languages.push('Java');
    if (filesInRoot.has('pom.xml')) indicatorFiles.push('pom.xml');
    if (filesInRoot.has('build.gradle')) indicatorFiles.push('build.gradle');
    if (primaryType === 'Unknown') primaryType = 'Java';

    const buildContent = tryReadFile(path.join(projectPath, 'pom.xml')) +
                         tryReadFile(path.join(projectPath, 'build.gradle'));
    if (/spring-boot/i.test(buildContent)) {
      primaryType = 'Spring Boot';
      frameworks.push('Spring Boot');
    }
  }

  // 6. Rust
  if (filesInRoot.has('Cargo.toml')) {
    indicatorFiles.push('Cargo.toml');
    languages.push('Rust');
    if (primaryType === 'Unknown') primaryType = 'Rust';
  }

  // 7. Containers & Orchestration
  if (filesInRoot.has('docker-compose.yml') || filesInRoot.has('docker-compose.yaml')) {
    indicatorFiles.push('docker-compose.yml');
    frameworks.push('Docker Compose');
    if (primaryType === 'Unknown') primaryType = 'Docker';
  }
  if (filesInRoot.has('Dockerfile')) {
    indicatorFiles.push('Dockerfile');
    frameworks.push('Docker');
    if (primaryType === 'Unknown') primaryType = 'Docker';
  }
  if (filesInRoot.has('Chart.yaml') || filesInRoot.has('deployment.yaml') || filesInRoot.has('k8s')) {
    frameworks.push('Kubernetes');
    if (primaryType === 'Unknown') primaryType = 'Kubernetes';
  }

  // 8. Git fallback
  if (filesInRoot.has('.git')) {
    indicatorFiles.push('.git');
    if (primaryType === 'Unknown') primaryType = 'Git Project';
  }

  return {
    primaryType,
    frameworks: Array.from(new Set(frameworks)),
    languages: Array.from(new Set(languages)),
    indicatorFiles,
  };
}

function tryReadDir(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

function tryReadFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}
