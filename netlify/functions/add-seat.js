/**
 * POST /.netlify/functions/add-seat
 * Auth: Bearer <access_token>
 * Body: { quantity } — nombre de sièges à ajouter (défaut 1)
 *
 * Crée une session Stripe Checkout pour +29€/mois par siège supplémentaire.
 * Le webhook intercepte checkout.session.completed et incrémente max_agents.
 */
const { createClient } = require('@supabase/supabase-js');

const SEAT_PRICE_EUR = 29;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const APP_URL = process.env.APP_URL || 'https://bar-opsv2public.netlify.app';

  const token = (event.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return err(401, 'auth_required');

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return err(401, 'invalid_token');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, companies(name, max_agents)')
    .eq('id', user.id)
    .maybeSingle();

  if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(profile?.role)) {
    return err(403, 'Réservé aux administrateurs');
  }

  const { quantity = 1 } = JSON.parse(event.body || '{}');
  const seats = Math.max(1, Math.min(10, parseInt(quantity) || 1));

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        recurring: { interval: 'month' },
        product_data: {
          name: `Siège collaborateur supplémentaire × ${seats}`,
          description: `+${seats} agent(s) pour ${profile.companies?.name || 'votre compte'}`,
        },
        unit_amount: SEAT_PRICE_EUR * 100,
      },
      quantity: seats,
    }],
    metadata: {
      type: 'seat',
      user_id: user.id,
      company_id: profile.company_id,
      seats: String(seats),
    },
    success_url: `${APP_URL}/company-admin.html?seat=success`,
    cancel_url:  `${APP_URL}/company-admin.html?seat=cancelled`,
  });

  return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
};

function err(code, message) {
  return { statusCode: code, body: JSON.stringify({ error: message }) };
}
