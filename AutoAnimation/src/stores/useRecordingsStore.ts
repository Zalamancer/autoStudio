import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import {
  saveRecordingBlob,
  getRecordingBlob,
  deleteRecordingBlob,
  saveRecordingThumbnail,
  getRecordingThumbnail,
  deleteRecordingThumbnail,
} from '@/services/recordingsDB'
import { toast } from './useToastStore'
import {
  fetchCloudRecordings,
  uploadRecordingToCloud,
  deleteCloudRecording,
  renameCloudRecording,
} from '@/services/recordingsCloud'

export interface Recording {
  id: string
  name: string
  format: 'webm' | 'mp4' | 'gif'
  width: number
  height: number
  fps: number
  durationSec: number
  fileSize: number
  createdAt: string
  projectId: string | null
  projectName: string | null
  thumbnailUrl: string | null
  videoUrl: string | null
}

interface RecordingsState {
  recordings: Recording[]
  _rehydrated: boolean
  _cloudSynced: boolean

  addRecording: (recording: Recording, blob: Blob, thumbnailBlob?: Blob) => void
  removeRecording: (id: string) => void
  renameRecording: (id: string, name: string) => void
  getRecording: (id: string) => Recording | undefined
  rehydrateUrls: () => Promise<void>
  syncFromCloud: () => Promise<void>
}

