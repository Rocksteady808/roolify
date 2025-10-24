import { NextResponse } from 'next/server';
import { xanoSites } from '../../../../lib/xano';

export async function GET() {
  try {
    const sites = await xanoSites.getAll();
    return NextResponse.json({ sites });
  } catch (error) {
    console.error('Error fetching sites from Xano:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const site = await xanoSites.create(body);
    return NextResponse.json({ site }, { status: 201 });
  } catch (error) {
    console.error('Error creating site in Xano:', error);
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    );
  }
}
