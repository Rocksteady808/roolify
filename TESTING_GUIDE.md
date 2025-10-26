# Testing Guide for Dynamic Options

This guide will help you verify that the hybrid approach for getting select field options is working correctly.

## What We've Implemented

1. **Hybrid Approach**: Now scans HTML pages in parallel with API calls to get select options
2. **Better Field Matching**: Tries direct ID/name matching first before fuzzy matching
3. **Improved Logging**: Detailed logs at every step
4. **Test Endpoint**: New endpoint to verify functionality

## Testing Steps

### 1. Wait for Deployment

After the changes are pushed, wait for Netlify to deploy (usually 2-3 minutes).

### 2. Test the Dynamic Options Endpoint

Visit this URL in your browser (replace `YOUR_NETLIFY_URL` and `YOUR_SITE_ID`):

```
https://YOUR_NETLIFY_URL.netlify.app/api/forms/dynamic-options?siteId=YOUR_SITE_ID
```

**What to check:**
- Response should include `forms` array
- Each form should have a `fields` array
- Select fields should have an `options` array with values
- Look for the "HBI Account Rep" field specifically

### 3. Use the Test Endpoint

Visit this URL:

```
https://YOUR_NETLIFY_URL.netlify.app/api/test/dynamic-options?siteId=YOUR_SITE_ID
```

**This will return:**
- Total forms found
- Total fields found
- Select fields with/without options
- Specifically checks for "HBI Account Rep" field
- Lists all select fields and whether they have options

**Expected output:**
```json
{
  "success": true,
  "analysis": {
    "hbiFieldFound": true,
    "hbiFieldOptions": ["Aaron", "Brad", "Jessica"],
    "selectFields": 3,
    "fieldsWithOptions": 3
  }
}
```

### 4. Check Netlify Function Logs

1. Go to Netlify Dashboard → Your Site → Functions
2. Click "View logs"
3. Look for `[Dynamic Options]` log messages
4. Should see:
   - `✅ Found X select elements from HTML scanning`
   - `✅ DIRECT ID MATCH found for HBI Account Rep`
   - `✅ Options found: ["Aaron", "Brad", "Jessica"]`

### 5. Test in the Rule Builder

1. Go to your Roolify app
2. Navigate to Rule Builder
3. Select a form
4. Look for "HBI Account Rep" field in the dropdown
5. Click on it - it should show all options

**If options don't show:**
- Check browser console for errors
- Verify the site ID is correct
- Check that the published site has the form with options
- Review Netlify logs for any failures

## Troubleshooting

### No Options Found

**Possible causes:**
1. Published site doesn't have the form yet
2. Site URL is incorrect
3. HTML scanning failed

**Solutions:**
- Publish your Webflow site
- Verify the site URL in Netlify logs
- Check that the page is publicly accessible

### Field Found But No Options

**Possible causes:**
1. Field matching failed
2. HTML scraping didn't find the select element
3. ID mismatch between API and HTML

**Solutions:**
- Check Netlify logs for "No match found" messages
- Verify the select element has an ID in the HTML
- Check that the field name matches between API and HTML

### Options Found But Not Showing in UI

**Possible causes:**
1. Rule builder not calling the right endpoint
2. Caching issue
3. Frontend parsing error

**Solutions:**
- Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
- Check browser console for errors
- Verify the API response structure matches what the UI expects

## Success Criteria

✅ Test endpoint shows `hbiFieldFound: true`
✅ Test endpoint shows `hbiFieldOptions` with array of values
✅ Rule builder shows options when you click on select fields
✅ Netlify logs show successful field matching
✅ No errors in browser console

## Next Steps

Once testing passes, verify that:
1. All select fields across all forms show their options
2. Rule builder allows you to select values for conditions
3. Rules execute correctly with the selected values
4. Notifications page also shows options for select fields

## Support

If issues persist, share:
1. Netlify Function logs (especially `[Dynamic Options]` messages)
2. Browser console errors
3. Response from `/api/test/dynamic-options` endpoint
4. Your site ID
