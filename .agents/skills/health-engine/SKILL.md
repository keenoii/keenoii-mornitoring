---
name: health-engine
description: >-
  Rules, scoring algorithms, and trigger logic for Project Health Scores (0-100) and Follow-up / Attention queues.
  Use this skill when implementing the health calculation engine, status evaluations, and attention triage.
---

# Project Health Score & Attention Engine

The **Health & Attention Engine** is a deterministic rule-based evaluation system. It computes a 0–100 Health Score for every monitored project and routes high-priority issues to the Follow-up Queue.

> [!IMPORTANT]
> The **Rule Engine** calculates the score mathematically. AI **never** computes or guesses the score; AI only explains the score breakdown.

---

## 1. 100-Point Health Score Breakdown

The total score is 100 points, distributed across 7 core metrics:

```
┌───────────────────────────────────────────────────────────┐
│ Git Activity (15) + Docs (10) + Build (20) + Tests (20)   │
│ + Deployment (15) + Open Tasks (10) + Freshness (10)      │
│ = Total 100 Points                                        │
└───────────────────────────────────────────────────────────┘
```

| Metric | Max Pts | Evaluation Logic |
| :--- | :---: | :--- |
| **Git Activity** | **15** | • Commit within 3 days: 15 pts<br>• Commit within 7 days: 12 pts<br>• Commit within 14 days: 8 pts<br>• Commit within 30 days: 4 pts<br>• > 30 days: 0 pts<br>• *Penalty*: -3 pts if uncommitted files > 10 |
| **Documentation** | **10** | • Detailed `README.md` (> 300 chars) or `/docs`: 10 pts<br>• Basic `README.md`: 5 pts<br>• Missing `README.md`: 0 pts |
| **Build Status** | **20** | • CI/Build passed: 20 pts<br>• Build configured / Local only: 10 pts<br>• Build failing: 0 pts |
| **Tests** | **20** | • Automated tests present & passing: 20 pts<br>• Test files present (not run): 10 pts<br>• No tests found: 0 pts |
| **Deployment / Uptime** | **15** | • Production/Health URL returns 200 OK: 15 pts<br>• Local/Dev running: 10 pts<br>• Health URL failing (5xx/timeout): 0 pts<br>• Library/CLI (no deploy needed): 12 pts |
| **Open Tasks (TODO/FIXME)** | **10** | • 0–5 TODOs & 0 FIXMEs: 10 pts<br>• 6–15 TODOs & 0 FIXMEs: 7 pts<br>• 16–30 TODOs: 4 pts<br>• > 30 TODOs: 2 pts<br>• *Penalty*: -2 pts per FIXME (down to 0) |
| **Project Freshness** | **10** | • File changes in last 7 days: 10 pts<br>• Changes in last 30 days: 6 pts<br>• No changes in > 90 days: 0 pts |

### Score Tier Ratings

| Score Range | Tier Label | Badge Color | Meaning |
| :--- | :--- | :--- | :--- |
| **90 – 100** | **Excellent** | 🟢 Green | Pristine code, active commits, passing tests & builds. |
| **75 – 89** | **Healthy** | 🟢 Light Green | Active project with good habits and minimal debt. |
| **60 – 74** | **Attention** | 🟡 Yellow | Minor stagnation, accumulation of TODOs or uncommitted work. |
| **40 – 59** | **Risk** | 🟠 Orange | Stale project, failing tests, or blocked milestones. |
| **0 – 39** | **Critical** | 🔴 Red | Inactive, broken builds/deployments, critical FIXMEs. |

---

## 2. Status vs. Stage Matrix

Always maintain separation between operational **Status** and lifecycle **Stage**:

### Status (Operational State)
- `DISCOVERED`: Newly found project pending user review.
- `ACTIVE`: Actively under development or maintenance.
- `BLOCKED`: Development halted due to dependency/decision blocker.
- `STALE`: No activity for > 30 days while unfinished.
- `COMPLETED`: Development goal reached.
- `ARCHIVED`: Deprecated or frozen project.

### Stage (Lifecycle Phase)
- `Planning`: Initial design and specifications.
- `Development`: Writing code and building features.
- `Testing`: QA, unit tests, integration testing.
- `Deployment`: CI/CD pipeline and release packaging.
- `Production`: Live and serving real users.
- `Maintenance`: Bug fixes, security patches, performance tweaks.

---

## 3. Attention Queue (`/attention`) Triggers

Projects are automatically added to the Attention Queue if any of these conditions are met:

1. **Uncommitted Drift**: > 10 uncommitted files in an active project for > 24 hours.
2. **Feature Stagnation**: An active branch or milestone is in `doing` state with no commits for > 7 days.
3. **Production FIXME**: Stage is `Production` or `Deployment`, but source code contains unresolved `FIXME` comments.
4. **Health Check Failure**: Configured `health_url` responds with HTTP 5xx or connection timeout.
5. **Ghost Project**: Project has no Git commits or file edits for > 90 days (Auto-suggest: "Archive this project?").
6. **Milestone Blocker**: Any milestone flagged as `BLOCKED`.
