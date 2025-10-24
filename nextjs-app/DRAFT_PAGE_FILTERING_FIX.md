# Draft Page Filtering - Issue & Fix

## Problem

Forms on **draft/unpublished pages** are still showing up in the app, even though filtering is implemented.

## Root Cause

The filtering logic is only checking for **archived** pages, but NOT checking if pages are **published**.

### Current Code (Lines 285-292 in dashboard/page.tsx):

```typescript
pages.forEach((page: any) => {
  // Pages with archived: true should be excluded
  if (!page.archived) {  // ❌ ONLY checks archived, NOT published
    publishedPageIds.add(page.id);
  } else {
    archivedPageSlugs.add(page.slug || page.title);
  }
});
```

## Webflow API Fields

According to Webflow's Pages API v2, pages have these status fields:

- **`archived`** (boolean) - Page is archived (in trash)
- **`isDraft`** (boolean) - Page is in draft mode
- **`isPublished`** (boolean) - Page is published and live

### Page States:
1. **Published & Live**: `archived: false, isDraft: false, isPublished: true`
2. **Draft (not published)**: `archived: false, isDraft: true, isPublished: false`
3. **Archived**: `archived: true, isDraft: false, isPublished: false`

## The Fix

We need to check **BOTH** `archived` and `isDraft` (or use `isPublished`):

### Option 1: Check `isPublished` (Recommended)
```typescript
pages.forEach((page: any) => {
  // Only include pages that are published and NOT archived
  if (page.isPublished && !page.archived) {  // ✅ Checks published status
    publishedPageIds.add(page.id);
  }
});
```

### Option 2: Check `isDraft` and `archived`
```typescript
pages.forEach((page: any) => {
  // Exclude draft pages and archived pages
  if (!page.isDraft && !page.archived) {  // ✅ Checks draft status
    publishedPageIds.add(page.id);
  }
});
```

## Files That Need Fixing

All files with the same filtering logic:

1. ✅ **`app/dashboard/page.tsx`** (line ~285-292)
2. ✅ **`app/rule-builder/page.tsx`** (similar logic)
3. ✅ **`app/notifications/page.tsx`** (similar logic)
4. ✅ **`app/submissions/page.tsx`** (similar logic)
5. ✅ **`app/api/forms/with-real-options/route.ts`** (similar logic)

## Expected Behavior After Fix

### ✅ **Should Show:**
- Forms on **published, non-archived pages**

### ❌ **Should NOT Show:**
- Forms on **draft/unpublished pages** 
- Forms on **archived pages**
- Forms in **"Utility Pages" folder**

## Testing

After fix, check:
1. Form on a published page → **Should show** ✅
2. Form on a draft page → **Should NOT show** ❌
3. Form on an archived page → **Should NOT show** ❌
4. Unpublish a page in Webflow → Form **should disappear** ❌
5. Publish a page in Webflow → Form **should appear** ✅

---

**Status:** 🔴 Bug identified, fix needed



