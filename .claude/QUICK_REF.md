# Quick Reference — Bar Ops

## Stack
- Frontend: Vanilla HTML/JS/CSS (single files, no build)
- Backend: Netlify Functions (Node.js)
- Auth: Supabase
- Payments: Stripe
- Deploy: git push main → auto-deploy Netlify

## Files
- `index.html` - landing + pricing
- `auth.html` - login/signup
- `app.html` - main app (7500+ lines)
- `paying.html` - pricing page
- `netlify/functions/` - 4 backend functions (subscription, delete-account, send-quote, webhook)

## Data Models
**Event**: id, name, date, location, nGuests, nBartenders/arrBrt/depBrt, nWaiters/arrWtr/depWtr, nManagers/arrMgr/depMgr, nManutentionnaires/arrMan/depMan, cocktails: [{id, qty}], deliveryCostHT, deliveryBillHT, assignedStaff, paid, acompte, stockRetourDone

**Staff**: id, name, type: 'Bartender'|'Serveur'|'Bar Manager'|'Manutentionnaire', rateHT, billHT, per: 'per hour'

**Cocktail**: id, name, code, category, ingredients: [{name, qty, unit, cost, brand}], priceHT, vat, totalCost

## State Management
- Local: `state` global object (memory)
- Storage: localStorage via `save()/load()` (SK = storage key)
- Cloud: Supabase via `cloudPush()/cloudRequest()`
- Demo: `?demo=1` uses freshState(), no cloud

## Key Functions
- `getSupabase()` - client instance
- `cloudRequest()` - HTTP to Netlify
- `fmt()` - currency format
- Page controllers per feature (events, cocktails, staff, etc.)

## Constants
- Staff types: 'Bartender', 'Serveur', 'Bar Manager', 'Manutentionnaire' (FIXED)
- Billing: always 'per hour' (FIXED)
- Supabase/Stripe keys: embedded in HTML (not secrets)

## Dev Tasks
```bash
git add . && git commit -m "msg" && git push origin main  # auto-deploy
```
- Test: open HTML in browser, use `?demo=1` for offline
- Add function: create `netlify/functions/name.js`, export `handler(event, context)`
- Modify: search section comments like `/* ── EVENTS ── */`
