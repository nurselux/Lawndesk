-- Enable RLS on all data tables
ALTER TABLE "Clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (clean slate)
DROP POLICY IF EXISTS "clients_admin_all" ON "Clients";
DROP POLICY IF EXISTS "clients_worker_select" ON "Clients";
DROP POLICY IF EXISTS "jobs_admin_all" ON "Jobs";
DROP POLICY IF EXISTS "jobs_worker_select" ON "Jobs";
DROP POLICY IF EXISTS "jobs_worker_update" ON "Jobs";
DROP POLICY IF EXISTS "invoices_admin_all" ON "Invoices";
DROP POLICY IF EXISTS "profiles_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_read_workers" ON profiles;

-- ============================================================
-- CLIENTS
-- ============================================================
-- Admins: full access to their own clients
CREATE POLICY "clients_admin_all" ON "Clients"
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Workers: read-only access to their admin's clients
CREATE POLICY "clients_worker_select" ON "Clients"
  FOR SELECT
  USING (
    user_id = (
      SELECT owner_id FROM profiles WHERE id = auth.uid() AND role = 'worker'
    )
  );

-- ============================================================
-- JOBS
-- ============================================================
-- Admins: full access to their own jobs
CREATE POLICY "jobs_admin_all" ON "Jobs"
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Workers: read access to their admin's jobs
CREATE POLICY "jobs_worker_select" ON "Jobs"
  FOR SELECT
  USING (
    user_id = (
      SELECT owner_id FROM profiles WHERE id = auth.uid() AND role = 'worker'
    )
  );

-- Workers: update only (clock in/out, notes, status) on their admin's jobs
CREATE POLICY "jobs_worker_update" ON "Jobs"
  FOR UPDATE
  USING (
    user_id = (
      SELECT owner_id FROM profiles WHERE id = auth.uid() AND role = 'worker'
    )
  );

-- ============================================================
-- INVOICES
-- ============================================================
-- Admins only: full access to their own invoices
CREATE POLICY "invoices_admin_all" ON "Invoices"
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PROFILES
-- ============================================================
-- Users can read and update their own profile
CREATE POLICY "profiles_own" ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read their workers' profiles
CREATE POLICY "profiles_admin_read_workers" ON profiles
  FOR SELECT
  USING (
    owner_id = auth.uid()
  );
