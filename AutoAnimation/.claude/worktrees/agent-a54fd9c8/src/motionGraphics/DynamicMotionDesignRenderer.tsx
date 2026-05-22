/**
 * Generic renderer that interprets a MotionDesignDescription JSON
 * into animated React elements driven by progress (0-1).
 *
 * Supports professional typography animations, hold effects,
 * counter/bar/arc data visualization elements, and nested groups.
 */

import type { MotionGraphicProps } from '@/types/motionGraphic'
import type {
  MotionDesignDescription,
  MotionElement,
  AnimatableProps,
  EasingName,
} from '@/types/motionDesign'
import { Easing } from '@/engine/easing'
import {
  splitText,
  computeUnitStyle,
  TYPOGRAPHY_PRESETS,
  type TypographyAnimationConfig,
} from '@/services/motionDesign/typographyEngine'

// ── Easing resolution ──

const EASING_MAP: Record<EasingName, (t: number) => number> = {
  linear: Easing.linear,
  easeIn: Easing.in,
  easeOut: Easing.out,
  cubicIn: Easing.cubicIn,
  cubicOut: Easing.cubicOut,
  cubicInOut: Easing.cubicInOut,
  elasticIn: Easing.elasticIn,
  elasticOut: Easing.elasticOut,
  bounceIn: Easing.bounceIn,
  bounceOut: Easing.bounceOut,
  backIn: Easing.backIn,
  backOut: Easing.backOut,
  backInOut: Easing.backInOut,
}

function resolveEasing(name?: EasingName): (t: number) => number {
  return name ? (EASING_MAP[name] ?? Easing.cubicOut) : Easing.cubicOut
}

// ── Defaults for animatable properties ──

const ANIM_DEFAULTS: Required<AnimatableProps> = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  blur: 0,
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function interpolateProps(
  from: Partial<AnimatableProps>,
  to: Partial<AnimatableProps>,
  t: number,
): Required<AnimatableProps> {
  const result = { ...ANIM_DEFAULTS }
  const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]) as Set<keyof AnimatableProps>
  for (const key of allKeys) {
    const a = from[key] ?? ANIM_DEFAULTS[key]
    const b = to[key] ?? ANIM_DEFAULTS[key]
    result[key] = lerp(a, b, t)
  }
  return result
}

// ── Config interpolation ──

function interpolateConfig(
  value: string,
  config: Record<string, unknown>,
): string {
  return value.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = config[key]
    return v != null ? String(v) : ''
  })
}

function interpolateStyleValue(
  value: string | number,
  config: Record<string, unknown>,
): string | number {
  if (typeof value === 'string') return interpolateConfig(value, config)
  return value
}

// ── Hold effects ──

function computeHoldEffect(
  effect: 'pulse' | 'glow' | 'float' | 'breathe' | undefined,
  holdT: number,
  amplitude = 0.05,
  speed = 1,
): { scaleOffset: number; yOffset: number; boxShadow?: string } {
  if (!effect) return { scaleOffset: 0, yOffset: 0 }
  const wave = Math.sin(holdT * Math.PI * 2 * speed)
  switch (effect) {
    case 'pulse':
      return { scaleOffset: wave * amplitude, yOffset: 0 }
    case 'breathe':
      return { scaleOffset: wave * amplitude * 0.5, yOffset: 0 }
    case 'float':
      return { scaleOffset: 0, yOffset: wave * (amplitude * 100) }
    case 'glow':
      return {
        scaleOffset: 0,
        yOffset: 0,
        boxShadow: `0 0 ${8 + wave * 12}px rgba(255,255,255,${0.2 + wave * 0.15})`,
      }
    default:
      return { scaleOffset: 0, yOffset: 0 }
  }
}

// ── Element renderer ──

interface ElementRendererProps {
  element: MotionElement
  progress: number
  enterDuration: number
  exitDuration: number
  config: Record<string, unknown>
}

