-- ============================================
-- Project Templates table
-- ============================================

CREATE TABLE IF NOT EXISTS project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  tags TEXT[] NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  preview_video_url TEXT,
  snapshot JSONB NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]',
  bindings JSONB NOT NULL DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT false,
  version INT NOT NULL DEFAULT 1,
  use_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================

-- Browse published templates by category
CREATE INDEX idx_project_templates_published
  ON project_templates (is_published, category, updated_at DESC);

-- User's own templates
CREATE INDEX idx_project_templates_creator
  ON project_templates (creator_user_id);

-- Tag search
CREATE INDEX idx_project_templates_tags
  ON project_templates USING GIN (tags);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read published templates
CREATE POLICY "Published templates are viewable by everyone"
  ON project_templates FOR SELECT
  USING (is_published = true);

-- Creators can see their own templates (including drafts)
CREATE POLICY "Users can view own templates"
  ON project_templates FOR SELECT
  USING (auth.uid() = creator_user_id);

-- Creators can insert their own templates
CREATE POLICY "Users can create templates"
  ON project_templates FOR INSERT
  WITH CHECK (auth.uid() = creator_user_id);

-- Creators can update their own templates
CREATE POLICY "Users can update own templates"
  ON project_templates FOR UPDATE
  USING (auth.uid() = creator_user_id);

-- Creators can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON project_templates FOR DELETE
  USING (auth.uid() = creator_user_id);

-- ============================================
-- Updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_project_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_project_templates_updated_at
  BEFORE UPDATE ON project_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_project_templates_updated_at();
