import { NextResponse } from 'next/server';
import { checkPlanLimit } from '../../../../lib/xano';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get('userId') || '1');
    
    console.log(`[Plan Enforcement Test] Testing for user ${userId}`);
    
    // Test all limit types
    const [formsCheck, rulesCheck, submissionsCheck] = await Promise.all([
      checkPlanLimit(userId, 'forms'),
      checkPlanLimit(userId, 'rules'),
      checkPlanLimit(userId, 'submissions')
    ]);
    
    const results = {
      userId,
      timestamp: new Date().toISOString(),
      tests: {
        forms: {
          allowed: formsCheck.allowed,
          currentCount: formsCheck.currentCount,
          maxLimit: formsCheck.maxLimit,
          planName: formsCheck.planName,
          message: formsCheck.message
        },
        rules: {
          allowed: rulesCheck.allowed,
          currentCount: rulesCheck.currentCount,
          maxLimit: rulesCheck.maxLimit,
          planName: rulesCheck.planName,
          message: rulesCheck.message
        },
        submissions: {
          allowed: submissionsCheck.allowed,
          currentCount: submissionsCheck.currentCount,
          maxLimit: submissionsCheck.maxLimit,
          planName: submissionsCheck.planName,
          message: submissionsCheck.message
        }
      },
      summary: {
        isAdmin: formsCheck.planName === 'Admin',
        planName: formsCheck.planName,
        allAllowed: formsCheck.allowed && rulesCheck.allowed && submissionsCheck.allowed,
        anyLimitReached: !formsCheck.allowed || !rulesCheck.allowed || !submissionsCheck.allowed
      }
    };
    
    console.log('[Plan Enforcement Test] Results:', results);
    
    return NextResponse.json({
      success: true,
      message: 'Plan enforcement test completed',
      results
    });
    
  } catch (error) {
    console.error('[Plan Enforcement Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Plan enforcement test failed',
      details: String(error)
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId = 1 } = body;
    
    // Same logic as GET but with POST body
    return await GET(new Request(req.url + `?userId=${userId}`));
    
  } catch (error) {
    console.error('[Plan Enforcement Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Plan enforcement test failed',
      details: String(error)
    }, { status: 500 });
  }
}
