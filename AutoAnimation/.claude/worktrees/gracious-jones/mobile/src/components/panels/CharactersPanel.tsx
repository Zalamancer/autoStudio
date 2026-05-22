import React, { useState, useCallback } from 'react'
import {
  View, Text, Pressable, FlatList, StyleSheet, TextInput,
} from 'react-native'

type CharacterType = '2D' | '3D' | 'Avatar' | 'Pixel'

interface Character {
  id: string
  name: string
  type: CharacterType
  emotion: string
  thumbnailColor: string
}

const TYPE_COLORS: Record<CharacterType, string> = {
  '2D': '#6366f1',
  '3D': '#22c55e',
  'Avatar': '#f59e0b',
  'Pixel': '#ec4899',
}

const TYPE_TABS: { id: CharacterType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: '2D', label: '2D' },
  { id: '3D', label: '3D' },
  { id: 'Avatar', label: 'Avatar' },
  { id: 'Pixel', label: 'Pixel' },
]

const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'thinking', 'excited', 'confused']

// Demo characters — will be replaced with store
const DEMO_CHARACTERS: Character[] = [
  { id: '1', name: 'Alex', type: '2D', emotion: 'neutral', thumbnailColor: '#6366f1' },
  { id: '2', name: 'Maya', type: '2D', emotion: 'happy', thumbnailColor: '#818cf8' },
  { id: '3', name: 'Robot', type: '3D', emotion: 'neutral', thumbnailColor: '#22c55e' },
  { id: '4', name: 'My Avatar', type: 'Avatar', emotion: 'neutral', thumbnailColor: '#f59e0b' },
]

export function CharactersPanel() {
  const [typeFilter, setTypeFilter] = useState<CharacterType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [characters] = useState<Character[]>(DEMO_CHARACTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = characters.filter((c) => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    if (search.trim() && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const renderCharacter = useCallback(({ item }: { item: Character }) => (
    <Pressable
      style={[styles.charCard, selectedId === item.id && styles.charCardSelected]}
      onPress={() => setSelectedId(item.id)}
    >
      <View style={[styles.charAvatar, { backgroundColor: item.thumbnailColor + '33' }]}>
        <Text style={[styles.charAvatarIcon, { color: item.thumbnailColor }]}>
          {item.type === '3D' ? '\u{1F9CA}' : item.type === 'Avatar' ? '\u{1F464}' : item.type === 'Pixel' ? '\u{1F47E}' : '\u263A'}
        </Text>
      </View>
      <View style={styles.charInfo}>
        <Text style={styles.charName}>{item.name}</Text>
        <View style={styles.charMeta}>
          <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.type] + '33' }]}>
            <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[item.type] }]}>
              {item.type}
            </Text>
          </View>
          <Text style={styles.emotionText}>{item.emotion}</Text>
        </View>
      </View>
      <Pressable style={styles.emotionBtn}>
        <Text style={styles.emotionBtnText}>{'\u{1F600}'}</Text>
      </Pressable>
    </Pressable>
  ), [selectedId])

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search characters..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
        />
        <Pressable style={styles.createBtn}>
          <Text style={styles.createText}>+ New</Text>
        </Pressable>
      </View>

      {/* Type filter */}
      <View style={styles.filterRow}>
        {TYPE_TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.filterTab, typeFilter === tab.id && styles.filterTabActive]}
            onPress={() => setTypeFilter(tab.id)}
          >
            <Text style={[styles.filterLabel, typeFilter === tab.id && styles.filterLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Character list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderCharacter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{'\u263A'}</Text>
            <Text style={styles.emptyText}>No characters yet</Text>
            <Text style={styles.emptySubtext}>Create your first character</Text>
            <Pressable style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Create Character</Text>
            </Pressable>
          </View>
        }
      />

      {/* Quick emotion selector (when character is selected) */}
      {selectedId && (
        <View style={styles.emotionBar}>
          <Text style={styles.emotionBarLabel}>Emotion:</Text>
          {EMOTIONS.slice(0, 6).map((e) => (
            <Pressable key={e} style={styles.emotionChip}>
              <Text style={styles.emotionChipText}>{e}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: {
    flex: 1, backgroundColor: '#1a1a1a', color: '#fff',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    fontSize: 14, borderWidth: 1, borderColor: '#222',
  },
  createBtn: { backgroundColor: '#6366f1', paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center' },
  createText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1a1a1a' },
  filterTabActive: { backgroundColor: '#6366f1' },
  filterLabel: { color: '#999', fontSize: 12 },
  filterLabelActive: { color: '#fff', fontWeight: '600' },
  listContent: { paddingHorizontal: 12, paddingBottom: 12 },
  charCard: {
    flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 12,
    padding: 12, marginBottom: 8, alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#222',
  },
  charCardSelected: { borderColor: '#6366f1' },
  charAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  charAvatarIcon: { fontSize: 24 },
  charInfo: { flex: 1 },
  charName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  charMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  emotionText: { color: '#666', fontSize: 12 },
  emotionBtn: { padding: 8 },
  emotionBtnText: { fontSize: 20 },
  emotionBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#222', backgroundColor: '#111',
  },
  emotionBarLabel: { color: '#666', fontSize: 12, marginRight: 4 },
  emotionChip: { backgroundColor: '#1a1a1a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  emotionChipText: { color: '#999', fontSize: 11 },
  empty: { padding: 48, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.3 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#666', fontSize: 13, marginTop: 4, marginBottom: 16 },
  emptyBtn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
})
