/**
 * Webhook Delivery Service.
 *
 * Delivers webhook events to registered user URLs with HMAC-SHA256 signature.
 * Retries with exponential backoff (3 attempts: 1s, 4s, 16s).
 */

import crypto from 'node:crypto'
import { getSupabaseAdmin } from '../middleware/supabaseAuth'

export interface WebhookEvent {
  event: string
  jobId?: string
  resultUrl?: string
  cost?: { credits: number }
  error?: string
  timestamp: string
}

/**
 * Sign a payload with HMAC-SHA256 using the webhook secret.
 */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Sleep for a specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Validate a webhook URL to prevent SSRF attacks.
 * Blocks private IP ranges, internal hostnames, and non-HTTP(S) schemes.
 */
function isWebhookUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url)

    // Only allow http and https schemes
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')

    // Block localhost and loopback
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '[::1]'
    ) {
      return false
    }

    // Block .local hostnames (mDNS/internal)
    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return false
    }

    // Block private IPv4 ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x
    if (
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    ) {
      return false
    }

    // Block private IPv6 ranges: fc00::/7 (unique local), fe80::/10 (link-local)
    if (
      hostname.startsWith('fc') ||
      hostname.startsWith('fd') ||
      hostname.startsWith('fe80')
    ) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Deliver a webhook event to all registered webhooks for a user.
 * Retries with exponential backoff on failure.
 */
export async function deliverWebhook(
  userId: string,
  event: string,
  payload: WebhookEvent,
): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Fetch active webhooks for this user that listen for this event
  const { data: webhooks, error } = await supabase
    .from('api_webhooks')
    .select('id, url, secret, events')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error || !webhooks || webhooks.length === 0) return

  const matchingWebhooks = webhooks.filter(
    (wh) => wh.events.includes(event) || wh.events.includes('*')
  )

  const body = JSON.stringify(payload)

  for (const webhook of matchingWebhooks) {
    // Validate webhook URL to prevent SSRF
    if (!isWebhookUrlSafe(webhook.url)) {
      console.warn(`[Webhook] Blocked delivery to unsafe URL: ${webhook.url} (webhook ${webhook.id})`)
      continue
    }

    // Attempt delivery with retries
    const retryDelays = [1000, 4000, 16000] // exponential backoff
    let delivered = false

    for (let attempt = 0; attempt < retryDelays.length; attempt++) {
      try {
        const signature = signPayload(body, webhook.secret)

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-proanimate-signature': signature,
            'x-proanimate-event': event,
          },
          body,
          signal: AbortSignal.timeout(10000), // 10s timeout
        })

        if (response.ok || response.status < 500) {
          delivered = true
          break
        }

        // Server error — retry
        console.warn(`[Webhook] Delivery attempt ${attempt + 1} failed for ${webhook.url}: ${response.status}`)
      } catch (err) {
        console.warn(`[Webhook] Delivery attempt ${attempt + 1} error for ${webhook.url}:`, err)
      }

      // Wait before retrying
      if (attempt < retryDelays.length - 1) {
        await sleep(retryDelays[attempt])
      }
    }

    if (!delivered) {
      console.error(`[Webhook] All delivery attempts failed for webhook ${webhook.id} (${webhook.url})`)
    }
  }
}
