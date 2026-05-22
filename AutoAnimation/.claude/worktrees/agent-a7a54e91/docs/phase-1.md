# Phase 1: Export & Rendering Quick Wins

**Timeline:** 1-3 days total
**Theme:** Ship fast, close embarrassing gaps. These are checkbox features that every competitor has.

---

## #3 GIF Export

### What
GIF export gives creators a way to share short animations on platforms that do not support video (Reddit, Discord stickers, Slack, Dribbble, email signatures). The exported GIF uses optimized dithering and frame-skip to keep file size under 10 MB for most clips under 10 seconds.

### Tech Stack
- **gifenc** (npm `gifenc`) -- Modern, zero-dependency GIF encoder written in pure JS. Runs entirely in-browser with no Web Worker requirement. Produces smaller files than gif.js and supports both dithering and transparency.
- **Canvas2D** -- Existing `renderFrame()` pipeline feeds RGBA frames into the encoder.
- No backend changes required.

### Existing Code to Modify

**`src/services/videoExport.ts`**
- Add `'gif'` to the `ExportOptions.format` union type: `format: 'webm' | 'mp4' | 'gif'`.
- Add `'gif'` to the `ExportResult.actualFormat` and `ExportProgress.actualFormat` unions.
- Add a new `exportAsGif()` function parallel to `exportWithWebCodecs()` and `exportWithMediaRecorder()`.
- In the main `exportVideo()` function, add an early branch: if `format === 'gif'`, call `exportAsGif()` and return. This bypasses WebCodecs/MediaRecorder entirely since GIF is a still-image-sequence format.
- The `getFileExtension()` function needs a `'gif'` case returning `'gif'`.

**`src/components/panels/ExportPanel.tsx`**
- Add `{ label: 'GIF', value: 'gif' as const }` to `FORMAT_OPTIONS` array (line ~31).
- Add a GIF settings section that appears conditionally when GIF format is selected: frame skip dropdown (1/2/3 = every frame / every other frame / every 3rd), max width cap (320/480/640), and dithering toggle.
- Cap the resolution selector for GIF -- if resolution is 1080p and format is GIF, auto-downgrade to 480p and show a tooltip explaining why.

**`src/stores/useSettingsStore.ts`**
- Widen the `ExportFormat` type from `'webm'` to `'webm' | 'mp4' | 'gif'`.

### New Code to Create

**`src/services/gifExport.ts`**
Single-purpose module containing:
- `exportAsGif(canvas, ctx, props, renderCtx, opts, onProgress, signal)` -- main export loop.
- Uses `gifenc` to create a `GIFEncoder(width, height)`.
- Iterates frames using the same `renderFrame()` call from `canvas2dRenderer.ts`.
- Applies frame-skip (configurable: 1 = every frame, 2 = every other, 3 = every 3rd). Frame duration is adjusted proportionally (e.g., skip=2 at 30fps = each GIF frame is 67ms).
- Reads pixel data via `ctx.getImageData()` per frame and passes `Uint8Array` to the encoder.
- Applies nearest-color quantization (256-color palette per frame) with optional dithering via `gifenc`'s built-in quantizer.
- Returns a `Blob` with `image/gif` MIME type.

**`src/types/gifExport.ts`** (optional, can inline)
- `GifExportSettings { frameSkip: 1 | 2 | 3; maxWidth: number; dithering: boolean; loop: boolean }`.

### Data Flow
```
User clicks Export (GIF) in ExportPanel
  -> exportVideo() called with format: 'gif'
  -> exportVideo() branches to exportAsGif()
  -> exportAsGif() creates offscreen canvas at capped resolution (e.g., 480x854 for 9:16)
  -> Loop: for each frame (with frame-skip stride)
       -> renderFrame(ctx, props, frame, renderCtx)  // existing Canvas2D pipeline
       -> ctx.getImageData(0, 0, w, h)
       -> gifenc encoder.writeFrame(rgba, { delay: frameDurationMs })
  -> encoder.finish()
  -> new Blob([encoder.bytes()], { type: 'image/gif' })
  -> URL.createObjectURL(blob)
  -> onProgress({ status: 'complete', outputUrl })
```

### Architecture Notes

