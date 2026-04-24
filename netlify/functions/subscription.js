const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const { plan, period, userId, priceInCents } = JSON.parse(event.body);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `BAR OPS - ${plan}` },
          unit_amount: priceInCents,
          recurring: period === 'yearly' ? { interval: 'year' } : { interval: 'month' },
        },
        quantity: 1,
      }],
      mode: period === 'yearly' || plan === 'full' ? 'subscription' : 'payment',
      success_url: `${process.env.URL}/index.html?mode=check`,
      cancel_url: `${process.env.URL}/index.html?mode=pricing`,
      metadata: { user_id: userId, plan, period },
    });

    return { statusCode: 200, body: JSON.stringify({ sessionId: session.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
