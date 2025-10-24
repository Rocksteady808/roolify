import { NextResponse } from 'next/server';
import { xanoSubmissions } from '@/lib/xano';

/**
 * Debug endpoint to see ALL fields across ALL submissions
 */
export async function GET() {
  try {
    const submissions = await xanoSubmissions.getAll();

    if (submissions.length === 0) {
      return NextResponse.json({ error: 'No submissions found' });
    }

    // Collect ALL unique fields across ALL submissions
    const allFields = new Set<string>();
    const sampleData: any = {};

    submissions.forEach((sub, index) => {
      let parsedData: any = sub.submission_data;

      // Parse if string
      while (typeof parsedData === 'string') {
        try {
          parsedData = JSON.parse(parsedData);
        } catch (e) {
          break;
        }
      }

      // Extract formData
      const formData = parsedData?.formData || parsedData?.data || parsedData || {};

      // Collect field names
      Object.keys(formData).forEach(key => {
        if (!key.startsWith('_')) {
          allFields.add(key);
          // Save sample value from first occurrence
          if (!sampleData[key]) {
            sampleData[key] = formData[key];
          }
        }
      });
    });

    return NextResponse.json({
      total_submissions: submissions.length,
      total_unique_fields: allFields.size,
      all_field_names: Array.from(allFields).sort(),
      sample_field_values: sampleData
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
