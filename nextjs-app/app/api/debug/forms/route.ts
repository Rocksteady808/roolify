import { NextResponse } from 'next/server';
import { xanoForms } from '@/lib/xano';

export async function GET() {
  try {
    const allForms = await xanoForms.getAll();

    // Filter for HBI forms
    const hbiForms = allForms.filter(f =>
      f.name && f.name.includes('HBI')
    );

    return NextResponse.json({
      totalForms: allForms.length,
      hbiForms: hbiForms.map(f => ({
        id: f.id,
        name: f.name,
        html_form_id: f.html_form_id,
        site_id: f.site_id,
        user_id: f.user_id,
        created_at: new Date(f.created_at).toISOString()
      }))
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
