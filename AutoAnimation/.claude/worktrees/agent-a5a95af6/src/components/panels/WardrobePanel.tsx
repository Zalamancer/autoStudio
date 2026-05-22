import { useRef, useCallback, useState } from 'react'
import {
  Upload,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Save,
  FolderOpen,
  X,
  Shirt,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWardrobeStore, type OutfitLayer, type OutfitPreset } from '@/stores/useWardrobeStore'
import { PanelSlider } from '@/components/ui/panel-controls'

// ── Outfit Layer Item ──

function OutfitLayerItem({
  layer,
  isExpanded,
  onToggleExpand,
}: {
  layer: OutfitLayer
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const { removeOutfitLayer, updateLayerTransform, toggleLayerVisibility, moveLayerUp, moveLayerDown, renameLayer } =
    useWardrobeStore()

  const [isRenaming, setIsRenaming] = useState(false)
  const [nameInput, setNameInput] = useState(layer.name)

  const handleRenameSubmit = () => {
    if (nameInput.trim()) {
      renameLayer(layer.id, nameInput.trim())
    }
    setIsRenaming(false)
  }

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        layer.visible
          ? 'border-zinc-700 bg-zinc-800/50'
          : 'border-zinc-800 bg-zinc-900/50 opacity-60'
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        {/* Drag handle */}
        <GripVertical size={14} className="shrink-0 text-zinc-600 cursor-grab" />

        {/* Thumbnail */}
        <div className="shrink-0 w-8 h-8 rounded bg-zinc-700/50 overflow-hidden">
          <img
            src={layer.spriteUrl}
            alt={layer.name}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>

        {/* Name */}
        <button
          className="flex-1 min-w-0 text-left"
          onClick={onToggleExpand}
        >
          {isRenaming ? (
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit()
                if (e.key === 'Escape') setIsRenaming(false)
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-xs text-zinc-200 bg-zinc-700 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <span
              className="text-xs text-zinc-300 truncate block"
              onDoubleClick={(e) => {
                e.stopPropagation()
                setNameInput(layer.name)
                setIsRenaming(true)
              }}
            >
              {layer.name}
            </span>
          )}
        </button>

        {/* Move buttons */}
        <button
          onClick={() => moveLayerUp(layer.id)}
          className="shrink-0 p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Move up (higher z-order)"
        >
          <ChevronUp size={12} />
        </button>
        <button
          onClick={() => moveLayerDown(layer.id)}
          className="shrink-0 p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Move down (lower z-order)"
        >
          <ChevronDown size={12} />
        </button>

        {/* Visibility */}
        <button
          onClick={() => toggleLayerVisibility(layer.id)}
          className="shrink-0 p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
          title={layer.visible ? 'Hide' : 'Show'}
        >
          {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>

        {/* Delete */}
        <button
          onClick={() => removeOutfitLayer(layer.id)}
          className="shrink-0 p-0.5 text-zinc-500 hover:text-red-400 transition-colors"
          title="Remove layer"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Expanded transform controls */}
      {isExpanded && (
        <div className="px-2 pb-2 pt-1 border-t border-zinc-700/50 space-y-2">
          {/* Position */}
          <PanelSlider
            label="X"
            value={layer.position.x}
            onChange={(v) =>
              updateLayerTransform(layer.id, {
                position: { x: v, y: layer.position.y },
              })
            }
            min={-500}
            max={500}
            step={1}
            compact
          />
          <PanelSlider
            label="Y"
            value={layer.position.y}
            onChange={(v) =>
              updateLayerTransform(layer.id, {
                position: { x: layer.position.x, y: v },
              })
            }
            min={-500}
            max={500}
            step={1}
            compact
          />

          {/* Scale */}
          <PanelSlider
            label="SX"
            value={layer.scale.x}
            onChange={(v) =>
              updateLayerTransform(layer.id, {
                scale: { x: v, y: layer.scale.y },
              })
            }
            min={0.01}
            max={10}
            step={0.01}
            precision={2}
            compact
          />
          <PanelSlider
            label="SY"
            value={layer.scale.y}
            onChange={(v) =>
              updateLayerTransform(layer.id, {
                scale: { x: layer.scale.x, y: v },
              })
            }
            min={0.01}
            max={10}
            step={0.01}
            precision={2}
            compact
          />

          {/* Rotation + Z-Order */}
          <PanelSlider
            label="Rot"
            value={layer.rotation}
            onChange={(v) =>
              updateLayerTransform(layer.id, { rotation: v })
            }
            min={-360}
            max={360}
            step={1}
            suffix="°"
            compact
          />
          <PanelSlider
            label="Z"
            value={layer.zOrder}
            onChange={(v) =>
              updateLayerTransform(layer.id, { zOrder: Math.round(v) })
            }
            min={-10}
            max={100}
            step={1}
            compact
          />
        </div>
      )}
    </div>
  )
}

