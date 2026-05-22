import React, { useState, useCallback, useEffect } from 'react'
import { View, Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native'
import { type MotionDesignDescription } from '@proanimate/core'
import { DynamicRenderer } from '../renderers/DynamicRenderer'

export interface AnimationPreviewProps {
  description: MotionDesignDescription
  config: Record<string, unknown>
  durationMs?: number
}

export function AnimationPreview({
  description,
  config,
  durationMs = 4000,
}: AnimationPreviewProps) {
  const { width: screenWidth } = useWindowDimensions()
  const previewWidth = screenWidth - 32
  const previewHeight = previewWidth * (9 / 16)

  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(true)

  // Simple JS interval-based driver (no Reanimated worklet issues)
  useEffect(() => {
    if (!playing) return
    const startTime = Date.now() - progress * durationMs
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      setProgress((elapsed % durationMs) / durationMs)
    }, 33) // ~30fps
    return () => clearInterval(interval)
  }, [playing, durationMs])

  const handleToggle = useCallback(() => {
    setPlaying(p => !p)
  }, [])

  const handleRestart = useCallback(() => {
    setProgress(0)
    setPlaying(true)
  }, [])

  return (
    <View style={styles.container}>
      <View style={[styles.previewContainer, { width: previewWidth, height: previewHeight }]}>
        <DynamicRenderer
          description={description}
          config={config}
          progress={progress}
          width={previewWidth}
          height={previewHeight}
        />
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={handleToggle}>
          <Text style={styles.buttonText}>{playing ? 'Pause' : 'Play'}</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleRestart}>
          <Text style={styles.buttonText}>Restart</Text>
        </Pressable>
        <Text style={styles.progressText}>{(progress * 100).toFixed(0)}%</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  previewContainer: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  button: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#333', borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  progressText: { color: '#888', fontSize: 14, fontFamily: 'monospace', minWidth: 40, textAlign: 'right' },
})
