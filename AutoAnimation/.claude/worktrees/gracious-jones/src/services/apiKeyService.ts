/**
 * Frontend service for API key management.
 * Calls /api/v1/api-keys/* endpoints.
 */

export interface ApiKeyInfo {
  id: string
  name: string
  key_prefix: string
  tier: string
  rate_limit_per_minute: number
  rate_limit_per_day: number
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface ApiKeyUsageStats {
  key_id: string
  total_calls: number
  total_credits: number
  calls_today: number
  credits_today: number
}

export interface CreateApiKeyResult {
  id: string
  key: string // Full key shown once
  name: string
  key_prefix: string
  created_at: string
}

const BASE_URL = '/api/v1/api-keys'

/**
 * Create a new API key. Requires JWT auth (dashboard user).
 */
export async function createApiKey(name: string): Promise<CreateApiKeyResult> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
    credentials: 'include',
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to create API key' }))
    throw new Error(err.error || 'Failed to create API key')
  }

  return response.json()
}

/**
 * List all API keys for the current user.
 */
export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  const response = await fetch(BASE_URL, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch API keys')
  }

  const data = await response.json()
  return data.keys || []
}

/**
 * Revoke an API key.
 */
export async function revokeApiKey(keyId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${keyId}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to revoke API key')
  }
}

/**
 * Get usage stats for all keys.
 */
export async function getApiKeyUsage(): Promise<ApiKeyUsageStats[]> {
  const response = await fetch(`${BASE_URL}/usage`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch usage stats')
  }

  const data = await response.json()
  return data.usage || []
}
