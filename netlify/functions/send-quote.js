const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { to, subject, html, pdfBase64, pdfFilename, fromEmail, fromName, sendgridApiKey } = JSON.parse(event.body);
    if (!to || !subject || !html) return { statusCode: 400, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ error: 'Champs manquants' }) };
    if (!sendgridApiKey) return { statusCode: 400, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ error: 'Clé SendGrid manquante' }) };
    sgMail.setApiKey(sendgridApiKey);
    const msg = { to, from: { email: fromEmail, name: fromName || 'BAR OPS' }, subject, html };
    if (pdfBase64) {
      msg.attachments = [{ content: pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64, filename: pdfFilename || 'devis.html', type: 'text/html', disposition: 'attachment' }];
    }
    await sgMail.send(msg);
    return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ success: true }) };
  } catch (error) {
    const detail = error?.response?.body?.errors?.[0]?.message || error.message || 'Erreur inconnue';
    console.error('SendGrid error:', JSON.stringify(error?.response?.body || error.message));
    return { statusCode: 500, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ error: detail }) };
  }
};
