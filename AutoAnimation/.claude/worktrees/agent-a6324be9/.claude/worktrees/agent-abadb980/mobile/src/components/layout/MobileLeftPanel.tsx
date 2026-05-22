import React, { useState, useCallback } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'

// Mirror web TAB_GROUPS from src/constants/tabGroups.ts
const TAB_GROUPS = [
  {
    id: 'create', label: 'Characters', icon: '\u2728',
    subTabs: [{ id: 'character', label: 'Characters', description: 'Create & manage characters' }],
  },
  {
    id: 'media', label: 'Library', icon: '\u{1F5BC}',
    subTabs: [{ id: 'media', label: 'Library', description: 'Media assets & stock library' }],
  },
  {
    id: 'audio', label: 'Audio', icon: '\u{1F3B5}',
    subTabs: [
      { id: 'audio-browse', label: 'Browse & SFX', description: 'Browse, search & generate audio' },
      { id: 'voice-clone', label: 'Voice Clone', description: 'Clone & manage custom voices' },
      { id: 'singing', label: 'Singing', description: 'Singing lip sync & audio' },
      { id: 'adaptive-music', label: 'Adaptive Music', description: 'Emotion-driven adaptive music' },
      { id: 'audio-enhancement', label: 'Audio FX', description: 'Audio processing & enhancement' },
      { id: 'beat-sync', label: 'Audio Sync', description: 'Sync animations to audio beats' },
    ],
  },
  {
    id: 'edit', label: 'Edit', icon: '\u{1FA84}',
    subTabs: [
      { id: 'mixed-media', label: 'Mixed Media', description: 'Overlays & style effects' },
      { id: 'animStyle', label: 'Anim Style', description: 'Transfer animation style' },
      { id: 'style-transfer', label: 'Style Transfer', description: 'AI video style transformation' },
      { id: 'transitions', label: 'Transitions', description: 'Scene transition effects' },
      { id: 'cinema-studio', label: 'Cinema', description: 'Camera body, lens & optical controls' },
    ],
  },
  {
    id: 'script', label: 'Script', icon: '\u{1F4DC}',
    subTabs: [
      { id: 'scripts', label: 'Script', description: 'AI-generated scripts & voiceover' },
      { id: 'dialogue', label: 'Dialogue', description: 'Multi-character dialogue editor' },
      { id: 'transcript', label: 'Transcript', description: 'Text-based video editing' },
      { id: 'captions', label: 'Captions', description: 'Auto-synced subtitles & styles' },
    ],
  },
  {
    id: 'design', label: 'Design', icon: '\u{1F3A8}',
    subTabs: [
      { id: 'text', label: 'Text', description: 'Titles, subtitles & text overlays' },
      { id: 'brand-kit', label: 'Brand Kit', description: 'Colors, fonts & brand assets' },
      { id: 'schema', label: 'Schema', description: 'Project variables & bindings' },
      { id: 'assets', label: 'Assets', description: 'Animations, SVG, components & motion designs' },
      { id: 'memes', label: 'Memes', description: 'Meme template generator' },
      { id: 'crowd', label: 'Crowd', description: 'Background crowd generator' },
      { id: 'motion-gallery', label: 'Motion Gallery', description: '800+ motion graphics templates' },
    ],
  },
  {
    id: 'publish', label: 'Publish', icon: '\u{1F4E4}',
    subTabs: [
      { id: 'auto-publish', label: 'Schedule', description: 'Auto-publish & scheduling' },
      { id: 'series', label: 'Series', description: 'Episodic content management' },
      { id: 'competitor-scraper', label: 'Competitors', description: 'Scrape & analyze competitor videos' },
      { id: 'trends', label: 'Trends', description: 'Trending topics & hashtags' },
      { id: 'virality', label: 'Score', description: 'Virality & engagement scoring' },
      { id: 'repurpose', label: 'Repurpose', description: 'Resize & adapt for platforms' },
    ],
  },
]

const CARD_GRID_THRESHOLD = 2

