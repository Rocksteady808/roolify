// NEW: Xano-powered rules API
// This will replace route.ts once fully tested

import { NextResponse } from 'next/server';
import { xanoRules, xanoAuth } from '../../../lib/xano';

// Helper to get user from auth header
async function getCurrentUser(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No auth token provided');
    }
    
    // Token is already stored in localStorage on client
    // For server-side API calls, we need to pass it through
    const user = await xanoAuth.me();
    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const ruleData = await req.json();
    
    const { formId, siteId, name, conditions, actions, isActive = true, logicType = 'AND', userId = 1 } = ruleData;
    
    if (!formId || !name || !conditions || !actions) {
      return NextResponse.json({ 
        error: "Missing required fields: formId, name, conditions, actions" 
      }, { status: 400 });
    }
    
    // Create the full rule object to store in Xano
    const ruleObject = {
      formId,
      siteId,
      name,
      logicType,
      conditions,
      actions,
      isActive,
      createdAt: Date.now()
    };
    
    // Save to Xano (using formId as numeric ID if available, otherwise 0)
    const numericFormId = parseInt(formId) || 0;
    const savedRule = await xanoRules.create(
      name,
      ruleObject, // This gets stringified in xano.ts
      numericFormId,
      userId // Use provided userId or default to 1
    );
    
    console.log('Saved new rule to Xano:', savedRule.id, savedRule.rule_name);
    
    return NextResponse.json({
      success: true,
      rule: {
        id: String(savedRule.id),
        ...ruleObject
      },
      message: `Rule "${name}" saved successfully`
    });
    
  } catch (error) {
    console.error("Error saving rule:", error);
    return NextResponse.json(
      { error: "Failed to save rule", details: String(error) }, 
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Get all rules from Xano
    const xanoData = await xanoRules.getAll();
    
    // Parse the JSON data from each rule
    const rules = xanoData.map(r => {
      try {
        const ruleData = JSON.parse(r.rule_data);
        return {
          id: String(r.id),
          ...ruleData,
          xanoId: r.id,
          createdAt: r.created_at
        };
      } catch (e) {
        console.error('Failed to parse rule:', r.id, e);
        return null;
      }
    }).filter(Boolean);

    // Apply filters if provided
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');
    const formId = searchParams.get('formId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let filteredRules = rules;

    if (formId) {
      filteredRules = filteredRules.filter(r => r.formId === formId);
    } else if (siteId) {
      filteredRules = filteredRules.filter(r => r.siteId === siteId);
    }

    if (activeOnly) {
      filteredRules = filteredRules.filter(r => r.isActive !== false);
    }

    return NextResponse.json({
      success: true,
      rules: filteredRules,
      count: filteredRules.length
    });
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules", details: String(error) },
      { status: 500 }
    );
  }
}

