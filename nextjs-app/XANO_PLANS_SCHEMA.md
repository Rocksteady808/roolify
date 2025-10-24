# Xano Plans Schema Updates

## Required Schema Changes

### 1. Update `plan` Table

Add these fields to the `plan` table (if not already present):

```
Field Name          | Type    | Description
--------------------|---------|------------------------------------------
id                  | int     | Auto-generated ID
created_at          | timestamp| Auto-generated timestamp
plan_name           | text    | Name of the plan (Starter, Pro, Agency)
max_sites           | int     | Maximum number of sites allowed
max_logic_rules     | int     | Maximum logic rules per form
max_submissions     | int     | Maximum submissions per month
price_monthly       | decimal | Monthly price
price_annual        | decimal | Annual price
stripe_product_id   | text    | Stripe product ID (for payments)
stripe_price_id_monthly | text | Stripe price ID for monthly
stripe_price_id_annual  | text | Stripe price ID for annual
is_active           | boolean | Whether plan is available
```

### 2. Add Plan Data

Insert these plans into the `plan` table:

```sql
-- Free Plan (for testing on webflow.io domains)
INSERT INTO plan (plan_name, max_sites, max_logic_rules, max_submissions, price_monthly, price_annual, is_active)
VALUES ('Free', 1, 3, 100, 0.00, 0.00, true);

-- Starter Plan
INSERT INTO plan (plan_name, max_sites, max_logic_rules, max_submissions, price_monthly, price_annual, is_active)
VALUES ('Starter', 3, 10, 10000, 29.00, 279.00, true);

-- Pro Plan
INSERT INTO plan (plan_name, max_sites, max_logic_rules, max_submissions, price_monthly, price_annual, is_active)
VALUES ('Pro', 10, 50, 50000, 49.00, 471.00, true);

-- Agency Plan
INSERT INTO plan (plan_name, max_sites, max_logic_rules, max_submissions, price_monthly, price_annual, is_active)
VALUES ('Agency', 25, 200, 100000, 99.00, 951.00, true);
```

### 3. Update `user` Table

Add these fields to the `user` table:

```
Field Name          | Type    | Description
--------------------|---------|------------------------------------------
plan_id             | int     | Foreign key to plan table
billing_cycle       | text    | 'monthly' or 'annual'
subscription_status | text    | 'active', 'trial', 'cancelled', 'expired'
trial_ends_at       | timestamp| When trial period ends
subscription_ends_at| timestamp| When subscription ends
stripe_customer_id  | text    | Stripe customer ID
current_period_start| timestamp| Start of current billing period
current_period_end  | timestamp| End of current billing period
```

### 4. Create `usage_tracking` Table (Optional but Recommended)

Track usage metrics for each user:

```
Field Name          | Type    | Description
--------------------|---------|------------------------------------------
id                  | int     | Auto-generated ID
user_id             | int     | Foreign key to user
period_start        | timestamp| Start of tracking period
period_end          | timestamp| End of tracking period
forms_count         | int     | Number of forms created
rules_count         | int     | Total rules across all forms
submissions_count   | int     | Number of submissions received
created_at          | timestamp| When record was created
```

## API Endpoints to Create

### 1. Get User's Current Plan

**Endpoint**: `GET /api/user/plan`

**Response**:
```json
{
  "plan": {
    "id": 1,
    "plan_name": "Starter",
    "max_forms": 5,
    "max_logic_rules": 10,
    "max_submissions": 10000,
    "price_monthly": 39,
    "price_annual": 374
  },
  "billing_cycle": "monthly",
  "subscription_status": "active",
  "usage": {
    "forms_count": 3,
    "rules_count": 12,
    "submissions_count": 1247
  }
}
```

### 2. Get All Available Plans

**Endpoint**: `GET /api/plans`

**Response**:
```json
{
  "plans": [
    {
      "id": 1,
      "plan_name": "Starter",
      "max_forms": 5,
      "max_logic_rules": 10,
      "max_submissions": 10000,
      "price_monthly": 39,
      "price_annual": 374
    },
    // ... more plans
  ]
}
```

### 3. Update User's Plan

**Endpoint**: `POST /api/user/plan`

**Request**:
```json
{
  "plan_id": 2,
  "billing_cycle": "annual"
}
```

### 4. Get Usage Statistics

**Endpoint**: `GET /api/user/usage`

**Response**:
```json
{
  "period_start": "2025-10-01T00:00:00Z",
  "period_end": "2025-10-31T23:59:59Z",
  "forms_count": 3,
  "rules_count": 12,
  "submissions_count": 1247,
  "limits": {
    "max_forms": 5,
    "max_logic_rules": 10,
    "max_submissions": 10000
  },
  "percentage_used": {
    "forms": 60,
    "rules": 24,
    "submissions": 12.47
  }
}
```

## Integration Steps

1. **Create/Update Xano Tables** - Use the Xano interface to add the fields listed above

2. **Insert Plan Data** - Add the three plans (Starter, Pro, Agency) to the plan table

3. **Update Auth Endpoint** - Modify the `/auth/me` endpoint to include plan information

4. **Create Plan Endpoints** - Add endpoints for fetching plans and usage data

5. **Add Default Plan** - When users sign up, assign them to a default plan (or trial)

6. **Update App** - The Next.js app will fetch this data and enforce limits

## Testing Checklist

- [ ] Plan table has all required fields
- [ ] Three plans inserted correctly with pricing
- [ ] User table has plan_id field
- [ ] Auth endpoint returns plan data
- [ ] Can fetch all plans via API
- [ ] Usage tracking works correctly
- [ ] Limit enforcement logic in place

## Notes

- Default new users to Free plan
- Free plan only works on webflow.io domains (staging sites)
- Paid plans work on all custom domains
- Subscription management via Stripe (future implementation)
- Usage resets monthly at subscription renewal (except Free plan which has lifetime limit)
- Graceful degradation if user exceeds limits (warnings before hard limits)
- Domain checking should be implemented to enforce Free plan restrictions

