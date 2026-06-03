/**
 * GET  /api/workspace          → workspace-pull (agents)
 * POST /api/workspace          → portal-token (sign token for event portal)
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function b64urlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function hmac(secret, uid, evId, exp) {
  return crypto.createHmac('sha256', secret).update(`${uid}:${evId}:${exp}`).digest('hex').slice(0, 32);
}
const PORTAL_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 jours

module.exports = async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'auth_required' });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'invalid_token' });

  // ── WORKSPACE PULL (GET) ───────────────────────────────────
  if (req.method === 'GET') {
    const { data: profile } = await supabase.from('profiles').select('role, company_id, companies(owner_id)').eq('id', user.id).maybeSingle();
    const ownerId = profile?.role === 'AGENT' ? profile?.companies?.owner_id : user.id;
    if (!ownerId) return res.status(404).json({ error: 'no_owner' });
    const { data: workspace } = await supabase.from('workspaces').select('data').eq('user_id', ownerId).maybeSingle();
    return res.status(200).json({ data: workspace?.data || null });
  }

  // ── PORTAL TOKEN (POST) ────────────────────────────────────
  if (req.method === 'POST') {
    const { evId, theme } = req.body || {};
    if (!evId) return res.status(400).json({ error: 'missing_evId' });
    const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY;
    if (!secret) return res.status(500).json({ error: 'server_misconfigured' });
    const exp = Math.floor(Date.now() / 1000) + PORTAL_TOKEN_TTL_SECONDS;
    const payload = b64urlEncode(JSON.stringify({ uid: user.id, evId: String(evId), theme: theme || 'elegant', exp }));
    const sig = hmac(secret, user.id, String(evId), exp);
    return res.status(200).json({ token: `${payload}.${sig}` });
  }

  return res.status(405).end();
};
