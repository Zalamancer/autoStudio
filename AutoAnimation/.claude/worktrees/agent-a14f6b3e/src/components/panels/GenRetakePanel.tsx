import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { useEditorStore } from '@/stores'

export function GenRetakePanel() {
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  useEffect(() => {
    setRightPanelTab('gen-retake-properties')
  }, [setRightPanelTab])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="flex flex-col items-center justify-center h-full text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#4a7eff]/10 flex items-center justify-center">
            <RotateCcw size={22} className="text-[#4a7eff]" />
          </div>
          <h3 className="text-sm font-medium text-zinc-200">Retake Video</h3>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px]">
            Regenerate a video with adjustments. Configure options in the right panel.
          </p>
        </div>
      </div>
    </div>
  )
}
