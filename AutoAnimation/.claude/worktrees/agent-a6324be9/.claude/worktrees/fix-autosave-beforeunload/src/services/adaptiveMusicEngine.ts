/**
 * Adaptive Music Engine
 *
 * Analyzes emotion timelines to build music segments, generates per-segment
 * music cues (mood, intensity, tempo), and provides crossfade/volume
 * adaptation based on emotion intensity.
 */

import type { EmotionEvent } from '@/services/emotionTimeline'
import type { DialogueLine } from '@/stores/useMultiCharacterStore'
import { generateMusic, type MusicCompositionPlan } from '@/services/elevenlabs'

// ─── Types ────────────────────────────────────────────────────────────────

export type MusicMoodLabel =
  | 'uplifting'
  | 'intense'
  | 'melancholic'
  | 'tense'
  | 'dramatic'
  | 'dissonant'
  | 'ambient'
  | 'neutral'

export interface MusicSegment {
  id: string
  /** Segment start in frames */
  startFrame: number
  /** Segment end in frames */
  endFrame: number
  /** Detected/overridden mood label */
  mood: MusicMoodLabel
  /** Emotion that this segment originates from */
  sourceEmotion: string
  /** 0-1 intensity level derived from emotion energy */
  intensity: number
  /** BPM suggestion */
  tempo: number
  /** 0-1 volume for this segment */
  volume: number
  /** Generated audio URL (null until generated) */
  audioUrl: string | null
  /** Generated audio blob (null until generated) */
  audioBlob: Blob | null
  /** Duration in ms */
  durationMs: number
  /** Music styles for generation */
  styles: string[]
  /** Negative styles to avoid */
  negativeStyles: string[]
}

export interface CrossfadeConfig {
  /** Crossfade duration in frames */
  durationFrames: number
  /** Crossfade curve: linear or equal-power */
  curve: 'linear' | 'equal-power'
}

export interface AdaptiveMusicAnalysis {
  segments: MusicSegment[]
  totalDurationFrames: number
  dominantMood: MusicMoodLabel
}

// ─── Emotion-to-Music Mapping ─────────────────────────────────────────────

interface EmotionMusicProfile {
  mood: MusicMoodLabel
  intensity: number
  tempo: number
  styles: string[]
  negativeStyles: string[]
}

const EMOTION_PROFILES: Record<string, EmotionMusicProfile> = {
  Joy: {
    mood: 'uplifting',
    intensity: 0.8,
    tempo: 120,
    styles: ['uplifting', 'bright', 'warm', 'major key', 'cheerful'],
    negativeStyles: ['dark', 'melancholic', 'aggressive'],
  },
  Anger: {
    mood: 'intense',
    intensity: 0.9,
    tempo: 140,
    styles: ['intense', 'driving', 'aggressive', 'powerful', 'minor key'],
    negativeStyles: ['soft', 'gentle', 'lullaby'],
  },
  Sadness: {
    mood: 'melancholic',
    intensity: 0.5,
    tempo: 70,
    styles: ['melancholic', 'gentle', 'reflective', 'minor key', 'emotional'],
    negativeStyles: ['upbeat', 'aggressive', 'party'],
  },
  Fear: {
    mood: 'tense',
    intensity: 0.7,
    tempo: 100,
    styles: ['tense', 'suspenseful', 'dark', 'ominous', 'atmospheric'],
    negativeStyles: ['cheerful', 'bright', 'uplifting'],
  },
  Surprise: {
    mood: 'dramatic',
    intensity: 0.85,
    tempo: 130,
    styles: ['dramatic', 'dynamic', 'unexpected turns', 'energetic'],
    negativeStyles: ['monotone', 'flat', 'ambient'],
  },
  Disgust: {
    mood: 'dissonant',
    intensity: 0.6,
    tempo: 90,
    styles: ['dissonant', 'gritty', 'industrial', 'unsettling'],
    negativeStyles: ['sweet', 'romantic', 'pop'],
  },
  Neutral: {
    mood: 'ambient',
    intensity: 0.3,
    tempo: 90,
    styles: ['ambient', 'cinematic', 'background', 'neutral'],
    negativeStyles: ['aggressive', 'chaotic'],
  },
  Auto: {
    mood: 'neutral',
    intensity: 0.4,
    tempo: 100,
    styles: ['cinematic', 'atmospheric', 'adaptive'],
    negativeStyles: [],
  },
}

