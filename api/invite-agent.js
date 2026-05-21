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

  const { data: profile, error: profErr } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single();
  if (profErr || !profile) return res.status(403).json({ error: 'Profil introuvable' });
  if (!['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(profile.role)) return res.status(403).json({ error: 'Réservé aux administrateurs' });

  const { email, role = 'AGENT', permissions, fromEmail, fromName, sendgridApiKey } = req.body || {};
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email invalide' });
  if (!['AGENT', 'COMPANY_ADMIN'].includes(role)) return res.status(400).json({ error: 'Rôle invalide' });

  const { data: company } = await supabase.from('companies').select('name, max_agents, plan').eq('id', profile.company_id).single();
  const { count: agentCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', profile.company_id).eq('role', 'AGENT');
  const maxAgents = company.max_agents ?? 2;
  if (agentCount >= maxAgents) return res.status(403).json({ error: `Limite atteinte : votre plan inclut ${maxAgents} agent(s) maximum.` });

  const { data: existing } = await supabase.from('invitations').select('id').eq('company_id', profile.company_id).eq('email', email.toLowerCase()).eq('status', 'pending').single();
  if (existing) return res.status(409).json({ error: 'Une invitation est déjà en attente pour cet email' });

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
      await sgMail.send({ to: email, from: { email: sender, name: fromName || company.name }, subject: `Invitation à rejoindre ${company.name} sur Bar Ops`, html: buildInviteEmail(company.name, user.email, inviteUrl, role) });
      emailSent = true;
    } catch (e) { emailError = e.message; }
  } else {
    emailError = !sgKey ? 'Clé SendGrid manquante' : 'Adresse expéditeur manquante';
  }

  await supabase.from('audit_logs').insert({ company_id: profile.company_id, actor_id: user.id, action: 'invite_sent', metadata: { email, role } });
  return res.status(200).json({ success: true, inviteUrl, expires_at: invitation.expires_at, emailSent, emailError });
};

function buildInviteEmail(companyName, inviterEmail, inviteUrl, role) {
  const roleLabel = role === 'COMPANY_ADMIN' ? 'Administrateur' : 'Agent';
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px"><h2>Vous êtes invité sur Bar Ops</h2><p><strong>${inviterEmail}</strong> vous invite à rejoindre <strong>${companyName}</strong> en tant que <strong>${roleLabel}</strong>.</p><a href="${inviteUrl}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Accepter l'invitation</a><p style="color:#888;font-size:12px">Ce lien est valable 7 jours.</p></body></html>`;
}
