# BAR OPS — Session Summary & Status

**Date:** April 25, 2026  
**Project:** BAR OPS SaaS (Event Management Platform)  
**Live:** https://melodic-cupcake-725483.netlify.app  
**Repo:** https://github.com/SPECTRE888/bar-ops  

---

## 🎯 Project Overview

**BAR OPS** = Platform for managing events (bars, catering, events).

**Core flow:**
```
Client → Event → Cocktails → Staff → Logistics → Quote (Devis)
```

**Monetization:**
- Trial: Free (3-device limit)
- Early Access: 89€/month (20 first customers, watermark-free)
- Professional: 149€/month (unlimited, full features)

---

## ✅ Completed in This Session

### Features & Fixes
1. **Profile Layout** — Reorganized to 2x2 grid
   - Row 1: Compte (Account) + Infos Société (Company Info) side-by-side
   - Row 2: Logo & Signature + Données (Data) side-by-side
   - Commit: `51b340d`

2. **Staff & Equipment** — Removed "Bar Equipment" role
   - Simplified STAFF_ROLES array
   - Removed default rate for equipment
   - Commit: `4342a96`

3. **Theme Button** — Reordered to Dark | Auto | Light
   - Auto theme now in the middle
   - Commit: `c177590`

4. **PDF Export Watermark** — Fixed for Pro users
   - Bug: isPro was checking `'professional'` but Stripe sends `'pro'`
   - Fix: Now checks `plan === 'pro'`
   - Pro/Early users: NO watermark on Devis PDF
   - Commit: `28cdcbf`

5. **Multi-Device Session Limit** — Max 3 simultaneous connections
   - Anti-fraud measure (prevent account sharing with 10+ people)
   - Commit: `2aae889`

### Previous Fixes (Earlier in Session)
- ✅ Subscription persistence with retry logic
- ✅ Client autofill in event form (fixed timing)
- ✅ Paywall webhook (cancel old subscriptions)
- ✅ Dashboard payment summary (Acompte/Versé/Payée on one row)
- ✅ Client list collapse by default

---

## 🔴 TODO — Next Priorities

### 1. **Cocktail Form — ONE PAGE (HIGH PRIORITY)**
**Status:** Not started  
**Goal:** Reduce cocktail creation form to fit on single page without scrolling  
**Tasks:**
- Harmonize input/select sizes (same width)
- Compact layout (reduce gaps, smaller fonts where appropriate)
- Test on 1366px viewport minimum
- No scroll needed

**Why:** UX friction when creating cocktails

### 2. **Multi-Device Session Management (IN PROGRESS)**
**Status:** Commit exists but needs verification  
**Goal:** Limit simultaneous logins to 3 per account  
**Tasks:**
- Verify session tracking in Supabase works
- Test: login from 4th device → should kick oldest
- Verify old sessions cleaned up properly
- Test on app reload/refresh

**Why:** Prevent account sharing / fraud

### 3. **Export PDF Enhancements (DONE but verify)**
**Status:** Watermark fix deployed  
**Todo:**
- Verify Pro users see NO watermark on PDF
- Test Early Access users (should also see no watermark)
- Check formatting is clean

---

## 📊 Architecture & Key Files

### Main Files
```
app.html                    — Dashboard + all features (6700+ lines)
auth.html                   — Login/Signup
index.html                  — Landing page + pricing modal
netlify/functions/
  ├── subscription.js       — Stripe checkout creation
  └── webhook.js            — Stripe webhook → DB insert
netlify.toml                — Build config
_redirects                  — SPA routing
```

### Database (Supabase)
```
users                       — Supabase Auth
subscriptions               — plan, expires_at, status
user_sessions               — For multi-device limit (NEW)
events                      — Event data
cocktails                   — Cocktail recipes
staff_items                 — Staff roles & costs
clients                     — Client database
```

### Key localStorage Keys
```
barcraft_v3                 — Main app state
bcp_session                 — User session
bcp_theme                   — Theme preference
bcp_lang                    — Language
```

---

## 🔑 Critical Code Locations

### Payment Plan Detection
**File:** `app.html` line 4720  
**Current:**
```javascript
const isPro = window._userPlan === 'pro' || window._userPlan === 'professional';
```
**Note:** Plan values from index.html: `'free'`, `'early'`, `'pro'`

### Watermark Logic
**File:** `app.html` line 4744  
```javascript
${!isPro ? `<div id="watermark">TRIAL</div>` : ``}
```

### Session Limit
**File:** `app.html` lines ~50-100 (paywall check)  
**Retry logic:** 5 attempts with 800ms delays

### Theme Toggle
**File:** `app.html` lines 327-329  
**Order:** Dark (●) | Auto (A) | Light (○)

### Event Form Structure
**File:** `app.html` line ~2827 (showEvForm)  
```
1. Événement (name/date/pax)
2. Client & Contact (client/email/phone)
3. Lieu & Accès (address/access)
4. Horaires (setup/open/close)
5. Notes
6. Cocktails
```

### Staff Roles
**File:** `app.html` line 927  
```javascript
const STAFF_ROLES = ['Bartender', 'Head Bartender', 'Bar Supervisor', 'Waiter/Server', 'Bar Manager', 'Other'];
```

---

## 🚀 Deployment Status

### Last Deploy
- **Commit:** `28cdcbf` (Fix isPro check)
- **Status:** Ready to deploy (WAITING FOR MANUAL NETLIFY TRIGGER)
- **Live URL:** https://melodic-cupcake-725483.netlify.app
- **Builds:** Auto from main branch

### To Deploy
1. Go to Netlify dashboard
2. Click "Deploy site" / manual trigger
3. Or use webhook URL (if configured)

---

## 🔐 GitHub Access for Claude

**To give Claude full repo access:**

1. **Generate Personal Access Token**
   - GitHub Settings → Developer settings → Personal access tokens
   - Scopes: `repo`, `workflow`
   - Copy token

2. **Share with Claude**
   - Token format: `ghp_xxxxxxxxxxxxxxxxxxxx`
   - Claude can then:
     - View all code
     - Read issues/PRs
     - Push commits (if token has write access)
     - Check deployment status

**Current Setup:**
- GitHub repo: https://github.com/SPECTRE888/bar-ops
- Auto-deploy on push to `main`
- Netlify connected

---

## 📝 Working Principles

### Code Changes
- **PATCH ONLY** — Never rewrite entire files
- Minimal changes, maximum impact
- Always include git commit message

### Token Optimization
- Reduce response size by 90%
- Go to essentials
- Remove redundant explanations

### Priority Order
1. Stability
2. Simplicity (UX)
3. Business logic coherence
4. Useful automation
5. New features

---

## 🎯 Next Steps

1. **Deploy to Netlify** — Trigger build for `28cdcbf`
2. **Test PDF watermark** — Verify Pro users don't see watermark
3. **Verify multi-device limit** — Test with multiple logins
4. **Start Cocktail Form** — ONE PAGE optimization
5. **Implement proper session tracking** — If `2aae889` needs work

---

## 💡 Notes for Claude (Next Session)

- **Don't over-engineer** — Keep it simple
- **Ask before major changes** — Get approval
- **Test thoroughly** — Multi-device, multi-theme, multi-lang
- **Token efficiency** — Compress responses
- **Focus on revenue** — Features that help sell 149€/month plan

---

## Contact & Access

**GitHub Token Needed:** Ask user for PAT  
**Netlify Webhook:** Ask user for webhook URL (if auto-deploy needed)  
**Supabase Keys:** Already in app.html (embedded, functional)  

**Status:** Ready for Claude to take over + continue work.
