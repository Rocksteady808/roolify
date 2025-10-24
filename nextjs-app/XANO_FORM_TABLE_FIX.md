# Fix Xano Form Table - Add Missing Columns

## The Problem

Your Xano `form` table is missing 2 critical columns:
- `html_form_id` (stores the Webflow form ID like "wf-form-Country-Form")
- `site_id` (stores the site ID like "68bc42f58e22a62ce5c282e0")

Without these, the notification system can't match forms to their settings!

---

## Step 1: Go to Your Form Table

1. Open Xano
2. Click **"Database"** in the left sidebar
3. Find and click on the **`form`** table

---

## Step 2: Add the `html_form_id` Column

1. Click the **"+ Add Column"** button at the top right
2. Fill in the details:
   - **Column Name**: `html_form_id`
   - **Type**: Select **"text"**
   - **Required**: ✅ Check this box
   - **Unique**: ✅ Check this box (important!)
3. Click **"Add Column"**

---

## Step 3: Add the `site_id` Column

1. Click the **"+ Add Column"** button again
2. Fill in the details:
   - **Column Name**: `site_id`
   - **Type**: Select **"text"**
   - **Required**: ✅ Check this box
   - **Unique**: ❌ Leave this unchecked (multiple forms can be on the same site)
3. Click **"Add Column"**

---

## Step 4: Update the GET /form Endpoint

Now we need to make sure the API endpoint returns these new fields:

1. Go to **API** in the left sidebar
2. Find your **`GET /form`** endpoint and click it
3. In the **Function Stack** (right side), find the **"Query all records"** step
4. Click on it to expand
5. Make sure **"Return all fields"** is selected (or manually select all fields including the new ones)
6. Click **"Save"**

---

## Step 5: Update the POST /form/sync Endpoint (if you have it)

If you created the `/form/sync` endpoint from earlier:

1. Go to **API** → Find **`POST /form/sync`**
2. Make sure the **Inputs** section includes:
   - `html_form_id` (text, from body)
   - `site_id` (text, from body)
   - `name` (text, from body)
   - `user_id` (integer, from body)

If you don't have this endpoint yet, that's fine - the webhook will create one automatically!

---

## Step 6: Test It!

1. **Go back to your app**: `http://localhost:1337`
2. **Fill out any form** on your published Webflow site
3. **Check the terminal logs** - you should now see:
   ```
   [Notifications API] Form found in Xano!
   [Notifications API] html_form_id: wf-form-Country-Form
   ```

4. **Check Xano** - go to your `form` table and you should see the new columns populated!

---

## Current Table Schema (After Fix)

Your `form` table should now have these columns:

| Column Name | Type | Required | Unique |
|-------------|------|----------|--------|
| `id` | integer | ✅ | ✅ |
| `created_at` | timestamp | ✅ | ❌ |
| `name` | text | ✅ | ❌ |
| `user_id` | integer | ✅ | ❌ |
| `html_form_id` | text | ✅ | ✅ |
| `site_id` | text | ✅ | ❌ |

---

## What Happens Next?

Once you add these columns:
1. When someone submits a form, the webhook will automatically populate these fields
2. The notification system will be able to find forms by their `html_form_id`
3. Email notifications will start working!

---

## Need Help?

If you get stuck on any step, just let me know which step you're on and I'll guide you through it!








