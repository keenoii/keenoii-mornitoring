---
name: local-collector
description: >-
  Specifications and implementation workflows for the Local Project Collector service.
  Use this skill when developing folder scanners, project type detectors, Git status extractors,
  TODO/FIXME parsers, .project-monitor.yaml handlers, and privacy filters.
---

# Local Project Collector: Implementation & Specification

The **Local Project Collector** is the scout service running on the local machine (Windows / macOS / Linux). It traverses developer directories, extracts project metadata, and sends structured summaries to the Project Registry.

---

## 1. Scanner Workflow

```
Configured Root (e.g. D:\MyProject)
 │
 ├──▶ 1. Identify Project Subdirectories (Depth = 1 by default, or configurable)
 ├──▶ 2. Detect Project Type (Check indicator files)
 ├──▶ 3. Check for .project-monitor.yaml (Source of Truth)
 ├──▶ 4. Inspect Git Status via simple-git (branch, dirty, last_commit)
 ├──▶ 5. Count TODO / FIXME in code (Excluding forbidden dirs)
 ├──▶ 6. Read & summarize README.md (if present)
 └──▶ 7. Package JSON payload and POST to Registry API / Database
```

---

## 2. Project Type Detection Rules

The collector checks the root of each directory for the following indicator files in order:

| Indicator File | Detected Type / Framework |
| :--- | :--- |
| `package.json` | Node.js (Inspect `dependencies` for `next`, `react`, `vue`, `express`, `nest`, etc.) |
| `pyproject.toml` / `requirements.txt` | Python (FastAPI, Django, Flask) |
| `composer.json` | PHP / Laravel |
| `go.mod` | Go |
| `pom.xml` / `build.gradle` | Java / Kotlin (Spring Boot) |
| `Cargo.toml` | Rust |
| `docker-compose.yml` / `Dockerfile` | Docker Container Project |
| `Chart.yaml` / `deployment.yaml` | Kubernetes / Helm |
| `.git` (alone) | Generic Git Project |

---

## 3. `.project-monitor.yaml` Specification (Source of Truth)

If a project contains `.project-monitor.yaml`, its values override auto-detected properties:

```yaml
# .project-monitor.yaml Example
name: ARIT Tracking
description: ระบบบริหารงานและติดตามบุคลากร ARIT
status: active          # discovered | active | blocked | stale | completed | archived
stage: development      # planning | development | testing | deployment | production | maintenance
priority: high          # low | medium | high | critical
progress: 75            # 0 - 100 percentage
health_url: https://arit-tracking.srru.ac.th
repository:
  type: git
  url: git@github.com:srru/arit-tracking.git

milestones:
  - name: Authentication
    status: done
  - name: Task Management
    status: done
  - name: Video Call
    status: doing
  - name: Mobile Notification
    status: todo

monitor:
  git: true
  build: true
  health: true
  todo: true

ai:
  enabled: true
  include:
    - README.md
    - docs/
    - specs/
  exclude:
    - .env
    - node_modules/
    - uploads/
    - backup/
```

---

## 4. Git Analysis via `simple-git`

The collector invokes Git operations without shelling out raw destructive commands:
```typescript
import simpleGit, { SimpleGit } from 'simple-git';

async function getGitInfo(projectPath: string) {
  const git: SimpleGit = simpleGit(projectPath);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) return null;

  const status = await git.status();
  const log = await git.log({ maxCount: 1 });
  const branch = status.current || 'unknown';
  const isDirty = !status.isClean();
  const uncommittedFiles = status.files.length;
  const lastCommitDate = log.latest ? new Date(log.latest.date) : null;
  const lastCommitMessage = log.latest ? log.latest.message : null;

  return {
    branch,
    isDirty,
    uncommittedFiles,
    lastCommitDate,
    lastCommitMessage,
  };
}
```

---

## 5. TODO & FIXME Counter

Scan source files using `fast-glob` while respecting file size limits (< 1MB) and blacklists:
- Regex for TODO: `/\bTODO\b[:\s]*(.*)/i`
- Regex for FIXME: `/\bFIXME\b[:\s]*(.*)/i`
- Cap extracted items to prevent payload bloat (e.g. max 50 items summary).

---

## 6. Privacy & Security Rules (MANDATORY)

The collector MUST NEVER read or include the following files in any payload:

- ❌ `.env`, `.env.*`, `*.pem`, `*.key`, `*.pfx`, `*.p12`
- ❌ `credentials.json`, `service-account*.json`, `id_rsa*`
- ❌ `*.sql`, `*.dump`, `*.sqlite`, `*.db`, `*.bak`
- ❌ `node_modules/`, `vendor/`, `.git/`, `.venv/`, `__pycache__/`
- ❌ `dist/`, `build/`, `.next/`, `coverage/`
- ❌ `uploads/`, `storage/`, `backup/`

Only metadata, README markdown, TODO strings, and configuration headers are permitted.
