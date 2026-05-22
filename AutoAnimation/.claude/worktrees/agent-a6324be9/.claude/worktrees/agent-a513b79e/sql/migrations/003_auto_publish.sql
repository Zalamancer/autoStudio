-- Auto-publish schedules: recurring video generation + publishing
CREATE TABLE IF NOT EXISTS auto_publish_schedules (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_prompt TEXT NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'every-2-days', 'every-3-days', 'weekly')),
  cron_expression TEXT NOT NULL,
  next_run_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  orchestrator_settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for the polling query (find active schedules due to run)
CREATE INDEX IF NOT EXISTS idx_auto_publish_schedules_due
  ON auto_publish_schedules (next_run_at)
  WHERE is_active = true;

-- Auto-publish execution history
CREATE TABLE IF NOT EXISTS auto_publish_executions (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES auto_publish_schedules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'exporting', 'publishing', 'done', 'error')),
  prompt TEXT,
  error TEXT,
  credits_used INTEGER NOT NULL DEFAULT 0,
  published_post_ids TEXT[] NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auto_publish_executions_schedule
  ON auto_publish_executions (schedule_id, started_at DESC);

-- RLS policies
ALTER TABLE auto_publish_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_publish_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own schedules"
  ON auto_publish_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
  ON auto_publish_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON auto_publish_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON auto_publish_schedules FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own executions via schedule"
  ON auto_publish_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auto_publish_schedules s
      WHERE s.id = auto_publish_executions.schedule_id
        AND s.user_id = auth.uid()
    )
  );
