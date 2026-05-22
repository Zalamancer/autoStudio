import { User, Users, MessageSquare, Code, ShoppingBag, Box } from 'lucide-react'
import { TabNavigation, type Tab } from '@/components/ui'
import { useEditorStore } from '@/stores'
import type { LeftPanelBottomTab } from '@/types'

const tabs: Tab[] = [
  { id: 'character', icon: User, label: 'Character' },
  { id: '3d-objects', icon: Box, label: '3D Objects' },
  { id: 'templates', icon: Users, label: 'Dialogue' },
  { id: 'captions', icon: MessageSquare, label: 'Captions' },
  { id: 'scripts', icon: Code, label: 'Scripts' },
  { id: 'marketplace', icon: ShoppingBag, label: 'Library' },
]

export function BottomNavigation() {
  const { leftPanelActiveTab, setLeftPanelBottomTab } = useEditorStore()

  return (
    <div className="border-t border-zinc-700/50 p-2">
      <TabNavigation
        tabs={tabs}
        activeTab={leftPanelActiveTab}
        onTabChange={(id) => setLeftPanelBottomTab(id as LeftPanelBottomTab)}
        size="sm"
      />
    </div>
  )
}
