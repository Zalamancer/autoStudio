# ProAnimate AI Director — Technical Execution Reference

This document describes how the orchestrator service (`src/services/orchestrator.ts`) converts a `ClipPlan` JSON into store mutations. It serves as the definitive reference for how each plan field maps to execution.

---

## Execution Pipeline

The orchestrator runs these steps in sequence. Each step is tracked via `OrchestratorStep` with status (`pending` → `running` → `done` | `error` | `skipped`).

### Step 1: `setup-canvas`
**Stores:** `useCanvasStore`, `useEditorStore`, `useTimelineStore`

```
canvas.aspectRatio → ASPECT_RATIO_DIMENSIONS → setCanvasDimensions(w, h)
canvas.aspectRatio → setAspectRatio()
canvas.fps → setFps()
canvas.fps * canvas.durationSeconds → setTotalFrames()
```

Dimension mapping:
| Aspect Ratio | Width | Height |
|---|---|---|
| 16:9 | 1920 | 1080 |
| 9:16 | 1080 | 1920 |
| 1:1 | 1080 | 1080 |
| 4:3 | 1440 | 1080 |
| 21:9 | 2560 | 1080 |

### Step 2: `setup-background`
**Stores:** `useAnimationStore`, `useSVGObjectStore`

**If `background.type === "lottie"`:**
- Loads `sampleAnimations` into library if empty
- Fuzzy-matches `lottieQuery` against animation names and tags (background category only)
- Falls back to first background animation if no match
- Calls `addToCanvas(matchedAnimationId)`

**If `background.type === "svg-generate"`:**
- Checks if HTML templates already cover full clip — if so, skips SVG and falls back to lottie
- Calls `generateSVGObjects({ prompt, width, height })` (hits Gemini 2.5 Pro endpoint)
- Creates `SVGObjectComposition` with generated objects, each spanning full timeline
- Falls back to lottie if SVG generation fails

### Step 3: `setup-characters`
**Stores:** `useMultiCharacterStore`, `useSavedCharactersStore`

For each `ClipPlanCharacter`:
1. Match `savedCharacterName` against saved characters (exact match, then fuzzy)
2. Convert percentage position (0-100) → pixel position: `pixelX = (x / 100) * canvasWidth`
3. Call `addDialogueCharacter({ name, savedCharacterId, position, scale, zIndex: 7, ... })`
4. Build `characterIdMap`: planCharacterName → store character ID
5. Match voices: fuzzy-match `voiceName` against ElevenLabs voice catalog, set `voiceId` on character

### Step 4: `generate-voices`
**Services:** `ElevenLabs TTS`

For each `ClipPlanDialogueLine`:
1. Strip `[emotion]` cues to get clean text
2. Look up character's `voiceId` from `characterIdMap` → `voiceIdMap`
3. Call `generateWithAlignment(cleanText, voiceId, voiceSettings)` → audio blob + phoneme alignment
4. Process alignment:
   - `LipSyncProcessor.processAlignment()` → `visemeTimeline: VisemeEvent[]`
   - `CaptionProcessor.extractWords()` → `wordTimeline: WordEvent[]`
   - `buildEmotionTimeline(rawScript, wordTimeline)` → `emotionTimeline: EmotionEvent[]`
5. Create `GeneratedVoice` with all timelines
6. Track cost: `cleanText.length * $0.0003`

### Step 5: `setup-dialogue`
**Store:** `useMultiCharacterStore`

For each dialogue line (with generated voice data):
1. Calculate frame range from audio duration: `endFrame = startFrame + (audioDuration * fps)`
2. Add gap between speakers: `gapFrames = 0.3 * fps` (9 frames at 30fps)
3. Map emotion string → `DialogueEmotion` type
4. Call `addDialogueLine({ characterId, script, generatedVoiceId, startFrame, endFrame, order, visemeTimeline, wordTimeline, emotion })`

### Step 6: `generate-music` (optional)
**Service:** `ElevenLabs Music Generation`

- Analyzes dialogue for mood via `buildMusicPlanFromDialogue()`
- Generates background music matching emotional arc
- Adds as audio track

### Step 7: `setup-text-overlays`
**Store:** `useTextOverlayStore`

For each `ClipPlanTextOverlay`:
1. Map `preset` to default styles (font, size, weight, color, alignment, shadow, background)
2. Convert `startPercent`/`endPercent` → frames: `frame = percent * totalFrames`
3. Validate font family against allowed list (fallback to 'Inter')
4. Call `addTextOverlay({ ...presetDefaults, content, startFrame, endFrame, ...overrides })`

### Step 8: `setup-shapes`
**Store:** `useShapeStore`

For each `ClipPlanShape`:
1. Convert `startPercent`/`endPercent` → frames
2. Call `addShape({ type, position, width, height, fill, opacity, startFrame, endFrame })`

### Step 9: `setup-html-templates`
**Store:** `useHTMLTemplateLayerStore`

