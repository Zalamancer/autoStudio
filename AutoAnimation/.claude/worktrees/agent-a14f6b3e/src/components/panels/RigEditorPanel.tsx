import { Bone } from 'lucide-react'

/**
 * RigEditorPanel — left panel content shown when the rig-editor tab is active.
 * The actual rig editor iframe is rendered in EditorLayout (replacing the canvas).
 * This panel provides context info and controls.
 */
export function RigEditorPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-fuchsia-400">
        <Bone size={20} />
        <h2 className="text-sm font-semibold">Rig Editor</h2>
      </div>
      <p className="text-xs text-zinc-400">
        Rig editor is active on the canvas. Use the canvas overlay to edit bones and mesh.
      </p>
    </div>
  )
}
