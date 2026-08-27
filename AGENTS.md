# KEENOII Project Sentinel (AI Project Portfolio Monitor)
## Core System Instructions & Development Guidelines

Welcome to the **KEENOII Project Sentinel** repository. This document serves as the primary system guideline for any AI assistant or developer working on this codebase.

---

### 1. Project Vision & Architecture

KEENOII Project Sentinel is an intelligent project portfolio command center designed to monitor local developer projects (e.g. `D:\MyProject\*`), assess project health, highlight blocking issues, and provide actionable AI recommendations.

#### System Architecture Overview

```
D:\MyProject (Local Disk)
 │
 ▼
[ 1. Local Project Collector ]  --> Scans folders, Git, TODOs, .project-monitor.yaml
 │
 ▼
[ 2. Project Registry (API/DB) ] --> Next.js API / NestJS + PostgreSQL (Prisma)
 │
 ├──▶ [ 3. Rule Engine ]        --> Computes Health Score (0-100) & Attention Queue
 ├──▶ [ 4. AI Advisor ]         --> Multi-provider (Gemini, OpenAI, Claude, Ollama)
 └──▶ [ 5. Command Center UI ]  --> Next.js + Tailwind + shadcn/ui + Recharts
```

---

### 2. Immutable Core Principles

1. **AI is an Advisor, NOT a Decider**:
   - AI provides insights, recommendations, and explanations.
   - AI **never** alters project source code, changes database records directly, or arbitrarily guesses completion percentages.
2. **Deterministic Health Scoring**:
   - The **Rule Engine** calculates the 0–100 Health Score based on deterministic metrics.
   - The **AI Advisor** explains the score and advises remediation steps.
3. **Strict Privacy & Zero Code Leakage**:
   - **NEVER** transmit source code, `.env`, credentials, database dumps, `node_modules`, or private keys to external AI APIs.
   - Transmit **ONLY** sanitized metadata, README summaries, TODO counts, Git status, and build/test metrics.
4. **Source of Truth**:
   - If `.project-monitor.yaml` exists in a monitored project folder, it is the primary source of truth for milestones, stage, status, and manual overrides.
5. **Clear Separation of Status & Stage**:
   - **Status** reflects operational state: `DISCOVERED`, `ACTIVE`, `BLOCKED`, `STALE`, `COMPLETED`, `ARCHIVED`.
   - **Stage** reflects lifecycle phase: `Planning`, `Development`, `Testing`, `Deployment`, `Production`, `Maintenance`.

---

### 2.1 Config-Driven Modular Architecture (Single Source of Truth)

1. **DRY (Don't Repeat Yourself)**:
   - ห้ามเขียนโค้ดหรือค่า Config ซ้ำซ้อนโดยเด็ดขาด
2. **Single Source of Truth**:
   - ทุกค่าที่ใช้ซ้ำ (เช่น เมนู, Navbar, Footer, Prompts, Settings, Feature Toggles, Layout Coordinates) ต้องถูกดึงมาจากไฟล์ Config กลาง (`src/config/` และ `src/lib/*-config.ts`) เพียงที่เดียว
   - หากแก้จุดเดียว ระบบทั้งหมดต้องเปลี่ยนตามทันที
3. **Separation of Concerns**:
   - **UI Components & Layouts**: ทำหน้าที่เฉพาะการแสดงผล (Pure Presentation) ห้ามมี Business Logic แอบแฝง
   - **Service Layer**: Business Logic ต้องอยู่เฉพาะใน Service Layer เท่านั้น และไม่ผูกกับ UI หรือ Framework ใดโดยตรง
4. **Maintainability Over Speed**:
   - แยกหน้าที่แต่ละ Component ให้ชัดเจน (Single Responsibility)
   - โมดูลต้อง Composable, Reusable และรองรับการขยายระบบในอนาคตโดยไม่ต้องรื้อโค้ดเดิม

---

### 3. Implementation Priorities (What to do first)

When building or extending this project, follow this exact sequential roadmap:

| Step | Phase | Key Deliverables | Status |
| :--- | :--- | :--- | :--- |
| **1** | **Database & Persistence** | Native SQLite schema: projects, metrics, health_breakdowns, milestones, attention_items, scan_snapshots, ai_advices, project_goals, project_memories | ✅ Complete |
| **2** | **Local Project Collector** | Fast native Node Git parser (<1s), multi-depth folder scanner, submodules discovery, .project-monitor.yaml parser, privacy filter | ✅ Complete |
| **3** | **Health & Attention Rule Engine** | 100-point scoring algorithm, interactive health explainer, smart stale detection, Next Action engine | ✅ Complete |
| **4** | **AI Advisor Engine** | Multi-provider interface: Typhoon v2.5 (30B Agentic), Local Ollama, Gemini, Rule Engine with "Do Not Prioritize Yet" | ✅ Complete |
| **5** | **Command Center & 3 Core Views** | 1. 📊 Portfolio View, 2. 🏢 Cyberpunk 2.5D Holographic Virtual Office Diorama (`/office`), 3. 🧠 Project Memory & Cockpit (`/projects/[slug]`) | ✅ Complete |
| **6** | **Real-time & Integrations** | Live HTTP/SSL health check, Docker/K8s inspection, Scheduled scans (node-cron), Notifications | 🔜 Next Sprint |

---

### 4. Available Skills

Check `.agents/skills/` for detailed runbooks and technical guidelines:
- `sentinel-roadmap`: Step-by-step implementation guide for MVP and future phases.
- `local-collector`: Folder scanning, project detection, Git analysis, and `.project-monitor.yaml` specification.
- `health-engine`: Scoring formulas (0-100) and Attention Queue rules.
- `ai-advisor`: Multi-LLM provider abstraction, privacy filtering, and prompt guidelines.
- `dashboard-ui`: Frontend design system, component layouts, and UI specifications.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
