const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const APP_URL = process.env.APP_URL || 'https://bar-ops-v2.vercel.app';

  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'auth_required' });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'invalid_token' });

  const { data: profile } = await supabase.from('profiles').select('company_id, role, companies(name, max_agents)').eq('id', user.id).maybeSingle();
  if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(profile?.role)) return res.status(403).json({ error: 'Réservé aux administrateurs' });

  const { quantity = 1 } = req.body || {};
  const seats = Math.max(1, Math.min(10, parseInt(quantity) || 1));

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price_data: { currency: 'eur', recurring: { interval: 'month' }, product_data: { name: `Siège collaborateur supplémentaire × ${seats}` }, unit_amount: 2900 }, quantity: seats }],
    metadata: { type: 'seat', user_id: user.id, company_id: profile.company_id, seats: String(seats) },
    success_url: `${APP_URL}/company-admin.html?seat=success`,
    cancel_url: `${APP_URL}/company-admin.html?seat=cancelled`,
  });

  return res.status(200).json({ url: session.url });
};
