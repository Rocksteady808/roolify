'use client';

import { useEffect, useState } from 'react';
import ShadcnSidebar from '@/components/ShadcnSidebar';
import { SidebarProvider } from "@/components/ui/sidebar";
import FormSelect from '@/components/FormSelect';
import { ToastProvider, useToasts } from '@/components/ToastProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import { usePlanLimit } from '@/hooks/usePlanLimit';

// Use the app-wide toast provider



interface FormField {
  id: string;
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder: string;
  formId: string;
  fieldName: string;
  displayName: string;
  options?: string[];
  elementId?: string;
  formName: string;
  pageUrl: string;
  formWebflowId?: string;
  isWebflowForm?: boolean;
}

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface Action {
  id: string;
  action: string;
  target: string;
}

interface Rule {
  id?: string;
  name: string;
  formId: string;
  logicType: 'AND' | 'OR';
  conditions: Condition[];
  actions: Action[];
  isActive: boolean;
}

function RuleBuilderInner() {
  const { handlePlanLimitCheck, PlanLimitModalComponent, showPlanLimitModal } = usePlanLimit();
  
  // Helper function to detect if an ID is a MongoDB ObjectID (24 hex chars)
  const isMongoId = (id: string) => /^[0-9a-f]{24}$/i.test(id);
  
  const safeFetch = async (input: RequestInfo, init?: RequestInit) => {
    try {
      // Use the global fetch implementation instead of calling safeFetch recursively
      return await fetch(input, init);
    } catch (err) {
      console.error('Network fetch failed for', input, err);
      return null;
    }
  };
  // Get siteId from URL params or localStorage
  const [siteId, setSiteId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('siteId') || localStorage.getItem('selectedSiteId') || '';
    }
    return '';
  });
  const [forms, setForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [selectedFormFields, setSelectedFormFields] = useState<FormField[]>([]);
  const [designElements, setDesignElements] = useState<any[]>([]);
  const [savedRules, setSavedRules] = useState<any[]>([]);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { addToast } = useToasts();
  const success = (message: string) => addToast({ type: 'success', message });
  const error = (message: string) => addToast({ type: 'error', message });
  const [rule, setRule] = useState<Rule>({
    name: '',
    formId: '',
    logicType: 'AND',
    conditions: [
      { id: String(Date.now()), field: '', operator: 'is equal to', value: '' }
    ],
    actions: [
      { id: String(Date.now() + 1), action: 'Show', target: '' }
    ],
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [lastSuccessfulRefresh, setLastSuccessfulRefresh] = useState<number | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (siteId) {
      fetchForms();
    }
  }, [siteId]);

  // Listen for URL param changes (site switching)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    const urlSiteId = params.get('siteId') || localStorage.getItem('selectedSiteId') || '';
    
    if (urlSiteId && urlSiteId !== siteId) {
      console.log('[Rule Builder] Site changed from', siteId, 'to', urlSiteId);
      setSiteId(urlSiteId);
      // Reset state when site changes
      setSelectedForm('');
      setSelectedFormFields([]);
      setSavedRules([]);
      setEditingRule(null);
      setRule({
        name: '',
        formId: '',
        logicType: 'AND',
        conditions: [
          { id: String(Date.now()), field: '', operator: 'is equal to', value: '' }
        ],
        actions: [
          { id: String(Date.now() + 1), action: 'Show', target: '' }
        ],
        isActive: true
      });
    }
    
    // Listen for popstate events (browser back/forward)
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const newSiteId = params.get('siteId') || localStorage.getItem('selectedSiteId') || '';
      if (newSiteId !== siteId) {
        setSiteId(newSiteId);
        setSelectedForm('');
        setSelectedFormFields([]);
        setSavedRules([]);
        setEditingRule(null);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [siteId]);

  // Auto-refresh disabled to prevent flash/blank state issues
  // useEffect(() => {
  //   if (!siteId) return;

  //   const refreshInterval = setInterval(() => {
  //     console.log('[Rule Builder] Auto-refreshing forms with force refresh...');
  //     setLastRefreshTime(Date.now());
  //     fetchForms(); // This will use aggressive cache busting
  //   }, 10000); // 10 seconds - faster auto-refresh for quick updates

  //   return () => clearInterval(refreshInterval);
  // }, [siteId]);

  useEffect(() => {
    if (selectedForm) {
      const formFields = forms.find(form => form.id === selectedForm)?.fields || [];
      setSelectedFormFields(formFields);
      setRule(prev => ({ ...prev, formId: selectedForm }));
      
      // Only fetch saved rules if we're not currently editing a rule
      if (!editingRule) {
        fetchSavedRules(selectedForm);
      }
    } else {
      setSavedRules([]);
    }
  }, [selectedForm, forms, editingRule]);

  // SIMPLIFIED: Just use the form fields directly from the API (no complex merging)
  useEffect(() => {
    if (!selectedForm) {
      setSelectedFormFields([]);
      console.log('[Rule Builder] No form selected - clearing fields');
      return;
    }
    
    const form = forms.find(f => f.id === selectedForm);
    if (!form) {
      setSelectedFormFields([]);
      console.log('[Rule Builder] Form not found:', selectedForm);
      return;
    }
    
    const formFields = form?.fields || [];
    
    console.log('[Rule Builder] 🎯 Using form fields directly from API:', {
      formName: form.name,
      totalFields: formFields.length,
      fields: formFields.map((f: any) => ({
        id: f.id,
        elementId: f.elementId,
        name: f.displayName || f.name,
        type: f.type,
        hasOptions: f.options && f.options.length > 0,
        optionsCount: f.options?.length || 0
      }))
    });
    
    setSelectedFormFields(formFields as any);
  }, [selectedForm, forms]);

  const fetchForms = async (forceRefresh = false) => {
    try {
      // Use the siteId state, fallback to URL param if not set
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams('');
      const siteIdParam = siteId || params.get('siteId') || '';
      
      // Cache-busting timestamp when force refresh is triggered
      const cacheBuster = forceRefresh ? `&_refresh=${Date.now()}` : '';
      console.log('[Rule Builder] Fetching forms for siteId:', siteIdParam, 'with cache buster:', cacheBuster || 'none');

      // If we have a siteId, try to fetch forms with dynamic options first
      if (siteIdParam) {
        try {
          console.log('[Rule Builder] 🚀 Fetching forms with dynamic options...');
          
          const cacheBuster = `&_refresh=${Date.now()}&_force=${Math.random()}&_timestamp=${Date.now()}`;
          // Use dynamic options endpoint to get forms with field options
          const resp = await safeFetch(`/api/forms/dynamic-options?siteId=${encodeURIComponent(siteIdParam)}${cacheBuster}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (resp && resp.ok) {
            const data = await resp.json();
            const formsArray = data.forms || [];
            
            console.log(`[Rule Builder] ✅ Received ${formsArray.length} forms with dynamic options from API`);
            console.log(`[Rule Builder] 📊 Select options found: ${data.selectOptions?.length || 0}`);
            
            // Transform forms to expected format with enhanced fields
            const items = formsArray.map((f: any) => {
              return {
                id: f.id,
                name: f.name,
                fields: f.fields || [] // Fields now include options for select fields
              };
            });
            
            // try to fetch scanned design elements for this site and merge later
            try {
              const elementsResp = await safeFetch(`/api/webflow/site/${encodeURIComponent(siteIdParam)}/elements${forceRefresh ? '?_refresh=' + Date.now() : ''}`);
              if (elementsResp && elementsResp.ok) {
                const elData = await elementsResp.json();
                setDesignElements(elData.elements || []);
                console.log(`[Rule Builder] Loaded ${elData.elements?.length || 0} design elements`);
              } else {
                console.log(`[Rule Builder] No design elements found (${elementsResp?.status || 'error'}) - this is normal for new sites`);
                setDesignElements([]);
              }
            } catch (e) {
              console.log(`[Rule Builder] Design elements fetch failed - this is normal for new sites:`, e);
              setDesignElements([]);
            }
            
            setForms(items);
            console.log('[Rule Builder] ✅ Loaded', items.length, 'forms with dynamic options');
            
            // DIAGNOSTIC: Show exactly what forms and fields are appearing
            console.log('[Rule Builder] 🔍 DIAGNOSTIC - Forms with dynamic options:');
            console.log('[Rule Builder] 📊 Total forms:', items.length);
            items.forEach((form: any, index: number) => {
              console.log(`[Rule Builder] 📋 Form ${index + 1}:`, {
                id: form.id,
                name: form.name,
                fieldCount: form.fields?.length || 0,
                fields: form.fields?.map((f: any) => ({
                  name: f.name,
                  type: f.type,
                  hasOptions: f.options && f.options.length > 0,
                  optionsCount: f.options?.length || 0
                })) || []
              });
            });
            
            setLoading(false);
            return;
          } else {
            console.log(`[Rule Builder] ❌ Dynamic options API failed with status: ${resp?.status}`);
          }
        } catch (err) {
          console.warn('Failed to fetch forms with dynamic options:', err);
        }
      }

      // Fallback: Use Webflow API directly (already filtered on server)
      console.log('[Rule Builder] Main endpoint failed - trying Webflow API fallback');

      try {
        // NOTE: Server-side filtering now handles all filtering and deduplication
        // in /api/webflow/site/[siteId]/forms

        // Use Webflow API directly with cache-busting
        const cacheBuster = `?_refresh=${Date.now()}&_force=${Math.random()}&_timestamp=${Date.now()}`;
        const webflowResp = await safeFetch(`/api/webflow/site/${encodeURIComponent(siteIdParam)}/forms${cacheBuster}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (webflowResp && webflowResp.ok) {
          const webflowData = await webflowResp.json();
          const webflowForms = webflowData.forms?.forms || webflowData.forms || [];

          console.log('[Rule Builder] ✅ Using pre-filtered forms from Webflow API:', webflowForms.length);

          if (webflowForms.length > 0) {
            // Forms are already filtered and deduplicated by server!
            // Convert Webflow form format to FormMeta format
            const items = webflowForms.map((f: any) => {
              // Convert fields object to array
              const fieldsArray = f.fields ? Object.entries(f.fields).map(([fieldId, fieldData]: [string, any]) => ({
                id: fieldId,
                name: fieldData.displayName || fieldData.name || fieldId,
                type: (fieldData.type || '').toString().toLowerCase(),
                displayName: fieldData.displayName || fieldData.name || fieldId,
                elementId: fieldData._id || undefined,
                options: Array.isArray(fieldData.options) ? fieldData.options.map((o: any) => o.label || o.name || o) : undefined
              })) : [];

              return {
                id: f.id || f._id,
                name: f.displayName || f.name || f.slug || f.id,
                fields: fieldsArray
              };
            });
            
            setForms(items);
            
            // DIAGNOSTIC: Show exactly what forms are appearing from fallback
            console.log('[Rule Builder] 🔍 DIAGNOSTIC - Forms from Webflow API fallback:');
            console.log('[Rule Builder] 📊 Total forms:', items.length);
            items.forEach((form: any, index: number) => {
              console.log(`[Rule Builder] 📋 Form ${index + 1}:`, {
                id: form.id,
                name: form.name,
                fieldCount: form.fields?.length || 0,
                fields: form.fields?.map((f: any) => f.name) || []
              });
            });
            
            setLoading(false);
            return;
          }
        }
      } catch (fallbackErr) {
        console.warn('[Rule Builder] Fallback also failed:', fallbackErr);
      }
      
      // If all else fails, set empty forms
      console.log('[Rule Builder] All endpoints failed - setting empty forms list');
      setForms([]);
      setLoading(false);
    } catch (e) {
      console.error('Error fetching forms:', e);
      setForms([]);
      setLoading(false);
    }
  };

  const fetchSavedRules = async (formId: string) => {
    try {
      const response = await safeFetch(`/api/form-rules/form/${formId}`);
      if (response && response.ok) {
        const data = await response.json();
        const rules = Array.isArray(data.rules) ? data.rules : Array.isArray(data) ? data : [];
        setSavedRules(rules);
      } else {
        setSavedRules([]);
      }
    } catch (e) {
      console.error('Error fetching saved rules:', e);
      setSavedRules([]);
    }
  };

  const refreshForms = async () => {
    console.log('[Refresh] 🔄 REFRESH BUTTON CLICKED!');
    setIsRefreshing(true);
    setRefreshError(null);
    console.log('[Refresh] Starting HARD REFRESH with cache-busting...');

    // Clear current form selection to force re-render
    const currentForm = selectedForm;

    // Capture before state for comparison
    const beforeForm = forms.find((f: any) => f.id === currentForm);
    const beforeFields = beforeForm?.fields?.map((f: any) => f.elementId || f.id) || [];

    try {
      // Force cache-busting refresh
      console.log('[Refresh] Calling fetchForms(true) with cache-busting...');
      console.log('[Refresh] 🧹 Clearing Webflow API cache...');
      console.log('[Refresh] 🧹 Forcing fresh HTML scan...');

      await fetchForms(true);

      console.log('[Refresh] fetchForms completed. Forms count:', forms.length);

      if (currentForm) {
        console.log('[Refresh] Reloading rules for form:', currentForm);
        await fetchSavedRules(currentForm);

        // Compare before and after to show what changed
        const afterForm = forms.find((f: any) => f.id === currentForm);
        const afterFields = afterForm?.fields?.map((f: any) => f.elementId || f.id) || [];

        const added = afterFields.filter((id: any) => !beforeFields.includes(id));
        const removed = beforeFields.filter((id: any) => !afterFields.includes(id));

        console.log('[Refresh] 📊 Changes detected:', {
          before: beforeFields.length,
          after: afterFields.length,
          added: added.length,
          removed: removed.length
        });

        // Log the updated form fields
        console.log('[Refresh] ✅ Updated form fields:', afterForm?.fields?.map((f: any) => ({
          name: f.displayName || f.name,
          type: f.type,
          id: f.id,
          elementId: f.elementId
        })));

        // Provide simple feedback without mentioning what was added/removed
        success('Cache cleared! Form data refreshed from Webflow.');
      } else {
        success('Cache cleared! Form data refreshed from Webflow.');
      }

      // Set successful refresh timestamp
      setLastSuccessfulRefresh(Date.now());
      console.log('[Refresh] ✅ Hard refresh complete. Total forms:', forms.length);
    } catch (e) {
      console.error('[Refresh] ❌ Error refreshing forms:', e);
      setRefreshError((e as Error).message || 'Failed to refresh form data');
      error('Failed to refresh form data');
    } finally {
      setIsRefreshing(false);
      console.log('[Refresh] Refresh state reset. isRefreshing:', false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const response = await safeFetch(`/api/form-rules/form/${selectedForm}?ruleId=${ruleId}`, { method: 'DELETE' });
      if (response && response.ok) {
        success('Rule deleted successfully!');
        fetchSavedRules(selectedForm);
      } else {
        error('Error deleting rule');
      }
    } catch (err) {
      console.error('Error deleting rule:', err);
      error('Error deleting rule');
    }
  };

  const publishRule = async (ruleId: string) => {
    try {
      const response = await safeFetch(`/api/form-rules/form/${selectedForm}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, status: 'active' })
      });
      if (response && response.ok) {
        success('Rule published successfully! It will be applied to your live site automatically.');
        fetchSavedRules(selectedForm);
      } else {
        error('Error publishing rule');
      }
    } catch (err) {
      console.error('Error publishing rule:', err);
      error('Error publishing rule');
    }
  };

  const editRule = (savedRule: any) => {
    console.log('[Rule Builder] Editing rule:', savedRule);
    
    // Handle both old and new rule structures
    const conditions: Condition[] = (savedRule.conditions || []).map((ruleCondition: any) => {
      // Extract field ID (try new structure first, then old)
      const fieldId = ruleCondition.fieldId || savedRule.triggerField || '';
      // Extract operator (try new structure first, then old)
      const operator = ruleCondition.operator || savedRule.condition || '==';
      // Extract value (try new structure first, then old)
      let conditionValue = ruleCondition.value || savedRule.conditionValue || '';
      
      // Normalize value for UI display
      console.log(`[Rule Builder] Original condition value: "${conditionValue}"`);
      if (conditionValue === 'Yes' || conditionValue === 'yes' || conditionValue === 'true') {
        conditionValue = 'true';
        console.log(`[Rule Builder] Normalized to: "${conditionValue}"`);
      } else if (conditionValue === 'No' || conditionValue === 'no' || conditionValue === 'false') {
        conditionValue = 'false';
        console.log(`[Rule Builder] Normalized to: "${conditionValue}"`);
      }
      
      // Normalize operator to UI format
      let normalizedOperator = operator;
      if (operator === '==' || operator === 'equals') normalizedOperator = 'is equal to';
      else if (operator === '!=' || operator === 'not_equals') normalizedOperator = 'is not equal to';
      else if (operator === 'contains') normalizedOperator = 'contains';
      else if (operator === 'not_contains') normalizedOperator = 'does not contain';
      else if (operator === 'is_greater_than' || operator === '>') normalizedOperator = 'is greater than';
      else if (operator === 'is_less_than' || operator === '<') normalizedOperator = 'is less than';
      else normalizedOperator = operator; // Keep as-is if unknown
      
      return {
        id: Date.now().toString() + Math.random(),
        field: fieldId,
        operator: normalizedOperator,
        value: conditionValue
      };
    });
    
    const actions: Action[] = (savedRule.actions || []).map((ruleAction: any) => {
      // Extract action type (try new structure first, then old)
      const actionType = ruleAction.type || savedRule.action || 'show';
      // Extract target (try new structure first, then old)
      const targetField = ruleAction.targetFieldId || savedRule.targetField || '';
      
      // Normalize action to UI format
      let normalizedAction = actionType;
      if (actionType === 'show') normalizedAction = 'Show';
      else if (actionType === 'hide') normalizedAction = 'Hide';
      else if (actionType === 'enable') normalizedAction = 'Enable';
      else if (actionType === 'disable') normalizedAction = 'Disable';
      
      return {
        id: Date.now().toString() + Math.random(),
        action: normalizedAction,
        target: targetField
      };
    });
    
    // Fallback to single condition/action if arrays are empty (old structure)
    if (conditions.length === 0) {
      const fieldId = savedRule.triggerField || '';
      const operator = savedRule.condition || '==';
      const conditionValue = savedRule.conditionValue || '';
      
      let normalizedOperator = operator;
      if (operator === '==') normalizedOperator = 'is equal to';
      else if (operator === '!=') normalizedOperator = 'is not equal to';
      
      conditions.push({
        id: Date.now().toString(),
        field: fieldId,
        operator: normalizedOperator,
        value: conditionValue
      });
    }
    
    if (actions.length === 0) {
      const actionType = savedRule.action || 'show';
      const targetField = savedRule.targetField || '';
      
      let normalizedAction = actionType.charAt(0).toUpperCase() + actionType.slice(1).toLowerCase();
      
      actions.push({
        id: Date.now().toString(),
        action: normalizedAction,
        target: targetField
      });
    }
    
    console.log('[Rule Builder] Parsed conditions:', conditions);
    console.log('[Rule Builder] Parsed actions:', actions);
    console.log('[Rule Builder] Available form fields:', selectedFormFields.map(f => ({ id: f.id, name: f.name, elementId: f.elementId })));
    console.log('[Rule Builder] Setting form ID to:', savedRule.formId);
    console.log('[Rule Builder] Available forms:', forms.map(f => ({ id: f.id, name: f.name })));
    console.log('[Rule Builder] Rule data structure:', {
      id: savedRule.id,
      name: savedRule.name,
      formId: savedRule.formId,
      conditions: conditions.length,
      actions: actions.length
    });
    console.log('[Rule Builder] Full saved rule data:', savedRule);
    
    // Set the selected form and wait for fields to load
    // The API now returns the correct Webflow HTML form ID in savedRule.formId
    setSelectedForm(savedRule.formId);
    
    // Wait for form fields to load, then set rule data
    const waitForFieldsAndSetRule = () => {
      // Find the form to get its fields using the form ID from the saved rule
      const form = forms.find(f => f.id === savedRule.formId);
      if (form && form.fields && form.fields.length > 0) {
        console.log('[Rule Builder] Form fields loaded, setting rule data...');
        console.log('[Rule Builder] Available form fields:', form.fields.map((f: any) => ({ id: f.id, name: f.name, elementId: f.elementId })));
        
        // Map condition fields to form field IDs using the same logic as dropdown options
        const mappedConditions = conditions.map(condition => {
          // Use the same field value calculation as the dropdown options
          const matchingField = form.fields.find((f: any) => {
            const fieldValue = f.elementId || f.fieldName || f.name || (isMongoId(f.id) ? '' : f.id);
            return fieldValue === condition.field;
          });
          
          // If not found with exact match, try alternative matching strategies
          let finalFieldValue = condition.field;
          if (!matchingField) {
            const altMatch = form.fields.find((f: any) => 
              f.id === condition.field || 
              f.elementId === condition.field ||
              f.name === condition.field ||
              f.name?.toLowerCase().replace(/\s+/g, '-') === condition.field?.toLowerCase() ||
              f.id?.toLowerCase().replace(/\s+/g, '-') === condition.field?.toLowerCase()
            );
            
            if (altMatch) {
              // Use the same field value calculation as dropdown options
              finalFieldValue = altMatch.elementId || altMatch.fieldName || altMatch.name || (isMongoId(altMatch.id) ? '' : altMatch.id);
            }
          }
          
          console.log(`[Rule Builder] Mapping condition field "${condition.field}" to:`, finalFieldValue);
          
          return {
            ...condition,
            field: finalFieldValue
          };
        });
        
        // Map action fields to form field IDs using the same logic as dropdown options
        const mappedActions = actions.map(action => {
          // Use the same field value calculation as the dropdown options
          const matchingField = form.fields.find((f: any) => {
            const fieldValue = f.elementId || f.fieldName || f.name || (isMongoId(f.id) ? '' : f.id);
            return fieldValue === action.target;
          });
          
          // If not found with exact match, try alternative matching strategies
          let finalFieldValue = action.target;
          if (!matchingField) {
            const altMatch = form.fields.find((f: any) => 
              f.id === action.target || 
              f.elementId === action.target ||
              f.name === action.target ||
              f.name?.toLowerCase().replace(/\s+/g, '-') === action.target?.toLowerCase() ||
              f.id?.toLowerCase().replace(/\s+/g, '-') === action.target?.toLowerCase()
            );
            
            if (altMatch) {
              // Use the same field value calculation as dropdown options
              finalFieldValue = altMatch.elementId || altMatch.fieldName || altMatch.name || (isMongoId(altMatch.id) ? '' : altMatch.id);
            }
          }
          
          console.log(`[Rule Builder] Mapping action field "${action.target}" to:`, finalFieldValue);
          
          return {
            ...action,
            target: finalFieldValue
          };
        });
        
        console.log('[Rule Builder] Mapped conditions:', mappedConditions);
        console.log('[Rule Builder] Mapped actions:', mappedActions);
        
        // Debug: Check if any fields are still empty
        const emptyConditions = mappedConditions.filter(c => !c.field);
        const emptyActions = mappedActions.filter(a => !a.target);
        
        if (emptyConditions.length > 0 || emptyActions.length > 0) {
          console.warn('[Rule Builder] Some fields could not be mapped:', {
            emptyConditions: emptyConditions.length,
            emptyActions: emptyActions.length,
            availableFields: form.fields.map((f: any) => ({
              id: f.id,
              name: f.name,
              elementId: f.elementId,
              fieldName: f.fieldName,
              dropdownValue: f.elementId || f.fieldName || f.name || (isMongoId(f.id) ? '' : f.id)
            }))
          });
        }
        
        // Set the rule data with the mapped fields
        setRule({ 
          id: savedRule.id, 
          name: savedRule.name || `Rule ${savedRule.id}`, 
          formId: savedRule.formId,
          logicType: savedRule.logicType || 'AND',
          conditions: mappedConditions, 
          actions: mappedActions, 
          isActive: savedRule.isActive !== false 
        });
        setEditingRule(savedRule.id.toString());
        success('Rule loaded for editing');
      } else {
        // If fields not loaded yet, wait a bit more
        console.log('[Rule Builder] Form fields not loaded yet, retrying...');
        setTimeout(waitForFieldsAndSetRule, 100);
      }
    };
    
    // Start waiting for fields
    setTimeout(waitForFieldsAndSetRule, 100);
  };

  const addCondition = () => {
    const newCondition: Condition = { id: Date.now().toString(), field: '', operator: 'is equal to', value: '' };
    setRule(prev => ({ ...prev, conditions: [...prev.conditions, newCondition] }));
  };

  const removeCondition = (conditionId: string) => {
    setRule(prev => ({ ...prev, conditions: prev.conditions.filter(c => c.id !== conditionId) }));
  };

  const updateCondition = (conditionId: string, field: string, value: string) => {
    console.log(`[Rule Builder] updateCondition: ${conditionId}, ${field} = "${value}"`);
    setRule(prev => ({ ...prev, conditions: prev.conditions.map((c: any) => c.id === conditionId ? { ...c, [field]: value } : c) }));
  };

  const addAction = () => {
    const newAction: Action = { id: Date.now().toString(), action: 'Show', target: '' };
    setRule(prev => ({ ...prev, actions: [...prev.actions, newAction] }));
  };

  const removeAction = (actionId: string) => {
    setRule(prev => ({ ...prev, actions: prev.actions.filter(a => a.id !== actionId) }));
  };

  const updateAction = (actionId: string, field: string, value: string) => {
    setRule(prev => ({ ...prev, actions: prev.actions.map((a: any) => a.id === actionId ? { ...a, [field]: value } : a) }));
  };

  const clearRule = () => {
    setRule({ 
      name: '', 
      formId: selectedForm,
      logicType: 'AND',
      conditions: [{ id: String(Date.now()), field: '', operator: 'is equal to', value: '' }], 
      actions: [{ id: String(Date.now() + 1), action: 'Show', target: '' }], 
      isActive: true 
    });
    setEditingRule(null);
  };
  
  const cancelEdit = () => {
    clearRule();
    success('Edit cancelled');
  };
  
  const formatRuleDescription = (savedRule: any) => {
    // Format all conditions with AND/OR logic
    const conditions = savedRule.conditions || [];
    const logicType = savedRule.logicType || 'AND';
    
    const conditionTexts = conditions.map((condition: any) => {
      const fieldId = condition.fieldId || savedRule.triggerField || 'Unknown Field';
      const operator = condition.operator || savedRule.condition || '==';
      const value = condition.value || savedRule.conditionValue || '';
      
      // Find the field display name
      const field = selectedFormFields.find(f => 
        f.id === fieldId || 
        f.elementId === fieldId || 
        f.name === fieldId ||
        f.displayName === fieldId
      );
      const fieldDisplayName = field?.displayName || field?.name || fieldId;
      
      // Convert operator to readable format
      let operatorText = operator;
      if (operator === '==') operatorText = 'is equal to';
      else if (operator === '!=') operatorText = 'is not equal to';
      else if (operator === 'contains') operatorText = 'contains';
      else if (operator === 'not_contains') operatorText = 'does not contain';
      else if (operator === 'is_empty') operatorText = 'is empty';
      else if (operator === 'is_not_empty') operatorText = 'is not empty';
      
      return `"${fieldDisplayName}" ${operatorText} "${value}"`;
    });
    
    // Join conditions with AND/OR
    const conditionText = conditionTexts.length > 0 
      ? `When ${conditionTexts.join(` ${logicType} `)}`
      : 'No conditions';
    
    // Format all actions
    const actions = savedRule.actions || [];
    const actionDescriptions = actions.map((action: any) => {
      const actionType = action.type || savedRule.action || 'show';
      const targetField = action.targetFieldId || savedRule.targetField || 'Unknown Element';
      
      // Find the target element display name
      const targetElement = selectedFormFields.find(f => 
        f.id === targetField || 
        f.elementId === targetField || 
        f.name === targetField ||
        f.displayName === targetField
      );
      const targetDisplayName = targetElement?.displayName || targetElement?.name || targetField;
      
      // Capitalize action
      const actionText = actionType.charAt(0).toUpperCase() + actionType.slice(1).toLowerCase();
      
      return `${actionText} "${targetDisplayName}"`;
    });
    
    return {
      condition: conditionText,
      actions: actionDescriptions
    };
  };

  const checkForConflicts = () => {
    // Check if there are existing rules on the same form with overlapping conditions
    const conflictingRules = savedRules.filter(savedRule => {
      // Skip if editing the same rule
      if (editingRule && savedRule.id === editingRule) return false;
      
      // Check if it's the same form
      if (savedRule.formId !== rule.formId) return false;
      
      // Check if any condition overlaps
      const savedConditions = savedRule.conditions || [];
      const currentConditions = rule.conditions || [];
      
      for (const currentCond of currentConditions) {
        for (const savedCond of savedConditions) {
          // If they're watching the same field
          if (currentCond.field === savedCond.fieldId) {
            // And the same value
            if (currentCond.value === savedCond.value) {
              return true; // Conflict found!
            }
          }
        }
      }
      return false;
    });
    
    return conflictingRules;
  };

  const createRule = async (status: 'active' | 'draft' = 'active') => {
    try {
      setIsSaving(true); // Start saving animation
      
      if (status === 'active' && (!rule.formId || rule.conditions.length === 0 || rule.actions.length === 0)) {
        error('Please select a form, add at least one condition, and one action');
        setIsSaving(false);
        return;
      }
      if (status === 'draft' && !rule.formId) {
        error('Please select a form to save as draft');
        setIsSaving(false);
        return;
      }

      // Check plan limits before creating new rules (not for drafts or editing)
      if (!editingRule && status === 'active') {
        const canProceed = await handlePlanLimitCheck('rules', 1);
        if (!canProceed) {
          setIsSaving(false);
          return;
        }
      }

      // Check for conflicts (only for new rules, not when editing)
      if (!editingRule && status === 'active') {
        const conflicts = checkForConflicts();
        if (conflicts.length > 0) {
          const conflictNames = conflicts.map((r: any) => r.name || 'Unnamed Rule').join(', ');
          const confirmCreate = window.confirm(
            `⚠️ Potential Conflict Detected!\n\n` +
            `This rule may conflict with: ${conflictNames}\n\n` +
            `Both rules are watching the same field and value. This could cause unexpected behavior.\n\n` +
            `Suggestion: Instead of creating a new rule, consider editing the existing rule and adding more actions to it.\n\n` +
            `Do you want to create this rule anyway?`
          );
          if (!confirmCreate) {
            return;
          }
        }
      }

      // Validate that no MongoDB ObjectIDs are being used
      const invalidFields = rule.conditions
        .map(c => c.field)
        .concat(rule.actions.map(a => a.target))
        .filter(fieldId => isMongoId(fieldId));

      if (invalidFields.length > 0) {
        error('Cannot save rule: Some fields have invalid IDs. Please refresh the form data and try again.');
        setIsSaving(false);
        return;
      }

      if (editingRule) {
        // Build the rule with proper conditions and actions structure
        const conditions = rule.conditions.map((condition: any) => {
          // Convert UI-friendly operators to backend format
          let operator = condition.operator;
          if (operator === 'is equal to') operator = '==';
          else if (operator === 'is not equal to') operator = '!=';
          else if (operator === 'does not contain') operator = 'not_contains';
          else if (operator === 'is greater than') operator = 'is_greater_than';
          else if (operator === 'is less than') operator = 'is_less_than';
          
          return {
            id: String(Date.now() + Math.random()),
            fieldId: condition.field,
            operator,
            value: condition.value
          };
        });
        
        const actions = rule.actions.map((action: any) => ({
          id: String(Date.now() + Math.random()),
          type: action.action.toLowerCase(),
          targetFieldId: action.target
        }));
        
        const response = await safeFetch(`/api/form-rules/form/${rule.formId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruleId: editingRule,
            name: rule.name,
            logicType: rule.logicType,
            conditions,
            actions,
            status
          })
        });
        if (response && response.ok) {
          success(status === 'active' ? 'Rule updated successfully! It will be applied to your live site automatically.' : 'Draft updated successfully! You can continue editing later.');
          clearRule();
          fetchSavedRules(selectedForm);
        } else {
          error('Error updating rule');
        }
      } else {
        // Build the rule with proper conditions and actions structure
        const conditions = rule.conditions.map((condition: any) => {
          // Convert UI-friendly operators to backend format
          let operator = condition.operator;
          if (operator === 'is equal to') operator = '==';
          else if (operator === 'is not equal to') operator = '!=';
          else if (operator === 'does not contain') operator = 'not_contains';
          else if (operator === 'is greater than') operator = 'is_greater_than';
          else if (operator === 'is less than') operator = 'is_less_than';
          
          return {
            id: String(Date.now() + Math.random()),
            fieldId: condition.field,
            operator,
            value: condition.value
          };
        });
        
        const actions = rule.actions.map((action: any) => ({
          id: String(Date.now() + Math.random()),
          type: action.action.toLowerCase(),
          targetFieldId: action.target
        }));
        
        const response = await safeFetch(`/api/form-rules/form/${rule.formId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            formId: rule.formId,
            siteId: siteId, // Pass the siteId from the rule builder
            logicType: rule.logicType,
            conditions, 
            actions,
            status 
          })
        });
        if (response && response.ok) {
          const result = await response.json();
          success(status === 'active' ? 'Rule created successfully! It will be applied to your live site automatically.' : 'Draft saved successfully! You can continue editing later.');
          clearRule();
          fetchSavedRules(selectedForm);
        } else {
          // Check if it's a plan limit error
          if (response && response.status === 403) {
            try {
              const errorData = await response.json();
              if (errorData.showUpgradeModal) {
                // Show the plan limit modal with the error data
                showPlanLimitModal(
                  errorData.limitType || 'rules',
                  errorData.currentCount || 0,
                  errorData.maxLimit || 0,
                  errorData.planName || 'Current Plan'
                );
                return;
              }
            } catch (e) {
              // Fall through to generic error
            }
          }
          // Only show error if it's not a plan limit issue
          if (response && response.status !== 403) {
            error('Error creating rule');
          }
        }
      }
    } catch (err) {
      console.error('Error saving rule:', err);
      error('Error saving rule');
    } finally {
      setIsSaving(false); // End saving animation
    }
  };

  const operators = [
    'is equal to',
    'is not equal to',
    'contains',
    'does not contain',
    'is empty',
    'is not empty',
    'is greater than',
    'is less than'
  ];

  const actions = [
    'Show',
    'Hide',
    'Enable',
    'Disable',
    'Require',
    'Make Optional'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Saving Animation */}
      {isSaving && (
        <div className="fixed inset-0 bg-gray-50 bg-opacity-90 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-sm mx-4">
            <div className="relative">
              {/* Spinning loader */}
              <div className="w-12 h-12 border-3 border-indigo-200 rounded-full animate-spin border-t-indigo-600 mx-auto mb-4"></div>

              {/* Text */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {editingRule ? 'Updating Rule...' : 'Creating Rule...'}
              </h3>
              <p className="text-sm text-gray-600">
                Please wait while we save your conditional logic
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        <SidebarProvider>
          <ShadcnSidebar />
          <main className={`relative flex w-full flex-1 flex-col bg-gray-50 px-4 lg:px-6 pt-20 lg:pt-8 pb-8 overflow-x-hidden transition-all duration-150 ease-in-out ${isSaving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="max-w-7xl w-full mx-auto">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">Rule Builder</h1>
              <p className="text-sm text-gray-600 mb-6">Create and manage conditional logic for your forms</p>

            {editingRule && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-900">
                    Editing Rule: {rule.name || 'Unnamed Rule'}
                  </span>
                </div>
                <button onClick={cancelEdit} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Cancel
                </button>
              </div>
            )}

            <div className="space-y-6">
              <div className="bg-white border rounded p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-900">Target Form</label>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={refreshForms}
                      disabled={isRefreshing}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      title="Refresh existing form data (no syncing)"
                    >
                      <svg
                        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>

                    {/* Refresh Status Indicator */}
                    {(isRefreshing || lastSuccessfulRefresh || refreshError) && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
                        {isRefreshing && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span>Refreshing form elements...</span>
                          </div>
                        )}
                        {!isRefreshing && lastSuccessfulRefresh && (
                          <div className="flex items-center gap-1" title={new Date(lastSuccessfulRefresh).toLocaleString()}>
                            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Refreshed {(() => {
                              const seconds = Math.floor((Date.now() - lastSuccessfulRefresh) / 1000);
                              if (seconds < 60) return 'just now';
                              const minutes = Math.floor(seconds / 60);
                              if (minutes < 60) return `${minutes}m ago`;
                              const hours = Math.floor(minutes / 60);
                              return `${hours}h ago`;
                            })()}</span>
                          </div>
                        )}
                        {refreshError && (
                          <div className="flex items-center gap-1 text-red-500" title={refreshError}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>Refresh failed</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <FormSelect className={`w-full border px-3 py-2 rounded min-w-0 ${selectedForm ? 'text-gray-800' : 'text-gray-600'}`} value={selectedForm} onChange={(e) => setSelectedForm(e.target.value)}>
                  <option value="">Select Form</option>
                  {forms
                    .filter((form: any) => !form.name.toLowerCase().includes('test'))
                    .map((form: any) => {
                      const formName = form.name;
                      const truncatedName = formName.length > 40 ? formName.substring(0, 40) + '...' : formName;
                      return (
                        <option key={form.id} value={form.id} title={formName}>{truncatedName}</option>
                      );
                    })}
                </FormSelect>
              </div>

              <div className="bg-white border rounded p-6">
                <div className="text-lg font-semibold text-gray-900 mb-2">Rule Logic</div>
                <div className="text-sm text-gray-700 mb-4">Define when this rule should trigger and what actions to perform</div>

                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-sm font-medium text-gray-900">When</div>
                    <select
                      value={rule.logicType}
                      onChange={(e) => setRule(prev => ({ ...prev, logicType: e.target.value as 'AND' | 'OR' }))}
                      className="px-3 py-2 border rounded-md bg-white text-sm text-gray-800"
                    >
                      <option value="AND">All conditions match (AND)</option>
                      <option value="OR">Any condition matches (OR)</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    {rule.conditions.map((condition) => (
                      <div key={condition.id} className="bg-gray-50 p-3 sm:p-4 rounded border" style={{ backgroundColor: 'rgb(241, 245, 249)' }}>
                        <div className="mb-2 text-sm font-medium text-gray-700">Condition</div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                          <div className="w-full sm:flex-1 min-w-0">
                            <label className="block sm:hidden text-xs text-gray-600 mb-1">Field</label>
                            <FormSelect style={{ backgroundColor: 'rgb(255, 255, 255)' }} value={condition.field} onChange={(e) => updateCondition(condition.id, 'field', e.target.value)} className={`border px-3 h-10 rounded w-full min-w-0 ${condition.field ? 'text-gray-800' : 'text-gray-600'}`}>
                              <option value="">Select Field</option>
                              {selectedFormFields.map((field) => {
                                const fieldName = field.displayName || field.name;
                                const truncatedName = fieldName.length > 30 ? fieldName.substring(0, 30) + '...' : fieldName;
                                
                                // Prefer elementId, then fieldName, then field.id (but avoid MongoDB IDs)
                                const fieldValue = field.elementId || 
                                                 field.fieldName || 
                                                 field.name ||
                                                 (isMongoId(field.id) ? '' : field.id);
                                
                                console.log(`[Rule Builder] Field option:`, {
                                  id: field.id,
                                  name: fieldName,
                                  elementId: field.elementId,
                                  fieldName: field.fieldName,
                                  fieldValue,
                                  isMongoId: isMongoId(field.id)
                                });
                                
                                return (
                                  <option key={field.id} value={fieldValue} title={fieldName}>
                                    {truncatedName} ({field.type})
                                  </option>
                                );
                              })}
                            </FormSelect>
                          </div>

                          <div className="w-full sm:flex-1 min-w-0">
                            <label className="block sm:hidden text-xs text-gray-600 mb-1">Operator</label>
                            <FormSelect style={{ backgroundColor: 'rgb(255, 255, 255)' }} value={condition.operator} onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)} className="px-3 h-10 border rounded w-full min-w-0">
                              {operators.map((op) => <option key={op} value={op}>{op}</option>)}
                            </FormSelect>
                          </div>

                          {(() => {
                            // Match using same priority as dropdown: elementId || id
                            let selectedField = selectedFormFields.find(field => {
                              const fieldValue = field.elementId || field.id;
                              return fieldValue === condition.field;
                            });
                            
                            // If not found, try alternative matching strategies
                            if (!selectedField) {
                              selectedField = selectedFormFields.find(field => 
                                field.id === condition.field || 
                                field.elementId === condition.field || 
                                field.name === condition.field ||
                                field.displayName === condition.field ||
                                field.fieldName === condition.field
                              );
                            }
                            
                            console.log('[Rule Builder] Looking for field with ID:', condition.field);
                            console.log('[Rule Builder] Available fields:', selectedFormFields.map((f: any) => ({id: f.id, elementId: f.elementId, name: f.name, displayName: f.displayName, type: f.type, hasOptions: f.options && f.options.length > 0, options: f.options})));
                            console.log('[Rule Builder] Selected field for value input:', selectedField);
                            console.log('[Rule Builder] Selected field options:', selectedField?.options);
                            
                            // Check if field is text-based (should show text input)
                            const isTextBasedField = selectedField && [
                              'text', 'email', 'textarea', 'number', 'tel', 'url', 'password', 
                              'plain', 'input', 'date', 'time', 'datetime-local', 'search'
                            ].includes(selectedField.type);
                            
                            // If it's a text-based field, show a text input
                            if (isTextBasedField) {
                              console.log('[Rule Builder] Rendering text input for field type:', selectedField?.type);
                              return (
                                <div className="w-full sm:flex-1 min-w-0">
                                  <label className="block sm:hidden text-xs text-gray-600 mb-1">Value</label>
                                  <input
                                    type="text"
                                    style={{ backgroundColor: 'rgb(255, 255, 255)' }}
                                    value={condition.value}
                                    onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                                    className="border px-3 h-10 rounded w-full min-w-0 text-gray-800"
                                    placeholder="Enter value..."
                                  />
                                </div>
                              );
                            }
                            
                            // Otherwise, show a dropdown for select/radio/checkbox fields
                            console.log('[Rule Builder] Rendering dropdown for field');
                            
                            return (
                              <div className="w-full sm:flex-1 min-w-0">
                                <label className="block sm:hidden text-xs text-gray-600 mb-1">Value</label>
                                <FormSelect 
                                  style={{ backgroundColor: 'rgb(255, 255, 255)' }} 
                                  value={condition.value} 
                                  onChange={(e) => updateCondition(condition.id, 'value', e.target.value)} 
                                  className={`border px-3 h-10 rounded w-full min-w-0 ${condition.value ? 'text-gray-800' : 'text-gray-600'}`}
                                >
                                <option value="">Select Value</option>
                                {(() => {
                                  if (selectedField && selectedField.options && selectedField.options.length > 0) {
                                    console.log('[Rule Builder] Field has options:', selectedField.options);
                                    return selectedField.options.map((option: any, index: number) => {
                                      if (option && typeof option === 'object') {
                                        const val = option.value ?? option.label ?? JSON.stringify(option);
                                        const label = option.label ?? option.value ?? JSON.stringify(option);
                                        const truncatedLabel = label.length > 25 ? label.substring(0, 25) + '...' : label;
                                        return <option key={index} value={val} title={label}>{truncatedLabel}</option>;
                                      }
                                      const val = String(option);
                                      const truncatedVal = val.length > 25 ? val.substring(0, 25) + '...' : val;
                                      return <option key={index} value={val} title={val}>{truncatedVal}</option>;
                                    });
                                  } else if (selectedField && ['checkbox', 'radio'].includes(selectedField.type)) {
                                    return (
                                      <>
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                      </>
                                    );
                                  } else {
                                    console.log('[Rule Builder] No options found for field');
                                    return <option value="" disabled>No options available</option>;
                                  }
                                })()}
                              </FormSelect>
                              </div>
                            );
                          })()}

                          <button onClick={() => removeCondition(condition.id)} className="text-red-600 p-2 rounded hover:bg-red-50 sm:self-center flex-shrink-0" title="Remove condition" aria-label="Remove condition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}

                    <div>
                      <button onClick={addCondition} className="btn border border-indigo-600 text-indigo-600">+ Add Condition</button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-900 mb-3">Then</div>
                  <div className="space-y-4">
                    {rule.actions.map((action) => (
                      <div key={action.id} className="bg-gray-50 p-3 sm:p-4 rounded border" style={{ backgroundColor: 'rgb(246, 253, 249)' }}>
                        <div className="mb-2 text-sm font-medium text-gray-700">Action</div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                          <div className="w-full sm:flex-1 min-w-0">
                            <label className="block sm:hidden text-xs text-gray-600 mb-1">Action Type</label>
                            <FormSelect style={{ backgroundColor: 'rgb(255, 255, 255)' }} value={action.action} onChange={(e) => updateAction(action.id, 'action', e.target.value)} className={`border px-3 h-10 rounded w-full min-w-0 ${action.action ? 'text-gray-800' : 'text-gray-600'}`}>
                              {actions.map((act) => <option key={act} value={act}>{act}</option>)}
                            </FormSelect>
                          </div>

                          <div className="w-full sm:flex-1 min-w-0">
                            <label className="block sm:hidden text-xs text-gray-600 mb-1">Target Element</label>
                            <FormSelect style={{ backgroundColor: 'rgb(255, 255, 255)' }} value={action.target} onChange={(e) => updateAction(action.id, 'target', e.target.value)} className={`border px-3 h-10 rounded w-full min-w-0 ${action.target ? 'text-gray-800' : 'text-gray-600'}`}>
                              <option value="">Select Target Element</option>
                              {selectedFormFields.map((field) => {
                                const fieldName = field.displayName || field.name;
                                const truncatedName = fieldName.length > 30 ? fieldName.substring(0, 30) + '...' : fieldName;
                                
                                // Prefer elementId, then fieldName, then field.id (but avoid MongoDB IDs)
                                const fieldValue = field.elementId || 
                                                 field.fieldName || 
                                                 field.name ||
                                                 (isMongoId(field.id) ? '' : field.id);
                                
                                return (
                                  <option key={field.id} value={fieldValue} title={fieldName}>
                                    {truncatedName} ({field.type})
                                  </option>
                                );
                              })}
                            </FormSelect>
                          </div>

                          <button onClick={() => removeAction(action.id)} className="text-red-600 p-2 rounded hover:bg-red-50 sm:self-center flex-shrink-0" title="Remove action" aria-label="Remove action">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}

                    <div>
                      <button onClick={addAction} className="btn border border-green-600 text-green-600">+ Add Action</button>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                {editingRule && (
                  <button onClick={cancelEdit} className="btn btn-secondary border border-gray-400 hover:bg-gray-100 text-gray-700 w-full sm:w-auto">Cancel</button>
                )}
                <button onClick={() => createRule('draft')} className="btn btn-secondary border border-gray-400 hover:bg-gray-100 text-gray-700 w-full sm:w-auto">Save Draft</button>
                <button onClick={() => createRule('active')} className="btn bg-indigo-600 text-white w-full sm:w-auto">{editingRule ? 'Update Rule' : 'Create Rule'}</button>
              </div>

              {selectedForm && (
                <div className="bg-white border rounded p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Saved Rules</h3>
                    <span className="text-sm text-gray-500">{Array.isArray(savedRules) ? savedRules.length : 0} rule{Array.isArray(savedRules) && savedRules.length !== 1 ? 's' : ''} saved</span>
                  </div>

                  {!Array.isArray(savedRules) || savedRules.length === 0 ? (
                    <div className="p-6 border rounded text-gray-600">No rules saved for this form yet. Create your first rule above.</div>
                  ) : (
                    <div className="space-y-3">
                      {Array.isArray(savedRules) && savedRules.map((savedRule) => {
                        const ruleDescription = formatRuleDescription(savedRule);
                        return (
                          <div key={savedRule.id} className="border rounded p-4 hover:border-gray-400 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="font-medium text-gray-900">{savedRule.name || 'Unnamed Rule'}</div>
                                  {savedRule.status === 'draft' && (
                                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">Draft</span>
                                  )}
                                  {savedRule.isActive && savedRule.status !== 'draft' && (
                                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span className="font-medium text-indigo-600">{ruleDescription.condition}</span>
                                  </div>
                                  {ruleDescription.actions.map((actionText: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                      </svg>
                                      <span className="font-medium text-green-600">Then {actionText}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => editRule(savedRule)} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">Edit</button>
                                {savedRule.status === 'draft' && <button onClick={() => publishRule(savedRule.id)} className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">Publish</button>}
                                <button onClick={() => deleteRule(savedRule.id)} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">Delete</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </main>
        </SidebarProvider>
      </div>
      <PlanLimitModalComponent />
    </>
  );
}

export default function RuleBuilder() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <RuleBuilderInner />
      </ToastProvider>
    </ProtectedRoute>
  );
}
