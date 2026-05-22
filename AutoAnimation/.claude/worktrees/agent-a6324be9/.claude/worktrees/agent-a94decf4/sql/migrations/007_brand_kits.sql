-- Brand Kits table for storing reusable brand identities
CREATE TABLE IF NOT EXISTS brand_kits (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  logo_url TEXT,
  watermark_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient user-scoped queries
CREATE INDEX IF NOT EXISTS idx_brand_kits_user ON brand_kits(user_id);

-- Enable Row Level Security
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

-- RLS policies for user-scoped access
CREATE POLICY "Users can read own brand kits"
  ON brand_kits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand kits"
  ON brand_kits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand kits"
  ON brand_kits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand kits"
  ON brand_kits FOR DELETE
  USING (auth.uid() = user_id);
