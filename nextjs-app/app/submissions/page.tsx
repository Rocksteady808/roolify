'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import ShadcnSidebar from '@/components/ShadcnSidebar';
import { SidebarProvider } from "@/components/ui/sidebar";
import ProtectedRoute from '@/components/ProtectedRoute';
import FormSelect from '@/components/FormSelect';
import type { Submission } from '@/lib/xano';
import { ToastProvider, useToasts } from "@/components/ToastProvider";

type Field = { id?: string; name?: string; type?: string };
type FormMeta = { id?: string; name?: string; fields: Field[]; htmlId?: string; xanoFormId?: number };

export default function SubmissionsPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <SubmissionsPageInner />
      </ToastProvider>
    </ProtectedRoute>
  );
}

function SubmissionsPageInner() {
  const { addToast } = useToasts();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<Set<number>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  
  // Delete confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    submissionId?: number;
    count?: number;
  }>({ isOpen: false, type: 'single' });
  
  // Form selection state
  const [forms, setForms] = useState<FormMeta[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [connectedSites, setConnectedSites] = useState<{ siteId: string; site: any; hasToken: boolean }[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  // Notification settings for custom field values
  const [notificationSettings, setNotificationSettings] = useState<any>(null);
  // Get siteId from localStorage (set by dashboard)
  const [selectedSiteId, setSelectedSiteId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedSiteId') || '';
    }
    return '';
  });

  // Load connected sites on mount
  useEffect(() => {
    loadConnectedSites();
  }, []);

  // Load forms when site is selected and clear form selection
  useEffect(() => {
    if (selectedSiteId) {
      fetchForms(selectedSiteId);
      setSelectedFormId(''); // Reset form selection when site changes
    }
  }, [selectedSiteId]);

  // Listen for URL param changes (site switching)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    const urlSiteId = params.get('siteId') || localStorage.getItem('selectedSiteId') || '';
    
    if (urlSiteId && urlSiteId !== selectedSiteId) {
      console.log('[Submissions] Site changed from', selectedSiteId, 'to', urlSiteId);
      setSelectedSiteId(urlSiteId);
      // Reset state when site changes
      setSelectedFormId('');
      setSelectedSubmissionIds(new Set());
      setSelectedSubmission(null);
    }
    
    // Listen for popstate events (browser back/forward)
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const newSiteId = params.get('siteId') || localStorage.getItem('selectedSiteId') || '';
      if (newSiteId !== selectedSiteId) {
        setSelectedSiteId(newSiteId);
        setSelectedFormId('');
        setSelectedSubmissionIds(new Set());
        setSelectedSubmission(null);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedSiteId]);

  // Auto-refresh disabled to prevent flash/blank state issues
  // useEffect(() => {
  //   if (!selectedSiteId) return;

  //   const refreshInterval = setInterval(() => {
  //     console.log('[Submissions] Auto-refreshing forms with force refresh...');
  //     setLastRefreshTime(Date.now());
  //     fetchForms(selectedSiteId); // This will use aggressive cache busting
  //   }, 10000); // 10 seconds - faster auto-refresh for quick updates

  //   return () => clearInterval(refreshInterval);
  // }, [selectedSiteId]);

  // Don't auto-select first form - let user choose
  // useEffect(() => {
  //   if (forms.length > 0 && !selectedFormId) {
  //     setSelectedFormId(forms[0].id || '');
  //   }
  // }, [forms]);

  // Load submissions on mount and when site changes
  useEffect(() => {
    loadSubmissions();
  }, [selectedSiteId]);
  
  // Also load submissions on initial mount
  useEffect(() => {
    loadSubmissions();
  }, []);

  // Clear selection when form changes
  useEffect(() => {
    setSelectedSubmissionIds(new Set());
  }, [selectedFormId]);

  // Load notification settings when form is selected
  useEffect(() => {
    if (selectedFormId && selectedSiteId && forms.length > 0) {
      loadNotificationSettings(selectedFormId);
    } else {
      setNotificationSettings(null);
    }
  }, [selectedFormId, selectedSiteId, forms]);

  const loadConnectedSites = async () => {
    try {
      // Get auth token from localStorage and send in Authorization header
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('xano_auth_token') : null;
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const resp = await fetch("/api/webflow/sites", { headers });
      if (!resp.ok) return;
      const data = await resp.json();
      const sites = data.sites || [];
      setConnectedSites(sites);

      // Auto-select first site if available
      if (sites.length > 0 && !selectedSiteId) {
        const firstSiteId = sites[0].siteId || "";
        setSelectedSiteId(firstSiteId);
      }
    } catch (err) {
      console.error("Failed to load connected sites:", err);
    }
  };

  const loadNotificationSettings = async (formId: string) => {
    try {
      console.log('[Submissions] Loading notification settings for form:', formId, 'site:', selectedSiteId);
      
      // Both formId and siteId are required for the API
      if (!selectedSiteId) {
        console.log('[Submissions] No site selected, cannot load notification settings');
        setNotificationSettings(null);
        return;
      }
      
      // Find the form to get its htmlId (HTML form ID)
      const selectedForm = forms.find(f => f.id === formId);
      if (!selectedForm || !selectedForm.htmlId) {
        console.log('[Submissions] Form not found or missing htmlId:', formId);
        setNotificationSettings(null);
        return;
      }
      
      console.log('[Submissions] Using htmlId for notification settings:', selectedForm.htmlId);
      const response = await fetch(`/api/notifications?formId=${encodeURIComponent(selectedForm.htmlId)}&siteId=${encodeURIComponent(selectedSiteId)}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[Submissions] Loaded notification settings:', data);
        setNotificationSettings(data);
      } else {
        console.log('[Submissions] No notification settings found for form:', selectedForm.htmlId);
        setNotificationSettings(null);
      }
    } catch (err) {
      console.error('[Submissions] Failed to load notification settings:', err);
      setNotificationSettings(null);
    }
  };

  const fetchForms = async (siteId: string) => {
    if (!siteId) return;

    try {
      console.log('[Submissions] Fetching forms for site:', siteId);
      
      // FIRST: Fetch forms from Xano to get the mapping between form_id and html_form_id
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('xano_auth_token') : null;
      const xanoFormsResp = await fetch(`${process.env.NEXT_PUBLIC_XANO_API_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj'}/form`, {
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      let xanoFormsMap = new Map<string, any>(); // Map html_form_id -> xano form
      let xanoFormsById = new Map<number, any>(); // Map form_id -> xano form
      
      if (xanoFormsResp.ok) {
        const xanoForms = await xanoFormsResp.json();
        console.log('[Submissions] Loaded Xano forms:', xanoForms.length);
        xanoForms.forEach((form: any) => {
          if (form.html_form_id) {
            const existing = xanoFormsMap.get(form.html_form_id);
            // Prefer the newest record for the same HTML id
            if (!existing || (form.created_at && existing?.created_at && form.created_at > existing.created_at) || (form.id && existing?.id && form.id > existing.id)) {
              xanoFormsMap.set(form.html_form_id, form);
            }
          }
          xanoFormsById.set(form.id, form);
        });
      }
      
      // First, fetch pages to get publish status
      const pagesResp = await fetch(`/api/webflow/site/${encodeURIComponent(siteId)}/pages`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      let publishedPageIds = new Set<string>();

      if (pagesResp.ok) {
        const pagesData = await pagesResp.json();
        const pages = pagesData.pages || [];
        
        pages.forEach((page: any) => {
          // Only include published, non-archived pages
          // Exclude: draft pages (draft: true) and archived pages (archived: true)
          // NOTE: Webflow uses "draft" not "isDraft"
          if (!page.archived && !page.draft) {
            publishedPageIds.add(page.id);
          }
        });
        
        console.log('[Submissions] Page status:', {
          total: pages.length,
          published: publishedPageIds.size
        });
      }
      
      // Use Webflow API directly with aggressive cache-busting
      try {
        const cacheBuster = `?_refresh=${Date.now()}&_force=${Math.random()}&_timestamp=${Date.now()}`;
        const webflowResp = await fetch(`/api/webflow/site/${encodeURIComponent(siteId)}/forms${cacheBuster}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (webflowResp.ok) {
          const webflowData = await webflowResp.json();
          const webflowForms = webflowData.forms?.forms || webflowData.forms || [];
          
          console.log('[Submissions] Found forms in Webflow:', webflowForms.length);
          
          if (webflowForms.length > 0) {
          // NOTE: Server-side filtering already handles:
          // - Utility Pages folder exclusion
          // - Style Guide / Password / 404 / Utility page exclusion
          // - Deduplication by ID and name
          // No need for client-side filtering - just use the pre-filtered forms!

          console.log(`[Submissions] ✅ Using ${webflowForms.length} pre-filtered forms from server`);

          // Convert Webflow form format to FormMeta format, enriched with Xano data
          const items = webflowForms.map((f: any) => {
              // Convert fields object to array
              const fieldsArray = f.fields ? Object.entries(f.fields).map(([fieldId, fieldData]: [string, any]) => ({
                id: fieldId,
                name: fieldData.displayName || fieldData.name || fieldId,
                type: fieldData.type || ""
              })) : [];

              // Look up corresponding Xano form by html_form_id
              const htmlId = f.htmlId || f.id;
              const xanoForm = xanoFormsMap.get(htmlId);

              return {
                id: xanoForm ? String(xanoForm.id) : (f.htmlId || f.id), // Use Xano form_id if available
                name: f.displayName || f.name || f.id,
                fields: fieldsArray,
                htmlId: htmlId,
                xanoFormId: xanoForm?.id // Store Xano ID for matching
              };
            });
            
            setForms(items);
            console.log('[Submissions] Loaded', items.length, 'forms from Webflow (with Xano mapping)');
            return;
          }
        }
      } catch (webflowErr) {
        console.warn('[Submissions] Failed to fetch forms from Webflow:', webflowErr);
      }
      
      // Fallback to Webflow API
      const isConnectedSite = connectedSites.find((s) => s.siteId === siteId && s.hasToken);
      
      if (isConnectedSite) {
        const resp = await fetch(`/api/webflow/site/${encodeURIComponent(siteId)}/forms`);
        if (!resp.ok) {
          console.error('[Submissions] Failed to fetch webflow forms');
          return;
        }
        const data = await resp.json();
        const formsArray = data.forms?.forms || data.forms || [];
        
        const items = formsArray.map((f: any) => {
          const fieldsArray = f.fields ? Object.entries(f.fields).map(([fieldId, fieldData]: [string, any]) => ({
            id: fieldId,
            name: fieldData.displayName || fieldData.name || fieldId,
            type: fieldData.type || ""
          })) : [];

          // Look up corresponding Xano form by html_form_id
          const htmlId = f.htmlId || f.id || f._id;
          const xanoForm = xanoFormsMap.get(htmlId);

          return {
            id: xanoForm ? String(xanoForm.id) : (f.id || f._id), // Use Xano form_id if available
            htmlId: htmlId,
            name: f.displayName || f.name || f.slug || f.id,
            fields: fieldsArray,
            xanoFormId: xanoForm?.id // Store Xano ID for matching
          };
        });
        
        setForms(items);
        console.log('[Submissions] Loaded', items.length, 'forms from Webflow API (with Xano mapping)');
      } else {
        // Fallback to stored forms
        const res = await fetch(`/api/forms/${siteId}`);
        if (!res.ok) {
          console.error('[Submissions] Failed to fetch forms');
          return;
        }
        const resData = await res.json();
        setForms(resData.forms || []);
        console.log('[Submissions] Loaded', (resData.forms || []).length, 'forms from stored API');
      }
    } catch (err) {
      console.error('[Submissions] Error fetching forms:', err);
    }
  };

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let allSubmissions: any[] = [];

      // Fetch from Xano (captured submissions) - no-store to avoid caching
      try {
        // Get auth token from localStorage and send in Authorization header
        const authToken = typeof window !== 'undefined' ? localStorage.getItem('xano_auth_token') : null;
        const headers: HeadersInit = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const xanoResponse = await fetch('/api/submissions', {
          cache: 'no-store',
          headers
        });
        if (xanoResponse.ok) {
          const xanoResult = await xanoResponse.json();
          const xanoData = (xanoResult.submissions || []).map((s: any) => {
            // The API already parsed submission_data into s.data
            // s.data contains the full parsed object like: { data: {...}, _htmlFormId: "...", ... }
            // We need to extract the actual form fields from either s.data.data or s.data.formData
            let formFields = {};
            
            if (s.data) {
              // Support both {data: {...}} and {formData: {...}} structures
              formFields = s.data.data || s.data.formData || s.data;
              
              // Debug logging
              console.log(`[Submissions] Processing submission #${s.id}:`, {
                hasData: !!s.data.data,
                hasFormData: !!s.data.formData,
                formFieldsKeys: Object.keys(formFields),
                sample: Object.keys(formFields).slice(0, 3)
              });
            }
            
            return {
              id: s.id,
              created_at: s.created_at,
              form_id: s.form_id,
              user_id: s.user_id,
              data: formFields,  // This is our actual form field data
              source: 'xano_captured'
            };
          });
          allSubmissions = [...allSubmissions, ...xanoData];
          console.log(`[Submissions] Loaded ${xanoData.length} submissions from Xano`);
        }
      } catch (err) {
        console.error('[Submissions] Failed to load Xano submissions:', err);
      }

      // Fetch from Webflow API if site is selected
      if (selectedSiteId) {
        try {
          const webflowResponse = await fetch(`/api/webflow/submissions/${selectedSiteId}`);
          if (webflowResponse.ok) {
            const webflowResult = await webflowResponse.json();
            const webflowData = (webflowResult.submissions || []).map((s: any) => ({
              ...s,
              source: 'webflow_api'
            }));
            allSubmissions = [...allSubmissions, ...webflowData];
            console.log(`[Submissions] Loaded ${webflowData.length} submissions from Webflow API`);
          }
        } catch (err) {
          console.error('[Submissions] Failed to load Webflow submissions:', err);
        }
      }

      // Sort by most recent first
      const sorted = allSubmissions.sort((a: any, b: any) => b.created_at - a.created_at);
      setSubmissions(sorted);
      
      console.log(`[Submissions] Total: ${sorted.length} submissions`);
    } catch (error: any) {
      console.error('Failed to load submissions:', error);
      setError(error.message || 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const showDeleteConfirmation = (submissionId: number) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'single',
      submissionId,
    });
  };

  const showBulkDeleteConfirmation = () => {
    if (selectedSubmissionIds.size === 0) {
      addToast({ type: 'error', message: 'Please select submissions to delete' });
      return;
    }
    
    setDeleteConfirmation({
      isOpen: true,
      type: 'bulk',
      count: selectedSubmissionIds.size,
    });
  };

  const deleteSubmission = async (submissionId: number) => {
    try {
      setIsDeleting(submissionId);
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete submission');
      }

      // Remove from state
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      
      // Close modal if this submission was selected
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(null);
      }

      // Remove from selected IDs
      setSelectedSubmissionIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });

      addToast({ type: 'success', message: 'Submission deleted successfully' });
    } catch (error: any) {
      console.error('Failed to delete submission:', error);
      addToast({ type: 'error', message: 'Error: ' + (error.message || 'Failed to delete submission') });
    } finally {
      setIsDeleting(null);
      setDeleteConfirmation({ isOpen: false, type: 'single' });
    }
  };

  const deleteSelectedSubmissions = async () => {
    try {
      setIsDeletingBulk(true);
      const deletePromises = Array.from(selectedSubmissionIds).map(id =>
        fetch(`/api/submissions/${id}`, { method: 'DELETE' })
      );

      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter(r => r.status === 'rejected').length;
      const succeeded = selectedSubmissionIds.size - failed;

      if (failed > 0) {
        addToast({ 
          type: 'error', 
          title: 'Partially completed',
          message: `Deleted ${succeeded} submission${succeeded > 1 ? 's' : ''}, ${failed} failed` 
        });
      } else {
        addToast({ 
          type: 'success', 
          message: `Successfully deleted ${succeeded} submission${succeeded > 1 ? 's' : ''}` 
        });
      }

      // Remove deleted submissions from state
      setSubmissions(prev => prev.filter(s => !selectedSubmissionIds.has(s.id)));
      
      // Clear selection
      setSelectedSubmissionIds(new Set());
      
      // Close modal if selected submission was deleted
      if (selectedSubmission && selectedSubmissionIds.has(selectedSubmission.id)) {
        setSelectedSubmission(null);
      }
    } catch (error: any) {
      console.error('Failed to delete submissions:', error);
      addToast({ type: 'error', message: 'Error: ' + (error.message || 'Failed to delete submissions') });
    } finally {
      setIsDeletingBulk(false);
      setDeleteConfirmation({ isOpen: false, type: 'bulk' });
    }
  };

  const confirmDelete = () => {
    if (deleteConfirmation.type === 'single' && deleteConfirmation.submissionId) {
      deleteSubmission(deleteConfirmation.submissionId);
    } else if (deleteConfirmation.type === 'bulk') {
      deleteSelectedSubmissions();
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, type: 'single' });
  };

  const toggleSelectAll = () => {
    if (selectedSubmissionIds.size === filteredSubmissions.length) {
      // Deselect all
      setSelectedSubmissionIds(new Set());
    } else {
      // Select all
      setSelectedSubmissionIds(new Set(filteredSubmissions.map(s => s.id)));
    }
  };

  const toggleSelectSubmission = (submissionId: number) => {
    setSelectedSubmissionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  // Helper function to apply custom field values
  const applyCustomFieldValue = (fieldName: string, fieldValue: any): string => {
    // Check if we have custom values configured for this field
    const fieldCustomValues = notificationSettings?.field_custom_values;

    const isChecked = fieldValue === 'on' || fieldValue === 'true' || fieldValue === true;
    const isUnchecked = fieldValue === 'off' || fieldValue === 'false' || fieldValue === false;

    // Per-field custom value (check both exact match and normalized match)
    if (fieldCustomValues) {
      // Try exact match first
      if (fieldCustomValues[fieldName]) {
        if (isChecked) return fieldCustomValues[fieldName];
        if (isUnchecked) return '';
      }

      // Try normalized match (remove spaces, hyphens, lowercase)
      const normalizedFieldName = fieldName.toLowerCase().replace(/[-_\s]/g, '');
      for (const [customFieldName, customValue] of Object.entries(fieldCustomValues)) {
        const normalizedCustomFieldName = customFieldName.toLowerCase().replace(/[-_\s]/g, '');
        if (normalizedCustomFieldName === normalizedFieldName) {
          if (isChecked) return String(customValue);
          if (isUnchecked) return '';
        }
      }
    }

    // Global custom value
    if (!fieldCustomValues && notificationSettings?.custom_value && isChecked) {
      return notificationSettings.custom_value.replace(/\{\{field\}\}/g, fieldName);
    }

    // Fallbacks for checkbox values
    if (isUnchecked) return '';
    if (isChecked) return 'true';

    // Return original value for non-checkbox fields
    return String(fieldValue || '');
  };

  const exportToCSV = async () => {
    if (filteredSubmissions.length === 0) {
      addToast({ type: 'error', message: 'No submissions to export' });
      return;
    }

    try {
      // Try to use the server-side export endpoint first (more robust)
      const exportUrl = new URL('/api/submissions/export', window.location.origin);
      if (selectedFormId) {
        exportUrl.searchParams.set('formId', selectedFormId);
      }
      exportUrl.searchParams.set('format', 'csv');

      console.log('[Export] Using server-side export endpoint:', exportUrl.toString());

      const response = await fetch(exportUrl.toString());
      
      if (response.ok) {
        // Server-side export succeeded
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `form-submissions-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('[Export] Server-side export completed successfully');
        return;
      } else {
        console.warn('[Export] Server-side export failed, falling back to client-side export');
      }
    } catch (error) {
      console.warn('[Export] Server-side export failed:', error);
    }

    // Fallback to client-side export (original logic)
    console.log('[Export] Using client-side export fallback');

    // Get field names from the form definition, not from submission data
    const allFields = new Set<string>();
    
    // First, try to get fields from the selected form
    if (selectedFormId) {
      const selectedForm = forms.find(f => 
        f.id === String(selectedFormId) || 
        f.htmlId === String(selectedFormId) ||
        parseInt(f.id || '0') === Number(selectedFormId)
      );
      
      if (selectedForm && selectedForm.fields) {
        selectedForm.fields.forEach(field => {
          if (field.name) {
            allFields.add(field.name);
          }
        });
      }
    }
    
    // If no form fields found, fall back to collecting from submission data
    // Collect ALL field names from all submissions (excluding metadata)
    if (allFields.size === 0) {
      filteredSubmissions.forEach(submission => {
        const data = (submission as any).data || {};
        Object.keys(data).forEach(key => {
          // Exclude internal metadata fields (prefixed with _)
          if (!key.startsWith('_')) {
            allFields.add(key);
          }
        });
      });
    }

    // Debug: Log the fields we're using for export
    console.log('[Export] Fields detected for CSV export:', Array.from(allFields).sort());
    console.log('[Export] Sample submission data:', filteredSubmissions[0]?.data);

    // Convert Set to Array and sort for consistent ordering
    const sortedFields = Array.from(allFields).sort();
    const fieldNames = ['ID', 'Form', 'Submitted At', ...sortedFields];
    
    // Create CSV header
    const csvRows = [];
    csvRows.push(fieldNames.map(f => `"${f}"`).join(','));

    // Add data rows
    filteredSubmissions.forEach(submission => {
      const data = (submission as any).data || {};
      
      // Get form name - try multiple approaches
      let formName = `Form ${submission.form_id}`;
      
      // First try to find by form_id
      const formById = forms.find(f => 
        f.id === String(submission.form_id) || 
        parseInt(f.id || '0') === submission.form_id
      );
      
      if (formById) {
        formName = formById.name || formById.htmlId || formName;
      } else {
        // Try to find by HTML form ID from submission metadata
        const htmlFormId = data._htmlFormId;
        if (htmlFormId) {
          const formByHtmlId = forms.find(f => f.htmlId === htmlFormId);
          if (formByHtmlId) {
            formName = formByHtmlId.name || formByHtmlId.htmlId || formName;
          } else {
            // Use the HTML form ID as form name if no match found
            formName = htmlFormId;
          }
        }
      }

      const row = [
        submission.id,
        formName,
        formatDate(submission.created_at),
        ...sortedFields.map(field => {
          let value = data[field] || '';

          // Apply custom field values from notification settings
          value = applyCustomFieldValue(field, value);

          // Escape quotes and wrap in quotes
          return `"${String(value).replace(/"/g, '""')}"`;
        })
      ];
      csvRows.push(row.join(','));
    });

    // Create and download file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `form-submissions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Debug: Log all submissions and forms
  console.log('[Submissions Debug] Total submissions:', submissions.length);
  console.log('[Submissions Debug] All submissions:', submissions);
  console.log('[Submissions Debug] Forms:', forms);
  console.log('[Submissions Debug] Forms with Xano mapping:', forms.map(f => ({
    id: f.id,
    name: f.name,
    htmlId: f.htmlId,
    xanoFormId: f.xanoFormId
  })));
  console.log('[Submissions Debug] Selected form ID:', selectedFormId);

  // Improved filtering - match by Xano form_id and normalized HTML form ID
  let filteredSubmissions = selectedFormId 
    ? submissions.filter(s => {
        const selectedForm = forms.find(f => f.id === selectedFormId);

        // Normalize helper: case-insensitive, remove spaces/underscores/dashes
        const normalize = (val?: string) => (val || '')
          .toString()
          .toLowerCase()
          .replace(/\s|_|-/g, '');
        
        // Check submission data for HTML form ID and form name
        const submissionData = (s as any).data || {};
        const submissionHtmlFormId = submissionData._htmlFormId as string | undefined;
        const submissionFormName = submissionData._formName as string | undefined;

        // Candidate identifiers to compare against
        const selectedNumericId = selectedFormId;
        const selectedXanoFormId = selectedForm?.xanoFormId ? String(selectedForm.xanoFormId) : undefined;
        const selectedHtmlId = selectedForm?.htmlId;

        // Match by any of the following:
        // 1) Xano numeric form_id equals selected numeric id
        // 2) Xano numeric form_id equals selected form's mapped xanoFormId
        // 3) Raw HTML id equals selected form's HTML id
        // 4) Normalized HTML ids equal (handles hyphens/spacing/case)
        // 5) Selected id itself may be an HTML id; compare that to submission HTML id (raw and normalized)
        const matches = 
          String(s.form_id) === selectedNumericId ||
          (selectedXanoFormId && String(s.form_id) === selectedXanoFormId) ||
          (selectedHtmlId && submissionHtmlFormId === selectedHtmlId) ||
          (selectedHtmlId && normalize(submissionHtmlFormId) === normalize(selectedHtmlId)) ||
          (submissionHtmlFormId && (submissionHtmlFormId === selectedNumericId || normalize(submissionHtmlFormId) === normalize(selectedNumericId))) ||
          // Also match by normalized form name to catch cases where htmlId differs (wf-form-* vs API id)
          (submissionFormName && selectedForm?.name && normalize(submissionFormName) === normalize(selectedForm.name));

        console.log(`[Filter] Submission #${s.id}: form_id=${s.form_id}, htmlFormId=${submissionHtmlFormId}, formName=${submissionFormName}, selectedFormId=${selectedFormId}, selectedHtmlId=${selectedHtmlId}, selectedXanoFormId=${selectedXanoFormId}, selectedName=${selectedForm?.name}, matches=${matches}`);

        return matches;
      })
    : []; // Show empty if no form selected (user must select a form)

  // Fallback: if nothing matched by IDs, try matching by normalized form names
  if (selectedFormId && filteredSubmissions.length === 0) {
    const selectedForm = forms.find(f => f.id === selectedFormId);
    if (selectedForm) {
      const normalize = (val?: string) => (val || '')
        .toString()
        .toLowerCase()
        .replace(/\s|_|-/g, '');
      filteredSubmissions = submissions.filter(s => {
        const data = (s as any).data || {};
        const formName = data._formName as string | undefined;
        const matchesByName = formName && normalize(formName) === normalize(selectedForm.name);
        if (matchesByName) {
          console.log(`[Filter-Fallback] Matched by name: submission #${s.id} _formName="${formName}" selectedName="${selectedForm.name}"`);
        }
        return !!matchesByName;
      });
    }
  }

  

  // Get the selected form object
  const selectedForm = forms.find(f => f.id === selectedFormId);

  // Parse submission data
  const parseSubmissionData = (dataString: string) => {
    try {
      return JSON.parse(dataString);
    } catch {
      return dataString;
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp); // Xano stores milliseconds
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get time ago
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000); // Xano stores milliseconds
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };
    
    for (const [name, secondsInInterval] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInInterval);
      if (interval >= 1) {
        return interval === 1 ? `1 ${name} ago` : `${interval} ${name}s ago`;
      }
    }
    
    return 'just now';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarProvider>
        <ShadcnSidebar />
        <main className="relative flex w-full flex-1 flex-col bg-gray-50 px-4 lg:px-6 pt-20 lg:pt-8 pb-8 overflow-x-hidden">
          <div className="max-w-7xl w-full mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Form Submissions</h1>
              <p className="text-sm text-gray-600">View and manage all form submissions</p>
            </div>
            <div className="flex items-center gap-3">
              {connectedSites.length > 0 && (
                <>
                  <FormSelect 
                    className="border px-3 py-2 rounded text-sm text-gray-800 bg-white w-64 min-w-64" 
                    value={selectedFormId} 
                    onChange={(e) => setSelectedFormId(e.target.value)}
                    disabled={forms.length === 0}
                  >
                    <option value="">Select a form</option>
                    {forms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name || f.id}
                      </option>
                    ))}
                  </FormSelect>
                </>
              )}
              
              <button
                onClick={loadSubmissions}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                title="Force refresh forms from Webflow"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    {selectedFormId ? 'Form Submissions' : 'Total Submissions'}
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">{filteredSubmissions.length}</div>
                  {selectedFormId && (
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedForm?.name || `Form ${selectedFormId}`}
                    </div>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M9 8h.01M15 8h.01M7 7a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Today</div>
                  <div className="text-2xl font-bold text-green-600">
                    {filteredSubmissions.filter(s => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const todayTimestamp = today.getTime() / 1000;
                      return s.created_at >= todayTimestamp;
                    }).length}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">This Week</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredSubmissions.filter(s => {
                      const weekAgo = Date.now() / 1000 - (7 * 24 * 60 * 60);
                      return s.created_at >= weekAgo;
                    }).length}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="bg-white border rounded-lg">
            {/* Header with Actions */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Form Submissions</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'submission' : 'submissions'}
                  {selectedSubmissionIds.size > 0 && ` · ${selectedSubmissionIds.size} selected`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedSubmissionIds.size > 0 && (
                  <button
                    onClick={showBulkDeleteConfirmation}
                    disabled={isDeletingBulk}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {isDeletingBulk ? 'Deleting...' : `Delete (${selectedSubmissionIds.size})`}
                  </button>
                )}
                {/* Removed debug "Show all" toggle */}
                <button
                  onClick={exportToCSV}
                  disabled={filteredSubmissions.length === 0}
                  className="px-3 py-2 border border-gray-300 bg-white text-gray-700 text-sm rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-b border-red-200">
                <div className="flex items-center gap-2 text-red-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading submissions...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M9 8h.01M15 8h.01M7 7a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {!selectedFormId
                    ? "Please select a form to view submissions."
                    : submissions.length === 0 
                    ? "Get started by receiving form submissions from your Webflow site."
                    : `No submissions found for ${selectedForm?.name || 'this form'}.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={filteredSubmissions.length > 0 && selectedSubmissionIds.size === filteredSubmissions.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submission ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Form ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preview
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubmissions.map((submission) => {
                      const submissionData = (submission as any).data || {};
                      
                      // Debug: Log the submission data structure
                      if (Object.keys(submissionData).length === 0) {
                        console.log('[Preview Debug] Submission #' + submission.id + ' has no data:', submission);
                      }
                      
                      // Generate preview: filter out internal fields (starting with _) and show first 2-3 fields
                      const previewFields = Object.entries(submissionData)
                        .filter(([key]) => !key.startsWith('_')) // Exclude internal metadata
                        .slice(0, 3); // Show up to 3 fields
                      
                      const previewText = previewFields.length > 0
                        ? previewFields
                            .map(([k, v]) => {
                              const value = String(v).substring(0, 40); // Truncate long values
                              return `${k}: ${value}`;
                            })
                            .join(' • ')
                        : 'No data';
                      
                      // Try to find form name
                      const submissionForm = forms.find(f => 
                        f.id === String(submission.form_id) || 
                        f.htmlId === String(submission.form_id) ||
                        parseInt(f.id || '0') === submission.form_id
                      );

                      return (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedSubmissionIds.has(submission.id)}
                              onChange={() => toggleSelectSubmission(submission.id)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">#{submission.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {submissionForm?.name || `Form ${submission.form_id}`}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(submission.created_at)}</div>
                            <div className="text-xs text-gray-500">{getTimeAgo(submission.created_at)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
                              {previewText}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setSelectedSubmission(submission)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => showDeleteConfirmation(submission.id)}
                              disabled={isDeleting === submission.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              {isDeleting === submission.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </SidebarProvider>

      {/* Modal for viewing submission details */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Submission Details</h2>
                <p className="text-sm text-gray-600">ID: #{selectedSubmission.id}</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
                  <div className="text-base text-gray-900">
                    {(() => {
                      const submissionForm = forms.find(f => 
                        f.id === String(selectedSubmission.form_id) || 
                        f.htmlId === String(selectedSubmission.form_id) ||
                        parseInt(f.id || '0') === selectedSubmission.form_id
                      );
                      return submissionForm?.name || `Form ${selectedSubmission.form_id}`;
                    })()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted At</label>
                  <div className="text-base text-gray-900">
                    {formatDate(selectedSubmission.created_at)}
                    <span className="text-sm text-gray-500 ml-2">({getTimeAgo(selectedSubmission.created_at)})</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Submission Data</label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {(() => {
                      const data = (selectedSubmission as any).data || {};
                      if (typeof data === 'object' && data !== null) {
                        // Filter out internal metadata fields (those starting with _)
                        const displayData = Object.entries(data).filter(([key]) => !key.startsWith('_'));
                        
                        if (displayData.length === 0) {
                          return <p className="text-sm text-gray-500">No submission data available</p>;
                        }
                        
                        // Apply custom values for checkbox fields
                        const processedData = displayData.map(([key, value]) => {
                          // Use custom field value if available
                          const customValue = applyCustomFieldValue(String(key), value);

                          // If custom value is different from original, use it
                          if (customValue !== String(value || '')) {
                            return [key, customValue];
                          }

                          return [key, value];
                        });
                        
                        return (
                          <dl className="space-y-3">
                            {processedData.map(([key, value]) => (
                              <div key={String(key)} className="grid grid-cols-3 gap-4">
                                <dt className="text-sm font-medium text-gray-900">{String(key)}:</dt>
                                <dd className="text-sm text-gray-700 col-span-2">
                                  {(() => {
                                    const stringValue = String(value);
                                    
                                    // Check if it's an email address
                                    if (String(key).toLowerCase().includes('email') && stringValue.includes('@')) {
                                      return (
                                        <a 
                                          href={`mailto:${stringValue}`}
                                          className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                          {stringValue}
                                        </a>
                                      );
                                    }
                                    
                                    // Check if it contains HTML links (for custom values)
                                    if (stringValue.includes('<a href=')) {
                                      return (
                                        <div 
                                          dangerouslySetInnerHTML={{ __html: stringValue }}
                                          className="text-blue-600 hover:text-blue-800"
                                        />
                                      );
                                    }
                                    
                                    // Default text display
                                    return stringValue;
                                  })()}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        );
                      } else {
                        return <pre className="text-sm text-gray-700 whitespace-pre-wrap">{String(data)}</pre>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <button
                onClick={() => showDeleteConfirmation(selectedSubmission.id)}
                disabled={isDeleting === selectedSubmission.id}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting === selectedSubmission.id ? 'Deleting...' : 'Delete Submission'}
              </button>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            {/* Header */}
            <div className="flex items-start gap-4 p-6 border-b border-gray-200">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {deleteConfirmation.type === 'single' 
                    ? 'Delete Submission?' 
                    : `Delete ${deleteConfirmation.count} Submissions?`}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {deleteConfirmation.type === 'single' 
                    ? `Are you sure you want to delete submission #${deleteConfirmation.submissionId}? This will permanently remove this form submission from your database.`
                    : `Are you sure you want to delete ${deleteConfirmation.count} submission${deleteConfirmation.count! > 1 ? 's' : ''}? This will permanently remove ${deleteConfirmation.count === 1 ? 'this submission' : 'these submissions'} from your database.`}
                </p>
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-medium text-red-800">
                    Warning: This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-6 bg-gray-50">
              <button
                onClick={cancelDelete}
                disabled={isDeletingBulk || isDeleting !== null}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeletingBulk || isDeleting !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {(isDeletingBulk || isDeleting !== null) ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {deleteConfirmation.type === 'single' ? 'Delete Submission' : `Delete ${deleteConfirmation.count} Submissions`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

