# ProAnimate — Tabs, Sub-tabs & Proposed Reorganization

## Current State (8 groups, 36 sub-tabs)

### 1. Characters (`create`) — 1 sub-tab
- `character` — Characters — Create & manage characters (2D/3D/1D/Avatar modes)

### 2. Library (`media`) — 1 sub-tab
- `media` — Library — Media assets & stock library

### 3. Generate (`video`) — 9 sub-tabs
- `gen-image` — Image Gen — Generate images from text prompts
- `gen-text-to-video` — Text to Video — Generate video from text prompts
- `image-to-video` — Img to Video — AI image-to-video generation
- `gen-audio-to-video` — Audio to Video — Generate video from audio input
- `gen-video-to-video` — Video to Video — Style transfer & video transformation
- `gen-retake` — Retake — Regenerate video with tweaks
- `gen-extend` — Extend — Extend existing video duration
- `broll-suggest` — B-Roll — AI B-roll gap suggestions
- `gen-manim` — Manim Video — AI-powered educational math & science video generation with pause-and-explain

### 4. Audio (`audio`) — 5 sub-tabs
- `voice-clone` — Voice Clone — Clone & manage custom voices
- `singing` — Singing — Singing lip sync & audio
- `adaptive-music` — Adaptive Music — Emotion-driven adaptive music
- `audio-enhancement` — Audio FX — Professional audio processing & enhancement
- `beat-sync` — Audio Sync — Sync animations to audio beats

### 5. Edit (`edit`) — 4 sub-tabs
- `mixed-media` — Mixed Media — Overlays, style effects & style transfer
- `animStyle` — Anim Style — Transfer animation style to keyframes
- `transitions` — Transitions — Scene transition effects
- `cinema-studio` — Cinema — Cinema camera body, lens & optical controls

### 6. Script (`script`) — 4 sub-tabs
- `scripts` — Script — AI-generated scripts & voiceover
- `dialogue` — Dialogue — Multi-character dialogue editor
- `transcript` — Transcript — Text-based video editing
- `captions` — Captions — Auto-synced subtitles & styles

### 7. Design (`design`) — 6 sub-tabs
- `text` — Text — Titles, subtitles & text overlays
- `brand-kit` — Brand Kit — Colors, fonts & brand assets
- `schema` — Schema — Project variables & bindings
- `assets` — Assets — Animations, SVG art, components & motion designs
- `memes` — Memes — Meme template generator
- `crowd` — Crowd — Background crowd character generator

### 8. Publish (`publish`) — 6 sub-tabs
- `auto-publish` — Schedule — Auto-publish & scheduling
- `series` — Series — Episodic content management
- `competitor-scraper` — Competitors — Scrape & analyze competitor videos
- `trends` — Trends — Trending topics & hashtags
- `virality` — Score — Virality & engagement scoring
- `repurpose` — Repurpose — Resize & adapt for platforms

### Already-Absorbed Tabs (redirects)
- `templates` → `scripts`
- `translation` → `dialogue`
- `transcript-editor` → `dialogue`
- `transcript-import` → `dialogue`
- `dubbing` → `dialogue`
- `content-calendar` → `auto-publish`
- `motion-capture` → `character`
- `motion-tracking` → `character`
- `live-avatar` → `character`
- `3d-objects` → `character`
- `svg-art` → `assets` (consolidated)
- `component-creator` → `assets` (consolidated)
- `motion-design` → `assets` (consolidated)
- `animations` → `assets` (consolidated)

---

## Proposed Reorganization (11 groups)

Organized by **media output type** for generation tabs (Image/Video/Audio/Edit), with Features + Model dropdown inside each. Editor-specific tabs (Script/Design/Publish) kept separate.

### 1. Characters (standalone)
- `character` — Characters (2D/3D/1D/Avatar)

### 2. Library (standalone)
- `media` — Media Library

### 3. Image — AI image generation & features + model dropdown
- ~~`face-swap` — Face Swap~~ *(deactivated)*
- `assets` — Assets (consolidated: SVG Art, Components, Motion AI, Animations)
- `memes` — Memes (template-based image generation)

### 4. Video — AI video generation & features + model dropdown
- `image-to-video` — Image to Video
- `cinema-studio` — Cinema Studio (absorbs `shot-grid`)
- `crowd` — Crowd Generator
- `broll-suggest` — B-Roll Suggestions

### 5. Audio — Voice, music & audio processing + model dropdown
- `voice-clone` — Voice Clone
- `singing` — Singing Lip Sync
- `adaptive-music` — Adaptive Music
- `audio-enhancement` — Audio Enhancement
- `beat-sync` — Audio Sync (absorbs `audio-reactive`)

### 6. Edit — AI post-processing & enhancement + model dropdown
- `mixed-media` — Mixed Media (overlays + style effects + style transfer; absorbs `effect-browser`, `style-effects`)
- `animStyle` — Animation Style Transfer

### 7. Script — Writing & dialogue
- `scripts` — Script
- `dialogue` — Dialogue
- `transcript` — Transcript
- `captions` — Captions

