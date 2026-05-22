import { supabase } from './supabase'
import type { AppNotification } from '@/types/promotions'

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase!.auth.getSession()
  const token = data.session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const API_BASE = '/api/notifications'

export async function fetchNotifications(params?: {
  page?: number
  limit?: number
}): Promise<{ notifications: AppNotification[]; total: number }> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const res = await fetch(`${API_BASE}?${qs}`, { headers: await authHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/unread-count`, { headers: await authHeaders() })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.count
}

export async function markAsRead(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}/read`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function markAllRead(): Promise<void> {
  const res = await fetch(`${API_BASE}/mark-all-read`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(await res.text())
}
