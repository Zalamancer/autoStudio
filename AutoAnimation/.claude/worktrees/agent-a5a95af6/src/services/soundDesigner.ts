/**
 * Sound Designer Service
 *
 * Intelligent audio system that auto-generates sound design for clips:
 * - Sound design presets (Corporate, Energetic, Dramatic, Chill, etc.)
 * - Auto SFX placement (whoosh on transitions, impact on text reveals, ambient)
 * - Emotional music arc (mood shifts with script emotion changes)
 * - Transition audio (swooshes, risers, stingers)
 * - Volume automation curves beyond basic ducking
 */

import type { ClipPlan, ClipPlanSoundEffect } from '@/types/orchestrator'
import type { QACheckResult } from '@/types/qualityAssurance'

// ── Sound Design Presets ────────────────────────────────────────────────

export type SoundDesignPresetId =
  | 'corporate'
  | 'energetic'
  | 'dramatic'
  | 'chill'
  | 'horror'
  | 'comedy'
  | 'educational'
  | 'cinematic'
  | 'retro'
  | 'minimal'

export interface SoundDesignPreset {
  id: SoundDesignPresetId
  name: string
  description: string
  /** Music generation prompt modifiers */
  musicStyles: string[]
  /** Negative styles to avoid */
  musicNegativeStyles: string[]
  /** Music tempo hint */
  tempo: 'slow' | 'moderate' | 'fast'
  /** Music energy level */
  energy: 'low' | 'medium' | 'high'
  /** Overall music volume (0-1) */
  musicVolume: number
  /** SFX volume multiplier */
  sfxVolumeMultiplier: number
  /** Auto-add transition sounds */
  useTransitionSounds: boolean
  /** Auto-add ambient background */
  useAmbientBed: boolean
  /** Ambient sound prompt (if useAmbientBed) */
  ambientPrompt?: string
  /** Ducking intensity in dB (more negative = more ducking) */
  duckAmountDb: number
  /** Types of auto-SFX to add */
  autoSfxTypes: AutoSfxType[]
  /** Transition sound style */
  transitionStyle: TransitionSoundStyle
}

export type AutoSfxType = 'text-reveal' | 'transition' | 'accent' | 'ambient' | 'countdown' | 'notification'
export type TransitionSoundStyle = 'whoosh' | 'click' | 'glitch' | 'swoosh' | 'none' | 'subtle' | 'cinematic'

