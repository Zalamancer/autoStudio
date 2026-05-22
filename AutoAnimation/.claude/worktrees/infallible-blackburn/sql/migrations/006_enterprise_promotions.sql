-- ============================================================================
-- Migration 006: Enterprise Plan + Promotion Request Marketplace
--
-- Adds enterprise plan tier, creator profiles, promotion requests with
-- credit escrow, submission workflow, and notification system.
-- ============================================================================

-- ============================================================================
-- 1. Extend subscriptions plan CHECK to include 'enterprise'
-- ============================================================================

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'pro', 'business', 'enterprise'));

-- ============================================================================
-- 2. Creator Profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS creator_profiles (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opted_in         boolean NOT NULL DEFAULT false,
  display_name     text,
  bio              text,
  niche_tags       text[] NOT NULL DEFAULT '{}',
  ai_suggested_tags text[] NOT NULL DEFAULT '{}',
  total_submissions integer NOT NULL DEFAULT 0,
  total_approvals  integer NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  CONSTRAINT creator_profiles_user_id_unique UNIQUE (user_id)
);

-- ============================================================================
-- 3. Promotion Requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS promotion_requests (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text NOT NULL,
  budget_credits   integer NOT NULL CHECK (budget_credits > 0),
  escrowed_credits integer NOT NULL DEFAULT 0,
  spent_credits    integer NOT NULL DEFAULT 0,
  niche_tags       text[] NOT NULL DEFAULT '{}',
  deadline         timestamptz,
  reference_media  jsonb DEFAULT '[]',
  max_submissions  integer NOT NULL DEFAULT 10,
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'open', 'reviewing', 'completed', 'canceled')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. Promotion Submissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS promotion_submissions (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id       uuid NOT NULL REFERENCES promotion_requests(id) ON DELETE CASCADE,
  creator_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id       uuid,
  title            text NOT NULL,
  description      text,
  asset_url        text NOT NULL,
  thumbnail_url    text,
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn')),
  feedback         text,
  reward_credits   integer,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  CONSTRAINT unique_submission_per_creator UNIQUE (request_id, creator_id)
);

-- ============================================================================
-- 5. Credit Escrow
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_escrow (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id       uuid NOT NULL REFERENCES promotion_requests(id) ON DELETE CASCADE,
  amount           integer NOT NULL CHECK (amount > 0),
  status           text NOT NULL DEFAULT 'held'
                     CHECK (status IN ('held', 'released', 'refunded')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ============================================================================
-- 6. Notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             text NOT NULL,
  title            text NOT NULL,
  body             text,
  metadata         jsonb DEFAULT '{}',
  read             boolean NOT NULL DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================================
-- 7. Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_creator_profiles_niche_tags
  ON creator_profiles USING GIN (niche_tags);

CREATE INDEX IF NOT EXISTS idx_promotion_requests_niche_tags
  ON promotion_requests USING GIN (niche_tags);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, created_at DESC) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_promotion_requests_status
  ON promotion_requests (status);

CREATE INDEX IF NOT EXISTS idx_promotion_submissions_request
  ON promotion_submissions (request_id);

CREATE INDEX IF NOT EXISTS idx_promotion_submissions_creator
  ON promotion_submissions (creator_id);

CREATE INDEX IF NOT EXISTS idx_credit_escrow_request
  ON credit_escrow (request_id);

-- ============================================================================
-- 8. Row Level Security
-- ============================================================================

ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Creator Profiles: owners can read/write their own; opted-in profiles browsable by authenticated users
CREATE POLICY creator_profiles_select_own ON creator_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY creator_profiles_select_opted_in ON creator_profiles
  FOR SELECT USING (opted_in = true AND auth.role() = 'authenticated');

CREATE POLICY creator_profiles_insert ON creator_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY creator_profiles_update ON creator_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Promotion Requests: enterprise owner can CRUD; open requests browsable by authenticated users
CREATE POLICY promotion_requests_select_own ON promotion_requests
  FOR SELECT USING (auth.uid() = enterprise_id);

CREATE POLICY promotion_requests_select_open ON promotion_requests
  FOR SELECT USING (status = 'open' AND auth.role() = 'authenticated');

CREATE POLICY promotion_requests_insert ON promotion_requests
  FOR INSERT WITH CHECK (auth.uid() = enterprise_id);

CREATE POLICY promotion_requests_update ON promotion_requests
  FOR UPDATE USING (auth.uid() = enterprise_id);

-- Promotion Submissions: creators see their own; enterprise sees submissions on their requests
CREATE POLICY promotion_submissions_select_creator ON promotion_submissions
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY promotion_submissions_select_enterprise ON promotion_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM promotion_requests
      WHERE promotion_requests.id = promotion_submissions.request_id
        AND promotion_requests.enterprise_id = auth.uid()
    )
  );