**Why gifenc over gif.js:** gif.js uses Web Workers and its maintenance has stalled (last commit 2018). gifenc is actively maintained, has better compression, and runs synchronously on the main thread (which is fine since our render loop already yields via `setTimeout` every 60 frames). For very long GIFs, we could wrap gifenc in a Worker later, but for clips under 30 seconds this is unnecessary.

**Resolution cap is mandatory:** A 1080p GIF at 30fps for 10 seconds would be ~200 MB. The hard cap should be 720p, with default at 480p. The UI should explain this clearly.

**Frame-skip trade-off:** At skip=2, a 30fps animation becomes 15fps GIF (66ms per frame). This halves file size with minimal perceived quality loss for most animation types. At skip=3, the animation starts looking choppy for fast motion but is fine for talking-head style.

**No audio:** GIF does not support audio. The export UI should note this clearly when GIF is selected.

**Palette strategy:** Per-frame local palette (256 colors each frame) produces better quality than a single global palette for diverse scenes. gifenc supports both; we default to local palette but offer a global palette option for smaller files.

### Acceptance Criteria
- [ ] GIF format option appears in Export panel format selector.
- [ ] Exporting a 5-second 9:16 clip at 480p with frame-skip=2 produces a valid GIF file under 8 MB.
- [ ] Progress callback fires correctly throughout the GIF export (preparing -> rendering -> complete).
- [ ] Cancel via AbortSignal stops the GIF export mid-render.
- [ ] GIF loops by default (infinite loop). A "loop once" option exists.
- [ ] Exported GIF plays correctly in browser, Discord, and Slack when dragged in.
- [ ] Resolution auto-caps to 480p when GIF format is selected, with tooltip explanation.
- [ ] Frame-skip options (1/2/3) are available and produce correct frame timing.

---

## #4 4K Export

### What
Adds 4K (3840x2160) and 2K (2560x1440) resolution options to the export pipeline. Professional creators need 4K output for YouTube and broadcast-quality deliverables. The existing export pipeline already supports arbitrary resolution -- this feature is primarily UI + a memory guard.

### Tech Stack
- **WebCodecs H.264** -- Chrome's hardware encoder supports 4K natively. No library changes.
- **Canvas2D** -- Already scales via `scaleX`/`scaleY` in `exportWithWebCodecs()` (line ~427-429 of `videoExport.ts`).
- **PixiJS GPU renderer** -- The existing `PixiExportRenderer` already accepts arbitrary width/height. GPU rendering is strongly recommended for 4K to avoid >5 second per-frame render times.

### Existing Code to Modify

**`src/components/panels/ExportPanel.tsx`**
- Expand `RESOLUTION_OPTIONS` array (currently 1080p/720p/480p at line ~46):
  ```
  { label: '4K (2160p)', scale: 2.0 },
  { label: '2K (1440p)', scale: 1.333 },
  { label: '1080p', scale: 1 },
  { label: '720p', scale: 0.667 },
  { label: '480p', scale: 0.444 },
  ```
- Add a memory warning banner that shows when 4K is selected: "4K export requires significant memory (~130 MB per frame). GPU acceleration is recommended. Export may be slow on older hardware."
- Default selection index changes from `0` to `2` (to keep 1080p as default).

**`src/stores/useSettingsStore.ts`**
- Expand `Resolution` type: `'4k' | '2k' | '1080p' | '720p' | '480p'`.

**`src/services/videoExport.ts`**
- No functional changes required -- the pipeline already handles arbitrary resolution via the `width`/`height` in `ExportOptions`. However, add a memory check at the top of `exportVideo()`:
  ```ts
  const frameMemoryMB = (width * height * 4) / (1024 * 1024) // RGBA bytes
  if (frameMemoryMB > 100) {
    console.warn(`[videoExport] High memory export: ${frameMemoryMB.toFixed(0)} MB per frame`)
  }
  ```
- Increase the WebCodecs encoder backpressure queue size from 8 to 4 for 4K (conditional on resolution) to avoid OOM. Or keep at 8 and let the browser manage memory.
- For 4K H.264, use the High Profile codec string: `'avc1.640033'` instead of `'avc1.640028'` (High @ Level 5.1, required for 4K at 30fps+).

**`src/services/canvas2dRenderer.ts`**
- No changes needed. The scale factor logic in `exportWithWebCodecs()` already handles non-1080p by applying `ctx.scale(scaleX, scaleY)` before `renderFrame()`.

