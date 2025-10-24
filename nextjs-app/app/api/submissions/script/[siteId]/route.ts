import { NextResponse } from 'next/server';

/**
 * Serves a configured form submission capture script for a specific site
 * GET /api/submissions/script/[siteId]
 */
export async function GET(
  request: Request,
  { params }: { params: { siteId: string } }
) {
  const siteId = params.siteId;
  
  // Get the base URL from the request
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  const script = `
/**
 * Roolify Form Submission Capture Script
 * Site ID: ${siteId}
 * Generated: ${new Date().toISOString()}
 */

(function() {
  'use strict';

  // Configuration
  const ROOLIFY_ENDPOINT = '${baseUrl}/api/submissions/webhook';
  const ROOLIFY_SITE_ID = '${siteId}';
  
  console.log('[Roolify Submission] Initializing for site:', ROOLIFY_SITE_ID);

  // Function to get form data
  function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    // Handle all form fields including checkboxes, radio buttons, etc.
    for (let [key, value] of formData.entries()) {
      if (data[key]) {
        // Multiple values (checkboxes with same name)
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  }

  // Function to send submission to Roolify
  async function sendSubmission(formElement, formData) {
    const formId = formElement.getAttribute('id') || formElement.getAttribute('data-name') || 'unknown';
    const formName = formElement.getAttribute('data-name') || formId;
    
    try {
      console.log('[Roolify] Capturing submission:', { formId, formName });
      
      const response = await fetch(ROOLIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: formId,
          formName: formName,
          siteId: ROOLIFY_SITE_ID,
          data: formData,
          timestamp: new Date().toISOString(),
          pageUrl: window.location.href,
          pageTitle: document.title,
          userAgent: navigator.userAgent
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Roolify] Submission saved:', result.submissionId);
        return result;
      } else {
        console.error('[Roolify] Failed to save submission:', response.status);
      }
    } catch (error) {
      console.error('[Roolify] Error sending submission:', error);
    }
  }

  // Initialize form capture
  function setupFormCapture() {
    // Find all Webflow forms
    const forms = document.querySelectorAll('form[data-name]');
    console.log('[Roolify] Found ' + forms.length + ' form(s)');

    forms.forEach(function(form) {
      const formName = form.getAttribute('data-name');
      console.log('[Roolify] Setting up capture for:', formName);

      // Capture on submit
      form.addEventListener('submit', function(event) {
        try {
          const formData = getFormData(form);
          console.log('[Roolify] Form submitted:', formName, formData);
          
          // Send to Roolify (async, don't block Webflow's submission)
          sendSubmission(form, formData);
        } catch (error) {
          console.error('[Roolify] Error capturing submission:', error);
        }
        
        // Don't prevent default - let Webflow handle the submission
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFormCapture);
  } else {
    setupFormCapture();
  }

  // Re-initialize on Webflow page changes (for single-page apps)
  if (window.Webflow) {
    window.Webflow.push(function() {
      console.log('[Roolify] Webflow ready event');
      setTimeout(setupFormCapture, 100);
    });
  }

  console.log('[Roolify Submission] Script loaded successfully');
})();
`.trim();

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}









