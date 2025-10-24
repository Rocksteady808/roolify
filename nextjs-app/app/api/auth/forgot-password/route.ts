import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const MAIN_BASE_URL = process.env.NEXT_PUBLIC_XANO_API_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj';

/**
 * Forgot Password - Request password reset
 *
 * Generates a reset token and sends email via SendGrid directly.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('[Forgot Password] Requesting password reset for:', email);

    // Generate a secure random token
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store the reset token in Xano (using submissions table as temporary storage)
    const tokenData = {
      email,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
      used: false,
      type: 'password_reset'
    };

    const storeResponse = await fetch(`${MAIN_BASE_URL}/submission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submission_data: JSON.stringify(tokenData),
        form_id: 999, // Special form ID for password reset tokens
        user_id: 1
      }),
    });

    if (!storeResponse.ok) {
      console.error('[Forgot Password] Failed to store reset token');
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, you will receive a password reset link.'
      });
    }

    // Send password reset email via SendGrid
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sendgrid/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: 'Reset Your Password',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>You requested a password reset for your account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.</p>
            <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #666; font-size: 14px; word-break: break-all;">${resetUrl}</p>
          </div>
        `,
        textBody: `Reset Your Password\n\nYou requested a password reset for your account. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.`,
        fromEmail: 'aaront@flexflowweb.com',
        fromName: 'Form Notifications'
      }),
    });

    if (!emailResponse.ok) {
      console.error('[Forgot Password] Failed to send email');
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, you will receive a password reset link.'
      });
    }

    console.log('[Forgot Password] Reset token generated and email sent');

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent to your email'
    });

  } catch (error: any) {
    console.error('[Forgot Password] Error:', error);

    // Return success even on error to not reveal user existence
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link.'
    });
  }
}
