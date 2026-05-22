/**
 * Pure Canvas2D frame renderer for video export.
 *
 * Draws one complete frame of the composition to an offscreen canvas
 * using Canvas2D APIs. No DOM required — reads all data from the
 * serialized VideoCompositionProps.
 *
 * Layer draw order (matching VideoCanvas.tsx):
 *  0. Background fill
 *  1. Background Lottie animations
 *  2. Media images (with keyframe interpolation)
 *  3. Shapes (rect, circle, triangle, star)
 *  4. Video layers
 *  5. Characters (body → viseme → eye → eyebrow → hair → shirt → pants → shoes)
 *  6. Text overlays (with keyframe interpolation)
 *  7. Overlay Lottie animations
 *  8. Captions (word-by-word / sentence / karaoke)
 */

import type { VideoCompositionProps, ShapeLayerData, TextOverlayData, CaptionData, KeyframeExportData, HTMLTemplateExportData, RigExportData, MotionGraphicExportData, MaskData } from '@/remotion/types'
import { computeTemplateDimensions } from '@/stores/useHTMLTemplateLayerStore'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { autoRemapClip } from '@/services/gltfUtils'
import type { Viseme, VisemeEvent } from '@/types/voice'
import type { EmotionEvent } from '@/services/emotionTimeline'
import { getCurvatureFromEmotion } from '@/services/emotionMapping'
import { resolveVisemeSprite } from '@/services/visemeMapper'
import { interpolatePropertyKeyframes } from '@/services/interpolation'
import type { PropertyKeyframe } from '@/types/keyframes'
import type { EasingType } from '@/types/keyframes'
import type { AnimationItem as LottieAnimationItem } from 'lottie-web'
import { useCharacterPartsStore, type LayerPart } from '@/stores/useCharacterPartsStore'
import type { BoneSkeleton, BonePose, MeshData, VertexSkinning, BonePoseKeyframe } from '@/types/rig'
import { buildVariableWidthSVG } from '@/services/artCurveGenerator'
import { generateGridMesh, generateAlphaAwareMesh } from '@/services/meshGenerator'
import { computeSkinningWeights, deformMesh } from '@/services/meshDeformer'
import { renderMeshToCanvas, computeAffineTransform } from '@/services/meshRenderer'
import { getPoseAtFrame } from '@/services/poseInterpolation'
import { BoneRiggingPlaybackEngine } from '@/services/boneriggingPlayback'
import type { SerializedRigData } from '@bonerigging/core'
import { evaluatePath, evaluatePathArcLength } from '@/engine/path'
import { applyEasing } from '@/services/interpolation'
import { buildCanvasGradient } from '@/services/gradientRenderer'
import { applyVectorMask } from '@/services/maskRenderer'
import type { GradientFill } from '@/types/gradient'
import {
  useCameraStore,
  type CameraTransform,
} from '@/stores/useCameraStore'

// ── Camera transform for export ───────────────────────────────────────

/**
 * Compute the full camera transform at a given frame for export rendering.
 * Reads camera state from useCameraStore and combines keyframes + shake + focus pull.
 * Returns identity transform when camera is disabled.
 */
function getExportCameraTransform(frame: number, fps: number): CameraTransform {
  const state = useCameraStore.getState()
  if (!state.enabled) {
    return { zoom: 1, panX: 0, panY: 0, rotation: 0 }
  }
  return state.getCameraAtFrame(frame, fps)
}

/**
 * Returns true if the camera has any active effects that need to be applied.
 */
function isCameraActive(): boolean {
  const state = useCameraStore.getState()
  return state.enabled && (
    state.keyframes.length > 0 ||
    state.shakes.length > 0 ||
    state.focusPull !== null
  )
}

/**
 * Apply camera transform to a Canvas2D context.
 * Translates origin to center, applies scale/translate/rotate, then translates back.
 * Must be paired with ctx.restore() after drawing camera-affected layers.
 */
function applyCameraTransform(
  ctx: CanvasRenderingContext2D,
  cam: CameraTransform,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const translateX = (cam.panX / 100) * canvasWidth
  const translateY = (cam.panY / 100) * canvasHeight

  // Move origin to center of canvas
  ctx.translate(canvasWidth / 2, canvasHeight / 2)
  // Apply zoom
  ctx.scale(cam.zoom, cam.zoom)
  // Apply rotation (convert degrees to radians)
  ctx.rotate((cam.rotation * Math.PI) / 180)
  // Apply pan (negative because we move the "camera", not the scene)
  ctx.translate(-translateX, -translateY)
  // Move origin back
  ctx.translate(-canvasWidth / 2, -canvasHeight / 2)
}

// ── Image cache for pre-loaded assets ─────────────────────────────────

export type ImageCache = Map<string, HTMLImageElement | HTMLCanvasElement>

/**
 * Pre-load all image URLs from the composition props into an ImageCache.
 * Returns a promise that resolves when all images are loaded.
 */
export async function preloadImages(
  props: VideoCompositionProps,
): Promise<ImageCache> {
  const cache: ImageCache = new Map()
  const urls = new Set<string>()

  // Character sprites
  const { savedImages, curvedVisemes } = props.character
  for (const part of ['body', 'head', 'viseme', 'eye', 'eyebrow', 'hair', 'shirt', 'pants', 'shoes'] as const) {
    for (const url of savedImages[part] || []) {
      if (url) urls.add(url)
    }
  }
  // Curved visemes
  if (curvedVisemes) {
    for (const url of Object.values(curvedVisemes)) {
      if (url) urls.add(url)
    }
  }

  // Dialogue character sprites
  if (props.dialogueCharacters) {
    for (const dc of props.dialogueCharacters) {
      const dcSprites = dc.savedCharacter.savedImages
      for (const part of ['body', 'head', 'viseme', 'eye', 'eyebrow', 'hair', 'shirt', 'pants', 'shoes'] as const) {
        for (const url of dcSprites[part] || []) {
          if (url) urls.add(url)
        }
      }
      if (dc.savedCharacter.curvedVisemes) {
        for (const url of Object.values(dc.savedCharacter.curvedVisemes)) {
          if (url) urls.add(url)
        }
      }
    }
  }

  // Media images
  if (props.mediaItems) {
    for (const item of props.mediaItems) {
      if (item.imageUrl) urls.add(item.imageUrl)
    }
  }

  // Also collect visemeSpriteMap URLs
  if (props.character.visemeSpriteMap) {
    for (const url of Object.values(props.character.visemeSpriteMap)) {
      if (url) urls.add(url)
    }
  }
  if (props.dialogueCharacters) {
    for (const dc of props.dialogueCharacters) {
      if (dc.savedCharacter.visemeSpriteMap) {
        for (const url of Object.values(dc.savedCharacter.visemeSpriteMap)) {
          if (url) urls.add(url)
        }
      }
    }
  }

  // Load all images in parallel
  const loadPromises = Array.from(urls).map(async (url) => {
    try {
      const img = new Image()
      // Only set crossOrigin for remote URLs — blob: and data: URLs are
      // same-origin and setting crossOrigin can actually break them
      if (!url.startsWith('blob:') && !url.startsWith('data:')) {
        img.crossOrigin = 'anonymous'
      }
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error(`Failed to load: ${url}`))
        img.src = url
      })
      cache.set(url, img)
    } catch {
      // Skip failed images silently
      console.warn(`[canvas2dRenderer] Failed to load image: ${url.slice(0, 80)}...`)
    }
  })

  // Art curve compositions → render SVG to cached images
  if (props.artCurves) {
    for (const comp of props.artCurves) {
      if (!comp.visible || comp.curves.length === 0) continue
      const svgString = buildVariableWidthSVG(comp.curves, 800, 600, false)
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      loadPromises.push(
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            cache.set(`__artcurve__${comp.id}`, img)
            URL.revokeObjectURL(url)
            resolve()
          }
          img.onerror = () => {
            URL.revokeObjectURL(url)
            resolve()
          }
          img.src = url
        })
      )
    }
  }

  // Brand watermark preload
  try {
    const { useBrandKitStore } = await import('@/stores/useBrandKitStore')
    const kit = useBrandKitStore.getState().getActiveBrandKit()
    if (kit?.watermarkUrl) {
      const wmUrl = kit.watermarkUrl
      loadPromises.push(
        (async () => {
          try {
            const img = new Image()
            if (!wmUrl.startsWith('blob:') && !wmUrl.startsWith('data:')) {
              img.crossOrigin = 'anonymous'
            }
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve()
              img.onerror = () => reject(new Error('Failed to load watermark'))
              img.src = wmUrl
            })
            cache.set('__brand_watermark__', img)
          } catch {
            // Skip silently
          }
        })()
      )
    }
  } catch {
    // Brand kit store not available
  }

  await Promise.all(loadPromises)
  return cache
}

// ── Lottie pre-loader ──────────────────────────────────────────────────

export interface LottieExportInstance {
  anim: LottieAnimationItem
  canvas: HTMLCanvasElement
  totalFrames: number
}

/**
 * Pre-load Lottie animations for export. Creates hidden canvas-rendered
 * lottie-web instances that can be seeked frame-by-frame.
 */
export async function preloadLottieAnimations(
  props: VideoCompositionProps,
): Promise<Map<string, LottieExportInstance>> {
  const lottieMap = new Map<string, LottieExportInstance>()

  if (!props.animations || props.animations.length === 0) return lottieMap

  // Dynamically import lottie-web
  let lottie: typeof import('lottie-web').default
  try {
    lottie = (await import('lottie-web')).default
  } catch {
    console.warn('[canvas2dRenderer] lottie-web not available, Lottie layers will be skipped')
    return lottieMap
  }

  for (const anim of props.animations) {
    if (!anim.url) continue

    try {
      const canvas = document.createElement('canvas')
      canvas.width = props.width
      canvas.height = props.height

      const animInstance = lottie.loadAnimation({
        container: canvas,
        renderer: 'canvas',
        loop: false,
        autoplay: false,
        path: anim.url,
        rendererSettings: {
          context: canvas.getContext('2d')!,
          clearCanvas: true,
        },
      })

      await new Promise<void>((resolve, reject) => {
        animInstance.addEventListener('DOMLoaded', () => resolve())
        animInstance.addEventListener('error', () => reject(new Error('Lottie load error')))
        // Timeout after 10s
        setTimeout(() => resolve(), 10000)
      })

      lottieMap.set(anim.id, {
        anim: animInstance,
        canvas,
        totalFrames: animInstance.totalFrames || 300,
      })
    } catch {
      console.warn(`[canvas2dRenderer] Failed to load Lottie: ${anim.url.slice(0, 80)}`)
    }
  }

  return lottieMap
}

// ── Video element pre-loader ───────────────────────────────────────────

export async function preloadVideoElements(
  props: VideoCompositionProps,
): Promise<Map<string, HTMLVideoElement>> {
  const videoMap = new Map<string, HTMLVideoElement>()

  if (!props.videos || props.videos.length === 0) return videoMap

  const loadPromises = props.videos
    .filter(v => v.visible && v.sourceUrl)
    .map(async (v) => {
      try {
        const video = document.createElement('video')
        video.muted = true
        video.preload = 'auto'
        video.playsInline = true
        video.crossOrigin = 'anonymous'
        video.src = v.sourceUrl

        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve()
          video.onerror = () => reject(new Error('Video load error'))
          setTimeout(() => resolve(), 10000)
        })

        videoMap.set(v.id, video)
      } catch {
        console.warn(`[canvas2dRenderer] Failed to load video: ${v.sourceUrl.slice(0, 80)}`)
      }
    })

  await Promise.all(loadPromises)
  return videoMap
}

// ── 3D Character offscreen renderer ───────────────────────────────────

export interface ThreeExportInstance {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  canvas: HTMLCanvasElement
  characters: Map<string, {
    group: THREE.Group
    mixer: THREE.AnimationMixer | null
    clips: THREE.AnimationClip[]
    animationSpeed: number
  }>
}

/**
 * Pre-load 3D character GLBs and set up an offscreen Three.js renderer.
 * Returns null if no 3D characters to render.
 */
