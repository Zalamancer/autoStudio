# Phase 7: Professional Output & Distribution

**Timeline:** 3-4 weeks
**Features:** #10 Direct Social Publishing, #6 Brand Kit System, #12 Transparent Video Export, #26 NLE XML Export
**Theme:** Get content out into the world. Professional compositing workflow + social distribution.
**Dependencies:** Core export pipeline (videoExport.ts) must be stable. Orchestrator pipeline operational.

---

## Feature #10: Direct Social Publishing

### What

Complete social media publishing system that lets users publish exported videos directly to TikTok, YouTube, Instagram, X/Twitter, and Facebook from within ProAnimate. Includes OAuth account management, platform-specific metadata forms, AI-generated hashtags and descriptions, post scheduling with server-side cron execution, and a publish queue with retry logic for rate limit handling.

### Tech Stack

- **OAuth 2.0:** Server-side token management via existing `server/routes/social.ts` (PKCE for X and YouTube already implemented)
- **Platform APIs:** TikTok Content Posting API v2, YouTube Data API v3, Instagram Graph API (Meta), X API v2, Facebook Graph API v21.0
- **Scheduling:** `node-cron` or custom interval-based scheduler (existing `server/jobs/scheduler.ts` pattern)
- **AI Metadata:** Gemini 2.5 Flash for hashtag/description generation from video content
- **Database:** Supabase `scheduled_posts` table (migration `002_scheduled_posts.sql` already exists)
- **File Upload:** Supabase Storage for temporary video hosting (platform APIs require publicly accessible URLs for Instagram/Facebook/TikTok)

### Existing Code to Modify

1. **`server/routes/social.ts`** (620+ lines) — Already has complete OAuth flows for all 5 platforms, token refresh logic, account CRUD, and publishing endpoints. Modifications needed:
   - Add scheduling endpoints: `POST /schedule` to create a scheduled post, `GET /scheduled` to list pending posts, `DELETE /scheduled/:id` to cancel
   - Add `POST /generate-metadata` endpoint that takes video content summary and returns AI-generated title, description, hashtags per platform
   - Enhance publish endpoints to accept a `scheduledAt` parameter for deferred publishing
   - Add status polling endpoints: `GET /publish-status/:jobId` for tracking async publish progress

2. **`src/services/socialPublish.ts`** (100+ lines) — Frontend service with OAuth popup flow, account fetching, and platform-specific publish functions. Modifications needed:
   - Add `schedulePost(platform, videoBlob, options, scheduledAt)` function
   - Add `generateMetadata(contentSummary)` function that calls the new server endpoint
   - Add `getScheduledPosts()` and `cancelScheduledPost(id)` functions
   - Add `getPublishStatus(jobId)` for polling async publish progress

3. **`src/components/panels/SharePanel.tsx`** (300+ lines) — Already has platform cards, OAuth connection UI, platform-specific forms, TikTok profile viewer. Modifications needed:
   - Add scheduling UI: date/time picker with timezone selector
   - Add AI metadata generation button ("Generate with AI" next to description/hashtag fields)
   - Add scheduled posts list with cancel button
   - Add publish queue status indicator
   - Add multi-platform simultaneous publish (checkboxes instead of single platform selection)

4. **`src/types/social.ts`** (80+ lines) — Has platform-specific option interfaces. Add:
   - `ScheduledPost` interface with `id`, `platform`, `scheduledAt`, `status`, `options`
   - `MetadataGenerationRequest` and `MetadataGenerationResult` interfaces
   - `PublishJob` interface for tracking async publish status

5. **`server/jobs/scheduler.ts`** (80+ lines) — Existing auto-publish scheduler polling every 60s. Add a parallel check for `scheduled_posts` table to find due one-off scheduled posts and execute them.

6. **`sql/migrations/002_scheduled_posts.sql`** — Already exists with the correct schema. No modifications needed unless we want to add a `metadata_json` column for storing AI-generated metadata.

### New Code to Create

1. **`src/services/publishMetadataGenerator.ts`** — Client-side fallback for AI metadata generation using `VITE_GEMINI_API_KEY`. Takes video content summary (from orchestrator ClipPlan, captions, or project name) and generates platform-optimized title, description, hashtags, and suggested posting time. Falls back to server endpoint if available.

