#!/bin/bash

echo "🚀 Creating notification settings for the correct site/form combination..."

# The correct site and form combination from the logs
SITE_ID="68eb5d6db0e34d2e3ed12c0a"
HTML_FORM_ID="wf-form-HBI-International-Inquiry-Form---HBI-International"
FORM_NAME="HBI International Inquiry Form - HBI International"

echo "📝 Creating notification settings for:"
echo "   Site ID: $SITE_ID"
echo "   HTML Form ID: $HTML_FORM_ID"
echo "   Form Name: $FORM_NAME"

# Create the notification settings JSON
NOTIFICATION_DATA='{
  "formId": "'$HTML_FORM_ID'",
  "siteId": "'$SITE_ID'",
  "formName": "'$FORM_NAME'",
  "adminRoutes": [
    {
      "field": "HBI Account Rep",
      "operator": "equals",
      "value": "Aaron",
      "recipients": "atownsend@hbiin.com"
    }
  ],
  "userRoutes": [],
  "adminRecipients": "aarontownsend6@gmail.com",
  "userRecipients": "",
  "emailTemplate": "<!doctype html><html><head><meta charset=\"utf-8\" /><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" /><title>New HBI International Inquiry Form - HBI International Submission</title><style>body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }.card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }h2 { color: #333; margin-top: 0; }.field-list { list-style: none; padding: 0; }.field-list li { padding: 8px 0; border-bottom: 1px solid #eee; }.field-list li:last-child { border-bottom: none; }.footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }</style></head><body><div class=\"card\"><h2>New HBI International Inquiry Form - HBI International Submission</h2><p>You have received a new submission from your website.</p><ul class=\"field-list\"><li><strong>Has Account:</strong> {{Has Account}}</li><li><strong>HBI Account Rep:</strong> {{HBI Account Rep}}</li><li><strong>EIN Number:</strong> {{EIN Number}}</li><li><strong>Full Name:</strong> {{Full Name}}</li><li><strong>Company Name:</strong> {{Company Name}}</li><li><strong>Email:</strong> {{Email}}</li><li><strong>Select Country:</strong> {{Select Country}}</li><li><strong>Message Inquiry:</strong> {{Message Inquiry}}</li><li><strong>Privacy Policy:</strong> {{Privacy Policy}}</li><li><strong>Terms Of Service:</strong> {{Terms Of Service}}</li></ul><div class=\"footer\"><p>This is an automated notification from your website.</p></div></div></body></html>",
  "adminSubject": "New Contact Form Submission",
  "userSubject": "Thank you for your submission",
  "customValue": "",
  "fieldCustomValues": {}
}'

echo "💾 Saving notification settings..."

# Make the API call
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -d "$NOTIFICATION_DATA" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "🎯 Next steps:"
echo "1. Test form submission again"
echo "2. Check that atownsend@hbiin.com receives the notification"
echo "3. Verify the routing works based on 'HBI Account Rep' field value"
