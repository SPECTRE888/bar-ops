/**
 * GET /.netlify/functions/check-access
 * Auth: Bearer <access_token>
 *
 * Retourne { allowed, role, plan, reason }
 * - COMPANY_ADMIN : vérifie son propre abonnement
 * - AGENT         : vérifie l'abonnement de l'owner de sa company
 * - Si abonnement expiré/absent → allowed: false
 * - Si profil suspendu → allowed: false
 */
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405 };

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const token = (event.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return res(401, { allowed: false, reason: 'auth_required' });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res(401, { allowed: false, reason: 'invalid_token' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, company_id, permissions, companies(owner_id, name)')
    .eq('id', user.id)
    .maybeSingle();

  console.log('[check-access] user:', user.id, user.email, '| profile:', JSON.stringify(profile));

  if (profile?.status === 'suspended') {
    return res(200, { allowed: false, reason: 'suspended' });
  }

  const role = profile?.role || 'AGENT';
  const ownerId = role === 'AGENT'
    ? profile?.companies?.owner_id
    : user.id;

  console.log('[check-access] role:', role, '| ownerId:', ownerId);

  if (!ownerId) {
    return res(200, { allowed: false, reason: 'no_company', debug: { role, profile } });
  }

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('status, expires_at, plan')
    .eq('user_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const isActive = subs && new Date(subs.expires_at) > new Date();

  if (!isActive) {
    // Si l'owner n'a pas d'abo actif, désactiver les agents de sa company
    if (role === 'AGENT') {
      await supabase.from('profiles')
        .update({ status: 'suspended' })
        .eq('company_id', profile.company_id)
        .eq('role', 'AGENT');
    }
    return res(200, { allowed: false, reason: 'no_active_subscription' });
  }

  // Merger les permissions DB avec les defaults (toutes clés à false pour les nouvelles)
  const PERM_DEFAULTS = {
    canViewRevenue: false, canViewAnalytics: false, canViewEventMargin: false,
    canViewCosts: false, canManageClients: false, canCreateEvents: false,
    canEditProjects: false, canManageCatalogue: false, canManageStaff: false,
    canManageSuppliers: false, canExportData: false,
  };
  const rawPerms = profile?.permissions || {};
  const permissions = role === 'AGENT'
    ? { ...PERM_DEFAULTS, ...rawPerms }
    : null; // admin → pas besoin, accès total

  return res(200, {
    allowed: true,
    role,
    plan: subs.plan || 'pro',
    companyName: profile?.companies?.name || '',
    ownerId: ownerId,
    permissions,
    profileId: profile ? user.id : null,
    companyId: profile?.company_id || null,
  });
};

function res(status, body) {
  return { statusCode: status, body: JSON.stringify(body) };
}