export const SOUND_DESIGN_PRESETS: Record<SoundDesignPresetId, SoundDesignPreset> = {
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'Clean, professional sound for business content',
    musicStyles: ['corporate', 'clean', 'uplifting', 'professional', 'motivational', 'light acoustic'],
    musicNegativeStyles: ['aggressive', 'dark', 'heavy bass', 'distortion', 'vocals'],
    tempo: 'moderate',
    energy: 'medium',
    musicVolume: 0.3,
    sfxVolumeMultiplier: 0.6,
    useTransitionSounds: true,
    useAmbientBed: false,
    duckAmountDb: -14,
    autoSfxTypes: ['text-reveal', 'transition'],
    transitionStyle: 'click',
  },
  energetic: {
    id: 'energetic',
    name: 'Energetic',
    description: 'High-energy, punchy sound for dynamic content',
    musicStyles: ['energetic', 'driving', 'upbeat', 'electronic', 'powerful bass', 'festival'],
    musicNegativeStyles: ['ambient', 'slow', 'gentle', 'lullaby'],
    tempo: 'fast',
    energy: 'high',
    musicVolume: 0.45,
    sfxVolumeMultiplier: 0.9,
    useTransitionSounds: true,
    useAmbientBed: false,
    duckAmountDb: -10,
    autoSfxTypes: ['text-reveal', 'transition', 'accent'],
    transitionStyle: 'whoosh',
  },
  dramatic: {
    id: 'dramatic',
    name: 'Dramatic',
    description: 'Cinematic, intense sound for storytelling',
    musicStyles: ['dramatic', 'cinematic', 'orchestral', 'tension', 'epic', 'strings'],
    musicNegativeStyles: ['cheerful', 'pop', 'light', 'playful'],
    tempo: 'moderate',
    energy: 'high',
    musicVolume: 0.4,
    sfxVolumeMultiplier: 0.8,
    useTransitionSounds: true,
    useAmbientBed: true,
    ambientPrompt: 'subtle dark atmospheric rumble, deep low frequency',
    duckAmountDb: -12,
    autoSfxTypes: ['text-reveal', 'transition', 'accent', 'ambient'],
    transitionStyle: 'cinematic',
  },
  chill: {
    id: 'chill',
    name: 'Chill',
    description: 'Relaxed, mellow sound for laid-back content',
    musicStyles: ['lofi', 'chill', 'mellow', 'ambient', 'soft piano', 'warm'],
    musicNegativeStyles: ['aggressive', 'loud', 'intense', 'heavy'],
    tempo: 'slow',
    energy: 'low',
    musicVolume: 0.35,
    sfxVolumeMultiplier: 0.4,
    useTransitionSounds: false,
    useAmbientBed: false,
    duckAmountDb: -15,
    autoSfxTypes: [],
    transitionStyle: 'none',
  },
  horror: {
    id: 'horror',
    name: 'Horror',
    description: 'Dark, unsettling atmosphere',
    musicStyles: ['horror', 'dark ambient', 'eerie', 'dissonant', 'suspenseful', 'drone'],
    musicNegativeStyles: ['happy', 'upbeat', 'cheerful', 'major key'],
    tempo: 'slow',
    energy: 'medium',
    musicVolume: 0.35,
    sfxVolumeMultiplier: 0.9,
    useTransitionSounds: true,
    useAmbientBed: true,
    ambientPrompt: 'eerie wind howling, subtle creaking, distant thunder',
    duckAmountDb: -10,
    autoSfxTypes: ['transition', 'accent', 'ambient'],
    transitionStyle: 'glitch',
  },
  comedy: {
    id: 'comedy',
    name: 'Comedy',
    description: 'Fun, playful sound for humorous content',
    musicStyles: ['playful', 'quirky', 'fun', 'bouncy', 'ukulele', 'whimsical'],
    musicNegativeStyles: ['dark', 'aggressive', 'intense', 'sad'],
    tempo: 'moderate',
    energy: 'medium',
    musicVolume: 0.3,
    sfxVolumeMultiplier: 0.8,
    useTransitionSounds: true,
    useAmbientBed: false,
    duckAmountDb: -14,
    autoSfxTypes: ['text-reveal', 'transition', 'accent', 'notification'],
    transitionStyle: 'click',
  },
  educational: {
    id: 'educational',
    name: 'Educational',
    description: 'Clear, focused sound for learning content',
    musicStyles: ['background', 'neutral', 'clean', 'minimal', 'gentle piano'],
    musicNegativeStyles: ['loud', 'aggressive', 'heavy', 'chaotic'],
    tempo: 'moderate',
    energy: 'low',
    musicVolume: 0.2,
    sfxVolumeMultiplier: 0.5,
    useTransitionSounds: true,
    useAmbientBed: false,
    duckAmountDb: -16,
    autoSfxTypes: ['text-reveal', 'notification'],
    transitionStyle: 'subtle',
  },
  cinematic: {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Film-quality sound design with rich layering',
    musicStyles: ['cinematic', 'orchestral', 'epic', 'film score', 'sweeping', 'hans zimmer inspired'],
    musicNegativeStyles: ['lo-fi', 'amateur', 'garage', 'chippy'],
    tempo: 'moderate',
    energy: 'high',
    musicVolume: 0.4,
    sfxVolumeMultiplier: 1.0,
    useTransitionSounds: true,
    useAmbientBed: true,
    ambientPrompt: 'subtle room tone, cinematic atmosphere',
    duckAmountDb: -12,
    autoSfxTypes: ['text-reveal', 'transition', 'accent', 'ambient'],
    transitionStyle: 'cinematic',
  },
  retro: {
    id: 'retro',
    name: 'Retro',
    description: '8-bit, synthwave, nostalgic sound',
    musicStyles: ['synthwave', 'retrowave', '80s synth', 'neon', 'chiptune inspired', 'nostalgic'],
    musicNegativeStyles: ['acoustic', 'organic', 'classical', 'jazz'],
    tempo: 'moderate',
    energy: 'medium',
    musicVolume: 0.35,
    sfxVolumeMultiplier: 0.7,
    useTransitionSounds: true,
    useAmbientBed: false,
    duckAmountDb: -12,
    autoSfxTypes: ['text-reveal', 'transition', 'accent'],
    transitionStyle: 'glitch',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Barely-there audio, focused on dialogue',
    musicStyles: ['minimal', 'ambient', 'sparse', 'quiet'],
    musicNegativeStyles: ['loud', 'complex', 'busy', 'orchestral'],
    tempo: 'slow',
    energy: 'low',
    musicVolume: 0.15,
    sfxVolumeMultiplier: 0.3,
    useTransitionSounds: false,
    useAmbientBed: false,
    duckAmountDb: -18,
    autoSfxTypes: [],
    transitionStyle: 'none',
  },
}

