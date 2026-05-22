# Phase 8: Content Input Pipelines

**Timeline:** 4-6 weeks
**Features:** #35 URL-to-Video, #36 Blog/Article-to-Video, #24 AI Image-to-Video, #42 Batch from CSV, #53 Document/PDF-to-Video, #56 PowerPoint Import
**Theme:** "Anything-to-video" -- the more input types we support, the more users we capture.
**Dependencies:** Orchestrator must be stable (it is). Phase 7 brand kit integration helps (apply brand to all generated content). URL-to-Video server route partially exists.

---

## Feature #35: URL-to-Video

### What

Paste any URL into ProAnimate and get a fully generated video. The system fetches the page, intelligently extracts content (title, key points, images, product data, recipes, social posts), structures it into an orchestrator prompt, and runs the full 13-step pipeline to produce a complete animated clip. Supports product pages, news articles, blog posts, social media posts, recipes, and generic web pages, with content-type-specific video templates.

### Tech Stack

- **HTML Parsing:** `cheerio` (already in use on server) for DOM traversal and content extraction
- **Readability:** Mozilla `@mozilla/readability` for clean article text extraction (removes navigation, ads, sidebars)
- **Screenshot:** `puppeteer` (optional, server-side) for capturing OG images when none are provided, and for rendering JavaScript-heavy pages
- **AI Extraction:** Gemini 2.5 Flash for intelligent content structuring (already implemented in `urlToVideo.ts`)
- **Orchestrator:** Existing `orchestrator.ts` pipeline for video generation from structured prompt
- **Server:** Express.js route at `/api/url-to-video/extract` (already exists)

### Existing Code to Modify

1. **`server/routes/urlToVideo.ts`** (313 lines) — Already has a complete implementation:
   - Rate limiting (10 req/min per IP)
   - URL validation and private URL blocking
   - `fetchWithTimeout()` with redirect following (3 max)
   - `detectContentType()` classifying pages as product/social-post/recipe/news/article/generic
   - Cheerio-based HTML parsing extracting: title, description, OG image, site name
   - Body text extraction (removes script/style/nav/footer, truncates to 5000 chars)
   - Gemini prompt for structured extraction returning JSON with contentType, title, summary, keyPoints, tone, suggestedDuration, suggestedAspectRatio, suggestedPrompt, productPrice, productFeatures

   Modifications needed:
   - Add `@mozilla/readability` for cleaner article extraction (current `$('article').text()` misses body-only pages and includes too much noise)
   - Add image extraction: collect up to 5 high-resolution images from the page (OG, article images, product images) for use as stock media in the generated video
   - Add structured data extraction: parse JSON-LD and Schema.org for Product, Recipe, Article, and VideoObject types
   - Add content-type-specific Gemini prompts (current single prompt handles all types; split into focused prompts for better results)
   - Return extracted images array in the response for the frontend to use

2. **`src/services/orchestrator.ts`** (2000+ lines) — The `generateClipPlan()` function takes a text prompt and generates a ClipPlan. Modifications needed:
   - Add a `sourceUrl?: string` field to `OrchestratorSettings` so the plan builder knows the content came from a URL
   - In `buildPlanPrompt()`, when `sourceUrl` is set, include extracted content (key points, images, tone) as structured context sections rather than raw text
   - Add `extractedImages?: string[]` to `OrchestratorSettings` so the orchestrator can use page images as media layers instead of searching Pixabay

3. **`src/types/orchestrator.ts`** (120+ lines) — Add to `OrchestratorSettings`:
   - `sourceUrl?: string`
   - `extractedContent?: URLExtractedContent` (new interface)
   - `extractedImages?: string[]`

4. **`src/stores/useOrchestratorStore.ts`** — Add `extractedContent` state for storing URL extraction results before the user triggers generation.

5. **`src/components/panels/orchestrator/PromptPhase.tsx`** — Add URL input field above the text prompt:
   - URL input with "Extract" button
   - Loading state during extraction
   - Preview card showing extracted title, summary, key points, primary image
   - "Use as prompt" button that fills the orchestrator prompt with the suggested prompt from extraction
   - "Edit and generate" option for users who want to modify the extracted prompt

### New Code to Create

1. **`src/services/urlExtractor.ts`** — Frontend service that calls the server extraction endpoint:
   - `extractFromURL(url: string): Promise<URLExtractedContent>` -- calls `POST /api/url-to-video/extract`
   - `URLExtractedContent` interface: `{ url, contentType, title, summary, keyPoints, tone, suggestedDuration, suggestedAspectRatio, suggestedPrompt, primaryImageUrl, extractedImages, productPrice, productFeatures, siteName }`
   - Error handling for rate limits, timeouts, invalid URLs
   - URL validation on the client side before sending to server

2. **`src/components/panels/orchestrator/URLInputSection.tsx`** — UI component for the URL input area:
   - Input field with paste detection and URL validation
   - Extract button with loading spinner
   - Preview card showing extraction results
   - Content type badge (product, article, news, recipe, social post)
   - Editable summary and key points
   - "Generate Video" button that passes extracted content to the orchestrator

3. **`server/services/readabilityExtractor.ts`** — Server-side module using `@mozilla/readability` + `jsdom`:
   - `extractArticleContent(html: string): { title, textContent, excerpt, byline, siteName, length }` -- produces clean, readable article text
   - `extractStructuredData(html: string): StructuredDataResult` -- parses JSON-LD and Schema.org for Product, Recipe, Article, VideoObject types
   - `extractPageImages(html: string, baseUrl: string): string[]` -- finds high-quality images (OG, article images, product images) with resolution filtering

### Data Flow

1. User pastes a URL into the URL input field in PromptPhase
2. Frontend validates URL format and calls `urlExtractor.extractFromURL(url)`
3. Server receives `POST /api/url-to-video/extract`:
   a. Fetches the page HTML with timeout (15s) and redirect handling
   b. Parses HTML with Cheerio for metadata (title, OG tags, schema.org)
   c. Runs `@mozilla/readability` for clean article text extraction
   d. Extracts structured data (JSON-LD) for product/recipe/article types
   e. Collects high-resolution images from the page
   f. Detects content type from hostname heuristics and markup analysis
   g. Sends extracted content to Gemini for intelligent structuring
   h. Returns structured `URLExtractedContent` JSON
