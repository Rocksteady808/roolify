// Enhanced debugging script for conditional logic
// This script provides detailed debugging information to identify field matching issues

(function() {
  'use strict';
  
  console.log('🔍 [Roolify Debug] Enhanced debugging script loaded');
  
  // Configuration
  const SITE_ID = '652b10ed79cbf4ed07a349ed';
  const API_URL = 'http://localhost:3000/api/submissions/webhook';
  
  // Load rules from the API
  async function loadRules() {
    try {
      const response = await fetch(`http://localhost:3000/api/form-rules?siteId=${SITE_ID}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ [Roolify Debug] Loaded ${data.rules.length} rules`);
        return data.rules;
      } else {
        console.error('❌ [Roolify Debug] Failed to load rules:', data.error);
        return [];
      }
    } catch (error) {
      console.error('❌ [Roolify Debug] Error loading rules:', error);
      return [];
    }
  }
  
  // Enhanced field finder with detailed debugging
  function findField(fieldId) {
    console.log(`🔍 [Roolify Debug] Looking for field: "${fieldId}"`);
    
    if (!fieldId) {
      console.log('❌ [Roolify Debug] Field ID is empty');
      return null;
    }

    // Try exact ID match
    let field = document.getElementById(fieldId);
    if (field) {
      console.log(`✅ [Roolify Debug] Found field by exact ID: "${fieldId}"`);
      return field;
    }

    // Try exact name match
    field = document.querySelector(`[name="${fieldId}"]`);
    if (field) {
      console.log(`✅ [Roolify Debug] Found field by exact name: "${fieldId}"`);
      return field;
    }

    // Try data-name attribute
    field = document.querySelector(`[data-name="${fieldId}"]`);
    if (field) {
      console.log(`✅ [Roolify Debug] Found field by data-name: "${fieldId}"`);
      return field;
    }

    // Try with spaces converted to hyphens
    const withHyphens = fieldId.replace(/\s+/g, '-');
    field = document.getElementById(withHyphens) || document.querySelector(`[name="${withHyphens}"]`);
    if (field) {
      console.log(`✅ [Roolify Debug] Found field by hyphen conversion: "${withHyphens}"`);
      return field;
    }

    // Try with hyphens converted to spaces
    const withSpaces = fieldId.replace(/-/g, ' ');
    field = document.getElementById(withSpaces) || document.querySelector(`[name="${withSpaces}"]`);
    if (field) {
      console.log(`✅ [Roolify Debug] Found field by space conversion: "${withSpaces}"`);
      return field;
    }

    // Try with spaces converted to underscores
    const withUnderscores = fieldId.replace(/\s+/g, '_');
    field = document.getElementById(withUnderscores) || document.querySelector(`[name="${withUnderscores}"]`);
    if (field) {
      console.log(`✅ [Roolify Debug] Found field by underscore conversion: "${withUnderscores}"`);
      return field;
    }

    // Try normalized (lowercase, no special chars)
    const normalized = fieldId.toLowerCase().replace(/[^a-z0-9]/g, '');
    console.log(`🔍 [Roolify Debug] Trying normalized search: "${normalized}"`);

    // Get all form elements
    const allElements = document.querySelectorAll('input, select, textarea, button[type="submit"]');
    console.log(`🔍 [Roolify Debug] Found ${allElements.length} form elements on page`);
    
    // List all available fields for debugging
    console.log('📋 [Roolify Debug] Available fields on page:');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const id = el.id || 'no-id';
      const name = el.name || 'no-name';
      const type = el.type || el.tagName.toLowerCase();
      console.log(`   ${i + 1}. ID: "${id}", Name: "${name}", Type: "${type}"`);
      
      // Check for matches
      if (el.id && el.id.toLowerCase() === fieldId.toLowerCase()) {
        console.log(`✅ [Roolify Debug] Found by case-insensitive ID match`);
        return el;
      }
      if (el.name && el.name.toLowerCase() === fieldId.toLowerCase()) {
        console.log(`✅ [Roolify Debug] Found by case-insensitive name match`);
        return el;
      }
      if (el.id && el.id.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) {
        console.log(`✅ [Roolify Debug] Found by normalized ID match`);
        return el;
      }
      if (el.name && el.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) {
        console.log(`✅ [Roolify Debug] Found by normalized name match`);
        return el;
      }
      if (el.getAttribute('data-name') && el.getAttribute('data-name').toLowerCase() === fieldId.toLowerCase()) {
        console.log(`✅ [Roolify Debug] Found by case-insensitive data-name match`);
        return el;
      }
    }

    console.log(`❌ [Roolify Debug] Field not found: "${fieldId}"`);
    console.log(`💡 [Roolify Debug] Suggestions:`);
    console.log(`   - Check if the field ID is correct`);
    console.log(`   - Check if the field exists on the page`);
    console.log(`   - Try using a different field ID format`);
    console.log(`   - Check the browser's developer tools for the actual field IDs`);
    
    return null;
  }
  
  // Enhanced rule execution with debugging
  function executeRule(rule) {
    console.log(`🔧 [Roolify Debug] Executing rule: "${rule.name}"`);
    console.log(`   Form ID: ${rule.formId}`);
    console.log(`   Site ID: ${rule.siteId}`);
    console.log(`   Active: ${rule.isActive}`);
    
    if (!rule.isActive) {
      console.log('⏭️ [Roolify Debug] Rule is inactive, skipping');
      return;
    }
    
    try {
      // Check conditions
      console.log(`📝 [Roolify Debug] Checking ${rule.conditions.length} conditions:`);
      let conditionsMet = true;
      
      for (let i = 0; i < rule.conditions.length; i++) {
        const condition = rule.conditions[i];
        console.log(`   Condition ${i + 1}: Field "${condition.fieldId}" ${condition.operator} "${condition.value}"`);
        
        const field = findField(condition.fieldId);
        if (!field) {
          console.log(`   ❌ Condition ${i + 1} failed: Field not found`);
          conditionsMet = false;
          continue;
        }
        
        // Get field value
        let fieldValue = '';
        if (field.type === 'checkbox') {
          fieldValue = field.checked ? 'true' : 'false';
        } else if (field.type === 'radio') {
          const checkedRadio = document.querySelector(`input[name="${field.name}"]:checked`);
          fieldValue = checkedRadio ? checkedRadio.value : '';
        } else if (field.tagName === 'SELECT') {
          fieldValue = field.value;
        } else {
          fieldValue = field.value || field.textContent || '';
        }
        
        console.log(`   Field value: "${fieldValue}"`);
        
        // Check condition
        let conditionMet = false;
        const normalizedOperator = condition.operator.toLowerCase().replace(/\s+/g, '_');
        
        switch (normalizedOperator) {
          case 'equals':
          case 'is':
          case 'is_equal_to':
          case '==':
          case '===':
            conditionMet = String(fieldValue).toLowerCase().trim() === String(condition.value).toLowerCase().trim();
            break;
          case 'not_equals':
          case 'is_not':
          case 'is_not_equal_to':
          case '!=':
          case '!==':
            conditionMet = String(fieldValue).toLowerCase().trim() !== String(condition.value).toLowerCase().trim();
            break;
          case 'contains':
            conditionMet = String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
            break;
          case 'not_contains':
            conditionMet = !String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
            break;
          case 'is_empty':
            conditionMet = !fieldValue || String(fieldValue).trim() === '';
            break;
          case 'is_not_empty':
            conditionMet = fieldValue && String(fieldValue).trim() !== '';
            break;
          default:
            console.log(`   ⚠️ Unknown operator: ${condition.operator}`);
            conditionMet = false;
        }
        
        console.log(`   Condition ${i + 1} result: ${conditionMet ? '✅ PASS' : '❌ FAIL'}`);
        
        if (!conditionMet) {
          conditionsMet = false;
        }
      }
      
      console.log(`📊 [Roolify Debug] All conditions met: ${conditionsMet ? '✅ YES' : '❌ NO'}`);
      
      // Execute actions
      if (conditionsMet) {
        console.log(`🎯 [Roolify Debug] Executing ${rule.actions.length} actions:`);
        
        for (let i = 0; i < rule.actions.length; i++) {
          const action = rule.actions[i];
          console.log(`   Action ${i + 1}: ${action.type} "${action.targetFieldId}"`);
          
          const targetField = findField(action.targetFieldId);
          if (!targetField) {
            console.log(`   ❌ Action ${i + 1} failed: Target field not found`);
            continue;
          }
          
          // Execute action
          switch (action.type.toLowerCase()) {
            case 'show':
              targetField.style.display = '';
              targetField.style.visibility = 'visible';
              targetField.style.opacity = '1';
              console.log(`   ✅ Action ${i + 1}: Showing field`);
              break;
            case 'hide':
              targetField.style.display = 'none';
              targetField.style.visibility = 'hidden';
              targetField.style.opacity = '0';
              console.log(`   ✅ Action ${i + 1}: Hiding field`);
              break;
            case 'enable':
              targetField.disabled = false;
              console.log(`   ✅ Action ${i + 1}: Enabling field`);
              break;
            case 'disable':
              targetField.disabled = true;
              console.log(`   ✅ Action ${i + 1}: Disabling field`);
              break;
            default:
              console.log(`   ⚠️ Unknown action type: ${action.type}`);
          }
        }
      } else {
        console.log(`⏭️ [Roolify Debug] Conditions not met, skipping actions`);
      }
      
    } catch (error) {
      console.error(`❌ [Roolify Debug] Error executing rule "${rule.name}":`, error);
    }
  }
  
  // Initialize the debug script
  async function init() {
    console.log('🚀 [Roolify Debug] Initializing enhanced debugging...');
    
    // Load rules
    const rules = await loadRules();
    
    if (rules.length === 0) {
      console.log('⚠️ [Roolify Debug] No rules found');
      return;
    }
    
    console.log(`📋 [Roolify Debug] Found ${rules.length} rules to execute`);
    
    // Execute rules on page load
    for (const rule of rules) {
      executeRule(rule);
    }
    
    // Set up event listeners
    const forms = document.querySelectorAll('form');
    console.log(`🔗 [Roolify Debug] Setting up event listeners for ${forms.length} forms`);
    
    forms.forEach(form => {
      form.addEventListener('input', function(event) {
        console.log(`🔄 [Roolify Debug] Input change detected: ${event.target.id || event.target.name}`);
        for (const rule of rules) {
          executeRule(rule);
        }
      });
      
      form.addEventListener('change', function(event) {
        console.log(`🔄 [Roolify Debug] Change detected: ${event.target.id || event.target.name}`);
        for (const rule of rules) {
          executeRule(rule);
        }
      });
    });
    
    console.log('✅ [Roolify Debug] Enhanced debugging initialized successfully');
  }
  
  // Start the script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