// ── Preset Card ──

function PresetCard({
  preset,
  onLoad,
  onDelete,
}: {
  preset: OutfitPreset
  onLoad: () => void
  onDelete: () => void
}) {
  return (
    <div className="relative group rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-2 hover:border-zinc-600 transition-colors">
      <button onClick={onLoad} className="w-full text-left">
        <div className="flex items-center gap-2">
          <Shirt size={14} className="text-zinc-500 shrink-0" />
          <span className="text-xs text-zinc-300 truncate">{preset.name}</span>
          <span className="text-[10px] text-zinc-600 shrink-0">
            {preset.layers.length}L
          </span>
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="absolute top-1 right-1 p-0.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        title="Delete preset"
      >
        <X size={10} />
      </button>
    </div>
  )
}

// ── Main Panel ──

export function WardrobePanel() {
  const { layers, presets, addOutfitLayer, saveOutfitPreset, loadOutfitPreset, deleteOutfitPreset, clearAllLayers } =
    useWardrobeStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null)
  const [presetName, setPresetName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  // ── File upload handler ──

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = reader.result as string
          const fileName = file.name.replace(/\.[^/.]+$/, '') // strip extension
          addOutfitLayer({
            name: fileName || 'Outfit Layer',
            spriteUrl: dataUrl,
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 },
            visible: true,
            zOrder: 10 + layers.length, // Above all base layers by default
          })
        }
        reader.readAsDataURL(file)
      })

      // Reset input so same file can be re-uploaded
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [addOutfitLayer, layers.length]
  )

  // ── Drag-and-drop ──

  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = e.dataTransfer.files
      if (!files || files.length === 0) return

      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = reader.result as string
          const fileName = file.name.replace(/\.[^/.]+$/, '')
          addOutfitLayer({
            name: fileName || 'Outfit Layer',
            spriteUrl: dataUrl,
            position: { x: 0, y: 0 },
            rotation: 0,
            scale: { x: 1, y: 1 },
            visible: true,
            zOrder: 10 + layers.length,
          })
        }
        reader.readAsDataURL(file)
      })
    },
    [addOutfitLayer, layers.length]
  )

  // ── Save preset ──

  const handleSavePreset = () => {
    const name = presetName.trim()
    if (!name || layers.length === 0) return
    saveOutfitPreset(name)
    setPresetName('')
    setShowSaveInput(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Upload area */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500 uppercase tracking-wide">
            Add Outfit / Accessory
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.svg"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative h-20 rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-1',
              isDragOver
                ? 'border-green-500 bg-green-500/10'
                : 'border-zinc-700 hover:border-green-500/50 bg-zinc-800/50'
            )}
          >
            <Upload size={20} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">
              Drop outfit sprites or click to upload
            </span>
          </div>
        </div>

        {/* Active outfit layers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-500 uppercase tracking-wide">
              Outfit Layers ({layers.length})
            </label>
            {layers.length > 0 && (
              <button
                onClick={clearAllLayers}
                className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {layers.length === 0 ? (
            <div className="text-center py-6 text-zinc-600">
              <Shirt size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">No outfit layers yet</p>
              <p className="text-[10px] mt-1 text-zinc-700">
                Upload sprites to add hats, glasses, armor, etc.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Render in reverse so the topmost layer (last in array) appears at top of list */}
              {[...layers].reverse().map((layer) => (
                <OutfitLayerItem
                  key={layer.id}
                  layer={layer}
                  isExpanded={expandedLayerId === layer.id}
                  onToggleExpand={() =>
                    setExpandedLayerId(
                      expandedLayerId === layer.id ? null : layer.id
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Outfit presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-500 uppercase tracking-wide">
              Saved Outfits
            </label>
            {layers.length > 0 && (
              <button
                onClick={() => setShowSaveInput(!showSaveInput)}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-green-400 transition-colors"
              >
                <Save size={10} />
                Save
              </button>
            )}
          </div>

          {/* Save input */}
          {showSaveInput && (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSavePreset()
                  if (e.key === 'Escape') setShowSaveInput(false)
                }}
                placeholder="Outfit name..."
                className="flex-1 text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-200 placeholder-zinc-600 outline-none focus:border-green-500/50"
              />
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim() || layers.length === 0}
                className="shrink-0 px-2 py-1 text-xs rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          )}

          {/* Preset grid */}
          {presets.length === 0 ? (
            <div className="text-center py-4 text-zinc-600">
              <FolderOpen size={20} className="mx-auto mb-1.5 opacity-40" />
              <p className="text-[10px]">No saved outfits</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onLoad={() => loadOutfitPreset(preset.id)}
                  onDelete={() => deleteOutfitPreset(preset.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
