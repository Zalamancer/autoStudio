# Phase 9: Developer Platform

**Features:** #27 API for Automation, #41 Public REST API, #48 AI Video Translator, #52 CLI Tool, #50 Formulas in Input Fields
**Timeline:** 4-6 weeks
**Theme:** API-first. Every feature accessible programmatically. This is how ProAnimate reaches $1M+ ARR -- B2B automation.
**Dependencies:** Orchestrator must be stable. Phase 7 (brand kit, social publishing) helps for webhook integrations and brand-aware rendering.

---

## Feature #27: API for Automation (Internal API)

### What

An authenticated, asynchronous render API that lets external systems submit animation prompts and receive finished videos. Callers POST a prompt plus optional settings, receive a job ID, then poll for status or receive a webhook callback when the render completes. This transforms the orchestrator from a UI-only tool into a headless rendering service suitable for batch processing, CI/CD pipelines, and third-party integrations.

### Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Auth | SHA-256 hashed API keys in Supabase | Stateless, fast lookup, no session cookies needed |
| Job queue | BullMQ + Redis (or pg-boss if Redis unavailable) | Reliable retry, concurrency limits, delayed jobs |
| Webhook delivery | node-fetch + exponential retry | Deliver render-complete events to user URLs |
| Validation | Zod (already in server/schemas/index.ts) | Consistent with existing schema validation |
| Rate limiting | express-rate-limit (per API key tier) | Already in use for AI endpoints |

### Existing Code to Modify

1. **`server/middleware/supabaseAuth.ts`** -- Add a new `requireApiKey` middleware alongside the existing `requireAuth`. The new middleware reads an `x-api-key` header, hashes it with SHA-256, looks it up in the `api_keys` table, attaches `userId` and `apiKeyId` to the request, and checks per-key rate limits. The existing `requireAuth` (Supabase JWT) stays untouched for the web UI.

2. **`server/index.ts`** -- Mount the new `/api/v1/renders` router with the `requireApiKey` middleware and the `aiRateLimiter`. Add a new `/api/v1` namespace that coexists with the existing `/api/*` routes. The existing 38+ routes remain unchanged under `/api/`.

3. **`server/services/orchestratorRunner.ts`** -- Currently generates a ClipPlan and voices but does not produce a final video. Extend `runOrchestration` to accept a `jobId`, write intermediate status to the `render_jobs` table, and optionally trigger the full 13-step pipeline execution by invoking the same step executors used by `src/services/orchestrator.ts`. The server-side runner already has `generatePlan` and `generateVoices` -- the gap is executing setup steps and rendering the final video.

4. **`server/services/stripeService.ts`** -- Add `api-render` as a recognized `CreditOperation` so render jobs deduct credits through the existing `deduct_credits` RPC. Update the `CREDIT_COSTS` map with the per-render cost.

5. **`server/routes/credits.ts`** -- The existing `/deduct` and `/refund` endpoints already handle arbitrary operations via the `CREDIT_COSTS` lookup. No structural changes needed, only ensure `api-render` is a valid operation string.

6. **`src/types/credits.ts`** -- Add `'api-render'` to the `CreditOperation` union type and add the cost entry to the `CREDIT_COSTS` record.

### New Code to Create

| File | Purpose |
|------|---------|
| `server/routes/v1/renders.ts` | Express router: POST `/` (submit job), GET `/:jobId` (poll status), GET `/:jobId/download` (stream result), DELETE `/:jobId` (cancel) |
| `server/routes/v1/apiKeys.ts` | Express router: POST `/` (create key), GET `/` (list keys), DELETE `/:keyId` (revoke key). Uses `requireAuth` (Supabase JWT) since only the dashboard user manages keys. |
| `server/routes/v1/webhooks.ts` | Express router: POST `/` (register webhook URL), GET `/` (list), DELETE `/:id` (unregister). Stored in `api_webhooks` table. |
| `server/middleware/apiKeyAuth.ts` | Middleware: read `x-api-key` header, SHA-256 hash, lookup in `api_keys`, attach `userId`/`apiKeyId`/`tierLimits` to request. Return 401 on invalid key. Increment `last_used_at`. |
| `server/services/renderJobService.ts` | Service class: `createJob(userId, prompt, settings) -> jobId`, `getJobStatus(jobId)`, `markRunning(jobId)`, `markComplete(jobId, resultUrl, cost)`, `markFailed(jobId, error)`. Writes to `render_jobs` table. |
| `server/services/webhookDelivery.ts` | Service: `deliverWebhook(userId, event, payload)` -- fetches registered webhooks, POSTs JSON with HMAC-SHA256 signature header, retries with exponential backoff (3 attempts, 1s/4s/16s). |
| `server/workers/renderWorker.ts` | BullMQ worker (or inline async): picks up render jobs, calls `runOrchestration`, then triggers headless Remotion render via `npx remotion render` or Canvas2D server-side, uploads result to Supabase Storage, marks job complete, fires webhook. |
| `sql/migrations/007_api_platform.sql` | Creates `api_keys`, `render_jobs`, `api_webhooks` tables with RLS policies. |

### Data Flow

