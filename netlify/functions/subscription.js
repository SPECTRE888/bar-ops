const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  try {
    const { plan, period, userId, priceInCents } = JSON.parse(event.body);
    const isSubscription = true; // Always subscription mode

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
      success_url: `${process.env.URL || 'https://animated-bombolone-8fba95.netlify.app'}/index.html?mode=check`,
      cancel_url: `${process.env.URL || 'https://animated-bombolone-8fba95.netlify.app'}/index.html?mode=pricing`,
      metadata: { user_id: userId, plan, period },
    });

    return { statusCode: 200, body: JSON.stringify({ sessionId: session.id }) };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
