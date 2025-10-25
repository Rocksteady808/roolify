import { NextResponse } from 'next/server';
import { xanoSubmissions, xanoForms } from '@/lib/xano';

/**
 * Helper function to evaluate a route condition against form data
 */
function evaluateCondition(condition: any, formData: any): boolean {
  const fieldValue = formData[condition.fieldId] || '';
  const conditionValue = condition.value || '';
  
  switch (condition.operator) {
    case 'equals':
      return String(fieldValue).toLowerCase() === String(conditionValue).toLowerCase();
    case 'not_equals':
      return String(fieldValue).toLowerCase() !== String(conditionValue).toLowerCase();
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
    case 'is_empty':
      return !fieldValue || String(fieldValue).trim() === '';
    case 'is_filled':
      return !!fieldValue && String(fieldValue).trim() !== '';
    default:
      return false;
  }
}

/**
 * Helper function to send notification emails based on routing rules
 */
async function sendNotificationEmails(formId: string, formData: any, formName: string, siteId?: string, htmlFormId?: string): Promise<void> {
  try {
    console.log('[Email] 🔍 DIAGNOSTIC: Starting notification email process');
    console.log('[Email] 🔍 DIAGNOSTIC: formId =', formId, '(type:', typeof formId, ')');
    console.log('[Email] 🔍 DIAGNOSTIC: formName =', formName);
    console.log('[Email] 🔍 DIAGNOSTIC: siteId =', siteId);
    console.log('[Email] 🔍 DIAGNOSTIC: htmlFormId =', htmlFormId);
    console.log('[Email] 🔍 DIAGNOSTIC: formData fields =', Object.keys(formData || {}));
    console.log('[Email] 🔍 DIAGNOSTIC: formData values =', Object.entries(formData || {}).map(([k, v]) => `${k}: "${v}"`));
    
    // Load notification settings from Xano
    const { xanoNotifications, xanoForms, xanoSites } = await import('@/lib/xano');
    
    // Find notification settings by SITE + HTML_FORM_ID
    let settings = null;
    if (siteId && htmlFormId) {
      console.log('[Email] 🔍 DIAGNOSTIC: Looking for notification settings');
      console.log('[Email] 🔍 DIAGNOSTIC: Site ID:', siteId, '(type:', typeof siteId, ')');
      console.log('[Email] 🔍 DIAGNOSTIC: HTML Form ID:', htmlFormId, '(type:', typeof htmlFormId, ')');
      
      // Primary lookup
      settings = await xanoNotifications.getBySiteAndForm(siteId, htmlFormId);
      
      if (settings) {
        console.log('[Email] ✅ Found notification settings via primary lookup (ID:', settings.id, ')');
        console.log('[Email] 📊 Settings summary:', {
          hasAdminRoutes: !!settings.admin_routes,
          hasUserRoutes: !!settings.user_routes,
          adminFallback: settings.admin_fallback_email,
          userFallback: settings.user_fallback_email
        });
      } else {
        console.log('[Email] ⚠️ No settings found via primary lookup - trying fallbacks');
        
        // Log all available notification settings for debugging
        const allSettings = await xanoNotifications.getAll();
        console.log('[Email] 📊 Total notification settings in database:', allSettings.length);
        allSettings.forEach(s => {
          console.log('[Email] 📋 Available setting:', {
            id: s.id,
            formId: s.form,
            hasRoutes: !!(s.admin_routes || s.user_routes)
          });
        });
        
        // FALLBACK: Try to find any settings for this form name (in case site ID is different)
        console.log('[Email] 🔍 DIAGNOSTIC: Trying fallback lookup by form name...');
        const allForms = await xanoForms.getAll();
        
        // Find forms with matching name
        const matchingForms = allForms.filter(f => f.name === formName);
        console.log('[Email] 🔍 DIAGNOSTIC: Found', matchingForms.length, 'forms with name:', formName);
        
        if (matchingForms.length > 0) {
          // Use the first matching form's settings
          const formId = matchingForms[0].id;
          settings = await xanoNotifications.getByFormId(formId);
          if (settings) {
            console.log('[Email] 🔍 DIAGNOSTIC: Found fallback settings for form ID:', formId);
          }
        }
      }
      
    } else {
      console.log('[Email] 🔍 DIAGNOSTIC: Missing siteId or htmlFormId, cannot find notification settings');
      console.log('[Email] 🔍 DIAGNOSTIC: siteId:', siteId, 'htmlFormId:', htmlFormId);
    }
    
    if (!settings) {
      console.log('[Email] ❌ No notification settings configured for form:', formId);
      
      // Get all available notification settings to show what's configured
      const allSettings = await xanoNotifications.getAll();
      const configuredForms = allSettings.map(s => s.form).filter(id => id !== 0);
      console.log('[Email] 💡 Available notification settings are for forms:', configuredForms);
      console.log('[Email] 💡 Create notification settings at: /notifications/' + formId);
      console.log('[Email] 💡 Or configure via the app dashboard');
      
      // Send fallback email to default address
      console.log('[Email] 📧 Sending fallback email since no notification settings configured');
      try {
        await sendEmailViaXano({
          to: 'aarontownsend6@gmail.com', // Default fallback email
          subject: `New ${formName} Submission (No Settings Configured)`,
          formData,
          formName,
          type: 'admin'
        });
        console.log('[Email] ✅ Fallback email sent successfully');
      } catch (fallbackError) {
        console.error('[Email] ❌ Fallback email failed:', fallbackError);
      }
      return;
    }

    console.log('[Email] 🔍 RAW SETTINGS FROM XANO:', JSON.stringify(settings, null, 2));
    console.log('[Email] 📧 Custom template available:', !!settings.email_template);
    console.log('[Email] 📧 Custom value available:', !!settings.custom_value);
    if (settings.email_template) {
      console.log('[Email] 📧 Template preview (first 100 chars):', settings.email_template.substring(0, 100));
    }
    
    // Parse admin_routes if it's a string (Xano stores as JSON text field)
    let parsedAdminRoutes = settings.admin_routes;
    if (typeof settings.admin_routes === 'string') {
      try {
        parsedAdminRoutes = JSON.parse(settings.admin_routes);
        console.log('[Email] 📝 Parsed admin_routes from string:', parsedAdminRoutes);
      } catch (e) {
        console.error('[Email] ❌ Failed to parse admin_routes:', e);
        parsedAdminRoutes = [];
      }
    }
    
    // Parse user_routes if it's a string
    let parsedUserRoutes = settings.user_routes;
    if (typeof settings.user_routes === 'string') {
      try {
        parsedUserRoutes = JSON.parse(settings.user_routes);
        console.log('[Email] 📝 Parsed user_routes from string:', parsedUserRoutes);
      } catch (e) {
        console.error('[Email] ❌ Failed to parse user_routes:', e);
        parsedUserRoutes = [];
      }
    }

    // If notification_setting has no admin routes, attempt to merge from logic rules for this form
    if (!parsedAdminRoutes || (Array.isArray(parsedAdminRoutes) && parsedAdminRoutes.length === 0)) {
      try {
        const { xanoRules } = await import('@/lib/xano');
        const allRules = await xanoRules.getAll();
        const rulesForForm = allRules.filter(r => String(r.form_id) === String(formId));

        let mergedAdminRoutes: any[] = [];
        for (const rule of rulesForForm) {
          try {
            const rd = JSON.parse(rule.rule_data || '{}');
            const ruleAdminRoutes = Array.isArray(rd.admin_routes) ? rd.admin_routes : [];
            if (ruleAdminRoutes.length > 0) {
              mergedAdminRoutes = mergedAdminRoutes.concat(ruleAdminRoutes);
            }
          } catch (e) {
            console.warn('[Email] ⚠️ Could not parse rule_data for rule', rule.id);
          }
        }

        if (mergedAdminRoutes.length > 0) {
          parsedAdminRoutes = mergedAdminRoutes;
          console.log('[Email] 🧩 Using admin routes merged from logic_rule since notification_setting has none:', mergedAdminRoutes);
        } else {
          console.log('[Email] 🧩 No logic_rule admin routes found for this form.');
        }
      } catch (e) {
        console.warn('[Email] ⚠️ Failed to load logic rules for merge:', e);
      }
    }

    // Parse/normalize field_custom_values (may be stored as JSON string in Xano)
    let parsedFieldCustomValues: Record<string, string> | null = null;
    try {
      if (settings.field_custom_values) {
        parsedFieldCustomValues = typeof settings.field_custom_values === 'string'
          ? JSON.parse(settings.field_custom_values)
          : settings.field_custom_values;
      }
    } catch (e) {
      console.warn('[Email] ⚠️ Failed to parse field_custom_values:', e);
      parsedFieldCustomValues = null;
    }

    console.log('[Email] Processing notification settings:', {
      formId,
      adminRoutesCount: parsedAdminRoutes?.length || 0,
      userRoutesCount: parsedUserRoutes?.length || 0,
      adminFallback: settings.admin_fallback_email,
      userFallback: settings.user_fallback_email,
      adminRoutes: parsedAdminRoutes,
      userRoutes: parsedUserRoutes,
      hasFieldCustomValues: !!parsedFieldCustomValues,
      fieldCustomValues: parsedFieldCustomValues,
      customValue: settings.custom_value,
    });

    // Log routing strategy
    if (parsedAdminRoutes && parsedAdminRoutes.length > 0) {
      console.log('[Email] 📋 Conditional routing configured - will try rules first, then fallback');
    } else if (settings.admin_fallback_email) {
      console.log('[Email] 📧 Simple routing configured - will send to fallback email only');
    } else {
      console.log('[Email] ⚠️ No routing configured - no emails will be sent');
    }

    // Collect all matching admin emails
    const adminEmails = new Set<string>();

    // Process admin routes
    if (parsedAdminRoutes && Array.isArray(parsedAdminRoutes)) {
      console.log('[Email] 🔍 DIAGNOSTIC: Processing', parsedAdminRoutes.length, 'admin routes');
      console.log('[Email] 📄 DIAGNOSTIC: Form data for matching:', JSON.stringify(formData, null, 2));
      console.log('[Email] 📄 DIAGNOSTIC: Available form fields:', Object.keys(formData || {}));
      
      for (const route of parsedAdminRoutes) {
        console.log('[Email] 🔍 DIAGNOSTIC: Checking route:', JSON.stringify(route, null, 2));
        
        // The route.field could be either:
        // 1. A field ID (like "68eb2153f645687dd340b5ad")
        // 2. A field name (like "HBI Account Rep")
        // We need to try both when looking up the value

        // Enhanced helper function to normalize field names for matching
        const normalizeFieldName = (name: string) => {
          return String(name || '')
            .trim()
            .toLowerCase()
            .replace(/[-_\s]/g, '')  // Remove hyphens, underscores, and spaces
            .replace(/[^a-z0-9]/g, ''); // Remove any other special characters
        };
        
        // Additional helper to try multiple field name variations
        const findFieldValue = (routeField: string, formData: any) => {
          const variations = [
            routeField, // Exact match
            routeField.toLowerCase(), // Lowercase
            routeField.replace(/\s+/g, '-'), // Spaces to hyphens
            routeField.replace(/\s+/g, '_'), // Spaces to underscores
            routeField.replace(/[-_]/g, ' '), // Hyphens/underscores to spaces
            routeField.replace(/[-_\s]/g, ''), // Remove all separators
            normalizeFieldName(routeField) // Fully normalized
          ];
          
          // Try each variation
          for (const variation of variations) {
            if (formData[variation] !== undefined) {
              return { value: formData[variation], matchedField: variation, method: 'direct' };
            }
          }
          
          // Try normalized matching against all form fields
          const normalizedRouteField = normalizeFieldName(routeField);
          for (const [key, value] of Object.entries(formData)) {
            if (normalizeFieldName(key) === normalizedRouteField) {
              return { value: value, matchedField: key, method: 'normalized' };
            }
          }
          
          return { value: null, matchedField: null, method: 'none' };
        };

        // Use enhanced field matching
        const fieldMatch = findFieldValue(route.field, formData);
        const fieldValue = fieldMatch.value ? String(fieldMatch.value).trim() : '';
        
        console.log('[Email] 🔍 DIAGNOSTIC: Enhanced field matching result:', {
          routeField: route.field,
          matchedField: fieldMatch.matchedField,
          matchedValue: fieldValue,
          method: fieldMatch.method
        });
        
        if (fieldMatch.method === 'none') {
          console.log('[Email] ❌ DIAGNOSTIC: No matching field found for:', route.field);
          console.log('[Email] 🔍 DIAGNOSTIC: Available form fields:', Object.keys(formData));
        } else {
          console.log('[Email] ✅ DIAGNOSTIC: Field matched using', fieldMatch.method, 'method:', route.field, '->', fieldMatch.matchedField, '=', fieldValue);
        }
        
        const conditionValue = (route.value ?? '').toString().trim();
        
        console.log('[Email] 🔍 DIAGNOSTIC: Route comparison:', {
          routeField: route.field,
          fieldValue: fieldValue,
          operator: route.operator,
          conditionValue: conditionValue,
          recipients: route.recipients
        });
        
        let matches = false;
        switch (route.operator) {
          case 'equals':
            matches = String(fieldValue).toLowerCase() === String(conditionValue).toLowerCase();
            break;
          case 'contains':
            matches = String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
            break;
          case 'starts_with':
            matches = String(fieldValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
            break;
          case 'ends_with':
            matches = String(fieldValue).toLowerCase().endsWith(String(conditionValue).toLowerCase());
            break;
          default:
            matches = false;
        }

        console.log('[Email] 🔍 DIAGNOSTIC: Route match result:', matches, '(operator:', route.operator, ')');

        if (matches && route.recipients) {
          console.log('[Email] ✅ Admin route matched - Field:', route.field, 'Value:', fieldValue, 'Recipients:', route.recipients);
          // Add all recipients from this route
          route.recipients.split(',').forEach((email: string) => adminEmails.add(email.trim()));
        } else if (!matches) {
          console.log('[Email] ❌ Admin route did NOT match - Field:', route.field, 'Expected:', conditionValue, 'Got:', fieldValue);
        } else if (!route.recipients) {
          console.log('[Email] ❌ Admin route matched but no recipients specified');
        }
      }
    }

    // Use fallback if no routes matched OR if no routes are configured
    if (adminEmails.size === 0) {
      console.log('[Email] 🔍 DIAGNOSTIC: No admin routes matched, checking fallback');
      if (settings.admin_fallback_email) {
        console.log('[Email] ✅ DIAGNOSTIC: Using fallback email:', settings.admin_fallback_email);
        settings.admin_fallback_email.split(',').forEach(email => adminEmails.add(email.trim()));
      } else {
        console.log('[Email] ❌ DIAGNOSTIC: No fallback email configured');
        console.log('[Email] ⚠️ No admin routes configured and no fallback email set');
      }
    } else {
      console.log('[Email] ✅ DIAGNOSTIC: Found', adminEmails.size, 'admin recipients from routes');
    }

    // Send emails to all admin recipients
    if (adminEmails.size > 0) {
      console.log(`[Email] ✅ DIAGNOSTIC: Sending to ${adminEmails.size} admin recipient(s):`, Array.from(adminEmails));
      console.log('[Email] Using email template:', settings.email_template ? 'Custom template' : 'Default template');
      console.log('[Email] Using custom value:', settings.custom_value || 'None');
      
      for (const email of adminEmails) {
        await sendEmailViaXano({
          to: email,
          subject: `New submission from ${formName}`,
          formData,
          formName,
          type: 'admin',
          customTemplate: settings.email_template || null,
          customValue: settings.custom_value || null,
          fieldCustomValues: parsedFieldCustomValues || null
        });
      }
    } else {
      console.log('[Email] ❌ DIAGNOSTIC: No admin recipients found - no emails will be sent');
      console.log('[Email] 🔍 DIAGNOSTIC: This means:');
      console.log('[Email] 🔍 DIAGNOSTIC: - No admin routes matched the form data');
      console.log('[Email] 🔍 DIAGNOSTIC: - No fallback email was configured');
      console.log('[Email] 🔍 DIAGNOSTIC: - Check field names in routes vs. submitted data');
      console.log('[Email] 🔍 DIAGNOSTIC: - Check route values match submitted values');
      console.log('[Email] 🔍 DIAGNOSTIC: - Check route operators are correct');
      
      // CRITICAL: Always send at least one email if we have ANY email configured
      // This prevents silent failures where routing doesn't work
      const emergencyEmail = settings.admin_fallback_email || 'aaront@flexflowweb.com';
      console.log('[Email] 🚨 EMERGENCY FALLBACK: Sending to emergency email:', emergencyEmail);
      
      await sendEmailViaXano({
        to: emergencyEmail,
        subject: `[ROUTING FAILED] New submission from ${formName}`,
        formData,
        formName,
        type: 'admin',
        customTemplate: settings.email_template || null,
        customValue: settings.custom_value || null,
        fieldCustomValues: parsedFieldCustomValues || null
      });
      
      console.log('[Email] ✅ EMERGENCY FALLBACK: Email sent to prevent silent failure');
    }

    // Process user routes (confirmation emails) - similar logic
    const userEmails = new Set<string>();
    
    if (settings.user_routes && Array.isArray(settings.user_routes)) {
      for (const route of settings.user_routes) {
        const fieldValue = formData[route.field] || '';
        const conditionValue = route.value || '';
        
        let matches = false;
        switch (route.operator) {
          case 'equals':
            matches = String(fieldValue).toLowerCase() === String(conditionValue).toLowerCase();
            break;
          case 'contains':
            matches = String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
            break;
          case 'starts_with':
            matches = String(fieldValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
            break;
          case 'ends_with':
            matches = String(fieldValue).toLowerCase().endsWith(String(conditionValue).toLowerCase());
            break;
          default:
            matches = false;
        }

        if (matches && route.recipients) {
          console.log('[Email] User route matched - Field:', route.field, 'Value:', fieldValue);
          route.recipients.split(',').forEach((email: string) => userEmails.add(email.trim()));
        }
      }
    }

    // Use user fallback if no routes matched OR if no routes are configured
    if (userEmails.size === 0) {
      if (settings.user_fallback_email) {
        console.log('[Email] No user routes matched, using fallback:', settings.user_fallback_email);
        settings.user_fallback_email.split(',').forEach(email => userEmails.add(email.trim()));
      } else {
        console.log('[Email] ⚠️ No user routes configured and no fallback email set');
      }
    }

    // Send user emails
    if (userEmails.size > 0) {
      console.log(`[Email] Sending to ${userEmails.size} user recipient(s):`, Array.from(userEmails));
      for (const email of userEmails) {
        await sendEmailViaXano({
          to: email,
          subject: `Thank you for your submission`,
          formData,
          formName,
          type: 'user',
          customTemplate: settings.email_template || null,
          customValue: settings.custom_value || null,
          fieldCustomValues: parsedFieldCustomValues || null
        });
      }
    } else {
      console.log('[Email] ❌ No user recipients found - no confirmation emails will be sent');
    }

  } catch (error) {
    console.error('[Email] Error in sendNotificationEmails:', error);
    throw error;
  }
}

/**
 * Replace template variables with actual form data
 * Supports {{FieldName}} syntax
 */
function replaceTemplateVariables(template: string, formData: any, customValue?: string | null, fieldCustomValues?: Record<string, string> | null): string {
  let result = template;
  
  // Track which fields have been processed with custom values to avoid overwriting
  const processedFields = new Set<string>();
  
  // Replace {{FieldName:CustomValue}} patterns first (for custom checkbox values in template)
  const customValuePattern = /\{\{\s*([^:}]+):([^}]+)\s*\}\}/gi;
  result = result.replace(customValuePattern, (match, fieldName, templateCustomValue) => {
    const actualValue = formData[fieldName] || formData[fieldName.replace(/\s+/g, '-')] || formData[fieldName.replace(/-/g, ' ')];
    
    // For checkboxes, if checked, use the custom value from template, otherwise empty
    if (actualValue && (actualValue === 'true' || actualValue === true || actualValue === 'on')) {
      processedFields.add(fieldName);
      return templateCustomValue.replace(/\{\{field\}\}/g, fieldName);
    }
    return ''; // If not checked, return empty
  });
  
  // Replace {{FieldName}} with actual values (but skip fields that already have custom values)
  Object.entries(formData).forEach(([key, value]) => {
    if (!key.startsWith('_') && !processedFields.has(key)) {
      // Check if this is a checkbox field
      const isCheckbox = (value === 'true' || value === true || value === 'on' || value === 'off' || value === 'false' || value === false);
      const isChecked = (value === 'true' || value === true || value === 'on');
      
      // Apply per-field custom values or global custom value
      let displayValue = String(value || '');
      
      // Check for per-field custom value first
      const fieldCustomValue = fieldCustomValues && fieldCustomValues[key];
      
      if (fieldCustomValue) {
        console.log(`[Email] 🔍 Processing field "${key}" with per-field custom value`);
        console.log(`[Email] 🔍 isCheckbox: ${isCheckbox}, isChecked: ${isChecked}`);
        
        // For checkboxes, only apply custom value if checked
        if (isCheckbox && isChecked) {
          displayValue = fieldCustomValue;
          console.log(`[Email] ✅ Using per-field custom value "${fieldCustomValue}" for checkbox field "${key}"`);
        } else if (isCheckbox && !isChecked) {
          console.log(`[Email] ⚠️ Skipping per-field custom value for unchecked checkbox "${key}"`);
        } else {
          console.log(`[Email] ℹ️ Keeping original value for non-checkbox field "${key}": "${value}"`);
        }
      } else if (customValue) {
        console.log(`[Email] 🔍 Processing field "${key}" with global custom value`);
        console.log(`[Email] 🔍 isCheckbox: ${isCheckbox}, isChecked: ${isChecked}`);
        
        // For checkboxes, only apply custom value if checked
        if (isCheckbox && isChecked) {
          displayValue = customValue.replace(/\{\{field\}\}/g, key);
          console.log(`[Email] ✅ Using global custom value "${customValue}" for checkbox field "${key}"`);
        } else if (isCheckbox && !isChecked) {
          console.log(`[Email] ⚠️ Skipping global custom value for unchecked checkbox "${key}"`);
        } else {
          console.log(`[Email] ℹ️ Keeping original value for non-checkbox field "${key}": "${value}"`);
        }
      } else if (isCheckbox && !isChecked) {
        displayValue = ''; // Don't show anything for unchecked boxes
      }
      
      // Try exact match first: {{Select a Country}}
      const exactPattern = new RegExp(`\\{\\{\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'gi');
      result = result.replace(exactPattern, displayValue);
      
      // Try with spaces replaced by hyphens: {{Select-a-Country}}
      const dashedKey = key.replace(/\s+/g, '-');
      const dashedPattern = new RegExp(`\\{\\{\\s*${dashedKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'gi');
      result = result.replace(dashedPattern, displayValue);
      
      // Try with hyphens replaced by spaces: {{Select a Country}}
      const spacedKey = key.replace(/-/g, ' ');
      const spacedPattern = new RegExp(`\\{\\{\\s*${spacedKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'gi');
      result = result.replace(spacedPattern, displayValue);
    }
  });
  
  // Clean up any remaining unreplaced variables (show as empty)
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  
  return result;
}

/**
 * Generate HTML email body from form data
 * Uses custom template if provided, otherwise uses default
 */
function generateEmailHTML(formData: any, formName: string, type: 'admin' | 'user', customTemplate?: string | null, customValue?: string | null, fieldCustomValues?: Record<string, string> | null): string {
  // If custom template is provided, use it with variable replacement
  if (customTemplate) {
    console.log('[Email] ✅ Using CUSTOM HTML template for', type, 'email');
    console.log('[Email] Template length:', customTemplate.length, 'characters');
    return replaceTemplateVariables(customTemplate, formData, customValue, fieldCustomValues);
  }
  
  console.log('[Email] ℹ️ Using DEFAULT template for', type, 'email');
  
  // Otherwise, use default template
  const entries = Object.entries(formData)
    .filter(([key]) => !key.startsWith('_')) // Filter out internal fields
    .map(([key, value]) => {
      const label = key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // Apply per-field custom values or global custom value to default template
      let displayValue = String(value || '');

      // Check if this is a checkbox field
      // NOTE: At this point, checkboxes have already been normalized to boolean true/false by normalizeCheckbox()
      // So we need to check for BOTH string and boolean values
      const isCheckbox = (
        value === 'true' || value === true ||
        value === 'on' ||
        value === 'off' ||
        value === 'false' || value === false
      );
      const isChecked = (value === 'true' || value === true || value === 'on');

      console.log(`[Email] 🔍 Field "${key}": value="${value}", type=${typeof value}, isCheckbox=${isCheckbox}, isChecked=${isChecked}`);
      
      // Check for per-field custom value first
      const fieldCustomValue = fieldCustomValues && fieldCustomValues[key];
      
      if (fieldCustomValue) {
        console.log(`[Email] 🔍 Processing field "${key}" with per-field custom value`);
        console.log(`[Email] 🔍 isCheckbox: ${isCheckbox}, isChecked: ${isChecked}`);
        
        // For checkboxes, only apply custom value if checked
        if (isCheckbox && isChecked) {
          displayValue = fieldCustomValue;
          console.log(`[Email] ✅ Using per-field custom value "${fieldCustomValue}" for checkbox field "${key}"`);
        } else if (isCheckbox && !isChecked) {
          console.log(`[Email] ⚠️ Skipping per-field custom value for unchecked checkbox "${key}"`);
        } else {
          console.log(`[Email] ℹ️ Keeping original value for non-checkbox field "${key}": "${value}"`);
        }
      } else if (customValue) {
        console.log(`[Email] 🔍 Processing field "${key}" with global custom value`);
        console.log(`[Email] 🔍 isCheckbox: ${isCheckbox}, isChecked: ${isChecked}`);
        
        // For checkboxes, only apply custom value if checked
        if (isCheckbox && isChecked) {
          displayValue = customValue.replace(/\{\{field\}\}/g, key);
          console.log(`[Email] ✅ Using global custom value "${customValue}" for checkbox field "${key}"`);
        } else if (isCheckbox && !isChecked) {
          console.log(`[Email] ⚠️ Skipping global custom value for unchecked checkbox "${key}"`);
        } else {
          console.log(`[Email] ℹ️ Keeping original value for non-checkbox field "${key}": "${value}"`);
        }
      } else if (isCheckbox && !isChecked) {
        displayValue = ''; // Hide rows for unchecked boxes
      } else if (isCheckbox && isChecked) {
        // No custom value configured: show normalized boolean true
        displayValue = 'true';
      }
      
      if (displayValue === '') {
        // Hide the entire row when value is empty (unchecked checkbox)
        return '';
      }

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 30%;">
            ${label}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
            ${displayValue}
          </td>
        </tr>
      `;
    }).join('');

  const greeting = type === 'admin' 
    ? `<p style="color: #374151; font-size: 16px; line-height: 1.5;">You've received a new submission from <strong>${formName}</strong>.</p>`
    : `<p style="color: #374151; font-size: 16px; line-height: 1.5;">Thank you for your submission! We've received your information.</p>`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="format-detection" content="telephone=no">
        <meta name="format-detection" content="date=no">
        <meta name="format-detection" content="address=no">
        <meta name="format-detection" content="email=no">
        <title>${type === 'admin' ? 'New Form Submission' : 'Submission Received'} - ${formName}</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; margin: 0 !important; }
            .content { padding: 20px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f9fafb; line-height: 1.6;">
        <div class="container" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background-color: #4f46e5; padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; line-height: 1.2;">
              ${type === 'admin' ? 'New Form Submission' : 'Submission Received'}
            </h1>
          </div>

          <!-- Content -->
          <div class="content" style="padding: 30px;">
            ${greeting}
            
            <table style="width: 100%; margin-top: 24px; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
              ${entries}
            </table>
            
            <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 4px;">
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                <strong>Submission Details:</strong><br>
                Form: ${formName}<br>
                Submitted: ${new Date().toLocaleString()}<br>
                Source: Webflow Form
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px;">
              This email was sent from ${formName}
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              FlexFlow Web Form Notifications • <a href="mailto:aaront@flexflowweb.com?subject=Unsubscribe" style="color: #6b7280; text-decoration: none;">Unsubscribe</a>
            </p>
          </div>

        </div>
      </body>
    </html>
  `;
}

/**
 * Send email via Xano/SendGrid
 */
async function sendEmailViaXano(params: {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  formData: any;
  formName: string;
  type: 'admin' | 'user';
  customTemplate?: string | null;
  customValue?: string | null;
  fieldCustomValues?: Record<string, string> | null;
}): Promise<void> {
  try {
    // Validate email address
    if (!params.to || !params.to.includes('@') || !params.to.includes('.')) {
      throw new Error(`Invalid email address: ${params.to}`);
    }

    // Validate subject
    if (!params.subject || params.subject.trim().length === 0) {
      params.subject = `New ${params.formName} Submission`;
    }

    const emailBody = generateEmailHTML(params.formData, params.formName, params.type, params.customTemplate, params.customValue, params.fieldCustomValues);

    console.log('[Email] Sending email to:', params.to);
    console.log('[Email] Subject:', params.subject);
    console.log('[Email] Email body length:', emailBody.length);

    // Use direct SendGrid API (bypassing broken Xano wrapper)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const directSendGridUrl = `${baseUrl}/api/sendgrid/direct`;

    const response = await fetch(directSendGridUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        htmlBody: emailBody,
        textBody: emailBody.replace(/<[^>]*>/g, ''),
        fromEmail: 'aaront@flexflowweb.com', // Verified SendGrid sender
        fromName: 'Form Notifications'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Email] Direct SendGrid API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Direct SendGrid API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Email] Email sent successfully:', {
      to: params.to,
      subject: params.subject,
      result: result
    });

  } catch (error) {
    console.error('[Email] Error sending via alternative endpoint:', error);
    throw error;
  }
}

/**
 * Webhook endpoint to receive form submissions from Webflow
 * This endpoint should be configured in Webflow's Form Settings
 * 
 * POST /api/submissions/webhook
 * Body: Form submission data from Webflow
 * 
 * Note: CORS headers are set globally in next.config.mjs
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log('[Submission Webhook] ✅ Received submission:', JSON.stringify(body, null, 2));

    // Extract metadata - handle both formats:
    // 1. Old format: data at top level (formId, field1, field2, ...)
    // 2. New format: data nested (formId, data: { field1, field2 })
    const htmlFormId = body.formId || body.form?.id || body._id || 'unknown';
    const siteId = body.siteId || body.site?.id || body.site || 'unknown';
    const formName = body.formName || htmlFormId;
    const pageUrl = body.pageUrl || '';
    const pageTitle = body.pageTitle || '';
    const timestamp = body.timestamp || new Date().toISOString();

    console.log('[Submission Webhook] Form info:', { htmlFormId, siteId, formName, timestamp });

    // Find or create the form in Xano using html_form_id + site_id
    let numericFormId = 0;

    try {
      console.log('[Submission Webhook] 🔍 DIAGNOSTIC: Looking up form in Xano');
      console.log('[Submission Webhook] 🔍 DIAGNOSTIC: htmlFormId =', htmlFormId);
      console.log('[Submission Webhook] 🔍 DIAGNOSTIC: siteId =', siteId);
      console.log('[Submission Webhook] 🔍 DIAGNOSTIC: formName =', formName);
      
      // First, try to find existing form to get the user_id
      const allForms = await xanoForms.getAll();
      console.log('[Submission Webhook] 🔍 DIAGNOSTIC: Found', allForms.length, 'total forms in Xano');
      
      const existingForm = allForms.find(f => f.site_id === siteId && f.html_form_id === htmlFormId);
      console.log('[Submission Webhook] 🔍 DIAGNOSTIC: Existing form found:', existingForm ? 'YES' : 'NO');
      
      if (existingForm) {
        // Use existing form - don't create a duplicate!
        numericFormId = existingForm.id;
        console.log('[Submission Webhook] ✅ DIAGNOSTIC: Using existing form:', {
          id: existingForm.id,
          html_form_id: existingForm.html_form_id,
          site_id: existingForm.site_id,
          name: existingForm.name
        });
      } else {
        console.log('[Submission Webhook] 🔍 DIAGNOSTIC: No existing form found, using new architecture (NO form table dependency)');
        
        // No form record needed for submission storage
        numericFormId = 0; // Use 0 as placeholder since we don't need form table records
        console.log('[Submission Webhook] ✅ DIAGNOSTIC: Using new architecture - no form record needed');
      }
    } catch (error) {
      console.error('[Submission Webhook] ❌ DIAGNOSTIC: Error syncing form:', error);
      // Fallback to 0 if we can't get a proper form ID
      numericFormId = 0;
    }

    // Extract clean form data - handle both formats
    let cleanFormData;
    if (body.data && typeof body.data === 'object') {
      // New format: data is nested
      console.log('[Submission Webhook] Using nested data format');
      cleanFormData = body.data;
    } else {
      // Old format: data at top level - remove metadata fields
      console.log('[Submission Webhook] Using flat data format');
      const { formId: _, siteId: __, formName: ___, pageUrl: ____, pageTitle: _____, timestamp: ______, userAgent: _______, ...extractedData } = body;
      cleanFormData = extractedData;
    }

    console.log('[Submission Webhook] Clean form data:', JSON.stringify(cleanFormData, null, 2));
    
    // Normalize checkbox-like values to booleans and add HTML form ID to the submission data
    // NOTE: Only normalize actual checkbox values (on/off, true/false)
    // DO NOT normalize radio button labels like "Yes"/"No" - those should be preserved as-is
    const normalizeCheckbox = (val: any) => {
      if (val === true || val === false) return val;
      if (typeof val === 'string') {
        const v = val.toLowerCase();
        // Only convert actual checkbox values, not radio button labels
        if (v === 'on' || v === 'true') return true;
        if (v === 'off' || v === 'false') return false;
      }
      return val;
    };

    const dataNormalized: Record<string, any> = {};
    for (const [k, v] of Object.entries(cleanFormData || {})) {
      // Leave metadata untouched
      if (k.startsWith('_')) { dataNormalized[k] = v; continue; }
      const normalized = normalizeCheckbox(v);
      dataNormalized[k] = normalized;
    }

    const submissionDataWithMeta = {
      ...dataNormalized,
      _htmlFormId: htmlFormId,
      _formName: formName,
      _siteId: siteId,
      _pageUrl: pageUrl,
      _pageTitle: pageTitle
    };
    
    // Find the numeric site ID from the site table
    let numericSiteId: number | undefined;
    try {
      const { xanoSites } = await import('@/lib/xano');
      const site = await xanoSites.getByWebflowSiteId(siteId);
      if (site && site.id) {
        numericSiteId = site.id;
        console.log('[Submission Webhook] ✅ Found site ID:', numericSiteId, 'for webflow_site_id:', siteId);
      } else {
        console.log('[Submission Webhook] ⚠️ No site found for webflow_site_id:', siteId);
      }
    } catch (error) {
      console.error('[Submission Webhook] ❌ Error looking up site:', error);
    }

    // Store submission data in Xano
    // Note: We'll use a default user_id for now (1)
    // In production, you'd want to associate this with the actual site owner
    const savedSubmission = await xanoSubmissions.create(
      submissionDataWithMeta,
      numericFormId,
      1, // Default user_id
      numericSiteId // Numeric site reference
    );

    console.log('[Submission Webhook] ✅ Saved to Xano:', {
      submissionId: savedSubmission.id,
      formId: numericFormId,
      htmlFormId
    });

        // Send notification emails based on saved notification settings
        console.log('[Submission Webhook] 📧 Pre-check before sending emails...');
        
        // Check if SendGrid is configured
        const sendGridConfigured = !!process.env.SENDGRID_API_KEY;
        console.log('[Submission Webhook] SendGrid configured:', sendGridConfigured);
        
        if (!sendGridConfigured) {
          console.error('[Submission Webhook] ⚠️ CRITICAL: SendGrid API key not configured!');
          console.error('[Submission Webhook] 💡 Add SENDGRID_API_KEY to Netlify environment variables');
          console.error('[Submission Webhook] 💡 Submissions will be saved but emails will NOT be sent');
        }
        
        console.log('[Submission Webhook] 📧 About to call sendNotificationEmails for form:', numericFormId);
        console.log('[Submission Webhook] 📧 Form name:', formName);
        console.log('[Submission Webhook] 📧 Submission data keys:', Object.keys(submissionDataWithMeta || {}));
        try {
          // Send emails using the normalized data so checkboxes render as booleans
          console.log('[Submission Webhook] 📧 Calling sendNotificationEmails now...');
          await sendNotificationEmails(numericFormId.toString(), submissionDataWithMeta, formName, siteId, htmlFormId);
          if (sendGridConfigured) {
            console.log('[Submission Webhook] ✅ Email notifications sent successfully');
          } else {
            console.log('[Submission Webhook] ⚠️ Email send skipped - no SendGrid key');
          }
        } catch (emailError) {
          console.error('[Submission Webhook] ⚠️ Email sending failed:', emailError);
          console.log('[Submission Webhook] ⚠️ Error details:', emailError.message);
          console.log('[Submission Webhook] ⚠️ Error stack:', emailError.stack);
          console.log('[Submission Webhook] 📧 Email notifications are configured but SendGrid endpoint has issues');
          console.log('[Submission Webhook] 💡 Form submission was saved successfully to Xano');
          // Don't fail the whole request if email fails
        }

    return NextResponse.json({
      success: true,
      submissionId: savedSubmission.id,
      formId: numericFormId,
      message: 'Submission received and stored'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error: any) {
    console.error('[Submission Webhook] ❌ Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process submission' 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

/**
 * OPTIONS endpoint to handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * GET endpoint to verify webhook is working
 */
export async function GET() {
  return NextResponse.json({
    message: 'Webflow Form Submission Webhook Endpoint',
    endpoint: '/api/submissions/webhook',
    method: 'POST',
    status: 'active'
  });
}


