import { NextResponse } from 'next/server';
import { checkPlanLimit, xanoRules } from '../../../../../lib/xano';
import { logActivity } from '../../../../../lib/activityStore';
import { getFieldMappings, findFieldByMultipleIdentifiers } from '../../../../../lib/field-mappings';

// Helper function to get current user ID from Authorization header
async function getCurrentUserId(): Promise<number | null> {
  try {
    const { xanoAuth } = await import('../../../../../lib/xano');
    const user = await xanoAuth.me();
    return user?.id || 1; // Default to admin user if auth fails
  } catch (error) {
    console.error('Auth error:', error);
    return 1; // Default to admin user
  }
}

// Helper function to resolve field names to technical IDs using smart mappings
function resolveFieldIds(conditions: any[], actions: any[], siteId: string, formId: string) {
  const fieldMappings = getFieldMappings(siteId, formId);
  
  console.log(`[Field Resolution] Resolving field IDs for site ${siteId}, form ${formId}`);
  console.log(`[Field Resolution] Available mappings:`, fieldMappings.length);
  
  // Resolve condition field IDs
  const resolvedConditions = conditions.map(condition => {
    const mapping = findFieldByMultipleIdentifiers(siteId, formId, condition.fieldId);
    if (mapping) {
      console.log(`[Field Resolution] ✅ Resolved condition: "${condition.fieldId}" -> "${mapping.technicalId}"`);
      return {
        ...condition,
        fieldId: mapping.technicalId
      };
    } else {
      console.log(`[Field Resolution] ⚠️ No mapping found for condition field: "${condition.fieldId}"`);
      return condition;
    }
  });
  
  // Resolve action target field IDs
  const resolvedActions = actions.map(action => {
    const mapping = findFieldByMultipleIdentifiers(siteId, formId, action.targetFieldId);
    if (mapping) {
      console.log(`[Field Resolution] ✅ Resolved action: "${action.targetFieldId}" -> "${mapping.technicalId}"`);
      return {
        ...action,
        targetFieldId: mapping.technicalId
      };
    } else {
      console.log(`[Field Resolution] ⚠️ No mapping found for action field: "${action.targetFieldId}"`);
      return action;
    }
  });
  
  return {
    conditions: resolvedConditions,
    actions: resolvedActions
  };
}

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  try {
    const { formId } = params;
    if (!formId) return NextResponse.json({ error: 'formId required' }, { status: 400 });

    // Fetch rules from Xano for this form
    const allRules = await xanoRules.getAll();
    
    // Filter rules by formId - handle both numeric IDs and HTML form IDs
    const formRules = allRules.filter(rule => {
      // Check if rule.form_id matches the numeric formId (handle both string and number)
      if (String(rule.form_id) === String(formId) || rule.form_id === parseInt(formId)) {
        return true;
      }
      
      // Check if the rule_data contains the formId as a Webflow HTML ID
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
        
        if (ruleData.formId === formId) {
          return true;
        }
      } catch (e) {
        // Ignore parsing errors
      }
      
      return false;
    });
    
    // Convert Xano rules to expected format
    const rules = formRules.map(rule => {
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
      
      return {
        id: String(rule.id),
        formId: ruleData.formId || String(rule.form_id), // Use Webflow HTML ID from rule_data, fallback to numeric ID
        name: rule.rule_name,
        conditions: ruleData.conditions || [],
        actions: ruleData.actions || [],
        isActive: true, // Xano rules are always active when saved
        createdAt: new Date(rule.created_at).toISOString(),
        updatedAt: new Date(rule.created_at).toISOString()
      };
    });
    
    console.log(`[GET /form-rules] Found ${rules.length} rule(s) for form ${formId} from Xano`);
    return NextResponse.json({ rules });
  } catch (err) {
    console.error('Error fetching rules for form:', err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { formId: string } }) {
  try {
    const { formId } = params;
    if (!formId) return NextResponse.json({ error: 'formId required' }, { status: 400 });

    const body = await req.json();
    const { conditions, actions, status, siteId } = body as any;

    console.log('[POST /form-rules] Creating rule for form:', formId);

    if (!conditions || !actions) {
      return NextResponse.json({ error: 'conditions and actions required' }, { status: 400 });
    }

    if (!siteId) {
      console.warn('[POST /form-rules] Warning: No siteId provided');
    }

    // Get current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check plan limits before creating rule (bypass for admin user)
    if (userId !== 1) {
      const planCheck = await checkPlanLimit(userId, 'rules');
      if (!planCheck.allowed) {
        return NextResponse.json({
          error: 'Plan limit reached',
          message: planCheck.message,
          currentCount: planCheck.currentCount,
          maxLimit: planCheck.maxLimit,
          planName: planCheck.planName
        }, { status: 403 });
      }
    }

    // Resolve field names to technical IDs using smart mappings
    const resolvedFields = resolveFieldIds(conditions, actions, siteId || '', formId);
    
    // Create rule data object with resolved field IDs
    const ruleData = {
      formId,
      siteId: siteId || '',
      name: `Rule for ${formId}`,
      conditions: resolvedFields.conditions,
      actions: resolvedFields.actions,
      isActive: status === 'active',
      logicType: 'AND'
    };

    // Save to Xano
    const savedRule = await xanoRules.create(
      ruleData.name,
      ruleData,
      parseInt(formId),
      userId,
      siteId || '' // Pass the webflow_site_id
    );

    console.log('[POST /form-rules] Rule created successfully in Xano:', savedRule.id);
    
    // Log activity for rule creation
    try {
      await logActivity({
        type: 'rule_created',
        rule_name: savedRule.rule_name,
        rule_id: String(savedRule.id),
        form_id: formId,
        site_id: siteId,
        metadata: {
          conditionCount: conditions.length,
          actionCount: actions.length,
          status: status
        }
      });
      console.log('[POST /form-rules] Activity logged for rule creation');
    } catch (error) {
      console.error('[POST /form-rules] Failed to log activity:', error);
    }
    
    // Return in expected format
    const newRule = {
      id: String(savedRule.id),
      formId: String(savedRule.form_id),
      name: savedRule.rule_name,
      conditions,
      actions,
      isActive: status === 'active',
      createdAt: new Date(savedRule.created_at).toISOString(),
      updatedAt: new Date(savedRule.created_at).toISOString()
    };

    return NextResponse.json({ success: true, rule: newRule });
  } catch (err) {
    console.error('Error creating rule:', err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { formId: string } }) {
  try {
    const { formId } = params;
    const url = new URL(req.url);
    const ruleId = url.searchParams.get('ruleId');
    const siteId = url.searchParams.get('siteId');
    if (!formId) return NextResponse.json({ error: 'formId required' }, { status: 400 });
    if (!ruleId) return NextResponse.json({ error: 'ruleId required' }, { status: 400 });

    // Get the rule first to capture its details for activity logging
    const rule = await xanoRules.getById(parseInt(ruleId));

    // Delete from Xano
    await xanoRules.delete(parseInt(ruleId));

    console.log('[DELETE /form-rules] Rule deleted successfully from Xano:', ruleId);

    // Log activity for rule deletion
    try {
      let ruleName = `Rule ${ruleId}`;
      let activitySiteId = siteId || '';

      if (rule) {
        try {
          const ruleData = typeof rule.rule_data === 'string' ? JSON.parse(rule.rule_data) : rule.rule_data;
          ruleName = ruleData.name || rule.rule_name || ruleName;
          activitySiteId = ruleData.siteId || siteId || '';
        } catch (e) {
          console.warn('[DELETE /form-rules] Could not parse rule data for activity logging:', e);
        }
      }

      await logActivity({
        type: 'rule_deleted',
        rule_name: ruleName,
        rule_id: ruleId,
        form_id: formId,
        site_id: activitySiteId
      });
      console.log('[DELETE /form-rules] Activity logged for rule deletion');
    } catch (error) {
      console.error('[DELETE /form-rules] Failed to log activity:', error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting rule:', err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { formId: string } }) {
  try {
    const { formId } = params;
    if (!formId) return NextResponse.json({ error: 'formId required' }, { status: 400 });

    const body = await req.json();
    const { ruleId, conditions, actions, status, logicType, name, siteId } = body as any;

    console.log('[PUT /form-rules] Updating rule:', { ruleId, formId, conditionsCount: conditions?.length, actionsCount: actions?.length, status, siteId });
    console.log('[PUT /form-rules] Rule ID type:', typeof ruleId, 'Value:', ruleId);

    if (!ruleId) return NextResponse.json({ error: 'ruleId required to update' }, { status: 400 });

    if (!conditions || !actions) {
      return NextResponse.json({ error: 'conditions and actions required' }, { status: 400 });
    }

    // Get current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Create updated rule data object
    const ruleData = {
      formId,
      siteId: siteId || '',
      name: name || `Rule ${ruleId}`, // Use provided name or fallback to rule ID
      conditions,
      actions,
      isActive: status === 'active',
      logicType: logicType || 'AND'
    };

    // Update in Xano
    const numericRuleId = parseInt(ruleId);
    console.log('[PUT /form-rules] Calling xanoRules.update with ID:', numericRuleId, 'Data:', {
      rule_name: ruleData.name,
      rule_data: ruleData,
      user_id: userId,
      webflow_site_id: siteId || ''
    });

    const updatedRule = await xanoRules.update(numericRuleId, {
      rule_name: ruleData.name,
      rule_data: ruleData,
      user_id: userId,
      webflow_site_id: siteId || ''
    });

    console.log('[PUT /form-rules] Rule updated successfully in Xano:', updatedRule.id);

    // Log activity for rule update
    try {
      await logActivity({
        type: 'rule_updated',
        rule_name: ruleData.name,
        rule_id: String(updatedRule.id),
        form_id: formId,
        site_id: body.siteId,
        metadata: {
          conditionCount: conditions.length,
          actionCount: actions.length,
          status: status
        }
      });
      console.log('[PUT /form-rules] Activity logged for rule update');
    } catch (error) {
      console.error('[PUT /form-rules] Failed to log activity:', error);
    }

    // Return in expected format
    const updated = {
      id: String(updatedRule.id),
      formId: String(updatedRule.form_id),
      name: updatedRule.rule_name,
      conditions,
      actions,
      isActive: status === 'active',
      createdAt: new Date(updatedRule.created_at).toISOString(),
      updatedAt: new Date(updatedRule.created_at).toISOString()
    };

    return NextResponse.json({ success: true, rule: updated });
  } catch (err) {
    console.error('Error updating rule:', err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}
