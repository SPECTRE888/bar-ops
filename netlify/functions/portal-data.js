/**
 * GET /.netlify/functions/portal-data?token=<token>
 * Public — no auth.
 *
 * Token format: base64url({"uid":"...","evId":...}) + "." + sha256(secret+uid+evId)[0..15]
 * Returns event + profile data for the client portal.
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const APP_URL = process.env.APP_URL || 'https://bar-opsv2public.netlify.app';

function b64urlDecode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function hmac(secret, uid, evId) {
  return crypto.createHmac('sha256', secret).update(`${uid}:${evId}`).digest('hex').slice(0, 16);
}

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers };

  const token = event.queryStringParameters?.token || '';
  if (!token) return err(400, 'missing_token', headers);

  const parts = token.split('.');
  if (parts.length !== 2) return err(400, 'invalid_token', headers);

  let payload;
  try { payload = JSON.parse(b64urlDecode(parts[0])); }
  catch { return err(400, 'invalid_token', headers); }

  const { uid, evId } = payload;
  if (!uid || !evId) return err(400, 'invalid_token', headers);

  const secret = process.env.PORTAL_HMAC_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback';
  const expected = hmac(secret, uid, evId);
  if (parts[1] !== expected) return err(403, 'bad_signature', headers);

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data: ws } = await supabase
    .from('workspaces')
    .select('data')
    .eq('user_id', uid)
    .maybeSingle();

  if (!ws?.data) return err(404, 'workspace_not_found', headers);

  const workspaceData = ws.data;
  const event_ = (workspaceData.events || []).find(e => e.id == evId);
  if (!event_) return err(404, 'event_not_found', headers);

  const profile = workspaceData.profile || {};
  const cocktails = workspaceData.cocktails || [];
  const clients = workspaceData.clients || [];
  const staff = workspaceData.staff || [];

  const client = clients.find(c => c.id === event_.clientId) || null;

  const cocktailDetails = (event_.cocktails || []).map(cfg => {
    const c = cocktails.find(x => x.id === cfg.id);
    return c ? { name: c.name, qty: cfg.qty, priceHT: c.priceHT || 0 } : null;
  }).filter(Boolean);

  const assignedStaff = (event_.assignedStaff || []).map(sid => {
    const s = staff.find(x => x.id === sid);
    return s ? { name: s.name, type: s.type } : null;
  }).filter(Boolean);

  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: {
        id: event_.id,
        name: event_.name || '',
        date: event_.date || '',
        location: event_.location || '',
        pax: event_.pax || 0,
        devisNum: event_.devisNum || '',
        totalRevHT: event_.totalRevHT || 0,
        acompte: event_.acompte || 0,
        deliveryBillHT: event_.deliveryBillHT || 0,
        remiseHT: event_.remiseHT || 0,
        remisePct: event_.remisePct || 0,
        cocktails: cocktailDetails,
        assignedStaff,
        portalSignedAt: event_.portalSignedAt || null,
        portalSignedName: event_.portalSignedName || null,
      },
      client,
      profile: {
        barName: profile.barName || '',
        logo: profile.logo || '',
        senderEmail: profile.senderEmail || '',
        iban: profile.iban || '',
        banque: profile.banque || '',
        siret: profile.siret || '',
        city: profile.city || '',
        acomptePercent: profile.acomptePercent || 30,
        address: profile.address || '',
      },
      appUrl: APP_URL,
    }),
  };
};

function err(code, msg, headers = {}) {
  return { statusCode: code, headers, body: JSON.stringify({ error: msg }) };
}