### New Code to Create

None. This feature is entirely about expanding existing UI options and adding the appropriate codec level string.

### Data Flow
```
User selects 4K in Export panel
  -> exportWidth = Math.round(1080 * 2.0) = 2160  (for 9:16 base)
     exportHeight = Math.round(1920 * 2.0) = 3840
     (or for 16:9: 3840 x 2160)
  -> exportVideo({ width: 3840, height: 2160, fps, ... })
  -> Canvas created at 3840x2160
  -> scaleX = 3840 / 1920 = 2.0, scaleY = 2160 / 1080 = 2.0
  -> Each frame: ctx.scale(2.0, 2.0) -> renderFrame() draws at 2x
  -> VideoFrame(canvas, { timestamp }) -> encoder handles 4K natively
  -> Output: 4K MP4/WebM
```

### Architecture Notes

**Memory is the real constraint:** A single 4K RGBA frame is 33.2 MB (3840 * 2160 * 4 bytes). With encoder backpressure of 8 frames, that is 265 MB just in flight. The GPU renderer (`PixiExportRenderer`) should be strongly preferred for 4K because it keeps frame data on the GPU until VideoFrame creation.

**Codec level matters:** H.264 Level 4.0 (`avc1.640028` -- our current codec string) technically supports up to 2048x1024. For 4K we need Level 5.1 (`avc1.640033`). The code should select the codec string based on resolution:
```ts
const codec = useMP4
  ? (width * height > 2048 * 1024 ? 'avc1.640033' : 'avc1.640028')
  : 'vp8'
```

**VP8 at 4K is problematic:** VP8 does not have hardware encoding for 4K on most GPUs. VP9 would be better for WebM at 4K, but we currently use VP8. Consider offering VP9 as an option when 4K + WebM is selected.

**Bitrate scaling:** The current bitrate formula `width * height * fps * quality * 0.15` will produce very high bitrates at 4K (3840*2160*30*1.0*0.15 = ~37 Mbps). This is correct for quality but will produce large files. The estimated size display should update accordingly.

**Export time warning:** A 10-second 4K clip at 30fps = 300 frames. If Canvas2D rendering takes 50ms/frame at 4K, that is 15 seconds of render time + encoding. With GPU renderer it drops to ~5ms/frame. The UI should recommend GPU acceleration.

### Acceptance Criteria
- [ ] 4K (2160p) and 2K (1440p) options appear in the resolution selector.
- [ ] Exporting a 3-second test clip at 4K produces a valid MP4 that plays in VLC/QuickTime at 3840x2160.
- [ ] Memory warning banner appears when 4K is selected.
- [ ] Export progress updates correctly during 4K render.
- [ ] H.264 codec string auto-selects High @ Level 5.1 for resolutions above 2048x1024.
- [ ] GPU renderer is auto-selected when available for 4K export.
- [ ] Estimated file size display reflects the higher resolution accurately.

---

## #16 Blend Modes

### What
Adds compositing blend modes to all canvas layers (media, shapes, text, SVG objects, Lottie, characters). Blend modes let creators layer elements with effects like multiply (darken overlay), screen (lighten), overlay (contrast), and more -- standard compositing operations that every design tool supports.

### Tech Stack
- **Canvas2D `globalCompositeOperation`** -- Native browser API, zero dependencies. Supports all CSS composite modes: `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`.

### Existing Code to Modify

**`src/stores/useMediaStore.ts`**
- Already has `blendMode` on `CanvasMediaItem` (line ~62): `'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light'`. Expand this union to include all Canvas2D composite operations.

**`src/stores/useShapeStore.ts` (Zustand store for shapes)**
- Add `blendMode: BlendMode` property to the shape interface, defaulting to `'source-over'`.

**`src/stores/useTextOverlayStore.ts`**
- Add `blendMode: BlendMode` property to text overlay items, defaulting to `'source-over'`.

**`src/stores/useSVGObjectStore.ts`**
- Add `blendMode: BlendMode` property to SVG object items, defaulting to `'source-over'`.

**`src/stores/useAnimationStore.ts`**
- Add `blendMode: BlendMode` property to Lottie animation items, defaulting to `'source-over'`.

