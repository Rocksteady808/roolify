import { xanoSites } from './xano';

type TokenRecord = { 
  token: string; 
  site?: any; 
  userId?: string;
  expiresAt?: number;
  refreshToken?: string;
};

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
    
    return {
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
  return Date.now() >= record.expiresAt;
}

export async function refreshTokenIfNeeded(siteId: string): Promise<TokenRecord | null> {
  const record = await getTokenForSite(siteId);
  if (!record) return null;
  
  if (isTokenExpired(record)) {
    // TODO: Implement token refresh logic
    console.warn(`Token for site ${siteId} is expired and needs refresh`);
    return null;
  }
  
  return record;
}
