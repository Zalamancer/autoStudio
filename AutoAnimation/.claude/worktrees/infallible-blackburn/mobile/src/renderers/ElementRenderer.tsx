/**
 * ElementRenderer — React Native port of the web DynamicMotionDesignRenderer's
 * element type switch and animation phase logic.
 *
 * Uses @proanimate/core for all math (interpolateProps, computeHoldEffect, Easing)
 * and local mobile utilities (transformStyle, buildTransform, resolveFont).
 */

import React from 'react'
import { View, Text, type ViewStyle, type TextStyle } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import {
  interpolateProps,
  interpolateConfig,
  computeHoldEffect,
  Easing,
  TYPOGRAPHY_PRESETS,
  type MotionElement,
  type AnimatableProps,
  type EasingName,
} from '@proanimate/core'
import { transformStyle, buildTransform } from '../services/styleTransformer'
import { resolveFont } from '../services/fontMapper'
import { TypographyRenderer } from './TypographyRenderer'

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

// ── Component ──

export interface ElementRendererProps {
  element: MotionElement
  progress: number
  enterDuration: number
  exitDuration: number
  config: Record<string, unknown>
}

export function ElementRenderer({
  element,
  progress,
  enterDuration,
  exitDuration,
  config,
}: ElementRendererProps) {
  const anim = element.animation
  const enterDelay = anim?.enterDelay ?? 0

  // ── Phase calculation ──

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

  // ── Compute animated properties ──

  const enterFrom = anim?.enter?.from ?? {}
  const enterEasing = resolveEasing(anim?.enter?.easing)
  const exitTo = anim?.exit?.to ?? {}
  const exitEasing = resolveEasing(anim?.exit?.easing)

  let props: Required<AnimatableProps>
  if (enterT < 1) {
    props = interpolateProps(enterFrom, ANIM_DEFAULTS, enterEasing(enterT))
  } else if (exitT > 0) {
    props = interpolateProps(ANIM_DEFAULTS, exitTo, exitEasing(exitT))
  } else {
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

  // Build RN transform array
  const transform = buildTransform(
    props.x,
    finalY,
    finalScale,
    props.scaleX,
    props.scaleY,
    props.rotation,
  )

  // ── Build base style ──

  // Merge element.style via styleTransformer (handles CSS→RN conversion)
  const mergedStyle: ViewStyle & TextStyle = element.style
    ? transformStyle(element.style, config)
    : {}

  // Animation-driven properties override static style
  const animStyle: ViewStyle = {
    ...mergedStyle,
    opacity: props.opacity,
  }
  if (transform.length > 0) {
    animStyle.transform = transform as any
  }

  // If blur > 0, approximate with lower opacity (RN has no filter: blur)
  if (props.blur > 0) {
    animStyle.opacity = Math.max(0, (props.opacity ?? 1) * Math.max(0, 1 - props.blur / 20))
  }

  // ── Render based on element type ──

  return renderElementByType(
    element,
    animStyle,
    mergedStyle,
    progress,
    enterDuration,
    exitDuration,
    config,
    enterT,
  )
}

// ── Element type switch ──

function renderElementByType(
  element: MotionElement,
  animStyle: ViewStyle,
  mergedStyle: ViewStyle & TextStyle,
  progress: number,
  enterDuration: number,
  exitDuration: number,
  config: Record<string, unknown>,
  enterT: number,
): React.JSX.Element {
  const { type } = element

  // Extract text-specific styles from mergedStyle for <Text> components
  const textStyle: TextStyle = {}
  if (mergedStyle.color) textStyle.color = mergedStyle.color
  if (mergedStyle.fontSize) textStyle.fontSize = mergedStyle.fontSize
  if (mergedStyle.fontWeight) textStyle.fontWeight = mergedStyle.fontWeight
  if (mergedStyle.textAlign) textStyle.textAlign = mergedStyle.textAlign
  if (mergedStyle.letterSpacing) textStyle.letterSpacing = mergedStyle.letterSpacing
  if (mergedStyle.lineHeight) textStyle.lineHeight = mergedStyle.lineHeight
  if (mergedStyle.textTransform) textStyle.textTransform = mergedStyle.textTransform
  if (mergedStyle.fontFamily) {
    textStyle.fontFamily = resolveFont(mergedStyle.fontFamily)
  }

  switch (type) {
    case 'text': {
      const resolvedText = element.text ? interpolateConfig(element.text, config) : ''

      // Use typography animation if a preset is specified
      const typoPreset = element.typographyPreset
      if (typoPreset && TYPOGRAPHY_PRESETS[typoPreset]) {
        return (
          <TypographyRenderer
            text={resolvedText}
            baseStyle={{ ...animStyle, ...textStyle }}
            progress={progress}
            config={TYPOGRAPHY_PRESETS[typoPreset]}
          />
        )
      }

      return (
        <View style={animStyle}>
          <Text style={textStyle}>{resolvedText}</Text>
        </View>
      )
    }

    case 'rect':
      return <View style={animStyle} />

    case 'circle':
      return <View style={{ ...animStyle, borderRadius: 9999 }} />

    case 'icon': {
      const iconText = element.text ? interpolateConfig(element.text, config) : ''
      return (
        <View style={{ ...animStyle, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={textStyle}>{iconText}</Text>
        </View>
      )
    }

    case 'counter': {
      const target = element.counterTarget ?? 0
      const suffix = element.counterSuffix ?? ''
      const easedT = Math.min(1, enterT)
      const current = Math.floor(target * easedT)
      const display = easedT >= 1 ? target.toLocaleString() : current.toLocaleString()
      return (
        <View style={animStyle}>
          <Text style={textStyle}>
            {display}
            {suffix}
          </Text>
        </View>
      )
    }

    case 'bar': {
      const percent = element.barPercent ?? 0
      const fillWidth = `${percent * Math.min(1, enterT)}%` as `${number}%`
      const fillColor = (mergedStyle as any).color || '#6366f1'
      return (
        <View style={{ ...animStyle, overflow: 'hidden', position: 'relative' }}>
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: fillWidth,
              backgroundColor: fillColor,
              borderRadius: animStyle.borderRadius as number | undefined,
            }}
          />
        </View>
      )
    }

    case 'arc': {
      const angle = element.arcAngle ?? 360
      const r = 40
      const circumference = 2 * Math.PI * r
      const target = (angle / 360) * circumference
      const offset = circumference - target * Math.min(1, enterT)
      const strokeColor = (mergedStyle as any).color || '#6366f1'
      return (
        <View style={animStyle}>
          <Svg viewBox="0 0 100 100" width="100%" height="100%">
            {/* Background circle */}
            <Circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={6}
            />
            {/* Animated arc */}
            <Circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={strokeColor}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={offset}
              rotation={-90}
              origin="50, 50"
            />
          </Svg>
        </View>
      )
    }

    case 'line':
      return (
        <View
          style={{
            ...animStyle,
            width: animStyle.width ?? '100%',
            height: animStyle.height ?? 2,
          }}
        />
      )

    case 'group': {
      const layoutStyle: ViewStyle = { ...animStyle }
      const layout = element.layout ?? 'flex-column'

      if (layout === 'flex-row') {
        layoutStyle.flexDirection = 'row'
      } else if (layout === 'flex-column') {
        layoutStyle.flexDirection = 'column'
      } else if (layout === 'grid') {
        // Approximate grid with flex-wrap
        layoutStyle.flexDirection = 'row'
        layoutStyle.flexWrap = 'wrap'
      } else if (layout === 'absolute') {
        layoutStyle.position = 'relative'
      }

      if (element.gap != null) {
        layoutStyle.gap = typeof element.gap === 'number'
          ? element.gap
          : parseFloat(element.gap) || 0
      }

      return (
        <View style={layoutStyle}>
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
        </View>
      )
    }

    default:
      return <View style={animStyle} />
  }
}
