-- ============================================
-- HL SIMULATOR - Supabase Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Demo Accounts (one per user)
CREATE TABLE IF NOT EXISTS public.demo_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(20,2) NOT NULL DEFAULT 10000.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Open Positions
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.demo_accounts(id) ON DELETE CASCADE,
  coin VARCHAR(10) NOT NULL,
  side VARCHAR(5) NOT NULL CHECK (side IN ('Long', 'Short')),
  size DECIMAL(20,8) NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  leverage INTEGER NOT NULL CHECK (leverage >= 1 AND leverage <= 100),
  margin_mode VARCHAR(10) NOT NULL DEFAULT 'cross' CHECK (margin_mode IN ('cross', 'isolated')),
  liquidation_price DECIMAL(20,8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order History
CREATE TABLE IF NOT EXISTS public.order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.demo_accounts(id) ON DELETE CASCADE,
  coin VARCHAR(10) NOT NULL,
  side VARCHAR(5) NOT NULL CHECK (side IN ('Long', 'Short')),
  order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('market', 'limit')),
  size DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'filled' CHECK (status IN ('filled', 'cancelled', 'pending')),
  fee DECIMAL(20,8) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trade History (closed positions)
CREATE TABLE IF NOT EXISTS public.trade_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.demo_accounts(id) ON DELETE CASCADE,
  position_id UUID,
  coin VARCHAR(10) NOT NULL,
  side VARCHAR(5) NOT NULL CHECK (side IN ('Long', 'Short')),
  size DECIMAL(20,8) NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  exit_price DECIMAL(20,8) NOT NULL,
  pnl DECIMAL(20,8) NOT NULL,
  leverage INTEGER NOT NULL,
  liquidated BOOLEAN NOT NULL DEFAULT FALSE,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Demo Fund Requests
CREATE TABLE IF NOT EXISTS public.demo_fund_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.demo_accounts(id) ON DELETE CASCADE,
  amount DECIMAL(20,2) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_demo_accounts_user_id ON public.demo_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_account_id ON public.positions(account_id);
CREATE INDEX IF NOT EXISTS idx_order_history_account_id ON public.order_history(account_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_account_id ON public.trade_history(account_id);
CREATE INDEX IF NOT EXISTS idx_demo_fund_requests_account_id ON public.demo_fund_requests(account_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.demo_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_fund_requests ENABLE ROW LEVEL SECURITY;

-- Demo Accounts: Users can only access their own account
CREATE POLICY "Users can view own account"
  ON public.demo_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account"
  ON public.demo_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own account"
  ON public.demo_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Positions: Users can only access positions from their account
CREATE POLICY "Users can view own positions"
  ON public.positions FOR SELECT
  USING (account_id IN (SELECT id FROM public.demo_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own positions"
  ON public.positions FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM public.demo_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own positions"
  ON public.positions FOR UPDATE
  USING (account_id IN (SELECT id FROM public.demo_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own positions"
  ON public.positions FOR DELETE
  USING (account_id IN (SELECT id FROM public.demo_accounts WHERE user_id = auth.uid()));

-- Order History: Users can only access their own orders
CREATE POLICY "Users can view own orders"
  ON public.order_history FOR SELECT
  USING (account_id IN (SELECT id FROM public.demo_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own orders"
  ON public.order_history FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM public.demo_accounts WHERE user_id = auth.uid()));

-- Trade History: Users can only access their own trades
CREATE POLICY "Users can view own trades"
  ON public.trade_history FOR SELECT
  USING (account_id IN (SELECT id FROM public.demo_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own trades"
  ON public.trade_history FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM public.demo_accounts WHERE user_id = auth.uid()));

-- Fund Requests: Users can only access their own requests
CREATE POLICY "Users can view own fund requests"
  ON public.demo_fund_requests FOR SELECT
  USING (account_id IN (SELECT id FROM public.demo_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own fund requests"
  ON public.demo_fund_requests FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM public.demo_accounts WHERE user_id = auth.uid()));

-- ============================================
-- DONE!
-- ============================================
-- After running this, go to Authentication > Settings
-- and enable Email provider for sign up/sign in
