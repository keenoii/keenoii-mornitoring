import { AIProvider, AIAnalysisRequest, AIAnalysisResponse } from '../types';
import { sanitizePayload } from '../privacy';

export class RuleEngineAdvisor implements AIProvider {
  name: 'rule-engine' = 'rule-engine';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async analyzeProject(raw: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const data = sanitizePayload(raw);
    const findings: string[] = [];
    const recommendations: string[] = [];
    const doNext: Array<{ action: string; estimatedGain: number; reason: string }> = [];
    const doNotPrioritizeYet: string[] = [];
    const evidence: string[] = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let potentialTotalGain = 0;

    // 1. Documentation
    if (!data.metrics.hasReadme) {
      findings.push('ยังไม่มีไฟล์ README.md อธิบายภาพรวมโปรเจกต์');
      recommendations.push('สร้างไฟล์ README.md ระบุวิธีติดตั้งและโครงสร้างโปรเจกต์');
      doNext.push({
        action: 'สร้างไฟล์ README.md อธิบายภาพรวมโปรเจกต์และวิธีรัน',
        estimatedGain: 10,
        reason: 'เพิ่มความสมบูรณ์ของเอกสารและส่งต่อโปรเจกต์ได้ทันที',
      });
      evidence.push('README.md not found (Documentation Score: 0/10)');
      potentialTotalGain += 10;
    } else {
      doNotPrioritizeYet.push('README.md มีครบถ้วนแล้ว ไม่จำเป็นต้องแก้เพิ่ม');
    }

    // 2. Git Drift
    if (data.gitInfo.isDirty && data.gitInfo.uncommittedFiles > 0) {
      findings.push(`พบไฟล์ที่มีการแก้ไขแต่ยังไม่ได้ Commit จำนวน ${data.gitInfo.uncommittedFiles} ไฟล์`);
      recommendations.push('ทำการ Review และ Commit การเปลี่ยนแปลงล่าสุดเพื่อป้องกันโค้ดสูญหาย');
      const gain = Math.min(6, data.gitInfo.uncommittedFiles);
      doNext.push({
        action: `Commit งานที่ค้างอยู่ ${data.gitInfo.uncommittedFiles} ไฟล์`,
        estimatedGain: gain,
        reason: 'ลดความเสี่ยงโค้ดสูญหายและป้องกัน Git drift',
      });
      evidence.push(`Working tree dirty with ${data.gitInfo.uncommittedFiles} uncommitted files on branch '${data.gitInfo.branch}'`);
      potentialTotalGain += gain;
      riskLevel = 'MEDIUM';
    }

    // 3. FIXMEs
    if (data.metrics.fixmeCount > 0) {
      findings.push(`พบจุด FIXME ที่ยังไม่ได้แก้ไขจำนวน ${data.metrics.fixmeCount} จุดในโค้ด`);
      recommendations.push(`เคลียร์จุดวิกฤต FIXME (${data.metrics.fixmeCount} จุด) ก่อนเข้าสู่ระยะถัดไป`);
      doNext.push({
        action: `เคลียร์จุดวิกฤต FIXME ${data.metrics.fixmeCount} จุดในโค้ด`,
        estimatedGain: data.metrics.fixmeCount * 2,
        reason: 'กำจัด Technical Debt จุดสำคัญ',
      });
      evidence.push(`Found ${data.metrics.fixmeCount} FIXME comments in source files`);
      potentialTotalGain += data.metrics.fixmeCount * 2;
      riskLevel = 'HIGH';
    }

    // 4. Tests
    if (!data.metrics.hasTests && data.stage === 'Development') {
      findings.push('ไม่พบชุด Automated Test ในโปรเจกต์');
      recommendations.push('พิจารณาเพิ่ม Test Suites สำหรับ Core Business Logic');
      doNext.push({
        action: 'เพิ่ม Basic Automated Tests สำหรับ Core Business Logic',
        estimatedGain: 18,
        reason: 'ยกระดับความเชื่อมั่นและคุณภาพโค้ด',
      });
      evidence.push('Test files not detected (Tests Score: 0/20)');
      potentialTotalGain += 18;
    } else if (data.metrics.hasTests) {
      doNotPrioritizeYet.push('มีชุด Test อยู่แล้ว ไม่จำเป็นต้องเพิ่ม Coverage เร่งด่วน');
    }

    // 5. Deployment
    if (data.metrics.hasDocker || data.metrics.hasKubernetes) {
      doNotPrioritizeYet.push('โครงสร้าง Docker / Container พร้อมใช้งาน ไม่จำเป็นต้องปรับปรุงส่วนนี้');
    }

    if (doNext.length === 0) {
      findings.push('โครงสร้างและสถานะของโปรเจกต์มีความสมบูรณ์ตามมาตรฐาน');
      recommendations.push('ดำเนินการพัฒนาฟีเจอร์ตามแผนงานในระยะต่อไป');
      doNext.push({
        action: 'พัฒนาต่อตาม Roadmap ที่วางไว้',
        estimatedGain: 0,
        reason: 'โปรเจกต์สุขภาพดีเยี่ยม',
      });
    }

    const diagnosis =
      !data.metrics.hasReadme || data.gitInfo.uncommittedFiles > 5
        ? 'Documentation และ Git Drift เป็นสาเหตุหลักที่คะแนนยังไม่เต็ม'
        : `โปรเจกต์อยู่ในสถานะสมบูรณ์ (${data.healthScore}/100) ดำเนินการต่อได้อย่างมั่นใจ`;

    const isHighRisk = riskLevel === 'HIGH' || (riskLevel as string) === 'CRITICAL';
    const overallStatus = isHighRisk
      ? `โปรเจกต์ ${data.projectName} มีประเด็นเร่งด่วนที่ควรจัดการก่อนเริ่มงานใหม่`
      : `โปรเจกต์ ${data.projectName} มีความพร้อมสูงและพร้อมพัฒนาต่อ`;

    const estimatedHealth = `${data.healthScore} → ${Math.min(100, data.healthScore + potentialTotalGain)}`;

    return {
      overallStatus,
      diagnosis,
      priority: riskLevel,
      doNext,
      estimatedHealth,
      doNotPrioritizeYet,
      evidence,
      confidence: 96,
      findings,
      recommendations,
      riskLevel,
      reasoning: `ประเมินจากคะแนนสุขภาพ ${data.healthScore}/100 และตัวชี้วัดความเสี่ยง 7 มิติ`,
      provider: 'Deterministic Rule Engine',
      model: 'rule-engine-v1.1',
      generatedAt: new Date().toISOString(),
    };
  }
}
