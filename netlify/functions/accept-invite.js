/**
 * POST /.netlify/functions/accept-invite
 * Body: { token }
 * Auth: Bearer <access_token>  (the newly signed-up / logged-in user)
 *
 * Flow:
 *  1. Validate token, check expiry + status
 *  2. Verify invitation email matches authenticated user email
 *  3. Attach user's profile to the company with the invited role + permissions
 *  4. Mark invitation as accepted
 *  5. Delete or reassign the auto-created company (created by trigger on signup)
 */
const { createClient } = require('@supabase/supabase-js');

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

  const { token: inviteToken } = JSON.parse(event.body || '{}');
  if (!inviteToken) return err(400, 'Token d\'invitation manquant');

  // Load invitation
  const { data: inv, error: invErr } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', inviteToken)
    .single();

  if (invErr || !inv) return err(404, 'Invitation introuvable');
  if (inv.status !== 'pending') return err(409, 'Cette invitation a déjà été utilisée ou annulée');
  if (new Date(inv.expires_at) < new Date()) return err(410, 'Cette invitation a expiré');
  if (inv.email !== user.email.toLowerCase()) {
    return err(403, 'Cet email ne correspond pas à l\'invitation');
  }

  // Find the solo company auto-created for this user by trigger
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  // Update the profile: attach to invited company
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      company_id:  inv.company_id,
      role:        inv.role,
      permissions: inv.permissions,
      invited_by:  inv.invited_by,
      status:      'active',
    })
    .eq('id', user.id);

  if (updateErr) return err(500, updateErr.message);

  // Clean up the orphan company that was auto-created on signup (if it has no other members)
  if (currentProfile?.company_id && currentProfile.company_id !== inv.company_id) {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', currentProfile.company_id);

    if (!count || count === 0) {
      await supabase.from('companies').delete().eq('id', currentProfile.company_id);
    }
  }

  // Mark invitation accepted
  await supabase
    .from('invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', inv.id);

  // Audit log
  await supabase.from('audit_logs').insert({
    company_id: inv.company_id,
    actor_id:   user.id,
    action:     'invite_accepted',
    target_id:  user.id,
    metadata:   { email: user.email, role: inv.role },
  });

  // Return the profile so frontend can store it
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(name, plan, max_agents)')
    .eq('id', user.id)
    .single();

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, profile }),
  };
};

function err(code, message) {
  return { statusCode: code, body: JSON.stringify({ error: message }) };
}
