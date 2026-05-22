-- ============================================================================
-- Stripe Credit System Schema
-- Run this in the Supabase SQL Editor to create the billing tables + RPCs.
-- ============================================================================

-- 1. Subscriptions — one row per user, tracks Stripe state
CREATE TABLE IF NOT EXISTS subscriptions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id    text,
  stripe_subscription_id text,
  plan        text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id)
);

-- 2. Credit Balances — one row per user, mutable credit counter
CREATE TABLE IF NOT EXISTS credit_balances (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining   integer NOT NULL DEFAULT 150,
  credits_used_today  integer NOT NULL DEFAULT 0,
  last_daily_reset    date NOT NULL DEFAULT CURRENT_DATE,
  plan_credits_total  integer NOT NULL DEFAULT 150,
  period_credits_used integer NOT NULL DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  CONSTRAINT credit_balances_user_id_unique UNIQUE (user_id)
);

-- 3. Credit Transactions — append-only audit log
CREATE TABLE IF NOT EXISTS credit_transactions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        integer NOT NULL,            -- negative = deduction, positive = refund/allocation
  operation     text NOT NULL,               -- e.g. 'elevenlabs-tts', 'refund', 'plan-allocation'
  description   text,
  balance_after integer NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);

-- ============================================================================
-- RLS Policies
-- Users can read their own rows. All writes go through the backend (service key).
-- ============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Subscriptions
CREATE POLICY subscriptions_select ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Credit Balances
CREATE POLICY credit_balances_select ON credit_balances
  FOR SELECT USING (auth.uid() = user_id);

-- Credit Transactions
CREATE POLICY credit_transactions_select ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- RPC: deduct_credits
-- Atomic credit deduction with row lock. Handles free-tier daily reset inline.
-- Returns JSON: { success: boolean, new_balance: integer, error_message?: string }
-- ============================================================================

CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_operation text,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row credit_balances%ROWTYPE;
  v_new_balance integer;
  v_sub subscriptions%ROWTYPE;
BEGIN
  -- Lock the row for this user
  SELECT * INTO v_row
  FROM credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no balance row exists, create one (free tier defaults)
  IF NOT FOUND THEN
    INSERT INTO credit_balances (user_id, credits_remaining, credits_used_today, last_daily_reset, plan_credits_total, period_credits_used)
    VALUES (p_user_id, 150, 0, CURRENT_DATE, 150, 0)
    RETURNING * INTO v_row;

    -- Also ensure a subscription row exists
    INSERT INTO subscriptions (user_id, plan, status)
    VALUES (p_user_id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Check if this is a free-tier user needing daily reset
  SELECT * INTO v_sub FROM subscriptions WHERE user_id = p_user_id;

  IF v_sub.plan = 'free' AND v_row.last_daily_reset < CURRENT_DATE THEN
    -- Reset daily credits
    v_row.credits_remaining := 150;
    v_row.credits_used_today := 0;
    v_row.last_daily_reset := CURRENT_DATE;

    UPDATE credit_balances
    SET credits_remaining = 150,
        credits_used_today = 0,
        last_daily_reset = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  -- Check sufficient balance
  IF v_row.credits_remaining < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'new_balance', v_row.credits_remaining,
      'error_message', 'Insufficient credits'
    );
  END IF;

  -- Deduct
  v_new_balance := v_row.credits_remaining - p_amount;

  UPDATE credit_balances
  SET credits_remaining = v_new_balance,
      credits_used_today = credits_used_today + p_amount,
      period_credits_used = period_credits_used + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Audit log
  INSERT INTO credit_transactions (user_id, amount, operation, description, balance_after)
  VALUES (p_user_id, -p_amount, p_operation, p_description, v_new_balance);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$;

-- ============================================================================
-- RPC: refund_credits
-- Adds credits back on AI operation failure.
-- Returns JSON: { success: boolean, new_balance: integer }
-- ============================================================================

CREATE OR REPLACE FUNCTION refund_credits(
  p_user_id uuid,
  p_amount integer,
  p_operation text,
  p_description text DEFAULT 'Operation failed — credits refunded'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  UPDATE credit_balances
  SET credits_remaining = credits_remaining + p_amount,
      credits_used_today = GREATEST(credits_used_today - p_amount, 0),
      period_credits_used = GREATEST(period_credits_used - p_amount, 0),
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits_remaining INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'new_balance', 0);
  END IF;

  -- Audit log
  INSERT INTO credit_transactions (user_id, amount, operation, description, balance_after)
  VALUES (p_user_id, p_amount, 'refund:' || p_operation, p_description, v_new_balance);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$;
