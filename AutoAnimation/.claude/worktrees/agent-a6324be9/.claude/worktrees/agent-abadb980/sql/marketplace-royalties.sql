-- ============================================================================
-- Marketplace Creator Royalty System
-- Run this in the Supabase SQL Editor after stripe-credits.sql.
-- ============================================================================

-- 1. Marketplace Listings — assets published by creators for cross-user sharing
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  category    text NOT NULL CHECK (category IN (
    'characters', 'animations', 'audio', 'text', 'transitions',
    'ai-animations', 'html-templates', 'captions', 'collages', 'projects',
    '3d-characters', '3d-animations'
  )),
  asset_url     text NOT NULL,
  thumbnail_url text,
  metadata      jsonb DEFAULT '{}'::jsonb,
  use_count     integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_creator ON marketplace_listings(creator_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category);

-- 2. Project Marketplace Usage — tracks which listings a project consumed
CREATE TABLE IF NOT EXISTS project_marketplace_usage (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  listing_id  uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT project_marketplace_usage_unique UNIQUE (project_id, listing_id)
);

-- 3. Creator Royalties — audit log of royalty distributions
CREATE TABLE IF NOT EXISTS creator_royalties (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consumer_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id      uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  credits_granted integer NOT NULL,
  total_clip_credits integer NOT NULL,
  royalty_pool    integer NOT NULL,
  creators_in_pool integer NOT NULL,
  created_at      timestamptz DEFAULT now(),
  CONSTRAINT creator_royalties_project_creator_unique UNIQUE (project_id, creator_id)
);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_marketplace_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_royalties ENABLE ROW LEVEL SECURITY;

-- Listings: anyone can browse; only creator can insert/delete own
CREATE POLICY marketplace_listings_select ON marketplace_listings
  FOR SELECT USING (true);

CREATE POLICY marketplace_listings_insert ON marketplace_listings
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY marketplace_listings_delete ON marketplace_listings
  FOR DELETE USING (auth.uid() = creator_id);

-- Usage: users can see their own project usage
CREATE POLICY project_marketplace_usage_select ON project_marketplace_usage
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Royalties: creators and consumers can see their own records
CREATE POLICY creator_royalties_select ON creator_royalties
  FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = consumer_id);

-- ============================================================================
-- RPC: distribute_royalties
-- Distributes 10% of total credits spent on a clip to marketplace creators
-- whose assets were used. Mints bonus credits (consumer is NOT charged extra).
-- Returns JSON: { success, royalty_pool, creator_count, distributions[] }
-- ============================================================================

CREATE OR REPLACE FUNCTION distribute_royalties(
  p_consumer_id uuid,
  p_project_id uuid,
  p_total_credits_spent integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pool integer;
  v_creator_count integer;
  v_per_creator integer;
  v_remainder integer;
  v_distributions jsonb := '[]'::jsonb;
  v_creator record;
  v_new_balance integer;
BEGIN
  -- Calculate royalty pool: 10% of total credits, rounded down
  v_pool := FLOOR(p_total_credits_spent * 0.10);

  IF v_pool <= 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'royalty_pool', 0,
      'creator_count', 0,
      'distributions', '[]'::jsonb
    );
  END IF;

  -- Find unique creators whose listings were used in this project
  -- Exclude self-usage (consumer using their own assets)
  CREATE TEMP TABLE _royalty_creators ON COMMIT DROP AS
    SELECT DISTINCT ml.creator_id, ml.id AS listing_id, ml.title AS listing_title
    FROM project_marketplace_usage pmu
    JOIN marketplace_listings ml ON ml.id = pmu.listing_id
    WHERE pmu.project_id = p_project_id
      AND ml.creator_id != p_consumer_id;

  SELECT COUNT(DISTINCT creator_id) INTO v_creator_count FROM _royalty_creators;

  IF v_creator_count = 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'royalty_pool', 0,
      'creator_count', 0,
      'distributions', '[]'::jsonb
    );
  END IF;

  -- Split pool evenly among unique creators
  v_per_creator := FLOOR(v_pool::numeric / v_creator_count);
  v_remainder := v_pool - (v_per_creator * v_creator_count);

  IF v_per_creator <= 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'royalty_pool', v_pool,
      'creator_count', v_creator_count,
      'distributions', '[]'::jsonb,
      'message', 'Pool too small to distribute'
    );
  END IF;

  -- Distribute to each unique creator
  FOR v_creator IN
    SELECT DISTINCT ON (creator_id) creator_id, listing_id, listing_title
    FROM _royalty_creators
    ORDER BY creator_id, listing_id
  LOOP
    -- Check for duplicate distribution (idempotency)
    IF EXISTS (
      SELECT 1 FROM creator_royalties
      WHERE project_id = p_project_id AND creator_id = v_creator.creator_id
    ) THEN
      CONTINUE;
    END IF;

    -- Add bonus credits to creator's balance (mint new credits)
    UPDATE credit_balances
    SET credits_remaining = credits_remaining + v_per_creator,
        updated_at = now()
    WHERE user_id = v_creator.creator_id
    RETURNING credits_remaining INTO v_new_balance;

    -- Auto-create balance row if it doesn't exist
    IF NOT FOUND THEN
      INSERT INTO credit_balances (user_id, credits_remaining, credits_used_today, last_daily_reset, plan_credits_total, period_credits_used)
      VALUES (v_creator.creator_id, 150 + v_per_creator, 0, CURRENT_DATE, 150, 0)
      RETURNING credits_remaining INTO v_new_balance;
    END IF;

    -- Log the credit transaction
    INSERT INTO credit_transactions (user_id, amount, operation, description, balance_after)
    VALUES (
      v_creator.creator_id,
      v_per_creator,
      'marketplace-royalty',
      format('Royalty: %s credits from clip usage of "%s"', v_per_creator, v_creator.listing_title),
      v_new_balance
    );

    -- Log the royalty record
    INSERT INTO creator_royalties (creator_id, consumer_id, listing_id, project_id, credits_granted, total_clip_credits, royalty_pool, creators_in_pool)
    VALUES (v_creator.creator_id, p_consumer_id, v_creator.listing_id, p_project_id, v_per_creator, p_total_credits_spent, v_pool, v_creator_count);

    -- Increment use_count on the listing
    UPDATE marketplace_listings
    SET use_count = use_count + 1, updated_at = now()
    WHERE id = v_creator.listing_id;

    -- Build distribution record
    v_distributions := v_distributions || jsonb_build_object(
      'creator_id', v_creator.creator_id,
      'listing_id', v_creator.listing_id,
      'credits_granted', v_per_creator
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'royalty_pool', v_pool,
    'creator_count', v_creator_count,
    'distributions', v_distributions
  );
END;
$$;