2. **`src/stores/usePublishStore.ts`** — Zustand store for publish state management:
   - `scheduledPosts: ScheduledPost[]`
   - `publishJobs: Map<string, PublishJob>` for tracking in-progress publishes
   - `selectedPlatforms: Set<SocialPlatform>` for multi-platform selection
   - `generatedMetadata: Record<SocialPlatform, MetadataResult>` for AI-generated content
   - Actions: `schedulePost`, `cancelPost`, `pollPublishStatus`, `generateMetadata`

3. **`src/components/panels/publish/SchedulePickerModal.tsx`** — Modal component with date/time picker, timezone auto-detection (Intl.DateTimeFormat), best-time suggestions based on platform analytics.

4. **`src/components/panels/publish/PublishQueuePanel.tsx`** — Shows pending, in-progress, and completed publish jobs with status badges, retry buttons for failed publishes, and links to published posts.

### Data Flow

1. User exports or has a recording in the project
2. User opens SharePanel, sees connected accounts (fetched from `GET /api/social/accounts`)
3. User selects one or more platforms via checkboxes
4. User clicks "Generate with AI" -- frontend calls `POST /api/social/generate-metadata` with video summary
5. AI returns platform-specific title, description, hashtags; fields auto-fill
6. User either clicks "Publish Now" or "Schedule" (opens SchedulePickerModal)
7. For immediate publish:
   a. Frontend uploads video blob to Supabase Storage (temp bucket, 24h expiry)
   b. Frontend calls `POST /api/social/publish/:platform` with video URL + options
   c. Server fetches valid OAuth token (refreshing if expired via `getValidToken()`)
   d. Server calls platform API (chunked upload for TikTok/YouTube, container creation for Instagram)
   e. Server returns `{ jobId, status: 'processing' }` for async platforms (TikTok, Instagram)
   f. Frontend polls `GET /api/social/publish-status/:jobId` until complete
8. For scheduled publish:
   a. Frontend uploads video blob to Supabase Storage (persistent bucket)
   b. Frontend calls `POST /api/social/schedule` with video URL, platform, options, scheduledAt
   c. Server inserts row into `scheduled_posts` table with status `pending`
   d. Scheduler job (polling every 60s) picks up due posts and executes publish flow
   e. Scheduler updates `scheduled_posts` row with `status: published` or `status: failed`

### Architecture Notes

- **Token storage is server-side only.** The frontend never sees OAuth tokens -- it authenticates via Supabase JWT, and the server retrieves platform tokens from the `social_accounts` table. This is already implemented correctly.
- **Video hosting for platform APIs.** Instagram and TikTok require a publicly accessible URL. Options: (a) Supabase Storage with a short-lived signed URL, (b) upload to a temp S3 bucket. Supabase Storage signed URLs are simplest since the infrastructure already exists.
- **Async publishing.** TikTok and Instagram Container publishing are async -- the initial API call returns a container/publish ID, and you must poll for status. The server should handle this polling internally and update the DB, rather than having the frontend poll the platform directly.
- **Rate limiting.** Each platform has different rate limits. TikTok: 3 posts per day for unverified apps. YouTube: 6 uploads per user per day (10,000 quota units). Build a rate limit tracker per platform per user to warn before hitting limits.
- **Multi-platform publish** creates separate publish jobs per platform and tracks them independently. If one fails, others continue.
- **Existing auto-publish system** (`server/routes/autoPublish.ts`, `server/jobs/scheduler.ts`) handles recurring scheduled generation. The new scheduling here is for one-off "publish this specific video at this time" which is simpler and lives in the `scheduled_posts` table.

### Acceptance Criteria

