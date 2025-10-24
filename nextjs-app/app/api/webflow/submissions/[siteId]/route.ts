import { NextRequest, NextResponse } from 'next/server';
import { getTokenForSite } from '@/lib/webflowStore';
import { logger } from '@/lib/logger';

/**
 * GET /api/webflow/submissions/[siteId]
 * 
 * Fetches form submissions from Webflow's API
 * 
 * Query params:
 * - formElementId: (optional) Filter by specific form element ID
 * - limit: (optional) Number of submissions to return (default: 100)
 * - offset: (optional) Pagination offset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { siteId } = params;
    const { searchParams } = new URL(request.url);
    
    const formElementId = searchParams.get('formElementId');
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';

    logger.debug('Fetching submissions for site', { siteId });

    // Get Webflow API token for this site
    const tokenRecord = getTokenForSite(siteId);
    if (!tokenRecord || !tokenRecord.token) {
      return NextResponse.json(
        { error: 'No Webflow token found for this site. Please connect your site first.' },
        { status: 401 }
      );
    }
    const token = tokenRecord.token;

    // Build API URL
    let apiUrl = `https://api.webflow.com/v2/sites/${siteId}/form_submissions`;
    const queryParams = new URLSearchParams();
    
    if (formElementId) {
      queryParams.append('elementId', formElementId);
    }
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const queryString = queryParams.toString();
    if (queryString) {
      apiUrl += `?${queryString}`;
    }

    logger.debug('Webflow Submissions API URL', { apiUrl });

    // Fetch submissions from Webflow
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Webflow Submissions API error', { status: response.status });
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch submissions from Webflow',
          details: errorText,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const submissions = data.formSubmissions || data.submissions || [];

    logger.debug('Found submissions', { count: submissions.length });

    // Transform submissions to a consistent format
    const transformedSubmissions = submissions.map((sub: any) => ({
      id: sub.id || sub._id,
      formId: sub.formId,
      formElementId: sub.formElementId,
      formName: sub.formName || sub.name,
      siteId: sub.siteId || siteId,
      data: sub.data || {},
      submittedAt: sub.submittedAt || sub.d,
      created_at: sub.submittedAt ? new Date(sub.submittedAt).getTime() : Date.now(),
      source: 'webflow_api',
      // Include full original data for reference
      _original: sub
    }));

    return NextResponse.json({
      success: true,
      submissions: transformedSubmissions,
      count: transformedSubmissions.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: data.pagination?.next != null
      }
    });

  } catch (error) {
    logger.error('Webflow Submissions error', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Webflow submissions',
        details: String(error)
      },
      { status: 500 }
    );
  }
}

