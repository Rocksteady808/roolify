import { xanoSites } from './xano';

type TokenRecord = { 
  token: string; 
  site?: any; 
  userId?: string;
  expiresAt?: number;
  refreshToken?: string;
};

// Create a Map to store webflow tokens (for backward compatibility with file-based storage)
const webflowStore = new Map<string, TokenRecord>();

export default webflowStore;

export async function setTokenForSite(siteId: string, record: TokenRecord) {
  try {
    // Update or create site in Xano
    await xanoSites.upsert({
      webflow_site_id: siteId,
      site_name: record.site?.displayName || record.site?.name || 'Unnamed Site',
      user_id: record.userId ? parseInt(record.userId) : undefined,
      webflow_access_token: record.token,
      webflow_refresh_token: record.refreshToken,
      token_expires_at: record.expiresAt,
      is_active: true
    });
    console.log(`Updated token for site ${siteId} in Xano`);
  } catch (error) {
    console.error(`Failed to update token for site ${siteId} in Xano:`, error);
  }
}

export async function getTokenForSite(siteId: string): Promise<TokenRecord | null> {
  try {
    const site = await xanoSites.getByWebflowSiteId(siteId);
    if (!site || !site.webflow_access_token) return null;
    
    const record: TokenRecord = {
      token: site.webflow_access_token,
      site: {
        id: site.webflow_site_id,
        displayName: site.site_name,
        name: site.site_name,
        shortName: site.webflow_site_id
      },
      userId: site.user_id?.toString(),
      expiresAt: site.token_expires_at,
      refreshToken: site.webflow_refresh_token
    };

    // Check if token is expired and refresh if needed
    if (isTokenExpired(record)) {
      console.log(`[Webflow Token] Token expired for site ${siteId}, refreshing...`);
      const refreshedRecord = await refreshWebflowToken(siteId);
      return refreshedRecord || record; // Return refreshed token or fallback to old token
    }
    
    return record;
  } catch (error) {
    console.error(`Failed to get token for site ${siteId} from Xano:`, error);
    return null;
  }
}

export async function getSitesForUser(userId?: string): Promise<{ siteId: string; site: any; hasToken: boolean }[]> {
  try {
    const sites = await xanoSites.getAll();
    const userSites: { siteId: string; site: any; hasToken: boolean }[] = [];
    
    for (const site of sites) {
      if (!userId || site.user_id?.toString() === userId) {
        userSites.push({ 
          siteId: site.webflow_site_id, 
          site: {
            id: site.webflow_site_id,
            displayName: site.site_name,
            name: site.site_name,
            shortName: site.webflow_site_id
          }, 
          hasToken: !!site.webflow_access_token 
        });
      }
    }
    return userSites;
  } catch (error) {
    console.error('Failed to get sites for user from Xano:', error);
    return [];
  }
}

export async function clearTokens(): Promise<void> {
  try {
    const sites = await xanoSites.getAll();
    for (const site of sites) {
      if (site.id) {
        await xanoSites.update(site.id, {
          webflow_access_token: null,
          webflow_refresh_token: null,
          token_expires_at: null,
          is_active: false
        });
      }
    }
    console.log('Cleared all tokens in Xano');
  } catch (error) {
    console.error('Failed to clear tokens in Xano:', error);
  }
}

export async function clearTokensForUser(userId: string): Promise<void> {
  try {
    const sites = await xanoSites.getAll();
    for (const site of sites) {
      if (site.user_id?.toString() === userId && site.id) {
        await xanoSites.update(site.id, {
          webflow_access_token: null,
          webflow_refresh_token: null,
          token_expires_at: null,
          is_active: false
        });
      }
    }
    console.log(`Cleared tokens for user ${userId} in Xano`);
  } catch (error) {
    console.error(`Failed to clear tokens for user ${userId} in Xano:`, error);
  }
}

export function isTokenExpired(record: TokenRecord): boolean {
  if (!record.expiresAt) return false;
  // Add 5 minute buffer to refresh before actual expiry
  const bufferMs = 5 * 60 * 1000;
  return Date.now() >= (record.expiresAt - bufferMs);
}

/**
 * Refresh Webflow access token using refresh token
 */
export async function refreshWebflowToken(siteId: string): Promise<TokenRecord | null> {
  try {
    const site = await xanoSites.getByWebflowSiteId(siteId);
    if (!site || !site.webflow_refresh_token) {
      console.error(`No refresh token available for site ${siteId}`);
      return null;
    }

    console.log(`[Webflow Token Refresh] Refreshing token for site ${siteId}...`);

    // Call Webflow OAuth refresh endpoint
    const response = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.WEBFLOW_CLIENT_ID,
        client_secret: process.env.WEBFLOW_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: site.webflow_refresh_token
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Webflow Token Refresh] Failed to refresh token:`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    console.log(`[Webflow Token Refresh] Successfully refreshed token for site ${siteId}`);
    
    // Calculate expiration time (typically expires_in is in seconds)
    const expiresAt = Date.now() + (data.expires_in * 1000);

    // Update token in Xano
    await xanoSites.update(site.id!, {
      webflow_access_token: data.access_token,
      webflow_refresh_token: data.refresh_token || site.webflow_refresh_token, // Use new refresh token if provided
      token_expires_at: expiresAt
    });

    return {
      token: data.access_token,
      site: {
        id: site.webflow_site_id,
        displayName: site.site_name,
        name: site.site_name,
        shortName: site.webflow_site_id
      },
      userId: site.user_id?.toString(),
      expiresAt: expiresAt,
      refreshToken: data.refresh_token || site.webflow_refresh_token
    };
  } catch (error) {
    console.error(`[Webflow Token Refresh] Error refreshing token for site ${siteId}:`, error);
    return null;
  }
}

export async function refreshTokenIfNeeded(siteId: string): Promise<TokenRecord | null> {
  const record = await getTokenForSite(siteId);
  if (!record) return null;
  
  if (isTokenExpired(record)) {
    console.log(`[Webflow Token Refresh] Token for site ${siteId} is expired, refreshing...`);
    return await refreshWebflowToken(siteId);
  }
  
  return record;
}
