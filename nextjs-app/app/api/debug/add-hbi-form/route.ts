import { NextResponse } from 'next/server';
import { xanoForms } from '@/lib/xano';

export async function POST(req: Request) {
  try {
    console.log('[Add HBI Form] Manually adding HBI form to Xano...');
    
    const hbiFormData = {
      html_form_id: '68f648d669c38f6206830743',
      name: 'HBI International Inquiry Form - HBI International',
      site_id: '652b10ed79cbf4ed07a349ed',
      page_url: 'Form Test',
      form_fields: {
        '68f811635c211b1b5c7aedf2': { displayName: 'Has Account', type: 'Radio' },
        '68f811635c211b1b5c7aedf3': { displayName: 'HBI Account Rep', type: 'Select' },
        '68f811635c211b1b5c7aedf4': { displayName: 'EIN Number', type: 'Plain' },
        '68f811635c211b1b5c7aedf5': { displayName: 'Full Name', type: 'Plain' },
        '68f811635c211b1b5c7aedf6': { displayName: 'Company Name', type: 'Plain' },
        '68f811635c211b1b5c7aedf7': { displayName: 'Email', type: 'Email' },
        '68f811635c211b1b5c7aedf8': { displayName: 'Select Country', type: 'Select' },
        '68f811635c211b1b5c7aedf9': { displayName: 'Message Inquiry', type: 'Plain' },
        '68f811635c211b1b5c7aedfa': { displayName: 'Privacy Policy', type: 'Checkbox' },
        '68f811635c211b1b5c7aedfb': { displayName: 'Terms Of Service', type: 'Checkbox' }
      },
      user_id: 1
    };

    const result = await xanoForms.sync(hbiFormData);
    
    console.log('[Add HBI Form] ✅ Successfully added HBI form:', result.id);
    
    return NextResponse.json({
      success: true,
      form: result,
      message: 'HBI form added successfully'
    });
    
  } catch (error: any) {
    console.error('[Add HBI Form] ❌ Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to add HBI form'
    }, { status: 500 });
  }
}

