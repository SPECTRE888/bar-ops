const sgMail = require('@sendgrid/mail');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const token = (req.headers['authorization'] || req.headers['Authorization'] || '').replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Authentification requise' });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Token invalide ou expiré' });

    const { to, subject, html, devisHTML, fromEmail, fromName, sendgridApiKey } = req.body || {};
    if (!to || !subject) return res.status(400).json({ error: 'Champs manquants (to, subject)' });
    if (!sendgridApiKey) return res.status(400).json({ error: 'Clé SendGrid manquante' });
    if (!fromEmail) return res.status(400).json({ error: "Email d'envoi non configuré" });

    sgMail.setApiKey(sendgridApiKey);
    await sgMail.send({ to, from: { email: fromEmail, name: fromName || 'BAR OPS' }, subject, html: devisHTML || html });
    return res.status(200).json({ success: true });
  } catch (error) {
    const detail = error?.response?.body?.errors?.[0]?.message || error.message || 'Erreur inconnue';
    return res.status(500).json({ error: detail });
  }
};
