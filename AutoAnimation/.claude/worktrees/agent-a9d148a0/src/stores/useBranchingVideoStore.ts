/**
 * Branching / Interactive Video store.
 * Manages the DAG graph of branch nodes and edges,
 * plus runtime playback navigation state.
 */
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { BranchGraph, BranchNode, BranchEdge, BranchPlaybackState } from '@/types/branchingVideo'

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

interface BranchingVideoState {
  /** All branching video graphs (keyed by graph ID) */
  graphs: Record<string, BranchGraph>
  /** Currently active graph for editing */
  activeGraphId: string | null
  /** Runtime playback state */
  playback: BranchPlaybackState
  /** Whether preview mode is active */
  previewMode: boolean

  // ─── Graph CRUD ─────────────────────────────────────────────────────

  createGraph: (name?: string) => string
  deleteGraph: (id: string) => void
  setActiveGraph: (id: string | null) => void
  getActiveGraph: () => BranchGraph | null
  updateGraphName: (graphId: string, name: string) => void

  // ─── Node CRUD ──────────────────────────────────────────────────────

  addNode: (graphId: string, partial?: Partial<BranchNode>) => string
  updateNode: (graphId: string, nodeId: string, updates: Partial<BranchNode>) => void
  removeNode: (graphId: string, nodeId: string) => void
  setEntryNode: (graphId: string, nodeId: string) => void

  // ─── Edge CRUD ──────────────────────────────────────────────────────

  addEdge: (graphId: string, fromNodeId: string, targetNodeId: string, choiceLabel?: string) => string
  updateEdge: (graphId: string, edgeId: string, updates: Partial<BranchEdge>) => void
  removeEdge: (graphId: string, edgeId: string) => void

  // ─── Playback Navigation ────────────────────────────────────────────

  /** Start playback from the entry node */
  startPlayback: () => void
  /** Stop playback and reset */
  stopPlayback: () => void
  /** Navigate to a specific node (e.g. when viewer picks a choice) */
  navigateToNode: (nodeId: string) => void
  /** Set whether we're at a decision point */
  setAtDecisionPoint: (atDecision: boolean) => void
  /** Go back to previously visited node */
  goBack: () => void
  /** Toggle preview mode */
  setPreviewMode: (preview: boolean) => void
  /** Get outgoing edges from a given node */
  getOutgoingEdges: (nodeId: string) => BranchEdge[]

  // ─── Reset ──────────────────────────────────────────────────────────

  reset: () => void
}

const initialPlayback: BranchPlaybackState = {
  activeNodeId: null,
  atDecisionPoint: false,
  visitHistory: [],
}

