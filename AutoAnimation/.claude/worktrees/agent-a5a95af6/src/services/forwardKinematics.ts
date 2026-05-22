import type { BoneSkeleton, BonePose, JointPoseState } from '@/types/rig'

export interface JointWorldState {
  worldX: number
  worldY: number
  worldRotation: number // accumulated degrees
}

const DEG_TO_RAD = Math.PI / 180

const DEFAULT_POSE: JointPoseState = { dx: 0, dy: 0, rotation: 0 }

/**
 * Compute world-space positions for all joints given a skeleton and pose.
 * Traverses parent → child hierarchy, accumulating position and rotation.
 *
 * Each joint's world position is computed as:
 *   1. Start from parent's world position and rotation
 *   2. Rotate the vector (restPosition - parentRestPosition) by accumulated parent rotation
 *   3. Add the joint's own pose offset (dx, dy)
 *   4. Accumulate the joint's pose rotation
 */
export function computeJointWorldPositions(
  skeleton: BoneSkeleton,
  _restPose: BonePose,
  currentPose: BonePose
): Record<string, JointWorldState> {
  const result: Record<string, JointWorldState> = {}
  const jointMap = new Map(skeleton.joints.map((j) => [j.id, j]))

  // Build children list for traversal
  const children = new Map<string | null, string[]>()
  for (const joint of skeleton.joints) {
    const parent = joint.parentId
    if (!children.has(parent)) children.set(parent, [])
    children.get(parent)!.push(joint.id)
  }

  // BFS traversal from root
  const queue: string[] = [skeleton.rootJointId]

  // Compute root joint first
  const rootJoint = jointMap.get(skeleton.rootJointId)
  if (!rootJoint) return result

  const rootPose = currentPose[rootJoint.id] || DEFAULT_POSE
  result[rootJoint.id] = {
    worldX: rootJoint.restPosition.x + rootPose.dx,
    worldY: rootJoint.restPosition.y + rootPose.dy,
    worldRotation: rootPose.rotation,
  }

  while (queue.length > 0) {
    const parentId = queue.shift()!
    const childIds = children.get(parentId) || []

    for (const childId of childIds) {
      const child = jointMap.get(childId)
      if (!child) continue

      const parent = jointMap.get(parentId)!
      const parentWorld = result[parentId]
      const childPose = currentPose[childId] || DEFAULT_POSE

      // Vector from parent rest to child rest position
      const localX = child.restPosition.x - parent.restPosition.x
      const localY = child.restPosition.y - parent.restPosition.y

      // Rotate by parent's accumulated world rotation
      const rad = parentWorld.worldRotation * DEG_TO_RAD
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const rotatedX = localX * cos - localY * sin
      const rotatedY = localX * sin + localY * cos

      result[childId] = {
        worldX: parentWorld.worldX + rotatedX + childPose.dx,
        worldY: parentWorld.worldY + rotatedY + childPose.dy,
        worldRotation: parentWorld.worldRotation + childPose.rotation,
      }

      queue.push(childId)
    }
  }

  return result
}

/**
 * Compute a bone segment (start → end) for a given joint.
 * The segment goes from the parent joint's world position to this joint's world position.
 * Root joints have no segment (segment starts and ends at the same point).
 */
export function getBoneSegment(
  jointId: string,
  skeleton: BoneSkeleton,
  worldPositions: Record<string, JointWorldState>
): { startX: number; startY: number; endX: number; endY: number } | null {
  const joint = skeleton.joints.find((j) => j.id === jointId)
  if (!joint || !joint.parentId) return null

  const parentWorld = worldPositions[joint.parentId]
  const childWorld = worldPositions[jointId]
  if (!parentWorld || !childWorld) return null

  return {
    startX: parentWorld.worldX,
    startY: parentWorld.worldY,
    endX: childWorld.worldX,
    endY: childWorld.worldY,
  }
}
