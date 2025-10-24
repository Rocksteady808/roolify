import { NextResponse } from 'next/server';
import { xanoRules } from '../../../../../lib/xano';

export async function GET(
  request: Request,
  { params }: { params: { siteId: string } }
) {
  try {
    const { siteId } = params;
    
    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    console.log(`[Script Serve] Serving universal script for site ${siteId}`);

    // Get all rules from Xano
    const allRules = await xanoRules.getAll();

    console.log(`[Script Serve] Retrieved ${allRules.length} total rules from Xano`);

    // Parse and filter rules for this site
    const parsedRules = allRules.map(rule => {
      try {
        // Parse the rule_data JSON string
        let ruleData;
        if (typeof rule.rule_data === 'string') {
          // Handle double-encoded JSON (JSON string that contains another JSON string)
          const parsed = JSON.parse(rule.rule_data);
          if (typeof parsed === 'string') {
            ruleData = JSON.parse(parsed);
          } else {
            ruleData = parsed;
          }
        } else {
          ruleData = rule.rule_data;
        }

        return {
          id: String(rule.id),
          name: rule.rule_name,
          formId: ruleData.formId || String(rule.form_id),
          siteId: ruleData.siteId || '',
          conditions: ruleData.conditions || [],
          actions: ruleData.actions || [],
          isActive: ruleData.isActive !== false, // Default to true
          logicType: ruleData.logicType || 'AND'
        };
      } catch (e) {
        console.error(`[Script Serve] Error parsing rule ${rule.id}:`, e);
        return null;
      }
    }).filter((rule): rule is NonNullable<typeof rule> => rule !== null); // Remove nulls from parse errors

    // Filter for this site and active rules only
    const activeRules = parsedRules.filter(rule =>
      rule.siteId === siteId && rule.isActive
    );

    console.log(`[Script Serve] Found ${activeRules.length} active rules for site ${siteId}`);

    // Generate the universal script
    const script = generateUniversalScript(activeRules, siteId);
    
    // Return the script as JavaScript with CSP-friendly headers
    return new NextResponse(script, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN'
      }
    });

  } catch (error) {
    console.error('[Script Serve] Error:', error);
    return NextResponse.json(
      { error: `Script serving failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function generateUniversalScript(rules: any[], siteId: string): string {
  // Self-contained script - no external API calls needed
  
  const script = `
(function() {
  'use strict';
  
  console.log('[Roolify Universal Script] Loading for site ${siteId}...');
  
  // Error handling wrapper
  try {
    // Add CSS for Roolify-controlled elements
  const style = document.createElement('style');
  style.textContent = \`
    .roolify-controlled {
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .roolify-hidden {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    }
    .roolify-visible {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    /* Ensure smooth transitions for show/hide */
    .roolify-controlled[style*="display: none"] {
      display: none !important;
    }
  \`;
  document.head.appendChild(style);
  
  // Configuration - self-contained, no external API calls
  const CONFIG = {
    siteId: '${siteId}',
    rules: ${JSON.stringify(rules, null, 2)},
    version: '${Date.now()}'
  };
  
  // Utility functions
  function getElementById(id) {
    return document.getElementById(id);
  }
  
  function getElementByName(name) {
    return document.querySelector(\`[name="\${name}"]\`);
  }
  
  function getElementBySelector(selector) {
    return document.querySelector(selector);
  }
  
  // Flexible field finder - tries multiple strategies to find form elements
  function findField(fieldId) {
    if (!fieldId) return null;

    // Try exact ID match
    let field = getElementById(fieldId);
    if (field) return field;

    // Try exact name match
    field = getElementByName(fieldId);
    if (field) return field;

    // Try data-name attribute (common in custom form builders)
    field = document.querySelector(\`[data-name="\${fieldId}"]\`);
    if (field) return field;

    // Try with spaces converted to hyphens
    const withHyphens = fieldId.replace(/\\s+/g, '-');
    field = getElementById(withHyphens) || getElementByName(withHyphens);
    if (field) return field;

    // Try with hyphens converted to spaces
    const withSpaces = fieldId.replace(/-/g, ' ');
    field = getElementById(withSpaces) || getElementByName(withSpaces);
    if (field) return field;

    // Try with spaces converted to underscores
    const withUnderscores = fieldId.replace(/\\s+/g, '_');
    field = getElementById(withUnderscores) || getElementByName(withUnderscores);
    if (field) return field;

    // Try normalized (lowercase, no special chars)
    const normalized = fieldId.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Try case-insensitive and normalized search
    const allElements = document.querySelectorAll('input, select, textarea, button[type="submit"]');
    for (const el of allElements) {
      // Exact case-insensitive match
      if (el.id && el.id.toLowerCase() === fieldId.toLowerCase()) return el;
      if (el.name && el.name.toLowerCase() === fieldId.toLowerCase()) return el;

      // Normalized match
      if (el.id && el.id.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) return el;
      if (el.name && el.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) return el;

      // Check data-name attribute
      if (el.getAttribute('data-name') &&
          el.getAttribute('data-name').toLowerCase() === fieldId.toLowerCase()) return el;
    }

    // Try finding wrapper div or label (for custom form builders)
    const wrapper = document.querySelector(\`[data-field-id="\${fieldId}"]\`) ||
                   document.querySelector(\`[data-field="\${fieldId}"]\`) ||
                   document.querySelector(\`.field-\${fieldId}\`);
    if (wrapper) {
      // Find input inside wrapper
      const input = wrapper.querySelector('input, select, textarea');
      if (input) return input;
    }

    return null;
  }
  
  function showElement(element) {
    if (!element) return;

    // Show the element itself
    element.style.display = '';
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    element.classList.remove('roolify-hidden');
    element.classList.add('roolify-visible');

    // Find the containing form element (our boundary)
    const formElement = element.closest('form');
    if (!formElement) {
      // No form found - don't show any parents (safety)
      return;
    }

    // Walk up the DOM tree, showing parent divs/labels until we hit the form
    let parent = element.parentElement;
    let levelsShown = 0;
    const MAX_LEVELS = 3; // Safety limit

    while (parent &&
           parent !== formElement &&
           parent !== document.body &&
           levelsShown < MAX_LEVELS) {

      // Only process DIV and LABEL elements (common wrappers)
      if (parent.tagName === 'DIV' || parent.tagName === 'LABEL') {
        // Show this parent wrapper
        parent.style.display = '';
        parent.style.visibility = 'visible';
        parent.style.opacity = '1';
        parent.classList.remove('roolify-hidden');
        parent.classList.add('roolify-visible');
        levelsShown++;
      } else {
        // Not a DIV or LABEL - stop here
        break;
      }

      parent = parent.parentElement;
    }
  }

  function hideElement(element) {
    if (!element) return;

    // Hide the element itself
    element.style.display = 'none';
    element.style.visibility = 'hidden';
    element.style.opacity = '0';
    element.classList.remove('roolify-visible');
    element.classList.add('roolify-hidden');

    // Find the containing form element (our boundary)
    const formElement = element.closest('form');
    if (!formElement) {
      // No form found - don't hide any parents (safety)
      return;
    }

    // Walk up the DOM tree, hiding parent divs/labels until we hit the form
    let parent = element.parentElement;
    let levelsHidden = 0;
    const MAX_LEVELS = 3; // Safety limit

    while (parent &&
           parent !== formElement &&
           parent !== document.body &&
           levelsHidden < MAX_LEVELS) {

      // Only process DIV and LABEL elements (common wrappers)
      if (parent.tagName === 'DIV' || parent.tagName === 'LABEL') {

        // Check if this div only wraps this one field
        // (not a container for multiple fields)
        const visibleFields = parent.querySelectorAll(
          'input:not(.roolify-hidden), select:not(.roolify-hidden), textarea:not(.roolify-hidden)'
        );

        if (visibleFields.length <= 1) {
          // This div only contains our field - safe to hide
          parent.style.display = 'none';
          parent.style.visibility = 'hidden';
          parent.style.opacity = '0';
          parent.classList.remove('roolify-visible');
          parent.classList.add('roolify-hidden');
          levelsHidden++;
        } else {
          // This div contains other fields - stop here
          break;
        }
      } else {
        // Not a DIV or LABEL - stop here
        break;
      }

      parent = parent.parentElement;
    }
  }
  
  function isElementVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }
  
  // Rule execution engine
  function executeRule(rule) {
    console.log('[Roolify] Executing rule:', rule.name);
    
    try {
      // Group conditions by field ID for smart OR/AND logic
      const conditionsByField = {};
      for (const condition of rule.conditions) {
        const fieldId = condition.fieldId;
        if (!conditionsByField[fieldId]) {
          conditionsByField[fieldId] = [];
        }
        conditionsByField[fieldId].push(condition);
      }
      
      // Check conditions with smart logic:
      // - Multiple conditions on SAME field = OR logic (any can match)
      // - Conditions on DIFFERENT fields = AND logic (all must match)
      let conditionsMet = true;
      
      for (const [fieldId, conditions] of Object.entries(conditionsByField)) {
        const field = findField(fieldId);
        
        if (!field) {
          console.warn('[Roolify] Field not found:', fieldId);
          conditionsMet = false;
          break;
        }
        
        let fieldValue = '';

        // Handle different input types
        if (field.type === 'checkbox') {
          // Checkbox: return 'checked'/'unchecked' or 'true'/'false' or actual value if checked
          if (field.checked) {
            // Return the actual value if it exists, otherwise 'true' or 'checked'
            fieldValue = field.value && field.value !== 'on' ? field.value : 'true';
          } else {
            fieldValue = 'false';
          }
        } else if (field.type === 'radio') {
          // Radio buttons: get the value of the checked radio in the group
          if (field.name) {
            const checkedRadio = document.querySelector(\`input[name="\${field.name}"]:checked\`);
            fieldValue = checkedRadio ? checkedRadio.value : '';
          } else {
            fieldValue = field.checked ? field.value : '';
          }
        } else if (field.tagName === 'SELECT') {
          // Select dropdown: get selected option's value
          if (field.multiple) {
            // Multiple select: get all selected values as comma-separated
            const selectedOptions = Array.from(field.selectedOptions).map(opt => opt.value);
            fieldValue = selectedOptions.join(',');
          } else {
            fieldValue = field.value;
          }
        } else if (field.type === 'file') {
          // File input: check if file is selected
          fieldValue = field.files && field.files.length > 0 ? 'file-selected' : '';
        } else if (field.type === 'number' || field.type === 'range') {
          // Number/Range inputs: ensure we get numeric value
          fieldValue = field.value || '0';
        } else {
          // Text, email, tel, url, password, textarea, etc.
          fieldValue = field.value || field.textContent || '';
        }
        
        // For this field, check if ANY condition matches (OR logic)
        let anyConditionMet = false;
        
        for (const condition of conditions) {
          console.log('[Roolify] Condition check:', {
            fieldId: condition.fieldId,
            operator: condition.operator,
            expectedValue: condition.value,
            actualValue: fieldValue
          });
          
          let conditionMet = false;
          
          // Normalize operator to handle various formats
          const normalizedOperator = condition.operator.toLowerCase().replace(/\s+/g, '_');
          
          switch (normalizedOperator) {
            case 'equals':
            case 'is':
            case 'is_equal_to':
            case '==':
            case '===':
              // Case-insensitive comparison with whitespace trimming
              conditionMet = String(fieldValue).toLowerCase().trim() === String(condition.value).toLowerCase().trim();
              break;
            case 'not_equals':
            case 'is_not':
            case 'is_not_equal_to':
            case '!=':
            case '!==':
              // Case-insensitive comparison with whitespace trimming
              conditionMet = String(fieldValue).toLowerCase().trim() !== String(condition.value).toLowerCase().trim();
              break;
            case 'contains':
              // Case-insensitive contains
              conditionMet = String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
              break;
            case 'not_contains':
              // Case-insensitive not contains
              conditionMet = !String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
              break;
            case 'starts_with':
              // Case-insensitive starts with
              conditionMet = String(fieldValue).toLowerCase().startsWith(String(condition.value).toLowerCase());
              break;
            case 'ends_with':
              // Case-insensitive ends with
              conditionMet = String(fieldValue).toLowerCase().endsWith(String(condition.value).toLowerCase());
              break;
            case 'is_empty':
              conditionMet = !fieldValue || String(fieldValue).trim() === '';
              break;
            case 'is_not_empty':
              conditionMet = fieldValue && String(fieldValue).trim() !== '';
              break;
            case 'is_greater_than':
            case '>':
              // Numeric comparison
              conditionMet = parseFloat(fieldValue) > parseFloat(condition.value);
              break;
            case 'is_less_than':
            case '<':
              // Numeric comparison
              conditionMet = parseFloat(fieldValue) < parseFloat(condition.value);
              break;
            case 'is_greater_than_or_equal_to':
            case '>=':
              // Numeric comparison
              conditionMet = parseFloat(fieldValue) >= parseFloat(condition.value);
              break;
            case 'is_less_than_or_equal_to':
            case '<=':
              // Numeric comparison
              conditionMet = parseFloat(fieldValue) <= parseFloat(condition.value);
              break;
            default:
              console.warn('[Roolify] Unknown operator:', condition.operator);
              conditionMet = false;
          }
          
          if (conditionMet) {
            anyConditionMet = true;
            break; // Found a matching condition for this field, move to next field
          }
        }
        
        // If NO conditions matched for this field, the entire rule fails
        if (!anyConditionMet) {
          conditionsMet = false;
          break;
        }
      }
      
      // Execute actions based on whether conditions are met
      // INDEX-BASED MATCHING: When rule has multiple conditions on the same field,
      // match conditions to actions by index (condition[0] → action[0], etc.)
      
      // Check if this is a multi-condition rule where ALL conditions are on the SAME field
      // AND conditions equal actions (meaning each condition maps to one action)
      const allConditionsOnSameField = Object.keys(conditionsByField).length === 1 && 
                                       Object.values(conditionsByField)[0].length > 1 &&
                                       rule.conditions.length === rule.actions.length;
      
      if (allConditionsOnSameField) {
        console.log('[Roolify] Index-based rule detected (all conditions on same field) - using 1:1 matching');
        
        // Index-based: only execute the action that corresponds to the matched condition
        for (let i = 0; i < rule.conditions.length; i++) {
          const condition = rule.conditions[i];
          const action = rule.actions[i];
          
          const field = findField(condition.fieldId);
          if (!field) continue;
          
          // Get field value (use same logic as main condition evaluation)
          let fieldValue = '';

          if (field.type === 'checkbox') {
            if (field.checked) {
              fieldValue = field.value && field.value !== 'on' ? field.value : 'true';
            } else {
              fieldValue = 'false';
            }
          } else if (field.type === 'radio') {
            if (field.name) {
              const checkedRadio = document.querySelector(\`input[name="\${field.name}"]:checked\`);
              fieldValue = checkedRadio ? checkedRadio.value : '';
            } else {
              fieldValue = field.checked ? field.value : '';
            }
          } else if (field.tagName === 'SELECT') {
            if (field.multiple) {
              const selectedOptions = Array.from(field.selectedOptions).map(opt => opt.value);
              fieldValue = selectedOptions.join(',');
            } else {
              fieldValue = field.value;
            }
          } else if (field.type === 'file') {
            fieldValue = field.files && field.files.length > 0 ? 'file-selected' : '';
          } else if (field.type === 'number' || field.type === 'range') {
            fieldValue = field.value || '0';
          } else {
            fieldValue = field.value || field.textContent || '';
          }
          
          // Check if THIS specific condition matches (case-insensitive with trim)
          const conditionMatches = String(fieldValue).toLowerCase().trim() === String(condition.value).toLowerCase().trim();
          console.log('[Roolify] Index', i, '- Condition:', condition.value, '=== Field value:', fieldValue, '?', conditionMatches);
          
          const targetElement = findField(action.targetFieldId);
          if (!targetElement) {
            console.warn('[Roolify] Target element not found:', action.targetFieldId);
            continue;
          }
          
          if (conditionMatches) {
            // This condition matches - execute its action
            console.log('[Roolify] ✓ Executing action for matched condition:', action.type, action.targetFieldId);
            const normalizedAction = action.type.toLowerCase();
            if (normalizedAction === 'show') {
              showElement(targetElement);
            } else if (normalizedAction === 'hide') {
              hideElement(targetElement);
            }
          } else {
            // This condition doesn't match - reverse the action (hide if it was show)
            console.log('[Roolify] ✗ Condition not matched - hiding:', action.targetFieldId);
            hideElement(targetElement);
          }
        }
      } else {
        // Regular rule execution: all actions execute if conditions met
        console.log('[Roolify] Regular rule execution - all actions will execute');
        for (const action of rule.actions) {
          const targetElement = findField(action.targetFieldId);
          
          if (!targetElement) {
            console.warn('[Roolify] Target element not found:', action.targetFieldId);
            continue;
          }
          
          if (conditionsMet) {
            console.log('[Roolify] Executing action:', action.type, 'for', action.targetFieldId);
          
          // Normalize action type to handle various formats
          const normalizedAction = action.type.toLowerCase();
          
          switch (normalizedAction) {
            case 'show':
              showElement(targetElement);
              console.log('[Roolify] Showing element:', action.targetFieldId);
              break;
            case 'hide':
              hideElement(targetElement);
              console.log('[Roolify] Hiding element:', action.targetFieldId);
              break;
            case 'toggle':
              if (isElementVisible(targetElement)) {
                hideElement(targetElement);
                console.log('[Roolify] Toggling element (hide):', action.targetFieldId);
              } else {
                showElement(targetElement);
                console.log('[Roolify] Toggling element (show):', action.targetFieldId);
              }
              break;
            case 'enable':
              targetElement.disabled = false;
              console.log('[Roolify] Enabling element:', action.targetFieldId);
              break;
            case 'disable':
              targetElement.disabled = true;
              console.log('[Roolify] Disabling element:', action.targetFieldId);
              break;
            case 'focus':
              targetElement.focus();
              console.log('[Roolify] Focusing element:', action.targetFieldId);
              break;
            case 'scroll_to':
              targetElement.scrollIntoView({ behavior: 'smooth' });
              console.log('[Roolify] Scrolling to element:', action.targetFieldId);
              break;
            default:
              console.warn('[Roolify] Unknown action type:', action.type);
          }
        } else {
          // Conditions NOT met - reverse the action
          console.log('[Roolify] Conditions not met, reversing action:', action.type);
          
          // Normalize action type to handle various formats
          const normalizedAction = action.type.toLowerCase();
          
          switch (normalizedAction) {
            case 'show':
              // If action was "show" but condition not met, hide it
              hideElement(targetElement);
              console.log('[Roolify] Hiding element (condition not met):', action.targetFieldId);
              break;
            case 'hide':
              // If action was "hide" but condition not met, show it
              showElement(targetElement);
              console.log('[Roolify] Showing element (condition not met):', action.targetFieldId);
              break;
            case 'enable':
              // If action was "enable" but condition not met, disable it
              targetElement.disabled = true;
              console.log('[Roolify] Disabling element (condition not met):', action.targetFieldId);
              break;
            case 'disable':
              // If action was "disable" but condition not met, enable it
              targetElement.disabled = false;
              console.log('[Roolify] Enabling element (condition not met):', action.targetFieldId);
              break;
          }
        }
        }
      }
      
    } catch (error) {
      console.error('[Roolify] Error executing rule:', rule.name, error);
    }
  }
  
  // Initialize the script
  function init() {
    console.log('[Roolify Universal Script] Initializing with', CONFIG.rules.length, 'rules');
    
    // Check if we're in Webflow designer vs live site
    // Only hide elements if we're NOT in the Webflow designer editor
    const isWebflowDesigner = window.location.hostname.includes('webflow.com') && 
                              window.location.pathname.includes('/design/');
    
    console.log('[Roolify] Environment detected:', isWebflowDesigner ? 'Webflow Designer' : 'Live Site');
    console.log('[Roolify] Current URL:', window.location.href);
    
    // First, hide all target elements that should be controlled by rules
    // This ensures they start hidden on the live site, but remain visible in designer
    const allTargetElements = new Set();
    CONFIG.rules.forEach(rule => {
      rule.actions.forEach(action => {
        allTargetElements.add(action.targetFieldId);
      });
    });
    
    if (!isWebflowDesigner) {
      console.log('[Roolify] Hiding', allTargetElements.size, 'target elements initially on live site');
      allTargetElements.forEach(elementId => {
        const element = findField(elementId);
        if (element) {
          // Add a class to mark this element as controlled by Roolify
          element.classList.add('roolify-controlled');
          // Hide the element initially on live site
          hideElement(element);
          console.log('[Roolify] Initially hiding element:', elementId);
        } else {
          console.warn('[Roolify] Could not find element to hide initially:', elementId);
        }
      });
      
      // Retry hiding elements after a short delay for dynamically loaded content
      setTimeout(() => {
        console.log('[Roolify] Retry: Ensuring all target elements are hidden');
        allTargetElements.forEach(elementId => {
          const element = findField(elementId);
          if (element && !element.classList.contains('roolify-controlled')) {
            element.classList.add('roolify-controlled');
            hideElement(element);
            console.log('[Roolify] Late hiding of element:', elementId);
          }
        });
      }, 100);
    } else {
      console.log('[Roolify] In Webflow designer - keeping elements visible for editing');
      // In designer, just mark elements but don't hide them
      allTargetElements.forEach(elementId => {
        const element = findField(elementId);
        if (element) {
          element.classList.add('roolify-controlled');
          console.log('[Roolify] Marking element for control:', elementId);
        }
      });
    }
    
    // Execute rules on page load
    CONFIG.rules.forEach(executeRule);
    
    // Set up event listeners for form interactions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      // Listen for input changes
      form.addEventListener('input', function(event) {
        console.log('[Roolify] Input change detected:', event.target.id || event.target.name);
        CONFIG.rules.forEach(executeRule);
      });
      
      // Listen for select changes
      form.addEventListener('change', function(event) {
        console.log('[Roolify] Select change detected:', event.target.id || event.target.name);
        CONFIG.rules.forEach(executeRule);
      });
      
      // Listen for checkbox/radio changes
      form.addEventListener('click', function(event) {
        if (event.target.type === 'checkbox' || event.target.type === 'radio') {
          console.log('[Roolify] Checkbox/Radio change detected:', event.target.id || event.target.name);
          CONFIG.rules.forEach(executeRule);
        }
      });
    });
    
    console.log('[Roolify Universal Script] Initialized successfully');
  }
  
  // Start the script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  } catch (error) {
    console.error('[Roolify Universal Script] Error:', error);
    // Don't break the page if our script fails
  }
  
})();
`;

  return script;
}
