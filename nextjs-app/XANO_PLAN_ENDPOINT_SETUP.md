# Create Xano Plan POST Endpoint - Step by Step

This guide shows you how to create the `POST /plan` endpoint in Xano so you can use the one-click setup.

**Time**: ~3 minutes

---

## Step 1: Go to Xano API Section

1. Open Xano
2. Click **"API"** in the left sidebar
3. Click **"+ Add API Endpoint"**

---

## Step 2: Configure the Endpoint

In the endpoint settings:

- **Method**: `POST`
- **Path**: `/plan`
- Click **"Add Endpoint"**

---

## Step 3: Add Input Parameters

On the right side, in the **"Inputs"** section, click **"+ Add Input"** for each of these:

### Input 1: plan_name
- **Name**: `plan_name`
- **Type**: `text`
- **Required**: ✅ Yes

### Input 2: max_forms
- **Name**: `max_forms`
- **Type**: `integer`
- **Required**: ✅ Yes

### Input 3: max_logic_rules
- **Name**: `max_logic_rules`
- **Type**: `integer`
- **Required**: ✅ Yes

### Input 4: max_submissions
- **Name**: `max_submissions`
- **Type**: `integer`
- **Required**: ✅ Yes

### Input 5: price_monthly
- **Name**: `price_monthly`
- **Type**: `integer`
- **Required**: ✅ Yes

### Input 6: price_annual
- **Name**: `price_annual`
- **Type**: `integer`
- **Required**: ✅ Yes

### Input 7: stripe_price_id_monthly
- **Name**: `stripe_price_id_monthly`
- **Type**: `text`
- **Required**: ❌ No

### Input 8: stripe_price_id_annual
- **Name**: `stripe_price_id_annual`
- **Type**: `text`
- **Required**: ❌ No

### Input 9: is_active
- **Name**: `is_active`
- **Type**: `boolean`
- **Required**: ✅ Yes

---

## Step 4: Add Database Request

In the **"Function Stack"** (main area):

1. Click **"+ Add step"** → **"Database Request"**
2. Configure:
   - **Type**: `Add new record`
   - **Table**: `plan`

3. **Map the fields** (click each field and select the matching input):
   - `plan_name` → Select `plan_name` input
   - `max_forms` → Select `max_forms` input
   - `max_logic_rules` → Select `max_logic_rules` input
   - `max_submissions` → Select `max_submissions` input
   - `price_monthly` → Select `price_monthly` input
   - `price_annual` → Select `price_annual` input
   - `stripe_price_id_monthly` → Select `stripe_price_id_monthly` input
   - `stripe_price_id_annual` → Select `stripe_price_id_annual` input
   - `is_active` → Select `is_active` input

4. Click **"Save"**

---

## Step 5: Set the Response

The endpoint should automatically return the created plan record. You're done!

Click **"Save"** at the top right.

---

## Step 6: Test It (Optional)

Click the **"Play"** button to test:

1. Fill in test values:
   ```
   plan_name: "Test Plan"
   max_forms: 10
   max_logic_rules: 100
   max_submissions: 5000
   price_monthly: 29
   price_annual: 290
   is_active: true
   ```

2. Click **"Run"**

3. You should see a success response with the created plan

4. **Delete the test record** from your `plan` table (we'll create the real ones next)

---

## Step 7: Use the One-Click Setup

Now that the endpoint is ready:

1. Go to: `http://localhost:1337/setup-plans`
2. Click **"Create All Plans in Xano"**
3. Done! All 4 plans (Free, Starter, Pro, Agency) will be created

---

## What This Endpoint Does

When you click the button on `/setup-plans`, the app will call this endpoint 4 times (once for each plan) with the proper data:

1. Free: 1 form, 100 submissions, $0/mo
2. Starter: 5 forms, 1K submissions, $19/mo
3. Pro: 25 forms, 10K submissions, $49/mo
4. Agency: 100 forms, 50K submissions, $99/mo

---

## Troubleshooting

### Error: "Table not found"
Make sure your `plan` table exists in Xano with all the required columns.

### Error: "Field not found"
Check that all column names in your `plan` table match exactly:
- `plan_name` (text)
- `max_forms` (integer)
- `max_logic_rules` (integer)
- `max_submissions` (integer)
- `price_monthly` (integer)
- `price_annual` (integer)
- `stripe_price_id_monthly` (text)
- `stripe_price_id_annual` (text)
- `is_active` (boolean)

---

## Next Steps

After successfully creating the plans, users need to be assigned to a plan. Add a `plan_id` column to your `user` table (see `XANO_COMPLETE_SETUP_CHECKLIST.md`).