// ── Auto SFX Intelligence ───────────────────────────────────────────────

/** SFX prompt templates for different event types */
const AUTO_SFX_PROMPTS: Record<AutoSfxType, string[]> = {
  'text-reveal': [
    'short subtle text pop notification',
    'soft digital appear sound effect',
    'minimal UI reveal blip',
  ],
  'transition': [
    'quick smooth transition swoosh',
    'short soft whoosh sound',
    'fast slide transition sweep',
  ],
  'accent': [
    'short dramatic accent hit',
    'punchy impact stinger',
    'orchestral accent stab',
  ],
  'ambient': [
    'gentle background atmosphere hum',
    'subtle ambient room tone',
    'soft atmospheric pad',
  ],
  'countdown': [
    'countdown tick clock',
    'timer beep notification',
    'digital countdown blip',
  ],
  'notification': [
    'short notification ding',
    'subtle alert chime',
    'soft bell notification sound',
  ],
}

/** Transition sound prompts by style */
const TRANSITION_SOUND_PROMPTS: Record<TransitionSoundStyle, string> = {
  whoosh: 'fast energetic whoosh swoosh transition',
  click: 'crisp mechanical click snap transition',
  glitch: 'digital glitch distortion transition effect',
  swoosh: 'smooth airy swoosh transition',
  cinematic: 'cinematic impact transition with low bass hit',
  subtle: 'subtle soft transition swipe',
  none: '',
}

export interface SceneEvent {
  type: 'text-enter' | 'text-exit' | 'media-transition' | 'scene-change' | 'dialogue-start' | 'dialogue-end' | 'shape-enter' | 'accent-moment'
  frame: number
  /** 0-1 position in clip */
  timePercent: number
  /** Optional label for debugging */
  label?: string
}

/**
 * Analyze a clip plan and detect scene events that should trigger SFX.
 */
export function detectSceneEvents(plan: ClipPlan, fps: number): SceneEvent[] {
  const events: SceneEvent[] = []
  const totalFrames = Math.round(plan.canvas.durationSeconds * fps)

  // Text overlay entrances / exits
  for (const text of plan.textOverlays) {
    const startFrame = Math.round(text.startPercent * totalFrames)
    const endFrame = Math.round(text.endPercent * totalFrames)
    events.push({
      type: 'text-enter',
      frame: startFrame,
      timePercent: text.startPercent,
      label: `Text: "${text.content.slice(0, 30)}"`,
    })
    events.push({
      type: 'text-exit',
      frame: endFrame,
      timePercent: text.endPercent,
      label: `Text exit: "${text.content.slice(0, 30)}"`,
    })
  }

  // Stock media transitions
  if (plan.stockMedia) {
    for (const media of plan.stockMedia) {
      const startFrame = Math.round((media.startPercent ?? 0) * totalFrames)
      events.push({
        type: 'media-transition',
        frame: startFrame,
        timePercent: media.startPercent ?? 0,
        label: `Media: "${media.query?.slice(0, 30)}"`,
      })
    }
  }

  // Dialogue start/end points
  let dialogueFrame = 0
  for (const line of plan.dialogue) {
    events.push({
      type: 'dialogue-start',
      frame: dialogueFrame,
      timePercent: dialogueFrame / totalFrames,
      label: `Dialogue: ${line.characterName}`,
    })
    // Estimate dialogue duration based on word count (~2.5 words/sec)
    const words = line.script.replace(/\[[\w-]+\]/g, '').split(/\s+/).length
    const estDuration = (words / 2.5) * fps
    dialogueFrame += Math.round(estDuration)
    events.push({
      type: 'dialogue-end',
      frame: Math.min(dialogueFrame, totalFrames),
      timePercent: Math.min(dialogueFrame / totalFrames, 1),
    })
  }

  // Shape entrances
  for (const shape of plan.shapes) {
    const startFrame = Math.round(shape.startPercent * totalFrames)
    events.push({
      type: 'shape-enter',
      frame: startFrame,
      timePercent: shape.startPercent,
      label: `Shape: ${shape.type}`,
    })
  }

  // Sort by frame
  events.sort((a, b) => a.frame - b.frame)
  return events
}

