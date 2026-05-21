const { createClient } = require('@supabase/supabase-js');

const PRICES = {
  early:    { monthly: 149, yearly: 1490 / 12 },
  pro:      { monthly: 199, yearly: 1990 / 12 },
  business: { monthly: 299, yearly: 2990 / 12 },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const token = (req.headers['authorization'] || req.headers['Authorization'] || '').replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Authentification requise' });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Token invalide ou expiré' });

    if (!process.env.ADMIN_USER_ID || user.id !== process.env.ADMIN_USER_ID) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { data: subs, error } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u.email; });

    const now = new Date();
    const active    = subs.filter(s => s.status === 'active' && new Date(s.expires_at) > now);
    const pastDue   = subs.filter(s => s.status === 'past_due');
    const cancelled = subs.filter(s => s.status === 'cancelled');
    const mrr = active.reduce((sum, s) => sum + (PRICES[s.plan]?.[s.period] || 0), 0);
    const newThisMonth = subs.filter(s => s.status === 'active' && new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;

    return res.status(200).json({
      stats: { active: active.length, pastDue: pastDue.length, cancelled: cancelled.length, mrr: Math.round(mrr), newThisMonth, total: subs.length },
      subscribers: subs.map(s => ({ ...s, email: userMap[s.user_id] || '—' })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
