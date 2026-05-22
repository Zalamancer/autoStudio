import React, { useState, useCallback } from 'react'
import { View, Pressable, Text, StyleSheet, ScrollView } from 'react-native'

export type PanelId = 'timeline' | 'library' | 'characters' | 'layers' | 'background' | 'gallery' | 'config'

interface PanelTab {
  id: PanelId
  label: string
  icon: string
}

const PANEL_TABS: PanelTab[] = [
  { id: 'config', label: 'Config', icon: '\u2699' },
  { id: 'timeline', label: 'Timeline', icon: '\u23F5' },
  { id: 'layers', label: 'Layers', icon: '\u25A4' },
  { id: 'library', label: 'Library', icon: '\u1F4C1' },
  { id: 'characters', label: 'Characters', icon: '\u263A' },
  { id: 'background', label: 'BG', icon: '\u25A3' },
  { id: 'gallery', label: 'Gallery', icon: '\u25A6' },
]

interface PanelSwitcherProps {
  activePanel: PanelId
  onPanelChange: (panel: PanelId) => void
}

export function PanelSwitcher({ activePanel, onPanelChange }: PanelSwitcherProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {PANEL_TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activePanel === tab.id && styles.tabActive]}
            onPress={() => onPanelChange(tab.id)}
          >
            <Text style={[styles.tabIcon, activePanel === tab.id && styles.tabIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabLabel, activePanel === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tabsContent: {
    paddingHorizontal: 4,
    gap: 2,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 56,
  },
  tabActive: {
    backgroundColor: '#1e1b4b',
  },
  tabIcon: {
    fontSize: 18,
    color: '#666',
  },
  tabIconActive: {
    color: '#6366f1',
  },
  tabLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
})
