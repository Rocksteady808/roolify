import { NextResponse } from 'next/server';
import { xanoRules } from '../../../../lib/xano';

// Helper function to detect MongoDB ObjectIDs
function isMongoId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id);
}

// Helper function to extract all field IDs from a rule
function extractFieldIds(rule: any) {
  const fieldIds: Array<{
    type: 'condition' | 'action';
    fieldId: string;
    ruleId: string;
    ruleName: string;
  }> = [];
  
  // Extract from conditions
  if (rule.conditions && Array.isArray(rule.conditions)) {
    rule.conditions.forEach((condition: any) => {
      if (condition.fieldId) {
        fieldIds.push({
          type: 'condition',
          fieldId: condition.fieldId,
          ruleId: rule.id,
          ruleName: rule.name
        });
      }
    });
  }
  
  // Extract from actions
  if (rule.actions && Array.isArray(rule.actions)) {
    rule.actions.forEach((action: any) => {
      if (action.targetFieldId) {
        fieldIds.push({
          type: 'action',
          fieldId: action.targetFieldId,
          ruleId: rule.id,
          ruleName: rule.name
        });
      }
    });
  }
  
  return fieldIds;
}

export async function GET() {
  try {
    console.log('🔍 Auditing rules for MongoDB ObjectIDs...');
    
    // Get all rules from Xano
    const allRules = await xanoRules.getAll();
    console.log(`Found ${allRules.length} total rules in Xano`);
    
    const problematicRules: any[] = [];
    const allFieldIds: any[] = [];
    
    // Process each rule
    for (const rule of allRules) {
      try {
        const ruleData = typeof rule.rule_data === 'string' 
          ? JSON.parse(rule.rule_data) 
          : rule.rule_data;
        
        const fieldIds = extractFieldIds(ruleData);
        allFieldIds.push(...fieldIds);
        
        // Check for MongoDB ObjectIDs
        const mongoIds = fieldIds.filter(f => isMongoId(f.fieldId));
        
        if (mongoIds.length > 0) {
          problematicRules.push({
            id: rule.id,
            name: rule.rule_name,
            formId: rule.form_id,
            mongoIds: mongoIds,
            ruleData: ruleData
          });
        }
      } catch (error) {
        console.error(`❌ Error processing rule ${rule.id}:`, error);
      }
    }
    
    // Report findings
    const auditResults = {
      totalRules: allRules.length,
      totalFieldReferences: allFieldIds.length,
      problematicRulesCount: problematicRules.length,
      problematicRules: problematicRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        formId: rule.formId,
        mongoIds: rule.mongoIds,
        // Don't include full ruleData in response for security
        hasRuleData: !!rule.ruleData
      }))
    };
    
    console.log('📊 AUDIT RESULTS:');
    console.log(`Total rules processed: ${auditResults.totalRules}`);
    console.log(`Total field references: ${auditResults.totalFieldReferences}`);
    console.log(`Rules with MongoDB ObjectIDs: ${auditResults.problematicRulesCount}`);
    
    return NextResponse.json({
      success: true,
      auditResults
    });
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Audit failed', 
        details: String(error) 
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    console.log('🗑️ Deleting rules with MongoDB ObjectIDs...');
    
    // First, audit to find problematic rules
    const auditResponse = await GET();
    const auditData = await auditResponse.json();
    
    if (!auditData.success) {
      throw new Error('Failed to audit rules');
    }
    
    const problematicRules = auditData.auditResults.problematicRules;
    
    if (problematicRules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No problematic rules found. Nothing to delete.',
        deletedCount: 0
      });
    }
    
    // Delete each problematic rule
    let deletedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const rule of problematicRules) {
      try {
        console.log(`Deleting rule: ${rule.name} (ID: ${rule.id})`);
        await xanoRules.delete(rule.id);
        deletedCount++;
        console.log(`✅ Deleted rule: ${rule.name}`);
      } catch (error) {
        const errorMsg = `Failed to delete rule ${rule.name}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }
    
    const result = {
      success: true,
      deletedCount,
      errorCount,
      totalProcessed: problematicRules.length,
      errors: errors.length > 0 ? errors : undefined
    };
    
    console.log('📊 DELETION SUMMARY:');
    console.log(`Rules deleted: ${deletedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total processed: ${problematicRules.length}`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Deletion process failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Deletion failed', 
        details: String(error) 
      }, 
      { status: 500 }
    );
  }
}
