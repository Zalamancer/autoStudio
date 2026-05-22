/**
 * Template Feature Extractor
 *
 * Extracts numeric features from kinetic typography template TSX code
 * for use in the reward model. Features capture animation quality signals
 * identified in docs/fourth-round/analysis.md.
 */

// ── Types ────────────────────────────────────────────────────────────

export interface TemplateFeatures {
  // Animation technique flags (0 or 1)
  has3DRotation: number
  hasClipPath: number
  hasPerCharAnimation: number
  hasTrigOscillation: number
  hasRandomness: number
  hasPerspective: number
  hasCustomEasing: number
  hasBlurFilter: number
  hasTextShadow: number
  hasBlendModes: number
  hasSVG: number
  hasGradients: number
  hasScaleTransform: number

  // Quality signals (numeric)
  animatedPropCount: number        // Number of distinct animated CSS properties
  easingFunctionCount: number      // Number of custom easing functions defined
  cycleDuration: number            // Default cycleDuration value
  lineCount: number                // Total lines of code
  renderElementCount: number       // Approximate number of JSX elements rendered
  uniqueCSSPropCount: number       // Distinct CSS properties used in style objects

  // Structural signals
  hasBackgroundAnimation: number   // Background has animated elements (not just static)
  hasHoldPhaseMotion: number       // Hold phase has motion (not static)
  hasConceptDrivenExit: number     // Exit is more than just opacity fade
  hasPerLetterStagger: number      // Per-letter stagger delay
  hasSecondEntity: number          // Multiple animated visual elements beyond text

  // Design signals
  fontSizeClamp: number            // Uses clamp() for responsive font size
  hasOverflow: number              // Uses overflow:hidden (contained effects)
  wordCountDefault: number         // Number of default words
  colorCount: number               // Number of distinct colors in defaults

  // Style signals (from tags/description)
  isClean: number                  // Tags/desc suggest clean/minimal
  isBold: number                   // Tags/desc suggest bold/impact
  isGlitchy: number                // Tags/desc suggest glitch/digital
  isRetro: number                  // Tags/desc suggest retro/vintage
  isArtsy: number                  // Tags/desc suggest artsy/creative
  isTrippy: number                 // Tags/desc suggest trippy/psychedelic
  isCinematic: number              // Tags/desc suggest cinematic/film
  isPlayful: number                // Tags/desc suggest playful/fun/bouncy
  isDark: number                   // Dark background color
  isLight: number                  // Light background color
}

export const FEATURE_KEYS: (keyof TemplateFeatures)[] = [
  'has3DRotation', 'hasClipPath', 'hasPerCharAnimation', 'hasTrigOscillation',
  'hasRandomness', 'hasPerspective', 'hasCustomEasing', 'hasBlurFilter',
  'hasTextShadow', 'hasBlendModes', 'hasSVG', 'hasGradients', 'hasScaleTransform',
  'animatedPropCount', 'easingFunctionCount', 'cycleDuration', 'lineCount',
  'renderElementCount', 'uniqueCSSPropCount',
  'hasBackgroundAnimation', 'hasHoldPhaseMotion', 'hasConceptDrivenExit',
  'hasPerLetterStagger', 'hasSecondEntity',
  'fontSizeClamp', 'hasOverflow', 'wordCountDefault', 'colorCount',
  'isClean', 'isBold', 'isGlitchy', 'isRetro', 'isArtsy', 'isTrippy', 'isCinematic', 'isPlayful',
  'isDark', 'isLight',
]

// ── Extractor ────────────────────────────────────────────────────────

