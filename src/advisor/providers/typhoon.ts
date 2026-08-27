import { AIProvider, AIAnalysisRequest, AIAnalysisResponse } from '../types';
import { sanitizePayload } from '../privacy';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt';
import { RuleEngineAdvisor } from './rule-engine';

/**
 * Typhoon LLM Provider (SCB 10X Thai LLM)
 * Endpoint: https://api.opentyphoon.ai/v1/chat/completions
 */
export class TyphoonAdvisor implements AIProvider {
  name: 'typhoon' = 'typhoon';
  private apiKey: string;
  private model: string;
  private endpoint: string;
  private fallback: RuleEngineAdvisor;

  constructor(
    apiKey?: string,
    model = 'typhoon-v2.5-30b-a3b-instruct',
    endpoint = 'https://api.opentyphoon.ai/v1/chat/completions'
  ) {
    this.apiKey = apiKey || process.env.TYPHOON_API_KEY || '';
    this.model = model;
    this.endpoint = endpoint;
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
        reasoning: `${fallbackResult.reasoning} (หมายเหตุ: ไม่พบ TYPHOON_API_KEY ในระบบ จึงใช้ Rule Engine แทน)`,
      };
    }

    const userPrompt = buildUserPrompt(data);

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(25000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Typhoon API error ${res.status}: ${errorText}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || '';

      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleaned);

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
        provider: 'Typhoon v2.5 (SCB 10X)',
        model: this.model,
        generatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      const fallbackResult = await this.fallback.analyzeProject(data);
      return {
        ...fallbackResult,
        reasoning: `${fallbackResult.reasoning} (เกิดข้อผิดพลาดในการเชื่อมต่อ Typhoon API: ${err?.message})`,
      };
    }
  }
}