For each `ClipPlanHTMLTemplate`:
1. Look up `templateId` in `BUILTIN_TEMPLATES` library
2. If not found, fuzzy-match via `query` against template titles and tags
3. Load template HTML content via `getTemplateContent(id)`
4. Parse config properties via `parseTemplateConfig(html)`
5. Inject message bridge for live updates via `injectMessageBridge(html)`
6. Merge plan `config` overrides with parsed defaults
7. Convert `startPercent`/`endPercent` → frames
8. Call `addTemplate({ htmlContent, name, position, scale, startFrame, endFrame, customConfig, frameSync, templateAspectRatio })`

### Step 10: `generate-svg-objects`
**Store:** `useSVGObjectStore`
**Service:** `svgObjectAnimation.generateSVGObjects()`

For each `ClipPlanSVGObject`:
1. Call AI to generate SVG markup from `prompt` (Gemini 2.5 Pro)
2. Convert percentage keyframes → absolute pixel positions
3. Convert `startPercent`/`endPercent` → frames
4. Add to SVG composition with keyframe animation data

### Step 11: `setup-stock-media`
**Store:** `useMediaStore`
**Service:** `Pixabay API`

For each `ClipPlanStockMedia`:
1. Search Pixabay with `query`, `type`, and `orientation`
2. Download best match (image or video)
3. Compute z-index from `role` (background=1, cutaway=4, overlay=6, accent=7)
4. Compute default scale from `role` (background=1.05, overlay=0.4, accent=0.25)
5. Convert positions, transitions, and time ranges
6. Add as `MediaAsset` to canvas

### Step 12: `setup-captions`
**Store:** `useVoiceStore`

```
captions.style → setCaptionStyle()
captions.position → setCaptionPosition()
captions.fontSize → setCaptionFontSize()
captions.color → setCaptionColor()
```

### Step 13: `finalize-timeline`
**Store:** `useTimelineStore`

- Ensures `totalFrames` is at least as long as the last dialogue line's `endFrame`
- Seeks playhead to frame 0

---

## Store Schemas (What Gets Written)

### useMultiCharacterStore
```typescript
interface DialogueCharacter {
  id: string
  name: string
  savedCharacterId: string | null
  position: { x: number; y: number }     // Absolute pixels (converted from % by orchestrator)
  scale: number                            // Multiplier of 200px base
  rotation: number
  zIndex: number                           // Default: 7
  visible: boolean
  locked: boolean
  voiceId: string | null                   // ElevenLabs voice ID
  color: string                            // Auto-assigned from 8-color palette
  renderMode: 'sprite' | 'rigged'
  partTransforms: Record<'body'|'head'|'viseme'|'hair', CharPartTransform>
  layerOrder: ('body'|'head'|'viseme'|'hair')[]
}

interface DialogueLine {
  id: string
  characterId: string
  script: string                           // Raw text with [emotion] cues
  generatedVoiceId: string | null
  startFrame: number
  endFrame: number
  order: number
  visemeTimeline: VisemeEvent[]            // From ElevenLabs phoneme alignment
  wordTimeline: WordEvent[]                // From character-level timing
  emotion: 'Joy'|'Anger'|'Disgust'|'Fear'|'Sadness'|'Surprise'|'Neutral'|'Auto'
}
```

### useAnimationStore
```typescript
interface ActiveAnimation {
  id: string
  animationId: string                      // References library item
  position: { x: number; y: number }
  scale: number
  opacity: number                          // 0-1
  zIndex: number                           // -1 for bg, 10 for overlay
  loop: boolean
  speed: number
  isPlaying: boolean
  startFrame: number
  endFrame: number
}
```

### useTextOverlayStore
```typescript
interface TextOverlay {
  id: string
  presetType: 'title'|'subtitle'|'lower-third'|'cta'|'quote'|'watermark'
  content: string
  fontFamily: FontFamily                   // 26 options
  fontSize: number
  fontWeight: string
  color: string
  align: 'left'|'center'|'right'
  verticalAlign: 'top'|'middle'|'bottom'
  position: 'top'|'center'|'bottom'|'free'
  shadow: boolean
  background: boolean
  backgroundOpacity: number
  textCase: 'none'|'uppercase'|'lowercase'
  opacity: number
  startFrame: number
  endFrame: number
}
```

### useShapeStore
```typescript
interface CanvasShape {
  id: string
  type: 'rectangle'|'circle'|'triangle'|'star'
  position: { x: number; y: number }
  width: number
  height: number
  rotation: number
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  zIndex: number
  visible: boolean
  startFrame: number
  endFrame: number
  borderRadius: number                     // Rectangle only
  points: number                           // Star only
  innerRadius: number                      // Star only
}
```

### useHTMLTemplateLayerStore
```typescript
interface CanvasHTMLTemplate {
  id: string
  htmlContent: string                      // Full HTML with injected bridge
  name: string
  position: { x: number; y: number }
  scale: number
  opacity: number
  zIndex: number
  rotation: number
  visible: boolean
  width: number
  height: number
  startFrame: number
  endFrame: number
  customConfig: TemplateConfigProperty[]   // Parsed + merged config
  frameSync: boolean                       // Whether template receives frame updates
  templateAspectRatio?: string
}
```

