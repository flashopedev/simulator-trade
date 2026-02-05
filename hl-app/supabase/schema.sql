-- HL Simulator Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Demo accounts
CREATE TABLE demo_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(15,2) NOT NULL DEFAULT 10000.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Positions (open)
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES demo_accounts(id) ON DELETE CASCADE,
  coin VARCHAR(10) NOT NULL,
  side VARCHAR(5) NOT NULL CHECK (side IN ('Long', 'Short')),
  size NUMERIC(18,8) NOT NULL,
  entry_price NUMERIC(18,8) NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 10,
  margin_mode VARCHAR(10) NOT NULL DEFAULT 'cross' CHECK (margin_mode IN ('cross', 'isolated')),
  liquidation_price NUMERIC(18,8) NOT NULL,
  fee NUMERIC(15,8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order history
CREATE TABLE order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES demo_accounts(id) ON DELETE CASCADE,
  coin VARCHAR(10) NOT NULL,
  side VARCHAR(5) NOT NULL CHECK (side IN ('Long', 'Short')),
  order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('market', 'limit')),
  size NUMERIC(18,8) NOT NULL,
  price NUMERIC(18,8) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'filled' CHECK (status IN ('filled', 'cancelled')),
  fee NUMERIC(15,8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trade history (closed positions)
CREATE TABLE trade_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES demo_accounts(id) ON DELETE CASCADE,
  coin VARCHAR(10) NOT NULL,
  side VARCHAR(5) NOT NULL CHECK (side IN ('Long', 'Short')),
  size NUMERIC(18,8) NOT NULL,
  entry_price NUMERIC(18,8) NOT NULL,
  close_price NUMERIC(18,8) NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 10,
  pnl NUMERIC(15,8) NOT NULL DEFAULT 0,
  fee NUMERIC(15,8) NOT NULL DEFAULT 0,
  liquidated BOOLEAN NOT NULL DEFAULT FALSE,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Demo fund requests
CREATE TABLE demo_fund_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES demo_accounts(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_positions_account ON positions(account_id);
CREATE INDEX idx_order_history_account ON order_history(account_id);
CREATE INDEX idx_trade_history_account ON trade_history(account_id);
CREATE INDEX idx_demo_accounts_user ON demo_accounts(user_id);
CREATE INDEX idx_demo_fund_requests_account ON demo_fund_requests(account_id);

-- Updated_at trigger for demo_accounts
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_demo_accounts_updated_at
  BEFORE UPDATE ON demo_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE demo_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_fund_requests ENABLE ROW LEVEL SECURITY;

-- Demo accounts: users can only access their own account
CREATE POLICY "Users can view own account"
  ON demo_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account"
  ON demo_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own account"
  ON demo_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Positions: users can only access positions belonging to their account
CREATE POLICY "Users can view own positions"
  ON positions FOR SELECT
  USING (account_id IN (SELECT id FROM demo_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own positions"
  ON positions FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM demo_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own positions"
  ON positions FOR DELETE
  USING (account_id IN (SELECT id FROM demo_accounts WHERE user_id = auth.uid()));

-- Order history
CREATE POLICY "Users can view own orders"
  ON order_history FOR SELECT
  USING (account_id IN (SELECT id FROM demo_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own orders"
  ON order_history FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM demo_accounts WHERE user_id = auth.uid()));

-- Trade history
CREATE POLICY "Users can view own trades"
  ON trade_history FOR SELECT
  USING (account_id IN (SELECT id FROM demo_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own trades"
  ON trade_history FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM demo_accounts WHERE user_id = auth.uid()));

-- Demo fund requests
CREATE POLICY "Users can view own fund requests"
  ON demo_fund_requests FOR SELECT
  USING (account_id IN (SELECT id FROM demo_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own fund requests"
  ON demo_fund_requests FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM demo_accounts WHERE user_id = auth.uid()));
