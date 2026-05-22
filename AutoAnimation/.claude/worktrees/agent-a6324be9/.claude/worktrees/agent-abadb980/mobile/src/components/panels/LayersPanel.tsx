import React, { useState, useCallback } from 'react'
import {
  View, Text, Pressable, FlatList, StyleSheet,
} from 'react-native'

type LayerType = 'character' | 'video' | 'image' | 'animation' | 'text' | 'shape' | 'audio' | 'html-template'

interface Layer {
  id: string
  name: string
  type: LayerType
  visible: boolean
  locked: boolean
  zIndex: number
  children?: Layer[]
}

const TYPE_ICONS: Record<LayerType, string> = {
  character: '\u263A',
  video: '\u{1F3AC}',
  image: '\u{1F5BC}',
  animation: '\u2728',
  text: 'T',
  shape: '\u25CF',
  audio: '\u266B',
  'html-template': '\u{1F4BB}',
}

const TYPE_COLORS: Record<LayerType, string> = {
  character: '#6366f1',
  video: '#22c55e',
  image: '#f59e0b',
  animation: '#8b5cf6',
  text: '#f97316',
  shape: '#ec4899',
  audio: '#ef4444',
  'html-template': '#06b6d4',
}

// Demo layers — mirrors web LayersPanel structure
const DEMO_LAYERS: Layer[] = [
  { id: '1', name: 'Main Character', type: 'character', visible: true, locked: false, zIndex: 5 },
  { id: '2', name: 'Title Text', type: 'text', visible: true, locked: false, zIndex: 4 },
  { id: '3', name: 'Motion Template', type: 'html-template', visible: true, locked: false, zIndex: 3 },
  { id: '4', name: 'Background Image', type: 'image', visible: true, locked: true, zIndex: 2 },
  { id: '5', name: 'Circle Shape', type: 'shape', visible: true, locked: false, zIndex: 1 },
  { id: '6', name: 'Background Music', type: 'audio', visible: true, locked: false, zIndex: 0 },
]

export function LayersPanel() {
  const [layers, setLayers] = useState<Layer[]>(DEMO_LAYERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggleVisibility = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    )
  }, [])

  const toggleLock = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
    )
  }, [])

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const renderLayer = useCallback(({ item, index }: { item: Layer; index: number }) => (
    <Pressable
      style={[styles.layerRow, selectedId === item.id && styles.layerRowSelected]}
      onPress={() => setSelectedId(item.id)}
      onLongPress={() => {/* drag-to-reorder would go here */}}
    >
      {/* Drag handle */}
      <Text style={styles.dragHandle}>{'\u2630'}</Text>

      {/* Type icon */}
      <View style={[styles.typeIcon, { backgroundColor: TYPE_COLORS[item.type] + '22' }]}>
        <Text style={[styles.typeIconText, { color: TYPE_COLORS[item.type] }]}>
          {TYPE_ICONS[item.type]}
        </Text>
      </View>

      {/* Name */}
      <Text style={styles.layerName} numberOfLines={1}>{item.name}</Text>

      {/* Actions */}
      <Pressable style={styles.actionBtn} onPress={() => toggleVisibility(item.id)}>
        <Text style={[styles.actionIcon, !item.visible && styles.actionIconDim]}>
          {item.visible ? '\u{1F441}' : '\u{1F441}\u200D\u{1F5E8}'}
        </Text>
      </Pressable>
      <Pressable style={styles.actionBtn} onPress={() => toggleLock(item.id)}>
        <Text style={[styles.actionIcon, item.locked && styles.actionIconActive]}>
          {item.locked ? '\u{1F512}' : '\u{1F513}'}
        </Text>
      </Pressable>
      <Pressable style={styles.actionBtn} onPress={() => removeLayer(item.id)}>
        <Text style={styles.deleteIcon}>{'\u2715'}</Text>
      </Pressable>
    </Pressable>
  ), [selectedId, toggleVisibility, toggleLock, removeLayer])

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Layers</Text>
        <Text style={styles.count}>{layers.length}</Text>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.addGroupBtn}>
          <Text style={styles.addGroupText}>{'\u{1F4C1}'} Group</Text>
        </Pressable>
        <Pressable style={styles.addLayerBtn}>
          <Text style={styles.addLayerText}>+ Add</Text>
        </Pressable>
      </View>

      {/* Layer list */}
      <FlatList
        data={layers}
        keyExtractor={(item) => item.id}
        renderItem={renderLayer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No layers</Text>
            <Text style={styles.emptySubtext}>Add elements to the canvas</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  title: { color: '#fff', fontSize: 15, fontWeight: '600' },
  count: { color: '#666', fontSize: 13, backgroundColor: '#1a1a1a', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  addGroupBtn: { backgroundColor: '#1a1a1a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  addGroupText: { color: '#999', fontSize: 12 },
  addLayerBtn: { backgroundColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addLayerText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  layerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 8, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  layerRowSelected: { backgroundColor: '#1e1b4b' },
  dragHandle: { color: '#333', fontSize: 14, width: 20, textAlign: 'center' },
  typeIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  typeIconText: { fontSize: 16 },
  layerName: { flex: 1, color: '#ddd', fontSize: 13 },
  actionBtn: { padding: 6 },
  actionIcon: { fontSize: 14 },
  actionIconDim: { opacity: 0.3 },
  actionIconActive: { opacity: 1 },
  deleteIcon: { color: '#ef4444', fontSize: 12, opacity: 0.6 },
  empty: { padding: 48, alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#666', fontSize: 13, marginTop: 4 },
})
