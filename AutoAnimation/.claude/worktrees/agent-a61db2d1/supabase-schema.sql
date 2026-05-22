-- ============================================
-- AutoAnimation Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table (main entity)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL DEFAULT 'Untitled Project',
  thumbnail TEXT,
  aspect_ratio VARCHAR(20) DEFAULT '16:9',
  fps INTEGER DEFAULT 30,
  duration_frames INTEGER DEFAULT 300,
  canvas_width INTEGER DEFAULT 1920,
  canvas_height INTEGER DEFAULT 1080,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sprite sheets/images for characters
CREATE TABLE sprites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  part_type VARCHAR(50) NOT NULL,
  label VARCHAR(255),
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Viseme mappings per project
CREATE TABLE viseme_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  viseme_type VARCHAR(20) NOT NULL,
  sprite_index INTEGER NOT NULL,
  UNIQUE(project_id, viseme_type)
);

-- Character part transforms
CREATE TABLE part_transforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  part_type VARCHAR(50) NOT NULL,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  rotation FLOAT DEFAULT 0,
  scale_x FLOAT DEFAULT 1,
  scale_y FLOAT DEFAULT 1,
  visible BOOLEAN DEFAULT true,
  selected_sprite_index INTEGER DEFAULT 0,
  UNIQUE(project_id, part_type)
);

-- Generated voices
CREATE TABLE generated_voices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  script TEXT NOT NULL,
  voice_id VARCHAR(100),
  voice_name VARCHAR(255),
  audio_url TEXT,
  audio_duration FLOAT,
  alignment_data JSONB,
  viseme_timeline JSONB,
  word_timeline JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active animations on canvas
CREATE TABLE active_animations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  animation_url TEXT NOT NULL,
  animation_name VARCHAR(255),
  category VARCHAR(50),
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  scale FLOAT DEFAULT 1,
  opacity FLOAT DEFAULT 1,
  z_index INTEGER DEFAULT 0,
  loop BOOLEAN DEFAULT true,
  speed FLOAT DEFAULT 1
);

-- Timeline tracks
CREATE TABLE timeline_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  track_type VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  locked BOOLEAN DEFAULT false,
  muted BOOLEAN DEFAULT false,
  visible BOOLEAN DEFAULT true,
  height INTEGER DEFAULT 60,
  sort_order INTEGER DEFAULT 0
);

-- Timeline clips
CREATE TABLE timeline_clips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID REFERENCES timeline_tracks(id) ON DELETE CASCADE,
  start_frame INTEGER NOT NULL,
  end_frame INTEGER NOT NULL,
  source_id VARCHAR(255),
  source_in_point INTEGER DEFAULT 0,
  source_out_point INTEGER,
  color VARCHAR(50),
  name VARCHAR(255)
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable Row Level Security (since we're not using auth)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE sprites DISABLE ROW LEVEL SECURITY;
ALTER TABLE viseme_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE part_transforms DISABLE ROW LEVEL SECURITY;
ALTER TABLE generated_voices DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_animations DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_clips DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_sprites_project_id ON sprites(project_id);
CREATE INDEX idx_viseme_mappings_project_id ON viseme_mappings(project_id);
CREATE INDEX idx_part_transforms_project_id ON part_transforms(project_id);
CREATE INDEX idx_generated_voices_project_id ON generated_voices(project_id);
CREATE INDEX idx_active_animations_project_id ON active_animations(project_id);
CREATE INDEX idx_timeline_tracks_project_id ON timeline_tracks(project_id);
CREATE INDEX idx_timeline_clips_track_id ON timeline_clips(track_id);
