const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function b64urlDecode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
function hmac(secret, uid, evId) {
  return crypto.createHmac('sha256', secret).update(`${uid}:${evId}`).digest('hex').slice(0, 32);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const token = req.query.token || '';
  if (!token) return res.status(400).json({ error: 'missing_token' });

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return res.status(400).json({ error: 'invalid_token' });

  const payloadB64 = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);

  let payload;
  try { payload = JSON.parse(b64urlDecode(payloadB64)); }
  catch { return res.status(400).json({ error: 'invalid_payload' }); }

  const { uid, evId } = payload;
  if (!uid || !evId) return res.status(400).json({ error: 'invalid_token' });

  const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback';
  if (hmac(secret, uid, String(evId)) !== sig) return res.status(403).json({ error: 'bad_signature' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: ws } = await supabase.from('workspaces').select('data').eq('user_id', uid).maybeSingle();
  if (!ws?.data) return res.status(404).json({ error: 'workspace_not_found' });

  let workspaceData = ws.data;
  if (typeof workspaceData === 'string') {
    try { workspaceData = JSON.parse(workspaceData); } catch { return res.status(500).json({ error: 'invalid_workspace_data' }); }
  }

  const ev = (workspaceData.events || []).find(e => String(e.id) === String(evId));
  if (!ev) return res.status(404).json({ error: 'event_not_found' });

  const profile = workspaceData.profile || {};
  const cocktails = workspaceData.cocktails || [];
  const clients = workspaceData.clients || [];
  const client = clients.find(c => c.id === ev.clientId) || null;
  const cocktailDetails = (ev.cocktails || []).map(cfg => {
    const c = cocktails.find(x => x.id === cfg.id);
    return c ? { name: c.name, qty: cfg.qty, priceHT: c.priceHT || 0 } : null;
  }).filter(Boolean);

  return res.status(200).json({
    event: { id: ev.id, name: ev.name || '', date: ev.date || '', location: ev.location || '', pax: ev.pax || 0, devisNum: ev.devisNum || '', totalRevHT: ev.totalRevHT || 0, acompte: ev.acompte || 0, deliveryBillHT: ev.deliveryBillHT || 0, remiseHT: ev.remiseHT || 0, remisePct: ev.remisePct || 0, cocktails: cocktailDetails, portalSignedAt: ev.portalSignedAt || null, portalSignedName: ev.portalSignedName || null },
    client,
    profile: { barName: profile.barName || '', logo: profile.logo || '', senderEmail: profile.senderEmail || '', iban: profile.iban || '', banque: profile.banque || '', siret: profile.siret || '', city: profile.city || '', acomptePercent: profile.acomptePercent || 30 },
  });
};
