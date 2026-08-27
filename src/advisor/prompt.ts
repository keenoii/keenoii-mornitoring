import { AIAnalysisRequest } from './types';

export const SYSTEM_PROMPT = `You are "Project Sentinel AI Advisor", a seasoned senior software architect and technical lead.
Your role is to advise the developer on project health, technical debt, actionable next steps, and what NOT to prioritize yet.

Rules:
1. Do NOT guess source code or speculate on missing files. Rely strictly on provided sanitized metadata.
2. Provide direct, constructive, and actionable recommendations in Thai (ภาษาไทย).
3. "doNext": List prioritized actions with estimated health score gains (+Points).
4. "doNotPrioritizeYet": List components/tasks that are already functioning well and should NOT be touched now to avoid cognitive overload.
5. "evidence": Cite specific facts from metadata supporting your advice (e.g. "README.md not found", "Git dirty with 12 files").
6. Output MUST be strictly valid JSON matching the specified schema with no surrounding markdown or explanation.`;

export function buildUserPrompt(data: AIAnalysisRequest): string {
  return `Analyze this software project and return your recommendations strictly as JSON:

Project Details:
- Name: ${data.projectName}
- Tech Stack: ${data.type}
- Current Stage: ${data.stage}
- Status: ${data.status}
- Progress: ${data.progress}% (Roadmap completion)
- Health Score: ${data.healthScore}/100 (${data.healthTier})
- Git Info: Branch=${data.gitInfo.branch}, Dirty=${data.gitInfo.isDirty}, Uncommitted=${data.gitInfo.uncommittedFiles}, LastCommit=${data.gitInfo.lastCommitDate || 'N/A'}
- Code Metrics: TODOs=${data.metrics.todoCount}, FIXMEs=${data.metrics.fixmeCount}, HasReadme=${data.metrics.hasReadme}, HasTests=${data.metrics.hasTests}, HasDocker=${data.metrics.hasDocker}
${data.milestones && data.milestones.length > 0 ? `- Milestones: ${JSON.stringify(data.milestones)}` : ''}
${data.todoSamples && data.todoSamples.length > 0 ? `- Sample TODOs: ${JSON.stringify(data.todoSamples)}` : ''}
${data.readmeSummary ? `- Readme Summary: ${data.readmeSummary}` : ''}

Respond ONLY with this JSON schema:
{
  "overallStatus": "สรุปสถานะสั้นๆ 1 ประโยค",
  "diagnosis": "วินิจฉัยสาเหตุหลักที่คะแนนต่ำหรือจุดที่ต้องปรับปรุง",
  "priority": "LOW | MEDIUM | HIGH | CRITICAL",
  "doNext": [
    { "action": "สิ่งที่ควรทำข้อ 1 เช่น สร้าง README.md", "estimatedGain": 10, "reason": "เพื่อเอกสารสมบูรณ์" },
    { "action": "สิ่งที่ควรทำข้อ 2 เช่น Commit งานค้าง", "estimatedGain": 6, "reason": "ลดความเสี่ยงโค้ดสูญหาย" }
  ],
  "estimatedHealth": "${data.healthScore} → ${Math.min(100, data.healthScore + 16)}",
  "doNotPrioritizeYet": [
    "Deployment ยังทำงานปกติ ไม่จำเป็นต้องแก้ตอนนี้",
    "ไม่ต้องกังวลเรื่อง Performance optimization ในระยะนี้"
  ],
  "evidence": [
    "ไม่พบไฟล์ README.md ในโปรเจกต์",
    "มีไฟล์ค้าง Commit ${data.gitInfo.uncommittedFiles} ไฟล์"
  ],
  "confidence": 95,
  "findings": ["ข้อสังเกต 1", "ข้อสังเกต 2"],
  "recommendations": ["คำแนะนำ 1", "คำแนะนำ 2"],
  "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
  "reasoning": "เหตุผลประกอบการประเมินความเสี่ยง"
}`;
}
