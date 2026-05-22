import React from 'react'
import { View, Text, TextInput, Switch, StyleSheet, ScrollView, Pressable } from 'react-native'

interface FieldDescriptor {
  key: string
  label: string
  type: 'text' | 'color' | 'number' | 'boolean' | 'text-array' | 'select'
  defaultValue: unknown
  group: string
  options?: string[]
  min?: number
  max?: number
}

interface ConfigEditorProps {
  schema: FieldDescriptor[]
  config: Record<string, unknown>
  onUpdate: (key: string, value: unknown) => void
}

const PRESET_COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
]

export function ConfigEditor({ schema, config, onUpdate }: ConfigEditorProps) {
  // Group fields by group property
  const groups = new Map<string, FieldDescriptor[]>()
  for (const field of schema) {
    const group = field.group || 'General'
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(field)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {Array.from(groups.entries()).map(([groupName, fields]) => (
        <View key={groupName} style={styles.group}>
          <Text style={styles.groupTitle}>{groupName}</Text>
          {fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={config[field.key] ?? field.defaultValue}
              onUpdate={(value) => onUpdate(field.key, value)}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

function FieldInput({ field, value, onUpdate }: {
  field: FieldDescriptor
  value: unknown
  onUpdate: (value: unknown) => void
}) {
  switch (field.type) {
    case 'text':
      return (
        <View style={styles.field}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.textInput}
            value={String(value ?? '')}
            onChangeText={onUpdate}
            placeholderTextColor="#555"
          />
        </View>
      )

    case 'color':
      return (
        <View style={styles.field}>
          <Text style={styles.label}>{field.label}</Text>
          <View style={styles.colorRow}>
            {PRESET_COLORS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  value === color && styles.colorSelected,
                ]}
                onPress={() => onUpdate(color)}
              />
            ))}
          </View>
          <TextInput
            style={[styles.textInput, { marginTop: 8 }]}
            value={String(value ?? '')}
            onChangeText={onUpdate}
            placeholder="#hex"
            placeholderTextColor="#555"
            autoCapitalize="none"
          />
        </View>
      )

    case 'number': {
      const num = typeof value === 'number' ? value : parseFloat(String(value)) || 0
      const min = field.min ?? 0
      const max = field.max ?? 100
      return (
        <View style={styles.field}>
          <View style={styles.numberHeader}>
            <Text style={styles.label}>{field.label}</Text>
            <Text style={styles.numberValue}>{num.toFixed(1)}</Text>
          </View>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${((num - min) / (max - min)) * 100}%` }]} />
            <Pressable
              style={styles.sliderHitArea}
              onPress={() => {
                // Simple tap-to-set on the track
                // A real slider would use PanResponder, but this is functional
              }}
            />
          </View>
          <View style={styles.sliderButtons}>
            <Pressable style={styles.stepBtn} onPress={() => onUpdate(Math.max(min, num - (max - min) / 20))}>
              <Text style={styles.stepBtnText}>-</Text>
            </Pressable>
            <Pressable style={styles.stepBtn} onPress={() => onUpdate(Math.min(max, num + (max - min) / 20))}>
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
      )
    }

    case 'boolean':
      return (
        <View style={[styles.field, styles.boolField]}>
          <Text style={styles.label}>{field.label}</Text>
          <Switch
            value={!!value}
            onValueChange={onUpdate}
            trackColor={{ true: '#6366f1', false: '#333' }}
            thumbColor="#fff"
          />
        </View>
      )

    case 'text-array': {
      const arr = Array.isArray(value) ? value : []
      return (
        <View style={styles.field}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.textInput}
            value={arr.join(', ')}
            onChangeText={(text) => onUpdate(text.split(',').map((s: string) => s.trim()).filter(Boolean))}
            placeholder="comma separated values"
            placeholderTextColor="#555"
          />
        </View>
      )
    }

    case 'select':
      return (
        <View style={styles.field}>
          <Text style={styles.label}>{field.label}</Text>
          <View style={styles.selectRow}>
            {(field.options ?? []).map((opt) => (
              <Pressable
                key={opt}
                style={[styles.selectOption, value === opt && styles.selectActive]}
                onPress={() => onUpdate(opt)}
              >
                <Text style={[styles.selectText, value === opt && styles.selectActiveText]}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )

    default:
      return null
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  group: { marginBottom: 24 },
  groupTitle: { color: '#888', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  field: { marginBottom: 16 },
  label: { color: '#ccc', fontSize: 14, marginBottom: 6 },
  textInput: { backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 15, borderWidth: 1, borderColor: '#333' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorSelected: { borderColor: '#fff' },
  numberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numberValue: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
  sliderTrack: { height: 6, backgroundColor: '#333', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  sliderFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 3 },
  sliderHitArea: { ...StyleSheet.absoluteFillObject },
  sliderButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  stepBtn: { backgroundColor: '#1a1a1a', paddingHorizontal: 20, paddingVertical: 6, borderRadius: 6 },
  stepBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  boolField: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  selectActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  selectText: { color: '#999', fontSize: 13 },
  selectActiveText: { color: '#fff' },
})
