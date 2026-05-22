/**
 * 3D skeleton overlay — renders bones as cylinders and joints as spheres.
 * Placed inside the R3F scene graph, reading world positions from skeleton.bones.
 * Uses instanced meshes for performance with 50+ bones.
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { SkeletonTree } from '@/types/rig3d'

// ─── Constants ──────────────────────────────────────────────────────────────

const JOINT_RADIUS = 0.015
const BONE_RADIUS = 0.006
const COLOR_DEFAULT = new THREE.Color('#ffffff')
const COLOR_SELECTED = new THREE.Color('#22c55e')
const COLOR_HOVERED = new THREE.Color('#facc15')
const COLOR_MAPPED = new THREE.Color('#60a5fa') // Has StandardBoneName mapping

interface SkeletonOverlay3DProps {
  skeleton: THREE.Skeleton
  skeletonTree: SkeletonTree
  selectedBoneName: string | null
  hoveredBoneName: string | null
  showNames: boolean
  onBoneClick: (boneName: string) => void
  onBoneHover: (boneName: string | null) => void
}

// ─── Reusable vectors ───────────────────────────────────────────────────────

const _worldPos = new THREE.Vector3()
const _parentPos = new THREE.Vector3()
const _midpoint = new THREE.Vector3()
const _direction = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _quat = new THREE.Quaternion()
const _matrix = new THREE.Matrix4()
const _color = new THREE.Color()
const _scale = new THREE.Vector3()

export function SkeletonOverlay3D({
  skeleton,
  skeletonTree,
  selectedBoneName,
  hoveredBoneName,
  showNames,
  onBoneClick,
  onBoneHover,
}: SkeletonOverlay3DProps) {
  const jointInstanceRef = useRef<THREE.InstancedMesh>(null!)
  const boneInstanceRef = useRef<THREE.InstancedMesh>(null!)

  const boneCount = skeleton.bones.length

  // Set of bone names in the skeleton (for scoping parent checks)
  const skeletonBoneNames = useMemo(() => {
    return new Set(skeleton.bones.map((b) => b.name))
  }, [skeleton])

  // Build a set of actual bone names that have a standard mapping (for coloring)
  const mappedBoneNames = useMemo(() => {
    const set = new Set<string>()
    for (const bone of skeletonTree.bones) {
      if (bone.standardName) set.add(bone.name)
    }
    return set
  }, [skeletonTree])

  // Count bones whose parent is also a skeleton member (for bone cylinders)
  const boneSegmentCount = useMemo(() => {
    return skeleton.bones.filter(
      (b) => (b.parent as any)?.isBone && skeletonBoneNames.has(b.parent!.name)
    ).length
  }, [skeleton, skeletonBoneNames])

  // Shared geometry
  const jointGeo = useMemo(() => new THREE.SphereGeometry(JOINT_RADIUS, 8, 6), [])
  const boneGeo = useMemo(() => new THREE.CylinderGeometry(BONE_RADIUS, BONE_RADIUS * 0.5, 1, 6), [])

  // Update instance matrices every frame (bones move during animation/posing)
  useFrame(() => {
    if (!jointInstanceRef.current || !boneInstanceRef.current) return

    let segIdx = 0

    for (let i = 0; i < boneCount; i++) {
      const bone = skeleton.bones[i]

      // Joint sphere — positioned at bone world position
      bone.getWorldPosition(_worldPos)
      _matrix.makeTranslation(_worldPos.x, _worldPos.y, _worldPos.z)

      // Color based on selection state
      if (bone.name === selectedBoneName) {
        _color.copy(COLOR_SELECTED)
      } else if (bone.name === hoveredBoneName) {
        _color.copy(COLOR_HOVERED)
      } else if (mappedBoneNames.has(bone.name)) {
        _color.copy(COLOR_MAPPED)
      } else {
        _color.copy(COLOR_DEFAULT)
      }

      jointInstanceRef.current.setMatrixAt(i, _matrix)
      jointInstanceRef.current.setColorAt(i, _color)

      // Bone cylinder — between this bone and its parent (only if parent is a skeleton member)
      if ((bone.parent as any)?.isBone && skeletonBoneNames.has(bone.parent!.name)) {
        bone.parent!.getWorldPosition(_parentPos)
        const length = _worldPos.distanceTo(_parentPos)

        if (length > 0.0001) {
          // Position at midpoint
          _midpoint.copy(_parentPos).add(_worldPos).multiplyScalar(0.5)

          // Orient along parent→child direction
          _direction.copy(_worldPos).sub(_parentPos).normalize()
          _quat.setFromUnitVectors(_up, _direction)

          _scale.set(1, length, 1)
          _matrix.compose(_midpoint, _quat, _scale)

          // Same color as child joint
          boneInstanceRef.current.setMatrixAt(segIdx, _matrix)
          boneInstanceRef.current.setColorAt(segIdx, _color)
          segIdx++
        }
      }
    }

    jointInstanceRef.current.instanceMatrix.needsUpdate = true
    if (jointInstanceRef.current.instanceColor) {
      jointInstanceRef.current.instanceColor.needsUpdate = true
    }
    boneInstanceRef.current.instanceMatrix.needsUpdate = true
    if (boneInstanceRef.current.instanceColor) {
      boneInstanceRef.current.instanceColor.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Joint spheres */}
      <instancedMesh
        ref={jointInstanceRef}
        args={[jointGeo, undefined, boneCount]}
        frustumCulled={false}
        onClick={(e) => {
          // Don't stopPropagation — allow gizmo and other handlers to also receive events
          const idx = e.instanceId
          if (idx !== undefined && idx < boneCount) {
            onBoneClick(skeleton.bones[idx].name)
          }
        }}
        onPointerOver={(e) => {
          // Don't stopPropagation — blocking this prevents the gizmo's
          // onPointerOver/onPointerDown from firing on handles behind the overlay
          const idx = e.instanceId
          if (idx !== undefined && idx < boneCount) {
            onBoneHover(skeleton.bones[idx].name)
            document.body.style.cursor = 'pointer'
          }
        }}
        onPointerOut={() => {
          onBoneHover(null)
          document.body.style.cursor = 'default'
        }}
      >
        <meshBasicMaterial transparent opacity={0.9} />
      </instancedMesh>

      {/* Bone cylinders */}
      <instancedMesh
        ref={boneInstanceRef}
        args={[boneGeo, undefined, Math.max(boneSegmentCount, 1)]}
        frustumCulled={false}
      >
        <meshBasicMaterial transparent opacity={0.6} />
      </instancedMesh>

      {/* Bone name labels */}
      {showNames &&
        skeleton.bones.map((bone) => (
          <BoneLabel key={bone.name} bone={bone} />
        ))}
    </group>
  )
}

// ─── Bone Name Label ────────────────────────────────────────────────────────

function BoneLabel({ bone }: { bone: THREE.Bone }) {
  const ref = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (ref.current) {
      bone.getWorldPosition(_worldPos)
      ref.current.position.copy(_worldPos)
    }
  })

  return (
    <group ref={ref}>
      <Html
        center
        style={{
          fontSize: '9px',
          color: '#ccc',
          background: 'rgba(0,0,0,0.6)',
          padding: '1px 4px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          transform: 'translateY(-16px)',
        }}
      >
        {bone.name}
      </Html>
    </group>
  )
}
