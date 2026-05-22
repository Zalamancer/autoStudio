import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch and auth
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({
      session: { access_token: 'test-token' },
      user: { id: 'user-1' },
    }),
  },
}))

describe('getOptimalPostingTime (heuristic fallback)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a future date when API fails', async () => {
    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { getOptimalPostingTime } = await import('../learningService')
    const result = await getOptimalPostingTime('tiktok')

    expect(result).toBeDefined()
    expect(result.suggestedTime).toBeDefined()
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.reason).toBeTruthy()

    // Should be in the future
    const suggestedDate = new Date(result.suggestedTime)
    expect(suggestedDate.getTime()).toBeGreaterThan(Date.now() - 1000)
  })

  it('returns platform-specific suggestions', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('fail'))

    const { getOptimalPostingTime } = await import('../learningService')

    const tiktok = await getOptimalPostingTime('tiktok')
    const youtube = await getOptimalPostingTime('youtube')

    // Both should have valid suggestions
    expect(tiktok.suggestedTime).toBeTruthy()
    expect(youtube.suggestedTime).toBeTruthy()
    expect(tiktok.reason).toContain('tiktok')
    expect(youtube.reason).toContain('youtube')
  })
})
