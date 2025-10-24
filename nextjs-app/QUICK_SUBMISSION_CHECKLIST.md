# Webflow Marketplace Submission - Quick Checklist

Use this checklist to track your progress toward submitting Roolify to the Webflow Marketplace.

---

## ✅ Phase 1: Legal & Documentation (COMPLETE)

- [x] Privacy Policy page created and accessible at `/privacy`
- [x] Terms of Service page created and accessible at `/terms`
- [x] Footer component with legal links added to all pages
- [x] Support email configured (info@roolify.com)
- [x] Support contact page created at `/support`

---

## ✅ Phase 2: Error Handling (COMPLETE)

- [x] OAuth error page enhanced with support contact
- [x] Global error boundary created
- [x] User-friendly error messages implemented
- [x] Contact support links added to error pages

---

## ✅ Phase 3: Documentation (COMPLETE)

- [x] In-app documentation created at `/docs`
- [x] Getting started guide
- [x] Feature tutorials
- [x] Troubleshooting section
- [x] Marketplace listing document (`MARKETPLACE_LISTING.md`)

---

## ⏳ Phase 4: Visual Assets (PENDING)

- [ ] **App Logo** (900x900px PNG with transparent background)
  - Save to: `public/marketplace/logo-900x900.png`
  - Professional design representing form logic/automation

- [ ] **Publisher Logo** (20x20px PNG)
  - Save to: `public/marketplace/publisher-logo-20x20.png`
  - Favicon-sized version

- [ ] **Screenshots** (1280x846px, minimum 4)
  - [ ] Screenshot 1: Dashboard with connected sites
  - [ ] Screenshot 2: Rule Builder interface
  - [ ] Screenshot 3: Notifications settings
  - [ ] Screenshot 4: Submissions viewer
  - [ ] Screenshot 5: Designer Extension (optional)
  - Save to: `public/marketplace/screenshot-{1-5}.png`

- [ ] **Favicon** Update
  - Replace: `app/favicon.ico`
  - Use Roolify branding

---

## ⏳ Phase 5: Production Deployment (PENDING)

### 5.1 GitHub Setup
- [ ] Create GitHub repository (if not exists)
- [ ] Push all code to GitHub
- [ ] Ensure `.env.local` is in `.gitignore`

### 5.2 Vercel Deployment
- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Configure environment variables:
  - [ ] `NEXT_PUBLIC_APP_URL` (your production URL)
  - [ ] `NEXT_PUBLIC_REDIRECT_URI` (production OAuth callback)
  - [ ] `WEBFLOW_CLIENT_ID`
  - [ ] `WEBFLOW_CLIENT_SECRET`
  - [ ] `NEXT_PUBLIC_XANO_AUTH_BASE_URL`
  - [ ] `NEXT_PUBLIC_XANO_MAIN_BASE_URL`
  - [ ] `SUPPORT_EMAIL=info@roolify.com`
  - [ ] `NODE_ENV=production`
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Test production URL

### 5.3 Webflow Developer Portal
- [ ] Log in to https://developers.webflow.com/
- [ ] Update OAuth redirect URI to production URL
- [ ] Update app homepage URL
- [ ] Upload Designer Extension bundle (`webflow-extension/bundle.zip`)
- [ ] Save changes

---

## ⏳ Phase 6: Testing (PENDING)

### 6.1 End-to-End Testing
- [ ] User signup/login flow works
- [ ] OAuth connection to Webflow successful
- [ ] Connected site appears in dashboard
- [ ] Forms sync from Webflow correctly
- [ ] Can create and save conditional rules
- [ ] Rules execute on form submission
- [ ] Email notifications send correctly
- [ ] Form submissions appear in dashboard
- [ ] Designer Extension loads in Webflow
- [ ] Plan limits enforce correctly
- [ ] Error messages display properly
- [ ] All pages mobile responsive

### 6.2 Cross-Browser Testing
- [ ] Chrome (latest version)
- [ ] Firefox (latest version)
- [ ] Safari (latest version)
- [ ] Microsoft Edge (latest version)

### 6.3 Security Audit
- [ ] No sensitive data in client-side code
- [ ] All API routes require authentication
- [ ] User data properly isolated
- [ ] CORS configured correctly
- [ ] HTTPS enforced

---

## ⏳ Phase 7: Demo Video (PENDING)

