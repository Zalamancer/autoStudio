import React, { useState, useCallback } from 'react'
import {
  View, Text, Pressable, TextInput, ScrollView, StyleSheet,
  useWindowDimensions,
} from 'react-native'

type BGType = 'solid' | 'gradient' | 'image' | 'video' | 'transparent'

interface GradientPreset {
  id: string
  name: string
  colors: string[]
  angle: number
}

const BG_TYPES: { id: BGType; label: string; icon: string }[] = [
  { id: 'solid', label: 'Solid', icon: '\u25A0' },
  { id: 'gradient', label: 'Gradient', icon: '\u25C8' },
  { id: 'image', label: 'Image', icon: '\u{1F5BC}' },
  { id: 'video', label: 'Video', icon: '\u{1F3AC}' },
  { id: 'transparent', label: 'None', icon: '\u2B1C' },
]

const SOLID_PRESETS = [
  '#000000', '#111111', '#1a1a2e', '#0f0f23', '#1e1b4b',
  '#0c0a09', '#172554', '#052e16', '#3b0764', '#450a0a',
  '#ffffff', '#f5f5f4', '#e2e8f0', '#fef3c7', '#fce7f3',
  '#dbeafe', '#d1fae5', '#ede9fe', '#fee2e2', '#fef9c3',
]

const GRADIENT_PRESETS: GradientPreset[] = [
  { id: '1', name: 'Sunset', colors: ['#f97316', '#ec4899'], angle: 135 },
  { id: '2', name: 'Ocean', colors: ['#06b6d4', '#6366f1'], angle: 135 },
  { id: '3', name: 'Forest', colors: ['#22c55e', '#064e3b'], angle: 180 },
  { id: '4', name: 'Neon', colors: ['#a855f7', '#ec4899'], angle: 90 },
  { id: '5', name: 'Night', colors: ['#0f172a', '#1e1b4b'], angle: 180 },
  { id: '6', name: 'Fire', colors: ['#ef4444', '#f59e0b'], angle: 135 },
  { id: '7', name: 'Ice', colors: ['#bfdbfe', '#6366f1'], angle: 180 },
  { id: '8', name: 'Candy', colors: ['#f472b6', '#c084fc'], angle: 90 },
]

