const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function normalizeEmail(email) {
  if (!email) return '';
  const [local, domain] = email.toLowerCase().split('@');
  return `${local.split('+')[0].replace(/\./g, '')}@${domain}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });

  try {
    const stripe = require('stripe')(key);
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const token = (req.headers['authorization'] || req.headers['Authorization'] || '').replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Authentification requise' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Token invalide ou expiré' });

    const { plan, period, priceInCents } = req.body || {};
    const userId = user.id;
    const userEmail = user.email;

    const emailHash = userEmail ? crypto.createHash('sha256').update(normalizeEmail(userEmail)).digest('hex') : null;

    if (plan === 'early') {
      const { count } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('plan', 'early');
      if (count >= 20) return res.status(403).json({ error: 'Les 20 places Accès Anticipé sont épuisées.' });
    }

    const { data: pastSubs } = await supabase.from('subscriptions').select('id').eq('user_id', userId).limit(1);
    const { data: emailSubs } = emailHash ? await supabase.from('subscriptions').select('id').eq('email_hash', emailHash).limit(1) : { data: null };
    const isFirstTime = (!pastSubs || pastSubs.length === 0) && (!emailSubs || emailSubs.length === 0);

    const APP_URL = process.env.APP_URL || 'https://bar-ops.vercel.app';
    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'eur', product_data: { name: `BAR OPS — ${plan}` }, unit_amount: priceInCents, recurring: { interval: period === 'yearly' ? 'year' : 'month' } }, quantity: 1 }],
      mode: 'subscription',
      success_url: `${APP_URL}/app.html`,
      cancel_url: `${APP_URL}/paying.html`,
      metadata: { user_id: userId, plan, period },
    };
    if (isFirstTime) sessionParams.subscription_data = { trial_period_days: 7 };

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ sessionId: session.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
