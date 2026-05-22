/**
 * HTTP client wrapper for the ProAnimate API.
 * Handles auth headers, base URL, error formatting, retry logic.
 */

import type { CliConfig } from './config.js'

export interface ApiError {
  error: string
  code: string
  details?: Record<string, unknown>
}

export class ProAnimateApiClient {
  private baseUrl: string
  private apiKey: string

  constructor(config: CliConfig) {
    this.baseUrl = config.serverUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    }
  }

  async get<T = unknown>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(err.error || `API error: ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  async post<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(err.error || `API error: ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  async delete(endpoint: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.headers(),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(err.error || `API error: ${response.status}`)
    }
  }

  async download(endpoint: string, outputPath: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'x-api-key': this.apiKey },
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`)
    }

    const fs = await import('node:fs')
    const { Readable } = await import('node:stream')
    const { pipeline } = await import('node:stream/promises')

    const fileStream = fs.createWriteStream(outputPath)
    const readable = Readable.fromWeb(response.body as any)
    await pipeline(readable, fileStream)
  }

  /**
   * Poll a render job until it completes, calling onStatus for each poll.
   */
  async pollRenderJob(
    jobId: string,
    onStatus?: (status: string, step?: string) => void,
    intervalMs: number = 5000,
    timeoutMs: number = 600000, // 10 minutes
  ): Promise<{ status: string; resultUrl?: string; error?: string }> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      const result = await this.get<{
        status: string
        resultUrl?: string
        error_message?: string
        current_step?: string
      }>(`/api/v1/renders/${jobId}`)

      onStatus?.(result.status, result.current_step)

      if (result.status === 'complete') {
        return { status: 'complete', resultUrl: result.resultUrl }
      }

      if (result.status === 'failed') {
        return { status: 'failed', error: result.error_message || 'Render failed' }
      }

      if (result.status === 'cancelled') {
        return { status: 'cancelled', error: 'Render was cancelled' }
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }

    return { status: 'timeout', error: 'Render timed out' }
  }
}
