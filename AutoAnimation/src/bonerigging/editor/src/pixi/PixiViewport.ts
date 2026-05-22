import { Application, Container } from 'pixi.js'
import { BoneOverlay } from './BoneOverlay'
import { RasterMesh } from './RasterMesh'
import { MeshOverlay } from './MeshOverlay'
import { WeightOverlay } from './WeightOverlay'
import { EnvelopeOverlay } from './EnvelopeOverlay'
import type { Skeleton } from '@bonerigging/core'
import type { ParsedCharacter } from '@bonerigging/core'
import type { MeshData } from '@bonerigging/core'
import type { BoneWeight } from '@bonerigging/core'
import type { Transform, Vec2 } from '@bonerigging/core'

/** A clothing layer with its own mesh, deformed positions, and texture. */
export interface ClothingRenderLayer {
  /** Unique key (e.g. 'shirt', 'pants', 'shoes') */
  id: string
  mesh: MeshData
  deformedPositions: Vec2[]
  image: HTMLImageElement
  /** Z-order relative to body mesh. Lower = behind body, higher = in front. */
  zOrder: number
  /** Optional part transform (position, scale, rotation, visibility) */
  partTransform?: { x: number; y: number; scaleX: number; scaleY: number; rotation: number; visible: boolean }
}

export interface RenderState {
  skeleton: Skeleton | null
  parsed: ParsedCharacter | null
  transform: Transform | null
  weights: BoneWeight[][] | null
  selectedJoint: string | null
  hoveredJoint: string | null
  pinnedJoints: Set<string>
  showBones: boolean
  showMesh: boolean
  showWeights: boolean
  showLabels: boolean
  editMode: boolean
  mode: 'svg' | 'raster' | null
  mesh: MeshData | null
  rasterDeformed: Vec2[] | null
  rasterImage: HTMLImageElement | null
  /** Multiplier for bone UI element sizes (joint radii, line widths).
   *  Use 1/cssScale when the canvas renders at higher resolution than display. */
  uiScale?: number
  /** Optional clothing layers rendered as separate deformable meshes. */
  clothingLayers?: ClothingRenderLayer[]
}

export class PixiViewport {
  app: Application
  private initialized = false

  // Layer containers (bottom to top)
  private rasterMeshLayer!: Container
  private clothingLayer!: Container
  private envelopeLayer!: Container
  private meshDebugLayer!: Container
  private weightLayer!: Container
  private boneLayer!: Container
  // Sub-renderers
  rasterMesh!: RasterMesh
  /** Clothing meshes keyed by layer id (e.g. 'shirt', 'pants'). */
  private clothingMeshes: Map<string, { mesh: RasterMesh; container: Container }> = new Map()
  boneOverlay!: BoneOverlay
  meshOverlay!: MeshOverlay
  weightOverlay!: WeightOverlay
  envelopeOverlay!: EnvelopeOverlay

  constructor() {
    this.app = new Application()
  }

