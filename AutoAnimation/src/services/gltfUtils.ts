/**
 * GLTF/GLB loading utilities.
 * Handles skeleton extraction, bone naming detection,
 * bone mapping, and thumbnail generation.
 */
import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { SkeletonType, BoneMapping, StandardBoneName } from '@/types/character3d'

// ─── Bone Naming Patterns ───────────────────────────────────────────────────

/** Mixamo bone naming convention (e.g., "mixamorig:Hips") */
const MIXAMO_MAPPING: Record<string, StandardBoneName> = {
  'mixamorig:Hips': 'Pelvis',
  'mixamorig:Spine': 'Spine1',
  'mixamorig:Spine1': 'Spine2',
  'mixamorig:Spine2': 'Spine3',
  'mixamorig:Neck': 'Neck',
  'mixamorig:Head': 'Head',
  'mixamorig:LeftShoulder': 'L_Collar',
  'mixamorig:LeftArm': 'L_Shoulder',
  'mixamorig:LeftForeArm': 'L_Elbow',
  'mixamorig:LeftHand': 'L_Wrist',
  'mixamorig:RightShoulder': 'R_Collar',
  'mixamorig:RightArm': 'R_Shoulder',
  'mixamorig:RightForeArm': 'R_Elbow',
  'mixamorig:RightHand': 'R_Wrist',
  'mixamorig:LeftUpLeg': 'L_Hip',
  'mixamorig:LeftLeg': 'L_Knee',
  'mixamorig:LeftFoot': 'L_Ankle',
  'mixamorig:RightUpLeg': 'R_Hip',
  'mixamorig:RightLeg': 'R_Knee',
  'mixamorig:RightFoot': 'R_Ankle',
}

/** ReadyPlayerMe / generic humanoid naming */
const RPM_MAPPING: Record<string, StandardBoneName> = {
  'Hips': 'Pelvis',
  'Spine': 'Spine1',
  'Spine1': 'Spine2',
  'Spine2': 'Spine3',
  'Neck': 'Neck',
  'Head': 'Head',
  'LeftShoulder': 'L_Collar',
  'LeftArm': 'L_Shoulder',
  'LeftForeArm': 'L_Elbow',
  'LeftHand': 'L_Wrist',
  'RightShoulder': 'R_Collar',
  'RightArm': 'R_Shoulder',
  'RightForeArm': 'R_Elbow',
  'RightHand': 'R_Wrist',
  'LeftUpLeg': 'L_Hip',
  'LeftLeg': 'L_Knee',
  'LeftFoot': 'L_Ankle',
  'RightUpLeg': 'R_Hip',
  'RightLeg': 'R_Knee',
  'RightFoot': 'R_Ankle',
}

/** SMPL-H joint naming (lowercase underscore variant) */
const SMPL_MAPPING: Record<string, StandardBoneName> = {
  'pelvis': 'Pelvis',
  'spine1': 'Spine1',
  'spine2': 'Spine2',
  'spine3': 'Spine3',
  'neck': 'Neck',
  'head': 'Head',
  'left_collar': 'L_Collar',
  'left_shoulder': 'L_Shoulder',
  'left_elbow': 'L_Elbow',
  'left_wrist': 'L_Wrist',
  'right_collar': 'R_Collar',
  'right_shoulder': 'R_Shoulder',
  'right_elbow': 'R_Elbow',
  'right_wrist': 'R_Wrist',
  'left_hip': 'L_Hip',
  'left_knee': 'L_Knee',
  'left_ankle': 'L_Ankle',
  'right_hip': 'R_Hip',
  'right_knee': 'R_Knee',
  'right_ankle': 'R_Ankle',
}

/** HunyuanMotion FBX bone naming (L_/R_ prefix, e.g. "L_Hip", "Spine1") — identity mapping */
const HUNYUAN_MAPPING: Record<string, StandardBoneName> = {
  'Pelvis': 'Pelvis',
  'Spine1': 'Spine1',
  'Spine2': 'Spine2',
  'Spine3': 'Spine3',
  'Neck': 'Neck',
  'Head': 'Head',
  'L_Collar': 'L_Collar',
  'L_Shoulder': 'L_Shoulder',
  'L_Elbow': 'L_Elbow',
  'L_Wrist': 'L_Wrist',
  'R_Collar': 'R_Collar',
  'R_Shoulder': 'R_Shoulder',
  'R_Elbow': 'R_Elbow',
  'R_Wrist': 'R_Wrist',
  'L_Hip': 'L_Hip',
  'L_Knee': 'L_Knee',
  'L_Ankle': 'L_Ankle',
  'R_Hip': 'R_Hip',
  'R_Knee': 'R_Knee',
  'R_Ankle': 'R_Ankle',
}

