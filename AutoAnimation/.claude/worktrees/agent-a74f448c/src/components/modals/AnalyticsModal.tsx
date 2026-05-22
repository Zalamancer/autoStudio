import { useCallback } from 'react'
import { BarChart3 } from 'lucide-react'
import { useEditorStore } from '@/stores'
import { ModalShell } from './ModalShell'
import { AnalyticsPanel } from '@/components/panels/AnalyticsPanel'

export function AnalyticsModal() {
  const open = useEditorStore((s) => s.analyticsModalOpen)
  const close = useEditorStore((s) => s.setAnalyticsModalOpen)
  const onClose = useCallback(() => close(false), [close])

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Analytics"
      icon={BarChart3}
      iconColor="text-amber-400"
      gradientFrom="from-amber-900/20"
      size="compact"
    >
      <AnalyticsPanel />
    </ModalShell>
  )
}
