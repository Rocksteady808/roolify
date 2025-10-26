import { NextRequest, NextResponse } from 'next/server';
import { generateFormSubmissionPDF } from '@/lib/pdfGenerator';

/**
 * Test endpoint for PDF generation
 * GET /api/test-pdf
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Testing PDF generation...');
    
    const sampleFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-123-4567',
      message: 'This is a test message for PDF generation.',
      company: 'Acme Corp',
      website: 'https://example.com',
      budget: '$10,000 - $25,000',
      timeline: '3-6 months',
      interests: ['Web Development', 'Mobile Apps', 'E-commerce'],
      newsletter: true,
      pageUrl: 'https://example.com/contact',
      pageTitle: 'Contact Us - Example.com'
    };

    console.log('📝 Sample form data:', Object.keys(sampleFormData));
    
    const pdfBuffer = await generateFormSubmissionPDF({
      formName: 'Contact Form',
      submissionData: sampleFormData,
      timestamp: new Date().toISOString(),
      pageUrl: 'https://example.com/contact',
      siteName: 'Example Website'
    });

    console.log('✅ PDF generated successfully!');
    console.log(`📄 PDF size: ${pdfBuffer.length} bytes`);
    console.log(`📄 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-form-submission.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('❌ PDF generation test failed:', error);
    return NextResponse.json(
      { 
        error: 'PDF generation failed', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