/**
 * Generate auto SFX entries for a clip plan based on scene events and preset.
 * Returns SFX entries that can be merged into the plan's soundEffects array.
 */
export function generateAutoSfx(
  events: SceneEvent[],
  preset: SoundDesignPreset,
  existingSfx: ClipPlanSoundEffect[] = [],
): ClipPlanSoundEffect[] {
  const sfx: ClipPlanSoundEffect[] = []
  const usedFrames = new Set<number>()

  // Track existing SFX positions to avoid overlap
  for (const existing of existingSfx) {
    usedFrames.add(Math.round(existing.startPercent * 1000)) // rough dedup
  }

  for (const event of events) {
    const frameKey = Math.round(event.timePercent * 1000)
    if (usedFrames.has(frameKey)) continue

    let sfxType: AutoSfxType | null = null
    switch (event.type) {
      case 'text-enter':
        sfxType = 'text-reveal'
        break
      case 'media-transition':
        sfxType = 'transition'
        break
      case 'shape-enter':
        sfxType = 'accent'
        break
      default:
        continue
    }

    if (!sfxType || !preset.autoSfxTypes.includes(sfxType)) continue

    const prompts = AUTO_SFX_PROMPTS[sfxType]
    const prompt = prompts[Math.floor(Math.random() * prompts.length)]

    const duration = sfxType === 'transition' ? 0.5 : 0.8
    const vol = sfxType === 'accent' ? 0.5 : 0.6

    sfx.push({
      prompt,
      source: 'generate',
      startPercent: event.timePercent,
      durationSeconds: duration,
      volume: vol * preset.sfxVolumeMultiplier,
    })

    usedFrames.add(frameKey)
  }

  return sfx
}

/**
 * Generate transition audio entries for scene changes.
 * Returns SFX entries for transition sounds.
 */
export function generateTransitionAudio(
  events: SceneEvent[],
  preset: SoundDesignPreset,
): ClipPlanSoundEffect[] {
  if (preset.transitionStyle === 'none' || !preset.useTransitionSounds) return []

  const prompt = TRANSITION_SOUND_PROMPTS[preset.transitionStyle]
  if (!prompt) return []

  const sfx: ClipPlanSoundEffect[] = []
  const transitions = events.filter(
    (e) => e.type === 'media-transition' || e.type === 'text-enter'
  )

  // Limit to avoid over-saturating with transition sounds
  const maxTransitions = 8
  const step = Math.max(1, Math.ceil(transitions.length / maxTransitions))

  for (let i = 0; i < transitions.length; i += step) {
    const event = transitions[i]
    sfx.push({
      prompt,
      source: 'generate',
      startPercent: Math.max(0, event.timePercent - 0.01), // slightly before the visual
      durationSeconds: 0.5,
      volume: 0.5 * preset.sfxVolumeMultiplier,
    })
  }

  return sfx
}

// ── Volume Automation ───────────────────────────────────────────────────

export interface VolumeAutomationPoint {
  /** Time in seconds */
  timeSec: number
  /** Volume 0-1 */
  volume: number
}

export interface VolumeAutomationCurve {
  trackType: 'dialogue' | 'music' | 'sfx'
  points: VolumeAutomationPoint[]
}

/**
 * Build a volume automation curve for music that responds to the emotional arc.
 * Music volume swells during high-energy moments and pulls back during quiet ones.
 */
export function buildEmotionalVolumeAutomation(
  emotions: Array<{ startSec: number; endSec: number; emotion: string; energy: 'low' | 'medium' | 'high' }>,
  preset: SoundDesignPreset,
  totalDurationSec: number,
): VolumeAutomationCurve {
  const baseVolume = preset.musicVolume
  const points: VolumeAutomationPoint[] = [{ timeSec: 0, volume: baseVolume * 0.7 }]

  const energyMultiplier: Record<string, number> = {
    low: 0.7,
    medium: 1.0,
    high: 1.3,
  }

  for (const segment of emotions) {
    const multiplier = energyMultiplier[segment.energy] ?? 1.0
    const targetVolume = Math.min(1, baseVolume * multiplier)

    // Fade to target at segment start
    points.push({
      timeSec: segment.startSec,
      volume: targetVolume,
    })

    // Hold through segment
    points.push({
      timeSec: segment.endSec,
      volume: targetVolume,
    })
  }

  // Fade out at end
  points.push({
    timeSec: Math.max(0, totalDurationSec - 1),
    volume: baseVolume * 0.5,
  })
  points.push({
    timeSec: totalDurationSec,
    volume: 0,
  })

  return { trackType: 'music', points }
}