export const useRecordingsStore = create<RecordingsState>()(
  persist(
    immer((set, get) => ({
      recordings: [],
      _rehydrated: false,
      _cloudSynced: false,

      addRecording: (recording, blob, thumbnailBlob) => {
        // Create blob URLs for immediate use
        const videoUrl = URL.createObjectURL(blob)
        const thumbnailUrl = thumbnailBlob ? URL.createObjectURL(thumbnailBlob) : null

        set((state) => {
          state.recordings.unshift({
            ...recording,
            videoUrl,
            thumbnailUrl,
          })
        })

        toast.success('Recording saved', 2000)

        // Persist blob to IndexedDB (local cache)
        saveRecordingBlob(recording.id, blob).catch((err) => {
          console.error(`[Recordings] Failed to save local blob for ${recording.id}:`, err)
        })

        if (thumbnailBlob) {
          saveRecordingThumbnail(recording.id, thumbnailBlob).catch((err) => {
            console.error(`[Recordings] Failed to save local thumbnail for ${recording.id}:`, err)
          })
        }

        // Upload to cloud (async, non-blocking)
        uploadRecordingToCloud(recording, blob, thumbnailBlob)
          .then((cloudRec) => {
            // Update with cloud URLs (stable public URLs)
            set((state) => {
              const r = state.recordings.find((r) => r.id === recording.id)
              if (r) {
                if (cloudRec.videoUrl) r.videoUrl = cloudRec.videoUrl
                if (cloudRec.thumbnailUrl) r.thumbnailUrl = cloudRec.thumbnailUrl
              }
            })
            console.log(`[Recordings] Uploaded ${recording.id} to cloud`)
          })
          .catch((err) => {
            console.warn(`[Recordings] Cloud upload failed for ${recording.id}:`, err)
            // Local copy still works; cloud sync will retry on next load
          })
      },

      removeRecording: (id) => {
        const rec = get().recordings.find((r) => r.id === id)
        if (rec) {
          if (rec.videoUrl?.startsWith('blob:')) URL.revokeObjectURL(rec.videoUrl)
          if (rec.thumbnailUrl?.startsWith('blob:')) URL.revokeObjectURL(rec.thumbnailUrl)
        }

        // Remove from local IndexedDB
        deleteRecordingBlob(id).catch((err) => {
          console.error(err)
          toast.error('Failed to delete recording from local storage')
        })
        deleteRecordingThumbnail(id).catch((err) => {
          console.error(err)
          toast.error('Failed to delete recording thumbnail')
        })

        // Remove from cloud
        deleteCloudRecording(id).catch((err) => {
          console.warn(`[Recordings] Cloud delete failed for ${id}:`, err)
        })

        set((state) => {
          state.recordings = state.recordings.filter((r) => r.id !== id)
        })
      },

      renameRecording: (id, name) => {
        set((state) => {
          const rec = state.recordings.find((r) => r.id === id)
          if (rec) rec.name = name
        })

        // Update in cloud
        renameCloudRecording(id, name).catch((err) => {
          console.warn(`[Recordings] Cloud rename failed for ${id}:`, err)
        })
      },

      getRecording: (id) => {
        return get().recordings.find((r) => r.id === id)
      },

      rehydrateUrls: async () => {
        const { recordings } = get()
        const updated: Recording[] = []

        for (const rec of recordings) {
          let videoUrl: string | null = rec.videoUrl
          let thumbnailUrl: string | null = rec.thumbnailUrl

          // If URL is already a cloud URL (https://...), keep it as-is
          if (!videoUrl || videoUrl.startsWith('blob:')) {
            videoUrl = null
            try {
              const videoBlob = await getRecordingBlob(rec.id)
              if (videoBlob) videoUrl = URL.createObjectURL(videoBlob)
            } catch {
              // blob missing from IndexedDB
            }
          }

          if (!thumbnailUrl || thumbnailUrl.startsWith('blob:')) {
            thumbnailUrl = null
            try {
              const thumbBlob = await getRecordingThumbnail(rec.id)
              if (thumbBlob) thumbnailUrl = URL.createObjectURL(thumbBlob)
            } catch {
              // thumbnail missing
            }
          }

          updated.push({ ...rec, videoUrl, thumbnailUrl })
        }

        set((state) => {
          state.recordings = updated
          state._rehydrated = true
        })

        // Cloud sync is triggered by AuthGuard after auth is confirmed
      },

      syncFromCloud: async () => {
        try {
          const cloudRecordings = await fetchCloudRecordings()
          const cloudIds = new Set((cloudRecordings || []).map((r) => r.id))

          if (cloudRecordings && cloudRecordings.length > 0) {
            set((state) => {
              const localIds = new Set(state.recordings.map((r) => r.id))

              for (const cloudRec of cloudRecordings) {
                if (localIds.has(cloudRec.id)) {
                  // Update local entry with cloud URLs if local ones are missing
                  const local = state.recordings.find((r) => r.id === cloudRec.id)
                  if (local) {
                    if ((!local.videoUrl || local.videoUrl.startsWith('blob:')) && cloudRec.videoUrl) {
                      local.videoUrl = cloudRec.videoUrl
                    }
                    if ((!local.thumbnailUrl || local.thumbnailUrl.startsWith('blob:')) && cloudRec.thumbnailUrl) {
                      local.thumbnailUrl = cloudRec.thumbnailUrl
                    }
                  }
                } else {
                  // Recording exists in cloud but not locally — add it
                  state.recordings.push(cloudRec)
                }
              }

              // Sort by createdAt descending (newest first)
              state.recordings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              state._cloudSynced = true
            })

            console.log(`[Recordings] Synced ${cloudRecordings.length} recording(s) from cloud`)
          }

          // Push any local-only recordings (not in cloud) to cloud
          const localOnly = get().recordings.filter((r) => !cloudIds.has(r.id))
          for (const rec of localOnly) {
            try {
              const videoBlob = await getRecordingBlob(rec.id)
              if (!videoBlob) continue // No local blob — can't upload

              let thumbnailBlob: Blob | undefined
              try {
                const tb = await getRecordingThumbnail(rec.id)
                if (tb) thumbnailBlob = tb
              } catch {
                /* no thumbnail */
              }

              const cloudRec = await uploadRecordingToCloud(rec, videoBlob, thumbnailBlob)

              set((state) => {
                const r = state.recordings.find((r) => r.id === rec.id)
                if (r) {
                  if (cloudRec.videoUrl) r.videoUrl = cloudRec.videoUrl
                  if (cloudRec.thumbnailUrl) r.thumbnailUrl = cloudRec.thumbnailUrl
                }
              })

              console.log(`[Recordings] Pushed local recording ${rec.id} to cloud`)
            } catch (err) {
              console.warn(`[Recordings] Failed to push ${rec.id} to cloud:`, err)
            }
          }

          set((state) => {
            state._cloudSynced = true
          })
        } catch (err) {
          console.warn('[Recordings] Cloud sync failed:', err)
          set((state) => {
            state._cloudSynced = true
          })
        }
      },
    })),
    {
      name: 'proanimate-recordings',
      partialize: (state) => ({
        recordings: state.recordings.map((r) => ({
          ...r,
          // Persist cloud URLs but null out blob URLs
          videoUrl: r.videoUrl?.startsWith('blob:') ? null : r.videoUrl,
          thumbnailUrl: r.thumbnailUrl?.startsWith('blob:') ? null : r.thumbnailUrl,
        })),
      }),
      onRehydrateStorage: () => (state) => {
        state?.rehydrateUrls()
      },
    },
  ),
)
