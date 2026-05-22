import type { LeftPanelTab, TabGroupId } from './editor'

export type EditorViewMode = 'classic' | 'nodes'

export type CharacterMode = '2d' | '3d' | '1d' | 'avatar'

export interface CanvasNode {
  id: string
  tabId: LeftPanelTab
  groupId: TabGroupId
  position: { x: number; y: number }
  collapsed: boolean
  /** For character nodes — which sub-panel to show */
  characterMode?: CharacterMode
}

export interface CanvasConnection {
  id: string
  fromNodeId: string
  toNodeId: string
}