- [ ] User can connect/disconnect all 5 platforms (Facebook, Instagram, TikTok, X, YouTube) via OAuth popup -- already working, verify no regressions
- [ ] User can publish a video immediately to any connected platform with platform-specific metadata
- [ ] User can publish to multiple platforms simultaneously with per-platform metadata
- [ ] AI metadata generation produces relevant hashtags and descriptions from video content
- [ ] User can schedule a post for a future date/time with timezone support
- [ ] Scheduled posts appear in a "Scheduled" list with cancel functionality
- [ ] Scheduler processes due posts within 2 minutes of scheduled time
- [ ] Failed publishes show clear error messages and offer a retry button
- [ ] Publishing progress is shown in real-time (uploading, processing, published)
- [ ] Published posts show a link to the live post on the platform
- [ ] Token refresh works transparently when tokens expire during publish

---

## Feature #6: Brand Kit System

### What

Brand kit system that stores reusable brand identities -- colors, fonts, logos, watermarks, intro/outro templates, voice preferences, caption styles, and tonal guidelines. When a brand kit is active, all new content (orchestrator-generated clips, manual text overlays, shapes, captions) automatically inherits the brand's visual identity. Supports multiple brand kits for agencies managing several clients.

### Tech Stack

- **State:** Zustand with Immer (existing `useBrandKitStore.ts` pattern)
- **Persistence:** Supabase table `brand_kits` (upgrade from current localStorage)
- **Storage:** Supabase Storage for logos and watermarks (upgrade from current base64 in localStorage)
- **AI Detection:** Brandfetch API (optional) or Gemini vision for auto-extracting brand colors/logo from a URL
- **Font Loading:** Google Fonts API for loading brand fonts dynamically

### Existing Code to Modify

1. **`src/stores/useBrandKitStore.ts`** (143 lines) — Already has full CRUD, active kit selection, and `createFromBrandDirector()`. Currently persists to localStorage. Modifications needed:
   - Add Supabase persistence: `fetchBrandKits()` should read from Supabase with localStorage as offline fallback
   - Add `saveBrandKit()` that upserts to Supabase `brand_kits` table
   - Add `uploadLogo(file)` and `uploadWatermark(file)` that upload to Supabase Storage and store the public URL
   - Add `applyToOrchestrator(settings: OrchestratorSettings)` that injects brand colors/fonts/voice into orchestrator settings

2. **`src/types/brandKit.ts`** (20 lines) — Current interface has: id, name, colors (primary/secondary/accent/bg), fonts (heading/body), logoUrl, watermarkUrl, introTemplateId, outroTemplateId, defaultVoiceId, tone, captionPresetId. Add:
   - `userId: string` for Supabase RLS
   - `captionStyle: Partial<CaptionStyleConfig>` for branded caption defaults
   - `textOverlayDefaults: Partial<TextOverlay>` for default text overlay styling
   - `shapeDefaults: { fillColor: string; strokeColor: string }` for shape defaults
   - `musicMood: string` for default music generation mood
   - `watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`
   - `watermarkOpacity: number`
   - `customFontUrls: string[]` for non-Google-Fonts custom font files

3. **`src/components/panels/BrandKitPanel.tsx`** (200+ lines) — Already has color pickers, font selectors, logo/watermark upload (as base64). Modifications needed:
   - Replace base64 upload with Supabase Storage upload showing upload progress
   - Add watermark position/opacity controls
   - Add caption style preview
   - Add "Import from URL" button that calls Gemini vision or Brandfetch to auto-extract brand identity
   - Add "Apply to Current Project" button that overrides all current text/shape/caption colors and fonts

4. **`src/services/orchestrator.ts`** (2000+ lines) — In the `buildPlanPrompt()` function, inject brand kit context so Gemini generates content respecting brand colors, fonts, and tone. In step executors, apply brand kit defaults to:
   - `TEXT_PRESET_DEFAULTS` (line ~74): override fontFamily and color from active brand kit
   - `executeSetupTextOverlays()`: use brand kit heading/body fonts
   - `executeSetupShapes()`: use brand kit colors for fill
   - `executeSetupCaptions()`: use brand kit caption preset

5. **`src/stores/useTextOverlayStore.ts`** (60+ lines) — When adding a new text overlay, check for active brand kit and apply default font/color.

6. **`src/stores/useShapeStore.ts`** — When adding a new shape, check for active brand kit and apply default fill/stroke colors.

