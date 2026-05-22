import { useMemo, useState, useCallback, useRef } from 'react'
import {
  Eye,
  EyeOff,
  Trash2,
  Image,
  Type,
  Music,
  Sparkles,
  Pentagon,
  User,
  Video,
  Box,
  Code2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Folder,
  FolderOpen,
  Lock,
  Unlock,
  Pencil,
  LayoutGrid,
  List,
  PenTool,
} from 'lucide-react'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useEditorStore } from '@/stores'
import { useLayerTreeStore } from '@/stores/useLayerTreeStore'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import { PanelLayout } from '@/components/ui/PanelHeader'
import type { RightPanelTab } from '@/types'
import type { LayerGroup } from '@/types/layerTree'

// ── Unified layer item type ─────────────────────────────────────────────
interface LayerItem {
  id: string
  name: string
  type:
    | 'animation'
    | 'text'
    | 'shape'
    | 'image'
    | 'audio'
    | 'video'
    | 'character'
    | 'svg-object'
    | 'html-template'
    | 'whiteboard-text'
  icon: typeof Image
  iconColor: string
  zIndex: number
  visible: boolean | null // null = no visibility toggle
  isSelected: boolean
  onSelect: () => void
  onToggleVisibility?: () => void
  onRemove: () => void
  rightPanelTab: RightPanelTab
}

// ── Category grouping ───────────────────────────────────────────────────
const CATEGORY_ORDER = [
  'character',
  'video',
  'image',
  'animation',
  'svg-object',
  'html-template',
  'text',
  'shape',
  'audio',
] as const

const CATEGORY_LABELS: Record<string, string> = {
  character: 'Characters',
  video: 'Videos',
  image: 'Images',
  animation: 'Animations',
  'svg-object': 'SVG Objects',
  'html-template': 'HTML Templates',
  text: 'Text',
  shape: 'Shapes',
  audio: 'Audio',
}

const CATEGORY_ICONS: Record<string, typeof Image> = {
  character: User,
  video: Video,
  image: Image,
  animation: Sparkles,
  'svg-object': Box,
  'html-template': Code2,
  text: Type,
  shape: Pentagon,
  audio: Music,
}

// ── Drag & drop mime type ──
const DRAG_MIME = 'application/x-layer-move'