// ── Music Prompt Enhancement ────────────────────────────────────────────

/**
 * Enhance a music generation prompt with sound design preset modifiers.
 */
export function enhanceMusicPrompt(
  basePrompt: string,
  preset: SoundDesignPreset,
): string {
  const parts = [basePrompt]

  // Add style keywords from preset
  if (preset.musicStyles.length > 0) {
    parts.push(`Style: ${preset.musicStyles.slice(0, 4).join(', ')}.`)
  }

  // Add tempo/energy hints
  parts.push(`Tempo: ${preset.tempo}. Energy: ${preset.energy}.`)

  // Add negative constraints
  if (preset.musicNegativeStyles.length > 0) {
    parts.push(`Avoid: ${preset.musicNegativeStyles.slice(0, 3).join(', ')}.`)
  }

  return parts.join(' ')
}

/**
 * Apply a sound design preset to a clip plan.
 * Enriches the plan with auto SFX, transition audio, and ambient sounds.
 * Returns a modified copy of the plan (does not mutate the original).
 */
export function applySoundDesignPreset(
  plan: ClipPlan,
  presetId: SoundDesignPresetId,
  fps: number,
): ClipPlan {
  const preset = SOUND_DESIGN_PRESETS[presetId]
  if (!preset) return plan

  const events = detectSceneEvents(plan, fps)
  const existingSfx = plan.soundEffects ?? []

  // Auto-generate SFX
  const autoSfx = generateAutoSfx(events, preset, existingSfx)

  // Generate transition audio
  const transitionSfx = generateTransitionAudio(events, preset)

  // Generate ambient bed if enabled
  const ambientSfx: ClipPlanSoundEffect[] = []
  if (preset.useAmbientBed && preset.ambientPrompt) {
    ambientSfx.push({
      prompt: preset.ambientPrompt,
      source: 'generate',
      startPercent: 0,
      durationSeconds: Math.min(plan.canvas.durationSeconds, 22),
      volume: 0.15 * preset.sfxVolumeMultiplier,
    })
  }

  return {
    ...plan,
    soundEffects: [
      ...existingSfx,
      ...autoSfx,
      ...transitionSfx,
      ...ambientSfx,
    ],
  }
}

/**
 * Get a sound design preset by ID.
 */
export function getSoundDesignPreset(id: SoundDesignPresetId): SoundDesignPreset | undefined {
  return SOUND_DESIGN_PRESETS[id]
}

/**
 * Get all available preset IDs and names.
 */
export function listSoundDesignPresets(): Array<{ id: SoundDesignPresetId; name: string; description: string }> {
  return Object.values(SOUND_DESIGN_PRESETS).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }))
}

// ── Beat Analysis Bridge (for animation engine) ─────────────────────────

/**
 * Convert BeatAnalysis from beatDetection.ts into the animation engine's
 * Beat[] format (used by src/engine/beatSync.ts).
 *
 * The animation engine expects beats with { time, strength, isDownbeat }.
 * Our BeatAnalysis provides raw beat timestamps, BPM, and energy segments.
 * This function enriches the data:
 * - Assigns strength based on energy segments
 * - Marks downbeats using BPM-derived measure positions
 */
export function beatAnalysisToEngineBeats(
  analysis: import('@/services/beatDetection').BeatAnalysis,
): import('@/engine/beatSync').Beat[] {
  const { beats, bpm, segments } = analysis
  if (beats.length === 0) return []

  const beatInterval = 60 / bpm

  return beats.map((time) => {
    // Determine strength from energy segments
    let strength = 0.6
    for (const seg of segments) {
      if (time >= seg.startTime && time < seg.endTime) {
        // Normalize energy to 0-1 range (use peak as reference)
        strength = seg.peakEnergy > 0
          ? Math.min(1, seg.averageEnergy / seg.peakEnergy + 0.3)
          : 0.6
        break
      }
    }

    // Determine downbeat from measure position (assumes 4/4 time)
    const measurePosition = Math.round((time - beats[0]) / beatInterval) % 4
    const isDownbeat = measurePosition === 0

    // Downbeats are stronger
    if (isDownbeat) {
      strength = Math.min(1, strength * 1.3)
    }

    return { time, strength, isDownbeat }
  })
}

// ── Audio Mix Validation ──────────────────────────────────────────────────

