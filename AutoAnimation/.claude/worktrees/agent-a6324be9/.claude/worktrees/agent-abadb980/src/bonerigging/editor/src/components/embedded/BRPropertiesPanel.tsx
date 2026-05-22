import { useToolContext } from '../../contexts/ToolContext'
import { useEngineContext } from '../../contexts/EngineContext'
import { WeightPanel } from '../panels/WeightPanel'
import { WeightPaintPanel } from '../panels/WeightPaintPanel'
import { PosePanel } from '../panels/PosePanel'

export interface BRPropertiesPanelProps {
  boneCategory?: string
}

/**
 * BRPropertiesPanel — right panel content for embedded use in AutoStudio.
 * Contains WeightPanel + WeightPaintPanel + PosePanel stacked vertically.
 */
export function BRPropertiesPanel({ boneCategory = 'all' }: BRPropertiesPanelProps) {
  const engine = useEngineContext()
  const { state: toolState } = useToolContext()

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Weight Panel (bone influence sliders) — visible in edit mode when joint selected */}
      <WeightPanel onRadiusChange={engine.handleRadiusChange} boneCategory={boneCategory} />

      {/* Weight Paint Panel — visible when weight paint mode active */}
      <WeightPaintPanel
        visible={toolState.weightPaintMode}
        onReset={engine.handleWeightPaintReset}
        onDone={engine.handleWeightPaintDone}
      />

      {/* Pose Panel — visible when poses toggled */}
      <PosePanel
        visible={engine.showPoses}
        poses={engine.poses}
        onSavePose={engine.handleSavePose}
        onApplyPose={engine.handleApplyPose}
        onDeletePose={engine.handleDeletePose}
        onExportPoses={engine.handleExportPoses}
        onImportPoses={engine.handleImportPoses}
      />
    </div>
  )
}
