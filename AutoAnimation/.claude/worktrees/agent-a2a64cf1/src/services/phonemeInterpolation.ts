/**
 * Phoneme Interpolation Service
 *
 * Given word-level timestamps and a G2P function, distributes phoneme
 * durations proportionally within word boundaries. Vowels get longer
 * durations than consonants, and plosives get shorter durations.
 */

/** Phoneme class for duration weighting */
type PhonemeClass = 'vowel' | 'plosive' | 'fricative' | 'nasal' | 'liquid' | 'glide' | 'affricate' | 'silence'

/** Base duration weights (relative) for each phoneme class */
const CLASS_WEIGHTS: Record<PhonemeClass, number> = {
  vowel: 1.6,       // ~80ms — vowels are longest
  liquid: 1.2,      // ~60ms — L, R
  nasal: 1.0,       // ~50ms — M, N, NG
  glide: 0.9,       // ~45ms — W, Y
  fricative: 1.0,   // ~50ms — S, Z, F, V, TH, SH, ZH, HH
  affricate: 0.8,   // ~40ms — CH, JH
  plosive: 0.6,     // ~30ms — P, B, T, D, K, G
  silence: 0.5,     // ~25ms — SIL, SP
}

/** Classify an ARPAbet phoneme */
function classifyPhoneme(phoneme: string): PhonemeClass {
  const upper = phoneme.toUpperCase()

  // Silence
  if (upper === 'SIL' || upper === 'SP' || upper === '') return 'silence'

  // Vowels (monophthongs + diphthongs)
  if (['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY',
       'IH', 'IY', 'OW', 'OY', 'UH', 'UW'].includes(upper)) {
    return 'vowel'
  }

  // Plosives (stops)
  if (['P', 'B', 'T', 'D', 'K', 'G'].includes(upper)) return 'plosive'

  // Nasals
  if (['M', 'N', 'NG'].includes(upper)) return 'nasal'

  // Liquids
  if (['L', 'R'].includes(upper)) return 'liquid'

  // Glides (semivowels)
  if (['W', 'Y'].includes(upper)) return 'glide'

  // Affricates
  if (['CH', 'JH'].includes(upper)) return 'affricate'

  // Fricatives (default for remaining consonants)
  if (['F', 'V', 'TH', 'DH', 'S', 'Z', 'SH', 'ZH', 'HH'].includes(upper)) return 'fricative'

  // Unknown — treat as fricative
  return 'fricative'
}

export interface WordTiming {
  word: string
  start: number   // seconds
  end: number     // seconds
}

export interface InterpolatedPhonemes {
  phonemes: string[]
  starts: number[]   // seconds
  ends: number[]     // seconds
}

/**
 * Distribute phoneme durations proportionally within each word's time range.
 *
 * For each word:
 * 1. Run G2P to get phoneme sequence
 * 2. Assign relative weight to each phoneme based on class
 * 3. Distribute the word's total duration according to weights
 *
 * @param words - Array of words with start/end timestamps (seconds)
 * @param g2p - Function that converts a word string to ARPAbet phoneme array
 * @returns Flat arrays of phonemes with interpolated start/end times
 */
export function interpolatePhonemeTimings(
  words: WordTiming[],
  g2p: (word: string) => string[],
): InterpolatedPhonemes {
  const allPhonemes: string[] = []
  const allStarts: number[] = []
  const allEnds: number[] = []

  for (let i = 0; i < words.length; i++) {
    const { word, start, end } = words[i]
    const duration = end - start

    // Skip words with zero or negative duration
    if (duration <= 0) continue

    const phonemes = g2p(word)
    if (phonemes.length === 0) continue

    // Calculate weights for proportional distribution
    const weights = phonemes.map((p) => CLASS_WEIGHTS[classifyPhoneme(p)])
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)

    if (totalWeight <= 0) continue

    // Distribute duration proportionally
    let currentTime = start
    for (let j = 0; j < phonemes.length; j++) {
      const phonemeDuration = (weights[j] / totalWeight) * duration
      const phonemeStart = currentTime
      const phonemeEnd = currentTime + phonemeDuration

      allPhonemes.push(phonemes[j])
      allStarts.push(phonemeStart)
      allEnds.push(phonemeEnd)

      currentTime = phonemeEnd
    }

    // Insert a short silence between words (except after the last word)
    if (i < words.length - 1) {
      const nextStart = words[i + 1].start
      const gap = nextStart - end

      if (gap > 0.01) {
        // There's a gap between words — insert a silence
        allPhonemes.push('SP')
        allStarts.push(end)
        allEnds.push(nextStart)
      }
    }
  }

  return {
    phonemes: allPhonemes,
    starts: allStarts,
    ends: allEnds,
  }
}
