/**
 * Social media publishing service.
 * Handles OAuth flows (popup-based) and video publishing via backend proxy.
 * Tokens are stored server-side — frontend only sends its Supabase JWT.
 */

import type {
  SocialPlatform,
  SocialAccount,
  FacebookPublishOptions,
  InstagramPublishOptions,
  TikTokPublishOptions,
  TikTokProfile,
  TikTokVideoListResponse,
  XPublishOptions,
  YouTubePublishOptions,
  PublishResult,
  ScheduledPost,
  MetadataGenerationResult,
  PublishJob,
} from '@/types/social'
import { useAuthStore } from '@/stores/useAuthStore'

// ── Helpers ────────────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().session?.access_token
  if (!token) throw new Error('Not authenticated. Please sign in first.')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`/api/social${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
  })
  // Silently handle auth failures (expired/stale tokens)
  if (resp.status === 401) {
    const err: any = new Error('Authentication failed')
    err.status = 401
    throw err
  }
  const data = await resp.json()
  if (!resp.ok) {
    throw new Error(data.error || `Request failed (${resp.status})`)
  }
  return data
}

// ── Accounts ───────────────────────────────────────────────────────────────

/** Fetch connected social accounts from the backend */
const DEFAULT_ACCOUNTS: SocialAccount[] = [
  { platform: 'facebook', connected: false },
  { platform: 'instagram', connected: false },
  { platform: 'tiktok', connected: false },
  { platform: 'x', connected: false },
  { platform: 'youtube', connected: false },
]

export async function getSocialAccounts(): Promise<SocialAccount[]> {
  // Skip API call if not authenticated — avoids 401 errors
  const { session, user } = useAuthStore.getState()
  if (!user || !session?.access_token) return DEFAULT_ACCOUNTS

  try {
    const data = await apiRequest<{ accounts: SocialAccount[] }>('/accounts')
    return data.accounts
  } catch {
    return DEFAULT_ACCOUNTS
  }
}

/** Initiate OAuth flow in a popup window. Returns when popup closes. */
export async function connectPlatform(
  platform: SocialPlatform
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the authorization URL from the backend
    const data = await apiRequest<{ authUrl: string }>(`/auth/${platform}`)

    // Open popup
    const popup = window.open(
      data.authUrl,
      `${platform}-oauth`,
      'width=600,height=700,scrollbars=yes,resizable=yes'
    )

    if (!popup) {
      return { success: false, error: 'Popup was blocked. Please allow popups for this site.' }
    }

    // Wait for the callback postMessage from the popup
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler)
        resolve({ success: false, error: 'OAuth timed out. Please try again.' })
      }, 5 * 60 * 1000) // 5 minute timeout

      function handler(event: MessageEvent) {
        // Parse the message (it's double-JSON-stringified from the callback HTML)
        let msg: any
        try {
          msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        } catch {
          return // Not our message
        }

        if (msg?.type !== 'social-oauth-callback') return

        clearTimeout(timeout)
        window.removeEventListener('message', handler)
        resolve({
          success: msg.success,
          error: msg.error,
        })
      }

      window.addEventListener('message', handler)

      // Also detect if popup was closed manually
      const pollClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollClosed)
          clearTimeout(timeout)
          window.removeEventListener('message', handler)
          // Give a brief delay in case the message arrived just before close
          setTimeout(() => resolve({ success: false, error: 'Authorization window was closed.' }), 500)
        }
      }, 1000)
    })
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/** Disconnect a social account */
export async function disconnectPlatform(platform: SocialPlatform): Promise<void> {
  await apiRequest(`/accounts/${platform}`, { method: 'DELETE' })
}

// ── Publishing ─────────────────────────────────────────────────────────────

/** Publish video to Instagram via backend */
export async function publishToInstagram(
  videoUrl: string,
  options: InstagramPublishOptions
): Promise<PublishResult> {
  try {
    const result = await apiRequest<PublishResult>('/publish/instagram', {
      method: 'POST',
      body: JSON.stringify({
        videoUrl,
        caption: options.caption,
        hashtags: options.hashtags,
        postType: options.postType,
        coverImageTimestamp: options.coverImageTimestamp,
      }),
    })
    return result
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/** Publish video to Facebook via backend */
export async function publishToFacebook(
  videoUrl: string,
  options: FacebookPublishOptions
): Promise<PublishResult> {
  try {
    const result = await apiRequest<PublishResult>('/publish/facebook', {
      method: 'POST',
      body: JSON.stringify({
        videoUrl,
        description: options.description,
        privacy: options.privacy,
        scheduledTime: options.scheduledTime,
      }),
    })
    return result
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/** Publish video to TikTok via backend */
export async function publishToTikTok(
  videoUrl: string,
  options: TikTokPublishOptions
): Promise<PublishResult> {
  try {
    const result = await apiRequest<PublishResult>('/publish/tiktok', {
      method: 'POST',
      body: JSON.stringify({
        videoUrl,
        description: options.description,
        hashtags: options.hashtags,
        privacy: options.privacy,
        allowComments: options.allowComments,
        allowDuets: options.allowDuets,
        allowStitches: options.allowStitches,
        postMode: options.postMode || 'direct',
        brandContentToggle: options.brandContentToggle || false,
        brandOrganicToggle: options.brandOrganicToggle || false,
      }),
    })
    return result
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/** Fetch TikTok profile with stats (user.info.basic + profile + stats) */
export async function getTikTokProfile(): Promise<TikTokProfile | null> {
  try {
    return await apiRequest<TikTokProfile>('/tiktok/profile')
  } catch {
    return null
  }
}

/** Fetch user's TikTok videos (video.list scope) */
export async function getTikTokVideos(cursor?: number): Promise<TikTokVideoListResponse> {
  try {
    const query = cursor ? `?cursor=${cursor}` : ''
    return await apiRequest<TikTokVideoListResponse>(`/tiktok/videos${query}`)
  } catch {
    return { videos: [], cursor: 0, hasMore: false }
  }
}

/** Publish video to X (Twitter) via backend */
export async function publishToX(
  videoUrl: string,
  options: XPublishOptions
): Promise<PublishResult> {
  try {
    const result = await apiRequest<PublishResult>('/publish/x', {
      method: 'POST',
      body: JSON.stringify({
        videoUrl,
        tweetText: options.tweetText,
        mediaAltText: options.mediaAltText,
      }),
    })
    return result
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/** Publish video to YouTube Shorts via backend */
export async function publishToYouTube(
  videoUrl: string,
  options: YouTubePublishOptions
): Promise<PublishResult> {
  try {
    const result = await apiRequest<PublishResult>('/publish/youtube', {
      method: 'POST',
      body: JSON.stringify({
        videoUrl,
        title: options.title,
        description: options.description,
        tags: options.tags,
        privacy: options.privacy,
        madeForKids: options.madeForKids,
        uploadType: options.uploadType,
      }),
    })
    return result
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ── Scheduling ──────────────────────────────────────────────────────────

/** Schedule a post for future publishing */
export async function schedulePost(
  platform: SocialPlatform,
  videoUrl: string,
  recordingId: string,
  options: Record<string, unknown>,
  scheduledAt: string,
): Promise<ScheduledPost> {
  return apiRequest<ScheduledPost>('/schedule', {
    method: 'POST',
    body: JSON.stringify({ platform, videoUrl, recordingId, options, scheduledAt }),
  })
}

/** Fetch all scheduled posts for the current user */
export async function getScheduledPosts(): Promise<ScheduledPost[]> {
  try {
    const data = await apiRequest<{ posts: ScheduledPost[] }>('/scheduled')
    return data.posts
  } catch {
    return []
  }
}

/** Cancel a pending scheduled post */
export async function cancelScheduledPost(id: string): Promise<void> {
  await apiRequest(`/scheduled/${id}`, { method: 'DELETE' })
}

/** Get the publish status of an async publish job */
export async function getPublishStatus(jobId: string): Promise<PublishJob> {
  return apiRequest<PublishJob>(`/publish-status/${jobId}`)
}

// ── AI Metadata Generation ──────────────────────────────────────────────

/** Generate AI-powered metadata (title, description, hashtags) for a video */
export async function generateMetadata(
  contentSummary: string,
  platform?: SocialPlatform,
  tone?: string,
): Promise<MetadataGenerationResult> {
  try {
    return await apiRequest<MetadataGenerationResult>('/generate-metadata', {
      method: 'POST',
      body: JSON.stringify({ contentSummary, platform, tone }),
    })
  } catch {
    // Fall back to client-side generation
    const { generatePublishMetadata } = await import('./publishMetadataGenerator')
    return generatePublishMetadata(contentSummary, platform, tone)
  }
}
