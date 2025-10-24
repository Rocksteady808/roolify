// Xano API Client
// Handles all API calls to Xano backend

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_XANO_AUTH_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:pU92d7fv';
const MAIN_BASE_URL = process.env.NEXT_PUBLIC_XANO_API_BASE_URL || 'https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj';

// syncLocks removed - no more form syncing

// Types
export interface User {
  id: number;
  created_at: number;
  name: string;
  email: string;
  plan_id?: number;
  is_admin?: boolean;
}

export interface Form {
  id: number;
  created_at: number;
  name: string;
  user_id: number;
  html_form_id?: string;  // HTML form ID from Webflow (e.g., "wf-form-State-Form")
  site_id?: string;        // Webflow site ID
  page_url?: string;       // Page URL where form is located
  form_fields?: any;       // Array of form fields (JSON)
  updated_at?: number;     // Last sync timestamp
}

export interface LogicRule {
  id: number;
  created_at: number;
  rule_name: string;
  rule_data: string; // JSON string of the full rule
  form_id: number;
  user_id: number;
}

export interface Plan {
  id: number;
  created_at: number;
  plan_name: string;
  max_sites: number;
  max_submissions: number;
  max_logic_rules: number;
  price: number;
  features?: string[]; // Optional features list
}

export interface Submission {
  id: number;
  created_at: number;
  submission_data: string; // JSON string
  form_id: number;
  user_id: number;
  data?: any; // Parsed submission data (optional)
}

export interface NotificationSetting {
  id: number;
  created_at: number;
  form: number; // FK to form table
  user: number; // FK to user table
  site: number; // FK to site table (optional)
  admin_routes: any; // JSON
  user_routes: any; // JSON
  admin_fallback_email?: string;
  user_fallback_email?: string;
  custom_value?: string;
  field_custom_values?: Record<string, string> | null;
  email_template?: string;
  admin_subject?: string;
  user_subject?: string;
  updated_at?: number;
}

export interface Site {
  id?: number;
  created_at?: number;
  webflow_site_id: string;
  site_name?: string;
  user_id?: number;
  webflow_access_token?: string;
  webflow_refresh_token?: string;
  token_expires_at?: number;
  installed_at?: number;
  is_active?: boolean;
}

export interface Activity {
  id?: number;
  created_at?: number;
  type: 'rule_created' | 'rule_updated' | 'rule_deleted' | 'rule_published' | 'site_connected';
  rule_name: string;
  rule_id: string;
  form_id: string;
  site_id?: string;
  form_name?: string;
  details?: string;
  metadata?: {
    conditionCount?: number;
    actionCount?: number;
    status?: string;
  };
  user_id?: number;
}

// Helper function to get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('xano_auth_token');
}

// Helper function to set auth token
function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  // Store in localStorage for client-side access
  localStorage.setItem('xano_auth_token', token);
  
  // Also store in cookie for server-side access
  // Set cookie with 30 day expiry, secure settings for localhost
  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `xano_auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
  
  console.log('[Auth] Token stored in localStorage and cookie with settings:', {
    maxAge,
    SameSite: 'Lax',
    Secure: isSecure,
    path: '/'
  });
}

// Helper function to clear auth token
function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  
  // Clear from localStorage
  localStorage.removeItem('xano_auth_token');
  
  // Clear cookie by setting it to expire immediately
  document.cookie = 'xano_auth_token=; path=/; max-age=0; SameSite=Lax';
  
  console.log('[Auth] Token cleared from localStorage and cookie');
}

// Generic request wrapper
export async function xanoRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const apiToken = process.env.XANO_API_TOKEN;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add API token for server-side requests
  if (apiToken) {
    headers['Authorization'] = `Bearer ${apiToken}`;
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`[Xano Request] ${options.method || 'GET'} ${url}`);
  console.log(`[Xano Request] Has token:`, !!token);
  if (options.body) {
    console.log(`[Xano Request] Body:`, options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  console.log(`[Xano Request] Response status:`, response.status);
  
  if (!response.ok) {
    const error = await response.text();
    console.error(`[Xano Request] Error:`, response.status, error);
    throw new Error(`Xano API Error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  console.log(`[Xano Request] Response data:`, result);
  return result;
}

// ===================
// AUTH API
// ===================

