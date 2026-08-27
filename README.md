# 🐘 KEENOII Project Sentinel (AI Project Portfolio Command Center)

> **Engineering Intelligence & Morning Cockpit for Local Developer Projects**

**KEENOII Project Sentinel** is an intelligent developer command center designed to monitor local repositories (e.g. `D:\MyProject\*` and `D:\MyProject\srru\*`), assess project health with deterministic rule scoring (0–100), identify technical debt, and provide prioritized engineering advice powered by **Typhoon AI (SCB 10X)**, **Google Gemini**, and **Local Ollama**.

---

## 🌟 The 3 Core Operational Views

KEENOII Project Sentinel provides 3 interconnected perspectives into your engineering portfolio:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KEENOII PROJECT SENTINEL                        │
├───────────────────┬────────────────────────────┬───────────────────────┤
│ 📊 1. PORTFOLIO   │ 🏢 2. VIRTUAL OFFICE       │ 🧠 3. PROJECT MEMORY  │
│    (Data View)    │    (Visual Diorama)        │    (Developer Cockpit)│
│                   │                            │                       │
│ • Health Scores   │ • 2.5D Cyberpunk Diorama   │ • Current Goal Box    │
│ • Next Actions    │ • Holographic Wall Panels  │ • Blocker Tracking    │
│ • Morning Briefing│ • War Room & AI Lab        │ • Memory Timeline Log │
│ • Focus Today     │ • Office Tour Walkthrough  │ • Full AI Advisor     │
└───────────────────┴────────────────────────────┴───────────────────────┘
```

1. **📊 Portfolio Dashboard (`http://localhost:3000`)**:
   - Quick 10-second morning intelligence briefing.
   - 100-Point Health Breakdown (0–100) vs Roadmap Progress (0–100%).
   - Interactive Health Explainer with point gain projections.
   - Starred & Active Focus pinning.

2. **🏢 Cyberpunk 2.5D Virtual Office (`http://localhost:3000/office`)**:
   - High-resolution Cyberpunk 2.5D Diorama room layout.
   - **🚨 War Room - Critical Systems**: Top emergency center for `Health < 60`.
   - **🌐 Web Development Studio**: Frontend & Fullstack desks.
   - **🤖 AI & Automation Lab**: AI Agent, LLM, and n8n terminals.
   - **🛰️ Network & Infrastructure NOC**: Container ops & K8s cluster rack.
   - **😴 Archive & Dormant Lounge**: 6 cozy armchairs for stale projects (>14-30d inactive).
   - **Interactive Wall Mounted HUD Panels**: Live project status, health beads (🟢/🟡/🔴), and 1-click jumps.
   - **▶ Office Tour (Walkthrough)**: Automated 5-point camera tour with voice/text narration.
   - **Analytical Overlays**: Realistic, 🟢 Health, ⚡ Activity, and 🎯 Progress.

3. **🧠 Project Memory & Cockpit (`http://localhost:3000/projects/[slug]`)**:
   - Dedicated deep-dive developer cockpit.
   - Persistent **Current Goal** and **Active Blockers** tracking with follow-up dates.
   - Chronological **Project Memory Timeline** (Milestones, Architecture Decisions, Blockers, Notes).
   - Multi-provider AI Advisor analysis with Typhoon v2.5, Ollama, and Gemini.

---

## 📊 Deterministic 100-Point Health Engine

| Dimension | Points | What It Measures |
| :--- | :---: | :--- |
| **Git Activity** | 15 | Active branch, dirty working tree, and commit frequency |
| **Documentation & Readme** | 10 | High-quality `README.md`, specs, and architectural guidelines |
| **Build Status** | 20 | Build configuration validity, package.json, Dockerfile |
| **Tests & QA** | 20 | Unit tests presence, test runners, and test pass indicators |
| **Deployment & Containers** | 15 | Docker Compose, Kubernetes manifests, reverse proxies |
| **Code Debt & Open Tasks** | 10 | Density of `TODO`, `FIXME`, `BUG`, `HACK` comments |
| **Project Freshness** | 10 | Stage-aware inactivity calculation (Smart Stale Engine) |

---

## 🤖 Evidence-Based AI Advisor

- **Multi-Provider Support**:
  - 🇹🇭 **Typhoon v2.5 (30B Agentic)** by SCB 10X (Recommended Thai LLM)
  - 💻 **Local Ollama** (`http://localhost:11434` with `qwen2.5-coder` or `llama3.2`)
  - 🌐 **Google Gemini** (`gemini-1.5-flash`)
  - 📐 **Deterministic Rule Engine** (100% offline fallback)
- **Zero Code Leakage Guarantee**: Transmits only sanitized metadata, README summaries, TODO counts, Git status, and build metrics. Never sends source code, `.env`, credentials, or database dumps.

---

## 🚀 Quick Start

### 1. Requirements
- Node.js >= 22.0.0 (Native `node:sqlite` built-in)
- Windows / macOS / Linux

### 2. Installation
```bash
# Clone and enter project directory
cd d:/MyProject/keenoii-mornitoring

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/office](http://localhost:3000/office) in your browser.

---

## ⚙️ Configuration

### `.project-monitor.yaml` (Optional per project)
Place `.project-monitor.yaml` in any project root to declare milestones, stage, and metadata overrides:

```yaml
name: My Awesome App
description: Production billing service
stage: production
status: active
progress: 90

milestones:
  - name: Setup Database
    status: done
  - name: Launch V1 API
    status: done
  - name: Payment Gateway
    status: doing

monitor:
  git: true
  build: true
  health: true
  todo: true
```

---

## 🔒 Privacy & Security Principles
1. **AI is an Advisor, NOT a Decider**: AI provides insights and suggestions; it never alters source code or database records arbitrarily.
2. **Deterministic Health Scoring**: Scores (0-100) are computed mathematically via the rule engine, not hallucinated by AI.
3. **Local First**: All metadata, scan snapshots, and project memories are stored locally in native SQLite (`data/sentinel.db`).
