# Bonerigging Core

2D character rigging engine in `src/bonerigging/core/`:

## Types
- `Joint`, `Bone`, `Skeleton` — Skeletal hierarchy
- `MeshData`, `Triangle`, `UV`, `BoneWeight` — Deformation mesh
- `Animation`, `Keyframe`, `NormalizedAnimation` — Animation data
- `ParsedCharacter`, `AlphaGrid` — Character analysis
- `SerializedRigData` — Wire format for persistence

## Engine
- `DeformationEngine.deformPoint(restPos, weights, boneData, squashStretch): Vec2` — LBS mesh deformation
- `AutoRigger.createSkeleton(parsed): Skeleton` — Auto-generate skeleton from character
- `SilhouetteAnalyzer.analyze(grid, bbox): BodyLandmarks` — T-pose landmark detection
- `SkinWeightCalculator.compute(points, skeleton, bbox): BoneWeight[][]` — Automatic weights
- `MeshGenerator.generate(bbox, cols?, rows?, w?, h?, alphaGrid?): MeshData` — Triangle mesh with alpha culling
- `applyRigidDrag(joint, target, skeleton, pinned): void` — FABRIK IK solver
- `propagateRigidFK(root, skeleton, pinned): void` — Forward kinematics
- `createSpringChain(joint, skeleton, stiffness, damping, gravity): SpringChain` — Spring physics
- `simulateSprings(chains, skeleton, dt): void` — Step simulation
- `AnimationManager` — Recording, playback, interpolation, import/export
- `PoseManager` — Named pose storage and application
- `UndoManager` — Undo/redo stack
- `BoneRiggingConverter` — Serialize/deserialize, convert to/from AutoStudio format

---

# Bonerigging Editor

Editor UI in `src/bonerigging/editor/`:

## Components
- `RiggingEditor` — Full-screen standalone editor
- `BoneRiggingProvider` — Embedded 3-panel layout provider
- `BRViewport` — PixiJS canvas + SVG layer + controls
- `BRToolPanel` — File upload, rig controls, edit modes
- `BRPropertiesPanel` — Weight, weight paint, pose panels
- `BRTimeline` — Animation recording and playback
- `RigPlaybackViewer` — Lightweight read-only playback (forwardRef)

## Contexts
- `EngineContext` — BoneRiggingEngineAPI
- `CharacterContext` — Parsed character, skeleton, weights, mesh state
- `ViewportContext` — Zoom, pan, display toggles
- `ToolContext` — Edit mode, weight paint state
- `AnimationContext` — Recording, playback, shared library (IndexedDB-backed)

## PixiJS Rendering
- `PixiViewport` — Main PixiJS viewport with layered overlays
- `BoneOverlay` — Skeleton visualization
- `MeshOverlay` — Wireframe and SVG points
- `WeightOverlay` — Skin weight heatmap
- `RasterMesh` — Deformable mesh for raster images
- `EnvelopeOverlay` — Bone influence capsules
- `BrushCursor` — Weight paint brush

---

