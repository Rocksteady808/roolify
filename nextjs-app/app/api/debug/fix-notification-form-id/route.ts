import { NextResponse } from 'next/server';
import { xanoNotifications } from '@/lib/xano';

export async function POST(req: Request) {
  try {
    console.log('[Fix Notification Form ID] Updating notification settings to use form 102...');
    
    // Update notification setting ID 53 to use form 102 instead of 104
    const result = await xanoNotifications.update(53, {
      form: 102, // Change from 104 to 102
      // Keep all other fields the same
    });
    
    console.log('[Fix Notification Form ID] ✅ Successfully updated notification settings');
    
    return NextResponse.json({
      success: true,
      message: 'Notification settings updated to use form 102',
      result
    });
    
  } catch (error: any) {
    console.error('[Fix Notification Form ID] ❌ Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to update notification settings'
    }, { status: 500 });
  }
}