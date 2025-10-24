# Conditional Routing Guide

## 🎯 How Conditional Routing Works

The form submission system supports **two routing strategies**:

### **1. Simple Routing (Default)**
- **No conditional rules** - just set fallback emails
- **All submissions** go to the same recipients
- **Perfect for** basic contact forms

### **2. Conditional Routing (Advanced)**
- **Set up rules** based on form field values
- **Different recipients** for different conditions
- **Fallback emails** for unmatched conditions
- **Perfect for** complex business logic

## 📧 Email Types

### **Admin Emails** (Notification emails to you)
- Sent when form is submitted
- Can have conditional routing
- Always has a fallback option

### **User Emails** (Confirmation emails to form submitter)
- Sent to the person who filled out the form
- Can have conditional routing
- Optional (no fallback required)

## 🔄 Routing Logic Flow

```
Form Submission
      ↓
1. Check for conditional rules
      ↓
2. If rules match → Send to rule recipients
      ↓
3. If no rules match → Send to fallback email
      ↓
4. If no fallback → No email sent
```

## 📋 Configuration Examples

### **Example 1: Simple Routing**
```json
{
  "admin_fallback_email": "admin@company.com",
  "user_fallback_email": "noreply@company.com",
  "admin_routes": [],
  "user_routes": []
}
```
**Result**: All submissions go to `admin@company.com`, confirmations to `noreply@company.com`

### **Example 2: Conditional Routing**
```json
{
  "admin_fallback_email": "admin@company.com",
  "admin_routes": [
    {
      "field": "Service",
      "operator": "equals",
      "value": "Support",
      "recipients": "support@company.com"
    },
    {
      "field": "Service", 
      "operator": "equals",
      "value": "Sales",
      "recipients": "sales@company.com"
    }
  ]
}
```
**Result**: 
- Support requests → `support@company.com`
- Sales requests → `sales@company.com`  
- Everything else → `admin@company.com`

## 🎛️ Available Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | "Support" equals "Support" |
| `contains` | Contains text | "I need help" contains "help" |
| `starts_with` | Starts with text | "Support Request" starts with "Support" |
| `ends_with` | Ends with text | "urgent.txt" ends with ".txt" |

## 🔧 Setup Instructions

### **Step 1: Go to Notifications Page**
1. Navigate to the **Notifications** page in your app
2. Select the form you want to configure

### **Step 2: Configure Admin Emails**
1. **Fallback Email**: Enter your main email address
2. **Optional**: Add conditional rules if needed
3. **Save** the settings

### **Step 3: Configure User Emails (Optional)**
1. **Fallback Email**: Enter confirmation email address
2. **Optional**: Add conditional rules for different confirmations
3. **Save** the settings

## 🚀 Benefits

### **Simple Routing**
- ✅ **Easy setup** - just add email addresses
- ✅ **Reliable** - always sends emails
- ✅ **Perfect for** most contact forms

### **Conditional Routing**
- ✅ **Smart routing** - right person gets the right emails
- ✅ **Scalable** - handle complex business logic
- ✅ **Flexible** - unlimited rules and conditions

## 🔍 Debug Information

### **Console Logs You'll See:**
```
[Email] 📧 Simple routing configured - will send to fallback email only
[Email] No routes matched, using fallback: admin@company.com
[Email] Sending to 1 admin recipient(s): ["admin@company.com"]
```

### **Conditional Routing Logs:**
```
[Email] 📋 Conditional routing configured - will try rules first, then fallback
[Email] Admin route matched - Field: Service, Value: Support
[Email] Sending to 1 admin recipient(s): ["support@company.com"]
```

## ⚠️ Important Notes

1. **Fallback is required** for admin emails (or no emails will be sent)
2. **User emails are optional** (confirmation emails)
3. **Rules are evaluated in order** - first match wins
4. **Multiple recipients** supported (comma-separated)
5. **Case-insensitive** matching for all operators

## 🎉 Ready to Use!

Your form submissions will now work with **both simple and conditional routing**! 🚀








