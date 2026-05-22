-- Migration: Create oauth_states table to replace in-memory Map.
-- Stores temporary OAuth state tokens during the authorization flow.
-- States expire after 5 minutes.

CREATE TABLE IF NOT EXISTS oauth_states (
  state       TEXT PRIMARY KEY,
  user_id     UUID NOT NULL,
  platform    TEXT NOT NULL,
  code_verifier TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for TTL cleanup
CREATE INDEX IF NOT EXISTS idx_oauth_states_created_at ON oauth_states (created_at);

-- RLS: Only the server (service role) accesses this table directly.
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Automatic cleanup: delete states older than 5 minutes.
-- Run this periodically via pg_cron or a server-side cleanup function.
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE created_at < now() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
