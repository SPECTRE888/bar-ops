# BAR OPS — Claude Context

## Project
**SaaS event management platform** (bars, catering, events)  
**Live:** https://melodic-cupcake-725483.netlify.app  
**Repo:** https://github.com/SPECTRE888/bar-ops  
**GitHub Token:** `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`

## Core Flow
`Client → Event → Cocktails → Staff → Logistics → Quote (Devis)`

## Tech Stack
- **Frontend:** Single HTML file (`app.html`, `index.html`, `auth.html`)
- **Backend:** Netlify Functions (Node.js)
- **Database:** Supabase (PostgreSQL)
- **Payment:** Stripe
- **Email:** SendGrid (API: `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`)
- **Auth:** Supabase Auth

## Key Files
- `app.html` — Main app (6800+ lines) with paywall, dashboard, forms
- `netlify/functions/subscription.js` — Stripe checkout
- `netlify/functions/webhook.js` — Stripe webhook
- `netlify/functions/send-quote.js` — SendGrid email (NEW)
- `.env.example` — Environment variables template

## Supabase Tables
- `subscriptions` — plan, expires_at, status
- `workspaces` — user_id, data (JSON state)
- `user_sessions` — device tracking (multi-device limit)
- `users` — Supabase Auth

## Key Variables
- `cloudUser` — session object with access_token, refresh_token, user
- `state` — main app state (cocktails, events, staff, clients, etc.)
- `window._userPlan` — 'free', 'early', 'pro'

## Pricing
- **Free/Trial:** Watermark "TRIAL" on PDF
- **Early Access:** 89€/month (watermark-free)
- **Professional:** 149€/month (full features)

## Workflow Rules
- **PATCH ONLY** — Never rewrite files completely
- **No verbose explanations** — Just do it
- **Optimize tokens** — Essential info only
- **Test before commit** — Verify functionality

## Recent Work
- ✅ Supabase sync (workspaces)
- ✅ Multi-device limit
- ✅ Cocktail form ONE PAGE
- ✅ PDF devis (premium design, staff pricing)
- ✅ SendGrid email integration
- ✅ Client persistence in events

## Common Issues
1. **401/400 errors on token refresh** → Normal, app continues with existing token
2. **Watermark still shows** → Check `window._userPlan` in console
3. **Client disappears on reload** → Need to set `el._clientId` on form load

## Next Priorities
- Integrate Bars to pricing system
- Improve onboarding
- Email templates
- Conversion optimization
