/**
 * POST /api/billing
 * action: 'portal'    → Stripe billing portal session
 * action: 'add-seat'  → Stripe checkout for extra seat
 */
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const APP_URL = process.env.APP_URL || 'https://bar-ops-v2.vercel.app';

  const token = (req.headers['authorization'] || req.headers['Authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Authentification requise' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Token invalide ou expiré' });

  const { action } = req.body || {};

  // ── BILLING PORTAL ─────────────────────────────────────────
  if (action === 'portal') {
    try {
      const { data: sub } = await supabase.from('subscriptions').select('stripe_subscription_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
      if (!sub?.stripe_subscription_id) return res.status(404).json({ error: 'Aucun abonnement trouvé' });
      const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
      const session = await stripe.billingPortal.sessions.create({ customer: subscription.customer, return_url: `${APP_URL}/app.html` });
      return res.status(200).json({ url: session.url });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // ── ADD SEAT ───────────────────────────────────────────────
  if (action === 'add-seat') {
    const { data: profile } = await supabase.from('profiles').select('company_id, role, companies(name, max_agents)').eq('id', user.id).maybeSingle();
    if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(profile?.role)) return res.status(403).json({ error: 'Réservé aux administrateurs' });

    const { quantity = 1, pendingEmail, pendingRole, pendingPermissions } = req.body;
    const seats = Math.max(1, Math.min(10, parseInt(quantity) || 1));

    // Rattacher au customer Stripe existant si possible
    let existingCustomer = null;
    try {
      const { data: sub } = await supabase.from('subscriptions').select('stripe_subscription_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
      if (sub?.stripe_subscription_id) {
        const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        existingCustomer = subscription.customer;
      }
    } catch (_) {}

    // Encoder les données d'invitation en attente pour les récupérer au retour
    const pendingMeta = pendingEmail ? { pending_invite_email: pendingEmail, pending_invite_role: pendingRole || 'commercial', pending_invite_perms: JSON.stringify(pendingPermissions || {}) } : {};

    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'eur', recurring: { interval: 'month' }, product_data: { name: `Siège collaborateur supplémentaire × ${seats}` }, unit_amount: 2900 }, quantity: seats }],
      metadata: { type: 'seat', user_id: user.id, company_id: profile.company_id, seats: String(seats), ...pendingMeta },
      success_url: `${APP_URL}/app.html?seat=success${pendingEmail ? '&seat_invite=1' : ''}`,
      cancel_url: `${APP_URL}/app.html?seat=cancelled`,
    };

    // Lier au customer existant pour cohérence dans le portail Stripe
    if (existingCustomer) sessionParams.customer = existingCustomer;

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });
  }

  return res.status(400).json({ error: 'Action inconnue' });
};