**`src/remotion/types.ts`**
- Add `blendMode?: string` to the relevant export data interfaces: `MediaItemData`, `ShapeLayerData`, `TextOverlayData`, `AnimationData`, and `SVGObjectData` (or whatever the names are in the Remotion props).

**`src/services/canvas2dRenderer.ts`**
- In `drawMediaLayers()` (line ~1803): after `ctx.save()` and `ctx.globalAlpha`, add:
  ```ts
  if (item.blendMode && item.blendMode !== 'normal') {
    ctx.globalCompositeOperation = item.blendMode as GlobalCompositeOperation
  }
  ```
  The `ctx.restore()` at the end of each layer automatically resets the composite operation.
- Apply the same pattern in `drawShapeLayers()`, `drawTextOverlays()`, `drawLottieLayers()`, and `drawSVGObjectLayers()`.

**`src/services/keyframeProperties.ts`**
- Add `{ key: 'blendMode', label: 'Blend Mode', type: 'number', min: 0, max: 15 }` to each object type. Blend mode is not naturally numeric, but we can map each mode to an index for keyframe interpolation (step interpolation, no tweening). Alternatively, skip keyframe-animating blend modes initially and add it later.

**`src/components/layout/RightPanel/` (property panels)**
- Add a "Blend Mode" dropdown to each layer's properties panel. Use a shared `<BlendModeSelector>` component.

### New Code to Create

**`src/types/blendModes.ts`**
```ts
export type BlendMode =
  | 'source-over'  // normal
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'

export const BLEND_MODE_OPTIONS: { value: BlendMode; label: string }[] = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  // ... etc
]
```

**`src/components/ui/BlendModeSelector.tsx`**
- Reusable dropdown component that maps `BlendMode` values to labels.
- Shows a small visual preview swatch for each mode (optional, nice-to-have).

### Data Flow
```
User selects "Multiply" blend mode for a media layer in the properties panel
  -> useMediaStore: canvasItems[i].blendMode = 'multiply'
  -> VideoCanvas (live preview): <div style={{ mixBlendMode: 'multiply' }}> wraps the layer
  -> Export: compositionBuilder serializes blendMode into MediaItemData
  -> canvas2dRenderer.drawMediaLayers():
       ctx.save()
       ctx.globalAlpha = opacity
       ctx.globalCompositeOperation = 'multiply'
       ctx.drawImage(...)
       ctx.restore()  // resets composite to 'source-over'
```

### Architecture Notes

**Canvas2D `globalCompositeOperation` naming:** Canvas uses `'source-over'` for normal, not `'normal'`. The media store currently uses `'normal'` -- we need to map `'normal'` -> `'source-over'` in the renderer, or change the store value. Recommendation: use `'source-over'` everywhere and display "Normal" in the UI label.

**Blend mode ordering matters:** `globalCompositeOperation` affects how the NEXT `drawImage` composites onto the EXISTING canvas content. This means layer draw order (which we already control) determines what blends with what. No special reordering needed.

**Keyframe animation of blend modes:** Blend modes are discrete (not continuous), so keyframe interpolation should use "hold" / step behavior. The simplest approach is to NOT make blend modes keyframe-animatable in v1 and add it later if needed. If we do add it, map each mode to an integer and use `Math.round()` during interpolation to snap to the nearest mode.

**Live preview vs export:** The live preview in `VideoCanvas.tsx` uses CSS `mix-blend-mode` on the React layer divs. The export uses Canvas2D `globalCompositeOperation`. These produce identical results for all standard modes.

**PixiJS GPU renderer:** If the GPU renderer is active during export, it needs to set the equivalent blend mode on each PixiJS Sprite. PixiJS supports all standard blend modes via `sprite.blendMode = PIXI.BLEND_MODES.MULTIPLY`. This should be added to `pixiExportRenderer.ts` as a follow-up.

### Acceptance Criteria
- [ ] Blend mode dropdown appears in properties panel for media, shape, text, SVG, and Lottie layers.
- [ ] Selecting "Multiply" on a media layer over a colored background produces the expected darkened composite in live preview.
- [ ] Exported video (MP4/WebM) renders the blend mode correctly (matches live preview).
- [ ] Changing blend mode is undoable (Zundo).
- [ ] Blend mode is serialized to project data and persists across save/load.
- [ ] Default blend mode is "Normal" (source-over) for all layers.
- [ ] All 16 blend modes are available and functional in both preview and export.

