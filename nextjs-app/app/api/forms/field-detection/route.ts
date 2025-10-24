import { NextRequest, NextResponse } from 'next/server';
import { detectFieldChanges, getFieldMappings, storeFieldMappings } from '@/lib/field-mappings';
import { findMatchingElement, createFieldMapping, SmartField } from '@/lib/field-matching';

/**
 * Field Change Detection API
 * 
 * Detects and manages field changes across any form on any site.
 * Automatically adapts to field name/ID changes.
 */

export async function POST(req: NextRequest) {
  try {
    const { siteId, formId, forceRescan = false } = await req.json();
    
    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }
    
    console.log(`[Field Detection] Detecting field changes for site ${siteId}, form ${formId || 'all'}`);
    
    // Get current Webflow form data
    const webflowResponse = await fetch(`${req.url.split('/api')[0]}/api/webflow/site/${siteId}/forms`);
    if (!webflowResponse.ok) {
      throw new Error(`Webflow API error: ${webflowResponse.status}`);
    }
    
    const webflowData = await webflowResponse.json();
    const webflowForms = webflowData.forms || [];
    
    // Get current live site elements using known working URL
    const siteUrl = siteId === '68eb5d6db0e34d2e3ed12c0a' 
      ? 'https://flow-forms-f8b3f7-dade497764f98663da54a.webflow.io'
      : `https://${siteId}.webflow.io`;
      
    const scanResponse = await fetch(`${req.url.split('/api')[0]}/api/scan/site-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: siteUrl })
    });
    
    if (!scanResponse.ok) {
      throw new Error(`Site scan error: ${scanResponse.status}`);
    }
    
    const scanData = await scanResponse.json();
    const scannedElements = scanData.selectElements || [];
    
    const results: {
      formId: string;
      formName: string;
      changes: Array<{
        type: 'added' | 'removed' | 'modified' | 'renamed';
        field: SmartField;
        oldField?: SmartField;
      }>;
      mappings: SmartField[];
    }[] = [];
    
    // Process each form
    for (const form of webflowForms) {
      const currentFormId = form.id || form._id;
      
      // Skip if specific formId requested and doesn't match
      if (formId && currentFormId !== formId) continue;
      
      console.log(`[Field Detection] Processing form: ${form.name} (${currentFormId})`);
      
      // Get current field mappings using smart matching
      const currentFields: SmartField[] = [];
      
      for (const [fieldId, fieldData] of Object.entries(form.fields || {})) {
        const field = {
          id: fieldId,
          name: fieldData.displayName || fieldData.name || fieldId,
          type: (fieldData.type || '').toString().toLowerCase(),
          displayName: fieldData.displayName || fieldData.name || fieldId,
          elementId: fieldData._id || undefined
        };
        
        // Use smart matching to find the best match
        const match = findMatchingElement(field, scannedElements);
        
        if (match) {
          const smartField = createFieldMapping(field, match);
          currentFields.push(smartField);
          console.log(`[Field Detection] ✅ Smart match: "${field.name}" -> "${match.element.name}" (confidence: ${match.confidence})`);
        } else {
          // Create a basic field mapping for unmatched fields
          const basicField: SmartField = {
            webflowName: field.name,
            webflowId: fieldId,
            technicalId: fieldId,
            liveName: field.name,
            displayName: field.name,
            confidence: 0,
            aliases: [],
            type: field.type,
            options: [],
            isFormField: true
          };
          currentFields.push(basicField);
          console.log(`[Field Detection] ⚠️ No match found for "${field.name}" - using basic mapping`);
        }
      }
      
      // Detect changes
      const changeDetection = detectFieldChanges(siteId, currentFormId, currentFields);
      
      results.push({
        formId: currentFormId,
        formName: form.name,
        changes: changeDetection.changes,
        mappings: changeDetection.mappings
      });
      
      console.log(`[Field Detection] Form ${form.name}: ${changeDetection.changes.length} changes detected`);
    }
    
    // Calculate overall statistics
    const totalChanges = results.reduce((sum, r) => sum + r.changes.length, 0);
    const totalMappings = results.reduce((sum, r) => sum + r.mappings.length, 0);
    
    console.log(`[Field Detection] Detection complete: ${totalChanges} changes, ${totalMappings} mappings`);
    
    return NextResponse.json({
      success: true,
      siteId,
      timestamp: new Date().toISOString(),
      results,
      statistics: {
        totalForms: results.length,
        totalChanges,
        totalMappings,
        changeTypes: {
          added: results.reduce((sum, r) => sum + r.changes.filter(c => c.type === 'added').length, 0),
          removed: results.reduce((sum, r) => sum + r.changes.filter(c => c.type === 'removed').length, 0),
          modified: results.reduce((sum, r) => sum + r.changes.filter(c => c.type === 'modified').length, 0),
          renamed: results.reduce((sum, r) => sum + r.changes.filter(c => c.type === 'renamed').length, 0)
        }
      }
    });
    
  } catch (error) {
    console.error('[Field Detection] Error:', error);
    return NextResponse.json(
      { 
        error: `Field detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');
    const formId = searchParams.get('formId');
    
    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }
    
    // Get stored mappings
    const { getSiteFieldMappings, getMappingStats } = await import('@/lib/field-mappings');
    
    const mappings = getSiteFieldMappings(siteId);
    const stats = getMappingStats(siteId);
    
    return NextResponse.json({
      success: true,
      siteId,
      formId,
      mappings: formId ? mappings[formId] || [] : mappings,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Field Detection] Error:', error);
    return NextResponse.json(
      { 
        error: `Failed to get field mappings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false 
      },
      { status: 500 }
    );
  }
}
