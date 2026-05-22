import React, { useState, useMemo, useCallback } from 'react'
import {
  View, Text, Pressable, TextInput, FlatList, StyleSheet,
  useWindowDimensions,
} from 'react-native'
import {
  BUNDLED_TEMPLATES,
  CATEGORIES,
  searchTemplates,
  getTemplatesByCategory,
  getFeaturedTemplates,
  type BundledTemplate,
} from '../../data/templates'

// Style families matching web MotionGalleryPanel
const STYLE_FAMILIES = [
  { id: 'all', label: 'All Styles' },
  { id: 'clean', label: 'Clean' },
  { id: 'bold', label: 'Bold' },
  { id: 'glitchy', label: 'Glitchy' },
  { id: 'retro', label: 'Retro' },
  { id: 'artsy', label: 'Artsy' },
  { id: 'trippy', label: 'Trippy' },
  { id: 'cinematic', label: 'Cinematic' },
]

interface MotionGalleryPanelProps {
  onSelectTemplate?: (template: BundledTemplate) => void
}

export function MotionGalleryPanel({ onSelectTemplate }: MotionGalleryPanelProps) {
  const { width } = useWindowDimensions()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStyle, setSelectedStyle] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filtered = useMemo(() => {
    let results: BundledTemplate[]

    if (search.trim()) {
      results = searchTemplates(search)
    } else if (selectedCategory !== 'all') {
      results = getTemplatesByCategory(selectedCategory)
    } else {
      const featured = getFeaturedTemplates()
      const featuredIds = new Set(featured.map((t) => t.id))
      const rest = BUNDLED_TEMPLATES.filter((t) => !featuredIds.has(t.id))
      results = [...featured, ...rest]
    }

    // Filter by style tag if applicable
    if (selectedStyle !== 'all') {
      results = results.filter((t) =>
        t.tags.some((tag) => tag.toLowerCase().includes(selectedStyle))
      )
    }

    return results
  }, [search, selectedCategory, selectedStyle])

  const numColumns = viewMode === 'grid' ? 2 : 1
  const cardWidth = viewMode === 'grid' ? (width - 36) / 2 : width - 24

  const renderGridItem = useCallback(({ item }: { item: BundledTemplate }) => (
    <Pressable
      style={[styles.gridCard, { width: cardWidth }]}
      onPress={() => onSelectTemplate?.(item)}
    >
      <View style={styles.gridThumb}>
        <Text style={styles.gridThumbText}>{item.title.charAt(0)}</Text>
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.gridCategory}>{item.category}</Text>
        {item.featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>{'\u2605'} Featured</Text>
          </View>
        )}
      </View>
    </Pressable>
  ), [cardWidth, onSelectTemplate])

  const renderListItem = useCallback(({ item }: { item: BundledTemplate }) => (
    <Pressable
      style={styles.listCard}
      onPress={() => onSelectTemplate?.(item)}
    >
      <View style={styles.listThumb}>
        <Text style={styles.listThumbText}>{item.title.charAt(0)}</Text>
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.listDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.tagRow}>
          {item.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      {item.featured && (
        <Text style={styles.starIcon}>{'\u2605'}</Text>
      )}
    </Pressable>
  ), [onSelectTemplate])

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search templates..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
        />
        <Pressable onPress={() => setViewMode((v) => (v === 'grid' ? 'list' : 'grid'))}>
          <Text style={styles.viewToggle}>{viewMode === 'grid' ? '\u2630' : '\u25A6'}</Text>
        </Pressable>
      </View>

      {/* Style families */}
      <FlatList
        horizontal
        data={STYLE_FAMILIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.styleList}
        contentContainerStyle={styles.styleContent}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.styleChip, selectedStyle === item.id && styles.styleChipActive]}
            onPress={() => setSelectedStyle(item.id)}
          >
            <Text style={[styles.styleText, selectedStyle === item.id && styles.styleTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {/* Category chips */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryContent}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {/* Results count */}
      <Text style={styles.resultCount}>{filtered.length} templates</Text>

      {/* Template grid/list */}
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
            <Text style={styles.emptyText}>No templates found</Text>
            <Text style={styles.emptySubtext}>Try different search or filters</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, gap: 8,
  },
  searchInput: {
    flex: 1, backgroundColor: '#1a1a1a', color: '#fff',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    fontSize: 14, borderWidth: 1, borderColor: '#222',
  },
  viewToggle: { color: '#666', fontSize: 20, padding: 4 },
  styleList: { maxHeight: 36 },
  styleContent: { paddingHorizontal: 12, gap: 6 },
  styleChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#222',
  },
  styleChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  styleText: { color: '#999', fontSize: 12 },
  styleTextActive: { color: '#fff', fontWeight: '600' },
  categoryList: { maxHeight: 36, marginTop: 6 },
  categoryContent: { paddingHorizontal: 12, gap: 6 },
  categoryChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  categoryChipActive: { backgroundColor: '#4f46e5' },
  categoryText: { color: '#999', fontSize: 12 },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  resultCount: { color: '#666', fontSize: 12, paddingHorizontal: 12, paddingVertical: 6 },
  listContent: { paddingHorizontal: 12, paddingBottom: 12 },
  // Grid
  gridCard: {
    marginBottom: 12, marginRight: 8, borderRadius: 10,
    backgroundColor: '#1a1a1a', overflow: 'hidden',
    borderWidth: 1, borderColor: '#222',
  },
  gridThumb: {
    aspectRatio: 16 / 9, backgroundColor: '#111',
    justifyContent: 'center', alignItems: 'center',
  },
  gridThumbText: { color: '#333', fontSize: 32, fontWeight: '700' },
  gridInfo: { padding: 8 },
  gridTitle: { color: '#fff', fontSize: 13, fontWeight: '600' },
  gridCategory: { color: '#666', fontSize: 11, marginTop: 2 },
  featuredBadge: {
    marginTop: 4, backgroundColor: '#f59e0b22',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start',
  },
  featuredText: { color: '#f59e0b', fontSize: 10, fontWeight: '600' },
  // List
  listCard: {
    flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 10,
    padding: 10, marginBottom: 8, gap: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#222',
  },
  listThumb: {
    width: 56, height: 56, borderRadius: 8, backgroundColor: '#111',
    justifyContent: 'center', alignItems: 'center',
  },
  listThumbText: { color: '#333', fontSize: 24, fontWeight: '700' },
  listInfo: { flex: 1 },
  listTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  listDesc: { color: '#666', fontSize: 12, marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  tag: { backgroundColor: '#222', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  tagText: { color: '#999', fontSize: 10 },
  starIcon: { color: '#f59e0b', fontSize: 18 },
  empty: { padding: 48, alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#666', fontSize: 13, marginTop: 4 },
})
