import { supabase } from './supabase'
import type { PromotionRequest, PromotionSubmission } from '@/types/promotions'

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase!.auth.getSession()
  const token = data.session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const API_BASE = '/api/promotions'

// ── Requests ──

export async function fetchOpenRequests(params?: {
  niche_tags?: string[]
  search?: string
  page?: number
  limit?: number
}): Promise<{ requests: PromotionRequest[]; total: number }> {
  const qs = new URLSearchParams()
  if (params?.niche_tags?.length) qs.set('niche_tags', params.niche_tags.join(','))
  if (params?.search) qs.set('search', params.search)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const res = await fetch(`${API_BASE}/requests?${qs}`, { headers: await authHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchRequestDetails(id: string): Promise<PromotionRequest> {
  const res = await fetch(`${API_BASE}/requests/${id}`, { headers: await authHeaders() })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.request
}

export async function createRequest(data: {
  title: string
  description: string
  budget_credits: number
  niche_tags: string[]
  deadline?: string
  reference_media?: { url: string; type: 'image' | 'video'; caption?: string }[]
  max_submissions?: number
}): Promise<PromotionRequest> {
  const res = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.text())
  const result = await res.json()
  return result.request
}

export async function cancelRequest(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/requests/${id}/cancel`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function completeRequest(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/requests/${id}/complete`, {
    method: 'POST',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(await res.text())
}

// ── Submissions ──

export async function fetchRequestSubmissions(requestId: string): Promise<PromotionSubmission[]> {
  const res = await fetch(`${API_BASE}/requests/${requestId}/submissions`, { headers: await authHeaders() })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.submissions
}

export async function submitWork(requestId: string, data: {
  title: string
  description?: string
  asset_url: string
  thumbnail_url?: string
  project_id?: string
}): Promise<PromotionSubmission> {
  const res = await fetch(`${API_BASE}/requests/${requestId}/submissions`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.text())
  const result = await res.json()
  return result.submission
}

export async function withdrawSubmission(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/submissions/${id}/withdraw`, {
    method: 'PATCH',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function approveSubmission(id: string, rewardCredits: number): Promise<void> {
  const res = await fetch(`${API_BASE}/submissions/${id}/approve`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ reward_credits: rewardCredits }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function rejectSubmission(id: string, feedback: string): Promise<void> {
  const res = await fetch(`${API_BASE}/submissions/${id}/reject`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ feedback }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function fetchMySubmissions(): Promise<PromotionSubmission[]> {
  const res = await fetch(`${API_BASE}/my-submissions`, { headers: await authHeaders() })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.submissions
}
