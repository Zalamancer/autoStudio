/**
 * Branching / Interactive Video types.
 * Defines a DAG (directed acyclic graph) narrative model where each node
 * represents a timeline segment and edges represent viewer choices.
 */

export interface BranchNode {
  id: string
  /** Display label in the node-graph editor */
  label: string
  /** Timeline segment this node controls */
  timelineSegment: {
    startFrame: number
    endFrame: number
  }
  /** Position in the node-graph editor (for visual layout) */
  position: { x: number; y: number }
  /** Optional color tag for visual grouping */
  color?: string
}

export interface BranchEdge {
  id: string
  /** Source node ID */
  fromNodeId: string
  /** Target node ID */
  targetNodeId: string
  /** Choice label shown to the viewer at decision points */
  choiceLabel: string
  /** Optional condition expression (e.g. variable-based branching) */
  condition?: string
  /** Display order when multiple choices are shown (lower = first) */
  sortOrder: number
}

export interface BranchGraph {
  id: string
  name: string
  nodes: BranchNode[]
  edges: BranchEdge[]
  /** The node where playback begins */
  entryNodeId: string
}

/** Runtime playback state for branching video */
export interface BranchPlaybackState {
  /** Currently active node during playback */
  activeNodeId: string | null
  /** Whether we are at a decision point (end of node segment) */
  atDecisionPoint: boolean
  /** History of visited nodes (for back navigation) */
  visitHistory: string[]
}
