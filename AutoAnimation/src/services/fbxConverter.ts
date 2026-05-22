/**
 * Client-side FBX → GLB conversion using Three.js FBXLoader + GLTFExporter.
 * Shared by HunyuanMotion pipeline and the 3D character import panel.
 *
 * When a texture blob URL map is provided (from ZIP/folder extraction),
 * a custom LoadingManager intercepts FBXLoader's texture requests and
 * resolves them using a 5-strategy cascading matcher:
 *   1. Direct URL lookup
 *   2. Basename extraction
 *   3. Stem (no extension) lookup
 *   4. Fuzzy basename iteration
 *   5. Fuzzy stem iteration
 */
import * as THREE from 'three'

const LOG = '[FBXConverter]'

const textureKeys = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
  'aoMap',
  'alphaMap',
  'bumpMap',
  'displacementMap',
  'envMap',
  'lightMap',
  'specularMap',
] as const

/**
 * Convert FBX Phong/Lambert materials to MeshStandardMaterial (PBR).
 *
 * FBXLoader creates MeshPhongMaterial with emissive/specular/shininess.
 * GLTFExporter expects MeshStandardMaterial — when it encounters Phong,
 * it forces roughness=1.0 and may preserve bright emissive values,
 * resulting in washed-out, overly white/bright models.
 *
 * This function properly converts Phong properties to PBR equivalents:
 * - shininess (0–1000) → roughness (1.0–0.0)
 * - emissive is zeroed out (FBX defaults often set it to white)
 * - metalness defaults to 0 (non-metal)
 * - all texture maps are transferred
 */
function convertMaterialsToPBR(scene: THREE.Group) {
  let converted = 0
  let textureCount = 0
  scene.traverse((obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.material) return

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const newMaterials: THREE.Material[] = []

    for (const mat of materials) {
      // Only convert Phong/Lambert — leave Standard materials as-is
      const isPhong = (mat as any).isMeshPhongMaterial
      const isLambert = (mat as any).isMeshLambertMaterial
      if (!isPhong && !isLambert) {
        newMaterials.push(mat)
        continue
      }

      const src = mat as THREE.MeshPhongMaterial

      // Convert shininess (0–1000) to roughness (0.0–1.0)
      // Higher shininess = lower roughness (shinier surface)
      const shininess = (src as any).shininess ?? 30
      const roughness = Math.max(0.04, 1.0 - Math.sqrt(shininess / 1000))

      // Log material properties for debugging
      const hasMap = !!(src.map && src.map.image)
      const srcColor = src.color
      console.log(
        LOG,
        `Material "${src.name}": color=#${srcColor?.getHexString()}, hasMap=${hasMap},`,
        `vertexColors=${src.vertexColors}, shininess=${shininess}`,
      )

      const standard = new THREE.MeshStandardMaterial({
        name: src.name,
        color: src.color?.clone() ?? new THREE.Color(0xffffff),
        map: src.map ?? null,
        normalMap: src.normalMap ?? null,
        normalScale: src.normalScale?.clone(),
        aoMap: src.aoMap ?? null,
        aoMapIntensity: src.aoMapIntensity,
        bumpMap: src.bumpMap ?? null,
        bumpScale: src.bumpScale,
        displacementMap: src.displacementMap ?? null,
        displacementScale: src.displacementScale,
        displacementBias: src.displacementBias,
        alphaMap: src.alphaMap ?? null,
        envMap: src.envMap ?? null,
        lightMap: src.lightMap ?? null,
        lightMapIntensity: src.lightMapIntensity,

        // PBR properties — derived from Phong
        roughness,
        metalness: 0, // FBX models are generally non-metallic

        // Zero out emissive — FBX often defaults this to white/bright values
        // which causes the washed-out appearance in PBR renderers
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        emissiveMap: null,

        // Preserve transparency settings
        transparent: src.transparent,
        opacity: src.opacity,
        side: src.side,
        alphaTest: src.alphaTest,

        // Preserve vertex colors if present
        vertexColors: src.vertexColors,
      })

      // Set correct colorSpace on color-contributing textures so
      // GLTFExporter encodes them properly (sRGB for color, Linear for data)
      const colorTextures: (keyof THREE.MeshStandardMaterial)[] = ['map']
      const dataTextures: (keyof THREE.MeshStandardMaterial)[] = [
        'normalMap',
        'aoMap',
        'bumpMap',
        'displacementMap',
        'roughnessMap',
        'metalnessMap',
      ]

      for (const key of colorTextures) {
        const tex = (standard as any)[key] as THREE.Texture | null
        if (tex) {
          tex.colorSpace = THREE.SRGBColorSpace
          tex.needsUpdate = true
          textureCount++
        }
      }
      for (const key of dataTextures) {
        const tex = (standard as any)[key] as THREE.Texture | null
        if (tex) {
          tex.colorSpace = THREE.LinearSRGBColorSpace
          tex.needsUpdate = true
          textureCount++
        }
      }

      newMaterials.push(standard)
      converted++
    }

    // Apply converted materials
    mesh.material = newMaterials.length === 1 ? newMaterials[0] : newMaterials
  })

  if (converted > 0) {
    console.log(
      LOG,
      `Converted ${converted} Phong/Lambert material(s) → MeshStandardMaterial (PBR), ${textureCount} texture(s) tagged`,
    )
  }
}

