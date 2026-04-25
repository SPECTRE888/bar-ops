exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }) };
  }

  try {
    const stripe = require('stripe')(key);
    const { plan, period, userId, priceInCents } = JSON.parse(event.body);

    const session = await stripe.checkout.sessions.create({
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
      success_url: `${process.env.URL || 'https://melodic-cupcake-725483.netlify.app'}/index.html?mode=check`,
      cancel_url: `${process.env.URL || 'https://melodic-cupcake-725483.netlify.app'}/index.html?mode=pricing`,
      metadata: { user_id: userId, plan, period },
    });

    return { statusCode: 200, body: JSON.stringify({ sessionId: session.id }) };
  } catch (err) {
    console.error('Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
// force redeploy Sat Apr 25 08:15:02 UTC 2026
