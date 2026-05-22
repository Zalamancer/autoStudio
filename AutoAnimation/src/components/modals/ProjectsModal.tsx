import { useCallback } from 'react'
import { FolderOpen } from 'lucide-react'
import { useEditorStore } from '@/stores'
import { ModalShell } from './ModalShell'
import { ProjectsPanel } from '@/components/panels/ProjectsPanel'

export function ProjectsModal() {
  const open = useEditorStore((s) => s.projectsModalOpen)
  const close = useEditorStore((s) => s.setProjectsModalOpen)
  const onClose = useCallback(() => close(false), [close])

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Projects"
      icon={FolderOpen}
      iconColor="text-blue-400"
      gradientFrom="from-blue-900/20"
    >
      <ProjectsPanel />
    </ModalShell>
  )
}
