import { NextResponse } from 'next/server';
import { xanoForms } from '@/lib/xano';

export async function POST(req: Request) {
  try {
    console.log('[Delete Form 102] Removing duplicate HBI form...');
    
    // Delete form 102 (the duplicate)
    const result = await xanoForms.delete(102);
    
    console.log('[Delete Form 102] ✅ Successfully deleted form 102');
    
    return NextResponse.json({
      success: true,
      message: 'Form 102 deleted successfully'
    });
    
  } catch (error: any) {
    console.error('[Delete Form 102] ❌ Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to delete form 102'
    }, { status: 500 });
  }
}

