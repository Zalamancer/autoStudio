import { supabase } from './supabase'

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })

  if (response.status === 401) {
    // Trigger re-auth
    await supabase.auth.refreshSession()
    // Retry once
    const retryHeaders = await getAuthHeaders()
    const retry = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...retryHeaders, ...options.headers },
    })
    if (!retry.ok) throw new Error(`API error: ${retry.status}`)
    return retry.json()
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API error: ${response.status}`)
  }

  return response.json()
}

// Templates
export interface TemplateSummary {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  thumbnailUrl: string | null
  configSchema: Array<{ key: string; label: string; type: string; defaultValue: unknown; group: string; options?: string[]; min?: number; max?: number }>
  defaultConfig: Record<string, unknown>
}

export interface TemplateDetail extends TemplateSummary {
  motionDesignDescription: Record<string, unknown>
}

export async function fetchTemplates(params?: { category?: string; search?: string }) {
  const query = new URLSearchParams()
  if (params?.category) query.set('category', params.category)
  if (params?.search) query.set('search', params.search)
  const qs = query.toString()
  return apiRequest<{ templates: TemplateSummary[]; total: number }>(
    `/api/mobile/templates${qs ? `?${qs}` : ''}`
  )
}

export async function fetchTemplateById(id: string) {
  return apiRequest<TemplateDetail>(`/api/mobile/templates/${id}`)
}

// Projects
export interface Project {
  id: string
  name: string
  aspectRatio: string
  fps: number
  width: number
  height: number
  templateId: string | null
  configState: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export async function fetchProjects() {
  return apiRequest<{ projects: Project[]; total: number }>('/api/mobile/projects')
}

export async function createProject(data: {
  name: string
  templateId?: string
  configState?: Record<string, unknown>
  motionDesignDescription?: Record<string, unknown>
}) {
  return apiRequest<Project>('/api/mobile/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProject(id: string, data: Partial<{
  name: string
  templateId: string
  configState: Record<string, unknown>
  motionDesignDescription: Record<string, unknown>
}>) {
  return apiRequest<Project>(`/api/mobile/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteProject(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/mobile/projects/${id}`, {
    method: 'DELETE',
  })
}

// Renders
export async function submitRender(data: {
  motionDesignDescription: Record<string, unknown>
  configOverrides?: Record<string, unknown>
  settings?: { aspectRatio?: string; durationSeconds?: number; fps?: number; format?: 'mp4' | 'webm' }
}) {
  return apiRequest<{ jobId: string; status: string }>('/api/mobile/renders', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function pollRenderStatus(jobId: string) {
  return apiRequest<{
    jobId: string
    status: string
    resultUrl: string | null
    errorMessage: string | null
  }>(`/api/mobile/renders/${jobId}`)
}
