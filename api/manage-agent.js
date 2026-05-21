const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Authentification requise' });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Token invalide ou expiré' });

  const { data: callerProfile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single();
  if (!callerProfile || !['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(callerProfile.role)) return res.status(403).json({ error: 'Réservé aux administrateurs' });

  const body = req.body || {};
  const { action } = body;

  if (action === 'list') {
    const [{ data: agents }, { data: invitations }] = await Promise.all([
      supabase.from('profiles').select('id, role, permissions, status, full_name, avatar_url, created_at').eq('company_id', callerProfile.company_id).neq('id', user.id),
      supabase.from('invitations').select('id, email, role, permissions, status, expires_at, created_at').eq('company_id', callerProfile.company_id).in('status', ['pending']),
    ]);
    const enriched = await Promise.all((agents || []).map(async (a) => {
      const { data: { user: au } } = await supabase.auth.admin.getUserById(a.id);
      return { ...a, email: au?.email };
    }));
    return res.status(200).json({ agents: enriched, invitations: invitations || [] });
  }

  if (action === 'update_permissions') {
    const { targetUserId, permissions } = body;
    await assertSameCompany(supabase, targetUserId, callerProfile.company_id);
    const { error } = await supabase.from('profiles').update({ permissions }).eq('id', targetUserId).eq('company_id', callerProfile.company_id);
    if (error) return res.status(500).json({ error: error.message });
    await audit(supabase, callerProfile.company_id, user.id, 'permission_updated', targetUserId, { permissions });
    return res.status(200).json({ success: true });
  }

  if (action === 'update_role') {
    const { targetUserId, role } = body;
    if (!['AGENT', 'COMPANY_ADMIN'].includes(role)) return res.status(400).json({ error: 'Rôle invalide' });
    await assertSameCompany(supabase, targetUserId, callerProfile.company_id);
    const { error } = await supabase.from('profiles').update({ role }).eq('id', targetUserId).eq('company_id', callerProfile.company_id);
    if (error) return res.status(500).json({ error: error.message });
    await audit(supabase, callerProfile.company_id, user.id, 'role_updated', targetUserId, { role });
    return res.status(200).json({ success: true });
  }

  if (action === 'suspend') {
    const { targetUserId } = body;
    await assertSameCompany(supabase, targetUserId, callerProfile.company_id);
    await supabase.from('profiles').update({ status: 'suspended' }).eq('id', targetUserId);
    await audit(supabase, callerProfile.company_id, user.id, 'agent_suspended', targetUserId);
    return res.status(200).json({ success: true });
  }

  if (action === 'reactivate') {
    const { targetUserId } = body;
    await assertSameCompany(supabase, targetUserId, callerProfile.company_id);
    await supabase.from('profiles').update({ status: 'active' }).eq('id', targetUserId);
    await audit(supabase, callerProfile.company_id, user.id, 'agent_reactivated', targetUserId);
    return res.status(200).json({ success: true });
  }

  if (action === 'remove') {
    const { targetUserId } = body;
    await assertSameCompany(supabase, targetUserId, callerProfile.company_id);
    await supabase.from('profiles').update({ company_id: null, role: 'COMPANY_ADMIN', status: 'active' }).eq('id', targetUserId);
    await audit(supabase, callerProfile.company_id, user.id, 'agent_removed', targetUserId);
    return res.status(200).json({ success: true });
  }

  if (action === 'cancel_invite') {
    const { invitationId } = body;
    await supabase.from('invitations').update({ status: 'cancelled' }).eq('id', invitationId).eq('company_id', callerProfile.company_id);
    await audit(supabase, callerProfile.company_id, user.id, 'invite_cancelled', null, { invitationId });
    return res.status(200).json({ success: true });
  }

  if (action === 'resend_invite') {
    const { invitationId } = body;
    const { data: inv } = await supabase.from('invitations').select('*, companies(name)').eq('id', invitationId).eq('company_id', callerProfile.company_id).single();
    if (!inv) return res.status(404).json({ error: 'Invitation introuvable' });
    await supabase.from('invitations').update({ expires_at: new Date(Date.now() + 7 * 86400 * 1000).toISOString() }).eq('id', invitationId);
    const appUrl = process.env.APP_URL || 'https://bar-ops-v2.vercel.app';
    const inviteUrl = `${appUrl}/auth.html?action=accept-invite&token=${inv.token}`;
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send({ to: inv.email, from: { email: 'noreply@bar-ops.app', name: 'Bar Ops' }, subject: `Rappel : invitation à rejoindre ${inv.companies.name}`, html: `<p>Voici votre lien : <a href="${inviteUrl}">${inviteUrl}</a> (valable 7 jours)</p>` });
    } catch (e) { console.error('SendGrid error:', e.message); }
    return res.status(200).json({ success: true, inviteUrl });
  }

  return res.status(400).json({ error: 'Action inconnue' });
};

async function assertSameCompany(supabase, targetUserId, companyId) {
  const { data } = await supabase.from('profiles').select('company_id').eq('id', targetUserId).single();
  if (!data || data.company_id !== companyId) throw Object.assign(new Error('Accès refusé'), { statusCode: 403 });
}

async function audit(supabase, companyId, actorId, action, targetId, metadata = {}) {
  await supabase.from('audit_logs').insert({ company_id: companyId, actor_id: actorId, action, target_id: targetId, metadata });
}
