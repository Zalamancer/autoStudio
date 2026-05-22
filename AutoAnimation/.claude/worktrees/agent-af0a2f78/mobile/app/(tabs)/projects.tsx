import React, { useEffect, useCallback } from 'react'
import { View, FlatList, Text, Pressable, StyleSheet, RefreshControl, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useProjectStore } from '../../src/stores/useProjectStore'

export default function ProjectsScreen() {
  const router = useRouter()
  const { projects, loading, error, fetch, remove } = useProjectStore()

  useEffect(() => {
    fetch()
  }, [])

  const onDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete Project', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(id) },
    ])
  }, [remove])

  const renderItem = useCallback(({ item }: { item: typeof projects[0] }) => (
    <Pressable
      style={styles.projectCard}
      onPress={() => {
        if (item.templateId) {
          router.push(`/editor/${item.templateId}?projectId=${item.id}`)
        }
      }}
    >
      <View style={styles.projectInfo}>
        <Text style={styles.projectName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.projectMeta}>
          {item.aspectRatio} · {item.fps}fps · {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>
      <Pressable style={styles.deleteBtn} onPress={() => onDelete(item.id, item.name)}>
        <Text style={styles.deleteText}>×</Text>
      </Pressable>
    </Pressable>
  ), [router, onDelete])

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={fetch}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : projects.length === 0 && !loading ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No projects yet</Text>
          <Text style={styles.emptySubtext}>Browse templates and create your first project</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor="#6366f1" />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  list: { padding: 12 },
  projectCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  projectInfo: { flex: 1 },
  projectName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  projectMeta: { color: '#666', fontSize: 13, marginTop: 4 },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2a1a1a', justifyContent: 'center', alignItems: 'center' },
  deleteText: { color: '#ef4444', fontSize: 20, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#ef4444', fontSize: 15, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 8 },
})
