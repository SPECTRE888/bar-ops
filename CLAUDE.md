# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

- **No build process** - vanilla HTML/JS/CSS, zero dependencies in frontend
- **Deploy** - git push to `main` → auto-deploys on Netlify (~30s)
- **Dev server** - open HTML files directly in browser (works offline with `?demo=1`)
- **Backend** - Netlify Functions in `netlify/functions/` (Node.js + esbuild)

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

### Backend (Netlify Functions)
```
netlify/functions/
├── subscription.js   → Stripe checkout session creation
├── delete-account.js → User account deletion
├── send-quote.js     → Quote email via SendGrid
└── webhook.js        → Stripe webhook handler
```

All functions read from `process.env` (API keys from Netlify config). Use `fetch('/.netlify/functions/<name>')` from frontend.

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
  id, name, contact, speciality
}

Event {
  id, name, date, location, clientId,
  nGuests, nBartenders, nWaiters, nManagers, nManutentionnaires,
  arrBrt, depBrt, arrWtr, depWtr, arrMgr, depMgr, arrMan, depMan,
  cocktails: [{cocktailId, qty}],
  assignedStaff: [staffId],
  deliveryCostHT, deliveryBillHT,
  status: 'planning|suivi|historique',
  paid, acompte, stockRetourDone
}
```

## Key Functions & Modules

**app.html contains**:
- `getSupabase()` - Client instance
- `cloudRequest()` - HTTP wrapper for Netlify functions
- `cloudPush()/cloudPull()` - Supabase sync
- `fmt()` - Currency formatting
- Page controllers (event, cocktail, staff, etc.)

**Constants**:
- Supabase URL/key + Stripe key in HTML (embedded, not secrets)
- Staff types hardcoded: `'Bartender'`, `'Serveur'`, `'Bar Manager'`, `'Manutentionnaire'`
- Only `'per hour'` billing for staff

## Development Tips

1. **Modify app.html** - locate the page function or module section (search for section comments like `/* ── EVENTS ── */`)
2. **Test locally** - open `app.html` in browser, use `?demo=1` for offline mode
3. **Add Netlify function** - create `netlify/functions/myfunction.js`, export `handler(event, context)`, redeploy
4. **Supabase queries** - use `supabase().from('table').select()` syntax
5. **Change staff UI** - staff name conventions are enforced in calculations (see PROJECT_CONTEXT.md)

## File Roles

- `.env.example` - template (duplicate to `.env.local` for local functions)
- `netlify.toml` - build config (functions directory)
- `package.json` - minimal (only SendGrid, Supabase, Stripe SDKs for backend)
- `.github/workflows/deploy.yml` - CI setup (ignored, Netlify handles auto-deploy)

## Obsidian Plugin Integration

The Obsidian Claude Code Plugin (`obsidian-claude-code-plugin`) allows seamless integration with this repository:
- Install plugin in Obsidian: [deivid11/obsidian-claude-code-plugin](https://github.com/deivid11/obsidian-claude-code-plugin)
- Enables Claude Code context awareness directly from Obsidian
- Use this CLAUDE.md as quick reference when context-switching

## Common Tasks

```bash
# Add a new Netlify function
touch netlify/functions/myfunction.js

# Test locally with demo mode
# Open index.html?demo=1 in browser

# View cloud data
# Use Supabase dashboard at https://supabase.co

# Push changes
git add .
git commit -m "description"
git push origin main  # Auto-deploys
```

## Constraints

- No external build tools or frameworks
- Staff billing always `per hour` (no `per event`)
- Cocktail qty integer-only
- All staff types must match PROJECT_CONTEXT.md conventions
- localStorage is single-user (no concurrent editing)
