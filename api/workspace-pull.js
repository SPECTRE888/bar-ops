const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'auth_required' });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'invalid_token' });

  const { data: profile } = await supabase.from('profiles').select('role, company_id, companies(owner_id)').eq('id', user.id).maybeSingle();
  const ownerId = profile?.role === 'AGENT' ? profile?.companies?.owner_id : user.id;
  if (!ownerId) return res.status(404).json({ error: 'no_owner' });

  const { data: workspace } = await supabase.from('workspaces').select('data').eq('user_id', ownerId).maybeSingle();
  return res.status(200).json({ data: workspace?.data || null });
};
