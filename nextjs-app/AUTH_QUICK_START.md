# 🚀 Authentication Quick Start

## What Was Just Created

### ✅ Complete Auth System
- **Login page** (`/login`)
- **Signup page** (`/signup`)
- **Memberstack integration** (Context Provider)
- **Protected routes** (Auto-redirect to login)
- **User menu** (In sidebar with logout)

### 📦 Installed
```bash
npm install @memberstack/dom
```

## ⚡ Quick Setup (3 Steps)

### 1. Get Memberstack Key
Go to [app.memberstack.com](https://app.memberstack.com) → Settings → API → Copy Public Key

### 2. Create .env.local
```bash
# In nextjs-app/ directory
cp .env.local.example .env.local
```

Then edit `.env.local`:
```
NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY=pk_YOUR_ACTUAL_KEY_HERE
```

### 3. Restart Server
```bash
npm run dev
```

## 🎯 Test It Out

1. **Visit** http://localhost:1337/signup
2. **Create account** with any email/password
3. **You'll be logged in** and redirected to dashboard
4. **See your email** in the sidebar user menu
5. **Click logout** to sign out

## 🔐 Protect Any Page

```typescript
// Wrap any page content
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

## 👤 Use Auth Anywhere

```typescript
'use client';
import { useMemberstack } from '@/lib/memberstack';

function MyComponent() {
  const { member, login, logout } = useMemberstack();
  
  if (!member) {
    return <div>Not logged in</div>;
  }
  
  return (
    <div>
      <p>Welcome {member.auth.email}!</p>
      <button onClick={logout}>Sign out</button>
    </div>
  );
}
```

## 📍 Routes

| Route | Purpose |
|-------|---------|
| `/login` | Email/password sign in |
| `/signup` | Create new account |
| `/dashboard` | Auto-redirect if not logged in |

## 🎨 Customization

All auth pages use Tailwind CSS and match your app's design. Edit these files:
- `app/login/page.tsx` - Login UI
- `app/signup/page.tsx` - Signup UI
- `components/UserMenu.tsx` - Sidebar dropdown
- `lib/memberstack.tsx` - Auth logic

## 🚨 Troubleshooting

**"Memberstack public key not found"**
→ Add your key to `.env.local` and restart server

**Can't login/signup**
→ Check browser console for errors
→ Verify your Memberstack key is correct

**Changes not showing**
→ Restart dev server: `Ctrl+C` then `npm run dev`

## 📚 Full Docs
See `MEMBERSTACK_SETUP.md` for complete documentation and advanced features.

---
**Ready to go!** Get your Memberstack key and start testing 🎉










