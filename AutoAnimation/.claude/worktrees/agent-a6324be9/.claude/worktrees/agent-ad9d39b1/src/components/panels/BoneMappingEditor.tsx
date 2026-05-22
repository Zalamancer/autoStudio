/**
 * Visual bone mapping editor for retargeting animations between skeletons.
 * Left column: source skeleton bones, Right column: target skeleton bones.
 * Connect matching bones with drag-to-connect lines.
 */
import { useState, useMemo } from 'react'
import { Zap, Save, Trash2 } from 'lucide-react'

interface BoneMappingEditorProps {
  /** Source bone names (from the animation/source skeleton) */
  sourceBones: string[]
  /** Target bone names (from the character's skeleton) */
  targetBones: string[]
  /** Current mapping: source bone name → target bone name */
  currentMapping: Record<string, string>
  /** Callback when mapping changes */
  onMappingChange: (mapping: Record<string, string>) => void
  /** Auto-map function using gltfUtils.generateBoneMapping() */
  onAutoMap?: () => void
  /** Save callback */
  onSave?: (mapping: Record<string, string>) => void
}

export function BoneMappingEditor({
  sourceBones,
  targetBones,
  currentMapping,
  onMappingChange,
  onAutoMap,
  onSave,
}: BoneMappingEditorProps) {
  const [filter, setFilter] = useState('')
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  const filteredSourceBones = useMemo(() => {
    if (!filter) return sourceBones
    const lower = filter.toLowerCase()
    return sourceBones.filter((b) => b.toLowerCase().includes(lower))
  }, [sourceBones, filter])

  const filteredTargetBones = useMemo(() => {
    if (!filter) return targetBones
    const lower = filter.toLowerCase()
    return targetBones.filter((b) => b.toLowerCase().includes(lower))
  }, [targetBones, filter])

  const mappedCount = Object.keys(currentMapping).length
  const totalSource = sourceBones.length

  const handleTargetClick = (targetBone: string) => {
    if (!selectedSource) return
    const newMapping = { ...currentMapping, [selectedSource]: targetBone }
    onMappingChange(newMapping)
    setSelectedSource(null)
  }

  const handleRemoveMapping = (sourceBone: string) => {
    const newMapping = { ...currentMapping }
    delete newMapping[sourceBone]
    onMappingChange(newMapping)
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-300 font-medium">Bone Mapping</span>
        <div className="flex items-center gap-1">
          {onAutoMap && (
            <button
              onClick={onAutoMap}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              title="Auto-detect bone mapping"
            >
              <Zap size={12} />
              Auto Map
            </button>
          )}
          {onSave && (
            <button
              onClick={() => onSave(currentMapping)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors"
            >
              <Save size={12} />
              Save
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="text-xs text-zinc-500">
        {mappedCount} / {totalSource} bones mapped
      </div>

      {/* Filter */}
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter bones..."
        className="w-full px-2 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-green-500"
      />

      {/* Mapping table */}
      <div className="max-h-[400px] overflow-y-auto">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 gap-y-1 text-xs">
          {/* Header */}
          <div className="text-zinc-500 font-medium px-1 pb-1 border-b border-zinc-800">Source</div>
          <div className="text-zinc-500 font-medium px-1 pb-1 border-b border-zinc-800" />
          <div className="text-zinc-500 font-medium px-1 pb-1 border-b border-zinc-800">Target</div>

          {filteredSourceBones.map((sourceBone) => {
            const mappedTarget = currentMapping[sourceBone]
            const isSelected = selectedSource === sourceBone

            return (
              <MappingRow
                key={sourceBone}
                sourceBone={sourceBone}
                mappedTarget={mappedTarget || null}
                isSelected={isSelected}
                onSourceClick={() => setSelectedSource(isSelected ? null : sourceBone)}
                onRemove={() => handleRemoveMapping(sourceBone)}
              />
            )
          })}
        </div>
      </div>

      {/* Target selection (when a source is selected) */}
      {selectedSource && (
        <div className="border border-green-500/30 rounded-lg p-2 bg-green-500/5">
          <div className="text-xs text-green-400 mb-1">
            Select target for: <span className="font-medium">{selectedSource}</span>
          </div>
          <div className="max-h-[200px] overflow-y-auto flex flex-col gap-0.5">
            {filteredTargetBones.map((targetBone) => {
              const isAlreadyMapped = Object.values(currentMapping).includes(targetBone)
              return (
                <button
                  key={targetBone}
                  onClick={() => handleTargetClick(targetBone)}
                  className={`text-left px-2 py-1 rounded-lg text-xs transition-colors ${
                    isAlreadyMapped
                      ? 'text-zinc-600 hover:bg-zinc-800'
                      : 'text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {targetBone}
                  {isAlreadyMapped && <span className="text-zinc-700 ml-1">(mapped)</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Row Sub-component ───────────────────────────────────────────────────────

function MappingRow({
  sourceBone,
  mappedTarget,
  isSelected,
  onSourceClick,
  onRemove,
}: {
  sourceBone: string
  mappedTarget: string | null
  isSelected: boolean
  onSourceClick: () => void
  onRemove: () => void
}) {
  return (
    <>
      <button
        onClick={onSourceClick}
        className={`text-left px-1 py-0.5 rounded-lg truncate transition-colors ${
          isSelected
            ? 'bg-green-500/20 text-green-400'
            : mappedTarget
              ? 'text-zinc-300 hover:bg-zinc-800'
              : 'text-zinc-500 hover:bg-zinc-800'
        }`}
      >
        {sourceBone}
      </button>

      <div className="flex items-center justify-center">
        {mappedTarget ? (
          <span className="text-green-500">→</span>
        ) : (
          <span className="text-zinc-700">·</span>
        )}
      </div>

      {mappedTarget ? (
        <div className="flex items-center gap-1">
          <span className="text-green-400 truncate flex-1">{mappedTarget}</span>
          <button
            onClick={onRemove}
            className="p-0.5 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 shrink-0"
            title="Remove mapping"
          >
            <Trash2 size={10} />
          </button>
        </div>
      ) : (
        <span className="text-zinc-700 px-1">—</span>
      )}
    </>
  )
}