7. **`src/services/compositionBuilder.ts`** (80+ lines) — When building composition props for export, if a brand kit has a watermark, inject it as an additional overlay layer.

8. **`src/services/canvas2dRenderer.ts`** — Add watermark rendering as the topmost layer (after captions) using the brand kit watermark image, position, and opacity.

### New Code to Create

1. **`src/services/brandKitService.ts`** — Service layer for brand kit Supabase operations:
   - `fetchUserBrandKits(userId): Promise<BrandKit[]>` -- reads from `brand_kits` table
   - `upsertBrandKit(kit: BrandKit): Promise<BrandKit>` -- upsert to Supabase
   - `deleteBrandKit(id: string): Promise<void>` -- delete from Supabase
   - `uploadBrandAsset(file: File, kitId: string, type: 'logo' | 'watermark'): Promise<string>` -- uploads to Supabase Storage `brand-assets/` bucket, returns public URL
   - `extractBrandFromUrl(url: string): Promise<Partial<BrandKit>>` -- calls Gemini vision to analyze a website screenshot and extract primary colors, fonts, logo

2. **`sql/migrations/007_brand_kits.sql`** — Supabase migration:
   ```sql
   CREATE TABLE brand_kits (
     id TEXT PRIMARY KEY,
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     config JSONB NOT NULL DEFAULT '{}',
     logo_url TEXT,
     watermark_url TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE INDEX idx_brand_kits_user ON brand_kits(user_id);
   ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
   -- RLS policies for user-scoped access
   ```

3. **`src/services/watermarkRenderer.ts`** — Dedicated watermark rendering logic used by both the live canvas (`VideoCanvas.tsx`) and the export renderer (`canvas2dRenderer.ts`). Handles position calculation, opacity, scaling relative to canvas dimensions, and caching the watermark image.

### Data Flow

1. User creates or edits a brand kit in BrandKitPanel
2. Brand kit is saved to Supabase via `brandKitService.upsertBrandKit()`
3. Logo/watermark files are uploaded to Supabase Storage via `brandKitService.uploadBrandAsset()`
4. User activates a brand kit via `setActiveBrandKit(id)`
5. Active brand kit ID is persisted to localStorage for quick access
6. When the orchestrator runs:
   a. `buildPlanPrompt()` reads the active brand kit and appends brand context to the Gemini prompt
   b. Gemini generates a ClipPlan that respects brand colors, fonts, and tone
   c. Step executors apply brand kit defaults when creating text overlays, shapes, and captions
7. When the user manually adds a text overlay:
   a. `useTextOverlayStore.addTextOverlay()` checks for active brand kit
   b. If active, uses brand heading/body font and primary color as defaults
8. During export:
   a. `canvas2dRenderer.ts` draws the watermark as the final layer if active brand kit has one
   b. Watermark is rendered at the configured position with the configured opacity

### Architecture Notes

- **Migrate from localStorage to Supabase** gradually. Keep localStorage as offline cache. On app load, fetch from Supabase and update localStorage. On save, write to both.
- **Config JSONB column** stores the full BrandKit config (colors, fonts, tone, caption preset, etc.) as JSON. This avoids schema migrations when adding new brand kit properties.
- **Separate logo/watermark URLs** from the config JSON because they reference Supabase Storage objects and need special handling (deletion, signed URLs).
- **Brand kit + orchestrator integration** works by injecting a section into the Gemini prompt: "BRAND GUIDELINES: Use colors [primary, secondary, accent]. Use font [heading] for titles, [body] for body text. Tone should be [tone]. Always include a watermark." This influences the ClipPlan generation at the AI level.
- **Watermark rendering** must happen at two levels: (a) live canvas preview in `VideoCanvas.tsx` for WYSIWYG, and (b) export renderer in `canvas2dRenderer.ts` for final output. Use a shared `watermarkRenderer.ts` to avoid duplication.
- **Font loading**: when a brand kit is activated, dynamically load the heading and body fonts via the Google Fonts API if they are not already loaded. Store loaded font families in a set to avoid duplicate loading.

### Acceptance Criteria

