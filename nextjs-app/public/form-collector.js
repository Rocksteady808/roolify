/**
 * Roolify Form Collector Script
 * 
 * Add this script to your Webflow site's <head> or before </body>
 * It automatically collects all form data and sends it to your Roolify app
 * 
 * Usage:
 * <script src="https://your-app-url.com/form-collector.js"></script>
 * <script>
 *   RoolifyFormCollector.init({
 *     apiUrl: 'https://your-app-url.com/api/forms/collect',
 *     siteId: 'your-site-id-here'
 *   });
 * </script>
 */

(function() {
  'use strict';

  window.RoolifyFormCollector = {
    config: {
      apiUrl: '',
      siteId: ''
    },

    init: function(options) {
      this.config = Object.assign({}, this.config, options);
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.collectAndSend());
      } else {
        this.collectAndSend();
      }
    },

    collectForms: function() {
      const forms = [];
      const formElements = document.querySelectorAll('form');

      formElements.forEach((form, formIndex) => {
        const formId = form.id || form.getAttribute('data-name') || `form-${formIndex}`;
        const formName = form.getAttribute('data-name') || form.name || formId;

        const fields = [];

        // Get all form elements with IDs
        const allElements = form.querySelectorAll('[id]');
        
        allElements.forEach((element) => {
          const id = element.id;
          const tagName = element.tagName.toLowerCase();
          
          const field = {
            id: id,
            name: element.name || id,
            type: this.getFieldType(element),
            label: this.getFieldLabel(element),
            displayName: this.getFieldLabel(element) || id,
            elementId: id,
            required: element.hasAttribute('required'),
            placeholder: element.placeholder || '',
            formId: formId,
            fieldName: element.name || id,
            formName: formName,
            pageUrl: window.location.href
          };

          // Extract options for select, radio, and checkbox elements
          if (tagName === 'select') {
            field.options = this.getSelectOptions(element);
          } else if (tagName === 'input') {
            const inputType = element.type || 'text';
            field.type = inputType;
            
            if (inputType === 'radio' || inputType === 'checkbox') {
              field.value = element.value;
              field.options = this.getRadioCheckboxOptions(form, element.name);
            }
          } else if (tagName === 'div') {
            // Include divs for show/hide logic
            field.type = 'div';
            field.tagName = 'div';
            field.isFormField = false;
          }

          fields.push(field);
        });

        forms.push({
          id: formId,
          formId: formId,
          name: formName,
          formName: formName,
          url: window.location.href,
          pageUrl: window.location.href,
          fields: fields,
          createdAt: new Date().toISOString()
        });
      });

      return forms;
    },

    getFieldType: function(element) {
      const tagName = element.tagName.toLowerCase();
      if (tagName === 'input') {
        return element.type || 'text';
      }
      if (tagName === 'select') {
        return 'select';
      }
      if (tagName === 'textarea') {
        return 'textarea';
      }
      return tagName;
    },

    getFieldLabel: function(element) {
      // Try to find associated label
      const labels = document.querySelectorAll(`label[for="${element.id}"]`);
      if (labels.length > 0) {
        return labels[0].textContent.trim();
      }
      
      // Try to find parent label
      let parent = element.parentElement;
      while (parent && parent.tagName !== 'FORM') {
        if (parent.tagName === 'LABEL') {
          return parent.textContent.trim();
        }
        parent = parent.parentElement;
      }
      
      return element.getAttribute('aria-label') || element.name || element.id;
    },

    getSelectOptions: function(selectElement) {
      const options = [];
      const optionElements = selectElement.querySelectorAll('option');
      
      optionElements.forEach((option) => {
        const text = option.textContent.trim();
        // Skip empty or placeholder options
        if (text && text !== 'Select one...' && text !== 'Choose...' && text !== 'Select...') {
          options.push(text);
        }
      });
      
      return options;
    },

    getRadioCheckboxOptions: function(form, name) {
      const options = [];
      const inputs = form.querySelectorAll(`input[name="${name}"]`);
      
      inputs.forEach((input) => {
        if (input.value) {
          options.push(input.value);
        }
      });
      
      return options.length > 0 ? options : undefined;
    },

    collectAndSend: function() {
      const forms = this.collectForms();
      
      if (forms.length === 0) {
        console.log('[Roolify] No forms found on this page');
        return;
      }

      console.log(`[Roolify] Collected ${forms.length} forms with form data:`, forms);

      // Send to API
      if (this.config.apiUrl && this.config.siteId) {
        this.sendToAPI(forms);
      } else {
        console.warn('[Roolify] apiUrl or siteId not configured');
      }
    },

    sendToAPI: function(forms) {
      fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: this.config.siteId,
          forms: forms
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('[Roolify] Successfully sent form data:', data);
      })
      .catch(error => {
        console.error('[Roolify] Error sending form data:', error);
      });
    }
  };

  // Auto-initialize if config is in window
  if (window.RoolifyConfig) {
    window.RoolifyFormCollector.init(window.RoolifyConfig);
  }
})();





