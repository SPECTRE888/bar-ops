const sgMail = require('@sendgrid/mail');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    // Verify user is authenticated before accepting the request
    const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Authentification requise' }) };
    }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Token invalide ou expiré' }) };
    }

    const { to, subject, html, devisHTML, fromEmail, fromName, sendgridApiKey } = JSON.parse(event.body);
    if (!to || !subject) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Champs manquants (to, subject)' }) };
    if (!sendgridApiKey) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Clé SendGrid manquante' }) };
    if (!fromEmail) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Email d\'envoi non configuré (Profil → Email & SendGrid)' }) };

    sgMail.setApiKey(sendgridApiKey);
    const msg = {
      to,
      from: { email: fromEmail, name: fromName || 'BAR OPS' },
      subject,
      html: devisHTML || html,
    };
    await sgMail.send(msg);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
  } catch (error) {
    const detail = error?.response?.body?.errors?.[0]?.message || error.message || 'Erreur inconnue';
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: detail }) };
  }
};