/** 3ds Max Biped / Character Studio naming (Spine01, L_Clavicle, L_Upperarm) */
const BIPED_MAPPING: Record<string, StandardBoneName> = {
  'Hip': 'Pelvis',
  'Waist': 'Pelvis',
  'Pelvis': 'Pelvis',
  'Spine01': 'Spine1',
  'Spine02': 'Spine2',
  'Spine03': 'Spine3',
  'Neck': 'Neck',
  'NeckTwist01': 'Neck',
  'Head': 'Head',
  'head': 'Head',
  'L_Clavicle': 'L_Collar',
  'L_Upperarm': 'L_Shoulder',
  'L_Forearm': 'L_Elbow',
  'L_Hand': 'L_Wrist',
  'R_Clavicle': 'R_Collar',
  'R_Upperarm': 'R_Shoulder',
  'R_Forearm': 'R_Elbow',
  'R_Hand': 'R_Wrist',
  'L_Thigh': 'L_Hip',
  'L_Calf': 'L_Knee',
  'L_Foot': 'L_Ankle',
  'R_Thigh': 'R_Hip',
  'R_Calf': 'R_Knee',
  'R_Foot': 'R_Ankle',
}

/**
 * Strip trailing numeric suffixes added by FBX→GLB conversion (e.g. "_15", "_2").
 * "Pelvis_15" → "Pelvis", "L_Hip_15" → "L_Hip", "Spine1_15" → "Spine1"
 * Preserves names that legitimately end in digits (e.g. "Spine1", "L_Index2").
 */
function stripBoneSuffix(name: string): string {
  // Match a trailing _N where N is 1+ digits, but only if preceded by a letter
  // This avoids stripping "Spine1" → "Spine" (digit follows letter directly)
  // but DOES strip "Spine1_15" → "Spine1" (digit follows underscore+digits)
  return name.replace(/_\d+$/, '')
}

// ─── GLB Loading ────────────────────────────────────────────────────────────

const loader = new GLTFLoader()

/** Load a GLB file from a URL (blob URL or remote URL) */
export function loadGLTF(url: string): Promise<GLTF> {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf),
      undefined,
      (error) => reject(error)
    )
  })
}

/** Load a GLB file from an ArrayBuffer */
export function parseGLTF(buffer: ArrayBuffer): Promise<GLTF> {
  return new Promise((resolve, reject) => {
    loader.parse(
      buffer,
      '',
      (gltf) => resolve(gltf),
      (error) => reject(error)
    )
  })
}

// ─── Skeleton Analysis ──────────────────────────────────────────────────────

/** Extract all bone names from a GLTF scene */
export function extractBoneNames(scene: THREE.Group): string[] {
  const bones: string[] = []
  scene.traverse((obj) => {
    if (obj instanceof THREE.Bone) {
      bones.push(obj.name)
    }
  })
  return bones
}

/** Extract the skeleton from a GLTF scene (returns first found, consistent with skeletonTree.ts) */
export function extractSkeleton(scene: THREE.Group): THREE.Skeleton | null {
  let skeleton: THREE.Skeleton | null = null
  scene.traverse((obj) => {
    if ((obj as THREE.SkinnedMesh).isSkinnedMesh && (obj as THREE.SkinnedMesh).skeleton && !skeleton) {
      skeleton = (obj as THREE.SkinnedMesh).skeleton
    }
  })
  return skeleton
}