export function BackgroundPanel() {
  const { width } = useWindowDimensions()
  const [bgType, setBgType] = useState<BGType>('solid')
  const [selectedColor, setSelectedColor] = useState('#0f0f23')
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null)
  const [customColor, setCustomColor] = useState('#000000')

  const colorSize = (width - 48 - 36) / 5 // 5 per row with gaps

  return (
    <View style={styles.container}>
      {/* Background type selector */}
      <View style={styles.typeRow}>
        {BG_TYPES.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.typeBtn, bgType === t.id && styles.typeBtnActive]}
            onPress={() => setBgType(t.id)}
          >
            <Text style={[styles.typeIcon, bgType === t.id && styles.typeIconActive]}>
              {t.icon}
            </Text>
            <Text style={[styles.typeLabel, bgType === t.id && styles.typeLabelActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {bgType === 'solid' && (
          <>
            {/* Custom color input */}
            <View style={styles.customRow}>
              <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
              <TextInput
                style={styles.hexInput}
                value={selectedColor}
                onChangeText={(text) => {
                  setSelectedColor(text)
                  setCustomColor(text)
                }}
                placeholder="#000000"
                placeholderTextColor="#555"
                autoCapitalize="none"
              />
            </View>

            {/* Color grid */}
            <Text style={styles.sectionLabel}>Presets</Text>
            <View style={styles.colorGrid}>
              {SOLID_PRESETS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color, width: colorSize, height: colorSize },
                    selectedColor === color && styles.colorSwatchSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </>
        )}

        {bgType === 'gradient' && (
          <>
            <Text style={styles.sectionLabel}>Gradient Presets</Text>
            <View style={styles.gradientGrid}>
              {GRADIENT_PRESETS.map((g) => (
                <Pressable
                  key={g.id}
                  style={[
                    styles.gradientCard,
                    selectedGradient === g.id && styles.gradientCardSelected,
                  ]}
                  onPress={() => setSelectedGradient(g.id)}
                >
                  <View style={[styles.gradientPreview, { backgroundColor: g.colors[0] }]}>
                    <View style={[styles.gradientOverlay, { backgroundColor: g.colors[1], opacity: 0.6 }]} />
                  </View>
                  <Text style={styles.gradientName}>{g.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {bgType === 'image' && (
          <View style={styles.uploadArea}>
            <Text style={styles.uploadIcon}>{'\u{1F5BC}'}</Text>
            <Text style={styles.uploadTitle}>Upload Background Image</Text>
            <Text style={styles.uploadSubtext}>PNG, JPG, or SVG</Text>
            <Pressable style={styles.uploadBtn}>
              <Text style={styles.uploadBtnText}>Choose File</Text>
            </Pressable>
          </View>
        )}

        {bgType === 'video' && (
          <View style={styles.uploadArea}>
            <Text style={styles.uploadIcon}>{'\u{1F3AC}'}</Text>
            <Text style={styles.uploadTitle}>Upload Background Video</Text>
            <Text style={styles.uploadSubtext}>MP4 or WebM</Text>
            <Pressable style={styles.uploadBtn}>
              <Text style={styles.uploadBtnText}>Choose File</Text>
            </Pressable>
          </View>
        )}

        {bgType === 'transparent' && (
          <View style={styles.transparentInfo}>
            <Text style={styles.transparentIcon}>{'\u2B1C'}</Text>
            <Text style={styles.transparentText}>Transparent background</Text>
            <Text style={styles.transparentSubtext}>
              Export with alpha channel (ProRes 4444 or WebM)
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  typeRow: {
    flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 8, gap: 4,
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  typeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8,
  },
  typeBtnActive: { backgroundColor: '#1e1b4b' },
  typeIcon: { fontSize: 18, color: '#666' },
  typeIconActive: { color: '#6366f1' },
  typeLabel: { fontSize: 10, color: '#666', marginTop: 2 },
  typeLabelActive: { color: '#6366f1', fontWeight: '600' },
  content: { padding: 12, paddingBottom: 24 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  colorPreview: { width: 40, height: 40, borderRadius: 8, borderWidth: 2, borderColor: '#333' },
  hexInput: {
    flex: 1, backgroundColor: '#1a1a1a', color: '#fff', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, fontSize: 14, borderWidth: 1, borderColor: '#222', fontFamily: 'monospace',
  },
  sectionLabel: { color: '#999', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch: {
    borderRadius: 8, borderWidth: 2, borderColor: '#222',
  },
  colorSwatchSelected: { borderColor: '#6366f1', borderWidth: 2 },
  gradientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gradientCard: {
    width: '47%', borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: '#222',
  },
  gradientCardSelected: { borderColor: '#6366f1', borderWidth: 2 },
  gradientPreview: { height: 60, position: 'relative' },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },
  gradientName: { color: '#ccc', fontSize: 12, padding: 6, textAlign: 'center', backgroundColor: '#111' },
  uploadArea: { alignItems: 'center', padding: 32, backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#222', borderStyle: 'dashed' },
  uploadIcon: { fontSize: 40, marginBottom: 12, opacity: 0.5 },
  uploadTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  uploadSubtext: { color: '#666', fontSize: 13, marginTop: 4, marginBottom: 16 },
  uploadBtn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  uploadBtnText: { color: '#fff', fontWeight: '600' },
  transparentInfo: { alignItems: 'center', padding: 32 },
  transparentIcon: { fontSize: 48, marginBottom: 12, opacity: 0.3 },
  transparentText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  transparentSubtext: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 4 },
})
