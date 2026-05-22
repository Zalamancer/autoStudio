-- Social accounts table for storing OAuth tokens per user per platform
-- Run this migration in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook','instagram','tiktok','x','youtube')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  platform_user_id TEXT,
  username TEXT,
  avatar_url TEXT,
  page_id TEXT,
  page_name TEXT,
  scopes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Row Level Security: users can only access their own social accounts
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own social accounts"
  ON social_accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(user_id, platform);
