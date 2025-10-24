import { NextResponse } from 'next/server';
import { xanoAuth } from '@/lib/xano';
import { isAdmin } from '@/lib/adminUtils';
import { getCurrentUser } from '@/lib/serverAuth';

export async function POST(req: Request) {
  try {
    // Get current user
    const user = await getCurrentUser();
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { action, counts } = await req.json();
    
    switch (action) {
      case 'toggle':
        // Toggle is handled client-side via localStorage
        return NextResponse.json({ success: true });
        
      case 'set-counts':
        if (!counts || typeof counts !== 'object') {
          return NextResponse.json(
            { error: 'Invalid counts provided' },
            { status: 400 }
          );
        }
        // Counts are set client-side via localStorage
        return NextResponse.json({ success: true, counts });
        
      case 'reset':
        // Reset is handled client-side via localStorage
        return NextResponse.json({ success: true });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in test-mode API:', error);
    return NextResponse.json(
      { error: 'Failed to process test mode action', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Get current user
    const user = await getCurrentUser();
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Return success - test mode state is managed client-side
    return NextResponse.json({ 
      isAdmin: true,
      message: 'Test mode is available'
    });
  } catch (error) {
    console.error('Error checking test mode access:', error);
    return NextResponse.json(
      { error: 'Failed to check test mode access', details: String(error) },
      { status: 500 }
    );
  }
}




