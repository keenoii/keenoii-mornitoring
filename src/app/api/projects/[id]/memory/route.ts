import { NextResponse } from 'next/server';
import { getProjectGoal, saveProjectGoal, getProjectMemories, addProjectMemory } from '@/lib/project-memory';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const goal = getProjectGoal(id);
    const memories = getProjectMemories(id);

    return NextResponse.json(
      {
        projectId: id,
        goal,
        memories,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch project memory' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'save_goal') {
      const { currentGoal, blockerText, followUpDate } = body;
      const updated = saveProjectGoal(id, currentGoal, blockerText, followUpDate);
      return NextResponse.json({ success: true, goal: updated });
    }

    if (action === 'add_memory') {
      const { title, type = 'note', content, eventDate } = body;
      if (!title) {
        return NextResponse.json({ error: 'Missing memory title' }, { status: 400 });
      }
      const newEntry = addProjectMemory(id, title, type, content, eventDate);
      return NextResponse.json({ success: true, memory: newEntry });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update project memory' },
      { status: 500 }
    );
  }
}
