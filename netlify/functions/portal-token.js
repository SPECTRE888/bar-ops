/**
 * GET /.netlify/functions/portal-token?evId=<id>
 * Auth: Bearer <access_token>
 *
 * Returns a signed portal token for the event, usable by anyone with the link.
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function b64urlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function hmac(secret, uid, evId) {
  return crypto.createHmac('sha256', secret).update(`${uid}:${evId}`).digest('hex').slice(0, 16);
}

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers };

  const token = (event.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return err(401, 'auth_required', headers);

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return err(401, 'invalid_token', headers);

  const evId = event.queryStringParameters?.evId;
  if (!evId) return err(400, 'missing_evId', headers);

  // Verify event belongs to user's workspace
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle();

  console.log('[portal-token] user:', user.id, '| evId:', evId, '| ws found:', !!ws, '| wsErr:', wsErr?.message);
  console.log('[portal-token] events count:', ws?.data?.events?.length ?? 0);

  const found = (ws?.data?.events || []).some(e => String(e.id) === String(evId));
  console.log('[portal-token] event found:', found);
  if (!found) return err(404, 'event_not_found', headers);

  const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback';
  const payload = b64urlEncode(JSON.stringify({ uid: user.id, evId: String(evId) }));
  const sig = hmac(secret, user.id, String(evId));
  const portalToken = `${payload}.${sig}`;

  return { statusCode: 200, headers, body: JSON.stringify({ token: portalToken }) };
};

function err(code, msg, headers = {}) {
  return { statusCode: code, headers, body: JSON.stringify({ error: msg }) };
}
