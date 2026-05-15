/**
 * POST /.netlify/functions/manage-agent
 * Auth: Bearer <access_token>  (COMPANY_ADMIN only)
 *
 * Actions (body.action):
 *   "update_permissions"  — body: { targetUserId, permissions }
 *   "update_role"         — body: { targetUserId, role }
 *   "suspend"             — body: { targetUserId }
 *   "reactivate"          — body: { targetUserId }
 *   "remove"              — body: { targetUserId }
 *   "cancel_invite"       — body: { invitationId }
 *   "resend_invite"       — body: { invitationId }
 *   "list"                — returns agents + pending invitations
 */
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const token = (event.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return err(401, 'Authentification requise');

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return err(401, 'Token invalide ou expiré');

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (!callerProfile || !['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(callerProfile.role)) {
    return err(403, 'Réservé aux administrateurs');
  }

  const body = JSON.parse(event.body || '{}');
  const { action } = body;

  // --- LIST ---
  if (action === 'list') {
    const [{ data: agents }, { data: invitations }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, role, permissions, status, full_name, avatar_url, created_at')
        .eq('company_id', callerProfile.company_id)
        .neq('id', user.id),
      supabase
        .from('invitations')
        .select('id, email, role, permissions, status, expires_at, created_at')
        .eq('company_id', callerProfile.company_id)
        .in('status', ['pending']),
    ]);

    // Enrich agents with auth email (service role only)
    const enriched = await Promise.all((agents || []).map(async (a) => {
      const { data: { user: au } } = await supabase.auth.admin.getUserById(a.id);
      return { ...a, email: au?.email };
    }));

    return ok({ agents: enriched, invitations: invitations || [] });
  }

  // --- UPDATE PERMISSIONS ---
  if (action === 'update_permissions') {
    const { targetUserId, permissions } = body;
    await assertSameCompany(supabase, targetUserId, callerProfile.company_id);

    const { error } = await supabase
      .from('profiles')
      .update({ permissions })
      .eq('id', targetUserId)
      .eq('company_id', callerProfile.company_id);

    if (error) return err(500, error.message);
    await audit(supabase, callerProfile.company_id, user.id, 'permission_updated', targetUserId, { permissions });
    return ok({ success: true });
  }

  // --- UPDATE ROLE ---
  if (action === 'update_role') {
    const { targetUserId, role } = body;
    if (!['AGENT', 'COMPANY_ADMIN'].includes(role)) return err(400, 'Rôle invalide');
    await assertSameCompany(supabase, targetUserId, callerProfile.company_id);

    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', targetUserId)
      .eq('company_id', callerProfile.company_id);

    if (error) return err(500, error.message);
    await audit(supabase, callerProfile.company_id, user.id, 'role_updated', targetUserId, { role });
    return ok({ success: true });
  }

  // --- SUSPEND ---
  if (action === 'suspend') {
    const { targetUserId } = body;
    await assertSameCompany(supabase, targetUserId, callerProfile.company_id);
    await supabase.from('profiles').update({ status: 'suspended' }).eq('id', targetUserId);
    await audit(supabase, callerProfile.company_id, user.id, 'agent_suspended', targetUserId);
    return ok({ success: true });
  }

  // --- REACTIVATE ---
  if (action === 'reactivate') {
    const { targetUserId } = body;
    await assertSameCompany(supabase, targetUserId, callerProfile.company_id);
    await supabase.from('profiles').update({ status: 'active' }).eq('id', targetUserId);
    await audit(supabase, callerProfile.company_id, user.id, 'agent_reactivated', targetUserId);
    return ok({ success: true });
  }

  // --- REMOVE ---
  if (action === 'remove') {
    const { targetUserId } = body;
    await assertSameCompany(supabase, targetUserId, callerProfile.company_id);

    // Detach from company (don't delete auth account)
    await supabase
      .from('profiles')
      .update({ company_id: null, role: 'COMPANY_ADMIN', status: 'active' })
      .eq('id', targetUserId);

    await audit(supabase, callerProfile.company_id, user.id, 'agent_removed', targetUserId);
    return ok({ success: true });
  }

  // --- CANCEL INVITE ---
  if (action === 'cancel_invite') {
    const { invitationId } = body;
    await supabase
      .from('invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId)
      .eq('company_id', callerProfile.company_id);

    await audit(supabase, callerProfile.company_id, user.id, 'invite_cancelled', null, { invitationId });
    return ok({ success: true });
  }

  // --- RESEND INVITE ---
  if (action === 'resend_invite') {
    const { invitationId } = body;
    const { data: inv } = await supabase
      .from('invitations')
      .select('*, companies(name)')
      .eq('id', invitationId)
      .eq('company_id', callerProfile.company_id)
      .single();

    if (!inv) return err(404, 'Invitation introuvable');

    // Reset expiry
    await supabase
      .from('invitations')
      .update({ expires_at: new Date(Date.now() + 7 * 86400 * 1000).toISOString() })
      .eq('id', invitationId);

    const appUrl = process.env.APP_URL || 'https://bar-ops.netlify.app';
    const inviteUrl = `${appUrl}/auth.html?action=accept-invite&token=${inv.token}`;

    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send({
        to: inv.email,
        from: { email: 'noreply@bar-ops.app', name: 'Bar Ops' },
        subject: `Rappel : invitation à rejoindre ${inv.companies.name}`,
        html: `<p>Voici votre lien d'invitation : <a href="${inviteUrl}">${inviteUrl}</a> (valable 7 jours)</p>`,
      });
    } catch (e) {
      console.error('SendGrid error:', e.message);
    }

    return ok({ success: true, inviteUrl });
  }

  return err(400, 'Action inconnue');
};

async function assertSameCompany(supabase, targetUserId, companyId) {
  const { data } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', targetUserId)
    .single();
  if (!data || data.company_id !== companyId) throw Object.assign(new Error('Accès refusé'), { statusCode: 403 });
}

async function audit(supabase, companyId, actorId, action, targetId, metadata = {}) {
  await supabase.from('audit_logs').insert({ company_id: companyId, actor_id: actorId, action, target_id: targetId, metadata });
}

function ok(body) {
  return { statusCode: 200, body: JSON.stringify(body) };
}

function err(code, message) {
  return { statusCode: code, body: JSON.stringify({ error: message }) };
}
