# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Roolify** is a Webflow form automation SaaS application that enables dynamic conditional logic, email notifications, and form submission tracking for Webflow sites. The app consists of:
- **Next.js Dashboard** (`nextjs-app/`) - Main web application for users to manage forms and rules
- **Webflow Extension** (`webflow-extension/`) - Designer extension for Webflow integration
- **Vite App** (`vite-app/`) - Alternative frontend implementation (legacy/experimental)

## Development Commands

### Next.js App (Primary)
```bash
cd nextjs-app

# Development (runs on port 1337)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Webflow Extension
```bash
cd webflow-extension
npm run dev
npm run build
```

## Architecture Overview

### Data Flow
The application follows a dynamic, multi-user architecture with NO hardcoded site-specific values:

```
Webflow Site → OAuth → Next.js App → Xano Database
     ↓
Form Submissions → Webhook → Xano Storage
     ↓
Rules Engine → Universal Script → Client-Side Execution
```

### Key Architectural Principles

1. **100% Dynamic Site Detection** - No hardcoded URLs, site IDs, or form names
   - Site URLs constructed from Webflow API's `shortName` field
   - Pages discovered via Webflow Pages API or HTML scanning
   - Forms detected by scanning actual HTML structure

2. **Multi-User Support** - Every user has isolated data
   - Xano handles user authentication and data isolation
   - All database records include `user_id` for row-level security
   - No shared state between users

3. **Universal Script Architecture**
   - Self-contained JavaScript bundle served per site
   - Rules embedded in script at generation time (no external API calls)
   - Flexible field matching (ID, name, normalized variations)
   - Smart OR/AND logic for multiple conditions

### Backend Integration

#### Xano API (`lib/xano.ts`)
All backend data operations use Xano's REST APIs:

- **Auth API** - User authentication, signup, password reset
- **Forms API** - Form metadata and field definitions
- **Rules API** - Conditional logic rule storage (JSON in `rule_data` column)
- **Submissions API** - Form submission data storage
- **Notifications API** - Email routing configuration
- **Sites API** - Webflow OAuth token storage and site metadata
- **Plans API** - User subscription tiers and limits

Auth tokens are stored in `localStorage` as `xano_auth_token` and sent as `Bearer` tokens.

#### File-Based Storage (Deprecated)
Some legacy endpoints still use JSON file storage:
- `rules.json` - Being migrated to Xano
- `activity.json` - Legacy activity tracking

**Important**: When modifying rules or forms, prefer Xano API (`lib/xano.ts`) over file-based stores.

### Frontend Architecture

#### Authentication (`lib/auth.tsx`)
- `AuthProvider` context provides user state globally
- `useAuth()` hook for accessing current user
- Replaced Memberstack with Xano auth (see `.cursorrules`)

#### Protected Routes (`components/ProtectedRoute.tsx`)
Wraps pages requiring authentication. Redirects to `/login` if not authenticated.

#### State Management
Each data type has its own store module:
- `lib/formsStore.ts` - Form data operations
- `lib/rulesStore.ts` - Rule CRUD operations
- `lib/webflowStore.ts` - Webflow API integration
- `lib/notificationsStore.ts` - Email notification settings
- `lib/designStore.ts` - Webflow Designer Extension state
- `lib/activityStore.ts` - Activity logging

### API Routes Structure

```
nextjs-app/app/api/
├── auth/
│   ├── callback/route.ts       # Webflow OAuth callback
│   ├── install/route.ts        # App installation flow
│   └── test/route.ts           # Auth testing endpoint
├── forms/
│   ├── collect/route.ts        # Client-side form scanner webhook
│   ├── sync-to-xano/route.ts   # Sync forms to Xano database
│   └── [siteId]/route.ts       # Get forms for specific site
├── rules/
│   ├── route.ts                # CRUD for rules (uses Xano)
│   └── [ruleId]/route.ts       # Single rule operations
├── script/
│   └── serve/[siteId]/route.ts # Universal script generation ⭐
├── submissions/
│   ├── webhook/route.ts        # Form submission capture
│   └── script/[siteId]/route.ts # Submission tracker script
├── notifications/
│   └── [formId]/route.ts       # Email routing config
└── webflow/
    ├── sites/route.ts          # List Webflow sites
    └── site/[siteId]/
        ├── forms/route.ts      # Get forms from Webflow API
        ├── pages/route.ts      # Get pages from Webflow API
        └── elements/route.ts   # Scan page elements
