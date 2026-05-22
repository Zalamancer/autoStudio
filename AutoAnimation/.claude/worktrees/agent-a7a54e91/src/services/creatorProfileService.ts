import { supabase } from './supabase'
import type { CreatorProfile } from '@/types/promotions'

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase!.auth.getSession()
  const token = data.session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const API_BASE = '/api/creator-profile'

export async function fetchMyProfile(): Promise<CreatorProfile> {
  const res = await fetch(`${API_BASE}/me`, { headers: await authHeaders() })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.profile
}

export async function updateMyProfile(updates: {
  opted_in?: boolean
  display_name?: string
  bio?: string
  niche_tags?: string[]
}): Promise<CreatorProfile> {
  const res = await fetch(`${API_BASE}/me`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.profile
}

export async function suggestTags(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/me/ai-suggest-tags`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.tags
}