4. Frontend displays extraction preview card with title, summary, key points, image
5. User reviews and optionally edits the suggested prompt
6. User clicks "Generate Video"
7. Frontend passes `suggestedPrompt` + `extractedContent` + `extractedImages` to the orchestrator
8. Orchestrator runs the standard 13-step pipeline:
   - `setup-canvas`: uses suggestedAspectRatio from extraction
   - `setup-characters`: creates narrator character based on content tone
   - `generate-voices`: generates TTS from the script (derived from key points)
   - `setup-stock-media`: uses extracted images first, falls back to Pixabay for gaps
   - Other steps proceed normally
9. Complete clip is generated and ready for export/publish

### Architecture Notes

- **Server-side extraction is mandatory** for CORS reasons. Browsers cannot fetch arbitrary URLs. The server acts as a proxy with security controls (private URL blocking, size limits, timeout).
- **Readability.js** (from Mozilla) is dramatically better than raw Cheerio text extraction for articles. It strips navigation, ads, comments, and sidebars to produce clean article text. It requires `jsdom` on the server to create a DOM from HTML.
- **Structured data (JSON-LD)** is available on most e-commerce sites, recipe sites, and news sites. It provides machine-readable product prices, recipe ingredients/steps, article publish dates, and more. This is far more reliable than heuristic extraction.
- **Image extraction quality matters.** Prefer: (1) OG image, (2) JSON-LD images, (3) `<article>` images with width > 400px, (4) product images from schema.org. Filter out icons, tracking pixels, and CSS background images.
- **Content-type-specific orchestrator prompts** produce better videos. A product URL should generate a "product showcase" video with price callouts and feature highlights. A recipe URL should generate a "step-by-step tutorial." A news article should generate a "news breakdown." The extraction already classifies content type; the orchestrator should use specialized prompt templates.
- **Rate limiting** is critical since server-side URL fetching could be abused. The existing 10 req/min per IP is appropriate. Consider adding a Supabase auth check to allow higher limits for authenticated users.
- **Puppeteer is optional** but valuable for JavaScript-rendered pages (SPAs, React sites). The current `fetch` + Cheerio approach fails on client-rendered pages. Puppeteer adds ~100MB to the server but handles any page. Consider making it an opt-in "enhanced extraction" mode.

### Acceptance Criteria

- [ ] User can paste a URL and see extracted content preview within 10 seconds
- [ ] Product pages extract: title, price, features, product images
- [ ] Article/blog pages extract: title, clean body text (via Readability), images
- [ ] Recipe pages extract: title, ingredients, steps
- [ ] News pages extract: headline, summary, key facts
- [ ] Extracted images appear in the preview and are used in generated video
- [ ] User can edit the suggested prompt before generation
- [ ] Generated video accurately reflects the URL content (correct title, key points, tone)
- [ ] Private/local URLs are rejected with clear error message
- [ ] Invalid URLs show validation error before server call
- [ ] Rate limiting prevents abuse (429 response after 10 requests/minute)
- [ ] Timeout after 15 seconds with clear error message for slow pages

---

## Feature #36: Blog/Article-to-Video

### What

Optimized pipeline for converting long-form text content (blog posts, articles, essays, newsletters) into engaging short-form videos. Extends the URL-to-Video feature with article-specific intelligence: section detection, key sentence extraction, reading-time-aware summarization, visual scene planning per section, and automatic B-roll/illustration matching. The AI condenses a 5-minute-read article into a 30-60 second video with scene transitions matching the article's narrative structure.

### Tech Stack

- **Article Extraction:** `@mozilla/readability` (shared with URL-to-Video) + custom section parser
- **AI Summarization:** Gemini 2.5 Flash for section-aware condensation
- **Scene Planning:** Gemini 2.5 Flash (separate call) for mapping sections to visual scenes
- **Stock Media Matching:** Pixabay API (existing) matched to per-section visual descriptions
- **Orchestrator:** Existing pipeline with enhanced prompt

### Existing Code to Modify

1. **`server/routes/urlToVideo.ts`** (313 lines) — Add a new endpoint `POST /extract-article` specifically optimized for long-form content:
   - Uses Readability for clean text extraction
   - Detects article sections by heading hierarchy (h2, h3)
   - Extracts per-section: heading, text, images, word count
   - Sends structured sections to Gemini for section-aware summarization
   - Returns an `ArticleExtraction` response with sections, each having a summary and visual description

2. **`src/services/orchestrator.ts`** — Add article-specific prompt template in `buildPlanPrompt()`:
   - When `settings.contentType === 'article'`, use a prompt that maps each article section to a scene
   - Each scene gets: narrator text (condensed from section), visual treatment (stock media or SVG), text overlay (section heading as lower-third)
   - Pacing: allocate seconds per section proportional to word count
   - Ensure smooth transitions between sections

3. **`src/types/orchestrator.ts`** — Add `contentType?: 'generic' | 'article' | 'product' | 'recipe' | 'news'` to `OrchestratorSettings`.

