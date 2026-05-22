# Phase 2: Animation Engine Completion

**Timeline:** 2-3 weeks
**Theme:** Match Jitter's animation capabilities. These make ProAnimate a serious motion design tool.

---

## #14 Path Animation (Bezier Curves) UI

### What
A visual path editor that lets creators draw curved motion paths directly on the canvas and attach any layer to follow that path over time. The animation engine already has `evaluatePath()` supporting cubic bezier, catmull-rom, arc, spiral, and figure-eight paths (`src/engine/path.ts`). This feature builds the missing UI layer -- a canvas overlay for drawing/editing control points, a store for path definitions, and the wiring that connects path evaluation to the keyframe system at each frame.

### Tech Stack
- **SVG overlay** on the canvas for path visualization (control points, handles, path preview curve). SVG is preferred over Canvas2D for the editor because SVG elements are individually interactive (draggable handles) without hit-testing.
- **React** event handlers for drag interactions on control points.
- **Existing `engine/path.ts`** -- `evaluatePath()`, `evaluatePathAtFrame()`, `PathPresets`, `PathConfig`, `PathResult`, `Point2D`.
- **Existing `useKeyframeStore`** -- Path position feeds into keyframes for `position.x` and `position.y` properties.

### Existing Code to Modify

**`src/engine/path.ts`**
- Add a `getPathLength(config: PathConfig, samples?: number): number` utility that samples the path at N points and sums segment distances. Needed for constant-speed motion along the path (arc-length parameterization).
- Add `evaluatePathArcLength(t: number, config: PathConfig, samples?: number): PathResult` that maps a uniform `t` to arc-length-uniform `t` before calling `evaluatePath()`. Without this, objects move faster through tight curves and slower on straight segments.
- Add `pathToSVGPath(config: PathConfig, samples?: number): string` to convert any PathConfig to an SVG `<path d="...">` string for rendering the editor overlay. For cubic-bezier, this maps directly to SVG `M x0 y0 C x1 y1 x2 y2 x3 y3`. For catmull-rom, sample at 50+ points and output `L` segments (catmull-rom has no direct SVG command).

**`src/services/canvas2dRenderer.ts`**
- In `drawMediaLayers()`, `drawShapeLayers()`, `drawTextOverlays()`, and `drawCharacterLayers()`, add path animation evaluation BEFORE the existing position logic:
  ```ts
  // Path animation override
  let pathX: number | undefined
  let pathY: number | undefined
  let pathAngle: number | undefined
  if (item.pathId) {
    const pathResult = evaluatePathForObject(item.pathId, frame, props)
    if (pathResult) {
      pathX = pathResult.x
      pathY = pathResult.y
      if (item.pathAutoRotate) pathAngle = pathResult.angle
    }
  }
  const x = pathX ?? (getKeyframeValue(...) ?? item.position.x)
  const y = pathY ?? (getKeyframeValue(...) ?? item.position.y)
  ```
- Add a helper function `evaluatePathForObject(pathId, frame, props)` that looks up the path definition from props and calls `evaluatePathAtFrame()`.

**`src/remotion/types.ts`**
- Add `pathAnimations?: PathAnimationData[]` to `VideoCompositionProps`.
- Define `PathAnimationData`:
  ```ts
  interface PathAnimationData {
    id: string
    pathConfig: PathConfig
    objectRef: CanvasObjectRef
    startFrame: number
    endFrame: number
    autoRotate: boolean
    easing: EasingType
    loop: boolean
  }
  ```

**`src/services/keyframeProperties.ts`**
- No changes needed -- path animation overrides position but does not use the keyframe system directly. The path evaluator writes position directly during render. However, we should add `pathProgress` as an animatable property so users can ease the progress along the path via keyframes instead of linear.

**`src/components/canvas/VideoCanvas.tsx`**
- Add `<PathEditorOverlay>` as a child of the canvas container, rendered above all layers but below the `SelectionTransformBox`. Only visible when a path is being edited.

**`src/components/canvas/SelectionTransformBox.tsx`**
- When an object with a path animation is selected, show a "Edit Path" button in the transform box toolbar. Clicking it activates the path editor mode.

### New Code to Create

**`src/stores/usePathStore.ts`**
Zustand + Immer store for path definitions:
```ts
interface PathDefinition {
  id: string
  config: PathConfig          // from engine/path.ts
  name: string
  objectRef: CanvasObjectRef  // which object follows this path
  startFrame: number
  endFrame: number
  autoRotate: boolean
  easing: EasingType          // easing applied to progress t
  loop: boolean               // repeat path after endFrame
  constantSpeed: boolean      // use arc-length parameterization
}

interface PathState {
  paths: PathDefinition[]
  activeEditingPathId: string | null

  // CRUD
  addPath: (objectRef: CanvasObjectRef, config: PathConfig) => string
  updatePath: (pathId: string, updates: Partial<PathDefinition>) => void
  removePath: (pathId: string) => void
  removePathsForObject: (objectRef: CanvasObjectRef) => void

  // Path editing
  setActiveEditingPath: (pathId: string | null) => void
  updateControlPoint: (pathId: string, pointIndex: number, point: Point2D) => void
  addControlPoint: (pathId: string, point: Point2D, afterIndex: number) => void
  removeControlPoint: (pathId: string, pointIndex: number) => void

  // Presets
  applyPreset: (pathId: string, presetName: keyof typeof PathPresets, canvasWidth: number, canvasHeight: number) => void

  // Queries
  getPathForObject: (objectRef: CanvasObjectRef) => PathDefinition | undefined
  evaluateAtFrame: (pathId: string, frame: number) => PathResult | undefined

  // Persistence
  loadFromProject: (paths: PathDefinition[]) => void
}
```

**`src/components/canvas/PathEditorOverlay.tsx`**
SVG overlay component for visual path editing:
- Renders the path curve as an SVG `<path>` element with a dashed stroke.
- Renders control points as draggable circles (on-curve points = filled, off-curve handles = hollow).
- Renders tangent handle lines connecting on-curve points to their control handles.
- Drag interactions: moving a control point calls `usePathStore.updateControlPoint()`.
- Double-click on the path curve to add a new control point (split segment).
- Right-click on a control point to remove it.
- Renders the object's current position along the path as a ghost/shadow indicator.
- Shows direction arrows along the path to indicate travel direction.
- Frame range handles at start/end of path for adjusting `startFrame`/`endFrame`.

```tsx
// Rough structure
const PathEditorOverlay: React.FC = () => {
  const { paths, activeEditingPathId, updateControlPoint } = usePathStore()
  const activePath = paths.find(p => p.id === activeEditingPathId)
  if (!activePath) return null

  const svgD = pathToSVGPath(activePath.config)

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      {/* Path curve */}
      <path d={svgD} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="8 4" />

      {/* Control points */}
      {activePath.config.points.map((pt, i) => (
        <circle
          key={i}
          cx={pt.x} cy={pt.y} r={6}
          fill={isOnCurvePoint(i, activePath.config.type) ? '#3b82f6' : 'white'}
          stroke="#3b82f6" strokeWidth={2}
          className="pointer-events-auto cursor-grab"
          onMouseDown={(e) => startDrag(e, i)}
        />
      ))}

      {/* Tangent handles (for cubic bezier) */}
      {activePath.config.type === 'cubic-bezier' && (
        <>
          <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y}
                stroke="#3b82f6" strokeWidth={1} opacity={0.5} />
          <line x1={pts[3].x} y1={pts[3].y} x2={pts[2].x} y2={pts[2].y}
                stroke="#3b82f6" strokeWidth={1} opacity={0.5} />
        </>
      )}

      {/* Direction arrows */}
      {renderDirectionArrows(svgD)}
    </svg>
  )
}
```

