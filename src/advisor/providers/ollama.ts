import { AIProvider, AIAnalysisRequest, AIAnalysisResponse } from '../types';
import { sanitizePayload } from '../privacy';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt';
import { RuleEngineAdvisor } from './rule-engine';

export class OllamaAdvisor implements AIProvider {
  name: 'ollama' = 'ollama';
  private endpoint: string;
  private model: string;
  private fallback: RuleEngineAdvisor;

  constructor(endpoint = 'http://localhost:11434', model = 'qwen2.5-coder:latest') {
    this.endpoint = endpoint;
    this.model = model;
    this.fallback = new RuleEngineAdvisor();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.endpoint}/api/tags`, {
        signal: AbortSignal.timeout(1500),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async analyzeProject(raw: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const data = sanitizePayload(raw);
    const available = await this.isAvailable();

    if (!available) {
      const fallbackResult = await this.fallback.analyzeProject(data);
      return {
        ...fallbackResult,
        reasoning: `${fallbackResult.reasoning} (หมายเหตุ: Local Ollama ไม่ได้เปิดใช้งาน จึงใช้ Rule Engine แทน)`,
      };
    }

    const prompt = buildUserPrompt(data);

    try {
      const res = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          system: SYSTEM_PROMPT,
          prompt,
          stream: false,
          format: 'json',
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) throw new Error(`Ollama status ${res.status}`);

      const json = await res.json();
      const parsed = JSON.parse(json.response);

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
        provider: 'Local Ollama',
        model: this.model,
        generatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      const fallbackResult = await this.fallback.analyzeProject(data);
      return {
        ...fallbackResult,
        reasoning: `${fallbackResult.reasoning} (Ollama error: ${err?.message})`,
      };
    }
  }
}