/** Detect the skeleton naming convention from bone names */
export function detectSkeletonType(boneNames: string[]): SkeletonType {
  // Also check suffix-stripped names (FBX→GLB adds "_15" etc.)
  const strippedNames = boneNames.map(stripBoneSuffix)
  const hasName = (indicator: string) =>
    boneNames.includes(indicator) || strippedNames.includes(indicator)

  // Check for Mixamo prefix
  if (boneNames.some((name) => name.startsWith('mixamorig:'))) {
    return 'mixamo'
  }

  // Check for HunyuanMotion naming (L_Hip, R_Hip, L_Collar, etc.)
  // Must check before biped since both share L_/R_ prefix
  const hunyuanIndicators = ['L_Hip', 'R_Hip', 'L_Shoulder', 'R_Shoulder', 'Pelvis']
  if (hunyuanIndicators.some(hasName)) {
    if (!hasName('L_Upperarm') && !hasName('R_Upperarm')) {
      return 'hunyuan'
    }
  }

  // Check for 3ds Max Biped naming (Spine01, L_Clavicle, L_Upperarm)
  const bipedIndicators = ['Spine01', 'L_Clavicle', 'R_Clavicle', 'L_Upperarm', 'R_Upperarm']
  if (bipedIndicators.some(hasName)) {
    return 'biped'
  }

  // Check for SMPL naming (pelvis, left_hip, etc.)
  const smplIndicators = ['pelvis', 'left_hip', 'right_hip', 'left_collar', 'right_collar']
  if (smplIndicators.some(hasName)) {
    return 'smpl'
  }

  // Check for RPM / generic humanoid naming (Hips, LeftArm, etc.)
  const rpmIndicators = ['Hips', 'LeftArm', 'RightArm', 'LeftUpLeg', 'RightUpLeg']
  if (rpmIndicators.some(hasName)) {
    return 'readyplayerme'
  }

  return 'custom'
}

/** Generate a bone mapping from standard names to actual bone names */
export function generateBoneMapping(boneNames: string[], skeletonType: SkeletonType): BoneMapping {
  const mapping: BoneMapping = {}

  let referenceMapping: Record<string, StandardBoneName>
  switch (skeletonType) {
    case 'mixamo':
      referenceMapping = MIXAMO_MAPPING
      break
    case 'readyplayerme':
      referenceMapping = RPM_MAPPING
      break
    case 'smpl':
      referenceMapping = SMPL_MAPPING
      break
    case 'hunyuan':
      referenceMapping = HUNYUAN_MAPPING
      break
    case 'biped':
      referenceMapping = BIPED_MAPPING
      break
    case 'custom':
      referenceMapping = { ...RPM_MAPPING, ...MIXAMO_MAPPING, ...SMPL_MAPPING, ...HUNYUAN_MAPPING, ...BIPED_MAPPING }
      break
  }

  for (const boneName of boneNames) {
    // Try exact name first, then suffix-stripped name (e.g. "Pelvis_15" → "Pelvis")
    const standardName = referenceMapping[boneName] ?? referenceMapping[stripBoneSuffix(boneName)]
    if (standardName && !mapping[standardName]) {
      // First match wins — prevents later aliases from overwriting
      // Value is the ACTUAL bone name (with suffix), so animation retargeting works
      mapping[standardName] = boneName
    }
  }

  return mapping
}

// ─── Animation Retargeting ──────────────────────────────────────────────────

/**
 * Remap an animation clip's track names from one skeleton convention to another.
 * Uses standard bone name mapping (e.g. Mixamo → RPM) so animations can be
 * applied across different character rigs.
 */
export function autoRemapClip(
  clip: THREE.AnimationClip,
  targetBoneMapping: BoneMapping,
  targetBoneNames?: string[]
): THREE.AnimationClip {
  // Detect source skeleton type from animation track names
  const trackBoneNames = [...new Set(
    clip.tracks.map((t) => {
      const dotIdx = t.name.indexOf('.')
      return dotIdx !== -1 ? t.name.substring(0, dotIdx) : t.name
    })
  )]

  const animSkeletonType = detectSkeletonType(trackBoneNames)
  if (animSkeletonType === 'custom' && Object.keys(targetBoneMapping).length === 0) {
    return clip // Can't remap without mapping info
  }

  // Build source mapping: standard name → source bone name
  const animBoneMapping = generateBoneMapping(trackBoneNames, animSkeletonType)

  // Ensure target mapping is populated
  let effectiveTargetMapping = targetBoneMapping
  if (targetBoneNames?.length && Object.keys(targetBoneMapping).length < 5) {
    const targetSkeletonType = detectSkeletonType(targetBoneNames)
    const freshMapping = generateBoneMapping(targetBoneNames, targetSkeletonType)
    if (Object.keys(freshMapping).length > Object.keys(targetBoneMapping).length) {
      effectiveTargetMapping = freshMapping
    }
  }

  // Build name map: source bone name → target bone name (via standard names)
  const nameMap: Record<string, string> = {}
  for (const [standardName, sourceBoneName] of Object.entries(animBoneMapping)) {
    const targetBoneName = effectiveTargetMapping[standardName as StandardBoneName]
    if (targetBoneName && targetBoneName !== sourceBoneName) {
      nameMap[sourceBoneName] = targetBoneName
    }
  }

  if (Object.keys(nameMap).length === 0) return clip

  // Remap track names
  for (const track of clip.tracks) {
    const dotIdx = track.name.indexOf('.')
    if (dotIdx === -1) continue
    const boneName = track.name.substring(0, dotIdx)
    const property = track.name.substring(dotIdx)
    if (nameMap[boneName]) {
      track.name = nameMap[boneName] + property
    }
  }

  // Normalize root motion — remove world-space offset from root (Pelvis) position tracks
  const hipsActualName = effectiveTargetMapping['Pelvis']
  if (hipsActualName) {
    for (const track of clip.tracks) {
      const dotIdx = track.name.indexOf('.')
      if (dotIdx === -1) continue
      const boneName = track.name.substring(0, dotIdx)
      const property = track.name.substring(dotIdx + 1)
      if (boneName === hipsActualName && property === 'position') {
        const values = track.values
        if (values.length >= 3) {
          const ox = values[0]
          const oz = values[2]
          for (let i = 0; i < values.length; i += 3) {
            values[i] -= ox
            values[i + 2] -= oz
          }
        }
      }
    }
  }

  return clip
}

