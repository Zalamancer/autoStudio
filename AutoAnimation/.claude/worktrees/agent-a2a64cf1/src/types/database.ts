// Database types for Supabase
// These match the SQL schema in the plan

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Project, 'id' | 'created_at'>>
      }
      sprites: {
        Row: Sprite
        Insert: Omit<Sprite, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Sprite, 'id' | 'created_at'>>
      }
      viseme_mappings: {
        Row: VisemeMapping
        Insert: Omit<VisemeMapping, 'id'> & { id?: string }
        Update: Partial<Omit<VisemeMapping, 'id'>>
      }
      part_transforms: {
        Row: PartTransform
        Insert: Omit<PartTransform, 'id'> & { id?: string }
        Update: Partial<Omit<PartTransform, 'id'>>
      }
      generated_voices: {
        Row: GeneratedVoiceRow
        Insert: Omit<GeneratedVoiceRow, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<GeneratedVoiceRow, 'id' | 'created_at'>>
      }
      active_animations: {
        Row: ActiveAnimationRow
        Insert: Omit<ActiveAnimationRow, 'id'> & { id?: string }
        Update: Partial<Omit<ActiveAnimationRow, 'id'>>
      }
      timeline_tracks: {
        Row: TimelineTrackRow
        Insert: Omit<TimelineTrackRow, 'id'> & { id?: string }
        Update: Partial<Omit<TimelineTrackRow, 'id'>>
      }
      timeline_clips: {
        Row: TimelineClipRow
        Insert: Omit<TimelineClipRow, 'id'> & { id?: string }
        Update: Partial<Omit<TimelineClipRow, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ============================================
// Table Types
// ============================================

export interface Project {
  id: string
  name: string
  thumbnail: string | null
  aspect_ratio: string
  fps: number
  duration_frames: number
  canvas_width: number
  canvas_height: number
  created_at: string
  updated_at: string
}

export interface Sprite {
  id: string
  project_id: string
  /** Part type — standard: body/viseme/eye/eyebrow/hair/shirt/pants/shoes, extended: curved_viseme_*, eye_variant_*, eyebrow_variant_*, _json_metadata */
  part_type: string
  label: string | null
  image_url: string
  sort_order: number
  created_at: string
}

export interface VisemeMapping {
  id: string
  project_id: string
  viseme_type: 'Aa' | 'D' | 'Ee' | 'F' | 'L' | 'M' | 'O' | 'R' | 'S' | 'U' | 'W' | 'Rest'
  sprite_index: number
}

export interface PartTransform {
  id: string
  project_id: string
  part_type: string
  position_x: number
  position_y: number
  rotation: number
  scale_x: number
  scale_y: number
  visible: boolean
  selected_sprite_index: number
}

export interface GeneratedVoiceRow {
  id: string
  project_id: string
  script: string
  voice_id: string | null
  voice_name: string | null
  audio_url: string | null
  audio_duration: number | null
  alignment_data: Record<string, unknown> | null
  viseme_timeline: Record<string, unknown>[] | null
  word_timeline: Record<string, unknown>[] | null
  created_at: string
}

export interface ActiveAnimationRow {
  id: string
  project_id: string
  animation_url: string
  animation_name: string | null
  category: 'background' | 'overlay' | null
  position_x: number
  position_y: number
  scale: number
  opacity: number
  z_index: number
  loop: boolean
  speed: number
}

export interface TimelineTrackRow {
  id: string
  project_id: string
  track_type: 'video' | 'audio' | 'sprite'
  name: string | null
  locked: boolean
  muted: boolean
  visible: boolean
  height: number
  sort_order: number
}

export interface TimelineClipRow {
  id: string
  track_id: string
  start_frame: number
  end_frame: number
  source_id: string | null
  source_in_point: number
  source_out_point: number | null
  color: string | null
  name: string | null
}

// ============================================
// Composite Types for Loading Full Project
// ============================================

export interface ProjectWithRelations extends Project {
  sprites: Sprite[]
  viseme_mappings: VisemeMapping[]
  part_transforms: PartTransform[]
  generated_voices: GeneratedVoiceRow[]
  active_animations: ActiveAnimationRow[]
  timeline_tracks: (TimelineTrackRow & { clips: TimelineClipRow[] })[]
}

// ============================================
// Project Templates
// ============================================

export interface ProjectTemplateRow {
  id: string
  creator_user_id: string
  name: string
  description: string
  category: string
  tags: string[]
  thumbnail_url: string | null
  preview_video_url: string | null
  snapshot: Record<string, unknown>
  variables: Record<string, unknown>[]
  bindings: Record<string, unknown>[]
  is_published: boolean
  version: number
  use_count: number
  created_at: string
  updated_at: string
}

// ============================================
// Project List Item (for ProjectsPanel)
// ============================================

export interface ProjectListItem {
  id: string
  name: string
  thumbnail: string | null
  updated_at: string
  created_at: string
}
