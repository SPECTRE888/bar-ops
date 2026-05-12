exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }) };
  }

  try {
    const stripe = require('stripe')(key);
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { plan, period, userId, priceInCents } = JSON.parse(event.body);

    // Only give trial to first-time subscribers
    const { data: pastSubs } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    const isFirstTime = !pastSubs || pastSubs.length === 0;

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

    const session = await stripe.checkout.sessions.create({
      ...sessionParams,
      success_url: `https://bar-opsv2public.netlify.app/app.html`,
      cancel_url: `https://bar-opsv2public.netlify.app/paying.html`,
      metadata: { user_id: userId, plan, period },
    });

    return { statusCode: 200, body: JSON.stringify({ sessionId: session.id }) };
  } catch (err) {
    console.error('Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
// force redeploy Tue May 12 2026