export async function preloadThreeScene(
  props: VideoCompositionProps,
): Promise<ThreeExportInstance | null> {
  if (!props.characters3D || props.characters3D.length === 0) return null

  const visible = props.characters3D.filter(c => c.visible)
  if (visible.length === 0) return null

  // Create offscreen WebGL canvas
  const canvas = document.createElement('canvas')
  canvas.width = props.width
  canvas.height = props.height

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  })
  renderer.setSize(props.width, props.height)
  renderer.setClearColor(0x000000, 0)

  // Scene setup — matches ThreeCanvas.tsx lighting
  const scene = new THREE.Scene()

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.5))

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0)
  keyLight.position.set(4, 6, 4)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
  fillLight.position.set(-3, 4, 2)
  scene.add(fillLight)

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.5)
  rimLight.position.set(0, 4, -4)
  scene.add(rimLight)

  const hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.25)
  scene.add(hemiLight)

  // Camera — matches ThreeCanvas front-facing camera
  const camera = new THREE.PerspectiveCamera(
    45,
    props.width / props.height,
    0.01,
    1000,
  )
  camera.position.set(0, 1, 5)
  camera.lookAt(0, 1, 0)

  // Load GLBs
  const loader = new GLTFLoader()
  const characters = new Map<string, {
    group: THREE.Group
    mixer: THREE.AnimationMixer | null
    clips: THREE.AnimationClip[]
    animationSpeed: number
  }>()

  for (const char of visible) {
    try {
      // Load GLB — support both base64 (final export) and blob URL (preview)
      let arrayBuffer: ArrayBuffer
      if (char.glbBase64) {
        const binary = atob(char.glbBase64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        arrayBuffer = bytes.buffer
      } else if (char.glbUrl) {
        const response = await fetch(char.glbUrl)
        arrayBuffer = await response.arrayBuffer()
      } else {
        continue // No GLB data available
      }

      const gltf = await new Promise<any>((resolve, reject) => {
        loader.parse(arrayBuffer, '', resolve, reject)
      })

      const clonedScene = gltf.scene.clone(true)
      // Rebind SkinnedMesh skeletons so bones reference the cloned scene-graph objects.
      // Without this, skeleton.bones are stale copies that the AnimationMixer never touches.
      // (Matches Character3DRenderer.tsx's cloning approach)
      clonedScene.traverse((child: any) => {
        if (child.isSkinnedMesh) {
          child.frustumCulled = false

          const oldSkeleton = child.skeleton
          if (oldSkeleton) {
            const newBones: THREE.Bone[] = []
            for (const oldBone of oldSkeleton.bones) {
              const sceneGraphBone = clonedScene.getObjectByName(oldBone.name)
              if (sceneGraphBone && (sceneGraphBone as THREE.Bone).isBone) {
                newBones.push(sceneGraphBone as THREE.Bone)
              } else {
                newBones.push(oldBone)
              }
            }
            child.skeleton = new THREE.Skeleton(newBones, oldSkeleton.boneInverses.map((m: THREE.Matrix4) => m.clone()))
            child.bind(child.skeleton)
          }
        }
      })

      // Auto-fit: normalize scale so model fits ~1.8 units tall
      // (matches Character3DRenderer.tsx / Remotion3DCharacter.tsx)
      const box = new THREE.Box3().setFromObject(clonedScene)
      const modelSize = new THREE.Vector3()
      box.getSize(modelSize)
      const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z)
      const TARGET_HEIGHT = 1.8
      const autoScale = maxDim > 0 ? TARGET_HEIGHT / maxDim : 1
      const yOffset = -box.min.y

      // Inner group for auto-scale + y-offset centering
      const innerGroup = new THREE.Group()
      innerGroup.scale.setScalar(autoScale)
      innerGroup.position.set(0, yOffset * autoScale, 0)
      innerGroup.add(clonedScene)

      // Outer group for user position/rotation/scale
      const group = new THREE.Group()
      group.position.set(char.position.x, char.position.y, char.position.z)
      group.rotation.set(char.rotation.x, char.rotation.y, char.rotation.z)
      group.scale.setScalar(char.scale)
      group.add(innerGroup)
      scene.add(group)

      // Set up animation
      let mixer: THREE.AnimationMixer | null = null
      let clips: THREE.AnimationClip[] = []

      // Check for external animation GLB (base64 or blob URL)
      let animArrayBuffer: ArrayBuffer | null = null
      if (char.activeAnimationGlbBase64) {
        const animBinary = atob(char.activeAnimationGlbBase64)
        const animBytes = new Uint8Array(animBinary.length)
        for (let i = 0; i < animBinary.length; i++) {
          animBytes[i] = animBinary.charCodeAt(i)
        }
        animArrayBuffer = animBytes.buffer
      } else if (char.activeAnimationGlbUrl) {
        const animResponse = await fetch(char.activeAnimationGlbUrl)
        animArrayBuffer = await animResponse.arrayBuffer()
      }
      if (animArrayBuffer) {
        const animGltf = await new Promise<any>((resolve, reject) => {
          loader.parse(animArrayBuffer!, '', resolve, reject)
        })
        if (animGltf.animations?.length) {
          // Remap external animation bone names to match the character's skeleton
          // (matches Character3DRenderer.tsx's autoRemapClip approach)
          const modelBoneNames: string[] = []
          clonedScene.traverse((obj: THREE.Object3D) => {
            if ((obj as THREE.Bone).isBone) modelBoneNames.push(obj.name)
          })
          clips = animGltf.animations.map((clip: THREE.AnimationClip) =>
            autoRemapClip(clip.clone(), char.boneMapping || {}, modelBoneNames)
          )
        }
      }

      // Fall back to model's built-in animations
      if (clips.length === 0 && gltf.animations?.length) {
        clips = gltf.animations
      }

      if (clips.length > 0) {
        mixer = new THREE.AnimationMixer(clonedScene)
        const action = mixer.clipAction(clips[0], clonedScene)
        action.setEffectiveTimeScale(char.animationSpeed)
        action.play()
      }

      characters.set(char.id, {
        group,
        mixer,
        clips,
        animationSpeed: char.animationSpeed,
      })
    } catch (err) {
      console.warn(`[canvas2dRenderer] Failed to load 3D character "${char.id}":`, err)
    }
  }

  if (characters.size === 0) {
    renderer.dispose()
    return null
  }

  return { renderer, scene, camera, canvas, characters }
}

/**
 * Render all 3D characters for a specific frame and composite onto the 2D canvas.
 */
function draw3DCharacterLayers(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
  threeInstance: ThreeExportInstance | null,
): void {
  if (!threeInstance || !props.characters3D) return

  const { renderer, scene, camera, canvas: threeCanvas, characters } = threeInstance

  // Seek all animations to the correct frame time
  for (const char of props.characters3D) {
    if (!char.visible) continue
    const entry = characters.get(char.id)
    if (!entry?.mixer) continue

    // Don't multiply by animationSpeed here — it's already applied via
    // action.setEffectiveTimeScale() during mixer setup (preloadThreeScene).
    // Applying it here too would cause double-speed.
    const timeInSeconds = (frame - char.animationStartFrame) / props.fps
    entry.mixer.setTime(Math.max(0, timeInSeconds))
    // Force PropertyBindings to evaluate and write transforms to bones.
    // setTime() alone resets the mixer clock but update(0) is needed
    // to actually apply the interpolated values to the scene graph.
    entry.mixer.update(0)
  }

  // Render Three.js scene
  renderer.render(scene, camera)

  // Composite the WebGL canvas onto the 2D canvas
  ctx.drawImage(threeCanvas, 0, 0)
}

/**
 * Clean up Three.js resources when export is done.
 */
export function disposeThreeScene(instance: ThreeExportInstance | null): void {
  if (!instance) return
  instance.renderer.dispose()
  instance.scene.traverse((obj: any) => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m: any) => m.dispose())
      } else {
        obj.material.dispose()
      }
    }
  })
}

// ── 2D Rigged Character preloader & renderer ──────────────────────────

export interface RigExportInstance {
  rigId: string
  texture: HTMLImageElement
  mesh: MeshData
  skinning: VertexSkinning
  skeleton: BoneSkeleton
  restPose: BonePose
  poseTracks: Array<{
    characterId: string
    keyframes: BonePoseKeyframe[]
  }>
  brEngine: BoneRiggingPlaybackEngine | null
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

/**
 * Pre-load a single RigExportData into a RigExportInstance.
 * Shared helper for both standalone rigs and dialogue character rigs.
 */
async function preloadSingleRig(rig: RigExportData): Promise<RigExportInstance> {
  // Load texture image
  const texture = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = rig.sourceImageUrl
  })

  // Build skeleton
  const skeleton: BoneSkeleton = {
    joints: rig.skeleton.joints.map((j) => ({
      id: j.id,
      name: j.name,
      parentId: j.parentId,
      restPosition: j.restPosition,
      category: j.category as any,
    })),
    rootJointId: rig.skeleton.rootJointId,
  }

  // Initialize bonerigging playback engine if available
  let brEngine: BoneRiggingPlaybackEngine | null = null
  if (rig.boneriggingSerializedData) {
    try {
      const serialized = JSON.parse(rig.boneriggingSerializedData) as SerializedRigData
      brEngine = new BoneRiggingPlaybackEngine(serialized)
    } catch (err) {
      console.warn('[canvas2dRenderer] Failed to init bonerigging engine for rig', rig.id, err)
    }
  }

  // Generate LBS mesh + skinning (fallback when no bonerigging data)
  // Use alpha-aware mesh to avoid transparent-area triangles stretching across body parts
  // Pass imageData to skinning for alpha-barrier checks (prevents cross-body-part bleed)
  let mesh: MeshData
  let imgData: ImageData | undefined
  try {
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = texture.width
    tmpCanvas.height = texture.height
    const tmpCtx = tmpCanvas.getContext('2d')!
    tmpCtx.drawImage(texture, 0, 0)
    imgData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height)
    mesh = generateAlphaAwareMesh(imgData, rig.meshGridSpacing)
  } catch {
    mesh = generateGridMesh(rig.imageWidth, rig.imageHeight, rig.meshGridSpacing)
  }
  const skinning = computeSkinningWeights(mesh, skeleton, undefined, imgData)

  // Create offscreen canvas for rendering
  const canvas = document.createElement('canvas')
  canvas.width = rig.imageWidth
  canvas.height = rig.imageHeight
  const ctx = canvas.getContext('2d')!

  // Build typed pose tracks
  const poseTracks = rig.poseTracks.map((track) => ({
    characterId: track.characterId,
    keyframes: track.keyframes.map((kf, i) => ({
      id: `kf-${i}`,
      frame: kf.frame,
      pose: kf.pose,
      easing: (kf.easing || 'ease-in-out') as EasingType,
    })),
  }))

  return {
    rigId: rig.id,
    texture,
    mesh,
    skinning,
    skeleton,
    restPose: rig.restPose,
    poseTracks,
    brEngine,
    canvas,
    ctx,
  }
}

/**
 * Pre-load 2D rigged character data: texture images, mesh, skinning weights.
 * Handles BOTH standalone rigs (props.rigData) AND rigged dialogue characters
 * (props.dialogueCharacters with renderMode === 'rigged').
 * Returns a map of rigId → RigExportInstance, or null if no rig data.
 */
export async function preloadRiggedCharacters(
  props: VideoCompositionProps,
): Promise<Map<string, RigExportInstance> | null> {
  const instances = new Map<string, RigExportInstance>()

  // Standalone rigs
  if (props.rigData && props.rigData.length > 0) {
    for (const rig of props.rigData) {
      try {
        const instance = await preloadSingleRig(rig)
        instances.set(rig.id, instance)
      } catch (err) {
        console.warn(`[canvas2dRenderer] Failed to preload rigged character "${rig.id}":`, err)
      }
    }
  }

  // Rigged dialogue characters
  if (props.dialogueCharacters) {
    for (const dc of props.dialogueCharacters) {
      if (dc.renderMode === 'rigged' && dc.rigExportData && !instances.has(dc.rigExportData.id)) {
        try {
          const instance = await preloadSingleRig(dc.rigExportData)
          instances.set(dc.rigExportData.id, instance)
        } catch (err) {
          console.warn(`[canvas2dRenderer] Failed to preload rigged dialogue character "${dc.id}":`, err)
        }
      }
    }
  }

  return instances.size > 0 ? instances : null
}

/**
 * Render a bonerigging mesh directly using its own vertex/UV/triangle data.
 * This avoids the mesh mismatch with AutoStudio's generateGridMesh.
 */
function renderBoneriggingMeshToCanvas(
  ctx: CanvasRenderingContext2D,
  brEngine: BoneRiggingPlaybackEngine,
  deformedPositions: { x: number; y: number }[],
  texture: HTMLImageElement,
): void {
  const brMesh = brEngine.getMeshData()
  if (!brMesh) return

  const imgW = texture.width
  const imgH = texture.height
  const { triangles, uvs } = brMesh

  for (const tri of triangles) {
    const i0 = tri.v0
    const i1 = tri.v1
    const i2 = tri.v2

    const srcX0 = uvs[i0].u * imgW
    const srcY0 = uvs[i0].v * imgH
    const srcX1 = uvs[i1].u * imgW
    const srcY1 = uvs[i1].v * imgH
    const srcX2 = uvs[i2].u * imgW
    const srcY2 = uvs[i2].v * imgH

    const dstX0 = deformedPositions[i0].x
    const dstY0 = deformedPositions[i0].y
    const dstX1 = deformedPositions[i1].x
    const dstY1 = deformedPositions[i1].y
    const dstX2 = deformedPositions[i2].x
    const dstY2 = deformedPositions[i2].y

    const transform = computeAffineTransform(
      srcX0, srcY0, srcX1, srcY1, srcX2, srcY2,
      dstX0, dstY0, dstX1, dstY1, dstX2, dstY2,
    )
    if (!transform) continue

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(dstX0, dstY0)
    ctx.lineTo(dstX1, dstY1)
    ctx.lineTo(dstX2, dstY2)
    ctx.closePath()
    ctx.clip()
    ctx.setTransform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f)
    ctx.drawImage(texture, 0, 0)
    ctx.restore()
  }
}

/**
 * Render a single rig instance for the given frame onto its offscreen canvas.
 * Handles both bonerigging (animation playback) and LBS fallback paths.
 */
