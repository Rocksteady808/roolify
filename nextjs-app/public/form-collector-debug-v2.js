/**
 * Roolify Form Collector Script - DEBUG VERSION 2
 * 
 * This version has extensive logging to debug form collection issues
 */

(function() {
  'use strict';

  console.log('[Roolify Debug V2] Script loaded successfully');

  window.RoolifyFormCollector = {
    config: {
      apiUrl: '',
      siteId: ''
    },

    init: function(options) {
      console.log('[Roolify Debug V2] Initializing with options:', options);
      this.config = Object.assign({}, this.config, options);
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        console.log('[Roolify Debug V2] DOM still loading, waiting...');
        document.addEventListener('DOMContentLoaded', () => this.collectAndSend());
      } else {
        console.log('[Roolify Debug V2] DOM ready, collecting immediately');
        this.collectAndSend();
      }
    },

    collectForms: function() {
      console.log('[Roolify Debug V2] Starting form collection...');
      const forms = [];
      const formElements = document.querySelectorAll('form');

      console.log(`[Roolify Debug V2] Found ${formElements.length} form elements`);

      formElements.forEach((form, formIndex) => {
        const formId = form.id || form.getAttribute('data-name') || `form-${formIndex}`;
        const formName = form.getAttribute('data-name') || form.name || formId;

        console.log(`[Roolify Debug V2] Processing form ${formIndex}: ${formName} (${formId})`);

        const fields = [];

        // Get all form elements with IDs
        const allElements = form.querySelectorAll('[id]');
        console.log(`[Roolify Debug V2] Found ${allElements.length} elements with IDs in form ${formName}`);
        
        allElements.forEach((element) => {
          const id = element.id;
          const tagName = element.tagName.toLowerCase();
          
          console.log(`[Roolify Debug V2] Processing element: ${tagName}#${id}`);
          
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
            console.log(`[Roolify Debug V2] Select element ${id} has options:`, field.options);
          } else if (tagName === 'input') {
            const inputType = element.type || 'text';
            field.type = inputType;
            
            if (inputType === 'radio' || inputType === 'checkbox') {
              field.value = element.value;
              field.options = this.getRadioCheckboxOptions(form, element.name);
              console.log(`[Roolify Debug V2] ${inputType} element ${id} has options:`, field.options);
            }
          } else if (tagName === 'div') {
            // Include divs for show/hide logic
            field.type = 'div';
            field.tagName = 'div';
            field.isFormField = false;
          }

          fields.push(field);
        });

        // Also check for elements outside the form that might be related
        const relatedElements = document.querySelectorAll(`[data-form="${formId}"], [data-form-id="${formId}"]`);
        console.log(`[Roolify Debug V2] Found ${relatedElements.length} related elements outside form`);

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

        console.log(`[Roolify Debug V2] Form ${formName} has ${fields.length} fields`);
      });

      // Also check for standalone select elements that might not be in forms
      const standaloneSelects = document.querySelectorAll('select[id]');
      console.log(`[Roolify Debug V2] Found ${standaloneSelects.length} standalone select elements`);
      
      if (standaloneSelects.length > 0) {
        const standaloneForm = {
          id: 'standalone-elements',
          formId: 'standalone-elements',
          name: 'Standalone Elements',
          formName: 'Standalone Elements',
          url: window.location.href,
          pageUrl: window.location.href,
          fields: [],
          createdAt: new Date().toISOString()
        };

        standaloneSelects.forEach((select, index) => {
          const field = {
            id: select.id,
            name: select.name || select.id,
            type: 'select',
            label: this.getFieldLabel(select),
            displayName: this.getFieldLabel(select) || select.id,
            elementId: select.id,
            required: select.hasAttribute('required'),
            placeholder: select.placeholder || '',
            formId: 'standalone-elements',
            fieldName: select.name || select.id,
            formName: 'Standalone Elements',
            pageUrl: window.location.href,
            options: this.getSelectOptions(select)
          };
          
          console.log(`[Roolify Debug V2] Standalone select ${select.id} has options:`, field.options);
          standaloneForm.fields.push(field);
        });

        if (standaloneForm.fields.length > 0) {
          forms.push(standaloneForm);
        }
      }

      console.log(`[Roolify Debug V2] Total forms collected: ${forms.length}`);
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
      
      console.log(`[Roolify Debug V2] Select element has ${optionElements.length} option elements`);
      
      optionElements.forEach((option, index) => {
        const text = option.textContent.trim();
        const value = option.value;
        console.log(`[Roolify Debug V2] Option ${index}: text="${text}", value="${value}"`);
        
        // Skip empty or placeholder options
        if (text && text !== 'Select one...' && text !== 'Choose...' && text !== 'Select...' && text !== '') {
          options.push(text);
          console.log(`[Roolify Debug V2] Added option: "${text}"`);
        } else {
          console.log(`[Roolify Debug V2] Skipped option: "${text}"`);
        }
      });
      
      console.log(`[Roolify Debug V2] Final options for select:`, options);
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
      console.log('[Roolify Debug V2] Starting collectAndSend...');
      const forms = this.collectForms();
      
      if (forms.length === 0) {
        console.log('[Roolify Debug V2] No forms found on this page');
        return;
      }

      console.log(`[Roolify Debug V2] Collected ${forms.length} forms with form data:`, forms);

      // Send to API
      if (this.config.apiUrl && this.config.siteId) {
        console.log('[Roolify Debug V2] Sending to API:', this.config.apiUrl);
        this.sendToAPI(forms);
      } else {
        console.warn('[Roolify Debug V2] apiUrl or siteId not configured:', this.config);
      }
    },

    sendToAPI: function(forms) {
      console.log('[Roolify Debug V2] Sending data to API...');
      
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
        console.log('[Roolify Debug V2] API response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('[Roolify Debug V2] API response data:', data);
        console.log('[Roolify Debug V2] Successfully sent form data!');
      })
      .catch(error => {
        console.error('[Roolify Debug V2] Error sending form data:', error);
      });
    }
  };

  // Auto-initialize if config is in window
  if (window.RoolifyConfig) {
    console.log('[Roolify Debug V2] Auto-initializing with window.RoolifyConfig');
    window.RoolifyFormCollector.init(window.RoolifyConfig);
  }

  console.log('[Roolify Debug V2] Script setup complete');
})();




