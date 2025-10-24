# 🔍 Plan Enforcement Audit & Implementation Plan

## 📊 Current Xano Plan Tiers

### Monthly Plans
| Plan | Forms | Submissions | Logic Rules | Price |
|------|-------|-------------|-------------|-------|
| **Starter** | 5 | 10,000 | 10 | $39/mo |
| **Pro** | 20 | 50,000 | 50 | $69/mo |
| **Agency** | 50 | 100,000 | 200 | $109/mo |

### Yearly Plans
| Plan | Forms | Submissions | Logic Rules | Price |
|------|-------|-------------|-------------|-------|
| **Starter - Yearly** | 5 | 10,000 | 10 | $374/yr |
| **Pro - Yearly** | 20 | 50,000 | 50 | $662/yr |
| **Agency - Yearly** | 50 | 100,000 | 200 | $1,046/yr |

---

## ✅ Features Already Implemented

### 1. **Form Creation** ✅
- **Status**: Partially implemented (forms are tracked)
- **Location**: `lib/formsStore.ts`, `/api/forms/*`
- **What's Working**: Forms are being saved and tracked

### 2. **Logic Rules** ✅
- **Status**: Fully implemented
- **Location**: `lib/rulesStore.ts`, `/api/rules/*`, `/app/rule-builder`
- **What's Working**: Users can create show/hide logic rules

### 3. **Form Submissions** ✅
- **Status**: Implemented (via Webflow webhooks)
- **Location**: `/api/submissions/webhook/route.ts`
- **What's Working**: Submissions are being captured

### 4. **Email Notifications** ✅
- **Status**: Fully implemented
- **Location**: `/app/notifications`, `/api/notifications`
- **What's Working**: Custom email routing with HTML templates

### 5. **OAuth & Token Storage** ✅
- **Status**: Fully implemented
- **Location**: `/app/api/auth/*`, `lib/webflowStore.ts`
- **What's Working**: Secure server-side token storage

---

## ❌ Critical Missing Features

### 1. **Plan Limit Enforcement** ❌
**Priority**: CRITICAL

**What's Missing**:
- ❌ No checks when creating a new form
- ❌ No checks when creating a new logic rule
- ❌ No submission count tracking per user
- ❌ Users can exceed their plan limits
- ❌ No admin bypass (admins should have unlimited access)

**Where to Add**:
```typescript
// nextjs-app/app/api/forms/route.ts (or create it)
export async function POST(req: Request) {
  const user = await getUserFromSession();
  
  // ✅ ADMIN BYPASS: Admins have unlimited access
  if (user.is_admin) {
    // Skip all limits - create form directly
  } else {
    const userPlan = await getUserPlan(user.plan_id);
    const currentFormCount = await getFormCountForUser(user.id);
    
    if (currentFormCount >= userPlan.max_forms) {
      return NextResponse.json({ 
        error: 'Plan limit reached',
        message: `Your ${userPlan.plan_name} plan allows ${userPlan.max_forms} forms. Upgrade to add more.`
      }, { status: 403 });
    }
  }
  
  // Create form...
}
```

### 2. **User Authentication Integration** ❌
**Priority**: CRITICAL

**What's Missing**:
- ❌ App uses Webflow OAuth but not user auth
- ❌ No connection between logged-in user and their data
- ❌ Can't enforce plan limits without knowing who the user is

**What Exists in Xano**:
- ✅ User table with auth
- ✅ Password reset (magic link)
- ✅ Plan association (`user.plan_id`)

**What to Add**:
```typescript
// nextjs-app/lib/xanoAuth.ts (already exists!)
// nextjs-app/lib/auth.tsx (already exists!)
// ✅ You already have auth infrastructure!

// Just need to:
// 1. Require login before accessing dashboard
// 2. Fetch user's plan when they log in
// 3. Store plan limits in context
```

### 3. **Submission Tracking** ❌
**Priority**: HIGH

**What's Missing**:
- ❌ Not counting submissions against user's monthly limit
- ❌ Not resetting count at billing cycle

