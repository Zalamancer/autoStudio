# Components: Canvas

## src/components/canvas/VideoCanvas.tsx
Main canvas container routing between PixiJS and DOM rendering with drag-drop support.

## src/components/canvas/CharacterComposite.tsx
8-layer sprite character renderer for single-character mode.

## src/components/canvas/CharacterLayer.tsx (MultiCharacterLayer)
Per-character renderer with viseme/emotion animation, rig playback, effects pipeline.

## src/components/canvas/RiggedCharacterCanvas.tsx
WebGL single-draw-call mesh deformation renderer using custom GLSL shaders.

## src/components/canvas/ThreeCanvas.tsx
React Three Fiber canvas for 3D characters with transparent overlay. Lazy-loaded via `React.lazy()` in VideoCanvas.tsx so Three.js (~500KB) is only fetched when 3D characters are present.

## src/components/canvas/Character3DRenderer.tsx
Individual 3D character: GLB loading, AnimationMixer, bone retargeting, viseme/expression overlays.

## src/components/canvas/VisemeFacePlane3D.tsx
3D mouth sprite overlay with dual-plane cross-fade on head bone.

## src/components/canvas/ExpressionFacePlane3D.tsx
Eye + eyebrow sprite overlays on 3D character head bone.

## src/components/canvas/BoneOverlay.tsx
Interactive 2D rig editing overlay with joint dragging.

## src/components/canvas/SVGElementRigRenderer.tsx
SVG-native rig with per-element bone transforms.

## src/components/canvas/CrowdLayer.tsx
Crowd rendering with pre-rendered sprite bitmaps and hit detection.

## src/components/canvas/RetentionHookLayer.tsx
Engagement widgets: progress bar, countdown, chapter markers, step counter.

## src/components/canvas/VideoLayer.tsx
Video clip layers with SelectionTransformBox.

## src/components/canvas/RigEditor3DViewport.tsx
3D rig editor with OrbitControls, skeleton overlay, bone gizmo.

## src/components/canvas/CanvasOverlay.tsx
Reusable overlay modal container.

---

