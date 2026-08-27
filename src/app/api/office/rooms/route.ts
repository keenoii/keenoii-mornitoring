import { NextResponse } from 'next/server';
import db from '@/lib/sqlite-db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, code, type, x, y, width, height, color, operationalStatus, capacity } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required room fields' }, { status: 400 });
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE rooms
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          type = COALESCE(?, type),
          x = COALESCE(?, x),
          y = COALESCE(?, y),
          width = COALESCE(?, width),
          height = COALESCE(?, height),
          color = COALESCE(?, color),
          operationalStatus = COALESCE(?, operationalStatus),
          capacity = COALESCE(?, capacity),
          updatedAt = ?
      WHERE id = ?
    `).run(name, code, type, x, y, width, height, color, operationalStatus, capacity, now, id);

    // Audit log
    db.prepare(`
      INSERT INTO office_audit_logs (id, entityType, entityId, action, changesJson, performedBy, createdAt)
      VALUES (?, 'room', ?, 'update_layout', ?, 'admin', ?)
    `).run(`audit-${Date.now()}`, id, JSON.stringify(body), now);

    return NextResponse.json({ success: true, updatedAt: now });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update room layout' },
      { status: 500 }
    );
  }
}
