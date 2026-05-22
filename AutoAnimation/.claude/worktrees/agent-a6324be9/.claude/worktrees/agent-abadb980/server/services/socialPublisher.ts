/**
 * Social Media Publisher Service.
 *
 * Extracts the core platform publish logic from social.ts route handlers
 * so the background scheduler can call it without HTTP req/res.
 *
 * Supported platforms: instagram, facebook, tiktok, x, youtube.
 */

import { getValidToken } from '../routes/social'
import { getSupabaseAdmin } from '../middleware/supabaseAuth'
import logger from '../lib/logger'

const GRAPH_API_VERSION = 'v21.0'

export interface PublishResult {
  success: boolean
  postId?: string
  postUrl?: string
  error?: string
}

export interface PublishOptions {
  // Instagram
  caption?: string
  hashtags?: string
  // Facebook
  description?: string
  privacy?: string
  // TikTok
  allowComments?: boolean
  allowDuets?: boolean
  allowStitches?: boolean
  postMode?: string
  // X / Twitter
  tweetText?: string
  mediaAltText?: string
  // YouTube
  title?: string
  tags?: string
  madeForKids?: boolean
  uploadType?: string
}

/**
 * Publish a video to a social media platform.
 * This is the core logic extracted from the route handlers so it can be
 * called by the background scheduler without an HTTP context.
 */
export async function publishToPlatform(
  userId: string,
  platform: string,
  videoUrl: string,
  options: PublishOptions = {},
): Promise<PublishResult> {
  try {
    switch (platform) {
      case 'instagram':
        return await publishInstagram(userId, videoUrl, options)
      case 'facebook':
        return await publishFacebook(userId, videoUrl, options)
      case 'tiktok':
        return await publishTikTok(userId, videoUrl, options)
      case 'x':
        return await publishX(userId, videoUrl, options)
      case 'youtube':
        return await publishYouTube(userId, videoUrl, options)
      default:
        return { success: false, error: `Unsupported platform: ${platform}` }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err, platform, userId }, '[SocialPublisher] Publish failed')
    return { success: false, error: errorMessage }
  }
}

// ── Instagram ──────────────────────────────────────────────────────────

async function publishInstagram(
  userId: string,
  videoUrl: string,
  options: PublishOptions,
): Promise<PublishResult> {
  const token = await getValidToken(userId, 'instagram')
  const supabase = getSupabaseAdmin()

  const { data: account } = await supabase
    .from('social_accounts')
    .select('platform_user_id')
    .eq('user_id', userId)
    .eq('platform', 'instagram')
    .single()

  if (!account?.platform_user_id) throw new Error('Instagram account not properly linked')

  const igUserId = account.platform_user_id
  const fullCaption = options.hashtags
    ? `${options.caption || ''}\n\n${options.hashtags}`
    : options.caption || ''

  // Step 1: Create media container
  const containerUrl = new URL(`https://graph.instagram.com/${GRAPH_API_VERSION}/${igUserId}/media`)
  containerUrl.searchParams.set('video_url', videoUrl)
  containerUrl.searchParams.set('caption', fullCaption)
  containerUrl.searchParams.set('media_type', 'REELS')
  containerUrl.searchParams.set('share_to_feed', 'true')
  containerUrl.searchParams.set('access_token', token)

  logger.info(`[SocialPublisher] Instagram: creating container for user ${igUserId}`)

  const containerResp = await fetch(containerUrl.toString(), { method: 'POST' })
  const containerData = await containerResp.json()
  if (containerData.error) throw new Error(containerData.error.message || JSON.stringify(containerData.error))

  const containerId = containerData.id

  // Step 2: Poll container status until ready
  let status = 'IN_PROGRESS'
  let attempts = 0
  while (status === 'IN_PROGRESS' && attempts < 60) {
    await new Promise((r) => setTimeout(r, 5000))
    const statusResp = await fetch(
      `https://graph.instagram.com/${GRAPH_API_VERSION}/${containerId}?fields=status_code,status&access_token=${token}`,
    )
    const statusData = await statusResp.json()
    status = statusData.status_code || 'ERROR'
    attempts++

    if (status === 'ERROR') {
      throw new Error(`Instagram media processing failed: ${statusData.status || 'Unknown error'}`)
    }
  }

  if (status !== 'FINISHED') throw new Error('Instagram media processing timed out')

  // Step 3: Publish the container
  const publishUrl = `https://graph.instagram.com/${GRAPH_API_VERSION}/${igUserId}/media_publish?creation_id=${containerId}&access_token=${token}`
  const publishResp = await fetch(publishUrl, { method: 'POST' })
  const publishData = await publishResp.json()
  if (publishData.error) throw new Error(publishData.error.message || JSON.stringify(publishData.error))

  // Get permalink
  const mediaResp = await fetch(
    `https://graph.instagram.com/${GRAPH_API_VERSION}/${publishData.id}?fields=permalink&access_token=${token}`,
  )
  const mediaData = await mediaResp.json()

  return {
    success: true,
    postId: publishData.id,
    postUrl: mediaData.permalink || `https://www.instagram.com/p/${publishData.id}/`,
  }
}

