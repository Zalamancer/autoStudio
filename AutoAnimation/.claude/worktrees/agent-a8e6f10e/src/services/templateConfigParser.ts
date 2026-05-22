/**
 * templateConfigParser.ts
 *
 * Parses the EDITABLE CONFIG / EDITABLE VARIABLES section from an HTML template
 * string and returns a structured list of editable properties with inferred types.
 *
 * Supports two patterns:
 *  1. CONFIG object:  `const CONFIG = { key: value, ... };`
 *  2. Standalone vars: `const VARNAME = value;`
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ConfigPropertyType =
  | 'text'
  | 'color'
  | 'number'
  | 'boolean'
  | 'text-array'
  | 'object-array'
  | 'nested-colors'

export interface TemplateConfigProperty {
  /** The key used inside the template (e.g. "channelName", "BG_COLOR") */
  key: string
  /** Human-friendly label derived from the key */
  label: string
  /** Inferred editor type */
  type: ConfigPropertyType
  /** Default value parsed from the template */
  value: unknown
  /** UI grouping: "Text", "Colors", "Animation", "Data" */
  group: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert camelCase / SCREAMING_SNAKE_CASE key to a human label. */
function keyToLabel(key: string): string {
  // SCREAMING_SNAKE_CASE → Title Case
  if (/^[A-Z][A-Z0-9_]+$/.test(key)) {
    return key
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ')
  }
  // camelCase → Spaced Title Case
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
}

/** Check if a string looks like a CSS colour. */
function isColorValue(v: string): boolean {
  if (/^#([0-9a-fA-F]{3,8})$/.test(v)) return true
  if (/^rgba?\(/.test(v)) return true
  return false
}

/** Infer property type from a JS literal value. */
function inferType(value: unknown): ConfigPropertyType {
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'string') {
    return isColorValue(value) ? 'color' : 'text'
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'text-array'
    if (typeof value[0] === 'string') return 'text-array'
    return 'object-array'
  }
  // Plain object whose values are all colour strings → nested-colors
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const vals = Object.values(value as Record<string, unknown>)
    if (vals.length > 0 && vals.every((v) => typeof v === 'string' && isColorValue(v as string))) {
      return 'nested-colors'
    }
    return 'object-array' // fallback for other objects
  }
  return 'text'
}

/** Infer a UI group from the key name + type. */
function inferGroup(key: string, type: ConfigPropertyType): string {
  const k = key.toLowerCase()
  if (type === 'color' || type === 'nested-colors') return 'Colors'
  if (type === 'text-array' || type === 'object-array') return 'Data'
  if (
    k.includes('speed') ||
    k.includes('duration') ||
    k.includes('cycle') ||
    k.includes('delay') ||
    k.includes('transition') ||
    k.includes('interval')
  )
    return 'Animation'
  if (
    k.includes('count') ||
    k.includes('radius') ||
    k.includes('width') ||
    k.includes('height') ||
    k.includes('size') ||
    k.includes('spacing') ||
    k.includes('rows') ||
    k.includes('cols') ||
    k.includes('index') ||
    k.includes('score') ||
    k.includes('lives')
  )
    return 'Numbers'
  if (type === 'number') return 'Numbers'
  if (type === 'boolean') return 'Numbers'
  return 'Text'
}

// ---------------------------------------------------------------------------
// Parsing – CONFIG object pattern
// ---------------------------------------------------------------------------

/**
 * Try to extract the `const CONFIG = { ... };` block using a brace-balanced
 * approach, then safely evaluate it via `new Function`.
 */
