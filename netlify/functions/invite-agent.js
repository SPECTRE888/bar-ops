/**
 * POST /.netlify/functions/invite-agent
 * Body: { email, role, permissions }
 * Auth: Bearer <access_token>  (must be COMPANY_ADMIN)
 *
 * - Checks company plan vs max_agents
 * - Creates invitation row
 * - Sends invite email via SendGrid
 * - Writes audit log
 */
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

const DEFAULT_AGENT_PERMISSIONS = {
  canViewRevenue:     false,
  canViewAnalytics:   false,
  canManageClients:   true,
  canEditProjects:    true,
  canManageStaff:     false,
  canManageSuppliers: false,
  canViewCosts:       false,
  canExportData:      false,
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Authenticate caller
  const token = (event.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return err(401, 'Authentification requise');

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return err(401, 'Token invalide ou expiré');

  // Load caller profile
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (profErr || !profile) return err(403, 'Profil introuvable');
  if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
    return err(403, 'Réservé aux administrateurs');
  }

  const { email, role = 'AGENT', permissions, fromEmail, fromName, sendgridApiKey } = JSON.parse(event.body || '{}');
  if (!email || !email.includes('@')) return err(400, 'Email invalide');
  if (!['AGENT', 'COMPANY_ADMIN'].includes(role)) return err(400, 'Rôle invalide');

  // Check company plan limits
  const { data: company } = await supabase
    .from('companies')
    .select('name, max_agents, plan')
    .eq('id', profile.company_id)
    .single();

  const { count: agentCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', profile.company_id)
    .eq('role', 'AGENT');

  const maxAgents = company.max_agents ?? 2;
  if (agentCount >= maxAgents) {
    return err(403, `Limite atteinte : votre plan inclut ${maxAgents} agent(s) maximum. Contactez-nous pour passer à un plan supérieur.`);
  }

  // Check for duplicate pending invitation
  const { data: existing } = await supabase
    .from('invitations')
    .select('id')
    .eq('company_id', profile.company_id)
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .single();

  if (existing) return err(409, 'Une invitation est déjà en attente pour cet email');

  // Create invitation
  const mergedPerms = { ...DEFAULT_AGENT_PERMISSIONS, ...(permissions || {}) };
  const { data: invitation, error: invErr } = await supabase
    .from('invitations')
    .insert({
      company_id:  profile.company_id,
      invited_by:  user.id,
      email:       email.toLowerCase(),
      role,
      permissions: mergedPerms,
    })
    .select()
    .single();

  if (invErr) return err(500, invErr.message);

  // Send email
  const appUrl = process.env.APP_URL || 'https://bar-ops.netlify.app';
  const inviteUrl = `${appUrl}/auth.html?action=accept-invite&token=${invitation.token}`;

  const sgKey = sendgridApiKey || process.env.SENDGRID_API_KEY;
  const sender = fromEmail || process.env.FROM_EMAIL;
  let emailSent = false;
  let emailError = null;
  if (sgKey && sender) {
    try {
      sgMail.setApiKey(sgKey);
      await sgMail.send({
        to: email,
        from: { email: sender, name: fromName || company.name },
        subject: `Invitation à rejoindre ${company.name} sur Bar Ops`,
        html: buildInviteEmail(company.name, user.email, inviteUrl, role),
      });
      emailSent = true;
    } catch (e) {
      console.error('SendGrid error:', e.message, e.response?.body);
      emailError = e.message;
    }
  } else {
    emailError = !sgKey ? 'Clé SendGrid manquante' : 'Adresse expéditeur manquante (Profil → Email & SendGrid)';
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    company_id: profile.company_id,
    actor_id:   user.id,
    action:     'invite_sent',
    metadata:   { email, role },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      success:    true,
      inviteUrl,
      expires_at: invitation.expires_at,
      emailSent,
      emailError,
    }),
  };
};

function err(code, message) {
  return { statusCode: code, body: JSON.stringify({ error: message }) };
}

function buildInviteEmail(companyName, inviterEmail, inviteUrl, role) {
  const roleLabel = role === 'COMPANY_ADMIN' ? 'Administrateur' : 'Agent';
  return `
<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
<h2 style="color:#1a1a1a">Vous êtes invité sur Bar Ops</h2>
<p><strong>${inviterEmail}</strong> vous invite à rejoindre <strong>${companyName}</strong> en tant que <strong>${roleLabel}</strong>.</p>
<p>Bar Ops est une plateforme de gestion d'événements bar&nbsp;: clients, cocktails, équipes et facturation.</p>
<a href="${inviteUrl}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
  Accepter l'invitation
</a>
<p style="color:#888;font-size:12px">Ce lien est valable 7 jours. Si vous n'attendiez pas cette invitation, ignorez cet email.</p>
</body></html>`;
}
