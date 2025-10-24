# Designer Extension - Auto Site Detection

## Overview
The Webflow Designer Extension now automatically detects which site the designer is currently viewing and displays only that site's data. The site dropdown is replaced with a non-interactive badge showing the current site name.

## Implementation

### 1. Extension Side (`webflow-extension/src/index.ts`)

**New Function: `fetchAndSendCurrentSiteInfo()`**
- Uses Webflow Designer API (`webflow.getSiteInfo()`) to get current site
- Sends site info to iframe via postMessage with type `CURRENT_SITE_INFO`
- Called on extension load and after iframe loads
- Includes fallback handling if API call fails

**Message Handling**
- Extension listens for `ROOLIFY_REQUEST_SITE_INFO` from iframe
- Responds by fetching and sending current site info

### 2. Dashboard Side (`nextjs-app/app/dashboard/page.tsx`)

**New State Variables**
```typescript
const [designerSiteId, setDesignerSiteId] = useState<string>('');
const [designerSiteName, setDesignerSiteName] = useState<string>('');
```

**PostMessage Listener**
- Listens for `CURRENT_SITE_INFO` messages from extension
- Auto-selects the detected site
- Stores site ID in localStorage for persistence
- Requests site info on load using `ROOLIFY_REQUEST_SITE_INFO`

**Conditional Rendering**
- **In iframe mode WITH site info**: Shows badge with site name
- **Not in iframe**: Shows regular `<SiteSelector>` dropdown
- **In iframe WITHOUT site info yet**: Shows nothing (waiting for detection)

## Site Badge Design

```jsx
<div className="flex items-center gap-2 text-sm font-medium text-gray-700">
  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
    {designerSiteName[0]?.toUpperCase() || 'S'}
  </div>
  <span className="max-w-[150px] truncate" title={designerSiteName}>
    {designerSiteName}
  </span>
</div>
```

**Badge Features**
- Identical styling to regular SiteSelector button
- Circle avatar with first letter of site name
- Site name truncates at 150px with full name in tooltip
- No dropdown arrow (that's the only difference)
- Non-interactive (no clicking/dropdown)
- Seamless visual continuity between main app and extension

## User Experience

### In Webflow Designer Extension
1. User opens extension in Webflow Designer
2. Extension automatically detects current site
3. Badge displays: "Viewing: [Site Name]"
4. All data automatically filtered to that site
5. No manual selection needed

### In Main App (Browser)
1. User navigates to dashboard
2. Regular site dropdown displays
3. User selects site manually
4. Works exactly as before

## Benefits

1. **Context-Aware**: Extension knows which site user is working on
2. **Fewer Clicks**: No need to manually select site
3. **Cleaner UI**: No dropdown cluttering narrow extension panel
4. **Safer**: Can't accidentally view wrong site's data
5. **Automatic**: Works seamlessly without user interaction
6. **Backward Compatible**: Main app unchanged

## Technical Details

### Message Flow
```
Extension Load
  ↓
webflow.getSiteInfo()
  ↓
postMessage('CURRENT_SITE_INFO', { siteId, siteName })
  ↓
Dashboard receives message
  ↓
Auto-selects site
  ↓
Fetches forms/rules for that site
```

### Fallback Handling
- If `webflow.getSiteInfo()` fails, error is logged
- User would need to manually connect site in main app
- Extension continues to function normally

### Security
- postMessage origin checked (`localhost:1337` and `localhost:3000`)
- Only accepts `CURRENT_SITE_INFO` messages from trusted sources
- Site ID validation before making API calls

## Testing Checklist

- [x] Extension detects site info on load
- [ ] Badge displays correctly in extension
- [ ] Badge shows correct site name
- [ ] All data filtered to current site
- [ ] Dropdown still works in main app
- [ ] Site selection persists in localStorage
- [ ] Refresh button still works
- [ ] Navigation between pages maintains site selection
- [ ] Error handling if site detection fails

## Next Steps

To apply this pattern to other pages:
1. Copy the postMessage listener from dashboard
2. Add `designerSiteId` and `designerSiteName` state
3. Replace site selector with badge (same JSX)
4. Ensure data fetching uses `designerSiteId` when in iframe

**Pages to update:**
- Rule Builder (`/rule-builder`)
- Notifications (`/notifications`)
- Submissions (`/submissions`)
- Setup (`/setup`)

## Code Locations

- Extension: `webflow-extension/src/index.ts` (lines 317-349, 382-385)
- Dashboard: `nextjs-app/app/dashboard/page.tsx` (lines 41-42, 74-110, 761-797)

