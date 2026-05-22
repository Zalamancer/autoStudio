/**
 * Cloud 3D character persistence — talks to /api/3d-characters endpoints.
 * Uploads GLB blobs (binary) and metadata to Supabase Storage.
 */
import { supabase } from './supabase'
import type { Saved3DCharacter } from '@/types/character3d'

const API = '/api/3d-characters'

async function getAuthHeaders(): Promise<HeadersInit | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return null
  return { Authorization: `Bearer ${token}` }
}

export interface Cloud3DCharacterMeta {
  id: string
  name: string
  thumbnailDataUrl: string
  skeletonType: string
  polyCount: number
  createdAt: number
  sourcePrompt?: string
}

/** Fetch the 3D character metadata index for the current user */
export async function fetchCloud3DCharacters(): Promise<Cloud3DCharacterMeta[]> {
  const headers = await getAuthHeaders()
  if (!headers) return []
  const res = await fetch(API, { headers })
  if (!res.ok) throw new Error(`Failed to fetch 3D characters: ${res.status}`)
  const { characters } = await res.json()
  return characters as Cloud3DCharacterMeta[]
}

/** Download a 3D character's metadata JSON */
export async function download3DCharacterMeta(id: string): Promise<Saved3DCharacter | null> {
  const headers = await getAuthHeaders()
  if (!headers) return null
  const res = await fetch(`${API}/${id}/meta`, { headers })
  if (!res.ok) return null
  return res.json()
}

/** Download a 3D character's GLB blob */
export async function download3DCharacterGlb(id: string): Promise<Blob | null> {
  const headers = await getAuthHeaders()
  if (!headers) return null
  const res = await fetch(`${API}/${id}/glb`, { headers })
  if (!res.ok) return null
  return res.blob()
}

/** Upload a 3D character (metadata JSON + GLB binary) to the cloud */
export async function upload3DCharacterToCloud(
  meta: Cloud3DCharacterMeta,
  character: Saved3DCharacter,
  glbBlob: Blob
): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers) throw new Error('Not authenticated')

  const form = new FormData()
  form.append('meta', JSON.stringify(meta))
  form.append('character', JSON.stringify(character))
  form.append('glb', glbBlob, `${meta.id}.glb`)

  const res = await fetch(API, {
    method: 'POST',
    headers, // Authorization header; Content-Type auto-set by FormData
    body: form,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Upload failed (${res.status}): ${text}`)
  }
}

/** Delete a 3D character from the cloud */
export async function deleteCloud3DCharacter(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers) return
  const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}
