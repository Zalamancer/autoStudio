/**
 * Grapheme-to-Phoneme (G2P) Service
 *
 * Rule-based conversion of English words to ARPAbet phonemes.
 * Used to generate approximate phoneme sequences for arbitrary audio lip sync
 * when only word-level transcription is available (no phoneme alignment).
 *
 * Accuracy target: ~80% — good enough for viseme mapping.
 */

/** Multi-character patterns, checked first (longest match wins) */
const MULTI_CHAR_PATTERNS: [string, string[]][] = [
  // 4+ character patterns
  ['tion', ['SH', 'AH', 'N']],
  ['sion', ['ZH', 'AH', 'N']],
  ['ture', ['CH', 'ER']],
  ['ough', ['AO']],       // through → simplified
  ['ight', ['AY', 'T']],
  ['ould', ['UH', 'D']],

  // 3 character patterns
  ['tch', ['CH']],
  ['dge', ['JH']],
  ['ing', ['IH', 'NG']],
  ['ous', ['AH', 'S']],
  ['ble', ['B', 'AH', 'L']],
  ['ple', ['P', 'AH', 'L']],
  ['tle', ['T', 'AH', 'L']],
  ['dle', ['D', 'AH', 'L']],
  ['gle', ['G', 'AH', 'L']],
  ['kle', ['K', 'AH', 'L']],
  ['igh', ['AY']],
  ['ful', ['F', 'AH', 'L']],
  ['age', ['IH', 'JH']],
  ['ate', ['EY', 'T']],
  ['ine', ['AY', 'N']],
  ['ite', ['AY', 'T']],
  ['ire', ['AY', 'ER']],
  ['ore', ['AO', 'R']],
  ['ure', ['Y', 'UH', 'R']],
  ['ade', ['EY', 'D']],
  ['ake', ['EY', 'K']],
  ['ame', ['EY', 'M']],
  ['ane', ['EY', 'N']],
  ['ape', ['EY', 'P']],
  ['ase', ['EY', 'S']],
  ['ave', ['EY', 'V']],
  ['aze', ['EY', 'Z']],
  ['ice', ['AY', 'S']],
  ['ide', ['AY', 'D']],
  ['ife', ['AY', 'F']],
  ['ike', ['AY', 'K']],
  ['ile', ['AY', 'L']],
  ['ime', ['AY', 'M']],
  ['ise', ['AY', 'Z']],
  ['ize', ['AY', 'Z']],
  ['ive', ['IH', 'V']],
  ['obe', ['OW', 'B']],
  ['ode', ['OW', 'D']],
  ['oke', ['OW', 'K']],
  ['ole', ['OW', 'L']],
  ['ome', ['OW', 'M']],
  ['one', ['OW', 'N']],
  ['ope', ['OW', 'P']],
  ['ose', ['OW', 'Z']],
  ['ote', ['OW', 'T']],
  ['ove', ['AH', 'V']],
  ['ube', ['UW', 'B']],
  ['ude', ['UW', 'D']],
  ['uge', ['UW', 'JH']],
  ['uke', ['UW', 'K']],
  ['ule', ['UW', 'L']],
  ['une', ['UW', 'N']],
  ['use', ['UW', 'Z']],
  ['ute', ['UW', 'T']],
  ['ear', ['IH', 'R']],
  ['air', ['EH', 'R']],
  ['eer', ['IH', 'R']],
  ['oor', ['UH', 'R']],
  ['oar', ['AO', 'R']],
  ['all', ['AO', 'L']],
  ['alk', ['AO', 'K']],
  ['ong', ['AO', 'NG']],
  ['ank', ['AE', 'NG', 'K']],
  ['ink', ['IH', 'NG', 'K']],
  ['unk', ['AH', 'NG', 'K']],

  // 2 character patterns (digraphs)
  ['th', ['TH']],
  ['sh', ['SH']],
  ['ch', ['CH']],
  ['ph', ['F']],
  ['wh', ['W']],
  ['ck', ['K']],
  ['gh', []],          // silent in most positions (e.g. "night", "though")
  ['gn', ['N']],
  ['kn', ['N']],
  ['wr', ['R']],
  ['ng', ['NG']],
  ['qu', ['K', 'W']],

  // Vowel digraphs
  ['ee', ['IY']],
  ['ea', ['IY']],
  ['oo', ['UW']],
  ['ou', ['AW']],
  ['ow', ['OW']],
  ['ai', ['EY']],
  ['ay', ['EY']],
  ['oi', ['OY']],
  ['oy', ['OY']],
  ['au', ['AO']],
  ['aw', ['AO']],
  ['ie', ['IY']],
  ['ei', ['EY']],
  ['ey', ['IY']],
  ['ew', ['UW']],
]