// ─── Poly Count ─────────────────────────────────────────────────────────────

/** Count the total triangles in a GLTF scene */
export function countPolygons(scene: THREE.Group): number {
  let count = 0
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry) {
      const geo = obj.geometry
      if (geo.index) {
        count += geo.index.count / 3
      } else if (geo.attributes.position) {
        count += geo.attributes.position.count / 3
      }
    }
  })
  return Math.round(count)
}

/** Count the total vertices across all meshes in a GLTF scene */
export function countVertices(scene: THREE.Group): number {
  let count = 0
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry?.attributes?.position) {
      count += obj.geometry.attributes.position.count
    }
  })
  return count
}

// ─── Thumbnail Generation ───────────────────────────────────────────────────

/**
 * Render a thumbnail of a GLTF scene using an offscreen Three.js renderer.
 * Returns a data URL of the rendered image.
 */
export function renderThumbnail(
  scene: THREE.Group,
  width = 256,
  height = 256
): string {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(1)
  renderer.setClearColor(0x000000, 0)

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 100)

  // Auto-fit camera to model bounding box
  const box = new THREE.Box3().setFromObject(scene)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = camera.fov * (Math.PI / 180)
  const cameraDistance = maxDim / (2 * Math.tan(fov / 2)) * 1.5

  camera.position.set(center.x, center.y, center.z + cameraDistance)
  camera.lookAt(center)

  // Add lights
  const renderScene = new THREE.Scene()
  renderScene.add(scene.clone())
  renderScene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(5, 5, 5)
  renderScene.add(dirLight)

  renderer.render(renderScene, camera)
  const dataUrl = renderer.domElement.toDataURL('image/png')

  // Clean up — dispose all GPU resources
  renderScene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose()
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of materials) {
        if (mat && typeof mat.dispose === 'function') mat.dispose()
      }
    }
  })
  renderer.dispose()
  renderer.forceContextLoss()

  return dataUrl
}

// ─── Full Analysis Pipeline ─────────────────────────────────────────────────

export interface GLTFAnalysis {
  boneNames: string[]
  skeletonType: SkeletonType
  boneMapping: BoneMapping
  polyCount: number
  vertexCount: number
  thumbnailDataUrl: string
  hasAnimations: boolean
  animationNames: string[]
  skeleton: THREE.Skeleton | null
}

/** Analyze a loaded GLTF model — extract all metadata needed for import */
export function analyzeGLTF(gltf: GLTF): GLTFAnalysis {
  const scene = gltf.scene
  const boneNames = extractBoneNames(scene)
  const skeletonType = detectSkeletonType(boneNames)
  const boneMapping = generateBoneMapping(boneNames, skeletonType)
  const polyCount = countPolygons(scene)
  const vertexCount = countVertices(scene)
  const thumbnailDataUrl = renderThumbnail(scene)
  const skeleton = extractSkeleton(scene)
  const hasAnimations = gltf.animations.length > 0
  const animationNames = gltf.animations.map((clip) => clip.name)

  return {
    boneNames,
    skeletonType,
    boneMapping,
    polyCount,
    vertexCount,
    thumbnailDataUrl,
    hasAnimations,
    animationNames,
    skeleton,
  }
}
