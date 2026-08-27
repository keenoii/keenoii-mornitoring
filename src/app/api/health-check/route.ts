import { NextResponse } from 'next/server';
import { checkLiveUrlHealth } from '@/services/live-health-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const result = await checkLiveUrlHealth(url);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, urls } = body;

    if (urls && Array.isArray(urls)) {
      const results = await Promise.all(
        urls.map(async (u: string) => ({
          url: u,
          result: await checkLiveUrlHealth(u),
        }))
      );
      return NextResponse.json({ results });
    }

    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    const result = await checkLiveUrlHealth(url);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to check URL health' }, { status: 500 });
  }
}
