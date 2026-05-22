import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { useEditorStore } from '../../src/stores/useEditorStore'
import { useExportStore } from '../../src/stores/useExportStore'

const FORMATS = ['mp4', 'webm'] as const
const DURATIONS = [3, 5, 10, 15]
const FPS_OPTIONS = [24, 30, 60]

export default function ExportScreen() {
  const router = useRouter()
  const { description, config } = useEditorStore()
  const { status, progress, resultUrl, error, startExport, reset } = useExportStore()

  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4')
  const [duration, setDuration] = useState(5)
  const [fps, setFps] = useState(30)

  const handleExport = useCallback(() => {
    if (!description) {
      Alert.alert('Error', 'No template loaded')
      return
    }
    startExport({ description, config, format, fps, durationSeconds: duration })
  }, [description, config, format, fps, duration])

  const handleDownload = useCallback(async () => {
    if (!resultUrl) return

    try {
      const filename = `proanimate-export-${Date.now()}.${format}`
      const fileUri = `${FileSystem.documentDirectory}${filename}`

      const download = await FileSystem.downloadAsync(resultUrl, fileUri)

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(download.uri, {
          mimeType: format === 'mp4' ? 'video/mp4' : 'video/webm',
          dialogTitle: 'Share your animation',
        })
      } else {
        Alert.alert('Saved', `Video saved to ${filename}`)
      }
    } catch (err) {
      Alert.alert('Download Error', (err as Error).message)
    }
  }, [resultUrl, format])

  const handleBack = useCallback(() => {
    reset()
    router.back()
  }, [])

  const isExporting = status === 'submitting' || status === 'rendering'

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Export Video',
          headerLeft: () => (
            <Pressable onPress={handleBack} style={styles.headerBackBtn}>
              <Text style={styles.headerBackText}>Back</Text>
            </Pressable>
          ),
        }}
      />

      {/* Format picker */}
      <Text style={styles.sectionTitle}>Format</Text>
      <View style={styles.segmented}>
        {FORMATS.map((f) => (
          <Pressable
            key={f}
            style={[styles.segment, format === f && styles.segmentActive]}
            onPress={() => !isExporting && setFormat(f)}
            disabled={isExporting}
          >
            <Text style={[styles.segmentText, format === f && styles.segmentTextActive]}>
              {f.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Duration picker */}
      <Text style={styles.sectionTitle}>Duration</Text>
      <View style={styles.segmented}>
        {DURATIONS.map((d) => (
          <Pressable
            key={d}
            style={[styles.segment, duration === d && styles.segmentActive]}
            onPress={() => !isExporting && setDuration(d)}
            disabled={isExporting}
          >
            <Text style={[styles.segmentText, duration === d && styles.segmentTextActive]}>
              {d}s
            </Text>
          </Pressable>
        ))}
      </View>

      {/* FPS picker */}
      <Text style={styles.sectionTitle}>Frame Rate</Text>
      <View style={styles.segmented}>
        {FPS_OPTIONS.map((f) => (
          <Pressable
            key={f}
            style={[styles.segment, fps === f && styles.segmentActive]}
            onPress={() => !isExporting && setFps(f)}
            disabled={isExporting}
          >
            <Text style={[styles.segmentText, fps === f && styles.segmentTextActive]}>
              {f} fps
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Status area */}
      <View style={styles.statusArea}>
        {status === 'idle' && (
          <Pressable style={styles.exportBtn} onPress={handleExport}>
            <Text style={styles.exportBtnText}>Export Video</Text>
          </Pressable>
        )}

        {isExporting && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.progressText}>{progress}</Text>
            <Pressable style={styles.cancelBtn} onPress={reset}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {status === 'complete' && (
          <View style={styles.completeContainer}>
            <Text style={styles.completeText}>Export complete!</Text>
            <Pressable style={styles.downloadBtn} onPress={handleDownload}>
              <Text style={styles.downloadBtnText}>Download & Share</Text>
            </Pressable>
            <Pressable style={styles.newExportBtn} onPress={reset}>
              <Text style={styles.newExportBtnText}>New Export</Text>
            </Pressable>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={handleExport}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  headerBackBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  headerBackText: { color: '#6366f1', fontSize: 16, fontWeight: '600' },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  segmented: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  segmentActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  segmentText: { color: '#999', fontWeight: '600', fontSize: 14 },
  segmentTextActive: { color: '#fff' },
  statusArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  exportBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  exportBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  progressContainer: { alignItems: 'center', gap: 16 },
  progressText: { color: '#ccc', fontSize: 16 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  cancelBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  completeContainer: { alignItems: 'center', gap: 16, width: '100%' },
  completeText: { color: '#22c55e', fontSize: 20, fontWeight: '700' },
  downloadBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  downloadBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  newExportBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  newExportBtnText: { color: '#888', fontSize: 14 },
  errorContainer: { alignItems: 'center', gap: 12 },
  errorText: { color: '#ef4444', fontSize: 15, textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },
})
