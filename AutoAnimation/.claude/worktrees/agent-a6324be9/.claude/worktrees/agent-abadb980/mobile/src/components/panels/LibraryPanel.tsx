import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, Pressable, TextInput, FlatList, StyleSheet,
  useWindowDimensions, Image,
} from 'react-native'

type MediaCategory = 'all' | 'images' | 'video' | 'audio'

interface MediaAsset {
  id: string
  name: string
  type: 'image' | 'video' | 'audio'
  thumbnailUrl: string | null
  size: string
  duration?: string
}

const CATEGORY_TABS: { id: MediaCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '\u25A6' },
  { id: 'images', label: 'Images', icon: '\u{1F5BC}' },
  { id: 'video', label: 'Video', icon: '\u{1F3AC}' },
  { id: 'audio', label: 'Audio', icon: '\u266B' },
]

// Demo assets — will be replaced with store/API connection
const DEMO_ASSETS: MediaAsset[] = [
  { id: '1', name: 'Background.jpg', type: 'image', thumbnailUrl: null, size: '2.4 MB' },
  { id: '2', name: 'Logo.png', type: 'image', thumbnailUrl: null, size: '340 KB' },
  { id: '3', name: 'Intro.mp4', type: 'video', thumbnailUrl: null, size: '12.8 MB', duration: '0:15' },
  { id: '4', name: 'BGM.mp3', type: 'audio', thumbnailUrl: null, size: '4.2 MB', duration: '3:24' },
  { id: '5', name: 'Overlay.png', type: 'image', thumbnailUrl: null, size: '890 KB' },
  { id: '6', name: 'SFX_Click.wav', type: 'audio', thumbnailUrl: null, size: '120 KB', duration: '0:01' },
]

const TYPE_ICONS: Record<string, string> = {
  image: '\u{1F5BC}',
  video: '\u{1F3AC}',
  audio: '\u266B',
}

const TYPE_COLORS: Record<string, string> = {
  image: '#22c55e',
  video: '#6366f1',
  audio: '#ef4444',
}

export function LibraryPanel() {
  const { width } = useWindowDimensions()
  const [category, setCategory] = useState<MediaCategory>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filtered = useMemo(() => {
    let results = DEMO_ASSETS
    if (category !== 'all') {
      const typeMap: Record<string, string> = { images: 'image', video: 'video', audio: 'audio' }
      results = results.filter((a) => a.type === typeMap[category])
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter((a) => a.name.toLowerCase().includes(q))
    }
    return results
  }, [category, search])

  const numColumns = viewMode === 'grid' ? 3 : 1
  const itemWidth = viewMode === 'grid' ? (width - 48) / 3 : width - 24

  const renderGridItem = useCallback(({ item }: { item: MediaAsset }) => (
    <Pressable style={[styles.gridItem, { width: itemWidth }]}>
      <View style={[styles.gridThumb, { backgroundColor: TYPE_COLORS[item.type] + '22' }]}>
        <Text style={[styles.gridThumbIcon, { color: TYPE_COLORS[item.type] }]}>
          {TYPE_ICONS[item.type]}
        </Text>
      </View>
      <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.gridSize}>{item.size}</Text>
    </Pressable>
  ), [itemWidth])

  const renderListItem = useCallback(({ item }: { item: MediaAsset }) => (
    <Pressable style={styles.listItem}>
      <View style={[styles.listThumb, { backgroundColor: TYPE_COLORS[item.type] + '22' }]}>
        <Text style={[styles.listThumbIcon, { color: TYPE_COLORS[item.type] }]}>
          {TYPE_ICONS[item.type]}
        </Text>
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.listMeta}>
          {item.size}{item.duration ? ` \u00B7 ${item.duration}` : ''}
        </Text>
      </View>
    </Pressable>
  ), [])

  return (
    <View style={styles.container}>
      {/* Search + Upload */}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search media..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
        />
        <Pressable style={styles.uploadBtn}>
          <Text style={styles.uploadText}>+ Upload</Text>
        </Pressable>
      </View>

      {/* Category tabs */}
      <View style={styles.categoryRow}>
        {CATEGORY_TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.categoryTab, category === tab.id && styles.categoryTabActive]}
            onPress={() => setCategory(tab.id)}
          >
            <Text style={[styles.categoryLabel, category === tab.id && styles.categoryLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => setViewMode((v) => (v === 'grid' ? 'list' : 'grid'))}>
          <Text style={styles.viewToggle}>{viewMode === 'grid' ? '\u2630' : '\u25A6'}</Text>
        </Pressable>
      </View>

      {/* Asset grid/list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        key={viewMode}
        numColumns={numColumns}
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No media found</Text>
            <Text style={styles.emptySubtext}>Upload files or search Pixabay</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#222',
  },
  uploadBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  uploadText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  categoryTabActive: { backgroundColor: '#6366f1' },
  categoryLabel: { color: '#999', fontSize: 12 },
  categoryLabelActive: { color: '#fff', fontWeight: '600' },
  viewToggle: { color: '#666', fontSize: 18, padding: 4 },
  listContent: { paddingHorizontal: 12, paddingBottom: 12 },
  // Grid
  gridItem: {
    marginBottom: 12,
    marginRight: 8,
  },
  gridThumb: {
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  gridThumbIcon: { fontSize: 28 },
  gridName: { color: '#ccc', fontSize: 11, marginTop: 4 },
  gridSize: { color: '#666', fontSize: 10 },
  // List
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    gap: 10,
  },
  listThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listThumbIcon: { fontSize: 20 },
  listInfo: { flex: 1 },
  listName: { color: '#fff', fontSize: 14 },
  listMeta: { color: '#666', fontSize: 12, marginTop: 2 },
  empty: { padding: 48, alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#666', fontSize: 13, marginTop: 4 },
})