- [ ] **Script Demo Video** (2-5 minutes)
  - [ ] Introduction (30 seconds)
    - Problem statement
    - Roolify solution
  - [ ] Feature Demo (3 minutes)
    - Connecting Webflow site
    - Creating conditional rule
    - Installing script
    - Testing on live form
    - Viewing submissions
  - [ ] Call to Action (30 seconds)
    - Sign up for free
    - Pricing overview

- [ ] **Record Video**
  - Tool: Loom, ScreenFlow, or OBS Studio
  - Quality: 1080p minimum
  - Audio: Clear narration

- [ ] **Edit Video**
  - Add intro/outro
  - Add captions (optional but recommended)
  - Ensure smooth transitions

- [ ] **Upload to YouTube**
  - Set to "Unlisted"
  - Add descriptive title
  - Copy video URL for submission

---

## ⏳ Phase 8: Test Account (PENDING)

- [ ] Create test account: `reviewer@roolify.com`
- [ ] Set secure password (save for submission form)
- [ ] Connect demo Webflow site
- [ ] Create 2-3 example conditional rules
- [ ] Add sample form submissions
- [ ] Test all features work correctly
- [ ] Document credentials for reviewers

---

## ⏳ Phase 9: Final Submission (PENDING)

### 9.1 Pre-Submission Verification
- [ ] All legal pages accessible at production URLs
- [ ] Support email active and monitored
- [ ] All visual assets prepared
- [ ] Demo video uploaded
- [ ] Test account ready
- [ ] Designer Extension bundle uploaded
- [ ] All features tested on production
- [ ] Documentation complete

### 9.2 Submit to Webflow
- [ ] Go to https://developers.webflow.com/submit
- [ ] Complete submission form:
  - [ ] App name: Roolify
  - [ ] Publisher name: [Your Name/Company]
  - [ ] Short description (100 chars max)
  - [ ] Long description (from MARKETPLACE_LISTING.md)
  - [ ] Feature list (5 features)
  - [ ] Categories (Forms, Automation, Productivity, etc.)
  - [ ] Website URL (production)
  - [ ] Privacy Policy URL
  - [ ] Terms of Service URL
  - [ ] Support email
  - [ ] Documentation URL
- [ ] Upload visual assets:
  - [ ] App logo (900x900px)
  - [ ] Publisher logo (20x20px)
  - [ ] Screenshots (4+ images)
- [ ] Add demo video URL
- [ ] Provide test account credentials
- [ ] Add special instructions for reviewers
- [ ] Include pricing information
- [ ] Submit for review

---

## 📊 Progress Tracker

**Overall Progress: 50%**

| Category | Complete | Total | % |
|----------|----------|-------|---|
| Legal & Docs | 5 | 5 | 100% |
| Error Handling | 3 | 3 | 100% |
| Documentation | 4 | 4 | 100% |
| Visual Assets | 0 | 5 | 0% |
| Deployment | 0 | 6 | 0% |
| Testing | 0 | 17 | 0% |
| Demo Video | 0 | 4 | 0% |
| Test Account | 0 | 7 | 0% |
| Submission | 0 | 15 | 0% |

**Total: 12 / 66 tasks complete**

---

## ⏱️ Estimated Time Remaining

- **Visual Assets:** 1 day (design/capture)
- **Deployment:** 0.5 days (setup + testing)
- **Testing:** 1 day (thorough QA)
- **Demo Video:** 1 day (record + edit)
- **Test Account:** 0.5 days (setup + verify)
- **Submission:** 0.5 days (form + review)

**Total: 4-5 days to submission**

---

## 🎯 Today's Priority

**Focus on Visual Assets:**
1. Design or commission app logo (900x900px)
2. Create publisher logo (20x20px)
3. Capture 4-5 screenshots of key features
4. Update favicon

**Once visual assets are ready, move to deployment.**

---

## 📞 Need Help?

- **Email:** info@roolify.com
- **Documentation:** See `WEBFLOW_SUBMISSION_PROGRESS.md` for detailed info
- **Marketplace Listing:** See `MARKETPLACE_LISTING.md` for all submission details

---

## ✨ Tips for Success

1. **Visual Assets:** Use consistent branding and colors
2. **Screenshots:** Show real data, not placeholder text
3. **Demo Video:** Keep it concise and engaging
4. **Testing:** Test on multiple devices and browsers
5. **Submission:** Be thorough - incomplete submissions get rejected

---

**Good luck with your submission! 🚀**