// ── Facebook ───────────────────────────────────────────────────────────

async function publishFacebook(
  userId: string,
  videoUrl: string,
  options: PublishOptions,
): Promise<PublishResult> {
  const token = await getValidToken(userId, 'facebook')
  const supabase = getSupabaseAdmin()

  const { data: account } = await supabase
    .from('social_accounts')
    .select('page_id')
    .eq('user_id', userId)
    .eq('platform', 'facebook')
    .single()

  if (!account?.page_id) throw new Error('No Facebook page linked')

  const params: Record<string, string> = {
    file_url: videoUrl,
    description: options.description || options.caption || '',
    access_token: token,
  }

  if (options.privacy === 'friends') params.privacy = JSON.stringify({ value: 'ALL_FRIENDS' })
  else if (options.privacy === 'only_me') params.privacy = JSON.stringify({ value: 'SELF' })

  const resp = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.page_id}/videos`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
  )
  const data = await resp.json()
  if (data.error) throw new Error(data.error.message)

  return {
    success: true,
    postId: data.id,
    postUrl: `https://www.facebook.com/${data.id}`,
  }
}

// ── TikTok ─────────────────────────────────────────────────────────────

async function publishTikTok(
  userId: string,
  videoUrl: string,
  options: PublishOptions,
): Promise<PublishResult> {
  const token = await getValidToken(userId, 'tiktok')

  const fullDescription = options.hashtags
    ? `${options.description || options.caption || ''} ${options.hashtags}`
    : options.description || options.caption || ''

  // Step 1: Query creator info for allowed privacy levels
  const creatorResp = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
  })
  const creatorData = await creatorResp.json()

  const allowedPrivacy = creatorData.data?.privacy_level_options || ['SELF_ONLY']
  const creatorCommentDisabled = creatorData.data?.comment_disabled ?? false
  const creatorDuetDisabled = creatorData.data?.duet_disabled ?? false
  const creatorStitchDisabled = creatorData.data?.stitch_disabled ?? false

  const resolvedPrivacy = allowedPrivacy.includes('SELF_ONLY') ? 'SELF_ONLY' : allowedPrivacy[0]

  // Step 2: Download video
  const videoResp = await fetch(videoUrl)
  if (!videoResp.ok) throw new Error(`Failed to download video: ${videoResp.status}`)
  const videoBuffer = Buffer.from(await videoResp.arrayBuffer())
  const videoSize = videoBuffer.length

  // Step 3: Initialize upload
  const postMode = options.postMode || 'direct'
  const publishEndpoint = postMode === 'draft'
    ? 'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/'
    : 'https://open.tiktokapis.com/v2/post/publish/video/init/'

  const initResp = await fetch(publishEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: fullDescription,
        privacy_level: resolvedPrivacy,
        disable_comment: creatorCommentDisabled || !(options.allowComments ?? true),
        disable_duet: creatorDuetDisabled || !(options.allowDuets ?? true),
        disable_stitch: creatorStitchDisabled || !(options.allowStitches ?? true),
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1,
      },
    }),
  })
  const initData = await initResp.json()
  if (initData.error?.code && initData.error.code !== 'ok') {
    throw new Error(initData.error.message || 'TikTok upload init failed')
  }

  const publishId = initData.data?.publish_id
  const uploadUrl = initData.data?.upload_url
  if (!uploadUrl) throw new Error('TikTok did not return an upload URL')

  // Step 4: Upload video chunk
  const uploadResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': videoSize.toString(),
      'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
    },
    body: videoBuffer,
  })

  if (!uploadResp.ok) throw new Error(`TikTok video upload failed: ${uploadResp.status}`)

  // Step 5: Poll publish status
  let status = 'PROCESSING_UPLOAD'
  let attempts = 0
  const successStatuses = new Set(['PUBLISH_COMPLETE', 'SEND_TO_USER_INBOX'])
  const processingStatuses = new Set(['PROCESSING_UPLOAD', 'PROCESSING_DOWNLOAD', 'SENDING_TO_USER_INBOX'])

  while (processingStatuses.has(status) && attempts < 60) {
    await new Promise((r) => setTimeout(r, 5000))
    const statusResp = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publish_id: publishId }),
    })
    const statusData = await statusResp.json()
    status = statusData.data?.status || 'FAILED'
    attempts++

    if (status === 'FAILED') {
      throw new Error(`TikTok publishing failed: ${statusData.data?.fail_reason || 'Unknown'}`)
    }
    if (successStatuses.has(status)) break
  }

  return {
    success: true,
    postId: publishId,
    postUrl: '',
  }
}

