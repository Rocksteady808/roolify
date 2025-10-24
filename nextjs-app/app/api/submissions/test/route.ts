import { NextResponse } from 'next/server';
import { xanoSubmissions } from '@/lib/xano';

/**
 * Test endpoint to create a sample submission
 * GET /api/submissions/test
 */
export async function GET() {
  try {
    console.log('[Submission Test] Creating test submission...');

    // Create a test submission
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test submission created at ' + new Date().toISOString(),
      _meta: {
        formId: 'wf-form-Contact-Form',
        formName: 'Contact Form',
        siteId: '68bc42f58e22a62ce5c282e0',
        submittedAt: new Date().toISOString(),
        source: 'test_endpoint',
        pageUrl: 'https://test.webflow.io/contact',
        pageTitle: 'Contact Us'
      }
    };

    const submission = await xanoSubmissions.create(
      testData,
      0, // form_id (using 0 as placeholder)
      1  // user_id (using 1 as default)
    );

    console.log('[Submission Test] ✓ Test submission created:', submission.id);

    return NextResponse.json({
      success: true,
      message: 'Test submission created successfully',
      submission: {
        id: submission.id,
        created_at: submission.created_at,
        form_id: submission.form_id,
        user_id: submission.user_id,
        data: JSON.parse(submission.submission_data)
      }
    });

  } catch (error: any) {
    console.error('[Submission Test] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create test submission',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}