// Sub-emotion → parent emotion normalization
const SUB_EMOTION_MAP: Record<string, string> = {
  Satisfaction: 'Joy', Amusement: 'Joy', Laughter: 'Joy', Happy: 'Joy',
  Sternness: 'Anger', Indignation: 'Anger', Rage: 'Anger',
  Disdain: 'Disgust', Aversion: 'Disgust', Revulsion: 'Disgust',
  Concern: 'Fear', Anxiety: 'Fear', Terror: 'Fear',
  Dejection: 'Sadness', Melancholy: 'Sadness', Grief: 'Sadness',
  Alertness: 'Surprise', Wonder: 'Surprise', Shock: 'Surprise',
}

// Sub-emotion intensity scaling (higher-level emotions get higher intensity)
const SUB_EMOTION_INTENSITY: Record<string, number> = {
  // Joy levels
  Satisfaction: 0.5, Amusement: 0.65, Joy: 0.8, Laughter: 0.95,
  // Anger levels
  Sternness: 0.5, Indignation: 0.65, Anger: 0.8, Rage: 0.95,
  // Disgust levels
  Disdain: 0.4, Aversion: 0.55, Disgust: 0.7, Revulsion: 0.85,
  // Fear levels
  Concern: 0.4, Anxiety: 0.55, Fear: 0.7, Terror: 0.9,
  // Sadness levels
  Dejection: 0.35, Melancholy: 0.5, Sadness: 0.65, Grief: 0.85,
  // Surprise levels
  Alertness: 0.5, Wonder: 0.65, Surprise: 0.8, Shock: 0.95,
}

function normalizeEmotion(emotion: string): string {
  return SUB_EMOTION_MAP[emotion] ?? emotion
}

function getEmotionProfile(emotion: string): EmotionMusicProfile {
  const normalized = normalizeEmotion(emotion)
  const profile = EMOTION_PROFILES[normalized] ?? EMOTION_PROFILES.Neutral

  // Adjust intensity for sub-emotions
  const subIntensity = SUB_EMOTION_INTENSITY[emotion]
  if (subIntensity !== undefined) {
    return { ...profile, intensity: subIntensity }
  }

  return profile
}

// ─── Segment Builder ──────────────────────────────────────────────────────

/**
 * Merge adjacent emotion events with the same base emotion into segments.
 * Ensures minimum segment duration and handles gaps.
 */
function mergeEmotionEvents(
  events: EmotionEvent[],
  fps: number,
  minSegmentFrames: number = 30,
): MusicSegment[] {
  if (events.length === 0) return []

  const sorted = [...events].sort((a, b) => a.startFrame - b.startFrame)
  const segments: MusicSegment[] = []
  let segIdx = 0

  let current: {
    startFrame: number
    endFrame: number
    emotion: string
    normalizedEmotion: string
  } | null = null

  for (const event of sorted) {
    const normalized = normalizeEmotion(event.emotion)

    if (current && current.normalizedEmotion === normalized) {
      // Extend current segment
      current.endFrame = Math.max(current.endFrame, event.endFrame)
    } else {
      // Finalize current segment
      if (current && current.endFrame - current.startFrame >= minSegmentFrames) {
        const profile = getEmotionProfile(current.emotion)
        const durationMs = ((current.endFrame - current.startFrame) / fps) * 1000

        segments.push({
          id: `seg_${segIdx++}`,
          startFrame: current.startFrame,
          endFrame: current.endFrame,
          mood: profile.mood,
          sourceEmotion: current.emotion,
          intensity: profile.intensity,
          tempo: profile.tempo,
          volume: 0.6 + profile.intensity * 0.3, // 0.6-0.9 range
          audioUrl: null,
          audioBlob: null,
          durationMs: Math.round(durationMs),
          styles: profile.styles,
          negativeStyles: profile.negativeStyles,
        })
      }
      current = {
        startFrame: event.startFrame,
        endFrame: event.endFrame,
        emotion: event.emotion,
        normalizedEmotion: normalized,
      }
    }
  }

  // Finalize last segment
  if (current && current.endFrame - current.startFrame >= minSegmentFrames) {
    const profile = getEmotionProfile(current.emotion)
    const durationMs = ((current.endFrame - current.startFrame) / fps) * 1000

    segments.push({
      id: `seg_${segIdx}`,
      startFrame: current.startFrame,
      endFrame: current.endFrame,
      mood: profile.mood,
      sourceEmotion: current.emotion,
      intensity: profile.intensity,
      tempo: profile.tempo,
      volume: 0.6 + profile.intensity * 0.3,
      audioUrl: null,
      audioBlob: null,
      durationMs: Math.round(durationMs),
      styles: profile.styles,
      negativeStyles: profile.negativeStyles,
    })
  }

  return segments
}