export function MobileLeftPanel() {
  const [activeGroupIndex, setActiveGroupIndex] = useState(0)
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null)
  const [showGroupHome, setShowGroupHome] = useState(true)

  const group = TAB_GROUPS[activeGroupIndex]
  const isLargeGroup = group.subTabs.length > CARD_GRID_THRESHOLD
  const hasSubTabs = group.subTabs.length > 1

  const goPrev = useCallback(() => {
    setActiveGroupIndex((i) => (i - 1 + TAB_GROUPS.length) % TAB_GROUPS.length)
    setShowGroupHome(true)
    setActiveSubTab(null)
  }, [])

  const goNext = useCallback(() => {
    setActiveGroupIndex((i) => (i + 1) % TAB_GROUPS.length)
    setShowGroupHome(true)
    setActiveSubTab(null)
  }, [])

  const selectSubTab = useCallback((subId: string) => {
    setActiveSubTab(subId)
    setShowGroupHome(false)
  }, [])

  return (
    <View style={styles.container}>
      {/* Group-level navigation (< Characters 1/7 >) */}
      <View style={styles.groupNav}>
        <Pressable style={styles.navBtn} onPress={goPrev}>
          <Text style={styles.navIcon}>{'\u276E'}</Text>
        </Pressable>
        <View style={styles.groupTitle}>
          <Text style={styles.groupIcon}>{group.icon}</Text>
          <Text style={styles.groupLabel}>{group.label}</Text>
          <Text style={styles.groupCount}>{activeGroupIndex + 1}/{TAB_GROUPS.length}</Text>
        </View>
        <Pressable style={styles.navBtn} onPress={goNext}>
          <Text style={styles.navIcon}>{'\u276F'}</Text>
        </Pressable>
      </View>

      {/* Sub-tab content */}
      {isLargeGroup && showGroupHome ? (
        /* Card grid for groups with many sub-tabs */
        <ScrollView style={styles.cardGrid} contentContainerStyle={styles.cardGridContent}>
          {group.subTabs.map((sub) => (
            <Pressable key={sub.id} style={styles.card} onPress={() => selectSubTab(sub.id)}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardLabel}>{sub.label}</Text>
                {sub.description && <Text style={styles.cardDesc}>{sub.description}</Text>}
              </View>
              <Text style={styles.cardArrow}>{'\u276F'}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <>
          {/* Drill-down header for large groups */}
          {isLargeGroup && activeSubTab ? (
            <View style={styles.drillHeader}>
              <Pressable style={styles.backBtn} onPress={() => setShowGroupHome(true)}>
                <Text style={styles.backIcon}>{'\u2190'}</Text>
              </Pressable>
              <Text style={styles.drillLabel}>
                {group.subTabs.find((s) => s.id === activeSubTab)?.label}
              </Text>
            </View>
          ) : hasSubTabs ? (
            /* Pill bar for small groups */
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillBar} contentContainerStyle={styles.pillBarContent}>
              {group.subTabs.map((sub) => (
                <Pressable
                  key={sub.id}
                  style={[styles.pill, activeSubTab === sub.id && styles.pillActive]}
                  onPress={() => selectSubTab(sub.id)}
                >
                  <Text style={[styles.pillText, activeSubTab === sub.id && styles.pillTextActive]}>
                    {sub.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {/* Panel placeholder */}
          <View style={styles.panelContent}>
            <Text style={styles.panelPlaceholder}>
              {activeSubTab || group.subTabs[0]?.id || group.id}
            </Text>
            <Text style={styles.panelSubtext}>
              {group.subTabs.find((s) => s.id === (activeSubTab || group.subTabs[0]?.id))?.description || ''}
            </Text>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b' },
  groupNav: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  navBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  navIcon: { color: '#a1a1aa', fontSize: 16 },
  groupTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  groupIcon: { fontSize: 16 },
  groupLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  groupCount: { color: '#52525b', fontSize: 10 },
  // Card grid
  cardGrid: { flex: 1 },
  cardGridContent: { padding: 12, gap: 6 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cardLeft: { flex: 1 },
  cardLabel: { color: '#e4e4e7', fontSize: 13, fontWeight: '500' },
  cardDesc: { color: '#52525b', fontSize: 11, marginTop: 2 },
  cardArrow: { color: '#52525b', fontSize: 14, marginLeft: 8 },
  // Drill-down header
  drillHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 8, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: '#a1a1aa', fontSize: 16 },
  drillLabel: { color: '#e4e4e7', fontSize: 13, fontWeight: '500' },
  // Pill bar
  pillBar: { maxHeight: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  pillBarContent: { paddingHorizontal: 8, paddingVertical: 6, gap: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillActive: { backgroundColor: 'rgba(34,197,94,0.2)' },
  pillText: { color: '#52525b', fontSize: 11, fontWeight: '500' },
  pillTextActive: { color: '#4ade80' },
  // Panel content placeholder
  panelContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  panelPlaceholder: { color: '#52525b', fontSize: 16, fontWeight: '600' },
  panelSubtext: { color: '#3f3f46', fontSize: 12, textAlign: 'center', marginTop: 4 },
})