```
1. Client: POST /api/v1/renders
   Headers: x-api-key: pak_abc123...
   Body: { prompt: "...", settings: { aspectRatio: "9:16", durationSeconds: 30, ... } }

2. apiKeyAuth middleware:
   - SHA-256 hash the key
   - SELECT from api_keys WHERE key_hash = $hash
   - Verify active, not revoked, rate limit not exceeded
   - Attach userId, apiKeyId to request

3. renders.ts handler:
   - Validate body with Zod schema
   - Deduct credits via POST /api/credits/deduct (operation: 'api-render')
   - Insert into render_jobs (status: 'queued', prompt, settings_json)
   - Enqueue job in BullMQ
   - Return { jobId, status: 'queued', estimatedSeconds: 120 }

4. renderWorker picks up job:
   - Mark job 'running'
   - Call runOrchestration(prompt, settings) -- generates ClipPlan + voices
   - Execute plan steps server-side (subset: canvas setup, text overlays, shapes)
   - Render video via Remotion CLI: npx remotion render src/remotion/entry.ts VideoComposition out.mp4
   - Upload out.mp4 to Supabase Storage: renders/{userId}/{jobId}.mp4
   - Mark job 'complete' with result_url
   - Fire webhook: POST user's URL with { event: 'render.complete', jobId, resultUrl, cost }

5. Client polls: GET /api/v1/renders/{jobId}
   Response: { jobId, status: 'complete', resultUrl: 'https://...', cost: { credits: 120 } }

6. Client downloads: GET /api/v1/renders/{jobId}/download
   Response: 302 redirect to signed Supabase Storage URL (1h expiry)
```

### Architecture Notes

**Job queue choice:** BullMQ with Redis is the production choice. For deployments without Redis (e.g., Railway free tier), fall back to pg-boss which uses PostgreSQL as the queue. Abstract behind a `JobQueue` interface so the implementation is swappable.

**Server-side rendering:** The biggest architectural challenge. The orchestrator currently runs in the browser, manipulating Zustand stores. For server-side rendering, two approaches:

- **Option A (recommended): Remotion CLI** -- The composition (`VideoComposition.tsx`) already receives all data as props (`VideoCompositionProps`). Serialize the orchestrated data into a props JSON file, then run `npx remotion render --props props.json`. This avoids needing Zustand on the server. The `compositionBuilder.ts` already converts store state into `VideoCompositionProps`.
- **Option B: Headless browser** -- Spawn Puppeteer/Playwright, load the editor, inject the prompt, wait for render. Heavier but reuses 100% of existing code.

Recommend Option A because it is lighter, faster, and does not require a display server.

**API key hashing:** Store only the SHA-256 hash, never the plaintext. Show the full key once on creation (frontend copy-to-clipboard), then only the prefix (`pak_abc1...`) in the management UI.

**Credit integration:** API renders are more expensive than individual operations (they bundle plan + voices + render). Price an `api-render` at ~200 credits (roughly: 12 for plan + 30*N for voices + 50 for render overhead). This encourages upgrading to Business/Enterprise plans.

**Webhook security:** Sign payloads with HMAC-SHA256 using a per-user webhook secret. Include the signature in an `x-proanimate-signature` header. Document the verification process in the API docs.

### Acceptance Criteria

- [ ] POST `/api/v1/renders` with a valid API key and prompt returns a `jobId` within 2 seconds
- [ ] GET `/api/v1/renders/{jobId}` returns accurate status progression: `queued -> running -> complete`
- [ ] Completed jobs have a downloadable video URL that returns a valid MP4/WebM file
- [ ] Invalid or revoked API keys receive a 401 response
- [ ] Exceeding rate limits returns 429 with `retry-after` header
- [ ] Credits are deducted on job submission and refunded if the job fails
- [ ] Webhook is delivered within 30 seconds of job completion with a valid HMAC signature
- [ ] API key management (create, list, revoke) works from the Settings panel
- [ ] Jobs expire and are cleaned up after 24 hours
- [ ] Concurrent render limit of 2 per user (queued beyond that)

---

## Feature #41: Public REST API

### What

