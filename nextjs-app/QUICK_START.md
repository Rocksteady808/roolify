# 🚀 Quick Start - OAuth Fix

## ⚡ 3 Steps to Test OAuth

### Step 1: Update Webflow (5 minutes)
```
1. Go to: https://developers.webflow.com/
2. Your Roolify app → Settings → Redirect URI
3. DELETE: http://localhost:1337/api/auth/callback  
4. ADD: https://0589184572d3.ngrok-free.app/api/auth/callback
5. Save
```

### Step 2: Restart Dev Server (30 seconds)
```bash
# Stop current server (Ctrl+C), then:
cd nextjs-app
npm run dev
```

### Step 3: Test OAuth (2 minutes)
```
Visit: https://0589184572d3.ngrok-free.app/api/auth/install
Click: Authorize
Result: Dashboard with your sites!
```

---

## ✅ What's Been Fixed

- ✅ Ngrok tunnel running (HTTPS)
- ✅ Environment variables updated
- ✅ Error handling improved
- ✅ User-friendly error pages

---

## 📚 Full Docs

- `OAUTH_SETUP_COMPLETE.md` - Complete guide
- `SETUP_STATUS.md` - Detailed status
- `PRODUCTION_DEPLOY.md` - Deploy to Vercel

---

## 🆘 If It Still Doesn't Work

1. Check Webflow redirect URI matches exactly
2. Restart dev server after env changes
3. Check terminal logs for errors
4. Visit ngrok dashboard: http://localhost:4040
5. Read `OAUTH_SETUP_COMPLETE.md` troubleshooting

---

**Your ngrok URL:** `https://0589184572d3.ngrok-free.app`

**Callback URL:** `https://0589184572d3.ngrok-free.app/api/auth/callback`

**Status:** ✅ Ready to test (after you complete 3 steps above)






