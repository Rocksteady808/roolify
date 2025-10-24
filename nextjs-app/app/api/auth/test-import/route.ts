import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/serverAuth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ 
      success: true, 
      user: user,
      message: "Import successful" 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: "Import failed" 
    });
  }
}