### useSVGObjectStore
```typescript
interface SVGObject {
  id: string
  name: string
  zIndex: number
  visible: boolean
  colors: Record<string, string>           // Named color slots
  defaultColors: Record<string, string>
  svgMarkup: string
  keyframes: SVGObjectKeyframe[]           // Position, scale, opacity, rotation over time
  startFrame: number
  endFrame: number
  opacity: number
}
```

### useMediaStore
```typescript
interface MediaAsset {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnailUrl: string
  position: { x: number; y: number }
  scale: number
  zIndex: number
  visible: boolean
  startFrame: number
  endFrame: number
  enterTransition: string
  exitTransition: string
  transitionDuration: number
}
```

---

## Timing Calculations

### Percent → Frame
```
frame = Math.round(percent * totalFrames)
totalFrames = fps * durationSeconds
```

### Dialogue Line Sequencing
```
line[0].startFrame = 0
line[0].endFrame = audioDuration[0] * fps

line[n].startFrame = line[n-1].endFrame + gapFrames
line[n].endFrame = line[n].startFrame + audioDuration[n] * fps

gapFrames = Math.round(0.3 * fps)    // 0.3s pause between speakers
```

### Character Position (Percent → Pixels)
```
pixelX = Math.round((percentX / 100) * canvasWidth)
pixelY = Math.round((percentY / 100) * canvasHeight)
```

---

## Emotion Resolution

### ClipPlan emotion string → DialogueEmotion
| Plan Emotion | Store Value |
|---|---|
| Joy, happy, excited, amused | "Joy" |
| Anger, angry, stern, furious | "Anger" |
| Disgust, disgusted, revolted | "Disgust" |
| Fear, scared, worried, anxious | "Fear" |
| Sadness, sad, melancholy, grief | "Sadness" |
| Surprise, surprised, shocked | "Surprise" |
| Neutral, calm, serious | "Neutral" |

### Emotion → Mouth Curvature (automatic)
| Emotion | Curvature |
|---|---|
| Joy | upward |
| Anger | neutral |
| Disgust | downward |
| Fear | downward |
| Sadness | downward |
| Surprise | neutral |
| Neutral | neutral |

---

## Cost Tracking

The orchestrator tracks costs via `OrchestrationCost`:

| Source | Metric | Rate |
|---|---|---|
| Gemini (plan generation) | Token count | ~$0.075/1M input, ~$0.30/1M output |
| ElevenLabs (TTS) | Character count | ~$0.30/1K characters |
| Vertex AI (character generation) | Per generation | Variable |

Each step reports `CostEntry { source, label, cost, tokenUsage?, characters? }`.

---

## Validation Checklist

Before executing a ClipPlan:

1. `canvas.aspectRatio` is one of: `16:9`, `9:16`, `1:1`, `4:3`, `21:9`
2. `canvas.fps` is one of: 24, 30, 60
3. `canvas.durationSeconds` > 0
4. Every `dialogue[].characterName` matches a `characters[].name`
5. `characters[].position.x` and `.y` are in range 0-100 (percentages)
6. `characters[].scale` > 0 (typically 0.5-2.0)
7. `dialogue[].emotion` is a valid emotion string
8. `textOverlays[].preset` is one of: title, subtitle, lower-third, cta, quote, watermark
9. All `startPercent`/`endPercent` values are in range 0.0-1.0 and start < end
10. `htmlTemplates[].templateId` references a known template ID
11. `shapes[].type` is one of: rectangle, circle, triangle, star
12. `stockMedia[].role` is one of: background, cutaway, overlay, accent
13. `svgObjects[].keyframes[].time` values are in range 0-1
14. `svgObjects[].keyframes[].x` and `.y` are in range 0-100 (percentages)
15. At least 1 HTML template is included
16. All selected characters (from `OrchestratorSettings.selectedCharacterIds`) appear in the plan

---

## Available Resources (Injected at Runtime)

The orchestrator dynamically injects these into the Gemini prompt:

- **Saved characters**: names from `useSavedCharactersStore`
- **Selected characters**: user-picked characters that MUST appear in the plan
- **ElevenLabs voices**: names from voice catalog
- **Lottie animations**: names, categories, tags from `sampleAnimations`
- **HTML templates**: IDs, titles, tags, categories from `BUILTIN_TEMPLATES` (100+ templates)
- **User-selected items**: specific animations, templates, audio, captions, collages, AI animations that MUST be included
- **OrchestratorSettings**: aspect ratio, duration, FPS overrides; feature flags (generateSVGAnimations, generateSVGAssets, useStockMedia, generateMusic, useGoogleSearch)
- **Learning context**: recommendations from performance analytics system (recommended aspect ratio, duration, caption style, insights)

---

## Related

- [[orchestrator-creative]] — Creative prompt that generates the ClipPlan JSON this document executes
- [[feature-list]] — Feature #74 AI Orchestrator (Director)
- [[phase-5]] — Virality scoring and B-Roll extend the orchestrator pipeline
- [[phase-8]] — Content input pipelines feed into the orchestrator
- [[phase-9]] — Developer API wraps the orchestrator for automation
- [[tabs]] — Orchestrator writes to stores behind these tabs