function extractConfigObject(html: string): Record<string, unknown> | null {
  // Find the CONFIG assignment
  const configStartRe = /const\s+CONFIG\s*=\s*\{/
  const match = configStartRe.exec(html)
  if (!match) return null

  const startIdx = match.index + match[0].length - 1 // index of '{'
  let depth = 0
  let endIdx = startIdx

  for (let i = startIdx; i < html.length; i++) {
    const ch = html[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        endIdx = i
        break
      }
    }
    // Skip string literals to avoid counting braces inside strings
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch
      i++
      while (i < html.length && html[i] !== quote) {
        if (html[i] === '\\') i++ // skip escaped char
        i++
      }
    }
  }

  const objectBody = html.slice(startIdx, endIdx + 1)

  // Use safe JSON parsing first, then fall back to regex parser.
  // Avoid new Function() / eval to prevent code execution from template content.
  try {
    // Attempt JSON.parse after normalizing JS object literal syntax to JSON:
    // - Replace single quotes with double quotes for string values
    // - Remove trailing commas
    // - Quote unquoted keys
    const jsonified = objectBody
      // Replace single-quoted strings with double-quoted (simple cases)
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
      // Remove trailing commas before } or ]
      .replace(/,\s*([}\]])/g, '$1')
      // Quote unquoted object keys (word chars before colon)
      .replace(/(\{|,)\s*(\w+)\s*:/g, '$1"$2":')

    const result = JSON.parse(jsonified)
    if (result && typeof result === 'object') return result as Record<string, unknown>
  } catch {
    // JSON parse failed — fall back to regex parsing
  }

  return regexParseConfigBlock(objectBody)
}

/**
 * Fallback regex parser for a CONFIG object body.
 * Handles simple key: value pairs.
 */
function regexParseConfigBlock(block: string): Record<string, unknown> | null {
  const result: Record<string, unknown> = {}
  // Match key: 'string' or key: "string"
  const stringRe = /(\w+)\s*:\s*'([^']*)'|(\w+)\s*:\s*"([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = stringRe.exec(block)) !== null) {
    const key = m[1] || m[3]
    const val = m[2] ?? m[4]
    result[key] = val
  }
  // Match key: number
  const numRe = /(\w+)\s*:\s*(-?\d+(?:\.\d+)?)\s*[,\n}]/g
  while ((m = numRe.exec(block)) !== null) {
    if (!(m[1] in result)) {
      result[m[1]] = parseFloat(m[2])
    }
  }
  // Match key: true/false
  const boolRe = /(\w+)\s*:\s*(true|false)\s*[,\n}]/g
  while ((m = boolRe.exec(block)) !== null) {
    if (!(m[1] in result)) {
      result[m[1]] = m[2] === 'true'
    }
  }
  return Object.keys(result).length > 0 ? result : null
}

// ---------------------------------------------------------------------------
// Parsing – Standalone variable pattern
// ---------------------------------------------------------------------------