/**
 * Scale animation position tracks to correct FBX unit mismatch.
 *
 * FBX files use centimeters by default (UnitScaleFactor = 1 means 1 unit = 1cm).
 * Three.js / GLTF uses meters. FBXLoader stores the scale factor in
 * sceneGraph.userData.unitScaleFactor but never applies it to animation
 * track values. This function reads that factor and scales all .position
 * tracks so animations play at the correct magnitude.
 */
function scaleAnimationPositions(scene: THREE.Group) {
  const unitScaleFactor = (scene.userData?.unitScaleFactor ?? 1) as number
  // UnitScaleFactor = 1 → 1 unit = 1cm → multiply by 0.01 to get meters
  // UnitScaleFactor = 100 → 1 unit = 1m → multiply by 1.0 (no change needed)
  const scale = unitScaleFactor * 0.01

  if (Math.abs(scale - 1.0) < 0.001) {
    console.log(LOG, `Unit scale: ${unitScaleFactor} (already meters, no scaling needed)`)
    return
  }

  console.log(LOG, `Unit scale: ${unitScaleFactor} → applying ${scale.toFixed(4)}x to position tracks`)

  let scaledTracks = 0
  for (const clip of scene.animations) {
    for (const track of clip.tracks) {
      // Only scale position tracks — rotation (quaternion) and scale tracks
      // are unit-independent and should not be modified
      if (!track.name.endsWith('.position')) continue

      const values = track.values
      for (let i = 0; i < values.length; i++) {
        values[i] *= scale
      }
      scaledTracks++
    }
  }

  if (scaledTracks > 0) {
    console.log(LOG, `Scaled ${scaledTracks} position track(s) by ${scale.toFixed(4)}x`)
  }
}

/**
 * Collect every texture image from the scene (HTMLImageElement or ImageBitmap).
 * Used to explicitly wait for async loads that LoadingManager might miss.
 */
function collectTextureImages(scene: THREE.Group): HTMLImageElement[] {
  const images: HTMLImageElement[] = []
  scene.traverse((obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.material) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of materials) {
      const matAny = mat as any
      for (const key of textureKeys) {
        const tex = matAny[key] as THREE.Texture | undefined
        if (tex?.image instanceof HTMLImageElement) {
          images.push(tex.image)
        }
      }
    }
  })
  return images
}

