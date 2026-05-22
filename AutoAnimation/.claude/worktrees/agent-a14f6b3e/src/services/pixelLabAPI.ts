/**
 * PixelLab API client — wraps the 8 actual PixelLab REST API v1 endpoints.
 * All requests go through our Express backend proxy at /api/pixellab/*.
 *
 * Endpoints:
 *   POST /generate-pixflux   → /v1/generate-image-pixflux
 *   POST /generate-bitforge  → /v1/generate-image-bitforge
 *   POST /animate-text       → /v1/animate-with-text
 *   POST /animate-skeleton   → /v1/animate-with-skeleton
 *   POST /rotate             → /v1/rotate
 *   POST /inpaint            → /v1/inpaint
 *   POST /estimate-skeleton  → /v1/estimate-skeleton
 *   GET  /balance            → /v1/balance
 */
import type {
  PixfluxRequest,
  PixfluxResponse,
  BitforgeRequest,
  BitforgeResponse,
  AnimateTextRequest,
  AnimateTextResponse,
  AnimateSkeletonRequest,
  AnimateSkeletonResponse,
  RotateRequest,
  RotateResponse,
  InpaintRequest,
  InpaintResponse,
  EstimateSkeletonRequest,
  EstimateSkeletonResponse,
  BalanceResponse,
} from '@/types/pixelLab'
import { withCreditGate } from './creditGate'

const API_BASE = '/api/pixellab'

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || `PixelLab API error: ${res.statusText}`)
  }

  return res.json()
}

// ─── Image Generation ───────────────────────────────────────────────────────

/** Generate pixel art image using PixFlux engine */
export async function generatePixflux(request: PixfluxRequest): Promise<PixfluxResponse> {
  return withCreditGate('pixellab-generate-image', () =>
    apiFetch<PixfluxResponse>('/generate-pixflux', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  )
}

/** Generate pixel art image using BitForge engine (supports style transfer) */
export async function generateBitforge(request: BitforgeRequest): Promise<BitforgeResponse> {
  return withCreditGate('pixellab-generate-image', () =>
    apiFetch<BitforgeResponse>('/generate-bitforge', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  )
}

// ─── Animation ──────────────────────────────────────────────────────────────

/** Animate a character from text description */
export async function animateWithText(request: AnimateTextRequest): Promise<AnimateTextResponse> {
  return withCreditGate('pixellab-animate', () =>
    apiFetch<AnimateTextResponse>('/animate-text', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  )
}

/** Animate a character with skeleton keyframes */
export async function animateWithSkeleton(request: AnimateSkeletonRequest): Promise<AnimateSkeletonResponse> {
  return withCreditGate('pixellab-animate', () =>
    apiFetch<AnimateSkeletonResponse>('/animate-skeleton', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  )
}

// ─── Image Operations ───────────────────────────────────────────────────────

/** Rotate a character to a different direction/view */
export async function rotateImage(request: RotateRequest): Promise<RotateResponse> {
  return withCreditGate('pixellab-edit-image', () =>
    apiFetch<RotateResponse>('/rotate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  )
}

/** Inpaint/edit specific areas of pixel art */
export async function inpaintImage(request: InpaintRequest): Promise<InpaintResponse> {
  return withCreditGate('pixellab-edit-image', () =>
    apiFetch<InpaintResponse>('/inpaint', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  )
}

/** Estimate skeleton keypoints from a character image */
export async function estimateSkeleton(request: EstimateSkeletonRequest): Promise<EstimateSkeletonResponse> {
  return apiFetch<EstimateSkeletonResponse>('/estimate-skeleton', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// ─── Account ────────────────────────────────────────────────────────────────

/** Get PixelLab account credit balance */
export async function getBalance(): Promise<BalanceResponse> {
  return apiFetch<BalanceResponse>('/balance')
}
