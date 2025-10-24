# Create Xano Notification API Endpoints - Step by Step

Follow these steps **exactly** to create all 5 API endpoints for the notification system.

---

## 📋 Prerequisites

- You've already created the `notification_setting` table in Xano
- You're logged into your Xano workspace

---

## 🔧 Step 1: GET All Notification Settings

### Create the Endpoint:
1. Go to **API** in the left sidebar
2. Click **Add API Endpoint**
3. Set **Method**: `GET`
4. Set **Path**: `/notification_setting`
5. Click **Add Endpoint**

### Configure the Response:
1. In the Function Stack (right side), click **Add step** → **Database Request**
2. Configure:
   - **Type**: Query all records
   - **Table**: `notification_setting`
3. Leave filters empty (we want all records)
4. Click **Save**

**Test it**: Click the **Play** button - you should see an empty array `[]` or your test data.

---

## 🔧 Step 2: GET Notification by Form ID

### Create the Endpoint:
1. Click **Add API Endpoint**
2. Set **Method**: `GET`
3. Set **Path**: `/notification_setting/by_form/{form_id}`
4. Click **Add Endpoint**

### Add Path Parameter:
1. In **Inputs** section, you should see `form_id` automatically detected
2. Set type to **Integer**

### Configure the Response:
1. Click **Add step** → **Database Request**
2. Configure:
   - **Type**: Query all records
   - **Table**: `notification_setting`
   - **Add Filter**: 
     - Field: `form_id`
     - Operator: `=`
     - Value: Click the variable icon → Select `form_id` from inputs
3. Click **Add step** → **Return**
4. In the return step, add this expression:
   ```
   item
   ```
   Where `item` is the result from the database query (use the variable picker)
5. Transform to return **First item only** (there's usually a `.first()` function or similar)

**Alternative simpler approach**:
- Just use the Query with filter
- Return the full query result
- Your app will handle getting the first item

**Test it**: Use a test `form_id` like `1` or `4` (whichever you have in your `form` table)

---

## 🔧 Step 3: GET Notification by ID

### Create the Endpoint:
1. Click **Add API Endpoint**
2. Set **Method**: `GET`
3. Set **Path**: `/notification_setting/{notification_setting_id}`
4. Click **Add Endpoint**

### Add Path Parameter:
1. `notification_setting_id` should auto-detect
2. Set type to **Integer**

### Configure the Response:
1. Click **Add step** → **Database Request**
2. Configure:
   - **Type**: Get record
   - **Table**: `notification_setting`
   - **Record ID**: Click variable icon → Select `notification_setting_id`
3. Click **Save**

**Test it**: Use a test notification ID (if you have any rows in the table)

---

## 🔧 Step 4: POST Create Notification

### Create the Endpoint:
1. Click **Add API Endpoint**
2. Set **Method**: `POST`
3. Set **Path**: `/notification_setting`
4. Click **Add Endpoint**

### Add Body Parameters:
In the **Inputs** section, add these:
1. `form_id` - Integer - Required
2. `user_id` - Integer - Required
3. `admin_routes` - JSON - Required
4. `user_routes` - JSON - Required
5. `admin_fallback_email` - Text - Optional
6. `user_fallback_email` - Text - Optional

### Configure the Function:
1. Click **Add step** → **Database Request**
2. Configure:
   - **Type**: Add record
   - **Table**: `notification_setting`
   - **Map fields**:
     - `form_id` → input.form_id
     - `user_id` → input.user_id
     - `admin_routes` → input.admin_routes
     - `user_routes` → input.user_routes
     - `admin_fallback_email` → input.admin_fallback_email
     - `user_fallback_email` → input.user_fallback_email
3. The `created_at` field should auto-populate
4. Click **Save**

**Test it**: Use the test panel with:
```json
{
  "form_id": 4,
  "user_id": 1,
  "admin_routes": [],
  "user_routes": [],
  "admin_fallback_email": "admin@test.com",
  "user_fallback_email": null
}
```

---

## 🔧 Step 5: PATCH Update Notification

### Create the Endpoint:
1. Click **Add API Endpoint**
2. Set **Method**: `PATCH`
3. Set **Path**: `/notification_setting/{notification_setting_id}`
4. Click **Add Endpoint**

### Add Parameters:
**Path param**:
- `notification_setting_id` - Integer

**Body params** (all optional):
1. `admin_routes` - JSON - Optional
2. `user_routes` - JSON - Optional
3. `admin_fallback_email` - Text - Optional
4. `user_fallback_email` - Text - Optional

### Configure the Function:
1. Click **Add step** → **Database Request**
2. Configure:
   - **Type**: Edit record
   - **Table**: `notification_setting`
   - **Record ID**: `notification_setting_id`
   - **Map fields** (only the ones provided):
     - `admin_routes` → input.admin_routes
     - `user_routes` → input.user_routes
     - `admin_fallback_email` → input.admin_fallback_email
     - `user_fallback_email` → input.user_fallback_email
     - `updated_at` → now() (set to current timestamp)
3. Click **Save**

**Test it**: Update an existing notification with new routes

---

## 🔧 Step 6: DELETE Notification

### Create the Endpoint:
1. Click **Add API Endpoint**
2. Set **Method**: `DELETE`
3. Set **Path**: `/notification_setting/{notification_setting_id}`
4. Click **Add Endpoint**

### Add Path Parameter:
- `notification_setting_id` - Integer

### Configure the Function:
1. Click **Add step** → **Database Request**
2. Configure:
   - **Type**: Delete record
   - **Table**: `notification_setting`
   - **Record ID**: `notification_setting_id`
3. Click **Save**

**Test it**: Delete a test notification

---

## ✅ Verification Checklist

Once you've created all 5 endpoints, verify:

- [ ] `GET /notification_setting` - Returns array
- [ ] `GET /notification_setting/by_form/{form_id}` - Returns notification for specific form
- [ ] `GET /notification_setting/{notification_setting_id}` - Returns single notification
- [ ] `POST /notification_setting` - Creates new notification
- [ ] `PATCH /notification_setting/{notification_setting_id}` - Updates notification
- [ ] `DELETE /notification_setting/{notification_setting_id}` - Deletes notification

---

## 🎯 Quick Test After Setup

Run this in your browser (replace with your actual Xano API URL):

```
https://YOUR_XANO_INSTANCE.xano.io/api:YOUR_API_KEY/notification_setting
```

You should see an array response (empty or with data).

---

## 🚨 Common Issues

**Issue**: "Table not found"
- **Fix**: Make sure the table name is exactly `notification_setting` (with underscore, singular)

**Issue**: "Field doesn't exist"
- **Fix**: Double-check the field names match your table schema exactly

**Issue**: Path parameter not detected
- **Fix**: Make sure you're using curly braces `{parameter_name}` in the path

---

## 📞 What to Do Next

After creating all endpoints:
1. Test each one using Xano's built-in test panel
2. Come back to the chat and say "endpoints are ready"
3. I'll help you test the full notification flow!








