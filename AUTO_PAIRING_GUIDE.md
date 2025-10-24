# Auto-Pairing Feature Guide

## ✅ What Changed

Your Roolify script now automatically pairs form inputs with their labels - **no manual work required!**

## 🎯 How It Works

### 1. **Auto-Discovery**
When the script loads, it automatically:
- Finds all `<input>`, `<select>`, and `<textarea>` elements
- Looks for their associated `<label>` elements (using `for` attribute or parent relationship)
- Adds matching `data-roolify` attributes to both

### 2. **Label + Input Pairing**
```html
<!-- Before (what Webflow generates): -->
<label for="Email">Email Address</label>
<input id="Email" name="email" type="email">

<!-- After (script auto-injects): -->
<label for="Email" data-roolify="Email">Email Address</label>
<input id="Email" name="email" type="email" data-roolify="Email">
```

### 3. **Smart Show/Hide**
When a rule hides/shows a field:
```javascript
hideField('Email')  
// Finds ALL elements with data-roolify="Email"
// Hides BOTH the label AND the input!
```

## 🚀 User Experience

### In Webflow Designer:
1. Drag in a form field
2. Give it a name (e.g., "Email")
3. Done! ✅

### In Your App:
- Fields auto-populate in the rule builder
- Use the field ID/name in your rules
- No custom attributes needed!

### On Live Site:
- Script auto-pairs everything on load
- Labels and inputs hide/show together
- Perfect UX with zero setup!

## 📋 Testing

### Test Page:
Open: `http://localhost:3000/test-auto-pairing.html`

### What to Check:
1. **Console Logs**: Should see auto-pairing messages
2. **Select State**: Try "California" 
3. **Watch Fields**: Labels + inputs hide/show together
4. **Inspect HTML**: See `data-roolify` attributes injected

### Expected Console Output:
```
[Roolify] Auto-pairing form elements with labels...
[Roolify] Paired label and input for: Email
[Roolify] Paired label and input for: Phone
[Roolify] Paired label and input for: Full-Name
[Roolify] Auto-paired 3 form field(s)
```

## 🎨 Benefits

| Before | After |
|--------|-------|
| Wrap field in div | ❌ Not needed |
| Add custom ID to div | ❌ Not needed |
| Add custom attributes | ❌ Not needed |
| Manually pair elements | ❌ Not needed |
| Create complex rules | ✅ Simple! |

## 🔧 Technical Details

### Files Modified:
- `/nextjs-app/app/api/script/serve/[siteId]/route.ts`

### Key Functions Added:
1. **`autoPairElements()`** - Scans and pairs all form elements
2. **Updated `showElement()`** - Shows all paired elements
3. **Updated `hideElement()`** - Hides all paired elements

### Backwards Compatible:
- Still works with IDs
- Still works with existing elements
- Falls back gracefully if no pairing found

## 💡 Next Steps

1. **Test it**: Open the test page and check console
2. **Create rules**: Build conditional logic using field IDs
3. **Deploy**: Your existing script tag stays the same!
4. **Enjoy**: Zero manual attribute work! 🎉

---

**Questions?** Check the console logs - they're very detailed!