---

## #45 CSS Easing Export

### What
Lets creators copy any keyframe easing curve as a CSS `cubic-bezier()` string or CSS `animation-timing-function` keyword. Useful for developers recreating the same animation feel in web projects. One-click copy-to-clipboard from the keyframe editor.

### Tech Stack
- **Clipboard API** (`navigator.clipboard.writeText()`) -- No dependencies.
- **Existing easing definitions** in `src/engine/easing.ts` already contain the bezier control points for all named presets.

### Existing Code to Modify

**`src/engine/easing.ts`**
- Add a `EASING_CSS_MAP` lookup that maps each easing name to its CSS equivalent:
  ```ts
  export const EASING_CSS_MAP: Record<string, string> = {
    'linear': 'linear',
    'ease-in': 'cubic-bezier(0.42, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.58, 1)',
    'ease-in-out': 'cubic-bezier(0.42, 0, 0.58, 1)',
    'material': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'snappy': 'cubic-bezier(0.55, 0.085, 0, 0.99)',
    // ... all named presets from the Easing object
  }
  ```
- Add a utility function:
  ```ts
  export function easingToCss(type: EasingType, bezierParams?: CubicBezierParams): string
  ```
  For `cubic-bezier` type, return `cubic-bezier(x1, y1, x2, y2)` from the params. For named types, look up in `EASING_CSS_MAP`. For spring/elastic/bounce (which have no CSS equivalent), return the closest cubic-bezier approximation with a comment.

**`src/services/interpolation.ts`**
- Export the `cubicBezier` function parameters so they can be reused, or reference the `CubicBezierParams` type already on keyframes.

**`src/components/timeline/Timeline.tsx` or the keyframe easing editor UI**
- Add a "Copy CSS" button next to the easing selector. When clicked, calls `easingToCss()` and copies result to clipboard. Show a brief "Copied!" toast.

### New Code to Create

None required beyond the additions to `easing.ts`. If we want a standalone utility:

**`src/utils/cssEasingExport.ts`** (optional)
- `easingToCss(type, bezierParams)` function
- `easingToMotionOneString(type)` for compatibility with Motion One / Framer Motion (e.g., `[0.4, 0, 0.2, 1]`)
- `easingToAfterEffectsExpression(type)` for AE (nice-to-have later)

### Data Flow
```
User selects a keyframe in the timeline
  -> Keyframe easing editor opens (shows current easing type)
  -> User clicks "Copy CSS" button
  -> easingToCss(keyframe.easing, keyframe.bezierParams) returns string
  -> navigator.clipboard.writeText(cssString)
  -> Toast notification: "Copied: cubic-bezier(0.4, 0, 0.2, 1)"
```

### Architecture Notes

**Spring/elastic/bounce approximation:** CSS `cubic-bezier` cannot represent spring physics or multi-bounce curves. For these, we should:
1. Output a comment like `/* spring-medium: no exact CSS equivalent */`
2. Followed by the closest cubic-bezier approximation
3. For `bounce-out`, suggest `cubic-bezier(0.34, 1.56, 0.64, 1)` as a rough match

**CSS `steps()` mapping:** The `Easing.steps()` function maps directly to CSS `steps(N, start|end)`. This should be supported.

**Named CSS keywords:** CSS has 5 built-in keywords: `ease`, `ease-in`, `ease-out`, `ease-in-out`, `linear`. Prefer these over the explicit bezier when they match exactly.

**Motion design tool interop:** Consider adding a "Copy for Framer Motion" option that outputs `{ type: "spring", stiffness: 100, damping: 10 }` for spring easings. This is a separate follow-up.

### Acceptance Criteria
- [ ] "Copy CSS" button appears in the keyframe easing editor panel.
- [ ] Clicking it copies valid CSS `cubic-bezier()` or keyword to clipboard.
- [ ] Toast notification confirms the copy with the actual value.
- [ ] All 20+ easing types have CSS output (exact match or closest approximation).
- [ ] Custom `cubic-bezier` keyframes export their exact control points.
- [ ] Spring/elastic easings include a comment noting they are approximations.
- [ ] The copied CSS string works when pasted into a CSS `transition-timing-function` property.

---

## #47 120fps Export

