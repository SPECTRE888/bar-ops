/**
 * GET /.netlify/functions/workspace-pull
 * Auth: Bearer <access_token>
 *
 * Pour les agents : retourne les données du workspace de l'owner de leur company.
 * Utilise la service key pour bypasser la RLS.
 */
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405 };

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const token = (event.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return err(401, 'auth_required');

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return err(401, 'invalid_token');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id, companies(owner_id)')
    .eq('id', user.id)
    .maybeSingle();

  // Seuls les agents utilisent cette route
  const ownerId = profile?.role === 'AGENT'
    ? profile?.companies?.owner_id
    : user.id;

  if (!ownerId) return err(404, 'no_owner');

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('data')
    .eq('user_id', ownerId)
    .maybeSingle();

  return {
    statusCode: 200,
    body: JSON.stringify({ data: workspace?.data || null }),
  };
};

function err(code, message) {
  return { statusCode: code, body: JSON.stringify({ error: message }) };
}