A versioned, documented, production-grade REST API with OpenAPI 3.0 specification, interactive Swagger UI documentation, and auto-generated SDK packages. This extends the internal render API (#27) to cover all platform capabilities -- voices, characters, templates, projects -- making ProAnimate embeddable in any automation workflow. Includes a developer portal page with quickstart guides, code examples, and usage dashboards.

### Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| API spec | OpenAPI 3.0 YAML | Industry standard, tooling ecosystem |
| Interactive docs | swagger-ui-express | Drop-in Express middleware, no separate hosting |
| SDK generation | openapi-generator-cli | Auto-generates JS/Python/cURL SDKs from spec |
| API key UI | React settings panel tab | Consistent with existing settings architecture |
| Usage tracking | Supabase `api_usage_log` table | Per-endpoint, per-key usage metrics |

### Existing Code to Modify

1. **`server/index.ts`** -- Mount `swagger-ui-express` at `/api/docs` serving the OpenAPI spec. Mount all v1 routers under `/api/v1`. Add a `/api/v1/openapi.yaml` static endpoint serving the spec file.

2. **`server/middleware/apiKeyAuth.ts`** (from #27) -- Add usage logging: after each request completes, insert a row into `api_usage_log` with endpoint, method, response status, latency, credits consumed.

3. **`src/components/panels/SettingsPanel.tsx`** -- Add an "API Keys" section with: generate new key button, list of existing keys (name, prefix, created date, last used), revoke button. Also add a "Usage" sub-section showing per-key call counts and credit consumption for the current billing period.

4. **`src/constants/tabGroups.ts`** -- Add an 'api' tab to the settings panel tab groups if needed.

5. **`server/routes/v1/apiKeys.ts`** (from #27) -- Extend with GET `/usage` endpoint returning aggregated usage stats per key.

### New Code to Create

| File | Purpose |
|------|---------|
| `server/openapi.yaml` | Full OpenAPI 3.0 specification describing all v1 endpoints: renders, voices, characters, templates, projects. Includes request/response schemas, auth schemes, error codes. |
| `server/routes/v1/voices.ts` | GET `/` (list available ElevenLabs voices), POST `/clone` (submit voice clone request). Wraps existing ElevenLabs service. |
| `server/routes/v1/characters.ts` | GET `/` (list saved characters), GET `/:id` (character detail + thumbnail). Reads from `useSavedCharactersStore` equivalent on server (Supabase query). |
| `server/routes/v1/templates.ts` | GET `/` (list HTML templates with categories/tags), GET `/:id` (template detail + preview). Reads from `builtinTemplates.ts` data. |
| `server/routes/v1/projects.ts` | CRUD: GET `/` (list), POST `/` (create), GET `/:id`, PATCH `/:id`, DELETE `/:id`. Wraps existing Supabase project queries. |
| `server/middleware/usageLogger.ts` | Express middleware: logs API calls to `api_usage_log` table (key_id, endpoint, method, status, latency_ms, credits_used, timestamp). |
| `server/scripts/generateSdks.ts` | Script that runs `openapi-generator-cli` to produce `@proanimate/sdk` (TypeScript) and `proanimate` (Python) packages from the spec. |
| `src/components/panels/ApiKeyManagement.tsx` | React component: API key CRUD UI for the settings panel. Shows key list, create dialog, usage stats chart. |
| `src/services/apiKeyService.ts` | Frontend service: calls `/api/v1/api-keys/*` endpoints for key management. |
| `src/stores/useApiKeyStore.ts` | Zustand store: manages API key list, creation state, usage stats. |
| `sql/migrations/007_api_platform.sql` | (Shared with #27) Add `api_usage_log` table. |

### Data Flow

```
Developer flow:
1. User opens Settings > API Keys in the ProAnimate dashboard
2. Clicks "Generate New Key" -- enters a name (e.g., "Production")
3. POST /api/v1/api-keys -> returns { id, key: "pak_...", name, created_at }
4. Frontend shows the key ONCE with copy button, then only shows prefix

SDK flow:
5. Developer installs: npm install @proanimate/sdk
6. Code:
   import { ProAnimate } from '@proanimate/sdk'
   const client = new ProAnimate({ apiKey: 'pak_...' })
   const job = await client.renders.create({ prompt: '...' })
   const result = await client.renders.waitForCompletion(job.id)
   // result.downloadUrl -> MP4 file

Documentation flow:
7. Developer visits https://proanimate.com/api/docs
8. Swagger UI shows all endpoints with try-it-out capability
9. Each endpoint shows: description, parameters, request body schema,
   response schema, error codes, rate limits, credit costs
```

### Architecture Notes

**Versioning strategy:** URL-based versioning (`/api/v1/`). When breaking changes are needed, create `/api/v2/` while maintaining v1 for 12 months. Non-breaking additions (new fields, new endpoints) are added to the current version.

**OpenAPI spec management:** Write the spec by hand in YAML rather than generating it from code. This gives precise control over documentation quality, examples, and descriptions. Validate with `@apidevtools/swagger-parser` in CI.

**SDK generation pipeline:** Run `openapi-generator-cli generate -i openapi.yaml -g typescript-fetch -o sdk/typescript/` as a build step. Publish to npm as `@proanimate/sdk`. For Python, generate with `-g python` and publish to PyPI. The SDK wraps auth, polling, and file download into a clean interface.

**Rate limit tiers:** Tie rate limits to subscription plans:
- Free: 10 requests/minute, 100/day
- Pro: 30 requests/minute, 1000/day
- Business: 60 requests/minute, 5000/day
- Enterprise: 120 requests/minute, unlimited

**Zapier/Make/n8n integration:** The webhook system from #27 provides trigger events. The REST endpoints provide actions. Create a Zapier app definition that maps: Trigger (render complete) + Actions (create render, list voices, list templates). This is a JSON config file submitted to Zapier's developer platform.

### Acceptance Criteria

- [ ] OpenAPI 3.0 spec validates without errors via `swagger-parser`
- [ ] Swagger UI at `/api/docs` renders all endpoints with try-it-out functionality
- [ ] TypeScript SDK compiles and can create a render job, poll for status, and download the result
- [ ] Python SDK can perform the same workflow
- [ ] API key management UI in Settings allows create, list, and revoke
- [ ] Usage dashboard shows per-key call counts and credit consumption
- [ ] Rate limits are enforced per key tier and return 429 with `retry-after`
- [ ] All v1 endpoints return consistent error format: `{ error: string, code: string, details?: object }`
- [ ] API versioning: v1 endpoints remain stable when v2 is added

---

## Feature #48: AI Video Translator

### What

Given an existing ProAnimate project with dialogue, translate the entire clip to a target language while preserving lip sync, timing, and character voices. The pipeline transcribes existing audio (or uses existing script text), translates via AI, regenerates TTS in the target language using the same or similar voice, and re-synchronizes viseme timelines to match the new audio. Supports 20+ languages initially, leveraging ElevenLabs' multilingual voice support.

### Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Translation | Gemini 3.1 Flash Lite (via existing proxy) | Already integrated in `captionTranslation.ts`, low cost |
| TTS | ElevenLabs multilingual v2 model | Supports 29 languages, preserves voice character |
| Phoneme alignment | ElevenLabs alignment API | Same pipeline as existing `lipSync.ts` |
| Timing adjustment | Custom proportional stretcher | Map translated text duration to original time slots |
| UI | TranslationPanel in left sidebar | Consistent with existing panel architecture |

### Existing Code to Modify

1. **`src/services/captionTranslation.ts`** -- Currently translates only caption text. Extend to return not just translated sentences but also estimated word counts and character counts, which the timing adjuster needs. The `translateSentences` function is the core -- add a `translateForDubbing` variant that also returns per-sentence metadata.

2. **`src/services/elevenlabs.ts`** -- The `ElevenLabsService.generateWithAlignment` method currently uses `eleven_v3` model. Add a `generateMultilingual` method that uses `eleven_multilingual_v2` model, accepts a `languageCode` parameter, and returns the same `GenerateWithAlignmentResult`. The existing emotion cue conversion (`convertEmotionCuesToV3`) may need adaptation for non-English text.

3. **`src/services/lipSync.ts`** -- The `LipSyncProcessor` converts ElevenLabs phonemes to visemes. The phoneme-to-viseme mapping is English-centric. Add alternate mapping tables for IPA phonemes that ElevenLabs returns for non-English languages. The 8-viseme system (REST, AI, E, O, U, MBP, FV, LTH) is universal enough -- only the phoneme-to-viseme routing changes.

4. **`src/stores/useMultiCharacterStore.ts`** -- Add `translatedDialogueLines` state: a map from language code to an array of translated dialogue entries. Each entry mirrors the original `DialogueLine` but with translated script, new audio URL, and new viseme/word timelines.

5. **`src/stores/useVoiceStore.ts`** -- Add a `translatedVoices` map: `Record<string, GeneratedVoice[]>` keyed by language code. These are the translated TTS results.

6. **`src/remotion/VideoComposition.tsx`** -- Add a `translationLanguage` prop. When set, the composition reads translated dialogue audio and viseme timelines instead of the original. This enables exporting a translated version without modifying the master project.

### New Code to Create

| File | Purpose |
|------|---------|
| `src/services/translationService.ts` | Orchestrates the full translation pipeline: (1) collect all dialogue scripts, (2) batch translate via `captionTranslation.ts`, (3) adjust timing proportionally, (4) generate TTS for each translated line via ElevenLabs multilingual, (5) extract alignment and rebuild viseme timelines, (6) rebuild caption timelines. Returns a `TranslatedProject` object. |
| `src/services/translationTiming.ts` | Timing adjustment service: given original line durations and translated text lengths, compute optimal speech rate parameters. If translated text is significantly longer (common for EN -> DE), increase TTS speed slightly (up to 1.2x) or allow slight overlap. If shorter (EN -> ZH), pad with silence. |
| `src/components/panels/TranslationPanel.tsx` | UI panel: language selector dropdown (20+ languages from `CAPTION_LANGUAGES`), "Translate" button, progress indicator per dialogue line, preview toggle to hear translated audio, "Export Translated" button. Shows side-by-side original vs translated script. |
| `src/stores/useTranslationStore.ts` | Zustand store: `targetLanguage`, `translationProgress` (per-line status), `translatedLines` (results), `isTranslating` flag, `error`. Actions: `startTranslation`, `cancelTranslation`, `clearTranslation`, `setTargetLanguage`. |
| `server/routes/v1/translate.ts` | Server endpoint for API-driven translation: POST `/api/v1/translate` with project ID + target language. Uses the same pipeline but runs server-side. Returns job ID (async, like renders). |
| `src/types/translation.ts` | Type definitions: `TranslatedDialogueLine`, `TranslatedProject`, `TranslationProgress`, `TranslationConfig`. |

### Data Flow

```
1. User opens Translation panel, selects "Spanish" from dropdown
2. Clicks "Translate Clip"

3. translationService.translateProject():
   a. Collect dialogue lines from useMultiCharacterStore:
      [ { characterName: "Alex", script: "[happy] Hey everyone!", voiceId: "abc" }, ... ]

   b. Strip emotion cues, batch translate via Gemini:
      translateSentences(["Hey everyone!", "Let's talk about..."], "Spanish", apiKey)
      -> ["Hola a todos!", "Hablemos sobre..."]

   c. Re-inject emotion cues:
      "[happy] Hola a todos!"

   d. For each translated line, estimate timing:
      Original: "Hey everyone!" -> 1.2s
      Translated: "Hola a todos!" -> ~1.4s (Spanish tends +15%)
      -> Adjust TTS speed to 1.08x to fit original time slot

   e. Generate TTS for each line via ElevenLabs multilingual v2:
      generateMultilingual("Hola a todos!", voiceId, { language: "es", speed: 1.08 })
      -> { audioBlob, audioUrl, alignment, duration }

   f. Extract phonemes from alignment, map to visemes:
      LipSyncProcessor.process(alignment) -> visemeTimeline for Spanish audio

   g. Rebuild caption word/sentence timelines from translated text + alignment timing

4. Store results in useTranslationStore.translatedLines

5. Preview: toggle "Spanish" in transport bar -> VideoComposition reads translated audio/visemes

6. Export: "Export Translated" -> runs standard export with translationLanguage="es" prop
```

### Architecture Notes

**Voice preservation:** ElevenLabs multilingual v2 keeps the same voice character across languages. If the user has a cloned voice, it works in the target language too. This is a major selling point -- the character "speaks" Spanish in their own voice.

**Timing challenge:** This is the hardest part. German text is ~20% longer than English. Japanese can be shorter. The timing adjuster has three strategies:
1. **Speed adjustment** (preferred): Slightly speed up/slow down TTS (within 0.85x-1.2x range).
2. **Silence padding**: Add silence before/after to maintain scene boundaries.
3. **Overlap tolerance**: Allow up to 0.3s overlap between adjacent lines.

**Credit cost:** Translation uses credits for: Gemini translation (5 credits per batch) + ElevenLabs TTS per line (30 credits each). A 10-line dialogue costs ~305 credits total. Price the `dubbing` operation at 40 credits (already exists in `CREDIT_COSTS`).

**Lip sync accuracy:** For non-Latin languages (Chinese, Japanese, Korean, Arabic), the viseme mapping is less precise because ElevenLabs returns IPA phonemes that map differently. The 8-viseme system still works but accuracy drops to ~80% vs ~95% for English. Document this limitation.

### Acceptance Criteria

- [ ] User can translate a 5-line dialogue clip to Spanish with one click
- [ ] Translated audio preserves the original character's voice timbre
- [ ] Lip sync viseme timeline matches the translated audio within 50ms tolerance
- [ ] Caption text is correctly translated and timed to the new audio
- [ ] Translated clip can be exported as MP4 with translated audio and captions
- [ ] All 20 languages from `CAPTION_LANGUAGES` are available as targets
- [ ] Translation progress shows per-line status (translating, generating voice, syncing)
- [ ] Original project data is not modified -- translation is a separate layer
- [ ] Translation credits are deducted correctly and refunded on failure
- [ ] Preview toggle lets user switch between original and translated audio in the player

---

## Feature #52: CLI Tool

### What

A command-line interface (`proanimate`) that enables headless video generation from the terminal. Developers and automation engineers can generate animated videos without opening a browser, ideal for CI/CD pipelines, batch processing scripts, and server-side workflows. The CLI wraps the render API (#27) for cloud rendering or can use Remotion's local rendering for offline usage.

### Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| CLI framework | Commander.js | Standard Node.js CLI framework, TypeScript support |
| Configuration | cosmiconfig | Supports `.proanimaterc`, `proanimate.config.js`, `package.json` field |
| Progress display | ora + cli-progress | Spinner + progress bar for render status |
| Output formatting | chalk | Colored terminal output |
| HTTP client | undici (Node.js built-in) | Fast, no dependencies, built into Node 18+ |
| Bundling | tsup | Fast TypeScript bundler for npm packages |
| Local rendering | @remotion/cli | Direct Remotion rendering without server |

### Existing Code to Modify

1. **`server/services/orchestratorRunner.ts`** -- The `runOrchestration` function generates a plan and voices. It needs to also generate a `VideoCompositionProps` JSON that can be passed to Remotion CLI for local rendering. Add an `exportCompositionProps` function that converts the plan + voice data into the props format defined in `src/remotion/types.ts`.

2. **`src/services/compositionBuilder.ts`** -- Currently builds `VideoCompositionProps` from Zustand stores (browser-only). Create a parallel `buildCompositionFromPlan(plan, voiceData)` function that constructs the same props from raw plan data without Zustand dependencies. This enables server-side and CLI usage.

3. **`package.json` (root)** -- Add a `bin` field pointing to the CLI entry point. Add build scripts for the CLI package.

### New Code to Create

| File | Purpose |
|------|---------|
| `cli/index.ts` | CLI entry point: registers commands via Commander.js, loads config, sets up global options (`--api-key`, `--server-url`, `--output`, `--format`). |
| `cli/commands/render.ts` | `proanimate render` command: takes `--prompt` or `--prompt-file`, `--settings` (JSON file or inline), `--output` (file path), `--format` (mp4/webm), `--aspect` (9:16/16:9/1:1). Cloud mode: calls render API, polls, downloads. Local mode: calls Remotion CLI. |
| `cli/commands/batch.ts` | `proanimate batch` command: takes `--csv` (CSV file with prompt/settings columns) or `--json` (JSON array), `--template` (saved template ID), `--concurrency` (parallel jobs, default 2). Renders multiple clips, writes results to output directory. |
| `cli/commands/voices.ts` | `proanimate voices` command: lists available voices (`proanimate voices list`), previews a voice (`proanimate voices preview --voice-id abc --text "Hello"`). |
| `cli/commands/templates.ts` | `proanimate templates` command: lists available templates (`proanimate templates list --category kinetic-typography`), shows template detail (`proanimate templates show tpl-neural-noir`). |
| `cli/commands/auth.ts` | `proanimate auth` command: `proanimate auth login` (opens browser for OAuth, stores token in `~/.proanimate/credentials.json`), `proanimate auth set-key pak_...` (stores API key), `proanimate auth whoami` (shows current user). |
| `cli/commands/status.ts` | `proanimate status` command: shows credit balance, active jobs, API key info. |
| `cli/lib/apiClient.ts` | HTTP client wrapper: handles auth headers, base URL, error formatting, retry logic. Reads credentials from config file or environment variables (`PROANIMATE_API_KEY`). |
| `cli/lib/config.ts` | Config loader using cosmiconfig: reads from `.proanimaterc.json`, `proanimate.config.js`, or `PROANIMATE_*` env vars. Merges CLI flags > env vars > config file > defaults. |
| `cli/lib/localRender.ts` | Local rendering helper: writes composition props to temp JSON file, spawns `npx remotion render` with correct entry point and props path, streams progress output. |
| `cli/lib/display.ts` | Terminal display helpers: formatted tables for voice/template lists, progress bars for render jobs, error formatting. |
| `cli/tsup.config.ts` | Build config: bundles CLI to a single JS file with shebang, external node_modules. |
| `cli/package.json` | Package manifest: `name: "@proanimate/cli"`, `bin: { proanimate: "./dist/index.js" }`, dependencies. |
| `Dockerfile.cli` | Docker image for CI/CD: Node 20 + Chromium (for Remotion) + CLI pre-installed. |

### Data Flow

```
Cloud rendering mode:
1. $ proanimate render --prompt "Explain quantum computing in 30 seconds" --aspect 9:16 --output quantum.mp4

2. CLI reads API key from ~/.proanimate/credentials.json or PROANIMATE_API_KEY env var

3. POST https://api.proanimate.com/api/v1/renders
   Body: { prompt: "...", settings: { aspectRatio: "9:16" } }
   -> { jobId: "rj_abc123" }

4. CLI polls GET /api/v1/renders/rj_abc123 every 5 seconds with spinner:
   [spinner] Rendering... (step 3/13: generating voices)

5. On completion, GET /api/v1/renders/rj_abc123/download
   -> Stream to quantum.mp4

6. [checkmark] Exported quantum.mp4 (12.3 MB, 30s, 1080x1920)

Batch mode:
1. $ proanimate batch --csv topics.csv --output ./renders/ --concurrency 3

2. CSV format:
   prompt,aspect,duration
   "Top 5 Python tips",9:16,30
   "React vs Vue 2024",9:16,45
   "Cooking pasta carbonara",16:9,60

3. CLI creates 3 concurrent render jobs, shows progress table:
   [1/3] Top 5 Python tips     [====------] 40%
   [2/3] React vs Vue 2024     [===-------] 30%
   [3/3] Cooking pasta...      [=---------] 10%

4. Downloads each result to ./renders/top-5-python-tips.mp4, etc.

Local rendering mode:
1. $ proanimate render --prompt "..." --local --output video.mp4

2. CLI calls orchestratorRunner.runOrchestration() directly (Node.js, no server)

3. Builds VideoCompositionProps JSON from plan + voice data

4. Spawns: npx remotion render src/remotion/entry.ts VideoComposition video.mp4 --props /tmp/props.json

5. Remotion renders locally using Chromium, outputs MP4
```

### Architecture Notes

**Cloud vs Local trade-off:** Cloud mode is simpler (just API calls) but requires a running server and internet. Local mode is more complex (needs Chromium for Remotion, all dependencies installed) but works offline and has no API costs. Default to cloud mode, with `--local` flag for local rendering.

**npm package structure:** Publish as `@proanimate/cli` on npm. Users install globally: `npm install -g @proanimate/cli`. The package includes only the CLI code, not the full frontend/server. For local rendering, it shells out to `npx remotion render` which must be installed in the project.

**Docker image:** For CI/CD, provide a Docker image with everything pre-installed:
```dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y chromium
RUN npm install -g @proanimate/cli
ENV PROANIMATE_API_KEY=""
ENTRYPOINT ["proanimate"]
```

**Batch CSV format:** Support both simple CSV (just prompts) and complex CSV (prompt + all settings columns). Unknown columns are ignored. Settings can also reference a template: `--template tpl-xyz` applies the same orchestrator settings to all rows.

### Acceptance Criteria

- [ ] `proanimate render --prompt "test" --output test.mp4` produces a valid MP4 file
- [ ] `proanimate batch --csv topics.csv --output ./out/` renders all rows and saves to directory
- [ ] `proanimate voices list` displays available voices in a formatted table
- [ ] `proanimate templates list` displays available templates with categories
- [ ] `proanimate auth login` opens browser and stores credentials
- [ ] `proanimate status` shows credit balance and active jobs
- [ ] `PROANIMATE_API_KEY` environment variable is respected as auth
- [ ] `--local` flag renders without requiring a server
- [ ] Progress output updates in real-time with step names and ETA
- [ ] Exit codes: 0 for success, 1 for render failure, 2 for auth failure
- [ ] `proanimate --help` shows all commands with descriptions
- [ ] Docker image runs in CI/CD with `docker run proanimate render --prompt "..."

---

## Feature #50: Formulas in Input Fields

### What

A formula/expression evaluation system for all numeric input fields in the editor. Instead of typing a raw number, users can type mathematical expressions referencing project variables (e.g., `width/2`, `fps*3`, `duration-1.5`). Expressions are evaluated in real-time and support standard math operations, built-in functions, and project-aware variables. This turns every numeric input into a programmable parameter.

### Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Expression parser | mathjs (subset) | Full math parser, custom variable scope, tree-walking evaluator, well-maintained |
| Autocomplete | Custom dropdown | Lightweight, shows variable names + current values |
| UI integration | Modified DraggableNumberInput | Central numeric input component used everywhere |

### Existing Code to Modify

1. **`src/components/ui/DraggableNumberInput.tsx`** -- This is the universal numeric input component used across all property panels. Currently accepts `value: number` and `onChange: (value: number) => void`. Changes needed:
   - Add an optional `formulaMode` prop that enables expression input
   - When in formula mode, the input field accepts text strings (e.g., `width/2+10`)
   - On blur or Enter, evaluate the expression and call `onChange` with the computed number
   - Show a small `fx` toggle button to switch between direct number mode and formula mode
   - Display the formula text in the input and the computed result as a tooltip
   - Support drag behavior on the computed value (dragging adjusts a numeric offset added to the formula)

2. **`src/components/layout/RightPanel/RightPanel.tsx`** -- The right panel houses all property editors that use `DraggableNumberInput`. No structural changes needed, but the formula context provider should be added here so all property inputs have access to project variables.

3. **`src/stores/useCanvasStore.ts`** -- Export `width`, `height`, and `zoom` as formula variables. Add a `getFormulaVariables()` selector that returns `{ width, height, zoom, centerX: width/2, centerY: height/2 }`.

4. **`src/stores/usePlaybackStore.ts`** -- Export `frame`, `fps`, `duration` (total frames / fps), and `totalFrames` as formula variables. These enable time-relative expressions.

5. **`src/stores/useTimelineStore.ts`** -- Export `totalDuration` (in seconds) and `totalFrames` as formula variables.

### New Code to Create

| File | Purpose |
|------|---------|
| `src/services/formulaEngine.ts` | Core expression evaluator: wraps mathjs `evaluate()` with a restricted scope (no file access, no network). Defines the variable context interface, built-in constants (pi, e, phi), and built-in functions (round, floor, ceil, min, max, clamp, lerp, random, sin, cos). Provides `evaluateFormula(expression: string, context: FormulaContext) -> number`. |
| `src/services/formulaContext.ts` | Builds the variable context from Zustand stores: reads canvas dimensions, playback state, timeline info, and currently selected object properties. Returns a `FormulaContext` record. Subscribes to store changes to keep context fresh. |
| `src/hooks/useFormulaContext.ts` | React hook that provides the current formula context. Subscribes to relevant stores and returns a memoized context object. Used by `DraggableNumberInput` when formula mode is active. |
| `src/components/ui/FormulaInput.tsx` | Standalone formula input component with autocomplete dropdown. Shows available variables with current values, highlights syntax errors, displays computed result in real-time. Can be used independently or embedded in `DraggableNumberInput`. |
| `src/components/ui/FormulaAutocomplete.tsx` | Autocomplete dropdown component: filters variables by typed prefix, shows variable name + current value + type. Keyboard navigable (up/down/enter/escape). |
| `src/types/formula.ts` | Type definitions: `FormulaContext` (record of variable name to value), `FormulaVariable` (name, value, description, category), `FormulaResult` (value, error, warnings). |

### Data Flow

```
Scenario: User wants to center an object horizontally

1. User clicks on a text overlay's X position field
2. Clicks the small "fx" toggle to enable formula mode
3. Input switches from showing "540" to an editable text field

4. User types "wid" -- autocomplete appears:
   | Variable    | Value | Description           |
   |-------------|-------|-----------------------|
   | width       | 1080  | Canvas width (px)     |

5. User selects "width", types "/2":
   Formula: "width/2"
   Preview tooltip: "= 540"

6. User presses Enter:
   a. formulaEngine.evaluateFormula("width/2", context)
   b. mathjs parses: Divide(Variable("width"), Constant(2))
   c. Resolves: width = 1080 -> 1080 / 2 = 540
   d. Calls onChange(540)

7. Input shows: "fx: width/2 = 540"

8. If canvas width changes (e.g., aspect ratio switch from 16:9 to 9:16):
   a. FormulaContext updates: width = 1080 -> 1920
   b. Formula re-evaluates: 1920 / 2 = 960
   c. Calls onChange(960) automatically

Dynamic formula (references frame):
1. User types: "sin(frame / fps * 2 * pi) * 50 + height/2"
2. This formula is re-evaluated every frame during playback
3. frame = 0: sin(0) * 50 + 540 = 540
4. frame = 15: sin(pi) * 50 + 540 = 540
5. frame = 30: sin(2pi) * 50 + 540 = 540
6. Creates a sinusoidal oscillation centered on canvas
```

### Architecture Notes

**Security:** mathjs allows arbitrary JavaScript execution by default. Use `mathjs.create()` with a limited scope that only includes safe math functions. Block `import`, `require`, `eval`, `Function`, and any I/O. The formula evaluator runs in the main thread (not a Worker) because it needs access to store state, but the restricted scope prevents abuse.

**Performance:** Frame-referenced formulas (using `frame`, `time`) must be re-evaluated every frame during playback. mathjs parsing is ~0.1ms per expression. For 10 animated properties, that is 1ms/frame overhead -- acceptable at 30fps. Cache the parsed AST and only re-evaluate with new variable values.

**Formula persistence:** Store formulas as strings in the Zustand stores alongside the computed numeric values. When saving a project, persist both the formula string and the last computed value. On load, re-evaluate all formulas to handle any context changes. Schema:
```typescript
interface FormulaValue {
  formula: string | null  // null = raw number, no formula
  value: number           // computed or directly set number
}
```

**Variables available:**
| Variable | Source | Description |
|----------|--------|-------------|
| `width` | useCanvasStore | Canvas width in pixels |
| `height` | useCanvasStore | Canvas height in pixels |
| `centerX` | computed | width / 2 |
| `centerY` | computed | height / 2 |
| `fps` | usePlaybackStore | Frames per second |
| `frame` | usePlaybackStore | Current frame number (dynamic) |
| `time` | computed | frame / fps (seconds, dynamic) |
| `totalFrames` | useTimelineStore | Total timeline frames |
| `duration` | computed | totalFrames / fps (total seconds) |
| `pi` | constant | 3.14159... |
| `e` | constant | 2.71828... |
| `random` | function | Random number 0-1 (seeded per frame for determinism) |
| `index` | context | Item index when inside a list (for stagger effects) |

**Drag interaction:** When a formula is active and the user drags the input, add a numeric offset: `width/2 + 15` (where 15 is accumulated from drag). The formula string is updated in real-time. If the user drags enough that the offset dominates, offer to simplify to a raw number.

### Acceptance Criteria

- [ ] Typing `width/2` in an X position field evaluates to half the canvas width
- [ ] Typing `fps*3` in a duration field evaluates correctly
- [ ] Autocomplete shows matching variables when typing partial names
- [ ] Formulas with `frame` or `time` re-evaluate during playback
- [ ] Formula syntax errors show a red border and error tooltip
- [ ] The `fx` toggle switches between formula and direct number modes
- [ ] Drag interaction on a formula input adjusts a numeric offset appended to the formula
- [ ] Formulas persist when saving and loading projects
- [ ] Canvas dimension changes trigger automatic re-evaluation of dependent formulas
- [ ] Division by zero and NaN results show a warning and fall back to 0
- [ ] Math functions (sin, cos, round, min, max, clamp, lerp) work correctly
- [ ] Performance: 20 active formulas with `frame` reference do not drop below 30fps

---

## Database Migration: `sql/migrations/007_api_platform.sql`

This migration supports features #27 and #41.

### Tables

**`api_keys`**
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                          -- User-given label ("Production", "CI/CD")
  key_hash TEXT NOT NULL UNIQUE,               -- SHA-256 hash of the API key
  key_prefix TEXT NOT NULL,                    -- First 8 chars for display ("pak_abc1")
  tier TEXT NOT NULL DEFAULT 'standard',       -- 'standard', 'premium', 'enterprise'
  rate_limit_per_minute INT NOT NULL DEFAULT 30,
  rate_limit_per_day INT NOT NULL DEFAULT 1000,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = TRUE;
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
```

**`render_jobs`**
```sql
CREATE TABLE render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id),     -- NULL if submitted via dashboard
  status TEXT NOT NULL DEFAULT 'queued',        -- queued, running, complete, failed, cancelled
  prompt TEXT NOT NULL,
  settings_json JSONB NOT NULL DEFAULT '{}',
  plan_json JSONB,                              -- Generated ClipPlan
  result_url TEXT,                              -- Supabase Storage URL
  result_format TEXT,                           -- 'mp4' or 'webm'
  result_size_bytes BIGINT,
  credits_cost INT NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_render_jobs_user ON render_jobs(user_id, created_at DESC);
CREATE INDEX idx_render_jobs_status ON render_jobs(status) WHERE status IN ('queued', 'running');
```

**`api_webhooks`**
```sql
CREATE TABLE api_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,                         -- HMAC signing secret
  events TEXT[] NOT NULL DEFAULT ARRAY['render.complete'],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_webhooks_user ON api_webhooks(user_id) WHERE is_active = TRUE;
```

**`api_usage_log`**
```sql
CREATE TABLE api_usage_log (
  id BIGSERIAL PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES api_keys(id),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INT NOT NULL,
  latency_ms INT,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_usage_log_key ON api_usage_log(api_key_id, created_at DESC);
CREATE INDEX idx_api_usage_log_user ON api_usage_log(user_id, created_at DESC);

-- Partition by month for large-scale usage (optional)
-- CREATE TABLE api_usage_log_2026_03 PARTITION OF api_usage_log
--   FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
```

### RLS Policies

```sql
-- Users can only see their own API keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own keys" ON api_keys FOR UPDATE USING (auth.uid() = user_id);

-- Users can only see their own render jobs
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own jobs" ON render_jobs FOR SELECT USING (auth.uid() = user_id);

-- Users can only manage their own webhooks
ALTER TABLE api_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own webhooks" ON api_webhooks FOR ALL USING (auth.uid() = user_id);

-- Usage logs are read-only for users
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON api_usage_log FOR SELECT USING (auth.uid() = user_id);
```

---

## Implementation Order

| Week | Feature | Deliverable |
|------|---------|-------------|
| 1 | #27 API for Automation | Database migration, API key middleware, render job service, basic POST/GET endpoints |
| 2 | #27 API for Automation | Render worker (Remotion CLI integration), webhook delivery, credit integration |
| 3 | #41 Public REST API | OpenAPI spec, Swagger UI, voices/characters/templates endpoints, usage logging |
| 4 | #41 Public REST API | SDK generation (TypeScript), API key management UI in Settings, developer docs page |
| 5 | #52 CLI Tool | CLI scaffold (Commander.js), render + batch + voices + templates commands, auth flow |
| 5 | #50 Formulas | Formula engine (mathjs), DraggableNumberInput integration, variable context, autocomplete |
| 6 | #48 AI Translator | Translation service, multilingual TTS integration, timing adjustment, TranslationPanel UI |

Features #27 and #41 are sequential (API must exist before docs). Features #50, #52, and #48 can be developed in parallel once #27 is complete.

---

## Related

- [[feature-list]] — Features #145 Developer API, #159 Formula Engine, #27 AI Translator
- [[feature-priorities]] — API (#15), Public REST API (#19), CLI Tool (#52), with Automation & Dev Tools scoring
- [[PROGRESS]] — Track completion status
- [[phase-8|Phase 8: Content Input Pipelines]] — Previous phase
- [[phase-10|Phase 10: Future Horizons]] — Next phase
- [[orchestrator-technical]] — API wraps the orchestrator execution pipeline