4. **`src/components/panels/orchestrator/URLInputSection.tsx`** (from #35) — Extend to show article-specific preview:
   - Section list with per-section summaries
   - Visual scene suggestions per section
   - Reorderable sections (drag to reorder)
   - Toggle sections on/off (exclude from video)

### New Code to Create

1. **`server/services/articleParser.ts`** — Server-side article processing:
   - `parseArticleSections(html: string): ArticleSection[]` -- uses Readability + heading detection to split into sections
   - `ArticleSection`: `{ heading, text, images, wordCount, level }`
   - `summarizeForVideo(sections: ArticleSection[], targetDurationSec: number): VideoScript[]` -- calls Gemini to condense each section, allocating time proportionally
   - `VideoScript`: `{ sectionHeading, narrationText, visualDescription, durationSec, transitionType }`

2. **`src/services/articleToVideo.ts`** — Frontend service:
   - `extractArticle(url: string): Promise<ArticleExtraction>` -- calls `POST /api/url-to-video/extract-article`
   - `ArticleExtraction`: `{ title, author, publishDate, sections: ArticleSection[], totalWordCount, estimatedReadingTime, suggestedVideoDuration }`
   - `buildArticlePrompt(extraction: ArticleExtraction, settings: ArticleVideoSettings): string` -- constructs the orchestrator prompt from the extracted article

3. **`src/components/panels/orchestrator/ArticlePreview.tsx`** — UI component:
   - Article metadata header (title, author, reading time)
   - Section cards with expandable text and visual scene previews
   - Duration slider (30s to 120s) that redistributes time across sections
   - Section reordering via drag-and-drop
   - Section enable/disable toggles
   - "Generate Video" button

### Data Flow

1. User pastes a blog/article URL (detection: URL extraction returns `contentType: 'article'`)
2. Frontend detects article type and calls `POST /api/url-to-video/extract-article`
3. Server extraction pipeline:
   a. Fetch HTML, run Readability for clean article text
   b. Parse heading hierarchy to detect sections (h2/h3 splits)
   c. For each section: extract text, associated images, word count
   d. Call Gemini with full article context + sections for video-optimized summarization
   e. Return structured `ArticleExtraction` with per-section summaries and visual descriptions
4. Frontend shows ArticlePreview with all sections
5. User adjusts target duration (slider), reorders/toggles sections
6. User clicks "Generate Video"
7. Frontend builds article-specific orchestrator prompt:
   - Intro scene: article title + author attribution
   - Per section: narration text (from condensed summary) + visual direction
   - Outro scene: call-to-action ("Read the full article at [site]")
8. Orchestrator runs with article prompt, generating a multi-scene video where each section becomes a visual scene with appropriate stock media, text overlays, and transitions

### Architecture Notes

- **Section detection** is the key differentiator from generic URL-to-Video. Articles have a natural structure (intro, sections with headings, conclusion). The video should mirror this structure with scene transitions at section boundaries.
- **Time allocation by word count** ensures fair pacing. A 500-word section gets more screen time than a 100-word section. The minimum per section is 3 seconds (enough for a heading + key sentence). The maximum is proportional to the target duration.
- **Visual scene planning** per section means each section gets a distinct visual treatment. Section about "market growth" gets a chart template. Section about "user experience" gets a screenshot or product image. Section about "team" gets character illustrations. The Gemini prompt should suggest visual types per section.
- **The Readability library** removes 90% of page noise (ads, navigation, comments, related articles) producing clean body text. This is critical for accurate summarization -- without it, Gemini wastes context on irrelevant page elements.
- **Handles long articles well.** For articles over 3000 words, the system truncates to 5000 chars for Gemini context but still extracts all section headings for structure. The AI summarizes based on section headings + available text.
- **This feature shares infrastructure with #35 (URL-to-Video).** The server extraction endpoint, Readability integration, and orchestrator prompt injection are shared. The article-specific code adds section parsing and per-section scene mapping on top.

### Acceptance Criteria

- [ ] Long-form articles (1000+ words) are correctly split into sections by heading hierarchy
- [ ] Each section has a condensed summary suitable for narration (10-30 words)
- [ ] Target duration slider correctly redistributes time across sections
- [ ] User can reorder sections and toggle sections on/off
- [ ] Generated video has distinct scenes matching the article sections
- [ ] Scene transitions align with section boundaries
- [ ] Article title appears as an intro scene
- [ ] Source attribution appears as an outro CTA
- [ ] Articles without headings fall back to paragraph-based section detection
- [ ] Very long articles (5000+ words) are handled without errors (truncation with structure preservation)
- [ ] Generated video accurately represents the article's key points

---

## Feature #24: AI Image-to-Video

### What

Upload a static image and transform it into a short animated video clip (4-10 seconds) using AI video generation models. Supports camera movements (pan, zoom, parallax), subtle element animation (hair blowing, water rippling, clouds moving), and full scene animation (walking, talking, action sequences). The generated video is placed on the canvas as a video layer for further editing, compositing, or use as a background.

### Tech Stack

- **AI Video APIs:**
  - Runway Gen-4 (best quality, supports image conditioning + text prompt)
  - Kling v2.0 (image-to-video with motion control)
  - Minimax Hailuo (cost-effective alternative)
  - Luma Dream Machine (good for camera movement)
- **Server Proxy:** Express.js route for API key protection (similar to existing `server/routes/imageToVideo.ts`)
- **Video Storage:** Supabase Storage or IndexedDB for caching generated clips
- **Canvas Integration:** Existing `useVideoLayerStore` for placing generated video on canvas

### Existing Code to Modify

1. **`server/routes/imageToVideo.ts`** — Already exists as an Express route. Verify current implementation and extend:
   - Add support for multiple AI providers (currently may only support one)
   - Add `provider` parameter to select between Runway, Kling, Minimax, Luma
   - Add `motionType` parameter: 'camera-pan', 'camera-zoom', 'subtle-motion', 'full-animation'
   - Add `motionIntensity` parameter: 0.0 (still) to 1.0 (dramatic)
   - Add `prompt` parameter for describing desired motion
   - Normalize response format across all providers

2. **`src/components/panels/AIAnimationPanel.tsx`** — Currently handles text-to-video generation. Extend with an image-to-video tab:
   - Image upload area (drag-and-drop + file picker)
   - Preview of uploaded image
   - Motion type selector (camera movement, subtle animation, full animation)
   - Text prompt for describing desired motion
   - Provider selector (auto, Runway, Kling, Minimax, Luma)
   - Duration selector (4s, 6s, 8s, 10s)
   - Generation progress with preview when available

3. **`src/stores/useVideoLayerStore.ts`** — Add generated image-to-video clips:
   - Store the source image URL alongside the generated video URL for re-generation
   - Store generation parameters (prompt, motion type, provider) for iteration

4. **`src/stores/useAIAnimationStore.ts`** — Add image-to-video generation state:
   - `sourceImage: string | null` (data URL or blob URL of uploaded image)
   - `imageToVideoSettings: { motionType, prompt, provider, duration, intensity }`
   - `generateFromImage()` action

5. **`src/services/aiAnimation.ts`** — Add image-to-video generation function alongside existing text-to-video:
   - `generateVideoFromImage(image: Blob, prompt: string, options: ImageToVideoOptions): Promise<VideoGenerationJob>`
   - Upload the image to the server, start generation, poll for completion

### New Code to Create

1. **`server/services/imageToVideoProviders.ts`** — Provider abstraction layer:
   - `RunwayProvider.generateFromImage(imageUrl, prompt, options): Promise<JobResult>` -- calls Runway Gen-4 API
   - `KlingProvider.generateFromImage(imageUrl, prompt, options): Promise<JobResult>` -- calls Kling API
   - `MinimaxProvider.generateFromImage(imageUrl, prompt, options): Promise<JobResult>` -- calls Minimax Hailuo API
   - `LumaProvider.generateFromImage(imageUrl, prompt, options): Promise<JobResult>` -- calls Luma API
   - Unified `JobResult`: `{ jobId, status, videoUrl, thumbnailUrl, duration }`
   - Auto-selection logic: choose provider based on motion type (Runway for full animation, Luma for camera movements, Minimax for cost efficiency)

2. **`src/services/imageToVideo.ts`** — Frontend service:
   - `uploadImageForGeneration(file: File): Promise<string>` -- uploads to server temp storage
   - `generateFromImage(imageUrl: string, prompt: string, options: ImageToVideoOptions): Promise<string>` -- starts generation, returns job ID
   - `pollImageToVideoStatus(jobId: string): AsyncGenerator<VideoJobStatus>` -- yields status updates
   - `ImageToVideoOptions`: `{ provider, motionType, duration, intensity, aspectRatio }`

3. **`src/components/panels/ImageToVideoPanel.tsx`** — Dedicated UI component (or tab within AIAnimationPanel):
   - Image upload with drag-and-drop and paste support
   - Uploaded image preview with aspect ratio indicator
   - Motion preset cards: "Slow Zoom", "Pan Left", "Parallax Depth", "Subtle Motion", "Cinematic"
   - Custom prompt text area for advanced users
   - Generate button with cost estimate
   - Result preview with "Use as Background" / "Use as Overlay" / "Re-generate" actions

### Data Flow

1. User uploads an image (drag-and-drop, file picker, or paste from clipboard)
2. Frontend creates a preview (data URL) and shows the image
3. User selects motion type (preset or custom prompt) and duration
4. User clicks "Generate"
5. Frontend uploads image to server via `POST /api/image-to-video/upload`
6. Server stores image temporarily and returns a server-accessible URL
7. Frontend calls `POST /api/image-to-video/generate` with image URL, prompt, options
8. Server selects the best AI provider based on motion type and availability
9. Server sends request to the selected provider API
10. Server returns `{ jobId }` immediately
11. Frontend polls `GET /api/image-to-video/status/:jobId` every 3 seconds
12. Provider generates video (typically 30-120 seconds depending on provider)
13. Server receives completion from provider, downloads the video, stores in temp
14. Frontend receives `{ status: 'complete', videoUrl: '/api/image-to-video/result/:jobId' }`
15. Frontend downloads the video blob and creates a `VideoLayer` on the canvas
16. User can reposition, resize, and composite the video layer with other elements

### Architecture Notes

- **Multi-provider strategy** is essential because AI video generation is rapidly evolving. No single provider is best for all use cases. Runway excels at realistic motion, Kling is good at character animation, Luma specializes in camera movements. The auto-selector picks based on the motion type parameter.
- **Server-side proxy is required** to protect API keys and handle long-running jobs. The providers all use async job patterns (submit, poll, download). The server manages the full lifecycle.
- **Image upload sizing.** Most providers accept images up to 1024x1024 or 1280x720. The server should resize/crop uploaded images to fit provider requirements. Preserve aspect ratio by center-cropping.
- **Cost tracking.** Image-to-video generation costs $0.05-0.50 per generation depending on provider and duration. Integrate with the existing credit system (`src/services/creditGate.ts`, `src/types/credits.ts`). Show cost estimate before generation.
- **Result caching.** Store generated videos in IndexedDB (via `mediaDB.ts`) so they persist across sessions. Include the source image and generation parameters for reproducibility.
- **Canvas integration.** The generated video becomes a `VideoLayer` (same as existing AI text-to-video). It can be placed at any position, scaled, and composited with other layers. It can also be used as a background by setting it to full-canvas size.
- **Motion presets** are pre-configured prompt+settings combinations: "Slow Zoom In" = `{ motionType: 'camera-zoom', prompt: 'slow zoom into center', intensity: 0.3 }`. These lower the barrier for non-technical users.

### Acceptance Criteria

- [ ] User can upload an image via drag-and-drop, file picker, or clipboard paste
- [ ] Image preview shows the uploaded image with dimensions
- [ ] User can select from 5+ motion presets (zoom, pan, parallax, subtle, cinematic)
- [ ] User can write a custom motion prompt for advanced control
- [ ] Generation starts and progress is shown (percentage or phase indicator)
- [ ] Generated video plays in a preview within 2 minutes of starting generation
- [ ] "Use as Background" places the video as a full-canvas background layer
- [ ] "Use as Overlay" places the video at center canvas with drag/resize handles
- [ ] Generated video is cached in IndexedDB and persists across sessions
- [ ] Credit cost is deducted and shown in the cost breakdown
- [ ] Failed generations show clear error messages with retry option
- [ ] Multiple concurrent generations are tracked independently

---

## Feature #42: Batch Generation from CSV/Spreadsheet

### What

Upload a CSV or Excel file where each row becomes a separate video using a template or orchestrator prompt with variable substitution. Designed for e-commerce sellers (100 product videos from a product catalog), real estate agents (property listing videos), educators (flashcard videos), and agencies (client campaign batches). Supports column-to-template mapping, per-row preview, parallel generation with progress tracking, and ZIP export of all generated videos.

### Tech Stack

- **CSV Parsing:** `papaparse` (robust CSV parser, handles encoding, delimiters, quoted fields)
- **Excel Parsing:** `xlsx` (SheetJS) for `.xlsx` and `.xls` files
- **Template Engine:** Existing `templateBridge.ts` for HTML template CONFIG injection, or orchestrator prompt with `{variable}` substitution
- **Parallel Execution:** Web Worker pool or sequential orchestrator runs with concurrency limit
- **ZIP Export:** `JSZip` for bundling all generated videos

### Existing Code to Modify

1. **`src/services/orchestrator.ts`** — Add batch execution mode:
   - `generateBatch(rows: Record<string, string>[], templatePrompt: string, settings: OrchestratorSettings, onRowProgress: (rowIndex, status) => void): Promise<BatchResult[]>`
   - For each row, substitute `{column_name}` placeholders in the template prompt with the row's values
   - Execute sequentially (or with concurrency=2) to avoid API rate limits
   - Track per-row status: pending, generating, exporting, complete, error

2. **`src/services/videoExport.ts`** — Add batch export support:
   - `exportBatch(compositions: VideoCompositionProps[], options: ExportOptions, onProgress): Promise<Blob[]>`
   - Export each composition to a video blob
   - Alternatively: `exportBatchAsZip()` that bundles all videos into a ZIP

3. **`src/services/templateBridge.ts`** (60+ lines) — The postMessage bridge already supports `CONFIG_UPDATE` and `CONFIG_BULK_UPDATE` messages. For batch mode with HTML templates:
   - Add `applyRowData(templateId: string, rowData: Record<string, string>)` function that sends all column values as CONFIG updates
   - This allows using HTML motion graphics templates as batch templates

4. **`src/stores/useOrchestratorStore.ts`** — Add batch state:
   - `batchRows: Record<string, string>[]`
   - `batchColumnMapping: Record<string, string>` (maps CSV columns to template variables)
   - `batchProgress: { total: number; completed: number; failed: number; current: number }`
   - `batchResults: BatchRowResult[]`

5. **`src/types/orchestrator.ts`** — Add batch types:
   - `BatchRowResult`: `{ rowIndex, status, videoUrl, error, duration }`
   - `BatchSettings`: `{ concurrency, autoExport, outputFormat, namingPattern }`

### New Code to Create

1. **`src/services/batchProcessor.ts`** — Core batch processing engine:
   - `parseCsv(file: File): Promise<{ columns: string[]; rows: Record<string, string>[] }>` -- uses PapaParse
   - `parseExcel(file: File): Promise<{ columns: string[]; rows: Record<string, string>[] }>` -- uses SheetJS
   - `substituteVariables(template: string, row: Record<string, string>): string` -- replaces `{column_name}` with row values
   - `processBatch(rows, templatePrompt, settings, onProgress): Promise<BatchResult[]>` -- orchestrates the full batch pipeline
   - `exportBatchZip(results: BatchResult[]): Promise<Blob>` -- bundles all video blobs into a ZIP

2. **`src/components/panels/BatchPanel.tsx`** — Full batch UI:
   - File upload area accepting `.csv`, `.xlsx`, `.xls`
   - Column preview table showing first 5 rows
   - Column-to-variable mapping UI: dropdowns mapping CSV columns to template variables
   - Template prompt editor with `{variable}` autocomplete
   - Alternative: HTML template selector with column-to-CONFIG-key mapping
   - Preview button: generates one row as sample
   - "Generate All" button with estimated time and credit cost
   - Progress dashboard: grid of row cards showing status (pending/generating/done/error)
   - Export: "Download All as ZIP" button
   - Retry failed rows individually

3. **`src/components/panels/batch/ColumnMapper.tsx`** — Column mapping UI:
   - Table view: CSV column names on left, template variable names on right
   - Auto-detect: try to match column names to common template variables (title, description, image_url, price, etc.)
   - Manual override: dropdowns for each mapping
   - Preview: show one row with substitutions applied

4. **`src/components/panels/batch/BatchProgressGrid.tsx`** — Progress visualization:
   - Grid of cards, one per row
   - Each card shows: row number, key column value (e.g., product name), status badge, thumbnail when complete
   - Click to expand and see full generation details
   - Overall progress bar at top

### Data Flow

1. User uploads a CSV/Excel file via BatchPanel
2. `batchProcessor.parseCsv()` or `parseExcel()` extracts columns and rows
3. Frontend shows column preview with first 5 rows
4. User writes a template prompt with `{variable}` placeholders (or selects an HTML template)
5. User maps CSV columns to template variables via ColumnMapper
6. User clicks "Preview" to generate one sample row
7. Orchestrator runs with the first row's substituted prompt
8. Preview video plays; user verifies the output
9. User clicks "Generate All"
10. Batch processor iterates over rows:
    a. For each row: substitute variables in the template prompt
    b. Call `orchestrator.generateClipPlan()` with the substituted prompt
    c. Execute the 13-step pipeline
    d. Export the result as a video blob
    e. Update progress: mark row as complete or error
    f. Continue to next row (or process 2 concurrently)
11. When all rows are processed, show summary: X succeeded, Y failed
12. User clicks "Download All as ZIP" to get all videos in a single archive
13. Failed rows can be retried individually

### Architecture Notes

- **Sequential vs. parallel execution.** AI API rate limits (Gemini: 15 RPM, ElevenLabs: varies) make high-concurrency batch processing impractical. Default to sequential execution with concurrency=1. Allow concurrency=2 for users with higher API limits. Show estimated total time based on per-row average.
- **Template prompt with variables** is the simplest approach. Example: "Create a 15-second product video for {product_name}. Price: {price}. Features: {features}. Use a {style} visual style." Each row fills in the variables and gets a unique video.
- **HTML template integration** is an alternative for structured content. Instead of running the full orchestrator per row, inject row data directly into an HTML template via `templateBridge.ts`. This is much faster (no AI generation needed per row) but produces simpler, template-driven videos. Best for: product catalogs, social media posts, event announcements.
- **Naming pattern** for output files: `{row_number}_{column_value}.mp4`. User can configure which column to use for naming. Default: row number.
- **Memory management** is critical. Each generated video blob consumes memory. For 100 rows at ~5MB each = 500MB. Options: (a) export each video to IndexedDB as it completes and release the blob, (b) stream directly to ZIP in progress rather than holding all blobs in memory, (c) limit batch size to 50 rows with pagination.
- **Credit tracking.** Each row consumes orchestrator credits (Gemini tokens + ElevenLabs characters). Show total estimated cost before starting: `rows * avg_cost_per_row`. Integrate with `creditGate.ts` to check balance before starting and deduct per row.
- **Resume on failure.** If the browser tab closes mid-batch, completed results should be stored in IndexedDB. On reload, offer to resume from where it left off.

### Acceptance Criteria

- [ ] User can upload CSV and Excel (.xlsx) files with automatic column detection
- [ ] Column preview shows first 5 rows correctly with proper encoding handling
- [ ] Variable substitution replaces all `{column_name}` placeholders in the template prompt
- [ ] Column-to-variable mapper auto-detects common column names
- [ ] Single-row preview generates a sample video for verification
- [ ] Batch generation processes all rows with per-row progress tracking
- [ ] Failed rows show clear error messages and can be retried individually
- [ ] "Download All as ZIP" bundles all completed videos with correct filenames
- [ ] Batch of 10 rows completes without memory issues
- [ ] Batch of 50 rows completes without memory issues (with streaming to IndexedDB)
- [ ] Credit cost estimate is shown before starting and is accurate within 20%
- [ ] User can cancel a running batch (completed rows are preserved)

---

## Feature #53: Document/PDF-to-Video

### What

Upload a PDF document and transform it into an animated video that walks through the document's content. Extracts text, headings, images, tables, and charts from each page, then maps them to video scenes with appropriate motion graphics templates. Supports academic papers, business reports, slide decks exported as PDF, manuals, and worksheets. Each page or section becomes a scene with animated text reveals, image transitions, and optional narration.

### Tech Stack

- **PDF Parsing (client-side):** `pdfjs-dist` (Mozilla pdf.js) for text extraction, page rendering, and layout analysis
- **PDF Parsing (server-side, optional):** `pdf-parse` (Node.js) for server-side text extraction of complex PDFs
- **AI Processing:** Gemini 2.5 Flash for summarization and visual scene planning
- **Page Rendering:** pdf.js `canvas` API for rendering pages as images
- **Orchestrator:** Existing pipeline with document-specific prompt template

### Existing Code to Modify

1. **`src/services/orchestrator.ts`** — Add document-specific prompt template:
   - When `settings.contentType === 'document'`, build a prompt that maps document pages/sections to video scenes
   - Include extracted text and page thumbnails as context
   - Generate a multi-scene ClipPlan with one scene per page/section

2. **`src/types/orchestrator.ts`** — Add `extractedDocument?: DocumentExtraction` to `OrchestratorSettings`.

3. **`src/stores/useOrchestratorStore.ts`** — Add document extraction state.

4. **`src/components/panels/orchestrator/PromptPhase.tsx`** — Add a "Upload Document" button alongside URL input:
   - File picker accepting `.pdf`
   - Document preview showing page thumbnails
   - Per-page section preview with extracted text

### New Code to Create

1. **`src/services/documentParser.ts`** — Client-side PDF processing:
   - `parsePDF(file: File): Promise<DocumentExtraction>` -- uses pdf.js to extract:
     - `pages: DocumentPage[]` with `{ pageNumber, text, headings, images, hasTable, hasChart, thumbnailDataUrl }`
     - Document metadata: `{ title, author, pageCount, language }`
   - `renderPageThumbnail(pdfDoc, pageNumber, scale): Promise<string>` -- renders a page to canvas, returns data URL
   - `extractPageText(pdfDoc, pageNumber): Promise<{ text, headings, items }>` -- extracts text with font size analysis for heading detection
   - `detectPageType(page: DocumentPage): 'title' | 'text' | 'image-heavy' | 'table' | 'chart' | 'diagram'` -- classifies page type for scene template selection

2. **`src/services/documentToVideo.ts`** — Document-to-video orchestration:
   - `buildDocumentPrompt(extraction: DocumentExtraction, settings: DocumentVideoSettings): string` -- constructs orchestrator prompt from document content
   - `DocumentVideoSettings`: `{ pagesPerScene, targetDuration, includePageImages, narrationStyle, transitionStyle }`
   - Maps page types to visual treatments:
     - Title page: cinematic title card template
     - Text page: text reveal with key quote highlight
     - Image-heavy page: Ken Burns pan over page images
     - Table page: animated data table motion graphic
     - Chart page: animated chart template with data extraction

3. **`src/components/panels/orchestrator/DocumentPreview.tsx`** — UI component:
   - Thumbnail grid showing all pages
   - Per-page details: extracted text preview, detected type badge, scene template assignment
   - Page enable/disable toggles (exclude pages from video)
   - Page grouping: drag pages into scenes (multiple pages per scene)
   - Duration slider: allocate time per page/scene
   - Narration toggle: generate TTS narration from extracted text

4. **`src/types/document.ts`** — Type definitions:
   - `DocumentExtraction`: `{ title, author, pageCount, language, pages: DocumentPage[] }`
   - `DocumentPage`: `{ pageNumber, text, headings, images: PageImage[], hasTable, hasChart, pageType, thumbnailDataUrl }`
   - `PageImage`: `{ dataUrl, width, height, altText }`
   - `DocumentVideoSettings`: settings for the conversion

### Data Flow

1. User uploads a PDF via file picker in PromptPhase
2. `documentParser.parsePDF(file)` runs client-side:
   a. pdf.js loads the document
   b. For each page: extract text, detect headings (by font size), render thumbnail
   c. Classify each page type (title, text, image, table, chart)
   d. Return `DocumentExtraction` with all pages
3. Frontend shows DocumentPreview with page thumbnails and extracted content
4. User configures: target duration, pages to include, narration toggle
5. User clicks "Generate Video"
6. `documentToVideo.buildDocumentPrompt()` constructs a structured prompt:
   - Document title and context
   - Per-page/scene descriptions with key text and visual directions
   - Narration script derived from extracted text
7. Orchestrator runs with the document prompt:
   - `setup-canvas`: landscape (16:9) for document content
   - `setup-characters`: narrator character if narration enabled
   - `generate-voices`: TTS from narration script
   - `setup-stock-media`: page thumbnails used as media layers (Ken Burns)
   - `setup-text-overlays`: key quotes and headings as animated text
   - `setup-html-templates`: chart/table templates populated with extracted data
8. Complete video is generated with scene transitions at page boundaries

### Architecture Notes

- **Client-side PDF parsing** with pdf.js keeps document data private (no server upload of potentially sensitive documents). pdf.js runs entirely in the browser and can handle most PDFs including encrypted ones (with password).
- **Page rendering as images** is the simplest approach for visual content. Render each page at 1280x720 resolution, use the rendered image as a media layer in the video with Ken Burns animation. This preserves the exact visual layout of the page.
- **Text extraction quality varies.** pdf.js extracts text well from standard PDFs but struggles with scanned documents (images of text). For scanned PDFs, fall back to rendering pages as images and using Gemini Vision for OCR.
- **Heading detection by font size.** pdf.js provides font size for each text item. The largest font size on a page is likely a heading. Group consecutive items by font size to detect heading hierarchy. This is heuristic but works well for most documents.
- **Tables and charts are hard to extract.** pdf.js gives raw text positions, not table structure. For tables: detect grid patterns in text item positions. For charts: render the page as an image and use Gemini Vision to describe the chart data. Re-create as animated HTML templates where possible.
- **Large PDFs (50+ pages)** should be handled gracefully. Options: (a) limit to first 20 pages with a "select pages" UI, (b) automatically extract the most important pages (title, intro, conclusion, pages with images). Show a warning for large documents.
- **Memory management.** Each page thumbnail is a data URL (~50-200KB). A 50-page PDF generates ~5-10MB of thumbnails. Render thumbnails lazily (only visible pages) and dispose offscreen thumbnails.

### Acceptance Criteria

- [ ] User can upload a PDF and see page thumbnails within 5 seconds (for 20-page document)
- [ ] Text extraction produces readable text with paragraph structure
- [ ] Heading detection correctly identifies document headings by font size
- [ ] Page type classification works: title pages, text pages, image-heavy pages detected correctly
- [ ] User can select/deselect pages and reorder scenes
- [ ] Generated video has distinct scenes per page/section with appropriate transitions
- [ ] Page images appear in the video with Ken Burns animation
- [ ] Key text headings appear as animated text overlays
- [ ] Narration (when enabled) covers the document's main points
- [ ] PDFs with 50+ pages show a page selection UI without crashing
- [ ] Encrypted PDFs prompt for password
- [ ] Scanned PDFs (image-only) fall back to image-based processing with a warning

---

## Feature #56: PowerPoint Import

### What

Import a `.pptx` PowerPoint file and reconstruct its content as a ProAnimate project. Each slide becomes a scene with text overlays, images, shapes, and backgrounds mapped to ProAnimate equivalents. Speaker notes become the narration script for TTS voice generation. Slide transitions map to ProAnimate scene transitions. The result is an editable, animatable project that maintains the presentation's content while adding professional video production capabilities.

### Tech Stack

- **PPTX Parsing:** Custom ZIP extraction + XML parsing (PPTX is a ZIP containing Office Open XML)
- **ZIP:** `JSZip` for extracting PPTX contents
- **XML Parsing:** `DOMParser` (browser-native) for parsing slide XML
- **Image Extraction:** Direct file extraction from PPTX `ppt/media/` directory
- **EMU Conversion:** Custom math for converting PowerPoint's EMU (English Metric Units) to pixels

### Existing Code to Modify

1. **`src/stores/useTimelineStore.ts`** — After importing a PPTX, set `totalFrames` based on the number of slides multiplied by a configurable seconds-per-slide default.

2. **`src/stores/useTextOverlayStore.ts`** — Add text overlays extracted from PowerPoint text boxes. Map PowerPoint font names to available `FontFamily` values. Map PowerPoint text formatting (bold, italic, font size, color, alignment) to TextOverlay properties.

3. **`src/stores/useShapeStore.ts`** — Add shapes extracted from PowerPoint. Map PowerPoint shape types (rectangle, oval, triangle, arrow) to ProAnimate `ShapeType`.

4. **`src/stores/useMediaStore.ts`** — Add images extracted from PowerPoint slides as media assets. Store extracted image blobs via `mediaDB.ts`.

5. **`src/services/orchestrator.ts`** — Add PPTX-to-video orchestration mode:
   - When `settings.contentType === 'presentation'`, use a prompt template optimized for slide content
   - Speaker notes become the narration script (one dialogue line per slide)
   - Slide visuals inform the visual treatment per scene

6. **`src/components/panels/orchestrator/PromptPhase.tsx`** — Add "Upload Presentation" button:
   - File picker accepting `.pptx`
   - Slide preview carousel
   - Per-slide edit options

### New Code to Create

1. **`src/services/pptxParser.ts`** — Core PPTX parsing engine:
   - `parsePPTX(file: File): Promise<PresentationData>` -- main entry point
   - `extractSlideXML(zip: JSZip, slideIndex: number): Promise<Document>` -- extracts and parses slide XML
   - `extractSlideLayout(zip: JSZip, layoutRef: string): Promise<Document>` -- extracts slide layout XML for inherited properties
   - `parseSlideMaster(zip: JSZip): Promise<SlideMaster>` -- parses the slide master for theme colors and fonts
   - `parseTextBox(shapeXml: Element): TextBoxData` -- extracts text content, formatting, position, size
   - `parseShape(shapeXml: Element): ShapeData` -- extracts shape type, fill, stroke, position, size
   - `parseImage(shapeXml: Element, zip: JSZip): Promise<ImageData>` -- extracts image reference, loads from `ppt/media/`
   - `parseSpeakerNotes(zip: JSZip, slideIndex: number): Promise<string>` -- extracts speaker notes from `ppt/notesSlides/`
   - `parseTransition(slideXml: Document): TransitionData` -- extracts slide transition type and duration
   - `emuToPixels(emu: number, dpi: number): number` -- converts EMU to pixels (1 inch = 914400 EMU)

2. **`src/services/pptxImporter.ts`** — Maps parsed PPTX data to ProAnimate stores:
   - `importPresentation(data: PresentationData): Promise<void>` -- orchestrates the full import
   - Per slide:
     - Creates timeline track clips (one clip per slide, duration from settings)
     - Creates text overlays from text boxes (position, font, color, alignment)
     - Creates shapes from PowerPoint shapes (type, fill, stroke, position)
     - Stores extracted images as media assets
     - Sets background color or background image per slide
   - Global:
     - Sets canvas dimensions from slide size (standard 16:9 or 4:3)
     - Sets FPS and total frames
     - Generates narration script from speaker notes

3. **`src/types/pptx.ts`** — Type definitions:
   - `PresentationData`: `{ slides: SlideData[], slideWidth, slideHeight, theme: ThemeData }`
   - `SlideData`: `{ index, textBoxes: TextBoxData[], shapes: ShapeData[], images: ImageData[], background, speakerNotes, transition }`
   - `TextBoxData`: `{ text, x, y, width, height, fontSize, fontFamily, fontColor, bold, italic, alignment, rotation }`
   - `ShapeData`: `{ type, x, y, width, height, fillColor, strokeColor, strokeWidth, rotation }`
   - `ImageData`: `{ dataUrl, x, y, width, height, filename }`
   - `ThemeData`: `{ colors: Record<string, string>, fonts: { heading, body } }`
   - `TransitionData`: `{ type, duration }`

4. **`src/components/panels/pptx/PPTXImportPanel.tsx`** — Import UI:
   - File upload accepting `.pptx`
   - Slide carousel with thumbnails (rendered from parsed data)
   - Per-slide settings: duration, narration toggle, transition type
   - Mapping review: show what each text box/shape/image maps to in ProAnimate
   - "Import" button to execute the mapping
   - "Import + Generate" button to import and run orchestrator for full video with animations and narration

5. **`src/components/panels/pptx/SlidePreview.tsx`** — Renders a visual preview of a parsed slide using ProAnimate components (text overlays, shapes, images positioned correctly). This gives the user a WYSIWYG preview of how the imported slide will look.

### Data Flow

1. User uploads a `.pptx` file via PPTXImportPanel
2. `pptxParser.parsePPTX(file)` processes the file:
   a. JSZip extracts the PPTX archive
   b. Parse `ppt/presentation.xml` for slide dimensions and ordering
   c. Parse `ppt/theme/theme1.xml` for color palette and fonts
   d. For each slide (`ppt/slides/slide{N}.xml`):
      - Parse all `<p:sp>` (shapes) and `<p:pic>` (pictures) elements
      - Extract text runs with formatting from `<a:r>` elements
      - Extract images from `ppt/media/` directory
      - Parse speaker notes from `ppt/notesSlides/notesSlide{N}.xml`
      - Parse transition from `<p:transition>` element
   e. Return `PresentationData` with all slides
3. Frontend shows slide carousel with visual previews
4. User configures: seconds per slide, narration on/off, transition style
5. User clicks "Import":
   a. `pptxImporter.importPresentation(data)` runs
   b. Sets canvas to slide dimensions (1920x1080 for 16:9 or 1440x1080 for 4:3)
   c. For each slide: creates text overlays, shapes, media assets, background
   d. Sets timeline: totalFrames = slides * secondsPerSlide * fps
   e. Project is ready for manual editing
6. Alternatively, user clicks "Import + Generate":
   a. Import runs as above
   b. Speaker notes concatenated into a narration script
   c. Orchestrator runs with presentation-specific prompt
   d. TTS generates narration from speaker notes
   e. Animations and transitions are applied

### Architecture Notes

- **PPTX is a ZIP file containing Office Open XML.** The key files are: `ppt/presentation.xml` (slide order and dimensions), `ppt/slides/slide{N}.xml` (slide content), `ppt/slideLayouts/` (layout templates), `ppt/slideMasters/` (master slides), `ppt/theme/` (colors and fonts), `ppt/media/` (embedded images, videos, audio). All are XML except media files.
- **EMU (English Metric Units)** is PowerPoint's coordinate system. 1 inch = 914400 EMU. Slide dimensions are in EMU. To convert to pixels at 96 DPI: `pixels = emu / 914400 * 96`. Standard 16:9 slide is 12192000 x 6858000 EMU (13.33" x 7.5").
- **Text formatting** in PPTX is deeply nested. A text box (`<p:txBody>`) contains paragraphs (`<a:p>`), each containing runs (`<a:r>`) with run properties (`<a:rPr>` for font, size, bold, italic, color). Paragraph properties (`<a:pPr>`) contain alignment and spacing.
- **Font mapping** is imperfect. PowerPoint uses system fonts; ProAnimate uses Google Fonts. Map common fonts: Calibri -> Inter, Arial -> Inter, Times New Roman -> Merriweather, Helvetica -> Inter, Comic Sans MS -> Caveat, Impact -> Bebas Neue. Unknown fonts fall back to Inter.
- **Shape mapping:** PowerPoint has 200+ preset shapes via `<a:prstGeom>`. Map the most common: rect, roundRect, ellipse, triangle, rightArrow, star5. For complex shapes (flowcharts, callouts), fall back to rendering as an image.
- **Background handling:** Slides can have solid fill, gradient fill, image fill, or pattern fill backgrounds. Parse `<p:bg>` from the slide XML. For solid/gradient, map to canvas background color. For images, extract and set as a media background layer.
- **Speaker notes are the key to narration.** Well-prepared presentations have detailed speaker notes that serve as a perfect narration script. When notes are empty, fall back to the slide text content as narration (less ideal but functional).
- **No library dependency for parsing.** Unlike PDF where we use pdf.js, PPTX parsing is done with JSZip + DOMParser, both browser-native. This keeps the bundle small. The complexity is in the XML schema interpretation, not the parsing itself.
- **Google Slides alternative input.** Google Slides can export as PPTX, so this feature indirectly supports Google Slides. A direct Google Slides API integration could be added later (requires OAuth for Google Workspace).

### Acceptance Criteria

- [ ] User can upload a `.pptx` file and see slide thumbnails within 3 seconds (for 30-slide deck)
- [ ] Text boxes are extracted with correct: text content, position, font size, color, bold/italic, alignment
- [ ] Images are extracted from slides and displayed correctly
- [ ] Shapes (rectangle, circle, triangle) are mapped to ProAnimate shapes with correct fill/stroke
- [ ] Speaker notes are extracted and available as narration text
- [ ] Slide transitions are detected and mapped to ProAnimate transitions
- [ ] Theme colors from the PPTX are extracted and optionally applied as a brand kit
- [ ] Imported project renders correctly on the ProAnimate canvas (positions match original slide layout)
- [ ] "Import + Generate" produces a narrated video from speaker notes
- [ ] Font mapping converts common PowerPoint fonts to available Google Fonts
- [ ] PPTX files with 50+ slides are handled without memory issues
- [ ] PPTX files with embedded videos show a warning (video extraction not supported in v1)
- [ ] Corrupted or non-PPTX files show a clear error message

---

## Related

- [[feature-list]] — Features #151 URL-to-Video, #150 PPTX Import, #149 Figma Import
- [[feature-priorities]] — URL-to-Video (#17), PowerPoint Import (#40), with Specialized Modes and AI Content Generation scoring
- [[PROGRESS]] — Track completion status
- [[phase-7|Phase 7: Professional Output]] — Previous phase
- [[phase-9|Phase 9: Developer Platform]] — Next phase
- [[orchestrator-technical]] — Orchestrator pipeline extended for new input types
