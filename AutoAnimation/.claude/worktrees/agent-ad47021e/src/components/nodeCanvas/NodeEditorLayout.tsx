import { useNodeCanvasStore } from '@/stores/useNodeCanvasStore'
import { LeftPanel } from '@/components/layout/LeftPanel'
import { RightPanel } from '@/components/layout/RightPanel'
import { Timeline } from '@/components/timeline'
import { NodeCanvas } from './NodeCanvas'

export function NodeEditorLayout() {
  const focusedNodeId = useNodeCanvasStore((s) => s.focusedNodeId)

  return (
    <div className="flex-1 flex overflow-hidden gap-1.5">
      {focusedNodeId && <LeftPanel nodesMode />}

      <div className="flex-1 flex flex-col overflow-hidden gap-1.5">
        <NodeCanvas />
        <Timeline />
      </div>

      {focusedNodeId && <RightPanel />}
    </div>
  )
}
