"use client";
import React, { useEffect, useState } from "react";
import ShadcnSidebar from "@/components/ShadcnSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import FormSelect from "@/components/FormSelect";
import { ToastProvider, useToasts } from "@/components/ToastProvider";
import CustomPromptModal from "@/components/CustomPromptModal";
import Modal from "@/components/Modal";
import ProtectedRoute from "@/components/ProtectedRoute";

type Field = { 
  id?: string; 
  name?: string; 
  type?: string; 
  displayName?: string;
  elementId?: string;
  fieldName?: string;
  options?: string[];
};
type FormMeta = { id?: string; name?: string; fields: Field[] };

type RoutingItem = { id: string; fieldId?: string; operator?: string; value?: string; sendTo?: string };

function NotificationsInner({ searchParams }: { searchParams?: { siteId?: string } }) {
  // Initialize siteId synchronously like rule builder
  const [siteId, setSiteId] = useState<string>(() => {
    // Server-side: check searchParams
    const urlParam = (searchParams?.siteId as string) || "";
    if (urlParam) return urlParam;
    
    // Client-side: check localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedSiteId') || '';
    }
    return '';
  });
  const { addToast } = useToasts();
  const [forms, setForms] = useState<FormMeta[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true); // Start with true to show loading state
  const [selectedFormId, setSelectedFormId] = useState<string | "">("");
  
  // Global form cache that persists across page navigations
  const [globalFormCache, setGlobalFormCache] = useState<Record<string, FormMeta[]>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('roolify_forms_cache');
        return cached ? JSON.parse(cached) : {};
      } catch {
        return {};
      }
    }
    return {};
  });
  const [connectedSites, setConnectedSites] = useState<{ siteId: string; site: any; hasToken: boolean }[]>([]);
  const [designElements, setDesignElements] = useState<any[]>([]);
  const [adminRecipients, setAdminRecipients] = useState("");
  const [adminCc, setAdminCc] = useState("");
  const [adminBcc, setAdminBcc] = useState("");
  const [adminSubject, setAdminSubject] = useState("");
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('admin');
  const [animTab, setAnimTab] = useState<'admin' | 'user' | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [fadeVisible, setFadeVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize routing with one default item
  const [adminRouting, setAdminRouting] = useState<RoutingItem[]>(() => [{ 
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()), 
    fieldId: "", 
    operator: "is equal to", 
    value: "", 
    sendTo: "" 
  }]);
  
  const makeItem = () => ({ id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()), fieldId: "", operator: "is equal to", value: "", sendTo: "" });

  function handleTabClick(tab: 'admin' | 'user') {
    // tab pulse
    setAnimTab(tab);
    // trigger fade-in for content: start hidden then show
    setIsFading(true);
    setFadeVisible(false);
    // switch content immediately
    setActiveTab(tab);
    // use rAF to ensure DOM updated before setting visible to trigger transition
    requestAnimationFrame(() => requestAnimationFrame(() => setFadeVisible(true)));
    // clear animation/pulse states
    window.setTimeout(() => setAnimTab(null), 500);
    // clear fading flag after transition completes
    window.setTimeout(() => setIsFading(false), 300);
  }
  const [userRecipients, setUserRecipients] = useState("");
  const [userSubject, setUserSubject] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [previousFormCount, setPreviousFormCount] = useState<number>(0);
  const [lastSuccessfulRefresh, setLastSuccessfulRefresh] = useState<number | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  
  // Function to generate form-specific email template
  const generateFormTemplate = (form: FormMeta | undefined) => {
    if (!form || !form.fields || form.fields.length === 0) {
      console.log('[Template Generation] No form or fields found, using default template');
      return defaultGenericTemplate;
    }

    const formName = form.name || 'Form';
    console.log(`[Template Generation] Generating template for form: "${formName}"`);
    console.log(`[Template Generation] Form has ${form.fields.length} fields:`, form.fields.map(f => ({
      name: f.name,
      displayName: f.displayName,
      type: f.type,
      id: f.id
    })));
    
    const fieldsList = form.fields
      .filter(field => field.name || field.displayName || field.id)
      .map(field => {
        // Use displayName first, then name, then id
        const fieldName = field.displayName || field.name || field.id || 'Field';
        const displayName = fieldName.replace(/-/g, ' ').replace(/_/g, ' ');
        const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        
        // Use the field name as it appears in form submissions (usually displayName or name)
        const templateVariable = fieldName;
        
        console.log(`[Template Generation] Adding field: "${fieldName}" -> template variable: {{${templateVariable}}}`);
        
        return `        <li><strong>${capitalizedName}:</strong> {{${templateVariable}}}</li>`;
      })
      .join('\n');

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>New ${formName} Submission</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
      .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
      h2 { color: #333; margin-top: 0; }
      .field-list { list-style: none; padding: 0; }
      .field-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
      .field-list li:last-child { border-bottom: none; }
      .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>New ${formName} Submission</h2>
      <p>You have received a new submission from your website.</p>
      <ul class="field-list">
${fieldsList}
      </ul>
      <div class="footer">
        <p>This is an automated notification from your website.</p>
      </div>
    </div>
  </body>
</html>`;
  };
  
  const defaultGenericTemplate = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>New submission</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
      .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>New Form Submission</h2>
      <p>You have received a new form submission.</p>
      <p><strong>Form Data:</strong></p>
      <ul>
        {{#each formData}}
        <li><strong>{{@key}}:</strong> {{this}}</li>
        {{/each}}
      </ul>
    </div>
  </body>
</html>`;

  const [emailTemplate, setEmailTemplate] = useState(defaultGenericTemplate);
  
  // Text selection state for field insertion
  const [selectedText, setSelectedText] = useState("");
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [actionBarPosition, setActionBarPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const textEditorRef = React.useRef<HTMLDivElement>(null);
  
  // Safe fetch utility with authentication
  const safeFetch = async (input: RequestInfo, init?: RequestInit) => {
    const maxAttempts = 3;
    
    // Get auth token from localStorage
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('xano_auth_token') : null;
    
    // Add auth headers if token exists
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    };
    
    if (authToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
    }
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const resp = await fetch(input, {
          ...init,
          headers,
        });
        return resp;
      } catch (err) {
        const isLast = attempt === maxAttempts;
        console.warn(`Fetch attempt ${attempt} failed for ${String(input)}:`, err);
        if (isLast) {
          console.error('Network fetch failed for', input, err);
          return null;
        }
        // backoff before retrying
        await new Promise((res) => setTimeout(res, 150 * Math.pow(2, attempt)));
      }
    }
    return null;
  };
  
  // Load notification settings
  const loadNotificationSettings = async () => {
    if (!selectedFormId) {
      console.log('[Notifications] No form selected, skipping settings load');
      return;
    }

    try {
      console.log('[Notifications] Loading settings for form:', selectedFormId);
      const response = await safeFetch(`/api/notifications?formId=${encodeURIComponent(selectedFormId)}&siteId=${encodeURIComponent(siteId)}`);
      if (response && response.ok) {
        const settings = await response.json();
        console.log('[Notifications] Raw settings from API:', settings);
        
        // Handle null response from API
        if (settings === null || settings === undefined) {
          console.log('[Notifications] API returned null, using defaults');
          // Reset to defaults if API returns null
          setAdminRecipients('');
          setAdminCc('');
          setAdminBcc('');
          setAdminSubject('New Contact Form Submission');
          setAdminRouting([{ 
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()), 
            fieldId: "", 
            operator: "equals" as const, 
            value: "", 
            sendTo: "" 
          }]);
          setUserRecipients('');
          setUserSubject('Thank you for your submission');
          setEmailTemplate(defaultGenericTemplate);
          setCustomValue('');
          return;
        }
        
        // Map Xano format to frontend format
        setAdminRecipients(settings.admin_fallback_email || '');
        setAdminCc(''); // Not stored in Xano yet
        setAdminBcc(''); // Not stored in Xano yet
        setAdminSubject(settings.admin_subject || 'New Contact Form Submission');
        
        // Convert Xano admin_routes to frontend format
        if (settings.admin_routes && Array.isArray(settings.admin_routes)) {
          const convertedRoutes = settings.admin_routes.map((route: any, index: number) => {
            // Find the field ID that matches the field name using the same logic as rule builder
            const field = fields.find(f => {
              const fieldValue = f.elementId || f.fieldName || f.name || (f.id && !f.id.match(/^[0-9a-f]{24}$/) ? f.id : '');
              return fieldValue === route.field || f.name === route.field || f.displayName === route.field;
            });
            const fieldId = field ? (field.elementId || field.fieldName || field.name || (field.id && !field.id.match(/^[0-9a-f]{24}$/) ? field.id : '')) : route.field || '';
            
            console.log('[Notifications] 🔍 Mapping route field name to ID:', {
              routeField: route.field,
              foundField: field,
              fieldId
            });
            
            // Normalize value for UI display (same as rule builder)
            let normalizedValue = route.value || '';
            if (normalizedValue === 'Yes' || normalizedValue === 'yes' || normalizedValue === 'true') {
              normalizedValue = 'true';
            } else if (normalizedValue === 'No' || normalizedValue === 'no' || normalizedValue === 'false') {
              normalizedValue = 'false';
            }
            
            console.log(`[Notifications] Original value: "${route.value}" -> Normalized: "${normalizedValue}"`);
            
            return {
              id: `route-${index}`,
              fieldId: fieldId,
              operator: 'equals' as const,
              value: normalizedValue,
              sendTo: route.recipients || ''
            };
          });
          setAdminRouting(convertedRoutes.length > 0 ? convertedRoutes : [{ 
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()), 
            fieldId: "", 
            operator: "equals" as const, 
            value: "", 
            sendTo: "" 
          }]);
        } else {
          // No routes found, set default
          setAdminRouting([{ 
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()), 
            fieldId: "", 
            operator: "equals" as const, 
            value: "", 
            sendTo: "" 
          }]);
        }
        
        setUserRecipients(settings.user_fallback_email || '');
        setUserSubject(settings.user_subject || 'Thank you for your submission');
        // Only set template if there's a saved custom template, otherwise keep the generated one
        if (settings.email_template) {
          setEmailTemplate(settings.email_template);
        }
        // If no custom template saved, the form-specific template generated by useEffect will be used
        setCustomValue(settings.custom_value || ''); // Load custom value
        setFieldCustomValues(settings.field_custom_values || {}); // Load per-field custom values
        
        console.log('[Notifications] Loaded and mapped settings successfully');
        console.log('[Notifications] field_custom_values:', JSON.stringify(settings.field_custom_values, null, 2));
      } else {
        console.log('[Notifications] No settings found for form, using defaults');
        // Reset to defaults if no settings found
        setAdminRecipients('');
        setAdminCc('');
        setAdminBcc('');
        setAdminSubject('New Contact Form Submission');
        setAdminRouting([{ 
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()), 
          fieldId: "", 
          operator: "equals" as const, 
          value: "", 
          sendTo: "" 
        }]);
        setUserRecipients('');
        setUserSubject('Thank you for your submission');
        // Don't set template here - let the useEffect generate the form-specific template
        setCustomValue('');
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  // Save notification settings to Xano
  const saveNotificationSettings = async () => {
    if (!selectedFormId) {
      addToast({ type: 'error', message: 'Please select a form first' });
      return;
    }

    try {
      setIsSaving(true); // Start saving animation
      console.log('[Notifications] 🔍 RAW adminRouting state:', adminRouting);
      
      // Format admin routes for storage
      const adminRoutesFormatted = adminRouting
        .filter(r => {
          const hasRequiredFields = r.fieldId && r.sendTo;
          console.log('[Notifications] 🔍 Filtering route:', {
            route: r,
            fieldId: r.fieldId,
            sendTo: r.sendTo,
            value: r.value,
            hasRequiredFields
          });
          return hasRequiredFields;
        })
        .map(r => {
          // Find the field to get its name instead of ID using the same logic as rule builder
          const field = fields.find(f => {
            const fieldValue = f.elementId || f.fieldName || f.name || (f.id && !f.id.match(/^[0-9a-f]{24}$/) ? f.id : '');
            return fieldValue === r.fieldId || f.id === r.fieldId || f.name === r.fieldId || f.elementId === r.fieldId;
          });
          const fieldName = field?.name || field?.displayName || r.fieldId; // Use field name for easier matching
          
          console.log('[Notifications] 🔍 Mapping route - ID to Name:', {
            fieldId: r.fieldId,
            foundField: field,
            fieldName
          });
          
          return {
            field: fieldName, // Use field name instead of ID for easier matching in webhook
            operator: 'equals' as const,
            value: r.value || '',
            recipients: r.sendTo || '',
          };
        });

      console.log('[Notifications] Saving settings for form:', selectedFormId);
      console.log('[Notifications] 🔍 Admin routes BEFORE filtering:', adminRouting.length);
      console.log('[Notifications] 🔍 Admin routes AFTER filtering:', adminRoutesFormatted.length);
      console.log('[Notifications] Admin routes:', adminRoutesFormatted);

      const payload = {
        formId: selectedFormId,
        siteId: siteId,
        formName: forms.find(f => f.id === selectedFormId)?.name || selectedFormId,
        adminRoutes: adminRoutesFormatted,
        userRoutes: [], // Empty for now
        adminRecipients: adminRecipients || null,
        userRecipients: userRecipients || null,
        adminFallbackEmail: adminRecipients || null,
        userFallbackEmail: userRecipients || null,
        emailTemplate: emailTemplate || null,  // Save custom template
        adminSubject: adminSubject || null,
        userSubject: userSubject || null,
        customValue: customValue || null,  // Save custom value
        fieldCustomValues: fieldCustomValues || null,  // Save per-field custom values
      };

      // Save to local JSON file via Next.js API
      console.log('[Notifications] 🚀 SENDING SAVE REQUEST TO /api/notifications');
      console.log('[Notifications] 📦 Payload being sent:', payload);
      console.log('[Notifications] 🔍 Custom values in payload:', {
        customValue: payload.customValue,
        fieldCustomValues: payload.fieldCustomValues
      });

      const response = await safeFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('[Notifications] 📡 Response received:', {
        response,
        ok: response?.ok,
        status: response?.status,
        statusText: response?.statusText
      });

      if (response && response.ok) {
        const responseData = await response.json();
        console.log('[Notifications] ✅ Settings saved successfully');
        console.log('[Notifications] 📥 Server response data:', responseData);
        addToast({ type: 'success', message: 'Notification settings saved!' });
      } else if (response && response.status === 401) {
        console.error('[Notifications] ❌ Authentication failed - user not logged in');
        addToast({ type: 'error', message: 'Please log in to save notification settings' });
        return;
      } else if (!response) {
        console.error('[Notifications] ❌ Network error - no response received (safeFetch returned null)');
        addToast({ type: 'error', message: 'Network error - please check your connection' });
        throw new Error('Network error - no response received');
      } else {
        const errorText = await response.text();
        console.error('[Notifications] Save failed:', response.status, errorText);
        throw new Error(`Failed to save settings: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      addToast({ type: 'error', message: 'Failed to save settings. Check console for details.' });
    } finally {
      setIsSaving(false); // End saving animation
    }
  };

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [hoveredTemplateField, setHoveredTemplateField] = useState<string | null>(null);
  const [clickedFieldPosition, setClickedFieldPosition] = useState<{ x: number; y: number } | null>(null);
  const [customValue, setCustomValue] = useState('');
  const [fieldCustomValues, setFieldCustomValues] = useState<Record<string, string>>({});

  // Restore selection to keep text highlighted
  const restoreSelection = () => {
    if (!textEditorRef.current || selectionStart === selectionEnd) return;
    
    const selection = window.getSelection();
    if (selection && textEditorRef.current.firstChild) {
      const range = document.createRange();
      range.setStart(textEditorRef.current.firstChild, selectionStart);
      range.setEnd(textEditorRef.current.firstChild, selectionEnd);
      selection.removeAllRanges();
      selection.addRange(range);
      console.log('Selection restored:', { selectionStart, selectionEnd });
    }
  };

  // Handle text selection in email template editor
  const handleTextSelect = (e: React.MouseEvent) => {
    console.log('Mouse up event triggered');
    
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      console.log('Selection:', selection);
      console.log('Selection rangeCount:', selection?.rangeCount);
      
      if (!selection || selection.rangeCount === 0) {
        console.log('No selection found');
        setShowFieldPicker(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const selected = selection.toString();
      console.log('Selected text:', selected);

      if (selected.length > 0 && textEditorRef.current) {
        setSelectedText(selected);
        
        // Calculate text positions within the contentEditable div
        const range = selection.getRangeAt(0);
        const editorText = textEditorRef.current.textContent || '';
        
        // Find the start and end positions in the text
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;
        
        setSelectionStart(startOffset);
        setSelectionEnd(endOffset);
        
        console.log('Text selected:', selected);
        console.log('Selection positions:', { startOffset, endOffset });
        console.log('Editor text length:', editorText.length);

        // Position the action bar near the selected text
        const editorRect = textEditorRef.current.getBoundingClientRect();
        const rangeRect = range.getBoundingClientRect();

        // Calculate position relative to the editor
        const popupWidth = 300;
        const popupHeight = 200; // Approximate height of the popup

        // Position to the right of the selected text by default
        let top = rangeRect.top - editorRect.top; // Align with top of selection
        let left = rangeRect.right - editorRect.left + 10; // 10px to the right of selection

        // If popup would go off the right edge, position it to the left instead
        if (left + popupWidth > editorRect.width) {
          left = rangeRect.left - editorRect.left - popupWidth - 10; // 10px to the left of selection
        }

        // If positioning to the left would go off the left edge, position below instead
        if (left < 10) {
          left = rangeRect.left - editorRect.left;
          top = rangeRect.bottom - editorRect.top + 10; // 10px below selection

          // Adjust horizontal position if needed
          if (left + popupWidth > editorRect.width) {
            left = editorRect.width - popupWidth - 10;
          }
          if (left < 10) {
            left = 10;
          }
        }

        // Ensure popup stays within editor bounds vertically
        if (top + popupHeight > editorRect.height) {
          // Align to bottom of editor if it would overflow
          top = Math.max(10, editorRect.height - popupHeight - 10);
        }
        if (top < 10) {
          top = 10;
        }

        console.log('Editor rect:', editorRect);
        console.log('Range rect:', rangeRect);
        console.log('Popup position:', { top, left });

        setActionBarPosition({
          top,
          left
        });
        
        setShowFieldPicker(true);
        console.log('Setting showFieldPicker to true');
        
        // Restore selection to keep text highlighted
        setTimeout(() => {
          restoreSelection();
        }, 50);
      } else {
        console.log('No text selected or no editor ref');
        setShowFieldPicker(false);
      }
    }, 10);
  };

  // Insert field tag at selection
  const insertFieldTag = (fieldName: string) => {
    console.log('Inserting field:', fieldName);
    console.log('Selected text:', selectedText);
    console.log('Selection positions:', { selectionStart, selectionEnd });
    
    if (!textEditorRef.current) {
      console.log('No editor ref found');
      setShowFieldPicker(false);
      return;
    }

    const fieldTag = `{{${fieldName}}}`;
    const currentText = textEditorRef.current.textContent || '';
    
    console.log('Current text length:', currentText.length);
    console.log('Selection start/end:', { selectionStart, selectionEnd });
    
    // Create new text by replacing the selected portion
    const beforeText = currentText.substring(0, selectionStart);
    const afterText = currentText.substring(selectionEnd);
    const newText = beforeText + fieldTag + afterText;
    
    console.log('New text:', newText);
    
    // Update the contentEditable div content
    textEditorRef.current.textContent = newText;
    
    // Update the email template state
    setEmailTemplate(newText);
    
    // Position cursor after the inserted field tag
    const newCursorPos = selectionStart + fieldTag.length;
    
    // Create a new range and set cursor position
    const selection = window.getSelection();
    if (selection && textEditorRef.current.firstChild) {
      const range = document.createRange();
      range.setStart(textEditorRef.current.firstChild, newCursorPos);
      range.setEnd(textEditorRef.current.firstChild, newCursorPos);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    console.log('Updated template:', newText);
    
    // Close the field picker but keep selection info for potential re-selection
    setShowFieldPicker(false);
    setSelectedText('');
    
    // Show success toast
    addToast({ type: 'success', message: `Inserted {{${fieldName}}}` });
  };

  // Restore selection when popup is shown
  useEffect(() => {
    if (showFieldPicker && selectedText) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        restoreSelection();
      }, 100);
    }
  }, [showFieldPicker, selectedText]);

  // Close field picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showFieldPicker && 
          !target.closest('.text-selection-action-bar') && 
          !target.closest('[contenteditable]')) {
        setShowFieldPicker(false);
        setSelectedText('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFieldPicker]);

  // Set up event listeners for template field clicks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
    };

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Check if clicking on action bar buttons - don't hide action bar
      if (target.closest('.template-field-action-bar') || target.closest('.available-field-action-bar')) {
        console.log('Clicked on action bar, not hiding');
        return;
      }
      
      // Check if clicking on available field cards - don't hide action bar
      if (target.closest('.available-field-card')) {
        console.log('Clicked on available field card, not hiding');
        return;
      }
      
      // Handle template field clicks - all fields are clickable
      if (target.classList.contains('template-field-tag')) {
        e.preventDefault();
        e.stopPropagation();
        const fieldName = target.getAttribute('data-field-name');
        
        // Check if this is a checkbox field
        const isCheckboxField = fieldName && (
          fieldName.toLowerCase().includes('policy') || 
          fieldName.toLowerCase().includes('terms') || 
          fieldName.toLowerCase().includes('agreement') ||
          fieldName.toLowerCase().includes('consent') ||
          fieldName.toLowerCase().includes('checkbox')
        );
        
        if (fieldName) {
          // Get the position of the clicked element
          const rect = target.getBoundingClientRect();
          const templateEditor = document.querySelector('[contenteditable="true"]');
          if (templateEditor) {
            const editorRect = templateEditor.getBoundingClientRect();
            setClickedFieldPosition({
              x: rect.left - editorRect.left,
              y: rect.top - editorRect.top
            });
          }
          setHoveredTemplateField(fieldName);
          
          // For non-checkbox fields, just copy the field tag
          if (!isCheckboxField) {
            navigator.clipboard.writeText(`{{${fieldName}}}`);
            addToast({ type: 'success', message: `Field tag {{${fieldName}}} copied!` });
          }
        }
      } else {
        // Click outside field tags - hide action bars
        setHoveredTemplateField(null);
        setClickedFieldPosition(null);
      }
    };

    // Add click listener to the document
    document.addEventListener('click', handleClick, true);
    
    // Add keyboard listener to the document
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [customValue, emailTemplate, addToast]);
  
  // Custom modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    placeholder: '',
    onConfirm: (value: string) => {},
    initialValue: ''
  });

  const fetchForms = async () => {
    // Check cache first for instant loading
    if (globalFormCache[siteId]) {
      console.log('[Notifications] Loading forms from cache for site:', siteId);
      setForms(globalFormCache[siteId]);
      setIsLoadingForms(false);
      return;
    }
    
    setIsLoadingForms(true);
    try {
      const formsResp = await safeFetch(`/api/forms/dynamic-options?siteId=${encodeURIComponent(siteId)}`);
      if (formsResp && formsResp.ok) {
        const formsData = await formsResp.json();
        const formsArray = formsData.forms || [];
        
        if (formsArray.length > 0) {
          const transformedForms = formsArray.map((form: any) => ({
            id: form.id,
            name: form.name,
            fields: form.fields || []
          }));
          
          // Filter out test forms
          const filteredForms = transformedForms.filter((form: any) =>
            !form.name.toLowerCase().includes('test')
          );
          
          setForms(filteredForms);
          setIsLoadingForms(false);
          
          // Cache forms globally for instant loading on future visits
          const newCache = { ...globalFormCache, [siteId]: filteredForms };
          setGlobalFormCache(newCache);
          if (typeof window !== 'undefined') {
            localStorage.setItem('roolify_forms_cache', JSON.stringify(newCache));
          }
        } else {
          setForms([]);
          setIsLoadingForms(false);
        }
      } else {
        setForms([]);
        setIsLoadingForms(false);
      }
    } catch (err) {
      console.error('Failed to load forms:', err);
      setForms([]);
      setIsLoadingForms(false);
    }
  };

  const refreshForms = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    console.log('[Notifications Refresh] Starting HARD REFRESH with cache-busting...');
    try {
      // Cache-busting timestamp for hard refresh
      const cacheBuster = `&_refresh=${Date.now()}`;
      console.log('[Notifications Refresh] Force refreshing with cache buster');

      // Use the same endpoint as dashboard to get forms (no authentication required)
      // IMPORTANT: Never use endpoints that might trigger form.sync() during notification settings
      const formsResp = await safeFetch(`/api/forms/dynamic-options?siteId=${encodeURIComponent(siteId)}${cacheBuster}`);
      if (formsResp && formsResp.ok) {
        const formsData = await formsResp.json();
        const formsArray = formsData.forms || [];

        console.log('[Notifications Refresh] Found forms:', formsArray.length);
        formsArray.forEach((form: any) => {
          console.log(`[Notifications Refresh] Form "${form.name}" has ${form.fields?.length || 0} fields:`,
            form.fields?.map((f: any) => f.displayName || f.name));
        });

        if (formsArray.length > 0) {
          // Transform forms to match the expected format
          const transformedForms = formsArray.map((form: any) => ({
            id: form.id, // Use the actual form ID from dynamic-options API
            name: form.name,
            fields: form.fields || [] // Use the actual fields from dynamic-options API
          }));

          const filteredForms = transformedForms.filter((form: any) =>
            !form.name.toLowerCase().includes('test')
          );
          setForms(filteredForms);
          // Update cache with refreshed forms
          // Cache removed - no longer needed
          addToast({ type: 'success', message: 'Forms refreshed successfully!' });

          // Set successful refresh timestamp
          setLastSuccessfulRefresh(Date.now());
          setIsRefreshing(false);
          return;
        } else {
          // No forms found in Xano
          setForms([]);
          addToast({ 
            type: 'info', 
            message: 'No forms found for this site. Forms are automatically loaded from your Webflow site.' 
          });
          setLastSuccessfulRefresh(Date.now());
          setIsRefreshing(false);
          return;
        }
      }

      // If the API call failed, show error
      setForms([]);
      addToast({ type: 'error', message: 'Failed to refresh forms. Please try again.' });
      setIsRefreshing(false);
      return;

      /* REMOVED: All fallback code to Webflow API has been removed to prevent form syncing.
       * The notifications page should ONLY read existing forms from Xano, never create new ones.
       * To add new forms to Xano, users must use the dedicated form sync feature in the dashboard.
       */
    } catch (err) {
      console.error('Error refreshing forms:', err);
      setRefreshError((err as Error).message || 'Failed to refresh forms');
      addToast({ type: 'error', message: 'Failed to refresh forms' });
    } finally {
      setIsRefreshing(false);
    }
  };

  // IMMEDIATE form loading - start loading forms the moment component mounts
  useEffect(() => {
    const loadFormsImmediately = async () => {
      // Get siteId from multiple sources immediately
      let immediateSiteId = siteId;
      
      // If no siteId, try to get it from localStorage immediately
      if (!immediateSiteId && typeof window !== 'undefined') {
        immediateSiteId = localStorage.getItem('selectedSiteId') || '';
      }
      
      // If we have a siteId, check cache first for instant loading
      if (immediateSiteId) {
        // Check global cache first for instant loading
        if (globalFormCache[immediateSiteId]) {
          console.log('[Notifications] Loading forms from GLOBAL CACHE for site:', immediateSiteId);
          setForms(globalFormCache[immediateSiteId]);
          setIsLoadingForms(false);
          
          // Update siteId if it was loaded from localStorage
          if (immediateSiteId !== siteId) {
            setSiteId(immediateSiteId);
          }
          return;
        }
        
        console.log('[Notifications] IMMEDIATE form loading for site:', immediateSiteId);
        try {
          // Add cache busting to ensure fresh data
          const cacheBuster = `&_refresh=${Date.now()}&_force=${Math.random()}`;
          const formsResp = await safeFetch(`/api/forms/dynamic-options?siteId=${encodeURIComponent(immediateSiteId)}${cacheBuster}`);
          if (formsResp && formsResp.ok) {
            const formsData = await formsResp.json();
            const formsArray = formsData.forms || [];
            
            if (formsArray.length > 0) {
              const transformedForms = formsArray.map((form: any) => ({
                id: form.id,
                name: form.name,
                fields: form.fields || []
              }));
              
              // Filter out test forms
              const filteredForms = transformedForms.filter((form: any) =>
                !form.name.toLowerCase().includes('test')
              );
              
              console.log('[Notifications] IMMEDIATE loading - Found forms:', filteredForms.length);
              setForms(filteredForms);
              setIsLoadingForms(false);
              
              // Cache forms globally for instant loading on future visits
              const newCache = { ...globalFormCache, [immediateSiteId]: filteredForms };
              setGlobalFormCache(newCache);
              if (typeof window !== 'undefined') {
                localStorage.setItem('roolify_forms_cache', JSON.stringify(newCache));
              }
              
              // Update siteId if it was loaded from localStorage
              if (immediateSiteId !== siteId) {
                setSiteId(immediateSiteId);
              }
            }
          }
        } catch (err) {
          console.warn('Immediate form loading failed:', err);
          setIsLoadingForms(false);
        }
      }
    };
    
    // Start loading immediately
    loadFormsImmediately();
  }, []); // Run immediately on mount

  // Also load forms when siteId changes
  useEffect(() => {
    if (siteId && forms.length === 0) {
      fetchForms();
    }
  }, [siteId]);


  // Listen for URL param changes (site switching)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    const urlSiteId = params.get('siteId') || localStorage.getItem('selectedSiteId') || '';
    
    if (urlSiteId && urlSiteId !== siteId) {
      console.log('[Notifications] Site changed from', siteId, 'to', urlSiteId);
      setSiteId(urlSiteId);
      // Reset state when site changes
      setSelectedFormId('');
      setAdminRecipients('');
      setUserRecipients('');
      setAdminRouting([makeItem()]);
      setEmailTemplate(defaultGenericTemplate); // Will be updated when form is selected
    }
  }, [siteId]);

  // Update email template when form is selected
  useEffect(() => {
    if (selectedFormId) {
      const selectedForm = forms.find(f => f.id === selectedFormId);
      if (selectedForm) {
        const newTemplate = generateFormTemplate(selectedForm);
        setEmailTemplate(newTemplate);
      }
    }
  }, [selectedFormId, forms]);

  // Debug admin routing state changes
  useEffect(() => {
    if (adminRouting.length > 0) {
      console.log('[Notifications] 🔍 Admin routing state updated:', adminRouting);
    }
  }, [adminRouting]);

  // Auto-refresh disabled to prevent flash/blank state issues
  // useEffect(() => {
  //   if (!effectiveSiteId) return;

  //   const refreshInterval = setInterval(() => {
  //     console.log('[Notifications] Auto-refreshing forms...');
  //     setLastRefreshTime(Date.now());
  //     refreshForms();
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(refreshInterval);
  // }, [effectiveSiteId]);

  // Detect form changes and show notifications
  useEffect(() => {
    if (forms.length > 0 && previousFormCount > 0) {
      const currentCount = forms.length;
      const change = currentCount - previousFormCount;
      
      if (change > 0) {
        console.log(`[Notifications] Form addition detected: +${change} new form${change > 1 ? 's' : ''}`);
      } else if (change < 0) {
        console.log(`[Notifications] Form removal detected: ${Math.abs(change)} form${Math.abs(change) > 1 ? 's' : ''} removed`);
      }
      
    }
    
    setPreviousFormCount(forms.length);
  }, [forms.length, previousFormCount]);

  const fields = React.useMemo(() => {
    if (!selectedFormId) {
      console.log('[Notifications] No form selected - clearing fields');
      return [];
    }
    
    const selectedForm = forms.find((f) => f.id === selectedFormId);
    if (!selectedForm) {
      console.log('[Notifications] Form not found:', selectedFormId);
      console.log('[Notifications] Available forms:', forms.map(f => ({ id: f.id, name: f.name })));
      return [];
    }
    
    const formFields = selectedForm?.fields || [];
    
    console.log('[Notifications] 🎯 Using form fields directly from API:', {
      formName: selectedForm.name,
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
    
        // Debug: Check for HBI Account Rep field specifically
        const hbiField = formFields.find((f: any) => f.name === 'HBI Account Rep');
        if (hbiField) {
          console.log('[Notifications] 🎯 HBI Account Rep field found:', {
            id: hbiField.id,
            type: hbiField.type,
            options: hbiField.options,
            optionsLength: hbiField.options?.length || 0,
            firstOptions: hbiField.options?.slice(0, 3) || [],
            allOptions: hbiField.options
          });
        } else {
          console.log('[Notifications] ❌ HBI Account Rep field not found in form fields');
          console.log('[Notifications] Available field names:', formFields.map((f: any) => f.name));
        }
    
    return formFields;
  }, [forms, selectedFormId]);

  // Update email template when form is selected
  useEffect(() => {
    if (selectedFormId) {
      const selectedForm = forms.find(f => f.id === selectedFormId);
      if (selectedForm) {
        console.log('[Notifications] 🎯 Updating email template for form:', selectedForm.name);
        const newTemplate = generateFormTemplate(selectedForm);
        setEmailTemplate(newTemplate);
      }
    }
  }, [selectedFormId, forms]);

  // Load notification settings when form is selected and fields are available
  useEffect(() => {
    if (selectedFormId && fields.length > 0) {
      loadNotificationSettings();
    }
  }, [selectedFormId, fields]);

  function addRouting() {
    const item = makeItem();
    setAdminRouting((s) => [...s, item]);
  }
  
  function removeRouting(id: string) {
    setAdminRouting((s) => s.filter((r) => r.id !== id));
    addToast({ type: 'success', title: 'Routing removed', message: 'Routing rule removed.' });
  }

  function updateRouting(id: string, patch: Partial<RoutingItem>) {
    setAdminRouting((s) => s.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function saveSettings() {
    // basic validation
    if (!selectedFormId) {
      addToast({ type: 'error', title: 'Save failed', message: 'Please select a target form before saving.' });
      return;
    }

    try {
      // Call the actual save function
      saveNotificationSettings();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Save error', message: 'An unexpected error occurred while saving.' });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Saving Animation */}
      {isSaving && (
        <div className="fixed inset-0 bg-gray-50 bg-opacity-90 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-sm mx-4">
            <div className="relative">
              {/* Spinning loader */}
              <div className="w-12 h-12 border-3 border-indigo-200 rounded-full animate-spin border-t-indigo-600 mx-auto mb-4"></div>
              
              {/* Text */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Saving Settings...
              </h3>
              <p className="text-sm text-gray-600">
                Please wait while we save your notification preferences
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
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">Email Notifications</h1>

                <p className="text-sm text-gray-600 mb-6">Configure submission alerts and conditional routing</p>

                <div className="mb-6 border-b border-gray-200">
                  <nav className="-mb-px flex gap-8" aria-label="Tabs">
                    <button
                      onClick={() => handleTabClick('admin')}
                      className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                        activeTab === 'admin'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Admin Notifications
                    </button>
                    <button
                      onClick={() => handleTabClick('user')}
                      className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                        activeTab === 'user'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      User Notifications
                    </button>
                  </nav>
                </div>

                <div className={`space-y-6 transform transition-all duration-300 ease-in-out ${isFading ? (fadeVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-6 scale-95') : 'opacity-100 translate-y-0 scale-100'}`}>
                  <div className="bg-white border rounded p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-900">Target Form</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      // Clear cache and refresh
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('roolify_forms_cache');
                        setGlobalFormCache({});
                      }
                      refreshForms();
                    }}
                    disabled={isRefreshing || !siteId}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title="Refresh and clear cache to get fresh form data"
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
                          <span>Refreshing forms...</span>
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
              <FormSelect className={`w-full border px-3 py-2 rounded ${selectedFormId ? 'text-gray-800' : 'text-gray-600'}`} value={selectedFormId} onChange={(e) => setSelectedFormId(e.target.value)}>
                <option value="">
                  {isLoadingForms ? 'Loading forms...' : 'Select Form'}
                </option>
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || f.id}
                  </option>
                ))}
              </FormSelect>
              
            </div>

            <div className="bg-white border rounded p-6">
              <div className="text-lg font-semibold text-gray-900 mb-2">Default Notification Settings</div>
              <div className="text-sm text-gray-700 mb-4">Choose where to send your notification</div>

              <div className="mb-4">
                <div className="text-xs text-gray-700 mb-1">{'\u00A0'}Recipients (To)</div>
                <input 
                  value={activeTab === 'admin' ? adminRecipients : userRecipients} 
                  onChange={(e) => activeTab === 'admin' ? setAdminRecipients(e.target.value) : setUserRecipients(e.target.value)} 
                  placeholder="contact@example.com" 
                  className="w-full border px-3 py-2 rounded text-gray-800 bg-white" 
                />
              </div>

              {activeTab === 'admin' && (
                <>
                  <div className="mb-4">
                    <div className="text-xs text-gray-700 mb-1">CC (Optional)</div>
                    <input value={adminCc} onChange={(e) => setAdminCc(e.target.value)} placeholder="cc@example.com (separate multiple with commas)" className="w-full border px-3 py-2 rounded text-gray-800 bg-white" />
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-gray-700 mb-1">BCC (Optional)</div>
                    <input value={adminBcc} onChange={(e) => setAdminBcc(e.target.value)} placeholder="bcc@example.com (separate multiple with commas)" className="w-full border px-3 py-2 rounded text-gray-800 bg-white" />
                  </div>
                </>
              )}

              <div>
                <div className="text-xs text-gray-700 mb-1">Subject Line Template</div>
                <input 
                  value={activeTab === 'admin' ? adminSubject : userSubject} 
                  onChange={(e) => activeTab === 'admin' ? setAdminSubject(e.target.value) : setUserSubject(e.target.value)} 
                  placeholder={activeTab === 'admin' ? "New Contact Form Submission" : "Thank you for your submission"} 
                  className="w-full border px-3 py-2 rounded text-gray-800 bg-white" 
                />
              </div>

              <div className="mt-4">

              </div>
            </div>

            <div className="bg-white border rounded p-6">
              <div className="text-lg font-semibold text-gray-900 mb-4">Email Content</div>

              <div className="text-sm font-medium text-gray-900 mb-1">Email HTML Template</div>
              <div className="text-xs text-gray-600 mb-2">Template automatically updates based on selected form fields</div>

              <div>
                <div className="mb-3">
                  <div className="relative">
                    <div
                      ref={textEditorRef}
                      contentEditable
                      className="w-full border px-3 py-2 rounded text-gray-800 min-h-[260px] font-mono whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      style={{ minHeight: '260px' }}
                      onInput={(e) => {
                        const html = e.currentTarget.innerHTML;
                        // Extract text content and update state
                        const textContent = e.currentTarget.textContent || '';
                        setEmailTemplate(textContent);
                      }}
                      onBlur={(e) => {
                        // Ensure we have the latest text content
                        const textContent = e.currentTarget.textContent || '';
                        setEmailTemplate(textContent);
                      }}
                      onMouseUp={handleTextSelect}
                      onSelect={handleTextSelect}
                      onSelectionChange={handleTextSelect}
                      dangerouslySetInnerHTML={{
                        __html: emailTemplate
                          .replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                          .replace(/\{\{([^}]+)\}\}/g, (match, fieldName) => {
                            const cleanFieldName = fieldName.trim();
                            
                            // Check if this is a checkbox field
                            const isCheckboxField = cleanFieldName.toLowerCase().includes('policy') || 
                                                   cleanFieldName.toLowerCase().includes('terms') || 
                                                   cleanFieldName.toLowerCase().includes('agreement') ||
                                                   cleanFieldName.toLowerCase().includes('consent') ||
                                                   cleanFieldName.toLowerCase().includes('checkbox');
                            
                            // All fields are blue and clickable, but only checkbox fields show action bar
                            return `<span 
                              style="background-color: #e0e7ff; border: 1px solid #a5b4fc; border-radius: 4px; padding: 2px 4px; color: #4f46e5; font-weight: 500; display: inline-block; margin: 0 1px; position: relative; cursor: pointer; transition: all 0.2s ease;" 
                              data-field-name="${cleanFieldName}"
                              class="template-field-tag"
                              onmouseover="this.style.backgroundColor='#c7d2fe'; this.style.borderColor='#818cf8';"
                              onmouseout="this.style.backgroundColor='#e0e7ff'; this.style.borderColor='#a5b4fc';"
                              title="${isCheckboxField ? `Click to set custom value for ${cleanFieldName}` : `Click to copy ${cleanFieldName} field tag`}"
                            >${match}</span>`;
                          })
                      }}
                      data-placeholder="<h1>New submission</h1><p>Customize your notification HTML here</p>"
                    />
                    {!emailTemplate && (
                      <div className="absolute top-2 left-3 text-gray-400 pointer-events-none font-mono">
                        &lt;h1&gt;New submission&lt;/h1&gt;&lt;p&gt;Customize your notification HTML here&lt;/p&gt;
                      </div>
                    )}


                    {/* Text Selection Action Bar - Insert Field */}
                    {showFieldPicker && selectedText && (
                      <div
                        className="text-selection-action-bar absolute bg-white border-2 border-indigo-600 rounded-lg shadow-xl z-50 p-3"
                        style={{
                          left: `${actionBarPosition.left}px`,
                          top: `${actionBarPosition.top}px`,
                          width: '300px',
                          maxHeight: '300px'
                        }}
                        onLoad={() => console.log('Popup rendered at:', actionBarPosition)}
                      >
                        <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-200">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="text-sm font-semibold text-indigo-600">Insert Field</span>
                          <button
                            onClick={() => setShowFieldPicker(false)}
                            className="ml-auto p-1 hover:bg-gray-100 rounded"
                            title="Close"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-2">
                          Replace "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}" with:
                        </div>
                        
                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                          {fields.length > 0 ? (
                            fields.map((field) => {
                              const fieldName = field.displayName || field.name || field.id || '';
                              return (
                                <button
                                  key={field.id || fieldName}
                                  onClick={() => insertFieldTag(fieldName)}
                                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center space-x-2 group"
                                >
                                  <svg className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  <span className="flex-1 text-indigo-600">{fieldName}</span>
                                  <span className="text-xs text-indigo-500 group-hover:text-indigo-700 bg-indigo-100 border border-indigo-400 px-2 py-1 rounded font-mono">{`{{${fieldName}}}`}</span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="text-sm text-gray-500 text-center py-4">
                              No fields available. Select a form first.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Template Field Action Bar - only for checkbox fields */}
                    {hoveredTemplateField && clickedFieldPosition && (
                      hoveredTemplateField.toLowerCase().includes('policy') || 
                      hoveredTemplateField.toLowerCase().includes('terms') || 
                      hoveredTemplateField.toLowerCase().includes('agreement') ||
                      hoveredTemplateField.toLowerCase().includes('consent') ||
                      hoveredTemplateField.toLowerCase().includes('checkbox')
                    ) && (
                      <div 
                        className="template-field-action-bar absolute bg-gray-800 rounded-md p-2 flex items-center space-x-2 z-20 shadow-lg"
                        style={{
                          left: `${clickedFieldPosition.x}px`,
                          top: `${clickedFieldPosition.y - 40}px`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <button
                            className="p-1 text-white hover:bg-gray-700 rounded"
                            title="Add custom value"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Custom value button clicked, current state:', { showCustomModal, hoveredTemplateField });
                              
                              // Check if this is a checkbox field that should use per-field custom values
                              const isCheckboxField = hoveredTemplateField && (
                                hoveredTemplateField.toLowerCase().includes('policy') || 
                                hoveredTemplateField.toLowerCase().includes('terms') || 
                                hoveredTemplateField.toLowerCase().includes('agreement') ||
                                hoveredTemplateField.toLowerCase().includes('consent') ||
                                hoveredTemplateField.toLowerCase().includes('checkbox')
                              );
                              
                              if (isCheckboxField) {
                                // For checkbox fields, set the per-field custom value
                                const currentPerFieldValue = fieldCustomValues[hoveredTemplateField] || '';
                                setModalConfig({
                                  title: `Custom Value for ${hoveredTemplateField}`,
                                  message: `Enter custom value for ${hoveredTemplateField}:`,
                                  placeholder: `e.g., I have read the ${hoveredTemplateField}`,
                                  initialValue: currentPerFieldValue,
                                  onConfirm: (value: string) => {
                                    setFieldCustomValues(prev => ({
                                      ...prev,
                                      [hoveredTemplateField]: value
                                    }));
                                  }
                                });
                              } else {
                                // For non-checkbox fields, use global custom value
                                setModalConfig({
                                  title: 'Custom Value',
                                  message: 'Enter custom value (use {{field}} for field name):',
                                  placeholder: 'e.g., I have read the info for {{field}}',
                                  initialValue: customValue,
                                  onConfirm: (value: string) => {
                                    setCustomValue(value);
                                  }
                                });
                              }
                              setShowCustomModal(true);
                              console.log('Set showCustomModal to true');
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            className="p-1 text-white hover:bg-gray-700 rounded"
                            title="Copy field tag"
                            onClick={() => {
                              navigator.clipboard.writeText(`{{${hoveredTemplateField}}}`);
                              addToast({ type: 'success', message: 'Field tag copied!' });
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>

                          <button
                            className="p-1 text-white hover:bg-gray-700 rounded"
                            title="Clear customizations"
                            onClick={() => {
                              setCustomValue('');
                              addToast({ type: 'success', message: 'Customizations cleared!' });
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn bg-indigo-600 text-white border"
                    onClick={() => setPreviewHtml(emailTemplate)}
                  >
                    Preview HTML
                  </button>
                  <button type="button" className="btn btn-secondary border border-gray-400 hover:bg-gray-100 text-gray-700" onClick={() => {
                    const selectedForm = forms.find(f => f.id === selectedFormId);
                    const template = selectedForm ? generateFormTemplate(selectedForm) : defaultGenericTemplate;
                    setEmailTemplate(template);
                  }}>Reset to Default</button>
                </div>

                <Modal
                  isOpen={!!previewHtml}
                  onClose={() => setPreviewHtml(null)}
                  title="Preview"
                  maxWidth="3xl"
                >
                  <div className="[&>*]:text-gray-900" dangerouslySetInnerHTML={{ __html: previewHtml || "" }} />
                </Modal>
              </div>
            </div>



            {activeTab === 'admin' && (
              <div className="bg-white border rounded p-6">
                <div className="text-lg font-semibold text-gray-900 mb-4">Conditional Routing</div>
                <div className="text-sm text-gray-700 mb-4">Choose where to send your notification based on form input</div>
                

                <div className="space-y-4">
                    {adminRouting.map((r, index) => (
                        <div
                          key={r.id}
                          className="bg-gray-50 p-3 sm:p-4 rounded border transition-all duration-300 ease-in-out animate-in slide-in-from-top-2 fade-in"
                          style={{
                            animationDelay: `${index * 50}ms`
                          }}
                        >
                          <div className="mb-2 text-sm font-medium text-gray-700">When</div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                              <div className="w-full sm:flex-1 min-w-0">
                                <label className="block sm:hidden text-xs text-gray-600 mb-1">Field</label>
                                <FormSelect
                                  className={`border px-3 py-2 rounded h-10 w-full min-w-0 bg-white ${r.fieldId ? 'text-gray-800' : 'text-gray-600'}`}
                                  value={r.fieldId}
                                  onChange={(e) => updateRouting(r.id, { fieldId: e.target.value })}
                                >
                                  <option value="">Select Field</option>
                                  {fields.map((f) => {
                                    // Use the same field value calculation as the rule builder
                                    const fieldValue = f.elementId || f.fieldName || f.name || (f.id && !f.id.match(/^[0-9a-f]{24}$/) ? f.id : '');
                                    const fieldName = f.displayName || f.name || f.id;
                                    const truncatedName = fieldName.length > 30 ? fieldName.substring(0, 30) + '...' : fieldName;
                                    
                                    return (
                                      <option key={f.id} value={fieldValue} title={fieldName}>
                                        {truncatedName} ({f.type})
                                      </option>
                                    );
                                  })}
                                </FormSelect>
                              </div>

                              <div className="w-full sm:flex-1 min-w-0">
                                <label className="block sm:hidden text-xs text-gray-600 mb-1">Operator</label>
                                <FormSelect
                                  className="border px-3 py-2 rounded h-10 w-full min-w-0 bg-white text-gray-800"
                                  value={r.operator || "is equal to"}
                                  onChange={(e) => updateRouting(r.id, { operator: e.target.value })}
                                >
                                  <option value="is equal to">is equal to</option>
                                  <option value="is not equal to">is not equal to</option>
                                  <option value="contains">contains</option>
                                  <option value="does not contain">does not contain</option>
                                  <option value="is empty">is empty</option>
                                  <option value="is not empty">is not empty</option>
                                  <option value="is greater than">is greater than</option>
                                  <option value="is less than">is less than</option>
                                </FormSelect>
                              </div>

                              <div className="w-full sm:flex-1 min-w-0">
                                <label className="block sm:hidden text-xs text-gray-600 mb-1">Value</label>
                                {(() => {
                                  // Check if operator doesn't require a value
                                  const operatorsWithoutValue = ['is empty', 'is not empty'];
                                  if (operatorsWithoutValue.includes(r.operator || '')) {
                                    return (
                                      <div className="px-3 h-10 flex items-center border rounded text-sm text-gray-500 w-full min-w-0 bg-gray-50">
                                        No value needed
                                      </div>
                                    );
                                  }
                                  
                                  // Find the selected field for this routing rule using the same logic as rule builder
                                  const selectedField = fields.find(field => {
                                    // Use the same field value calculation as the rule builder dropdown options
                                    const fieldValue = field.elementId || field.fieldName || field.name || (field.id && !field.id.match(/^[0-9a-f]{24}$/) ? field.id : '');
                                    return fieldValue === r.fieldId;
                                  });
                                  
                                  // If not found with exact match, try alternative matching strategies (same as rule builder)
                                  let finalSelectedField = selectedField;
                                  if (!finalSelectedField) {
                                    finalSelectedField = fields.find(field => 
                                      field.id === r.fieldId || 
                                      field.name === r.fieldId || 
                                      field.elementId === r.fieldId ||
                                      field.displayName === r.fieldId ||
                                      field.fieldName === r.fieldId ||
                                      // Try normalized matching for field names with spaces/hyphens
                                      (field.name && field.name.toLowerCase().replace(/\s+/g, '-') === r.fieldId?.toLowerCase()) ||
                                      (field.displayName && field.displayName.toLowerCase().replace(/\s+/g, '-') === r.fieldId?.toLowerCase()) ||
                                      (r.fieldId && field.name && field.name.toLowerCase().replace(/\s+/g, '') === r.fieldId.toLowerCase().replace(/\s+/g, ''))
                                    );
                                  }
                                  
                                  console.log('[Notifications] Looking for field with ID:', r.fieldId);
                                  console.log('[Notifications] Available fields:', fields.map(f => ({id: f.id, name: f.name, elementId: f.elementId, type: f.type, hasOptions: f.options && f.options.length > 0, displayName: f.displayName, fieldName: f.fieldName})));
                                  console.log('[Notifications] Selected field for value input:', finalSelectedField);
                                  
                                  if (finalSelectedField) {
                                    console.log('[Notifications] 🔍 Field details for options check:', {
                                      name: finalSelectedField.name,
                                      type: finalSelectedField.type,
                                      typeLowercase: finalSelectedField.type?.toLowerCase(),
                                      hasOptions: finalSelectedField.options && finalSelectedField.options.length > 0,
                                      optionsArray: finalSelectedField.options
                                    });
                                  }
                                  
                                  if (!finalSelectedField) {
                                    console.warn('[Notifications] No field found for routing rule:', {
                                      routingFieldId: r.fieldId,
                                      availableFieldIds: fields.map(f => f.id),
                                      availableFieldNames: fields.map(f => f.name),
                                      availableDisplayNames: fields.map(f => f.displayName)
                                    });
                                  }
                                  
                                  // Check if field is text-based (should show text input)
                                  const isTextBasedField = finalSelectedField && ['text', 'email', 'textarea', 'number', 'tel', 'url'].includes(finalSelectedField.type?.toLowerCase() || '');
                                  
                                  // If it's a text-based field, show a text input
                                  if (isTextBasedField) {
                                    console.log('[Notifications] Rendering text input for field type:', finalSelectedField.type);
                                    return (
                                      <input
                                        type="text"
                                        className="border px-3 h-10 rounded w-full min-w-0 bg-white text-gray-800"
                                        value={r.value || ""}
                                        onChange={(e) => updateRouting(r.id, { value: e.target.value })}
                                        placeholder="Enter value..."
                                      />
                                    );
                                  }
                                  
                                  // Otherwise, show a dropdown for select/radio/checkbox fields
                                  console.log('[Notifications] Rendering dropdown for field');
                                  return (
                                    <FormSelect
                                      className={`border px-3 h-10 rounded w-full min-w-0 bg-white ${r.value ? 'text-gray-800' : 'text-gray-600'}`}
                                      value={r.value || ""}
                                      onChange={(e) => updateRouting(r.id, { value: e.target.value })}
                                    >
                                    <option value="">Select value</option>
                                    {(() => {
                                      if (finalSelectedField && finalSelectedField.type?.toLowerCase() === 'select' && finalSelectedField.options && finalSelectedField.options.length > 0) {
                                        console.log('[Notifications] Field has options:', finalSelectedField.options);
                                        // Show dropdown options for select fields
                                        return finalSelectedField.options.map((option: string, index: number) => (
                                          <option key={index} value={option} className="text-gray-900">
                                            {option}
                                          </option>
                                        ));
                                      } else if (finalSelectedField && ['checkbox', 'radio'].includes(finalSelectedField.type?.toLowerCase() || '')) {
                                        // Show Yes/No for checkboxes and radio buttons (same as rule builder)
                                        return (
                                          <>
                                            <option value="true" className="text-gray-900">Yes</option>
                                            <option value="false" className="text-gray-900">No</option>
                                          </>
                                        );
                                      } else {
                                        console.log('[Notifications] No field selected');
                                        return <option value="" disabled>Select a field first</option>;
                                      }
                                    })()}
                                  </FormSelect>
                                );
                              })()}
                              </div>

                            <button
                              title="Remove routing"
                              aria-label="Remove routing"
                              className="text-red-600 p-2 rounded hover:bg-red-50 sm:self-center flex-shrink-0"
                              onClick={() => removeRouting(r.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 11v6" />
                              </svg>
                            </button>
                          </div>

                          <div className="w-full mt-3">
                            <div className="text-sm text-gray-700 mb-1 font-semibold">Then send to</div>
                            <input placeholder="e.g., sales@example.com, lead@example.com" className="w-full border px-3 py-2 rounded text-gray-700 bg-white break-words" value={r.sendTo || ""} onChange={(e) => updateRouting(r.id, { sendTo: e.target.value })} />
                          </div>

                        </div>
                      ))
                    }
                  </div>

                    <div className="flex mt-5">
                      <button 
                        onClick={addRouting} 
                        className="btn ml-auto border transition-all duration-200 ease-in-out hover:scale-105 active:scale-95" 
                        style={{ color: "#4f46e5", border: "1px solid #4d45e0", backgroundColor: "transparent", fontSize: "14px", lineHeight: "20px", padding: "6px 12px" }}
                      >
                        + Add Routing
                      </button>
                </div>
              </div>
            )}

                  <div className="mt-6 flex justify-end">
                    <button className="btn bg-indigo-600 text-white" onClick={saveNotificationSettings}>Save Settings</button>
                  </div>
                </div>
              </div>
            </main>
          </SidebarProvider>
      </div>

      {/* Custom Modal */}
      <CustomPromptModal
        isOpen={showCustomModal}
        onClose={() => {
          console.log('Modal close called');
          setShowCustomModal(false);
        }}
        onConfirm={(value) => {
          console.log('Modal confirm called with value:', value);
          modalConfig.onConfirm(value);
          setShowCustomModal(false);
        }}
        title={modalConfig.title}
        message={modalConfig.message}
        placeholder={modalConfig.placeholder}
        initialValue={modalConfig.initialValue}
      />
    </div>
  );
}

export default function NotificationsPage({ searchParams }: { searchParams?: { siteId?: string } }) {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <NotificationsInner searchParams={searchParams} />
      </ToastProvider>
    </ProtectedRoute>
  );
}
