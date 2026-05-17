/**
 * GET /.netlify/functions/portal-data?token=<token>
 * Public — no auth.
 *
 * Token: base64url({uid, evId}) + "." + hmac32
 * Reads event data from the owner's workspace in Supabase.
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function b64urlDecode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
function hmac(secret, uid, evId) {
  return crypto.createHmac('sha256', secret).update(`${uid}:${evId}`).digest('hex').slice(0, 32);
}

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers };

  const token = event.queryStringParameters?.token || '';
  if (!token) return err(400, 'missing_token', headers);

  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return err(400, 'invalid_token', headers);

  const payloadB64 = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);

  let payload;
  try { payload = JSON.parse(b64urlDecode(payloadB64)); }
  catch { return err(400, 'invalid_payload', headers); }

  const { uid, evId } = payload;
  if (!uid || !evId) return err(400, 'invalid_token', headers);

  const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback';
  if (hmac(secret, uid, String(evId)) !== sig) return err(403, 'bad_signature', headers);

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data: ws } = await supabase
    .from('workspaces')
    .select('data')
    .eq('user_id', uid)
    .maybeSingle();

  if (!ws?.data) return err(404, 'workspace_not_found', headers);

  const workspaceData = ws.data;
  const ev = (workspaceData.events || []).find(e => String(e.id) === String(evId));
  if (!ev) return err(404, 'event_not_found', headers);

  const profile = workspaceData.profile || {};
  const cocktails = workspaceData.cocktails || [];
  const clients = workspaceData.clients || [];

  const client = clients.find(c => c.id === ev.clientId) || null;
  const cocktailDetails = (ev.cocktails || []).map(cfg => {
    const c = cocktails.find(x => x.id === cfg.id);
    return c ? { name: c.name, qty: cfg.qty, priceHT: c.priceHT || 0 } : null;
  }).filter(Boolean);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      event: {
        id: ev.id, name: ev.name || '', date: ev.date || '', location: ev.location || '',
        pax: ev.pax || 0, devisNum: ev.devisNum || '', totalRevHT: ev.totalRevHT || 0,
        acompte: ev.acompte || 0, deliveryBillHT: ev.deliveryBillHT || 0,
        remiseHT: ev.remiseHT || 0, remisePct: ev.remisePct || 0,
        cocktails: cocktailDetails,
        portalSignedAt: ev.portalSignedAt || null,
        portalSignedName: ev.portalSignedName || null,
      },
      client,
      profile: {
        barName: profile.barName || '', logo: profile.logo || '',
        senderEmail: profile.senderEmail || '', iban: profile.iban || '',
        banque: profile.banque || '', siret: profile.siret || '',
        city: profile.city || '', acomptePercent: profile.acomptePercent || 30,
      },
    }),
  };
};

function err(code, msg, headers = {}) {
  return { statusCode: code, headers, body: JSON.stringify({ error: msg }) };
}
