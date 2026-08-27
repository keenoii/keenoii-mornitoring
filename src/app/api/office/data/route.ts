import { NextResponse } from 'next/server';
import { getOfficeData } from '@/lib/office-db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingCode = searchParams.get('building') || 'ARIT';
    const floorParam = searchParams.get('floor');
    const floorNum = floorParam ? parseInt(floorParam, 10) : undefined;

    const data = await getOfficeData(buildingCode, floorNum);

    if (!data) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch office data' },
      { status: 500 }
    );
  }
}