export function extractFeatures(code: string): TemplateFeatures {
  // Animation technique flags
  const has3DRotation = /rotateY|rotateX|rotate3d/.test(code) ? 1 : 0
  const hasClipPath = /clipPath|clip-path/.test(code) ? 1 : 0
  const hasPerCharAnimation = /\.split\(\s*['"]/.test(code) ? 1 : 0
  const hasTrigOscillation = /Math\.sin|Math\.cos/.test(code) ? 1 : 0
  const hasRandomness = /Math\.random/.test(code) ? 1 : 0
  const hasPerspective = /perspective\s*[:(]/.test(code) ? 1 : 0
  const hasCustomEasing = /function\s+ease|const\s+ease|easeOut|easeIn|easeInOut/.test(code) ? 1 : 0
  const hasBlurFilter = /blur\s*\(/.test(code) ? 1 : 0
  const hasTextShadow = /textShadow|text-shadow/.test(code) ? 1 : 0
  const hasBlendModes = /mixBlendMode|mix-blend-mode/.test(code) ? 1 : 0
  const hasSVG = /<svg|<path|<circle|<line|<rect/.test(code) ? 1 : 0
  const hasGradients = /gradient\s*\(/.test(code) ? 1 : 0
  const hasScaleTransform = /scaleX|scaleY|scale\(|scale3d/.test(code) ? 1 : 0

  // Count animated CSS properties (properties that change with progress/phase)
  const animatedProps = new Set<string>()
  const animPropPatterns = [
    [/opacity\s*[=:]/, 'opacity'],
    [/translateX|translateY|translateZ/, 'translate'],
    [/scaleX|scaleY|scale\(/, 'scale'],
    [/rotateZ?|rotate3d|rotateX|rotateY/, 'rotate'],
    [/skewX|skewY/, 'skew'],
    [/clipPath|clip-path/, 'clipPath'],
    [/blur\s*\(/, 'blur'],
    [/textShadow|text-shadow/, 'textShadow'],
    [/boxShadow|box-shadow/, 'boxShadow'],
    [/background/, 'background'],
    [/color(?!:)/, 'color'],
    [/letterSpacing|letter-spacing/, 'letterSpacing'],
    [/fontSize|font-size/, 'fontSize'],
    [/width\s*[=:]/, 'width'],
    [/height\s*[=:]/, 'height'],
  ] as const
  for (const [pattern, name] of animPropPatterns) {
    if (pattern.test(code)) animatedProps.add(name)
  }

  // Count easing functions defined
  const easingMatches = code.match(/function\s+ease\w+/g)
  const easingFunctionCount = easingMatches ? easingMatches.length : 0

  // Extract cycleDuration default
  const cycleDurationMatch = code.match(/cycleDuration\s*[=:]\s*(\d+\.?\d*)/)
  const cycleDuration = cycleDurationMatch ? parseFloat(cycleDurationMatch[1]) : 1.5

  const lineCount = code.split('\n').length

  // Count JSX elements (approximate)
  const jsxElements = code.match(/<(?:div|span|p|svg|path|circle|rect|line|g)\b/g)
  const renderElementCount = jsxElements ? jsxElements.length : 0

  // Count unique CSS properties in style objects
  const cssProps = new Set<string>()
  const stylePropMatches = code.matchAll(/(\w+)\s*:/g)
  const cssPropNames = new Set([
    'position', 'top', 'left', 'right', 'bottom', 'width', 'height',
    'opacity', 'transform', 'background', 'color', 'fontSize', 'fontWeight',
    'fontFamily', 'letterSpacing', 'lineHeight', 'textTransform', 'whiteSpace',
    'display', 'gap', 'inset', 'overflow', 'filter', 'clipPath', 'textShadow',
    'boxShadow', 'borderRadius', 'border', 'zIndex', 'pointerEvents',
    'mixBlendMode', 'textAlign', 'padding', 'margin',
  ])
  for (const m of stylePropMatches) {
    if (cssPropNames.has(m[1])) cssProps.add(m[1])
  }

  // Structural: background animation (background render function has frame/time/progress)
  const bgSection = extractSection(code, 'renderBackground')
  const hasBackgroundAnimation = bgSection && /frame|time|progress|Math\.sin|Math\.cos|Date\.now/.test(bgSection) ? 1 : 0

  // Hold phase motion (hold section has animation, not just static opacity:1)
  const holdSection = extractHoldSection(code)
  const hasHoldPhaseMotion = holdSection && /Math\.sin|Math\.cos|wobble|breathe|shimmer|pulse|oscillat|Date\.now|holdProgress/.test(holdSection) ? 1 : 0

  // Concept-driven exit (exit is more than just opacity fade)
  const exitSection = extractExitSection(code)
  const hasConceptDrivenExit = exitSection
    ? (/scaleX|scaleY|rotate|clipPath|skew|blur|translateX/.test(exitSection) ? 1 : 0)
    : 0

  // Per-letter stagger
  const hasPerLetterStagger = /charDelay|letterDelay|ci\s*[/*]\s*|ci\s*\/\s*\(/.test(code) ? 1 : 0

  // Second entity (multiple animated elements beyond the word itself)
  const secondEntityPatterns = [
    /ghost|shadow|echo|reflection|overlay|particle|line|dot|bar|stripe|scan/i,
    /Array\.from\(\{.*length/,
    /{\/\*.*overlay/i,
  ]
  const hasSecondEntity = secondEntityPatterns.some(p => p.test(code)) ? 1 : 0

  // Design signals
  const fontSizeClamp = /clamp\s*\(/.test(code) ? 1 : 0
  const hasOverflow = /overflow\s*:\s*['"]?hidden/.test(code) ? 1 : 0

  // Default word count
  const wordsMatch = code.match(/words\s*:\s*\[([^\]]+)\]/)
  const wordCountDefault = wordsMatch ? (wordsMatch[1].match(/'/g) || []).length / 2 : 4

  // Color count
  const colorsMatch = code.match(/colors\s*:\s*\[([^\]]+)\]/)
  const colorCount = colorsMatch ? (colorsMatch[1].match(/#[0-9a-fA-F]{3,8}/g) || []).length : 4

  // Style signals — detected from tags, description, and code patterns
  const lower = code.toLowerCase()
  const tagsMatch = code.match(/tags:\s*\[([^\]]+)\]/)
  const tagsStr = tagsMatch ? tagsMatch[1].toLowerCase() : ''
  const descMatch = code.match(/description:\s*['"]([^'"]+)['"]/)
  const descStr = descMatch ? descMatch[1].toLowerCase() : ''
  const styleTxt = tagsStr + ' ' + descStr

  const isClean = /clean|minimal|simple|subtle|elegant/.test(styleTxt) ? 1 : 0
  const isBold = /bold|impact|slam|smash|aggressive|heavy|strong/.test(styleTxt) ? 1 : 0
  const isGlitchy = /glitch|corrupt|static|noise|digital|cyber|hack/.test(styleTxt) ? 1 : 0
  const isRetro = /retro|vintage|vhs|crt|old|classic|nostalgi|8.?bit|pixel/.test(styleTxt) ? 1 : 0
  const isArtsy = /art|creative|paint|water.?color|ink|brush|craft|hand/.test(styleTxt) ? 1 : 0
  const isTrippy = /trippy|psychedel|acid|warp|morph|kaleidoscop|neon|glow/.test(styleTxt) ? 1 : 0
  const isCinematic = /cinema|film|movie|theater|dramatic|epic|trailer/.test(styleTxt) ? 1 : 0
  const isPlayful = /playful|fun|bounce|cartoon|bubble|candy|party|confetti/.test(styleTxt) ? 1 : 0

  // Background brightness — detect light vs dark
  const bgMatch = code.match(/bgColor:\s*['"]([^'"]+)['"]/)
  const bgHex = bgMatch ? bgMatch[1] : '#000000'
  const bgBrightness = bgHex.startsWith('#') ? parseInt(bgHex.slice(1, 3), 16) + parseInt(bgHex.slice(3, 5), 16) + parseInt(bgHex.slice(5, 7), 16) : 0
  const isDark = bgBrightness < 200 ? 1 : 0
  const isLight = bgBrightness >= 200 ? 1 : 0

  return {
    has3DRotation, hasClipPath, hasPerCharAnimation, hasTrigOscillation,
    hasRandomness, hasPerspective, hasCustomEasing, hasBlurFilter,
    hasTextShadow, hasBlendModes, hasSVG, hasGradients, hasScaleTransform,
    animatedPropCount: animatedProps.size,
    easingFunctionCount,
    cycleDuration,
    lineCount,
    renderElementCount,
    uniqueCSSPropCount: cssProps.size,
    hasBackgroundAnimation, hasHoldPhaseMotion, hasConceptDrivenExit,
    hasPerLetterStagger, hasSecondEntity,
    fontSizeClamp, hasOverflow, wordCountDefault, colorCount,
    isClean, isBold, isGlitchy, isRetro, isArtsy, isTrippy, isCinematic, isPlayful,
    isDark, isLight,
  }
}

/**
 * Convert features object to a numeric array (consistent order for ML).
 */
export function featuresToVector(features: TemplateFeatures): number[] {
  return FEATURE_KEYS.map(k => features[k])
}

// ── Helpers ──────────────────────────────────────────────────────────

function extractSection(code: string, sectionName: string): string | null {
  const idx = code.indexOf(sectionName)
  if (idx === -1) return null
  // Grab roughly 500 chars after the section start
  return code.slice(idx, idx + 500)
}

function extractHoldSection(code: string): string | null {
  // Look for hold phase in renderWord
  const holdMatch = code.match(/phase\s*===?\s*['"]hold['"][^}]*\{([\s\S]*?)\}\s*(?:else|return)/)?.[1]
  if (holdMatch) return holdMatch
  // Fallback: look for holdProgress usage
  const holdIdx = code.indexOf('holdProgress')
  if (holdIdx === -1) return null
  return code.slice(Math.max(0, holdIdx - 200), holdIdx + 300)
}

function extractExitSection(code: string): string | null {
  const exitMatch = code.match(/phase\s*===?\s*['"]exit['"][^}]*\{([\s\S]*?)\}\s*(?:return|\))/)?.[1]
  if (exitMatch) return exitMatch
  const exitIdx = code.indexOf("'exit'")
  if (exitIdx === -1) return null
  return code.slice(exitIdx, Math.min(code.length, exitIdx + 500))
}
