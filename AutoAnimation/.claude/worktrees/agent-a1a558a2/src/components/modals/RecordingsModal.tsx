import { useCallback } from 'react'
import { Film } from 'lucide-react'
import { useEditorStore } from '@/stores'
import { ModalShell } from './ModalShell'
import { RecordingsPanel } from '@/components/panels/RecordingsPanel'

export function RecordingsModal() {
  const open = useEditorStore((s) => s.recordingsModalOpen)
  const close = useEditorStore((s) => s.setRecordingsModalOpen)
  const onClose = useCallback(() => close(false), [close])

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Recordings"
      icon={Film}
      iconColor="text-purple-400"
      gradientFrom="from-purple-900/20"
    >
      <RecordingsPanel />
    </ModalShell>
  )
}
