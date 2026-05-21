/**
 * GET  /api/portal-public?token=  → portal-data  (public, no auth)
 * POST /api/portal-public          → portal-sign  (public, no auth)
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function b64urlDecode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
function hmacData(secret, uid, evId) {
  return crypto.createHmac('sha256', secret).update(`${uid}:${evId}`).digest('hex').slice(0, 32);
}
function hmacSign(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex').slice(0, 32);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback';

  // ── PORTAL DATA (GET) ──────────────────────────────────────
  if (req.method === 'GET') {
    const token = req.query.token || '';
    if (!token) return res.status(400).json({ error: 'missing_token' });

    const dotIdx = token.lastIndexOf('.');
    if (dotIdx === -1) return res.status(400).json({ error: 'invalid_token' });
    const payloadB64 = token.slice(0, dotIdx), sig = token.slice(dotIdx + 1);

    let payload;
    try { payload = JSON.parse(b64urlDecode(payloadB64)); }
    catch { return res.status(400).json({ error: 'invalid_payload' }); }

    const { uid, evId } = payload;
    if (!uid || !evId) return res.status(400).json({ error: 'invalid_token' });
    if (hmacData(secret, uid, String(evId)) !== sig) return res.status(403).json({ error: 'bad_signature' });

    const { data: ws } = await supabase.from('workspaces').select('data').eq('user_id', uid).maybeSingle();
    if (!ws?.data) return res.status(404).json({ error: 'workspace_not_found' });

    let wd = ws.data;
    if (typeof wd === 'string') { try { wd = JSON.parse(wd); } catch { return res.status(500).json({ error: 'invalid_workspace_data' }); } }

    const ev = (wd.events || []).find(e => String(e.id) === String(evId));
    if (!ev) return res.status(404).json({ error: 'event_not_found' });

    const profile = wd.profile || {};
    const client = (wd.clients || []).find(c => c.id === ev.clientId) || null;
    const cocktailDetails = (ev.cocktails || []).map(cfg => { const c = (wd.cocktails || []).find(x => x.id === cfg.id); return c ? { name: c.name, qty: cfg.qty, priceHT: c.priceHT || 0 } : null; }).filter(Boolean);

    return res.status(200).json({
      event: { id: ev.id, name: ev.name || '', date: ev.date || '', location: ev.location || '', pax: ev.pax || 0, devisNum: ev.devisNum || '', totalRevHT: ev.totalRevHT || 0, acompte: ev.acompte || 0, deliveryBillHT: ev.deliveryBillHT || 0, remiseHT: ev.remiseHT || 0, remisePct: ev.remisePct || 0, cocktails: cocktailDetails, portalSignedAt: ev.portalSignedAt || null, portalSignedName: ev.portalSignedName || null },
      client,
      profile: { barName: profile.barName || '', logo: profile.logo || '', senderEmail: profile.senderEmail || '', iban: profile.iban || '', banque: profile.banque || '', siret: profile.siret || '', city: profile.city || '', acomptePercent: profile.acomptePercent || 30 },
    });
  }

  // ── PORTAL SIGN (POST) ─────────────────────────────────────
  if (req.method === 'POST') {
    const { token, name } = req.body || {};
    if (!token || !name?.trim()) return res.status(400).json({ error: 'missing_fields' });

    const dotIdx = token.lastIndexOf('.');
    if (dotIdx === -1) return res.status(400).json({ error: 'invalid_token' });
    const payload = token.slice(0, dotIdx), sig = token.slice(dotIdx + 1);
    if (hmacSign(secret, payload) !== sig) return res.status(403).json({ error: 'bad_signature' });

    let data;
    try { data = JSON.parse(b64urlDecode(payload)); }
    catch { return res.status(400).json({ error: 'invalid_payload' }); }

    const { uid, evId } = data;
    if (!uid || !evId) return res.status(400).json({ error: 'missing_uid_evId' });

    const { data: ws } = await supabase.from('workspaces').select('data').eq('user_id', uid).maybeSingle();
    if (!ws?.data) return res.status(404).json({ error: 'workspace_not_found' });

    let wd = ws.data;
    if (typeof wd === 'string') { try { wd = JSON.parse(wd); } catch { return res.status(500).json({ error: 'invalid_workspace_data' }); } }

    const evIdx = (wd.events || []).findIndex(e => String(e.id) === String(evId));
    if (evIdx !== -1) {
      wd.events[evIdx].portalSignedAt = new Date().toISOString();
      wd.events[evIdx].portalSignedName = name.trim();
      await supabase.from('workspaces').update({ data: wd }).eq('user_id', uid);
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
};
