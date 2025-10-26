import { NextResponse } from 'next/server';
import { refreshWebflowToken } from '@/lib/webflowStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { siteId } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    console.log(`[Webflow Refresh Token API] Refreshing token for site ${siteId}`);

    const refreshedRecord = await refreshWebflowToken(siteId);

    if (!refreshedRecord) {
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      expiresAt: refreshedRecord.expiresAt
    });
  } catch (error) {
    console.error('[Webflow Refresh Token API] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