/**
 * Wait for all HTMLImageElement textures in the scene to finish loading.
 * FBXLoader creates blob:/data: URLs that load asynchronously — the
 * LoadingManager alone doesn't reliably track all of them.
 */
async function waitForTextureImages(scene: THREE.Group, timeoutMs = 8000): Promise<void> {
  const images = collectTextureImages(scene)
  if (images.length === 0) return

  const pending = images.filter((img) => !img.complete)
  if (pending.length === 0) {
    console.log(LOG, `All ${images.length} texture image(s) already loaded`)
    return
  }

  console.log(LOG, `Waiting for ${pending.length}/${images.length} texture image(s) to load...`)

  await Promise.race([
    Promise.allSettled(
      pending.map(
        (img) =>
          new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          }),
      ),
    ),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ])

  console.log(LOG, 'Texture image wait complete')
}

/**
 * Strip textures whose images failed to load (external refs that don't
 * exist in the browser). Only call this AFTER waitForTextureImages().
 * Returns count of stripped textures so the UI can show a warning.
 */
function stripFailedTextures(scene: THREE.Group): { kept: number; stripped: number } {
  let stripped = 0
  let kept = 0
  scene.traverse((obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.material) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of materials) {
      const matAny = mat as any
      for (const key of textureKeys) {
        const tex = matAny[key] as THREE.Texture | undefined
        if (!tex) continue

        const img = tex.image
        if (!img) {
          console.log(LOG, `Strip [${key}] "${mat.name}": no image object`)
          tex.dispose()
          matAny[key] = null
          stripped++
          continue
        }

        // Valid texture sources: Canvas, ImageBitmap, DataTexture, loaded Image
        const isCanvas =
          img instanceof HTMLCanvasElement || (typeof OffscreenCanvas !== 'undefined' && img instanceof OffscreenCanvas)
        const isImageBitmap = typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap
        const isLoadedImg = img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0
        const imgAny = img as any
        const isDataTexture = imgAny?.data instanceof Uint8Array || imgAny?.data instanceof Float32Array

        if (isCanvas || isImageBitmap || isLoadedImg || isDataTexture) {
          kept++
        } else {
          console.log(
            LOG,
            `Strip [${key}] "${mat.name}": type=${img?.constructor?.name}`,
            `complete=${img instanceof HTMLImageElement ? img.complete : 'n/a'}`,
            `naturalWidth=${img instanceof HTMLImageElement ? img.naturalWidth : 'n/a'}`,
            `src=${img instanceof HTMLImageElement ? img.src?.substring(0, 80) : 'n/a'}`,
          )
          tex.dispose()
          matAny[key] = null
          stripped++
        }
      }
    }
  })
  if (stripped > 0 || kept > 0) {
    console.log(LOG, `Textures: ${kept} kept, ${stripped} stripped (failed to load)`)
  }
  return { kept, stripped }
}

/**
 * Rasterize all HTMLImageElement textures to canvas elements.
 * GLTFExporter serializes textures by drawing them to a <canvas> and reading
 * the pixel data. HTMLImageElements from blob: URLs (created by FBXLoader for
 * embedded textures) can fail silently during this canvas draw — the exporter
 * drops the texture and the GLB ends up with white/untextured materials.
 *
 * By pre-rasterizing to canvas here, we guarantee the pixel data is available
 * in a format GLTFExporter can always read.
 */
function rasterizeTexturesToCanvas(scene: THREE.Group) {
  let rasterized = 0
  const seen = new Set<THREE.Texture>()
  scene.traverse((obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.material) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of materials) {
      const matAny = mat as any
      for (const key of textureKeys) {
        const tex = matAny[key] as THREE.Texture | undefined
        if (!tex || seen.has(tex)) continue
        seen.add(tex)

        const img = tex.image
        if (!(img instanceof HTMLImageElement) || !img.complete || img.naturalWidth === 0) continue

        // Draw to canvas
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) continue

        ctx.drawImage(img, 0, 0)
        tex.image = canvas
        tex.needsUpdate = true
        rasterized++
      }
    }
  })
  if (rasterized > 0) {
    console.log(LOG, `Rasterized ${rasterized} texture(s) from HTMLImageElement → Canvas for GLTFExporter`)
  }
}