// ── X / Twitter ────────────────────────────────────────────────────────

async function publishX(
  userId: string,
  videoUrl: string,
  options: PublishOptions,
): Promise<PublishResult> {
  const token = await getValidToken(userId, 'x')

  const tweetText = options.tweetText || options.description || options.caption || ''
  if (!tweetText) throw new Error('Tweet text is required')

  // Step 1: Download video
  const videoResp = await fetch(videoUrl)
  if (!videoResp.ok) throw new Error('Failed to fetch video from URL')
  const videoBuffer = Buffer.from(await videoResp.arrayBuffer())
  const totalBytes = videoBuffer.length
  const mimeType = videoResp.headers.get('content-type') || 'video/mp4'

  const BASE = 'https://api.x.com/2/media/upload'

  // Step 2: Initialize
  const initResp = await fetch(`${BASE}/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      media_type: mimeType,
      total_bytes: totalBytes,
      media_category: 'amplify_video',
    }),
  })
  const initText = await initResp.text()
  if (!initResp.ok) throw new Error(`X media INIT failed (${initResp.status}): ${initText.slice(0, 200)}`)
  const initData = JSON.parse(initText)
  const mediaId = initData.data?.id || initData.media_id_string
  if (!mediaId) throw new Error('X media INIT: no media_id returned')

  // Step 3: Append chunks (1MB max)
  const chunkSize = 1 * 1024 * 1024
  for (let i = 0; i * chunkSize < totalBytes; i++) {
    const chunk = videoBuffer.subarray(i * chunkSize, (i + 1) * chunkSize)
    const appendForm = new FormData()
    appendForm.append('segment_index', String(i))
    appendForm.append('media', new Blob([chunk], { type: 'application/octet-stream' }), 'chunk')

    const appendResp = await fetch(`${BASE}/${mediaId}/append`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: appendForm,
    })
    if (!appendResp.ok) {
      const appendErr = await appendResp.text()
      throw new Error(`X media APPEND failed (${appendResp.status}): ${appendErr.slice(0, 200)}`)
    }
  }

  // Step 4: Finalize
  const finalResp = await fetch(`${BASE}/${mediaId}/finalize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const finalText = await finalResp.text()
  if (!finalResp.ok) throw new Error(`X media FINALIZE failed (${finalResp.status}): ${finalText.slice(0, 200)}`)
  const finalData = JSON.parse(finalText)

  // Step 5: Wait for processing
  const processingInfo = finalData.data?.processing_info || finalData.processing_info
  if (processingInfo) {
    let processingState = processingInfo.state
    let checkAfter = processingInfo.check_after_secs || 5
    while (processingState === 'pending' || processingState === 'in_progress') {
      await new Promise((r) => setTimeout(r, checkAfter * 1000))

      const checkResp = await fetch(
        `${BASE}?media_id=${mediaId}&command=STATUS`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const checkText = await checkResp.text()
      if (!checkResp.ok) throw new Error(`X media STATUS failed (${checkResp.status}): ${checkText.slice(0, 200)}`)
      const checkData = JSON.parse(checkText)
      const checkInfo = checkData.data?.processing_info || checkData.processing_info
      processingState = checkInfo?.state || 'succeeded'
      checkAfter = checkInfo?.check_after_secs || 5

      if (processingState === 'failed') {
        throw new Error(`X media processing failed: ${checkInfo?.error?.message || 'Unknown'}`)
      }
    }
  }

  // Step 6: Set alt text
  if (options.mediaAltText) {
    await fetch(BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        media_id: mediaId,
        alt_text: { text: options.mediaAltText },
      }),
    })
  }

  // Step 7: Create tweet
  const tweetResp = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: tweetText,
      media: { media_ids: [mediaId] },
    }),
  })
  const tweetRespText = await tweetResp.text()
  if (!tweetResp.ok) throw new Error(`X tweet creation failed (${tweetResp.status}): ${tweetRespText.slice(0, 200)}`)
  const tweetData = JSON.parse(tweetRespText)
  if (tweetData.errors) throw new Error(tweetData.errors[0]?.message || 'Tweet creation failed')

  const tweetId = tweetData.data?.id

  // Get username for URL
  const supabase = getSupabaseAdmin()
  const { data: xAccount } = await supabase
    .from('social_accounts')
    .select('username')
    .eq('user_id', userId)
    .eq('platform', 'x')
    .single()

  return {
    success: true,
    postId: tweetId,
    postUrl: xAccount?.username ? `https://x.com/${xAccount.username}/status/${tweetId}` : '',
  }
}

