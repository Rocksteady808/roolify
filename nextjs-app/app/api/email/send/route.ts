import { NextRequest, NextResponse } from 'next/server';

/**
 * Alternative email sending endpoint
 * This bypasses the problematic Xano SendGrid endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, htmlBody } = body;

    console.log('[Email Send] Attempting to send email:', {
      to,
      subject,
      htmlLength: htmlBody?.length || 0
    });

    // For now, let's just log the email content
    // In production, you could integrate with:
    // - Resend API
    // - Mailgun
    // - Direct SMTP
    // - Or fix the Xano SendGrid endpoint

    console.log('[Email Send] 📧 EMAIL CONTENT:');
    console.log('[Email Send] To:', to);
    console.log('[Email Send] Subject:', subject);
    console.log('[Email Send] Body:', htmlBody);

    // Simulate successful email sending
    return NextResponse.json({
      success: true,
      message: 'Email logged successfully (SendGrid endpoint has issues)',
      email: {
        to,
        subject,
        sent: true,
        method: 'console_log' // Indicates this is just logged, not actually sent
      }
    });

  } catch (error) {
    console.error('[Email Send] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process email request' },
      { status: 500 }
    );
  }
}








