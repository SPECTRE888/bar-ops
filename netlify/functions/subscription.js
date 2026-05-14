exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }) };
  }

  try {
    const stripe = require('stripe')(key);
    const { createClient } = require('@supabase/supabase-js');
    const crypto = require('crypto');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { plan, period, userId, priceInCents, userEmail } = JSON.parse(event.body);

    // Normalize email to catch Gmail dots/aliases (j.erome+test@gmail.com → jerome@gmail.com)
    function normalizeEmail(email) {
      if (!email) return '';
      const [local, domain] = email.toLowerCase().split('@');
      const cleanLocal = local.split('+')[0].replace(/\./g, '');
      return `${cleanLocal}@${domain}`;
    }
    const emailHash = userEmail
      ? crypto.createHash('sha256').update(normalizeEmail(userEmail)).digest('hex')
      : null;

    // Early access hard cap (20 slots)
    if (plan === 'early') {
      const { count } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('plan', 'early');
      if (count >= 20) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Les 20 places Accès Anticipé sont épuisées.' }) };
      }
    }

    // Check by userId OR normalized email hash
    const { data: pastSubs } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    const { data: emailSubs } = emailHash ? await supabase
      .from('subscriptions')
      .select('id')
      .eq('email_hash', emailHash)
      .limit(1) : { data: null };

    const isFirstTime = (!pastSubs || pastSubs.length === 0) && (!emailSubs || emailSubs.length === 0);

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `BAR OPS — ${plan}` },
          unit_amount: priceInCents,
          recurring: { interval: period === 'yearly' ? 'year' : 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
    };
    if (isFirstTime) sessionParams.subscription_data = { trial_period_days: 7 };

    const APP_URL = process.env.APP_URL || 'https://bar-opsv2public.netlify.app';
    const session = await stripe.checkout.sessions.create({
      ...sessionParams,
      success_url: `${APP_URL}/app.html`,
      cancel_url: `${APP_URL}/paying.html`,
      metadata: { user_id: userId, plan, period },
    });

    return { statusCode: 200, body: JSON.stringify({ sessionId: session.id }) };
  } catch (err) {
    console.error('Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
// force redeploy Tue May 12 2026
