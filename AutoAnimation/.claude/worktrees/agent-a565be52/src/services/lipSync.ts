import type { ElevenLabsAlignment, Viseme, VisemeEvent } from '@/types/voice'

/**
 * Maps ElevenLabs phonemes (ARPAbet) to our 12 viseme shapes
 */
const PHONEME_TO_VISEME: Record<string, Viseme> = {
  // Silence / Rest
  SIL: 'Rest',
  SP: 'Rest',
  '': 'Rest',

  // Aa - Wide open mouth
  AA: 'Aa', // odd
  AE: 'Aa', // at
  AH: 'Aa', // hut
  AY: 'Aa', // hide
  AW: 'Aa', // cow

  // D - Tongue behind teeth
  D: 'D',  // did
  T: 'D',  // to
  N: 'D',  // no
  DH: 'D', // the

  // Ee - Wide smile
  EH: 'Ee', // Ed
  EY: 'Ee', // ate
  IY: 'Ee', // eat
  IH: 'Ee', // it

  // F - Teeth on lower lip
  F: 'F',  // fee
  V: 'F',  // vie

  // L - Tongue tip
  L: 'L',  // lee
  TH: 'L', // thin

  // M - Lips pressed together
  M: 'M',  // me
  B: 'M',  // be
  P: 'M',  // pea

  // O - Rounded medium
  AO: 'O', // ought
  OW: 'O', // oat
  OY: 'O', // toy

  // R - Rounded retracted
  R: 'R',  // read
  ER: 'R', // hurt

  // S - Teeth close
  S: 'S',  // sea
  Z: 'S',  // zoo
  SH: 'S', // she
  ZH: 'S', // vision
  CH: 'S', // cheese
  JH: 'S', // gee

  // U - Pursed lips
  UH: 'U', // hood
  UW: 'U', // two

  // W - Rounded tight
  W: 'W',  // we
  Y: 'W',  // yield

  // Other consonants - default to Rest (minimal mouth movement)
  K: 'Rest',
  G: 'Rest',
  NG: 'Rest',
  HH: 'Rest',
}

/**
 * Map a single ARPAbet phoneme string to a Viseme.
 * Standalone export for real-time lip sync (e.g. live avatar).
 */
export function mapPhonemeToViseme(phoneme: string): Viseme {
  return PHONEME_TO_VISEME[phoneme] || 'Rest'
}

/**
 * Maps characters to approximate visemes when phoneme data isn't available
 * This is a fallback for character-level timing from ElevenLabs
 */
const CHAR_TO_VISEME: Record<string, Viseme> = {
  // Vowels
  'a': 'Aa',
  'i': 'Ee',
  'e': 'Ee',
  'o': 'O',
  'u': 'U',

  // Consonants that affect mouth shape significantly
  'm': 'M',
  'b': 'M',
  'p': 'M',
  'f': 'F',
  'v': 'F',
  'l': 'L',
  't': 'D',
  'd': 'D',
  'n': 'D',
  'r': 'R',
  's': 'S',
  'z': 'S',
  'w': 'W',

  // Space = closed mouth
  ' ': 'Rest',
  '.': 'Rest',
  ',': 'Rest',
  '!': 'Rest',
  '?': 'Rest',
}

export class LipSyncProcessor {
  private fps: number

  constructor(fps: number = 30) {
    this.fps = fps
  }

  /**
   * Convert ElevenLabs alignment data to viseme timeline
   * Handles both phoneme data (preferred) and character data (fallback)
   */
  processAlignment(alignment: ElevenLabsAlignment): VisemeEvent[] {
    // Check if phoneme data is available
    const phonemes = alignment?.phonemes || []
    const phonemeStartTimes = alignment?.phoneme_start_times_seconds || []
    const phonemeEndTimes = alignment?.phoneme_end_times_seconds || []

    if (phonemes.length > 0 && phonemeStartTimes.length > 0) {
      // Use phoneme-based visemes (preferred)
      return this.processPhonemeAlignment(phonemes, phonemeStartTimes, phonemeEndTimes)
    }

    // Fallback to character-based viseme generation
    const characters = alignment?.characters || []
    const charStartTimes = alignment?.character_start_times_seconds || []
    const charEndTimes = alignment?.character_end_times_seconds || []

    if (characters.length > 0 && charStartTimes.length > 0) {
      return this.processCharacterAlignment(characters, charStartTimes, charEndTimes)
    }

    // No alignment data available
    return []
  }

