const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function sendConfirmationEmail(email, plan, period) {
  if (!process.env.SENDGRID_API_KEY || !email) return;
  try {

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const planLabel = plan === 'early' ? 'Accès Anticipé' : plan.charAt(0).toUpperCase() + plan.slice(1);
    const periodLabel = period === 'yearly' ? 'annuel' : 'mensuel';

    await sgMail.send({
      to: email,
      from: { email: 'contact@intelligencespotlighted.com', name: 'BAR OPS' },
      subject: 'Bienvenue sur BAR OPS — Votre abonnement est actif',
      html: `
        <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#080808;color:#ede8e0;padding:48px 40px;border-radius:8px">
          <div style="font-size:28px;font-weight:300;letter-spacing:.1em;color:#c4a46b;margin-bottom:32px">BAR OPS</div>
          <p style="font-size:15px;margin-bottom:16px">Bonjour,</p>
          <p style="font-size:14px;color:#a09890;line-height:1.7;margin-bottom:24px">
            Votre abonnement <strong style="color:#ede8e0">${planLabel} ${periodLabel}</strong> est actif.<br>
            Votre essai gratuit de 14 jours commence aujourd'hui — aucun prélèvement avant la fin de la période d'essai.
          </p>
          <a href="https://bar-opsv2public.netlify.app/app.html" style="display:inline-block;background:#c4a46b;color:#080808;padding:14px 36px;border-radius:3px;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase">
            Accéder à la plateforme
          </a>
          <p style="font-size:11px;color:#585450;margin-top:40px;line-height:1.6">
            Pour gérer votre abonnement ou l'annuler, rendez-vous dans votre profil.<br>
            Une question ? <a href="mailto:contact@intelligencespotlighted.com" style="color:#c4a46b">contact@intelligencespotlighted.com</a>
          </p>
        </div>
      `,
    });
  } catch (e) {
    console.error('Email error:', e.message);
  }
}

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
    const customerEmail = session.customer_details?.email || session.customer_email;

    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', user_id).neq('status', 'cancelled');

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

    await sendConfirmationEmail(customerEmail, plan, period);
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const subscription = stripeEvent.data.object;
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', expires_at: new Date().toISOString() })
      .eq('stripe_subscription_id', subscription.id);
  }

  if (stripeEvent.type === 'invoice.payment_failed') {
    const invoice = stripeEvent.data.object;
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', invoice.subscription);
  }

  return { statusCode: 200, body: 'OK' };
};
// webhook live May 2026 — live secret
