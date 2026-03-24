DROP POLICY IF EXISTS "Users can only see their own clients" ON "Clients";
DROP POLICY IF EXISTS "Workers can view admin clients" ON "Clients";
DROP POLICY IF EXISTS "Users can only see their own invoices" ON "Invoices";
DROP POLICY IF EXISTS "Users can only see their own jobs" ON "Jobs";
DROP POLICY IF EXISTS "Workers can update admin jobs" ON "Jobs";
DROP POLICY IF EXISTS "Workers can view admin jobs" ON "Jobs";
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile or their workers" ON profiles;