/**
 * Rebind all SkinnedMesh skeletons to ensure GLTFExporter
 * receives properly bound meshes with correct boneInverses and bindMatrix.
 *
 * FBXLoader creates SkinnedMesh objects that reference skeleton bones, but
 * after material conversion (Phong→Standard) and other scene modifications,
 * the mesh-skeleton binding may be stale. GLTFExporter needs a fresh binding
 * to correctly export skin data (skinIndex, skinWeight, boneInverses).
 */
function rebindSkinnedMeshes(scene: THREE.Group) {
  let rebound = 0
  scene.traverse((obj: THREE.Object3D) => {
    if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
      const skinnedMesh = obj as THREE.SkinnedMesh
      if (skinnedMesh.skeleton) {
        // Force update of the entire scene's world matrices so bones
        // have correct matrixWorld values for boneInverse calculation
        scene.updateMatrixWorld(true)

        // Rebind: recalculates boneInverses from current bone world matrices
        // and sets bindMatrix from the mesh's current world matrix
        skinnedMesh.bind(skinnedMesh.skeleton)
        rebound++
      }
    }
  })
  if (rebound > 0) {
    console.log(LOG, `Rebound ${rebound} SkinnedMesh skeleton(s) for GLTFExporter`)
  }
}

/**
 * Export a Three.js scene to GLB binary.
 */
async function exportToGlb(scene: THREE.Group, GLTFExporter: any): Promise<Blob> {
  const exporter = new GLTFExporter()
  const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      scene,
      (result: ArrayBuffer | object) => {
        if (result instanceof ArrayBuffer) {
          resolve(result)
        } else {
          reject(new Error('GLTFExporter returned JSON instead of binary'))
        }
      },
      (error: Error) => reject(error),
      { binary: true, animations: scene.animations },
    )
  })
  return new Blob([glbBuffer], { type: 'model/gltf-binary' })
}

/** Extract basename from a path (handles both / and \ separators). */
function extractBasename(url: string): string {
  return url.split('/').pop()?.split('\\').pop() || url
}

/** Extract filename stem (no extension) from a basename. */
function extractStem(basename: string): string {
  return basename.replace(/\.[^.]+$/, '').toLowerCase()
}

/**
 * 5-strategy cascading texture lookup.
 * Tries progressively fuzzier matching until a blob URL is found.
 */
function resolveTextureUrl(url: string, map: Map<string, string>): string | null {
  // Strategy 1: Direct lookup (exact URL or lowercase)
  const direct = map.get(url) || map.get(url.toLowerCase())
  if (direct) return direct

  // Strategy 2: Basename extraction + direct lookup
  const basename = extractBasename(url)
  const lowerBasename = basename.toLowerCase()
  const byBasename = map.get(basename) || map.get(lowerBasename)
  if (byBasename) return byBasename

  // Strategy 3: Stem (no extension) lookup
  // Handles FBX referencing "diffuse.png" but ZIP has "diffuse.tga"
  const stem = extractStem(basename)
  if (stem.length > 0) {
    const byStem = map.get(stem)
    if (byStem) return byStem
  }

  // Strategy 4: Fuzzy — iterate all keys, find one whose basename matches
  for (const [key, blobUrl] of map) {
    const keyBasename = extractBasename(key).toLowerCase()
    if (keyBasename === lowerBasename) return blobUrl
  }

  // Strategy 5: Stem fuzzy — match by filename stem across all keys
  if (stem.length > 0) {
    for (const [key, blobUrl] of map) {
      const keyStem = extractStem(extractBasename(key))
      if (keyStem === stem && keyStem.length > 0) return blobUrl
    }
  }

  return null
}