function renderRigInstanceFrame(instance: RigExportInstance, frame: number, fps: number = 30): void {
  instance.ctx.clearRect(0, 0, instance.canvas.width, instance.canvas.height)
  instance.ctx.resetTransform()

  if (instance.brEngine) {
    // BoneRigging full-fidelity path — use the engine's own mesh
    let deformedPositions: { x: number; y: number }[]

    if (instance.brEngine.animationCount > 0) {
      // Play the first animation at the current frame time
      const time = frame / fps
      deformedPositions = instance.brEngine.getDeformedMeshAtTime(0, time)
    } else {
      // No animations — render rest pose
      deformedPositions = instance.brEngine.getRestPositions()
    }

    renderBoneriggingMeshToCanvas(instance.ctx, instance.brEngine, deformedPositions, instance.texture)
  } else {
    // Standard LBS fallback
    let currentPose = instance.restPose
    if (instance.poseTracks.length > 0) {
      const track = instance.poseTracks[0]
      if (track.keyframes.length > 0) {
        const interpolated = getPoseAtFrame(track.keyframes, frame)
        if (interpolated) currentPose = interpolated
      }
    }

    deformMesh(instance.mesh, instance.skinning, instance.skeleton, instance.restPose, currentPose)
    renderMeshToCanvas(instance.ctx, instance.mesh, instance.texture)
  }
}

/**
 * Render all 2D rigged characters (standalone) for a specific frame and composite onto the main canvas.
 */
function drawRiggedCharacterLayers(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
  rigInstances: Map<string, RigExportInstance> | null,
): void {
  if (!rigInstances || !props.rigData) return

  for (const rig of props.rigData) {
    const instance = rigInstances.get(rig.id)
    if (!instance) continue

    renderRigInstanceFrame(instance, frame, props.fps)

    // Composite onto the main canvas
    ctx.drawImage(instance.canvas, 0, 0)
  }
}

/**
 * Draw a rigged dialogue character — renders the rig body mesh AND
 * sprite overlays (eye, eyebrow, viseme, hair, shirt, pants, shoes) on top,
 * matching how CharacterLayer.tsx renders all 8 layers with the body replaced by the rig mesh.
 */
function drawRiggedDialogueCharacter(
  ctx: CanvasRenderingContext2D,
  dc: NonNullable<VideoCompositionProps['dialogueCharacters']>[number],
  frame: number,
  instance: RigExportInstance,
  imageCache: ImageCache,
  keyframeData?: KeyframeExportData,
  kfIndex?: KeyframeIndex,
): void {
  // Render rig mesh for this frame
  renderRigInstanceFrame(instance, frame)

  // Position/scale from dialogue character (center-based pixels)
  let posX = dc.position.x
  let posY = dc.position.y
  let scale = dc.scale

  // Apply keyframe overrides
  if (keyframeData) {
    posX = getKeyframeValue(keyframeData, 'dialogueCharacter', dc.id, 'position.x', frame, kfIndex) ?? posX
    posY = getKeyframeValue(keyframeData, 'dialogueCharacter', dc.id, 'position.y', frame, kfIndex) ?? posY
    const kfScale = getKeyframeValue(keyframeData, 'dialogueCharacter', dc.id, 'scale', frame, kfIndex)
    if (kfScale !== undefined) scale = kfScale
  }

  // Use stored boundsWidth so X-centering matches the live canvas (computedBounds-based)
  const rigW = instance.canvas.width
  const rigH = instance.canvas.height
  const displayW = (dc.boundsWidth ?? BASE_CHARACTER_SIZE) * scale
  const cssScale = displayW / rigW

  // 1. Draw rig body mesh (X: centered on posX via boundsWidth; Y: centered on rig image height)
  ctx.save()
  ctx.translate(posX - displayW / 2, posY - (rigH * cssScale) / 2)
  ctx.scale(cssScale, cssScale)
  ctx.drawImage(instance.canvas, 0, 0)
  ctx.restore()

  // 2. Draw sprite overlays on top (same logic as drawDialogueCharacter,
  //    but skip the body layer since it's rendered by the rig mesh above)
  const character = dc.savedCharacter
  const { savedImages, transforms, selectedSprites } = character

  const hairImages = savedImages.hair || []
  const shirtImages = savedImages.shirt || []
  const pantsImages = savedImages.pants || []
  const shoesImages = savedImages.shoes || []
  const displayHair = (selectedSprites.hair !== null ? hairImages[selectedSprites.hair] : null) || hairImages[0] || null
  const displayShirt = (selectedSprites.shirt !== null ? shirtImages[selectedSprites.shirt] : null) || shirtImages[0] || null
  const displayPants = (selectedSprites.pants !== null ? pantsImages[selectedSprites.pants] : null) || pantsImages[0] || null
  const displayShoes = (selectedSprites.shoes !== null ? shoesImages[selectedSprites.shoes] : null) || shoesImages[0] || null

  // Get viseme/emotion at current frame (need to find active dialogue line first)
  const activeLine = dc.dialogueLines.find(
    l => frame >= l.startFrame && frame < l.endFrame
  )
  const relativeFrame = activeLine ? frame - activeLine.startFrame : 0
  const visemeTimeline = activeLine?.visemeTimeline || []
  const emotionTimeline = activeLine?.emotionTimeline || []
  const currentViseme = getVisemeAtFrame(visemeTimeline, relativeFrame, dc.id)
  const currentEmotion = getEmotionAtFrame(emotionTimeline, relativeFrame, dc.id)
  const displayVisemeUrl = getVisemeSpriteUrl(character, currentViseme, currentEmotion)

  const displaySize = BASE_CHARACTER_SIZE * scale
  const layerOrder: LayerPart[] = useCharacterPartsStore.getState().layerOrder
  const spriteMap: Record<LayerPart, string | null> = {
    body: null, // body is rendered by rig mesh — skip
    head: null, // head is baked into rig composite — skip
    eye: null, // eye is baked into rig composite — skip
    eyebrow: null, // eyebrow is baked into rig composite — skip
    viseme: displayVisemeUrl,
    hair: displayHair,
    shirt: displayShirt,
    pants: displayPants,
    shoes: displayShoes,
  }

  ctx.save()
  ctx.translate(posX, posY)

  for (const part of layerOrder) {
    if (part === 'body') continue // Skip body — already rendered by rig mesh
    const src = spriteMap[part]
    const transform = transforms[part]
    if (!transform || !transform.visible || !src) continue
    const img = imageCache.get(src)
    if (!img) continue

    ctx.save()
    ctx.translate(transform.x * scale, transform.y * scale)
    ctx.rotate((transform.rotation * Math.PI) / 180)
    ctx.scale(transform.scaleX, transform.scaleY)

    // Draw image to fill the character's display size (object-contain behavior)
    const imgW = img instanceof HTMLCanvasElement ? img.width : (img as HTMLImageElement).naturalWidth || img.width
    const imgH = img instanceof HTMLCanvasElement ? img.height : (img as HTMLImageElement).naturalHeight || img.height
    const fitScale = Math.min(displaySize / imgW, displaySize / imgH)
    const drawW = imgW * fitScale
    const drawH = imgH * fitScale
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()
  }

  ctx.restore()
}

// ── HTML Template iframe preloader ────────────────────────────────────

export interface TemplateExportInstance {
  iframe: HTMLIFrameElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  template: HTMLTemplateExportData
  /** Whether the template's TEMPLATE_READY message was received */
  ready: boolean
}

/**
 * Pre-load HTML templates by creating hidden iframes with same-origin access.
 * Each template gets its own offscreen iframe + capture canvas.
 * Returns a map from template ID to TemplateExportInstance.
 */
export async function preloadHTMLTemplates(
  props: VideoCompositionProps,
): Promise<Map<string, TemplateExportInstance>> {
  const templateMap = new Map<string, TemplateExportInstance>()

  if (!props.htmlTemplates || props.htmlTemplates.length === 0) return templateMap

  const loadPromises = props.htmlTemplates
    .filter(t => t.visible)
    .map(async (template) => {
      try {
        // Compute template's native dimensions (for rendering at correct resolution)
        const dims = computeTemplateDimensions(
          template.templateAspectRatio,
          props.width,
          props.height,
          1, // scale=1 for native resolution
        )

        // Create a hidden iframe (same-origin via srcdoc + allow-same-origin)
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.left = '-9999px'
        iframe.style.top = '-9999px'
        iframe.style.width = `${dims.nativeWidth}px`
        iframe.style.height = `${dims.nativeHeight}px`
        iframe.style.border = 'none'
        iframe.style.visibility = 'hidden'
        iframe.style.pointerEvents = 'none'
        // allow-same-origin is critical: it lets us access contentDocument for capture
        iframe.sandbox.add('allow-scripts')
        iframe.sandbox.add('allow-same-origin')

        // Create a capture canvas at template's native resolution
        const captureCanvas = document.createElement('canvas')
        captureCanvas.width = dims.nativeWidth
        captureCanvas.height = dims.nativeHeight
        const captureCtx = captureCanvas.getContext('2d')!

        // Listen for TEMPLATE_READY message
        const instance: TemplateExportInstance = {
          iframe,
          canvas: captureCanvas,
          ctx: captureCtx,
          template,
          ready: false,
        }

        const readyPromise = new Promise<void>((resolve) => {
          const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'TEMPLATE_READY') {
              instance.ready = true
              window.removeEventListener('message', handleMessage)
              resolve()
            }
          }
          window.addEventListener('message', handleMessage)
          // Timeout after 10s
          setTimeout(() => {
            instance.ready = true // Assume ready even if message not received
            window.removeEventListener('message', handleMessage)
            resolve()
          }, 10000)
        })

        // Append iframe to document and set content
        document.body.appendChild(iframe)
        iframe.srcdoc = template.htmlContent

        // Wait for iframe to load
        await new Promise<void>((resolve) => {
          iframe.onload = () => resolve()
          setTimeout(resolve, 10000) // Timeout fallback
        })

        // Wait for TEMPLATE_READY
        await readyPromise

        // Send initial config values
        if (template.customConfig.length > 0 && iframe.contentWindow) {
          const values: Record<string, unknown> = {}
          for (const prop of template.customConfig) {
            values[prop.key] = prop.value
          }
          iframe.contentWindow.postMessage(
            { type: 'CONFIG_BULK_UPDATE', values },
            '*'
          )
          // Small delay to let config apply
          await new Promise(r => setTimeout(r, 100))
        }

        templateMap.set(template.id, instance)
      } catch (err) {
        console.warn(`[canvas2dRenderer] Failed to preload template "${template.name}":`, err)
      }
    })

  await Promise.all(loadPromises)
  return templateMap
}

/**
 * Send a FRAME_UPDATE to a template iframe and capture its rendered state.
 * Tries three approaches in order:
 * 1. Find an internal <canvas> element and draw from it (fastest, best for canvas-based templates)
 * 2. Use html2canvas to capture the iframe's document body (works for HTML/CSS templates)
 * 3. Fall back to a simple background color capture
 */
async function captureTemplateFrame(
  instance: TemplateExportInstance,
  frame: number,
  fps: number,
  totalFrames: number,
  isPlaying: boolean,
): Promise<void> {
  const { iframe, canvas, ctx, template } = instance

  if (!iframe.contentWindow) return

  // Send FRAME_UPDATE to advance the template's animation state
  if (template.frameSync) {
    iframe.contentWindow.postMessage({
      type: 'FRAME_UPDATE',
      currentFrame: frame,
      isPlaying,
      fps,
      totalFrames,
    }, '*')

    // Give the template a moment to process the frame update
    // Most templates use requestAnimationFrame internally, so we wait one tick
    await new Promise(r => setTimeout(r, 16))
  }

  // Clear capture canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  try {
    const doc = iframe.contentDocument
    if (!doc) throw new Error('No contentDocument access')

    // Strategy 1: Look for a main <canvas> element inside the template
    const internalCanvases = doc.querySelectorAll('canvas')
    if (internalCanvases.length > 0) {
      // Find the largest canvas (main render canvas)
      let mainCanvas: HTMLCanvasElement | null = null
      let maxArea = 0
      internalCanvases.forEach(c => {
        const area = c.width * c.height
        if (area > maxArea) {
          maxArea = area
          mainCanvas = c
        }
      })

      if (mainCanvas && maxArea > 0) {
        // Draw the template's internal canvas onto our capture canvas
        ctx.drawImage(mainCanvas, 0, 0, canvas.width, canvas.height)
        return
      }
    }

    // Strategy 2: Use html2canvas on the iframe's document body
    try {
      const html2canvas = (await import('html2canvas')).default
      const capturedCanvas = await html2canvas(doc.body, {
        canvas,
        width: canvas.width,
        height: canvas.height,
        backgroundColor: null, // Preserve transparency
        logging: false,
        useCORS: true,
        allowTaint: true,
        scale: 1,
        // Don't capture the template bridge script
        ignoreElements: (el: Element) => el.hasAttribute('data-template-bridge'),
      })

      if (capturedCanvas !== canvas) {
        // html2canvas sometimes creates a new canvas — draw it onto ours
        ctx.drawImage(capturedCanvas, 0, 0, canvas.width, canvas.height)
      }
    } catch (err) {
      console.warn(`[canvas2dRenderer] html2canvas fallback failed for template "${template.name}":`, err)
      // Strategy 3: Simple background capture — at least draw the background color
      const bgColor = doc.body.style.backgroundColor || '#000000'
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  } catch (err) {
    console.warn(`[canvas2dRenderer] Template capture failed for "${template.name}":`, err)
  }
}

/**
 * Draw all visible HTML templates for the current frame.
 * Called from the main renderFrame function.
 */
