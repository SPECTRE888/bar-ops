const { createClient } = require('@supabase/supabase-js');

const PRICES = {
  early:    { monthly: 149,       yearly: 1490 / 12 },
  pro:      { monthly: 199,       yearly: 1990 / 12 },
  business: { monthly: 299,       yearly: 2990 / 12 },
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  try {
    // Verify user from Bearer token — never trust userId from client body
    const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentification requise' }) };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Token invalide ou expiré' }) };
    }

    // Check admin privilege from verified token — not from client body
    if (!process.env.ADMIN_USER_ID || user.id !== process.env.ADMIN_USER_ID) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Accès refusé' }) };
    }

    const { data: subs, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u.email; });

    const now = new Date();
    const active    = subs.filter(s => s.status === 'active'   && new Date(s.expires_at) > now);
    const pastDue   = subs.filter(s => s.status === 'past_due');
    const cancelled = subs.filter(s => s.status === 'cancelled');

    const mrr = active.reduce((sum, s) => sum + (PRICES[s.plan]?.[s.period] || 0), 0);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newThisMonth  = subs.filter(s => s.status === 'active' && new Date(s.created_at) > thirtyDaysAgo).length;

    return {
      statusCode: 200,
      body: JSON.stringify({
        stats: {
          active:      active.length,
          pastDue:     pastDue.length,
          cancelled:   cancelled.length,
          mrr:         Math.round(mrr),
          newThisMonth,
          total:       subs.length,
        },
        subscribers: subs.map(s => ({ ...s, email: userMap[s.user_id] || '—' })),
      }),
    };
  } catch (err) {
    console.error('Admin error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
