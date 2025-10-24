import { NextResponse } from 'next/server';
import { xanoSubmissions } from '@/lib/xano';

export async function GET() {
  try {
    const allSubmissions = await xanoSubmissions.getAll();

    // Get the most recent submission
    const latest = allSubmissions.sort((a, b) => b.created_at - a.created_at)[0];

    if (!latest) {
      return NextResponse.json({ error: 'No submissions found' });
    }

    // Parse the submission data to see field names
    const submissionData = typeof latest.submission_data === 'string'
      ? JSON.parse(latest.submission_data)
      : latest.submission_data;

    return NextResponse.json({
      submissionId: latest.id,
      formId: latest.form_id,
      createdAt: new Date(latest.created_at).toISOString(),
      fieldNames: Object.keys(submissionData),
      fullData: submissionData
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