function drawHTMLTemplateLayers(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
  templateInstances: Map<string, TemplateExportInstance>,
): void {
  if (!props.htmlTemplates || templateInstances.size === 0) return

  for (const template of props.htmlTemplates) {
    if (!template.visible) continue
    if (frame < template.startFrame || frame >= template.endFrame) continue

    const instance = templateInstances.get(template.id)
    if (!instance) continue

    // The instance.canvas already has the captured frame from the pre-capture step
    const dims = computeTemplateDimensions(
      template.templateAspectRatio,
      props.width,
      props.height,
      template.scale,
    )

    ctx.save()
    ctx.globalAlpha = template.opacity

    // Position and rotation
    const x = template.position.x
    const y = template.position.y

    if (template.rotation !== 0) {
      ctx.translate(x + dims.displayWidth / 2, y + dims.displayHeight / 2)
      ctx.rotate((template.rotation * Math.PI) / 180)
      ctx.translate(-(dims.displayWidth / 2), -(dims.displayHeight / 2))
    } else {
      ctx.translate(x, y)
    }

    // Draw the captured template canvas scaled to display dimensions
    ctx.drawImage(instance.canvas, 0, 0, dims.displayWidth, dims.displayHeight)
    ctx.restore()
  }
}

/**
 * Clean up template iframes when export is done.
 */
export function disposeHTMLTemplates(templateMap: Map<string, TemplateExportInstance>): void {
  for (const [, instance] of templateMap) {
    try {
      instance.iframe.remove()
    } catch {
      // Ignore cleanup errors
    }
  }
  templateMap.clear()
}

// ── React Motion Graphics export (offscreen DOM + html2canvas) ────────

export interface MotionGraphicExportInstance {
  container: HTMLDivElement
  root: import('react-dom/client').Root
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  data: MotionGraphicExportData
}

/**
 * Pre-load React motion graphic components for export.
 * Each instance gets a hidden DOM container for React rendering + capture canvas.
 */
export async function preloadMotionGraphics(
  props: VideoCompositionProps,
): Promise<Map<string, MotionGraphicExportInstance>> {
  const mgMap = new Map<string, MotionGraphicExportInstance>()

  if (!props.motionGraphics || props.motionGraphics.length === 0) return mgMap

  // Dynamic imports to avoid pulling React DOM client into main bundle
  const [{ createRoot }, { getMotionGraphic }] = await Promise.all([
    import('react-dom/client'),
    import('@/motionGraphics/registry'),
  ])

  for (const mg of props.motionGraphics) {
    if (!mg.visible) continue

    const registration = getMotionGraphic(mg.templateId)
    if (!registration) continue

    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '-9999px'
    container.style.width = `${props.width}px`
    container.style.height = `${props.height}px`
    container.style.overflow = 'hidden'
    document.body.appendChild(container)

    const captureCanvas = document.createElement('canvas')
    captureCanvas.width = props.width
    captureCanvas.height = props.height
    const captureCtx = captureCanvas.getContext('2d')!

    const root = createRoot(container)

    mgMap.set(mg.id, {
      container,
      root,
      canvas: captureCanvas,
      ctx: captureCtx,
      data: mg,
    })
  }

  return mgMap
}

/**
 * Capture a single motion graphic frame by rendering the React component
 * to the offscreen container and capturing it.
 *
 * Strategy:
 * 1. Use flushSync for deterministic React rendering (no setTimeout guesswork)
 * 2. Try foreignObject SVG capture first (handles CSS filter, mix-blend-mode,
 *    clip-path, gradients, text-stroke better than html2canvas)
 * 3. Fall back to html2canvas if foreignObject fails
 */
async function captureMotionGraphicFrame(
  instance: MotionGraphicExportInstance,
  frame: number,
  fps: number,
  width: number,
  height: number,
): Promise<void> {
  const { data, container, root, canvas, ctx } = instance
  const localFrame = frame - data.startFrame
  const durationInFrames = data.endFrame - data.startFrame
  const progress = durationInFrames > 0 ? localFrame / durationInFrames : 0

  // Dynamic imports
  const [{ getMotionGraphic }, { createElement }, { flushSync }] = await Promise.all([
    import('@/motionGraphics/registry'),
    import('react'),
    import('react-dom'),
  ])
  const registration = getMotionGraphic(data.templateId)
  if (!registration) return

  const Component = registration.component

  // Use flushSync for immediate, deterministic rendering
  flushSync(() => {
    root.render(
      createElement(Component, {
        config: data.config,
        frame: localFrame,
        fps,
        durationInFrames,
        width,
        height,
        progress,
      }),
    )
  })

  // Small yield to allow browser layout/paint after flushSync
  await new Promise((r) => setTimeout(r, 2))

  // Try foreignObject SVG capture (better CSS fidelity)
  const captured = await captureForeignObject(container, canvas, ctx, width, height)
  if (captured) return

  // Fallback: html2canvas
  try {
    const html2canvas = (await import('html2canvas')).default
    const result = await html2canvas(container, {
      canvas,
      width,
      height,
      backgroundColor: null,
      logging: false,
      useCORS: true,
    })
    if (result !== canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(result, 0, 0, canvas.width, canvas.height)
    }
  } catch (err) {
    console.warn(`[canvas2dRenderer] Motion graphic capture failed for "${data.templateId}":`, err)
  }
}

/**
 * Capture a DOM element via SVG foreignObject.
 * This method preserves CSS properties that html2canvas struggles with:
 * filter, mix-blend-mode, clip-path, -webkit-text-stroke, gradients.
 *
 * Returns true if capture succeeded, false if it failed (caller should fallback).
 */
async function captureForeignObject(
  element: HTMLElement,
  _canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): Promise<boolean> {
  try {
    // Clone the DOM tree including computed styles
    const clone = element.cloneNode(true) as HTMLElement
    // Inline all computed styles so the SVG foreignObject renders correctly
    inlineComputedStyles(element, clone)

    const svgNS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(svgNS, 'svg')
    svg.setAttribute('xmlns', svgNS)
    svg.setAttribute('width', String(width))
    svg.setAttribute('height', String(height))

    const fo = document.createElementNS(svgNS, 'foreignObject')
    fo.setAttribute('width', '100%')
    fo.setAttribute('height', '100%')

    // Wrap clone in an XHTML body for foreignObject compatibility
    clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
    fo.appendChild(clone)
    svg.appendChild(fo)

    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const img = new Image()
    img.width = width
    img.height = height

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        resolve()
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('foreignObject image load failed'))
      }
      img.src = url
    })

    return true
  } catch {
    // foreignObject capture failed — caller will fall back to html2canvas
    return false
  }
}

/**
 * Recursively inline computed styles from the source element to the clone.
 * This ensures CSS is preserved when the clone is serialized into SVG foreignObject.
 */
function inlineComputedStyles(source: Element, clone: Element): void {
  if (!(source instanceof HTMLElement) || !(clone instanceof HTMLElement)) return

  const computed = window.getComputedStyle(source)
  // Copy key visual properties (not all — would be too slow)
  const props = [
    'color', 'background', 'background-color', 'background-image',
    'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing',
    'text-align', 'text-transform', 'text-decoration', 'text-shadow',
    'display', 'position', 'top', 'left', 'right', 'bottom', 'width', 'height',
    'margin', 'padding', 'border', 'border-radius',
    'opacity', 'overflow', 'z-index', 'transform', 'transform-origin',
    'filter', 'mix-blend-mode', 'clip-path',
    '-webkit-text-stroke', '-webkit-text-stroke-width', '-webkit-text-stroke-color',
    '-webkit-text-fill-color', '-webkit-background-clip',
    'box-shadow', 'flex-direction', 'justify-content', 'align-items', 'gap',
    'white-space', 'word-break', 'box-sizing', 'inset',
  ]

  for (const prop of props) {
    const val = computed.getPropertyValue(prop)
    if (val) {
      clone.style.setProperty(prop, val)
    }
  }

  // Recurse into children
  const sourceChildren = source.children
  const cloneChildren = clone.children
  for (let i = 0; i < sourceChildren.length && i < cloneChildren.length; i++) {
    inlineComputedStyles(sourceChildren[i], cloneChildren[i])
  }
}

/**
 * Draw all visible motion graphics for the current frame.
 */
function drawMotionGraphicLayers(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
  mgInstances: Map<string, MotionGraphicExportInstance>,
): void {
  if (!props.motionGraphics || mgInstances.size === 0) return

  for (const mg of props.motionGraphics) {
    if (!mg.visible) continue
    if (frame < mg.startFrame || frame >= mg.endFrame) continue

    const instance = mgInstances.get(mg.id)
    if (!instance) continue

    ctx.save()
    ctx.globalAlpha = mg.opacity

    const displayWidth = props.width * mg.scale
    const displayHeight = props.height * mg.scale
    const x = mg.position.x
    const y = mg.position.y

    if (mg.rotation !== 0) {
      ctx.translate(x + displayWidth / 2, y + displayHeight / 2)
      ctx.rotate((mg.rotation * Math.PI) / 180)
      ctx.translate(-(displayWidth / 2), -(displayHeight / 2))
    } else {
      ctx.translate(x, y)
    }

    ctx.drawImage(instance.canvas, 0, 0, displayWidth, displayHeight)
    ctx.restore()
  }
}

/**
 * Clean up motion graphic instances when export is done.
 */
export function disposeMotionGraphics(mgMap: Map<string, MotionGraphicExportInstance>): void {
  for (const [, instance] of mgMap) {
    try {
      instance.root.unmount()
      instance.container.remove()
    } catch {
      // Ignore cleanup errors
    }
  }
  mgMap.clear()
}

// ── Keyframe interpolation helper (pre-indexed for O(1) track lookup) ──

/** Pre-indexed keyframe data: Map<"objectType:objectId:property", PropertyKeyframe[]> */
export type KeyframeIndex = Map<string, PropertyKeyframe[]>

/**
 * Build a pre-indexed map from KeyframeExportData for O(1) track lookups.
 * Call once before the render loop to avoid per-frame linear scans.
 */
export function buildKeyframeIndex(keyframeData: KeyframeExportData | undefined): KeyframeIndex {
  const index: KeyframeIndex = new Map()
  if (!keyframeData) return index

  for (const track of keyframeData.tracks) {
    if (track.keyframes.length === 0) continue
    const key = `${track.objectType}:${track.objectId}:${track.property}`
    const kfs: PropertyKeyframe[] = track.keyframes.map((kf, i) => ({
      id: `${i}`,
      frame: kf.frame,
      value: kf.value,
      easing: (kf.easing || 'linear') as EasingType,
      bezierParams: kf.bezierParams,
    }))
    index.set(key, kfs)
  }

  return index
}

function getKeyframeValue(
  keyframeData: KeyframeExportData | undefined,
  objectType: string,
  objectId: string,
  property: string,
  frame: number,
  index?: KeyframeIndex,
): number | undefined {
  // Fast path: use pre-indexed map
  if (index) {
    const key = `${objectType}:${objectId}:${property}`
    const kfs = index.get(key)
    if (!kfs) return undefined
    const isAngle = property === 'rotation'
    return interpolatePropertyKeyframes(kfs, frame, isAngle)
  }

  // Fallback: linear scan (legacy path)
  if (!keyframeData) return undefined

  const track = keyframeData.tracks.find(
    t => t.objectType === objectType && t.objectId === objectId && t.property === property
  )
  if (!track || track.keyframes.length === 0) return undefined

  const kfs: PropertyKeyframe[] = track.keyframes.map((kf, i) => ({
    id: `${i}`,
    frame: kf.frame,
    value: kf.value,
    easing: (kf.easing || 'linear') as EasingType,
    bezierParams: kf.bezierParams,
  }))

  const isAngle = property === 'rotation'
  return interpolatePropertyKeyframes(kfs, frame, isAngle)
}

// ── Path Animation Helper ─────────────────────────────────────────────

/**
 * Evaluate a path animation for an object at the given frame.
 * Returns { x, y, angle } or undefined if no path or out of range.
 */
function evaluatePathForObject(
  pathId: string | undefined,
  frame: number,
  props: VideoCompositionProps,
): { x: number; y: number; angle: number } | undefined {
  if (!pathId || !props.pathAnimations) return undefined

  const pathDef = props.pathAnimations.find((p) => p.id === pathId)
  if (!pathDef) return undefined

  const duration = pathDef.endFrame - pathDef.startFrame
  if (duration <= 0) return undefined

  let t: number
  if (pathDef.loop) {
    t = ((frame - pathDef.startFrame) % duration) / duration
    if (t < 0) t += 1
  } else {
    t = (frame - pathDef.startFrame) / duration
    if (t < 0 || t > 1) return undefined
  }

  t = Math.max(0, Math.min(1, t))
  t = applyEasing(t, pathDef.easing)

  const result = pathDef.constantSpeed
    ? evaluatePathArcLength(t, pathDef.pathConfig)
    : evaluatePath(t, pathDef.pathConfig)

  return { x: result.x, y: result.y, angle: result.angle }
}

/**
 * Look up a mask definition by ID from composition props.
 */
function findMask(
  maskId: string | undefined,
  props: VideoCompositionProps,
): MaskData | undefined {
  if (!maskId || !props.masks) return undefined
  return props.masks.find((m) => m.id === maskId)
}

// ── Viseme/emotion frame lookup (binary search + sequential cache) ───

/**
 * Binary search for the event at a given frame in a sorted timeline.
 * Returns the index, or -1 if not found.
 */
