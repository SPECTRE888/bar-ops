const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function b64urlDecode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
function hmac(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex').slice(0, 32);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { token, name } = req.body || {};
  if (!token || !name?.trim()) return res.status(400).json({ error: 'missing_fields' });

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return res.status(400).json({ error: 'invalid_token' });

  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback';
  if (hmac(secret, payload) !== sig) return res.status(403).json({ error: 'bad_signature' });

  let data;
  try { data = JSON.parse(b64urlDecode(payload)); }
  catch { return res.status(400).json({ error: 'invalid_payload' }); }

  const { uid, evId } = data;
  if (!uid || !evId) return res.status(400).json({ error: 'missing_uid_evId' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: ws } = await supabase.from('workspaces').select('data').eq('user_id', uid).maybeSingle();
  if (!ws?.data) return res.status(404).json({ error: 'workspace_not_found' });

  let workspaceData = ws.data;
  if (typeof workspaceData === 'string') {
    try { workspaceData = JSON.parse(workspaceData); } catch { return res.status(500).json({ error: 'invalid_workspace_data' }); }
  }

  const evIdx = (workspaceData.events || []).findIndex(e => String(e.id) === String(evId));
  if (evIdx !== -1) {
    workspaceData.events[evIdx].portalSignedAt = new Date().toISOString();
    workspaceData.events[evIdx].portalSignedName = name.trim();
    await supabase.from('workspaces').update({ data: workspaceData }).eq('user_id', uid);
  }

  return res.status(200).json({ ok: true });
};
