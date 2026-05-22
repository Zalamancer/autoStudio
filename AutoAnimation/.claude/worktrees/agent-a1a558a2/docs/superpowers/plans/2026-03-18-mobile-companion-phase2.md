# ProAnimate Mobile — Phase 2: Core Renderer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Port DynamicMotionDesignRenderer to React Native so templates render natively on mobile at 60fps.

**Architecture:** The web renderer (508 lines) converts MotionDesignDescription JSON → HTML divs with CSS transforms. The mobile renderer converts the same JSON → Animated.View/Text with RN transforms, using @proanimate/core for all animation math. SVG elements use react-native-svg.

**Tech Stack:** React Native, react-native-reanimated 3, react-native-svg, @proanimate/core, Zustand

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `mobile/src/services/styleTransformer.ts` | CSS style → RN style conversion |
| Create | `mobile/src/services/fontMapper.ts` | Cross-platform font resolution |
| Create | `mobile/src/renderers/DynamicRenderer.tsx` | Mobile port of DynamicMotionDesignRenderer |
| Create | `mobile/src/renderers/ElementRenderer.tsx` | Per-element type switch (text/rect/circle/arc/group/etc) |
| Create | `mobile/src/renderers/TypographyRenderer.tsx` | Per-character animated text |
| Create | `mobile/src/hooks/useAnimationDriver.ts` | Reanimated progress driver (replaces Remotion frames) |
| Create | `mobile/src/components/AnimationPreview.tsx` | Preview wrapper with play/pause/restart |
| Modify | `mobile/app/(tabs)/browse.tsx` | Replace placeholder with test template preview |

---

## Task 1: Style Transformer

**Files:**
- Create: `mobile/src/services/styleTransformer.ts`

- [ ] **Step 1: Create the style transformer**

Converts CSS properties from MotionElement.style to React Native ViewStyle/TextStyle:

```typescript
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
): ViewStyle['transform'] {
  const transforms: ViewStyle['transform'] = []
  if (x !== 0) transforms.push({ translateX: x })
  if (y !== 0) transforms.push({ translateY: y })
  const sx = scale * scaleX
  const sy = scale * scaleY
  if (sx !== 1) transforms.push({ scaleX: sx })
  if (sy !== 1) transforms.push({ scaleY: sy })
  if (rotation !== 0) transforms.push({ rotate: `${rotation}deg` })
  return transforms.length > 0 ? transforms : undefined
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/services/styleTransformer.ts
git commit -m "feat(mobile): CSS → RN style transformer"
```

---

## Task 2: Font Mapper

**Files:**
- Create: `mobile/src/services/fontMapper.ts`

- [ ] **Step 1: Create the font mapper**

```typescript
// mobile/src/services/fontMapper.ts
import { Platform } from 'react-native'

const FONT_MAP: Record<string, { ios: string; android: string }> = {
  'Inter':             { ios: 'System', android: 'sans-serif' },
  'Segoe UI':          { ios: 'System', android: 'Roboto' },
  'Helvetica Neue':    { ios: 'Helvetica Neue', android: 'Roboto' },
  'Arial':             { ios: 'Arial', android: 'sans-serif' },
  'Arial Black':       { ios: 'Arial Black', android: 'sans-serif-black' },
  'Courier New':       { ios: 'Courier New', android: 'monospace' },
  'Georgia':           { ios: 'Georgia', android: 'serif' },
  'Times New Roman':   { ios: 'Times New Roman', android: 'serif' },
  'Comic Sans MS':     { ios: 'Comic Sans MS', android: 'sans-serif' },
  'Impact':            { ios: 'Impact', android: 'sans-serif-condensed' },
  'Verdana':           { ios: 'Verdana', android: 'sans-serif' },
  'Trebuchet MS':      { ios: 'Trebuchet MS', android: 'sans-serif' },
  'cursive':           { ios: 'Snell Roundhand', android: 'sans-serif' },
  'sans-serif':        { ios: 'System', android: 'sans-serif' },
  'serif':             { ios: 'Georgia', android: 'serif' },
  'monospace':         { ios: 'Menlo', android: 'monospace' },
}

/**
 * Resolve a CSS font-family string to a platform-appropriate font name.
 * Handles comma-separated fallback lists.
 */
export function resolveFont(fontFamily: string): string {
  // Parse CSS font-family: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif"
  const families = fontFamily
    .split(',')
    .map((f) => f.trim().replace(/^['"]|['"]$/g, ''))

  const platform = Platform.OS

  for (const family of families) {
    const mapping = FONT_MAP[family]
    if (mapping) {
      return platform === 'ios' ? mapping.ios : mapping.android
    }
    // If no mapping, try the font name directly (works if loaded via expo-font)
    // Return it as-is — the system will fall back if not found
  }

  // Final fallback
  return families[0] || (platform === 'ios' ? 'System' : 'sans-serif')
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/services/fontMapper.ts
git commit -m "feat(mobile): cross-platform font mapper"
```

---

