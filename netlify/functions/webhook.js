const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

function normalizeEmail(email) {
  if (!email) return '';
  const [local, domain] = email.toLowerCase().split('@');
  return `${local.split('+')[0].replace(/\./g, '')}@${domain}`;
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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
            Votre essai gratuit de 7 jours commence aujourd'hui — aucun prélèvement avant la fin de la période d'essai.
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

    // Check card fingerprint to prevent trial abuse with different emails
    let cardFingerprint = null;
    try {
      const stripeClient = stripe;
      const subscription = await stripeClient.subscriptions.retrieve(session.subscription, { expand: ['default_payment_method'] });
      cardFingerprint = subscription.default_payment_method?.card?.fingerprint || null;
      if (cardFingerprint && subscription.status === 'trialing') {
        const { data: existing } = await supabase.from('subscriptions').select('id').eq('card_fingerprint', cardFingerprint).limit(1);
        if (existing && existing.length > 0) {
          // Card already used for a trial — cancel trial immediately
          await stripeClient.subscriptions.update(session.subscription, { trial_end: 'now' });
        }
      }
    } catch(e) { console.error('Fingerprint check error:', e.message); }

    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', user_id).neq('status', 'cancelled');

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (period === 'yearly' ? 12 : 1));

    const emailHash = customerEmail
      ? crypto.createHash('sha256').update(normalizeEmail(customerEmail)).digest('hex')
      : null;

    const { error } = await supabase.from('subscriptions').insert([{
      user_id, plan, period, status: 'active',
      stripe_session_id: session.id,
      stripe_subscription_id: session.subscription,
      card_fingerprint: cardFingerprint,
      email_hash: emailHash,
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

  if (stripeEvent.type === 'customer.subscription.updated') {
    const subscription = stripeEvent.data.object;
    // If cancelled during trial, expire at trial end not billing period end
    if (subscription.cancel_at_period_end && subscription.status === 'trialing' && subscription.trial_end) {
      await supabase
        .from('subscriptions')
        .update({ expires_at: new Date(subscription.trial_end * 1000).toISOString() })
        .eq('stripe_subscription_id', subscription.id);
    }
  }

  if (stripeEvent.type === 'invoice.payment_failed') {
    const invoice = stripeEvent.data.object;
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', invoice.subscription);
  }

  if (stripeEvent.type === 'invoice.payment_succeeded') {
    const invoice = stripeEvent.data.object;
    // Skip the first invoice (trial start) — checkout.session.completed handles it
    if (invoice.billing_reason === 'subscription_create') return { statusCode: 200, body: 'OK' };
    if (!invoice.subscription) return { statusCode: 200, body: 'OK' };

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('period')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (sub) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (sub.period === 'yearly' ? 12 : 1));
      await supabase
        .from('subscriptions')
        .update({ status: 'active', expires_at: expiresAt.toISOString() })
        .eq('stripe_subscription_id', invoice.subscription);
    }
  }

  return { statusCode: 200, body: 'OK' };
};
// webhook live May 2026 — service role
