/**
 * POST /api/agents
 * type: 'accept'  → accept-invite
 * type: 'invite'  → invite-agent
 * type: 'manage'  → manage-agent (action: list|update_permissions|update_role|suspend|reactivate|remove|cancel_invite|resend_invite)
 */
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

const DEFAULT_AGENT_PERMISSIONS = { canViewRevenue: false, canViewAnalytics: false, canManageClients: true, canEditProjects: true, canManageStaff: false, canManageSuppliers: false, canViewCosts: false, canExportData: false };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Authentification requise' });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Token invalide ou expiré' });

  const body = req.body || {};
  const { type } = body;

  // ── ACCEPT INVITE ──────────────────────────────────────────
  if (type === 'accept') {
    const { inviteToken } = body;
    if (!inviteToken) return res.status(400).json({ error: "Token d'invitation manquant" });

    const { data: inv, error: invErr } = await supabase.from('invitations').select('*').eq('token', inviteToken).single();
    if (invErr || !inv) return res.status(404).json({ error: 'Invitation introuvable' });
    if (inv.status !== 'pending') return res.status(409).json({ error: 'Invitation déjà utilisée ou annulée' });
    if (new Date(inv.expires_at) < new Date()) return res.status(410).json({ error: 'Invitation expirée' });
    if (inv.email.toLowerCase() !== user.email.toLowerCase()) return res.status(403).json({ error: "Email ne correspond pas à l'invitation" });

    const { data: currentProfile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    const { error: updateErr } = await supabase.from('profiles').update({ company_id: inv.company_id, role: inv.role, permissions: inv.permissions, invited_by: inv.invited_by, status: 'active' }).eq('id', user.id);
    if (updateErr) return res.status(500).json({ error: updateErr.message });

    if (currentProfile?.company_id && currentProfile.company_id !== inv.company_id) {
      const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', currentProfile.company_id);
      if (!count || count === 0) await supabase.from('companies').delete().eq('id', currentProfile.company_id);
    }

    await supabase.from('invitations').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', inv.id);
    await supabase.from('audit_logs').insert({ company_id: inv.company_id, actor_id: user.id, action: 'invite_accepted', target_id: user.id, metadata: { email: user.email, role: inv.role } });
    const { data: profile } = await supabase.from('profiles').select('*, companies(name, plan, max_agents)').eq('id', user.id).single();
    return res.status(200).json({ success: true, profile });
  }

  // ── INVITE AGENT ───────────────────────────────────────────
  if (type === 'invite') {
    const { data: profile, error: profErr } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single();
    if (profErr || !profile) return res.status(403).json({ error: 'Profil introuvable' });
    if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(profile.role)) return res.status(403).json({ error: 'Réservé aux administrateurs' });

    const { email, role = 'AGENT', permissions, fromEmail, fromName, sendgridApiKey } = body;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email invalide' });
    if (!['AGENT', 'COMPANY_ADMIN'].includes(role)) return res.status(400).json({ error: 'Rôle invalide' });

    const { data: company } = await supabase.from('companies').select('name, max_agents, plan').eq('id', profile.company_id).single();
    const { count: agentCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', profile.company_id).eq('role', 'AGENT');
    if (agentCount >= (company.max_agents ?? 2)) return res.status(403).json({ error: `Limite atteinte : ${company.max_agents ?? 2} agent(s) maximum.` });

    const { data: existing } = await supabase.from('invitations').select('id').eq('company_id', profile.company_id).eq('email', email.toLowerCase()).eq('status', 'pending').single();
    if (existing) return res.status(409).json({ error: 'Invitation déjà en attente pour cet email' });

    const mergedPerms = { ...DEFAULT_AGENT_PERMISSIONS, ...(permissions || {}) };
    const { data: invitation, error: invErr } = await supabase.from('invitations').insert({ company_id: profile.company_id, invited_by: user.id, email: email.toLowerCase(), role, permissions: mergedPerms }).select().single();
    if (invErr) return res.status(500).json({ error: invErr.message });

    const appUrl = process.env.APP_URL || 'https://bar-ops-v2.vercel.app';
    const inviteUrl = `${appUrl}/auth.html?action=accept-invite&token=${invitation.token}`;
    const sgKey = sendgridApiKey || process.env.SENDGRID_API_KEY;
    const sender = fromEmail || process.env.FROM_EMAIL;
    let emailSent = false, emailError = null;
    if (sgKey && sender) {
      try {
        sgMail.setApiKey(sgKey);
        const roleLabel = role === 'COMPANY_ADMIN' ? 'Administrateur' : 'Agent';
        await sgMail.send({ to: email, from: { email: sender, name: fromName || company.name }, subject: `Invitation à rejoindre ${company.name} sur Bar Ops`, html: `<p><strong>${user.email}</strong> vous invite à rejoindre <strong>${company.name}</strong> en tant que <strong>${roleLabel}</strong>.</p><a href="${inviteUrl}">Accepter l'invitation</a><p style="color:#888;font-size:12px">Ce lien est valable 7 jours.</p>` });
        emailSent = true;
      } catch (e) { emailError = e.message; }
    } else { emailError = !sgKey ? 'Clé SendGrid manquante' : 'Adresse expéditeur manquante'; }

    await supabase.from('audit_logs').insert({ company_id: profile.company_id, actor_id: user.id, action: 'invite_sent', metadata: { email, role } });
    return res.status(200).json({ success: true, inviteUrl, expires_at: invitation.expires_at, emailSent, emailError });
  }

  // ── MANAGE AGENT ───────────────────────────────────────────
  const { data: callerProfile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single();
  if (!callerProfile || !['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(callerProfile.role)) return res.status(403).json({ error: 'Réservé aux administrateurs' });

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
    const { data: companyData } = await supabase.from('companies').select('max_agents, plan').eq('id', callerProfile.company_id).single();
    return res.status(200).json({ agents: enriched, invitations: invitations || [], company: { max_agents: companyData?.max_agents ?? 2 } });
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
