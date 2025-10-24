#!/bin/bash

echo "🧪 Testing Custom HTML Template Feature"
echo "========================================"
echo ""

# Test 1: Submit a form and check if custom template is used
echo "📧 Test 1: Submitting test form with custom template..."
echo ""

curl -s -X POST "http://localhost:1337/api/submissions/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "Full Name": "Template Test User",
    "Email": "test@example.com",
    "Privacy Policy": "on",
    "Terms Of Service": "on",
    "formId": "wf-form-HBI-International-Inquiry-Form---HBI-International",
    "formName": "HBI International Inquiry Form - HBI International",
    "siteId": "68bc42f58e22a62ce5c282e0",
    "pageUrl": "https://example.com/test",
    "pageTitle": "Template Test"
  }' | jq '.'

echo ""
echo "✅ Test complete!"
echo ""
echo "📋 What to check:"
echo "1. Check terminal logs for '[Email] ✅ Using CUSTOM HTML template'"
echo "2. Check your email inbox"
echo "3. Verify the email uses YOUR custom template (not the default)"
echo "4. Verify checkboxes show custom values if configured"
echo ""
echo "💡 To configure custom template:"
echo "1. Go to http://localhost:1337/notifications"
echo "2. Select your form"
echo "3. Edit the HTML template in the editor"
echo "4. Add custom value for checkboxes if needed"
echo "5. Click 'Save Settings'"
echo "6. Submit a form to test"
