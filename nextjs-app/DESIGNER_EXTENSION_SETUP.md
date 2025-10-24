# Designer Extension Setup - Fixed Sizing Issue

## ✅ What Was Fixed

The Designer Extension was appearing too small because:
1. ❌ Missing viewport meta tag
2. ❌ Layout optimized for full browser, not iframe
3. ❌ No dedicated extension view

Now fixed with:
1. ✅ Proper viewport configuration
2. ✅ Dedicated `/extension` route optimized for Designer
3. ✅ Responsive CSS for iframe context
4. ✅ Updated `webflow.json` configuration

---

## 🚀 How to Use the Designer Extension

### Step 1: Update Development URL in Webflow

1. Open Webflow Designer
2. Go to **Apps** panel (left sidebar)
3. Find **"Form Flow"** or **"Roolify"**
4. Click to open app settings
5. Update **Development URL**:
   - Change from: `http://localhost:1337`
   - Change to: `http://localhost:1337/extension`
6. Click **"Launch development App"**

### Step 2: Test the Extension

The extension should now display properly with:
- ✅ Readable text at proper size
- ✅ Clickable buttons
- ✅ List of your forms
- ✅ Quick access to create rules
- ✅ Link to open full dashboard

---

## 📁 Files Created/Modified

### New Files
```
nextjs-app/
├── app/
│   └── extension/
│       ├── layout.tsx          ← Optimized layout for Designer
│       └── page.tsx             ← Simplified dashboard view
├── lib/
│   └── iframeDetection.ts       ← Iframe detection utilities
└── DESIGNER_EXTENSION_SETUP.md  ← This file
```

### Modified Files
```
nextjs-app/
├── app/
│   ├── layout.tsx               ← Added viewport meta tag
│   └── globals.css              ← Added iframe-specific styles
└── webflow.json                 ← Added homepage: "/extension"
```

---

## 🎨 Extension Features

### Quick Actions
- **Create New Rule** - Opens rule builder in new tab
- **Open Full Dashboard** - Opens complete dashboard in new tab

### Forms List
- Shows all forms for the current site
- Click any form to create rules for it
- Displays form name and ID

### Design
- Optimized for 800px width (Designer Extension "large" size)
- Responsive and scrollable
- Clean, minimal interface
- Fast loading

---

## 🔧 Configuration Details

### webflow.json
```json
{
  "name": "Roolify",
  "apiVersion": "2",
  "size": "large",
  "publicDir": ".next",
  "homepage": "/extension"
}
```

**Key settings:**
- `size: "large"` - ~800px wide panel in Designer
- `homepage: "/extension"` - Loads optimized view by default

### Viewport Configuration
```typescript
viewport: "width=device-width, initial-scale=1, maximum-scale=1"
```

This ensures proper scaling in the iframe context.

### Iframe Detection
The app can detect when it's running in an iframe:
```typescript
import { isInIframe, isInWebflowDesigner } from '@/lib/iframeDetection';
```

---

## 📱 Routes

### `/extension` (Designer Extension)
- Optimized for Designer panel
- Simplified UI
- Quick actions
- Forms list

### `/dashboard` (Full Dashboard)
- Complete feature set
- Full navigation
- Stats and analytics
- Opens in new tab from extension

### `/rule-builder` (Rule Builder)
- Create conditional logic rules
- Full form field editor
- Opens in new tab from extension

---

## 🎯 Usage Flow

1. **User opens Designer Extension**
   - Sees simplified dashboard at `/extension`
   - Views list of forms
   
2. **User clicks "Create New Rule"**
   - Opens `/rule-builder` in new tab
   - Full-featured rule builder interface
   
3. **User clicks on a specific form**
   - Opens `/rule-builder?formId=XXX` in new tab
   - Pre-selected form for that rule

4. **User needs advanced features**
   - Clicks "Open Full Dashboard"
   - Opens `/dashboard` in new tab
   - Access to all features

---

## 🔄 Local Development Workflow

### Start Dev Server
```bash
cd nextjs-app
npm run dev
```

### Update Webflow Development URL
Set to: `http://localhost:1337/extension`

### Test Changes
1. Make changes to code
2. Save file
3. Refresh Designer Extension
4. Verify display

---

## 🚀 Production Deployment

When you deploy to production (Vercel):

1. **Update webflow.json (if needed)**
   - `homepage` stays as `/extension`
   
2. **Update Webflow App Settings**
   - Change Development URL to production URL
   - Example: `https://your-app.vercel.app/extension`

3. **Test in production**
   - Open Designer Extension
   - Verify proper display
   - Test all links work

---

## 🎨 Customization

### Change Extension Size

**In `webflow.json`:**
```json
{
  "size": "small"   // ~400px wide
  "size": "medium"  // ~600px wide
  "size": "large"   // ~800px wide (current)
}
```

### Customize Extension View

**Edit `app/extension/page.tsx`:**
- Add more quick actions
- Change layout
- Add site selector
- Add statistics

### Adjust Styles

**Edit `app/globals.css`:**
```css
/* Iframe-specific styles */
.in-iframe {
  /* Add your custom styles */
}
```

---

## 🐛 Troubleshooting

### Extension still shows small

**Solution:**
1. Clear browser cache
2. Restart dev server
3. Refresh Designer Extension
4. Verify Development URL includes `/extension`

### Forms not loading

**Solution:**
1. Check console for errors
2. Verify site has forms
3. Check OAuth tokens are valid
4. Try "Open Full Dashboard" link

### Links not working

**Solution:**
1. Check popup blocker settings
2. Allow popups from Webflow Designer
3. Try Cmd/Ctrl + Click to force new tab

### Styles look wrong

**Solution:**
1. Check globals.css was updated
2. Verify viewport meta tag in layout.tsx
3. Clear browser cache
4. Restart dev server

---

## 💡 Tips

1. **Use Extension for Quick Access**
   - Best for viewing forms
   - Quick rule creation
   - Fast navigation

2. **Use Full Dashboard for Power Features**
   - Detailed analytics
   - Bulk operations
   - Advanced settings

3. **Open Links in New Tabs**
   - Keep Designer open
   - Work in separate window
   - Better multitasking

4. **Test in Real Designer**
   - Don't just test in browser
   - Designer iframe behaves differently
   - Test all interactions

---

## 📊 Size Comparison

| Route | Best For | Width | Features |
|-------|----------|-------|----------|
| `/extension` | Designer panel | Fits 800px | Quick actions, forms list |
| `/dashboard` | Full browser | Responsive | All features, analytics |
| `/rule-builder` | Full browser | Responsive | Rule creation, editing |

---

## 🎯 Next Steps

1. ✅ Update Development URL in Webflow
2. ✅ Test extension in Designer
3. ✅ Verify all links work
4. ✅ Customize as needed
5. ✅ Deploy to production when ready

---

## 📞 Support

If extension still doesn't display properly:

1. Check terminal logs for errors
2. Verify `webflow.json` has `homepage: "/extension"`
3. Confirm Development URL ends with `/extension`
4. Clear browser cache completely
5. Try different browser

---

**Status:** ✅ Designer Extension is now properly configured and ready to use!






