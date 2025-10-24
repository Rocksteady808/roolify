/**
 * Production-safe logging utility
 * Only logs in development mode, sanitizes sensitive data
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Sanitize sensitive data from objects
 */
function sanitize(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'access_token',
    'refresh_token',
    'webflow_access_token',
    'webflow_refresh_token',
    'authorization',
    'xano_auth_token',
  ];

  if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()))) {
      // Mask sensitive values
      if (typeof value === 'string' && value.length > 0) {
        sanitized[key] = `${value.substring(0, 4)}***${value.substring(value.length - 4)}`;
      } else {
        sanitized[key] = '***';
      }
    } else if (typeof value === 'object') {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Development-only logger
 */
export const logger = {
  /**
   * Log debug information (only in development)
   */
  debug: (message: string, data?: any) => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, data ? sanitize(data) : '');
    }
  },

  /**
   * Log info (only in development)
   */
  info: (message: string, data?: any) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, data ? sanitize(data) : '');
    }
  },

  /**
   * Log warnings (always logged, but sanitized)
   */
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? sanitize(data) : '');
  },

  /**
   * Log errors (always logged, but sanitized)
   */
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error ? sanitize(error) : '');
  },

  /**
   * Log with custom prefix (only in development)
   */
  log: (prefix: string, message: string, data?: any) => {
    if (isDev) {
      console.log(`[${prefix}] ${message}`, data ? sanitize(data) : '');
    }
  },
};

/**
 * Format time for logging
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}min`;
}





