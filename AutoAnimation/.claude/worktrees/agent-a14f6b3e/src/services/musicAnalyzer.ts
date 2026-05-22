/**
 * Analyzes dialogue lines and their emotional content to build
 * an ElevenLabs Music composition plan that fits the scene.
 *
 * The analyzer examines each dialogue line's:
 * - script text (theme, topic, vocabulary)
 * - emotion tag (Joy, Sadness, Anger, etc.)
 * - timing (startFrame / endFrame)
 * - position within the overall narrative arc
 *
 * Then it produces a MusicCompositionPlan with sections that
 * mirror the pacing, mood, and energy of the dialogue.
 */

import type { DialogueLine, DialogueEmotion } from '@/stores/useMultiCharacterStore'
import type { MusicCompositionPlan, MusicSection } from '@/services/elevenlabs'

// ─── Emotion → Music Style Mapping ─────────────────────────────────────

interface MusicMood {
  styles: string[]
  energy: 'low' | 'medium' | 'high'
  tempo: 'slow' | 'moderate' | 'fast'
  negativeStyles: string[]
}

const EMOTION_MUSIC_MAP: Record<string, MusicMood> = {
  Joy: {
    styles: ['uplifting', 'bright', 'warm', 'major key', 'cheerful'],
    energy: 'high',
    tempo: 'moderate',
    negativeStyles: ['dark', 'melancholic', 'aggressive'],
  },
  Anger: {
    styles: ['intense', 'driving', 'aggressive', 'powerful', 'minor key'],
    energy: 'high',
    tempo: 'fast',
    negativeStyles: ['soft', 'gentle', 'lullaby'],
  },
  Sadness: {
    styles: ['melancholic', 'gentle', 'reflective', 'minor key', 'emotional'],
    energy: 'low',
    tempo: 'slow',
    negativeStyles: ['upbeat', 'aggressive', 'party'],
  },
  Fear: {
    styles: ['tense', 'suspenseful', 'dark', 'ominous', 'atmospheric'],
    energy: 'medium',
    tempo: 'moderate',
    negativeStyles: ['cheerful', 'bright', 'uplifting'],
  },
  Surprise: {
    styles: ['dramatic', 'dynamic', 'unexpected turns', 'energetic'],
    energy: 'high',
    tempo: 'fast',
    negativeStyles: ['monotone', 'flat', 'ambient'],
  },
  Disgust: {
    styles: ['dissonant', 'gritty', 'industrial', 'unsettling'],
    energy: 'medium',
    tempo: 'moderate',
    negativeStyles: ['sweet', 'romantic', 'pop'],
  },
  Neutral: {
    styles: ['ambient', 'cinematic', 'background', 'neutral'],
    energy: 'low',
    tempo: 'moderate',
    negativeStyles: ['aggressive', 'chaotic'],
  },
  Auto: {
    styles: ['cinematic', 'atmospheric', 'adaptive'],
    energy: 'medium',
    tempo: 'moderate',
    negativeStyles: [],
  },
}

// ─── Text Analysis Helpers ──────────────────────────────────────────────

/** Keyword groups for detecting theme from script text */
const THEME_KEYWORDS: Record<string, string[]> = {
  motivation: ['dream', 'achieve', 'success', 'goal', 'believe', 'strong', 'power', 'never give up', 'push', 'hustle', 'grind', 'win'],
  love: ['love', 'heart', 'together', 'forever', 'romance', 'kiss', 'beautiful', 'darling', 'soulmate'],
  adventure: ['journey', 'explore', 'discover', 'quest', 'adventure', 'travel', 'world', 'horizon'],
  humor: ['funny', 'joke', 'laugh', 'silly', 'comedy', 'hilarious', 'ridiculous'],
  tech: ['code', 'tech', 'digital', 'algorithm', 'software', 'computer', 'AI', 'data', 'robot'],
  nature: ['nature', 'ocean', 'forest', 'mountain', 'river', 'sky', 'earth', 'tree', 'flower'],
  battle: ['fight', 'battle', 'war', 'enemy', 'attack', 'defend', 'warrior', 'sword', 'shield'],
  mystery: ['secret', 'mystery', 'hidden', 'clue', 'detective', 'puzzle', 'shadow', 'unknown'],
  education: ['learn', 'study', 'teach', 'knowledge', 'school', 'lesson', 'understand', 'explain'],
  story: ['once upon', 'story', 'tale', 'chapter', 'character', 'narrator', 'beginning'],
}

const THEME_STYLES: Record<string, string[]> = {
  motivation: ['epic', 'inspirational', 'building energy', 'orchestral', 'powerful'],
  love: ['romantic', 'warm', 'gentle piano', 'strings', 'intimate'],
  adventure: ['adventurous', 'orchestral', 'heroic', 'sweeping', 'epic'],
  humor: ['playful', 'quirky', 'light', 'bouncy', 'whimsical'],
  tech: ['electronic', 'synth', 'futuristic', 'digital', 'modern'],
  nature: ['organic', 'acoustic', 'peaceful', 'flowing', 'ambient'],
  battle: ['intense', 'percussion-heavy', 'dramatic', 'powerful', 'orchestral'],
  mystery: ['suspenseful', 'atmospheric', 'eerie', 'noir', 'subtle'],
  education: ['clean', 'background', 'minimal', 'corporate', 'neutral'],
  story: ['narrative', 'cinematic', 'evolving', 'storytelling', 'score'],
}

