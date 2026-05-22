import { useCallback } from 'react'
import { Settings } from 'lucide-react'
import { useEditorStore } from '@/stores'
import { ModalShell } from './ModalShell'
import { SettingsPanel } from '@/components/panels/SettingsPanel'

export function SettingsModal() {
  const open = useEditorStore((s) => s.settingsModalOpen)
  const close = useEditorStore((s) => s.setSettingsModalOpen)
  const onClose = useCallback(() => close(false), [close])

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Settings"
      icon={Settings}
      iconColor="text-amber-400"
      gradientFrom="from-amber-900/20"
    >
      <SettingsPanel />
    </ModalShell>
  )
}