### What
Adds 120fps export capability for creators targeting high-refresh-rate displays (ProMotion iPads, 120Hz monitors) or smooth slow-motion playback. The WebCodecs H.264 encoder already supports up to 120fps natively.

### Tech Stack
- **WebCodecs H.264** -- Supports 120fps with no changes to the encoder configuration.
- **VP8/VP9** -- Also support 120fps.
- No new libraries required.

### Existing Code to Modify

**`src/components/panels/ExportPanel.tsx`**
- Currently there is no FPS selector in the export panel (it uses the project FPS from the timeline store). Add an FPS override dropdown to the export settings:
  ```ts
  const FPS_OPTIONS = [
    { label: 'Project FPS', value: 0 },    // Use project's fps
    { label: '24 fps', value: 24 },
    { label: '30 fps', value: 30 },
    { label: '60 fps', value: 60 },
    { label: '120 fps', value: 120 },
  ]
  ```
- When FPS override is selected, the export call uses the override FPS and recalculates `durationInFrames` proportionally.

**`src/stores/useTimelineStore.ts`**
- The `fps` field already accepts any number. No changes to the store itself.
- The project FPS selector elsewhere in the UI should also offer 120fps as an option if not already present.

**`src/services/videoExport.ts`**
- No functional changes. The `ExportOptions.fps` is already a plain number passed directly to the encoder.
- However, add a bitrate sanity check: at 120fps, the current formula `width * height * fps * quality * 0.15` would produce 72 Mbps at 1080p. Cap the multiplier or the total bitrate to avoid unnecessarily huge files:
  ```ts
  const maxBitrate = 50_000_000 // 50 Mbps cap
  const bitrate = Math.min(
    Math.round(width * height * fps * quality * bitrateMultiplier),
    maxBitrate
  )
  ```

**`src/components/panels/SettingsPanel.tsx`**
- Add 120fps to the project FPS options if not already present.

### New Code to Create

None. This is purely a UI expansion + one bitrate guard.

### Data Flow
```
User selects "120 fps" in Export panel FPS override
  -> exportFps = 120
  -> exportFrameCount = Math.round(totalDurationSec * 120)
  -> exportVideo({ ..., fps: 120, durationInFrames: exportFrameCount })
  -> WebCodecs encoder configured at 120fps
  -> renderFrame() called 4x more per second of content (vs 30fps)
  -> Output: smooth 120fps MP4/WebM
```

### Architecture Notes

**Frame interpolation is NOT needed:** At 120fps, we are rendering 120 discrete frames per second of content. The keyframe interpolation system already works at sub-frame precision (it interpolates between any two keyframe frames), so it naturally produces smooth values at 120fps. No motion blur or frame blending needed.

**Export time is 4x longer:** Going from 30fps to 120fps means 4x more frames to render. A 10-second clip goes from 300 frames to 1200 frames. The progress bar and time estimate handle this automatically.

**File size is ~2-3x larger:** Not 4x because video codecs exploit temporal redundancy more efficiently at higher frame rates. Still, a 10-second 1080p clip at 120fps will be ~30-40 MB vs ~10-15 MB at 30fps. The estimated size display should reflect this.

**H.264 Level considerations:** 120fps at 1080p requires H.264 Level 4.2 or higher. Our current codec string `avc1.640028` is Level 4.0 which technically caps at 60fps at 1080p. We should use `avc1.64002a` (Level 4.2) when fps > 60:
```ts
const codec = useMP4
  ? (fps > 60 ? 'avc1.64002a' : 'avc1.640028')
  : 'vp8'
```

**Backpressure management:** More frames in flight means more memory pressure. The existing backpressure check (wait when `encodeQueueSize > 8`) should work fine, but monitor for OOM at 120fps + 4K.

### Acceptance Criteria
- [ ] FPS override dropdown appears in Export panel with 24/30/60/120 options plus "Project FPS".
- [ ] Exporting at 120fps produces a valid video file that plays at 120fps in VLC.
- [ ] The exported video has noticeably smoother motion than the 30fps version of the same content.
- [ ] Export progress accurately tracks the 4x frame count.
- [ ] Estimated file size reflects the higher frame count.
- [ ] H.264 codec level auto-selects Level 4.2 when fps > 60.
- [ ] Bitrate is capped at 50 Mbps to prevent unreasonable file sizes.

---

