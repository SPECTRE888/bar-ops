/**
 * POST /.netlify/functions/portal-token
 * Auth: Bearer <access_token>
 * Body: { evId, eventData }
 *
 * Signs the event data and returns a self-contained token.
 * portal-data reads the payload directly from the token — no Supabase lookup needed.
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function hmac(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex').slice(0, 32);
}

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers };

  const token = (event.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return err(401, 'auth_required', headers);

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return err(401, 'invalid_token', headers);

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return err(400, 'invalid_json', headers); }

  const { eventData } = body;
  if (!eventData) return err(400, 'missing_eventData', headers);

  // Embed uid so portal-sign can update the right workspace
  const payload = b64urlEncode(JSON.stringify({ uid: user.id, ...eventData }));
  const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback';
  const sig = hmac(secret, payload);
  const portalToken = `${payload}.${sig}`;

  return { statusCode: 200, headers, body: JSON.stringify({ token: portalToken }) };
};

function err(code, msg, headers = {}) {
  return { statusCode: code, headers, body: JSON.stringify({ error: msg }) };
}