  /**
   * Process phoneme-based alignment (preferred method)
   */
  private processPhonemeAlignment(
    phonemes: string[],
    startTimes: number[],
    endTimes: number[]
  ): VisemeEvent[] {
    const events: VisemeEvent[] = []

    for (let i = 0; i < phonemes.length; i++) {
      const phoneme = (phonemes[i] || '').toUpperCase()
      const startTime = startTimes[i] || 0
      const endTime = endTimes[i] || startTime + 0.05

      const viseme = PHONEME_TO_VISEME[phoneme] || 'Rest'

      events.push({
        viseme,
        startTime,
        endTime,
        startFrame: Math.floor(startTime * this.fps),
        endFrame: Math.ceil(endTime * this.fps),
      })
    }

    return this.addTransitions(this.mergeConsecutiveVisemes(events))
  }

  /**
   * Process character-based alignment (fallback when phonemes aren't available)
   */
  private processCharacterAlignment(
    characters: string[],
    startTimes: number[],
    endTimes: number[]
  ): VisemeEvent[] {
    const events: VisemeEvent[] = []

    for (let i = 0; i < characters.length; i++) {
      const char = (characters[i] || '').toLowerCase()
      const startTime = startTimes[i] || 0
      const endTime = endTimes[i] || startTime + 0.05

      // Skip very short characters (likely noise)
      if (endTime - startTime < 0.01) continue

      const viseme = CHAR_TO_VISEME[char] || 'Rest'

      events.push({
        viseme,
        startTime,
        endTime,
        startFrame: Math.floor(startTime * this.fps),
        endFrame: Math.ceil(endTime * this.fps),
      })
    }

    return this.addTransitions(this.mergeConsecutiveVisemes(events))
  }

  /**
   * Merge consecutive events with the same viseme
   */
  private mergeConsecutiveVisemes(events: VisemeEvent[]): VisemeEvent[] {
    if (events.length === 0) return []

    const merged: VisemeEvent[] = []
    let current = { ...events[0] }

    for (let i = 1; i < events.length; i++) {
      const event = events[i]

      if (event.viseme === current.viseme) {
        // Extend current event
        current.endTime = event.endTime
        current.endFrame = event.endFrame
      } else {
        // Save current and start new
        merged.push(current)
        current = { ...event }
      }
    }

    // Don't forget the last one
    merged.push(current)

    return merged
  }

  /**
   * Get viseme at a specific frame
   */
  getVisemeAtFrame(timeline: VisemeEvent[], frame: number): Viseme {
    const event = timeline.find((e) => frame >= e.startFrame && frame < e.endFrame)
    return event?.viseme || 'Rest'
  }

  /**
   * Get viseme at a specific time (seconds)
   */
  getVisemeAtTime(timeline: VisemeEvent[], time: number): Viseme {
    const event = timeline.find((e) => time >= e.startTime && time < e.endTime)
    return event?.viseme || 'Rest'
  }

  /**
   * Add smooth transitions between visemes by inserting intermediate mouth shapes.
   * Transition frames are taken from the START of the next viseme (no extra time added).
   */
  addTransitions(events: VisemeEvent[], transitionFrames: number = 2): VisemeEvent[] {
    if (events.length < 2 || transitionFrames < 1) return events

    const result: VisemeEvent[] = []

    for (let i = 0; i < events.length; i++) {
      const current = events[i]
      const next = events[i + 1]

      // If this is the last event, or the next event has the same viseme, just push as-is
      if (!next || current.viseme === next.viseme) {
        result.push({ ...current })
        continue
      }

      // Check if the next event has enough frames for a transition
      const nextDurationFrames = next.endFrame - next.startFrame
      if (nextDurationFrames < transitionFrames + 1) {
        // Not enough room in the next event to carve out transition frames
        result.push({ ...current })
        continue
      }

      // Determine the intermediate viseme for this transition pair
      const intermediate = this.getTransitionViseme(current.viseme, next.viseme)

      if (!intermediate) {
        // Direct transition (no intermediate needed)
        result.push({ ...current })
        continue
      }

      // Push the current event unchanged
      result.push({ ...current })

      // Compute the transition region: steal frames from the start of 'next'
      const transitionStartFrame = next.startFrame
      const transitionEndFrame = next.startFrame + transitionFrames

      // Compute times proportionally from the next event
      const nextTotalFrames = next.endFrame - next.startFrame
      const fractionUsed = transitionFrames / nextTotalFrames
      const transitionStartTime = next.startTime
      const transitionEndTime = next.startTime + (next.endTime - next.startTime) * fractionUsed

      // Insert the intermediate viseme event
      result.push({
        viseme: intermediate,
        startFrame: transitionStartFrame,
        endFrame: transitionEndFrame,
        startTime: transitionStartTime,
        endTime: transitionEndTime,
      })

      // Modify the next event in-place so when we process it on the next iteration
      // it starts after the transition. We work on a copy since we spread later.
      events[i + 1] = {
        ...next,
        startFrame: transitionEndFrame,
        startTime: transitionEndTime,
      }
    }

    return result
  }

