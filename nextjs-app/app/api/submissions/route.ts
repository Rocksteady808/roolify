import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getCurrentUserId } from '@/lib/serverAuth';

/**
 * Get all submissions
 * GET /api/submissions
 * 
 * Query params:
 * - formId: Filter by form ID (optional)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const formIdFilter = searchParams.get('formId');

    // Get current user ID for filtering
    const currentUserId = await getCurrentUserId(req);
    if (!currentUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          submissions: [],
          count: 0
        },
        { status: 401 }
      );
    }

    logger.debug(`Fetching submissions for user ${currentUserId}`);

    // Get auth token from request headers for Xano API
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authorization header required',
          submissions: [],
          count: 0
        },
        { status: 401 }
      );
    }

    // Fetch all submissions from Xano with auth token
    const MAIN_BASE_URL = process.env.NEXT_PUBLIC_XANO_API_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj';
    const response = await fetch(`${MAIN_BASE_URL}/submission`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Xano API error: ${response.status}`);
    }

    const submissions = await response.json();
    
    logger.debug(`Found ${submissions.length} submissions from Xano`);

    // Parse submission_data from JSON string and filter by user_id
    const parsedSubmissions = submissions
      .map((sub: any) => ({
        id: sub.id,
        created_at: sub.created_at,
        form_id: sub.form_id,
        user_id: sub.user_id,
        data: typeof sub.submission_data === 'string'
          ? JSON.parse(sub.submission_data)
          : sub.submission_data
      }))
      .filter((sub: any) => sub.user_id === currentUserId); // User isolation

    logger.debug(`Filtered to ${parsedSubmissions.length} submissions for user ${currentUserId}`);

    // Filter by formId if provided
    let filteredSubmissions = parsedSubmissions;
    if (formIdFilter) {
      filteredSubmissions = parsedSubmissions.filter((sub: any) => {
        // Match either by HTML form id embedded in submission data or by numeric form_id
        const htmlId = sub.data?._htmlFormId;
        const numericId = sub.form_id?.toString();
        return htmlId === formIdFilter || numericId === formIdFilter;
      });
      logger.debug(`Filtered to ${filteredSubmissions.length} submissions for form ${formIdFilter}`);
    }

    return NextResponse.json({
      success: true,
      submissions: filteredSubmissions,
      count: filteredSubmissions.length
    });

  } catch (error: any) {
    logger.error('Submissions API error', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch submissions',
        submissions: [],
        count: 0
      },
      { status: 500 }
    );
  }
}