- [ ] User can create, edit, and delete brand kits with name, colors (primary/secondary/accent/bg), fonts (heading/body), and tone
- [ ] User can upload a logo and watermark image for each brand kit
- [ ] Logo and watermark are stored in Supabase Storage (not base64 in localStorage)
- [ ] User can set watermark position (4 corners) and opacity
- [ ] User can activate/deactivate a brand kit; only one kit active at a time
- [ ] Active brand kit applies default colors and fonts to new text overlays
- [ ] Active brand kit applies default fill/stroke to new shapes
- [ ] Orchestrator-generated clips respect the active brand kit (correct colors, fonts, tone)
- [ ] Watermark appears on the live canvas preview and in exported video
- [ ] Brand kits persist to Supabase and sync across sessions
- [ ] "Import from URL" extracts approximate brand colors from a website
- [ ] Multiple brand kits can be stored per user (for agency use cases)

---

## Feature #12: Transparent Video Export

### What

Export videos with an alpha (transparency) channel for use as overlays in professional NLE software (After Effects, DaVinci Resolve, Premiere Pro, Final Cut Pro). Supports VP9 WebM with alpha (widest NLE support), PNG image sequence (universal compatibility), and optionally ProRes 4444 via FFmpeg WASM for Apple-ecosystem workflows.

### Tech Stack

- **VP9 Alpha:** WebCodecs API `VideoEncoder` with VP9 codec and alpha support (Chrome 94+)
- **PNG Sequence:** Canvas `toBlob('image/png')` for each frame, bundled with `JSZip`
- **ProRes 4444 (optional):** `@ffmpeg/ffmpeg` (FFmpeg WASM) for client-side encoding -- large bundle (~25MB), lazy-loaded
- **Muxer:** `webm-muxer` for VP9+alpha WebM container (alternative to current `mp4-muxer`)
- **Canvas:** Existing `canvas2dRenderer.ts` with transparent background

### Existing Code to Modify

1. **`src/services/videoExport.ts`** (270+ lines) — Core export pipeline. Modifications needed:
   - Add `alpha: boolean` option to `ExportOptions` interface
   - Add `'webm-alpha' | 'png-sequence' | 'prores4444'` to the format type
   - When `alpha: true`, skip the background fill in `renderFrame()` calls
   - For WebCodecs path: configure VP9 encoder with `alpha: 'keep'` in `VideoEncoder.configure()`
   - For PNG sequence: render each frame, call `canvas.toBlob('image/png')`, collect into JSZip
   - For ProRes: lazy-load FFmpeg WASM, feed raw RGBA frames, encode as ProRes 4444 MOV

2. **`src/services/canvas2dRenderer.ts`** (1000+ lines) — The `renderFrame()` function currently fills the background first (line ~8 in the layer draw order comment: "0. Background fill"). Modifications needed:
   - Accept an `alpha` parameter in `renderFrame()`
   - When `alpha: true`, call `ctx.clearRect()` instead of filling the background color
   - Skip rendering background Lottie animations when `alpha: true` (they would obscure the transparency)
   - All other layers (characters, text, shapes, etc.) render normally onto the transparent canvas

3. **`src/components/panels/ExportPanel.tsx`** — Add a "Transparent Background" toggle to the export settings UI. When enabled:
   - Show format options: "VP9 WebM (recommended)" or "PNG Sequence (universal)"
   - Show a checkerboard preview on the canvas to indicate transparency
   - Disable background color picker
   - Show info text: "Transparent exports work as overlays in After Effects, DaVinci, Premiere, and FCP"

4. **`src/stores/useSettingsStore.ts`** (64 lines) — Add `transparentExport: boolean` to the settings state for persisting the user's preference.

5. **`src/remotion/VideoComposition.tsx`** — For Remotion preview, when transparent mode is on, render a checkerboard pattern behind the composition layers to visually indicate transparency.

### New Code to Create

1. **`src/services/transparentExport.ts`** — Dedicated module for alpha-channel export paths:
   - `exportWebMAlpha(canvas, ctx, props, renderCtx, options, onProgress, signal)` -- uses WebCodecs VP9 with alpha + `webm-muxer`
   - `exportPNGSequence(canvas, ctx, props, renderCtx, options, onProgress, signal)` -- renders frames as PNGs, bundles into ZIP with JSZip
   - `exportProRes4444(canvas, ctx, props, renderCtx, options, onProgress, signal)` -- lazy-loads FFmpeg WASM, feeds RGBA ImageData, outputs MOV
   - `isVP9AlphaSupported(): boolean` -- checks if WebCodecs supports VP9 with alpha on this browser