**`src/components/panels/PathAnimationPanel.tsx`**
Panel UI (in the right sidebar or as part of the properties panel):
- Path type selector: Linear, Cubic Bezier, Catmull-Rom, Arc, Ellipse, Figure-Eight, Spiral.
- Preset selector: S-Curve, Orbit, Bouncing Arc, Zigzag, Wave (from `PathPresets`).
- Start/end frame inputs.
- Auto-rotate toggle.
- Constant-speed toggle.
- Easing selector for path progress.
- Loop toggle.
- "Edit on Canvas" button to activate `PathEditorOverlay`.
- "Remove Path" button.

### Data Flow
```
User selects a media layer -> clicks "Add Path Animation" in properties panel
  -> usePathStore.addPath(objectRef, defaultCubicBezierConfig)
  -> PathEditorOverlay appears on canvas with 4 draggable control points
  -> User drags control points to shape the curve
     -> usePathStore.updateControlPoint(pathId, pointIndex, newPosition)
     -> SVG overlay re-renders immediately

During playback / export:
  -> renderFrame() iterates layers
  -> For each layer with pathId:
       path = pathStore.paths.find(p => p.id === item.pathId)
       t = (frame - path.startFrame) / (path.endFrame - path.startFrame)
       t = applyEasing(t, path.easing)
       if (path.constantSpeed) t = arcLengthRemap(t)
       result = evaluatePath(t, path.config)
       -> use result.x, result.y as the layer position
       -> if autoRotate, use result.angle as the layer rotation

Serialization:
  -> compositionBuilder reads usePathStore paths
  -> Serializes as pathAnimations[] in VideoCompositionProps
  -> canvas2dRenderer reads from props.pathAnimations during export
```

### Architecture Notes

**Why SVG overlay instead of Canvas2D for the editor:** The path editor needs individually interactive control points (drag, right-click, double-click). SVG elements have native pointer events, making this trivial. A Canvas2D overlay would require manual hit-testing for each point, which is fragile at different zoom levels.

**Arc-length parameterization is important:** Without constant-speed correction, an object following a cubic bezier will accelerate through sharp curves and decelerate on straight segments. This looks unnatural for most use cases. The `evaluatePathArcLength()` function pre-computes a lookup table of cumulative arc lengths at N sample points (100 is sufficient), then binary-searches for the uniform-speed `t` value. This adds negligible overhead.

**Path animation vs keyframe animation:** Path animation overrides the object's position but should NOT conflict with position keyframes. The priority order is:
1. If `pathId` exists and frame is within path's range -> use path position.
2. Else if position keyframes exist -> use interpolated keyframe values.
3. Else -> use the store's static position.

This means a user can have path animation for frames 0-60, then keyframed position changes for frames 60-120.

**Multi-segment paths (catmull-rom with many points):** For catmull-rom, each added control point extends the path smoothly through all points. This is the most intuitive mode for freeform path drawing -- the user clicks to add points and the path smoothly connects them all. This should be the default path type for new paths.

**Canvas zoom/pan coordination:** The `PathEditorOverlay` SVG must transform its coordinate system to match the canvas zoom and pan from `useCanvasStore`. Apply a `transform` on the SVG root: `translate(panX, panY) scale(zoom)`.

**Undo/redo:** `usePathStore` should wrap with `zundo` `temporal()` middleware for undo/redo support, matching the pattern of `useKeyframeStore`.

### Acceptance Criteria
- [ ] "Add Path Animation" button appears in the properties panel when a layer is selected.
- [ ] Clicking it creates a default cubic bezier path and activates the path editor overlay.
- [ ] Control points are draggable on the canvas with real-time path preview.
- [ ] Off-curve handles (bezier control points) are visually distinct from on-curve points.
- [ ] All 8 path types from `engine/path.ts` are available in the type selector.
- [ ] Path presets (S-Curve, Orbit, Wave, etc.) can be applied with one click.
- [ ] Object follows the path during playback with correct position interpolation.
- [ ] Auto-rotate option rotates the object to face the path tangent direction.
- [ ] Constant-speed option produces uniform motion speed along the path.
- [ ] Easing can be applied to path progress (e.g., ease-in-out makes the object start slow, speed up, then slow down).
- [ ] Loop option repeats the path animation after the end frame.
- [ ] Path animation works in Canvas2D export (MP4/WebM/GIF).
- [ ] Path definitions persist in project save/load.
- [ ] Undo/redo works for path control point edits.
- [ ] Path editor respects canvas zoom and pan.

---

## #15 Vector/Alpha Masks

### What
Masking lets creators crop any layer to a shape, another layer, or a custom path. Vector masks use geometric shapes (rectangle, ellipse, custom bezier path). Alpha masks use another layer's luminance or alpha channel to determine visibility. Animated masks enable reveal transitions, spotlight effects, and wipe animations. This is a core compositing feature required for professional motion design.