export interface AudioMixInput {
  /** Total clip duration in seconds */
  durationSeconds: number
  /** FPS of the clip */
  fps: number
  /** Dialogue segments with amplitude data */
  dialogueSegments: Array<{
    startTime: number
    endTime: number
    avgAmplitude: number
    peakAmplitude: number
    /** Critical word timestamps within this segment */
    wordTimestamps?: Array<{ word: string; startTime: number; endTime: number }>
  }>
  /** Background music info */
  music: { volume: number; duration: number; peakAmplitude: number } | null
  /** Sound effect segments */
  sfxSegments: Array<{
    startTime: number
    endTime: number
    avgAmplitude: number
    peakAmplitude: number
  }>
  /** Master volume levels from audio design store */
  masterDialogueVolume: number
  masterMusicVolume: number
  masterSfxVolume: number
}

/**
 * Validate an audio mix for professional quality standards.
 *
 * Checks:
 * 1. Dialogue-to-music ratio (dialogue should be 6-10dB louder)
 * 2. Audio clipping (any channel peaking above -1dB / ~0.89 linear)
 * 3. Total audio coverage (should have sound for 95%+ of clip)
 * 4. SFX timing conflicts (no SFX during critical dialogue words)
 *
 * Returns QACheckResult[] compatible with the QA system.
 */
export function validateAudioMix(input: AudioMixInput): QACheckResult[] {
  return [
    checkDialogueMusicRatio(input),
    checkAudioClipping(input),
    checkAudioCoverage(input),
    checkSfxDialogueConflicts(input),
  ]
}

// ── Check 1: Dialogue-to-Music Ratio ──

function checkDialogueMusicRatio(input: AudioMixInput): QACheckResult {
  const { dialogueSegments, music, masterDialogueVolume, masterMusicVolume } = input

  if (!music || dialogueSegments.length === 0) {
    return {
      id: 'mix-dialogue-music-ratio',
      name: 'Dialogue-to-Music Ratio',
      category: 'audio',
      status: 'skipped',
      severity: 'info',
      score: 100,
      description: !music ? 'No music track to compare' : 'No dialogue to compare',
      autoFixable: false,
    }
  }

  // Compute effective amplitudes with master volumes applied
  const avgDialogueAmp =
    (dialogueSegments.reduce((s, d) => s + d.avgAmplitude, 0) / dialogueSegments.length) *
    masterDialogueVolume
  const effectiveMusicAmp = music.volume * masterMusicVolume

  // Avoid log(0) — treat silence as -60dB
  const dialogueDb = avgDialogueAmp > 0 ? 20 * Math.log10(avgDialogueAmp) : -60
  const musicDb = effectiveMusicAmp > 0 ? 20 * Math.log10(effectiveMusicAmp) : -60

  const ratioDb = dialogueDb - musicDb

  // Ideal: 6-10dB separation
  let score = 100
  let status: 'pass' | 'fail' | 'warning' = 'pass'
  let description = `Dialogue is ${ratioDb.toFixed(1)}dB above music (ideal: 6-10dB)`

  if (ratioDb < 3) {
    // Music too loud, drowning dialogue
    score = 25
    status = 'fail'
    description = `Dialogue only ${ratioDb.toFixed(1)}dB above music — music is drowning dialogue`
  } else if (ratioDb < 6) {
    score = 60
    status = 'warning'
    description = `Dialogue is ${ratioDb.toFixed(1)}dB above music — could be clearer (target 6-10dB)`
  } else if (ratioDb > 15) {
    score = 70
    status = 'warning'
    description = `Dialogue is ${ratioDb.toFixed(1)}dB above music — music may be inaudible`
  } else if (ratioDb > 10) {
    score = 85
  }

  return {
    id: 'mix-dialogue-music-ratio',
    name: 'Dialogue-to-Music Ratio',
    category: 'audio',
    status,
    severity: score < 50 ? 'critical' : 'warning',
    score: Math.round(score),
    description,
    suggestion:
      ratioDb < 6
        ? `Lower music volume to achieve 6-10dB separation (currently ${ratioDb.toFixed(1)}dB)`
        : ratioDb > 15
          ? 'Increase music volume slightly — it adds production value'
          : undefined,
    autoFixable: ratioDb < 6,
    autoFixAction: ratioDb < 6 ? 'adjust-music-volume' : undefined,
    metadata: { dialogueDb, musicDb, ratioDb, avgDialogueAmp, effectiveMusicAmp },
  }
}

// ── Check 2: Audio Clipping ──

