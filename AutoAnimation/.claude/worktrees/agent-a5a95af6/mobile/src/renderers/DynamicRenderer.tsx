/**
 * DynamicRenderer — top-level component that takes a MotionDesignDescription,
 * config, and progress (0-1) and renders the full animated scene.
 *
 * This is the React Native equivalent of DynamicMotionDesignRenderer from web.
 */

import React from 'react'
import { View, type ViewStyle } from 'react-native'
import { interpolateConfig, type MotionDesignDescription } from '@proanimate/core'
import { ElementRenderer } from './ElementRenderer'

export interface DynamicRendererProps {
  description: MotionDesignDescription
  config: Record<string, unknown>
  progress: number
  width: number
  height: number
}

export function DynamicRenderer({
  description,
  config,
  progress,
  width,
  height,
}: DynamicRendererProps) {
  const bg = interpolateConfig(description.background, config)
  const enterDuration = description.enterDuration ?? 0.2
  const exitDuration = description.exitDuration ?? 0.2

  const containerStyle: ViewStyle = {
    width,
    height,
    overflow: 'hidden',
    // Gradients not supported natively — fall back to solid color
    backgroundColor: bg.includes('gradient') ? '#000' : bg,
  }

  return (
    <View style={containerStyle}>
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
    </View>
  )
}
