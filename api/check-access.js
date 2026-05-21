const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ allowed: false, reason: 'auth_required' });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ allowed: false, reason: 'invalid_token' });

  const { data: profile } = await supabase.from('profiles').select('role, status, company_id, permissions, companies(owner_id, name)').eq('id', user.id).maybeSingle();

  if (profile?.status === 'suspended') return res.status(200).json({ allowed: false, reason: 'suspended' });

  const role = profile?.role || 'AGENT';
  const ownerId = role === 'AGENT' ? profile?.companies?.owner_id : user.id;

  if (!ownerId) return res.status(200).json({ allowed: false, reason: 'no_company' });

  const { data: subs } = await supabase.from('subscriptions').select('status, expires_at, plan').eq('user_id', ownerId).order('created_at', { ascending: false }).limit(1).maybeSingle();

  const isActive = subs && new Date(subs.expires_at) > new Date();

  if (!isActive) {
    if (role === 'AGENT') {
      await supabase.from('profiles').update({ status: 'suspended' }).eq('company_id', profile.company_id).eq('role', 'AGENT');
    }
    return res.status(200).json({ allowed: false, reason: 'no_active_subscription' });
  }

  const PERM_DEFAULTS = { canViewRevenue: false, canViewAnalytics: false, canViewEventMargin: false, canViewCosts: false, canManageClients: false, canCreateEvents: false, canEditProjects: false, canManageCatalogue: false, canManageStaff: false, canManageSuppliers: false, canExportData: false };
  const rawPerms = profile?.permissions || {};
  const hasNewKeys = 'canCreateEvents' in rawPerms || 'canManageCatalogue' in rawPerms || 'canViewEventMargin' in rawPerms;
  const permissions = role === 'AGENT' ? (hasNewKeys ? { ...PERM_DEFAULTS, ...rawPerms } : { ...PERM_DEFAULTS }) : null;

  return res.status(200).json({ allowed: true, role, plan: subs.plan || 'pro', companyName: profile?.companies?.name || '', ownerId, permissions, profileId: profile ? user.id : null, companyId: profile?.company_id || null });
};
