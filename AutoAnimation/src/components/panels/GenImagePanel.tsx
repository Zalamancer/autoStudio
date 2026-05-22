import { useEffect } from 'react'
import { ImagePlus } from 'lucide-react'
import { useEditorStore } from '@/stores'

export function GenImagePanel() {
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  useEffect(() => {
    setRightPanelTab('gen-image-properties')
  }, [setRightPanelTab])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="flex flex-col items-center justify-center h-full text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <ImagePlus size={22} className="text-accent" />
          </div>
          <h3 className="text-sm font-medium text-zinc-200">Image Generation</h3>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px]">
            Generate images from text prompts. Configure options in the right panel.
          </p>
        </div>
      </div>
    </div>
  )
}