2. **`src/services/ffmpegLoader.ts`** — Lazy loader for FFmpeg WASM. Only downloads the ~25MB WASM binary when ProRes export is first requested. Caches the loaded instance for subsequent exports. Shows download progress.

### Data Flow

1. User toggles "Transparent Background" in ExportPanel
2. Canvas preview switches to checkerboard pattern (visual feedback)
3. User selects format: VP9 WebM (default) or PNG Sequence
4. User clicks "Export"
5. Export pipeline initializes:
   a. `canvas2dRenderer.renderFrame()` called with `alpha: true` -- no background fill
   b. Each frame is rendered to the offscreen canvas with `clearRect()` preserving transparency
6. For VP9 WebM:
   a. `VideoEncoder` configured with `codec: 'vp09.00.10.08'` and `alpha: 'keep'`
   b. `VideoFrame` created from canvas with `alpha: 'keep'` option
   c. Encoded frames muxed into WebM container via `webm-muxer`
   d. Output: single `.webm` file with alpha channel
7. For PNG Sequence:
   a. Each frame rendered and captured via `canvas.toBlob('image/png')`
   b. PNGs added to JSZip archive with sequential filenames (`frame_00001.png`, etc.)
   c. ZIP generated and downloaded
   d. Output: `frames.zip` containing numbered PNG files
8. User imports the output into their NLE as an overlay

### Architecture Notes

- **VP9 with alpha is the best default.** It produces small files, is supported by Chrome's WebCodecs, and After Effects / DaVinci / Premiere all import VP9 alpha WebM. Safari does not support VP9 encoding via WebCodecs, so show PNG Sequence as the only option on Safari.
- **PNG Sequence is the universal fallback.** Every NLE imports PNG sequences. Downside: large file sizes (a 30-second 1080p clip at 30fps = 900 PNGs, potentially 2-5 GB uncompressed). The ZIP helps but is still large. Consider offering resolution options (720p for smaller sequences).
- **ProRes 4444 is optional and heavy.** FFmpeg WASM adds ~25MB to the initial download and encoding is CPU-intensive (no hardware acceleration). Only offer this if users specifically need it for Apple ecosystem workflows. Lazy-load the WASM binary only when this option is selected.
- **Background handling:** When `alpha: true`, we skip: (a) background color fill, (b) background Lottie animations, (c) background media layers. Characters, text, shapes, and foreground elements render normally. If the user has a background Lottie but wants alpha, show a warning: "Background animation will be hidden in transparent export."
- **Audio is stripped in transparent exports.** Alpha video is meant for compositing -- users add audio in their NLE. Skip audio mixing to save time. PNG sequences never have audio.
- **Performance:** VP9 encoding with alpha is approximately 2x slower than H.264 without alpha. PNG sequence export is faster (no encoding) but produces much larger files.

### Acceptance Criteria

- [ ] Export panel shows "Transparent Background" toggle
- [ ] When toggled on, canvas preview shows checkerboard pattern
- [ ] VP9 WebM alpha export produces a valid `.webm` file that imports into After Effects with transparency
- [ ] VP9 WebM alpha export produces a valid `.webm` file that imports into DaVinci Resolve with transparency
- [ ] PNG sequence export produces a ZIP of numbered PNG files with alpha channel
- [ ] Background color fill and background animations are correctly excluded in transparent mode
- [ ] Foreground elements (characters, text, shapes) render correctly on transparent background
- [ ] Export progress reporting works for both VP9 and PNG sequence paths
- [ ] Safari falls back to PNG sequence (VP9 not available)
- [ ] File size is reported accurately in the export completion dialog
- [ ] Cancellation works for both export paths

---

## Feature #26: NLE XML Export (Premiere / DaVinci / Final Cut Pro)

### What

