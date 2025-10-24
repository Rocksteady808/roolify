# Dynamic Configuration Audit

This document verifies that the Roolify application is fully dynamic with no hardcoded values.

## ✅ Fully Dynamic Components

### 1. **Site ID**
- **Source**: Route parameter `/api/script/unified/[siteId]`
- **Usage**: Injected into script, used to filter rules
- **Status**: ✅ Dynamic

### 2. **Rules Configuration**
- **Source**: Database (`rules.json` loaded via API)
- **API Endpoint**: `/api/rules?siteId={siteId}&activeOnly=true`
- **Updated**: Real-time via API calls
- **Status**: ✅ Fully dynamic - no hardcoded rules

### 3. **Form IDs and Field IDs**
- **Source**: Rules database (from Webflow API scan)
- **Storage**: Stored in each rule's `conditions` and `actions`
- **Status**: ✅ Dynamic per form

### 4. **API URLs**
- **Webhook URL**: `${appUrl}/api/submissions/webhook`
  - Uses `NEXT_PUBLIC_APP_URL` or `request.nextUrl.origin`
- **Rules API**: `${appUrl}/api/rules`
- **Status**: ✅ Dynamic via environment variables

### 5. **Condition Operators**
- **Source**: Defined in rules
- **Supported**: `==`, `!=`, `contains`, `not_contains`, etc.
- **Status**: ✅ Dynamic per rule

### 6. **Action Types**
- **Source**: Defined in rules
- **Supported**: `show`, `hide`, `enable`, `disable`, `require`, `make_optional`
- **Status**: ✅ Dynamic per rule

### 7. **Logic Type (AND/OR)**
- **Source**: Rule configuration (`rule.logicType`)
- **Default**: `AND` (for backward compatibility)
- **Status**: ✅ Dynamic per rule

### 8. **Form Data**
- **Source**: Scanned from Webflow pages via API
- **API Endpoint**: `/api/forms/form-specific?siteId={siteId}`
- **Status**: ✅ Fully dynamic - scanned on demand

### 9. **Webflow Tokens**
- **Storage**: `webflow-tokens.json` (managed via UI)
- **Usage**: Retrieved via `getTokenForSite(siteId)`
- **Status**: ✅ Dynamic per site

### 10. **User Authentication**
- **Backend**: Xano API (no hardcoded credentials)
- **URLs**: Environment variables
- **Status**: ✅ Fully dynamic

## 🔧 Environment Variables Required

Create a `.env.local` file with these variables:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:1337  # Change for production

# Xano Configuration (Backend API)
NEXT_PUBLIC_XANO_AUTH_BASE_URL=https://your-workspace.xano.io/api:auth
NEXT_PUBLIC_XANO_API_BASE_URL=https://your-workspace.xano.io/api:main
```

## 📊 Current Configuration (Example)

### Site: `68bc42f58e22a62ce5c282e0`
- **Active Rules**: 10
- **Forms**: 4 (HBI International, Question Form, State Form, Country Form)
- **Script URL**: `http://localhost:1337/api/script/unified/68bc42f58e22a62ce5c282e0`

### Rules Breakdown:
1. **State Form - Show California** (1 condition → 1 action)
2. **State Form - Show New York** (1 condition → 1 action)
3. **State Form - Show Texas** (1 condition → 1 action)
4. **State Form - Show Florida** (1 condition → 1 action)
5. **Country Form - Show United States** (1 condition → 1 action)
6. **Country Form - Show United Kingdom** (1 condition → 1 action)
7. **Country Form - Show Japan** (1 condition → 1 action)
8. **Country Form - Show Ireland** (1 condition → 1 action)
9. **Country Form - Show Oman** (1 condition → 1 action)
10. **HBI Form - Show Account Fields** (1 condition → 2 actions)

## 🚀 How Dynamic Loading Works

### Script Generation Flow:
1. User requests: `GET /api/script/unified/{siteId}`
2. Server fetches rules: `GET /api/rules?siteId={siteId}&activeOnly=true`
3. Server injects rules into JavaScript template
4. Client-side script executes rules dynamically
5. Form changes trigger real-time rule evaluation

### Form Scanning Flow:
1. User requests: `GET /api/forms/form-specific?siteId={siteId}`
2. Server fetches page HTML from Webflow
3. Server parses HTML to extract forms and fields
4. Server merges with Webflow API metadata
5. Client receives complete form structure

### Rule Execution Flow:
1. Page loads → Script initializes
2. Script reads `CONFIG.rules` (injected at generation time)
3. User interacts with form field
4. Event listener triggers `executeAllRules()`
5. Each rule evaluates its conditions
6. Actions execute based on condition results
7. UI updates in real-time

## ✅ Verification Commands

### Check Active Rules for Site:
```bash
curl "http://localhost:1337/api/rules?siteId=68bc42f58e22a62ce5c282e0&activeOnly=true" | jq '.count'
# Should return: 10
```

### Check Script Contains All Rules:
```bash
curl "http://localhost:1337/api/script/unified/68bc42f58e22a62ce5c282e0" | grep "Rules:"
# Should show: "Rules: 10 active"
```

### Check Forms Detected:
```bash
curl "http://localhost:1337/api/forms/form-specific?siteId=68bc42f58e22a62ce5c282e0" | jq '.forms | length'
# Should return: 4
```

## 🎯 No Hardcoded Values

- ❌ No hardcoded site IDs
- ❌ No hardcoded form IDs
- ❌ No hardcoded field IDs
- ❌ No hardcoded condition values
- ❌ No hardcoded API URLs (all use env vars)
- ❌ No hardcoded rules in JavaScript
- ✅ Everything is database-driven and configuration-driven

## 📝 Adding New Sites

To add a new site:

1. **Connect Webflow account** (via `/setup`)
2. **Site is automatically detected** (no hardcoding needed)
3. **Scan forms** (via API - automatic)
4. **Create rules** (via UI - stored in database)
5. **Add script to site** (copy generated URL)

No code changes required! 🎉

---

**Last Updated**: 2025-10-12  
**Script Version**: Unified (Conditional Logic + Form Submissions)  
**Dynamic Configuration**: 100%








