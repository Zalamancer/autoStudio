/**
 * Frontend API client for the marketplace & royalty system.
 * Calls /api/marketplace/* endpoints on the backend.
 */

import type {
  MarketplaceListing,
  MarketplaceListingCategory,
  RoyaltyDistributionResult,
  CreatorEarnings,
} from '@/types/marketplace'
import { useAuthStore } from '@/stores/useAuthStore'

// ── Helpers ──

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().session?.access_token
  if (!token) throw new Error('Not authenticated. Please sign in first.')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(path, {
    ...options,
    headers: { ...options?.headers },
  })
  const data = await resp.json()
  if (!resp.ok) {
    const err: any = new Error(data.error || data.message || `Request failed (${resp.status})`)
    err.status = resp.status
    err.data = data
    throw err
  }
  return data
}

async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  return apiRequest<T>(path, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
  })
}

// ── Listings ──

export async function fetchListings(opts?: {
  category?: MarketplaceListingCategory | 'all'
  search?: string
  page?: number
  limit?: number
}): Promise<{ listings: MarketplaceListing[] }> {
  const params = new URLSearchParams()
  if (opts?.category && opts.category !== 'all') params.set('category', opts.category)
  if (opts?.search) params.set('search', opts.search)
  if (opts?.page) params.set('page', String(opts.page))
  if (opts?.limit) params.set('limit', String(opts.limit))
  const qs = params.toString()
  return apiRequest<{ listings: MarketplaceListing[] }>(
    `/api/marketplace/listings${qs ? `?${qs}` : ''}`
  )
}

export async function createListing(listing: {
  title: string
  description?: string
  category: MarketplaceListingCategory
  asset_url: string
  thumbnail_url?: string
  metadata?: Record<string, unknown>
}): Promise<{ listing: MarketplaceListing }> {
  return authRequest<{ listing: MarketplaceListing }>('/api/marketplace/listings', {
    method: 'POST',
    body: JSON.stringify(listing),
  })
}

export async function fetchListing(id: string): Promise<{ listing: MarketplaceListing }> {
  return apiRequest<{ listing: MarketplaceListing }>(`/api/marketplace/listings/${id}`)
}

export async function deleteListing(id: string): Promise<{ success: boolean }> {
  return authRequest<{ success: boolean }>(`/api/marketplace/listings/${id}`, {
    method: 'DELETE',
  })
}

// ── Usage Tracking ──

export async function recordUsage(projectId: string, listingIds: string[]): Promise<{ success: boolean; recorded: number }> {
  return authRequest<{ success: boolean; recorded: number }>('/api/marketplace/usage', {
    method: 'POST',
    body: JSON.stringify({ projectId, listingIds }),
  })
}

// ── Royalty Distribution ──

export async function distributeRoyalties(
  projectId: string,
  totalCreditsSpent: number
): Promise<RoyaltyDistributionResult> {
  return authRequest<RoyaltyDistributionResult>('/api/marketplace/royalties/distribute', {
    method: 'POST',
    body: JSON.stringify({ projectId, totalCreditsSpent }),
  })
}

// ── Earnings ──

export async function fetchEarnings(): Promise<CreatorEarnings> {
  return authRequest<CreatorEarnings>('/api/marketplace/earnings')
}

// ── My Listings ──

export async function fetchMyListings(): Promise<{ listings: MarketplaceListing[] }> {
  return authRequest<{ listings: MarketplaceListing[] }>('/api/marketplace/my-listings')
}
