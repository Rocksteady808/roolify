# Plan Display Fixes

## Issues Found

1. **404 Error on "Change Plan"** - Profile page linked to `/billing` which doesn't exist
2. **Wrong Plan Displayed in Profile** - Always showed first plan from database instead of user's actual plan  
3. **Inconsistent Plan Display** - Plans page and Profile page showed different plans

## Fixes Applied

### 1. Fixed 404 Error
**File:** `app/profile/page.tsx`

Changed the "Change Plan" button to redirect to the correct page:

```typescript
// Before:
onClick={() => router.push('/billing')}

// After:
onClick={() => router.push('/plans')}
```

### 2. Fixed Profile Page Plan Display
**File:** `app/profile/page.tsx`

Updated the `useEffect` to properly fetch the user's actual plan based on their `plan_id`:

```typescript
// Before: Just showed first plan from database
const plans = await xanoPlans.getAll();
if (plans.length > 0) {
  setUserPlan(plans[0]); // Always showed first plan!
}

// After: Find user's actual plan by plan_id
const plans = await xanoPlans.getAll();
const userPlanId = user?.plan_id || 1; // Default to Free plan (ID 1)
const currentPlan = plans.find(p => p.id === userPlanId) || plans[0];
```

Also added a fallback Free plan structure in case of errors:

```typescript
const fallbackPlan: Plan = {
  id: 1,
  plan_name: 'Free',
  price: 0,
  max_forms: 1,
  max_submissions: 100,
  max_logic_rules: 2,
  features: ['Up to 1 forms', 'Up to 100 submissions', 'Up to 2 logic rules']
};
```

### 3. Fixed Plans Page Plan Display
**File:** `app/plans/page.tsx`

Replaced localStorage-based user fetching with proper `useAuth()` hook:

```typescript
// Before: Complex localStorage parsing
const userStr = localStorage.getItem('user');
const user = JSON.parse(userStr);
setCurrentPlanId(1); // Always defaulted to 1

// After: Use auth context
const { user } = useAuth();

useEffect(() => {
  if (user) {
    setCurrentPlanId(user.plan_id || 1); // Use actual plan_id
  }
}, [user]);
```

## How It Works Now

1. **User logs in** → Xano auth stores user data including `plan_id`
2. **Profile page loads** → Fetches all plans, finds user's plan by `plan_id`, displays correct plan
3. **Plans page loads** → Gets user from auth context, highlights their current plan
4. **"Change Plan" clicked** → Redirects to `/plans` (not `/billing`)

## Default Behavior

- If user has no `plan_id` set: Defaults to **Free plan (ID 1)**
- If plans fail to load: Shows fallback **Free plan**
- If user not logged in: Plans page still works, just doesn't highlight current plan

## Testing

To verify the fixes:

1. **Profile Page**:
   - Visit http://localhost:3000/profile
   - Check "Your Plan" section shows **Free** plan
   - Click "Change Plan" → Should go to `/plans` (not 404)

2. **Plans Page**:
   - Visit http://localhost:3000/plans
   - Free plan should show "Current Plan" badge
   - All plan cards should display correctly

## Database Schema Requirements

The user table in Xano should have:
- `plan_id` field (integer, nullable, defaults to 1 for Free plan)

The plans table in Xano should have:
- `id` field (integer, primary key)
- Plan with `id = 1` should be the Free plan

## Future Enhancements

1. Add Stripe integration for plan upgrades
2. Add plan change history
3. Add usage tracking (forms used / max forms, etc.)
4. Add plan expiration/renewal dates
5. Add plan change confirmation modal
6. Add pro-rated billing calculations

## Related Files

- `app/profile/page.tsx` - User profile with plan display
- `app/plans/page.tsx` - Plan selection page
- `lib/xano.ts` - User interface with plan_id field
- `lib/auth.tsx` - Auth context providing user data