### 8. Design — Canvas elements & visual styling
- `text` — Text Overlays
- `transitions` — Transitions
- `camera` — Camera (absorbs `cinema-studio` keyframe UI, `shot-grid`)
- Whiteboard — Canvas-integrated (toggled from canvas top bar, no left panel tab)
- `brand-kit` — Brand Kit (absorbs `moodboard` color extraction)
- `schema` — Schema (advanced)

### 9. Publish — Distribution & analytics
- `auto-publish` — Schedule
- `series` — Series
- `trends` — Trends (absorbs `social-integration`)
- `virality` — Score (absorbs `content-score`, `pacing`)
- `repurpose` — Repurpose

### ~~10. Apps (standalone)~~ *(disabled — group completely removed)*
- ~~`apps` — 55+ one-click creative tools~~

### 11. Layers (standalone, direct view)

---

## Moves to Right Panel (removed from left panel)

| Tab | Reason | New Location |
|-----|--------|-------------|
| `character-identity` | Property OF a specific character | Right panel tab when character selected |
| `wardrobe` | Dressing a specific character | Right panel; marketplace wardrobe sharing |

## Becomes Dropdown (removed as standalone tab)

| Tab | Reason | New Location |
|-----|--------|-------------|
| `ai-models` | Goal is generating, not picking models | Dropdown within Image/Video/Audio/Edit tabs *(implemented)* |

## Merges (16 tabs absorbed)

| Absorbed Tab | Merged Into | Rationale |
|-------------|------------|-----------|
| `cinema-studio` | **Camera** (Design) | All write to `useCameraStore` |
| `shot-grid` | **Camera** (Design) | All write to `useCameraStore` |
| `effect-browser` | **Mixed Media** (Edit) | Both apply visual treatments |
| `style-effects` | **Mixed Media** (Edit) | Merged: overlays + style effects in one panel |
| `moodboard` | **Brand Kit** (Design) | Color/style discovery feeds into brand |
| `audio-reactive` | **Audio Sync** (Audio) | Both map audio → visual properties |
| `virality` | **Score** (Publish) | Near-duplicate of content-score |
| `content-score` | **Score** (Publish) | Near-duplicate of virality |
| `pacing` | **Score** (Publish) | Also a scoring/analysis tool |
| `social-integration` | **Trends** (Publish) | Both show trending topics + hashtags |
| `annotations` | **Whiteboard** (Design) | Both draw on canvas |
| `export-profiles` | ExportPanel modal | Only shows validation info, doesn't trigger export |
| `branching-video` | Hidden/advanced in Publish | Very niche interactive feature |
| `pptx-import` | Absorbed into Library or Figma Import | Mislabeled (actually renders Figma Import) |

## Tab Relocations

| Tab | From | To | Reason |
|-----|------|----|--------|
| `captions` | Design | **Script** | Captions come from dialogue audio alignment |
| `voice-clone` | Audio | **Audio** (stays) | Audio domain |
| `singing` | Audio | **Audio** (stays) | Audio domain |
| ~~`face-swap`~~ | Characters | ~~**Image**~~ *(deactivated)* | AI generation tool, not character management |
| ~~`apps`~~ | Characters | ~~**Apps** (standalone)~~ *(disabled)* | Meta-launcher, unrelated to characters; group completely removed |
| `crowd` | Design | **Video** | AI generates animated crowd scenes |
| `brand-kit` | Publish | **Design** | Defines how things LOOK, not distribution |
| `broll-suggest` | Media | **Video** | AI video composition tool |
| `image-to-video` | Media | **Video** | AI video generation |
| `svg-art` | Design | **Image** | AI image/vector generation |
| `component-creator` | Design | **Image** | AI-generates visual components |
| `motion-design` | Design | **Image** | AI-generates visual layouts |
| `memes` | Design | **Image** | Template-based image generation |
| ~~`style-effects`~~ | Design | **Edit** *(merged into mixed-media)* | AI post-processing tool |
| `effect-browser` | Design | **Edit** | AI post-processing tool |
| `moodboard` | Design | **Edit** or **Design** | Style discovery |
| `scripts` | Publish | **Script** | Writing, not distribution |
| `dialogue` | Publish | **Script** | Writing, not distribution |
| `transcript` | Publish | **Script** | Writing, not distribution |

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Groups | 7 | 11 |
| Total visible sub-tabs | 49 | ~33 |
| Largest group | Design (19) | Design (7) |
| Tabs moved to right panel | 0 | 2 |
| Tabs merged/absorbed | 0 | 16 |
| Tabs relocated between groups | 0 | 18 |

---

## Related

- [[feature-list]] — All 167 features mapped across these tabs
- [[PROGRESS]] — Implementation progress
- [[research]] — Competitive analysis informing tab structure
- [[orchestrator-creative]] — AI Director that generates content across these tabs
- [[orchestrator-technical]] — Technical execution mapping tabs to stores

> **Note:** Higgsfield competitive research has been archived to `docs/archive/higgsfield.md`.
