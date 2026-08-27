---
name: ai-advisor
description: >-
  Architectural patterns, multi-provider interfaces (Gemini, OpenAI, Claude, Ollama),
  privacy sanitization, and prompt engineering for the AI Project Advisor.
  Use this skill when building AI advice generators, switching LLM providers, or tuning prompts.
---

# AI Project Advisor: Provider Architecture & Prompting

The **AI Project Advisor** acts as an expert software consultant. It analyzes structured project metrics, identifies technical debt or stalled milestones, and produces concise, high-value advice for the developer.

> [!CAUTION]
> **Privacy First**: The AI Advisor NEVER receives raw source code, credentials, or environment files. All input data must pass through the `sanitizePayload()` filter before dispatching to any LLM.

---

## 1. Unified `AIProvider` Abstraction

```typescript
export interface AIAnalysisRequest {
  projectName: string;
  type: string;
  stage: string;
  status: string;
  progress: number;
  healthScore: number;
  healthBreakdown: Record<string, number>;
  gitInfo: {
    branch: string;
    lastCommitDate: string | null;
    uncommittedFiles: number;
    isDirty: boolean;
  };
  metrics: {
    todoCount: number;
    fixmeCount: number;
    hasReadme: boolean;
    hasTests: boolean;
    hasDocker: boolean;
  };
  milestones?: Array<{ name: string; status: string }>;
  readmeSummary?: string;
  todoSamples?: string[];
}

export interface AIAnalysisResponse {
  overallStatus: string;
  findings: string[];
  recommendations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string;
}

export interface AIProvider {
  name: 'gemini' | 'openai' | 'claude' | 'ollama';
  analyzeProject(data: AIAnalysisRequest): Promise<AIAnalysisResponse>;
}
```

---

## 2. Multi-Provider Implementations

The system must support switching providers dynamically via configuration:

1. **Gemini (`@google/genai`)**: Recommended default for fast analysis and high rate limits.
2. **OpenAI (`openai`)**: Supports `gpt-4o` and `gpt-4o-mini`.
3. **Claude (`@anthropic-ai/sdk`)**: Supports `claude-3-5-sonnet` and `claude-3-haiku`.
4. **Local Ollama (`http://localhost:11434`)**: For 100% offline air-gapped environments running `llama3` or `qwen2.5-coder`.

---

## 3. System Prompt & Response Format

### System Prompt Template

```text
You are "Project Sentinel AI Advisor", a seasoned senior software architect and technical lead.
Your role is to advise the developer on project health, technical debt, and prioritized next steps.

Rules:
1. Do NOT guess source code or speculate on missing files. Rely only on provided metadata.
2. Provide constructive, direct, and actionable recommendations.
3. If there are uncommitted files or long-stalled branches, flag them clearly.
4. Output MUST be strictly valid JSON matching the specified schema.
```

### Expected Output Structure (JSON)

```json
{
  "overallStatus": "โครงการยัง Active แต่เริ่มมี Technical Debt และค้าง Branch นานเกิน 12 วัน",
  "findings": [
    "พบ TODO 17 จุด และ FIXME 4 จุดในโมดูลหลัก",
    "ไม่มี commit ใหม่บน branch 'feature-video-call' มา 12 วัน",
    "มี uncommitted changes ค้างอยู่ 4 ไฟล์",
    "Build ล่าสุดผ่าน และ Production ยังออนไลน์ปกติ"
  ],
  "recommendations": [
    "ปิดงานใน feature-video-call แล้ว merge กลับ main ก่อนเริ่มฟีเจอร์ใหม่",
    "แก้ไข FIXME 4 จุดที่เกี่ยวข้องกับ session handling",
    "เพิ่ม automated test ใน signaling module",
    "ยังไม่ควรเปิด branch ฟีเจอร์ใหม่จนกว่าจะเคลียร์งานค้าง"
  ],
  "riskLevel": "MEDIUM",
  "reasoning": "มีความเสี่ยงจาก merge conflict และ technical debt ที่สะสมใน feature branch ที่เปิดค้างไว้นาน"
}
```

---

## 4. Privacy Sanitization Checklist

Before calling any LLM API:
- [x] Strip all absolute file paths containing usernames (e.g. convert `C:\Users\Admin\...` to relative paths).
- [x] Ensure no `.env`, token, password, or API key strings exist in `todoSamples` or `readmeSummary`.
- [x] Limit total prompt token size (< 2,000 tokens per project) to maintain low cost and fast throughput.