function extractStandaloneVars(html: string): Record<string, unknown> | null {
  // Find the editable block boundaries
  const startRe = /\/\/\s*={3,}\s*EDITABLE\s*(VARIABLES|TEXT\s*VARIABLES)\s*={0,}/i
  const endRe = /\/\/\s*={3,}\s*END\s*EDITABLE|\/\/\s*={5,}/

  const startMatch = startRe.exec(html)
  if (!startMatch) return null

  const endMatch = endRe.exec(html.slice(startMatch.index + startMatch[0].length))
  const blockEnd = endMatch
    ? startMatch.index + startMatch[0].length + endMatch.index
    : html.length

  const block = html.slice(startMatch.index, blockEnd)

  // Already parsed as CONFIG? Skip.
  if (/const\s+CONFIG\s*=/.test(block)) return null

  const result: Record<string, unknown> = {}

  // Match: const/var/let VARNAME = 'string';
  const strVarRe = /(?:const|var|let)\s+([A-Z_][A-Z0-9_]*)\s*=\s*'([^']*)'\s*;/g
  let m: RegExpExecArray | null
  while ((m = strVarRe.exec(block)) !== null) {
    result[m[1]] = m[2]
  }

  // Match: const/var/let VARNAME = "string";
  const dblStrVarRe = /(?:const|var|let)\s+([A-Z_][A-Z0-9_]*)\s*=\s*"([^"]*)"\s*;/g
  while ((m = dblStrVarRe.exec(block)) !== null) {
    if (!(m[1] in result)) result[m[1]] = m[2]
  }

  // Match: const/var/let VARNAME = number;
  const numVarRe = /(?:const|var|let)\s+([A-Z_][A-Z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)\s*;/g
  while ((m = numVarRe.exec(block)) !== null) {
    if (!(m[1] in result)) result[m[1]] = parseFloat(m[2])
  }

  // Match: const/var/let VARNAME = true/false;
  const boolVarRe = /(?:const|var|let)\s+([A-Z_][A-Z0-9_]*)\s*=\s*(true|false)\s*;/g
  while ((m = boolVarRe.exec(block)) !== null) {
    if (!(m[1] in result)) result[m[1]] = m[2] === 'true'
  }

  // Match: const/var/let VARNAME = ['...', '...'];
  const arrVarRe = /(?:const|var|let)\s+([A-Z_][A-Z0-9_]*)\s*=\s*(\[[\s\S]*?\])\s*;/g
  while ((m = arrVarRe.exec(block)) !== null) {
    if (!(m[1] in result)) {
      try {
        // Safely parse array literals without eval/new Function
        const jsonified = m[2]
          .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
          .replace(/,\s*\]/g, ']')
        const parsed = JSON.parse(jsonified)
        result[m[1]] = parsed
      } catch {
        // skip unparseable arrays
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

// ---------------------------------------------------------------------------
// DOM binding extraction — find how CONFIG keys map to DOM elements
// ---------------------------------------------------------------------------

export interface DomBinding {
  elId: string
  prop: 'textContent' | 'innerHTML' | 'style'
  styleProp?: string
}

/**
 * Scan the HTML for patterns like:
 *   document.getElementById('logo').textContent = CONFIG.channelName
 *   document.getElementById('titleText').innerHTML = BOLD_TEXT
 *   document.body.style.background = BG_COLOR
 * Returns a map: configKey → DomBinding[]
 */
export function extractDomBindings(html: string): Record<string, DomBinding[]> {
  const bindings: Record<string, DomBinding[]> = {}

  const add = (key: string, binding: DomBinding) => {
    if (!bindings[key]) bindings[key] = []
    bindings[key].push(binding)
  }

  // Pattern: getElementById('id').textContent = CONFIG.key  or  = KEY
  const elTextRe =
    /getElementById\(\s*['"]([^'"]+)['"]\s*\)\s*\.\s*(textContent|innerHTML)\s*=\s*(?:CONFIG\.)?([A-Za-z_]\w*)/g
  let m: RegExpExecArray | null
  while ((m = elTextRe.exec(html)) !== null) {
    add(m[3], { elId: m[1], prop: m[2] as 'textContent' | 'innerHTML' })
  }

  // Pattern: document.body.style.PROP = CONFIG.key  or  = KEY
  const bodyStyleRe =
    /document\.body\.style\.(\w+)\s*=\s*(?:CONFIG\.)?([A-Za-z_]\w*)/g
  while ((m = bodyStyleRe.exec(html)) !== null) {
    add(m[2], { elId: '__body__', prop: 'style', styleProp: m[1] })
  }

  return bindings
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse editable configuration from a raw HTML template string.
 * Returns an array of TemplateConfigProperty items ready for the property editor.
 */
export function parseTemplateConfig(html: string): TemplateConfigProperty[] {
  const properties: TemplateConfigProperty[] = []

  // Try CONFIG object first (more common pattern)
  const configObj = extractConfigObject(html)
  if (configObj) {
    for (const [key, value] of Object.entries(configObj)) {
      const type = inferType(value)

      // For nested color objects (e.g. retro-arcade `colors: { bg, text, ... }`),
      // flatten into individual color properties with dotted keys.
      if (type === 'nested-colors' && value && typeof value === 'object') {
        for (const [subKey, subVal] of Object.entries(value as Record<string, string>)) {
          properties.push({
            key: `${key}.${subKey}`,
            label: `${keyToLabel(key)} › ${keyToLabel(subKey)}`,
            type: 'color',
            value: subVal,
            group: 'Colors',
          })
        }
        continue
      }

      properties.push({
        key,
        label: keyToLabel(key),
        type,
        value,
        group: inferGroup(key, type),
      })
    }
    return properties
  }

  // Try standalone variable pattern
  const vars = extractStandaloneVars(html)
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      const type = inferType(value)
      properties.push({
        key,
        label: keyToLabel(key),
        type,
        value,
        group: inferGroup(key, type),
      })
    }
    return properties
  }

  return properties
}
