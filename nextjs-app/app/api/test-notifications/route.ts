import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to manually trigger notification emails
 * This helps debug notification issues without needing a full form submission
 */
export async function POST(req: NextRequest) {
  try {
    const { formId, formData, formName } = await req.json();
    
    console.log('[Test Notifications] 🧪 Testing notification function manually');
    console.log('[Test Notifications] formId:', formId);
    console.log('[Test Notifications] formName:', formName);
    console.log('[Test Notifications] formData:', formData);
    
    // Import the notification function from the webhook
    const webhookModule = await import('../submissions/webhook/route');
    
    // Call the notification function directly
    await webhookModule.sendNotificationEmails(formId, formData, formName);
    
    console.log('[Test Notifications] ✅ Notification function completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Notification test completed',
      formId,
      formName
    });
    
  } catch (error) {
    console.error('[Test Notifications] ❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
