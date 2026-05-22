import React, { useState, useCallback } from 'react'
import {
  View, Text, Pressable, StyleSheet, useWindowDimensions,
} from 'react-native'
import { useFrameCallback, runOnJS } from 'react-native-reanimated'
import { type MotionDesignDescription } from '@proanimate/core'
import { DynamicRenderer } from '../renderers/DynamicRenderer'
import { useAnimationDriver } from '../hooks/useAnimationDriver'

interface ShowcaseCardProps {
  template: {
    id: string
    title: string
    category: string
    defaultConfig: Record<string, unknown>
    motionDesignDescription: MotionDesignDescription
  }
  isVisible: boolean
  onUseTemplate: () => void
  cardHeight: number
}

export function ShowcaseCard({
  template,
  isVisible,
  onUseTemplate,
  cardHeight,
}: ShowcaseCardProps) {
  const { width: screenWidth } = useWindowDimensions()

  // Only run animation when card is visible
  const { progress: sharedProgress } = useAnimationDriver({
    durationMs: 5000,
    loop: true,
    autoPlay: isVisible,
  })

  const [progress, setProgress] = useState(0)

  useFrameCallback(() => {
    'worklet'
    if (isVisible) {
      runOnJS(setProgress)(sharedProgress.value)
    }
  })

  return (
    <View style={[styles.card, { height: cardHeight }]}>
      {/* Live animation */}
      <View style={styles.animationContainer}>
        {isVisible ? (
          <DynamicRenderer
            description={template.motionDesignDescription}
            config={template.defaultConfig}
            progress={progress}
            width={screenWidth}
            height={cardHeight - 100}
          />
        ) : (
          <View style={[styles.placeholder, {
            backgroundColor: template.motionDesignDescription.background?.includes('gradient')
              ? '#111'
              : (template.defaultConfig.bgColor as string) || '#111',
          }]} />
        )}
      </View>

      {/* Overlay info */}
      <View style={styles.overlay}>
        <View style={styles.infoRow}>
          <View>
            <Text style={styles.title}>{template.title}</Text>
            <Text style={styles.category}>{template.category.replace(/-/g, ' ')}</Text>
          </View>
          <Pressable style={styles.useButton} onPress={onUseTemplate}>
            <Text style={styles.useButtonText}>Use Template</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#000',
  },
  animationContainer: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  category: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  useButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  useButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
})
