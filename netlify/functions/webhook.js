const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const { user_id, plan, period } = session.metadata;

    // Cancel all old active subscriptions for this user
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', user_id).eq('status', 'active');

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (period === 'yearly' ? 12 : 1));

    const { error } = await supabase.from('subscriptions').insert([{
      user_id, plan, period, status: 'active',
      stripe_session_id: session.id,
      stripe_subscription_id: session.subscription,
      expires_at: expiresAt.toISOString(),
    }]);

    if (error) {
      console.error('DB error:', error);
      return { statusCode: 500, body: 'DB error' };
    }
  }

  return { statusCode: 200, body: 'OK' };
};
// webhook configured
// webhook fix
// webhook updated
