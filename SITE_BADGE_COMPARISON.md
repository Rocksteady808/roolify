# Site Display Comparison - Main App vs Designer Extension

## Visual Design

### In Main App (Browser)
```
┌─────────────────────────────────────┐
│  [Refresh]  [F] Flow Forms Testing ▼│  ← Clickable dropdown
└─────────────────────────────────────┘
```
- Shows circle avatar with "F" (first letter)
- Shows full site name "Flow Forms Testing"
- Has dropdown arrow (▼)
- Clickable - opens dropdown menu with all sites
- Can switch between sites

### In Designer Extension (Iframe)
```
┌─────────────────────────────────────┐
│  [Refresh]  [F] Flow Forms Testing  │  ← Non-interactive badge
└─────────────────────────────────────┘
```
- Shows circle avatar with "F" (first letter)
- Shows full site name "Flow Forms Testing"
- **NO dropdown arrow**
- Non-clickable - just displays current site
- Site is auto-detected from Designer context

## The Only Difference

**Main App:**
```jsx
<SiteSelector onSiteChange={handleSiteChange} />
// Has dropdown arrow + click functionality
```

**Extension:**
```jsx
<div className="flex items-center gap-2 text-sm font-medium text-gray-700">
  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
    F
  </div>
  <span className="max-w-[150px] truncate">
    Flow Forms Testing
  </span>
</div>
// No dropdown arrow, no click functionality
```

## Why This Design?

1. **Visual Consistency**: Looks almost identical to the main app
2. **Clear Intent**: Missing dropdown arrow indicates it's not clickable
3. **Context-Aware**: Extension knows which site you're in
4. **Clean**: No unnecessary UI elements in narrow extension panel
5. **Familiar**: Uses same styling system as main app

## User Experience

### Opening Extension in Designer
1. User is editing "Flow Forms Testing" in Designer
2. Opens Roolify extension
3. Sees: `[F] Flow Forms Testing` (no arrow)
4. Knows: Currently viewing this site
5. All data (forms, rules, etc.) automatically filtered to this site

### Using Main App in Browser
1. User opens Roolify in browser
2. Sees: `[F] Flow Forms Testing ▼` (with arrow)
3. Can click to see all connected sites
4. Can switch between sites
5. Regular multi-site workflow

## Implementation

- Extension calls `webflow.getSiteInfo()` to get current site
- Sends site name to iframe via postMessage
- Dashboard conditionally renders:
  - Badge (if in iframe with site detected)
  - Dropdown (if in main app)
- Perfect seamless integration

## Result

The extension feels native and context-aware while maintaining perfect visual consistency with the main app. Users immediately understand they're viewing the current Designer site.





