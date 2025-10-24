/**
 * Roolify Form Collector Script - TARGETED VERSION
 * 
 * This version specifically targets form elements by ID and extracts their options
 */

(function() {
  'use strict';

  console.log('[Roolify Targeted] Script loaded successfully');

  window.RoolifyFormCollector = {
    config: {
      apiUrl: '',
      siteId: ''
    },

    init: function(options) {
      console.log('[Roolify Targeted] Initializing with options:', options);
      this.config = Object.assign({}, this.config, options);
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        console.log('[Roolify Targeted] DOM still loading, waiting...');
        document.addEventListener('DOMContentLoaded', () => this.collectAndSend());
      } else {
        console.log('[Roolify Targeted] DOM ready, collecting immediately');
        this.collectAndSend();
      }
    },

    collectForms: function() {
      console.log('[Roolify Targeted] Starting targeted form collection...');
      const forms = [];

      // Look for all select elements with IDs first
      const selectElements = document.querySelectorAll('select[id]');
      console.log(`[Roolify Targeted] Found ${selectElements.length} select elements with IDs`);

      // Group selects by their parent form or create standalone forms
      const formGroups = new Map();

      selectElements.forEach((select) => {
        const selectId = select.id;
        const selectName = select.name || selectId;
        const formElement = select.closest('form');
        const formId = formElement ? (formElement.id || formElement.name || 'form-' + Date.now()) : 'standalone';
        
        console.log(`[Roolify Targeted] Processing select: ${selectId} in form: ${formId}`);

        if (!formGroups.has(formId)) {
          formGroups.set(formId, {
            id: formId,
            formId: formId,
            name: formElement ? (formElement.name || formElement.id || 'Form') : 'Standalone Elements',
            formName: formElement ? (formElement.name || formElement.id || 'Form') : 'Standalone Elements',
            url: window.location.href,
            pageUrl: window.location.href,
            fields: [],
            createdAt: new Date().toISOString()
          });
        }

        const form = formGroups.get(formId);
        const options = this.getSelectOptions(select);
        
        const field = {
          id: selectId,
          name: selectName,
          type: 'select',
          label: this.getFieldLabel(select),
          displayName: this.getFieldLabel(select) || selectId,
          elementId: selectId,
          required: select.hasAttribute('required'),
          placeholder: select.placeholder || '',
          formId: formId,
          fieldName: selectName,
          formName: form.name,
          pageUrl: window.location.href,
          options: options
        };

        console.log(`[Roolify Targeted] Select ${selectId} options:`, options);
        form.fields.push(field);
      });

      // Also look for other form elements with IDs (inputs, textareas, etc.)
      const otherElements = document.querySelectorAll('input[id], textarea[id]');
      console.log(`[Roolify Targeted] Found ${otherElements.length} other form elements with IDs`);

      otherElements.forEach((element) => {
        const elementId = element.id;
        const elementName = element.name || elementId;
        const formElement = element.closest('form');
        const formId = formElement ? (formElement.id || formElement.name || 'form-' + Date.now()) : 'standalone';
        
        console.log(`[Roolify Targeted] Processing element: ${elementId} in form: ${formId}`);

        if (!formGroups.has(formId)) {
          formGroups.set(formId, {
            id: formId,
            formId: formId,
            name: formElement ? (formElement.name || formElement.id || 'Form') : 'Standalone Elements',
            formName: formElement ? (formElement.name || formElement.id || 'Form') : 'Standalone Elements',
            url: window.location.href,
            pageUrl: window.location.href,
            fields: [],
            createdAt: new Date().toISOString()
          });
        }

        const form = formGroups.get(formId);
        const tagName = element.tagName.toLowerCase();
        const inputType = element.type || 'text';
        
        const field = {
          id: elementId,
          name: elementName,
          type: tagName === 'input' ? inputType : tagName,
          label: this.getFieldLabel(element),
          displayName: this.getFieldLabel(element) || elementId,
          elementId: elementId,
          required: element.hasAttribute('required'),
          placeholder: element.placeholder || '',
          formId: formId,
          fieldName: elementName,
          formName: form.name,
          pageUrl: window.location.href
        };

        // Add options for radio/checkbox inputs
        if (inputType === 'radio' || inputType === 'checkbox') {
          field.options = this.getRadioCheckboxOptions(element);
          console.log(`[Roolify Targeted] ${inputType} ${elementId} options:`, field.options);
        }

        form.fields.push(field);
      });

      // Convert map to array
      forms.push(...formGroups.values());

      console.log(`[Roolify Targeted] Total forms collected: ${forms.length}`);
      forms.forEach(form => {
        console.log(`[Roolify Targeted] Form "${form.name}" has ${form.fields.length} fields`);
        form.fields.forEach(field => {
          if (field.options && field.options.length > 0) {
            console.log(`[Roolify Targeted] Field "${field.name}" has options:`, field.options);
          }
        });
      });

      return forms;
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
      
      console.log(`[Roolify Targeted] Select element has ${optionElements.length} option elements`);
      
      optionElements.forEach((option, index) => {
        const text = option.textContent.trim();
        const value = option.value;
        console.log(`[Roolify Targeted] Option ${index}: text="${text}", value="${value}"`);
        
        // Skip empty or placeholder options
        if (text && text !== 'Select one...' && text !== 'Choose...' && text !== 'Select...' && text !== '') {
          options.push(text);
          console.log(`[Roolify Targeted] Added option: "${text}"`);
        } else {
          console.log(`[Roolify Targeted] Skipped option: "${text}"`);
        }
      });
      
      console.log(`[Roolify Targeted] Final options for select:`, options);
      return options;
    },

    getRadioCheckboxOptions: function(element) {
      const options = [];
      const name = element.name;
      if (name) {
        const inputs = document.querySelectorAll(`input[name="${name}"]`);
        inputs.forEach((input) => {
          if (input.value) {
            options.push(input.value);
          }
        });
      }
      return options.length > 0 ? options : undefined;
    },

    collectAndSend: function() {
      console.log('[Roolify Targeted] Starting collectAndSend...');
      const forms = this.collectForms();
      
      if (forms.length === 0) {
        console.log('[Roolify Targeted] No forms found on this page');
        return;
      }

      console.log(`[Roolify Targeted] Collected ${forms.length} forms with form data:`, forms);

      // Send to API
      if (this.config.apiUrl && this.config.siteId) {
        console.log('[Roolify Targeted] Sending to API:', this.config.apiUrl);
        this.sendToAPI(forms);
      } else {
        console.warn('[Roolify Targeted] apiUrl or siteId not configured:', this.config);
      }
    },

    sendToAPI: function(forms) {
      console.log('[Roolify Targeted] Sending data to API...');
      
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
        console.log('[Roolify Targeted] API response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('[Roolify Targeted] API response data:', data);
        console.log('[Roolify Targeted] Successfully sent form data!');
      })
      .catch(error => {
        console.error('[Roolify Targeted] Error sending form data:', error);
      });
    }
  };

  // Auto-initialize if config is in window
  if (window.RoolifyConfig) {
    console.log('[Roolify Targeted] Auto-initializing with window.RoolifyConfig');
    window.RoolifyFormCollector.init(window.RoolifyConfig);
  }

  console.log('[Roolify Targeted] Script setup complete');
})();



