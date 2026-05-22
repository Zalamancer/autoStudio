-- Migration 007: API Platform
-- Supports features #27 (API for Automation) and #41 (Public REST API)

-- ── api_keys ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'standard',
  rate_limit_per_minute INT NOT NULL DEFAULT 30,
  rate_limit_per_day INT NOT NULL DEFAULT 1000,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

-- ── render_jobs ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id),
  status TEXT NOT NULL DEFAULT 'queued',
  prompt TEXT NOT NULL,
  settings_json JSONB NOT NULL DEFAULT '{}',
  plan_json JSONB,
  result_url TEXT,
  result_format TEXT,
  result_size_bytes BIGINT,
  credits_cost INT NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_render_jobs_user ON render_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status) WHERE status IN ('queued', 'running');

-- ── api_webhooks ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['render.complete'],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_webhooks_user ON api_webhooks(user_id) WHERE is_active = TRUE;

-- ── api_usage_log ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_usage_log (
  id BIGSERIAL PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES api_keys(id),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INT NOT NULL,
  latency_ms INT,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_log_key ON api_usage_log(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_user ON api_usage_log(user_id, created_at DESC);

-- ── RLS Policies ────────────────────────────────────────────────────────────

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own keys" ON api_keys FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own jobs" ON render_jobs FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE api_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own webhooks" ON api_webhooks FOR ALL USING (auth.uid() = user_id);

ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON api_usage_log FOR SELECT USING (auth.uid() = user_id);
