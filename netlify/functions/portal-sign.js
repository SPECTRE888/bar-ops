/**
 * POST /.netlify/functions/portal-sign
 * Body: { token, name }
 * Public — no auth.
 *
 * Records e-signature on the event in the workspace.
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function b64urlDecode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
function hmac(secret, uid, evId) {
  return crypto.createHmac('sha256', secret).update(`${uid}:${evId}`).digest('hex').slice(0, 16);
}

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return err(400, 'invalid_json', headers); }

  const { token, name } = body;
  if (!token || !name?.trim()) return err(400, 'missing_fields', headers);

  const parts = token.split('.');
  if (parts.length !== 2) return err(400, 'invalid_token', headers);

  let payload;
  try { payload = JSON.parse(b64urlDecode(parts[0])); } catch { return err(400, 'invalid_token', headers); }

  const { uid, evId } = payload;
  if (!uid || !evId) return err(400, 'invalid_token', headers);

  const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback';
  if (parts[1] !== hmac(secret, uid, evId)) return err(403, 'bad_signature', headers);

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data: ws } = await supabase
    .from('workspaces')
    .select('data')
    .eq('user_id', uid)
    .maybeSingle();

  if (!ws?.data) return err(404, 'workspace_not_found', headers);

  const workspaceData = ws.data;
  const evIdx = (workspaceData.events || []).findIndex(e => e.id == evId);
  if (evIdx === -1) return err(404, 'event_not_found', headers);

  workspaceData.events[evIdx].portalSignedAt = new Date().toISOString();
  workspaceData.events[evIdx].portalSignedName = name.trim();

  const { error } = await supabase
    .from('workspaces')
    .update({ data: workspaceData })
    .eq('user_id', uid);

  if (error) return err(500, 'db_error', headers);

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
};

function err(code, msg, headers = {}) {
  return { statusCode: code, headers, body: JSON.stringify({ error: msg }) };
}
