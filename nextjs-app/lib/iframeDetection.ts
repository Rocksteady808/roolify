/**
 * Utility functions to detect iframe context
 */

export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export function isInWebflowDesigner(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.location !== window.parent.location && 
           (window.location.ancestorOrigins?.[0]?.includes('webflow') || false);
  } catch (e) {
    return true;
  }
}