Export the ProAnimate timeline as industry-standard interchange files that professional NLEs can import. Supports FCP XML (Final Cut Pro XML Interchange Format v1.9, also imported by Premiere Pro and DaVinci Resolve), EDL (Edit Decision List for basic cuts-only interchange), and OTIO (OpenTimelineIO, the emerging open standard from Pixar). Each format maps ProAnimate's tracks, clips, and timing to the target NLE's timeline structure.

### Tech Stack

- **FCP XML:** Custom XML generator (no library needed -- the schema is well-documented and relatively simple)
- **EDL:** CMX 3600 format text generator (plain text, trivially generated)
- **OTIO:** `opentimelineio` JSON schema (OTIO files are JSON, can be generated without a library)
- **Asset Export:** Each audio/video asset referenced in the timeline is exported alongside the XML/EDL, or paths are made relative to a user-specified directory
- **ZIP bundling:** `JSZip` for bundling XML + media assets into a single download

### Existing Code to Modify

1. **`src/stores/useTimelineStore.ts`** (130+ lines) — Read-only access to timeline data: `fps`, `totalFrames`, `tracks` (array of Track), each track has `clips` with `startFrame`, `endFrame`, `sourceId`, `sourceInPoint`, `sourceOutPoint`. No modifications needed -- just read the state.

2. **`src/types/timeline.ts`** — Has `Track` and `Clip` interfaces. Verify these have all needed fields for NLE mapping. May need to add `mediaType: 'video' | 'audio' | 'image'` to Clip if not already present.

3. **`src/components/panels/ExportPanel.tsx`** — Add "Export for NLE" section below the video export controls:
   - Dropdown: "FCP XML" / "EDL" / "OTIO"
   - Checkbox: "Include media assets" (bundles audio/video files into ZIP)
   - Button: "Export Timeline"

4. **`src/services/compositionBuilder.ts`** (80+ lines) — Use `buildCompositionPropsFromStores()` to gather all assets (audio URLs, media URLs) that need to be referenced in the NLE export.

### New Code to Create

1. **`src/services/nleExport/fcpXmlGenerator.ts`** — Generates FCP XML v1.9 from timeline data:
   - Maps `useTimelineStore` tracks to `<track>` elements
   - Maps clips to `<clipitem>` elements with frame-accurate `<in>`, `<out>`, `<start>`, `<end>`
   - Creates `<media>` and `<file>` elements for each referenced asset
   - Handles frame rate conversion (our FPS to NLE timebase)
   - Produces valid XML string that imports into Premiere Pro, DaVinci Resolve, and Final Cut Pro

2. **`src/services/nleExport/edlGenerator.ts`** — Generates CMX 3600 EDL:
   - One edit per clip on the primary video track
   - SMPTE timecode format (HH:MM:SS:FF)
   - Edit types: C (cut), D (dissolve -- for clips with transitions)
   - Source reel names from clip sourceId or generated sequence numbers
   - Simpler than FCP XML but loses multi-track and metadata information

3. **`src/services/nleExport/otioGenerator.ts`** — Generates OpenTimelineIO JSON:
   - Root `Timeline` object with `tracks` array
   - Each track is a `Track` with `children` array of `Clip` objects
   - Each clip has `source_range` (RationalTime start + duration) and `media_reference` (ExternalReference with target_url)
   - Transitions mapped to `Transition` objects between clips
   - OTIO is JSON-based so no XML serialization needed

4. **`src/services/nleExport/index.ts`** — Orchestrator module:
   - `exportFCPXML(): Promise<Blob>` -- reads stores, generates XML, returns as Blob
   - `exportEDL(): Promise<Blob>` -- reads stores, generates EDL text, returns as Blob
   - `exportOTIO(): Promise<Blob>` -- reads stores, generates OTIO JSON, returns as Blob
   - `exportWithAssets(format): Promise<Blob>` -- generates the timeline file + collects all referenced media assets into a ZIP

5. **`src/services/nleExport/timecodeUtils.ts`** — Utility functions:
   - `frameToSMPTE(frame, fps): string` -- converts frame number to `HH:MM:SS:FF`
   - `frameToSeconds(frame, fps): number` -- converts frame to seconds
   - `fpsToTimebase(fps): number` -- maps our FPS to NLE timebase values