**Where to Add**:
```typescript
// nextjs-app/app/api/submissions/webhook/route.ts
export async function POST(req: Request) {
  const formId = req.formId;
  const form = await getFormById(formId);
  const user = await getUserById(form.user_id);
  const userPlan = await getUserPlan(user.plan_id);
  const monthlySubmissions = await getMonthlySubmissionCount(user.id);
  
  if (monthlySubmissions >= userPlan.max_submissions) {
    // Send email: "You've reached your monthly submission limit"
    return NextResponse.json({ 
      error: 'Monthly submission limit reached' 
    }, { status: 403 });
  }
  
  // Save submission...
}
```

### 4. **Plan Upgrade/Downgrade UI** ❌
**Priority**: HIGH

**What's Missing**:
- ❌ No pricing page
- ❌ No "Upgrade Plan" button
- ❌ No Stripe integration (but table exists!)

**What to Add**:
- `/app/pricing` - Show plan tiers with features
- `/app/dashboard` - Add "Current Plan" widget showing usage
- Stripe checkout integration

### 5. **Usage Dashboard** ❌
**Priority**: MEDIUM

**What's Missing**:
- ❌ Users can't see their current usage vs limits
- ❌ No warnings when approaching limits

**What to Add**:
```tsx
// nextjs-app/app/dashboard/page.tsx
<div className="bg-white border rounded p-4">
  <h3>Plan Usage</h3>
  <div>Forms: {currentForms} / {maxForms}</div>
  <div>Logic Rules: {currentRules} / {maxRules}</div>
  <div>Submissions (this month): {currentSubmissions} / {maxSubmissions}</div>
  {currentForms >= maxForms * 0.8 && (
    <div className="text-orange-600">
      ⚠️ You're using {Math.round(currentForms/maxForms*100)}% of your form limit
    </div>
  )}
</div>
```

---

## 🚀 Implementation Priority

### Phase 1: CRITICAL (Do First) 🔴
1. **Connect User Auth to Dashboard**
   - Require login to access dashboard
   - Fetch user's plan on login
   - Associate forms/rules with logged-in user

2. **Enforce Form Limits**
   - Check `max_forms` before creating new form
   - Show error message with upgrade prompt

3. **Enforce Logic Rule Limits**
   - Check `max_logic_rules` before creating new rule
   - Show error message with upgrade prompt

### Phase 2: HIGH (Do Soon) 🟠
4. **Track Submission Counts**
   - Save submission count to Xano user table
   - Add monthly reset logic
   - Enforce `max_submissions` limit

5. **Usage Dashboard**
   - Show current usage vs limits
   - Add warning indicators

6. **Pricing Page**
   - Display plan tiers
   - Add "Upgrade" CTA

### Phase 3: MEDIUM (Nice to Have) 🟡
7. **Stripe Integration**
   - Checkout flow
   - Plan upgrades/downgrades
   - Webhook to update `user.plan_id`

8. **Soft Limits & Warnings**
   - Email when 80% of limit reached
   - Grace period before hard cutoff

---

## 📝 Implementation Checklist

### Step 1: Connect Auth to Dashboard
- [ ] Wrap `/app/dashboard` with auth required
- [ ] Fetch `user.plan_id` on login
- [ ] Create `usePlan()` hook to access plan limits
- [ ] Pass `user_id` when creating forms/rules

### Step 2: Add Plan Enforcement
- [ ] Create `/api/forms/check-limit` endpoint
- [ ] Add admin bypass check (skip limits if `user.is_admin === true`)
- [ ] Call before form creation
- [ ] Create `/api/rules/check-limit` endpoint
- [ ] Add admin bypass check (skip limits if `user.is_admin === true`)
- [ ] Call before rule creation

### Step 3: Track Submissions
- [ ] Add `submission_count_this_month` to user table (or query)
- [ ] Increment on each submission
- [ ] Add admin bypass check (skip limits if `user.is_admin === true`)
- [ ] Check against `max_submissions`
- [ ] Create cron job to reset monthly

### Step 4: Build Usage UI
- [ ] Add usage widget to dashboard
- [ ] Show "Admin - Unlimited Access" badge for admins
- [ ] Show progress bars for regular users
- [ ] Add warning states (80%+ usage)
- [ ] Link to pricing page (hide for admins)

### Step 5: Pricing Page
- [ ] Create `/app/pricing/page.tsx`
- [ ] Display all plan tiers
- [ ] Highlight current plan
- [ ] Add "Upgrade" buttons

---

## 🎯 Expected User Flow (After Implementation)