/**
 * Build segments from dialogue lines when no explicit emotion timeline exists.
 * Falls back to per-dialogue-line emotion tags.
 */
function buildSegmentsFromDialogue(
  lines: DialogueLine[],
  fps: number,
): MusicSegment[] {
  // Convert dialogue lines to EmotionEvents
  const events: EmotionEvent[] = lines
    .filter((l) => l.startFrame < l.endFrame)
    .map((l) => ({
      emotion: l.emotion ?? 'Auto',
      startFrame: l.startFrame,
      endFrame: l.endFrame,
    }))

  return mergeEmotionEvents(events, fps)
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Analyze emotion events and produce music segments with mood/intensity/tempo.
 */
export function analyzeEmotionsForMusic(
  emotionEvents: EmotionEvent[],
  totalDurationFrames: number,
  fps: number,
): AdaptiveMusicAnalysis {
  const segments = mergeEmotionEvents(emotionEvents, fps)

  // If no emotion events, create a single ambient segment
  if (segments.length === 0) {
    const profile = EMOTION_PROFILES.Neutral
    const durationMs = (totalDurationFrames / fps) * 1000

    segments.push({
      id: 'seg_0',
      startFrame: 0,
      endFrame: totalDurationFrames,
      mood: 'ambient',
      sourceEmotion: 'Neutral',
      intensity: profile.intensity,
      tempo: profile.tempo,
      volume: 0.7,
      audioUrl: null,
      audioBlob: null,
      durationMs: Math.round(durationMs),
      styles: profile.styles,
      negativeStyles: profile.negativeStyles,
    })
  }

  // Determine dominant mood
  const moodCounts: Record<MusicMoodLabel, number> = {
    uplifting: 0, intense: 0, melancholic: 0, tense: 0,
    dramatic: 0, dissonant: 0, ambient: 0, neutral: 0,
  }
  for (const seg of segments) {
    const frames = seg.endFrame - seg.startFrame
    moodCounts[seg.mood] += frames
  }
  const dominantMood = (Object.entries(moodCounts) as [MusicMoodLabel, number][])
    .sort((a, b) => b[1] - a[1])[0][0]

  return { segments, totalDurationFrames, dominantMood }
}

/**
 * Analyze dialogue lines and produce music segments.
 * Uses dialogue emotion tags instead of an explicit emotion timeline.
 */
export function analyzeDialogueForMusic(
  dialogueLines: DialogueLine[],
  totalDurationFrames: number,
  fps: number,
): AdaptiveMusicAnalysis {
  const segments = buildSegmentsFromDialogue(dialogueLines, fps)

  if (segments.length === 0) {
    const profile = EMOTION_PROFILES.Neutral
    const durationMs = (totalDurationFrames / fps) * 1000

    segments.push({
      id: 'seg_0',
      startFrame: 0,
      endFrame: totalDurationFrames,
      mood: 'ambient',
      sourceEmotion: 'Neutral',
      intensity: profile.intensity,
      tempo: profile.tempo,
      volume: 0.7,
      audioUrl: null,
      audioBlob: null,
      durationMs: Math.round(durationMs),
      styles: profile.styles,
      negativeStyles: profile.negativeStyles,
    })
  }

  const moodCounts: Record<MusicMoodLabel, number> = {
    uplifting: 0, intense: 0, melancholic: 0, tense: 0,
    dramatic: 0, dissonant: 0, ambient: 0, neutral: 0,
  }
  for (const seg of segments) {
    moodCounts[seg.mood] += seg.endFrame - seg.startFrame
  }
  const dominantMood = (Object.entries(moodCounts) as [MusicMoodLabel, number][])
    .sort((a, b) => b[1] - a[1])[0][0]

  return { segments, totalDurationFrames, dominantMood }
}

/**
 * Generate music for a single segment via ElevenLabs.
 * Returns the updated segment with audioUrl and audioBlob.
 */
export async function generateMusicForSegment(
  segment: MusicSegment,
): Promise<MusicSegment> {
  const plan: MusicCompositionPlan = {
    positive_global_styles: ['instrumental', 'background score', 'cinematic'],
    negative_global_styles: ['vocals', 'singing', 'lyrics', 'lo-fi noise'],
    sections: [
      {
        section_name: `${segment.mood} - ${segment.sourceEmotion}`,
        positive_local_styles: [
          ...segment.styles,
          `${segment.tempo} bpm`,
          `${segment.intensity > 0.7 ? 'high' : segment.intensity > 0.4 ? 'medium' : 'low'} energy`,
        ],
        negative_local_styles: segment.negativeStyles,
        duration_ms: Math.max(3000, Math.min(120000, segment.durationMs)),
        lines: [],
      },
    ],
  }

  const result = await generateMusic({ compositionPlan: plan })

  return {
    ...segment,
    audioUrl: result.audioUrl,
    audioBlob: result.audioBlob,
    durationMs: result.durationMs,
  }
}

/**
 * Generate music for all segments sequentially.
 * Calls onProgress after each segment is generated.
 */
export async function generateAllSegmentMusic(
  segments: MusicSegment[],
  onProgress?: (completed: number, total: number, segment: MusicSegment) => void,
): Promise<MusicSegment[]> {
  const results: MusicSegment[] = []

  for (let i = 0; i < segments.length; i++) {
    const updated = await generateMusicForSegment(segments[i])
    results.push(updated)
    onProgress?.(i + 1, segments.length, updated)
  }

  return results
}

/**
 * Compute the volume for a given frame considering segment volumes
 * and crossfade transitions between segments.
 *
 * @returns Record of segment ID to volume at the given frame
 */
export function getSegmentVolumesAtFrame(
  segments: MusicSegment[],
  frame: number,
  crossfade: CrossfadeConfig,
  masterVolume: number,
): Record<string, number> {
  const result: Record<string, number> = {}

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (!seg.audioUrl) continue

    let vol = 0

    if (frame >= seg.startFrame && frame < seg.endFrame) {
      vol = seg.volume

      // Fade in at start (crossfade with previous segment)
      if (i > 0 && crossfade.durationFrames > 0) {
        const fadeInEnd = seg.startFrame + crossfade.durationFrames
        if (frame < fadeInEnd) {
          const progress = (frame - seg.startFrame) / crossfade.durationFrames
          vol *= crossfade.curve === 'equal-power'
            ? Math.sqrt(progress)
            : progress
        }
      }

      // Fade out at end (crossfade with next segment)
      if (i < segments.length - 1 && crossfade.durationFrames > 0) {
        const fadeOutStart = seg.endFrame - crossfade.durationFrames
        if (frame >= fadeOutStart) {
          const progress = (seg.endFrame - frame) / crossfade.durationFrames
          vol *= crossfade.curve === 'equal-power'
            ? Math.sqrt(progress)
            : progress
        }
      }
    }

    result[seg.id] = Math.max(0, Math.min(1, vol * masterVolume))
  }

  return result
}