/** Single character to phoneme mapping (fallback) */
const SINGLE_CHAR_MAP: Record<string, string[]> = {
  // Vowels
  a: ['AE'],
  e: ['EH'],
  i: ['IH'],
  o: ['AA'],
  u: ['AH'],
  y: ['IY'],

  // Consonants
  b: ['B'],
  c: ['K'],
  d: ['D'],
  f: ['F'],
  g: ['G'],
  h: ['HH'],
  j: ['JH'],
  k: ['K'],
  l: ['L'],
  m: ['M'],
  n: ['N'],
  p: ['P'],
  q: ['K'],
  r: ['R'],
  s: ['S'],
  t: ['T'],
  v: ['V'],
  w: ['W'],
  x: ['K', 'S'],
  z: ['Z'],
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])

/**
 * Check if a word ends with a silent-e pattern (consonant + e at end).
 * In English, trailing 'e' after a consonant is typically silent
 * and modifies the preceding vowel to be "long".
 */
function hasSilentE(word: string): boolean {
  if (word.length < 3) return false
  if (word[word.length - 1] !== 'e') return false
  // Must have a consonant before the 'e'
  const beforeE = word[word.length - 2]
  return !VOWELS.has(beforeE)
}

/**
 * Convert an English word to an approximate ARPAbet phoneme sequence.
 *
 * Uses a rule-based approach with multi-character pattern matching.
 * Does not aim for perfection — 80% accuracy is sufficient for
 * viseme mapping in animation lip sync.
 */
export function wordToPhonemes(word: string): string[] {
  if (!word || word.length === 0) return ['SIL']

  const lower = word.toLowerCase().replace(/[^a-z']/g, '')
  if (lower.length === 0) return ['SIL']

  const phonemes: string[] = []
  const silentE = hasSilentE(lower)
  let i = 0

  while (i < lower.length) {
    // Skip trailing silent e
    if (silentE && i === lower.length - 1 && lower[i] === 'e') {
      break
    }

    // Skip apostrophes
    if (lower[i] === "'") {
      i++
      continue
    }

    // Try multi-character patterns (longest first — patterns are already sorted)
    let matched = false
    for (const [pattern, phones] of MULTI_CHAR_PATTERNS) {
      if (i + pattern.length <= lower.length && lower.substring(i, i + pattern.length) === pattern) {
        // Special case: 'c' before 'e', 'i', 'y' makes 'S' sound
        // But we handle 'ch' in digraphs, so skip if matched there
        phonemes.push(...phones)
        i += pattern.length
        matched = true
        break
      }
    }

    if (matched) continue

    // Handle 'c' before soft vowels
    const char = lower[i]
    if (char === 'c') {
      const next = lower[i + 1]
      if (next === 'e' || next === 'i' || next === 'y') {
        phonemes.push('S')
      } else {
        phonemes.push('K')
      }
      i++
      continue
    }

    // Handle 'g' before soft vowels (approximate)
    if (char === 'g') {
      const next = lower[i + 1]
      if (next === 'e' || next === 'i' || next === 'y') {
        phonemes.push('JH')
      } else {
        phonemes.push('G')
      }
      i++
      continue
    }

    // Handle doubled consonants (skip the second one)
    if (!VOWELS.has(char) && i + 1 < lower.length && lower[i + 1] === char) {
      phonemes.push(...(SINGLE_CHAR_MAP[char] || []))
      i += 2
      continue
    }

    // Default single character mapping
    const singlePhonemes = SINGLE_CHAR_MAP[char]
    if (singlePhonemes) {
      phonemes.push(...singlePhonemes)
    }
    i++
  }

  return phonemes.length > 0 ? phonemes : ['SIL']
}

/**
 * Convert a full sentence to phonemes (splits on whitespace, processes each word).
 */
export function sentenceToPhonemes(sentence: string): string[] {
  const words = sentence.trim().split(/\s+/).filter((w) => w.length > 0)
  const result: string[] = []

  for (let i = 0; i < words.length; i++) {
    if (i > 0) result.push('SP') // space/pause between words
    result.push(...wordToPhonemes(words[i]))
  }

  return result
}
