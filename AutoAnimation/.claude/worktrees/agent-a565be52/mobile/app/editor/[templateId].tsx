import React, { useEffect, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useEditorStore } from '../../src/stores/useEditorStore'
import { useProjectStore } from '../../src/stores/useProjectStore'
import { useAuthStore } from '../../src/stores/useAuthStore'
import { AnimationPreview } from '../../src/components/AnimationPreview'
import { ConfigEditor } from '../../src/components/ConfigEditor'
import { getTemplateById as getBundledTemplate } from '../../src/data/templates'
import type { MotionDesignDescription } from '@proanimate/core'

export default function EditorScreen() {
  const { templateId, projectId } = useLocalSearchParams<{ templateId: string; projectId?: string }>()
  const router = useRouter()
  const { width: screenWidth } = useWindowDimensions()
  const { description, config, template, loading, error, loadTemplate, loadBundledTemplate, updateConfig, clear } = useEditorStore()
  const { create: createProject, update: updateProject, clearDraft } = useProjectStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login')
    }
  }, [user])

  useEffect(() => {
    if (templateId) {
      // Skip fetch if template is already loaded (e.g. from showcase tap)
      const current = useEditorStore.getState()
      if (current.templateId === templateId && current.description) return

      // Try bundled first, then server
      const bundled = getBundledTemplate(templateId)
      if (bundled) {
        useEditorStore.getState().loadBundledTemplate(templateId)
      } else {
        loadTemplate(templateId)
      }
    }
    return () => clear()
  }, [templateId])

  const handleSave = useCallback(async () => {
    if (!description || !templateId) return

    try {
      if (projectId) {
        await updateProject(projectId, { configState: config })
        Alert.alert('Saved', 'Project updated successfully')
      } else {
        const name = (config.title as string) || template?.title || 'Untitled'
        await createProject({
          name,
          templateId,
          configState: config,
          motionDesignDescription: description as unknown as Record<string, unknown>,
        })
        clearDraft(templateId)
        Alert.alert('Saved', 'Project created successfully')
      }
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
    }
  }, [description, config, templateId, projectId, template])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  if (error || !description) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Template not found'}</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    )
  }

  const previewHeight = screenWidth * (16 / 9) * 0.45  // ~45% of portrait aspect ratio
  const previewWidth = previewHeight * (9 / 16)

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          title: template?.title || 'Editor',
          headerRight: () => (
            <Pressable onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          ),
        }}
      />

      {/* Preview */}
      <View style={styles.previewContainer}>
        <AnimationPreview
          description={description}
          config={config}
          durationMs={5000}
        />
      </View>

      {/* Config Editor */}
      <View style={styles.editorContainer}>
        {template?.configSchema && template.configSchema.length > 0 ? (
          <ConfigEditor
            schema={template.configSchema as any}
            config={config}
            onUpdate={updateConfig}
          />
        ) : (
          <View style={styles.noConfig}>
            <Text style={styles.noConfigText}>No configurable options for this template</Text>
          </View>
        )}
      </View>

      {/* Export button */}
      <Pressable
        style={styles.exportBtn}
        onPress={() => router.push('/export/current')}
      >
        <Text style={styles.exportBtnText}>Export Video</Text>
      </Pressable>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  previewContainer: { height: '45%', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  editorContainer: { flex: 1, borderTopWidth: 1, borderTopColor: '#222' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  errorText: { color: '#ef4444', fontSize: 15, marginBottom: 16 },
  backBtn: { backgroundColor: '#1a1a1a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginRight: 4 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  noConfig: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noConfigText: { color: '#666', fontSize: 14 },
  exportBtn: { backgroundColor: '#6366f1', marginHorizontal: 20, marginBottom: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  exportBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