export interface FbxConversionResult {
  blob: Blob
  /** Number of texture maps that failed to load and were stripped */
  strippedTextures: number
}

export interface ParsedFbxScene {
  scene: THREE.Group
  animations: THREE.AnimationClip[]
  strippedTextures: number
}

/**
 * Parse FBX into a processed Three.js scene WITHOUT exporting to GLB.
 * Use this when you need to analyze/simplify the scene before export
 * (avoids ERR_BLOB_OUT_OF_MEMORY for large models).
 *
 * Call `exportSceneToGlb(scene, animations)` after to get the GLB blob.
 */
export async function parseFbxToScene(
  fbxBuffer: ArrayBuffer,
  textureBlobUrls?: Map<string, string>,
): Promise<ParsedFbxScene> {
  const hasTextures = textureBlobUrls && textureBlobUrls.size > 0
  console.log(
    LOG,
    `Parsing FBX (${(fbxBuffer.byteLength / 1024).toFixed(0)} KB, ${hasTextures ? textureBlobUrls!.size + ' lookup key(s)' : 'no textures'})`,
  )

  const [{ FBXLoader }, { TGALoader }] = await Promise.all([
    import('three/examples/jsm/loaders/FBXLoader.js'),
    import('three/examples/jsm/loaders/TGALoader.js'),
  ])

  const manager = new THREE.LoadingManager()
  manager.addHandler(/\.tga$/i, new TGALoader(manager))

  if (hasTextures) {
    manager.setURLModifier((url: string) => {
      if (url.startsWith('blob:') || url.startsWith('data:')) return url
      const blobUrl = resolveTextureUrl(url, textureBlobUrls!)
      if (blobUrl) {
        console.log(LOG, `Resolved texture: "${url}" → blob URL`)
        return blobUrl
      }
      console.warn(LOG, `Texture not found in bundle: "${url}"`)
      return url
    })
  }

  const loader = new FBXLoader(manager)
  const fbxScene = loader.parse(fbxBuffer, '')
  console.log(LOG, `FBX parsed: ${fbxScene.children.length} children, ${fbxScene.animations?.length ?? 0} animations`)

  await waitForTextureImages(fbxScene)
  const { stripped: strippedTextures } = stripFailedTextures(fbxScene)
  convertMaterialsToPBR(fbxScene)
  scaleAnimationPositions(fbxScene)
  rebindSkinnedMeshes(fbxScene)
  rasterizeTexturesToCanvas(fbxScene)

  return { scene: fbxScene, animations: fbxScene.animations ?? [], strippedTextures }
}

/**
 * Export a processed Three.js scene to GLB binary blob.
 */
export async function exportSceneToGlb(scene: THREE.Group, animations: THREE.AnimationClip[]): Promise<Blob> {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
  scene.animations = animations
  const blob = await exportToGlb(scene, GLTFExporter)
  console.log(LOG, `Scene → GLB OK: ${(blob.size / 1024).toFixed(0)} KB`)
  return blob
}

/**
 * Convert an FBX blob to a GLB blob client-side (no external textures).
 * Backward-compatible entry point used by HunyuanMotion and single-file FBX import.
 */
export async function convertFbxBlobToGlb(fbxBlob: Blob): Promise<Blob> {
  console.log(LOG, `Converting FBX → GLB (${(fbxBlob.size / 1024).toFixed(0)} KB)`)
  const buffer = await fbxBlob.arrayBuffer()
  const result = await convertFbxBufferToGlbEx(buffer)
  return result.blob
}

/**
 * Convert an FBX ArrayBuffer to a GLB blob, optionally resolving texture
 * references using a map of path keys → blob URLs (from ZIP/folder extraction).
 */
export async function convertFbxBufferToGlb(
  fbxBuffer: ArrayBuffer,
  textureBlobUrls?: Map<string, string>,
): Promise<Blob> {
  const result = await convertFbxBufferToGlbEx(fbxBuffer, textureBlobUrls)
  return result.blob
}

