/**
 * Adaptive Field Detection System
 * 
 * This system intelligently matches Webflow form fields with live site elements,
 * automatically adapting to field name/ID changes across any form on any site.
 */

export interface SmartField {
  // Webflow identifiers (what the user sees)
  webflowName: string;        // "HBI Account Rep"
  webflowId: string;          // "68f4ead492bdf94e09bf00f2"
  
  // Live site identifiers (what the script uses)
  technicalId: string;        // "HBI-Account-Rep"
  liveName: string;          // "HBI-Account-Rep"
  
  // UI identifiers (what shows in dropdowns)
  displayName: string;        // "HBI Account Rep" (user-friendly)
  
  // Matching confidence
  confidence: number;         // 1-5 (higher = more confident match)
  
  // Fallback identifiers (for edge cases)
  aliases: string[];         // ["HBI Rep", "Account Rep", etc.]
  
  // Field metadata
  type: string;
  options?: string[];
  isFormField: boolean;
}

export interface FieldMatch {
  element: any;
  confidence: number;
  mapping: SmartField;
}

/**
 * Smart field matching that adapts to changes
 */
export function findMatchingElement(webflowField: any, scannedElements: any[]): FieldMatch | null {
  const fieldName = webflowField.name || webflowField.displayName;
  const fieldId = webflowField.id || webflowField._id;
  
  console.log(`[Smart Matching] Looking for field: "${fieldName}" (ID: ${fieldId})`);
  
  // Try multiple matching strategies in order of confidence
  const strategies = [
    // 1. Exact ID match (highest confidence)
    (el: any) => el.id === fieldId,
    
    // 2. Exact name match
    (el: any) => el.name === fieldName,
    
    // 3. Normalized name matching (handles spaces vs hyphens)
    (el: any) => normalizeName(el.name) === normalizeName(fieldName),
    
    // 4. Partial name matching (handles renames)
    (el: any) => el.name.toLowerCase().includes(fieldName.toLowerCase()) ||
                 fieldName.toLowerCase().includes(el.name.toLowerCase()),
    
    // 5. Semantic matching (handles major renames)
    (el: any) => isSemanticallySimilar(el.name, fieldName),
    
    // 6. Fuzzy matching (handles typos and variations)
    (el: any) => isFuzzyMatch(el.name, fieldName)
  ];
  
  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    const match = scannedElements.find(strategy);
    
    if (match) {
      const confidence = strategies.length - i; // Higher number = more confident
      
      console.log(`[Smart Matching] ✅ MATCHED: "${fieldName}" with "${match.name}" (confidence: ${confidence})`);
      
      return {
        element: match,
        confidence,
        mapping: {
          webflowName: fieldName,
          webflowId: fieldId,
          technicalId: match.id,
          liveName: match.name,
          displayName: fieldName, // Always show user-friendly name
          confidence,
          aliases: generateAliases(fieldName, match.name),
          type: match.tagName || match.type || 'unknown',
          options: match.options || [],
          isFormField: true
        }
      };
    }
  }
  
  console.log(`[Smart Matching] ❌ No match found for "${fieldName}"`);
  return null;
}

/**
 * Normalize names for comparison (handles spaces vs hyphens)
 */
function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, '-')  // spaces to hyphens
    .replace(/[^a-z0-9-]/g, '') // remove special chars
    .replace(/-+/g, '-'); // collapse multiple hyphens
}

/**
 * Check if two names are semantically similar (handles major renames)
 */
function isSemanticallySimilar(name1: string, name2: string): boolean {
  const words1 = name1.toLowerCase().split(/[\s-]+/);
  const words2 = name2.toLowerCase().split(/[\s-]+/);
  
  // Check if they share significant words
  const commonWords = words1.filter(word => 
    words2.some(word2 => word === word2 || word.includes(word2) || word2.includes(word))
  );
  
  // Require at least 50% word overlap for semantic similarity
  const similarity = commonWords.length / Math.min(words1.length, words2.length);
  return similarity >= 0.5;
}

/**
 * Fuzzy matching for typos and variations
 */
function isFuzzyMatch(name1: string, name2: string): boolean {
  const normalized1 = normalizeName(name1);
  const normalized2 = normalizeName(name2);
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  // Consider it a match if similarity is > 70%
  const similarity = 1 - (distance / maxLength);
  return similarity > 0.7;
}

/**
 * Generate aliases for a field (alternative names)
 */
function generateAliases(webflowName: string, liveName: string): string[] {
  const aliases = new Set<string>();
  
  // Add normalized versions
  aliases.add(normalizeName(webflowName));
  aliases.add(normalizeName(liveName));
  
  // Add variations with different separators
  aliases.add(webflowName.replace(/\s+/g, '-'));
  aliases.add(webflowName.replace(/\s+/g, '_'));
  aliases.add(liveName.replace(/-/g, ' '));
  aliases.add(liveName.replace(/-/g, '_'));
  
  // Add common abbreviations
  if (webflowName.includes('Account')) {
    aliases.add(webflowName.replace('Account', 'Acct'));
  }
  if (webflowName.includes('Number')) {
    aliases.add(webflowName.replace('Number', 'Num'));
  }
  
  return Array.from(aliases).filter(alias => alias !== webflowName && alias !== liveName);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Create field mapping for storage
 */
export function createFieldMapping(webflowField: any, match: FieldMatch): SmartField {
  return {
    webflowName: webflowField.name || webflowField.displayName,
    webflowId: webflowField.id || webflowField._id,
    technicalId: match.element.id,
    liveName: match.element.name,
    displayName: webflowField.name || webflowField.displayName,
    confidence: match.confidence,
    aliases: match.mapping.aliases,
    type: match.element.tagName || match.element.type || 'unknown',
    options: match.element.options || [],
    isFormField: true
  };
}

/**
 * Find field by multiple identifiers (for script use)
 */
export function findFieldByMultipleIdentifiers(identifier: string, mappings: SmartField[]): SmartField | null {
  // Try to find by any identifier
  for (const mapping of mappings) {
    if (mapping.webflowName === identifier ||
        mapping.webflowId === identifier ||
        mapping.technicalId === identifier ||
        mapping.liveName === identifier ||
        mapping.aliases.includes(identifier)) {
      return mapping;
    }
  }
  
  return null;
}


