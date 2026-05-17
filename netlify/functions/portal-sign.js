/**
 * POST /.netlify/functions/portal-sign
 * Body: { token, name }
 * Public — no auth.
 *
 * Validates the self-contained token and records the e-signature in the workspace.
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function b64urlDecode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
function hmac(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex').slice(0, 32);
}

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return err(400, 'invalid_json', headers); }

  const { token, name } = body;
  if (!token || !name?.trim()) return err(400, 'missing_fields', headers);

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return err(400, 'invalid_token', headers);

  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);

  const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback';
  if (hmac(secret, payload) !== sig) return err(403, 'bad_signature', headers);

  let data;
  try { data = JSON.parse(b64urlDecode(payload)); } catch { return err(400, 'invalid_payload', headers); }

  const { uid, evId } = data;
  if (!uid || !evId) return err(400, 'missing_uid_evId', headers);

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data: ws } = await supabase
    .from('workspaces')
    .select('data')
    .eq('user_id', uid)
    .maybeSingle();

  if (!ws?.data) return err(404, 'workspace_not_found', headers);

  let workspaceData = ws.data;
  if (typeof workspaceData === 'string') {
    try { workspaceData = JSON.parse(workspaceData); } catch { return err(500, 'invalid_workspace_data', headers); }
  }
  const evIdx = (workspaceData.events || []).findIndex(e => String(e.id) === String(evId));

  if (evIdx !== -1) {
    workspaceData.events[evIdx].portalSignedAt = new Date().toISOString();
    workspaceData.events[evIdx].portalSignedName = name.trim();
    await supabase.from('workspaces').update({ data: workspaceData }).eq('user_id', uid);
  }

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
};

function err(code, msg, headers = {}) {
  return { statusCode: code, headers, body: JSON.stringify({ error: msg }) };
}
