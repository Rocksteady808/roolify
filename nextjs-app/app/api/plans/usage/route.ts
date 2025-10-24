import { NextResponse } from 'next/server';
import { checkPlanLimit } from '../../../../lib/xano';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get('userId') || '1');
    const limitType = searchParams.get('type') as 'sites' | 'rules' | 'submissions' | 'all';
    
    if (!limitType || !['sites', 'rules', 'submissions', 'all'].includes(limitType)) {
      return NextResponse.json({
        error: 'Invalid limit type. Must be: sites, rules, submissions, or all'
      }, { status: 400 });
    }
    
    if (limitType === 'all') {
      // Get all limit types
      const [sitesCheck, rulesCheck, submissionsCheck] = await Promise.all([
        checkPlanLimit(userId, 'sites'),
        checkPlanLimit(userId, 'rules'),
        checkPlanLimit(userId, 'submissions')
      ]);
      
      return NextResponse.json({
        success: true,
        usage: {
          sites: sitesCheck,
          rules: rulesCheck,
          submissions: submissionsCheck
        },
        summary: {
          totalAllowed: {
            sites: sitesCheck.maxLimit,
            rules: rulesCheck.maxLimit,
            submissions: submissionsCheck.maxLimit
          },
          totalUsed: {
            sites: sitesCheck.currentCount,
            rules: rulesCheck.currentCount,
            submissions: submissionsCheck.currentCount
          },
          planName: sitesCheck.planName, // All should have same plan name
          isAdmin: sitesCheck.planName === 'Admin'
        }
      });
    } else {
      // Get specific limit type
      const planCheck = await checkPlanLimit(userId, limitType);
      
      return NextResponse.json({
        success: true,
        usage: planCheck
      });
    }
    
  } catch (error) {
    console.error('Error checking plan usage:', error);
    return NextResponse.json(
      { error: 'Failed to check plan usage', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId = 1, limitType } = body;
    
    if (!limitType || !['sites', 'rules', 'submissions', 'all'].includes(limitType)) {
      return NextResponse.json({
        error: 'Invalid limit type. Must be: sites, rules, submissions, or all'
      }, { status: 400 });
    }
    
    // Same logic as GET but with POST body
    return await GET(new Request(req.url + `?userId=${userId}&type=${limitType}`));
    
  } catch (error) {
    console.error('Error checking plan usage:', error);
    return NextResponse.json(
      { error: 'Failed to check plan usage', details: String(error) },
      { status: 500 }
    );
  }
}