### Data Flow

1. User clicks "Export for NLE" in ExportPanel
2. User selects format (FCP XML / EDL / OTIO) and toggles "Include media assets"
3. Export service reads `useTimelineStore.getState()` for tracks and clips
4. Export service reads `useMediaStore.getState()` for media asset URLs
5. Export service reads `useVoiceStore.getState()` for audio asset URLs
6. For FCP XML:
   a. Build XML document with `<xmeml version="5">` root
   b. Create `<sequence>` with `<rate><timebase>{fps}</timebase></rate>`
   c. For each track, create `<video><track>` or `<audio><track>`
   d. For each clip, create `<clipitem>` with timing and media references
   e. Generate `<file>` elements for each unique media source
7. If "Include media assets" is checked:
   a. Download all referenced media (audio, video, images) as blobs
   b. Create JSZip with timeline file + media files in a `media/` subdirectory
   c. Update media references in the timeline file to use relative paths (`media/filename.ext`)
8. User downloads the file or ZIP

### Architecture Notes

- **FCP XML v1.9 is the most universal format.** Despite the name, it is imported by Premiere Pro (via "Import > Final Cut Pro XML"), DaVinci Resolve, and Final Cut Pro 7 and later. FCP X uses FCPXML (a different schema) but can also import v1.9.
- **EDL is the simplest but most limited.** It only represents a single video track with cuts and dissolves. No multi-track, no metadata, no complex transitions. Use it as a fallback for older NLEs or as a quick roundtrip format.
- **OTIO (OpenTimelineIO) is the future.** Developed by Pixar and adopted by Adobe, Autodesk, Avid, and others. It is a JSON-based format that supports complex timelines, markers, effects, and metadata. DaVinci Resolve 18+ imports OTIO natively. Premiere has plugins for OTIO import.
- **Asset bundling** is important for portability. Without bundled assets, the NLE will show "media offline" errors. Bundling adds download time and file size, so make it optional.
- **Frame accuracy.** NLEs are very precise about frame counts. Our timeline uses integer frames at a specific FPS. The FCP XML timebase must match our FPS exactly. If our FPS is 30, use timebase 30. No floating-point frame conversions.
- **Audio track mapping.** ProAnimate has track types `video`, `audio`, and `sprite`. Sprite tracks have no NLE equivalent -- they should be exported as video tracks. Audio tracks map directly. Generated voice audio and background music should be referenced as audio clipitems.
- **Clip naming.** Use meaningful names from the track/clip `name` fields when available. Fall back to `Video_1`, `Audio_1`, etc.

### Acceptance Criteria

- [ ] FCP XML export produces valid XML that imports into Premiere Pro without errors
- [ ] FCP XML export produces valid XML that imports into DaVinci Resolve without errors
- [ ] FCP XML timeline clips have correct start/end frames matching the ProAnimate timeline
- [ ] EDL export produces valid CMX 3600 format with correct SMPTE timecodes
- [ ] OTIO export produces valid OpenTimelineIO JSON
- [ ] "Include media assets" bundles all referenced media into a ZIP with correct relative paths
- [ ] Audio tracks (voice, music) are correctly mapped in all export formats
- [ ] Export handles empty tracks gracefully (no errors, skips them in output)
- [ ] Export handles projects with no clips gracefully (produces valid but empty timeline)
- [ ] Frame rate is correctly represented in all formats (no rounding errors)
- [ ] Exported files use UTF-8 encoding with proper XML declaration for FCP XML

---

## Related

- [[feature-list]] — Features #122 Transparent Video, #127 NLE Export, #135 Social Publishing
- [[feature-priorities]] — Transparent Export (#18), Social Publishing (#11), NLE Export (#22), with Export & Output and Distribution scoring
- [[PROGRESS]] — Track completion status
- [[phase-6|Phase 6: Advanced Editing]] — Previous phase
- [[phase-8|Phase 8: Content Input Pipelines]] — Next phase
- [[phase-1]] — Basic export features (GIF, 4K) built in phase 1