function checkAudioClipping(input: AudioMixInput): QACheckResult {
  const { dialogueSegments, music, sfxSegments, masterDialogueVolume, masterMusicVolume, masterSfxVolume } = input

  // -1dB threshold in linear amplitude ≈ 0.891
  const CLIPPING_THRESHOLD = 0.891

  const clippingSources: Array<{ source: string; peak: number; peakDb: number }> = []

  // Check dialogue peaks
  for (let i = 0; i < dialogueSegments.length; i++) {
    const effectivePeak = dialogueSegments[i].peakAmplitude * masterDialogueVolume
    if (effectivePeak > CLIPPING_THRESHOLD) {
      const peakDb = 20 * Math.log10(effectivePeak)
      clippingSources.push({
        source: `Dialogue segment ${i + 1} (${dialogueSegments[i].startTime.toFixed(1)}s)`,
        peak: effectivePeak,
        peakDb,
      })
    }
  }

  // Check music peak
  if (music) {
    const effectivePeak = music.peakAmplitude * masterMusicVolume
    if (effectivePeak > CLIPPING_THRESHOLD) {
      clippingSources.push({
        source: 'Music track',
        peak: effectivePeak,
        peakDb: 20 * Math.log10(effectivePeak),
      })
    }
  }

  // Check SFX peaks
  for (let i = 0; i < sfxSegments.length; i++) {
    const effectivePeak = sfxSegments[i].peakAmplitude * masterSfxVolume
    if (effectivePeak > CLIPPING_THRESHOLD) {
      clippingSources.push({
        source: `SFX ${i + 1} (${sfxSegments[i].startTime.toFixed(1)}s)`,
        peak: effectivePeak,
        peakDb: 20 * Math.log10(effectivePeak),
      })
    }
  }

  if (clippingSources.length === 0) {
    return {
      id: 'mix-clipping',
      name: 'Audio Clipping',
      category: 'audio',
      status: 'pass',
      severity: 'info',
      score: 100,
      description: 'No audio channels peaking above -1dB',
      autoFixable: false,
    }
  }

  const worstPeakDb = Math.max(...clippingSources.map((c) => c.peakDb))
  const score = Math.max(0, 100 - clippingSources.length * 20 - (worstPeakDb > -0.5 ? 20 : 0))

  return {
    id: 'mix-clipping',
    name: 'Audio Clipping',
    category: 'audio',
    status: score < 50 ? 'fail' : 'warning',
    severity: 'critical',
    score: Math.round(score),
    description: `${clippingSources.length} source(s) peaking above -1dB (worst: ${worstPeakDb.toFixed(1)}dB)`,
    suggestion: 'Reduce volume on clipping sources or apply limiting to prevent distortion',
    autoFixable: true,
    autoFixAction: 'reduce-clipping-volume',
    metadata: { clippingSources, worstPeakDb },
  }
}

// ── Check 3: Audio Coverage ──

function checkAudioCoverage(input: AudioMixInput): QACheckResult {
  const { durationSeconds, dialogueSegments, music, sfxSegments } = input

  if (durationSeconds <= 0) {
    return {
      id: 'mix-coverage',
      name: 'Audio Coverage',
      category: 'audio',
      status: 'skipped',
      severity: 'info',
      score: 100,
      description: 'Zero-length clip',
      autoFixable: false,
    }
  }

  // Build a coverage bitmap at 10ms resolution
  const resolution = 0.01
  const buckets = Math.ceil(durationSeconds / resolution)
  const covered = new Uint8Array(buckets)

  // Mark dialogue coverage
  for (const seg of dialogueSegments) {
    const start = Math.floor(seg.startTime / resolution)
    const end = Math.min(Math.ceil(seg.endTime / resolution), buckets)
    for (let i = start; i < end; i++) covered[i] = 1
  }

  // Mark SFX coverage
  for (const seg of sfxSegments) {
    const start = Math.floor(seg.startTime / resolution)
    const end = Math.min(Math.ceil(seg.endTime / resolution), buckets)
    for (let i = start; i < end; i++) covered[i] = 1
  }

  // Music covers its duration (or looped = full)
  if (music) {
    const musicEnd = Math.min(music.duration, durationSeconds)
    const start = 0
    const end = Math.min(Math.ceil(musicEnd / resolution), buckets)
    for (let i = start; i < end; i++) covered[i] = 1
  }

  let coveredCount = 0
  for (let i = 0; i < buckets; i++) {
    if (covered[i]) coveredCount++
  }

  const coveragePercent = (coveredCount / buckets) * 100

  // Target: 95%+
  let score: number
  let status: 'pass' | 'fail' | 'warning'

  if (coveragePercent >= 95) {
    score = 100
    status = 'pass'
  } else if (coveragePercent >= 80) {
    score = 70
    status = 'warning'
  } else if (coveragePercent >= 60) {
    score = 45
    status = 'fail'
  } else {
    score = 20
    status = 'fail'
  }

  return {
    id: 'mix-coverage',
    name: 'Audio Coverage',
    category: 'audio',
    status,
    severity: coveragePercent < 60 ? 'critical' : 'warning',
    score: Math.round(score),
    description: `${coveragePercent.toFixed(1)}% of clip has audio (target: 95%+)`,
    suggestion:
      coveragePercent < 95
        ? 'Add background music or ambient sound to fill silent sections'
        : undefined,
    autoFixable: coveragePercent < 95,
    autoFixAction: 'add-ambient-fill',
    metadata: { coveragePercent, coveredSeconds: coveredCount * resolution, durationSeconds },
  }
}

