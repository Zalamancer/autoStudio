// mobile/src/services/styleTransformer.ts
import { Dimensions, type ViewStyle, type TextStyle } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

type RNStyle = ViewStyle & TextStyle

/**
 * Convert a CSS style object from MotionElement.style to RN-compatible style.
 * Handles common CSS → RN translations. Unsupported properties are dropped.
 */
export function transformStyle(
  cssStyle: Record<string, string | number>,
  config: Record<string, unknown> = {},
): RNStyle {
  const rnStyle: RNStyle = {}

  for (const [key, rawValue] of Object.entries(cssStyle)) {
    const value = typeof rawValue === 'string'
      ? rawValue.replace(/\{\{(\w+)\}\}/g, (_, k) => {
          const v = config[k]
          return v != null ? String(v) : ''
        })
      : rawValue

    switch (key) {
      // Position
      case 'position':
        rnStyle.position = value as 'absolute' | 'relative'
        break
      case 'top': case 'left': case 'right': case 'bottom':
        rnStyle[key] = parseNumeric(value)
        break
      case 'inset':
        rnStyle.position = 'absolute'
        rnStyle.top = 0
        rnStyle.left = 0
        rnStyle.right = 0
        rnStyle.bottom = 0
        break

      // Sizing
      case 'width': case 'height':
        rnStyle[key] = parseDimension(value)
        break
      case 'maxWidth': case 'maxHeight': case 'minWidth': case 'minHeight':
        rnStyle[key] = parseDimension(value)
        break

      // Spacing
      case 'padding': case 'margin':
        rnStyle[key] = parseNumeric(value)
        break
      case 'paddingTop': case 'paddingBottom': case 'paddingLeft': case 'paddingRight':
      case 'marginTop': case 'marginBottom': case 'marginLeft': case 'marginRight':
        rnStyle[key] = parseNumeric(value)
        break
      case 'gap':
        rnStyle.gap = parseNumeric(value)
        break

      // Colors
      case 'color':
        rnStyle.color = String(value)
        break
      case 'background': case 'backgroundColor':
        // Only handle solid colors, not gradients
        if (typeof value === 'string' && !value.includes('gradient')) {
          rnStyle.backgroundColor = value
        }
        break

      // Typography
      case 'fontSize':
        rnStyle.fontSize = parseFontSize(value)
        break
      case 'fontWeight':
        rnStyle.fontWeight = String(value) as TextStyle['fontWeight']
        break
      case 'fontFamily':
        // Will be resolved by fontMapper
        rnStyle.fontFamily = String(value)
        break
      case 'textAlign':
        rnStyle.textAlign = value as TextStyle['textAlign']
        break
      case 'letterSpacing':
        rnStyle.letterSpacing = parseNumeric(value)
        break
      case 'lineHeight':
        rnStyle.lineHeight = parseNumeric(value)
        break
      case 'textTransform':
        rnStyle.textTransform = value as TextStyle['textTransform']
        break

      // Borders
      case 'borderRadius':
        rnStyle.borderRadius = parseNumeric(value)
        break
      case 'borderWidth':
        rnStyle.borderWidth = parseNumeric(value)
        break
      case 'borderColor':
        rnStyle.borderColor = String(value)
        break

      // Flex
      case 'display':
        if (value === 'flex') rnStyle.display = 'flex'
        // 'grid' and others not supported — fallback to flex
        break
      case 'flexDirection':
        rnStyle.flexDirection = value as ViewStyle['flexDirection']
        break
      case 'justifyContent':
        rnStyle.justifyContent = value as ViewStyle['justifyContent']
        break
      case 'alignItems':
        rnStyle.alignItems = value as ViewStyle['alignItems']
        break
      case 'flexWrap':
        rnStyle.flexWrap = value as ViewStyle['flexWrap']
        break
      case 'flex':
        rnStyle.flex = parseNumeric(value)
        break

      // Overflow
      case 'overflow':
        rnStyle.overflow = value === 'hidden' ? 'hidden' : 'visible'
        break

      // Opacity handled by animation system, but allow static
      case 'opacity':
        rnStyle.opacity = typeof value === 'number' ? value : parseFloat(String(value))
        break

      // zIndex
      case 'zIndex':
        rnStyle.zIndex = typeof value === 'number' ? value : parseInt(String(value))
        break

      // Skip unsupported CSS: filter, boxShadow, clipPath, mixBlendMode,
      // WebkitTextStroke, transition, animation, cursor, etc.
      default:
        break
    }
  }

  return rnStyle
}

function parseNumeric(value: string | number): number {
  if (typeof value === 'number') return value
  const num = parseFloat(value)
  return isNaN(num) ? 0 : num
}

function parseDimension(value: string | number): number | `${number}%` {
  if (typeof value === 'number') return value
  if (value.endsWith('%')) return value as `${number}%`
  if (value.endsWith('vw')) return (parseFloat(value) / 100) * SCREEN_WIDTH
  if (value.endsWith('vh')) return (parseFloat(value) / 100) * SCREEN_HEIGHT
  return parseNumeric(value)
}

function parseFontSize(value: string | number): number {
  if (typeof value === 'number') return value
  // Handle clamp(min, preferred, max)
  const clampMatch = value.match(/clamp\(([^,]+),([^,]+),([^)]+)\)/)
  if (clampMatch) {
    const min = parseNumeric(clampMatch[1].trim())
    const max = parseNumeric(clampMatch[3].trim())
    const preferred = parseNumeric(clampMatch[2].trim())
    return Math.min(max, Math.max(min, preferred || SCREEN_WIDTH * 0.06))
  }
  return parseNumeric(value)
}

/**
 * Build RN transform array from computed animation props.
 */
export function buildTransform(
  x: number,
  y: number,
  scale: number,
  scaleX: number,
  scaleY: number,
  rotation: number,
): Array<Record<string, number | string>> {
  const safeN = (n: number) => (Number.isFinite(n) ? n : 0)
  const transforms: Array<Record<string, number | string>> = []
  const sx = safeN(x)
  const sy = safeN(y)
  const ss = safeN(scale)
  const ssx = safeN(scaleX)
  const ssy = safeN(scaleY)
  const sr = safeN(rotation)
  if (sx !== 0) transforms.push({ translateX: sx })
  if (sy !== 0) transforms.push({ translateY: sy })
  const cx = ss * ssx
  const cy = ss * ssy
  if (cx !== 1) transforms.push({ scaleX: cx })
  if (cy !== 1) transforms.push({ scaleY: cy })
  if (sr !== 0) transforms.push({ rotate: `${sr}deg` })
  return transforms
}
