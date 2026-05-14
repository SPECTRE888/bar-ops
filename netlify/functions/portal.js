const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  try {
    // Verify identity from Bearer token — never trust userId from client body
    const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentification requise' }) };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Token invalide ou expiré' }) };
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!sub?.stripe_subscription_id) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Aucun abonnement trouvé' }) };
    }

    const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);

    const APP_URL = process.env.APP_URL || 'https://bar-opsv2public.netlify.app';
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.customer,
      return_url: `${APP_URL}/app.html`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error('Portal error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
