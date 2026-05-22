/**
 * WhiteboardToolbar
 *
 * Vertical toolbar on the left side of the canvas (Figma/Photoshop style).
 * Shows cursor, hand, pen tools, and erasers. Clicking a tool with sub-tools
 * opens a horizontal flyout to the right showing the variants.
 * Draggable via grip handle — position is stored in the whiteboard store.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import { useEditorStore } from '@/stores'
import { GripHorizontal } from 'lucide-react'

// SVG icon imports
import cursorIcon from '/svg/cursor-icon.svg'
import handIcon from '/svg/hand-icon.svg'
import penIcon from '/svg/pen-icon.svg'
import chalkIcon from '/svg/chalk-icon.svg'
import markerIcon from '/svg/marker-icon.svg'
import brushIcon from '/svg/brush-icon.svg'
import finePenIcon from '/svg/fine-pen-icon.svg'
import eraserIcon from '/svg/eraser-icon.svg'
import preciseEraserIcon from '/svg/precise-eraser-icon.svg'

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export interface ToolDef {
  id: string
  label: string
  icon: string
  /** Canvas cursor when this tool is active */
  cursor: string
  /** Drawing brush width (0 = not a drawing tool) */
  width: number
  opacity: number
  /** Is this an eraser? */
  isEraser?: boolean
}

const TOOL_CURSOR: ToolDef = { id: 'cursor', label: 'Select', icon: cursorIcon, cursor: 'default', width: 0, opacity: 1 }
const TOOL_HAND: ToolDef = { id: 'hand', label: 'Hand', icon: handIcon, cursor: 'grab', width: 0, opacity: 1 }

const PEN_TOOLS: ToolDef[] = [
  { id: 'pen', label: 'Pen', icon: penIcon, cursor: 'crosshair', width: 3, opacity: 0.9 },
  { id: 'chalk', label: 'Chalk', icon: chalkIcon, cursor: 'crosshair', width: 5, opacity: 0.5 },
  { id: 'marker', label: 'Marker', icon: markerIcon, cursor: 'crosshair', width: 8, opacity: 0.85 },
  { id: 'brush', label: 'Brush', icon: brushIcon, cursor: 'crosshair', width: 6, opacity: 0.8 },
  { id: 'fine', label: 'Fine Pen', icon: finePenIcon, cursor: 'crosshair', width: 1.5, opacity: 0.95 },
]

const ERASER_TOOLS: ToolDef[] = [
  { id: 'eraser', label: 'Eraser', icon: eraserIcon, cursor: 'crosshair', width: 16, opacity: 1, isEraser: true },
  { id: 'precise-eraser', label: 'Precision Eraser', icon: preciseEraserIcon, cursor: 'crosshair', width: 4, opacity: 1, isEraser: true },
]

// Shape tool icons as data URIs
const lineIconUri = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><line x1="4" y1="20" x2="20" y2="4"/></svg>')}`
const rectIconUri = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>')}`
const circleIconUri = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>')}`

// Text tool icon
const textIconUri = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9.5" y1="20" x2="14.5" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>')}`

const SHAPE_TOOLS: ToolDef[] = [
  { id: 'line', label: 'Line', icon: lineIconUri, cursor: 'crosshair', width: 3, opacity: 0.9 },
  { id: 'rectangle', label: 'Rectangle', icon: rectIconUri, cursor: 'crosshair', width: 3, opacity: 0.9 },
  { id: 'circle', label: 'Circle', icon: circleIconUri, cursor: 'crosshair', width: 3, opacity: 0.9 },
]

const TOOL_TEXT: ToolDef = { id: 'text', label: 'Text', icon: textIconUri, cursor: 'text', width: 0, opacity: 1 }

export const ALL_TOOLS: ToolDef[] = [TOOL_CURSOR, TOOL_HAND, ...PEN_TOOLS, ...SHAPE_TOOLS, TOOL_TEXT, ...ERASER_TOOLS]

// Toolbar groups — each group shows one icon; clicking opens flyout with variants
interface ToolGroup {
  tools: ToolDef[]
}

