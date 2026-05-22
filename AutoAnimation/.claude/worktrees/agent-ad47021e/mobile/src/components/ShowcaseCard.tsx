import React from 'react'
import {
  View, Text, Pressable, StyleSheet,
} from 'react-native'

interface ShowcaseCardProps {
  template: {
    id: string
    title: string
    description?: string
    category: string
    tags?: string[]
    defaultConfig: Record<string, unknown>
    motionDesignDescription: any
  }
  isVisible: boolean
  onUseTemplate: () => void
  cardHeight: number
}

export function ShowcaseCard({
  template,
  onUseTemplate,
  cardHeight,
}: ShowcaseCardProps) {
  const bgColor = (template.defaultConfig?.bgColor as string) || '#111'
  const textColor = (template.defaultConfig?.textColor as string) || '#fff'
  const word = (template.defaultConfig?.word as string) || template.title

  return (
    <View style={[styles.card, { height: cardHeight, backgroundColor: bgColor }]}>
      {/* Visual preview area */}
      <View style={styles.previewArea}>
        <Text style={[styles.previewText, { color: textColor }]}>{word}</Text>
      </View>

      {/* Info overlay */}
      <View style={styles.overlay}>
        <View style={styles.infoSection}>
          <Text style={styles.title}>{template.title}</Text>
          <Text style={styles.category}>{template.category.replace(/-/g, ' ')}</Text>
          {template.tags && template.tags.length > 0 && (
            <View style={styles.tagRow}>
              {template.tags.slice(0, 4).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Pressable style={styles.useButton} onPress={onUseTemplate}>
          <Text style={styles.useButtonText}>Use Template</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  previewArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  previewText: {
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  infoSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  category: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    color: '#ccc',
    fontSize: 11,
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