  async init(container: HTMLElement): Promise<void> {
    await this.app.init({
      resizeTo: container,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    container.appendChild(this.app.canvas)
    this.app.canvas.style.position = 'absolute'
    this.app.canvas.style.inset = '0'
    this.app.canvas.style.zIndex = '1'

    // Create layer containers (bottom to top: body mesh → clothing → envelopes → debug → bones)
    this.rasterMeshLayer = new Container()
    this.clothingLayer = new Container()
    this.envelopeLayer = new Container()
    this.meshDebugLayer = new Container()
    this.weightLayer = new Container()
    this.boneLayer = new Container()

    this.app.stage.addChild(this.rasterMeshLayer)
    this.app.stage.addChild(this.clothingLayer)
    this.app.stage.addChild(this.envelopeLayer)
    this.app.stage.addChild(this.meshDebugLayer)
    this.app.stage.addChild(this.weightLayer)
    this.app.stage.addChild(this.boneLayer)

    // Create sub-renderers
    this.rasterMesh = new RasterMesh(this.rasterMeshLayer)
    this.boneOverlay = new BoneOverlay(this.boneLayer)
    this.meshOverlay = new MeshOverlay(this.meshDebugLayer)
    this.weightOverlay = new WeightOverlay(this.weightLayer)
    this.envelopeOverlay = new EnvelopeOverlay(this.envelopeLayer)

    this.initialized = true
  }

  render(state: RenderState): void {
    if (!this.initialized) return

    const {
      skeleton,
      parsed,
      transform,
      weights,
      selectedJoint,
      hoveredJoint,
      pinnedJoints,
      showBones,
      showMesh,
      showWeights,
      showLabels,
      editMode,
      mode,
      mesh,
      rasterDeformed,
      rasterImage,
    } = state

    // Raster mesh (body)
    if (mode === 'raster' && mesh && rasterDeformed && transform && rasterImage) {
      this.rasterMeshLayer.visible = true
      this.rasterMesh.render(mesh, rasterDeformed, transform, rasterImage)
    } else {
      this.rasterMeshLayer.visible = false
    }

    // Clothing layers — each gets its own deformable mesh
    const clothingLayers = state.clothingLayers
    if (clothingLayers && clothingLayers.length > 0 && transform) {
      this.clothingLayer.visible = true
      const activeIds = new Set<string>()

      // Sort by zOrder so PixiJS child order matches visual stacking
      const sorted = [...clothingLayers].sort((a, b) => a.zOrder - b.zOrder)
      for (const layer of sorted) {
        activeIds.add(layer.id)
        let entry = this.clothingMeshes.get(layer.id)
        if (!entry) {
          const container = new Container()
          this.clothingLayer.addChild(container)
          const rm = new RasterMesh(container)
          entry = { mesh: rm, container }
          this.clothingMeshes.set(layer.id, entry)
        }
        const pt = layer.partTransform
        if (pt && !pt.visible) {
          entry.container.visible = false
          continue
        }
        entry.container.visible = true
        entry.mesh.render(layer.mesh, layer.deformedPositions, transform, layer.image)
        // Apply part transform (position offset, scale, rotation)
        if (pt) {
          entry.container.x = pt.x * transform.scale
          entry.container.y = pt.y * transform.scale
          entry.container.scale.set(pt.scaleX, pt.scaleY)
          entry.container.rotation = (pt.rotation * Math.PI) / 180
        } else {
          entry.container.x = 0
          entry.container.y = 0
          entry.container.scale.set(1, 1)
          entry.container.rotation = 0
        }
      }

      // Hide/destroy clothing meshes no longer in the active set
      for (const [id, entry] of this.clothingMeshes) {
        if (!activeIds.has(id)) {
          entry.container.visible = false
        }
      }
    } else {
      this.clothingLayer.visible = false
    }

    // Envelopes (edit mode only)
    if (editMode && skeleton && parsed && transform) {
      this.envelopeLayer.visible = true
      this.envelopeOverlay.draw(skeleton, parsed, transform, selectedJoint)
    } else {
      this.envelopeLayer.visible = false
    }

    // Mesh debug — body wireframe (green) + clothing wireframes (cyan)
    if (showMesh && transform) {
      this.meshDebugLayer.visible = true
      if (mode === 'raster' && mesh && rasterDeformed) {
        this.meshOverlay.drawWireframe(mesh, rasterDeformed, transform)
        // Append clothing mesh wireframes in cyan
        if (clothingLayers) {
          for (const cl of clothingLayers) {
            this.meshOverlay.drawWireframeAppend(cl.mesh, cl.deformedPositions, transform, 0x00d4ff, 0.3)
          }
        }
      } else if (parsed) {
        this.meshOverlay.drawSVGPoints(parsed, transform)
      }
    } else {
      this.meshDebugLayer.visible = false
    }

    // Weights
    if (showWeights && skeleton && transform && weights) {
      this.weightLayer.visible = true
      if (mode === 'raster' && mesh && rasterDeformed) {
        this.weightOverlay.drawRaster(mesh, rasterDeformed, weights, skeleton, transform)
      } else if (parsed) {
        this.weightOverlay.drawSVG(parsed, weights, skeleton, transform)
      }
    } else {
      this.weightLayer.visible = false
    }

    // Bones
    if (showBones && skeleton && transform) {
      this.boneLayer.visible = true
      this.boneOverlay.draw(
        skeleton,
        transform,
        selectedJoint,
        hoveredJoint,
        pinnedJoints,
        editMode,
        showLabels,
        state.uiScale ?? 1,
      )
    } else {
      this.boneLayer.visible = false
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.app.canvas
  }

  destroy(): void {
    if (!this.initialized) {
      // init() hasn't finished — nothing to clean up yet.
      // The PixiCanvas cleanup handler already guards against
      // calling destroy() after a late-resolving init via the
      // `destroyed` flag, so this is safe.
      return
    }
    // Prevent double-destroy
    this.initialized = false
    try {
      this.app.destroy(true)
    } catch (_e) {
      // Swallow PixiJS internal errors during teardown
      // (e.g. _cancelResize race in some browser environments)
    }
  }
}
