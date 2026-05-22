import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { EditorViewMode, CanvasNode, CanvasConnection, CharacterMode } from '@/types/nodeCanvas'
import type { LeftPanelTab, TabGroupId, RightPanelTab } from '@/types'
import { TAB_TO_GROUP } from '@/constants/tabGroups'
import { useEditorStore } from './useEditorStore'

const MAX_NODES = 100

const PAN_BOUNDS = { min: -5000, max: 5000 }

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3

/**
 * Detect whether adding an edge from `fromId` to `toId` would create a cycle.
 * Uses BFS from `toId` following existing outgoing edges; if it can reach `fromId`,
 * a cycle would be formed.
 */
function wouldCreateCycle(
  connections: { fromNodeId: string; toNodeId: string }[],
  fromId: string,
  toId: string
): boolean {
  const visited = new Set<string>()
  const queue = [toId]
  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === fromId) return true
    if (visited.has(current)) continue
    visited.add(current)
    for (const c of connections) {
      if (c.fromNodeId === current) {
        queue.push(c.toNodeId)
      }
    }
  }
  return false
}

/** Map left panel tab → most relevant right panel tab */
const TAB_TO_RIGHT_PANEL: Partial<Record<string, RightPanelTab>> = {
  'character': 'group-properties',
  'text': 'text-properties',
  'media': 'media-properties',
  'assets': 'animation-properties',
  'captions': 'group-properties',
  'transitions': 'group-properties',
  'scripts': 'voices',
  'dialogue': 'voices',
  'style-effects': 'style-properties',
  '3d-objects': '3d-character-properties',
}

interface NodeCanvasState {
  viewMode: EditorViewMode
  nodes: CanvasNode[]
  connections: CanvasConnection[]
  pan: { x: number; y: number }
  zoom: number
  selectedNodeId: string | null
  focusedNodeId: string | null
  spotlightOpen: boolean
  spotlightPosition: { x: number; y: number }
  /** When set, Spotlight will auto-connect the new node from this source */
  pendingConnectionFromNodeId: string | null

  // Actions
  setViewMode: (mode: EditorViewMode) => void
  addNode: (tabId: LeftPanelTab, position: { x: number; y: number }, characterMode?: CharacterMode) => string | null
  removeNode: (id: string) => void
  moveNode: (id: string, position: { x: number; y: number }) => void
  toggleNodeCollapse: (id: string) => void
  selectNode: (id: string | null) => void
  focusNode: (id: string | null) => void
  addConnection: (fromNodeId: string, toNodeId: string) => void
  removeConnection: (id: string) => void
  setPan: (pan: { x: number; y: number }) => void
  setZoom: (zoom: number) => void
  openSpotlight: (position: { x: number; y: number }, connectFromNodeId?: string) => void
  closeSpotlight: () => void
}

let nodeIdCounter = 0

export const useNodeCanvasStore = create<NodeCanvasState>()(
  persist(
    immer((set) => ({
      viewMode: 'classic' as EditorViewMode,
      nodes: [] as CanvasNode[],
      connections: [] as CanvasConnection[],
      pan: { x: 0, y: 0 },
      zoom: 1,
      selectedNodeId: null,
      focusedNodeId: null,
      spotlightOpen: false,
      spotlightPosition: { x: 0, y: 0 },
      pendingConnectionFromNodeId: null,

      setViewMode: (mode) => {
        set((s) => { s.viewMode = mode })
      },

      addNode: (tabId, position, characterMode) => {
        const state = useNodeCanvasStore.getState()
        if (state.nodes.length >= MAX_NODES) return null
        const id = `node-${Date.now()}-${++nodeIdCounter}`
        const groupId = (TAB_TO_GROUP[tabId] ?? 'create') as TabGroupId
        set((s) => {
          s.nodes.push({ id, tabId, groupId, position, collapsed: true, characterMode })
        })
        return id
      },

      removeNode: (id) => {
        set((s) => {
          s.nodes = s.nodes.filter((n) => n.id !== id)
          s.connections = s.connections.filter(
            (c) => c.fromNodeId !== id && c.toNodeId !== id
          )
          if (s.selectedNodeId === id) s.selectedNodeId = null
          if (s.focusedNodeId === id) s.focusedNodeId = null
        })
      },

      moveNode: (id, position) => {
        set((s) => {
          const node = s.nodes.find((n) => n.id === id)
          if (node) node.position = position
        })
      },

      toggleNodeCollapse: (id) => {
        set((s) => {
          const node = s.nodes.find((n) => n.id === id)
          if (node) node.collapsed = !node.collapsed
        })
      },

      selectNode: (id) => {
        set((s) => { s.selectedNodeId = id })
      },

      focusNode: (id) => {
        set((s) => {
          s.focusedNodeId = id
          s.selectedNodeId = id
        })
        if (id) {
          const state = useNodeCanvasStore.getState()
          const node = state.nodes.find((n) => n.id === id)
          if (node) {
            const editor = useEditorStore.getState()
            editor.setLeftPanelActiveTab(node.tabId)
            // Set character dimension filter for character nodes
            if (node.tabId === 'character' && node.characterMode) {
              const filter = (node.characterMode === '1d' || node.characterMode === 'avatar') ? '2d' : node.characterMode
              editor.setCharacterDimensionFilter(filter)
            }
            const rightTab = TAB_TO_RIGHT_PANEL[node.tabId]
            if (rightTab) editor.setRightPanelTab(rightTab)
          }
        }
      },

      addConnection: (fromNodeId, toNodeId) => {
        if (fromNodeId === toNodeId) return
        const state = useNodeCanvasStore.getState()
        const exists = state.connections.some(
          (c) => c.fromNodeId === fromNodeId && c.toNodeId === toNodeId
        )
        if (exists) return
        if (wouldCreateCycle(state.connections, fromNodeId, toNodeId)) return
        set((s) => {
          const id = `conn-${Date.now()}-${++nodeIdCounter}`
          s.connections.push({ id, fromNodeId, toNodeId })
        })
      },

      removeConnection: (id) => {
        set((s) => {
          s.connections = s.connections.filter((c) => c.id !== id)
        })
      },

      setPan: (pan) => {
        set((s) => {
          s.pan = {
            x: Math.max(PAN_BOUNDS.min, Math.min(PAN_BOUNDS.max, pan.x)),
            y: Math.max(PAN_BOUNDS.min, Math.min(PAN_BOUNDS.max, pan.y)),
          }
        })
      },

      setZoom: (zoom) => {
        set((s) => { s.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) })
      },

      openSpotlight: (position, connectFromNodeId) => {
        set((s) => {
          s.spotlightOpen = true
          s.spotlightPosition = position
          s.pendingConnectionFromNodeId = connectFromNodeId ?? null
        })
      },

      closeSpotlight: () => {
        set((s) => {
          s.spotlightOpen = false
          s.pendingConnectionFromNodeId = null
        })
      },
    })),
    {
      name: 'proanimate-node-canvas',
      partialize: (state) => ({
        viewMode: state.viewMode,
        nodes: state.nodes,
        connections: state.connections,
        pan: state.pan,
        zoom: state.zoom,
      }),
    }
  )
)
