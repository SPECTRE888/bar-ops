const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const token = (req.headers['authorization'] || req.headers['Authorization'] || '').replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Authentification requise' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Token invalide ou expiré' });

    const { data: sub } = await supabase.from('subscriptions').select('stripe_subscription_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
    if (!sub?.stripe_subscription_id) return res.status(404).json({ error: 'Aucun abonnement trouvé' });

    const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
    const APP_URL = process.env.APP_URL || 'https://bar-ops.vercel.app';
    const session = await stripe.billingPortal.sessions.create({ customer: subscription.customer, return_url: `${APP_URL}/app.html` });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
