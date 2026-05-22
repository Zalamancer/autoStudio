-- Recordings table: stores recording metadata (blobs stored in Supabase Storage bucket "recordings")
CREATE TABLE IF NOT EXISTS public.recordings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'mp4',
  width INTEGER NOT NULL DEFAULT 1920,
  height INTEGER NOT NULL DEFAULT 1080,
  fps INTEGER NOT NULL DEFAULT 30,
  duration_sec REAL NOT NULL DEFAULT 0,
  file_size BIGINT NOT NULL DEFAULT 0,
  project_id TEXT,
  project_name TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON public.recordings(user_id);

-- RLS policies
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recordings"
  ON public.recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings"
  ON public.recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings"
  ON public.recordings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings"
  ON public.recordings FOR DELETE
  USING (auth.uid() = user_id);