export function LayersPanel() {
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  // ── Layer tree store ──
  const viewMode = useLayerTreeStore((s) => s.viewMode)
  const setViewMode = useLayerTreeStore((s) => s.setViewMode)
  const groups = useLayerTreeStore((s) => s.groups)
  const assignments = useLayerTreeStore((s) => s.assignments)
  const layerOrder = useLayerTreeStore((s) => s.layerOrder)
  const createGroup = useLayerTreeStore((s) => s.createGroup)
  const deleteGroup = useLayerTreeStore((s) => s.deleteGroup)
  const renameGroup = useLayerTreeStore((s) => s.renameGroup)
  const toggleGroupCollapsed = useLayerTreeStore((s) => s.toggleGroupCollapsed)
  const toggleGroupVisibility = useLayerTreeStore((s) => s.toggleGroupVisibility)
  const toggleGroupLock = useLayerTreeStore((s) => s.toggleGroupLock)
  const assignToGroup = useLayerTreeStore((s) => s.assignToGroup)
  const reorderInGroup = useLayerTreeStore((s) => s.reorderInGroup)
  const getAllDescendantLayerIds = useLayerTreeStore((s) => s.getAllDescendantLayerIds)

  // ── Collapsed categories ──
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // ── Animation store ──
  const activeAnimations = useAnimationStore((s) => s.activeAnimations)
  const animationLibrary = useAnimationStore((s) => s.library)
  const selectedActiveId = useAnimationStore((s) => s.selectedActiveId)
  const setSelectedActiveId = useAnimationStore((s) => s.setSelectedActiveId)
  const removeFromAnimCanvas = useAnimationStore((s) => s.removeFromCanvas)

  // ── Text overlay store ──
  const textOverlays = useTextOverlayStore((s) => s.overlays)
  const selectedTextId = useTextOverlayStore((s) => s.selectedId)
  const setSelectedTextId = useTextOverlayStore((s) => s.setSelectedId)
  const toggleTextVisibility = useTextOverlayStore((s) => s.toggleVisibility)
  const removeTextOverlay = useTextOverlayStore((s) => s.removeOverlay)

  // ── Shape store ──
  const shapes = useShapeStore((s) => s.shapes)
  const selectedShapeId = useShapeStore((s) => s.selectedShapeId)
  const setSelectedShapeId = useShapeStore((s) => s.setSelectedShapeId)
  const updateShape = useShapeStore((s) => s.updateShape)
  const removeShape = useShapeStore((s) => s.removeShape)

  // ── Whiteboard store ──
  const wbTextItems = useWhiteboardStore((s) => s.textItems)
  const wbSelectedTextId = useWhiteboardStore((s) => s.selectedTextItemId)
  const setWbSelectedTextId = useWhiteboardStore((s) => s.setSelectedTextItemId)
  const removeWbTextItem = useWhiteboardStore((s) => s.removeTextItem)

  // ── Media store ──
  const canvasItems = useMediaStore((s) => s.canvasItems)
  const assets = useMediaStore((s) => s.assets)
  const selectedCanvasItemId = useMediaStore((s) => s.selectedCanvasItemId)
  const setSelectedCanvasItemId = useMediaStore((s) => s.setSelectedCanvasItemId)
  const updateCanvasItem = useMediaStore((s) => s.updateCanvasItem)
  const removeFromMediaCanvas = useMediaStore((s) => s.removeFromCanvas)

  // ── Multi-character store ──
  const characters = useMultiCharacterStore((s) => s.characters)
  const activeCharacterId = useMultiCharacterStore((s) => s.activeCharacterId)
  const selectDialogueCharacter = useMultiCharacterStore((s) => s.selectDialogueCharacter)
  const updateDialogueCharacter = useMultiCharacterStore((s) => s.updateDialogueCharacter)
  const removeDialogueCharacter = useMultiCharacterStore((s) => s.removeDialogueCharacter)

  // ── Video layer store ──
  const videos = useVideoLayerStore((s) => s.videos)
  const selectedVideoId = useVideoLayerStore((s) => s.selectedVideoId)
  const setSelectedVideoId = useVideoLayerStore((s) => s.setSelectedVideoId)
  const updateVideo = useVideoLayerStore((s) => s.updateVideo)
  const removeVideo = useVideoLayerStore((s) => s.removeVideo)

  // ── SVG object store ──
  const svgComposition = useSVGObjectStore((s) => s.composition)
  const selectedSvgObjectId = useSVGObjectStore((s) => s.selectedObjectId)
  const selectSvgObject = useSVGObjectStore((s) => s.selectObject)
  const toggleSvgVisibility = useSVGObjectStore((s) => s.toggleObjectVisibility)
  const removeSvgObject = useSVGObjectStore((s) => s.removeObject)

  // ── HTML template store ──
  const htmlTemplates = useHTMLTemplateLayerStore((s) => s.templates)
  const selectedTemplateId = useHTMLTemplateLayerStore((s) => s.selectedTemplateId)
  const setSelectedTemplateId = useHTMLTemplateLayerStore((s) => s.setSelectedTemplateId)
  const updateTemplate = useHTMLTemplateLayerStore((s) => s.updateTemplate)
  const removeTemplate = useHTMLTemplateLayerStore((s) => s.removeTemplate)

  // ── Build unified layers list ─────────────────────────────────────────
  const layers: LayerItem[] = useMemo(() => {
    const items: LayerItem[] = []

    // Characters
    characters.forEach((char) => {
      items.push({
        id: `char-${char.id}`,
        name: char.name || 'Character',
        type: 'character',
        icon: User,
        iconColor: char.color || '#60a5fa',
        zIndex: char.zIndex,
        visible: char.visible,
        isSelected: activeCharacterId === char.id,
        onSelect: () => {
          selectDialogueCharacter(char.id)
          setRightPanelTab('group-properties')
        },
        onToggleVisibility: () => updateDialogueCharacter(char.id, { visible: !char.visible }),
        onRemove: () => removeDialogueCharacter(char.id),
        rightPanelTab: 'group-properties',
      })
    })

    // Video layers
    videos.forEach((vid) => {
      items.push({
        id: `vid-${vid.id}`,
        name: vid.name || 'Video',
        type: 'video',
        icon: Video,
        iconColor: '#818cf8',
        zIndex: vid.zIndex,
        visible: vid.visible,
        isSelected: selectedVideoId === vid.id,
        onSelect: () => {
          setSelectedVideoId(vid.id)
          setRightPanelTab('video-properties')
        },
        onToggleVisibility: () => updateVideo(vid.id, { visible: !vid.visible }),
        onRemove: () => removeVideo(vid.id),
        rightPanelTab: 'video-properties',
      })
    })

    // Media canvas items (images, audio)
    canvasItems.forEach((item) => {
      const asset = assets.find((a) => a.id === item.assetId)
      if (!asset) return
      const isAudio = asset.category === 'audio'
      items.push({
        id: `media-${item.id}`,
        name: asset.name,
        type: isAudio ? 'audio' : 'image',
        icon: isAudio ? Music : Image,
        iconColor: isAudio ? '#fb923c' : '#4ade80',
        zIndex: item.zIndex,
        visible: item.visible,
        isSelected: selectedCanvasItemId === item.id,
        onSelect: () => {
          setSelectedCanvasItemId(item.id)
          setRightPanelTab('media-properties')
        },
        onToggleVisibility: () => updateCanvasItem(item.id, { visible: !item.visible }),
        onRemove: () => removeFromMediaCanvas(item.id),
        rightPanelTab: 'media-properties',
      })
    })

    // Lottie animations
    activeAnimations.forEach((anim) => {
      const lib = animationLibrary.find((a) => a.id === anim.animationId)
      items.push({
        id: `anim-${anim.id}`,
        name: lib?.name || 'Animation',
        type: 'animation',
        icon: Sparkles,
        iconColor: '#fbbf24',
        zIndex: anim.zIndex,
        visible: null,
        isSelected: selectedActiveId === anim.id,
        onSelect: () => {
          setSelectedActiveId(anim.id)
          setRightPanelTab('animation-properties')
        },
        onRemove: () => removeFromAnimCanvas(anim.id),
        rightPanelTab: 'animation-properties',
      })
    })

    // SVG objects
    if (svgComposition) {
      svgComposition.objects.forEach((obj) => {
        items.push({
          id: `svg-${obj.id}`,
          name: obj.name || 'SVG Object',
          type: 'svg-object',
          icon: Box,
          iconColor: '#c084fc',
          zIndex: obj.zIndex,
          visible: obj.visible,
          isSelected: selectedSvgObjectId === obj.id,
          onSelect: () => {
            selectSvgObject(obj.id)
            setRightPanelTab('svg-object-properties')
          },
          onToggleVisibility: () => toggleSvgVisibility(obj.id),
          onRemove: () => removeSvgObject(obj.id),
          rightPanelTab: 'svg-object-properties',
        })
      })
    }

    // HTML templates
    htmlTemplates.forEach((tpl) => {
      items.push({
        id: `html-${tpl.id}`,
        name: tpl.name || 'HTML Template',
        type: 'html-template',
        icon: Code2,
        iconColor: '#22d3ee', // cyan
        zIndex: tpl.zIndex,
        visible: tpl.visible,
        isSelected: selectedTemplateId === tpl.id,
        onSelect: () => {
          setSelectedTemplateId(tpl.id)
          setRightPanelTab('html-template-properties')
        },
        onToggleVisibility: () => updateTemplate(tpl.id, { visible: !tpl.visible }),
        onRemove: () => removeTemplate(tpl.id),
        rightPanelTab: 'html-template-properties',
      })
    })

    // Text overlays
    textOverlays.forEach((overlay) => {
      items.push({
        id: `text-${overlay.id}`,
        name: overlay.content.slice(0, 24) || overlay.presetType,
        type: 'text',
        icon: Type,
        iconColor: '#fb923c',
        zIndex: overlay.zIndex,
        visible: overlay.visible,
        isSelected: selectedTextId === overlay.id,
        onSelect: () => {
          setSelectedTextId(overlay.id)
          setRightPanelTab('text-properties')
        },
        onToggleVisibility: () => toggleTextVisibility(overlay.id),
        onRemove: () => removeTextOverlay(overlay.id),
        rightPanelTab: 'text-properties',
      })
    })

    // Shapes
    shapes.forEach((shape) => {
      items.push({
        id: `shape-${shape.id}`,
        name: shape.name || shape.type,
        type: 'shape',
        icon: Pentagon,
        iconColor: (typeof shape.fill === 'string' ? shape.fill : shape.fill?.stops?.[0]?.color) || '#34d399',
        zIndex: shape.zIndex,
        visible: shape.visible,
        isSelected: selectedShapeId === shape.id,
        onSelect: () => {
          setSelectedShapeId(shape.id)
          setRightPanelTab('shape-properties')
        },
        onToggleVisibility: () => updateShape(shape.id, { visible: !shape.visible }),
        onRemove: () => removeShape(shape.id),
        rightPanelTab: 'shape-properties',
      })
    })

    // Whiteboard text items
    wbTextItems.forEach((wbt, i) => {
      items.push({
        id: `wbtext-${wbt.id}`,
        name: wbt.text || 'Whiteboard Text',
        type: 'whiteboard-text',
        icon: PenTool,
        iconColor: wbt.color || '#22c55e',
        zIndex: -1 + i * 0.01, // whiteboard is at bottom
        visible: null,
        isSelected: wbSelectedTextId === wbt.id,
        onSelect: () => {
          setWbSelectedTextId(wbt.id)
          setRightPanelTab('whiteboard-text-properties')
        },
        onRemove: () => removeWbTextItem(wbt.id),
        rightPanelTab: 'whiteboard-text-properties',
      })
    })

    return items
  }, [
    characters,
    activeCharacterId,
    selectDialogueCharacter,
    updateDialogueCharacter,
    removeDialogueCharacter,
    videos,
    selectedVideoId,
    setSelectedVideoId,
    updateVideo,
    removeVideo,
    canvasItems,
    assets,
    selectedCanvasItemId,
    setSelectedCanvasItemId,
    updateCanvasItem,
    removeFromMediaCanvas,
    activeAnimations,
    animationLibrary,
    selectedActiveId,
    setSelectedActiveId,
    removeFromAnimCanvas,
    svgComposition,
    selectedSvgObjectId,
    selectSvgObject,
    toggleSvgVisibility,
    removeSvgObject,
    htmlTemplates,
    selectedTemplateId,
    setSelectedTemplateId,
    updateTemplate,
    removeTemplate,
    textOverlays,
    selectedTextId,
    setSelectedTextId,
    toggleTextVisibility,
    removeTextOverlay,
    shapes,
    selectedShapeId,
    setSelectedShapeId,
    updateShape,
    removeShape,
    wbTextItems,
    wbSelectedTextId,
    setWbSelectedTextId,
    removeWbTextItem,
    setRightPanelTab,
  ])

  // ── Layer lookup map (for custom tree) ──
  const layerMap = useMemo(() => {
    const map = new Map<string, LayerItem>()
    for (const l of layers) map.set(l.id, l)
    return map
  }, [layers])

  // ── Group by category (for categories view) ──
  const grouped = useMemo(() => {
    const map = new Map<string, LayerItem[]>()
    for (const layer of layers) {
      const list = map.get(layer.type) || []
      list.push(layer)
      map.set(layer.type, list)
    }
    // Sort each group by zIndex descending (highest on top)
    for (const list of map.values()) {
      list.sort((a, b) => b.zIndex - a.zIndex)
    }
    return map
  }, [layers])

  // ── Batch group visibility handler ──
  const handleGroupVisibilityToggle = useCallback(
    (groupId: string) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group) return
      const newVisible = !group.visible
      toggleGroupVisibility(groupId)

      // Batch-toggle all descendant layers
      const descendantIds = getAllDescendantLayerIds(groupId)
      for (const lid of descendantIds) {
        const layer = layerMap.get(lid)
        if (!layer || layer.visible === null || !layer.onToggleVisibility) continue
        if (layer.visible !== newVisible) {
          layer.onToggleVisibility()
        }
      }
    },
    [groups, toggleGroupVisibility, getAllDescendantLayerIds, layerMap],
  )

  const totalCount = layers.length

  return (
    <PanelLayout
      icon={GripVertical}
      title="All Layers"
      trailing={<span className="text-xs text-gray-500">{totalCount} items</span>}
    >
      {/* View mode toggle */}
      <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />

      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <GripVertical size={32} className="mb-3 opacity-40" />
          <p className="text-sm">No layers yet</p>
          <p className="text-xs mt-1 text-gray-600">Add media, shapes, text, or animations</p>
        </div>
      ) : viewMode === 'categories' ? (
        /* ── Categories view (existing behavior) ── */
        <div className="divide-y divide-white/5">
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped.get(cat)
            if (!items || items.length === 0) return null
            const isCollapsed = collapsedCategories.has(cat)
            const CategoryIcon = CATEGORY_ICONS[cat] || Box

            return (
              <div key={cat}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-400 hover:text-gray-300 hover:bg-[#3a3a3a]/30 transition-colors"
                >
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  <CategoryIcon size={12} />
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <span className="ml-auto text-gray-600">{items.length}</span>
                </button>

                {/* Layer rows */}
                {!isCollapsed && items.map((layer) => <LayerRow key={layer.id} layer={layer} />)}
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Custom tree view ── */
        <CustomTreeView
          layers={layers}
          layerMap={layerMap}
          groups={groups}
          assignments={assignments}
          layerOrder={layerOrder}
          createGroup={createGroup}
          deleteGroup={deleteGroup}
          renameGroup={renameGroup}
          toggleGroupCollapsed={toggleGroupCollapsed}
          toggleGroupLock={toggleGroupLock}
          assignToGroup={assignToGroup}
          reorderInGroup={reorderInGroup}
          onGroupVisibilityToggle={handleGroupVisibilityToggle}
        />
      )}
    </PanelLayout>
  )
}

