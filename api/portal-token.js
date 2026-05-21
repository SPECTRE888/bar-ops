const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function b64urlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function hmac(secret, uid, evId) {
  return crypto.createHmac('sha256', secret).update(`${uid}:${evId}`).digest('hex').slice(0, 32);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'auth_required' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'invalid_token' });

  const { evId, theme } = req.body || {};
  if (!evId) return res.status(400).json({ error: 'missing_evId' });

  const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback';
  const payload = b64urlEncode(JSON.stringify({ uid: user.id, evId: String(evId), theme: theme || 'elegant' }));
  const sig = hmac(secret, user.id, String(evId));

  return res.status(200).json({ token: `${payload}.${sig}` });
};
