# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

- **No build process** - vanilla HTML/JS/CSS, zero dependencies in frontend
- **Deploy** - git push to `main` → auto-deploys on Vercel (~30s)
- **Dev server** - open HTML files directly in browser (works offline with `?demo=1`)
- **Backend** - Vercel Serverless Functions in `api/` (Node.js)

## Architecture Overview

**Bar Ops** is a SaaS platform for event management (clients, cocktails, staff, billing). See `PROJECT_CONTEXT.md` for business rules.

### Frontend (Single HTML Files)
- `index.html` - Public landing page + pricing
- `auth.html` - Login/signup with Google OAuth via Supabase
- `app.html` - Main application (7500+ lines, single file by design)
- `paying.html` - Pricing page

All CSS/JS embedded inline. No modules, no build step.

### State Management
- **Local** - `state` object (global, in memory)
- **Storage** - localStorage via `save()/load()` per user (`SK` = storage key)
- **Cloud** - Supabase (auth + PostgreSQL) via `cloudPush()/cloudRequest()`
- **Demo mode** - `?demo=1` uses `freshState()`, no cloud access

### Backend (Vercel Serverless Functions)
```
api/
├── config.js         → Returns public Supabase anon key (never secrets)
├── agents.js         → Agent invite/accept/manage (routes by body.type)
├── billing.js        → Stripe portal + add-seat (routes by body.action)
├── workspace.js      → GET=workspace-pull, POST=portal-token
├── portal-public.js  → GET=portal-data, POST=portal-sign (public, no auth)
├── send-quote.js     → Quote email via SendGrid
├── webhook.js        → Stripe webhook handler
└── delete-account.js → User account deletion
```

`API_BASE = 'https://bar-ops-v2.vercel.app'` — all frontend calls use this constant.  
All functions read secrets from Vercel env vars (`process.env`). Real secrets (STRIPE_SECRET_KEY, SUPABASE_SERVICE_KEY) are **never** in source code.

### Business Flow (Métier)
```
1. Catalogue → Ingrédients (spi, jus, alcools, etc.)
2. Cocktails → Recettes à partir du catalogue
3. Équipe → Staff (Bartender, Serveur, Bar Manager, Manutentionnaire)
4. Clients → Demandes de services
5. Fournisseurs → Suppliers d'ingrédients
6. Événements → Création + devis + assignation staff
7. Suivi → Validation checklist (stock, staffing, etc.)
8. Historique → Événements passés (archivé)
```

### Data Models
```
Ingredient {
  id, name, unit, costHT, brand, category
}

Cocktail {
  id, name, code, category, 
  ingredients: [{ingredientId, qty, unit}],
  priceHT, vat, totalCost
}

Staff {
  id, name, type: 'Bartender|Serveur|Bar Manager|Manutentionnaire',
  rateHT, billHT, per: 'per hour'
}

Client {
  id, name, email, phone, address
}

Supplier {
  id, name, contact, speciality, tutoie
}

Event {
  id, name, date, location, clientId,
  nGuests, nBartenders, nWaiters, nManagers, nManutentionnaires,
  arrBrt, depBrt, arrWtr, depWtr, arrMgr, depMgr, arrMan, depMan,
  cocktails: [{cocktailId, qty}],
  assignedStaff: [staffId],
  deliveryCostHT, deliveryBillHT,
  status: 'planning|suivi|historique',
  paid, acompte, stockRetourDone,
  totalRevHT  ← canonical CA (remise + dates multiplied, stored on save)
}
```

## Key Functions & Modules

**app.html contains**:
- `getSupabase()` - Client instance
- `cloudRequest()` - HTTP wrapper for Vercel API functions
- `cloudPush()/cloudPull()` - Supabase workspace sync
- `fmt()` - Currency formatting
- `archiveFromSuivi(evId)` - Toggle stockRetourDone (archive ↔ suivi)
- `evStatusBadge(ev)` / `openStatusDropdown(evId, el)` - Status badge (Devis/Confirmé/Archivé)
- Page controllers (event, cocktail, staff, etc.)

**Constants**:
- `API_BASE = 'https://bar-ops-v2.vercel.app'` — backend base URL
- Supabase anon key fetched at runtime via `/api/config` (not hardcoded)
- Staff types hardcoded: `'Bartender'`, `'Serveur'`, `'Bar Manager'`, `'Manutentionnaire'`
- Only `'per hour'` billing for staff

## Development Tips

1. **Modify app.html** - locate the page function or module section (search for section comments like `/* ── EVENTS ── */`)
2. **Test locally** - open `app.html` in browser, use `?demo=1` for offline mode
3. **Add Vercel function** - create `api/myfunction.js`, export `module.exports = async function handler(req, res){...}`, redeploy
4. **Supabase queries** - use `supabase().from('table').select()` syntax
5. **Change staff UI** - staff name conventions are enforced in calculations (see PROJECT_CONTEXT.md)

## File Roles

- `.env.example` - template (duplicate to `.env.local` for local functions)
- `vercel.json` - Vercel config (rewrites, function routes)
- `package.json` - minimal (only SendGrid, Supabase, Stripe SDKs for backend)
- `.github/workflows/deploy.yml` - unused (Vercel handles auto-deploy from GitHub)

## Obsidian Plugin Integration

The Obsidian Claude Code Plugin (`obsidian-claude-code-plugin`) allows seamless integration with this repository:
- Install plugin in Obsidian: [deivid11/obsidian-claude-code-plugin](https://github.com/deivid11/obsidian-claude-code-plugin)
- Enables Claude Code context awareness directly from Obsidian
- Use this CLAUDE.md as quick reference when context-switching

## Common Tasks

```bash
# Add a new Vercel function
touch api/myfunction.js

# Test locally with demo mode
# Open app.html?demo=1 in browser

# View cloud data
# Use Supabase dashboard at https://supabase.co
# Use Vercel dashboard at https://vercel.com for logs/env vars

# Push changes
git add .
git commit -m "description"
git push origin main  # Auto-deploys on Vercel
```

## Constraints

- No external build tools or frameworks
- Staff billing always `per hour` (no `per event`)
- Cocktail qty integer-only
- All staff types must match PROJECT_CONTEXT.md conventions
- localStorage is single-user (no concurrent editing)
- Real secrets only in Vercel env vars — never in source code