```

## Critical Implementation Details

### Universal Script Generation (`app/api/script/serve/[siteId]/route.ts`)

This endpoint generates a self-contained JavaScript bundle that:
1. Embeds all active rules for a site directly in the script
2. Provides flexible field matching (by ID, name, normalized variations)
3. Implements smart OR/AND condition logic:
   - Multiple conditions on SAME field = OR (any can match)
   - Conditions on DIFFERENT fields = AND (all must match)
4. Handles index-based matching for multi-condition rules
5. Hides/shows elements based on rule execution

**Key considerations when modifying:**
- Script must be self-contained (no external API calls at runtime)
- Maintains CSP compatibility
- Caches for 5 minutes (`Cache-Control: max-age=300`)
- Must work in both Webflow Designer and published sites

### Form Detection and Syncing

Forms are discovered through multiple strategies (in priority order):

1. **Webflow Forms API** - Official API (requires `forms:read` scope)
2. **HTML Scanning** - Parses published site HTML to find `<form>` tags
3. **Client-Side Collection** - JavaScript embedded in site scans DOM

**Element-to-Form Association Logic:**
```typescript
// 1. Direct formId match (best)
element.formId === form.htmlId

// 2. Normalized partial match (good)
normalize(element.formId) includes normalize(form.name)

// 3. Fuzzy keyword match (fallback)
extractKeywords(form.name).some(keyword =>
  element.name.includes(keyword)
)
```

### Email Notifications (`app/api/notifications/[formId]/route.ts`)

⚠️ **IMPORTANT ARCHITECTURE CHANGE (Option B - Implemented)**:
Notification settings are now stored using `site_id + html_form_id` instead of a foreign key to the `form` table. This **decouples notification settings from form records** and prevents duplicate form creation.

**New Database Schema** (`notification_setting` table):
- `site_id` (text, required) - Webflow site ID
- `html_form_id` (text, required) - Webflow form HTML ID
- `user_id` (number, FK to user table)
- Unique index on `(site_id, html_form_id, user_id)`

**Key Benefits**:
- ✅ Notification settings work even if form not synced to Xano
- ✅ No duplicate form records created when saving settings
- ✅ Settings persist independently of form table
- ✅ Simpler, more robust architecture

Conditional routing for admin and user notification emails:

```typescript
{
  admin_routes: [
    { fieldId: 'Country', operator: 'equals', value: 'USA', email: 'usa@example.com' },
    { fieldId: 'Country', operator: 'equals', value: 'UK', email: 'uk@example.com' }
  ],
  user_routes: [
    { fieldId: 'Email', operator: 'is_not_empty', value: '', sendTo: 'form_field' }
  ],
  admin_fallback_email: 'default@example.com',
  custom_value: 'fieldId', // Field containing dynamic value
  email_template: '<html>{{field_name}}: {{field_value}}</html>'
}
```

### Webflow OAuth Flow

1. User clicks "Connect Webflow" → redirects to Webflow OAuth
2. Webflow redirects back to `/api/auth/callback?code=...`
3. Exchange code for tokens via Webflow API
4. Store tokens in Xano `site` table
5. Sync site metadata and forms to Xano

**Token Storage in Xano:**
```typescript
{
  webflow_site_id: string,
  webflow_access_token: string,
  webflow_refresh_token: string,
  token_expires_at: number,
  user_id: number
}
```

## Xano Database Schema

### Key Tables

**form** - Form metadata from Webflow
```
id, created_at, name, user_id, html_form_id, site_id,
page_url, form_fields (JSON), updated_at
```

**logic_rule** - Conditional logic rules
```
id, created_at, rule_name, rule_data (JSON),
form_id, user_id
```

**notification_setting** - Email routing configuration
```
id, created_at, form (FK), user (FK), admin_routes (JSON),
user_routes (JSON), admin_fallback_email, user_fallback_email,
custom_value, email_template, admin_subject, user_subject
```

**submission** - Form submission data
```
id, created_at, submission_data (JSON), form_id, user_id
```

**site** - Webflow OAuth tokens and site metadata
```
id, created_at, webflow_site_id, site_name, user_id,
webflow_access_token, webflow_refresh_token,
token_expires_at, installed_at, is_active
```

**user** - User accounts (managed by Xano Auth)
```
id, created_at, name, email, plan_id
```

**plan** - Subscription tiers
```
id, created_at, plan_name, max_sites, max_submissions,
max_logic_rules, price
```

## Key Files Reference

### Core Application Files
- `nextjs-app/app/layout.tsx` - Root layout with `AuthProvider`
- `nextjs-app/lib/auth.tsx` - Authentication context and hooks
- `nextjs-app/lib/xano.ts` - Xano API client (primary data layer)
- `nextjs-app/components/ProtectedRoute.tsx` - Auth guard component
- `nextjs-app/app/api/script/serve/[siteId]/route.ts` - Universal script generation

### Important Documentation
- `DYNAMIC_ARCHITECTURE.md` - Explains no-hardcoding architecture
- `SETUP_GUIDE.md` - Form collection setup instructions
- `XANO_INTEGRATION.md` - Xano migration guide
- `FORM_SUBMISSIONS.md` - Submission capture system docs
- `.cursorrules` - Memberstack SDK reference (legacy, now uses Xano)

## Common Patterns

### Adding a New API Endpoint

```typescript
// app/api/your-endpoint/route.ts
import { NextResponse } from 'next/server';
import { xanoYourResource } from '@/lib/xano';

