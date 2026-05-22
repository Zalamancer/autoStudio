export interface LayerGroup {
  id: string              // 'group-{timestamp}'
  name: string
  parentId: string | null // null = root level
  collapsed: boolean
  visible: boolean        // batch visibility toggle
  locked: boolean         // batch lock
  order: number           // sort order within parent (fractional for insert-between)
}

export type LayerTreeViewMode = 'categories' | 'custom'

export interface LayerTreeSaveData {
  groups: LayerGroup[]
  assignments: Record<string, string | null>  // layerId → groupId
  layerOrder: Record<string, number>          // layerId → sort order
}