### Regular User (Starter Plan)
1. **User signs up** → Assigned "Starter" plan (5 forms, 10 rules, 10k submissions)
2. **User creates 5 forms** → ✅ Allowed
3. **User tries to create 6th form** → ❌ Blocked with: "Upgrade to Pro to add more forms"
4. **User creates 10 logic rules** → ✅ Allowed
5. **User tries to create 11th rule** → ❌ Blocked with: "Upgrade to Pro to add more rules"
6. **User receives 9,999 submissions** → ✅ All saved
7. **User receives 10,000th submission** → ⚠️ Warning email sent
8. **User receives 10,001st submission** → ❌ Blocked (gracefully)
9. **User clicks "Upgrade to Pro"** → Stripe checkout → Plan updated → Limits increased

### Admin User (is_admin = true)
1. **Admin signs up/logs in** → `is_admin: true` in Xano
2. **Admin creates 100 forms** → ✅ Allowed (unlimited)
3. **Admin creates 500 logic rules** → ✅ Allowed (unlimited)
4. **Admin receives 1,000,000 submissions** → ✅ All saved (unlimited)
5. **Admin bypasses ALL plan limits** → ✅ Full access to everything
6. **Dashboard shows "Admin - Unlimited Access"** → No usage bars/limits shown

---

## 💡 Quick Wins

### 1. Add Plan Info to Dashboard (5 minutes)
```tsx
// nextjs-app/app/dashboard/page.tsx
const [userPlan, setUserPlan] = useState(null);

useEffect(() => {
  fetch('/api/user/plan').then(res => res.json()).then(setUserPlan);
}, []);

// Display in UI
{userPlan && (
  <div className="bg-blue-50 border border-blue-200 rounded p-3">
    <div className="text-sm font-medium">Current Plan: {userPlan.plan_name}</div>
    <div className="text-xs text-gray-600">
      {forms.length}/{userPlan.max_forms} forms · 
      {totalRules}/{userPlan.max_logic_rules} rules
    </div>
  </div>
)}
```

### 2. Add Simple Form Limit Check (10 minutes)
```tsx
// nextjs-app/app/dashboard/page.tsx
async function createNewForm() {
  const res = await fetch('/api/forms/check-limit');
  if (!res.ok) {
    const error = await res.json();
    alert(error.message + '\n\nUpgrade to add more forms!');
    return;
  }
  // Proceed with form creation...
}
```

---

## 🔐 Security Notes

- ✅ **Tokens stored server-side** (not in browser)
- ✅ **User passwords hashed** (Xano auth table)
- ✅ **Plan limits enforced server-side** (not just UI)
- ✅ **Admin bypass** (is_admin users have unlimited access)
- ⚠️ **Need to validate user owns form/rule** before allowing edits

## 👑 Admin Bypass Implementation

Every plan enforcement check should follow this pattern:

```typescript
async function checkPlanLimit(user: User, limitType: 'forms' | 'rules' | 'submissions') {
  // ✅ ADMIN BYPASS: Always allow if user is admin
  if (user.is_admin) {
    return { allowed: true, isAdmin: true };
  }
  
  // Regular user: Check plan limits
  const userPlan = await getUserPlan(user.plan_id);
  const currentCount = await getCurrentCount(user.id, limitType);
  const maxLimit = limitType === 'forms' ? userPlan.max_forms 
                : limitType === 'rules' ? userPlan.max_logic_rules
                : userPlan.max_submissions;
  
  if (currentCount >= maxLimit) {
    return { 
      allowed: false, 
      isAdmin: false,
      message: `Your ${userPlan.plan_name} plan allows ${maxLimit} ${limitType}. Upgrade to add more.`
    };
  }
  
  return { allowed: true, isAdmin: false };
}
```

**UI Considerations for Admins**:
- Show "Admin - Unlimited Access" badge in dashboard
- Don't show usage progress bars (or show "∞/∞")
- Don't show upgrade prompts
- Indicate admin status in header/profile

---

## 🎉 What You're Doing Right

1. **Server-side token storage** (secure!)
2. **Xano backend ready** (all tables exist!)
3. **User auth already built** (just need to connect it!)
4. **Plan structure defined** (clear limits!)

**You're 60% of the way there!** Just need to connect the dots and enforce the limits! 🚀

