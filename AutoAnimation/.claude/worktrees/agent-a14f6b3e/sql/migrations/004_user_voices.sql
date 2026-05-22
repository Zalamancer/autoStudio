-- User cloned voices metadata
-- Stores references to voices cloned via ElevenLabs API for per-user tracking.
-- The actual voice data lives in ElevenLabs; this table stores metadata + ownership.

CREATE TABLE IF NOT EXISTS user_voices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL,         -- ElevenLabs voice_id
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, voice_id)
);

-- Enable Row Level Security
ALTER TABLE user_voices ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own cloned voices
CREATE POLICY "Users can view own voices"
  ON user_voices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voices"
  ON user_voices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voices"
  ON user_voices FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_user_voices_user_id ON user_voices(user_id);