function detectThemes(scripts: string[]): string[] {
  const combined = scripts.join(' ').toLowerCase()
  const detected: { theme: string; count: number }[] = []

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    let count = 0
    for (const kw of keywords) {
      if (combined.includes(kw.toLowerCase())) count++
    }
    if (count > 0) detected.push({ theme, count })
  }

  detected.sort((a, b) => b.count - a.count)
  return detected.slice(0, 3).map((d) => d.theme)
}

function getThemeStyles(themes: string[]): string[] {
  const styles: string[] = []
  for (const theme of themes) {
    const s = THEME_STYLES[theme]
    if (s) styles.push(...s)
  }
  return [...new Set(styles)]
}

// ─── Section Builder ────────────────────────────────────────────────────

interface DialogueSegment {
  emotion: DialogueEmotion
  scripts: string[]
  startMs: number
  endMs: number
  position: 'intro' | 'middle' | 'climax' | 'outro'
}

/**
 * Group consecutive dialogue lines by emotion similarity to create
 * music sections. Lines with the same emotion merge into one section.
 */
function buildSegments(lines: DialogueLine[], fps: number): DialogueSegment[] {
  if (lines.length === 0) return []

  const sorted = [...lines].sort((a, b) => a.startFrame - b.startFrame)

  const segments: DialogueSegment[] = []
  let current: DialogueSegment | null = null

  for (const line of sorted) {
    const emotion = line.emotion || 'Auto'
    const startMs = (line.startFrame / fps) * 1000
    const endMs = (line.endFrame / fps) * 1000

    if (current && current.emotion === emotion) {
      // Merge into current segment
      current.scripts.push(line.script)
      current.endMs = endMs
    } else {
      // Start new segment
      if (current) segments.push(current)
      current = {
        emotion,
        scripts: [line.script],
        startMs,
        endMs,
        position: 'middle', // Will be adjusted below
      }
    }
  }
  if (current) segments.push(current)

  // Assign narrative positions
  if (segments.length === 1) {
    segments[0].position = 'middle'
  } else if (segments.length >= 2) {
    segments[0].position = 'intro'
    segments[segments.length - 1].position = 'outro'

    // Find the most emotionally intense segment for 'climax'
    const energyRank: Record<string, number> = {
      Anger: 5, Surprise: 4, Joy: 3, Fear: 3, Disgust: 2, Sadness: 1, Neutral: 0, Auto: 1,
    }
    let maxEnergy = -1
    let climaxIdx = -1
    for (let i = 1; i < segments.length - 1; i++) {
      const e = energyRank[segments[i].emotion] ?? 1
      if (e > maxEnergy) {
        maxEnergy = e
        climaxIdx = i
      }
    }
    if (climaxIdx >= 0) segments[climaxIdx].position = 'climax'
  }

  return segments
}

/**
 * Convert a DialogueSegment into a MusicSection with appropriate styles.
 */
function segmentToSection(
  segment: DialogueSegment,
  index: number,
): MusicSection {
  const mood = EMOTION_MUSIC_MAP[segment.emotion] || EMOTION_MUSIC_MAP.Auto

  // Build section name
  const positionLabels: Record<string, string> = {
    intro: 'Intro',
    middle: `Section ${index + 1}`,
    climax: 'Climax',
    outro: 'Outro',
  }
  const sectionName = positionLabels[segment.position] || `Section ${index + 1}`

  // Build local styles combining emotion mood + narrative position
  const localStyles = [...mood.styles]

  // Add position-specific styles
  switch (segment.position) {
    case 'intro':
      localStyles.push('building', 'establishing mood', 'gradual entry')
      break
    case 'climax':
      localStyles.push('peak energy', 'full instrumentation', 'dramatic')
      break
    case 'outro':
      localStyles.push('resolving', 'winding down', 'fading')
      break
  }

  // Add tempo indication
  localStyles.push(`${mood.tempo} tempo`)

  // Ensure minimum 3 seconds and cap at 120 seconds per section
  // Round to integer — ElevenLabs API requires integer duration_ms
  const rawDurationMs = segment.endMs - segment.startMs
  const durationMs = Math.round(Math.max(3000, Math.min(120000, rawDurationMs)))

  return {
    section_name: sectionName,
    positive_local_styles: localStyles,
    negative_local_styles: mood.negativeStyles,
    duration_ms: durationMs,
    lines: [], // Instrumental — no lyrics
  }
}

// ─── Beat Detection & Snap Utilities ────────────────────────────────────

/**
 * Detect beat timestamps from an audio blob.
 * Delegates to the full beat detection service in beatDetection.ts.
 * Returns an array of beat positions in seconds.
 */
