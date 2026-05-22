-- Portfolio Platform Schema Migration
-- Creates tables for portfolio profiles, published projects, likes, and follows.

-- ── Portfolio Profiles ──
CREATE TABLE IF NOT EXISTS portfolio_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}',
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'gradient', 'minimal')),
  project_count INT DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  follower_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portfolio_profiles_username ON portfolio_profiles(username);
CREATE INDEX idx_portfolio_profiles_user_id ON portfolio_profiles(user_id);

-- ── Portfolio Projects ──
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  description TEXT DEFAULT '',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration FLOAT DEFAULT 0,
  aspect_ratio TEXT DEFAULT '16:9',
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'other',
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'unlisted')),
  embed_url TEXT,
  view_count BIGINT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portfolio_projects_user_id ON portfolio_projects(user_id);
CREATE INDEX idx_portfolio_projects_status ON portfolio_projects(status);
CREATE INDEX idx_portfolio_projects_category ON portfolio_projects(category);
CREATE INDEX idx_portfolio_projects_tags ON portfolio_projects USING GIN(tags);
CREATE INDEX idx_portfolio_projects_created_at ON portfolio_projects(created_at DESC);
CREATE INDEX idx_portfolio_projects_view_count ON portfolio_projects(view_count DESC);
CREATE INDEX idx_portfolio_projects_like_count ON portfolio_projects(like_count DESC);

-- ── Portfolio Likes ──
CREATE TABLE IF NOT EXISTS portfolio_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- ── Portfolio Follows ──
CREATE TABLE IF NOT EXISTS portfolio_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- ── RPC Functions for atomic counter updates ──

CREATE OR REPLACE FUNCTION increment_view_count(project_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE portfolio_projects
  SET view_count = view_count + 1
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_like_count(project_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE portfolio_projects
  SET like_count = like_count + 1
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_like_count(project_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE portfolio_projects
  SET like_count = GREATEST(0, like_count - 1)
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

-- ── RLS Policies ──

ALTER TABLE portfolio_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_follows ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, owners can update
CREATE POLICY portfolio_profiles_select ON portfolio_profiles FOR SELECT USING (true);
CREATE POLICY portfolio_profiles_update ON portfolio_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Projects: public published projects readable by all, owners manage all
CREATE POLICY portfolio_projects_select ON portfolio_projects FOR SELECT USING (status = 'published' OR auth.uid() = user_id);
CREATE POLICY portfolio_projects_insert ON portfolio_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY portfolio_projects_update ON portfolio_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY portfolio_projects_delete ON portfolio_projects FOR DELETE USING (auth.uid() = user_id);

-- Likes: users manage their own
CREATE POLICY portfolio_likes_select ON portfolio_likes FOR SELECT USING (true);
CREATE POLICY portfolio_likes_insert ON portfolio_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY portfolio_likes_delete ON portfolio_likes FOR DELETE USING (auth.uid() = user_id);

-- Follows: users manage their own
CREATE POLICY portfolio_follows_select ON portfolio_follows FOR SELECT USING (true);
CREATE POLICY portfolio_follows_insert ON portfolio_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY portfolio_follows_delete ON portfolio_follows FOR DELETE USING (auth.uid() = follower_id);
