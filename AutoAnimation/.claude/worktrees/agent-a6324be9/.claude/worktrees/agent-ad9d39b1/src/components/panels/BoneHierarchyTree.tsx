/**
 * Recursive tree view of skeleton hierarchy.
 * Click to select bone, expand/collapse subtrees, color-coded by mapping status.
 */
import { useState } from 'react'
import { ChevronRight, ChevronDown, Bone } from 'lucide-react'
import type { BoneNode, SkeletonTree } from '@/types/rig3d'

interface BoneHierarchyTreeProps {
  skeletonTree: SkeletonTree
  selectedBoneName: string | null
  hoveredBoneName: string | null
  onSelectBone: (name: string) => void
  onHoverBone: (name: string | null) => void
}

export function BoneHierarchyTree({
  skeletonTree,
  selectedBoneName,
  hoveredBoneName,
  onSelectBone,
  onHoverBone,
}: BoneHierarchyTreeProps) {
  const [filter, setFilter] = useState('')

  // Build lookup map
  const boneMap = new Map<string, BoneNode>()
  for (const bone of skeletonTree.bones) {
    boneMap.set(bone.name, bone)
  }

  // Find root bones
  const rootBones = skeletonTree.bones.filter((b) => b.parentName === null)

  // Filter bones if search is active
  const matchesFilter = (name: string) => {
    if (!filter) return true
    return name.toLowerCase().includes(filter.toLowerCase())
  }

  // Recursively check if any descendant matches the filter
  const anyDescendantMatches = (bone: BoneNode): boolean => {
    if (matchesFilter(bone.name)) return true
    for (const childName of bone.childrenNames) {
      const child = boneMap.get(childName)
      if (child && anyDescendantMatches(child)) return true
    }
    return false
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Search */}
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter bones..."
        className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-green-500"
      />

      {/* Tree — scroll is handled by the parent LeftPanel container */}
      <div>
        {rootBones.map((bone) => (
          <BoneTreeNode
            key={bone.name}
            bone={bone}
            boneMap={boneMap}
            depth={0}
            selectedBoneName={selectedBoneName}
            hoveredBoneName={hoveredBoneName}
            onSelectBone={onSelectBone}
            onHoverBone={onHoverBone}
            matchesFilter={matchesFilter}
            anyDescendantMatches={anyDescendantMatches}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="text-sm text-zinc-600 px-1">
        {skeletonTree.bones.length} bones &middot; {skeletonTree.skeletonType}
        {selectedBoneName && (
          <span className="text-zinc-400"> &middot; {selectedBoneName}</span>
        )}
      </div>
    </div>
  )
}

// ─── Tree Node ──────────────────────────────────────────────────────────────

interface BoneTreeNodeProps {
  bone: BoneNode
  boneMap: Map<string, BoneNode>
  depth: number
  selectedBoneName: string | null
  hoveredBoneName: string | null
  onSelectBone: (name: string) => void
  onHoverBone: (name: string | null) => void
  matchesFilter: (name: string) => boolean
  anyDescendantMatches: (bone: BoneNode) => boolean
}

function BoneTreeNode({
  bone,
  boneMap,
  depth,
  selectedBoneName,
  hoveredBoneName,
  onSelectBone,
  onHoverBone,
  matchesFilter,
  anyDescendantMatches,
}: BoneTreeNodeProps) {
  const [expanded, setExpanded] = useState(true) // All expanded by default
  const hasChildren = bone.childrenNames.length > 0
  const isSelected = bone.name === selectedBoneName
  const isHovered = bone.name === hoveredBoneName
  const isMapped = !!bone.standardName

  const childBones = bone.childrenNames
    .map((name) => boneMap.get(name))
    .filter(Boolean) as BoneNode[]

  // If filtering, hide this bone only if neither it nor any descendant matches
  if (!anyDescendantMatches(bone)) return null

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-1.5 py-1 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-green-500/20 text-green-400'
            : isHovered
              ? 'bg-zinc-700/50 text-zinc-200'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
        }`}
        style={{ paddingLeft: depth * 18 + 6 }}
        onClick={() => onSelectBone(bone.name)}
        onMouseEnter={() => onHoverBone(bone.name)}
        onMouseLeave={() => onHoverBone(null)}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="w-5 h-5 flex items-center justify-center shrink-0 rounded hover:bg-zinc-700"
          >
            {expanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        {/* Bone icon */}
        <Bone
          size={14}
          className={`shrink-0 ${
            isMapped ? 'text-green-400' : 'text-zinc-600'
          }`}
        />

        {/* Bone name */}
        <span className="text-sm truncate">
          {bone.standardName ? (
            <>
              <span className="text-green-400">{bone.standardName}</span>
              {bone.standardName !== bone.name && (
                <span className="text-zinc-600 ml-1">({bone.name})</span>
              )}
            </>
          ) : (
            bone.name
          )}
        </span>
      </div>

      {/* Children */}
      {expanded &&
        hasChildren &&
        childBones.map((child) => (
          <BoneTreeNode
            key={child.name}
            bone={child}
            boneMap={boneMap}
            depth={depth + 1}
            selectedBoneName={selectedBoneName}
            hoveredBoneName={hoveredBoneName}
            onSelectBone={onSelectBone}
            onHoverBone={onHoverBone}
            matchesFilter={matchesFilter}
            anyDescendantMatches={anyDescendantMatches}
          />
        ))}
    </div>
  )
}
