/**
 * AIDirectorURLPanel — Right panel content for URL-to-Video extraction.
 * Header is provided by AIDirectorToolSectionHeader.
 */

import { useCallback } from 'react'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { useEditorStore } from '@/stores'
import { URLInputSection } from '@/components/panels/orchestrator/URLInputSection'

export function AIDirectorURLPanel() {
  const setPrompt = useOrchestratorStore((s) => s.setPrompt)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  const handleExtracted = useCallback(
    (content: { suggestedPrompt?: string }) => {
      if (content.suggestedPrompt) setPrompt(content.suggestedPrompt)
    },
    [setPrompt],
  )

  const handleUsePrompt = useCallback(
    (suggestedPrompt: string) => {
      setPrompt(suggestedPrompt)
      setRightPanelTab('ai-director-settings')
    },
    [setPrompt, setRightPanelTab],
  )

  return (
    <div className="p-3">
      <URLInputSection onExtracted={handleExtracted} onUsePrompt={handleUsePrompt} />
    </div>
  )
}
