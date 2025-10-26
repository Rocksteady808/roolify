import { NextResponse } from 'next/server';
import { xanoRules } from '../../../lib/xano';
import { checkPlanLimit } from '../../../lib/xano';
import { logActivity } from '../../../lib/activityStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formId, siteId, conditions, actions, status, rules, userId = 1 } = body as any;
    
    // Handle new structure (conditions + actions arrays)
    if (formId && conditions && actions) {
      // Bypass plan limit check for admin user (ID 1)
      // Admin users have unlimited access to all features
      if (userId !== 1) {
        // Only check plan limits for non-admin users
        const planCheck = await checkPlanLimit(userId, 'rules');
        if (!planCheck.allowed) {
          return NextResponse.json({
            error: 'Plan limit reached',
            message: planCheck.message,
            currentCount: planCheck.currentCount,
            maxLimit: planCheck.maxLimit,
            planName: planCheck.planName,
            limitType: 'rules',
            showUpgradeModal: true
          }, { status: 403 });
        }
      }
      
      const ruleName = `Rule ${Date.now()}`;
      
      // Create rule data object for Xano
      const ruleData = {
        formId,
        siteId: siteId || '',
        name: ruleName,
        conditions,
        actions,
        isActive: status === 'active'
      };
      
      const saved = await xanoRules.create(
        ruleName,
        ruleData,
        parseInt(formId), // Convert formId to number for Xano
        userId
      );
      
      // Log activity for rule creation
      try {
        await logActivity({
          type: 'rule_created',
          ruleName: saved.rule_name,
          ruleId: String(saved.id),
          formId: formId,
          siteId: siteId || '',
          user_id: userId,
          metadata: {
            conditionCount: conditions.length,
            actionCount: actions.length
          }
        });
        console.log(`[Universal Script] Logged activity for rule creation: ${saved.rule_name}`);
      } catch (activityError) {
        console.error('[Universal Script] Failed to log activity:', activityError);
        // Don't fail the request if activity logging fails
      }
      
      return NextResponse.json({ success: true, createdCount: 1, skippedCount: 0, rule: saved });
    }
    
    // Handle old structure (array of rules) for backward compatibility
    if (!formId || !Array.isArray(rules)) {
      return NextResponse.json({ error: 'formId and rules (or conditions/actions) required' }, { status: 400 });
    }

    let skippedCount = 0;
    const created: any[] = [];

    for (const r of rules) {
      try {
        // r expected: { triggerId, operator, triggerValue, action, targetIds }
        const ruleName = `Rule ${Date.now()}`;
        const conditions = [
          { id: String(Date.now() + Math.random()), fieldId: r.triggerId || '', operator: r.operator || '', value: r.triggerValue || '' }
        ];
        const actions = [
          { id: String(Date.now() + Math.random()), type: r.action || '', targetFieldId: Array.isArray(r.targetIds) ? (r.targetIds[0] || '') : (r.targetIds || '') }
        ];

        const ruleData = {
          formId,
          siteId: '',
          name: ruleName,
          conditions,
          actions,
          isActive: status === 'active'
        };
        
        const saved = await xanoRules.create(
          ruleName,
          ruleData,
          parseInt(formId), // Convert formId to number for Xano
          userId
        );
        created.push(saved);

      } catch (e) {
        skippedCount++;
      }
    }

    return NextResponse.json({ success: true, createdCount: created.length, skippedCount });
  } catch (err) {
    console.error('Error processing universal-script:', err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}
