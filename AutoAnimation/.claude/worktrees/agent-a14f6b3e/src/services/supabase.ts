import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

// Create Supabase client (will be null if not configured)
// Using generic client to avoid complex type issues with schema
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ============================================
// Storage Helpers
// ============================================

/**
 * Convert base64 data URL to Blob
 */
export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Upload sprite image to Supabase Storage
 */
export async function uploadSprite(
  projectId: string,
  dataURL: string,
  partType: string,
  index: number
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const blob = dataURLtoBlob(dataURL)
  const path = `${projectId}/${partType}_${index}.png`

  const { error } = await supabase.storage
    .from('sprites')
    .upload(path, blob, {
      upsert: true,
      contentType: 'image/png',
    })

  if (error) throw error

  const { data } = supabase.storage.from('sprites').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Upload audio file to Supabase Storage
 */
export async function uploadAudio(
  projectId: string,
  blob: Blob,
  voiceId: string
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const path = `${projectId}/voice_${voiceId}.mp3`

  const { error } = await supabase.storage
    .from('audio')
    .upload(path, blob, {
      upsert: true,
      contentType: 'audio/mpeg',
    })

  if (error) throw error

  const { data } = supabase.storage.from('audio').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Upload project thumbnail
 */
export async function uploadThumbnail(
  projectId: string,
  blob: Blob
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const path = `${projectId}.png`

  const { error } = await supabase.storage
    .from('thumbnails')
    .upload(path, blob, {
      upsert: true,
      contentType: 'image/png',
    })

  if (error) throw error

  const { data } = supabase.storage.from('thumbnails').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Delete all sprites for a project
 */
export async function deleteProjectSprites(projectId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: files } = await supabase.storage
    .from('sprites')
    .list(projectId)

  if (files && files.length > 0) {
    const paths = files.map((f) => `${projectId}/${f.name}`)
    await supabase.storage.from('sprites').remove(paths)
  }
}

/**
 * Delete all audio for a project
 */
export async function deleteProjectAudio(projectId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: files } = await supabase.storage
    .from('audio')
    .list(projectId)

  if (files && files.length > 0) {
    const paths = files.map((f) => `${projectId}/${f.name}`)
    await supabase.storage.from('audio').remove(paths)
  }
}

/**
 * Upload a file to the project-templates storage bucket
 */
export async function uploadTemplateFile(
  templateId: string,
  path: string,
  blob: Blob,
  contentType = 'application/octet-stream'
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const fullPath = `${templateId}/${path}`

  const { error } = await supabase.storage
    .from('project-templates')
    .upload(fullPath, blob, {
      upsert: true,
      contentType,
    })

  if (error) throw error

  const { data } = supabase.storage.from('project-templates').getPublicUrl(fullPath)
  return data.publicUrl
}

/**
 * Delete all files for a template from the project-templates bucket
 */
export async function deleteTemplateFiles(templateId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: files } = await supabase.storage
    .from('project-templates')
    .list(templateId)

  if (files && files.length > 0) {
    const paths = files.map((f) => `${templateId}/${f.name}`)
    await supabase.storage.from('project-templates').remove(paths)
  }
}

/**
 * Fetch image from URL and convert to base64 data URL
 */
export async function urlToDataURL(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
