import { NextRequest, NextResponse } from 'next/server';
import { xanoForms } from '@/lib/xano';

/**
 * DEBUG ENDPOINT: Track when forms are created
 * GET /api/debug/track-form-creation?siteId=xxx
 *
 * This helps us identify when and where form records are being created
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'siteId required' }, { status: 400 });
    }

    // Get all forms for this site
    const allForms = await xanoForms.getAll();
    const siteForms = allForms.filter(f => f.site_id === siteId);

    // Sort by created_at to see the most recent first
    const sortedForms = siteForms.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

    // Format timestamps as readable dates
    const formsWithDates = sortedForms.map(f => ({
      id: f.id,
      name: f.name,
      html_form_id: f.html_form_id,
      site_id: f.site_id,
      created_at: f.created_at,
      created_date: f.created_at ? new Date(f.created_at * 1000).toISOString() : 'Unknown',
      updated_at: f.updated_at,
      updated_date: f.updated_at ? new Date(f.updated_at * 1000).toISOString() : 'Unknown',
    }));

    return NextResponse.json({
      siteId,
      totalForms: siteForms.length,
      forms: formsWithDates,
      message: 'Check the created_date to see when each form was added to the database'
    });
  } catch (error) {
    console.error('[Debug Track Forms] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
