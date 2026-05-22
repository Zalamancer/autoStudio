/**
 * Cloud pixel art character persistence — talks to /api/pixelart-characters endpoints.
 * Uploads saved pixel art sprite data (direction sprites + animation frames as base64) to Supabase Storage.
 */
import { supabase } from './supabase'
import type { SavedPixelArtCharacter } from '@/types/pixelLab'

const API = '/api/pixelart-characters'

async function getAuthHeaders(): Promise<HeadersInit | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return null
  return { Authorization: `Bearer ${token}` }
}

export interface PixelArtCharacterMeta {
  id: string
  name: string
  description: string
  size: number
  n_directions: 4 | 8
  thumbnailDataUrl: string
  createdAt: number
}

/** Pixel art blob data packaged for cloud storage */
export interface PixelArtCloudData {
  /** Direction sprite blobs as base64 data URLs, keyed by direction */
  directionBlobs: Record<string, string>
  /** Animation frame blobs as base64 data URLs, grouped by animation name */
  animationBlobs: Record<string, { direction: string; frameDataUrls: string[] }[]>
}

/** Fetch the pixel art character metadata index for the current user */
export async function fetchCloudPixelArtCharacters(): Promise<PixelArtCharacterMeta[]> {
  const headers = await getAuthHeaders()
  if (!headers) return []
  const res = await fetch(API, { headers })
  if (!res.ok) throw new Error(`Failed to fetch pixel art characters: ${res.status}`)
  const { characters } = await res.json()
  return characters as PixelArtCharacterMeta[]
}

/** Download full pixel art data for a single character */
export async function downloadPixelArtData(id: string): Promise<{ meta: PixelArtCharacterMeta; character: SavedPixelArtCharacter; blobs: PixelArtCloudData } | null> {
  const headers = await getAuthHeaders()
  if (!headers) return null
  const res = await fetch(`${API}/${id}`, { headers })
  if (!res.ok) return null
  return res.json()
}

/** Upload a pixel art character's metadata + blob data to the cloud */
export async function uploadPixelArtToCloud(
  meta: PixelArtCharacterMeta,
  character: SavedPixelArtCharacter,
  blobs: PixelArtCloudData
): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers) throw new Error('Not authenticated')
  const res = await fetch(API, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ meta, character, blobs }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Upload failed (${res.status}): ${text}`)
  }
}

/** Delete a pixel art character from the cloud */
export async function deleteCloudPixelArtCharacter(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers) return
  const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}