function ElementRenderer({
  element,
  progress,
  enterDuration,
  exitDuration,
  config,
}: ElementRendererProps) {
  const anim = element.animation
  const enterDelay = anim?.enterDelay ?? 0

  // Phase calculation
  const holdStart = enterDuration
  const holdEnd = 1 - exitDuration

  // Enter progress for this element (with stagger)
  let enterT = 0
  if (enterDuration > 0) {
    const effectiveStart = enterDelay * enterDuration
    const effectiveEnd = enterDuration
    if (progress >= effectiveEnd) {
      enterT = 1
    } else if (progress > effectiveStart) {
      const range = effectiveEnd - effectiveStart
      enterT = range > 0 ? (progress - effectiveStart) / range : 1
    }
  } else {
    enterT = 1
  }

  // Hold progress (0-1 within hold phase)
  let holdT = 0
  if (progress >= holdStart && progress < holdEnd) {
    const holdRange = holdEnd - holdStart
    holdT = holdRange > 0 ? (progress - holdStart) / holdRange : 0
  } else if (progress >= holdEnd) {
    holdT = 1
  }

  // Exit progress
  let exitT = 0
  if (exitDuration > 0 && progress >= holdEnd) {
    exitT = Math.min(1, (progress - holdEnd) / exitDuration)
  }

  // Compute animated properties
  const enterFrom = anim?.enter?.from ?? {}
  const enterEasing = resolveEasing(anim?.enter?.easing)
  const exitTo = anim?.exit?.to ?? {}
  const exitEasing = resolveEasing(anim?.exit?.easing)

  let props: Required<AnimatableProps>
  if (enterT < 1) {
    // Enter phase
    props = interpolateProps(enterFrom, ANIM_DEFAULTS, enterEasing(enterT))
  } else if (exitT > 0) {
    // Exit phase
    props = interpolateProps(ANIM_DEFAULTS, exitTo, exitEasing(exitT))
  } else {
    // Hold phase
    props = { ...ANIM_DEFAULTS }
  }

  // Hold effects
  const holdFx = computeHoldEffect(
    anim?.hold?.effect,
    holdT,
    anim?.hold?.amplitude,
    anim?.hold?.speed,
  )

  const finalScale = props.scale + holdFx.scaleOffset
  const finalY = props.y + holdFx.yOffset

  // Build transform and style
  const transform = [
    `translate(${props.x}px, ${finalY}px)`,
    `scale(${finalScale * props.scaleX}, ${finalScale * props.scaleY})`,
    props.rotation !== 0 ? `rotate(${props.rotation}deg)` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const baseStyle: React.CSSProperties = {
    opacity: props.opacity,
    transform,
    filter: props.blur > 0 ? `blur(${props.blur}px)` : undefined,
    boxShadow: holdFx.boxShadow,
  }

  // Merge element styles with config interpolation
  if (element.style) {
    for (const [k, v] of Object.entries(element.style)) {
      const camelKey = k as keyof React.CSSProperties
      ;(baseStyle as any)[camelKey] = interpolateStyleValue(v, config)
    }
  }

  // Render based on element type
  return renderElementByType(element, baseStyle, progress, enterDuration, exitDuration, config, enterT)
}

function renderElementByType(
  element: MotionElement,
  style: React.CSSProperties,
  progress: number,
  enterDuration: number,
  exitDuration: number,
  config: Record<string, unknown>,
  enterT: number,
): React.JSX.Element {
  const { type, id } = element

  switch (type) {
    case 'text': {
      const resolvedText = element.text ? interpolateConfig(element.text, config) : ''
      // Use typography animation if specified
      const typoPreset = element.typographyPreset
      if (typoPreset && TYPOGRAPHY_PRESETS[typoPreset]) {
        return (
          <TypographyTextRenderer
            key={id}
            text={resolvedText}
            style={style}
            progress={progress}
            config={TYPOGRAPHY_PRESETS[typoPreset]}
          />
        )
      }
      return (
        <div key={id} style={style}>
          {resolvedText}
        </div>
      )
    }

    case 'rect':
      return <div key={id} style={style} />

    case 'circle':
      return <div key={id} style={{ ...style, borderRadius: '50%' }} />

    case 'icon':
      return (
        <div key={id} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {element.text ? interpolateConfig(element.text, config) : ''}
        </div>
      )

    case 'counter': {
      const target = element.counterTarget ?? 0
      const suffix = element.counterSuffix ?? ''
      const easedT = Math.min(1, enterT)
      const current = Math.floor(target * easedT)
      const display = easedT >= 1 ? target.toLocaleString() : current.toLocaleString()
      return (
        <div key={id} style={style}>
          {display}{suffix}
        </div>
      )
    }

    case 'bar': {
      const percent = element.barPercent ?? 0
      const fillWidth = `${percent * Math.min(1, enterT)}%`
      return (
        <div key={id} style={{ ...style, overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: fillWidth,
              background: (style as any).color || '#6366f1',
              borderRadius: 'inherit',
              transition: 'none',
            }}
          />
        </div>
      )
    }

    case 'arc': {
      const angle = element.arcAngle ?? 360
      const r = 40
      const circumference = 2 * Math.PI * r
      const target = (angle / 360) * circumference
      const offset = circumference - target * Math.min(1, enterT)
      return (
        <div key={id} style={style}>
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            {/* Background circle */}
            <circle
              cx="50" cy="50" r={r}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="6"
            />
            {/* Animated arc */}
            <circle
              cx="50" cy="50" r={r}
              fill="none"
              stroke={(style as any).color || '#6366f1'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
            />
          </svg>
        </div>
      )
    }

    case 'line':
      return (
        <div
          key={id}
          style={{
            ...style,
            width: style.width ?? '100%',
            height: style.height ?? '2px',
          }}
        />
      )

    case 'group': {
      const layoutStyle: React.CSSProperties = { ...style }
      const layout = element.layout ?? 'flex-column'
      if (layout === 'flex-row') {
        layoutStyle.display = 'flex'
        layoutStyle.flexDirection = 'row'
      } else if (layout === 'flex-column') {
        layoutStyle.display = 'flex'
        layoutStyle.flexDirection = 'column'
      } else if (layout === 'grid') {
        layoutStyle.display = 'grid'
        layoutStyle.gridTemplateColumns = element.gridColumns ?? 'repeat(2, 1fr)'
      } else if (layout === 'absolute') {
        layoutStyle.position = 'relative'
      }
      if (element.gap != null) {
        layoutStyle.gap = typeof element.gap === 'number' ? `${element.gap}px` : element.gap
      }

      return (
        <div key={id} style={layoutStyle}>
          {element.children?.map((child) => (
            <ElementRenderer
              key={child.id}
              element={child}
              progress={progress}
              enterDuration={enterDuration}
              exitDuration={exitDuration}
              config={config}
            />
          ))}
        </div>
      )
    }

    default:
      return <div key={id} style={style} />
  }
}

// ── Typography text renderer ──

function TypographyTextRenderer({
  text,
  style,
  progress,
  config: typoConfig,
}: {
  text: string
  style: React.CSSProperties
  progress: number
  config: TypographyAnimationConfig
}) {
  const units = splitText(text, typoConfig.splitMode)
  const totalUnits = units.length

  return (
    <div style={{ ...style, display: 'inline' }}>
      {units.map((unit, i) => {
        const unitStyle = computeUnitStyle(i, totalUnits, progress, typoConfig)
        const unitTransform = [
          unitStyle.x !== 0 || unitStyle.y !== 0
            ? `translate(${unitStyle.x}px, ${unitStyle.y}px)`
            : '',
          unitStyle.scale !== 1 ? `scale(${unitStyle.scale})` : '',
          unitStyle.rotation !== 0 ? `rotate(${unitStyle.rotation}deg)` : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: unitStyle.opacity,
              transform: unitTransform || undefined,
              filter: unitStyle.blur > 0 ? `blur(${unitStyle.blur}px)` : undefined,
              fontWeight: unitStyle.fontWeight !== 400 ? unitStyle.fontWeight : undefined,
              letterSpacing:
                unitStyle.letterSpacing !== 0
                  ? `${unitStyle.letterSpacing}px`
                  : undefined,
              whiteSpace: unit === ' ' ? 'pre' : undefined,
            }}
          >
            {unit}
            {unitStyle.showCursor && (
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1em',
                  background: 'currentColor',
                  marginLeft: '2px',
                  verticalAlign: 'text-bottom',
                  animation: 'none',
                  opacity: Math.sin(progress * 60) > 0 ? 1 : 0,
                }}
              />
            )}
          </span>
        )
      })}
    </div>
  )
}

// ── Main component ──

export interface DynamicMotionDesignRendererProps extends MotionGraphicProps {
  description: MotionDesignDescription
}

export function DynamicMotionDesignRenderer({
  description,
  config,
  progress,
}: DynamicMotionDesignRendererProps) {
  const bg = interpolateConfig(description.background, config)
  const enterDuration = description.enterDuration ?? 0.2
  const exitDuration = description.exitDuration ?? 0.2

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bg,
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {description.elements.map((element) => (
        <ElementRenderer
          key={element.id}
          element={element}
          progress={progress}
          enterDuration={enterDuration}
          exitDuration={exitDuration}
          config={config}
        />
      ))}
    </div>
  )
}
