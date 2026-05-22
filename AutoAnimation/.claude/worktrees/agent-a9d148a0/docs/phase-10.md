# Phase 10: Future Horizons

**Features:** #11 Lottie JSON Export, #13 Shape Morphing, #19 AI Eye Contact Correction, #21 Real-Time Collaboration, #25 Figma Plugin, #31 Webcam Puppeteering/Mocap, #32 Motion Transfer, #34 Live Avatar Streaming, #37 AI Person Clone, #39 Sketch-to-Animation, #40 Interactive Runtime Export, #43 Infinite Canvas, #44 Pen Tool, #46 Offline Support, #51 Screenshot-to-Video, #54 Portfolio Platform, #57 Data-Driven Animation, #58 SCORM Export, #59 Whiteboard Mode, #60 8K Export
**Timeline:** 6+ months. Research and prototype phase.
**Theme:** These are transformative features that could each become their own product. Research deeply but build selectively based on user demand.

---

## #11 Lottie JSON Export

### What
Export ProAnimate compositions as Lottie JSON files that can be played natively on web pages, mobile apps, and design tools via lottie-web/lottie-ios/lottie-android. This turns ProAnimate into a Lottie authoring tool.

### Key Technical Challenge
Mapping ProAnimate's multi-layer composition model (characters, text overlays, shapes, SVG objects, media, keyframe tracks) into Lottie's After Effects-derived JSON schema. Lottie supports shapes, text, images, and precomps, but has no concept of lip sync, HTML templates, or 3D characters. The exporter must decide what can be faithfully represented and what must be rasterized.

### Recommended Approach
Build a `LottieExporter` service that walks the `VideoCompositionProps` tree and converts each layer type to Lottie equivalents. Shapes map directly to Lottie shape layers. Text overlays map to Lottie text layers. SVG objects map to shape groups. Media layers become image assets. Keyframe tracks map to Lottie property animations (transform, opacity). For unsupported layers (HTML templates, 3D characters), pre-render to image sequences and embed as Lottie image assets. Use the `lottie-web` schema reference and the Bodymovin JSON spec.

### Existing Code Leverage
- `src/remotion/types.ts` -- `VideoCompositionProps` is the complete data model to export from
- `src/services/interpolation.ts` -- Easing functions map to Lottie's bezier easing curves
- `src/types/keyframes.ts` -- `PropertyKeyframe` with easing types maps to Lottie keyframe format
- `src/stores/useShapeStore.ts` -- Shape data maps directly to Lottie shape layers

### Build vs Buy vs Partner
**Build.** No existing library converts our composition format to Lottie. The Bodymovin plugin (After Effects to Lottie) is the closest reference but works in the opposite direction. We need a custom exporter.

### Estimated Effort
3-4 weeks for core shape/text/SVG/keyframe export. +2 weeks for image pre-rendering of unsupported layers.

---

## #13 Shape Morphing

### What
Animate between two different shapes by interpolating their paths, enabling smooth transitions like a circle morphing into a star or text transforming into a logo outline.

### Key Technical Challenge
Path interpolation requires both shapes to have the same number of control points. When shapes differ (circle = 4 bezier curves, star = 10 points), the algorithm must subdivide or resample the simpler path to match. Flubber and other libraries handle this but can produce unnatural intermediate shapes.

