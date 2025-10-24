# Webflow Form Submissions Integration

## Overview

Your Roolify app now fetches form submissions from **two sources**:

1. **Xano Captured Submissions** - Submissions captured by your client-side script and stored in Xano
2. **Webflow API Submissions** - Submissions retrieved directly from Webflow's API

## Features

### 📊 Dual Data Sources

- **Xano Captured**: Submissions that were captured by the Roolify form capture script running on your Webflow site
- **Webflow API**: Native submissions that Webflow stores (retrieved via the Webflow Data API)

### 🔄 Data Source Toggle

The submissions page includes a dropdown to filter by source:
- **All Sources** (default) - Shows submissions from both Xano and Webflow
- **Xano Captured** - Only shows submissions captured by your script  
- **Webflow API** - Only shows submissions from Webflow's API

### 🏷️ Source Badges

Each submission is tagged with a color-coded badge:
- 🟣 **Purple Badge** - Webflow API submission
- 🔵 **Blue Badge** - Xano Captured submission

## API Endpoints

### GET `/api/webflow/submissions/[siteId]`

Fetches form submissions from Webflow's API for a specific site.

**Query Parameters:**
- `formElementId` (optional) - Filter by specific form element ID
- `limit` (optional) - Number of submissions to return (default: 100)
- `offset` (optional) - Pagination offset

**Example:**
```bash
GET /api/webflow/submissions/68bc42f58e22a62ce5c282e0
GET /api/webflow/submissions/68bc42f58e22a62ce5c282e0?formElementId=my-form-id&limit=50
```

**Response:**
```json
{
  "success": true,
  "submissions": [
    {
      "id": "submission_id",
      "formId": "form_id",
      "formElementId": "form_element_id",
      "formName": "Contact Form",
      "siteId": "site_id",
      "data": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "submittedAt": "2025-10-12T10:00:00.000Z",
      "created_at": 1634035200000,
      "source": "webflow_api"
    }
  ],
  "count": 1,
  "pagination": {
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

## How It Works

### 1. Site Selection

When you select a site from the dropdown, the app:
1. Loads all forms for that site
2. Fetches submissions from both sources (if "All Sources" is selected)
3. Merges and sorts submissions by date (most recent first)

### 2. Data Fetching

The `loadSubmissions()` function:
```typescript
// Fetches from Xano if dataSource is 'all' or 'xano'
const xanoSubmissions = await fetch('/api/submissions');

// Fetches from Webflow API if dataSource is 'all' or 'webflow'
const webflowSubmissions = await fetch(`/api/webflow/submissions/${siteId}`);

// Merges both arrays and sorts by created_at
```

### 3. Display

Submissions are displayed in a table with:
- Submission ID
- Form name
- **Source badge** (Xano or Webflow)
- Submit date & time ago
- Data preview
- View Details button

## Webflow API Details

### Required Scope

The Webflow API requires the `forms:read` scope to access form submissions.

### Available Endpoints

1. **List Form Submissions by Site**
   - `GET https://api.webflow.com/v2/sites/{site_id}/form_submissions`
   - Best for getting all submissions across a site
   - Works with forms in components (shares same `formElementId`)

2. **List Form Submissions by Form**
   - `GET https://api.webflow.com/v2/forms/{form_id}/submissions`
   - Gets submissions for a specific form instance

3. **Get Single Form Submission**
   - `GET https://api.webflow.com/v2/form_submissions/{form_submission_id}`
   - Gets details for a specific submission

### Authentication

The integration uses your stored Webflow API token:
```typescript
const token = await getWebflowToken(siteId);
headers: {
  'Authorization': `Bearer ${token}`,
  'accept': 'application/json'
}
```

## Benefits

### Why Two Sources?

1. **Xano Captured Submissions**
   - ✅ Custom data structure
   - ✅ Additional metadata (page URL, title, etc.)
   - ✅ Control over data storage
   - ✅ Can process and transform data
   - ❌ Requires client-side script

2. **Webflow API Submissions**
   - ✅ Native Webflow data
   - ✅ No script required
   - ✅ Official API support
   - ✅ Includes form schema
   - ❌ Webflow's data structure only

### When to Use Which?

- **Xano Captured**: When you need custom processing, additional metadata, or specific storage requirements
- **Webflow API**: For accessing Webflow's native submissions, historical data, or when you can't add the capture script
- **Both (All Sources)**: For complete visibility into all form submissions across your site

## User Interface