export async function detectBeats(
  audioBlob: Blob,
  _tempo?: number,
): Promise<number[]> {
  try {
    const { detectBeatsFromUrl } = await import('./beatDetection')
    const url = URL.createObjectURL(audioBlob)
    const analysis = await detectBeatsFromUrl(url)
    URL.revokeObjectURL(url)
    return analysis.beats
  } catch (err) {
    console.warn('[musicAnalyzer] Beat detection failed:', err)
    return []
  }
}

/**
 * Snap a frame position to the nearest beat if one is within tolerance.
 * @param frame      Current frame position
 * @param fps        Frames per second
 * @param beats      Array of beat timestamps in seconds
 * @param tolerance  Maximum distance (in seconds) to snap to a beat
 * @returns The (possibly snapped) frame position
 */
export function snapFrameToBeat(
  frame: number,
  fps: number,
  beats: number[],
  tolerance: number = 0.2,
): number {
  if (!beats || beats.length === 0) return frame
  const timeSec = frame / fps
  let closest = frame
  let minDist = Infinity
  for (const beatSec of beats) {
    const dist = Math.abs(beatSec - timeSec)
    if (dist < minDist && dist <= tolerance) {
      minDist = dist
      closest = Math.round(beatSec * fps)
    }
  }
  return closest
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Analyze dialogue lines and build a MusicCompositionPlan.
 *
 * @param dialogueLines - All dialogue lines from useMultiCharacterStore
 * @param fps - Timeline frames per second
 * @returns A composition plan ready for ElevenLabs music generation
 */
export function buildMusicPlanFromDialogue(
  dialogueLines: DialogueLine[],
  fps: number,
): MusicCompositionPlan {
  const scripts = dialogueLines.map((l) => l.script)
  const themes = detectThemes(scripts)
  const themeStyles = getThemeStyles(themes)

  const segments = buildSegments(dialogueLines, fps)

  // Build sections
  const sections: MusicSection[] = segments.map((seg, i) =>
    segmentToSection(seg, i),
  )

  // If no sections (no dialogue), create a generic ambient section
  if (sections.length === 0) {
    sections.push({
      section_name: 'Background',
      positive_local_styles: ['ambient', 'cinematic', 'gentle', 'background music'],
      negative_local_styles: ['vocals', 'aggressive'],
      duration_ms: 30_000,
      lines: [],
    })
  }

  // Global styles — combine themes + generic cinematic
  const positiveGlobal = [
    'instrumental',
    'background score',
    'cinematic',
    ...themeStyles.slice(0, 4),
  ]

  const negativeGlobal = [
    'vocals',
    'singing',
    'lyrics',
    'lo-fi noise',
    'distortion',
  ]

  return {
    positive_global_styles: [...new Set(positiveGlobal)],
    negative_global_styles: [...new Set(negativeGlobal)],
    sections,
  }
}

/**
 * Build a simple text prompt for music generation (alternative to composition plan).
 * Useful as a fallback or for simpler cases.
 */
export function buildMusicPromptFromDialogue(
  dialogueLines: DialogueLine[],
  fps: number,
): string {
  const scripts = dialogueLines.map((l) => l.script)
  const themes = detectThemes(scripts)
  const emotions = dialogueLines.map((l) => l.emotion || 'Auto')

  // Count dominant emotion
  const emotionCounts: Record<string, number> = {}
  for (const e of emotions) {
    emotionCounts[e] = (emotionCounts[e] || 0) + 1
  }
  const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutral'

  // Calculate total duration
  const sorted = [...dialogueLines].sort((a, b) => a.startFrame - b.startFrame)
  const totalSeconds = sorted.length > 0
    ? (sorted[sorted.length - 1].endFrame - sorted[0].startFrame) / fps
    : 30

  // Build narrative-aware prompt
  const parts: string[] = [
    'Instrumental background music for a short-form video.',
    `Duration: approximately ${Math.round(totalSeconds)} seconds.`,
  ]

  if (themes.length > 0) {
    parts.push(`Theme: ${themes.join(', ')}.`)
  }

  const mood = EMOTION_MUSIC_MAP[dominantEmotion] || EMOTION_MUSIC_MAP.Neutral
  parts.push(`Mood: ${mood.styles.slice(0, 3).join(', ')}.`)
  parts.push(`Energy: ${mood.energy}, tempo: ${mood.tempo}.`)

  // Narrative arc
  if (dialogueLines.length > 2) {
    const firstEmotion = dialogueLines[0].emotion || 'Auto'
    const lastEmotion = dialogueLines[dialogueLines.length - 1].emotion || 'Auto'
    const firstMood = EMOTION_MUSIC_MAP[firstEmotion] || EMOTION_MUSIC_MAP.Auto
    const lastMood = EMOTION_MUSIC_MAP[lastEmotion] || EMOTION_MUSIC_MAP.Auto

    if (firstMood.energy !== lastMood.energy) {
      parts.push(`Build from ${firstMood.energy} energy to ${lastMood.energy} energy.`)
    }
  }

  parts.push('No vocals, no singing. Cinematic, suitable as background score.')

  return parts.join(' ')
}
