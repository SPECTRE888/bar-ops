/**
 * GET /.netlify/functions/portal-data?token=<token>
 * Public — no auth.
 *
 * Token is self-contained: payload = base64url(JSON) + "." + hmac32
 * Returns event + profile data embedded in the token.
 */
const crypto = require('crypto');

function b64urlDecode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
function hmac(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex').slice(0, 32);
}

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers };

  const token = event.queryStringParameters?.token || '';
  if (!token) return err(400, 'missing_token', headers);

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return err(400, 'invalid_token', headers);

  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);

  const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback';
  if (hmac(secret, payload) !== sig) return err(403, 'bad_signature', headers);

  let data;
  try { data = JSON.parse(b64urlDecode(payload)); }
  catch { return err(400, 'invalid_payload', headers); }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(data),
  };
};

function err(code, msg, headers = {}) {
  return { statusCode: code, headers, body: JSON.stringify({ error: msg }) };
}
