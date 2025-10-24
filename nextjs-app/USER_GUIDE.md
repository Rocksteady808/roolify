# Roolify User Guide

Welcome to Roolify! This guide will help you get the most out of your advanced Webflow forms.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Connecting Your Webflow Sites](#connecting-your-webflow-sites)
3. [Creating Form Rules](#creating-form-rules)
4. [Setting Up Notifications](#setting-up-notifications)
5. [Managing Submissions](#managing-submissions)
6. [Using the Designer Extension](#using-the-designer-extension)
7. [Plan Limits & Upgrades](#plan-limits--upgrades)
8. [FAQ](#faq)

---

## Getting Started

### What is Roolify?

Roolify extends your Webflow forms with powerful features:
- **Conditional Logic**: Show/hide fields based on user input
- **Smart Routing**: Send submissions to different emails based on form data
- **Submission Management**: View and export all form submissions
- **Custom Actions**: Set field values, enable/disable elements, and more

### System Requirements

- Active Webflow account (Designer or Workspace access)
- A Webflow site with forms
- Modern web browser (Chrome, Firefox, Safari, Edge)

---

## Connecting Your Webflow Sites

### First-Time Setup

1. **Sign Up**
   - Visit your Roolify dashboard
   - Click "Sign Up" and create an account
   - Or sign in if you already have an account

2. **Connect to Webflow**
   - Click the "Connect to Webflow" button
   - You'll be redirected to Webflow's authorization page
   - Review the permissions Roolify needs:
     - Read your sites
     - Read your forms
     - Access form submissions
   - Click "Authorize App"

3. **Select a Site**
   - After authorization, you'll be redirected back to Roolify
   - Your connected Webflow sites will appear in the dashboard
   - Click the site selector dropdown to choose which site to manage

### Adding More Sites

To connect additional Webflow sites:
1. Click your profile icon in the sidebar
2. Select "Connect New Site"
3. Follow the authorization flow
4. New sites will appear in your site selector

### Disconnecting a Site

To remove a site from Roolify:
1. Go to your Webflow Settings
2. Navigate to "Integrations" → "Authorized Apps"
3. Find Roolify and click "Revoke Access"

---

## Creating Form Rules

Rules add conditional logic to your forms. Here's how to create them:

### Step 1: Open Rule Builder

1. Click "Rule Builder" in the sidebar
2. Select your site from the dropdown
3. Select the form you want to add logic to

### Step 2: Define Conditions

**Conditions** determine when your rule runs.

Example: "If Country equals 'USA'"

1. Click "+ Add Condition"
2. Select a field (e.g., "Country")
3. Choose an operator:
   - **equals** - Exact match
   - **not equals** - Anything except this value
   - **contains** - Partial match
   - **greater than** - For numbers/dates
   - **less than** - For numbers/dates
4. Enter the value to check against (e.g., "USA")

**Multiple Conditions**

You can add multiple conditions with AND/OR logic:
- **AND**: All conditions must be true
- **OR**: At least one condition must be true

Example:
```
IF Country equals "USA" AND State equals "California"
```

### Step 3: Define Actions

**Actions** are what happens when conditions are met.

Available actions:

1. **Show Element**
   - Makes a hidden field visible
   - Use for progressive disclosure

2. **Hide Element**
   - Hides a field that's currently visible
   - Keeps forms clean and focused

3. **Set Value**
   - Automatically fills in a field value
   - Useful for hidden fields, tracking, or defaults

4. **Enable Element**
   - Makes a disabled field editable
   - Useful for conditional requirements

5. **Disable Element**
   - Makes a field read-only
   - Prevents editing based on conditions

**Example Actions:**

```
IF Country equals "USA"
THEN show "State" field
THEN set "Region" to "North America"
```

### Step 4: Save and Deploy

1. Give your rule a descriptive name (e.g., "Show state for US customers")
2. Click "Save Rule"
3. Copy the generated script URL
4. Add the script to your Webflow site:
   - In Webflow, go to Site Settings → Custom Code
   - Paste the script in the "Head Code" section:
     ```html
     <script src="https://your-roolify-url.com/api/script/serve/YOUR_SITE_ID"></script>
     ```
   - Publish your site

### Step 5: Test Your Rule

1. Visit your Webflow site
2. Open the form with the rule
3. Test the conditions (e.g., select "USA" from Country dropdown)
4. Verify actions execute correctly (e.g., State field appears)

---

## Setting Up Notifications

Send form submissions to different emails based on the data submitted.

### Step 1: Navigate to Notifications

1. Click "Notifications" in the sidebar
2. Select your site
3. Select the form you want to configure

### Step 2: Configure Admin Routing

**Admin routing** determines where submissions are sent based on form data.

**Example: Route by Department**

1. Click "+ Add Route"
2. Set condition: "Department equals 'Sales'"
3. Enter email: `sales@company.com`
4. Add another route for "Support" → `support@company.com`
5. Set fallback email: `admin@company.com` (for submissions that don't match any route)

**Advanced Routing Example:**

```
IF Department equals "Sales" AND Priority equals "High"
SEND TO: sales-urgent@company.com

IF Department equals "Sales"
SEND TO: sales@company.com

IF Department equals "Support"
SEND TO: support@company.com

OTHERWISE (fallback):
SEND TO: admin@company.com
```

### Step 3: Configure User Notifications (Auto-Reply)

Send automatic confirmation emails to form submitters.

1. Toggle "Send User Notification" to ON
2. Define routing logic (similar to admin routes)
3. The email is sent to the address entered in the form's email field

**Example:**
```
IF Product equals "Enterprise"
SEND TO: {email} with subject "Thank you for your enterprise inquiry"
```

### Step 4: Customize Email Templates

Use placeholders to personalize emails:

**Available Placeholders:**
- `{{firstName}}` - User's first name
- `{{lastName}}` - User's last name
- `{{email}}` - User's email
- `{{phone}}` - User's phone number
- `{{message}}` - Message content
- `{{formName}}` - Name of the form
- `{{submissionDate}}` - Date/time of submission
- Any custom field from your form

**Example Template:**
```
Hi {{firstName}},

Thank you for contacting us about {{product}}!

We received your message:
"{{message}}"

Our {{department}} team will respond within 24 hours.

Best regards,
The Team
```

### Step 5: Save and Test

1. Click "Save Notification Settings"
2. Submit a test form
3. Check that emails arrive at correct addresses
4. Verify placeholders are replaced with actual data

---

## Managing Submissions

View, search, and export all form submissions from one central dashboard.

### Viewing Submissions

1. Click "Submissions" in the sidebar
2. Select a site from the dropdown
3. Optionally filter by form

### Searching Submissions

Use the search bar to find specific submissions:
- Search by name, email, or any form field
- Searches across all text fields

### Filtering Submissions

Filter submissions by:
- **Form**: View submissions from a specific form
- **Date Range**: Custom date picker (coming soon)
- **Status**: All, Read, Unread (coming soon)

### Exporting Data

Export submissions to CSV for analysis:
1. Apply any filters you want
2. Click "Export to CSV"
3. Open in Excel, Google Sheets, or any spreadsheet app

### Submission Details

Click any submission to view:
- All form field data
- Submission timestamp
- Source page URL
- User browser/device info (coming soon)

---

## Using the Designer Extension

Access Roolify directly from the Webflow Designer.

### Opening the Extension

1. Open any site in Webflow Designer
2. Click the "Apps" icon in the left sidebar
3. Select "Roolify" from the list
4. The extension panel opens on the right side

### Extension Features

The Designer Extension provides quick access to:

- **Forms List**: See all forms on the current site
- **Quick Rules**: View rules for each form
- **Create Rule**: Opens rule builder in a modal
- **Recent Activity**: Latest form submissions
- **Settings**: Direct links to notifications and setup

### Auto-Site Detection

The extension automatically detects which site you're currently editing:
- No need to manually select a site
- Only shows data relevant to the current site
- Seamlessly switch between sites

### Creating Rules from Designer

1. Select a form from the extension panel
2. Click "Create Rule"
3. Define conditions and actions
4. Save - the script is automatically added to your site
5. Publish to make the rule live

---

## Plan Limits & Upgrades

Roolify offers flexible plans to fit your needs.

### Free Plan

Perfect for trying Roolify:
- 3 forms
- 50 submissions/month
- 5 logic rules
- Basic email notifications

### Starter Plan ($15/month)

For small businesses:
- 10 forms
- 500 submissions/month
- 20 logic rules
- Priority email support

### Professional Plan ($39/month)

For growing businesses:
- 50 forms
- 2,500 submissions/month
- 100 logic rules
- Custom email templates
- Advanced routing
- Priority support

### Business Plan ($99/month)

For agencies and enterprises:
- Unlimited forms
- 10,000 submissions/month
- Unlimited logic rules
- Dedicated support
- Custom integrations
- SLA guarantee

### Checking Your Usage

View your current usage:
1. Click your profile icon
2. Select "Plans & Billing"
3. View usage stats:
   - Forms used / limit
   - Submissions this month
   - Rules created / limit

### Upgrading Your Plan

To upgrade:
1. Go to "Plans & Billing"
2. Click "Upgrade" on your desired plan
3. Enter payment details
4. Confirm upgrade
5. New limits apply immediately

---

## FAQ

### General Questions

**Q: Does Roolify store my form data?**
A: Yes, Roolify stores form submissions in a secure database (Xano) to enable features like submission management and smart routing. Data is encrypted and isolated per user.

**Q: Can I use Roolify on multiple sites?**
A: Yes! Connect as many Webflow sites as you need. Your plan limits apply across all sites.

**Q: Will Roolify slow down my forms?**
A: No. Roolify's script is lightweight (< 10KB) and loads asynchronously, so it won't impact form performance.

### Rules & Logic

**Q: Can I have multiple rules on one form?**
A: Yes! You can create multiple rules per form. They execute in the order they were created.

**Q: What happens if two rules conflict?**
A: The last rule to execute takes precedence. For best results, design rules to be complementary rather than conflicting.

**Q: Can I test rules without publishing?**
A: Yes, Roolify includes a "Test Mode" that lets you preview rule behavior before going live.

### Notifications

**Q: Can I send to multiple emails?**
A: Yes, separate multiple email addresses with commas:
```
sales@company.com, manager@company.com, admin@company.com
```

**Q: Why aren't my emails being delivered?**
A: Check these common issues:
1. Email addresses are correct (no typos)
2. Check spam/junk folders
3. Verify notification settings are saved
4. Check Xano logs for SendGrid errors

**Q: Can I use my own email server?**
A: Currently, Roolify uses SendGrid for email delivery. Custom SMTP support is coming soon.

### Submissions

**Q: How long are submissions stored?**
A: Submissions are stored indefinitely on all paid plans. Free plan submissions are retained for 30 days.

**Q: Can I delete submissions?**
A: Yes, you can delete individual submissions or bulk delete from the Submissions page.

**Q: Are submissions GDPR compliant?**
A: Yes, Roolify is GDPR compliant. Users can request data deletion at any time.

### Billing

**Q: Can I cancel anytime?**
A: Yes, you can cancel your plan at any time from the billing page. You'll retain access until the end of your billing period.

**Q: What happens if I exceed my plan limits?**
A: Forms will continue to work, but you won't be able to create new rules or view new submissions until you upgrade or your limits reset next billing cycle.

**Q: Do you offer annual billing?**
A: Yes! Save 20% with annual billing. Select "Annual" when upgrading.

### Technical

**Q: Does Roolify work with Webflow's native forms?**
A: Yes, Roolify is designed specifically for Webflow's native form elements.

**Q: Can I use Roolify with embedded forms (Typeform, etc.)?**
A: No, Roolify only works with native Webflow forms.

**Q: Is there an API?**
A: Yes! API access is available on Business plans. Contact support for API documentation.

---

## Getting Help

### Documentation

- **Setup Guides**: See `/docs` in the project repository
- **Video Tutorials**: [YouTube Channel] (if available)
- **Blog**: [blog.roolify.com] (if available)

### Support Channels

- **Email**: info@roolify.com
- **Live Chat**: Available on paid plans
- **Community**: Join our Slack/Discord community
- **GitHub Issues**: Report bugs and request features

### Quick Links

- [Webflow Forum Discussion]
- [Feature Request Board]
- [Status Page] (uptime monitoring)

---

**Happy form building! 🚀**