// ── View mode toggle ────────────────────────────────────────────────────
function ViewModeToggle({
  viewMode,
  setViewMode,
}: {
  viewMode: 'categories' | 'custom'
  setViewMode: (mode: 'categories' | 'custom') => void
}) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5">
      <button
        onClick={() => setViewMode('categories')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
          viewMode === 'categories'
            ? 'bg-[#4a7eff]/20 text-[#4a7eff]'
            : 'text-gray-500 hover:text-gray-300 hover:bg-[#3a3a3a]/30'
        }`}
      >
        <LayoutGrid size={12} />
        Categories
      </button>
      <button
        onClick={() => setViewMode('custom')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
          viewMode === 'custom'
            ? 'bg-[#4a7eff]/20 text-[#4a7eff]'
            : 'text-gray-500 hover:text-gray-300 hover:bg-[#3a3a3a]/30'
        }`}
      >
        <List size={12} />
        Custom
      </button>
    </div>
  )
}

// ── Custom tree view container ──────────────────────────────────────────
function CustomTreeView({
  layers,
  layerMap,
  groups,
  assignments,
  layerOrder,
  createGroup,
  deleteGroup,
  renameGroup,
  toggleGroupCollapsed,
  toggleGroupLock,
  assignToGroup,
  reorderInGroup,
  onGroupVisibilityToggle,
}: {
  layers: LayerItem[]
  layerMap: Map<string, LayerItem>
  groups: LayerGroup[]
  assignments: Record<string, string | null>
  layerOrder: Record<string, number>
  createGroup: (name: string, parentId?: string | null) => string
  deleteGroup: (id: string) => void
  renameGroup: (id: string, name: string) => void
  toggleGroupCollapsed: (id: string) => void
  toggleGroupLock: (id: string) => void
  assignToGroup: (layerId: string, groupId: string | null) => void
  reorderInGroup: (itemId: string, newOrder: number, newParentId?: string | null) => void
  onGroupVisibilityToggle: (groupId: string) => void
}) {
  // Build root-level items: groups + unassigned layers
  const rootGroups = groups.filter((g) => g.parentId === null).sort((a, b) => a.order - b.order)

  const assignedLayerIds = new Set(
    Object.entries(assignments)
      .filter(([, gid]) => gid !== null)
      .map(([lid]) => lid),
  )

  const rootLayers = layers
    .filter((l) => !assignedLayerIds.has(l.id))
    .sort((a, b) => (layerOrder[a.id] ?? a.zIndex) - (layerOrder[b.id] ?? b.zIndex))

  return (
    <div className="flex flex-col">
      <div className="divide-y divide-white/5">
        {/* Root groups */}
        {rootGroups.map((group) => (
          <GroupNode
            key={group.id}
            group={group}
            depth={0}
            allGroups={groups}
            assignments={assignments}
            layerOrder={layerOrder}
            layerMap={layerMap}
            createGroup={createGroup}
            deleteGroup={deleteGroup}
            renameGroup={renameGroup}
            toggleGroupCollapsed={toggleGroupCollapsed}
            toggleGroupLock={toggleGroupLock}
            assignToGroup={assignToGroup}
            reorderInGroup={reorderInGroup}
            onGroupVisibilityToggle={onGroupVisibilityToggle}
          />
        ))}

        {/* Root-level (ungrouped) layers */}
        {rootLayers.map((layer) => (
          <DraggableLayerRow
            key={layer.id}
            layer={layer}
            depth={0}
            parentGroupId={null}
            assignToGroup={assignToGroup}
            createGroup={createGroup}
          />
        ))}
      </div>

      {/* New group button */}
      <button
        onClick={() => createGroup('New Group')}
        className="flex items-center gap-2 px-4 py-2 mt-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-[#3a3a3a]/30 transition-colors"
      >
        <FolderPlus size={13} />
        New Group
      </button>
    </div>
  )
}

