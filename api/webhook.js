const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

// Vercel: disable body parsing to get raw body for Stripe signature
module.exports.config = { api: { bodyParser: false } };

function normalizeEmail(email) {
  if (!email) return '';
  const [local, domain] = email.toLowerCase().split('@');
  return `${local.split('+')[0].replace(/\./g, '')}@${domain}`;
}

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function sendConfirmationEmail(email, plan, period, appUrl) {
  if (!process.env.SENDGRID_API_KEY || !email) return;
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const planLabel = plan === 'early' ? 'Accès Anticipé' : plan.charAt(0).toUpperCase() + plan.slice(1);
    const periodLabel = period === 'yearly' ? 'annuel' : 'mensuel';
    await sgMail.send({
      to: email,
      from: { email: 'contact@intelligencespotlighted.com', name: 'BAR OPS' },
      subject: 'Bienvenue sur BAR OPS — Votre abonnement est actif',
      html: `<div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;background:#080808;color:#ede8e0;padding:48px 40px;border-radius:8px"><div style="font-size:28px;font-weight:300;letter-spacing:.1em;color:#c4a46b;margin-bottom:32px">BAR OPS</div><p>Votre abonnement <strong style="color:#ede8e0">${planLabel} ${periodLabel}</strong> est actif.</p><a href="${appUrl}/app.html" style="display:inline-block;background:#c4a46b;color:#080808;padding:14px 36px;border-radius:3px;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase">Accéder à la plateforme</a></div>`,
    });
  } catch (e) { console.error('Email error:', e.message); }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const APP_URL = process.env.APP_URL || 'https://bar-ops-v2.vercel.app';

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    if (session.metadata?.type === 'seat') {
      const { company_id, seats, user_id: seat_user_id, pending_invite_email, pending_invite_role, pending_invite_perms } = session.metadata;
      const toAdd = parseInt(seats) || 1;
      const { data: company } = await supabase.from('companies').select('max_agents').eq('id', company_id).single();
      const current = company?.max_agents ?? 2;
      await supabase.from('companies').update({ max_agents: current + toAdd }).eq('id', company_id);

      // Si une invitation était en attente, l'envoyer automatiquement
      if (pending_invite_email && seat_user_id) {
        try {
          let perms = {};
          try { perms = JSON.parse(pending_invite_perms || '{}'); } catch (_) {}
          const ROLE_PRESETS = {
            commercial: { canViewRevenue: false, canViewAnalytics: false, canViewEventMargin: true, canViewCosts: false, canManageClients: true, canCreateEvents: true, canEditProjects: true, canManageCatalogue: false, canManageStaff: false, canManageSuppliers: false, canExportData: false },
            barman: { canViewRevenue: false, canViewAnalytics: false, canViewEventMargin: false, canViewCosts: false, canManageClients: false, canCreateEvents: false, canEditProjects: false, canManageCatalogue: true, canManageStaff: false, canManageSuppliers: true, canExportData: false },
          };
          const finalPerms = Object.keys(perms).length > 0 ? perms : (ROLE_PRESETS[pending_invite_role] || ROLE_PRESETS.commercial);
          const { data: adminProfile } = await supabase.from('profiles').select('company_id').eq('id', seat_user_id).maybeSingle();
          if (adminProfile?.company_id) {
            await supabase.from('agent_invitations').insert([{
              company_id: adminProfile.company_id,
              invited_by: seat_user_id,
              email: pending_invite_email,
              role: pending_invite_role || 'commercial',
              permissions: finalPerms,
              status: 'pending',
            }]);
          }
        } catch (inviteErr) { console.error('Auto-invite after seat error:', inviteErr.message); }
      }

      return res.status(200).send('seat_ok');
    }

    const { user_id, plan, period } = session.metadata;
    const customerEmail = session.customer_details?.email || session.customer_email;

    let cardFingerprint = null;
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription, { expand: ['default_payment_method'] });
      cardFingerprint = subscription.default_payment_method?.card?.fingerprint || null;
      if (cardFingerprint && subscription.status === 'trialing') {
        const { data: existing } = await supabase.from('subscriptions').select('id').eq('card_fingerprint', cardFingerprint).limit(1);
        if (existing && existing.length > 0) {
          await stripe.subscriptions.update(session.subscription, { trial_end: 'now' });
        }
      }
    } catch (e) { console.error('Fingerprint check error:', e.message); }

    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', user_id).neq('status', 'cancelled');

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (period === 'yearly' ? 12 : 1));
    const emailHash = customerEmail ? crypto.createHash('sha256').update(normalizeEmail(customerEmail)).digest('hex') : null;

    const { error } = await supabase.from('subscriptions').insert([{ user_id, plan, period, status: 'active', stripe_session_id: session.id, stripe_subscription_id: session.subscription, card_fingerprint: cardFingerprint, email_hash: emailHash, expires_at: expiresAt.toISOString() }]);
    if (error) { console.error('DB error:', error); return res.status(500).send('DB error'); }
    await sendConfirmationEmail(customerEmail, plan, period, APP_URL);
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    await supabase.from('subscriptions').update({ status: 'cancelled', expires_at: new Date().toISOString() }).eq('stripe_subscription_id', stripeEvent.data.object.id);
  }

  if (stripeEvent.type === 'customer.subscription.updated') {
    const sub = stripeEvent.data.object;
    if (sub.cancel_at_period_end && sub.status === 'trialing' && sub.trial_end) {
      await supabase.from('subscriptions').update({ expires_at: new Date(sub.trial_end * 1000).toISOString() }).eq('stripe_subscription_id', sub.id);
    }
  }

  if (stripeEvent.type === 'invoice.payment_failed') {
    await supabase.from('subscriptions').update({ status: 'past_due' }).eq('stripe_subscription_id', stripeEvent.data.object.subscription);
  }

  if (stripeEvent.type === 'invoice.payment_succeeded') {
    const invoice = stripeEvent.data.object;
    if (invoice.billing_reason === 'subscription_create') return res.status(200).send('OK');
    if (!invoice.subscription) return res.status(200).send('OK');
    const { data: sub } = await supabase.from('subscriptions').select('period').eq('stripe_subscription_id', invoice.subscription).single();
    if (sub) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (sub.period === 'yearly' ? 12 : 1));
      await supabase.from('subscriptions').update({ status: 'active', expires_at: expiresAt.toISOString() }).eq('stripe_subscription_id', invoice.subscription);
    }
  }

  return res.status(200).send('OK');
};
