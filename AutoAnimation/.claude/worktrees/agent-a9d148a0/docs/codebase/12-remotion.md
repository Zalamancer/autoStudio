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
- `src/motionGraphics/templates/` — 1,793 template files (all extend KineticBase or Scene pattern)

---

