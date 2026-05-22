import React from 'react'
import { View, Text, Pressable, Image, StyleSheet, type ViewStyle } from 'react-native'

interface TemplateCardProps {
  id: string
  title: string
  category: string
  thumbnailUrl: string | null
  onPress: () => void
  style?: ViewStyle
}

export function TemplateCard({ title, category, thumbnailUrl, onPress, style }: TemplateCardProps) {
  return (
    <Pressable style={[styles.card, style]} onPress={onPress}>
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{title.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.category}>{category}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#222',
  },
  placeholder: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#1e1e3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#6366f1',
  },
  info: {
    padding: 10,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  category: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
})
