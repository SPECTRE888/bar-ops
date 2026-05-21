const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Authentification requise' });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Token invalide ou expiré' });

  const { token: inviteToken } = req.body || {};
  if (!inviteToken) return res.status(400).json({ error: "Token d'invitation manquant" });

  const { data: inv, error: invErr } = await supabase.from('invitations').select('*').eq('token', inviteToken).single();
  if (invErr || !inv) return res.status(404).json({ error: 'Invitation introuvable' });
  if (inv.status !== 'pending') return res.status(409).json({ error: 'Cette invitation a déjà été utilisée ou annulée' });
  if (new Date(inv.expires_at) < new Date()) return res.status(410).json({ error: 'Cette invitation a expiré' });
  if (inv.email.toLowerCase() !== user.email.toLowerCase()) {
    return res.status(403).json({ error: `Cet email ne correspond pas à l'invitation` });
  }

  const { data: currentProfile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();

  const { error: updateErr } = await supabase.from('profiles').update({
    company_id: inv.company_id, role: inv.role, permissions: inv.permissions,
    invited_by: inv.invited_by, status: 'active',
  }).eq('id', user.id);
  if (updateErr) return res.status(500).json({ error: updateErr.message });

  if (currentProfile?.company_id && currentProfile.company_id !== inv.company_id) {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', currentProfile.company_id);
    if (!count || count === 0) await supabase.from('companies').delete().eq('id', currentProfile.company_id);
  }

  await supabase.from('invitations').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', inv.id);
  await supabase.from('audit_logs').insert({ company_id: inv.company_id, actor_id: user.id, action: 'invite_accepted', target_id: user.id, metadata: { email: user.email, role: inv.role } });

  const { data: profile } = await supabase.from('profiles').select('*, companies(name, plan, max_agents)').eq('id', user.id).single();
  return res.status(200).json({ success: true, profile });
};
