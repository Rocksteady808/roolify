import { NextResponse } from 'next/server';

/**
 * Quick test endpoint to verify webhook is working
 * GET /api/test-submission
 */
export async function GET(req: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Test webhook with sample data
    const testPayload = {
      formId: 'test-form',
      formName: 'Test Form',
      siteId: 'test-site',
      data: {
        'Name': 'Test User',
        'Email': 'test@example.com',
        'Message': 'This is a test submission'
      },
      timestamp: new Date().toISOString(),
      pageUrl: 'https://test.webflow.io/test',
      pageTitle: 'Test Page'
    };

    console.log('[Test] Sending test submission to webhook...');

    const response = await fetch(`${baseUrl}/api/submissions/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      webhookResponse: result,
      testPayload,
      message: response.ok
        ? '✅ Webhook is working! Submissions are being captured.'
        : '❌ Webhook failed. Check server logs for details.'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: '❌ Test failed. Check if the server is running.'
    }, { status: 500 });
  }
}