## #49 Blur Effect Presets

### What
Adds blur effects to any canvas layer -- Gaussian blur, motion blur (directional), and a tilt-shift preset. Blur values are keyframe-animatable, enabling focus transitions (rack focus), speed-blur entrances, and depth-of-field effects. Integrates into the existing effects system alongside halftone, woodcut, etc.

### Tech Stack
- **Canvas2D `ctx.filter`** -- Native CSS filter support on Canvas2D contexts (Chrome 69+, Firefox 49+, Safari 15.4+). Applies GPU-accelerated `blur()` filter.
- **OffscreenCanvas** for motion blur (multi-pass directional offset draws).
- No external libraries.

### Existing Code to Modify

**`src/services/canvas2dRenderer.ts`**
- In each `draw*Layers()` function, after `ctx.save()` and before `ctx.drawImage()`, apply the blur filter if the layer has a `blur` value > 0:
  ```ts
  if (item.blur && item.blur > 0) {
    ctx.filter = `blur(${item.blur}px)`
  }
  ```
  The `ctx.restore()` at the end resets the filter.
- For motion blur, the approach is different -- see the new module below.

**`src/services/keyframeProperties.ts`**
- Add `{ key: 'blur', label: 'Blur', type: 'number', min: 0, max: 50 }` to every object type that supports it (media, shape, text, video, lottie, character, character3d, riggedCharacter).

**`src/remotion/types.ts`**
- Add `blur?: number` and `blurType?: 'gaussian' | 'motion' | 'radial' | 'tilt-shift'` to the relevant layer data interfaces.
- Add `motionBlurAngle?: number` for directional motion blur.

**`src/stores/useMediaStore.ts`, `useShapeStore.ts`, `useTextOverlayStore.ts`, etc.**
- Add `blur: number` (default 0) and `blurType: BlurType` (default 'gaussian') to each layer item interface.
- Add `motionBlurAngle: number` (default 0) for directional blur.

**`src/components/layout/RightPanel/` (property panels)**
- Add a "Blur" section to each layer's properties panel with: blur amount slider (0-50px), blur type dropdown (Gaussian/Motion/Tilt-Shift), and angle control for motion blur.

### New Code to Create

**`src/services/effects/blurEffect.ts`**
Contains the blur rendering implementations beyond simple Gaussian:

```ts
/** Gaussian blur -- uses native ctx.filter */
export function applyGaussianBlur(ctx: CanvasRenderingContext2D, blurPx: number): void {
  ctx.filter = `blur(${blurPx}px)`
}

/** Motion blur -- renders element multiple times at angular offsets with decreasing opacity */
export function applyMotionBlur(
  sourceCanvas: HTMLCanvasElement,
  targetCtx: CanvasRenderingContext2D,
  blurPx: number,
  angleDeg: number,
  samples: number = 8
): void {
  const radians = (angleDeg * Math.PI) / 180
  const dx = Math.cos(radians) * blurPx
  const dy = Math.sin(radians) * blurPx

  for (let i = 0; i < samples; i++) {
    const t = (i / (samples - 1)) - 0.5 // -0.5 to +0.5
    const alpha = 1 / samples
    targetCtx.globalAlpha = alpha
    targetCtx.drawImage(
      sourceCanvas,
      t * dx, t * dy
    )
  }
  targetCtx.globalAlpha = 1
}

/** Tilt-shift -- sharp center band, blurred top and bottom */
export function applyTiltShift(
  sourceCanvas: HTMLCanvasElement,
  targetCtx: CanvasRenderingContext2D,
  blurPx: number,
  focusY: number,      // 0-1, center of sharp band
  focusBand: number,   // 0-1, height of sharp band
): void {
  // Draw blurred version first (full canvas)
  targetCtx.filter = `blur(${blurPx}px)`
  targetCtx.drawImage(sourceCanvas, 0, 0)
  targetCtx.filter = 'none'

  // Clip and draw sharp center band
  const h = sourceCanvas.height
  const bandTop = h * (focusY - focusBand / 2)
  const bandHeight = h * focusBand

  targetCtx.save()
  targetCtx.beginPath()
  targetCtx.rect(0, bandTop, sourceCanvas.width, bandHeight)
  targetCtx.clip()
  targetCtx.drawImage(sourceCanvas, 0, 0)
  targetCtx.restore()

  // Feather edges with gradient mask (future enhancement)
}

export const BLUR_PRESETS = [
  { label: 'Soft Focus', type: 'gaussian', blur: 3 },
  { label: 'Heavy Blur', type: 'gaussian', blur: 12 },
  { label: 'Speed Blur', type: 'motion', blur: 15, angle: 0 },
  { label: 'Diagonal Motion', type: 'motion', blur: 10, angle: 45 },
  { label: 'Tilt-Shift', type: 'tilt-shift', blur: 8, focusY: 0.5, focusBand: 0.3 },
  { label: 'Top Blur', type: 'tilt-shift', blur: 6, focusY: 0.7, focusBand: 0.4 },
]
```

