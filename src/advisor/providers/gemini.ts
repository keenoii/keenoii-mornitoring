import { AIProvider, AIAnalysisRequest, AIAnalysisResponse } from '../types';
import { sanitizePayload } from '../privacy';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt';
import { RuleEngineAdvisor } from './rule-engine';

export class GeminiAdvisor implements AIProvider {
  name: 'gemini' = 'gemini';
  private apiKey: string;
  private model: string;
  private fallback: RuleEngineAdvisor;

  constructor(apiKey?: string, model = 'gemini-1.5-flash') {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || 'AIzaSyCbxaE2GjMrB813bGwDWq_w4LEUoKnae-M';
    this.model = model;
    this.fallback = new RuleEngineAdvisor();
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async analyzeProject(raw: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const data = sanitizePayload(raw);

    if (!this.apiKey) {
      const fallbackResult = await this.fallback.analyzeProject(data);
      return {
        ...fallbackResult,
        reasoning: `${fallbackResult.reasoning} (หมายเหตุ: ไม่พบ GEMINI_API_KEY จึงใช้ Rule Engine แทน)`,
      };
    }

    const prompt = `${SYSTEM_PROMPT}\n\n${buildUserPrompt(data)}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        throw new Error(`Gemini API returned status ${res.status}`);
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');

      const parsed = JSON.parse(rawText);

      return {
        overallStatus: parsed.overallStatus || 'วิเคราะห์โครงการเรียบร้อย',
        diagnosis: parsed.diagnosis || 'วิเคราะห์โครงสร้างและตัวชี้วัดความพร้อมของโครงการ',
        priority: parsed.priority || parsed.riskLevel || 'LOW',
        doNext: Array.isArray(parsed.doNext) ? parsed.doNext : [],
        estimatedHealth: parsed.estimatedHealth || `${data.healthScore} → ${Math.min(100, data.healthScore + 15)}`,
        doNotPrioritizeYet: Array.isArray(parsed.doNotPrioritizeYet) ? parsed.doNotPrioritizeYet : [],
        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
        confidence: parsed.confidence || 95,
        findings: Array.isArray(parsed.findings) ? parsed.findings : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        riskLevel: parsed.riskLevel || 'LOW',
        reasoning: parsed.reasoning || '',
        provider: 'Google Gemini',
        model: this.model,
        generatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      const fallbackResult = await this.fallback.analyzeProject(data);
      return {
        ...fallbackResult,
        reasoning: `${fallbackResult.reasoning} (เกิดข้อผิดพลาดในการเชื่อมต่อ Gemini: ${err?.message})`,
      };
    }
  }
}
