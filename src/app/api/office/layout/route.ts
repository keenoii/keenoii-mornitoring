import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/sqlite-db';
import { DEFAULT_OFFICE_LAYOUT, OfficeLayoutTheme } from '@/lib/office-layout-config';

export async function GET(req: NextRequest) {
  try {
    const row = db.prepare(`
      SELECT * FROM office_layouts
      ORDER BY updatedAt DESC
      LIMIT 1
    `).get() as any;

    if (row && row.layoutJson) {
      const layout = JSON.parse(row.layoutJson);
      return NextResponse.json({ layout, isCustom: true });
    }

    return NextResponse.json({ layout: DEFAULT_OFFICE_LAYOUT, isCustom: false });
  } catch (error: any) {
    return NextResponse.json({ layout: DEFAULT_OFFICE_LAYOUT, isCustom: false, error: error.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { layout } = body;

    if (!layout || !layout.panels) {
      return NextResponse.json({ error: 'Invalid layout payload' }, { status: 400 });
    }

    const id = layout.id || 'custom-office-layout';
    const name = layout.name || 'Custom Office Layout';
    const layoutJson = JSON.stringify(layout);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO office_layouts (id, name, layoutJson, updatedAt)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        layoutJson = excluded.layoutJson,
        updatedAt = excluded.updatedAt
    `).run(id, name, layoutJson, now);

    return NextResponse.json({ success: true, layout });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    db.prepare(`DELETE FROM office_layouts`).run();
    return NextResponse.json({ success: true, layout: DEFAULT_OFFICE_LAYOUT });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
