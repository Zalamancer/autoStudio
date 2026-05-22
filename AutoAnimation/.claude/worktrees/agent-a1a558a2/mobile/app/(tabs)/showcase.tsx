import React, { useState, useCallback, useMemo, useRef } from 'react'
import {
  View, FlatList, TextInput, Text, Pressable, StyleSheet,
  useWindowDimensions, type ViewToken,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../src/stores/useAuthStore'
import { useEditorStore } from '../../src/stores/useEditorStore'
import { ShowcaseCard } from '../../src/components/ShowcaseCard'
import {
  BUNDLED_TEMPLATES,
  CATEGORIES,
  getFeaturedTemplates,
  searchTemplates,
  getTemplatesByCategory,
  type BundledTemplate,
} from '../../src/data/templates'

export default function ShowcaseScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { height: screenHeight } = useWindowDimensions()
  const CARD_HEIGHT = screenHeight * 0.85

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())

  const filteredTemplates = useMemo(() => {
    let results: BundledTemplate[]

    if (searchQuery.trim()) {
      results = searchTemplates(searchQuery)
    } else if (selectedCategory && selectedCategory !== 'all') {
      results = getTemplatesByCategory(selectedCategory)
    } else {
      // Featured first, then rest
      const featured = getFeaturedTemplates()
      const featuredIds = new Set(featured.map(t => t.id))
      const rest = BUNDLED_TEMPLATES.filter(t => !featuredIds.has(t.id))
      results = [...featured, ...rest]
    }

    return results
  }, [selectedCategory, searchQuery])

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids = new Set(
        viewableItems
          .filter(item => item.isViewable)
          .map(item => (item.item as BundledTemplate).id)
      )
      setVisibleIds(ids)
    }
  ).current

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current

  const handleUseTemplate = useCallback((template: BundledTemplate) => {
    // Load into editor store directly
    useEditorStore.setState({
      templateId: template.id,
      template: {
        id: template.id,
        title: template.title,
        description: template.description,
        category: template.category,
        tags: template.tags,
        thumbnailUrl: null,
        configSchema: template.configSchema,
        defaultConfig: template.defaultConfig,
        motionDesignDescription: template.motionDesignDescription as unknown as Record<string, unknown>,
      } as any,
      description: template.motionDesignDescription,
      config: { ...template.defaultConfig },
      loading: false,
      error: null,
      projectId: null,
    })

    if (!user) {
      router.push('/(auth)/login')
    } else {
      router.push(`/editor/${template.id}`)
    }
  }, [user, router])

  const renderItem = useCallback(({ item }: { item: BundledTemplate }) => (
    <ShowcaseCard
      template={item}
      isVisible={visibleIds.has(item.id)}
      onUseTemplate={() => handleUseTemplate(item)}
      cardHeight={CARD_HEIGHT}
    />
  ), [visibleIds, handleUseTemplate, CARD_HEIGHT])

  const renderCategoryChips = useCallback(() => (
    <View style={styles.headerContainer}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search templates..."
        placeholderTextColor="#555"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryContent}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.categoryChip,
              selectedCategory === item.id && styles.categoryActive,
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === item.id && styles.categoryActiveText,
            ]}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />
    </View>
  ), [searchQuery, selectedCategory])

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        snapToInterval={CARD_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        windowSize={3}
        maxToRenderPerBatch={2}
        ListHeaderComponent={renderCategoryChips}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No templates found</Text>
            <Text style={styles.emptySubtext}>Try a different search or category</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  headerContainer: {
    backgroundColor: '#0a0a0a',
    paddingBottom: 8,
  },
  searchBar: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    margin: 12,
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  categoryList: {
    maxHeight: 44,
    marginBottom: 4,
  },
  categoryContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryText: {
    color: '#999',
    fontSize: 13,
  },
  categoryActiveText: {
    color: '#fff',
  },
  emptyContainer: {
    padding: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
})