// ── Check 4: SFX Timing Conflicts ──

function checkSfxDialogueConflicts(input: AudioMixInput): QACheckResult {
  const { dialogueSegments, sfxSegments } = input

  if (sfxSegments.length === 0 || dialogueSegments.length === 0) {
    return {
      id: 'mix-sfx-timing',
      name: 'SFX Timing',
      category: 'audio',
      status: 'pass',
      severity: 'info',
      score: 100,
      description: sfxSegments.length === 0 ? 'No SFX to check' : 'No dialogue to conflict with',
      autoFixable: false,
    }
  }

  // Collect all critical dialogue word timestamps
  const criticalWords: Array<{ word: string; startTime: number; endTime: number }> = []
  for (const seg of dialogueSegments) {
    if (seg.wordTimestamps) {
      criticalWords.push(...seg.wordTimestamps)
    }
  }

  // If no word-level timestamps, check for any SFX overlapping dialogue segments
  const conflicts: Array<{
    sfxStart: number
    sfxEnd: number
    dialogueStart: number
    dialogueEnd: number
    word?: string
  }> = []

  if (criticalWords.length > 0) {
    // Check SFX overlapping individual words
    for (const sfx of sfxSegments) {
      for (const word of criticalWords) {
        if (sfx.startTime < word.endTime && sfx.endTime > word.startTime) {
          conflicts.push({
            sfxStart: sfx.startTime,
            sfxEnd: sfx.endTime,
            dialogueStart: word.startTime,
            dialogueEnd: word.endTime,
            word: word.word,
          })
        }
      }
    }
  } else {
    // Fallback: check SFX overlapping dialogue segments directly
    for (const sfx of sfxSegments) {
      for (const dial of dialogueSegments) {
        if (sfx.startTime < dial.endTime && sfx.endTime > dial.startTime) {
          // Only flag if SFX is loud relative to dialogue
          if (sfx.avgAmplitude > dial.avgAmplitude * 0.5) {
            conflicts.push({
              sfxStart: sfx.startTime,
              sfxEnd: sfx.endTime,
              dialogueStart: dial.startTime,
              dialogueEnd: dial.endTime,
            })
          }
        }
      }
    }
  }

  if (conflicts.length === 0) {
    return {
      id: 'mix-sfx-timing',
      name: 'SFX Timing',
      category: 'audio',
      status: 'pass',
      severity: 'info',
      score: 100,
      description: 'No SFX conflicts with dialogue timing',
      autoFixable: false,
    }
  }

  const score = Math.max(0, 100 - conflicts.length * 15)
  const wordConflicts = conflicts.filter((c) => c.word)

  return {
    id: 'mix-sfx-timing',
    name: 'SFX Timing',
    category: 'audio',
    status: score < 50 ? 'fail' : 'warning',
    severity: wordConflicts.length > 0 ? 'warning' : 'info',
    score: Math.round(score),
    description: `${conflicts.length} SFX conflict(s) with dialogue${
      wordConflicts.length > 0
        ? ` (overlapping words: ${wordConflicts
            .slice(0, 3)
            .map((c) => `"${c.word}"`)
            .join(', ')})`
        : ''
    }`,
    suggestion: 'Shift SFX to natural pauses between dialogue words, or reduce SFX volume during speech',
    autoFixable: true,
    autoFixAction: 'shift-sfx-timing',
    metadata: { conflicts, totalConflicts: conflicts.length },
  }
}