const TOOL_GROUPS: ToolGroup[] = [
  { tools: [TOOL_CURSOR] },
  { tools: [TOOL_HAND] },
  { tools: PEN_TOOLS },
  { tools: SHAPE_TOOLS },
  { tools: [TOOL_TEXT] },
  { tools: ERASER_TOOLS },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WhiteboardToolbar() {
  const enabled = useWhiteboardStore((s) => s.enabled)
  const activeBrush = useWhiteboardStore((s) => s.activeBrush ?? 'cursor')
  const setActiveBrush = useWhiteboardStore((s) => s.setActiveBrush)
  const setDrawingActive = useWhiteboardStore((s) => s.setDrawingActive)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const toolbarPosition = useWhiteboardStore((s) => s.toolbarPosition)
  const setToolbarPosition = useWhiteboardStore((s) => s.setToolbarPosition)

  const [flyoutGroupIdx, setFlyoutGroupIdx] = useState<number | null>(null)
  const [flyoutPos, setFlyoutPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Close flyout on outside click
  useEffect(() => {
    if (flyoutGroupIdx === null) return
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current?.contains(e.target as Node)) return
      if (flyoutRef.current?.contains(e.target as Node)) return
      setFlyoutGroupIdx(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [flyoutGroupIdx])

  // Drag logic
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFlyoutGroupIdx(null) // Close any open flyout when dragging starts
    const toolbar = toolbarRef.current
    if (!toolbar) return
    const rect = toolbar.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e: MouseEvent) => {
      const toolbar = toolbarRef.current
      if (!toolbar) return
      const parent = toolbar.parentElement
      if (!parent) return
      const parentRect = parent.getBoundingClientRect()
      const toolbarRect = toolbar.getBoundingClientRect()

      let newX = e.clientX - parentRect.left - dragOffset.current.x
      let newY = e.clientY - parentRect.top - dragOffset.current.y

      // Constrain within parent bounds
      newX = Math.max(0, Math.min(newX, parentRect.width - toolbarRect.width))
      newY = Math.max(0, Math.min(newY, parentRect.height - toolbarRect.height))

      setToolbarPosition({ x: newX, y: newY })
    }
    const handleMouseUp = () => setIsDragging(false)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, setToolbarPosition])

  if (!enabled) return null

  // Find which group the active tool belongs to, and which tool within it
  const activeGroupIdx = TOOL_GROUPS.findIndex((g) => g.tools.some((t) => t.id === activeBrush))

  const selectTool = (tool: ToolDef) => {
    setActiveBrush(tool.id)
    setFlyoutGroupIdx(null)

    if (tool.id === 'text') {
      setDrawingActive(false)
      setRightPanelTab('whiteboard-text-properties')
    } else if (tool.width > 0) {
      // It's a drawing/eraser tool
      setDrawingActive(true)
      setRightPanelTab('whiteboard-drawing-properties')
    } else {
      // Cursor or hand — exit drawing mode
      setDrawingActive(false)
    }
  }

  const handleGroupClick = (groupIdx: number, _e: React.MouseEvent) => {
    const group = TOOL_GROUPS[groupIdx]

    if (group.tools.length === 1) {
      // Single tool — just select it
      selectTool(group.tools[0])
      return
    }

    // Multi-tool group — toggle flyout
    if (flyoutGroupIdx === groupIdx) {
      setFlyoutGroupIdx(null)
    } else {
      const btn = buttonRefs.current[groupIdx]
      const toolbar = toolbarRef.current
      if (btn && toolbar) {
        const btnRect = btn.getBoundingClientRect()
        const toolbarRect = toolbar.getBoundingClientRect()
        setFlyoutPos({ top: btnRect.top, left: toolbarRect.right + 6 })
      }
      setFlyoutGroupIdx(groupIdx)
    }
  }

  return (
    <>
      {/* Vertical toolbar — draggable on canvas */}
      <div
        ref={toolbarRef}
        style={{
          position: 'absolute',
          ...(toolbarPosition
            ? { left: toolbarPosition.x, top: toolbarPosition.y }
            : { left: 12, top: '50%', transform: 'translateY(-50%)' }),
          zIndex: 60,
        }}
        className="flex flex-col gap-0.5 bg-zinc-800/95 backdrop-blur-xl border border-zinc-600/40 rounded-xl p-1.5 shadow-xl"
      >
        {/* Drag grip handle */}
        <div
          onMouseDown={handleDragStart}
          className="flex items-center justify-center py-1 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Drag to reposition"
        >
          <GripHorizontal size={14} />
        </div>

        <div className="h-px bg-zinc-600/40 mx-2" />

        {TOOL_GROUPS.map((group, gi) => {
          // Show the currently selected tool from this group, or the first one
          const displayTool = group.tools.find((t) => t.id === activeBrush) ?? group.tools[0]
          const isActiveGroup = gi === activeGroupIdx
          const hasMultiple = group.tools.length > 1

          return (
            <div key={gi} className="relative">
              <button
                ref={(el) => { buttonRefs.current[gi] = el }}
                onClick={(e) => handleGroupClick(gi, e)}
                className={`relative p-2 rounded-lg transition-all ${
                  isActiveGroup
                    ? 'bg-blue-500/25 ring-1 ring-blue-500/50'
                    : 'hover:bg-white/[0.08]'
                }`}
                title={displayTool.label}
              >
                <img
                  src={displayTool.icon}
                  alt={displayTool.label}
                  style={{ width: 24, height: 24, filter: isActiveGroup ? 'brightness(0) invert(1)' : 'brightness(0) invert(1) opacity(0.6)' }}
                />
                {/* Small triangle indicator for groups with multiple tools */}
                {hasMultiple && (
                  <div className="absolute bottom-1 right-1 w-0 h-0 border-l-[3px] border-l-transparent border-t-[3px] border-t-zinc-400 border-r-[3px] border-r-transparent" />
                )}
              </button>

              {/* Divider after hand tool */}
              {gi === 1 && <div className="h-px bg-zinc-600/40 my-1 mx-2" />}
            </div>
          )
        })}
      </div>

      {/* Flyout — vertical column to the right of the toolbar */}
      {flyoutGroupIdx !== null && createPortal(
        <div
          ref={flyoutRef}
          style={{
            position: 'fixed',
            top: flyoutPos.top,
            left: flyoutPos.left,
          }}
          className="z-[9999] flex flex-col gap-0.5 bg-zinc-800/95 backdrop-blur-xl border border-zinc-600/40 rounded-xl p-1.5 shadow-xl"
        >
          {TOOL_GROUPS[flyoutGroupIdx].tools.map((tool) => {
            const isActive = activeBrush === tool.id
            return (
              <button
                key={tool.id}
                onClick={() => selectTool(tool)}
                className={`p-2 rounded-lg transition-all group relative ${
                  isActive
                    ? 'bg-blue-500/25 ring-1 ring-blue-500/50'
                    : 'hover:bg-white/[0.08]'
                }`}
                title={tool.label}
              >
                <img
                  src={tool.icon}
                  alt={tool.label}
                  style={{ width: 24, height: 24, filter: isActive ? 'brightness(0) invert(1)' : 'brightness(0) invert(1) opacity(0.6)' }}
                />
                {/* Tooltip */}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[9px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {tool.label}
                </span>
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </>
  )
}