function binarySearchTimeline<T extends { startFrame: number; endFrame: number }>(
  timeline: T[],
  frame: number,
  hint: number,
): number {
  const len = timeline.length
  if (len === 0) return -1

  // Fast path: check hint index (sequential frames hit the same or next event)
  if (hint >= 0 && hint < len) {
    const e = timeline[hint]
    if (frame >= e.startFrame && frame < e.endFrame) return hint
    // Check next
    if (hint + 1 < len) {
      const next = timeline[hint + 1]
      if (frame >= next.startFrame && frame < next.endFrame) return hint + 1
    }
  }

  // Binary search
  let lo = 0
  let hi = len - 1
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    const e = timeline[mid]
    if (frame < e.startFrame) {
      hi = mid - 1
    } else if (frame >= e.endFrame) {
      lo = mid + 1
    } else {
      return mid
    }
  }
  return -1
}

// Per-character sequential index caches for the main render loop (reset per export).
// Keyed by character ID (or 'single' for non-dialogue mode) to prevent
// hint leakage between characters during multi-character rendering.
const _visemeHints = new Map<string, number>()
const _emotionHints = new Map<string, number>()

/** Reset the sequential lookup caches (call before each export run). */
export function resetTimelineCaches() {
  _visemeHints.clear()
  _emotionHints.clear()
}

function getVisemeAtFrame(timeline: VisemeEvent[], frame: number, characterId = 'single'): Viseme {
  const hint = _visemeHints.get(characterId) ?? 0
  const idx = binarySearchTimeline(timeline, frame, hint)
  if (idx >= 0) {
    _visemeHints.set(characterId, idx)
    return (timeline[idx].viseme as Viseme) || 'Rest'
  }
  return 'Rest'
}

function getEmotionAtFrame(timeline: EmotionEvent[], frame: number, characterId = 'single'): string {
  const hint = _emotionHints.get(characterId) ?? 0
  const idx = binarySearchTimeline(timeline, frame, hint)
  if (idx >= 0) {
    _emotionHints.set(characterId, idx)
    return timeline[idx].emotion || 'Neutral'
  }
  return 'Neutral'
}

function getVisemeSpriteUrl(
  character: VideoCompositionProps['character'],
  viseme: Viseme,
  emotion: string,
): string | null {
  const { curvedVisemes, savedImages, visemeMapping, visemeSpriteMap } = character
  const visemeImages = savedImages.viseme || []
  const curvature = getCurvatureFromEmotion(emotion)

  // Use unified resolveVisemeSprite — handles visemeSpriteMap, curvedVisemes, and legacy fallback
  return resolveVisemeSprite(
    viseme,
    curvature,
    visemeSpriteMap as Record<string, string | null> | null | undefined,
    curvedVisemes,
    visemeImages,
    visemeMapping
  )
}

// ── Caption lookup (same as RemotionCaptions.tsx) ──────────────────

function getCaptionAtFrame(captions: CaptionData, frame: number): { text: string; highlightIndex?: number } | null {
  const { style, wordTimeline, sentenceTimeline } = captions

  switch (style) {
    case 'word-by-word': {
      const word = wordTimeline.find(w => frame >= w.startFrame && frame < w.endFrame)
      return word ? { text: word.word } : null
    }
    case 'sentence': {
      const sentence = sentenceTimeline.find(s => frame >= s.startFrame && frame < s.endFrame)
      return sentence ? { text: sentence.sentence } : null
    }
    case 'karaoke': {
      const sentence = sentenceTimeline.find(s => frame >= s.startFrame && frame < s.endFrame)
      if (!sentence) return null
      const activeWordIndex = sentence.words.findIndex(
        w => frame >= w.startFrame && frame < w.endFrame
      )
      return {
        text: sentence.sentence,
        highlightIndex: activeWordIndex >= 0 ? activeWordIndex : undefined,
      }
    }
    default:
      return null
  }
}

// ── Main render function ──────────────────────────────────────────────

export interface RenderContext {
  imageCache: ImageCache
  lottieInstances: Map<string, LottieExportInstance>
  videoElements: Map<string, HTMLVideoElement>
  threeInstance: ThreeExportInstance | null
  templateInstances: Map<string, TemplateExportInstance>
  rigInstances: Map<string, RigExportInstance> | null
  mgInstances: Map<string, MotionGraphicExportInstance>
  /** Pre-indexed keyframe data for O(1) track lookups */
  keyframeIndex?: KeyframeIndex
}

/**
 * Render a single frame of the composition to the canvas.
 * This is the hot path — called once per frame during export.
 *
 * Note: This function is async because HTML template capture (iframe screenshot)
 * requires async operations. If no templates are present, the async overhead is
 * negligible (just the function call wrapper).
 */
export async function renderFrame(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
  renderCtx: RenderContext,
  options?: { alpha?: boolean },
): Promise<void> {
  const { width, height } = props
  const { imageCache, lottieInstances, videoElements, templateInstances, mgInstances, keyframeIndex } = renderCtx
  const isAlpha = options?.alpha ?? false

  // ── 0. Background fill ──
  if (isAlpha) {
    ctx.clearRect(0, 0, width, height)
  } else {
    ctx.fillStyle = '#18181b'
    ctx.fillRect(0, 0, width, height)
  }

  // ── Camera transform ──
  // Apply virtual camera (zoom/pan/rotation/shake) to layers 1-7.
  // Captions, retention hooks, and watermark are drawn outside the camera
  // transform so they stay fixed on screen (matching VideoComposition.tsx).
  const cameraEnabled = isCameraActive()
  if (cameraEnabled) {
    ctx.save()
    const cam = getExportCameraTransform(frame, props.fps)
    applyCameraTransform(ctx, cam, width, height)
  }

  // ── 1. Background Lottie (skip in alpha/transparent mode) ──
  if (!isAlpha) {
    drawLottieLayers(ctx, props, frame, lottieInstances, 'background')
  }

  // ── 1.5. HTML Templates (capture + draw) ──
  // Templates are typically used as animated backgrounds, so they render early.
  // Each visible template's iframe is advanced to the current frame and captured.
  if (templateInstances.size > 0 && props.htmlTemplates) {
    // Capture all visible templates for this frame (async — iframe screenshot)
    const capturePromises: Promise<void>[] = []
    for (const template of props.htmlTemplates) {
      if (!template.visible) continue
      if (frame < template.startFrame || frame >= template.endFrame) continue
      const instance = templateInstances.get(template.id)
      if (!instance) continue
      capturePromises.push(
        captureTemplateFrame(instance, frame, props.fps, props.durationInFrames, true)
      )
    }
    if (capturePromises.length > 0) {
      await Promise.all(capturePromises)
    }
    // Draw captured templates onto the main canvas
    drawHTMLTemplateLayers(ctx, props, frame, templateInstances)
  }

  // ── 1.75. React Motion Graphics (capture + draw) ──
  if (mgInstances.size > 0 && props.motionGraphics) {
    const mgCaptures: Promise<void>[] = []
    for (const mg of props.motionGraphics) {
      if (!mg.visible) continue
      if (frame < mg.startFrame || frame >= mg.endFrame) continue
      const instance = mgInstances.get(mg.id)
      if (!instance) continue
      mgCaptures.push(
        captureMotionGraphicFrame(instance, frame, props.fps, width, height)
      )
    }
    if (mgCaptures.length > 0) {
      await Promise.all(mgCaptures)
    }
    drawMotionGraphicLayers(ctx, props, frame, mgInstances)
  }

  // ── 2. Media images ──
  drawMediaLayers(ctx, props, frame, imageCache, keyframeIndex)

  // ── 3. Shapes ──
  drawShapeLayers(ctx, props, frame, keyframeIndex)

  // ── 3.25. Crowd / background characters ──
  drawCrowdLayers(ctx, props, frame)

  // ── 3.5. Art Curves ──
  drawArtCurveLayers(ctx, props, frame, imageCache)

  // ── 4. Video layers ──
  await drawVideoLayers(ctx, props, frame, videoElements, keyframeIndex)

  // ── 5. Characters (2D sprites + rigged dialogue) ──
  drawCharacterLayers(ctx, props, frame, imageCache, keyframeIndex, renderCtx.rigInstances)

  // ── 5.25. 2D Rigged Characters (mesh deformation) ──
  drawRiggedCharacterLayers(ctx, props, frame, renderCtx.rigInstances)

  // ── 5.5. 3D Characters (WebGL composite) ──
  draw3DCharacterLayers(ctx, props, frame, renderCtx.threeInstance)

  // ── 6. Text overlays ──
  drawTextOverlays(ctx, props, frame, keyframeIndex)

  // ── 6.5. Annotations ──
  drawAnnotations(ctx, props, frame)

  // ── 7. Overlay Lottie ──
  drawLottieLayers(ctx, props, frame, lottieInstances, 'overlay')

  // ── End camera transform ──
  if (cameraEnabled) {
    ctx.restore()
  }

  // ── 8. Captions (fixed on screen, outside camera transform) ──
  drawCaptions(ctx, props, frame)

  // ── 9. Retention Hooks (fixed on screen, outside camera transform) ──
  drawRetentionHooks(ctx, props, frame)

  // ── 10. Brand Watermark (topmost layer) ──
  if (!isAlpha) {
    drawBrandWatermark(ctx, props.width, props.height, renderCtx)
  }
}

// ── Brand Watermark ───────────────────────────────────────────────────

function drawBrandWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  renderCtx: RenderContext,
): void {
  const watermarkImg = renderCtx.imageCache.get('__brand_watermark__')
  if (!watermarkImg) return

  // Get brand kit watermark config
  try {
    const { useBrandKitStore } = require('@/stores/useBrandKitStore')
    const kit = useBrandKitStore.getState().getActiveBrandKit()
    if (!kit?.watermarkUrl) return

    const { drawWatermark, getWatermarkConfig } = require('@/services/watermarkRenderer')
    const config = getWatermarkConfig(kit)
    if (config) {
      drawWatermark(ctx, watermarkImg as HTMLImageElement, canvasWidth, canvasHeight, config)
    }
  } catch {
    // Brand kit store not available — skip watermark
  }
}

// ── Layer renderers ───────────────────────────────────────────────────

function drawLottieLayers(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
  lottieInstances: Map<string, LottieExportInstance>,
  category: 'background' | 'overlay',
) {
  if (!props.animations) return

  for (const anim of props.animations) {
    if (anim.category !== category) continue
    const instance = lottieInstances.get(anim.id)
    if (!instance) continue

    // Calculate lottie-local frame
    const localFrame = (frame * anim.speed) % instance.totalFrames
    instance.anim.goToAndStop(localFrame, true)

    ctx.save()
    ctx.globalAlpha = anim.opacity
    // Blend mode
    const animBlend = (anim as any).blendMode
    if (animBlend && animBlend !== 'source-over' && animBlend !== 'normal') {
      ctx.globalCompositeOperation = animBlend as GlobalCompositeOperation
    }
    // Blur (gaussian only for lottie layers)
    const animBlur = (anim as any).blur
    if (animBlur && animBlur > 0) {
      ctx.filter = `blur(${animBlur}px)`
    }
    ctx.translate(anim.position.x, anim.position.y)
    ctx.scale(anim.scale, anim.scale)
    ctx.drawImage(instance.canvas, 0, 0)
    ctx.restore()
  }
}

function drawMediaLayers(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
  imageCache: ImageCache,
  kfIndex?: KeyframeIndex,
) {
  if (!props.mediaItems) return

  for (const item of props.mediaItems) {
    if (!item.visible || !item.imageUrl) continue
    if (frame < item.startFrame || frame >= item.endFrame) continue

    const img = imageCache.get(item.imageUrl)
    if (!img) continue

    // Apply keyframe interpolation
    const kf = props.keyframeData

    // Path animation override
    const pathResult = evaluatePathForObject((item as any).pathId, frame, props)
    const x = pathResult?.x ?? (getKeyframeValue(kf, 'media', item.id, 'position.x', frame, kfIndex) ?? item.position.x)
    const y = pathResult?.y ?? (getKeyframeValue(kf, 'media', item.id, 'position.y', frame, kfIndex) ?? item.position.y)
    const scale = getKeyframeValue(kf, 'media', item.id, 'scale', frame, kfIndex) ?? item.scale
    const opacity = getKeyframeValue(kf, 'media', item.id, 'opacity', frame, kfIndex) ?? item.opacity
    let rotation = getKeyframeValue(kf, 'media', item.id, 'rotation', frame, kfIndex) ?? item.rotation
    if (pathResult && (item as any).pathAutoRotate) rotation = pathResult.angle

    const blur = getKeyframeValue(kf, 'media', item.id, 'blur', frame, kfIndex) ?? (item as any).blur ?? 0

    const w = props.width * scale
    const h = props.height * scale

    ctx.save()
    ctx.globalAlpha = opacity

    // Mask
    const mask = findMask((item as any).maskId, props)
    if (mask) {
      applyVectorMask(ctx, mask as any, frame, kfIndex, kf)
    }
    // Blend mode
    const mediaBlend = (item as any).blendMode
    if (mediaBlend && mediaBlend !== 'source-over' && mediaBlend !== 'normal') {
      ctx.globalCompositeOperation = mediaBlend as GlobalCompositeOperation
    }
    // Blur
    if (blur > 0) {
      ctx.filter = `blur(${blur}px)`
    }
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
    ctx.restore()
  }
}

