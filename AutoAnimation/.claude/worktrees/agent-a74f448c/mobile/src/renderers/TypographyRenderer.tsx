/**
 * TypographyRenderer — React Native port of TypographyTextRenderer.
 *
 * Renders per-character/word text animation using computeUnitStyle from
 * @proanimate/core. Each text unit gets its own opacity, transform, and
 * typographic properties.
 */

import React from 'react'
import { View, Text, type ViewStyle, type TextStyle } from 'react-native'
import {
  splitText,
  computeUnitStyle,
  type TypographyAnimationConfig,
} from '@proanimate/core'
import { resolveFont } from '../services/fontMapper'

export interface TypographyRendererProps {
  text: string
  baseStyle: ViewStyle & TextStyle
  progress: number
  config: TypographyAnimationConfig
}

export function TypographyRenderer({
  text,
  baseStyle,
  progress,
  config,
}: TypographyRendererProps) {
  const units = splitText(text, config.splitMode)
  const totalUnits = units.length

  // Separate container (View) styles from text styles
  const {
    color,
    fontSize,
    fontWeight: baseFontWeight,
    fontFamily,
    textAlign,
    letterSpacing: baseLetterSpacing,
    lineHeight,
    textTransform,
    // Pull out View-only styles for the container
    ...containerStyle
  } = baseStyle as ViewStyle & TextStyle

  const resolvedFontFamily = fontFamily ? resolveFont(fontFamily) : undefined

  return (
    <View style={{ ...containerStyle, flexDirection: 'row', flexWrap: 'wrap' }}>
      {units.map((unit, i) => {
        const unitStyle = computeUnitStyle(i, totalUnits, progress, config)

        // Build transform array for this unit
        const unitTransform: ViewStyle['transform'] = []
        if (unitStyle.x !== 0) unitTransform.push({ translateX: unitStyle.x })
        if (unitStyle.y !== 0) unitTransform.push({ translateY: unitStyle.y })
        if (unitStyle.scale !== 1) {
          unitTransform.push({ scaleX: unitStyle.scale })
          unitTransform.push({ scaleY: unitStyle.scale })
        }
        if (unitStyle.rotation !== 0) {
          unitTransform.push({ rotate: `${unitStyle.rotation}deg` })
        }

        const unitTextStyle: TextStyle = {
          color,
          fontSize,
          fontFamily: resolvedFontFamily,
          textAlign,
          lineHeight,
          textTransform,
          // Per-unit overrides
          opacity: unitStyle.opacity,
          fontWeight: unitStyle.fontWeight !== 400
            ? (String(unitStyle.fontWeight) as TextStyle['fontWeight'])
            : baseFontWeight,
          letterSpacing: unitStyle.letterSpacing !== 0
            ? unitStyle.letterSpacing
            : baseLetterSpacing,
        }

        // Whitespace handling: preserve spaces
        const displayUnit = unit === ' ' ? ' ' : unit

        return (
          <View
            key={i}
            style={{
              transform: unitTransform.length > 0 ? unitTransform : undefined,
            }}
          >
            <Text style={unitTextStyle}>{displayUnit}</Text>
          </View>
        )
      })}
    </View>
  )
}
