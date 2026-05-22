# Remotion Export Layers

29 components in `src/remotion/` for frame-accurate video export:

- `VideoComposition` — Root composition orchestrating all layers
- `RemotionCharacter` — 8-layer sprite character with viseme animation
- `RemotionRiggedCharacter` — Canvas-based mesh deformation
- `Remotion3DCharacter` — Three.js 3D character with lip sync
- `Remotion3DLayer` — Three.js scene with lighting
- `RemotionCaptions` — Word-by-word/sentence/karaoke captions
- `RemotionVideoLayer` — Video clip layers
- `RemotionMediaLayer` — Image layers with keyframes
- `RemotionTextOverlay` — Text overlays with animation presets
- `RemotionShapeLayer` — SVG shapes
- `RemotionHTMLTemplateLayer` — HTML templates in iframes
- `RemotionLottieLayer` — Lottie/SVG animations
- `RemotionSVGObjectLayer` — Animated SVG objects
- `RemotionAnnotationLayer` — Drawing annotations
- `RemotionCrowdLayer` — Background crowd with sway/bob
- `RemotionArtCurveLayer` — Variable-width SVG curves
- `RemotionRetentionHookLayer` — Engagement widgets
- `RemotionParticleLayer` — Particle effects
- `RemotionAudioReactiveLayer` — Audio visualizers
- `RemotionTransitionLayer` — Clip transitions
- `RemotionStyleFilter` — Global CSS filter effects
- `RemotionStyleEffectFilters` — Per-character SVG filters
- `CameraTransformWrapper` — Virtual camera transforms
- `RemotionAvatarCharacter` — AI video avatar
- `RemotionPixelArtCharacter` — Pixel art sprite animation

---

# PixiJS Rendering

16 files in `src/pixi/` for real-time canvas rendering:

- `PixiApp` — Singleton PixiJS Application factory
- `PixiCanvas` — React wrapper mounting PixiJS
- `PixiRenderLoop` — Unified ticker orchestrating all layers
- `PixiMediaLayer` — Image sprite sync from store
- `PixiShapeLayer` — Shape graphics rendering
- `PixiCharacterComposite` — Single character with 8 layers + lip sync
- `PixiMultiCharacterLayer` — Multiple dialogue characters
- `PixiTextOverlayLayer` — Text overlays as PIXI.Text
- `PixiCaptionOverlay` — Subtitles with word highlighting
- `PixiTextureCache` — LRU texture cache with ref counting
- `coordinatesBridge` — Logical ↔ display coordinate conversion
- `MoveableProxy` — DOM overlays for transform handles (media, character, text, shape)

---

# Motion Graphics System

- `src/motionGraphics/KineticBase.tsx` — Base kinetic typography with word cycling and phase timing
- `src/motionGraphics/registry.ts` — Global registry for motion graphic components
- `src/motionGraphics/resolver.ts` — Determines React vs HTML engine per template
- `src/motionGraphics/templates/` — 1,804 template files (all extend KineticBase or Scene pattern)
  - `KineticSlicedReveal` — Horizontal band stagger, alternating left/right slide-in, accent underline on hold
  - `KineticChromeLift` — Text lifts from below with metallic gradient + sheen sweep on hold, luxury feel
  - `KineticDropPress` — Per-character gravity drop with squash-on-impact and decaying vibration hold
  - `KineticJellyStamp` (`tpl-kinetic-jelly-stamp`) — Text drops and stamps with jelly-squish physics, ink splat rings on impact; unboxing/reaction content
  - `KineticCandyToss` (`tpl-kinetic-candy-toss`) — Each letter arcs in from a different direction with elastic landing and sparkle bursts; vlog/cooking content
  - `KineticWobblySticker` (`tpl-kinetic-wobbly-sticker`) — Text arrives as a chunky sticker with white border, elastic pop-in, pendulum wobble during hold, peels off on exit; cute game reviews/girly vlogs
  - `KineticInkBleed` — Ink blooms into paper, letterforms sharpen from dense blur; italic serif, paper bg. Transition words ("Meanwhile...", "But then...")
  - `KineticCurtainPart` — Two theater curtain panels split from center exposing text; fold shadows, stage depth lighting. Transition words ("Next up...", "Plot twist")
  - `KineticScanReveal` — Luminous scanner beam sweeps top-to-bottom materializing text with left-to-right char stagger; glowing beam core + afterglow trail. Transition words ("Cut to...", "Meanwhile...")

---