export const xanoAuth = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ authToken: string }> {
    // Use Next.js API route proxy to avoid CORS issues
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result = await response.json();
    setAuthToken(result.authToken);
    return result;
  },

  /**
   * Signup with name, email, and password
   */
  async signup(
    name: string,
    email: string,
    password: string
  ): Promise<{ authToken: string }> {
    // Use Next.js API route proxy to avoid CORS issues
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const result = await response.json();
    setAuthToken(result.authToken);
    return result;
  },

  /**
   * Get current user (requires auth)
   */
  async me(): Promise<User> {
    // Use Next.js API route proxy to avoid CORS issues
    const token = getAuthToken();
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user data');
    }

    return await response.json();
  },

  /**
   * Logout (clear token)
   */
  logout(): void {
    clearAuthToken();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!getAuthToken();
  },

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    return getAuthToken();
  },

  /**
   * Update user profile (name, email)
   */
  async updateProfile(data: { name?: string; email?: string }): Promise<User> {
    return xanoRequest<User>(`${AUTH_BASE_URL}/auth/me`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return xanoRequest<{ success: boolean }>(`${AUTH_BASE_URL}/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  },

  /**
   * Send password reset email (magic link)
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean }> {
    // Use Next.js API route proxy instead of direct Xano call
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send reset link');
    }

    return response.json();
  },

  /**
   * Reset password with token from magic link
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    // Use Next.js API route proxy instead of direct Xano call
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }

    return response.json();
  },
};

// ===================
// FORM API
// ===================

export const xanoForms = {
  /**
   * Get all forms
   */
  async getAll(): Promise<Form[]> {
    return xanoRequest<Form[]>(`${MAIN_BASE_URL}/form`);
  },

  /**
   * Get single form by ID
   */
  async getById(formId: number): Promise<Form> {
    return xanoRequest<Form>(`${MAIN_BASE_URL}/form/${formId}`);
  },

  /**
   * Create new form
   */
  async create(name: string, userId: number): Promise<Form> {
    return xanoRequest<Form>(`${MAIN_BASE_URL}/form`, {
      method: 'POST',
      body: JSON.stringify({ name, user_id: userId }),
    });
  },

  /**
   * Update form
   */
  async update(formId: number, data: { name?: string; user_id?: number }): Promise<Form> {
    return xanoRequest<Form>(`${MAIN_BASE_URL}/form/${formId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete form
   */
  async delete(formId: number): Promise<void> {
    await xanoRequest(`${MAIN_BASE_URL}/form/${formId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Smart sync form from Webflow - prevents duplicates by checking multiple criteria
   * Only creates new forms if no existing form matches by name and site
   */
  async sync(data: {
    html_form_id: string;
    name: string;
    site_id: string;
    page_url?: string;
    form_fields?: any;
    user_id: number;
  }): Promise<Form> {
    console.log(`[Smart Form Sync] Syncing form: "${data.name}" (${data.html_form_id}) for site ${data.site_id}`);
    
    // Get all existing forms
    const allForms = await this.getAll();
    
    // Strategy 1: Find by exact html_form_id + site_id match
    let existingForm = allForms.find(f => 
      f.html_form_id === data.html_form_id && f.site_id === data.site_id
    );
    
    if (existingForm) {
      console.log(`[Smart Form Sync] ✅ Found exact match: Form ${existingForm.id} (${existingForm.name})`);
      return existingForm;
    }
    
    // Strategy 2: Find by name + site_id (same form, different html_form_id)
    existingForm = allForms.find(f => 
      f.name === data.name && f.site_id === data.site_id
    );
    
    if (existingForm) {
      console.log(`[Smart Form Sync] ✅ Found name match: Form ${existingForm.id} (${existingForm.name})`);
      console.log(`[Smart Form Sync] Updating html_form_id from "${existingForm.html_form_id}" to "${data.html_form_id}"`);
      
      // Update the html_form_id to match the current form
      return xanoRequest<Form>(`${MAIN_BASE_URL}/form/${existingForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          html_form_id: data.html_form_id,
          page_url: data.page_url || existingForm.page_url,
          form_fields: data.form_fields || existingForm.form_fields
        }),
      });
    }
    
    // Strategy 3: No existing form found - create new one
    console.log(`[Smart Form Sync] ✅ No existing form found, creating new form: "${data.name}"`);
    return xanoRequest<Form>(`${MAIN_BASE_URL}/form`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ===================
// LOGIC RULE API
// ===================

export const xanoRules = {
  /**
   * Get all logic rules
   */
  async getAll(): Promise<LogicRule[]> {
    return xanoRequest<LogicRule[]>(`${MAIN_BASE_URL}/logic_rule`);
  },

  /**
   * Get single logic rule by ID
   */
  async getById(ruleId: number): Promise<LogicRule> {
    return xanoRequest<LogicRule>(`${MAIN_BASE_URL}/logic_rule/${ruleId}`);
  },

  /**
   * Create new logic rule
   */
  async create(
    ruleName: string,
    ruleData: object,
    formId: number,
    userId: number
  ): Promise<LogicRule> {
    return xanoRequest<LogicRule>(`${MAIN_BASE_URL}/logic_rule`, {
      method: 'POST',
      body: JSON.stringify({
        rule_name: ruleName,
        rule_data: JSON.stringify(ruleData),
        form_id: formId,
        user_id: userId,
      }),
    });
  },

  /**
   * Update logic rule
   */
  async update(
    ruleId: number,
    data: {
      rule_name?: string;
      rule_data?: object;
      form_id?: number;
      user_id?: number;
    }
  ): Promise<LogicRule> {
    const body: any = {};
    if (data.rule_name) body.rule_name = data.rule_name;
    if (data.rule_data) body.rule_data = JSON.stringify(data.rule_data);
    if (data.form_id) body.form_id = data.form_id;
    if (data.user_id) body.user_id = data.user_id;

    return xanoRequest<LogicRule>(`${MAIN_BASE_URL}/logic_rule/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  /**
   * Delete logic rule
   */
  async delete(ruleId: number): Promise<void> {
    await xanoRequest(`${MAIN_BASE_URL}/logic_rule/${ruleId}`, {
      method: 'DELETE',
    });
  },
};

// ===================
// PLAN API
// ===================

export const xanoPlans = {
  /**
   * Get all plans
   */
  async getAll(): Promise<Plan[]> {
    return xanoRequest<Plan[]>(`${MAIN_BASE_URL}/plan`);
  },

  /**
   * Get single plan by ID
   */
  async getById(planId: number): Promise<Plan> {
    return xanoRequest<Plan>(`${MAIN_BASE_URL}/plan/${planId}`);
  },
};

// ===================
// SUBMISSION API
// ===================

export const xanoSubmissions = {
  /**
   * Get all submissions
   */
  async getAll(): Promise<Submission[]> {
    return xanoRequest<Submission[]>(`${MAIN_BASE_URL}/submission`);
  },

  /**
   * Get single submission by ID
   */
  async getById(submissionId: number): Promise<Submission> {
    return xanoRequest<Submission>(`${MAIN_BASE_URL}/submission/${submissionId}`);
  },

  /**
   * Create new submission
   */
  async create(
    submissionData: object,
    formId: number,
    userId: number,
    siteId?: number
  ): Promise<Submission> {
    const payload: any = {
      submission_data: JSON.stringify(submissionData),
      form_id: formId,
      user_id: userId,
    };
    
    // Only add site reference if we have a valid numeric site ID
    if (siteId && typeof siteId === 'number') {
      payload.site = siteId;
    }
    
    return xanoRequest<Submission>(`${MAIN_BASE_URL}/submission`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete submission
   */
  async delete(submissionId: number): Promise<void> {
    await xanoRequest(`${MAIN_BASE_URL}/submission/${submissionId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Notification Settings API
 *
 * Notification settings use numeric foreign keys to form, user, and site tables.
 * Form records are automatically synced if they don't exist.
 */
export const xanoNotifications = {
  /**
   * Get all notification settings
   */
  async getAll(): Promise<NotificationSetting[]> {
    return xanoRequest<NotificationSetting[]>(`${MAIN_BASE_URL}/notification_setting`);
  },

  /**
   * Get notification setting by site_id + html_form_id (convenience method)
   * Resolves form record first, then queries by numeric form.id
   */
  async getBySiteAndForm(siteId: string, htmlFormId: string): Promise<NotificationSetting | null> {
    // Find form record first
    const allForms = await xanoForms.getAll();
    const form = allForms.find(f => 
      f.html_form_id === htmlFormId && f.site_id === siteId
    );
    
    if (!form) return null;
    
    // Query by numeric form.id
    return this.getByFormId(form.id);
  },

  /**
   * Get notification setting by form ID (LEGACY - kept for backward compatibility)
   * @deprecated Use getBySiteAndForm() instead
   */
  async getByFormId(formId: number): Promise<NotificationSetting | null> {
    const all = await this.getAll();
    return all.find(n => n.form === formId) || null;
  },

  /**
   * Get single notification setting by ID
   */
  async getById(notificationId: number): Promise<NotificationSetting> {
    return xanoRequest<NotificationSetting>(`${MAIN_BASE_URL}/notification_setting/${notificationId}`);
  },

  /**
   * Create new notification setting
   */
  async create(data: {
    form: number;      // FK to form table
    user: number;      // FK to user table
    site: number;      // FK to site table
    admin_routes?: any;
    user_routes?: any;
    admin_fallback_email?: string;
    user_fallback_email?: string;
    custom_value?: string;
    field_custom_values?: Record<string, string> | null;
    email_template?: string;
    admin_subject?: string;
    user_subject?: string;
  }): Promise<NotificationSetting> {
    return xanoRequest<NotificationSetting>(`${MAIN_BASE_URL}/notification_setting`, {
      method: 'POST',
      body: JSON.stringify({
        form: data.form,
        user: data.user,
        site: data.site,
        admin_routes: data.admin_routes ? JSON.stringify(data.admin_routes) : '[]',
        user_routes: data.user_routes ? JSON.stringify(data.user_routes) : '[]',
        admin_fallback_email: data.admin_fallback_email || '',
        user_fallback_email: data.user_fallback_email || '',
        custom_value: data.custom_value || '',
        field_custom_values: data.field_custom_values ? JSON.stringify(data.field_custom_values) : null,
        email_template: data.email_template || '',
        admin_subject: data.admin_subject || '',
        user_subject: data.user_subject || '',
      }),
    });
  },

  /**
   * Upsert notification setting (create or update)
   * This is the recommended method for saving notification settings.
   */
  async upsert(data: {
    form: number;      // FK to form table
    user: number;      // FK to user table
    site: number;      // FK to site table
    admin_routes?: any;
    user_routes?: any;
    admin_fallback_email?: string;
    user_fallback_email?: string;
    custom_value?: string;
    field_custom_values?: Record<string, string> | null;
    email_template?: string;
    admin_subject?: string;
    user_subject?: string;
  }): Promise<NotificationSetting> {
    // Check if settings already exist for this form
    const existing = await this.getByFormId(data.form);

    if (existing) {
      // Update existing settings
      console.log(`[Xano Notifications] Updating existing notification settings (ID: ${existing.id})`);
      return this.update(existing.id, {
        admin_routes: data.admin_routes,
        user_routes: data.user_routes,
        admin_fallback_email: data.admin_fallback_email,
        user_fallback_email: data.user_fallback_email,
        custom_value: data.custom_value,
        field_custom_values: data.field_custom_values,
        email_template: data.email_template,
        admin_subject: data.admin_subject,
        user_subject: data.user_subject,
      });
    } else {
      // Create new settings
      console.log(`[Xano Notifications] Creating new notification settings for form=${data.form}`);
      return this.create(data);
    }
  },

  /**
   * Update notification setting
   */
  async update(notificationId: number, data: {
    admin_routes?: any;
    user_routes?: any;
    admin_fallback_email?: string;
    user_fallback_email?: string;
    custom_value?: string;
    field_custom_values?: Record<string, string> | null;
    email_template?: string;
    admin_subject?: string;
    user_subject?: string;
  }): Promise<NotificationSetting> {
    const payload: any = {};
    if (data.admin_routes !== undefined) payload.admin_routes = JSON.stringify(data.admin_routes);
    if (data.user_routes !== undefined) payload.user_routes = JSON.stringify(data.user_routes);
    if (data.admin_fallback_email !== undefined) payload.admin_fallback_email = data.admin_fallback_email;
    if (data.user_fallback_email !== undefined) payload.user_fallback_email = data.user_fallback_email;
    if (data.custom_value !== undefined) payload.custom_value = data.custom_value;
    if (data.field_custom_values !== undefined) payload.field_custom_values = data.field_custom_values ? JSON.stringify(data.field_custom_values) : null;
    if (data.email_template !== undefined) payload.email_template = data.email_template;
    if (data.admin_subject !== undefined) payload.admin_subject = data.admin_subject;
    if (data.user_subject !== undefined) payload.user_subject = data.user_subject;

    return xanoRequest<NotificationSetting>(`${MAIN_BASE_URL}/notification_setting/${notificationId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete notification setting
   */
  async delete(notificationId: number): Promise<void> {
    await xanoRequest(`${MAIN_BASE_URL}/notification_setting/${notificationId}`, {
      method: 'DELETE',
    });
  },
};

// ===================
// Sites API
// ===================

export const xanoSites = {
  /**
   * Get all sites
   */
  async getAll(): Promise<Site[]> {
    return xanoRequest<Site[]>(`${MAIN_BASE_URL}/site`);
  },

  /**
   * Get site by ID
   */
  async getById(id: number): Promise<Site> {
    return xanoRequest<Site>(`${MAIN_BASE_URL}/site/${id}`);
  },

  /**
   * Get site by Webflow site ID
   */
  async getByWebflowSiteId(webflowSiteId: string): Promise<Site | null> {
    const sites = await this.getAll();
    return sites.find(s => s.webflow_site_id === webflowSiteId) || null;
  },

  /**
   * Create a new site
   */
  async create(data: Partial<Site>): Promise<Site> {
    return xanoRequest<Site>(`${MAIN_BASE_URL}/site`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update site
   */
  async update(id: number, data: Partial<Site>): Promise<Site> {
    return xanoRequest<Site>(`${MAIN_BASE_URL}/site/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete site
   */
  async delete(id: number): Promise<void> {
    return xanoRequest<void>(`${MAIN_BASE_URL}/site/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Create or update site (upsert)
   */
  async upsert(data: Partial<Site>): Promise<Site> {
    if (!data.webflow_site_id) {
      throw new Error('webflow_site_id is required');
    }
    
    // Check if site exists
    const existing = await this.getByWebflowSiteId(data.webflow_site_id);
    
    if (existing && existing.id) {
      // Update existing site
      return this.update(existing.id, data);
    } else {
      // Create new site
      return this.create(data);
    }
  },
};

// ===================
// ACTIVITY API
// ===================

export const xanoActivities = {
  /**
   * Get all activities for current user
   */
  async getAll(): Promise<Activity[]> {
    return xanoRequest<Activity[]>(`${MAIN_BASE_URL}/activity`);
  },

  /**
   * Get single activity by ID
   */
  async getById(activityId: number): Promise<Activity> {
    return xanoRequest<Activity>(`${MAIN_BASE_URL}/activity/${activityId}`);
  },

  /**
   * Create new activity
   */
  async create(data: Omit<Activity, 'id' | 'created_at'>): Promise<Activity> {
    return xanoRequest<Activity>(`${MAIN_BASE_URL}/activity`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete activity
   */
  async delete(activityId: number): Promise<void> {
    await xanoRequest(`${MAIN_BASE_URL}/activity/${activityId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get activities for a specific site
   */
  async getBySiteId(siteId: string, limit?: number): Promise<Activity[]> {
    const activities = await this.getAll();
    const filtered = activities.filter(a => a.site_id === siteId);

    if (limit) {
      return filtered.slice(-limit).reverse();
    }
    return filtered;
  },

  /**
   * Get activities for a specific form
   */
  async getByFormId(formId: string, limit?: number): Promise<Activity[]> {
    const activities = await this.getAll();
    const filtered = activities.filter(a => a.form_id === formId);

    if (limit) {
      return filtered.slice(-limit).reverse();
    }
    return filtered;
  },
};

// ===================
// PLAN ENFORCEMENT UTILITIES
// ===================

export interface PlanLimitResult {
  allowed: boolean;
  currentCount: number;
  maxLimit: number;
  planName: string;
  message?: string;
}

/**
 * Check if user can perform an action based on their plan limits
 */
export async function checkPlanLimit(
  userId: number, 
  limitType: 'sites' | 'rules' | 'submissions'
): Promise<PlanLimitResult> {
  try {
    // Get the user by ID - use direct Xano API call for server-side
    const user = await xanoRequest<User>(`${AUTH_BASE_URL}/auth/me`);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is admin
    const { isAdmin } = await import('@/lib/adminUtils');
    const userIsAdmin = isAdmin(user);
    
    // Check if test mode is enabled (only for admins)
    const { isTestModeEnabled, getTestCounts } = await import('@/lib/testModeStore');
    const testModeActive = userIsAdmin && isTestModeEnabled();
    
    // If admin and NOT in test mode, bypass all limits
    if (userIsAdmin && !testModeActive) {
      return {
        allowed: true,
        currentCount: 0,
        maxLimit: -1, // Unlimited
        planName: 'Admin',
        message: 'Admin access - unlimited'
      };
    }
    
    // Get user's plan (default to Free plan if no plan assigned)
    const userPlanId = user.plan_id || 1; // Default to Free plan (ID 1)
    const userPlan = await xanoPlans.getById(userPlanId);
    
    // Get current count based on limit type
    let currentCount = 0;
    let maxLimit = 0;
    
    // If test mode is active for admin, use simulated counts
    if (testModeActive) {
      const testCounts = getTestCounts();
      switch (limitType) {
        case 'sites':
          currentCount = testCounts.sites || 0;
          maxLimit = userPlan.max_sites;
          break;
        case 'rules':
          currentCount = testCounts.rules;
          maxLimit = userPlan.max_logic_rules;
          break;
        case 'submissions':
          currentCount = testCounts.submissions;
          maxLimit = userPlan.max_submissions;
          break;
      }
    } else {
      // Use real counts for non-test mode
      switch (limitType) {
        case 'sites':
          currentCount = await getSiteCount(userId);
          maxLimit = userPlan.max_sites;
          break;
        case 'rules':
          currentCount = await getRuleCount(userId);
          maxLimit = userPlan.max_logic_rules;
          break;
        case 'submissions':
          currentCount = await getSubmissionCount(userId);
          maxLimit = userPlan.max_submissions;
          break;
      }
    }
    
    // Check if limit is reached
    const allowed = maxLimit === -1 || currentCount < maxLimit;
    
    return {
      allowed,
      currentCount,
      maxLimit,
      planName: userPlan.plan_name,
      message: allowed ? undefined : `Your ${userPlan.plan_name} plan allows ${maxLimit === -1 ? 'unlimited' : maxLimit} ${limitType}. Upgrade to add more.`
    };
    
  } catch (error) {
    console.error('Error checking plan limit:', error);
    return {
      allowed: false,
      currentCount: 0,
      maxLimit: 0,
      planName: 'Unknown',
      message: 'Error checking plan limits'
    };
  }
}

/**
 * Get current form count for a user
 */
async function getFormCount(userId: number): Promise<number> {
  const forms = await xanoForms.getAll();
  return forms.filter(form => form.user_id === userId).length;
}

/**
 * Get current site count for a user
 */
async function getSiteCount(userId: number): Promise<number> {
  const sites = await xanoSites.getAll();
  return sites.filter(site => site.user_id === userId).length;
}

/**
 * Get current rule count for a user (from file-based storage)
 */
async function getRuleCount(userId: number): Promise<number> {
  // For now, we'll count all rules since rules don't have user_id in file storage
  // TODO: Update rules storage to include user_id
  const allRules = getAllRules();
  
  // Since rules don't have user_id in file storage yet, we'll use a different approach
  // For now, we'll allow unlimited rules for testing purposes
  // In production, this should be updated to track user_id in rules
  
  return 0; // Return 0 to allow rule creation for now
}

/**
 * Get current submission count for a user
 */
async function getSubmissionCount(userId: number): Promise<number> {
  const submissions = await xanoSubmissions.getAll();
  return submissions.filter(submission => submission.user_id === userId).length;
}

/**
 * Helper function to get all rules (duplicate from rulesStore for plan enforcement)
 * This function is server-side only and should not be imported in client components
 */
function getAllRules(): any[] {
  // Only run on server side
  if (typeof window !== 'undefined') {
    console.warn('getAllRules called on client side - returning empty array');
    return [];
  }
  
  try {
    // Dynamic import to avoid bundling fs in client
    const fs = eval('require')('fs');
    const path = eval('require')('path');
    const RULES_FILE = path.join(process.cwd(), 'rules.json');
    
    if (fs.existsSync(RULES_FILE)) {
      const data = fs.readFileSync(RULES_FILE, 'utf8');
      const rules = JSON.parse(data);
      return Object.values(rules);
    }
    return [];
  } catch (error) {
    console.error('Error loading rules:', error);
    return [];
  }
}

// Default export with all APIs
export default {
  auth: xanoAuth,
  forms: xanoForms,
  rules: xanoRules,
  plans: xanoPlans,
  submissions: xanoSubmissions,
  notifications: xanoNotifications,
  sites: xanoSites,
  checkPlanLimit,
};