export const useBranchingVideoStore = create<BranchingVideoState>()(
  immer((set, get) => ({
    graphs: {},
    activeGraphId: null,
    playback: { ...initialPlayback },
    previewMode: false,

    // ─── Graph CRUD ───────────────────────────────────────────────────

    createGraph: (name = 'Branching Video') => {
      const id = generateId('bgraph')
      const entryNode: BranchNode = {
        id: generateId('bnode'),
        label: 'Start',
        timelineSegment: { startFrame: 0, endFrame: 150 },
        position: { x: 100, y: 200 },
      }

      set((state) => {
        state.graphs[id] = {
          id,
          name,
          nodes: [entryNode],
          edges: [],
          entryNodeId: entryNode.id,
        }
        state.activeGraphId = id
      })

      return id
    },

    deleteGraph: (id) =>
      set((state) => {
        delete state.graphs[id]
        if (state.activeGraphId === id) {
          state.activeGraphId = null
        }
      }),

    setActiveGraph: (id) =>
      set((state) => {
        state.activeGraphId = id
      }),

    getActiveGraph: () => {
      const { graphs, activeGraphId } = get()
      return activeGraphId ? graphs[activeGraphId] ?? null : null
    },

    updateGraphName: (graphId, name) =>
      set((state) => {
        const graph = state.graphs[graphId]
        if (graph) graph.name = name
      }),

    // ─── Node CRUD ────────────────────────────────────────────────────

    addNode: (graphId, partial = {}) => {
      const nodeId = generateId('bnode')
      set((state) => {
        const graph = state.graphs[graphId]
        if (!graph) return
        graph.nodes.push({
          id: nodeId,
          label: partial.label ?? `Scene ${graph.nodes.length + 1}`,
          timelineSegment: partial.timelineSegment ?? {
            startFrame: graph.nodes.length * 150,
            endFrame: graph.nodes.length * 150 + 150,
          },
          position: partial.position ?? {
            x: 100 + graph.nodes.length * 220,
            y: 200,
          },
          color: partial.color,
        })
      })
      return nodeId
    },

    updateNode: (graphId, nodeId, updates) =>
      set((state) => {
        const graph = state.graphs[graphId]
        if (!graph) return
        const node = graph.nodes.find((n) => n.id === nodeId)
        if (node) Object.assign(node, updates)
      }),

    removeNode: (graphId, nodeId) =>
      set((state) => {
        const graph = state.graphs[graphId]
        if (!graph) return
        graph.nodes = graph.nodes.filter((n) => n.id !== nodeId)
        // Remove connected edges
        graph.edges = graph.edges.filter(
          (e) => e.fromNodeId !== nodeId && e.targetNodeId !== nodeId
        )
        // If removed node was entry, reassign to first remaining node
        if (graph.entryNodeId === nodeId && graph.nodes.length > 0) {
          graph.entryNodeId = graph.nodes[0].id
        }
      }),

    setEntryNode: (graphId, nodeId) =>
      set((state) => {
        const graph = state.graphs[graphId]
        if (graph) graph.entryNodeId = nodeId
      }),

    // ─── Edge CRUD ────────────────────────────────────────────────────

    addEdge: (graphId, fromNodeId, targetNodeId, choiceLabel) => {
      const edgeId = generateId('bedge')
      set((state) => {
        const graph = state.graphs[graphId]
        if (!graph) return
        // Compute sort order based on existing edges from this node
        const existingFromNode = graph.edges.filter((e) => e.fromNodeId === fromNodeId)
        graph.edges.push({
          id: edgeId,
          fromNodeId,
          targetNodeId,
          choiceLabel: choiceLabel ?? `Choice ${existingFromNode.length + 1}`,
          sortOrder: existingFromNode.length,
        })
      })
      return edgeId
    },

    updateEdge: (graphId, edgeId, updates) =>
      set((state) => {
        const graph = state.graphs[graphId]
        if (!graph) return
        const edge = graph.edges.find((e) => e.id === edgeId)
        if (edge) Object.assign(edge, updates)
      }),

    removeEdge: (graphId, edgeId) =>
      set((state) => {
        const graph = state.graphs[graphId]
        if (!graph) return
        graph.edges = graph.edges.filter((e) => e.id !== edgeId)
      }),

    // ─── Playback Navigation ──────────────────────────────────────────

    startPlayback: () =>
      set((state) => {
        const graph = state.activeGraphId ? state.graphs[state.activeGraphId] : null
        if (!graph) return
        state.playback = {
          activeNodeId: graph.entryNodeId,
          atDecisionPoint: false,
          visitHistory: [graph.entryNodeId],
        }
        state.previewMode = true
      }),

    stopPlayback: () =>
      set((state) => {
        state.playback = { ...initialPlayback }
        state.previewMode = false
      }),

    navigateToNode: (nodeId) =>
      set((state) => {
        state.playback.activeNodeId = nodeId
        state.playback.atDecisionPoint = false
        state.playback.visitHistory.push(nodeId)
      }),

    setAtDecisionPoint: (atDecision) =>
      set((state) => {
        state.playback.atDecisionPoint = atDecision
      }),

    goBack: () =>
      set((state) => {
        const history = state.playback.visitHistory
        if (history.length <= 1) return
        history.pop()
        state.playback.activeNodeId = history[history.length - 1]
        state.playback.atDecisionPoint = false
      }),

    setPreviewMode: (preview) =>
      set((state) => {
        state.previewMode = preview
        if (!preview) {
          state.playback = { ...initialPlayback }
        }
      }),

    getOutgoingEdges: (nodeId) => {
      const graph = get().getActiveGraph()
      if (!graph) return []
      return graph.edges
        .filter((e) => e.fromNodeId === nodeId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    },

    // ─── Reset ────────────────────────────────────────────────────────

    reset: () =>
      set((state) => {
        state.graphs = {}
        state.activeGraphId = null
        state.playback = { ...initialPlayback }
        state.previewMode = false
      }),
  }))
)