function drawShapeLayers(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
  kfIndex?: KeyframeIndex,
) {
  if (!props.shapes) return

  for (const shape of props.shapes) {
    if (!shape.visible) continue
    if (frame < shape.startFrame || frame >= shape.endFrame) continue

    // Apply keyframe interpolation (matches RemotionShapeLayer.tsx)
    const kf = props.keyframeData

    // Path animation override
    const pathResult = evaluatePathForObject((shape as any).pathId, frame, props)
    const x = pathResult?.x ?? (getKeyframeValue(kf, 'shape', shape.id, 'position.x', frame, kfIndex) ?? shape.position.x)
    const y = pathResult?.y ?? (getKeyframeValue(kf, 'shape', shape.id, 'position.y', frame, kfIndex) ?? shape.position.y)
    const w = getKeyframeValue(kf, 'shape', shape.id, 'width', frame, kfIndex) ?? shape.width
    const h = getKeyframeValue(kf, 'shape', shape.id, 'height', frame, kfIndex) ?? shape.height
    const opacity = getKeyframeValue(kf, 'shape', shape.id, 'opacity', frame, kfIndex) ?? shape.opacity
    let rotation = getKeyframeValue(kf, 'shape', shape.id, 'rotation', frame, kfIndex) ?? shape.rotation
    if (pathResult && (shape as any).pathAutoRotate) rotation = pathResult.angle
    const strokeWidth = getKeyframeValue(kf, 'shape', shape.id, 'strokeWidth', frame, kfIndex) ?? shape.strokeWidth
    const borderRadius = getKeyframeValue(kf, 'shape', shape.id, 'borderRadius', frame, kfIndex) ?? (shape.borderRadius ?? 0)
    const innerRadius = getKeyframeValue(kf, 'shape', shape.id, 'innerRadius', frame, kfIndex) ?? (shape.innerRadius ?? 0.4)
    const blur = getKeyframeValue(kf, 'shape', shape.id, 'blur', frame, kfIndex) ?? ((shape as any).blur ?? 0)

    ctx.save()
    ctx.globalAlpha = opacity

    // Mask
    const mask = findMask((shape as any).maskId, props)
    if (mask) {
      applyVectorMask(ctx, mask as any, frame, kfIndex, kf)
    }
    // Blend mode
    const shapeBlend = (shape as any).blendMode
    if (shapeBlend && shapeBlend !== 'source-over' && shapeBlend !== 'normal') {
      ctx.globalCompositeOperation = shapeBlend as GlobalCompositeOperation
    }
    // Blur
    if (blur > 0) {
      ctx.filter = `blur(${blur}px)`
    }
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate((rotation * Math.PI) / 180)

    // Draw shape centered at origin (with gradient support)
    drawShape(ctx, shape, w, h, strokeWidth, borderRadius, innerRadius, frame, kfIndex, kf)
    ctx.restore()
  }
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeLayerData,
  w: number,
  h: number,
  strokeWidth: number,
  borderRadius: number,
  innerRadius: number,
  frame?: number,
  kfIndex?: KeyframeIndex,
  keyframeData?: KeyframeExportData,
) {
  const { fill, stroke, type } = shape
  const hw = w / 2
  const hh = h / 2

  ctx.beginPath()

  switch (type) {
    case 'rectangle': {
      if (borderRadius > 0) {
        const r = Math.min(borderRadius, hw, hh)
        ctx.roundRect(-hw, -hh, w, h, r)
      } else {
        ctx.rect(-hw, -hh, w, h)
      }
      break
    }
    case 'circle':
      ctx.ellipse(0, 0, hw - strokeWidth / 2, hh - strokeWidth / 2, 0, 0, Math.PI * 2)
      break
    case 'triangle': {
      const inset = strokeWidth / 2
      ctx.moveTo(0, -hh + inset)
      ctx.lineTo(hw - inset, hh - inset)
      ctx.lineTo(-hw + inset, hh - inset)
      ctx.closePath()
      break
    }
    case 'star': {
      const outerR = Math.min(hw, hh) - strokeWidth / 2
      const iR = outerR * innerRadius
      const numPoints = shape.points ?? 5
      for (let i = 0; i < numPoints * 2; i++) {
        const angle = (Math.PI * i) / numPoints - Math.PI / 2
        const r = i % 2 === 0 ? outerR : iR
        const px = r * Math.cos(angle)
        const py = r * Math.sin(angle)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      break
    }
  }

  // Handle gradient fill
  const gradientFill = (shape as any).gradientFill as GradientFill | undefined
  if (gradientFill && gradientFill.type) {
    ctx.fillStyle = buildCanvasGradient(ctx, gradientFill, w, h, frame ?? 0, kfIndex, keyframeData, shape.id)
    ctx.fill()
  } else if (fill && fill !== 'transparent') {
    ctx.fillStyle = typeof fill === 'string' ? fill : (fill as any)?.stops?.[0]?.color ?? '#000000'
    ctx.fill()
  }
  if (stroke && stroke !== 'transparent' && strokeWidth > 0) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = strokeWidth
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
}

function drawArtCurveLayers(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
  imageCache: ImageCache,
) {
  if (!props.artCurves) return

  for (const comp of props.artCurves) {
    if (!comp.visible) continue
    if (frame < comp.startFrame || frame >= comp.endFrame) continue

    const cached = imageCache.get(`__artcurve__${comp.id}`)
    if (!cached) continue

    const displayWidth = 800 * comp.scale
    const displayHeight = 600 * comp.scale

    ctx.save()
    ctx.globalAlpha = comp.opacity
    ctx.translate(comp.position.x, comp.position.y)
    if (comp.rotation !== 0) {
      ctx.translate(displayWidth / 2, displayHeight / 2)
      ctx.rotate((comp.rotation * Math.PI) / 180)
      ctx.translate(-displayWidth / 2, -displayHeight / 2)
    }
    if (!comp.bgTransparent) {
      ctx.fillStyle = comp.bgColor
      ctx.beginPath()
      ctx.roundRect(0, 0, displayWidth, displayHeight, 8)
      ctx.fill()
    }
    ctx.drawImage(cached, 0, 0, displayWidth, displayHeight)
    ctx.restore()
  }
}

async function drawVideoLayers(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
  videoElements: Map<string, HTMLVideoElement>,
  kfIndex?: KeyframeIndex,
) {
  if (!props.videos) return

  for (const v of props.videos) {
    if (!v.visible || !v.sourceUrl) continue

    const videoEl = videoElements.get(v.id)
    if (!videoEl || videoEl.readyState < 2) continue

    // Calculate video time
    const time = frame / props.fps
    const videoTime = v.loop
      ? time % v.durationSeconds
      : Math.min(time, v.durationSeconds)

    // Seek video and wait for the frame to be ready before drawing
    if (Math.abs(videoEl.currentTime - videoTime) > 0.05) {
      videoEl.currentTime = videoTime
      // Wait for the seek to complete so drawImage gets the correct frame
      if (videoEl.readyState < 2) {
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            videoEl.removeEventListener('seeked', onSeeked)
            resolve()
          }
          videoEl.addEventListener('seeked', onSeeked)
          // Timeout to avoid blocking forever if seeked never fires
          setTimeout(resolve, 200)
        })
      }
    }

    // Apply keyframe interpolation
    const kf = props.keyframeData
    const x = getKeyframeValue(kf, 'video', v.id, 'position.x', frame, kfIndex) ?? v.position.x
    const y = getKeyframeValue(kf, 'video', v.id, 'position.y', frame, kfIndex) ?? v.position.y
    const scale = getKeyframeValue(kf, 'video', v.id, 'scale', frame, kfIndex) ?? v.scale
    const opacity = getKeyframeValue(kf, 'video', v.id, 'opacity', frame, kfIndex) ?? v.opacity

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.drawImage(videoEl, 0, 0, props.width, props.height)
    ctx.restore()
  }
}

/**
 * Base character size in pixels (matches CharacterLayer.tsx BASE_CHARACTER_SIZE).
 * Characters are rendered as BASE_SIZE * scale pixels, positioned by center point.
 */
const BASE_CHARACTER_SIZE = 200

function drawCharacterLayers(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
  imageCache: ImageCache,
  kfIndex?: KeyframeIndex,
  rigInstances?: Map<string, RigExportInstance> | null,
) {
  if (props.dialogueCharacters && props.dialogueCharacters.length > 0) {
    // Multi-character mode
    for (const dc of props.dialogueCharacters) {
      if (!dc.visible) continue

      // Rigged dialogue character — use rig renderer instead of sprite renderer
      if (dc.renderMode === 'rigged' && dc.rigExportData && rigInstances) {
        const instance = rigInstances.get(dc.rigExportData.id)
        if (instance) {
          drawRiggedDialogueCharacter(ctx, dc, frame, instance, imageCache, props.keyframeData, kfIndex)
          continue
        }
      }

      // Find the active dialogue line at this frame
      const activeLine = dc.dialogueLines.find(
        l => frame >= l.startFrame && frame < l.endFrame
      )

      // IMPORTANT: viseme/emotion frames within a dialogue line are RELATIVE
      // to the line's startFrame — we need to compute the relative frame offset
      const relativeFrame = activeLine ? frame - activeLine.startFrame : 0
      const visemeTimeline = activeLine?.visemeTimeline || []
      const emotionTimeline = activeLine?.emotionTimeline || []

      drawDialogueCharacter(
        ctx, dc, visemeTimeline, emotionTimeline,
        relativeFrame, imageCache, props.width, props.height,
        props.keyframeData, frame, kfIndex,
      )
    }
  } else {
    // Single character mode — viseme/emotion frames are absolute
    drawSingleCharacter(
      ctx, props.character, props.visemeTimeline, props.emotionTimeline,
      frame, imageCache, props.width, props.height,
      props.keyframeData, 'character', 'composite', kfIndex,
    )
  }
}

/**
 * Draw a dialogue character using center-based pixel positioning.
 * Matches CharacterLayer.tsx rendering logic exactly.
 */
function drawDialogueCharacter(
  ctx: CanvasRenderingContext2D,
  dc: NonNullable<VideoCompositionProps['dialogueCharacters']>[number],
  visemeTimeline: VisemeEvent[],
  emotionTimeline: EmotionEvent[],
  relativeFrame: number,
  imageCache: ImageCache,
  _canvasWidth: number,
  _canvasHeight: number,
  keyframeData?: KeyframeExportData,
  absoluteFrame?: number,
  kfIndex?: KeyframeIndex,
) {
  const character = dc.savedCharacter
  const { savedImages, transforms, selectedSprites } = character

  // Get display sprites
  const eyeImages = savedImages.eye || []
  const eyebrowImages = savedImages.eyebrow || []
  const hairImages = savedImages.hair || []
  const bodyImages = savedImages.body || []
  const headImages = savedImages.head || []
  const shirtImages = savedImages.shirt || []
  const pantsImages = savedImages.pants || []
  const shoesImages = savedImages.shoes || []

  const displayBody = (selectedSprites.body !== null ? bodyImages[selectedSprites.body] : null) || bodyImages[0] || null
  const displayHead = (selectedSprites.head !== null ? headImages[selectedSprites.head] : null) || headImages[0] || null
  const displayEye = (selectedSprites.eye !== null ? eyeImages[selectedSprites.eye] : null) || eyeImages[0] || null
  const displayEyebrow = (selectedSprites.eyebrow !== null ? eyebrowImages[selectedSprites.eyebrow] : null) || eyebrowImages[0] || null
  const displayHair = (selectedSprites.hair !== null ? hairImages[selectedSprites.hair] : null) || hairImages[0] || null
  const displayShirt = (selectedSprites.shirt !== null ? shirtImages[selectedSprites.shirt] : null) || shirtImages[0] || null
  const displayPants = (selectedSprites.pants !== null ? pantsImages[selectedSprites.pants] : null) || pantsImages[0] || null
  const displayShoes = (selectedSprites.shoes !== null ? shoesImages[selectedSprites.shoes] : null) || shoesImages[0] || null

  // Get current viseme/emotion at RELATIVE frame within the dialogue line
  const currentViseme = getVisemeAtFrame(visemeTimeline, relativeFrame, dc.id)
  const currentEmotion = getEmotionAtFrame(emotionTimeline, relativeFrame, dc.id)
  const displayVisemeUrl = getVisemeSpriteUrl(character, currentViseme, currentEmotion)

  // Position/scale from dialogue character (center-based pixels)
  const frame = absoluteFrame ?? relativeFrame
  let posX = dc.position.x
  let posY = dc.position.y
  let scale = dc.scale

  // Apply keyframe overrides
  if (keyframeData) {
    posX = getKeyframeValue(keyframeData, 'dialogueCharacter', dc.id, 'position.x', frame, kfIndex) ?? posX
    posY = getKeyframeValue(keyframeData, 'dialogueCharacter', dc.id, 'position.y', frame, kfIndex) ?? posY
    const kfScale = getKeyframeValue(keyframeData, 'dialogueCharacter', dc.id, 'scale', frame, kfIndex)
    if (kfScale !== undefined) scale = kfScale
  }

  // Character display size in pixels (matches CharacterLayer.tsx)
  const displaySize = BASE_CHARACTER_SIZE * scale

  ctx.save()
  // Translate to character center for rotation
  ctx.translate(posX, posY)

  // Draw parts using the character's part transforms
  const layerOrder: LayerPart[] = useCharacterPartsStore.getState().layerOrder
  const spriteMap: Record<LayerPart, string | null> = {
    body: displayBody,
    head: displayHead,
    viseme: displayVisemeUrl,
    eye: displayEye,
    eyebrow: displayEyebrow,
    hair: displayHair,
    shirt: displayShirt,
    pants: displayPants,
    shoes: displayShoes,
  }

  for (const part of layerOrder) {
    const src = spriteMap[part]
    const transform = transforms[part]
    if (!transform || !transform.visible || !src) continue
    const img = imageCache.get(src)
    if (!img) continue

    ctx.save()
    // Part transform is relative to the character's bounding box
    ctx.translate(transform.x * scale, transform.y * scale)
    ctx.rotate((transform.rotation * Math.PI) / 180)
    ctx.scale(transform.scaleX, transform.scaleY)

    // Draw image to fill the character's display size (object-contain behavior)
    const imgW = img instanceof HTMLCanvasElement ? img.width : (img as HTMLImageElement).naturalWidth || img.width
    const imgH = img instanceof HTMLCanvasElement ? img.height : (img as HTMLImageElement).naturalHeight || img.height
    const fitScale = Math.min(displaySize / imgW, displaySize / imgH)
    const drawW = imgW * fitScale
    const drawH = imgH * fitScale
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()
  }

  ctx.restore()
}