export async function GET(request: Request) {
  try {
    const data = await xanoYourResource.getAll();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Creating a Protected Page

```tsx
// app/your-page/page.tsx
'use client';
import { useAuth } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function YourPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div>Hello {user?.name}</div>
    </ProtectedRoute>
  );
}
```

### Accessing Xano API

```typescript
import { xanoForms, xanoRules } from '@/lib/xano';

// Get all forms for current user
const forms = await xanoForms.getAll();

// Create a new rule
const rule = await xanoRules.create(
  'My Rule',
  { conditions: [...], actions: [...] },
  formId,
  userId
);
```

## Important Constraints

1. **Never hardcode site URLs, form names, or page slugs** - Always fetch from Webflow API or scan dynamically
2. **Always check user authentication** - Use `useAuth()` or `ProtectedRoute`
3. **Use Xano API for data operations** - Avoid direct file system access
4. **Universal script must be self-contained** - No runtime API calls allowed
5. **Normalize field IDs when matching** - Remove spaces, hyphens, handle case variations
6. **Test with multiple sites** - Architecture must support any Webflow site

## Testing Notes

- Development server runs on port **1337** (not default 3000)
- Xano Auth tokens persist in browser `localStorage`
- Universal script is cached for 5 minutes - clear cache when testing rule changes
- Use `/api/debug/*` endpoints for troubleshooting (not production endpoints)

## Migration Status

✅ **Completed:**
- Xano authentication replacing Memberstack
- Form syncing to Xano database
- Rules stored in Xano `logic_rule` table
- OAuth token management in Xano
- Submission tracking

⏳ **In Progress:**
- Complete migration from file-based storage
- Plan enforcement on all CRUD operations
- Email notification system via SendGrid/Xano
