import puppeteer from 'puppeteer';

interface FormSubmissionData {
  [key: string]: any;
}

interface PDFGenerationOptions {
  formName: string;
  submissionData: FormSubmissionData;
  timestamp: string;
  pageUrl?: string;
  siteName?: string;
}

export async function generateFormSubmissionPDF(options: PDFGenerationOptions): Promise<Buffer> {
  const { formName, submissionData, timestamp, pageUrl, siteName } = options;
  
  const html = generatePDFHTML(formName, submissionData, timestamp, pageUrl, siteName);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

function generatePDFHTML(
  formName: string, 
  data: FormSubmissionData, 
  timestamp: string, 
  pageUrl?: string, 
  siteName?: string
): string {
  // Filter out system fields and empty values
  const fields = Object.entries(data)
    .filter(([key, value]) => {
      // Skip system fields
      if (['formId', 'siteId', 'formName', 'siteName', 'timestamp', 'pageUrl', 'pageTitle', 'userAgent'].includes(key)) {
        return false;
      }
      // Skip empty values
      if (value === null || value === undefined || value === '') {
        return false;
      }
      return true;
    })
    .map(([key, value]) => ({ key, value }));
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Form Submission - ${formName}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; 
          padding: 20px; 
          line-height: 1.6;
          color: #333;
        }
        .header { 
          border-bottom: 3px solid #2563eb; 
          padding-bottom: 15px; 
          margin-bottom: 25px; 
        }
        .header h1 { 
          color: #2563eb; 
          margin: 0 0 10px 0; 
          font-size: 28px;
        }
        .submission-info {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
          border-left: 4px solid #2563eb;
        }
        .field { 
          margin-bottom: 20px; 
          page-break-inside: avoid;
        }
        .field-label { 
          font-weight: 600; 
          color: #1e40af; 
          margin-bottom: 8px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .field-value { 
          margin-top: 5px; 
          padding: 12px; 
          background: #f1f5f9; 
          border-radius: 6px; 
          border: 1px solid #e2e8f0;
          font-size: 16px;
          word-wrap: break-word;
        }
        .metadata { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 2px solid #e2e8f0; 
          font-size: 12px; 
          color: #64748b;
          background: #f8fafc;
          padding: 15px;
          border-radius: 6px;
        }
        .roolify-brand {
          color: #2563eb;
          font-weight: 600;
        }
        .no-data {
          text-align: center;
          color: #64748b;
          font-style: italic;
          padding: 40px;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Form Submission: ${escapeHtml(formName)}</h1>
        <div class="submission-info">
          <p><strong>Submitted:</strong> ${new Date(timestamp).toLocaleString()}</p>
          ${siteName ? `<p><strong>Site:</strong> ${escapeHtml(siteName)}</p>` : ''}
          ${pageUrl ? `<p><strong>Page:</strong> ${escapeHtml(pageUrl)}</p>` : ''}
        </div>
      </div>
      
      <div class="fields">
        ${fields.length > 0 ? fields.map(field => `
          <div class="field">
            <div class="field-label">${formatFieldName(field.key)}</div>
            <div class="field-value">${formatFieldValue(field.value)}</div>
          </div>
        `).join('') : '<div class="no-data">No form data available</div>'}
      </div>
      
      <div class="metadata">
        <p><span class="roolify-brand">Roolify</span> - Form Automation Platform</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>This PDF contains the submitted form data for record keeping and reference.</p>
      </div>
    </body>
    </html>
  `;
}

function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

function formatFieldValue(value: any): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
