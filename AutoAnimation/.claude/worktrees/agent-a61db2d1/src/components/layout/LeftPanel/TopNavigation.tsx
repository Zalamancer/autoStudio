import { Folder, Music, Type, Layers, LayoutList, Film } from 'lucide-react'
import { TabNavigation, type Tab } from '@/components/ui'
import { useEditorStore } from '@/stores'
import type { LeftPanelTopTab } from '@/types'

const tabs: Tab[] = [
  { id: 'layers', icon: LayoutList, label: 'Layers' },
  { id: 'media', icon: Folder, label: 'Media' },
  { id: 'videos', icon: Film, label: 'Videos' },
  { id: 'audio', icon: Music, label: 'Audio' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'transitions', icon: Layers, label: 'Transitions' },
]

export function TopNavigation() {
  const { leftPanelActiveTab, setLeftPanelTopTab } = useEditorStore()

  return (
    <div className="border-b border-zinc-700/50 p-2">
      <TabNavigation
        tabs={tabs}
        activeTab={leftPanelActiveTab}
        onTabChange={(id) => setLeftPanelTopTab(id as LeftPanelTopTab)}
        size="sm"
      />
    </div>
  )
}
