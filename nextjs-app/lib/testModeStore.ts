/**
 * Test Mode State Management
 * Allows admins to simulate plan limits for testing
 */

export interface TestModeCounts {
  sites: number;
  rules: number;
  submissions: number;
}

const TEST_MODE_ENABLED_KEY = 'testMode_enabled';
const TEST_MODE_COUNTS_KEY = 'testMode_counts';

/**
 * Check if test mode is enabled
 */
export function isTestModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TEST_MODE_ENABLED_KEY) === 'true';
}

/**
 * Enable test mode
 */
export function enableTestMode(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TEST_MODE_ENABLED_KEY, 'true');
  
  // Initialize counts if not set
  if (!localStorage.getItem(TEST_MODE_COUNTS_KEY)) {
    resetTestCounts();
  }
}

/**
 * Disable test mode
 */
export function disableTestMode(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TEST_MODE_ENABLED_KEY, 'false');
}

/**
 * Get test mode counts
 */
export function getTestCounts(): TestModeCounts {
  if (typeof window === 'undefined') {
    return { sites: 0, rules: 0, submissions: 0 };
  }
  
  try {
    const countsStr = localStorage.getItem(TEST_MODE_COUNTS_KEY);
    if (!countsStr) {
      return { sites: 0, rules: 0, submissions: 0 };
    }
    return JSON.parse(countsStr);
  } catch (error) {
    console.error('Error getting test counts:', error);
    return { sites: 0, rules: 0, submissions: 0 };
  }
}

/**
 * Set a specific test count
 */
export function setTestCount(type: keyof TestModeCounts, count: number): void {
  if (typeof window === 'undefined') return;
  
  const counts = getTestCounts();
  counts[type] = Math.max(0, count); // Ensure non-negative
  localStorage.setItem(TEST_MODE_COUNTS_KEY, JSON.stringify(counts));
}

/**
 * Set all test counts at once
 */
export function setTestCounts(counts: TestModeCounts): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(TEST_MODE_COUNTS_KEY, JSON.stringify({
    sites: Math.max(0, counts.sites),
    rules: Math.max(0, counts.rules),
    submissions: Math.max(0, counts.submissions),
  }));
}

/**
 * Reset all test counts to zero
 */
export function resetTestCounts(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(TEST_MODE_COUNTS_KEY, JSON.stringify({
    sites: 0,
    rules: 0,
    submissions: 0,
  }));
}

/**
 * Toggle test mode on/off
 */
export function toggleTestMode(): boolean {
  const newState = !isTestModeEnabled();
  if (newState) {
    enableTestMode();
  } else {
    disableTestMode();
  }
  return newState;
}







