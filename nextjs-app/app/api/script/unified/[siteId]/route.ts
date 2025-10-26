import { NextRequest, NextResponse } from 'next/server';
import { getTokenForSite } from '@/lib/webflowStore';

/**
 * Unified Roolify Script - Handles BOTH conditional logic AND form submissions
 * 
 * GET /api/script/unified/[siteId]
 * 
 * Returns a single JavaScript file that:
 * 1. Executes conditional logic rules on forms
 * 2. Captures form submissions and sends to webhook
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { siteId } = params;
    // Use environment variable with production fallback
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://roolify.netlify.app';
    // If running locally, use localhost
    if (request.nextUrl.origin.includes('localhost') || request.nextUrl.origin.includes('127.0.0.1')) {
      appUrl = request.nextUrl.origin;
    }
    console.log(`[Unified Script] Using API URL: ${appUrl}`);
    console.log(`[Unified Script] Serving script for site: ${siteId}`);

    // Fetch rules for this specific site from Xano
    const cacheBuster = Date.now();
    const rulesResponse = await fetch(`${appUrl}/api/form-rules?siteId=${siteId}&activeOnly=true&_cache_bust=${cacheBuster}`);
    let rules = [];
    
    if (rulesResponse.ok) {
      const rulesData = await rulesResponse.json();
      rules = rulesData.rules || [];
      console.log(`[Unified Script] Found ${rules.length} active rules for site ${siteId} from Xano`);
      console.log(`[Unified Script] Rules data:`, JSON.stringify(rules, null, 2));
    } else {
      console.error(`[Unified Script] Failed to fetch rules from Xano for site ${siteId}`);
    }
    
    // If no rules found with siteId filtering, try without siteId filtering as fallback
    if (rules.length === 0) {
      console.log(`[Unified Script] No rules found with siteId filtering, trying without siteId...`);
      const fallbackResponse = await fetch(`${appUrl}/api/form-rules?activeOnly=true&_cache_bust=${cacheBuster}`);
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        rules = fallbackData.rules || [];
        console.log(`[Unified Script] Found ${rules.length} rules without siteId filtering`);
      }
    }

    // Generate the unified script
    const script = `
/**
 * ═══════════════════════════════════════════════════════════════════════
 * ROOLIFY UNIFIED SCRIPT
 * 
 * This script provides TWO features:
 * 1. Conditional Logic - Show/hide form fields based on rules
 * 2. Form Submission Capture - Automatically save submissions to Roolify
 * 
 * Site ID: ${siteId}
 * Generated: ${new Date().toISOString()}
 * Rules: ${rules.length} active
 * ═══════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  const SITE_ID = '${siteId}';
  const API_URL = '${appUrl}/api/submissions/webhook';
  
  console.log('[Roolify] Script configuration:');
  console.log('[Roolify] Site ID:', SITE_ID);
  console.log('[Roolify] API URL:', API_URL);
  console.log('[Roolify] Current page:', window.location.href);
  
  // ═══════════════════════════════════════════════════════════════════════
  // PART 1: CONDITIONAL LOGIC
  // ═══════════════════════════════════════════════════════════════════════
  
  const CONFIG = ${JSON.stringify({ rules }, null, 2)};
  
  console.log('[Roolify] Unified script loaded');
  console.log('[Roolify] Site ID:', SITE_ID);
  console.log('[Roolify] Rules loaded:', CONFIG.rules.length);

  /**
   * Find a field by its ID (supports multiple ID formats)
   */
  function findField(fieldId) {
    // Try exact match first
    let field = document.getElementById(fieldId);
    if (field) return field;

    // Try with common prefixes removed
    const cleanId = fieldId.replace(/^(wf-form-|field-)/, '');
    field = document.getElementById(cleanId);
    if (field) return field;

    // Try by name attribute
    field = document.querySelector(\`[name="\${fieldId}"]\`);
    if (field) return field;

    // Try by data-name attribute
    field = document.querySelector(\`[data-name="\${fieldId}"]\`);
    if (field) return field;

    // Try case-insensitive matching
    const allInputs = document.querySelectorAll('input, select, textarea');
    for (let input of allInputs) {
      if (input.id && input.id.toLowerCase() === fieldId.toLowerCase()) {
        return input;
      }
      if (input.name && input.name.toLowerCase() === fieldId.toLowerCase()) {
        return input;
      }
      if (input.getAttribute('data-name') && input.getAttribute('data-name').toLowerCase() === fieldId.toLowerCase()) {
        return input;
      }
    }

    // Try partial matching (remove numeric suffixes)
    const baseId = fieldId.replace(/\\d+$/, '');
    if (baseId !== fieldId) {
      field = document.getElementById(baseId);
      if (field) return field;
      
      // Try partial matching in name attributes
      for (let input of allInputs) {
        if (input.name && input.name.replace(/\\d+$/, '') === baseId) {
          return input;
        }
      }
    }

    // Try matching by label text (find label, then get associated input)
    const labels = document.querySelectorAll('label');
    for (let label of labels) {
      if (label.textContent && label.textContent.toLowerCase().includes(fieldId.toLowerCase())) {
        const associatedInput = document.getElementById(label.getAttribute('for'));
        if (associatedInput) return associatedInput;
      }
    }

    // Try matching by placeholder text
    for (let input of allInputs) {
      if (input.placeholder && input.placeholder.toLowerCase().includes(fieldId.toLowerCase())) {
        return input;
      }
    }

    // Try fuzzy matching (fieldId is contained in element ID/name)
    for (let input of allInputs) {
      if (input.id && input.id.toLowerCase().includes(fieldId.toLowerCase())) {
        return input;
      }
      if (input.name && input.name.toLowerCase().includes(fieldId.toLowerCase())) {
        return input;
      }
    }

    // Field not found - return null silently (rules are now filtered before execution)
    return null;
  }
  
  /**
   * Normalize names for comparison
   */
  function normalizeName(name) {
    return name.toLowerCase()
      .replace(/\\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }
  
  /**
   * Check if two names are semantically similar
   */
  function isSemanticallySimilar(name1, name2) {
    const words1 = name1.toLowerCase().split(/[\\s-]+/);
    const words2 = name2.toLowerCase().split(/[\\s-]+/);
    
    const commonWords = words1.filter(word => 
      words2.some(word2 => word === word2 || word.includes(word2) || word2.includes(word))
    );
    
    const similarity = commonWords.length / Math.min(words1.length, words2.length);
    return similarity >= 0.5;
  }

  /**
   * Execute a single rule
   */
  function executeRule(rule) {
    console.log('[Roolify] Executing rule:', rule.name);

    try {
      const useAndLogic = rule.logicType === 'AND' || !rule.logicType;
      console.log('[Roolify] Rule logic type:', rule.logicType || 'AND (default)');

      const conditionsByField = {};
      for (const condition of rule.conditions) {
        const fieldId = condition.fieldId;
        if (!conditionsByField[fieldId]) {
          conditionsByField[fieldId] = [];
        }
        conditionsByField[fieldId].push(condition);
      }

      let conditionsMet = false;

      if (useAndLogic) {
        // AND logic: ALL conditions must be true
        conditionsMet = true;

        for (const [fieldId, conditions] of Object.entries(conditionsByField)) {
          const field = findField(fieldId);

          if (!field) {
            console.warn('[Roolify] Field not found:', fieldId);
            conditionsMet = false;
            break;
          }

          let fieldValue = '';
          if (field.type === 'checkbox') {
            fieldValue = field.checked ? 'true' : 'false';
          } else if (field.type === 'radio') {
            // For radio buttons, use the value of the checked option, not just true/false
            if (field.checked) {
              fieldValue = field.value;
            } else {
              // Find the checked radio button in the same group
              const radioGroup = document.querySelectorAll('input[type="radio"][name="' + field.name + '"]');
              const checkedRadio = Array.from(radioGroup).find(radio => radio.checked);
              fieldValue = checkedRadio ? checkedRadio.value : '';
            }
          } else if (field.tagName === 'SELECT') {
            fieldValue = field.value;
          } else {
            fieldValue = field.value || field.textContent || '';
          }

          let anyConditionMet = false;

          for (const condition of conditions) {
            let conditionMet = false;
            const normalizedOperator = condition.operator.toLowerCase().replace(/\\s+/g, '_');

            switch (normalizedOperator) {
              case 'equals':
              case 'is':
              case 'is_equal_to':
              case '==':
              case '===':
                conditionMet = fieldValue === condition.value;
                break;
              case 'not_equals':
              case 'is_not':
              case 'is_not_equal_to':
              case '!=':
              case '!==':
                conditionMet = fieldValue !== condition.value;
                break;
              case 'contains':
                conditionMet = fieldValue.includes(condition.value);
                break;
              case 'not_contains':
                conditionMet = !fieldValue.includes(condition.value);
                break;
              default:
                console.warn('[Roolify] Unknown operator:', condition.operator);
                conditionMet = false;
            }

            if (conditionMet) {
              anyConditionMet = true;
              break;
            }
          }

          if (!anyConditionMet) {
            conditionsMet = false;
            break;
          }
        }
      } else {
        // OR logic: ANY condition can be true
        conditionsMet = false;

        for (const [fieldId, conditions] of Object.entries(conditionsByField)) {
          const field = findField(fieldId);

          if (!field) {
            continue;
          }

          let fieldValue = '';
          if (field.type === 'checkbox') {
            fieldValue = field.checked ? 'true' : 'false';
          } else if (field.type === 'radio') {
            // For radio buttons, use the value of the checked option, not just true/false
            if (field.checked) {
              fieldValue = field.value;
            } else {
              // Find the checked radio button in the same group
              const radioGroup = document.querySelectorAll('input[type="radio"][name="' + field.name + '"]');
              const checkedRadio = Array.from(radioGroup).find(radio => radio.checked);
              fieldValue = checkedRadio ? checkedRadio.value : '';
            }
          } else if (field.tagName === 'SELECT') {
            fieldValue = field.value;
          } else {
            fieldValue = field.value || field.textContent || '';
          }

          for (const condition of conditions) {
            let conditionMet = false;
            const normalizedOperator = condition.operator.toLowerCase().replace(/\\s+/g, '_');

            switch (normalizedOperator) {
              case 'equals':
              case 'is':
              case 'is_equal_to':
              case '==':
              case '===':
                conditionMet = fieldValue === condition.value;
                break;
              case 'not_equals':
              case 'is_not':
              case 'is_not_equal_to':
              case '!=':
              case '!==':
                conditionMet = fieldValue !== condition.value;
                break;
              case 'contains':
                conditionMet = fieldValue.includes(condition.value);
                break;
              case 'not_contains':
                conditionMet = !fieldValue.includes(condition.value);
                break;
              default:
                console.warn('[Roolify] Unknown operator:', condition.operator);
                conditionMet = false;
            }

            if (conditionMet) {
              conditionsMet = true;
              break;
            }
          }

          if (conditionsMet) {
            break;
          }
        }
      }

      // Execute actions based on whether conditions are met
      for (const action of rule.actions) {
        const targetField = findField(action.targetFieldId);
        
        if (!targetField) {
          console.warn('[Roolify] Action target not found:', action.targetFieldId);
          continue;
        }

        const shouldApply = conditionsMet;

        switch (action.type) {
          case 'show':
            targetField.style.display = shouldApply ? '' : 'none';
            const showParent = targetField.closest('.w-input, .w-select, .w-checkbox, .w-radio');
            if (showParent) {
              showParent.style.display = shouldApply ? '' : 'none';
            }
            // Also hide/show the label
            const showLabel = document.querySelector(\`label[for="\${action.targetFieldId}"]\`) || 
                             targetField.previousElementSibling?.tagName === 'LABEL' ? targetField.previousElementSibling : null ||
                             targetField.closest('.w-checkbox, .w-radio')?.querySelector('label');
            if (showLabel) {
              showLabel.style.display = shouldApply ? '' : 'none';
            }
            // Handle required attribute for hidden fields
            if (!shouldApply && targetField.hasAttribute('required')) {
              // Field is being hidden - store original required state and remove attribute
              targetField.setAttribute('data-roolify-was-required', 'true');
              targetField.removeAttribute('required');
            } else if (shouldApply && targetField.getAttribute('data-roolify-was-required') === 'true') {
              // Field is being shown - restore required attribute
              targetField.setAttribute('required', '');
              targetField.removeAttribute('data-roolify-was-required');
            }
            break;

          case 'hide':
            targetField.style.display = shouldApply ? 'none' : '';
            const hideParent = targetField.closest('.w-input, .w-select, .w-checkbox, .w-radio');
            if (hideParent) {
              hideParent.style.display = shouldApply ? 'none' : '';
            }
            // Also hide/show the label
            const hideLabel = document.querySelector(\`label[for="\${action.targetFieldId}"]\`) || 
                             targetField.previousElementSibling?.tagName === 'LABEL' ? targetField.previousElementSibling : null ||
                             targetField.closest('.w-checkbox, .w-radio')?.querySelector('label');
            if (hideLabel) {
              hideLabel.style.display = shouldApply ? 'none' : '';
            }
            // Handle required attribute for hidden fields
            if (shouldApply && targetField.hasAttribute('required')) {
              // Field is being hidden - store original required state and remove attribute
              targetField.setAttribute('data-roolify-was-required', 'true');
              targetField.removeAttribute('required');
            } else if (!shouldApply && targetField.getAttribute('data-roolify-was-required') === 'true') {
              // Field is being shown - restore required attribute
              targetField.setAttribute('required', '');
              targetField.removeAttribute('data-roolify-was-required');
            }
            break;

          case 'enable':
            targetField.disabled = !shouldApply;
            break;

          case 'disable':
            targetField.disabled = shouldApply;
            break;

          case 'require':
            targetField.required = shouldApply;
            break;

          case 'make_optional':
            targetField.required = !shouldApply;
            break;
        }
      }

    } catch (error) {
      console.error('[Roolify] Error executing rule:', rule.name, error);
    }
  }

  /**
   * Execute all rules
   */
  function executeAllRules() {
    for (const rule of CONFIG.rules) {
      if (rule.isActive !== false) {
        executeRule(rule);
      }
    }
  }

  /**
   * Initialize conditional logic
   */
  function initConditionalLogic() {
    if (CONFIG.rules.length === 0) {
      console.log('[Roolify] No active rules found');
      return;
    }

    // DEBUG: Show what forms are on the page
    const formsOnPage = document.querySelectorAll('form');
    console.log('[Roolify] 🔍 DEBUG: Found ' + formsOnPage.length + ' forms on this page');
    formsOnPage.forEach((form, index) => {
      const formId = form.id || form.getAttribute('data-name') || form.name || 'no-id';
      console.log('[Roolify] 🔍 DEBUG: Form ' + (index + 1) + ':', formId);
    });

    // Filter rules to only include those that can be applied on this page
    const applicableRules = CONFIG.rules.filter(rule => {
      if (rule.isActive === false) return false;
      
      // Check if all condition fields exist on this page
      const allConditionFieldsExist = rule.conditions.every(cond => {
        const field = findField(cond.fieldId);
        return field !== null;
      });
      
      // Check if all action target fields exist on this page
      const allActionTargetsExist = rule.actions.every(action => {
        const field = findField(action.targetFieldId);
        return field !== null;
      });
      
      return allConditionFieldsExist && allActionTargetsExist;
    });

    console.log('[Roolify] 🔍 DEBUG: Filtered rules for this page:');
    console.log('[Roolify] 🔍 DEBUG: Total rules:', CONFIG.rules.length);
    console.log('[Roolify] 🔍 DEBUG: Applicable rules:', applicableRules.length);
    console.log('[Roolify] 🔍 DEBUG: Skipped rules:', CONFIG.rules.length - applicableRules.length);

    // Show which rules were skipped and why
    const skippedRules = CONFIG.rules.filter(rule => {
      if (rule.isActive === false) return false;
      
      const allConditionFieldsExist = rule.conditions.every(cond => {
        const field = findField(cond.fieldId);
        return field !== null;
      });
      
      const allActionTargetsExist = rule.actions.every(action => {
        const field = findField(action.targetFieldId);
        return field !== null;
      });
      
      return !(allConditionFieldsExist && allActionTargetsExist);
    });

    if (skippedRules.length > 0) {
      console.log('[Roolify] 🔍 DEBUG: Skipped rules (fields not found on this page):');
      skippedRules.forEach(rule => {
        console.log('[Roolify] 🔍 DEBUG: Skipped rule: "' + rule.name + '"');
        rule.conditions.forEach(cond => {
          const found = findField(cond.fieldId);
          if (!found) {
            console.log('[Roolify] 🔍 DEBUG:   - Missing condition field: ' + cond.fieldId);
          }
        });
        rule.actions.forEach(action => {
          const found = findField(action.targetFieldId);
          if (!found) {
            console.log('[Roolify] 🔍 DEBUG:   - Missing action target: ' + action.targetFieldId);
          }
        });
      });
    }

    // Update CONFIG to only include applicable rules
    CONFIG.rules = applicableRules;

    // Execute only applicable rules
    executeAllRules();

    // Debounce function to prevent excessive rule execution
    let debounceTimer;
    function debounce(func, wait) {
      return function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(func, wait);
      };
    }

    // Set up event listeners for all form inputs
    // 'change' event for instant feedback on selects, checkboxes, radios
    document.addEventListener('change', function(e) {
      if (e.target.matches('input, select, textarea')) {
        executeAllRules();
      }
    });

    // 'input' event with debouncing for text inputs to reduce lag
    const debouncedExecuteRules = debounce(executeAllRules, 150);
    document.addEventListener('input', function(e) {
      if (e.target.matches('input[type="text"], input[type="email"], input[type="number"], textarea')) {
        debouncedExecuteRules();
      }
    });

    console.log('[Roolify] Conditional logic initialized');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PART 2: FORM SUBMISSION CAPTURE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Check if an element is visible
   */
  function isElementVisible(element) {
    if (!element) return false;
    
    // Check if element or any parent has display: none
    let el = element;
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }
      el = el.parentElement;
    }
    return true;
  }

  /**
   * Extract form data - ONLY visible fields with values
   */
  function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    const fieldsToExclude = ['cf-turnstile-response', 'g-recaptcha-response']; // System fields

    for (let [key, value] of formData.entries()) {
      // Skip system fields
      if (fieldsToExclude.includes(key)) {
        console.log('[Roolify] Skipping system field:', key);
        continue;
      }

      const inputElement = form.querySelector(\`[name="\${key}"], [data-name="\${key}"]\`);
      
      // Skip if element is not visible
      if (!isElementVisible(inputElement)) {
        console.log('[Roolify] Skipping hidden field:', key);
        continue;
      }

      // Skip if value is empty (unless it's a checkbox/radio)
      const inputType = inputElement?.type;
      if (!value && inputType !== 'checkbox' && inputType !== 'radio') {
        console.log('[Roolify] Skipping empty field:', key);
        continue;
      }

      const fieldName = inputElement?.getAttribute('data-name') || key;

      // Handle checkbox/radio - only include if checked
      if (inputType === 'checkbox' || inputType === 'radio') {
        if (inputElement.checked) {
          data[fieldName] = value || 'true';
          console.log('[Roolify] Including checked field:', fieldName, '=', value || 'true');
        }
      } else {
        // Regular fields - add to data
        if (data[fieldName]) {
          if (Array.isArray(data[fieldName])) {
            data[fieldName].push(value);
          } else {
            data[fieldName] = [data[fieldName], value];
          }
        } else {
          data[fieldName] = value;
        }
        console.log('[Roolify] Including field:', fieldName, '=', value);
      }
    }

    console.log('[Roolify] Final submission data:', data);
    return data;
  }

  /**
   * Send submission to Roolify
   */
  function sendSubmission(data) {
    console.log('[Roolify] Sending submission:', data);
    console.log('[Roolify] API URL:', API_URL);

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => {
      console.log('[Roolify] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      return response.json();
    })
    .then(result => {
      console.log('[Roolify] ✅ Submission saved successfully:', result);
    })
    .catch(error => {
      console.error('[Roolify] ❌ Failed to save submission:', error);
      console.error('[Roolify] Error details:', {
        message: error.message,
        apiUrl: API_URL,
        currentUrl: window.location.href
      });
    });
  }

  /**
   * Handle form submission
   */
  function handleFormSubmit(event) {
    const form = event.target;
    const formData = getFormData(form);
    
    // Add metadata for backend processing (not visible in submission data)
    const payload = {
      ...formData,
      formId: form.id || form.getAttribute('data-name') || form.name || 'unknown_form',
      formName: form.getAttribute('data-name') || form.name || form.id || 'unknown_form',
      siteId: SITE_ID,
      pageUrl: window.location.href,
      pageTitle: document.title,
    };
    
    console.log('[Roolify] Form submitted:', payload.formName);
    sendSubmission(payload);
  }

  /**
   * Initialize form submission capture
   */
  function initFormCapture() {
    const forms = document.querySelectorAll('form');
    console.log(\`[Roolify] Found \${forms.length} forms to monitor\`);

    forms.forEach(form => {
      form.addEventListener('submit', handleFormSubmit);
      console.log(\`[Roolify] Monitoring form: \${form.id || form.getAttribute('data-name') || 'unnamed'}\`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initConditionalLogic();
      initFormCapture();
    });
  } else {
    initConditionalLogic();
    initFormCapture();
  }

  console.log('[Roolify] ✓ Unified script initialized successfully');
})();
`;

    return new NextResponse(script, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('[Unified Script] Error generating script:', error);
    
    // Return error script
    const errorScript = `
console.error('[Roolify] Failed to load unified script:', '${String(error)}');
`;
    
    return new NextResponse(errorScript, {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
      },
    });
  }
}

