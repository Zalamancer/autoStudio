/**
 * Cloud recording persistence — talks to /api/recordings endpoints.
 * Uploads video + thumbnail blobs to Supabase Storage via the server.
 */
import { supabase } from './supabase'
import type { Recording } from '@/stores/useRecordingsStore'

const API = '/api/recordings'

async function getAuthHeaders(): Promise<HeadersInit | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return null
  return { Authorization: `Bearer ${token}` }
}

/** Fetch all cloud recordings for the current user. Returns [] if not authenticated. */
export async function fetchCloudRecordings(): Promise<Recording[]> {
  const headers = await getAuthHeaders()
  if (!headers) return []
  const res = await fetch(API, { headers })
  if (!res.ok) throw new Error(`Failed to fetch recordings: ${res.status}`)
  const { recordings } = await res.json()
  return recordings as Recording[]
}

/** Upload a recording (video blob + optional thumbnail blob + metadata) */
export async function uploadRecordingToCloud(
  meta: Recording,
  videoBlob: Blob,
  thumbnailBlob?: Blob
): Promise<Recording> {
  const headers = await getAuthHeaders()
  if (!headers) throw new Error('Not authenticated')
  const form = new FormData()
  form.append('meta', JSON.stringify(meta))
  form.append('video', videoBlob, `recording.${meta.format || 'mp4'}`)
  if (thumbnailBlob) {
    form.append('thumbnail', thumbnailBlob, 'thumb.png')
  }

  const res = await fetch(API, {
    method: 'POST',
    headers, // Authorization header; Content-Type auto-set by FormData
    body: form,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Upload failed (${res.status}): ${text}`)
  }

  const { recording } = await res.json()
  return recording as Recording
}

/** Delete a cloud recording */
export async function deleteCloudRecording(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers) return
  const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}

/** Rename a cloud recording */
export async function renameCloudRecording(id: string, name: string): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers) return
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`Rename failed: ${res.status}`)
}
