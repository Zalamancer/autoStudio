# Server

Express + Supabase backend in `server/`:

## server/index.ts
Express app with CORS, rate limiting, Stripe webhooks, JWT auth, health check. 50+ route mounts.

## Middleware
- `requireAuth` — JWT Bearer token verification
- `requireApiKey` — SHA-256 API key auth with tier limits
- `requireEnterprise` — Enterprise subscription check
- `usageLogger` — API usage logging
- `validate(schemas)` — Zod request validation

## Services
- `claude.ts` — Anthropic Claude API for SVG animation (streaming + extended thinking)
- `renderer.ts` — SVG frame renderer using sandboxed VM + Resvg
- `encoder.ts` — FFmpeg video encoding
- `orchestratorRunner.ts` — Server-side plan + TTS generation
- `stripeService.ts` — Subscription/credit management (30+ operation costs)

## Jobs
- `scheduler.ts` — Auto-publish polling (60s interval)
- `metricsPoller.ts` — Social metrics polling (6h interval)

## Routes
50+ route files: ai-animation, characters, stripe, social, meshy, hunyuan, manim, pixellab, brand-director, auto-publish, template-ratings, reward-model, v1 API (renders/voices/characters/templates/projects/translate/webhooks/api-keys), mobile API

## Schemas
Zod validation for all endpoints (aiAnimation, meshy, social publishing, brand director, auto-publish, virality, etc.)

---

# Utils & Lib

## src/lib/utils.ts
- `cn(...inputs): string` — Merge classnames (clsx + tailwind-merge)

## src/utils/storage.ts
- `safeLocalStorageSet(key, value): boolean` — Catches QuotaExceededError
- `checkStorageQuota(): Promise<{usage, quota, percentUsed}>`

## src/utils/blobUtils.ts
- `blobToDataUrl`, `blobToBase64`, `dataUrlToBlob`, `base64ToBlobUrl`
- `blobURLManager` — Tracked blob URL lifecycle

## src/utils/fetchWithRetry.ts
- `fetchWithRetry(url, options?, config?): Promise<Response>` — Retry on 5xx/429 with backoff

## src/utils/thumbnail.ts
- `generateProjectThumbnail(): Promise<string | null>`
- `captureCanvasThumbnail(element): Promise<string | null>`

## src/utils/debug.ts
- `debug`, `debugWarn`, `debugError` — Dev-only logging

## src/utils/idGenerator.ts
- `generateId(prefix?): string` — Timestamp + random ID

## src/utils/safeJsonParse.ts
- `safeJsonParse<T>(str, validator?): T | null`

## src/constants/tabGroups.ts
- `TAB_GROUPS` — 7 tab group definitions with sub-tabs
- `TAB_TO_GROUP` — Reverse lookup
- `GROUP_DEFAULT_TAB` — Default tab per group

## Freepik Proxy (server/routes/freepik.ts)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/proxy/freepik/status` | GET | Check if Freepik API key is configured |
| `/api/proxy/freepik/search` | POST | Search Freepik Resources API with rate limit retry (3x exponential backoff) |

**Auth:** `requireAuth` middleware. API key via `FREEPIK_API_KEY` env var, sent as `x-freepik-api-key` header.