### Tech Stack
- **Canvas2D `ctx.clip()`** with `Path2D` objects for vector masks (GPU-accelerated clipping).
- **Canvas2D `globalCompositeOperation: 'destination-in'`** for alpha masks (uses mask's alpha/luminance to determine output visibility).
- **OffscreenCanvas** for mask composition (render mask to offscreen, apply as composite).
- **Existing `engine/path.ts`** for custom path masks (reuse `PathConfig` for mask shape definition).

### Existing Code to Modify

**`src/services/canvas2dRenderer.ts`**
- In each `draw*Layers()` function, before drawing the layer content, check if the layer has a mask applied:
  ```ts
  if (item.maskId) {
    applyMask(ctx, item.maskId, props, frame, kfIndex)
  }
  ```
- The mask application needs to wrap the layer drawing in a save/restore block with clipping or compositing applied.
- For vector masks: build a `Path2D` from the mask shape and call `ctx.clip(path)` before drawing.
- For alpha masks: render the masked layer to a temporary offscreen canvas, render the mask to another offscreen canvas, composite them using `'destination-in'`, then draw the result onto the main canvas.

**`src/remotion/types.ts`**
- Add `masks?: MaskData[]` to `VideoCompositionProps`.
- Add `maskId?: string` to all layer data interfaces (`MediaItemData`, `ShapeLayerData`, `TextOverlayData`, etc.).

**`src/services/keyframeProperties.ts`**
- Add mask-specific animatable properties for mask objects:
  ```ts
  mask: [
    { key: 'position.x', label: 'Mask X', type: 'number' },
    { key: 'position.y', label: 'Mask Y', type: 'number' },
    { key: 'width', label: 'Mask Width', type: 'number', min: 1, max: 5000 },
    { key: 'height', label: 'Mask Height', type: 'number', min: 1, max: 5000 },
    { key: 'rotation', label: 'Mask Rotation', type: 'angle' },
    { key: 'feather', label: 'Feather', type: 'number', min: 0, max: 100 },
    { key: 'expansion', label: 'Expansion', type: 'number', min: -100, max: 100 },
  ]
  ```
- Add `'mask'` to `KeyframableObjectType`.

**`src/types/keyframes.ts`**
- Add `'mask'` to the `KeyframableObjectType` union.

**`src/stores/useMediaStore.ts`, `useShapeStore.ts`, `useTextOverlayStore.ts`, etc.**
- Add `maskId?: string` to each layer item interface (nullable, no mask by default).

**`src/components/canvas/VideoCanvas.tsx`**
- For live preview, CSS `clip-path` (vector masks) and CSS `mask-image` (alpha masks) can approximate the mask effect without Canvas2D.

### New Code to Create

**`src/stores/useMaskStore.ts`**
Zustand + Immer + Zundo store:
```ts
export type MaskType = 'rectangle' | 'ellipse' | 'path' | 'layer'

export interface MaskDefinition {
  id: string
  name: string
  type: MaskType
  // Shape properties (for rectangle, ellipse, path)
  position: { x: number; y: number }
  width: number
  height: number
  rotation: number
  // Path (for path type) -- reuses PathConfig from engine/path.ts
  pathConfig?: PathConfig
  // Layer reference (for layer type -- uses another layer's alpha)
  sourceLayerRef?: CanvasObjectRef
  // Mask properties
  inverted: boolean         // invert mask (show outside, hide inside)
  feather: number           // edge feather in pixels (0 = hard edge)
  expansion: number         // expand/contract mask boundary in pixels
  opacity: number           // mask strength (1 = full mask, 0 = no mask)
}

interface MaskState {
  masks: MaskDefinition[]
  activeEditingMaskId: string | null

  // CRUD
  addMask: (type: MaskType, targetRef: CanvasObjectRef) => string
  updateMask: (maskId: string, updates: Partial<MaskDefinition>) => void
  removeMask: (maskId: string) => void

  // Path editing (for path-type masks)
  updateMaskPathPoint: (maskId: string, pointIndex: number, point: Point2D) => void

  // Queries
  getMaskById: (maskId: string) => MaskDefinition | undefined

  // Persistence
  loadFromProject: (masks: MaskDefinition[]) => void
}
```

**`src/services/maskRenderer.ts`**
Core mask rendering logic, separated from canvas2dRenderer for clarity:
```ts
/**
 * Build a Path2D for a vector mask at the current frame.
 * Reads animated properties from keyframe data.
 */
export function buildMaskPath(
  mask: MaskDefinition,
  frame: number,
  kfIndex?: KeyframeIndex,
  keyframeData?: KeyframeExportData,
): Path2D {
  // Read animated values
  const x = getKeyframeValue(keyframeData, 'mask', mask.id, 'position.x', frame, kfIndex) ?? mask.position.x
  const y = getKeyframeValue(keyframeData, 'mask', mask.id, 'position.y', frame, kfIndex) ?? mask.position.y
  const w = getKeyframeValue(keyframeData, 'mask', mask.id, 'width', frame, kfIndex) ?? mask.width
  const h = getKeyframeValue(keyframeData, 'mask', mask.id, 'height', frame, kfIndex) ?? mask.height
  const rotation = getKeyframeValue(keyframeData, 'mask', mask.id, 'rotation', frame, kfIndex) ?? mask.rotation

  const path = new Path2D()

  switch (mask.type) {
    case 'rectangle':
      // Apply rotation via transform matrix on the path
      path.rect(x, y, w, h)
      break
    case 'ellipse':
      path.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, (rotation * Math.PI) / 180, 0, Math.PI * 2)
      break
    case 'path':
      if (mask.pathConfig) {
        // Sample the path at many points and build a closed polygon
        const samples = 100
        for (let i = 0; i <= samples; i++) {
          const t = i / samples
          const pt = evaluatePath(t, mask.pathConfig)
          if (i === 0) path.moveTo(pt.x, pt.y)
          else path.lineTo(pt.x, pt.y)
        }
        path.closePath()
      }
      break
  }

  return path
}

/**
 * Apply a vector mask to the canvas context.
 * Call before drawing the masked layer, and ctx.restore() after.
 */
export function applyVectorMask(
  ctx: CanvasRenderingContext2D,
  mask: MaskDefinition,
  frame: number,
  kfIndex?: KeyframeIndex,
  keyframeData?: KeyframeExportData,
): void {
  const path = buildMaskPath(mask, frame, kfIndex, keyframeData)

  if (mask.feather > 0) {
    // Feathered mask: use ctx.filter with blur on an offscreen canvas approach
    ctx.filter = `blur(${mask.feather}px)`
  }

  if (mask.inverted) {
    // Inverted: clip to everything OUTSIDE the path
    // Canvas2D doesn't natively support inverted clip, so:
    // Draw a full-canvas rect, then cut out the mask shape using 'evenodd'
    const invertedPath = new Path2D()
    invertedPath.rect(0, 0, ctx.canvas.width, ctx.canvas.height)
    invertedPath.addPath(path)
    ctx.clip(invertedPath, 'evenodd')
  } else {
    ctx.clip(path)
  }
}

/**
 * Apply an alpha mask using compositing.
 * Renders the target to an offscreen canvas, composites with the mask,
 * then draws result onto the main canvas.
 */
export function applyAlphaMask(
  mainCtx: CanvasRenderingContext2D,
  maskCanvas: HTMLCanvasElement,   // pre-rendered mask layer
  drawTarget: () => void,          // function that draws the target layer
  inverted: boolean,
): void {
  const w = mainCtx.canvas.width
  const h = mainCtx.canvas.height

  // Draw target to temp canvas
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w
  tempCanvas.height = h
  const tempCtx = tempCanvas.getContext('2d')!
  drawTarget.call(null) // draws to tempCtx

  // Apply mask via compositing
  tempCtx.globalCompositeOperation = inverted ? 'destination-out' : 'destination-in'
  tempCtx.drawImage(maskCanvas, 0, 0)
  tempCtx.globalCompositeOperation = 'source-over'

  // Composite result onto main canvas
  mainCtx.drawImage(tempCanvas, 0, 0)
}
```

**`src/components/canvas/MaskEditorOverlay.tsx`**
SVG overlay for mask shape editing (similar to PathEditorOverlay):
- Shows mask boundary as a dashed outline.
- Corner/edge handles for resizing rectangle/ellipse masks.
- Control point handles for path masks (reuse PathEditorOverlay's drag logic).
- Semi-transparent fill inside the mask to indicate the masked area.
- Invert preview: show the outside area dimmed instead.

**`src/components/panels/MaskPanel.tsx`**
Panel UI for mask management:
- "Add Mask" button with type picker (Rectangle, Ellipse, Path, Layer).
- Mask properties: position, size, rotation, feather, expansion, invert toggle.
- Mask opacity slider.
- Target layer selector (which layer this mask applies to).
- Source layer selector (for layer-type masks).
- "Edit on Canvas" button.
- Keyframe diamond buttons for animated properties.

### Data Flow
```
User selects a media layer -> right panel shows "Mask" section -> clicks "Add Mask" -> "Ellipse"
  -> useMaskStore.addMask('ellipse', objectRef)
  -> MaskEditorOverlay appears with default ellipse centered on the layer
  -> User drags handles to resize/reposition the mask
     -> useMaskStore.updateMask(maskId, { width, height, position })

User keyframes the mask width from 0 to full-width over 30 frames (reveal effect):
  -> useKeyframeStore.setKeyframe({ objectType: 'mask', objectId: maskId }, 'width', 0, 0)
  -> useKeyframeStore.setKeyframe({ objectType: 'mask', objectId: maskId }, 'width', 30, 500)

During playback / export:
  -> canvas2dRenderer encounters layer with maskId
  -> Looks up mask definition from props.masks
  -> Reads animated mask properties via keyframe interpolation
  -> Builds Path2D from mask shape at current frame dimensions
  -> ctx.save() -> ctx.clip(path) -> drawLayer() -> ctx.restore()

Live preview:
  -> VideoCanvas applies CSS clip-path for vector masks:
     clip-path: ellipse(50% 40% at 50% 50%)
  -> Updates reactively as mask store changes
```

### Architecture Notes

**Offscreen canvas pooling for alpha masks:** Alpha masks require rendering the target and mask to separate offscreen canvases, then compositing them. Creating new canvases per frame is expensive. Pool 2-3 offscreen canvases at the target resolution and reuse them. Clear with `ctx.clearRect()` instead of recreating.

**Feathered edges on vector masks:** Canvas2D `clip()` produces hard edges. For feathered masks:
- **Option A (simple):** Apply `ctx.filter = 'blur(Npx)'` to an offscreen render of the mask shape (filled white on black), then use as an alpha mask via `'destination-in'`. This converts the vector mask to an alpha mask under the hood. Performance cost: one extra offscreen canvas + one blur pass.
- **Option B (fast but limited):** For rectangle and ellipse masks only, use `ctx.createRadialGradient()` or `ctx.createLinearGradient()` with alpha stops to create a feathered edge directly. No offscreen canvas needed.
- Recommendation: Start with Option A for all mask types (uniform approach), optimize to Option B for common shapes later.

**Mask stacking:** An object can have at most one mask in v1. Multiple masks (mask groups / boolean operations) are a v2 feature. The store supports this by having `maskId` as a single string, not an array.

**Layer masks (one layer masks another):** This uses another layer's alpha channel as the mask. The source layer must be rendered to an offscreen canvas first, then used as the alpha mask image. The source layer should NOT also render to the main canvas (unless the user wants both visible). Add a `maskOnly: boolean` flag to the source layer's store to control this.

**Performance in export:** Vector masks via `ctx.clip()` are essentially free (GPU clipping). Alpha masks are more expensive (two offscreen renders + composite). For a 10-second clip with one alpha mask, expect ~3-5ms per frame overhead. Acceptable for most use cases.

**Interaction with blend modes and blur:** Render order per layer: mask -> blur -> blend mode -> draw. The mask clips the content first, then blur smears the clipped edges (creating a natural feathered look), then blend mode composites the result.

### Acceptance Criteria
- [ ] "Add Mask" button appears in the properties panel for all layer types.
- [ ] Rectangle mask clips the layer to a rectangular region.
- [ ] Ellipse mask clips the layer to an elliptical region.
- [ ] Path mask clips the layer to a custom bezier shape.
- [ ] Layer mask uses another layer's alpha to determine visibility.
- [ ] Mask editor overlay allows visual editing of mask shape on the canvas.
- [ ] Invert option reverses the masked area.
- [ ] Feather slider (0-100px) softens the mask edges.
- [ ] Mask properties are keyframe-animatable (position, size, rotation, feather).
- [ ] Animated mask reveal (width 0 to full over time) works correctly.
- [ ] Masks render correctly in Canvas2D export (MP4/WebM/GIF).
- [ ] Masks persist in project save/load.
- [ ] Undo/redo works for mask edits.
- [ ] Mask has zero performance cost when not applied (no mask = no offscreen work).

---

## #17 Animated Gradients

### What
Gradient fills that animate over time -- rotating angles, shifting color stops, pulsing radial gradients, and morphing between gradient states. Gradients can be applied as shape fills, text fills, background fills, and mask fills. This is a fundamental motion graphics primitive; every gradient property is keyframe-animatable.

### Tech Stack
- **Canvas2D** `createLinearGradient()`, `createRadialGradient()`, and `createConicGradient()` (Chrome 99+).
- **Existing keyframe system** (`useKeyframeStore`) for animating gradient properties.
- No external libraries.

### Existing Code to Modify

**`src/stores/useShapeStore.ts`**
- Expand the shape fill from a single color string to a union:
  ```ts
  fill: string | GradientFill   // backward compatible: string = solid color
  ```
- Add gradient-specific properties to the shape interface, or encapsulate in `GradientFill`.

**`src/services/canvas2dRenderer.ts`**
- In `drawShapeLayers()` and `drawShape()` (line ~1874), where `ctx.fillStyle = shape.fill` is set, add gradient handling:
  ```ts
  if (typeof shape.fill === 'object' && shape.fill.type) {
    ctx.fillStyle = buildCanvasGradient(ctx, shape.fill, w, h, frame, kfIndex, props.keyframeData, shape.id)
  } else {
    ctx.fillStyle = shape.fill as string
  }
  ```
- In `drawTextOverlays()`, same pattern for text fill gradients.

**`src/services/keyframeProperties.ts`**
- Add gradient-specific animatable properties to shapes:
  ```ts
  // Append to shape properties
  { key: 'gradientAngle', label: 'Gradient Angle', type: 'angle' },
  { key: 'gradientCenterX', label: 'Gradient Center X', type: 'number', min: 0, max: 1 },
  { key: 'gradientCenterY', label: 'Gradient Center Y', type: 'number', min: 0, max: 1 },
  { key: 'gradientRadius', label: 'Gradient Radius', type: 'number', min: 0, max: 2 },
  { key: 'gradientStop0Pos', label: 'Stop 1 Position', type: 'number', min: 0, max: 1 },
  { key: 'gradientStop1Pos', label: 'Stop 2 Position', type: 'number', min: 0, max: 1 },
  { key: 'gradientStop2Pos', label: 'Stop 3 Position', type: 'number', min: 0, max: 1 },
  ```

**`src/remotion/types.ts`**
- Add `gradientFill?: GradientFillData` to `ShapeLayerData` and `TextOverlayData`.

**`src/components/layout/RightPanel/ShapePropertiesPanel.tsx` (or equivalent)**
- Add a "Fill Type" toggle: Solid / Linear Gradient / Radial Gradient / Conic Gradient.
- When gradient is selected, show: color stop editor (add/remove/reorder stops), angle control (linear), center point control (radial/conic), radius control (radial), and keyframe buttons for all animated properties.

### New Code to Create

**`src/types/gradient.ts`**
```ts
export type GradientType = 'linear' | 'radial' | 'conic'

export interface GradientColorStop {
  id: string
  color: string      // hex, rgb, or rgba
  position: number   // 0-1
}

export interface GradientFill {
  type: GradientType
  stops: GradientColorStop[]
  // Linear-specific
  angle: number                  // degrees, for linear
  // Radial-specific
  centerX: number                // 0-1, relative to shape bounds
  centerY: number                // 0-1, relative to shape bounds
  radius: number                 // multiplier (1 = fill shape, 2 = extend beyond)
  // Conic-specific
  startAngle?: number            // degrees
  // Animation
  animateAngle?: boolean         // shortcut: auto-rotate angle over time
  animateSpeed?: number          // degrees per frame for auto-rotation
}

export const GRADIENT_PRESETS: { label: string; fill: GradientFill }[] = [
  {
    label: 'Sunset',
    fill: {
      type: 'linear',
      angle: 135,
      stops: [
        { id: 's1', color: '#ff6b6b', position: 0 },
        { id: 's2', color: '#feca57', position: 0.5 },
        { id: 's3', color: '#48dbfb', position: 1 },
      ],
      centerX: 0.5, centerY: 0.5, radius: 1,
    }
  },
  {
    label: 'Ocean',
    fill: {
      type: 'radial',
      angle: 0,
      stops: [
        { id: 's1', color: '#0abde3', position: 0 },
        { id: 's2', color: '#1a0052', position: 1 },
      ],
      centerX: 0.5, centerY: 0.5, radius: 1,
    }
  },
  // ... 6-8 more presets
]
```

**`src/services/gradientRenderer.ts`**
Builds Canvas2D gradient objects from `GradientFill` definitions with keyframe animation support:
```ts
import type { GradientFill, GradientColorStop } from '@/types/gradient'
import { interpolatePropertyKeyframes } from './interpolation'
import { lerp } from './interpolation'

/**
 * Build a CanvasGradient from a GradientFill definition.
 * Reads keyframe-animated properties for the current frame.
 */
export function buildCanvasGradient(
  ctx: CanvasRenderingContext2D,
  fill: GradientFill,
  width: number,
  height: number,
  frame: number,
  kfIndex?: any,
  keyframeData?: any,
  objectId?: string,
): CanvasGradient {
  // Read animated values (fallback to static if no keyframes)
  const angle = readAnimatedValue('gradientAngle', fill.angle, frame, kfIndex, keyframeData, objectId)
  const centerX = readAnimatedValue('gradientCenterX', fill.centerX, frame, kfIndex, keyframeData, objectId)
  const centerY = readAnimatedValue('gradientCenterY', fill.centerY, frame, kfIndex, keyframeData, objectId)
  const radius = readAnimatedValue('gradientRadius', fill.radius, frame, kfIndex, keyframeData, objectId)

  let gradient: CanvasGradient

  switch (fill.type) {
    case 'linear': {
      const rad = (angle * Math.PI) / 180
      const halfDiag = Math.sqrt(width * width + height * height) / 2
      const dx = Math.cos(rad) * halfDiag
      const dy = Math.sin(rad) * halfDiag
      const cx = width / 2
      const cy = height / 2
      gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy)
      break
    }
    case 'radial': {
      const cx = width * centerX
      const cy = height * centerY
      const r = Math.max(width, height) * radius * 0.5
      gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      break
    }
    case 'conic': {
      const cx = width * centerX
      const cy = height * centerY
      const startAngle = ((fill.startAngle ?? 0) * Math.PI) / 180
      gradient = ctx.createConicGradient(startAngle, cx, cy)
      break
    }
  }

  // Add color stops (with animated positions)
  for (let i = 0; i < fill.stops.length; i++) {
    const stop = fill.stops[i]
    const animatedPos = readAnimatedValue(`gradientStop${i}Pos`, stop.position, frame, kfIndex, keyframeData, objectId)
    gradient.addColorStop(Math.max(0, Math.min(1, animatedPos)), stop.color)
  }

  return gradient
}

/**
 * Interpolate between two gradient states for smooth transitions.
 * Used when keyframing between different gradient presets.
 */
export function lerpGradientStops(
  stopsA: GradientColorStop[],
  stopsB: GradientColorStop[],
  t: number,
): GradientColorStop[] {
  // Match stops by index (must have same count)
  const count = Math.min(stopsA.length, stopsB.length)
  const result: GradientColorStop[] = []

  for (let i = 0; i < count; i++) {
    result.push({
      id: stopsA[i].id,
      color: lerpColor(stopsA[i].color, stopsB[i].color, t),
      position: lerp(stopsA[i].position, stopsB[i].position, t),
    })
  }

  return result
}
```

**`src/components/ui/GradientEditor.tsx`**
Reusable gradient editor component:
- Color stop bar: horizontal bar showing the gradient preview with draggable stop markers.
- Click to add new stops, double-click to edit stop color (opens color picker), drag to reposition, drag off to delete.
- Angle wheel (for linear): circular drag control showing the gradient direction.
- Center point indicator (for radial/conic): cross-hair on a mini preview.
- Preset selector dropdown.
- "Animate Rotation" quick toggle: auto-keyframes angle from 0 to 360 over the clip duration.

### Data Flow
```
User selects a shape -> changes fill type to "Linear Gradient"
  -> useShapeStore: shapes[i].fill = { type: 'linear', angle: 90, stops: [...], ... }
  -> Shape re-renders with gradient fill in live preview
  -> User drags angle wheel to 45 degrees
     -> useShapeStore: shapes[i].fill.angle = 45

User keyframes gradient angle:
  -> Frame 0: gradientAngle = 0
  -> Frame 60: gradientAngle = 360
  -> During playback:
       interpolatePropertyKeyframes() returns smooth angle at each frame
       buildCanvasGradient() uses the animated angle
       Shape renders with rotating gradient

Export:
  -> compositionBuilder serializes GradientFill into ShapeLayerData.gradientFill
  -> canvas2dRenderer.drawShapeLayers():
       ctx.fillStyle = buildCanvasGradient(ctx, shape.gradientFill, w, h, frame, ...)
       ctx.fill(path)
```

### Architecture Notes

**Backward compatibility:** The shape `fill` field is currently a string (hex color). Changing it to `string | GradientFill` requires a migration check in the store's rehydration: if `fill` is a string, treat it as a solid color. If it is an object with a `type` field, treat it as a gradient. This is a non-breaking change for existing projects.

**Color stop animation:** Animating individual stop colors (e.g., morphing from red-to-blue gradient to green-to-yellow) requires interpolating hex colors. This means parsing hex to RGB, lerping each channel, and converting back. The `lerpColor()` helper handles this. However, keyframing stop COLORS (not positions) is complex because colors are not single numbers. Options:
- **v1:** Only animate positions and angle. Colors are static per gradient definition.
- **v2:** Add color keyframes as a separate concept (RGB channels as 3 properties per stop).
- Recommendation: v1 approach. Animating angle and stop positions covers 90% of use cases (rotating gradients, shifting gradient bands).

**Conic gradient browser support:** `createConicGradient()` is Chrome 99+, Safari 16.4+, Firefox 112+. For Firefox < 112, fall back to a sampled radial approximation. This is a minor concern since our target is primarily Chrome.

**Performance:** `createLinearGradient()` and `createRadialGradient()` are very fast (< 0.1ms). The gradient object is recreated per frame (cannot be cached because animated parameters change each frame), but creation cost is negligible.

**Text gradient fills:** For text, Canvas2D does not natively support gradient text fill in the same way. The approach is: draw the text to an offscreen canvas with solid white fill, then use `globalCompositeOperation: 'source-in'` to composite the gradient onto the text shape. This is a standard technique and adds ~1ms per text overlay.

### Acceptance Criteria
- [ ] Fill type toggle (Solid/Linear/Radial/Conic) appears for shapes and text overlays.
- [ ] Selecting "Linear Gradient" shows the gradient editor with color stops, angle control, and preset selector.
- [ ] Gradient renders correctly in live preview and export for all three types.
- [ ] Color stops can be added, removed, repositioned, and recolored.
- [ ] Gradient angle is keyframe-animatable (smooth rotation over time).
- [ ] Gradient stop positions are keyframe-animatable (bands shift over time).
- [ ] Gradient center point (radial/conic) is keyframe-animatable.
- [ ] Gradient radius (radial) is keyframe-animatable.
- [ ] 8+ gradient presets are available for one-click application.
- [ ] "Animate Rotation" toggle creates a 0-360 angle animation automatically.
- [ ] Existing projects with solid-color shapes load correctly (backward compatible).
- [ ] Text overlay gradient fills render correctly in both preview and export.
- [ ] Gradient shapes persist in project save/load.

---

## #28 Reusable Timing Templates

### What
Save any set of keyframes as a named timing template, then apply it to any other object with one click. Templates store relative frame offsets, property names, values, and easing curves -- not absolute positions. When applied, the template maps to the target object's start frame and scales to its duration. Ships with 12+ built-in presets covering common motion design patterns.

### Tech Stack
- **Existing `useKeyframeStore`** -- Templates are serialized subsets of `ObjectPropertyTrack[]`.
- **Zustand + Immer** for the template store.
- **localStorage** persistence for user-created templates.
- No external libraries.

### Existing Code to Modify

**`src/stores/useKeyframeStore.ts`**
- Add a `exportKeyframesAsTemplate(objectRef: CanvasObjectRef, name: string): TimingTemplate` method that reads all tracks for the given object and serializes them as a template with relative timing.
- Add an `applyTimingTemplate(objectRef: CanvasObjectRef, template: TimingTemplate, startFrame: number, duration: number)` method that maps the template's relative keyframes to absolute frames on the target object, creating new keyframes via `setKeyframe()`.

**`src/types/keyframes.ts`**
- Add `TimingTemplate` type definition (see new types below).

**`src/components/timeline/Timeline.tsx`**
- Add a right-click context menu option on keyframe diamonds: "Save as Timing Template".
- Add a right-click context menu option on track headers: "Apply Timing Template".

**`src/components/layout/RightPanel/` (property panels)**
- Add a "Timing Templates" section to keyframe-related panels with a dropdown of available templates and an "Apply" button.

### New Code to Create

**`src/types/timingTemplate.ts`**
```ts
export interface TimingTemplateKeyframe {
  /** Relative position within the template, 0-1 (0 = start, 1 = end) */
  relativePosition: number
  /** Relative value: either absolute or delta from default */
  value: number
  /** How to interpret the value */
  valueMode: 'absolute' | 'relative' | 'normalized'
  easing: EasingType
  bezierParams?: CubicBezierParams
}

export interface TimingTemplateTrack {
  property: string
  keyframes: TimingTemplateKeyframe[]
}

export interface TimingTemplate {
  id: string
  name: string
  category: 'entrance' | 'exit' | 'emphasis' | 'transition' | 'loop' | 'custom'
  description: string
  /** Which object types this template is compatible with */
  compatibleTypes: KeyframableObjectType[] | 'all'
  /** Which properties this template animates */
  tracks: TimingTemplateTrack[]
  /** Default duration in frames (used when no duration specified) */
  defaultDuration: number
  /** Whether the template can be time-stretched */
  stretchable: boolean
  /** Whether applying this clears existing keyframes for the affected properties */
  replacesExisting: boolean
  /** Preview: mini keyframe diagram data for thumbnail rendering */
  preview?: { property: string; points: number[] }[]
  /** Source: 'builtin' or 'user' */
  source: 'builtin' | 'user'
}
```

**`src/stores/useTimingTemplateStore.ts`**
```ts
interface TimingTemplateState {
  templates: TimingTemplate[]

  // CRUD
  addTemplate: (template: Omit<TimingTemplate, 'id' | 'source'>) => string
  updateTemplate: (id: string, updates: Partial<TimingTemplate>) => void
  removeTemplate: (id: string) => void
  duplicateTemplate: (id: string) => string

  // Queries
  getTemplateById: (id: string) => TimingTemplate | undefined
  getTemplatesByCategory: (category: TimingTemplate['category']) => TimingTemplate[]
  getCompatibleTemplates: (objectType: KeyframableObjectType) => TimingTemplate[]

  // Import/Export
  exportTemplateAsJSON: (id: string) => string
  importTemplateFromJSON: (json: string) => string

  // Persistence
  loadBuiltins: () => void
}
```

**`src/data/builtinTimingTemplates.ts`**
Built-in template library:
```ts
export const BUILTIN_TIMING_TEMPLATES: TimingTemplate[] = [
  // ── Entrance ───
  {
    id: 'tpl-fade-in',
    name: 'Fade In',
    category: 'entrance',
    description: 'Simple opacity fade from 0 to 1',
    compatibleTypes: 'all',
    tracks: [
      { property: 'opacity', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'ease-out' },
        { relativePosition: 1, value: 1, valueMode: 'absolute', easing: 'ease-out' },
      ]},
    ],
    defaultDuration: 15,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  {
    id: 'tpl-slide-up',
    name: 'Slide Up',
    category: 'entrance',
    description: 'Slides in from below with fade',
    compatibleTypes: 'all',
    tracks: [
      { property: 'opacity', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'ease-out' },
        { relativePosition: 0.4, value: 1, valueMode: 'absolute', easing: 'ease-out' },
      ]},
      { property: 'position.y', keyframes: [
        { relativePosition: 0, value: 100, valueMode: 'relative', easing: 'material' },
        { relativePosition: 1, value: 0, valueMode: 'relative', easing: 'material' },
      ]},
    ],
    defaultDuration: 20,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  {
    id: 'tpl-bounce-in',
    name: 'Bounce In',
    category: 'entrance',
    description: 'Scales from 0 with elastic bounce',
    compatibleTypes: ['media', 'shape', 'text', 'lottie', 'video'],
    tracks: [
      { property: 'opacity', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'linear' },
        { relativePosition: 0.1, value: 1, valueMode: 'absolute', easing: 'linear' },
      ]},
      { property: 'scale', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'elastic-out' },
        { relativePosition: 1, value: 1, valueMode: 'absolute', easing: 'elastic-out' },
      ]},
    ],
    defaultDuration: 25,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  {
    id: 'tpl-elastic-drop',
    name: 'Elastic Drop',
    category: 'entrance',
    description: 'Drops in from above with spring overshoot',
    compatibleTypes: 'all',
    tracks: [
      { property: 'position.y', keyframes: [
        { relativePosition: 0, value: -200, valueMode: 'relative', easing: 'spring-medium' },
        { relativePosition: 1, value: 0, valueMode: 'relative', easing: 'spring-medium' },
      ]},
      { property: 'opacity', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'ease-out' },
        { relativePosition: 0.2, value: 1, valueMode: 'absolute', easing: 'ease-out' },
      ]},
    ],
    defaultDuration: 30,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  // ── Exit ───
  {
    id: 'tpl-fade-out',
    name: 'Fade Out',
    category: 'exit',
    description: 'Simple opacity fade from 1 to 0',
    compatibleTypes: 'all',
    tracks: [
      { property: 'opacity', keyframes: [
        { relativePosition: 0, value: 1, valueMode: 'absolute', easing: 'ease-in' },
        { relativePosition: 1, value: 0, valueMode: 'absolute', easing: 'ease-in' },
      ]},
    ],
    defaultDuration: 15,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  {
    id: 'tpl-slide-left-exit',
    name: 'Slide Left Exit',
    category: 'exit',
    description: 'Slides off to the left with fade',
    compatibleTypes: 'all',
    tracks: [
      { property: 'opacity', keyframes: [
        { relativePosition: 0.6, value: 1, valueMode: 'absolute', easing: 'ease-in' },
        { relativePosition: 1, value: 0, valueMode: 'absolute', easing: 'ease-in' },
      ]},
      { property: 'position.x', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'relative', easing: 'ease-in' },
        { relativePosition: 1, value: -300, valueMode: 'relative', easing: 'ease-in' },
      ]},
    ],
    defaultDuration: 20,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  // ── Emphasis ───
  {
    id: 'tpl-pulse',
    name: 'Pulse',
    category: 'emphasis',
    description: 'Quick scale pulse to draw attention',
    compatibleTypes: ['media', 'shape', 'text', 'lottie'],
    tracks: [
      { property: 'scale', keyframes: [
        { relativePosition: 0, value: 1, valueMode: 'absolute', easing: 'ease-in-out' },
        { relativePosition: 0.3, value: 1.15, valueMode: 'absolute', easing: 'ease-in-out' },
        { relativePosition: 0.6, value: 0.95, valueMode: 'absolute', easing: 'ease-in-out' },
        { relativePosition: 1, value: 1, valueMode: 'absolute', easing: 'ease-in-out' },
      ]},
    ],
    defaultDuration: 20,
    stretchable: true,
    replacesExisting: false,
    source: 'builtin',
  },
  {
    id: 'tpl-shake',
    name: 'Shake',
    category: 'emphasis',
    description: 'Quick horizontal shake for error/attention',
    compatibleTypes: 'all',
    tracks: [
      { property: 'position.x', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 0.1, value: -10, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 0.2, value: 10, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 0.3, value: -8, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 0.4, value: 8, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 0.6, value: -4, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 0.8, value: 2, valueMode: 'relative', easing: 'linear' },
        { relativePosition: 1, value: 0, valueMode: 'relative', easing: 'linear' },
      ]},
    ],
    defaultDuration: 15,
    stretchable: true,
    replacesExisting: false,
    source: 'builtin',
  },
  // ── Loop ───
  {
    id: 'tpl-float',
    name: 'Float',
    category: 'loop',
    description: 'Gentle up/down floating motion',
    compatibleTypes: 'all',
    tracks: [
      { property: 'position.y', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'relative', easing: 'sine-in-out' },
        { relativePosition: 0.5, value: -15, valueMode: 'relative', easing: 'sine-in-out' },
        { relativePosition: 1, value: 0, valueMode: 'relative', easing: 'sine-in-out' },
      ]},
    ],
    defaultDuration: 60,
    stretchable: true,
    replacesExisting: false,
    source: 'builtin',
  },
  {
    id: 'tpl-spin',
    name: 'Spin',
    category: 'loop',
    description: 'Continuous 360-degree rotation',
    compatibleTypes: ['media', 'shape', 'lottie'],
    tracks: [
      { property: 'rotation', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'linear' },
        { relativePosition: 1, value: 360, valueMode: 'absolute', easing: 'linear' },
      ]},
    ],
    defaultDuration: 60,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
  {
    id: 'tpl-breathe',
    name: 'Breathe',
    category: 'loop',
    description: 'Gentle scale pulsing like breathing',
    compatibleTypes: ['media', 'shape', 'text', 'lottie'],
    tracks: [
      { property: 'scale', keyframes: [
        { relativePosition: 0, value: 1, valueMode: 'absolute', easing: 'sine-in-out' },
        { relativePosition: 0.5, value: 1.05, valueMode: 'absolute', easing: 'sine-in-out' },
        { relativePosition: 1, value: 1, valueMode: 'absolute', easing: 'sine-in-out' },
      ]},
    ],
    defaultDuration: 90,
    stretchable: true,
    replacesExisting: false,
    source: 'builtin',
  },
  // ── Transition ───
  {
    id: 'tpl-stagger-cascade',
    name: 'Stagger Cascade',
    category: 'transition',
    description: 'Entrance with staggered delay (apply to multiple objects)',
    compatibleTypes: 'all',
    tracks: [
      { property: 'opacity', keyframes: [
        { relativePosition: 0, value: 0, valueMode: 'absolute', easing: 'ease-out' },
        { relativePosition: 0.3, value: 1, valueMode: 'absolute', easing: 'ease-out' },
      ]},
      { property: 'position.y', keyframes: [
        { relativePosition: 0, value: 30, valueMode: 'relative', easing: 'material' },
        { relativePosition: 1, value: 0, valueMode: 'relative', easing: 'material' },
      ]},
    ],
    defaultDuration: 20,
    stretchable: true,
    replacesExisting: true,
    source: 'builtin',
  },
]
```

**`src/services/timingTemplateService.ts`**
Logic for applying templates to objects:
```ts
import type { TimingTemplate, TimingTemplateKeyframe } from '@/types/timingTemplate'
import type { CanvasObjectRef, EasingType, CubicBezierParams } from '@/types/keyframes'
import { useKeyframeStore } from '@/stores/useKeyframeStore'

/**
 * Apply a timing template to a canvas object.
 *
 * @param template - The template to apply
 * @param objectRef - Target object
 * @param startFrame - Absolute frame where the animation starts
 * @param duration - Duration in frames (overrides template default if provided)
 * @param currentValues - Current property values for relative mode
 */
export function applyTimingTemplate(
  template: TimingTemplate,
  objectRef: CanvasObjectRef,
  startFrame: number,
  duration?: number,
  currentValues?: Record<string, number>,
): void {
  const store = useKeyframeStore.getState()
  const dur = duration ?? template.defaultDuration

  // Optionally clear existing keyframes for affected properties
  if (template.replacesExisting) {
    for (const track of template.tracks) {
      // Remove existing keyframes for this property in the range
      const existingTrack = store.getTracksForObject(objectRef)
        .find(t => t.property === track.property)
      if (existingTrack) {
        for (const kf of existingTrack.keyframes) {
          if (kf.frame >= startFrame && kf.frame <= startFrame + dur) {
            store.removeKeyframe(kf.id)
          }
        }
      }
    }
  }

  // Apply template keyframes
  for (const track of template.tracks) {
    for (const kf of track.keyframes) {
      const absoluteFrame = Math.round(startFrame + kf.relativePosition * dur)

      let value: number
      switch (kf.valueMode) {
        case 'absolute':
          value = kf.value
          break
        case 'relative':
          // Add to current value
          value = (currentValues?.[track.property] ?? 0) + kf.value
          break
        case 'normalized':
          // 0-1 range mapped to property min/max (future)
          value = kf.value
          break
      }

      store.setKeyframe(objectRef, track.property, absoluteFrame, value)

      // Apply easing to the keyframe we just created
      const allTracks = store.getTracksForObject(objectRef)
      const targetTrack = allTracks.find(t => t.property === track.property)
      if (targetTrack) {
        const createdKf = targetTrack.keyframes.find(k => k.frame === absoluteFrame)
        if (createdKf) {
          store.updateKeyframeEasing(createdKf.id, kf.easing, kf.bezierParams)
        }
      }
    }
  }
}

/**
 * Extract keyframes from an object and create a timing template.
 */
export function extractTimingTemplate(
  objectRef: CanvasObjectRef,
  name: string,
  category: TimingTemplate['category'],
): TimingTemplate {
  const store = useKeyframeStore.getState()
  const tracks = store.getTracksForObject(objectRef)

  if (tracks.length === 0) {
    throw new Error('Object has no keyframes to extract')
  }

  // Find global frame range
  let minFrame = Infinity
  let maxFrame = -Infinity
  for (const track of tracks) {
    for (const kf of track.keyframes) {
      minFrame = Math.min(minFrame, kf.frame)
      maxFrame = Math.max(maxFrame, kf.frame)
    }
  }
  const duration = maxFrame - minFrame

  // Convert to relative timing
  const templateTracks = tracks.map(track => ({
    property: track.property,
    keyframes: track.keyframes.map(kf => ({
      relativePosition: duration > 0 ? (kf.frame - minFrame) / duration : 0,
      value: kf.value,
      valueMode: 'absolute' as const,
      easing: kf.easing,
      bezierParams: kf.bezierParams,
    })),
  }))

  return {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    category,
    description: `Extracted from ${objectRef.objectType} "${objectRef.objectId}"`,
    compatibleTypes: 'all',
    tracks: templateTracks,
    defaultDuration: duration,
    stretchable: true,
    replacesExisting: true,
    source: 'user',
  }
}

/**
 * Apply a template to multiple objects with stagger delay.
 */
export function applyStaggeredTemplate(
  template: TimingTemplate,
  objects: CanvasObjectRef[],
  startFrame: number,
  staggerFrames: number,
  duration?: number,
  currentValues?: Map<string, Record<string, number>>,
): void {
  for (let i = 0; i < objects.length; i++) {
    const objStartFrame = startFrame + i * staggerFrames
    const objId = `${objects[i].objectType}:${objects[i].objectId}`
    applyTimingTemplate(template, objects[i], objStartFrame, duration, currentValues?.get(objId))
  }
}
```

**`src/components/panels/TimingTemplatePanel.tsx`**
Panel UI for browsing and applying templates:
- Grid/list view of available templates, grouped by category (Entrance/Exit/Emphasis/Loop/Transition/Custom).
- Each template card shows: name, description, mini preview (keyframe diamond diagram), duration.
- Click to preview (shows animation on a dummy shape).
- "Apply" button applies to the selected object at the current frame.
- Duration override input (stretch/compress the template timing).
- Stagger controls: delay between applications when multiple objects are selected.
- "Save Current" button: extracts keyframes from the selected object as a new user template.
- "Import/Export" for sharing templates as JSON files.

**`src/components/ui/TimingTemplatePreview.tsx`**
Mini preview widget that renders a simplified keyframe diagram:
- Horizontal bar representing time.
- Diamond markers at keyframe positions.
- Color-coded by property (e.g., blue for position, green for opacity, orange for scale).
- Animated preview: a small dot travels along the bar showing the easing curve.

### Data Flow
```
User selects a text overlay -> opens Timing Templates panel -> clicks "Bounce In"
  -> applyTimingTemplate(bounceInTemplate, textRef, currentFrame, 25)
  -> useKeyframeStore receives setKeyframe calls:
       opacity at frame N = 0, easing: linear
       opacity at frame N+2 = 1, easing: linear
       scale at frame N = 0, easing: elastic-out
       scale at frame N+25 = 1, easing: elastic-out
  -> Timeline shows new keyframe diamonds on the text overlay tracks
  -> Playback shows the bounce-in animation

User creates a custom template:
  -> Animates a shape with keyframes (position, scale, rotation over 30 frames)
  -> Right-clicks keyframe -> "Save as Timing Template"
  -> extractTimingTemplate() converts absolute keyframes to relative timing
  -> useTimingTemplateStore.addTemplate(extracted)
  -> Template appears in the "Custom" category

User applies with stagger:
  -> Selects 5 text overlays
  -> Chooses "Slide Up" template with 5-frame stagger
  -> applyStaggeredTemplate() applies to each object offset by 5 frames:
       Text 1: starts at frame 0
       Text 2: starts at frame 5
       Text 3: starts at frame 10
       Text 4: starts at frame 15
       Text 5: starts at frame 20
  -> Creates a cascading entrance animation
```

### Architecture Notes

**Relative vs absolute values:** The `valueMode` field is crucial for template portability:
- `'absolute'`: The exact value is set (e.g., opacity = 0). Works for properties with fixed ranges like opacity (0-1).
- `'relative'`: The value is added to the object's current value (e.g., position.y += 100). Works for position offsets where the starting position varies per object.
- `'normalized'`: Maps 0-1 to the property's min/max range. Reserved for future use.

For built-in templates: opacity and scale typically use `'absolute'` mode (opacity 0->1, scale 0->1). Position uses `'relative'` mode (offset from current position). This means the same "Slide Up" template works regardless of where the object is positioned.

**Template stretching:** When `stretchable: true`, the user can override the duration. The `relativePosition` values are multiplied by the new duration to compute absolute frames. A template with 4 keyframes at positions [0, 0.3, 0.7, 1] with defaultDuration=20 maps to frames [0, 6, 14, 20]. Stretched to 40 frames: [0, 12, 28, 40].

**Conflict resolution:** When a template creates keyframes that overlap with existing ones on the same property:
- If `replacesExisting: true`: existing keyframes in the template's frame range are removed first.
- If `replacesExisting: false`: template keyframes are added alongside existing ones. The keyframe store's `setKeyframe()` handles collisions by updating the value at an existing frame.

Entrance templates should use `replacesExisting: true` (they define a complete entrance animation). Emphasis templates should use `false` (they layer on top of existing motion).

**Integration with the engine's existing `ANIMATION_PRESETS`:** The engine's `src/engine/presets.ts` already has `ANIMATION_PRESETS` with categories and keyframe generators. Timing templates are different -- presets generate keyframes procedurally (from code), while templates are serialized keyframe data. However, we should wrap existing presets as timing templates for a unified UI. Add a `fromPreset()` helper that converts an `AnimationPreset` into a `TimingTemplate`.

**Beat sync integration:** The existing `beatSync.ts` can generate keyframes aligned to music beats. A timing template applied with beat-sync mode would snap its keyframes to the nearest beat frames. This is a natural extension: `applyTimingTemplateWithBeatSync(template, objectRef, beatFrames)`. Not required for v1 but the architecture should not prevent it.

### Acceptance Criteria
- [ ] Timing Templates panel appears in the left panel tabs with 12+ built-in templates.
- [ ] Templates are grouped by category: Entrance, Exit, Emphasis, Loop, Transition.
- [ ] Clicking "Apply" on a template creates keyframes on the selected object at the playhead position.
- [ ] Applied keyframes use the template's easing types (elastic, spring, etc.).
- [ ] Duration override stretches/compresses the template timing proportionally.
- [ ] "Save Current" extracts the selected object's keyframes into a new user template.
- [ ] User-created templates persist in localStorage and appear in the Custom category.
- [ ] Stagger mode applies the template to multiple selected objects with configurable delay.
- [ ] Relative-mode values offset from the object's current position (not absolute).
- [ ] Templates work with all keyframable object types (text, media, shape, lottie, video, character).
- [ ] Undo/redo works for template application (single undo reverts all template keyframes).
- [ ] Import/export templates as JSON files for sharing.
- [ ] Mini keyframe preview renders correctly in the template card.

---

## Related

- [[feature-list]] — Features #14 Path Animation, #15 Masks, #17 Gradients, #28 Timing Templates
- [[feature-priorities]] — Path Animation (#6) and Masks (#9) are top-10 priorities, with Animation Engine category scoring
- [[PROGRESS]] — Track completion status
- [[phase-1|Phase 1: Export & Rendering]] — Previous phase
- [[phase-3|Phase 3: Audio & Voice]] — Next phase
- [[text-animation-presets-master-list]] — 400 text presets that use these animation capabilities