/**
 * Extended variant that returns texture stripping info for UI warnings.
 */
export async function convertFbxBufferToGlbEx(
  fbxBuffer: ArrayBuffer,
  textureBlobUrls?: Map<string, string>,
): Promise<FbxConversionResult> {
  const hasTextures = textureBlobUrls && textureBlobUrls.size > 0
  console.log(
    LOG,
    `Converting FBX → GLB (${(fbxBuffer.byteLength / 1024).toFixed(0)} KB, ${hasTextures ? textureBlobUrls!.size + ' lookup key(s)' : 'no textures'})`,
  )

  // Always load TGALoader — FBX files commonly embed TGA textures.
  // Without it, FBXLoader silently skips TGA images → white model.
  const [{ FBXLoader }, { GLTFExporter }, { TGALoader }] = await Promise.all([
    import('three/examples/jsm/loaders/FBXLoader.js'),
    import('three/examples/jsm/exporters/GLTFExporter.js'),
    import('three/examples/jsm/loaders/TGALoader.js'),
  ])

  // Create LoadingManager with URL modifier to resolve texture blob URLs
  const manager = new THREE.LoadingManager()

  // Register TGA handler so FBXLoader can decode embedded TGA textures
  manager.addHandler(/\.tga$/i, new TGALoader(manager))

  if (hasTextures) {
    manager.setURLModifier((url: string) => {
      // Skip blob: and data: URLs (already resolved, e.g. embedded textures)
      if (url.startsWith('blob:') || url.startsWith('data:')) return url

      const blobUrl = resolveTextureUrl(url, textureBlobUrls!)
      if (blobUrl) {
        console.log(LOG, `Resolved texture: "${url}" → blob URL`)
        return blobUrl
      }

      console.warn(LOG, `Texture not found in bundle: "${url}"`)
      return url
    })
  }

  const loader = new FBXLoader(manager)

  // Parse FBX — synchronous but queues async texture image loads
  const fbxScene = loader.parse(fbxBuffer, '')
  console.log(LOG, `FBX parsed: ${fbxScene.children.length} children, ${fbxScene.animations?.length ?? 0} animations`)

  // Explicitly wait for every texture HTMLImageElement to finish loading.
  // FBXLoader creates blob:/data: URLs for embedded textures that load async;
  // LoadingManager alone doesn't reliably cover all of them.
  await waitForTextureImages(fbxScene)

  // Now strip textures that truly failed (external file refs with no data)
  const { stripped: strippedTextures } = stripFailedTextures(fbxScene)

  // Convert Phong/Lambert → MeshStandardMaterial so GLTFExporter gets
  // proper PBR values instead of forcing roughness=1 and keeping bright emissive
  convertMaterialsToPBR(fbxScene)

  // Scale animation position tracks from FBX centimeters to GLTF meters
  scaleAnimationPositions(fbxScene)

  // Rebind all SkinnedMesh skeletons before export.
  // FBXLoader creates SkinnedMesh objects with skeleton references, but
  // GLTFExporter requires properly bound skeletons with fresh boneInverses
  // and bindMatrix computed from the current scene-graph state.
  // Without this, the exported GLB has broken or missing skinning data —
  // the mesh looks fine at rest (identity bone transforms) but doesn't
  // deform when bones are moved.
  rebindSkinnedMeshes(fbxScene)

  // Rasterize texture images to canvas so GLTFExporter can reliably
  // serialize them. HTMLImageElements from blob: URLs can fail silently
  // during export, resulting in textureless/white models.
  rasterizeTexturesToCanvas(fbxScene)

  const blob = await exportToGlb(fbxScene, GLTFExporter)
  console.log(LOG, `FBX → GLB OK: ${(blob.size / 1024).toFixed(0)} KB`)
  return { blob, strippedTextures }
}
