import { NextResponse } from 'next/server';
import { xanoRules } from '../../../../lib/xano';

export async function POST(req: Request) {
  try {
    const { siteId, baseUrl } = await req.json();
    
    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    console.log(`[Script Deploy] Generating universal script for site ${siteId}`);

    // Get all active rules for the site
    const allRules = await xanoRules.getAll();
    const activeRules = allRules.filter(rule => rule.isActive);
    
    console.log(`[Script Deploy] Found ${activeRules.length} active rules`);

    // Generate the universal script
    const script = generateUniversalScript(activeRules, siteId, baseUrl);
    
    // Save the script to a file that can be served
    const scriptPath = `/api/script/serve/${siteId}`;
    
    console.log(`[Script Deploy] Universal script generated and available at ${scriptPath}`);

    return NextResponse.json({
      success: true,
      scriptPath,
      rulesCount: activeRules.length,
      script: script,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Script Deploy] Error:', error);
    return NextResponse.json(
      { error: `Script deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function generateUniversalScript(rules: any[], siteId: string, baseUrl?: string): string {
  const apiUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:1337';
  
  const script = `
(function() {
  'use strict';
  
  console.log('[Roolify Universal Script] Loading...');
  
  // Configuration
  const CONFIG = {
    siteId: '${siteId}',
    apiUrl: '${apiUrl}',
    rules: ${JSON.stringify(rules, null, 2)}
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
  
  function showElement(element) {
    if (element) {
      element.style.display = '';
      element.style.visibility = 'visible';
      element.style.opacity = '1';
    }
  }
  
  function hideElement(element) {
    if (element) {
      element.style.display = 'none';
      element.style.visibility = 'hidden';
      element.style.opacity = '0';
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
      // Evaluate conditions
      let conditionsMet = true;
      
      for (const condition of rule.conditions) {
        const field = getElementById(condition.fieldId) || getElementByName(condition.fieldId);
        
        if (!field) {
          console.warn('[Roolify] Field not found:', condition.fieldId);
          conditionsMet = false;
          break;
        }
        
        let fieldValue = '';
        if (field.type === 'checkbox' || field.type === 'radio') {
          fieldValue = field.checked ? 'true' : 'false';
        } else if (field.tagName === 'SELECT') {
          fieldValue = field.value;
        } else {
          fieldValue = field.value || field.textContent || '';
        }
        
        console.log('[Roolify] Condition check:', {
          fieldId: condition.fieldId,
          operator: condition.operator,
          expectedValue: condition.value,
          actualValue: fieldValue
        });
        
        let conditionMet = false;
        
        switch (condition.operator) {
          case 'equals':
          case 'is':
            conditionMet = fieldValue === condition.value;
            break;
          case 'not_equals':
          case 'is_not':
            conditionMet = fieldValue !== condition.value;
            break;
          case 'contains':
            conditionMet = fieldValue.includes(condition.value);
            break;
          case 'not_contains':
            conditionMet = !fieldValue.includes(condition.value);
            break;
          case 'starts_with':
            conditionMet = fieldValue.startsWith(condition.value);
            break;
          case 'ends_with':
            conditionMet = fieldValue.endsWith(condition.value);
            break;
          case 'is_empty':
            conditionMet = !fieldValue || fieldValue.trim() === '';
            break;
          case 'is_not_empty':
            conditionMet = fieldValue && fieldValue.trim() !== '';
            break;
          default:
            console.warn('[Roolify] Unknown operator:', condition.operator);
            conditionMet = false;
        }
        
        if (!conditionMet) {
          conditionsMet = false;
          break;
        }
      }
      
      // Execute actions if conditions are met
      if (conditionsMet) {
        console.log('[Roolify] Conditions met, executing actions');
        
        for (const action of rule.actions) {
          const targetElement = getElementById(action.targetFieldId) || getElementByName(action.targetFieldId);
          
          if (!targetElement) {
            console.warn('[Roolify] Target element not found:', action.targetFieldId);
            continue;
          }
          
          switch (action.type) {
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
        }
      } else {
        console.log('[Roolify] Conditions not met for rule:', rule.name);
      }
      
    } catch (error) {
      console.error('[Roolify] Error executing rule:', rule.name, error);
    }
  }
  
  // Initialize the script
  function init() {
    console.log('[Roolify Universal Script] Initializing with', CONFIG.rules.length, 'rules');
    
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
  
})();
`;

  return script;
}



