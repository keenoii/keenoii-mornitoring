import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room } = body;

    if (!room) {
      return NextResponse.json({ error: 'Missing room data' }, { status: 400 });
    }

    const inOfficeCount = room.members?.filter((m: any) => m.presenceStatus === 'in-office').length || 0;
    const totalMembers = room.members?.length || 1;
    const projectCount = room.projects?.length || 0;

    const attentionProjects = room.projects?.filter((p: any) => {
      const proj = p.project;
      return proj && proj.health && proj.health.total < 60;
    }) || [];

    const findings: string[] = [];
    const recommendations: string[] = [];
    const evidence: string[] = [];
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    findings.push(`ทีม ${room.ownerTeam || room.name} กำลังรับผิดชอบทั้งหมด ${projectCount} โปรเจกต์`);
    evidence.push(`Projects: ${projectCount} items`);
    evidence.push(`Staff in office: ${inOfficeCount}/${totalMembers} members`);

    if (attentionProjects.length > 0) {
      const names = attentionProjects.map((p: any) => p.projectId).join(', ');
      findings.push(`มี ${attentionProjects.length} โปรเจกต์ที่สุขภาพอยู่ในเกณฑ์ Need Attention: ${names}`);
      recommendations.push(`โฟกัสเคลียร์ปัญหาของ ${names} ให้เสร็จก่อนเปิดรับงานใหม่`);
      evidence.push(`Need Attention: ${attentionProjects.length} projects`);
      priority = 'HIGH';
    }

    if (projectCount > 5 && inOfficeCount <= 2) {
      findings.push(`ปริมาณงานสูงเมื่อเทียบกับจำนวนบุคลากร (${inOfficeCount} คน รับผิดชอบ ${projectCount} โปรเจกต์)`);
      recommendations.push('จัดลำดับความสำคัญ (Prioritization) ปิดโปรเจกต์ที่ใกล้เสร็จก่อนเพื่อลดภาระทางจิตวิทยา');
      priority = 'HIGH';
    }

    if (recommendations.length === 0) {
      recommendations.push('ทีมกำลังดำเนินงานได้ตามแผน รักษาอัตราความก้าวหน้านี้ต่อไป');
    }

    const diagnosis =
      attentionProjects.length > 0
        ? `ทีมในห้อง ${room.name} มี ${attentionProjects.length} โปรเจกต์ที่ต้องเร่งแก้ไข`
        : `ทีมในห้อง ${room.name} บริหารจัดการ ${projectCount} โปรเจกต์ได้อย่างสมดุล`;

    return NextResponse.json({
      roomName: room.name,
      roomCode: room.code,
      diagnosis,
      priority,
      findings,
      recommendations,
      evidence,
      confidence: 95,
      provider: 'KEENOII Team & Workload Advisor',
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze room' },
      { status: 500 }
    );
  }
}
