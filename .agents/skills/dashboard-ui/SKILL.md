---
name: dashboard-ui
description: >-
  UI/UX design guidelines, component hierarchy, layouts, and charting specifications for the Project Sentinel web interface.
  Use this skill when building Next.js components, shadcn/ui layouts, Recharts visualizations, and filter systems.
---

# Project Sentinel: Dashboard UI & Design System

The **Project Sentinel Dashboard** is a clean, developer-centric command center built with **Next.js**, **Tailwind CSS**, and **shadcn/ui**. It avoids cluttered complexity in favor of high-signal cards, instant filtering, and clear attention items.

---

## 1. UI Hierarchy & Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ KEENOII PROJECT SENTINEL                      [🔍 Search] [⚡ Scan Now] │
├────────────────────────────────────────────────────────────────────────────┤
│  COMMAND CENTER METRICS                                                    │
│  [Total: 87]  [Active: 24]  [🔥 Attention: 11]  [Stale: 18]  [Blocked: 3]   │
├────────────────────────────────────────────────────────────────────────────┤
│  FILTERS: [All] [Active] [Need Attention] [Production] [No README] [...]  │
├────────────────────────────────────────────────────────────────────────────┤
│  PROJECT GRID                                                              │
│  ┌─────────────────────────────┐   ┌─────────────────────────────┐         │
│  │ 🟢 ARIT Tracking            │   │ 🟡 SRRU LMS                 │         │
│  │ Next.js • PostgreSQL • K8s  │   │ Laravel • MySQL • Docker    │         │
│  │ Progress: 75% ████████░░    │   │ Progress: 90% █████████░    │         │
│  │ Health: 82/100 (Healthy)    │   │ Health: 68/100 (Attention)  │         │
│  │ Git: 4 uncommitted files    │   │ Git: Clean (main)           │         │
│  │ 🤖 AI: Close video-call...  │   │ 🤖 AI: Fix Redis session... │         │
│  └─────────────────────────────┘   └─────────────────────────────┘         │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Components

### 1. Command Center Metric Bar (`<CommandCenterStats />`)
- Visual KPI cards displaying project counts grouped by status.
- Clicking any KPI card immediately applies that status filter to the grid.

### 2. Project Card (`<ProjectCard />`)
- **Header**: Project Name, Health Score badge (color-coded), Status badge (`ACTIVE`, `BLOCKED`, etc.).
- **Subheader**: Tech stack chips (e.g. `Next.js`, `Docker`, `Python`).
- **Progress Bar**: Milestone or `.project-monitor.yaml` completion percentage.
- **Activity & Git**: Last commit timestamp, branch name, dirty state indicator.
- **AI Recommendation Snippet**: 2-line preview of top AI advice with expand button.

### 3. Attention Queue View (`/attention` or `<AttentionQueue />`)
- Priority list of projects flagged with urgent warnings:
  - 🔴 Failing production endpoints
  - 🟠 High uncommitted file drift (> 10 files)
  - 🟡 Inactive branches holding incomplete milestones
  - ⚪ Stale projects candidates for archiving

### 4. Project Detail Modal / Page (`/projects/[id]`)
- **Milestones Timeline**: Interactive checklist of done/doing/todo milestones.
- **Health Radar Chart**: Visual breakdown of the 7 scoring metrics (Git, Docs, Build, Tests, Deploy, Tasks, Freshness).
- **Git Commit Log**: Recent commits and branch status.
- **AI Advisor Full Brief**: Comprehensive findings, recommended actions, and risk analysis.

---

## 3. Filter & Sort Architecture

The UI must support combined, responsive client-side and server-side filtering:

```typescript
export interface ProjectFilterState {
  searchQuery: string;
  status: string[]; // 'ACTIVE', 'BLOCKED', 'STALE', etc.
  stage: string[];  // 'Development', 'Production', etc.
  techStack: string[]; // 'Node.js', 'Python', 'Go', etc.
  quickFilters: {
    needAttentionOnly: boolean;
    noGitOnly: boolean;
    noReadmeOnly: boolean;
    dirtyGitOnly: boolean;
  };
  sortBy: 'healthAsc' | 'healthDesc' | 'lastActivity' | 'name' | 'progress';
}
```
