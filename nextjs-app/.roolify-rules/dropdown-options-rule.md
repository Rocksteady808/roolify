# 🌐 Global Rule: Dropdown Select Options

## Problem
Webflow's API **does not include the `options` field** for Select/Dropdown fields. The API only returns:
- `displayName`
- `type` 
- `placeholder`
- `userVisible`

**No options data is provided by Webflow's API.**

## Solution Strategy

Since Webflow's API doesn't provide select field options, we must use alternative methods:

### ✅ Approved Methods (Following Global Rule)

1. **Site Scanning** - Scan the published site HTML to extract options
2. **Xano Storage** - Store user-configured options in Xano database
3. **Webflow Designer Extension** - Capture options when user configures them in Webflow Designer

### ❌ Forbidden Methods (Violates Global Rule)

1. **Hardcoded/Mock Data** - Never hardcode options for specific sites
2. **Sample Data** - Never generate sample/fake options
3. **Guessing** - Never guess what the options might be

## Implementation Plan

For now, **select fields will have empty options arrays** until we implement one of the approved methods.

This is acceptable because:
- It doesn't violate the global rule (no mock data)
- It doesn't break functionality (forms still work)
- Users can still create rules (just can't see dropdown options in UI)

## Future Implementation

Priority order:
1. **Site Scanning** - Implement robust HTML scanning to extract options from published sites
2. **Xano Storage** - Allow users to configure options in our UI and store in Xano
3. **Designer Extension** - Capture options from Webflow Designer in real-time

## Global Rule Reference

**"Always reference Webflow API or Xano MCP instead of guessing or hardcoding values."**

Since Webflow API doesn't provide select options, we accept empty arrays until we implement proper site scanning or Xano storage.

