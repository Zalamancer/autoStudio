/**
 * Flexible Viseme Sprite Mapping Service
 *
 * Users' viseme sprites can have ANY naming convention. This service builds
 * a pre-computed VisemeSpriteMap that maps each (curvature, viseme) pair to
 * a sprite data URL using a 3-tier matching strategy:
 *
 *  Tier 1 — Canonical match:  "upward_AI" → exact CurvedVisemeKey
 *  Tier 2 — Heuristic/alias:  "happy_open" → upward_AI via keyword tables
 *  Tier 3 — Gemini AI:         Send remaining labels to Gemini for classification
 *
 * The result is stored per-character and used for O(1) lookups during playback.
 */

import type { Viseme } from '@/types/voice'
import type { MouthCurvature, CurvedVisemeKey, CurvedVisemeSprites } from '@/types/nanoBanana'
import { VISEMES, CURVATURES, getAllVisemeKeys, createEmptySpriteSet } from '@/types/nanoBanana'
import type { VisemeMapping } from '@/stores/useCharacterConfigStore'
import { callGeminiProxy } from '@/services/aiProxy'

// ── Types ──────────────────────────────────────────────────────────────

/** Pre-computed lookup: CurvedVisemeKey → sprite data URL */
export type VisemeSpriteMap = Record<CurvedVisemeKey, string | null>

/** Input entry: a sprite with an arbitrary key/label and its data URL */
export interface SpriteEntry {
  key: string   // label or existing key (e.g. "Upward_A/I", "happy_open", "mouth_3")
  src: string   // data URL
}

export interface BuildOptions {
  /** Whether to call Gemini for unresolved sprites (default: true) */
  useGemini?: boolean
}

// ── Alias Tables ───────────────────────────────────────────────────────

/** Maps keywords found in sprite labels to mouth curvatures */
const CURVATURE_KEYWORDS: Record<string, MouthCurvature> = {
  // Upward (happy)
  upward: 'upward',
  happy: 'upward',
  joy: 'upward',
  smile: 'upward',
  excited: 'upward',
  laugh: 'upward',
  laughter: 'upward',
  amusement: 'upward',
  satisfaction: 'upward',
  cheerful: 'upward',
  delighted: 'upward',
  grin: 'upward',

  // Downward (sad)
  downward: 'downward',
  sad: 'downward',
  cry: 'downward',
  grief: 'downward',
  fear: 'downward',
  down: 'downward',
  frown: 'downward',
  unhappy: 'downward',
  worried: 'downward',
  melancholy: 'downward',
  disgust: 'downward',
  terror: 'downward',

  // Neutral
  neutral: 'neutral',
  angry: 'neutral',
  anger: 'neutral',
  normal: 'neutral',
  default: 'neutral',
  surprise: 'neutral',
  alert: 'neutral',
  stern: 'neutral',
  calm: 'neutral',
}

/** Maps keywords found in sprite labels to viseme types */
const VISEME_KEYWORDS: Record<string, Viseme> = {
  // Rest
  rest: 'Rest',
  closed: 'Rest',
  idle: 'Rest',
  silent: 'Rest',
  quiet: 'Rest',
  relaxed: 'Rest',

  // Aa (wide open)
  aa: 'Aa',
  ah: 'Aa',
  open: 'Aa',
  wide: 'Aa',
  ay: 'Aa',
  ae: 'Aa',

  // Ee (wide smile)
  ee: 'Ee',
  eh: 'Ee',
  ey: 'Ee',
  teeth: 'Ee',
  smile: 'Ee',

  // Oh (rounded open)
  oh: 'Oh',
  round: 'Oh',
  rounded: 'Oh',
  ao: 'Oh',
  ow: 'Oh',

  // Oo (pursed/tight round — merged U + W)
  oo: 'Oo',
  pursed: 'Oo',
  uw: 'Oo',
  uh: 'Oo',
  kiss: 'Oo',
  pucker: 'Oo',

  // FV (teeth on lip)
  fv: 'FV',
  'f/v': 'FV',
  'f_v': 'FV',
  teeth_lip: 'FV',
  bite: 'FV',

  // MBP (lips pressed)
  mbp: 'MBP',
  'm/b/p': 'MBP',
  'm_b_p': 'MBP',
  pressed: 'MBP',
  closed_lips: 'MBP',

  // DTL (tongue tip — merged D + L)
  dtl: 'DTL',
  'd/t/l': 'DTL',
  'd_t_l': 'DTL',
  dh: 'DTL',
  th: 'DTL',
  tongue: 'DTL',

  // ChR (narrow/pursed — merged S + R)
  chr: 'ChR',
  'ch/r': 'ChR',
  'ch_r': 'ChR',
  sh: 'ChR',
  ch: 'ChR',
  ss: 'ChR',
  hiss: 'ChR',
  er: 'ChR',

  // Legacy 12-viseme names → new 9
  ai: 'Aa',
  'a/i': 'Aa',
  'a_i': 'Aa',
  lth: 'DTL',
  'l/th': 'DTL',
  'l_th': 'DTL',
}

