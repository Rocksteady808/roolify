import { NextResponse } from 'next/server';
import { xanoRules } from '../../../lib/xano';

/**
 * Global rules endpoint that fetches from Xano
 * Supports filtering by siteId, formId, and activeOnly
 * 
 * GET /api/form-rules?siteId=xxx&activeOnly=true
 * 
 * This replaces /api/rules for loading rules from Xano instead of local file
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');
    const formId = searchParams.get('formId');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    console.log(`[GET /form-rules] Fetching rules from Xano - siteId: ${siteId}, formId: ${formId}, activeOnly: ${activeOnly}`);
    
    // Fetch all rules from Xano
    const allRules = await xanoRules.getAll();
    
    // Convert Xano rules to expected format
    let rules = allRules.map(rule => {
      try {
        let ruleData;
        if (typeof rule.rule_data === 'string') {
          // Handle double-encoded JSON (JSON string that contains another JSON string)
          const parsed = JSON.parse(rule.rule_data);
          if (typeof parsed === 'string') {
            ruleData = JSON.parse(parsed);
          } else {
            ruleData = parsed;
          }
        } else {
          ruleData = rule.rule_data;
        }
        
        console.log(`[GET /form-rules] Parsed rule ${rule.id}:`, {
          id: rule.id,
          name: rule.rule_name,
          conditions: ruleData.conditions?.length || 0,
          actions: ruleData.actions?.length || 0,
          formId: ruleData.formId,
          siteId: ruleData.siteId
        });
        
        return {
          id: String(rule.id),
          formId: ruleData.formId || String(rule.form_id),
          siteId: ruleData.siteId || '',
          name: rule.rule_name,
          conditions: ruleData.conditions || [],
          actions: ruleData.actions || [],
          isActive: ruleData.isActive !== false, // Default to true
          logicType: ruleData.logicType || 'AND',
          createdAt: new Date(rule.created_at).toISOString(),
          updatedAt: new Date(rule.created_at).toISOString()
        };
      } catch (e) {
        console.error('Error parsing rule:', rule.id, e);
        return null;
      }
    }).filter(Boolean);
    
    // Apply filters
    if (siteId) {
      rules = rules.filter(rule => rule.siteId === siteId);
      console.log(`[GET /form-rules] Filtered to ${rules.length} rules for siteId: ${siteId}`);
    }
    
    if (formId) {
      rules = rules.filter(rule => rule.formId === formId);
      console.log(`[GET /form-rules] Filtered to ${rules.length} rules for formId: ${formId}`);
    }
    
    if (activeOnly) {
      rules = rules.filter(rule => rule.isActive);
      console.log(`[GET /form-rules] Filtered to ${rules.length} active rules`);
    }
    
    console.log(`[GET /form-rules] Returning ${rules.length} rule(s) from Xano`);
    
    return NextResponse.json({
      success: true,
      rules,
      count: rules.length
    });
    
  } catch (err) {
    console.error('[GET /form-rules] Error fetching rules:', err);
    return NextResponse.json({ 
      error: (err as Error).message || String(err),
      success: false,
      rules: [],
      count: 0
    }, { status: 500 });
  }
}

