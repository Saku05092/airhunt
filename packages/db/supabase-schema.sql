-- AirHunt Supabase Schema v2
--
-- HOW TO USE:
-- 1. Supabase Dashboard -> SQL Editor -> New Query
-- 2. If re-running, first execute the RESET block below
-- 3. Then execute the full schema
--
-- RESET (run first if tables already exist):
--   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--   DROP FUNCTION IF EXISTS handle_new_user();
--   DROP TABLE IF EXISTS wallet_tasks CASCADE;
--   DROP TABLE IF EXISTS custom_tasks CASCADE;
--   DROP TABLE IF EXISTS user_campaigns CASCADE;
--   DROP TABLE IF EXISTS wallets CASCADE;
--   DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================
-- USER PROFILES (plan management) -- MUST BE FIRST
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO', 'UNLIMITED')),
  wallet_limit INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow the trigger function to insert (runs as service_role)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, plan, wallet_limit)
  VALUES (NEW.id, 'FREE', 1);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- WALLETS
-- ============================================================
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  chain TEXT NOT NULL CHECK (chain IN ('ETHEREUM', 'ARBITRUM', 'OPTIMISM', 'BASE', 'POLYGON', 'SOLANA')),
  label TEXT DEFAULT '',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wallets_user_address_chain ON wallets(user_id, address, chain);
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallets" ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallets" ON wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wallets" ON wallets FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- USER CAMPAIGNS (tracked by user)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  priority_override INT,
  notes TEXT DEFAULT '',
  added_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_campaigns_unique ON user_campaigns(user_id, campaign_id);
ALTER TABLE user_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns" ON user_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON user_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON user_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON user_campaigns FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- CUSTOM TASKS (user-created tasks per campaign)
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE custom_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON custom_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON custom_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON custom_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON custom_tasks FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- WALLET TASKS (task completion per wallet)
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT DEFAULT ''
);

CREATE UNIQUE INDEX IF NOT EXISTS wallet_tasks_unique ON wallet_tasks(wallet_id, task_id);
ALTER TABLE wallet_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet tasks" ON wallet_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet tasks" ON wallet_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet tasks" ON wallet_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wallet tasks" ON wallet_tasks FOR DELETE USING (auth.uid() = user_id);
