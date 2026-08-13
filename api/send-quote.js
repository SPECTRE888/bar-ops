const { createClient } = require('@supabase/supabase-js');
const { checkEmailRate, logEmailSent } = require('./_rate-limit');

const RATE = { perHour: 30, perDay: 100 };
const BREVO_SENDER_EMAIL = 'mail@ops-suite.fr';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const token = (req.headers['authorization'] || req.headers['Authorization'] || '').replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Authentification requise' });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Token invalide ou expiré' });

    // Rate limit anti-abus / anti-spam (protège la réputation Brevo, mutualisée avec HelmOps)
    const rate = await checkEmailRate(supabase, user.id, RATE);
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfterSec || 3600));
      return res.status(429).json({ error: rate.reason === 'hourly_limit_reached'
        ? `Limite d'envoi atteinte (${RATE.perHour}/heure). Réessayez plus tard.`
        : `Limite quotidienne atteinte (${RATE.perDay}/jour). Réessayez demain.` });
    }

    const { to, subject, html, devisHTML, fromName, replyTo } = req.body || {};
    if (!to || !subject) return res.status(400).json({ error: 'Champs manquants (to, subject)' });
    const htmlContent = devisHTML || html;
    if (!htmlContent) return res.status(400).json({ error: 'Contenu manquant' });

    // Envoi centralisé via Brevo (mail.ops-suite.fr, même compte que HelmOps) : le nom affiché
    // au destinataire est celui du bar/utilisateur, l'adresse technique reste mutualisée. Les
    // réponses arrivent sur l'adresse de connexion de l'utilisateur, sauf override explicite.
    const isValidEmail = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: fromName || 'BAR OPS' },
        to: [{ email: to }],
        replyTo: { email: isValidEmail(replyTo) ? replyTo : user.email },
        subject,
        htmlContent,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ error: data?.message || 'Erreur Brevo' });

    await logEmailSent(supabase, user.id, 'send-quote');
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erreur inconnue' });
  }
};
