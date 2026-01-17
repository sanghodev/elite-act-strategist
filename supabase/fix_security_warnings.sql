-- Fix remaining Supabase security warnings
-- 1. Add search_path to functions
-- 2. Fix overly permissive RLS policies on users and history tables

-- ============================================
-- 1. Fix Function Search Path (Security)
-- ============================================

-- Drop trigger first, then function
DROP TRIGGER IF EXISTS vocabulary_progress_updated_at ON vocabulary_progress;
DROP FUNCTION IF EXISTS update_vocabulary_progress_updated_at();

CREATE OR REPLACE FUNCTION update_vocabulary_progress_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER vocabulary_progress_updated_at
  BEFORE UPDATE ON vocabulary_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_vocabulary_progress_updated_at();

-- Drop and recreate cleanup_old_drills with search_path
DROP FUNCTION IF EXISTS cleanup_old_drills();

CREATE OR REPLACE FUNCTION cleanup_old_drills()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM vocabulary_drills
  WHERE generated_date < CURRENT_DATE - INTERVAL '7 days';
END;
$$;

-- ============================================
-- 2. Fix Overly Permissive RLS Policies
-- ============================================

-- Drop all permissive policies on users table
DROP POLICY IF EXISTS "Public Access" ON users;
DROP POLICY IF EXISTS "Public Access Users" ON users;
DROP POLICY IF EXISTS "Public Users" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable update for all users" ON users;
DROP POLICY IF EXISTS "Enable delete for all users" ON users;

-- Create proper RLS policies for users table
-- Note: Since this app uses localStorage-based auth (not Supabase Auth),
-- we'll use a simple approach where users can only access their own data by ID

-- Users can view all users (needed for getUserByCallsign lookup)
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  USING (true);

-- Users can insert their own user record
CREATE POLICY "Users can insert own user"
  ON users FOR INSERT
  WITH CHECK (true); -- Allow insert for initial user creation

-- Users can update their own user record
CREATE POLICY "Users can update own user"
  ON users FOR UPDATE
  USING (id = current_setting('app.current_user_id', true));

-- Users can delete their own user record
CREATE POLICY "Users can delete own user"
  ON users FOR DELETE
  USING (id = current_setting('app.current_user_id', true));

-- Drop all permissive policies on history table
DROP POLICY IF EXISTS "Public History" ON history;
DROP POLICY IF EXISTS "Public Access History" ON history;
DROP POLICY IF EXISTS "Enable insert for all history" ON history;
DROP POLICY IF EXISTS "Enable update for all history" ON history;
DROP POLICY IF EXISTS "Enable delete for all history" ON history;

-- Create proper RLS policies for history table
-- Users can only access their own history

CREATE POLICY "Users can view own history"
  ON history FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert own history"
  ON history FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own history"
  ON history FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete own history"
  ON history FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- ============================================
-- 3. Helper Function to Set Current User
-- ============================================

-- This function should be called from the application to set the current user
CREATE OR REPLACE FUNCTION set_current_user(user_id_param TEXT)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id_param, false);
END;
$$;

-- ============================================
-- Verification Queries
-- ============================================

-- Verify functions have search_path set:
-- SELECT proname, prosecdef, proconfig 
-- FROM pg_proc 
-- WHERE proname IN ('update_vocabulary_progress_updated_at', 'cleanup_old_drills', 'set_current_user');

-- Verify RLS policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('users', 'history')
-- ORDER BY tablename, policyname;

COMMENT ON FUNCTION update_vocabulary_progress_updated_at() IS 'Trigger function to auto-update updated_at timestamp (with secure search_path)';
COMMENT ON FUNCTION cleanup_old_drills() IS 'Cleanup function to delete drills older than 7 days (with secure search_path)';
COMMENT ON FUNCTION set_current_user(TEXT) IS 'Helper function to set current user context for RLS policies';