// ── Recursive group node ────────────────────────────────────────────────
function GroupNode({
  group,
  depth,
  allGroups,
  assignments,
  layerOrder,
  layerMap,
  createGroup,
  deleteGroup,
  renameGroup,
  toggleGroupCollapsed,
  toggleGroupLock,
  assignToGroup,
  reorderInGroup,
  onGroupVisibilityToggle,
}: {
  group: LayerGroup
  depth: number
  allGroups: LayerGroup[]
  assignments: Record<string, string | null>
  layerOrder: Record<string, number>
  layerMap: Map<string, LayerItem>
  createGroup: (name: string, parentId?: string | null) => string
  deleteGroup: (id: string) => void
  renameGroup: (id: string, name: string) => void
  toggleGroupCollapsed: (id: string) => void
  toggleGroupLock: (id: string) => void
  assignToGroup: (layerId: string, groupId: string | null) => void
  reorderInGroup: (itemId: string, newOrder: number, newParentId?: string | null) => void
  onGroupVisibilityToggle: (groupId: string) => void
}) {
  const [isDropTarget, setIsDropTarget] = useState(false)

  // Child groups
  const childGroups = allGroups.filter((g) => g.parentId === group.id).sort((a, b) => a.order - b.order)

  // Child layers
  const childLayers = Object.entries(assignments)
    .filter(([, gid]) => gid === group.id)
    .map(([lid]) => layerMap.get(lid))
    .filter((l): l is LayerItem => l !== undefined)
    .sort((a, b) => (layerOrder[a.id] ?? a.zIndex) - (layerOrder[b.id] ?? b.zIndex))

  const childCount = childGroups.length + childLayers.length

  // Check if a group is an ancestor of this group (for circular nesting prevention)
  const isAncestor = useCallback(
    (draggedGroupId: string): boolean => {
      let current: string | null = group.id
      while (current) {
        if (current === draggedGroupId) return true
        const g = allGroups.find((gr) => gr.id === current)
        current = g?.parentId ?? null
      }
      return false
    },
    [group.id, allGroups],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      // We can't read data during dragover in most browsers, so just allow drop
      setIsDropTarget(true)
    } catch {
      /* ignore */
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation()
    setIsDropTarget(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDropTarget(false)

      try {
        const raw = e.dataTransfer.getData(DRAG_MIME)
        if (!raw) return
        const data = JSON.parse(raw) as { id: string; itemType: 'layer' | 'group' }

        // Calculate next order within this group
        const maxChildGroupOrder = allGroups
          .filter((g) => g.parentId === group.id)
          .reduce((max, g) => Math.max(max, g.order), 0)
        const maxChildLayerOrder = Object.entries(assignments)
          .filter(([, gid]) => gid === group.id)
          .reduce((max, [lid]) => Math.max(max, layerOrder[lid] ?? 0), 0)
        const nextOrder = Math.max(maxChildGroupOrder, maxChildLayerOrder) + 1

        if (data.itemType === 'group') {
          // Prevent dropping a group into its own descendant
          if (data.id === group.id || isAncestor(data.id)) return
          reorderInGroup(data.id, nextOrder, group.id)
        } else {
          assignToGroup(data.id, group.id)
        }
      } catch {
        /* ignore bad data */
      }
    },
    [group.id, allGroups, assignments, layerOrder, isAncestor, reorderInGroup, assignToGroup],
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData(DRAG_MIME, JSON.stringify({ id: group.id, itemType: 'group' }))
      e.dataTransfer.effectAllowed = 'move'
    },
    [group.id],
  )

  const FolderIcon = group.collapsed ? Folder : FolderOpen
  const LockIcon = group.locked ? Lock : Unlock

  return (
    <div>
      <GroupHeader
        group={group}
        depth={depth}
        childCount={childCount}
        isDropTarget={isDropTarget}
        FolderIcon={FolderIcon}
        LockIcon={LockIcon}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        toggleGroupCollapsed={toggleGroupCollapsed}
        onGroupVisibilityToggle={onGroupVisibilityToggle}
        toggleGroupLock={toggleGroupLock}
        renameGroup={renameGroup}
        deleteGroup={deleteGroup}
      />

      {/* Children */}
      {!group.collapsed && (
        <div className={group.locked ? 'opacity-50 pointer-events-none' : ''}>
          {childGroups.map((child) => (
            <GroupNode
              key={child.id}
              group={child}
              depth={depth + 1}
              allGroups={allGroups}
              assignments={assignments}
              layerOrder={layerOrder}
              layerMap={layerMap}
              createGroup={createGroup}
              deleteGroup={deleteGroup}
              renameGroup={renameGroup}
              toggleGroupCollapsed={toggleGroupCollapsed}
              toggleGroupLock={toggleGroupLock}
              assignToGroup={assignToGroup}
              reorderInGroup={reorderInGroup}
              onGroupVisibilityToggle={onGroupVisibilityToggle}
            />
          ))}
          {childLayers.map((layer) => (
            <DraggableLayerRow
              key={layer.id}
              layer={layer}
              depth={depth + 1}
              parentGroupId={group.id}
              assignToGroup={assignToGroup}
              createGroup={createGroup}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Group header ────────────────────────────────────────────────────────
function GroupHeader({
  group,
  depth,
  childCount,
  isDropTarget,
  FolderIcon,
  LockIcon,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  toggleGroupCollapsed,
  onGroupVisibilityToggle,
  toggleGroupLock,
  renameGroup,
  deleteGroup,
}: {
  group: LayerGroup
  depth: number
  childCount: number
  isDropTarget: boolean
  FolderIcon: typeof Folder
  LockIcon: typeof Lock
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  toggleGroupCollapsed: (id: string) => void
  onGroupVisibilityToggle: (groupId: string) => void
  toggleGroupLock: (id: string) => void
  renameGroup: (id: string, name: string) => void
  deleteGroup: (id: string) => void
}) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(group.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const startRename = useCallback(() => {
    setRenameValue(group.name)
    setIsRenaming(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }, [group.name])

  const commitRename = useCallback(() => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== group.name) {
      renameGroup(group.id, trimmed)
    }
    setIsRenaming(false)
  }, [renameValue, group.name, group.id, renameGroup])

  const paddingLeft = 16 + depth * 16

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex items-center gap-1.5 py-1.5 pr-2 cursor-pointer transition-colors group/header hover:bg-[#3a3a3a]/30 ${
        isDropTarget ? 'bg-[#4a7eff]/10 ring-1 ring-inset ring-[#4a7eff]/40' : ''
      }`}
      style={{ paddingLeft }}
    >
      {/* Collapse chevron */}
      <button
        onClick={() => toggleGroupCollapsed(group.id)}
        className="text-gray-500 hover:text-gray-300 shrink-0"
        aria-label={group.collapsed ? 'Expand group' : 'Collapse group'}
      >
        {group.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Folder icon */}
      <FolderIcon size={13} className="text-yellow-500/70 shrink-0" />

      {/* Name (inline rename on double-click) */}
      {isRenaming ? (
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') setIsRenaming(false)
          }}
          className="flex-1 text-xs bg-[#2a2a2a] border border-[#4a7eff]/50 rounded px-1 py-0 text-white outline-none min-w-0"
          autoFocus
        />
      ) : (
        <span onDoubleClick={startRename} className="flex-1 text-xs text-gray-300 truncate select-none">
          {group.name}
        </span>
      )}

      {/* Child count */}
      <span className="text-[10px] text-gray-600 tabular-nums shrink-0">{childCount}</span>

      {/* Visibility */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onGroupVisibilityToggle(group.id)
        }}
        className={`p-0.5 rounded transition-colors shrink-0 ${
          group.visible ? 'text-gray-500 hover:text-gray-300' : 'text-gray-700 hover:text-gray-500'
        }`}
        title={group.visible ? 'Hide group' : 'Show group'}
        aria-label={group.visible ? 'Hide group' : 'Show group'}
      >
        {group.visible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>

      {/* Lock */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleGroupLock(group.id)
        }}
        className={`p-0.5 rounded transition-colors shrink-0 ${
          group.locked ? 'text-yellow-500/70' : 'text-gray-600 hover:text-gray-400'
        }`}
        title={group.locked ? 'Unlock group' : 'Lock group'}
        aria-label={group.locked ? 'Unlock group' : 'Lock group'}
      >
        <LockIcon size={12} />
      </button>

      {/* Rename button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          startRename()
        }}
        className="p-0.5 rounded text-gray-700 hover:text-gray-400 opacity-0 group-hover/header:opacity-100 transition-all shrink-0"
        title="Rename"
        aria-label="Rename group"
      >
        <Pencil size={11} />
      </button>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          deleteGroup(group.id)
        }}
        className="p-0.5 rounded text-gray-700 hover:text-red-400 opacity-0 group-hover/header:opacity-100 transition-all shrink-0"
        title="Delete group (layers move to parent)"
        aria-label="Delete group"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

// ── Draggable layer row (for custom tree) ───────────────────────────────
function DraggableLayerRow({
  layer,
  depth,
  parentGroupId,
  assignToGroup,
  createGroup,
}: {
  layer: LayerItem
  depth: number
  parentGroupId?: string | null
  assignToGroup: (layerId: string, groupId: string | null) => void
  createGroup: (name: string, parentId?: string | null) => string
}) {
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData(DRAG_MIME, JSON.stringify({ id: layer.id, itemType: 'layer' }))
      e.dataTransfer.effectAllowed = 'move'
    },
    [layer.id],
  )

  // Drop on a layer row = auto-create group with both layers
  const [isDropTarget, setIsDropTarget] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropTarget(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDropTarget(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDropTarget(false)

      try {
        const raw = e.dataTransfer.getData(DRAG_MIME)
        if (!raw) return
        const data = JSON.parse(raw) as { id: string; itemType: 'layer' | 'group' }
        if (data.id === layer.id) return

        if (data.itemType === 'layer') {
          // Auto-create a group containing both layers
          const groupId = createGroup('Group', parentGroupId ?? null)
          assignToGroup(layer.id, groupId)
          assignToGroup(data.id, groupId)
        } else {
          // Dropping a group onto a layer — move layer into that group
          assignToGroup(layer.id, data.id)
        }
      } catch {
        /* ignore */
      }
    },
    [layer.id, parentGroupId, assignToGroup, createGroup],
  )

  const Icon = layer.icon
  const indent = 16 + (depth + 1) * 16 // extra indent vs group header

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={layer.onSelect}
      className={`flex items-center gap-2 pr-3 py-1.5 cursor-pointer transition-colors group ${
        isDropTarget
          ? 'border-t-2 border-[#4a7eff]'
          : layer.isSelected
            ? 'bg-[#4a7eff]/10 border-l-2 border-[#4a7eff]'
            : 'hover:bg-[#3a3a3a]/30 border-l-2 border-transparent'
      }`}
      style={{ paddingLeft: indent }}
    >
      {/* Drag handle */}
      <GripVertical size={10} className="text-gray-700 shrink-0 cursor-grab" />

      {/* Icon */}
      <Icon size={14} style={{ color: layer.iconColor }} className="shrink-0" />

      {/* Name */}
      <span className={`flex-1 text-xs truncate ${layer.isSelected ? 'text-white font-medium' : 'text-gray-400'}`}>
        {layer.name}
      </span>

      {/* z-index badge */}
      <span className="text-[10px] text-gray-600 tabular-nums shrink-0">z{layer.zIndex}</span>

      {/* Visibility toggle */}
      {layer.visible !== null && layer.onToggleVisibility && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            layer.onToggleVisibility!()
          }}
          className={`p-0.5 rounded transition-colors ${
            layer.visible ? 'text-gray-500 hover:text-gray-300' : 'text-gray-700 hover:text-gray-500'
          }`}
          title={layer.visible ? 'Hide' : 'Show'}
          aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      )}

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          layer.onRemove()
        }}
        className="p-0.5 rounded text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        title="Remove"
        aria-label="Remove layer"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── Individual layer row (for categories view, unchanged) ───────────────
function LayerRow({ layer }: { layer: LayerItem }) {
  const Icon = layer.icon

  return (
    <div
      onClick={layer.onSelect}
      className={`flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors group ${
        layer.isSelected
          ? 'bg-[#4a7eff]/10 border-l-2 border-[#4a7eff]'
          : 'hover:bg-[#3a3a3a]/30 border-l-2 border-transparent'
      }`}
    >
      {/* Icon */}
      <Icon size={14} style={{ color: layer.iconColor }} className="shrink-0 ml-3" />

      {/* Name */}
      <span className={`flex-1 text-xs truncate ${layer.isSelected ? 'text-white font-medium' : 'text-gray-400'}`}>
        {layer.name}
      </span>

      {/* z-index badge */}
      <span className="text-[10px] text-gray-600 tabular-nums shrink-0">z{layer.zIndex}</span>

      {/* Visibility toggle */}
      {layer.visible !== null && layer.onToggleVisibility && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            layer.onToggleVisibility!()
          }}
          className={`p-0.5 rounded transition-colors ${
            layer.visible ? 'text-gray-500 hover:text-gray-300' : 'text-gray-700 hover:text-gray-500'
          }`}
          title={layer.visible ? 'Hide' : 'Show'}
          aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      )}

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          layer.onRemove()
        }}
        className="p-0.5 rounded text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        title="Remove"
        aria-label="Remove layer"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
