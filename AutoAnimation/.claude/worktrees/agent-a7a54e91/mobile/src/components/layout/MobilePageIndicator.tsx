import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'

const PAGE_LABELS = ['Menu', 'Tools', 'Canvas', 'Properties']

interface MobilePageIndicatorProps {
  activePage: number
  onPageSelect: (page: number) => void
}

export function MobilePageIndicator({ activePage, onPageSelect }: MobilePageIndicatorProps) {
  return (
    <View style={styles.container}>
      {PAGE_LABELS.map((label, i) => (
        <Pressable key={label} style={styles.item} onPress={() => onPageSelect(i)}>
          <View style={[styles.dot, i === activePage && styles.dotActive]} />
          <Text style={[styles.label, i === activePage && styles.labelActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 8,
    backgroundColor: '#09090b',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  item: { alignItems: 'center', gap: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#52525b' },
  dotActive: { backgroundColor: '#22c55e', transform: [{ scale: 1.25 }] },
  label: { fontSize: 9, color: '#52525b' },
  labelActive: { color: '#4ade80' },
})