  /**
   * Determine the intermediate viseme when transitioning from one shape to another.
   * Returns null if the transition should be direct (no intermediate needed).
   */
  private getTransitionViseme(from: Viseme, to: Viseme): Viseme | null {
    // Same viseme - no transition
    if (from === to) return null

    const vowels: Viseme[] = ['Aa', 'Ee', 'O', 'U', 'R']

    // Rest -> any vowel: pass through M (mouth opening from closed)
    if (from === 'Rest' && vowels.includes(to)) {
      return 'M'
    }

    // Aa (wide open) -> Ee (wide smile): direct transition
    if (from === 'Aa' && to === 'Ee') return null

    // Aa -> O or U: pass through Rest (close before rounding)
    if (from === 'Aa' && (to === 'O' || to === 'U')) {
      return 'Rest'
    }

    // M (lips pressed) -> any vowel: direct (natural mouth opening)
    if (from === 'M' && vowels.includes(to)) {
      return null
    }

    // F (teeth on lip) -> any: pass through Rest
    if (from === 'F' && to !== 'Rest') {
      return 'Rest'
    }

    // L (tongue tip) -> any: pass through Rest
    if (from === 'L' && to !== 'Rest') {
      return 'Rest'
    }

    // All other transitions: direct
    return null
  }

  /**
   * Get all phonemes and their mappings (for debugging/display)
   */
  static getPhonemeMapping(): Record<string, Viseme> {
    return { ...PHONEME_TO_VISEME }
  }

  /**
   * Set FPS for frame calculations
   */
  setFps(fps: number): void {
    this.fps = fps
  }
}

// Default singleton instance
let processorInstance: LipSyncProcessor | null = null

export function getLipSyncProcessor(fps: number = 30): LipSyncProcessor {
  if (!processorInstance || processorInstance['fps'] !== fps) {
    processorInstance = new LipSyncProcessor(fps)
  }
  return processorInstance
}

// ── IPA Phoneme Mapping (for non-English languages) ─────────────────────────

/**
 * Maps IPA phonemes (returned by ElevenLabs for non-English languages)
 * to our viseme system. The 8-viseme system is universal; only the
 * phoneme-to-viseme routing changes.
 */
export const IPA_PHONEME_TO_VISEME: Record<string, Viseme> = {
  // Vowels
  'a': 'Aa', 'ɑ': 'Aa', 'æ': 'Aa', 'ɐ': 'Aa',
  'e': 'Ee', 'ɛ': 'Ee', 'i': 'Ee', 'ɪ': 'Ee', 'ʏ': 'Ee',
  'o': 'Oh', 'ɔ': 'Oh', 'ø': 'Oh', 'œ': 'Oh',
  'u': 'Oo', 'ʊ': 'Oo', 'ɯ': 'Oo', 'y': 'Oo',
  'ə': 'Aa', 'ɵ': 'Oh',
  // Diphthongs
  'aɪ': 'Aa', 'aʊ': 'Aa', 'ɔɪ': 'Oh', 'eɪ': 'Ee',
  'oʊ': 'Oh', 'əʊ': 'Oh',
  // Nasals
  'n': 'D', 'ɲ': 'D', 'ŋ': 'D', 'ɳ': 'D', 'm': 'Mm',
  // Plosives
  'p': 'Mm', 'b': 'Mm', 't': 'D', 'd': 'D',
  'k': 'Kk', 'g': 'Kk', 'ɡ': 'Kk', 'q': 'Kk',
  'ʔ': 'Rest',
  // Fricatives
  'f': 'Ff', 'v': 'Ff', 'θ': 'Th', 'ð': 'Th',
  's': 'Ss', 'z': 'Ss', 'ʃ': 'Sh', 'ʒ': 'Sh',
  'ç': 'Sh', 'x': 'Kk', 'ɣ': 'Kk', 'χ': 'Kk',
  'h': 'Rest', 'ɦ': 'Rest',
  'ʁ': 'Rr', 'ɾ': 'Rr', 'r': 'Rr', 'ʀ': 'Rr',
  // Affricates
  'tʃ': 'Sh', 'dʒ': 'Sh', 'ts': 'Ss', 'dz': 'Ss',
  // Approximants
  'l': 'Th', 'ɫ': 'Th', 'ʎ': 'Th',
  'w': 'Oo', 'ɥ': 'Oo', 'j': 'Ee',
  // Silence
  ' ': 'Rest', '': 'Rest',
}

/**
 * Map an IPA phoneme string to a viseme. Falls back to 'Rest' for unknown.
 */
export function mapIpaPhonemeToViseme(ipaPhoneme: string): Viseme {
  if (!ipaPhoneme) return 'Rest'
  // Try exact match first
  const exact = IPA_PHONEME_TO_VISEME[ipaPhoneme]
  if (exact) return exact
  // Try first character as fallback
  const first = IPA_PHONEME_TO_VISEME[ipaPhoneme[0]]
  return first || 'Rest'
}