/**
 * Compute playback rate adjustment based on emotion intensity.
 * Keeps rate within 0.8x - 1.2x to avoid noticeable pitch shift.
 */
export function getPlaybackRateForIntensity(intensity: number): number {
  // Map 0-1 intensity to 0.9-1.1 playback rate
  return 0.9 + intensity * 0.2
}

/**
 * List of available mood labels for the mood override dropdown.
 */
export const MOOD_LABELS: { value: MusicMoodLabel; label: string; color: string }[] = [
  { value: 'uplifting', label: 'Uplifting', color: '#facc15' },
  { value: 'intense', label: 'Intense', color: '#ef4444' },
  { value: 'melancholic', label: 'Melancholic', color: '#6366f1' },
  { value: 'tense', label: 'Tense', color: '#f97316' },
  { value: 'dramatic', label: 'Dramatic', color: '#ec4899' },
  { value: 'dissonant', label: 'Dissonant', color: '#a855f7' },
  { value: 'ambient', label: 'Ambient', color: '#22c55e' },
  { value: 'neutral', label: 'Neutral', color: '#94a3b8' },
]

/**
 * Get color for a mood label (for the visual timeline bar).
 */
export function getMoodColor(mood: MusicMoodLabel): string {
  return MOOD_LABELS.find((m) => m.value === mood)?.color ?? '#94a3b8'
}