**`src/types/blurEffect.ts`**
```ts
export type BlurType = 'gaussian' | 'motion' | 'tilt-shift'

export interface BlurConfig {
  type: BlurType
  amount: number        // pixels, 0 = off
  angle?: number        // degrees, for motion blur
  focusY?: number       // 0-1, for tilt-shift
  focusBand?: number    // 0-1, for tilt-shift
}
```

### Data Flow
```
User sets blur=8 on a media layer in properties panel
  -> useMediaStore: canvasItems[i].blur = 8
  -> Live preview (VideoCanvas): CSS filter `blur(8px)` applied to layer div
  -> Export path:
       canvas2dRenderer.drawMediaLayers():
         ctx.save()
         ctx.globalAlpha = opacity
         ctx.filter = 'blur(8px)'     // GPU-accelerated
         ctx.drawImage(img, ...)
         ctx.restore()                // resets filter
  -> Keyframe animation:
       User sets blur=0 at frame 0, blur=15 at frame 30
       -> interpolatePropertyKeyframes() lerps between 0 and 15
       -> At frame 15: blur=7.5px applied via ctx.filter
```

### Architecture Notes

**`ctx.filter` performance:** Native Canvas2D `blur()` filter is GPU-accelerated in Chrome and Safari. At 1080p, Gaussian blur adds ~1-2ms per `drawImage()` call. At 4K, this increases to ~5-10ms. Acceptable for export but may cause frame drops in live preview for large blur values. Consider debouncing live preview blur updates.

**Motion blur requires multi-pass:** Unlike Gaussian, motion blur cannot be done with `ctx.filter`. It requires drawing the same element multiple times at angular offsets with reduced opacity. This is done on an intermediate offscreen canvas, then composited onto the main canvas. This is ~4-8ms per layer at 8 samples.

**Tilt-shift two-pass approach:** Draw the full frame blurred, then overlay the sharp center band with clipping. For feathered edges, a gradient mask would be needed (future enhancement using `createLinearGradient` as a clip mask via `globalCompositeOperation: 'destination-in'`).

**Interaction with blend modes:** Blur is applied BEFORE blending. The render order is: `ctx.filter = blur` -> `ctx.globalCompositeOperation = blendMode` -> `ctx.drawImage()`. This produces correct results because the filter transforms the source pixels, then blending composites them.

**Presets vs custom:** Ship with 6 presets (listed above) for quick application. Allow custom values for advanced users. Presets are just pre-filled values in the UI, not a separate code path.

### Acceptance Criteria
- [ ] Blur amount slider (0-50px) appears in properties panel for media, shape, text, and video layers.
- [ ] Gaussian blur renders correctly in live preview and export.
- [ ] Motion blur with angle control produces directional blur in export.
- [ ] Tilt-shift preset produces sharp center band with blurred top/bottom.
- [ ] Blur values are keyframe-animatable (smooth transition from 0 to 15 over 30 frames).
- [ ] Blur presets dropdown offers 6 quick-apply options.
- [ ] Blur = 0 has zero performance cost (no filter applied).
- [ ] Exported video matches live preview blur appearance.
- [ ] Blur interacts correctly with blend modes (blur applied before blending).

---

## Related

- [[feature-list]] — Features #3 GIF Export, #4 4K Export, #16 Blend Modes, #49 Blur Presets
- [[feature-priorities]] — These are all Tier 1 (score 22+) quick wins, with scoring details
- [[PROGRESS]] — Track completion status
- [[phase-2|Phase 2: Animation Engine]] — Next phase
- [[research]] — Competitive gaps driving these priorities