### Submissions Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Form Submissions                                            │
│ View and manage all form submissions                        │
│                                                             │
│ [Site] [Form] [Source: 📊 All Sources] [Refresh]          │
├─────────────────────────────────────────────────────────────┤
│ Stats Cards:                                                │
│ • Form Submissions (filtered)                               │
│ • All Submissions (total)                                   │
│ • Last 24 Hours                                             │
├─────────────────────────────────────────────────────────────┤
│ Table:                                                      │
│ ID │ Form │ Source │ Submitted │ Preview │ Actions         │
│────┼──────┼────────┼───────────┼─────────┼─────────        │
│ #1 │ Form │ 🟣 WF  │ Oct 12    │ data... │ View Details    │
│ #2 │ Form │ 🔵 Xano│ Oct 11    │ data... │ View Details    │
└─────────────────────────────────────────────────────────────┘
```

### Source Filter Options

```typescript
<select value={dataSource} onChange={...}>
  <option value="all">📊 All Sources</option>
  <option value="xano">🔵 Xano Captured</option>
  <option value="webflow">🟣 Webflow API</option>
</select>
```

## Data Structure Comparison

### Xano Captured Submission
```json
{
  "id": 1,
  "form_id": 123,
  "user_id": 1,
  "submission_data": "{...}",
  "created_at": 1634035200000,
  "source": "xano_captured"
}
```

### Webflow API Submission
```json
{
  "id": "submission_id",
  "formId": "form_id",
  "formElementId": "element_id",
  "formName": "Contact Form",
  "siteId": "site_id",
  "data": {...},
  "submittedAt": "2025-10-12T10:00:00.000Z",
  "created_at": 1634035200000,
  "source": "webflow_api"
}
```

Both are normalized to work seamlessly in the UI.

## Implementation Files

### New Files Created
1. `nextjs-app/app/api/webflow/submissions/[siteId]/route.ts` - API endpoint for Webflow submissions
2. `nextjs-app/WEBFLOW_SUBMISSIONS_INTEGRATION.md` - This documentation

### Modified Files
1. `nextjs-app/app/submissions/page.tsx` - Updated to fetch from both sources

### Key Changes
- Added `dataSource` state toggle
- Modified `loadSubmissions()` to fetch from both APIs
- Added source badge display in table
- Added "Source" column to submissions table

## Testing

### 1. Test Xano Submissions

```bash
# Check if Xano submissions load
curl http://localhost:1337/api/submissions
```

### 2. Test Webflow API Submissions

```bash
# Replace with your actual site ID
curl http://localhost:1337/api/webflow/submissions/YOUR_SITE_ID
```

### 3. Test UI

1. Go to `http://localhost:1337/submissions`
2. Select a site from dropdown
3. Toggle between data sources:
   - All Sources
   - Xano Captured
   - Webflow API
4. Verify badges appear correctly
5. View details of each submission type

## Troubleshooting

### No Webflow Submissions Showing

**Issue**: Webflow API returns empty array

**Solutions**:
1. Verify Webflow API token is configured: Go to `/connect-webflow`
2. Check if forms have received submissions in Webflow dashboard
3. Ensure `forms:read` scope is enabled
4. Check browser console for API errors

### Duplicate Submissions

**Issue**: Same submission appears twice

**Explanation**: This is normal if a submission was:
1. Captured by your Roolify script (Xano)
2. Also stored by Webflow (Webflow API)

**Solution**: Use the source filter to view only one source, or implement deduplication logic based on submission data similarity.

### Authorization Errors

**Issue**: "No Webflow token found for this site"

**Solution**: 
1. Go to the Dashboard
2. Click "Connect Webflow Account"
3. Authorize your site
4. Return to Submissions page

## Future Enhancements

Potential improvements:
- [ ] Deduplication logic to identify same submission from both sources
- [ ] Sync button to copy Webflow submissions to Xano
- [ ] Export submissions as CSV/JSON
- [ ] Advanced filtering (date range, form fields, etc.)
- [ ] Bulk actions (delete, export selected)
- [ ] Submission detail modal with full field data
- [ ] Form-specific submission filtering by formElementId

## Related Documentation

- [Webflow Data API - Form Submissions](https://developers.webflow.com/data/reference/forms/form-submissions/list-submissions-by-site)
- [Form Submission Capture](./FORM_SUBMISSIONS.md)
- [Xano Integration](./XANO_INTEGRATION.md)

---

**Last Updated**: October 12, 2025  
**Version**: 1.0.0








