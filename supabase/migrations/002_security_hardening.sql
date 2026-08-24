-- ============================================================
-- Durcissement sécurité — suite à l'audit RGPD du 2026-08-24
-- Appliqué en direct sur le projet lié (hrpcdtkhnewigewomcvv) via
-- `supabase db query --linked`, documenté ici pour que le schéma
-- versionné reste la source de vérité.
-- ============================================================

-- 1. subscriptions : la policy ALL permettait à un utilisateur connecté
--    d'écrire directement sur sa propre ligne (INSERT/UPDATE/DELETE) via
--    le client Supabase, donc de s'auto-attribuer un abonnement actif
--    sans passer par Stripe. Seule la lecture doit rester ouverte côté
--    client — toutes les écritures légitimes passent par la clé de
--    service dans api/webhook.js (qui contourne RLS de toute façon).
DROP POLICY IF EXISTS "users_own_subscriptions" ON public.subscriptions;
-- La policy SELECT "Users read own subscription" (auth.uid() = user_id) reste en place.

-- 2. cleanup_old_sessions(uuid) : SECURITY DEFINER, prenait un uid en
--    paramètre libre et n'était référencée par aucun code applicatif ni
--    par pg_cron (seule cleanup_sessions(), sans paramètre, est planifiée).
--    Exposée en RPC, elle permettait à n'importe qui (anon compris) de
--    supprimer les sessions de n'importe quel autre utilisateur.
REVOKE EXECUTE ON FUNCTION public.cleanup_old_sessions(uuid) FROM PUBLIC, anon, authenticated;

-- 3. handle_new_user() : fonction trigger (RETURNS trigger) sur auth.users,
--    jamais censée être appelée hors contexte de trigger. Postgres refuse
--    déjà l'appel direct, mais on ferme la surface RPC exposée par erreur.
--    Le trigger continue de fonctionner (son déclenchement ne passe pas
--    par les droits EXECUTE classiques).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. my_company_id()/my_role() restent exécutables par `authenticated` :
--    elles sont utilisées à l'intérieur des policies RLS existantes
--    (workspace_company, inv_read, inv_admin_insert/update, etc.) et
--    révoquer EXECUTE casserait ces policies. Le risque résiduel est nul :
--    elles ne renvoient que les infos du user courant (auth.uid()), jamais
--    celles d'un tiers. Non modifié intentionnellement.

-- 5. search_path mutable sur les fonctions de ce schéma (linter Supabase) :
--    fixé pour éviter tout risque de search_path hijacking.
ALTER FUNCTION public.cleanup_sessions() SET search_path = public, pg_temp;
ALTER FUNCTION public.touch_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.my_company_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.my_role() SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_old_sessions(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
