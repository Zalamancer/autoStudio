# ProAnimate Mobile Companion App — Design Spec

## Vision

ProAnimate becomes the "After Effects of automated template creation." The mobile app is the delivery and creation channel — users browse, customize, preview, and export kinetic typography templates from their phone. Templates are driven by JSON descriptions (`MotionDesignDescription`), enabling AI-generated motion graphics that render natively on mobile.

## Architecture Decisions

### 1. Expo Development Build (NOT Expo Go)

**Decision:** Use `expo-dev-client` with custom native modules from day one.

**Rationale:** ~40% of templates use CSS features (gradients, clipPath, mixBlendMode, textStroke) that require `@shopify/react-native-skia`, which cannot run in Expo Go. Starting with a dev build avoids a painful migration later.

### 2. DynamicRenderer-First Strategy

**Decision:** Port the JSON-driven `DynamicMotionDesignRenderer` to React Native instead of hand-porting ~90 individual KineticBase template components.

**Rationale:**
- One renderer handles all AI-generated templates automatically
- Hand-coded KineticBase templates can be converted to `MotionDesignDescription` JSON over time
- Cuts porting effort from ~15 dev weeks to ~4 weeks
- Aligns with the automation vision — new templates are JSON, not code

### 3. Hybrid Rendering: Reanimated + Skia

**Decision:** Two rendering paths sharing the same core animation logic.

| Element type | Renderer | Covers |
|---|---|---|
| Simple (text, rect, transforms, opacity) | `react-native-reanimated` + `Animated.View/Text` | ~60% of elements |
| Complex (gradients, clips, blend modes, arcs) | `@shopify/react-native-skia` Canvas | ~40% of elements |

### 4. Shared Core Package

**Decision:** Extract pure TypeScript animation logic into `@proanimate/core`, consumed by both web and mobile.

**Contents:**
- `timing.ts` — `computeKineticPhase()` (word cycling, phase calculations)
- `easing.ts` — All easing functions (worklet-compatible with `'worklet'` directives)
- `interpolation.ts` — `lerp`, `interpolateProps`, `interpolateConfig`
- `holdEffects.ts` — `computeHoldEffect` (pulse, glow, float, breathe)
- `typographyEngine.ts` — `splitText`, `computeUnitStyle`, `TYPOGRAPHY_PRESETS`
- `types/` — `MotionDesignDescription`, `AnimatableProps`, `MotionElement`, `FieldDescriptor`, etc.

**Packaging:** Pre-compiled to JS in a `packages/core/` workspace directory. Metro configured with `watchFolders` and `nodeModulesPaths` to resolve it. If Metro proves fragile, fall back to publishing as a private npm package.

**Worklet compatibility constraints:**
- All core functions must be pure (no closures over non-serializable values)
- `interpolateProps` must NOT use `new Set()` — rewrite to iterate `Object.keys()` directly
- Factory easing functions (`elastic(amp, period)`, `back(overshoot)`, `bezier(x1,y1,x2,y2)`) capture only primitive numbers, which are worklet-serializable — add `'worklet'` directive
- `cubicBezier` Newton-Raphson solver: pre-compute 64-sample lookup tables for named presets (material, snappy, cinematic) to avoid per-frame solving on low-end devices
- `EASING_CSS_MAP` and `easingToCss` stay in `web/` — not extracted to core

**Web import migration:** Existing web imports (`@/engine/easing`, `@/services/motionDesign/typographyEngine`) will be updated to re-export from `@proanimate/core`. The original files become thin re-export shims to avoid breaking existing imports across 1,518 source files.

### 5. Backend Changes Required

**Decision:** Mobile app consumes the `/api/v1/` REST endpoints and Supabase Auth, but three endpoints need changes.

- Auth: Supabase JWT (same `@supabase/supabase-js` client) with `expo-secure-store` for token persistence and `onAuthStateChange` for refresh handling
- Templates: Fetched from server (endpoint needs new fields — see below)
- Export: `POST /api/v1/renders` (endpoint needs new payload shape — see below)
- Projects: Supabase `projects` table needs new columns (see below)
- Storage: Same Supabase Storage buckets

**Required backend changes:**

#### 5a. `POST /api/v1/renders` — Accept MotionDesignDescription payload

Current schema accepts only `{ prompt, settings, webhookUrl }`. Must add an alternate payload shape:

```typescript
// New: direct template render (used by mobile)
{
  motionDesignDescription: MotionDesignDescription  // full template JSON
  configOverrides: Record<string, unknown>           // user's customizations
  settings: { aspectRatio, durationSeconds, fps, format: 'mp4' | 'webm' }  // no gif (not supported)
  webhookUrl?: string
}
```

Server validates and sanitizes the `motionDesignDescription` payload (max depth, max element count, style value whitelist) before passing to Remotion worker. The existing `prompt`-based flow remains untouched.

#### 5b. `GET /api/v1/templates` — Serve MotionDesignDescription JSON

Current endpoint returns only hardcoded category stubs. Must be extended to return:

```typescript
{
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  thumbnailUrl: string              // static preview image (see Thumbnail Pipeline below)
  motionDesignDescription: MotionDesignDescription
  configSchema: FieldDescriptor[]
  defaultConfig: Record<string, unknown>
}
```

Templates are stored as JSON files in Supabase Storage (bucket: `template-definitions`) and cached server-side.

#### 5c. Supabase `projects` table — New columns

Add columns:
- `template_id: text` — which template this project uses
- `config_state: jsonb` — user's customization state (serialized config overrides)
- `motion_design_description: jsonb` — the full MotionDesignDescription (for AI-generated templates that aren't in the catalog)

#### 5d. CORS for mobile

Express CORS middleware must allow requests from mobile origins (React Native sends `null` or no `Origin` header). Add `credentials: true` and handle missing Origin gracefully.

#### 5e. Thumbnail Pipeline

Template preview thumbnails are generated server-side: Remotion renders frame 0 of each template at 400x400, uploads to Supabase Storage (`template-thumbnails` bucket), and the URL is served via the templates endpoint. Thumbnails regenerate on template update via a server job.

## Project Structure

```
autoStudio/AutoAnimation/
├── packages/
│   └── core/                        # Pure TS, no React dependency
│       ├── src/
│       │   ├── timing.ts
│       │   ├── easing.ts
│       │   ├── interpolation.ts
│       │   ├── holdEffects.ts
│       │   ├── typographyEngine.ts
│       │   └── types/
│       │       ├── motionDesign.ts
│       │       └── motionGraphic.ts
│       ├── package.json
│       └── tsconfig.json
│
├── mobile/                          # Expo dev build app
│   ├── app/                         # Expo Router (file-based navigation)
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── (tabs)/
│   │   │   ├── browse.tsx           # Template gallery grid
│   │   │   ├── projects.tsx         # User's saved projects
│   │   │   └── settings.tsx
│   │   ├── editor/
│   │   │   └── [templateId].tsx     # Config editor + live preview
│   │   └── export/
│   │       └── [projectId].tsx      # Export trigger + progress + download
│   ├── src/
│   │   ├── renderers/
│   │   │   ├── DynamicRenderer.tsx  # Mobile port of DynamicMotionDesignRenderer
│   │   │   ├── ElementRenderer.tsx  # Switch on element type → View/Text/Svg/Skia
│   │   │   ├── SkiaElementRenderer.tsx  # Complex elements via Skia Canvas
│   │   │   └── TypographyRenderer.tsx   # Per-character animated text
│   │   ├── stores/
│   │   │   ├── useAuthStore.ts
│   │   │   ├── useTemplateStore.ts
│   │   │   ├── useProjectStore.ts
│   │   │   ├── useEditorStore.ts
│   │   │   └── useExportStore.ts
│   │   ├── services/
│   │   │   ├── api.ts              # /api/v1/ endpoint wrappers
│   │   │   ├── supabase.ts         # Supabase client init
│   │   │   ├── fontMapper.ts       # Cross-platform font resolution
│   │   │   └── styleTransformer.ts # CSS style → RN style conversion
│   │   ├── components/
│   │   │   ├── TemplateCard.tsx     # Gallery thumbnail + metadata
│   │   │   ├── ConfigEditor.tsx    # Dynamic form from FieldDescriptor[]
│   │   │   ├── AnimationPreview.tsx # Live preview wrapper
│   │   │   ├── ExportProgress.tsx  # Polling UI for render jobs
│   │   │   └── ColorPicker.tsx
│   │   └── hooks/
│   │       ├── useAnimationDriver.ts  # Reanimated shared value → progress
│   │       └── useFonts.ts            # Font loading
│   ├── assets/
│   │   └── fonts/                  # Bundled font files
│   ├── app.json
│   ├── metro.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── src/                             # Existing web app (imports updated to use @proanimate/core)
│   ├── motionGraphics/              # Web renderers unchanged, timing/easing imports redirect to core
│   ├── engine/
│   ├── stores/
│   └── ...
│
└── server/                          # Backend (3 endpoint changes — see Section 5)
```

## Tech Stack (Mobile)

| Dependency | Purpose | Version |
|---|---|---|
| `expo` | Framework | SDK 52+ |
| `expo-dev-client` | Custom dev build | Latest |
| `expo-router` | File-based navigation | v4 |
| `react-native-reanimated` | 60fps UI thread animations | v3 |
| `@shopify/react-native-skia` | Complex rendering (gradients, clips) | v1 |
| `react-native-svg` | SVG elements (arcs, circles) | Latest |
| `expo-font` | Custom font loading | Latest |
| `expo-av` | Video playback for exported videos | Latest |
| `zustand` | State management | v5 (same as web) |
| `immer` | Immutable state updates | v10 (same as web) |
| `@supabase/supabase-js` | Auth + storage + DB | v2 (same as web) |
| `expo-file-system` | Download exported videos | Latest |
| `expo-sharing` | Share exported videos | Latest |
| `expo-secure-store` | Encrypted JWT token storage | Latest |
| `react-native-mmkv` | Fast local persistence for draft projects | Latest |

## Rendering Pipeline

### Animation Driver

Replaces Remotion's frame-based system with Reanimated's time-based system:

```
useSharedValue(0) → withTiming(totalDuration) → progress (0..1)
                                                      ↓
                                          computeKineticPhase() [core]
                                                      ↓
                                          computeHoldEffect() [core]
                                          interpolateProps() [core]
                                                      ↓
                                      ┌───────────────┴───────────────┐
                              useAnimatedStyle()              Skia Canvas draw()
                              (simple elements)               (complex elements)
```

### Style Transformation Layer

`styleTransformer.ts` converts CSS properties from `MotionElement.style` to RN equivalents:

| CSS Property | RN Equivalent |
|---|---|
| `inset: 0` | `{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }` |
| `transform: translate(X,Y) scale(S) rotate(R)` | `{ transform: [{ translateX: X }, { translateY: Y }, { scale: S }, { rotate: 'Rdeg' }] }` |
| `clamp(min, preferred, max)` | Pre-computed from `Dimensions.get('window')` |
| `linear-gradient(...)` | `<LinearGradient>` component or Skia gradient shader |
| `text-shadow: X Y blur color` | iOS: `textShadowOffset/Color/Radius`. Android: Skia text |
| `filter: blur(N)` | Skia `ImageFilter.MakeBlur()` |
| `clip-path` | Skia `ClipPath` |
| `mix-blend-mode` | Skia `BlendMode` |
| `display: grid` | Convert to `flexDirection: 'row' + flexWrap: 'wrap'` with explicit item widths |
| `vw` units | `Dimensions.get('window').width * fraction` |
| `boxShadow` (glow effect) | Skia `Shadow` or `DropShadow` image filter (always route glow elements through Skia) |

### Renderer Escalation Logic

`ElementRenderer` inspects each element's styles and hold effects BEFORE choosing the rendering path:

```
Element arrives → inspectStyles(element) → needsSkia?
  │                                            │
  ├── NO  → Animated.View/Text path            │
  │         (transforms, opacity, color)        │
  │                                             │
  └── YES → Skia Canvas path                   │
            (gradient bg, blur, glow,           │
             clipPath, blendMode, textStroke)    │
```

An element escalates to Skia if ANY of these are true:
- `element.style` contains `background` with `gradient` keyword
- `element.style` contains `clipPath`, `mixBlendMode`, or `WebkitTextStroke`
- `element.animation?.hold?.effect === 'glow'` (produces boxShadow)
- Element type is `arc` (requires SVG, rendered via Skia for consistency)
- `filter: blur()` is present in computed animatable props

### Typography Cursor Blink

The web `TypographyTextRenderer` cursor uses `Math.sin(progress * 60)` which doesn't blink correctly at 0-1 progress scale on mobile. Mobile replacement: a separate `useSharedValue` driven by `withRepeat(withTiming(1, { duration: 1000 }), -1, true)` that toggles the cursor `<View>` opacity. The cursor is rendered as an absolutely positioned `<View>` adjacent to the last character, NOT nested inside `<Text>` (RN restriction).

### Font Resolution

`fontMapper.ts` handles cross-platform font availability:

```typescript
const FONT_MAP: Record<string, { ios: string; android: string; bundled?: string }> = {
  'Segoe UI':        { ios: 'System', android: 'Roboto', bundled: 'Roboto-Regular.ttf' },
  'Helvetica Neue':  { ios: 'Helvetica Neue', android: 'Roboto' },
  'Arial Black':     { ios: 'Arial Black', android: 'Roboto-Black', bundled: 'Roboto-Black.ttf' },
  'Courier New':     { ios: 'Courier New', android: 'monospace' },
  'Fredoka One':     { ios: 'Fredoka One', android: 'Fredoka One', bundled: 'FredokaOne-Regular.ttf' },
  // ... template-specific fonts bundled in assets/fonts/
}
```

## Export Flow

1. User customizes template config in editor
2. Taps "Export" → mobile app sends `POST /api/v1/renders` with:
   - `MotionDesignDescription` JSON
   - User's config overrides
   - Output format (mp4/webm — gif not supported by render API)
   - Resolution settings
3. Server enqueues Remotion render job
4. Mobile polls `GET /api/v1/renders/{jobId}` showing progress bar
5. On completion, mobile downloads via signed URL to device
6. Share sheet for social media posting

### Preview vs Export Fidelity

**Known gap:** Mobile preview (RN/Skia) will not be pixel-identical to server export (Remotion/Chromium). Text metrics, gradient rendering, and anti-aliasing differ.

**Mitigation strategy:**
- Accept minor visual differences for real-time preview (interactive editing needs instant feedback)
- Add a "Server Preview" option that renders a 3-second low-res preview via the render API for users who need accuracy before full export
- Document the gap in the app ("Preview is approximate. Final export may differ slightly.")

## Screens & UX Flow

```
Login → Tab Bar
              ├── Browse (template gallery grid)
              │     └── tap template → Editor
              │                          ├── Config panel (text, colors, timing sliders)
              │                          ├── Live animated preview (DynamicRenderer)
              │                          ├── "Server Preview" button (optional accuracy check)
              │                          └── "Export" button → Export screen
              │                                                  ├── Format picker (mp4/webm)
              │                                                  ├── Resolution picker
              │                                                  ├── Progress bar (polling)
              │                                                  └── Download/Share
              ├── Projects (user's saved projects)
              │     └── tap → resume editing or re-export
              └── Settings (account, preferences)
```

## Data Flow

```
Supabase Auth ──────────────────────── JWT token
                                           │
Template catalog ← GET /api/v1/templates ──┤
                                           │
Project CRUD ← /api/v1/projects ───────────┤
                                           │
Render pipeline ← /api/v1/renders ─────────┤
                                           │
Asset storage ← Supabase Storage ──────────┘
```

## Security

### Token Management
- JWT tokens stored in `expo-secure-store` (encrypted at rest, not `AsyncStorage`)
- `supabase.auth.onAuthStateChange()` handles automatic token refresh
- API wrapper (`services/api.ts`) intercepts 401 responses and triggers re-auth flow
- Long-running export polls check token validity before each request

### Payload Validation
- Server validates `MotionDesignDescription` payloads before passing to Remotion:
  - Max element count: 200
  - Max nesting depth: 10
  - Style values validated against an allowlist (no `expression()`, `url()`, or `javascript:`)
  - Max payload size: 1MB
- `{{configKey}}` interpolation values are sanitized (HTML-encoded) before server-side rendering

### Rate Limiting
- Mobile export endpoint: max 5 concurrent render jobs per user
- Client-side debounce on export button (10s cooldown after submission)
- Credits validated before job enqueue (existing credits system)

## Offline Strategy

- **Template browsing:** Cached locally in MMKV after first fetch. Stale-while-revalidate pattern.
- **Editor:** Draft project state persisted to MMKV on every config change. Survives app kill / connectivity loss.
- **Export:** Disabled when offline (server-side rendering requires connectivity). Clear "No connection" UI state.
- **Auth:** Cached session token works until expiry. Offline users can browse cached templates and edit drafts. Login required for save/export.

## Implementation Phases

### Phase 0: Backend Prep (Week 1)
- Extend `POST /api/v1/renders` to accept `motionDesignDescription` + `configOverrides` payload
- Extend `GET /api/v1/templates` to serve `MotionDesignDescription` JSON + thumbnails
- Add `template_id`, `config_state`, `motion_design_description` columns to `projects` table
- CORS configuration for mobile clients
- Thumbnail generation job (Remotion renders frame 0 of each template)

### Phase 1: Foundation (Week 1-2)
- Monorepo setup with `packages/core/` extraction
- Expo project init with dev build config (`expo prebuild`)
- Dependency compatibility validation (Skia v1.x + Reanimated v3 + Expo SDK 52 + RN 0.76)
- Skia + Reanimated + SVG installed and verified on real device
- Supabase auth flow (login/register) with `expo-secure-store` token persistence
- Tab navigation shell

### Phase 2: Core Renderer (Week 3-4)
- Port `DynamicMotionDesignRenderer` to mobile
  - `ElementRenderer` with View/Text/Svg/Skia switch + escalation logic
  - `SkiaElementRenderer` for gradient/blur/glow/clip elements
  - `styleTransformer` for CSS → RN conversion (start with top 20 CSS properties, expand iteratively)
  - `fontMapper` for cross-platform fonts (start with 5 core fonts)
- Rewrite `interpolateProps` without `new Set()` for worklet compatibility
- Animation driver (`useAnimationDriver` hook)
- Live preview working with 3-5 test templates

### Phase 3: Editor & Browse (Week 5-6)
- Template gallery (grid view with server-served thumbnails)
- Config editor (dynamic form generated from `FieldDescriptor[]`)
- Live preview in editor screen
- Project save/load via Supabase (using new `config_state` column)
- MMKV draft persistence for offline resilience

### Phase 4: Export & Polish (Week 7-8)
- Export trigger via updated `/api/v1/renders` with `MotionDesignDescription` payload
- Polling UI with progress + token refresh handling
- Download to device via `expo-file-system` + share sheet via `expo-sharing`
- Error handling, loading states, offline detection
- Performance benchmarking on low-end target device (define min: iPhone 11 / Pixel 5 era)

### Phase 5: Template Coverage (Week 9-12)
- Convert priority KineticBase templates to MotionDesignDescription JSON (batch of 20)
- Expand style transformer for edge cases discovered in conversion
- Font bundling for template-specific typefaces (lazy download, not app bundle)
- Performance optimization for complex Skia templates
- Audit all templates for non-deterministic rendering (`Date.now()` in render → convert to progress-based)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Metro + workspace linking breaks | Blocks dev | Pre-compile core to JS; fallback to published npm package |
| Skia + Reanimated + Expo SDK version incompatibility | Blocks Week 1 | Pin exact versions, test compatibility matrix before starting Phase 1 |
| Skia rendering perf on low-end Android | Bad UX | Define min device target (Pixel 5); benchmark early; LOD for complex templates |
| Font bundle size bloat | App too large | Lazy font download per template from Supabase Storage |
| Preview/export fidelity gap confuses users | Support burden | "Server Preview" button; clear UI messaging; document known differences |
| Easing worklet serialization issues | Animation bugs | Integration test suite for all easing functions as worklets; rewrite `interpolateProps` without `new Set()` |
| Grid layout conversion lossy | Templates look wrong | Explicit grid-to-flex mapping with computed item widths; flag grid templates in catalog |
| `Date.now()` in template renders | Non-deterministic output | Audit all templates; convert to progress-based calculations |
| Token expiry during long export polls | Silent failures | Wrapper intercepts 401; auto-refresh; retry last request |
| Malicious MotionDesignDescription payloads | Server-side risk | Validate depth, element count, style whitelist before Remotion render |

## Success Criteria

1. User can browse templates, customize text/colors/timing, and see live animated preview at 60fps
2. User can trigger server-side export and download the video to their phone
3. Same Supabase account works on web and mobile
4. At least 5 templates render correctly on mobile by end of Phase 2 (renderer validation)
5. At least 20 templates render correctly on mobile by end of Phase 5 (template conversion)
6. App works on iOS 16+ and Android 12+ (min devices: iPhone 11, Pixel 5)
7. Draft projects survive app kill and offline periods (MMKV persistence)
8. Export completes successfully with token refresh across 10+ minute render jobs