/**
 * Draw a single (non-dialogue) character using the group transform system.
 * Used when there are no dialogue characters.
 */
function drawSingleCharacter(
  ctx: CanvasRenderingContext2D,
  character: VideoCompositionProps['character'],
  visemeTimeline: VisemeEvent[],
  emotionTimeline: EmotionEvent[],
  frame: number,
  imageCache: ImageCache,
  _canvasWidth: number,
  _canvasHeight: number,
  keyframeData?: KeyframeExportData,
  objectType?: string,
  objectId?: string,
  kfIndex?: KeyframeIndex,
) {
  const { savedImages, transforms, selectedSprites } = character

  const groupTransform = transforms.group
  if (!groupTransform.visible) return

  // Get display sprites
  const eyeImages = savedImages.eye || []
  const eyebrowImages = savedImages.eyebrow || []
  const hairImages = savedImages.hair || []
  const bodyImages = savedImages.body || []
  const headImages = savedImages.head || []
  const shirtImages = savedImages.shirt || []
  const pantsImages = savedImages.pants || []
  const shoesImages = savedImages.shoes || []

  const displayBody = (selectedSprites.body !== null ? bodyImages[selectedSprites.body] : null) || bodyImages[0] || null
  const displayHead = (selectedSprites.head !== null ? headImages[selectedSprites.head] : null) || headImages[0] || null
  const displayEye = (selectedSprites.eye !== null ? eyeImages[selectedSprites.eye] : null) || eyeImages[0] || null
  const displayEyebrow = (selectedSprites.eyebrow !== null ? eyebrowImages[selectedSprites.eyebrow] : null) || eyebrowImages[0] || null
  const displayHair = (selectedSprites.hair !== null ? hairImages[selectedSprites.hair] : null) || hairImages[0] || null
  const displayShirt = (selectedSprites.shirt !== null ? shirtImages[selectedSprites.shirt] : null) || shirtImages[0] || null
  const displayPants = (selectedSprites.pants !== null ? pantsImages[selectedSprites.pants] : null) || pantsImages[0] || null
  const displayShoes = (selectedSprites.shoes !== null ? shoesImages[selectedSprites.shoes] : null) || shoesImages[0] || null

  // Get current viseme/emotion for this frame (absolute)
  const currentViseme = getVisemeAtFrame(visemeTimeline, frame)
  const currentEmotion = getEmotionAtFrame(emotionTimeline, frame)
  const displayVisemeUrl = getVisemeSpriteUrl(character, currentViseme, currentEmotion)

  // Apply keyframe overrides to group transform
  let groupX = groupTransform.x
  let groupY = groupTransform.y
  let groupScaleX = groupTransform.scaleX
  let groupScaleY = groupTransform.scaleY
  const groupRotation = groupTransform.rotation

  if (keyframeData && objectType && objectId) {
    groupX = getKeyframeValue(keyframeData, objectType, objectId, 'position.x', frame, kfIndex) ?? groupX
    groupY = getKeyframeValue(keyframeData, objectType, objectId, 'position.y', frame, kfIndex) ?? groupY
    const kfScale = getKeyframeValue(keyframeData, objectType, objectId, 'scale', frame, kfIndex)
    if (kfScale !== undefined) {
      groupScaleX = kfScale
      groupScaleY = kfScale
    }
  }

  ctx.save()
  ctx.translate(groupX, groupY)
  ctx.rotate((groupRotation * Math.PI) / 180)
  ctx.scale(groupScaleX, groupScaleY)

  // Draw parts in dynamic layer order from store
  const layerOrder: LayerPart[] = useCharacterPartsStore.getState().layerOrder
  const spriteMap: Record<LayerPart, string | null> = {
    body: displayBody,
    head: displayHead,
    viseme: displayVisemeUrl,
    eye: displayEye,
    eyebrow: displayEyebrow,
    hair: displayHair,
    shirt: displayShirt,
    pants: displayPants,
    shoes: displayShoes,
  }

  for (const part of layerOrder) {
    const src = spriteMap[part]
    const transform = transforms[part]
    if (!transform || !transform.visible || !src) continue
    const img = imageCache.get(src)
    if (!img) continue

    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.rotate((transform.rotation * Math.PI) / 180)
    ctx.scale(transform.scaleX, transform.scaleY)

    // Draw centered at natural size
    const imgW = img instanceof HTMLCanvasElement ? img.width : (img as HTMLImageElement).naturalWidth || img.width
    const imgH = img instanceof HTMLCanvasElement ? img.height : (img as HTMLImageElement).naturalHeight || img.height
    ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH)
    ctx.restore()
  }

  ctx.restore()
}

