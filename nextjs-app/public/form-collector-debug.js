/**
 * Roolify Form Collector Script - DEBUG VERSION
 * 
 * This version has extra logging to help debug issues
 */

(function() {
  'use strict';

  console.log('[Roolify Debug] Script loaded successfully');

  window.RoolifyFormCollector = {
    config: {
      apiUrl: '',
      siteId: ''
    },

    init: function(options) {
      console.log('[Roolify Debug] Initializing with options:', options);
      this.config = Object.assign({}, this.config, options);
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        console.log('[Roolify Debug] DOM still loading, waiting...');
        document.addEventListener('DOMContentLoaded', () => this.collectAndSend());
      } else {
        console.log('[Roolify Debug] DOM ready, collecting immediately');
        this.collectAndSend();
      }
    },

    collectForms: function() {
      console.log('[Roolify Debug] Starting form collection...');
      const forms = [];
      const formElements = document.querySelectorAll('form');

      console.log(`[Roolify Debug] Found ${formElements.length} form elements`);

      formElements.forEach((form, formIndex) => {
        const formId = form.id || form.getAttribute('data-name') || `form-${formIndex}`;
        const formName = form.getAttribute('data-name') || form.name || formId;

        console.log(`[Roolify Debug] Processing form ${formIndex}: ${formName} (${formId})`);

        const fields = [];

        // Get all form elements with IDs
        const allElements = form.querySelectorAll('[id]');
        console.log(`[Roolify Debug] Found ${allElements.length} elements with IDs in form ${formName}`);
        
        allElements.forEach((element) => {
          const id = element.id;
          const tagName = element.tagName.toLowerCase();
          
          console.log(`[Roolify Debug] Processing element: ${tagName}#${id}`);
          
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
            console.log(`[Roolify Debug] Select element ${id} has options:`, field.options);
          } else if (tagName === 'input') {
            const inputType = element.type || 'text';
            field.type = inputType;
            
            if (inputType === 'radio' || inputType === 'checkbox') {
              field.value = element.value;
              field.options = this.getRadioCheckboxOptions(form, element.name);
              console.log(`[Roolify Debug] ${inputType} element ${id} has options:`, field.options);
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

        console.log(`[Roolify Debug] Form ${formName} has ${fields.length} fields`);
      });

      console.log(`[Roolify Debug] Total forms collected: ${forms.length}`);
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
      
      console.log(`[Roolify Debug] Select element has ${optionElements.length} option elements`);
      
      optionElements.forEach((option) => {
        const text = option.textContent.trim();
        // Skip empty or placeholder options
        if (text && text !== 'Select one...' && text !== 'Choose...' && text !== 'Select...') {
          options.push(text);
          console.log(`[Roolify Debug] Added option: "${text}"`);
        } else {
          console.log(`[Roolify Debug] Skipped option: "${text}"`);
        }
      });
      
      console.log(`[Roolify Debug] Final options for select:`, options);
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
      console.log('[Roolify Debug] Starting collectAndSend...');
      const forms = this.collectForms();
      
      if (forms.length === 0) {
        console.log('[Roolify Debug] No forms found on this page');
        return;
      }

      console.log(`[Roolify Debug] Collected ${forms.length} forms with form data:`, forms);

      // Send to API
      if (this.config.apiUrl && this.config.siteId) {
        console.log('[Roolify Debug] Sending to API:', this.config.apiUrl);
        this.sendToAPI(forms);
      } else {
        console.warn('[Roolify Debug] apiUrl or siteId not configured:', this.config);
      }
    },

    sendToAPI: function(forms) {
      console.log('[Roolify Debug] Sending data to API...');
      
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
      .then(response => {
        console.log('[Roolify Debug] API response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('[Roolify Debug] API response data:', data);
        console.log('[Roolify Debug] Successfully sent form data!');
      })
      .catch(error => {
        console.error('[Roolify Debug] Error sending form data:', error);
      });
    }
  };

  // Auto-initialize if config is in window
  if (window.RoolifyConfig) {
    console.log('[Roolify Debug] Auto-initializing with window.RoolifyConfig');
    window.RoolifyFormCollector.init(window.RoolifyConfig);
  }

  console.log('[Roolify Debug] Script setup complete');
})();




