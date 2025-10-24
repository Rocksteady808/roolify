import { NextResponse } from 'next/server';
import { xanoNotifications } from '@/lib/xano';

export async function POST(req: Request) {
  try {
    console.log('[Fix Form 105] Updating notification settings to point to form 105...');
    
    // Update the notification settings to point to form 105 (the one actually receiving submissions)
    const result = await xanoNotifications.update(55, {
      form: 105, // Change from 102 to 105
      // Keep all other fields the same
    });
    
    console.log('[Fix Form 105] ✅ Updated notification settings to point to form 105');
    
    return NextResponse.json({
      success: true,
      message: 'Notification settings updated to point to form 105',
      result
    });
    
  } catch (error: any) {
    console.error('[Fix Form 105] ❌ Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to update form reference'
    }, { status: 500 });
  }
}

