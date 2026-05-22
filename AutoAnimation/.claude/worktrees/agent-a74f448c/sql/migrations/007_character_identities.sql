-- Character Identities table
-- Stores persistent character bindings that link saved characters
-- to voices, emotions, and visual styles for series consistency.

CREATE TABLE IF NOT EXISTS character_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  saved_character_id text,
  saved_3d_character_id text,
  voice_id text,
  default_emotion text DEFAULT 'Neutral',
  visual_style text DEFAULT '',
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_character_identities_user_id
  ON character_identities(user_id);

-- Index for saved character lookups
CREATE INDEX IF NOT EXISTS idx_character_identities_saved_char
  ON character_identities(saved_character_id)
  WHERE saved_character_id IS NOT NULL;

-- RLS: users can only read/write their own identities
ALTER TABLE character_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own character identities"
  ON character_identities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own character identities"
  ON character_identities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own character identities"
  ON character_identities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own character identities"
  ON character_identities FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_character_identity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER character_identities_updated_at
  BEFORE UPDATE ON character_identities
  FOR EACH ROW
  EXECUTE FUNCTION update_character_identity_timestamp();
