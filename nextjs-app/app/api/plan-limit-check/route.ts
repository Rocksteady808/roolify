import { NextResponse } from 'next/server';
import { checkPlanLimit } from '@/lib/xano';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { limitType, userId = 1 } = await req.json();
    
    if (!limitType) {
      return NextResponse.json(
        { error: 'limitType is required' },
        { status: 400 }
      );
    }

    // Bypass for admin user (ID 1 or email aarontownsend6@gmail.com)
    // Admin users have unlimited access to all features
    if (userId === 1) {
      return NextResponse.json({
        allowed: true,
        currentCount: 0,
        maxLimit: -1,
        planName: 'Admin',
        message: 'Admin access - unlimited'
      });
    }

    // For non-admin users, perform the full check
    const result = await checkPlanLimit(userId, limitType);
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error checking plan limit', error);
    // On error, allow action to proceed (fail open for better UX)
    // This prevents blocking users if there's a temporary issue with the plan check
    return NextResponse.json({
      allowed: true,
      currentCount: 0,
      maxLimit: -1,
      planName: 'Unknown',
      message: 'Unable to verify plan - allowing action'
    });
  }
}

