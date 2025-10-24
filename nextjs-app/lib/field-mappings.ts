/**
 * Field Mapping Storage System
 * 
 * Stores and manages field mappings between Webflow and live site elements
 * for adaptive field detection across any form on any site.
 */

import { SmartField } from './field-matching';

interface FieldMappingStore {
  [siteId: string]: {
    [formId: string]: {
      fields: SmartField[];
      lastUpdated: string;
      version: number;
    };
  };
}

// In-memory store (in production, this would be a database)
const fieldMappings: FieldMappingStore = {};

/**
 * Store field mappings for a site and form
 */
export function storeFieldMappings(
  siteId: string, 
  formId: string, 
  fields: SmartField[]
): void {
  if (!fieldMappings[siteId]) {
    fieldMappings[siteId] = {};
  }
  
  fieldMappings[siteId][formId] = {
    fields,
    lastUpdated: new Date().toISOString(),
    version: (fieldMappings[siteId][formId]?.version || 0) + 1
  };
  
  console.log(`[Field Mappings] Stored ${fields.length} field mappings for site ${siteId}, form ${formId}`);
}

/**
 * Get field mappings for a site and form
 */
export function getFieldMappings(siteId: string, formId: string): SmartField[] {
  return fieldMappings[siteId]?.[formId]?.fields || [];
}

/**
 * Get all field mappings for a site
 */
export function getSiteFieldMappings(siteId: string): { [formId: string]: SmartField[] } {
  const siteMappings = fieldMappings[siteId] || {};
  const result: { [formId: string]: SmartField[] } = {};
  
  for (const [formId, mapping] of Object.entries(siteMappings)) {
    result[formId] = mapping.fields;
  }
  
  return result;
}

/**
 * Update a specific field mapping
 */
export function updateFieldMapping(
  siteId: string,
  formId: string,
  fieldId: string,
  updates: Partial<SmartField>
): boolean {
  const mapping = fieldMappings[siteId]?.[formId];
  if (!mapping) return false;
  
  const fieldIndex = mapping.fields.findIndex(f => 
    f.webflowId === fieldId || f.technicalId === fieldId
  );
  
  if (fieldIndex === -1) return false;
  
  mapping.fields[fieldIndex] = { ...mapping.fields[fieldIndex], ...updates };
  mapping.lastUpdated = new Date().toISOString();
  mapping.version++;
  
  console.log(`[Field Mappings] Updated field mapping for ${fieldId} in site ${siteId}, form ${formId}`);
  return true;
}

/**
 * Detect field changes by comparing current vs stored mappings
 */
export function detectFieldChanges(
  siteId: string,
  formId: string,
  currentFields: SmartField[]
): {
  changes: Array<{
    type: 'added' | 'removed' | 'modified' | 'renamed';
    field: SmartField;
    oldField?: SmartField;
  }>;
  mappings: SmartField[];
} {
  const storedFields = getFieldMappings(siteId, formId);
  const changes: Array<{
    type: 'added' | 'removed' | 'modified' | 'renamed';
    field: SmartField;
    oldField?: SmartField;
  }> = [];
  
  // Find added fields
  for (const currentField of currentFields) {
    const storedField = storedFields.find(f => 
      f.webflowId === currentField.webflowId || 
      f.technicalId === currentField.technicalId
    );
    
    if (!storedField) {
      changes.push({
        type: 'added',
        field: currentField
      });
    } else if (storedField.displayName !== currentField.displayName ||
               storedField.technicalId !== currentField.technicalId) {
      changes.push({
        type: 'renamed',
        field: currentField,
        oldField: storedField
      });
    } else if (storedField.confidence !== currentField.confidence ||
               JSON.stringify(storedField.aliases) !== JSON.stringify(currentField.aliases)) {
      changes.push({
        type: 'modified',
        field: currentField,
        oldField: storedField
      });
    }
  }
  
  // Find removed fields
  for (const storedField of storedFields) {
    const currentField = currentFields.find(f => 
      f.webflowId === storedField.webflowId || 
      f.technicalId === storedField.technicalId
    );
    
    if (!currentField) {
      changes.push({
        type: 'removed',
        field: storedField
      });
    }
  }
  
  // Update stored mappings
  storeFieldMappings(siteId, formId, currentFields);
  
  return {
    changes,
    mappings: currentFields
  };
}

/**
 * Get field by multiple identifiers (for script use)
 */
export function findFieldByMultipleIdentifiers(
  siteId: string,
  formId: string,
  identifier: string
): SmartField | null {
  const mappings = getFieldMappings(siteId, formId);
  
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

/**
 * Get all field identifiers for a field (for script use)
 */
export function getAllFieldIdentifiers(
  siteId: string,
  formId: string,
  fieldId: string
): string[] {
  const mapping = findFieldByMultipleIdentifiers(siteId, formId, fieldId);
  if (!mapping) return [fieldId]; // Fallback to original identifier
  
  return [
    mapping.webflowName,
    mapping.webflowId,
    mapping.technicalId,
    mapping.liveName,
    ...mapping.aliases
  ].filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
}

/**
 * Clear all mappings for a site (useful for testing)
 */
export function clearSiteMappings(siteId: string): void {
  delete fieldMappings[siteId];
  console.log(`[Field Mappings] Cleared all mappings for site ${siteId}`);
}

/**
 * Get mapping statistics
 */
export function getMappingStats(siteId: string): {
  totalSites: number;
  totalForms: number;
  totalFields: number;
  averageConfidence: number;
} {
  const siteMappings = fieldMappings[siteId] || {};
  const forms = Object.values(siteMappings);
  const allFields = forms.flatMap(f => f.fields);
  
  const totalSites = Object.keys(fieldMappings).length;
  const totalForms = forms.length;
  const totalFields = allFields.length;
  const averageConfidence = allFields.length > 0 
    ? allFields.reduce((sum, f) => sum + f.confidence, 0) / allFields.length 
    : 0;
  
  return {
    totalSites,
    totalForms,
    totalFields,
    averageConfidence
  };
}