// ── Tier 1: Canonical Match ────────────────────────────────────────────

const ALL_KEYS = new Set(getAllVisemeKeys())

/**
 * Try to match a sprite label to a canonical CurvedVisemeKey.
 * Handles case-insensitive matching, slash/space variants.
 */
function tryCanonicalMatch(label: string): CurvedVisemeKey | null {
  // Direct match (case-insensitive)
  const lower = label.toLowerCase().trim()

  // Try all valid keys
  for (const key of ALL_KEYS) {
    if (lower === key.toLowerCase()) return key
  }

  // Try normalizing separators: "Upward A/I" → "upward_AI", "Upward-A/I" → "upward_AI"
  const normalized = lower
    .replace(/[\s-]+/g, '_')             // spaces/hyphens → underscore
    .replace(/\//g, '/')                  // keep slashes as-is initially

  for (const curvature of CURVATURES) {
    for (const viseme of VISEMES) {
      const canonical = `${curvature}_${viseme}` as CurvedVisemeKey
      // Match against: "upward_ai", "upward_a/i", "upward_m/b/p" etc.
      const canonicalLower = canonical.toLowerCase()
      if (normalized === canonicalLower) return canonical

      // Also match without slashes in the viseme: "upward_ai" vs "upward_a/i"
      const visemeLower = viseme.toLowerCase()
      const visemeNoSlash = visemeLower.replace(/\//g, '')
      const normalizedNoSlash = normalized.replace(/\//g, '')
      if (normalizedNoSlash === `${curvature}_${visemeNoSlash}`) return canonical
    }
  }

  return null
}

/**
 * Tier 1: Match entries to canonical keys.
 * Returns the list of entries that could NOT be matched.
 */
function canonicalMatch(
  entries: SpriteEntry[],
  map: VisemeSpriteMap
): SpriteEntry[] {
  const unmatched: SpriteEntry[] = []

  for (const entry of entries) {
    const key = tryCanonicalMatch(entry.key)
    if (key && !map[key]) {
      map[key] = entry.src
    } else if (!key) {
      unmatched.push(entry)
    }
  }

  return unmatched
}

// ── Tier 2: Heuristic/Alias Match ──────────────────────────────────────

/**
 * Tier 2: Match entries using keyword alias tables.
 * Looks for curvature and viseme keywords in the label.
 */
function heuristicMatch(
  entries: SpriteEntry[],
  map: VisemeSpriteMap
): SpriteEntry[] {
  const unmatched: SpriteEntry[] = []

  for (const entry of entries) {
    const label = entry.key.toLowerCase().replace(/[_\-/\\]/g, ' ').trim()
    const words = label.split(/\s+/)

    let matchedCurvature: MouthCurvature | null = null
    let matchedViseme: Viseme | null = null

    // Check each word and multi-word combos against keyword tables
    // First try multi-word combos for compound keys like "a/i", "m/b/p"
    const labelNormalized = entry.key.toLowerCase().replace(/[\s_-]+/g, '_')

    for (const [keyword, viseme] of Object.entries(VISEME_KEYWORDS)) {
      const kwNorm = keyword.replace(/[\s_-]+/g, '_')
      if (labelNormalized.includes(kwNorm)) {
        matchedViseme = viseme
        break
      }
    }

    for (const [keyword, curvature] of Object.entries(CURVATURE_KEYWORDS)) {
      if (words.includes(keyword) || labelNormalized.includes(keyword)) {
        matchedCurvature = curvature
        break
      }
    }

    // Also check single-letter viseme matches as a last resort
    if (!matchedViseme) {
      for (const word of words) {
        if (VISEME_KEYWORDS[word]) {
          matchedViseme = VISEME_KEYWORDS[word]
          break
        }
      }
    }

    // If we matched a viseme, determine curvature (default to neutral)
    if (matchedViseme) {
      const curvature = matchedCurvature || 'neutral'
      const key = `${curvature}_${matchedViseme}` as CurvedVisemeKey

      if (!map[key]) {
        map[key] = entry.src

        // If curvature was default (neutral), also try filling other curvatures
        // if they're empty — user likely has a single set of visemes
        if (!matchedCurvature) {
          for (const c of CURVATURES) {
            const fillKey = `${c}_${matchedViseme}` as CurvedVisemeKey
            if (!map[fillKey]) {
              map[fillKey] = entry.src
            }
          }
        }
      }
    } else if (matchedCurvature) {
      // Matched curvature but not viseme — can't place it
      unmatched.push(entry)
    } else {
      unmatched.push(entry)
    }
  }

  return unmatched
}

// ── Tier 3: Gemini AI Classification ──────────────────────────────────

const GEMINI_API_URL = 'gemini-3.1-flash-lite-preview' // model name for callGeminiProxy

/**
 * Call Gemini to classify unresolved sprite labels into CurvedVisemeKeys.
 * Falls back gracefully if API call fails.
 */
async function geminiClassify(
  entries: SpriteEntry[]
): Promise<Record<string, CurvedVisemeKey>> {
  if (entries.length === 0) return {}

  const allKeys = getAllVisemeKeys()
  const labelList = entries.map((e) => e.key)

  const prompt = `You are classifying character mouth/viseme sprite labels for lip sync animation.

Given these sprite labels: ${JSON.stringify(labelList)}

Classify EACH label into exactly ONE of these categories:
${allKeys.join(', ')}

The categories follow the format: {curvature}_{viseme}
- Curvatures: upward (happy/smiling), neutral (normal/default), downward (sad/frowning)
- Visemes: Rest (closed), Aa (wide open), D (tongue behind teeth), Ee (wide smile), F (teeth on lip), L (tongue tip), M (lips pressed), O (rounded), R (rounded retracted), S (teeth close), U (pursed), W (rounded tight)

If you cannot determine the classification, use "neutral_Rest" as default.

Respond ONLY with valid JSON mapping each label to its category:
{"label1": "curvature_VISEME", "label2": "curvature_VISEME"}
No other text, no markdown code blocks.`

  try {
    const response = await callGeminiProxy(GEMINI_API_URL, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      })

    if (!response.ok) {
      console.warn('[visemeMapper] Gemini API error:', response.statusText)
      return {}
    }

    const data = await response.json()
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON response (strip markdown if present)
    const cleaned = textContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleaned)

    // Validate that values are actual CurvedVisemeKeys
    const result: Record<string, CurvedVisemeKey> = {}
    const keySet = new Set(allKeys as string[])

    for (const [label, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && keySet.has(value)) {
        result[label] = value as CurvedVisemeKey
      }
    }

    console.log('[visemeMapper] Gemini classified', Object.keys(result).length, 'sprites')
    return result
  } catch (err) {
    console.warn('[visemeMapper] Gemini classification failed:', err)
    return {}
  }
}

// ── Main Build Function ────────────────────────────────────────────────

/**
 * Build a VisemeSpriteMap from arbitrary sprite entries (label + data URL).
 * Uses 3-tier matching: canonical → heuristic → Gemini AI.
 */
export async function buildVisemeSpriteMap(
  spriteEntries: SpriteEntry[],
  options: BuildOptions = {}
): Promise<VisemeSpriteMap> {
  const { useGemini = true } = options
  const map = createEmptySpriteSet() as VisemeSpriteMap

  if (spriteEntries.length === 0) return map

  // Tier 1: Canonical match
  let unmatched = canonicalMatch(spriteEntries, map)

  if (unmatched.length === 0) {
    console.log('[visemeMapper] All sprites matched via canonical keys')
    return map
  }

  // Tier 2: Heuristic/alias match
  unmatched = heuristicMatch(unmatched, map)

  if (unmatched.length === 0) {
    console.log('[visemeMapper] All sprites matched via canonical + heuristic')
    return map
  }

  // Tier 3: Gemini AI classification
  if (useGemini && unmatched.length > 0) {
    console.log('[visemeMapper] Sending', unmatched.length, 'unresolved sprites to Gemini')
    const geminiResult = await geminiClassify(unmatched)

    for (const entry of unmatched) {
      const key = geminiResult[entry.key]
      if (key && !map[key]) {
        map[key] = entry.src
      }
    }
  }

  // Fill any remaining gaps: if a viseme has one curvature but not others,
  // copy to fill the gaps (many users only have one set of mouth shapes)
  for (const viseme of VISEMES) {
    const sources = CURVATURES.map((c) => ({
      curvature: c,
      key: `${c}_${viseme}` as CurvedVisemeKey,
    }))

    // Find any curvature that has a sprite for this viseme
    const filled = sources.find((s) => map[s.key] !== null)
    if (filled) {
      for (const s of sources) {
        if (!map[s.key]) {
          map[s.key] = map[filled.key]
        }
      }
    }
  }

  const filledCount = Object.values(map).filter((v) => v !== null).length
  console.log(`[visemeMapper] Built map: ${filledCount}/36 sprites resolved`)

  return map
}

/**
 * Build a VisemeSpriteMap directly from existing CurvedVisemeSprites.
 * This is the fast path for characters that already have the canonical format.
 * No Gemini call needed — just copies the data URLs.
 */
export function buildVisemeSpriteMapFromCurved(
  curvedVisemes: CurvedVisemeSprites
): VisemeSpriteMap {
  const map = createEmptySpriteSet() as VisemeSpriteMap

  for (const key of getAllVisemeKeys()) {
    if (curvedVisemes[key]) {
      map[key] = curvedVisemes[key]
    }
  }

  // Fill curvature gaps (same logic as buildVisemeSpriteMap)
  for (const viseme of VISEMES) {
    const sources = CURVATURES.map((c) => ({
      curvature: c,
      key: `${c}_${viseme}` as CurvedVisemeKey,
    }))
    const filled = sources.find((s) => map[s.key] !== null)
    if (filled) {
      for (const s of sources) {
        if (!map[s.key]) {
          map[s.key] = map[filled.key]
        }
      }
    }
  }

  return map
}

// ── Playback Lookup ────────────────────────────────────────────────────

/**
 * O(1) resolve a viseme sprite for playback.
 *
 * Resolution order:
 * 1. visemeSpriteMap[curvature_viseme]
 * 2. visemeSpriteMap[neutral_viseme]
 * 3. curvedVisemes[curvature_viseme] (existing direct lookup)
 * 4. curvedVisemes[neutral_viseme]
 * 5. fallbackSprites[fallbackMapping[viseme]] (body-part system)
 * 6. REST sprite or first available sprite
 */
export function resolveVisemeSprite(
  viseme: Viseme,
  curvature: MouthCurvature,
  visemeSpriteMap: VisemeSpriteMap | Record<string, string | null> | null | undefined,
  curvedVisemes: CurvedVisemeSprites | Record<string, string | null> | null | undefined,
  fallbackSprites?: string[],
  fallbackMapping?: VisemeMapping | Record<Viseme, number | null> | null
): string | null {
  const primaryKey = `${curvature}_${viseme}` as CurvedVisemeKey
  const neutralKey = `neutral_${viseme}` as CurvedVisemeKey
  const restKey = `${curvature}_Rest` as CurvedVisemeKey
  const neutralRestKey = 'neutral_Rest' as CurvedVisemeKey

  // 1. Pre-computed visemeSpriteMap (best path)
  // Cast to Record<string, ...> to handle both VisemeSpriteMap and Record<string, string | null>
  const sprMap = visemeSpriteMap as Record<string, string | null> | null | undefined
  if (sprMap) {
    if (sprMap[primaryKey]) return sprMap[primaryKey]!
    if (sprMap[neutralKey]) return sprMap[neutralKey]!
    if (sprMap[restKey]) return sprMap[restKey]!
    if (sprMap[neutralRestKey]) return sprMap[neutralRestKey]!
  }

  // 2. Direct curvedVisemes lookup (existing legacy path)
  if (curvedVisemes) {
    if (curvedVisemes[primaryKey]) return curvedVisemes[primaryKey]!
    if (curvedVisemes[neutralKey]) return curvedVisemes[neutralKey]!
    if (curvedVisemes[restKey]) return curvedVisemes[restKey]!
    if (curvedVisemes[neutralRestKey]) return curvedVisemes[neutralRestKey]!
  }

  // 3. Body-part fallback system
  if (fallbackSprites && fallbackSprites.length > 0) {
    // Try the explicit mapping first
    if (fallbackMapping) {
      const idx = fallbackMapping[viseme]
      if (idx !== null && idx !== undefined && fallbackSprites[idx]) {
        return fallbackSprites[idx]
      }
      // REST fallback
      const restIdx = fallbackMapping.Rest
      if (restIdx !== null && restIdx !== undefined && fallbackSprites[restIdx]) {
        return fallbackSprites[restIdx]
      }
    }

    // Smart fallback: when mapping is all-null, distribute sprites across visemes
    // using a deterministic hash so each viseme name maps to a different sprite.
    // This is much better than always returning [0] for every viseme.
    if (fallbackSprites.length > 1) {
      const VISEME_ORDER: string[] = ['Rest', 'Aa', 'Ee', 'Oh', 'Oo', 'FV', 'MBP', 'DTL', 'ChR']
      const visemeIdx = VISEME_ORDER.indexOf(viseme)
      if (visemeIdx >= 0) {
        const spriteIdx = visemeIdx % fallbackSprites.length
        if (fallbackSprites[spriteIdx]) return fallbackSprites[spriteIdx]
      }
    }

    // First sprite fallback
    return fallbackSprites[0] || null
  }

  return null
}
