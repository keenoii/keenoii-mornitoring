import { NextResponse } from 'next/server';
import { getProjectGoal, saveProjectGoal, getProjectMemories, addProjectMemory } from '@/lib/project-memory';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const goal = getProjectGoal(id);
    const memories = getProjectMemories(id);

    return NextResponse.json({
      projectId: id,
      goal,
      memories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch project memory' },
      { status: 500 }
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
