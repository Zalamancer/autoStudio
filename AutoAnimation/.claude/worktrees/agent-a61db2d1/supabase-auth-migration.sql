-- Migration: Add user authentication and RLS
-- Run this AFTER the base schema (supabase-schema.sql)

-- Step 1: Add user_id column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Step 2: Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprites ENABLE ROW LEVEL SECURITY;
ALTER TABLE viseme_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_transforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_animations ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_clips ENABLE ROW LEVEL SECURITY;

-- Step 3: Projects policies (direct user_id check)
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Step 4: Child table policies (join through project_id)
-- Sprites
CREATE POLICY "Users can view own sprites"
  ON sprites FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = sprites.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can insert own sprites"
  ON sprites FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = sprites.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update own sprites"
  ON sprites FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = sprites.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete own sprites"
  ON sprites FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = sprites.project_id AND projects.user_id = auth.uid()));

-- Viseme Mappings
CREATE POLICY "Users can view own viseme_mappings"
  ON viseme_mappings FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = viseme_mappings.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can insert own viseme_mappings"
  ON viseme_mappings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = viseme_mappings.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update own viseme_mappings"
  ON viseme_mappings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = viseme_mappings.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete own viseme_mappings"
  ON viseme_mappings FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = viseme_mappings.project_id AND projects.user_id = auth.uid()));

-- Part Transforms
CREATE POLICY "Users can view own part_transforms"
  ON part_transforms FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = part_transforms.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can insert own part_transforms"
  ON part_transforms FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = part_transforms.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update own part_transforms"
  ON part_transforms FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = part_transforms.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete own part_transforms"
  ON part_transforms FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = part_transforms.project_id AND projects.user_id = auth.uid()));

-- Generated Voices
CREATE POLICY "Users can view own generated_voices"
  ON generated_voices FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = generated_voices.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can insert own generated_voices"
  ON generated_voices FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = generated_voices.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update own generated_voices"
  ON generated_voices FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = generated_voices.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete own generated_voices"
  ON generated_voices FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = generated_voices.project_id AND projects.user_id = auth.uid()));

-- Active Animations
CREATE POLICY "Users can view own active_animations"
  ON active_animations FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = active_animations.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can insert own active_animations"
  ON active_animations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = active_animations.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update own active_animations"
  ON active_animations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = active_animations.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete own active_animations"
  ON active_animations FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = active_animations.project_id AND projects.user_id = auth.uid()));

-- Timeline Tracks
CREATE POLICY "Users can view own timeline_tracks"
  ON timeline_tracks FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = timeline_tracks.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can insert own timeline_tracks"
  ON timeline_tracks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = timeline_tracks.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update own timeline_tracks"
  ON timeline_tracks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = timeline_tracks.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete own timeline_tracks"
  ON timeline_tracks FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = timeline_tracks.project_id AND projects.user_id = auth.uid()));

-- Timeline Clips
CREATE POLICY "Users can view own timeline_clips"
  ON timeline_clips FOR SELECT
  USING (EXISTS (SELECT 1 FROM timeline_tracks t JOIN projects p ON p.id = t.project_id WHERE t.id = timeline_clips.track_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can insert own timeline_clips"
  ON timeline_clips FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM timeline_tracks t JOIN projects p ON p.id = t.project_id WHERE t.id = timeline_clips.track_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can update own timeline_clips"
  ON timeline_clips FOR UPDATE
  USING (EXISTS (SELECT 1 FROM timeline_tracks t JOIN projects p ON p.id = t.project_id WHERE t.id = timeline_clips.track_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can delete own timeline_clips"
  ON timeline_clips FOR DELETE
  USING (EXISTS (SELECT 1 FROM timeline_tracks t JOIN projects p ON p.id = t.project_id WHERE t.id = timeline_clips.track_id AND p.user_id = auth.uid()));

-- Step 5: Storage policies
-- Sprites bucket: users can only access their own project folders
CREATE POLICY "Users can view own sprites storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sprites' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can upload own sprites storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sprites' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  ));

-- Audio bucket
CREATE POLICY "Users can view own audio storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can upload own audio storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  ));
