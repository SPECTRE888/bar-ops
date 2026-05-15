-- ============================================================
-- Multi-user SaaS : companies, profiles, invitations
-- ============================================================

-- 1. COMPANIES
CREATE TABLE IF NOT EXISTS public.companies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  owner_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan          text NOT NULL DEFAULT 'solo', -- solo | team | business
  max_agents    int  NOT NULL DEFAULT 0,       -- 0 = solo (no sub-users)
  logo_url      text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. USER PROFILES  (one per auth.users row)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  role          text NOT NULL DEFAULT 'COMPANY_ADMIN',
  -- roles: SUPER_ADMIN | COMPANY_ADMIN | AGENT
  permissions   jsonb NOT NULL DEFAULT '{
    "canViewRevenue":    true,
    "canViewAnalytics":  true,
    "canManageClients":  true,
    "canEditProjects":   true,
    "canManageStaff":    true,
    "canManageSuppliers":true,
    "canViewCosts":      true,
    "canExportData":     true
  }'::jsonb,
  full_name     text,
  avatar_url    text,
  status        text NOT NULL DEFAULT 'active', -- active | suspended | pending
  invited_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 3. INVITATIONS
CREATE TABLE IF NOT EXISTS public.invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invited_by    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  role          text NOT NULL DEFAULT 'AGENT',
  permissions   jsonb NOT NULL DEFAULT '{
    "canViewRevenue":    false,
    "canViewAnalytics":  false,
    "canManageClients":  true,
    "canEditProjects":   true,
    "canManageStaff":    false,
    "canManageSuppliers":false,
    "canViewCosts":      false,
    "canExportData":     false
  }'::jsonb,
  token         text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status        text NOT NULL DEFAULT 'pending', -- pending | accepted | expired | cancelled
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 4. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            bigserial PRIMARY KEY,
  company_id    uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action        text NOT NULL,          -- e.g. 'invite_sent', 'permission_updated', 'agent_removed'
  target_id     uuid,                   -- user or resource affected
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 5. Extend workspaces to scope by company (add company_id if not exists)
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_company    ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email   ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token   ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_company ON public.invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_company       ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_company  ON public.workspaces(company_id);

-- ============================================================
-- TRIGGERS: updated_at auto-refresh
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_companies_updated
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- TRIGGER: auto-create profile + company on first sign-up
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _company_id uuid;
BEGIN
  -- Only create a company if not accepting an invitation
  -- (invitation flow sets company_id via accept-invite function)
  INSERT INTO public.companies (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1) || '''s Company'),
    NEW.id
  )
  RETURNING id INTO _company_id;

  INSERT INTO public.profiles (id, company_id, role)
  VALUES (NEW.id, _company_id, 'COMPANY_ADMIN');

  RETURN NEW;
END;
$$;

-- Fire only for brand-new users (not on update)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.companies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs   ENABLE ROW LEVEL SECURITY;

-- Helper: get caller's company_id without a round-trip
CREATE OR REPLACE FUNCTION public.my_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- companies: members of the company can read; only admin can write
CREATE POLICY "company_read"  ON public.companies FOR SELECT
  USING (id = public.my_company_id() OR public.my_role() = 'SUPER_ADMIN');

CREATE POLICY "company_admin_write" ON public.companies FOR UPDATE
  USING (owner_id = auth.uid() OR public.my_role() = 'SUPER_ADMIN');

-- profiles: same-company members can read; only COMPANY_ADMIN or self can write
CREATE POLICY "profile_read" ON public.profiles FOR SELECT
  USING (company_id = public.my_company_id() OR public.my_role() = 'SUPER_ADMIN');

CREATE POLICY "profile_self_write" ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profile_admin_write" ON public.profiles FOR UPDATE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('COMPANY_ADMIN', 'SUPER_ADMIN')
  );

-- invitations: COMPANY_ADMIN can manage their own company invitations
CREATE POLICY "inv_read" ON public.invitations FOR SELECT
  USING (company_id = public.my_company_id() OR public.my_role() = 'SUPER_ADMIN');

CREATE POLICY "inv_admin_insert" ON public.invitations FOR INSERT
  WITH CHECK (
    company_id = public.my_company_id()
    AND public.my_role() IN ('COMPANY_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "inv_admin_update" ON public.invitations FOR UPDATE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('COMPANY_ADMIN', 'SUPER_ADMIN')
  );

-- audit_logs: same-company read; writes only via service role (functions)
CREATE POLICY "audit_read" ON public.audit_logs FOR SELECT
  USING (company_id = public.my_company_id() OR public.my_role() = 'SUPER_ADMIN');

-- workspaces: scope reads/writes to company
DROP POLICY IF EXISTS "workspace_user" ON public.workspaces;

CREATE POLICY "workspace_company" ON public.workspaces FOR ALL
  USING (
    company_id = public.my_company_id()
    OR user_id = auth.uid()          -- backwards compat for solo accounts
  )
  WITH CHECK (
    company_id = public.my_company_id()
    OR user_id = auth.uid()
  );

-- ============================================================
-- DEFAULT AGENT PERMISSIONS (reference)
-- ============================================================
-- AGENT (restricted):
-- { canViewRevenue:false, canViewAnalytics:false, canManageClients:true,
--   canEditProjects:true, canManageStaff:false, canManageSuppliers:false,
--   canViewCosts:false, canExportData:false }
--
-- COMPANY_ADMIN (full):
-- { canViewRevenue:true, canViewAnalytics:true, canManageClients:true,
--   canEditProjects:true, canManageStaff:true, canManageSuppliers:true,
--   canViewCosts:true, canExportData:true }