## Task 3: Animation Driver Hook

**Files:**
- Create: `mobile/src/hooks/useAnimationDriver.ts`

- [ ] **Step 1: Create the animation driver**

```typescript
// mobile/src/hooks/useAnimationDriver.ts
import { useEffect, useCallback } from 'react'
import {
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated'

interface AnimationDriverOptions {
  durationMs: number
  loop?: boolean
  autoPlay?: boolean
}

export function useAnimationDriver({
  durationMs,
  loop = true,
  autoPlay = true,
}: AnimationDriverOptions) {
  const progress = useSharedValue(0)
  const isPlaying = useSharedValue(autoPlay ? 1 : 0)

  const play = useCallback(() => {
    isPlaying.value = 1
    progress.value = 0
    progress.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.linear }),
      loop ? -1 : 1,
      false,
    )
  }, [durationMs, loop])

  const pause = useCallback(() => {
    isPlaying.value = 0
    cancelAnimation(progress)
  }, [])

  const restart = useCallback(() => {
    cancelAnimation(progress)
    progress.value = 0
    play()
  }, [play])

  useEffect(() => {
    if (autoPlay) play()
    return () => cancelAnimation(progress)
  }, [autoPlay, play])

  return { progress, isPlaying, play, pause, restart }
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/hooks/useAnimationDriver.ts
git commit -m "feat(mobile): Reanimated animation driver hook"
```

---

## Task 4: Element Renderer (Core Component)

**Files:**
- Create: `mobile/src/renderers/ElementRenderer.tsx`

This is the main porting work — converts each element type from HTML to RN components. Uses @proanimate/core for all math.

- [ ] **Step 1: Create ElementRenderer**

The full component handles: text, rect, circle, icon, counter, bar, arc, line, group.
Uses `transformStyle` for CSS→RN conversion, `buildTransform` for animation transforms,
`interpolateProps`/`computeHoldEffect` from core for animation math.

Key conversions:
- `<div>` → `<View>`
- `<div>text</div>` → `<View><Text>text</Text></View>`
- `<svg>` → `<Svg>` from react-native-svg
- CSS transform string → `transform: [{ translateX }, { scaleX }, { rotate }]`
- `inset: 0` → `position: 'absolute', top: 0, left: 0, right: 0, bottom: 0`
- `grid` layout → `flexDirection: 'row', flexWrap: 'wrap'`

- [ ] **Step 2: Commit**

```bash
git add mobile/src/renderers/ElementRenderer.tsx
git commit -m "feat(mobile): ElementRenderer — RN port of element type switch"
```

---

## Task 5: Typography Renderer

**Files:**
- Create: `mobile/src/renderers/TypographyRenderer.tsx`

Per-character animated text using core's `splitText` and `computeUnitStyle`.

- [ ] **Step 1: Create TypographyRenderer**

Key differences from web:
- Each character is an `<Animated.Text>` not a `<span>`
- Transform uses RN transform array
- Cursor is a `<View>` positioned absolutely, blink driven by a separate Reanimated value
- No `filter: blur()` — skip blur effect on text for now

- [ ] **Step 2: Commit**

```bash
git add mobile/src/renderers/TypographyRenderer.tsx
git commit -m "feat(mobile): TypographyRenderer — per-character animated text"
```

---

## Task 6: DynamicRenderer (Main Entry Point)

**Files:**
- Create: `mobile/src/renderers/DynamicRenderer.tsx`

The top-level component that takes a `MotionDesignDescription` + `config` + `progress` and renders the full scene.

- [ ] **Step 1: Create DynamicRenderer**

```typescript
// Signature:
interface DynamicRendererProps {
  description: MotionDesignDescription
  config: Record<string, unknown>
  progress: number  // 0..1 (from useAnimationDriver)
  width: number
  height: number
}
```

Renders: background color → element tree via ElementRenderer.

- [ ] **Step 2: Commit**

```bash
git add mobile/src/renderers/DynamicRenderer.tsx
git commit -m "feat(mobile): DynamicRenderer — main entry point for template rendering"
```

---

## Task 7: AnimationPreview Component + Browse Screen Integration

**Files:**
- Create: `mobile/src/components/AnimationPreview.tsx`
- Modify: `mobile/app/(tabs)/browse.tsx`

Wire everything together with a hardcoded test template to verify rendering works.

- [ ] **Step 1: Create AnimationPreview**

Wraps DynamicRenderer + useAnimationDriver. Handles sizing (fills parent), play/pause controls.

- [ ] **Step 2: Update browse screen with test template**

Replace the placeholder with a hardcoded MotionDesignDescription that tests text, rect, and group elements.

- [ ] **Step 3: Verify app renders the test template**

```bash
cd mobile && npx expo start --dev-client
```

- [ ] **Step 4: Commit**

```bash
git add mobile/src/components/AnimationPreview.tsx mobile/app/(tabs)/browse.tsx
git commit -m "feat(mobile): AnimationPreview + test template on browse screen"
```
