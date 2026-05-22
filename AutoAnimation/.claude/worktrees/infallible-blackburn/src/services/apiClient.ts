/**
 * Centralized API client for authenticated backend requests.
 *
 * Provides a single source of truth for:
 * - Auth header injection (Supabase JWT)
 * - Structured error handling (ApiError with status/data)
 * - Response parsing
 * - Typed request helpers (get, post, put, del)
 *
 * Usage:
 *   import { apiClient, ApiError } from '@/services/apiClient'
 *   const data = await apiClient.post<MyResponse>('/api/credits/deduct', { operation: 'tts' })
 */

import { useAuthStore } from '@/stores/useAuthStore'

/** Error with HTTP status and optional response data */
export class ApiError extends Error {
  status: number
  data: unknown
  constructor(message: string, status: number, data: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().session?.access_token
  if (!token) throw new ApiError('Not authenticated', 401)
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(path, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
  })

  if (resp.status === 401) {
    throw new ApiError('Authentication expired', 401)
  }

  let data: Record<string, unknown>
  try {
    data = await resp.json()
  } catch {
    if (!resp.ok) {
      throw new ApiError(`Request failed (${resp.status})`, resp.status)
    }
    throw new Error(`Invalid JSON response from ${path}`)
  }

  if (!resp.ok) {
    throw new ApiError(
      (data.error as string) || (data.message as string) || `Request failed (${resp.status})`,
      resp.status,
      data,
    )
  }

  return data as T
}

export const apiClient = {
  /** GET request with auth */
  get<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' })
  },

  /** POST request with auth + JSON body */
  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(path, {
      ...options,
      method: 'POST',
      body: body != null ? JSON.stringify(body) : undefined,
    })
  },

  /** PUT request with auth + JSON body */
  put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(path, {
      ...options,
      method: 'PUT',
      body: body != null ? JSON.stringify(body) : undefined,
    })
  },

  /** DELETE request with auth */
  del<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>(path, { ...options, method: 'DELETE' })
  },

  /** Check if user is authenticated (without throwing) */
  isAuthenticated(): boolean {
    return !!useAuthStore.getState().session?.access_token
  },
}
