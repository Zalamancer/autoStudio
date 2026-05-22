/**
 * Stock Asset Service — client-side API for generating and browsing AI stock assets.
 *
 * Talks to /api/stock-assets/* endpoints on the server, which handle:
 * grid image generation → cropping → background removal → vectorization → storage → marketplace
 */

import type {
  StockAsset,
  StockAssetCategory,
  StockAssetStyle,
  StockAssetGenerateRequest,
  StockAssetGenerateResponse,
} from '@/types/stockAssets'

const API_BASE = '/api/stock-assets'

/**
 * Get auth headers from Supabase session
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import('@/services/supabase')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`
    }
  }
  return headers
}

/**
 * Generate a batch of stock assets from text descriptions.
 * This calls the server-side pipeline which handles:
 * 1. AI grid image generation (fal.ai)
 * 2. Grid cropping (sharp)
 * 3. Background removal
 * 4. Vectorization (potrace)
 * 5. Upload to Supabase storage
 * 6. Marketplace listing creation
 */
export async function generateStockAssets(
  request: StockAssetGenerateRequest,
): Promise<StockAssetGenerateResponse> {
  const headers = await getAuthHeaders()

  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Generate failed: ${res.status}`)
  }

  return res.json()
}

/**
 * Browse stock assets from the marketplace.
 */
export async function browseStockAssets(opts?: {
  category?: StockAssetCategory
  style?: StockAssetStyle
  limit?: number
  offset?: number
}): Promise<{ assets: StockAsset[]; total: number }> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()
  if (opts?.category) params.set('category', opts.category)
  if (opts?.style) params.set('style', opts.style)
  if (opts?.limit) params.set('limit', String(opts.limit))
  if (opts?.offset) params.set('offset', String(opts.offset))

  const res = await fetch(`${API_BASE}?${params}`, { headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Browse failed' }))
    throw new Error(err.error || `Browse failed: ${res.status}`)
  }

  return res.json()
}

/**
 * Search stock assets by text query.
 */
export async function searchStockAssets(
  query: string,
  limit = 20,
): Promise<{ assets: StockAsset[] }> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams({ q: query, limit: String(limit) })

  const res = await fetch(`${API_BASE}/search?${params}`, { headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Search failed' }))
    throw new Error(err.error || `Search failed: ${res.status}`)
  }

  return res.json()
}

/**
 * Delete a stock asset.
 */
export async function deleteStockAsset(id: string): Promise<void> {
  const headers = await getAuthHeaders()

  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Delete failed' }))
    throw new Error(err.error || `Delete failed: ${res.status}`)
  }
}
