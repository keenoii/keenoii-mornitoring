---
name: sentinel-roadmap
description: >-
  Step-by-step implementation roadmap and prioritization guide for KEENOII Project Sentinel.
  Use this skill whenever deciding what features or tasks to implement next, starting from the MVP to advanced stages.
---

# KEENOII Project Sentinel: Implementation Roadmap

This skill guides the sequential development of **KEENOII Project Sentinel** (AI Project Portfolio Monitor). Follow this phased approach to ensure solid foundations before adding complex integrations.

---

## 🎯 Phase 1: MVP (Minimum Viable Product) — PRIORITY 1

The primary goal of Phase 1 is to discover local projects, extract status & metrics, compute health scores, generate AI advice, and visualize everything on a clean web dashboard.

```
[Local Scan] ──▶ [Detect Type & Git] ──▶ [Parse Config/TODO] ──▶ [Save to DB] ──▶ [Health Calc] ──▶ [AI Advice] ──▶ [Dashboard]
```

### Step-by-Step Execution Plan:

### 1. Database & Domain Models (Prisma + PostgreSQL)
- Setup Prisma ORM with PostgreSQL.
- Define models:
  - `Project`: `id`, `name`, `slug`, `path`, `type`, `status`, `stage`, `priority`, `progress`, `healthScore`, `lastActivityAt`, `createdAt`, `updatedAt`
  - `ProjectMetric`: `id`, `projectId`, `todoCount`, `fixmeCount`, `gitBranch`, `lastCommitDate`, `isDirty`, `uncommittedFiles`, `hasReadme`, `hasDocker`, `hasTests`
  - `Milestone`: `id`, `projectId`, `name`, `status` (`todo`, `doing`, `done`), `order`
  - `HealthScoreBreakdown`: `id`, `projectId`, `gitActivityScore`, `docsScore`, `buildScore`, `testsScore`, `deploymentScore`, `openTasksScore`, `freshnessScore`, `totalScore`
  - `AIAdvice`: `id`, `projectId`, `overallStatus`, `findings`, `recommendations`, `riskLevel` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `reasoning`, `generatedAt`
  - `FollowUpItem`: `id`, `projectId`, `title`, `reason`, `severity` (`info`, `warning`, `urgent`), `isResolved`, `resolvedAt`

### 2. Local Project Collector Service
- Use `fast-glob` to scan configured root directories (e.g. `D:\MyProject`).
- Recognize project markers: `package.json`, `requirements.txt`, `composer.json`, `go.mod`, `pom.xml`, `docker-compose.yml`, `.git`.
- Parse `.project-monitor.yaml` if present (Source of Truth).
- Use `simple-git` for Git metadata (branch, dirty status, uncommitted count, last commit).
- Scan TODO/FIXME comments across source files (excluding `node_modules`, `.git`, `vendor`, `.env*`).
- Enforce strict privacy filters (never load sensitive secrets or raw code files into payload).

### 3. Health Score & Attention Rule Engine
- Calculate 0–100 score using deterministic weights:
  - Git Activity (15 pts)
  - Documentation (10 pts)
  - Build Status (20 pts)
  - Tests Availability & Pass (20 pts)
  - Deployment/Health URL (15 pts)
  - Open Tasks (TODO/FIXME ratio) (10 pts)
  - Project Freshness (10 pts)
- Automatically classify projects into Attention Queue (`/attention`):
  - Projects with uncommitted changes > 10 files.
  - Active projects with no commit > 7 days.
  - Blocked projects or failing health checks.
  - Stale projects with no activity > 60 days (suggest archiving).

### 4. AI Advisor Service (Multi-Provider)
- Implement `AIProvider` interface supporting Gemini, OpenAI, Claude, and Local Ollama.
- Format structured prompt containing only metadata, README summary, TODO count, and health score.
- Produce structured JSON output: `overallStatus`, `findings`, `recommendations`, `riskLevel`, `reasoning`.

### 5. Command Center UI (Next.js + Tailwind + shadcn/ui)
- **Top Summary Cards**: Total Projects, Active, Need Attention, Stale, Blocked, Completed.
- **Project Grid**: Project Cards showing Name, Type, Tech Stack tags, Progress bar, Git badge, Health badge, and AI summary snippet.
- **Filters & Search**: Filter by Status, Stage, Stack, Health rating, and Attention flags.
- **Detail View**: Full project breakdown with milestones, TODOs, Git history, Health metric radar/bar chart, and full AI Advisor review.
- **Attention Page (`/attention`)**: Daily to-do queue of items needing developer action.

---

## 🚀 Phase 2: Advanced Integrations & Monitoring (Post-MVP)

Once Phase 1 is running smoothly, expand Sentinel with external integrations:

1. **Docker & Container Runtime**:
   - Inspect local Docker daemon for container status matching project names.
2. **Kubernetes Cluster Sync**:
   - Connect to local/remote K8s cluster and match deployments/pods.
3. **Remote Git Hosting Sync**:
   - GitHub & GitLab API integration for PRs, issues, and CI/CD workflow status.
4. **Uptime & Health Endpoint Probing**:
   - Scheduled HTTP pinging for project `health_url` endpoints with latency tracking.
5. **Automation & Notifications**:
   - Webhook triggers to n8n.
   - Daily morning briefing notifications to LINE, Discord, or Email ("Good morning! 3 projects need attention today").