function drawTextOverlays(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
  kfIndex?: KeyframeIndex,
) {
  if (!props.textOverlays) return

  for (const overlay of props.textOverlays) {
    if (frame < overlay.startFrame || frame >= overlay.endFrame) continue

    // Apply keyframe interpolation (matches RemotionTextOverlay.tsx)
    const kf = props.keyframeData
    const freeX = getKeyframeValue(kf, 'text', overlay.id, 'freeX', frame, kfIndex) ?? overlay.freeX
    const freeY = getKeyframeValue(kf, 'text', overlay.id, 'freeY', frame, kfIndex) ?? overlay.freeY
    const fontSize = getKeyframeValue(kf, 'text', overlay.id, 'fontSize', frame, kfIndex) ?? overlay.fontSize
    const opacity = getKeyframeValue(kf, 'text', overlay.id, 'opacity', frame, kfIndex) ?? overlay.opacity
    const rotation = getKeyframeValue(kf, 'text', overlay.id, 'rotation', frame, kfIndex) ?? overlay.rotation
    const letterSpacing = getKeyframeValue(kf, 'text', overlay.id, 'letterSpacing', frame, kfIndex) ?? overlay.letterSpacing
    const lineHeight = getKeyframeValue(kf, 'text', overlay.id, 'lineHeight', frame, kfIndex) ?? overlay.lineHeight
    const backgroundOpacity = getKeyframeValue(kf, 'text', overlay.id, 'backgroundOpacity', frame, kfIndex) ?? overlay.backgroundOpacity
    const blur = getKeyframeValue(kf, 'text', overlay.id, 'blur', frame, kfIndex) ?? ((overlay as any).blur ?? 0)

    // Apply blend mode and blur wrapping the text draw
    const textBlend = (overlay as any).blendMode
    const hasMask = !!(overlay as any).maskId
    if ((textBlend && textBlend !== 'source-over' && textBlend !== 'normal') || blur > 0 || hasMask) {
      ctx.save()
      // Mask
      if (hasMask) {
        const mask = findMask((overlay as any).maskId, props)
        if (mask) {
          applyVectorMask(ctx, mask as any, frame, kfIndex, kf)
        }
      }
      if (textBlend && textBlend !== 'source-over' && textBlend !== 'normal') {
        ctx.globalCompositeOperation = textBlend as GlobalCompositeOperation
      }
      if (blur > 0) {
        ctx.filter = `blur(${blur}px)`
      }
    }

    drawTextOverlay(ctx, overlay, props.width, props.height, freeX, freeY, fontSize, opacity, rotation, letterSpacing, lineHeight, backgroundOpacity)

    if ((textBlend && textBlend !== 'source-over' && textBlend !== 'normal') || blur > 0 || hasMask) {
      ctx.restore()
    }
  }
}

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: TextOverlayData,
  canvasWidth: number,
  canvasHeight: number,
  freeX: number,
  freeY: number,
  fontSize: number,
  opacity: number,
  rotation: number,
  letterSpacing: number,
  lineHeight: number,
  backgroundOpacity: number,
) {
  const {
    content, fontFamily, fontWeight, color, align,
    textCase, shadow, background, position,
  } = overlay

  // Apply text case
  let displayText = content
  if (textCase === 'uppercase') displayText = content.toUpperCase()
  else if (textCase === 'lowercase') displayText = content.toLowerCase()

  const lines = displayText.split('\n')

  // Calculate position
  let x: number
  let y: number
  let textAlign: CanvasTextAlign = (align as CanvasTextAlign) || 'center'

  switch (position) {
    case 'top':
      x = canvasWidth / 2
      y = canvasHeight * 0.08
      textAlign = 'center'
      break
    case 'center':
      x = canvasWidth / 2
      y = canvasHeight / 2 - (lines.length * fontSize * lineHeight) / 2
      textAlign = 'center'
      break
    case 'bottom':
      x = canvasWidth / 2
      y = canvasHeight * 0.92 - (lines.length * fontSize * lineHeight)
      textAlign = 'center'
      break
    case 'free':
    default:
      x = (freeX / 100) * canvasWidth
      y = (freeY / 100) * canvasHeight - (lines.length * fontSize * lineHeight) / 2
      break
  }

  ctx.save()
  ctx.globalAlpha = opacity

  if (position === 'free' && rotation !== 0) {
    ctx.translate(x, y + (lines.length * fontSize * lineHeight) / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-x, -(y + (lines.length * fontSize * lineHeight) / 2))
  }

  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`
  ctx.textAlign = textAlign
  ctx.textBaseline = 'top'

  // Draw background
  if (background) {
    const paddingYMul = overlay.backgroundPaddingY
    const paddingXMul = overlay.backgroundPaddingX
    const padding = paddingYMul != null ? Math.max(1, fontSize * paddingYMul) : fontSize * 0.15
    const paddingH = paddingXMul != null ? Math.max(1, fontSize * paddingXMul) : fontSize * 0.3
    const maxLineWidth = lines.reduce((max, line) => {
      return Math.max(max, ctx.measureText(line).width)
    }, 0)
    const totalHeight = lines.length * fontSize * lineHeight + padding * 2
    const bgX = textAlign === 'center' ? x - maxLineWidth / 2 - paddingH : x - paddingH
    const bgY = y - padding

    // Use custom backgroundColor if provided
    const bgColorHex = overlay.backgroundColor || '#000000'
    const hexToRgb = (hex: string) => {
      const h = hex.replace('#', '')
      return {
        r: parseInt(h.substring(0, 2), 16) || 0,
        g: parseInt(h.substring(2, 4), 16) || 0,
        b: parseInt(h.substring(4, 6), 16) || 0,
      }
    }
    const bgRgb = hexToRgb(bgColorHex)
    ctx.fillStyle = `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${backgroundOpacity})`

    const borderRadius = overlay.backgroundBorderRadius ?? 6
    ctx.beginPath()
    ctx.roundRect(bgX, bgY, maxLineWidth + paddingH * 2, totalHeight, borderRadius)
    ctx.fill()
  }

  // Draw text lines
  for (let i = 0; i < lines.length; i++) {
    const lineY = y + i * fontSize * lineHeight
    const line = lines[i] || '\u00A0'

    // Text shadow
    if (shadow) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillText(line, x, lineY + 2)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillText(line, x, lineY + 1)
    }

    // Main text
    ctx.fillStyle = color
    if (letterSpacing > 0) {
      drawTextWithLetterSpacing(ctx, line, x, lineY, letterSpacing, textAlign)
    } else {
      ctx.fillText(line, x, lineY)
    }
  }

  ctx.restore()
}

function drawTextWithLetterSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: CanvasTextAlign,
) {
  // Calculate total width for centering
  let totalWidth = 0
  for (const char of text) {
    totalWidth += ctx.measureText(char).width + spacing
  }
  totalWidth -= spacing // Remove trailing spacing

  let startX = x
  if (align === 'center') startX = x - totalWidth / 2
  else if (align === 'right') startX = x - totalWidth

  ctx.textAlign = 'left'
  let currentX = startX
  for (const char of text) {
    ctx.fillText(char, currentX, y)
    currentX += ctx.measureText(char).width + spacing
  }
}

// ── Crowd / background characters renderer ──────────────────────────

function drawCrowdLayers(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
) {
  if (!props.crowdGroups) return

  const { width, height, fps } = props
  const t = frame / fps

  for (const group of props.crowdGroups) {
    if (!group.visible) continue
    if (frame < group.startFrame || frame >= group.endFrame) continue

    for (const member of group.members) {
      const sway = Math.sin(t * member.swaySpeed * 2 + member.swayPhase) * 3 * member.scale
      const bob = Math.sin(t * member.bobSpeed * 2 + member.bobPhase) * 2 * member.scale

      const cx = member.x * width + sway
      const cy = member.y * height + bob

      const baseSize = Math.min(width, height) * 0.025
      const s = baseSize * member.scale

      ctx.save()
      ctx.globalAlpha = member.opacity

      // Body (rounded rectangle)
      const bodyW = s * 0.9
      const bodyH = s * 1.4 * member.heightRatio
      const bodyX = cx - bodyW / 2
      const bodyY = cy - bodyH * 0.3

      ctx.fillStyle = member.outfitColor
      ctx.beginPath()
      ctx.roundRect(bodyX, bodyY, bodyW, bodyH, s * 0.2)
      ctx.fill()

      // Head (ellipse)
      const headR = s * 0.35
      const headY = bodyY - headR * 0.6

      ctx.fillStyle = member.skinColor
      ctx.beginPath()
      ctx.ellipse(cx, headY, headR, headR * 1.1, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
  }
}

// ── Annotations renderer ──────────────────────────────────────────────

function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
) {
  if (!props.annotations) return

  for (const ann of props.annotations) {
    if (!ann.visible) continue
    if (frame < ann.startFrame || frame >= ann.endFrame) continue
    if (ann.points.length < 1) continue

    // Animation progress
    const fadeDuration = 15
    const elapsed = frame - ann.startFrame
    let progress = 1
    if (ann.animation === 'fadeIn') progress = Math.min(1, elapsed / fadeDuration)
    if (ann.animation === 'draw') progress = Math.min(1, elapsed / fadeDuration)
    if (progress <= 0) continue

    const effectiveOpacity = ann.opacity * progress
    const p1 = ann.points[0]
    const p2 = ann.points.length > 1 ? ann.points[ann.points.length - 1] : { x: p1.x + 50, y: p1.y + 50 }

    switch (ann.type) {
      case 'arrow': {
        const endP = ann.animation === 'draw'
          ? { x: p1.x + (p2.x - p1.x) * progress, y: p1.y + (p2.y - p1.y) * progress }
          : p2
        drawAnnotationArrow(ctx, p1, endP, ann.color, ann.thickness, effectiveOpacity)
        break
      }
      case 'circle': {
        const cx = (p1.x + p2.x) / 2
        const cy = (p1.y + p2.y) / 2
        const rx = Math.abs(p2.x - p1.x) / 2
        const ry = Math.abs(p2.y - p1.y) / 2
        ctx.save()
        ctx.globalAlpha = effectiveOpacity
        ctx.strokeStyle = ann.color
        ctx.lineWidth = ann.thickness
        ctx.beginPath()
        ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
        break
      }
      case 'rectangle': {
        ctx.save()
        ctx.globalAlpha = effectiveOpacity
        ctx.strokeStyle = ann.color
        ctx.lineWidth = ann.thickness
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.rect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y))
        ctx.stroke()
        ctx.restore()
        break
      }
      case 'highlight': {
        ctx.save()
        ctx.globalAlpha = effectiveOpacity * 0.35
        ctx.fillStyle = ann.color
        ctx.fillRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y))
        ctx.restore()
        break
      }
      case 'blur': {
        const bx = Math.min(p1.x, p2.x)
        const by = Math.min(p1.y, p2.y)
        const bw = Math.abs(p2.x - p1.x)
        const bh = Math.abs(p2.y - p1.y)
        ctx.save()
        ctx.globalAlpha = effectiveOpacity
        ctx.filter = `blur(${ann.blurRadius ?? 10}px)`
        try {
          ctx.drawImage(ctx.canvas, bx, by, Math.max(bw, 1), Math.max(bh, 1), bx, by, Math.max(bw, 1), Math.max(bh, 1))
        } catch {
          ctx.filter = 'none'
          ctx.fillStyle = 'rgba(128,128,128,0.5)'
          ctx.fillRect(bx, by, bw, bh)
        }
        ctx.filter = 'none'
        ctx.restore()
        break
      }
      case 'text': {
        ctx.save()
        ctx.globalAlpha = effectiveOpacity
        ctx.fillStyle = ann.color
        ctx.font = `${Math.max(14, ann.thickness * 6)}px Inter, system-ui, sans-serif`
        ctx.textBaseline = 'top'
        ctx.fillText(ann.textContent ?? 'Text', p1.x, p1.y)
        ctx.restore()
        break
      }
      case 'freehand': {
        const pts = ann.animation === 'draw' && progress < 1
          ? ann.points.slice(0, Math.max(2, Math.ceil(ann.points.length * progress)))
          : ann.points
        if (pts.length >= 2) {
          ctx.save()
          ctx.globalAlpha = effectiveOpacity
          ctx.strokeStyle = ann.color
          ctx.lineWidth = ann.thickness
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          ctx.moveTo(pts[0].x, pts[0].y)
          for (let i = 1; i < pts.length - 1; i++) {
            const midX = (pts[i].x + pts[i + 1].x) / 2
            const midY = (pts[i].y + pts[i + 1].y) / 2
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY)
          }
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
          ctx.stroke()
          ctx.restore()
        }
        break
      }
    }
  }
}

function drawAnnotationArrow(
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  color: string,
  thickness: number,
  opacity: number,
) {
  const headLen = Math.max(12, thickness * 4)
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = thickness
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.lineTo(p2.x, p2.y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(p2.x, p2.y)
  ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawCaptions(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
) {
  const { captions, width, height } = props
  if (!captions || !captions.wordTimeline || captions.wordTimeline.length === 0) return

  const captionData = getCaptionAtFrame(captions, frame)
  if (!captionData) return

  const { style, fontSize, position } = captions
  const words = captionData.text.split(' ')

  // Position
  let y: number
  switch (position) {
    case 'top':
      y = 32
      break
    case 'center':
      y = height / 2
      break
    case 'bottom':
    default:
      y = height - 32 - fontSize - 24
      break
  }

  // Measure text for background
  ctx.font = `bold ${fontSize}px sans-serif`

  if (style === 'karaoke') {
    // Draw each word with highlight
    const wordWidths = words.map(w => ctx.measureText(w + ' ').width)
    const totalWidth = wordWidths.reduce((sum, w) => sum + w, 0) - ctx.measureText(' ').width
    const gap = 8
    const padding = 24
    const paddingV = 12

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.beginPath()
    ctx.roundRect(
      width / 2 - totalWidth / 2 - padding - (gap * (words.length - 1)) / 2,
      y - paddingV,
      totalWidth + padding * 2 + gap * (words.length - 1),
      fontSize + paddingV * 2,
      12,
    )
    ctx.fill()

    // Draw words
    let wordX = width / 2 - totalWidth / 2 - (gap * (words.length - 1)) / 2
    for (let i = 0; i < words.length; i++) {
      const isHighlighted = i === captionData.highlightIndex
      ctx.fillStyle = isHighlighted ? '#4ade80' : 'rgba(255, 255, 255, 0.7)'

      // Text shadow
      ctx.save()
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillText(words[i], wordX, y + 2)
      ctx.restore()

      ctx.fillStyle = isHighlighted ? '#4ade80' : 'rgba(255, 255, 255, 0.7)'
      ctx.textAlign = 'left'
      ctx.fillText(words[i], wordX, y)
      wordX += wordWidths[i] + gap
    }
  } else {
    // Word-by-word or sentence
    const textColor = style === 'word-by-word' ? '#4ade80' : 'white'
    const textWidth = ctx.measureText(captionData.text).width
    const padding = 24
    const paddingV = 12

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.beginPath()
    ctx.roundRect(
      width / 2 - textWidth / 2 - padding,
      y - paddingV,
      textWidth + padding * 2,
      fontSize + paddingV * 2,
      12,
    )
    ctx.fill()

    // Text shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.textAlign = 'center'
    ctx.fillText(captionData.text, width / 2, y + 2)

    // Main text
    ctx.fillStyle = textColor
    ctx.fillText(captionData.text, width / 2, y)
  }
}

// ── Retention Hooks renderer ──────────────────────────────────────────

function drawRetentionHooks(
  ctx: CanvasRenderingContext2D,
  props: VideoCompositionProps,
  frame: number,
) {
  if (!props.retentionHooks || props.retentionHooks.length === 0) return

  const { width, height, durationInFrames, fps } = props
  const progress = durationInFrames > 0 ? frame / durationInFrames : 0
  const secondsLeft = durationInFrames > 0 ? (durationInFrames - frame) / fps : 0

  for (const hook of props.retentionHooks) {
    const { primary, secondary } = getHookColors(hook)
    const yTop = hook.position === 'top'

    switch (hook.type) {
      case 'progress-bar': {
        const barH = hook.style === 'minimal' ? 3 : 5
        const barY = yTop ? 0 : height - barH
        // Background track
        ctx.save()
        ctx.fillStyle = secondary
        ctx.fillRect(0, barY, width, barH)
        // Filled portion
        if (hook.style === 'gradient') {
          const grad = ctx.createLinearGradient(0, barY, width * progress, barY)
          grad.addColorStop(0, '#f43f5e')
          grad.addColorStop(1, '#8b5cf6')
          ctx.fillStyle = grad
        } else {
          ctx.fillStyle = primary
        }
        ctx.fillRect(0, barY, width * progress, barH)
        if (hook.style === 'neon') {
          ctx.shadowColor = primary
          ctx.shadowBlur = 8
          ctx.fillRect(0, barY, width * progress, barH)
          ctx.shadowBlur = 0
        }
        ctx.restore()
        break
      }

      case 'countdown': {
        const cdSecondsLeft = hook.countdownFrom != null
          ? hook.countdownFrom * (1 - progress)
          : secondsLeft
        const cdY = yTop ? 12 : height - 48
        const cdX = width - 48
        const radius = 18
        ctx.save()
        // Circle background
        ctx.beginPath()
        ctx.arc(cdX + radius, cdY + radius, radius, 0, Math.PI * 2)
        ctx.fillStyle = `${primary}33`
        ctx.fill()
        ctx.strokeStyle = primary
        ctx.lineWidth = 2
        ctx.stroke()
        if (hook.style === 'neon') {
          ctx.shadowColor = primary
          ctx.shadowBlur = 12
          ctx.stroke()
          ctx.shadowBlur = 0
        }
        // Number
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(Math.max(0, Math.ceil(cdSecondsLeft))), cdX + radius, cdY + radius)
        ctx.restore()
        break
      }

      case 'chapter-marker': {
        const chapters = hook.chapters || []
        if (chapters.length === 0) break
        const currentChapter = Math.min(
          chapters.length - 1,
          Math.floor(progress * chapters.length),
        )
        const cmY = yTop ? 8 : height - 30
        const marginX = 16
        const dotH = 4
        const gap = 4
        const totalW = width - marginX * 2
        const dotW = (totalW - gap * (chapters.length - 1)) / chapters.length
        ctx.save()
        for (let i = 0; i < chapters.length; i++) {
          const dx = marginX + i * (dotW + gap)
          ctx.fillStyle = i <= currentChapter ? primary : secondary
          ctx.beginPath()
          ctx.roundRect(dx, cmY, dotW, dotH, 2)
          ctx.fill()
        }
        // Label
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = 0.9
        ctx.font = '500 11px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(chapters[currentChapter], marginX, cmY + dotH + 4)
        ctx.restore()
        break
      }

      case 'wait-for-it': {
        const triggerFrame = hook.triggerFrame ?? Math.round(durationInFrames * 0.7)
        if (frame < triggerFrame) break
        const text = hook.text || 'Wait for it...'
        const elapsed = frame - triggerFrame
        const pulse = 0.7 + 0.3 * Math.sin(elapsed * 0.15)
        const wfY = yTop ? 55 : height - 55
        ctx.save()
        ctx.globalAlpha = pulse
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 18px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = primary
        ctx.shadowBlur = 12
        ctx.fillText(text, width / 2, wfY)
        ctx.shadowBlur = 0
        ctx.restore()
        break
      }

      case 'step-counter': {
        const total = hook.totalSteps || 1
        let current: number
        if (hook.stepBoundaries && hook.stepBoundaries.length > 0) {
          current = 1
          for (const boundary of hook.stepBoundaries) {
            if (frame >= boundary) current++
          }
          current = Math.min(current, total)
        } else {
          current = Math.min(total, Math.floor(progress * total) + 1)
        }
        const scY = yTop ? 12 : height - 36
        const scX = 12
        const label = `Step ${current}/${total}`
        ctx.save()
        ctx.font = 'bold 13px sans-serif'
        const textW = ctx.measureText(label).width
        const pillW = textW + 24
        const pillH = 24
        // Pill background
        ctx.fillStyle = `${primary}cc`
        ctx.beginPath()
        ctx.roundRect(scX, scY, pillW, pillH, 16)
        ctx.fill()
        // Text
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, scX + pillW / 2, scY + pillH / 2)
        ctx.restore()
        break
      }
    }
  }
}

function getHookColors(hook: { style: string; color?: string }): { primary: string; secondary: string } {
  const base = hook.color || '#6366f1'
  switch (hook.style) {
    case 'neon':
      return { primary: base, secondary: `${base}88` }
    case 'gradient':
      return { primary: '#f43f5e', secondary: '#8b5cf6' }
    default:
      return { primary: base, secondary: `${base}66` }
  }
}
