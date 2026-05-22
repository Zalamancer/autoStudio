/**
 * Cloud avatar character persistence — talks to /api/avatar-characters endpoints.
 * Uploads saved avatar character data (base image blob as base64) to Supabase Storage.
 */
import { supabase } from './supabase'
import type { SavedAvatarCharacter } from '@/types/avatar'

const API = '/api/avatar-characters'

async function getAuthHeaders(): Promise<HeadersInit | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return null
  return { Authorization: `Bearer ${token}` }
}

export interface AvatarCharacterMeta {
  id: string
  name: string
  description: string
  style: string
  thumbnailDataUrl: string
  createdAt: number
}

/** Fetch the avatar character metadata index for the current user */
export async function fetchCloudAvatarCharacters(): Promise<AvatarCharacterMeta[]> {
  const headers = await getAuthHeaders()
  if (!headers) return []
  const res = await fetch(API, { headers })
  if (!res.ok) throw new Error(`Failed to fetch avatar characters: ${res.status}`)
  const { characters } = await res.json()
  return characters as AvatarCharacterMeta[]
}

/** Download full avatar data for a single character */
export async function downloadAvatarData(id: string): Promise<{ meta: AvatarCharacterMeta; character: SavedAvatarCharacter; blob: string } | null> {
  const headers = await getAuthHeaders()
  if (!headers) return null
  const res = await fetch(`${API}/${id}`, { headers })
  if (!res.ok) return null
  return res.json()
}

/** Upload an avatar character's metadata + blob data to the cloud */
export async function uploadAvatarToCloud(
  meta: AvatarCharacterMeta,
  character: SavedAvatarCharacter,
  blobDataUrl: string
): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers) throw new Error('Not authenticated')
  const res = await fetch(API, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ meta, character, blob: blobDataUrl }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Upload failed (${res.status}): ${text}`)
  }
}

/** Delete an avatar character from the cloud */
export async function deleteCloudAvatarCharacter(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers) return
  const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}
