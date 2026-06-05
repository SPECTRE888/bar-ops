/**
 * Email rate limiting helper.
 * Backed by public.email_rate_limit table (created in Supabase).
 * Fail-open : si la table est inaccessible (erreur DB), on laisse passer
 * pour ne pas bloquer le service. La protection redevient effective
 * dès que Supabase répond.
 *
 * Le préfixe "_" empêche Vercel d'exposer ce fichier comme endpoint.
 */
module.exports = {
  /**
   * Vérifie si user peut envoyer un email maintenant.
   * @param {SupabaseClient} supabase - client init avec SERVICE_KEY
   * @param {string} userId - uuid du user
   * @param {{perHour:number, perDay:number}} limits
   * @returns {Promise<{allowed:boolean, reason?:string, retryAfterSec?:number}>}
   */
  async checkEmailRate(supabase, userId, limits) {
    try {
      const nowMs = Date.now();
      const oneHourAgo = new Date(nowMs - 3600 * 1000).toISOString();
      const oneDayAgo = new Date(nowMs - 86400 * 1000).toISOString();

      const { count: hourCount, error: hErr } = await supabase
        .from('email_rate_limit')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('sent_at', oneHourAgo);
      if (hErr) return { allowed: true }; // fail-open
      if (hourCount != null && hourCount >= limits.perHour) {
        return { allowed: false, reason: 'hourly_limit_reached', retryAfterSec: 3600 };
      }

      const { count: dayCount, error: dErr } = await supabase
        .from('email_rate_limit')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('sent_at', oneDayAgo);
      if (dErr) return { allowed: true }; // fail-open
      if (dayCount != null && dayCount >= limits.perDay) {
        return { allowed: false, reason: 'daily_limit_reached', retryAfterSec: 86400 };
      }

      return { allowed: true };
    } catch {
      return { allowed: true }; // fail-open en cas d'exception
    }
  },

  /**
   * Log un envoi d'email pour le quota futur.
   * Non-bloquant : si l'insert échoue, l'email est déjà parti, on continue.
   */
  async logEmailSent(supabase, userId, endpoint) {
    try {
      await supabase.from('email_rate_limit').insert({ user_id: userId, endpoint });
    } catch { /* ignore */ }
  }
};
