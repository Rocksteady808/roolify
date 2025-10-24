# Xano Complete Setup Checklist

Complete these steps to finish setting up your Xano database for the app to work properly.

---

## ✅ Checklist

### 1. Form Table - Add Missing Columns ⚠️ CRITICAL

**Problem**: Notifications aren't working because the `form` table is missing `html_form_id` and `site_id` columns.

**Fix**: Follow `XANO_FORM_TABLE_FIX.md`

**Status**: 
- [ ] Added `html_form_id` column (text, required, unique)
- [ ] Added `site_id` column (text, required)
- [ ] Updated GET `/form` endpoint to return new fields

---

### 2. Notification Setting Table

**Status**: 
- [x] Table created ✅ (you did this!)
- [x] 5 CRUD endpoints created ✅

---

### 3. Plans Table - Add Plan Data ⚠️ NEEDED

**Problem**: Your plans page is loading but there's no plan data in Xano yet.

**Fix (EASIEST WAY - Nice UI)**: 
1. Make sure you have `POST /plan` endpoint in Xano (see below)
2. Visit: `http://localhost:1337/setup-plans`
3. Click the big button
4. Done! All 4 plans will be created automatically

**Fix (Manual Way)**: Follow `XANO_PLANS_SETUP.md` to add each plan manually

**First**: Create POST endpoint in Xano:
- Go to Xano → API
- Click "Add API Endpoint"
- **Method**: `POST`
- **Path**: `/plan`
- In Function Stack:
  - Add step → Database Request
  - **Type**: Add new record
  - **Table**: `plan`
  - Map all input fields (plan_name, max_forms, etc.)

**Status**:
- [ ] Created `POST /plan` endpoint in Xano
- [ ] Visited `/api/seed-plans` to auto-create all plans

---

### 4. User Table - Add `plan_id` Column

**Problem**: Users need to be assigned to plans.

**Fix**:
1. Go to Xano → Database → `user` table
2. Click **"+ Add Column"**
3. **Column Name**: `plan_id`
4. **Type**: `integer`
5. **Required**: ✅ Yes
6. **Default Value**: `1` (Free plan ID)
7. Click **"Add Column"**

**Status**:
- [ ] Added `plan_id` column to `user` table

---

## 🎯 Priority Order

Do these in this order for fastest results:

1. **Form Table Columns** (5 min) → Fixes notifications
2. **Plans Data** (5 min) → Shows plans on plans page
3. **User plan_id** (2 min) → Links users to plans

---

## 🧪 How to Test

After completing all steps:

### Test 1: Notifications
1. Fill out a form on your published site
2. Check terminal logs - should see:
   ```
   [Notifications API] Form found in Xano!
   [Notifications API] html_form_id: wf-form-Country-Form
   ```

### Test 2: Plans
1. Go to `http://localhost:1337/plans`
2. Should see all 4 plans (Free, Starter, Pro, Agency)

### Test 3: Usage Stats
1. Go to `http://localhost:1337/dashboard`
2. Should see usage stats with plan limits

---

## ❓ Need Help?

If you get stuck on any step, let me know which one and I'll walk you through it!

