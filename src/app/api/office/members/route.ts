import { NextResponse } from 'next/server';
import db from '@/lib/sqlite-db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, presenceStatus, presenceSource = 'MANUAL' } = body;

    if (!id || !presenceStatus) {
      return NextResponse.json({ error: 'Missing member ID or presence status' }, { status: 400 });
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE room_members
      SET presenceStatus = ?,
          presenceSource = ?,
          presenceUpdatedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `).run(presenceStatus, presenceSource, now, now, id);

    db.prepare(`
      INSERT INTO office_audit_logs (id, entityType, entityId, action, changesJson, performedBy, createdAt)
      VALUES (?, 'member', ?, 'presence_change', ?, 'user', ?)
    `).run(`audit-${Date.now()}`, id, JSON.stringify({ presenceStatus, presenceSource }), now);

    return NextResponse.json({ success: true, presenceStatus, presenceUpdatedAt: now });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update presence' },
      { status: 500 }
    );
  }
}