CREATE POLICY promotion_submissions_insert ON promotion_submissions
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY promotion_submissions_update_creator ON promotion_submissions
  FOR UPDATE USING (auth.uid() = creator_id);

-- Credit Escrow: users see their own escrow records
CREATE POLICY credit_escrow_select ON credit_escrow
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications: users see their own
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 9. RPC: escrow_credits_for_request
--
-- Atomically deducts credits from enterprise balance and holds them in escrow.
-- Returns JSON: { success, new_balance, error_message? }
-- ============================================================================

CREATE OR REPLACE FUNCTION escrow_credits_for_request(
  p_enterprise_id uuid,
  p_request_id uuid,
  p_amount integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance credit_balances%ROWTYPE;
  v_new_balance integer;
BEGIN
  -- Lock the credit balance row
  SELECT * INTO v_balance
  FROM credit_balances
  WHERE user_id = p_enterprise_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'new_balance', 0,
      'error_message', 'No credit balance found for user'
    );
  END IF;

  -- Check sufficient balance
  IF v_balance.credits_remaining < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'new_balance', v_balance.credits_remaining,
      'error_message', 'Insufficient credits for escrow'
    );
  END IF;

  -- Deduct from balance
  v_new_balance := v_balance.credits_remaining - p_amount;

  UPDATE credit_balances
  SET credits_remaining = v_new_balance,
      updated_at = now()
  WHERE user_id = p_enterprise_id;

  -- Create escrow record
  INSERT INTO credit_escrow (user_id, request_id, amount, status)
  VALUES (p_enterprise_id, p_request_id, p_amount, 'held');

  -- Update promotion request escrowed total
  UPDATE promotion_requests
  SET escrowed_credits = escrowed_credits + p_amount,
      updated_at = now()
  WHERE id = p_request_id;

  -- Audit log
  INSERT INTO credit_transactions (user_id, amount, operation, description, balance_after)
  VALUES (
    p_enterprise_id,
    -p_amount,
    'escrow',
    'Credits escrowed for promotion request ' || p_request_id::text,
    v_new_balance
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$;

-- ============================================================================
-- 10. RPC: approve_submission
--
-- Enterprise approves a creator submission, releasing escrowed credits as reward.
-- Returns JSON: { success, error_message? }
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_submission(
  p_enterprise_id uuid,
  p_submission_id uuid,
  p_reward_credits integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_submission promotion_submissions%ROWTYPE;
  v_request promotion_requests%ROWTYPE;
  v_creator_balance integer;
BEGIN
  -- Fetch submission
  SELECT * INTO v_submission
  FROM promotion_submissions
  WHERE id = p_submission_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_message', 'Submission not found'
    );
  END IF;

  -- Fetch request and verify ownership
  SELECT * INTO v_request
  FROM promotion_requests
  WHERE id = v_submission.request_id
  FOR UPDATE;

  IF NOT FOUND OR v_request.enterprise_id != p_enterprise_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_message', 'Promotion request not found or not owned by caller'
    );
  END IF;

  -- Check escrow has enough remaining
  IF (v_request.escrowed_credits - v_request.spent_credits) < p_reward_credits THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_message', 'Insufficient escrowed credits for this reward'
    );
  END IF;

  -- Update submission status and reward
  UPDATE promotion_submissions
  SET status = 'approved',
      reward_credits = p_reward_credits,
      updated_at = now()
  WHERE id = p_submission_id;

  -- Update promotion request spent total
  UPDATE promotion_requests
  SET spent_credits = spent_credits + p_reward_credits,
      updated_at = now()
  WHERE id = v_request.id;

  -- Release credits to creator balance
  UPDATE credit_balances
  SET credits_remaining = credits_remaining + p_reward_credits,
      updated_at = now()
  WHERE user_id = v_submission.creator_id
  RETURNING credits_remaining INTO v_creator_balance;

  -- If creator has no balance row, create one
  IF NOT FOUND THEN
    INSERT INTO credit_balances (user_id, credits_remaining, credits_used_today, last_daily_reset, plan_credits_total, period_credits_used)
    VALUES (v_submission.creator_id, p_reward_credits, 0, CURRENT_DATE, 150, 0)
    RETURNING credits_remaining INTO v_creator_balance;
  END IF;

  -- Update creator profile stats
  UPDATE creator_profiles
  SET total_approvals = total_approvals + 1,
      updated_at = now()
  WHERE user_id = v_submission.creator_id;

  -- Audit log: enterprise escrow release
  INSERT INTO credit_transactions (user_id, amount, operation, description, balance_after)
  VALUES (
    p_enterprise_id,
    -p_reward_credits,
    'escrow-release',
    'Escrow released for approved submission ' || p_submission_id::text,
    (SELECT credits_remaining FROM credit_balances WHERE user_id = p_enterprise_id)
  );

  -- Audit log: creator reward
  INSERT INTO credit_transactions (user_id, amount, operation, description, balance_after)
  VALUES (
    v_submission.creator_id,
    p_reward_credits,
    'reward',
    'Reward for approved submission on request ' || v_request.id::text,
    v_creator_balance
  );

  -- Notify creator
  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (
    v_submission.creator_id,
    'submission_approved',
    'Submission Approved!',
    'Your submission "' || v_submission.title || '" was approved. You earned ' || p_reward_credits || ' credits.',
    jsonb_build_object(
      'request_id', v_request.id,
      'submission_id', p_submission_id,
      'reward_credits', p_reward_credits
    )
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================================
-- 11. RPC: refund_escrow_remainder
--
-- Refunds unused escrowed credits back to the enterprise balance.
-- Returns JSON: { success, refunded_amount, error_message? }
-- ============================================================================

CREATE OR REPLACE FUNCTION refund_escrow_remainder(
  p_enterprise_id uuid,
  p_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request promotion_requests%ROWTYPE;
  v_remainder integer;
  v_new_balance integer;
BEGIN
  -- Fetch and lock the request
  SELECT * INTO v_request
  FROM promotion_requests
  WHERE id = p_request_id AND enterprise_id = p_enterprise_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'refunded_amount', 0,
      'error_message', 'Promotion request not found or not owned by caller'
    );
  END IF;

  v_remainder := v_request.escrowed_credits - v_request.spent_credits;

  IF v_remainder <= 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'refunded_amount', 0
    );
  END IF;

  -- Refund to enterprise balance
  UPDATE credit_balances
  SET credits_remaining = credits_remaining + v_remainder,
      updated_at = now()
  WHERE user_id = p_enterprise_id
  RETURNING credits_remaining INTO v_new_balance;

  -- Mark escrow records as refunded
  UPDATE credit_escrow
  SET status = 'refunded',
      updated_at = now()
  WHERE request_id = p_request_id AND status = 'held';

  -- Zero out the remaining escrow on the request
  UPDATE promotion_requests
  SET escrowed_credits = spent_credits,
      updated_at = now()
  WHERE id = p_request_id;

  -- Audit log
  INSERT INTO credit_transactions (user_id, amount, operation, description, balance_after)
  VALUES (
    p_enterprise_id,
    v_remainder,
    'escrow-refund',
    'Escrow remainder refunded for request ' || p_request_id::text,
    v_new_balance
  );

  -- Notify enterprise
  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (
    p_enterprise_id,
    'escrow_refunded',
    'Escrow Credits Refunded',
    v_remainder || ' unused credits have been returned to your balance.',
    jsonb_build_object(
      'request_id', p_request_id,
      'refunded_amount', v_remainder
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'refunded_amount', v_remainder
  );
END;
$$;
