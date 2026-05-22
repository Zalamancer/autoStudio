CREATE TABLE IF NOT EXISTS render_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  api_key_id text,
  status text NOT NULL DEFAULT 'queued',
  prompt text NOT NULL,
  settings_json jsonb DEFAULT '{}',
  plan_json jsonb,
  result_url text,
  result_format text,
  result_size_bytes bigint,
  credits_cost integer DEFAULT 200,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);
