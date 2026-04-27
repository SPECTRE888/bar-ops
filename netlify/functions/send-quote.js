const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { to, subject, html, pdfBase64, pdfFilename, fromEmail, fromName, sendgridApiKey } = JSON.parse(event.body);

    if (!to || !subject || !html) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    if (!sendgridApiKey) {
      return { statusCode: 400, body: JSON.stringify({ error: 'SendGrid API key not configured' }) };
    }

    // Use user's API key
    sgMail.setApiKey(sendgridApiKey);

    const msg = {
      to,
      from: { email: fromEmail || 'noreply@barops.app', name: fromName || 'BAR OPS' },
      subject,
      html,
      attachments: pdfBase64 ? [{
        content: pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64,
        filename: pdfFilename || 'devis.html',
        type: 'text/html',
        disposition: 'attachment'
      }] : []
    };

    await sgMail.send(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Email sent successfully' })
    };
  } catch (error) {
    console.error('SendGrid error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
