import { useCallback } from 'react'
import { Download } from 'lucide-react'
import { useEditorStore } from '@/stores'
import { ModalShell } from './ModalShell'
import { ExportPanel } from '@/components/panels/ExportPanel'

export function ExportModal() {
  const open = useEditorStore((s) => s.exportModalOpen)
  const close = useEditorStore((s) => s.setExportModalOpen)
  const onClose = useCallback(() => close(false), [close])

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Export"
      icon={Download}
      iconColor="text-green-400"
      gradientFrom="from-green-900/20"
    >
      <ExportPanel />
    </ModalShell>
  )
}
