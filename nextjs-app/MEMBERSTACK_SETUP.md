# Memberstack Authentication Setup Guide

Your app now has a complete authentication system powered by Memberstack! 🎉

## 📋 Setup Steps

### 1. Create a Memberstack Account
1. Go to [https://app.memberstack.com](https://app.memberstack.com)
2. Sign up for a free account
3. Create a new app/project

### 2. Get Your Public API Key
1. In your Memberstack dashboard, go to **Settings** → **API**
2. Copy your **Public Key** (starts with `pk_`)

### 3. Add Your API Key
1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and replace the placeholder with your actual key:
   ```
   NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY=pk_your_actual_key_here
   ```

3. Restart your dev server:
   ```bash
   npm run dev
   ```

## 🚀 What's Included

### Pages Created
- **`/login`** - Sign in page with email/password
- **`/signup`** - Registration page with validation
- Protected routes automatically redirect to login

### Components Created
- **`MemberstackProvider`** - Global auth context
- **`ProtectedRoute`** - Wrapper for protected pages
- **`UserMenu`** - Dropdown menu with user info and logout

### Features
✅ Email/password authentication  
✅ User registration with validation  
✅ Auto-login after signup  
✅ Session persistence  
✅ Logout functionality  
✅ Protected routes  
✅ User menu with profile dropdown  
✅ Social login buttons (ready for Google/Facebook)  

## 🎨 Usage Examples

### Protect a Page
```typescript
// app/some-protected-page/page.tsx
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>Your protected content here</div>
    </ProtectedRoute>
  );
}
```

### Access User Data
```typescript
'use client';
import { useMemberstack } from '@/lib/memberstack';

export default function MyComponent() {
  const { member, logout } = useMemberstack();
  
  return (
    <div>
      <p>Welcome, {member?.auth?.email}</p>
      <button onClick={logout}>Sign out</button>
    </div>
  );
}
```

### Manual Login
```typescript
'use client';
import { useMemberstack } from '@/lib/memberstack';

export default function CustomLogin() {
  const { login } = useMemberstack();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Redirect or show success
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return <form>...</form>;
}
```

## 🔐 Available Methods

The `useMemberstack()` hook provides:

- **`member`** - Current logged-in member data
- **`loading`** - Loading state (true during initialization)
- **`login(email, password)`** - Sign in with email/password
- **`signup(email, password)`** - Create new account
- **`logout()`** - Sign out current user
- **`ms`** - Full Memberstack instance for advanced features

## 🔑 Advanced Memberstack Features

Your Memberstack instance (`ms`) supports:

### Social Login
```typescript
await ms.loginWithProvider({ provider: 'google' });
await ms.loginWithProvider({ provider: 'facebook' });
```

### Passwordless Login
```typescript
await ms.sendMemberLoginPasswordlessEmail({ email: 'user@example.com' });
```

### Update Profile
```typescript
await ms.updateMember({ 
  customFields: { name: 'John Doe' }
});
```

### Password Reset
```typescript
await ms.sendMemberResetPasswordEmail({ email: 'user@example.com' });
```

### Subscription/Plans
```typescript
const plans = await ms.getPlans();
await ms.purchasePlansWithCheckout({ priceIds: ['price_123'] });
```

## 📚 More Info

- **Memberstack Docs**: [https://docs.memberstack.com](https://docs.memberstack.com)
- **Your Repo Docs**: Check `.memberstack/quickref.md` and `.memberstack/complete.md`

## 🎯 Next Steps

1. Get your Memberstack public key
2. Add it to `.env.local`
3. Restart the dev server
4. Visit `/signup` to create a test account
5. Test login at `/login`

**Your authentication system is ready to go!** 🚀










