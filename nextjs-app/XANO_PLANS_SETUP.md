# Add Plans Data to Xano - Quick Setup

You need to manually add the 4 plans to your Xano `plan` table. This is a one-time setup.

---

## Step 1: Go to Your Plans Table

1. Open Xano
2. Click **"Database"** in the left sidebar
3. Find and click on the **`plan`** table

---

## Step 2: Add Each Plan

Click **"+ Add new record"** for each plan below and fill in the fields:

### Plan 1: Free Plan

- **plan_name**: `Free`
- **max_sites**: `1`
- **max_logic_rules**: `5`
- **max_submissions**: `100`
- **price_monthly**: `0`
- **price_annual**: `0`
- **stripe_price_id_monthly**: Leave blank
- **stripe_price_id_annual**: Leave blank
- **is_active**: `true` ✅

Click **Save**

---

### Plan 2: Starter Plan

- **plan_name**: `Starter`
- **max_sites**: `3`
- **max_logic_rules**: `50`
- **max_submissions**: `1000`
- **price_monthly**: `29`
- **price_annual**: `279` (save 20%)
- **stripe_price_id_monthly**: Leave blank for now
- **stripe_price_id_annual**: Leave blank for now
- **is_active**: `true` ✅

Click **Save**

---

### Plan 3: Pro Plan

- **plan_name**: `Pro`
- **max_sites**: `10`
- **max_logic_rules**: `250`
- **max_submissions**: `10000`
- **price_monthly**: `49`
- **price_annual**: `471` (save 20%)
- **stripe_price_id_monthly**: Leave blank for now
- **stripe_price_id_annual**: Leave blank for now
- **is_active**: `true` ✅

Click **Save**

---

### Plan 4: Agency Plan

- **plan_name**: `Agency`
- **max_sites**: `25`
- **max_logic_rules**: `1000`
- **max_submissions**: `50000`
- **price_monthly**: `99`
- **price_annual**: `951` (save 20%)
- **stripe_price_id_monthly**: Leave blank for now
- **stripe_price_id_annual**: Leave blank for now
- **is_active**: `true` ✅

Click **Save**

---

## Step 3: Verify

Once all 4 plans are added, you should see them in your `plan` table:

| id | plan_name | max_sites | max_submissions | price_monthly |
|----|-----------|-----------|-----------------|---------------|
| 1  | Free      | 1         | 100             | $0            |
| 2  | Starter   | 3         | 1,000           | $29           |
| 3  | Pro       | 10        | 10,000          | $49           |
| 4  | Agency    | 25        | 50,000          | $99           |

---

## Step 4: Assign Default Plan to Users

Go to your `user` table and make sure the `plan_id` field exists. If it doesn't:

1. Click **"+ Add Column"**
2. **Column Name**: `plan_id`
3. **Type**: `integer`
4. **Required**: ✅ Yes
5. **Default Value**: `1` (Free plan)
6. Click **"Add Column"**

---

## Done!

Your plans are now set up. The app will:
- Show these plans on the `/plans` page
- Enforce limits based on the user's assigned plan
- Display usage stats on the dashboard

**Note**: Once you set up Stripe, you'll need to come back and add the `stripe_price_id_monthly` and `stripe_price_id_annual` values for each paid plan.








