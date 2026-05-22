-- Scheduled social media posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recording_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'x', 'youtube')),
  options JSONB NOT NULL DEFAULT '{}',
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'publishing', 'published', 'failed')),
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for the cron query (find pending posts ready to publish)
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_pending
  ON scheduled_posts (scheduled_at)
  WHERE status = 'pending';

-- RLS policies
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scheduled posts"
  ON scheduled_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled posts"
  ON scheduled_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending posts"
  ON scheduled_posts FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');
