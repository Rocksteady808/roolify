import { NextResponse } from 'next/server';
import { xanoRules } from "../../../../lib/xano";
import { logActivity } from '../../../../lib/activityStore';

// Function to trigger script regeneration
async function triggerScriptRegeneration(siteId: string) {
  try {
    console.log(`[Script Regeneration] Triggering for site ${siteId}`);
    
    // Call the script deploy endpoint to regenerate the script
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:1337'}/api/script/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`[Script Regeneration] Success for site ${siteId}:`, result);
    } else {
      console.error(`[Script Regeneration] Failed for site ${siteId}:`, response.status);
    }
  } catch (error) {
    console.error(`[Script Regeneration] Error for site ${siteId}:`, error);
  }
}

export async function GET(req: Request, { params }: { params: { ruleId: string } }) {
  try {
    const { ruleId } = params;
    const rule = await xanoRules.getById(parseInt(ruleId));
    
    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      rule
    });
    
  } catch (error) {
    console.error("Error fetching rule:", error);
    return NextResponse.json(
      { error: "Failed to fetch rule", details: String(error) }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { ruleId: string } }) {
  try {
    const { ruleId } = params;
    const updates = await req.json();
    
    const updatedRule = await xanoRules.update(parseInt(ruleId), updates);
    
    if (!updatedRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    
    // Trigger script regeneration
    try {
      const ruleData = typeof updatedRule.rule_data === 'string' ? JSON.parse(updatedRule.rule_data) : updatedRule.rule_data;
      await triggerScriptRegeneration(ruleData.siteId || '');
    } catch (error) {
      console.warn('Failed to trigger script regeneration:', error);
    }
    
    // Log activity for rule update
    try {
      const ruleData = typeof updatedRule.rule_data === 'string' ? JSON.parse(updatedRule.rule_data) : updatedRule.rule_data;
      await logActivity({
        type: 'rule_updated',
        rule_name: ruleData.name || updatedRule.rule_name,
        rule_id: ruleId,
        form_id: String(updatedRule.form_id),
        site_id: ruleData.siteId,
        metadata: {
          conditionCount: ruleData.conditions?.length,
          actionCount: ruleData.actions?.length
        }
      });
      console.log('[PUT /rules] Activity logged for rule update');
    } catch (error) {
      console.error('[PUT /rules] Failed to log activity:', error);
    }
    
    return NextResponse.json({
      success: true,
      rule: updatedRule,
      message: "Rule updated successfully",
      scriptUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:1337'}/api/script/serve/${ruleData.siteId || ''}`
    });
    
  } catch (error) {
    console.error("Error updating rule:", error);
    return NextResponse.json(
      { error: "Failed to update rule", details: String(error) }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { ruleId: string } }) {
  try {
    const { ruleId } = params;
    
    // Get the rule first to get the siteId
    const rule = await xanoRules.getById(parseInt(ruleId));
    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    
    // Log activity for rule deletion before deleting
    try {
      const ruleData = typeof rule.rule_data === 'string' ? JSON.parse(rule.rule_data) : rule.rule_data;
      await logActivity({
        type: 'rule_deleted',
        rule_name: ruleData.name || rule.rule_name,
        rule_id: ruleId,
        form_id: String(rule.form_id),
        site_id: ruleData.siteId
      });
      console.log('[DELETE /rules] Activity logged for rule deletion');
    } catch (error) {
      console.error('[DELETE /rules] Failed to log activity:', error);
    }
    
    // Parse rule data for script regeneration
    const ruleData = typeof rule.rule_data === 'string' ? JSON.parse(rule.rule_data) : rule.rule_data;
    
    await xanoRules.delete(parseInt(ruleId));
    
    // Trigger script regeneration
    try {
      await triggerScriptRegeneration(ruleData.siteId || '');
    } catch (error) {
      console.warn('Failed to trigger script regeneration:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: "Rule deleted successfully",
      scriptUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:1337'}/api/script/serve/${ruleData.siteId || ''}`
    });
    
  } catch (error) {
    console.error("Error deleting rule:", error);
    return NextResponse.json(
      { error: "Failed to delete rule", details: String(error) }, 
      { status: 500 }
    );
  }
}


