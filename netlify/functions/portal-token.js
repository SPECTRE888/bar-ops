/**
 * POST /.netlify/functions/portal-token
 * Auth: Bearer <access_token>
 * Body: { evId }
 *
 * Returns a signed token: base64url({uid, evId}) + "." + hmac32
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function b64urlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function hmac(secret, uid, evId) {
  return crypto.createHmac('sha256', secret).update(`${uid}:${evId}`).digest('hex').slice(0, 32);
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

  const { evId } = body;
  if (!evId) return err(400, 'missing_evId', headers);

  const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback';
  const payload = b64urlEncode(JSON.stringify({ uid: user.id, evId: String(evId) }));
  const sig = hmac(secret, user.id, String(evId));

  return { statusCode: 200, headers, body: JSON.stringify({ token: `${payload}.${sig}` }) };
};

function err(code, msg, headers = {}) {
  return { statusCode: code, headers, body: JSON.stringify({ error: msg }) };
}
