# Email Template System - Complete Guide

## Overview

The notification system now supports **custom HTML email templates** with dynamic variable replacement. You can design your own email templates in the notifications UI and use `{{FieldName}}` syntax to insert form submission data.

---

## How It Works

### 1. Custom Templates
- Navigate to `/notifications` in your app
- Select a form
- In the **"Email HTML Template"** section, write your custom HTML
- Use `{{FieldName}}` placeholders where you want form data to appear
- Click **"Preview HTML"** to see how it looks
- Click **"Save Settings"** to apply

### 2. Variable Replacement

The system automatically replaces template variables with actual form submission values:

**Template:**
```html
<p>Country selected: {{Select a Country}}</p>
<p>Checkbox status: {{United Kingdom}}</p>
```

**Result (when someone selects "United Kingdom"):**
```html
<p>Country selected: United Kingdom</p>
<p>Checkbox status: on</p>
```

### 3. Flexible Matching

The system is smart about matching field names. It works with:
- **Exact match**: `{{Select a Country}}`
- **With hyphens**: `{{Select-a-Country}}`
- **With underscores**: `{{Select_a_Country}}`
- **Mixed**: Any combination

This means you don't have to worry about the exact spacing or format!

---

## Complete Example

### Your Form Has These Fields:
- `Full Name` (text input)
- `Email` (email input)
- `Select a Country` (dropdown)
- `Subscribe to newsletter` (checkbox)

### Your Custom Template:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
      .card { background: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      h1 { color: #2563eb; margin-top: 0; }
      .field { padding: 12px; border-bottom: 1px solid #eee; }
      .field strong { color: #334155; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>🎉 New Form Submission!</h1>
      <p>Great news! Someone just filled out your form.</p>
      
      <div class="field">
        <strong>Name:</strong> {{Full Name}}
      </div>
      <div class="field">
        <strong>Email:</strong> {{Email}}
      </div>
      <div class="field">
        <strong>Country:</strong> {{Select a Country}}
      </div>
      <div class="field">
        <strong>Newsletter:</strong> {{Subscribe to newsletter}}
      </div>
      
      <div class="footer">
        <p>This email was sent automatically from your website.</p>
        <p>Received on: <?php echo date('F j, Y g:i a'); ?></p>
      </div>
    </div>
  </body>
</html>
```

### Result Email:
When someone submits with:
- Name: "John Doe"
- Email: "john@example.com"
- Country: "United Kingdom"
- Newsletter: "on" (checked)

They receive a beautifully formatted email with all those values filled in!

---

## Custom Subject Lines

You can also customize the email subject line with variables!

**Subject Template:**
```
New Country Selection: {{Select a Country}}
```

**Result:**
```
New Country Selection: United Kingdom
```

---

## Advanced Features

### Conditional Content (Coming Soon)
You can use basic HTML conditionals:

```html
{{#if Email}}
  <p>We'll contact you at: {{Email}}</p>
{{/if}}
```

### Multiple Templates
- Set **admin template** for notifications to yourself
- Set **user template** for confirmation emails to submitters
- Each can have different designs!

---

## Template Library

### 1. Minimal & Clean
```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb;">
  <div style="background: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px;">
    <h2 style="color: #111827; margin-top: 0;">New Submission</h2>
    <p><strong>Name:</strong> {{Full Name}}</p>
    <p><strong>Email:</strong> {{Email}}</p>
    <p><strong>Message:</strong> {{Message}}</p>
  </div>
</body>
</html>
```

### 2. Professional Card
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .card { background: white; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .header { background: #4f46e5; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .field { padding: 15px; border-left: 4px solid #4f46e5; margin-bottom: 15px; background: #f9fafb; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin: 0;">📬 New Contact</h1>
    </div>
    <div class="content">
      <div class="field">
        <strong>Name:</strong> {{Full Name}}
      </div>
      <div class="field">
        <strong>Email:</strong> {{Email}}
      </div>
      <div class="field">
        <strong>Country:</strong> {{Country}}
      </div>
    </div>
    <div class="footer">
      Powered by Your Amazing Website
    </div>
  </div>
</body>
</html>
```

### 3. Modern Table Layout
```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); padding: 30px; color: white; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">New Submission Received</h1>
    </div>
    <div style="padding: 30px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 2px solid #e5e7eb;">
          <td style="padding: 15px; font-weight: bold; color: #374151; width: 40%;">Name</td>
          <td style="padding: 15px; color: #6b7280;">{{Full Name}}</td>
        </tr>
        <tr style="border-bottom: 2px solid #e5e7eb;">
          <td style="padding: 15px; font-weight: bold; color: #374151;">Email</td>
          <td style="padding: 15px; color: #6b7280;">{{Email}}</td>
        </tr>
        <tr style="border-bottom: 2px solid #e5e7eb;">
          <td style="padding: 15px; font-weight: bold; color: #374151;">Country</td>
          <td style="padding: 15px; color: #6b7280;">{{Select a Country}}</td>
        </tr>
      </table>
    </div>
    <div style="background: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 14px;">
      This is an automated notification
    </div>
  </div>
</body>
</html>
```

---

## How Variables Are Replaced

The system performs these replacements in order:

1. **Exact field name match**: `{{Select a Country}}` → `United Kingdom`
2. **Hyphenated version**: `{{Select-a-Country}}` → `United Kingdom`
3. **Spaced version**: `{{Select a Country}}` → `United Kingdom`
4. **Unreplaced variables**: Any `{{}}` that doesn't match is removed (empty string)

---

## Testing Your Template

### In the UI:
1. Go to `/notifications`
2. Select your form
3. Enter your template in the textarea
4. Click **"Preview HTML"** to see it rendered
5. Save and test with a real form submission

### Best Practices:
- ✅ Always use inline CSS (email clients don't support external stylesheets)
- ✅ Test on mobile (use `<meta name="viewport">`)
- ✅ Use web-safe fonts (Arial, Helvetica, Georgia, etc.)
- ✅ Keep max-width to 600px for best compatibility
- ✅ Use tables for layout (better email client support)
- ❌ Avoid JavaScript (won't work in emails)
- ❌ Avoid external images unless hosted reliably
- ❌ Don't use CSS Grid or Flexbox (poor email support)

---

## Default Template

If no custom template is provided, the system uses this beautiful default:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
          New Form Submission
        </h1>
      </div>

      <!-- Content -->
      <div style="padding: 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">
          You've received a new submission from <strong>Your Form</strong>.
        </p>
        
        <table style="width: 100%; margin-top: 24px; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <!-- Form fields appear here automatically -->
        </table>
      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #9ca3af; font-size: 14px;">
          This email was sent from Your Form
        </p>
      </div>

    </div>
  </body>
</html>
```

---

## Troubleshooting

### Variables Not Replacing?
- Check field name spelling (use form preview to see exact names)
- Try hyphenated version: `{{Select-a-Country}}`
- Check the server logs for replacement attempts

### HTML Not Rendering?
- Make sure Xano SendGrid endpoint is set to "HTML" content type
- Check `XANO_SENDGRID_HTML_FIX.md` for setup instructions
- Verify the template is valid HTML (use preview)

### Styling Not Showing?
- Use **inline styles** only: `<p style="color: red;">`
- Avoid `<style>` tags in `<body>` (move to `<head>`)
- Test with a simple template first

---

## Summary

✨ **Custom HTML templates with variable replacement**
📧 **Beautiful, branded notification emails**
🎯 **Form-specific designs**
🔧 **Easy setup in the UI**

Your notification emails will now look exactly how you want them! 🎉







