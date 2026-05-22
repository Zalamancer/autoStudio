const MAX_ELEMENTS = 200
const MAX_DEPTH = 10
const MAX_PAYLOAD_BYTES = 1_000_000

const DANGEROUS_PATTERNS = /expression\s*\(|javascript\s*:|url\s*\(/i

interface ValidationResult {
  valid: boolean
  error?: string
  sanitized?: any
}

function countElements(elements: any[], depth = 0): { count: number; maxDepth: number } {
  let count = 0
  let maxDepth = depth
  for (const el of elements) {
    count++
    if (el.children && Array.isArray(el.children)) {
      const child = countElements(el.children, depth + 1)
      count += child.count
      if (child.maxDepth > maxDepth) maxDepth = child.maxDepth
    }
  }
  return { count, maxDepth }
}

function sanitizeElement(el: any): any {
  const sanitized = { ...el }
  if (sanitized.style && typeof sanitized.style === 'object') {
    const cleanStyle: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(sanitized.style)) {
      if (typeof value === 'string' && DANGEROUS_PATTERNS.test(value)) continue
      cleanStyle[key] = value as string | number
    }
    sanitized.style = cleanStyle
  }
  if (sanitized.children && Array.isArray(sanitized.children)) {
    sanitized.children = sanitized.children.map(sanitizeElement)
  }
  return sanitized
}

export function validateMotionDesignDescription(desc: any): ValidationResult {
  if (!desc || typeof desc !== 'object') {
    return { valid: false, error: 'Invalid description object' }
  }

  // Check payload size
  const serialized = JSON.stringify(desc)
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    return { valid: false, error: `Exceeds max payload size (${MAX_PAYLOAD_BYTES} bytes)` }
  }

  const elements = desc.elements
  if (!Array.isArray(elements)) {
    return { valid: false, error: 'elements must be an array' }
  }

  // Count elements and check depth
  const { count, maxDepth } = countElements(elements)
  if (count > MAX_ELEMENTS) {
    return { valid: false, error: `Exceeds max element count (${MAX_ELEMENTS})` }
  }
  if (maxDepth > MAX_DEPTH) {
    return { valid: false, error: `Exceeds max nesting depth (${MAX_DEPTH})` }
  }

  // Sanitize styles
  const sanitized = {
    ...desc,
    elements: elements.map(sanitizeElement),
  }

  return { valid: true, sanitized }
}
