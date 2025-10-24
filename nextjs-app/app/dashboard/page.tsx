"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ShadcnSidebar from "@/components/ShadcnSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import SiteSelector from "@/components/SiteSelector";
import ProtectedRoute from "@/components/ProtectedRoute";

type Field = { id?: string; name?: string; type?: string };
type FormMeta = { 
  id?: string; 
  name?: string; 
  fields: Field[]; 
  createdAt?: string | null;
};

export default function DashboardPage() {
  const [siteId, setSiteId] = useState("");
  const [forms, setForms] = useState<FormMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [connectedSites, setConnectedSites] = useState<{ siteId: string; site: any; hasToken: boolean }[]>([]);
  // Read from localStorage on initialization
  const [selectedSiteId, setSelectedSiteId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedSiteId') || '';
    }
    return '';
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [rulesCount, setRulesCount] = useState<number>(0);
  const [formRuleCounts, setFormRuleCounts] = useState<Record<string, number>>({});
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState<boolean>(true);
  const [isSwitchingSite, setIsSwitchingSite] = useState<boolean>(false);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState<boolean>(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [previousFormCount, setPreviousFormCount] = useState<number>(0);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(false);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);
  const [designerSiteId, setDesignerSiteId] = useState<string>('');
  const [designerSiteName, setDesignerSiteName] = useState<string>('');
  const [isSyncingToXano, setIsSyncingToXano] = useState<boolean>(false);

  // Ref to track current site ID to prevent stale closures in auto-refresh
  const currentSiteIdRef = useRef<string>(siteId);
  
  // Ref to track previous forms for deep change detection
  const previousFormsRef = useRef<FormMeta[]>([]);

  useEffect(() => {
    // Detect if running in iframe (Designer Extension)
    const checkIframe = () => {
      if (typeof window !== 'undefined') {
        setIsInIframe(window.self !== window.top);
      }
    };
    checkIframe();

    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const urlSiteId = params.get("siteId") || "";
    const storedSiteId = typeof window !== 'undefined' ? localStorage.getItem('selectedSiteId') || "" : "";
    const s = urlSiteId || storedSiteId;
    if (s) {
      setSiteId(s);
      setSelectedSiteId(s); // Keep selectedSiteId in sync
    }
    // load connected sites
    loadConnectedSites();

    // Removed visibility change and focus listeners to prevent race conditions
    // The 15-second auto-refresh is sufficient for keeping data fresh
  }, []);

  // Listen for current site info from Designer Extension
  useEffect(() => {
    if (!isInIframe) return;
    
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from trusted origins
      if (event.origin !== 'http://localhost:1337' && event.origin !== 'http://localhost:3000') return;
      
      if (event.data.type === 'CURRENT_SITE_INFO') {
        console.log('[Dashboard] Received site info from extension:', event.data.payload);
        const { siteId: newSiteId, siteName } = event.data.payload;
        setDesignerSiteId(newSiteId);
        setDesignerSiteName(siteName);
        setSelectedSiteId(newSiteId); // Auto-select this site
        setSiteId(newSiteId); // Also set siteId
        
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedSiteId', newSiteId);
        }
        
        console.log('[Dashboard] Auto-selected site from extension:', siteName, newSiteId);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Request site info from extension on load
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'ROOLIFY_REQUEST_SITE_INFO',
        source: 'roolify-app'
      }, '*');
    }
    
    return () => window.removeEventListener('message', handleMessage);
  }, [isInIframe]);

  useEffect(() => {
    const id = selectedSiteId || siteId;
    if (!id || connectedSites.length === 0) return;
    
    // Store the selected site in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedSiteId', id);
    }
    
    // Only fetch forms on initial load or when actually switching sites
    // This prevents unnecessary loading animations when just navigating to dashboard
    if (!hasInitialized) {
      setHasInitialized(true);
    fetchForms(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteId, siteId, connectedSites]);

  // Load per-form rule counts and activities when forms change
  useEffect(() => {
    let ignore = false;
    async function loadCounts() {
      if (!forms || forms.length === 0) {
        setFormRuleCounts({});
        setRulesCount(0); // Clear rules count when no forms
        setActivities([]); // Clear activities when no forms
        return;
      }
      try {
        const results = await Promise.all(
          forms.map(async (f) => {
            const id = f.id || '';
            if (!id) return [id, 0] as const;
            try {
              const resp = await fetch(`/api/form-rules?formId=${encodeURIComponent(id)}`);
              if (!resp.ok) return [id, 0] as const;
              const data = await resp.json();
              return [id, data.count || 0] as const;
            } catch {
              return [id, 0] as const;
            }
          })
        );
        const newFormRuleCounts = Object.fromEntries(results.filter(([k]) => k)) as Record<string, number>;
        if (!ignore) setFormRuleCounts(newFormRuleCounts);
        
        // Calculate total rules count directly from the new data
        const totalSiteRules = Object.values(newFormRuleCounts).reduce((sum, count) => sum + count, 0);
        if (!ignore) setRulesCount(totalSiteRules);
        
        // Also reload activities when forms change
        await loadActivities();
        
        // Set loading complete after all data is loaded
        if (isInitialLoad) {
          setIsLoadingInitialData(false);
        }
      } catch {
        if (!ignore) setFormRuleCounts({});
        // Set loading complete even on error to prevent infinite loading
        if (isInitialLoad) {
          setIsLoadingInitialData(false);
        }
      }
    }
    loadCounts();
    return () => {
      ignore = true;
    };
  }, [forms]);

  // Update the ref whenever the site changes
  useEffect(() => {
    const currentSiteId = selectedSiteId || siteId;
    if (currentSiteId) {
      currentSiteIdRef.current = currentSiteId;
      console.log('[Dashboard] Updated currentSiteIdRef to:', currentSiteId);
    }
  }, [selectedSiteId, siteId]);

  // Auto-refresh disabled to prevent flash/blank state issues
  // useEffect(() => {
  //   if (!siteId || !hasInitialized) return;

  //   const refreshInterval = setInterval(() => {
  //     // Use the ref to get the current site ID to prevent stale closures
  //     const currentSiteId = currentSiteIdRef.current;
  //     if (!currentSiteId) return;
      
  //     console.log('[Dashboard] Auto-refreshing forms for site:', currentSiteId);
  //     setIsAutoRefreshing(true);
  //     setLastRefreshTime(Date.now());
  //     // Use normal refresh (not force) to avoid clearing forms and causing flash
  //     fetchFormsFromWebflow(currentSiteId, false).finally(() => {
  //       setIsAutoRefreshing(false);
  //     });
  //   }, 10000); // 10 seconds - faster auto-refresh for quick updates

  //   return () => clearInterval(refreshInterval);
  // }, [hasInitialized]); // Only depend on hasInitialized, not siteId

  // Detect form changes (additions, removals, and modifications) and show notifications
  useEffect(() => {
    console.log('[Dashboard] Form data changed:', { 
      current: forms.length, 
      previous: previousFormCount,
      currentForms: forms.map((f: any) => ({ id: f.id, name: f.name }))
    });
    
    if (forms.length > 0 && previousFormsRef.current.length > 0) {
      const currentCount = forms.length;
      const previousCount = previousFormsRef.current.length;
      const change = currentCount - previousCount;
      
        // Log form changes for debugging but don't show notifications
        if (change > 0) {
          console.log('[Dashboard] Form addition detected:', { change, currentCount, previousCount });
        } else if (change < 0) {
          console.log('[Dashboard] Form removal detected:', { change, currentCount, previousCount });
        } else {
          // Check for modifications (same count but different names/data)
          const nameChanges: string[] = [];
          forms.forEach((currentForm) => {
            const previousForm = previousFormsRef.current.find(pf => pf.id === currentForm.id);
            if (previousForm && previousForm.name !== currentForm.name) {
              nameChanges.push(`"${previousForm.name}" → "${currentForm.name}"`);
            }
          });
          
          if (nameChanges.length > 0) {
            console.log('[Dashboard] Form modification detected:', nameChanges);
          }
        }
      
      // Update previous forms ref
      previousFormsRef.current = forms;
      setPreviousFormCount(forms.length);
    } else {
      // First load or no previous forms to compare
      previousFormsRef.current = forms;
      setPreviousFormCount(forms.length);
    }
  }, [forms]);

  // Re-filter activities when site changes
  useEffect(() => {
    if (selectedSiteId || siteId) {
      loadActivities();
    }
  }, [selectedSiteId, siteId]);


  // NEW: Refresh existing data only (no syncing)
  async function refreshExistingData(siteId: string) {
    setIsLoadingForms(true);
    
    try {
      console.log('[Dashboard] 🔄 REFRESHING existing data for site:', siteId);
      
      // Load existing forms from Xano only (no Webflow API calls)
      const xanoResp = await fetch(`/api/forms/xano?siteId=${encodeURIComponent(siteId)}`);
      if (xanoResp.ok) {
        const xanoData = await xanoResp.json();
        const xanoForms = xanoData.forms || [];
        
        console.log('[Dashboard] ✅ Loaded existing forms from Xano:', xanoForms.length);
        setForms(xanoForms);
        setPreviousFormCount(xanoForms.length);
      } else {
        console.log('[Dashboard] ⚠️ No existing forms found in Xano');
        setForms([]);
      }
      
      // Also refresh rules and activities
      await loadRulesCount();
      await loadActivities();
      
    } catch (error) {
      console.error('[Dashboard] Error refreshing existing data:', error);
    } finally {
      setIsLoadingForms(false);
    }
  }

  async function fetchFormsFromWebflow(siteId: string, forceRefresh = false) {
    // Only show loading if this is the initial load or a site switch
    if (isInitialLoad || isSwitchingSite) {
      setIsLoadingForms(true);
    }
    
    // ALWAYS clear forms when switching sites to prevent stale data
    console.log('[Dashboard] Clearing forms for site switch:', siteId);
    setForms([]);
    setPreviousFormCount(0);
    
    try {
      console.log('[Dashboard] 🔄 FETCHING FORMS for site:', siteId);
      console.log('[Dashboard] 🔄 Current selectedSiteId:', selectedSiteId);
      console.log('[Dashboard] 🔄 URL siteId:', siteId);

      // NOTE: Page filtering is now handled server-side in /api/webflow/site/[siteId]/forms
      // No need to fetch pages here anymore!

      // Use Webflow API directly with aggressive cache-busting
      const cacheBuster = `?_refresh=${Date.now()}&_force=${Math.random()}&_timestamp=${Date.now()}`;
      console.log('[Dashboard] 🔄 Fetching forms for site:', siteId);
      console.log('[Dashboard] Fetching with cache buster:', cacheBuster);
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
        console.log('[Dashboard] Raw Webflow response:', JSON.stringify(webflowData, null, 2));
        const webflowForms = webflowData.forms?.forms || webflowData.forms || [];
        
        console.log('[Dashboard] Found forms in Webflow:', webflowForms.length);
        console.log('[Dashboard] Forms array:', JSON.stringify(webflowForms, null, 2));

        // Log form IDs for change detection
        const currentFormIds = webflowForms.map((f: any) => f.id);
        const currentFormNames = webflowForms.map((f: any) => f.displayName);
        console.log('[Dashboard] Current form IDs from Webflow:', currentFormIds);
        console.log('[Dashboard] Current form names from Webflow:', currentFormNames);

        if (webflowForms.length > 0) {
          console.log(`[Dashboard] ✅ Using ${webflowForms.length} pre-filtered forms from Webflow API`);
          console.log(`[Dashboard] Forms received (already filtered and deduplicated by server):`, webflowForms.map((f: any) => f.displayName));

          // NOTE: Server-side filtering now handles:
          // - Utility Pages folder exclusion
          // - Style Guide / Password / 404 / Utility page exclusion
          // - Unpublished/archived page exclusion
          // - Deduplication by ID and name
          // No need for client-side filtering anymore!

          // Convert Webflow form format to FormMeta format
          const items = webflowForms.map((f: any) => {
            // Convert fields object to array
            const fieldsArray = f.fields ? Object.entries(f.fields).map(([fieldId, fieldData]: [string, any]) => ({
              id: fieldId,
              name: fieldData.displayName || fieldData.name || fieldId,
              type: fieldData.type || ""
            })) : [];

            return {
              id: f.htmlId || f.id,
              name: f.displayName || f.name || f.id,
              fields: fieldsArray,
              createdAt: f.createdOn || f.createdAt || f.created || null
            };
          });

            setForms(items);
            setError(null);
            setIsConnected(true);
            setIsInitialLoad(false);
            setIsLoadingInitialData(false);

            // SYNC FORMS TO XANO DATABASE (with duplicate prevention and sync lock)
            if (isSyncingToXano) {
              console.log('[Dashboard] ⏭️  Skipping sync - already syncing to Xano');
              return;
            }
            
            setIsSyncingToXano(true);
            console.log('[Dashboard] 🔄 Syncing forms to Xano database...');
            try {
              // First, check what forms already exist in Xano to avoid duplicates
              const existingFormsResponse = await fetch(`/api/forms/xano?siteId=${encodeURIComponent(siteId)}`, {
                headers: {
                  'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('xano_auth_token') : ''}`
                }
              });
              
              let existingForms = [];
              if (existingFormsResponse.ok) {
                const existingData = await existingFormsResponse.json();
                existingForms = existingData.forms || [];
                console.log(`[Dashboard] Found ${existingForms.length} existing forms in Xano`);
              }

              for (const form of items) {
                // Check if form already exists to prevent duplicates
                const alreadyExists = existingForms.some(existing => 
                  existing.html_form_id === form.id && existing.site_id === siteId
                );
                
                if (alreadyExists) {
                  console.log(`[Dashboard] ⏭️  Skipping "${form.name}" - already exists in Xano`);
                  continue;
                }
                
                console.log(`[Dashboard] Syncing form: ${form.name} (${form.id})`);
                const syncResponse = await fetch('/api/forms/xano', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('xano_auth_token') : ''}`
                  },
                  body: JSON.stringify({
                    name: form.name,
                    siteId: siteId,
                    htmlFormId: form.id,
                    pageUrl: '', // Could be enhanced to get actual page URL
                    formFields: form.fields
                  })
                });
                
                if (syncResponse.ok) {
                  const syncedForm = await syncResponse.json();
                  console.log(`[Dashboard] ✅ Synced form "${form.name}" to Xano with ID: ${syncedForm.form.id}`);
                } else {
                  const error = await syncResponse.text();
                  console.error(`[Dashboard] ❌ Failed to sync form "${form.name}": ${error}`);
                }
              }
              console.log('[Dashboard] ✅ All forms synced to Xano database');
            } catch (syncError) {
              console.error('[Dashboard] ❌ Error syncing forms to Xano:', syncError);
            } finally {
              setIsSyncingToXano(false);
            }

            setIsLoadingForms(false);

          console.log('[Dashboard] Final forms:', items.map((f: any) => ({ id: f.id, name: f.name, fields: f.fields.length })));
          console.log('[Dashboard] Current form count:', items.length, 'Previous count:', previousFormCount);


            return;
        }
      } else {
        console.warn('[Dashboard] Failed to fetch forms from Webflow:', webflowResp.status);
      }
      
      // Fallback to Webflow API
      console.log('[Dashboard] Using Webflow API for site:', siteId);
      const webflowCacheBuster = `?_refresh=${Date.now()}&_force=${Math.random()}`;
      const resp = await fetch(`/api/webflow/site/${encodeURIComponent(siteId)}/forms${webflowCacheBuster}`);
      if (!resp.ok) {
        const txt = await resp.text();
            setError(`Failed to fetch webflow forms: ${resp.status} ${txt}`);
            setIsConnected(false);
            
            setIsLoadingForms(false);
            return;
      }
      const data = await resp.json();
      // Normalize webflow forms to our FormMeta shape
      const formsArray = data.forms?.forms || data.forms || [];
      let items = formsArray.map((f: any) => {
        // Convert fields object to array
        const fieldsArray = f.fields ? Object.entries(f.fields).map(([fieldId, fieldData]: [string, any]) => ({
          id: fieldId,
          name: fieldData.displayName || fieldData.name || fieldId,
          type: fieldData.type || ""
        })) : [];

        const createdAt = f.createdOn || f.createdAt || f.created || f.updatedOn || null;

        return {
          id: f.id || f._id,
          name: f.displayName || f.name || f.slug || f.id,
          fields: fieldsArray,
          createdAt
        };
      });

            setForms(items);
            setError(null);
            setIsConnected(true);
            setIsInitialLoad(false);
            setIsLoadingInitialData(false);

            // SYNC FORMS TO XANO DATABASE (fallback path with duplicate prevention and sync lock)
            if (isSyncingToXano) {
              console.log('[Dashboard] ⏭️  Skipping sync (fallback) - already syncing to Xano');
              return;
            }
            
            setIsSyncingToXano(true);
            console.log('[Dashboard] 🔄 Syncing forms to Xano database (fallback path)...');
            try {
              // First, check what forms already exist in Xano to avoid duplicates
              const existingFormsResponse = await fetch(`/api/forms/xano?siteId=${encodeURIComponent(siteId)}`, {
                headers: {
                  'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('xano_auth_token') : ''}`
                }
              });
              
              let existingForms = [];
              if (existingFormsResponse.ok) {
                const existingData = await existingFormsResponse.json();
                existingForms = existingData.forms || [];
                console.log(`[Dashboard] Found ${existingForms.length} existing forms in Xano (fallback path)`);
              }

              for (const form of items) {
                // Check if form already exists to prevent duplicates
                const alreadyExists = existingForms.some(existing => 
                  existing.html_form_id === form.id && existing.site_id === siteId
                );
                
                if (alreadyExists) {
                  console.log(`[Dashboard] ⏭️  Skipping "${form.name}" - already exists in Xano (fallback path)`);
                  continue;
                }
                
                console.log(`[Dashboard] Syncing form: ${form.name} (${form.id})`);
                const syncResponse = await fetch('/api/forms/xano', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('xano_auth_token') : ''}`
                  },
                  body: JSON.stringify({
                    name: form.name,
                    siteId: siteId,
                    htmlFormId: form.id,
                    pageUrl: '', // Could be enhanced to get actual page URL
                    formFields: form.fields
                  })
                });
                
                if (syncResponse.ok) {
                  const syncedForm = await syncResponse.json();
                  console.log(`[Dashboard] ✅ Synced form "${form.name}" to Xano with ID: ${syncedForm.form.id}`);
                } else {
                  const error = await syncResponse.text();
                  console.error(`[Dashboard] ❌ Failed to sync form "${form.name}": ${error}`);
                }
              }
              console.log('[Dashboard] ✅ All forms synced to Xano database (fallback path)');
            } catch (syncError) {
              console.error('[Dashboard] ❌ Error syncing forms to Xano (fallback path):', syncError);
            } finally {
              setIsSyncingToXano(false);
            }

            setIsLoadingForms(false);

            console.log('[Dashboard] Loaded', items.length, 'forms from Webflow API');
        console.log('[Dashboard] Forms data:', items.map((f: any) => ({ id: f.id, name: f.name, fields: f.fields.length })));
        console.log('[Dashboard] Current form count:', items.length, 'Previous count:', previousFormCount);

    } catch (err) {
      setError((err as Error).message);
      setIsConnected(false);
      setIsLoadingForms(false);
    }
  }

  async function loadConnectedSites() {
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
      setConnectedSites(data.sites || []);
      
      // Check if we have a stored site selection
      const storedSiteId = typeof window !== 'undefined' ? localStorage.getItem('selectedSiteId') || '' : '';
      
      // If there's at least one site and no site is currently selected
      if ((data.sites || []).length > 0) {
        // Use stored site if it exists in the connected sites, otherwise use first site
        const siteExists = storedSiteId && (data.sites || []).some((s: any) => s.siteId === storedSiteId);
        const siteToSelect = siteExists ? storedSiteId : ((data.sites || [])[0].siteId || "");
        
        if (!selectedSiteId || selectedSiteId !== siteToSelect) {
          setSelectedSiteId(siteToSelect);
          // Store in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('selectedSiteId', siteToSelect);
          }
          // Immediately fetch forms for the selected site using Webflow API
          await fetchFormsFromWebflow(siteToSelect);
        }
      }
      
      // Also fetch rules count and activities
      await loadRulesCount();
      await loadActivities();
    } catch (err) {
      console.error("Failed to load connected sites:", err);
    }
  }

  async function loadRulesCount() {
    try {
      // Calculate total rules from formRuleCounts (already fetched in useEffect)
      const totalSiteRules = Object.values(formRuleCounts).reduce((sum, count) => sum + count, 0);
      
      console.log('[Dashboard] Site-specific rules count:', totalSiteRules, 'from', Object.keys(formRuleCounts).length, 'forms');
      setRulesCount(totalSiteRules);
    } catch (err) {
      console.error("Failed to load rules count:", err);
      setRulesCount(0);
    }
  }

  async function loadActivities() {
    try {
      const currentSiteId = selectedSiteId || siteId;
      console.log('[Dashboard] Loading activities for site:', currentSiteId);
      
      if (!currentSiteId) {
        console.log('[Dashboard] No site selected, showing no activities');
        setActivities([]);
        return;
      }
      
      // Use server-side filtering by passing siteId to the API
      const resp = await fetch(`/api/activity?siteId=${encodeURIComponent(currentSiteId)}&limit=4`);
      if (resp.ok) {
        const data = await resp.json();
        const activities = data.activities || [];
        
        console.log('[Dashboard] Received activities from API:', activities.length, 'for site:', currentSiteId);
        setActivities(activities);
      } else {
        console.error('[Dashboard] Failed to load activities:', resp.status);
        // Don't clear activities on error - keep existing ones
        console.log('[Dashboard] Keeping existing activities due to API error');
      }
    } catch (err) {
      console.error("Failed to load activities:", err);
    }
    
    // Original code (commented out):
    // try {
    //   const currentSiteId = selectedSiteId || siteId;
    //   console.log('[Dashboard] Loading activities for site:', currentSiteId);
    //   
    //   if (!currentSiteId) {
    //     console.log('[Dashboard] No site selected, showing no activities');
    //     setActivities([]);
    //     return;
    //   }
    //   
    //   // Use server-side filtering by passing siteId to the API
    //   const resp = await fetch(`/api/activity?siteId=${encodeURIComponent(currentSiteId)}&limit=4`);
    //   if (resp.ok) {
    //     const data = await resp.json();
    //     const activities = data.activities || [];
    //     
    //     console.log('[Dashboard] Received activities from API:', activities.length, 'for site:', currentSiteId);
    //     setActivities(activities);
    //   } else {
    //     console.error('[Dashboard] Failed to load activities:', resp.status);
    //     // Don't clear activities on error - keep existing ones
    //     console.log('[Dashboard] Keeping existing activities due to API error');
    //   }
    // } catch (err) {
    //   console.error("Failed to load activities:", err);
    //   // Don't clear activities on error - keep existing ones
    //   console.log('[Dashboard] Keeping existing activities due to network error');
    // }
  }

  async function fetchForms(curSiteId?: string) {
    const id = curSiteId || selectedSiteId || siteId;
    if (!id) {
      setError("No siteId provided. After installing the app, open dashboard?siteId=<site id>");
      setIsConnected(false);
      setIsLoadingForms(false);
      return;
    }

    // If we have a connected site with token, use Webflow API proxy
    const isConnectedSite = connectedSites.find((s) => s.siteId === id && s.hasToken);
    console.log('Dashboard fetchForms:', { id, connectedSites, isConnectedSite });
    
    if (isConnectedSite) {
      await fetchFormsFromWebflow(id);
    } else {
      // fallback to stored forms (scan/imported)
      setIsLoadingForms(true);
      try {
        console.log('Using fallback API for site:', id);
        const res = await fetch(`/api/forms/${id}`);
        if (!res.ok) {
          setError(`Failed to fetch forms: ${res.status}`);
          setIsConnected(false);
          setIsLoadingForms(false);
          return;
        }
        const resData = await res.json();
        setForms((resData.forms || []).map((f: any) => ({
          ...f,
          createdAt: f.createdAt || f.createdOn || f.created || null
        })));
        setError(null);
        setIsConnected(true);
        setIsLoadingForms(false);
      } catch (err) {
        setError((err as Error).message);
        setIsConnected(false);
        setIsLoadingForms(false);
      }
    }
  }

  const totalForms = forms.length;
  const activeForms = forms.filter((f) => f.fields && f.fields.length > 0).length;
  const totalRules = rulesCount;
  const activeRules = rulesCount; // Same as totalRules for now (can be split later if needed)

  // Helper functions for activity display
  function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
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
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'rule_created':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'rule_updated':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'rule_deleted':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'rule_published':
        return (
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return null;
    }
  }

  function getActivityColor(type: string) {
    switch (type) {
      case 'rule_created':
        return { bg: 'bg-green-100', text: 'text-green-600' };
      case 'rule_updated':
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'rule_deleted':
        return { bg: 'bg-red-100', text: 'text-red-600' };
      case 'rule_published':
        return { bg: 'bg-purple-100', text: 'text-purple-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  }

  function getActivityText(type: string): string {
    switch (type) {
      case 'rule_created':
        return 'Created rule';
      case 'rule_updated':
        return 'Updated rule';
      case 'rule_deleted':
        return 'Deleted rule';
      case 'rule_published':
        return 'Published rule';
      default:
        return 'Activity';
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Site Switching Animation */}
        {isSwitchingSite && (
          <div className="fixed inset-0 bg-gray-50 bg-opacity-90 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-sm mx-4">
              <div className="relative">
                {/* Spinning loader */}
                <div className="w-12 h-12 border-3 border-indigo-200 rounded-full animate-spin border-t-indigo-600 mx-auto mb-4"></div>
                
                {/* Pulsing dots */}
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Switching Site</h3>
              <p className="text-gray-600 text-sm">Loading forms and data for the selected site...</p>
            </div>
          </div>
        )}

      <SidebarProvider>
        <ShadcnSidebar />
        <main className={`relative flex w-full flex-1 flex-col bg-gray-50 px-4 lg:px-6 py-8 ${isInIframe ? 'pt-8' : 'pt-20 lg:pt-8'} overflow-x-hidden`}>
          <div className="max-w-7xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Roolify Dashboard</h1>
                {isAutoRefreshing && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Syncing...</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">Manage conditional logic for your Webflow forms</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {connectedSites.length === 0 ? (
                <>
                  <a href="/api/auth/install" className="btn bg-indigo-600 text-white whitespace-nowrap">Connect to Webflow</a>
                </>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={async () => {
                        console.log('[Dashboard] Manual refresh triggered - syncing from Webflow');
                        setLastRefreshTime(Date.now());
                        await fetchFormsFromWebflow(siteId, true); // Sync from Webflow to Xano
                      }}
                      disabled={isLoadingForms}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      title="Sync forms from Webflow to Xano"
                    >
                      <svg
                        className={`w-4 h-4 ${isLoadingForms ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {isLoadingForms ? 'Refreshing...' : 'Refresh'}
                    </button>

                  </div>
                  
                  {/* Show site badge in iframe (Designer Extension), dropdown in main app */}
                  {isInIframe && designerSiteName ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                        {designerSiteName[0]?.toUpperCase() || 'S'}
                      </div>
                      <span className="max-w-[150px] truncate" title={designerSiteName}>
                        {designerSiteName}
                      </span>
                    </div>
                  ) : !isInIframe ? (
                    <SiteSelector 
                      onSiteChange={async (newSiteId) => {
                        // Only show switching animation if we're actually changing sites
                        const currentSiteId = selectedSiteId || siteId;
                        if (currentSiteId !== newSiteId) {
                      setIsSwitchingSite(true);
                        }
                      
                      // Update site immediately
                      setSelectedSiteId(newSiteId);
                      
                      // Store in localStorage for persistence
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('selectedSiteId', newSiteId);
                      }
                      
                      // Fetch forms for new site (this will handle the loading states)
                      await fetchFormsFromWebflow(newSiteId);
                      
                      // End switching animation after forms are loaded
                      setIsSwitchingSite(false);
                    }}
                    />
                  ) : null}
                </>
              )}
            </div>
          </div>


          {/* Stat cards */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 transition-all duration-150 ease-in-out ${isSwitchingSite ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {isLoadingInitialData ? (
              // Show skeleton loaders
              [1,2,3,4].map(i => (
                <div key={i} className="bg-white border rounded p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="bg-white border rounded p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Total Forms</div>
                    <div className="text-2xl font-bold text-blue-600">{totalForms}</div>
                  </div>
                  <div className="w-12 h-12 rounded bg-blue-500 flex items-center justify-center" aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h.01M15 8h.01M7 7a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-white border rounded p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Active Forms</div>
                    <div className="text-2xl font-bold text-green-600">{activeForms}</div>
                  </div>
                  <div className="w-12 h-12 rounded bg-green-500 flex items-center justify-center" aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-white border rounded p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Total Rules</div>
                    <div className="text-2xl font-bold text-purple-600">{totalRules}</div>
                  </div>
                  <div className="w-12 h-12 rounded bg-purple-500 flex items-center justify-center" aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-white border rounded p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Active Rules</div>
                    <div className="text-2xl font-bold text-orange-600">{rulesCount}</div>
                  </div>
                  <div className="w-12 h-12 rounded bg-orange-500 flex items-center justify-center" aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 14l4-4 4 4 6-6" />
                    </svg>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Your forms list */}
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 transition-all duration-150 ease-in-out ${isSwitchingSite ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} min-w-0`}>
            <div className="col-span-1 lg:col-span-8 min-w-0">
              <div className="bg-white border rounded p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-lg font-semibold text-black">Your Forms</div>
                    <div className="text-xs text-gray-800">Manage your installed forms and scan new ones</div>
                  </div>
                  <div className="flex items-center gap-2">
                  </div>
                </div>

                <div className="space-y-4">
                  {isLoadingInitialData ? (
                    // Skeleton loaders
                    [1,2,3].map(i => (
                      <div key={i} className="p-4 border rounded animate-pulse">
                        <div className="flex items-center justify-between mb-3">
                          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="flex items-center gap-4">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))
                  ) : forms.length === 0 ? (
                    <div className="p-6 bg-gray-50 border rounded text-gray-800">No forms yet — scan your site with the designer extension to import forms.</div>
                  ) : (
                    forms.map((f) => {
                      const id = f.id || '';
                      const isActive = (f.fields?.length || 0) > 0;
                      const created = f.createdAt ? new Date(f.createdAt) : null;
                      const createdText = created ? created.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
                      const ruleCount = formRuleCounts[id] ?? 0;

                      return (
                        <div 
                          key={`${id}-${forms.length}`} 
                          className="p-5 border rounded-xl hover:shadow-sm transition-all duration-300 bg-white animate-in fade-in-0 slide-in-from-bottom-2"
                        >
                          <div className="flex items-start justify-between min-w-0">
                            <div className="min-w-0 flex-1">
                              <div className="text-base font-semibold text-gray-900 break-words">{f.name || id}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {f.fields.length} {f.fields.length === 1 ? 'field' : 'fields'}{createdText ? ` • Created ${createdText}` : ''}
                              </div>
                            </div>
                            <span className={`${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'} text-xs px-2.5 py-1 rounded-full capitalize`}>{isActive ? 'active' : 'draft'}</span>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-gray-700">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                                </div>
                                <span className="text-gray-800">{ruleCount} {ruleCount === 1 ? 'rule' : 'rules'}</span>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-4 min-w-0">
              <div className="bg-white border rounded p-4 mb-4">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-lg font-semibold text-black">Recent Activity</div>
                </div>
                {isLoadingInitialData ? (
                  // Skeleton loaders
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-xs text-gray-500 mt-2">No activity yet</div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activities.map((activity) => {
                      const timeAgo = getTimeAgo(new Date(activity.created_at || 0));
                      const icon = getActivityIcon(activity.type);
                      const color = getActivityColor(activity.type);
                      const actionText = getActivityText(activity.type);
                      const created = new Date(activity.created_at || 0);
                      const createdText = created.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      
                      return (
                        <div 
                          key={activity.id} 
                          className="p-3 border rounded-lg hover:shadow-sm transition-all duration-300 bg-white animate-in fade-in-0 slide-in-from-bottom-2"
                        >
                          <div className="flex items-center justify-between min-w-0">
                            <div className="min-w-0 flex-1 mr-3">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-5 h-5 ${color.bg} rounded flex items-center justify-center flex-shrink-0`}>
                                  {icon}
                                </div>
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {activity.rule_name || `${actionText} Rule`}
                                </div>
                                <span className={`${color.bg} ${color.text} text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0`}>
                                  {activity.type.replace('_', ' ')}
                                </span>
                              </div>
                              
                              <div className="text-xs text-gray-600 flex items-center gap-2 flex-wrap">
                                <span>{actionText}</span>
                                {activity.metadata?.actionCount && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-500">
                                      {activity.metadata.conditionCount} condition{activity.metadata.conditionCount !== 1 ? 's' : ''}, {activity.metadata.actionCount} action{activity.metadata.actionCount !== 1 ? 's' : ''}
                                    </span>
                                  </>
                                )}
                                <span className="text-gray-400">•</span>
                                <span>{createdText}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500">{timeAgo}</span>
                              </div>
                              
                              {/* Show When/Then logic if available */}
                              {activity.metadata?.conditionCount && activity.metadata?.actionCount && (
                                <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-600">When:</span>
                                    <span>{activity.metadata.conditionCount} condition{activity.metadata.conditionCount !== 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-600">Then:</span>
                                    <span>{activity.metadata.actionCount} action{activity.metadata.actionCount !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {activities.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-2 border-t border-gray-100">
                        {activities.length} total activities (scroll to view all)
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
          </div>
        </main>
      </SidebarProvider>
    </div>
    </ProtectedRoute>
  );
}