### Recommended Approach
Use `flubber` (https://github.com/veltman/flubber) for SVG path interpolation. It handles point count mismatch by subdividing paths. Integrate into the keyframe system: add a `morphTarget` property to shapes that references another shape ID. During interpolation, use flubber to compute the intermediate SVG path string at each frame. Render via the existing `ShapeLayer.tsx` but switch to SVG path rendering instead of basic Canvas2D shapes.

### Existing Code Leverage
- `src/stores/useShapeStore.ts` -- Shape definitions, extend with SVG path data
- `src/services/interpolation.ts` -- Keyframe interpolation framework
- `src/components/canvas/ShapeLayer.tsx` -- Shape rendering, switch to SVG path drawing
- `src/components/canvas/SVGObjectLayer.tsx` -- Already renders SVG markup

### Build vs Buy vs Partner
**Buy (library) + Build (integration).** Flubber handles the hard math. We build the keyframe integration and UI.

### Estimated Effort
2-3 weeks.

---

## #19 AI Eye Contact Correction

### What
Automatically adjust character eye direction in generated sprites so characters appear to look at the camera or at each other, improving perceived engagement in talking-head videos.

### Key Technical Challenge
Modifying eye direction in 2D sprites without distorting the art style. This is essentially image inpainting: detect eye regions, generate new eye pixels with altered gaze direction, blend seamlessly. The character sprite system uses pre-rendered images, not vector eyes.

### Recommended Approach
Use a two-stage approach: (1) eye region detection via Gemini vision (send the character sprite, ask for eye bounding boxes), then (2) inpaint the eye region with adjusted gaze using Vertex AI image editing or SDXL inpainting. For the 24 emotion head variants, batch-process all heads to maintain consistency. Alternatively, for the rigged character system, add an `eyeTarget` bone that points toward a 2D position, and let the FK system rotate eye sprites.

### Existing Code Leverage
- `src/stores/useCharacterConfigStore.ts` -- Sprite management for eye parts
- `src/components/canvas/CharacterComposite.tsx` -- 4-layer renderer, eye is a separate layer
- `server/routes/autoRig.ts` -- Already uses Vertex AI vision for joint detection
- `src/services/lipSync.ts` -- Existing per-frame animation system (visemes) could be extended for gaze

### Build vs Buy vs Partner
**Build with AI APIs.** No off-the-shelf solution works for our sprite-based character system. Use Vertex AI vision for detection and generation.

### Estimated Effort
3-4 weeks. High risk of quality issues with inpainting -- may need multiple iterations.

---

## #21 Real-Time Collaboration

### What
Multiple users editing the same ProAnimate project simultaneously, Google Docs-style, with live cursors, conflict resolution, and presence indicators.

### Key Technical Challenge
Conflict resolution across 86+ Zustand stores. When two users modify the same text overlay simultaneously, their changes must merge without data loss. Traditional last-write-wins is unacceptable. CRDTs (Conflict-free Replicated Data Types) or OT (Operational Transform) are needed for each store's data model.

### Recommended Approach
Use Yjs (CRDT library) with y-websocket for real-time sync. Create a `YjsProvider` that mirrors each Zustand store into a Yjs shared document. Use `Y.Map` for object stores (characters, text overlays), `Y.Array` for ordered collections (timeline tracks, layers), and `Y.Text` for script text. The Yjs document syncs via WebSocket to a y-websocket server (or Supabase Realtime). Each user's local Zustand store subscribes to Yjs changes. Presence (cursors, selections) uses Yjs awareness protocol.

### Existing Code Leverage
- All 86+ Zustand stores -- each needs a Yjs binding layer
- `src/stores/useProjectStore.ts` -- Project loading/saving, becomes the sync entry point
- `src/services/supabase.ts` -- Supabase Realtime could replace y-websocket
- `src/components/canvas/SelectionTransformBox.tsx` -- Needs multi-user cursor rendering

### Build vs Buy vs Partner
**Build with Yjs.** Yjs is the library, but the integration across 86+ stores is substantial custom work. Consider Liveblocks as a managed alternative (higher cost, less control).

### Estimated Effort
8-12 weeks. This is the largest feature in Phase 10. Consider phasing: (1) read-only spectator mode (2 weeks), (2) shared editing of text/settings (4 weeks), (3) full collaborative editing (4+ weeks).

---

## #25 Figma Plugin

### What
A Figma plugin that exports Figma frames as ProAnimate characters, backgrounds, or SVG objects, and imports ProAnimate animations back into Figma for preview.

### Key Technical Challenge
Figma's plugin API provides read access to node trees and vector data, but exporting to our specific character format (4-layer sprites with viseme slots) requires guided user interaction. The plugin must map Figma layers to ProAnimate character parts (body, head, hair, mouth) and export each as a separate PNG.

### Recommended Approach
Build a Figma plugin using the Figma Plugin API (TypeScript). The plugin UI is a React iframe inside Figma. Export flow: user selects a character frame, the plugin identifies layers by naming convention (e.g., layers named "body", "head", "hair", "mouth-rest", "mouth-ai"), exports each as a PNG via `node.exportAsync()`, bundles into a ZIP or directly uploads to ProAnimate via the API (#41). Import flow: ProAnimate exports an animation as a GIF or Lottie, the plugin imports it as a Figma frame sequence.

### Existing Code Leverage
- `src/types/character.ts` -- Character sprite data format (target export format)
- `src/stores/useSavedCharactersStore.ts` -- Character saving API
- Public REST API (#41) -- Upload endpoint for character sprites

### Build vs Buy vs Partner
**Build.** No existing Figma-to-animation-studio plugin. The Figma Plugin API is well-documented.

### Estimated Effort
3-4 weeks for export. +2 weeks for import/preview.

---

## #31 Webcam Puppeteering / Motion Capture

### What
Drive character animations in real-time using the user's webcam. Facial expressions control character emotions and lip sync, head movement controls character head position, and hand gestures trigger predefined animations.

### Key Technical Challenge
Real-time face tracking at 30fps in the browser with low latency. MediaPipe Face Mesh provides 468 facial landmarks but extracting meaningful animation parameters (mouth openness, eyebrow raise, head rotation) from raw landmarks requires calibration and smoothing. The mapping from face mesh to our 24-viseme and 24-emotion system must feel responsive, not laggy.

### Recommended Approach
Use MediaPipe Face Mesh (runs in-browser via WebAssembly/WebGL, no server needed). Extract: (1) mouth openness and shape for viseme selection, (2) eyebrow position for emotion intensity, (3) head rotation (yaw/pitch/roll) for character head transforms. Map facial parameters to the existing character system: mouth shape to nearest viseme from the 8 options, eyebrow + mouth corners to nearest emotion from the 6x4 grid. For 3D characters, drive blendshapes or bone rotations directly. Smooth all values with an exponential moving average (alpha=0.3) to prevent jitter.

### Existing Code Leverage
- `src/components/canvas/CharacterComposite.tsx` -- Character renderer, accepts viseme and emotion inputs
- `src/services/lipSync.ts` -- Viseme selection logic, reusable for mapping webcam mouth shapes
- `src/stores/useCharacterConfigStore.ts` -- Character state, drive viseme/emotion from webcam data
- `src/stores/use3DRigStore.ts` -- 3D bone poses, drive from head tracking data

### Build vs Buy vs Partner
**Build with MediaPipe.** MediaPipe is free and runs client-side. The animation mapping is custom.

### Estimated Effort
4-5 weeks. Week 1: MediaPipe integration and landmark extraction. Week 2-3: Viseme and emotion mapping with smoothing. Week 4: Head tracking and 3D character support. Week 5: Recording and playback.

---

## #32 Motion Transfer

### What
Transfer motion from a reference video onto a ProAnimate character. Upload a video of someone dancing, and the character replicates the movement.

### Key Technical Challenge
Pose estimation from video (extracting skeleton keyframes from arbitrary human movement video) and retargeting those poses to characters with different proportions. This requires a pose estimation model (heavy compute) and a robust retargeting pipeline.

### Recommended Approach
Use MediaPipe Pose (33 body landmarks) or MoveNet for client-side pose extraction from uploaded video. Extract per-frame skeleton poses, then use the existing `skeletonRetarget.ts` to map the human skeleton to the character's bone structure. For 2D characters, project 3D pose landmarks to 2D and drive the rig. For 3D characters, drive bones directly. The pipeline: (1) extract poses from video at source fps, (2) smooth and filter noise, (3) retarget to character skeleton, (4) write as keyframes to the rig store.

### Existing Code Leverage
- `src/services/skeletonRetarget.ts` -- Cross-skeleton animation retargeting (already built for 3D)
- `src/stores/use3DRigStore.ts` -- 3D bone pose keyframes
- `src/stores/useRigStore.ts` -- 2D rig pose keyframes
- `src/services/poseInterpolation.ts` / `poseInterpolation3d.ts` -- Pose smoothing

### Build vs Buy vs Partner
**Build with MediaPipe.** Pose extraction is free via MediaPipe. The retargeting pipeline already exists. Main work is the video processing pipeline and UI.

### Estimated Effort
4-5 weeks.

---

## #34 Live Avatar Streaming

### What
Stream an animated character in real-time to video conferencing tools (Zoom, Meet, Teams) or live streaming platforms (Twitch, OBS), driven by webcam puppeteering (#31).

### Key Technical Challenge
Capturing the ProAnimate canvas as a real-time video stream and exposing it as a virtual camera device. The browser cannot directly create virtual camera devices -- this requires a native companion app or browser extension that bridges canvas output to a virtual camera driver.

### Recommended Approach
Two-tier approach: (1) **Browser-only**: Use `canvas.captureStream()` to get a `MediaStream`, then present it via WebRTC to OBS (using OBS Browser Source) or via Screen Share in video calls. (2) **Native companion**: Build a lightweight Electron app that captures the canvas stream and routes it through a virtual camera driver (OBS Virtual Camera on Windows, CamTwist/OBS on macOS). The Electron app embeds the ProAnimate renderer and outputs via `NDI` or virtual camera APIs.

### Existing Code Leverage
- Webcam puppeteering (#31) -- Provides the real-time input
- `src/components/canvas/VideoCanvas.tsx` -- Main canvas to capture
- `src/services/canvas2dRenderer.ts` -- Frame rendering pipeline
- `src/services/videoExport.ts` -- `canvas.captureStream()` already used for MediaRecorder

### Build vs Buy vs Partner
**Build (browser) + Partner (OBS).** Browser capture is straightforward. Virtual camera integration depends on OBS ecosystem.

### Estimated Effort
3-4 weeks for browser-based streaming. +4 weeks for native companion app.

---

## #37 AI Person Clone

### What
Generate a ProAnimate character that visually resembles a specific person from a photo, creating a cartoon/stylized avatar clone that maintains recognizable features (face shape, hair, skin tone, distinctive features).

### Key Technical Challenge
Preserving person-likeness while transforming to an animated character style. Too realistic feels uncanny, too stylized loses recognizability. The pipeline must extract key facial features (face shape, eye spacing, nose shape, hair style/color, skin tone) and inject them into character generation prompts.

### Recommended Approach
Two-stage pipeline: (1) **Feature extraction** via Gemini vision -- analyze the photo and generate a structured description of facial features, coloring, hair, and distinctive features. (2) **Character generation** via the existing NB2 pipeline (`src/services/nanoBanana2.ts`) with the extracted description as a style constraint. The photo is provided as a reference image to Vertex AI image generation. Add a "likeness strength" slider (0-100) that controls how much the generated character resembles the photo vs. a generic stylized character.

### Existing Code Leverage
- `src/services/nanoBanana2.ts` -- Full character generation pipeline (body, head, visemes, hair)
- `server/routes/nanoBanana2.ts` -- Server endpoint for character generation
- `src/services/photoToAvatar.ts` -- Already exists (30 credits in CREDIT_COSTS). Likely a starting point or partially implemented.
- `server/routes/autoRig.ts` -- Vertex AI vision for analyzing images

### Build vs Buy vs Partner
**Build on existing pipeline.** The NB2 character generator already handles style-aware generation. The gap is feature extraction from photos and likeness preservation.

### Estimated Effort
3-4 weeks.

---

## #39 Sketch-to-Animation

### What
Upload a rough hand-drawn sketch or whiteboard photo and have AI convert it into a clean, animated ProAnimate scene with characters, backgrounds, and motion.

### Key Technical Challenge
Interpreting ambiguous hand-drawn content (wobbly lines, inconsistent proportions, annotations) and mapping it to structured animation elements. A single sketch could represent a character, a storyboard panel, a UI mockup, or a diagram -- the AI must understand intent.

### Recommended Approach
Use Gemini vision to analyze the sketch and generate a structured scene description: identify characters (generate via NB2), backgrounds (generate SVG scene), text labels (create text overlays), arrows/lines (create motion paths), and annotations (create dialogue). Feed the structured output into the orchestrator as a `ClipPlan`. The pipeline: (1) capture/upload sketch image, (2) Gemini vision analysis with structured JSON output, (3) map analysis to ClipPlan fields, (4) execute via orchestrator. For iterative refinement, let users circle areas and add text annotations on the sketch to guide the AI.

### Existing Code Leverage
- `src/services/orchestrator.ts` -- ClipPlan execution pipeline
- `server/routes/autoRig.ts` -- Vertex AI vision integration pattern
- `src/services/nanoBanana2.ts` -- Character generation from descriptions
- `src/services/svgObjectAnimation.ts` -- SVG scene/object generation

### Build vs Buy vs Partner
**Build with Gemini vision.** The sketch interpretation is novel. Leverage existing generation pipelines for output.

### Estimated Effort
4-5 weeks.

---

## #40 Interactive Runtime Export

### What
Export ProAnimate compositions as interactive web experiences (HTML/JS bundles) that respond to user input -- clicks trigger animations, hover reveals content, scroll drives progress.

### Key Technical Challenge
Converting a timeline-based linear animation into an event-driven interactive experience. The current rendering model assumes a monotonically advancing frame counter. Interactive mode needs: event handlers, state machines, conditional logic, and a lightweight runtime player.

### Recommended Approach
Build a custom `proanimate-player.js` runtime (< 50KB) that loads an exported JSON manifest and renders via Canvas2D or SVG. The manifest describes: scenes (animation segments), triggers (click regions, scroll thresholds, timers), transitions between scenes, and data bindings. Export pipeline: (1) convert composition to scene graph, (2) export all assets (images, audio) as separate files, (3) generate a manifest JSON, (4) bundle with the runtime player. Interactive elements are defined in a new "Interactions" panel in the editor.

### Existing Code Leverage
- `src/services/canvas2dRenderer.ts` -- Core rendering logic, extract into a standalone player
- `src/services/interpolation.ts` -- Keyframe interpolation, include in runtime
- `src/remotion/types.ts` -- Composition data model for the export manifest
- `src/motionGraphics/` -- Motion graphic templates could render in the player

### Build vs Buy vs Partner
**Build.** Unique product differentiator. No existing tool exports animation-studio compositions as interactive web bundles.

### Estimated Effort
6-8 weeks. High complexity. Consider a phased approach: (1) linear playback player (3 weeks), (2) click/hover triggers (2 weeks), (3) scroll-driven animation (2 weeks).

---

## #43 Infinite Canvas

### What
Remove canvas boundaries and allow users to pan/zoom freely across an unbounded workspace, placing animation elements anywhere. Think Figma or Miro but for animation.

### Key Technical Challenge
The current rendering pipeline assumes fixed canvas dimensions (`width x height` from `useCanvasStore`). Every layer, every renderer, and the export pipeline uses these dimensions for positioning and clipping. An infinite canvas means positions are in world-space, and the viewport is a window into that space. This requires refactoring the coordinate system across the entire application.

### Recommended Approach
Introduce a world-space coordinate system separate from the export viewport. The viewport (what gets exported) is a defined rectangle in world-space. The editor canvas uses pan/zoom transforms to show the world. All element positions are stored in world-space. The renderer clips to the viewport for export. Implementation: (1) add `worldTransform: { panX, panY, zoom }` to `useCanvasStore`, (2) wrap `VideoCanvas.tsx` content in a CSS `transform` for pan/zoom, (3) keep export dimensions fixed but render only elements within the viewport bounds. This preserves backward compatibility since the viewport rectangle acts exactly like the current fixed canvas.

### Existing Code Leverage
- `src/stores/useCanvasStore.ts` -- Already has `zoom` and pan state
- `src/components/canvas/VideoCanvas.tsx` -- Main canvas, needs world-space transform wrapper
- `src/components/canvas/SelectionTransformBox.tsx` -- Needs coordinate space conversion
- `src/services/canvas2dRenderer.ts` -- Rendering needs viewport clipping

### Build vs Buy vs Partner
**Build.** Fundamental architectural change. No library can do this for us.

### Estimated Effort
4-6 weeks. High risk of regressions across all canvas-dependent features.

---

## #44 Pen Tool

### What
A vector drawing tool for creating custom shapes and paths directly on the ProAnimate canvas, similar to Figma's pen tool.

### Key Technical Challenge
Implementing bezier curve editing with anchor points, handles, and smooth/corner node toggles in a Canvas2D or SVG rendering context. The pen tool must feel responsive and professional, with snapping, alignment guides, and undo support.

### Recommended Approach
Use SVG path data (`d` attribute) as the internal representation. Build a `PenTool` component that: (1) creates anchor points on click, (2) creates bezier handles on drag, (3) closes paths on clicking the first point, (4) supports adding/removing points and converting smooth to corner. Store paths in a new `usePathStore`. Render paths as SVG in the canvas compositor. Export paths as shape layers in Remotion. For pen pressure support (tablet users), use the Pointer Events API's `pressure` property to vary stroke width.

### Existing Code Leverage
- `src/stores/useShapeStore.ts` -- Shape data model, extend with path type
- `src/components/canvas/ShapeLayer.tsx` -- Shape rendering, add SVG path rendering
- `src/hooks/useKeyboardShortcuts.ts` -- Keyboard shortcuts for tool switching
- `src/components/canvas/SelectionTransformBox.tsx` -- Node selection/manipulation pattern

### Build vs Buy vs Partner
**Build.** Core editor feature. Consider referencing Paper.js or Fabric.js for path editing primitives.

### Estimated Effort
4-5 weeks for full pen tool with bezier editing. A basic polyline tool can be done in 1-2 weeks.

---

## #46 Offline Support

### What
Enable ProAnimate to work without an internet connection, caching all necessary assets and syncing changes when connectivity resumes.

### Key Technical Challenge
The application depends on multiple online services: Supabase (auth + database + storage), ElevenLabs (TTS), Gemini (AI generation), Pixabay (stock media). Offline mode must gracefully degrade each dependency while preserving the core editing experience. Sync conflict resolution when reconnecting is complex.

### Recommended Approach
Use a Service Worker (via Workbox) for asset caching and offline shell. Store project data in IndexedDB (already partially done for characters and media). Queue API calls in an offline queue (using `workbox-background-sync`) that replays when online. Degrade AI features gracefully: show "offline" badges, disable generation buttons, allow editing with cached assets. For auth, cache the JWT token and validate expiry locally.

### Existing Code Leverage
- `src/services/characterDB.ts`, `mediaDB.ts`, `recordingsDB.ts` -- IndexedDB storage already in use
- `src/services/projectService.ts` -- Project persistence, add offline queue
- `src/services/supabase.ts` -- Network calls to intercept
- `vite.config.ts` -- Add Workbox plugin for Service Worker generation

### Build vs Buy vs Partner
**Build with Workbox.** Service Worker infrastructure is well-supported. The sync logic is custom.

### Estimated Effort
4-6 weeks. Week 1-2: Service Worker + asset caching. Week 3-4: IndexedDB project storage + offline queue. Week 5-6: Sync and conflict resolution.

---

## #51 Screenshot-to-Video

### What
Upload a screenshot of a website, app, or interface, and have AI automatically generate an animated walkthrough video explaining the content with character narration.

### Key Technical Challenge
Understanding the semantic structure of arbitrary screenshots (identifying UI elements, text content, visual hierarchy) and generating a meaningful narrative script that walks through the content in a logical order.

### Recommended Approach
Use Gemini vision to analyze the screenshot: (1) identify text content, UI elements, and visual hierarchy, (2) generate a walkthrough script with pointer annotations (e.g., "First, notice the header..."), (3) create a ClipPlan with the screenshot as a background image, character narration, and animated highlight boxes/arrows pointing to relevant areas. The existing orchestrator handles the rest. For multi-screen flows, accept multiple screenshots that are sequenced automatically.

### Existing Code Leverage
- `src/services/orchestrator.ts` -- ClipPlan generation and execution
- `src/services/gemini.ts` -- Gemini API integration
- `src/stores/useMediaStore.ts` -- Screenshot as media asset
- `src/stores/useShapeStore.ts` -- Highlight boxes/arrows as animated shapes

### Build vs Buy vs Partner
**Build with Gemini vision.** The screenshot analysis and script generation are novel.

### Estimated Effort
3-4 weeks.

---

## #54 Portfolio Platform

### What
A public-facing platform where ProAnimate users can showcase their best animations, build a creator profile, and get discovered by potential clients or collaborators.

### Key Technical Challenge
Building a public website with user-generated content that is separate from the editor app. Requires: public URLs for portfolios, video embedding, search/discovery, and moderation. This is fundamentally a different product (a content platform) layered on top of the animation tool.

### Recommended Approach
Build as a separate Next.js app (SSR for SEO) that reads from the same Supabase database. Public portfolio pages at `proanimate.com/@username`. Each portfolio shows published recordings with embedded video players, project stats, and creator bio. Discovery via search, categories, and trending. Start minimal: profile page + published works grid. Add social features (follow, like, comment) later. Use `creatorProfileService.ts` and `creatorProfiles` routes as the data layer.

### Existing Code Leverage
- `src/services/creatorProfileService.ts` -- Creator profile data
- `server/routes/creatorProfiles.ts` -- Profile API endpoints
- `src/stores/useRecordingsStore.ts` -- Published recordings data
- Supabase Storage -- Video files for embedding

### Build vs Buy vs Partner
**Build.** Core business feature for community and retention.

### Estimated Effort
4-6 weeks for MVP (profile pages + discovery). Social features add 3-4 more weeks.

---

## #57 Data-Driven Animation

### What
Connect animations to live data sources (Google Sheets, REST APIs, CSV files, databases) so charts, counters, and text automatically update when the underlying data changes.

### Key Technical Challenge
Binding animation properties to external data sources with real-time updates during editing and deterministic snapshots for export. The data might change between editing and export, requiring a "freeze data" mechanism.

### Recommended Approach
Build a `DataSourceManager` service that connects to external data via fetch (REST APIs), CSV parsing, or Google Sheets API. Data binds to template CONFIG fields (HTML templates already support dynamic config via `templateBridge.ts`). Add a `dataSources` section to the ClipPlan that maps data source URLs/refs to template config keys. During editing, poll data at configurable intervals. During export, snapshot data once at the start. Use the formula system (#50) for simple computed values and data sources for external data.

### Existing Code Leverage
- `src/services/templateBridge.ts` -- Live config updates to HTML templates via postMessage
- `src/services/templateConfigParser.ts` -- Config field definitions
- `src/data/builtinTemplates.ts` -- 100+ templates with configurable data fields (charts, counters)
- Formula system (#50) -- For computed bindings

### Build vs Buy vs Partner
**Build.** Unique differentiator for business/enterprise use cases.

### Estimated Effort
3-4 weeks for REST/CSV/Google Sheets connectors + template binding. +2 weeks for polling and snapshot logic.

---

## #58 SCORM Export

### What
Export ProAnimate animations as SCORM-compliant learning modules that can be uploaded to LMS platforms (Moodle, Blackboard, Canvas, Cornerstone).

### Key Technical Challenge
SCORM (Sharable Content Object Reference Model) wrapping requires: a manifest file (`imsmanifest.xml`), JavaScript API integration for tracking (completion status, time spent, quiz scores), and packaging as a ZIP. The animation itself runs in an iframe, but must communicate with the LMS via the SCORM API.

### Recommended Approach
Build a SCORM packager that wraps the interactive runtime export (#40) in a SCORM 1.2 or SCORM 2004 shell. The shell provides: `imsmanifest.xml` (course structure), `scormAPI.js` (adapter that talks to the LMS), and a launcher HTML page. The animation player calls `scormAPI.LMSSetValue("cmi.core.lesson_status", "completed")` when the video finishes. For quizzes, add an "Assessment" layer type in the editor that presents multiple-choice questions at specified timestamps.

### Existing Code Leverage
- Interactive runtime export (#40) -- The animation player bundle
- `src/data/builtinTemplates.ts` -- Quiz/assessment templates could be repurposed
- `src/services/videoExport.ts` -- Export pipeline pattern

### Build vs Buy vs Partner
**Build.** SCORM packaging is straightforward (XML manifest + ZIP). The interactive player (#40) is the prerequisite.

### Estimated Effort
2-3 weeks (assuming #40 Interactive Runtime is built). Without #40, add 6 weeks.

---

## #59 Whiteboard Mode

### What
A freeform whiteboard canvas where users can sketch, diagram, and annotate alongside animation elements, combining the flexibility of tools like Excalidraw with ProAnimate's animation capabilities.

### Key Technical Challenge
Integrating a freeform drawing system (strokes, shapes, handwriting) with the structured animation timeline. Whiteboard strokes must be animatable (draw-on effect, erase, highlight) and exportable in the video.

### Recommended Approach
Embed Excalidraw as a React component (`@excalidraw/excalidraw`) for the drawing interface. Excalidraw elements export as SVG, which can be captured frame-by-frame for the animation timeline. Add a "Whiteboard" layer type in the canvas that renders Excalidraw content. For animated drawing effects, record the stroke order and timing, then replay during video export (progressive SVG path reveal). The pen tool (#44) handles vector paths, while whiteboard mode handles freeform sketching.

### Existing Code Leverage
- `src/components/canvas/VideoCanvas.tsx` -- Layer compositor, add whiteboard layer
- `src/components/canvas/SVGObjectLayer.tsx` -- SVG rendering
- Infinite canvas (#43) -- Natural fit for whiteboard mode
- Pen tool (#44) -- Related but distinct (pen = vector precision, whiteboard = freeform sketching)

### Build vs Buy vs Partner
**Buy (Excalidraw) + Build (animation integration).** Excalidraw is open source and embeddable.

### Estimated Effort
3-4 weeks for basic whiteboard integration. +2 weeks for animated draw-on effects.

---

## #60 8K Export

### What
Export animations at 8K resolution (7680x4320) for large displays, digital signage, and future-proof archival quality.

### Key Technical Challenge
Memory and GPU limits. An 8K frame is 33 million pixels (~132MB uncompressed RGBA). Canvas2D rendering at 8K may exceed browser memory limits. WebCodecs VideoEncoder hardware acceleration may not support 8K on all hardware. The existing renderer must tile or chunk the output.

### Recommended Approach
Use a tiled rendering approach: divide the 8K canvas into 4 tiles (each 3840x2160 = 4K), render each tile separately, then stitch in a compositing pass. For WebCodecs, check hardware support at runtime (`VideoEncoder.isConfigSupported`) and fall back to software encoding (slower but works). For Remotion CLI rendering (server-side), 8K is feasible with sufficient RAM (16GB+). Add `8K (7680x4320)` to the aspect ratio / resolution options in `useCanvasStore.ts`. SVG and vector elements scale perfectly; raster images need 8K source assets.

### Existing Code Leverage
- `src/services/videoExport.ts` -- WebCodecs + MediaRecorder export pipeline
- `src/services/canvas2dRenderer.ts` -- Frame rendering, needs tiled mode
- `src/services/pixiExportRenderer.ts` -- PixiJS GPU renderer, may handle 8K natively
- `src/stores/useCanvasStore.ts` -- Canvas dimensions configuration

### Build vs Buy vs Partner
**Build.** Extension of existing export pipeline. The tiling logic is the novel part.

### Estimated Effort
2-3 weeks.

---

## Prioritization Matrix

| Feature | User Demand | Technical Risk | Revenue Impact | Dependencies | Priority |
|---------|-------------|---------------|----------------|--------------|----------|
| #31 Webcam Puppeteering | High | Medium | Medium | None | A |
| #21 Real-Time Collaboration | High | Very High | High | Architectural refactor | A (long-term) |
| #11 Lottie Export | High | Medium | Medium | None | A |
| #39 Sketch-to-Animation | High | Medium | High | Orchestrator stable | A |
| #51 Screenshot-to-Video | High | Low | High | Orchestrator stable | A |
| #37 AI Person Clone | High | Medium | High | NB2 pipeline | A |
| #57 Data-Driven Animation | Medium | Medium | High (enterprise) | Template system | B |
| #13 Shape Morphing | Medium | Low | Low | None | B |
| #32 Motion Transfer | Medium | Medium | Medium | #31 Webcam | B |
| #54 Portfolio Platform | Medium | Medium | High (retention) | Creator profiles | B |
| #43 Infinite Canvas | Medium | High | Medium | Canvas refactor | B |
| #44 Pen Tool | Medium | Medium | Low | None | B |
| #40 Interactive Export | Medium | High | High (niche) | New runtime | B |
| #46 Offline Support | Low | High | Medium | Service Worker | C |
| #25 Figma Plugin | Low | Medium | Medium | Public API (#41) | C |
| #34 Live Streaming | Low | High | Medium | #31 Webcam | C |
| #58 SCORM Export | Low | Low | Medium (niche) | #40 Interactive | C |
| #59 Whiteboard Mode | Low | Medium | Low | #43 Infinite Canvas | C |
| #60 8K Export | Low | Medium | Low | None | C |
| #19 Eye Contact | Low | High | Low | Vertex AI | C |

**Recommendation:** Start with A-tier features based on user request volume. #31 (Webcam Puppeteering) and #11 (Lottie Export) have no dependencies and provide immediate value. #51 (Screenshot-to-Video) and #39 (Sketch-to-Animation) leverage the existing orchestrator. #21 (Collaboration) should be a dedicated initiative with its own team due to scope.

---

## Related

- [[feature-list]] — All 20 features in this phase from the complete 167-feature list
- [[feature-priorities]] — All phase 10 features are Tier 4 (score < 14), long-term/opportunistic
- [[PROGRESS]] — Track completion status
- [[phase-9|Phase 9: Developer Platform]] — Previous phase
- [[research]] — Competitive analysis showing these as differentiators, not table stakes
