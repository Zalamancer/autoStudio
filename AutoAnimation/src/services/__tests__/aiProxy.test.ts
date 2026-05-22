import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the dependencies BEFORE importing aiProxy
vi.mock('@/utils/fetchWithRetry', () => ({
  fetchWithRetry: vi.fn(),
}))

vi.mock('@/utils/fetchWithTimeout', () => ({
  fetchWithTimeout: vi.fn(),
}))

vi.mock('@/stores/useAuthStore', () => {
  const store = {
    getState: vi.fn(() => ({ session: null })),
  }
  return { useAuthStore: store }
})

import {
  callGeminiProxy,
  callElevenLabsProxy,
  callPixabayProxy,
  callFreesoundProxy,
  checkProxyServiceAvailable,
} from '../aiProxy'
import { fetchWithRetry } from '@/utils/fetchWithRetry'
import { fetchWithTimeout } from '@/utils/fetchWithTimeout'
import { useAuthStore } from '@/stores/useAuthStore'

const mockedFetchWithRetry = vi.mocked(fetchWithRetry)
const mockedFetchWithTimeout = vi.mocked(fetchWithTimeout)
const mockedGetState = vi.mocked(useAuthStore.getState)

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetState.mockReturnValue({ session: null } as any)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('callGeminiProxy', () => {
  it('constructs the correct URL with model name', async () => {
    mockedFetchWithRetry.mockResolvedValue(new Response('{}'))

    await callGeminiProxy('gemini-3-flash-preview', { contents: [] })

    expect(mockedFetchWithRetry).toHaveBeenCalledOnce()
    const [url] = mockedFetchWithRetry.mock.calls[0]
    expect(url).toBe('/api/proxy/gemini/gemini-3-flash-preview?action=generateContent')
  })

  it('sends JSON body with Content-Type header', async () => {
    mockedFetchWithRetry.mockResolvedValue(new Response('{}'))

    const body = { contents: [{ parts: [{ text: 'hello' }] }] }
    await callGeminiProxy('gemini-3-flash-preview', body)

    const [, options] = mockedFetchWithRetry.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/json' }))
    expect(options.body).toBe(JSON.stringify(body))
  })

  it('includes Authorization header when session exists', async () => {
    mockedGetState.mockReturnValue({
      session: { access_token: 'test-token-123' },
    } as any)

    mockedFetchWithRetry.mockResolvedValue(new Response('{}'))
    await callGeminiProxy('gemini-3-flash-preview', { contents: [] })

    const [, options] = mockedFetchWithRetry.mock.calls[0]
    expect(options.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer test-token-123' }))
  })

  it('omits Authorization header when no session', async () => {
    mockedGetState.mockReturnValue({ session: null } as any)

    mockedFetchWithRetry.mockResolvedValue(new Response('{}'))
    await callGeminiProxy('gemini-3-flash-preview', { contents: [] })

    const [, options] = mockedFetchWithRetry.mock.calls[0]
    expect(options.headers).not.toHaveProperty('Authorization')
  })

  it('passes timeout config to fetchWithRetry', async () => {
    mockedFetchWithRetry.mockResolvedValue(new Response('{}'))

    const customConfig = { maxRetries: 3, timeoutMs: 120_000, retryDelayMs: 2_000 }
    await callGeminiProxy('gemini-3-flash-preview', { contents: [] }, customConfig)

    const [, , config] = mockedFetchWithRetry.mock.calls[0]
    expect(config).toEqual(customConfig)
  })

  it('uses default config when none provided', async () => {
    mockedFetchWithRetry.mockResolvedValue(new Response('{}'))
    await callGeminiProxy('gemini-3-flash-preview', { contents: [] })

    const [, , config] = mockedFetchWithRetry.mock.calls[0]
    expect(config).toEqual({ maxRetries: 1, timeoutMs: 60_000, retryDelayMs: 1_000 })
  })
})

describe('callElevenLabsProxy', () => {
  it('constructs the correct URL with endpoint', async () => {
    mockedFetchWithRetry.mockResolvedValue(new Response('{}'))

    await callElevenLabsProxy('text-to-speech/voiceId/with-timestamps')

    const [url] = mockedFetchWithRetry.mock.calls[0]
    expect(url).toBe('/api/proxy/elevenlabs/text-to-speech/voiceId/with-timestamps')
  })

  it('preserves Content-Type from caller options', async () => {
    mockedFetchWithRetry.mockResolvedValue(new Response('{}'))

    await callElevenLabsProxy('text-to-speech/voiceId', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })

    const [, options] = mockedFetchWithRetry.mock.calls[0]
    expect(options.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/json' }))
  })
})

describe('callPixabayProxy', () => {
  it('constructs URL with type and query params', async () => {
    mockedFetchWithRetry.mockResolvedValue(new Response('{}'))

    await callPixabayProxy('images', { q: 'sunset', per_page: '20' })

    const [url] = mockedFetchWithRetry.mock.calls[0]
    expect(url).toBe('/api/proxy/pixabay/images?q=sunset&per_page=20')
  })

  it('supports videos type', async () => {
    mockedFetchWithRetry.mockResolvedValue(new Response('{}'))

    await callPixabayProxy('videos', { q: 'ocean' })

    const [url] = mockedFetchWithRetry.mock.calls[0]
    expect(url).toBe('/api/proxy/pixabay/videos?q=ocean')
  })
})

describe('callFreesoundProxy', () => {
  it('constructs URL with query params', async () => {
    mockedFetchWithRetry.mockResolvedValue(new Response('{}'))

    await callFreesoundProxy({ query: 'rain', page_size: '10' })

    const [url] = mockedFetchWithRetry.mock.calls[0]
    expect(url).toBe('/api/proxy/freesound/search?query=rain&page_size=10')
  })
})

describe('checkProxyServiceAvailable', () => {
  it('returns true when proxy responds ok', async () => {
    mockedFetchWithTimeout.mockResolvedValue(new Response('', { status: 200 }))

    const result = await checkProxyServiceAvailable('gemini')

    expect(result).toBe(true)
    const [url, , timeout] = mockedFetchWithTimeout.mock.calls[0]
    expect(url).toBe('/api/proxy/gemini/status')
    expect(timeout).toBe(10_000)
  })

  it('returns false when proxy responds with error', async () => {
    mockedFetchWithTimeout.mockResolvedValue(new Response('', { status: 404 }))

    const result = await checkProxyServiceAvailable('elevenlabs')
    expect(result).toBe(false)
  })

  it('returns false when fetch throws (server down)', async () => {
    mockedFetchWithTimeout.mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await checkProxyServiceAvailable('pixabay')
    expect(result).toBe(false)
  })

  it('passes auth headers to status check', async () => {
    mockedGetState.mockReturnValue({
      session: { access_token: 'status-token' },
    } as any)
    mockedFetchWithTimeout.mockResolvedValue(new Response('', { status: 200 }))

    await checkProxyServiceAvailable('freesound')

    const [, options] = mockedFetchWithTimeout.mock.calls[0]
    expect(options.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer status-token' }))
  })
})
