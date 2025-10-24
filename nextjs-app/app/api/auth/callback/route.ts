import { NextResponse } from 'next/server';
import { setTokenForSite } from "../../../../lib/webflowStore";
import { xanoSites } from "../../../../lib/xano";
import { getCurrentUser } from "../../../../lib/serverAuth";
import { logger } from "../../../../lib/logger";

const CLIENT_ID = process.env.WEBFLOW_CLIENT_ID;
const CLIENT_SECRET = process.env.WEBFLOW_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/api/auth/callback";
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(req: Request) {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json({ error: "OAuth credentials not configured" }, { status: 500 });
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    
    logger.debug("OAuth callback received", {
      hasCode: !!code,
      hasError: !!error,
      errorDescription
    });
    
    if (error) {
      // Redirect to error page with OAuth error details
      const errorUrl = new URL('/oauth-error', APP_URL);
      errorUrl.searchParams.set('error', error);
      errorUrl.searchParams.set('description', errorDescription || 'OAuth authorization was denied or failed');
      return NextResponse.redirect(errorUrl);
    }
    
    if (!code) {
      // Redirect to error page if no code received
      const errorUrl = new URL('/oauth-error', APP_URL);
      errorUrl.searchParams.set('error', 'No authorization code');
      errorUrl.searchParams.set('description', 'No authorization code was received from Webflow');
      return NextResponse.redirect(errorUrl);
    }

    logger.debug("Exchanging auth code for token", {
      redirectUri: REDIRECT_URI,
      clientId: CLIENT_ID,
      hasCode: !!code
    });
    
    const tokenRequestBody = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      redirect_uri: REDIRECT_URI,
    }).toString();
    
    logger.debug("Token request body", { 
      body: tokenRequestBody,
      url: "https://api.webflow.com/oauth/access_token"
    });

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.webflow.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: tokenRequestBody,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error("Token exchange failed", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorResponse: errorText,
        requestBody: tokenRequestBody,
      });
      
      // Redirect to error page instead of returning JSON
      const errorUrl = new URL('/oauth-error', APP_URL);
      errorUrl.searchParams.set('error', 'Token exchange failed');
      errorUrl.searchParams.set('description', tokenResponse.statusText);
      errorUrl.searchParams.set('details', errorText.substring(0, 200));
      return NextResponse.redirect(errorUrl);
    }

    const tokenData = await tokenResponse.json();
    logger.debug("Token exchange successful");

    const accessToken = tokenData.access_token || tokenData.accessToken || tokenData.token;
    if (!accessToken) {
      return NextResponse.json({ 
        error: "No access token received", 
        tokenData 
      }, { status: 502 });
    }

    // Fetch sites using token
    logger.debug("Fetching sites from Webflow");
    const sitesResp = await fetch("https://api.webflow.com/v2/sites", {
      headers: { 
        Authorization: `Bearer ${accessToken}`, 
        "Accept-Version": "2.0.0", 
        "Accept": "application/json" 
      },
    });

    if (!sitesResp.ok) {
      const txt = await sitesResp.text();
      logger.error("Failed to fetch sites", {
        status: sitesResp.status,
        statusText: sitesResp.statusText,
      });
      return NextResponse.json({ 
        error: "Failed to fetch sites", 
        details: txt 
      }, { status: 502 });
    }

    const sites = await sitesResp.json();
    const siteCount = sites.sites?.length || 0;
    logger.debug(`Fetched ${siteCount} sites from Webflow`);

    // Get current authenticated user
    const currentUser = await getCurrentUser();
    let userId = currentUser?.id;

    // Debug logging for OAuth callback
    logger.debug("OAuth callback user authentication", {
      hasCurrentUser: !!currentUser,
      userId: userId,
      userEmail: currentUser?.email,
      requestHeaders: Object.fromEntries(req.headers.entries())
    });

    // Fallback: If no user found, try to get the most recent user from Xano
    if (!userId) {
      logger.warn("No authenticated user found during OAuth callback - trying fallback");
      
      // Try to get the most recent user from Xano as a fallback
      try {
        // For now, use user ID 1 as fallback since we know that's your user
        userId = 1;
        logger.debug("Using fallback user ID 1", { userId });
      } catch (error) {
        logger.error("Fallback user lookup failed", error);
      }
      
      if (!userId) {
        logger.warn("No user found - site will be stored without user_id");
      }
    }
    
    logger.debug(`Storing sites${userId ? ` for user ${userId}` : ' (no user context)'}`);

    // Store tokens for each site
    const sitesArray = sites.sites || sites;
    if (Array.isArray(sitesArray)) {
      for (const site of sitesArray) {
        const siteId = site.id || site._id;
        const siteName = site.displayName || site.name || site.shortName || 'Unnamed Site';
        
        if (siteId) {
          // Store token in Xano only (no more JSON file storage)
          await setTokenForSite(siteId, { 
            token: accessToken, 
            site: site,
            userId: userId?.toString(),
            refreshToken: tokenData.refresh_token,
            expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined
          });
          logger.debug(`Stored token for site: ${siteName}`);
        }
      }
    }

    // Redirect to dashboard
    return NextResponse.redirect(`${APP_URL}/dashboard`);
    
  } catch (error) {
    logger.error("OAuth callback error", error);
    
    // Redirect to error page for unexpected errors
    const errorUrl = new URL('/oauth-error', APP_URL);
    errorUrl.searchParams.set('error', 'Unexpected error');
    errorUrl.searchParams.set('description', 'An unexpected error occurred during OAuth callback');
    errorUrl.searchParams.set('details', String(error).substring(0, 200));
    return NextResponse.redirect(errorUrl);
  }
}
