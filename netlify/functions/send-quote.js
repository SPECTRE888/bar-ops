const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { to, subject, html, devisHTML, fromEmail, fromName, sendgridApiKey } = JSON.parse(event.body);
    if (!to || !subject) return { statusCode: 400, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ error: 'Champs manquants' }) };
    if (!sendgridApiKey) return { statusCode: 400, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ error: 'Clé SendGrid manquante' }) };
    sgMail.setApiKey(sendgridApiKey);
    const msg = {
      to,
      from: { email: fromEmail, name: fromName || 'BAR OPS' },
      subject,
      html: devisHTML || html,
    };
    await sgMail.send(msg);
    return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ success: true }) };
  } catch (error) {
    const detail = error?.response?.body?.errors?.[0]?.message || error.message || 'Erreur inconnue';
    return { statusCode: 500, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ error: detail }) };
  }
};
