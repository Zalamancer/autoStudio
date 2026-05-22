import { useCallback } from 'react'
import { Share2 } from 'lucide-react'
import { useEditorStore } from '@/stores'
import { ModalShell } from './ModalShell'
import { SharePanel } from '@/components/panels/SharePanel'

export function ShareModal() {
  const open = useEditorStore((s) => s.shareModalOpen)
  const close = useEditorStore((s) => s.setShareModalOpen)
  const onClose = useCallback(() => close(false), [close])

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Share"
      icon={Share2}
      iconColor="text-blue-400"
      gradientFrom="from-blue-900/20"
      size="compact"
    >
      <SharePanel />
    </ModalShell>
  )
}
