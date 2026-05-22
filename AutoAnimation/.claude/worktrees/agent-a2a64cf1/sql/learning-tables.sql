-- ── AI Content Performance Learning System ──
-- Stores project feature snapshots, performance outcomes, learned patterns, and recommendations.

-- 1. Project Snapshots: captures project features at publish time
CREATE TABLE IF NOT EXISTS project_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,
  recording_id TEXT NOT NULL,
  published_post_id TEXT,

  -- Canvas features
  aspect_ratio TEXT NOT NULL,
  fps INTEGER NOT NULL DEFAULT 30,
  duration_seconds NUMERIC NOT NULL,
  canvas_width INTEGER NOT NULL,
  canvas_height INTEGER NOT NULL,

  -- Character features
  character_count INTEGER NOT NULL DEFAULT 0,
  emotion_distribution JSONB DEFAULT '{}',
  dialogue_line_count INTEGER NOT NULL DEFAULT 0,
  total_script_word_count INTEGER NOT NULL DEFAULT 0,

  -- Voice features
  voice_ids TEXT[] DEFAULT '{}',
  voice_count INTEGER NOT NULL DEFAULT 0,
  avg_speech_rate_wpm NUMERIC DEFAULT 0,

  -- Animation features
  animation_count INTEGER NOT NULL DEFAULT 0,
  has_lottie_background BOOLEAN DEFAULT false,
  has_svg_animations BOOLEAN DEFAULT false,
  has_html_templates BOOLEAN DEFAULT false,
  html_template_ids TEXT[] DEFAULT '{}',

  -- Caption features
  caption_style TEXT,
  caption_position TEXT,

  -- Text overlay features
  text_overlay_count INTEGER NOT NULL DEFAULT 0,
  has_title BOOLEAN DEFAULT false,
  has_cta BOOLEAN DEFAULT false,

  -- Script analysis
  script_sentiment TEXT,
  script_tone TEXT,
  dominant_topics TEXT[] DEFAULT '{}',

  -- Publishing context
  platform TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  posting_hour INTEGER,
  posting_day_of_week INTEGER,

  -- Normalized numeric feature vector for scoring model
  feature_vector JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE project_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own snapshots"
  ON project_snapshots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_snapshots_user ON project_snapshots(user_id);
CREATE INDEX idx_snapshots_recording ON project_snapshots(recording_id);
CREATE INDEX idx_snapshots_platform ON project_snapshots(user_id, platform);


-- 2. Performance Records: links snapshots to engagement outcomes
CREATE TABLE IF NOT EXISTS performance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES project_snapshots(id) ON DELETE CASCADE,

  -- Core engagement metrics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  avg_watch_time_sec NUMERIC DEFAULT 0,

  -- Platform-specific
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  full_video_views_percent NUMERIC DEFAULT 0,

  -- Computed performance score (0-100, normalized within user's posts)
  performance_score NUMERIC DEFAULT 0,

  refresh_count INTEGER DEFAULT 0,
  last_refreshed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE performance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own performance records"
  ON performance_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_perf_user ON performance_records(user_id);
CREATE INDEX idx_perf_snapshot ON performance_records(snapshot_id);
CREATE INDEX idx_perf_score ON performance_records(user_id, performance_score DESC);


-- 3. Learned Patterns: aggregated insights from scoring model and Gemini
CREATE TABLE IF NOT EXISTS learned_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  pattern_type TEXT NOT NULL,    -- 'feature_correlation', 'best_combo', 'trend', 'gemini_insight', 'platform_default'
  platform TEXT,                 -- null = cross-platform
  confidence NUMERIC DEFAULT 0,
  sample_size INTEGER DEFAULT 0,

  title TEXT NOT NULL,
  description TEXT,
  feature_key TEXT,
  feature_value TEXT,
  impact_score NUMERIC DEFAULT 0,

  data JSONB DEFAULT '{}',

  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE learned_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own patterns"
  ON learned_patterns FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_patterns_user ON learned_patterns(user_id);
CREATE INDEX idx_patterns_active ON learned_patterns(user_id, is_active, platform);


-- 4. Recommendations: pre-publish suggestions with auto-apply support
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,
  recording_id TEXT,

  source TEXT NOT NULL,           -- 'local_model', 'gemini'
  category TEXT NOT NULL,         -- 'duration', 'aspect_ratio', 'caption_style', 'posting_time', 'emotion', 'voice', 'animation', 'general'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  confidence NUMERIC DEFAULT 0,

  -- Auto-apply data
  action_type TEXT,               -- 'set_aspect_ratio', 'set_duration', 'set_caption_style', 'add_cta', 'change_posting_time', 'add_emotion', etc.
  action_payload JSONB DEFAULT '{}',

  status TEXT DEFAULT 'pending',  -- 'pending', 'applied', 'dismissed', 'expired'
  applied_at TIMESTAMPTZ,

  platform TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own recommendations"
  ON recommendations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_rec_user ON recommendations(user_id);
CREATE INDEX idx_rec_project ON recommendations(project_id);
CREATE INDEX idx_rec_status ON recommendations(user_id, status);