// ── YouTube ────────────────────────────────────────────────────────────

async function publishYouTube(
  userId: string,
  videoUrl: string,
  options: PublishOptions,
): Promise<PublishResult> {
  const token = await getValidToken(userId, 'youtube')

  const title = options.title || options.caption || 'Untitled'
  const isShort = options.uploadType === 'short'

  // Step 1: Download video
  const videoResp = await fetch(videoUrl)
  if (!videoResp.ok) throw new Error('Failed to fetch video from URL')
  const videoBuffer = Buffer.from(await videoResp.arrayBuffer())
  const totalBytes = videoBuffer.length
  const mimeType = videoResp.headers.get('content-type') || 'video/mp4'

  const videoTitle = isShort && !title.includes('#Shorts')
    ? `${title} #Shorts`
    : title

  const tagArray = options.tags
    ? options.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  // Step 2: Initiate resumable upload
  const initResp = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': String(totalBytes),
        'X-Upload-Content-Type': mimeType,
      },
      body: JSON.stringify({
        snippet: {
          title: videoTitle,
          description: options.description || '',
          tags: tagArray,
          categoryId: '22',
        },
        status: {
          privacyStatus: options.privacy || 'public',
          selfDeclaredMadeForKids: !!options.madeForKids,
        },
      }),
    },
  )

  if (!initResp.ok) {
    const errData = await initResp.json().catch(() => ({}))
    throw new Error(errData.error?.message || `YouTube upload init failed (${initResp.status})`)
  }

  const uploadUrl = initResp.headers.get('location')
  if (!uploadUrl) throw new Error('YouTube did not return a resumable upload URL')

  // Step 3: Upload video bytes
  const uploadResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(totalBytes),
    },
    body: videoBuffer,
  })

  const uploadData = await uploadResp.json()
  if (!uploadResp.ok || !uploadData.id) {
    throw new Error(uploadData.error?.message || 'YouTube video upload failed')
  }

  const videoId = uploadData.id

  return {
    success: true,
    postId: videoId,
    postUrl: isShort
      ? `https://youtube.com/shorts/${videoId}`
      : `https://youtube.com/watch?v=${videoId}`,
  }
}
