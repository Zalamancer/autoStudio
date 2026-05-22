/**
 * Cloud character persistence — talks to /api/characters endpoints.
 * Uploads saved character image data (sprites, visemes, etc.) to Supabase Storage.
 */
import { supabase } from './supabase'
import type { CharacterImageData } from './characterDB'

const API = '/api/characters'

async function getAuthHeaders(): Promise<HeadersInit | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return null
  return { Authorization: `Bearer ${token}` }
}

export interface CloudCharacterMeta {
  id: string
  name: string
  stylePrompt: string
  createdAt: number
  referenceImagePreview?: string
}

/** Fetch the character metadata index for the current user. Returns [] if not authenticated. */
export async function fetchCloudCharacters(): Promise<CloudCharacterMeta[]> {
  const headers = await getAuthHeaders()
  if (!headers) return []
  const res = await fetch(API, { headers })
  if (!res.ok) throw new Error(`Failed to fetch characters: ${res.status}`)
  const { characters } = await res.json()
  return characters as CloudCharacterMeta[]
}

/** Download full image data for a single character */
export async function downloadCharacterImages(id: string): Promise<CharacterImageData | null> {
  const headers = await getAuthHeaders()
  if (!headers) return null
  const res = await fetch(`${API}/${id}`, { headers })
  if (!res.ok) return null
  return res.json() as Promise<CharacterImageData>
}

/** Upload a character's metadata + full image data to the cloud */
export async function uploadCharacterToCloud(
  meta: CloudCharacterMeta,
  imageData: CharacterImageData
): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers) throw new Error('Not authenticated')
  const res = await fetch(API, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ meta, imageData }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Upload failed (${res.status}): ${text}`)
  }
}

/** Delete a character from the cloud */
export async function deleteCloudCharacter(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers) return
  const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}
