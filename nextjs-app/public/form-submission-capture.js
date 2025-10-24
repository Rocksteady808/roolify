/**
 * Roolify Form Submission Capture Script
 * 
 * This script captures Webflow form submissions and sends them to your Roolify backend.
 * Add this script to your Webflow site's custom code (before </body> tag).
 * 
 * Configuration:
 * Set ROOLIFY_ENDPOINT to your webhook URL
 */

(function() {
  'use strict';

  // Configuration
  const ROOLIFY_ENDPOINT = 'https://your-domain.com/api/submissions/webhook'; // UPDATE THIS
  const ROOLIFY_SITE_ID = document.querySelector('meta[name="roolify-site-id"]')?.content || 'unknown';
  
  console.log('[Roolify Submission Capture] Initializing...');

  // Function to get form data
  function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      // Handle multiple values (checkboxes, multi-select)
      if (data[key]) {
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
  async function sendSubmission(formId, formName, data) {
    try {
      console.log('[Roolify] Sending submission:', { formId, formName, data });
      
      const response = await fetch(ROOLIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: formId,
          formName: formName,
          siteId: ROOLIFY_SITE_ID,
          data: data,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Roolify] Submission saved:', result);
        return result;
      } else {
        console.error('[Roolify] Submission failed:', response.status);
      }
    } catch (error) {
      console.error('[Roolify] Error sending submission:', error);
    }
  }

  // Intercept Webflow form submissions
  function initFormCapture() {
    // Find all Webflow forms
    const forms = document.querySelectorAll('form[data-name]');
    console.log(`[Roolify] Found ${forms.length} forms`);

    forms.forEach(form => {
      const formId = form.getAttribute('id') || form.getAttribute('data-name');
      const formName = form.getAttribute('data-name');
      
      console.log(`[Roolify] Setting up capture for form: ${formName} (${formId})`);

      // Listen for form submission
      form.addEventListener('submit', function(e) {
        console.log('[Roolify] Form submitted:', formName);
        
        // Get form data
        const data = getFormData(form);
        
        // Send to Roolify (don't prevent default, let Webflow handle it)
        sendSubmission(formId, formName, data);
      });

      // Also listen for Webflow's success event
      form.addEventListener('submit', function() {
        // Wait a moment for Webflow to process
        setTimeout(function() {
          const successDiv = form.parentElement?.querySelector('.w-form-done');
          if (successDiv && successDiv.style.display !== 'none') {
            console.log('[Roolify] Form submission successful (confirmed by Webflow)');
          }
        }, 500);
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormCapture);
  } else {
    initFormCapture();
  }

  // Re-initialize on Webflow's page change (for dynamic content)
  if (window.Webflow) {
    window.Webflow.push(function() {
      console.log('[Roolify] Webflow ready, re-initializing form capture');
      initFormCapture();
    });
  }

  console.log('[Roolify Submission Capture] Ready');
})();









