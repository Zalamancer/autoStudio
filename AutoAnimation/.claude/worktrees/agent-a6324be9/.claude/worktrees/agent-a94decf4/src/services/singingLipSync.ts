/**
 * Singing Lip Sync — Core singing lip sync engine.
 *
 * Maps audio analysis (amplitude, pitch, beats) to VisemeEvent[] using singing-specific rules:
 * 1. Amplitude determines mouth openness (high=Aa, medium=Oh/Ee, low=Oo/MBP, silence=Rest)
 * 2. Pitch determines mouth width (high=wider shapes, low=rounded shapes)
 * 3. Beat onsets trigger transient wide-open (Aa) for ~50ms then settle
 * 4. Vibrato oscillates between adjacent visemes at vibrato frequency
 */

import type { Viseme, VisemeEvent, SingingVisemeConfig, LyricLine } from '@/types/voice'
import type { SongAnalysis } from '@/services/singingAnalyzer'

/**
 * Map amplitude to a singing viseme.
 */
function amplitudeToViseme(amplitude: number, pitch: number, pitchSensitivity: number): Viseme {
  // Silence
  if (amplitude < 0.02) return 'Rest'

  // Low amplitude
  if (amplitude < 0.15) {
    return pitch > 300 * pitchSensitivity ? 'Ee' : 'M'
  }

  // Medium amplitude
  if (amplitude < 0.4) {
    if (pitch > 400 * pitchSensitivity) return 'Ee'
    if (pitch > 200 * pitchSensitivity) return 'O'
    return 'U'
  }

  // High amplitude
  if (pitch > 400 * pitchSensitivity) return 'Aa'
  if (pitch > 250 * pitchSensitivity) return 'O'
  return 'Aa'
}

/**
 * Generate singing viseme timeline from audio analysis.
 */
export function generateSingingVisemeTimeline(
  analysis: SongAnalysis,
  config: SingingVisemeConfig,
  fps: number,
): VisemeEvent[] {
  const { amplitudeEnvelope, pitchTrack, beats } = analysis
  const { pitchSensitivity, beatEmphasis, vibratoSpeed } = config

  const events: VisemeEvent[] = []
  const frameDuration = 1 / fps
  const totalFrames = Math.min(amplitudeEnvelope.length, pitchTrack.length)

  // Create beat set for quick lookup (frame indices)
  const beatFrames = new Set(beats.map((t) => Math.round(t * fps)))

  for (let frame = 0; frame < totalFrames; frame++) {
    const amplitude = amplitudeEnvelope[frame] ?? 0
    const pitch = pitchTrack[frame] ?? 200

    let viseme = amplitudeToViseme(amplitude, pitch, pitchSensitivity)

    // Beat emphasis: snap to Aa on beat frames
    if (beatEmphasis > 0 && beatFrames.has(frame)) {
      viseme = 'Aa'
    }

    // Vibrato: oscillate between adjacent visemes
    if (vibratoSpeed > 0 && amplitude > 0.1) {
      const vibratoPhase = Math.sin(frame * vibratoSpeed * 0.5)
      if (vibratoPhase > 0.5 && viseme === 'O') viseme = 'Aa'
      else if (vibratoPhase < -0.5 && viseme === 'Aa') viseme = 'O'
    }

    const startTime = frame * frameDuration
    const endTime = (frame + 1) * frameDuration

    // Merge with previous event if same viseme
    if (events.length > 0 && events[events.length - 1].viseme === viseme) {
      events[events.length - 1].endFrame = frame + 1
      events[events.length - 1].endTime = endTime
    } else {
      events.push({
        viseme,
        startFrame: frame,
        endFrame: frame + 1,
        startTime,
        endTime,
      })
    }
  }

  return events
}

/**
 * Apply beat emphasis to existing viseme events.
 * Widens mouth openness on strong beat frames.
 */
export function applyBeatEmphasis(
  visemes: VisemeEvent[],
  beats: number[],
  fps: number,
  emphasis: number = 1,
): VisemeEvent[] {
  if (emphasis <= 0) return visemes

  const beatFrames = new Set(beats.map((t) => Math.round(t * fps)))
  const result: VisemeEvent[] = []

  for (const event of visemes) {
    // Check if any beat falls within this event
    let hasBeat = false
    for (let f = event.startFrame; f < event.endFrame; f++) {
      if (beatFrames.has(f)) {
        hasBeat = true
        break
      }
    }

    if (hasBeat && event.viseme !== 'Aa') {
      // Insert a brief Aa burst at the beat position
      const beatDurationFrames = Math.max(1, Math.round(fps * 0.05 * emphasis)) // ~50ms

      if (event.endFrame - event.startFrame > beatDurationFrames + 1) {
        // Split: Aa burst + remainder
        const burstEnd = event.startFrame + beatDurationFrames
        const frameDur = 1 / fps

        result.push({
          viseme: 'Aa',
          startFrame: event.startFrame,
          endFrame: burstEnd,
          startTime: event.startFrame * frameDur,
          endTime: burstEnd * frameDur,
        })
        result.push({
          ...event,
          startFrame: burstEnd,
          startTime: burstEnd * frameDur,
        })
      } else {
        result.push({ ...event, viseme: 'Aa' })
      }
    } else {
      result.push({ ...event })
    }
  }

  return result
}

/**
 * Enhance viseme timeline with lyrics data for more accurate consonant mapping.
 */
export function enhanceVisemesWithLyrics(
  visemes: VisemeEvent[],
  lyrics: LyricLine[],
  _fps: number,
): VisemeEvent[] {
  // If no lyrics, return as-is
  if (lyrics.length === 0) return visemes

  // For now, overlay phoneme-based consonant visemes where word boundaries are known
  // This is a simplified version; full implementation would use PHONEME_TO_VISEME mapping
  const enhanced = [...visemes]

  for (const line of lyrics) {
    if (!line.words) continue

    for (const word of line.words) {
      const firstChar = word.text[0]?.toLowerCase()
      let consonantViseme: Viseme | null = null

      // Map first character to consonant viseme
      if ('mbp'.includes(firstChar)) consonantViseme = 'M'
      else if ('fv'.includes(firstChar)) consonantViseme = 'F'
      else if ('lt'.includes(firstChar)) consonantViseme = 'L'
      else if ('dtn'.includes(firstChar)) consonantViseme = 'D'
      else if ('sz'.includes(firstChar)) consonantViseme = 'S'
      else if ('w'.includes(firstChar)) consonantViseme = 'W'

      if (consonantViseme) {
        // Find the viseme event at word start time and insert a brief consonant
        const startFrame = Math.round(word.startTime * 30) // approximate
        for (let i = 0; i < enhanced.length; i++) {
          if (enhanced[i].startFrame <= startFrame && enhanced[i].endFrame > startFrame) {
            // Insert a brief consonant viseme
            if (enhanced[i].endFrame - enhanced[i].startFrame > 2) {
              const original = enhanced[i]
              const consonantEnd = Math.min(startFrame + 2, original.endFrame)
              enhanced.splice(i, 1,
                { ...original, endFrame: startFrame, endTime: startFrame / 30 },
                { viseme: consonantViseme, startFrame, endFrame: consonantEnd, startTime: startFrame / 30, endTime: consonantEnd / 30 },
                { ...original, startFrame: consonantEnd, startTime: consonantEnd / 30 },
              )
            }
            break
          }
        }
      }
    }
  }

  // Filter out zero-duration events
  return enhanced.filter((e) => e.endFrame > e.startFrame)
}
