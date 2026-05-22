/**
 * MobileMenuPage
 *
 * Full-page mobile menu that replaces the TopMenuBar on mobile.
 * Shows File actions, View, Settings, and other navigation as a
 * vertically scrollable list of sections.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  Save,
  Download,
  Film,
  Settings,
  LogIn,
  LogOut,
  Copy,
  LayoutPanelLeft,
  Workflow,
  Store,
  Video,
  LayoutDashboard,
  Wrench,
  CreditCard,
  Bell,
  ChevronRight,
} from 'lucide-react'
import { useEditorStore } from '@/stores'
import { useAuthStore } from '@/stores/useAuthStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useNodeCanvasStore } from '@/stores/useNodeCanvasStore'
import { TemplateCreationWizard } from '@/components/templates/TemplateCreationWizard'

interface MenuItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  description?: string
  onClick: () => void
  accent?: boolean
  danger?: boolean
}

function MenuItem({ icon: Icon, label, description, onClick, accent, danger }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/[0.06] active:bg-white/[0.1] group"
    >
      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
        accent
          ? 'bg-green-500/10 text-green-400'
          : danger
            ? 'bg-red-500/10 text-red-400'
            : 'bg-white/[0.06] text-zinc-400 group-hover:text-zinc-200 group-hover:bg-white/[0.08]'
      }`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] font-medium transition-colors ${
          accent ? 'text-green-400' : danger ? 'text-red-400' : 'text-zinc-200 group-hover:text-white'
        }`}>
          {label}
        </div>
        {description && (
          <div className="text-[11px] leading-relaxed text-zinc-500 mt-0.5">{description}</div>
        )}
      </div>
      <ChevronRight size={15} className="shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
    </button>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500 px-4 pt-4 pb-1.5">
      {title}
    </h3>
  )
}

export function MobileMenuPage() {
  const navigate = useNavigate()
  const [showTemplateWizard, setShowTemplateWizard] = useState(false)

  const {
    setLibraryModalOpen,
    setProjectsModalOpen,
    setSettingsModalOpen,
    setExportModalOpen,
    setRecordingsModalOpen,
    setSignInModalOpen,
    setTemplateDevModeOpen,
  } = useEditorStore()

  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const { saveNow, isSaving } = useAutoSave(5000)
  const currentProjectName = useProjectStore((s) => s.currentProjectName)

  const viewMode = useNodeCanvasStore((s) => s.viewMode)
  const setViewMode = useNodeCanvasStore((s) => s.setViewMode)

  const ADMIN_EMAILS = ['tryproanimate@gmail.com', 'duruihsan@gmail.com']
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email)

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <h2 className="text-base font-semibold text-white">Menu</h2>
        {currentProjectName && (
          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{currentProjectName}</p>
        )}
      </div>

      {/* Scrollable menu items */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* File section */}
        <SectionHeader title="File" />
        <MenuItem icon={FolderOpen} label="Projects" description="Open or create a project" onClick={() => setProjectsModalOpen(true)} />
        <MenuItem icon={Save} label={isSaving ? 'Saving...' : 'Save'} description="Save current project" onClick={() => saveNow()} />
        <MenuItem icon={Download} label="Export" description="Export video or assets" onClick={() => setExportModalOpen(true)} />
        <MenuItem icon={Copy} label="Save as Template" description="Reusable project template" onClick={() => setShowTemplateWizard(true)} />
        <MenuItem icon={Film} label="Render" description="Render final video" onClick={() => setExportModalOpen(true)} accent />

        {/* View section */}
        <SectionHeader title="View" />
        <MenuItem
          icon={LayoutPanelLeft}
          label={`Classic${viewMode === 'classic' ? '  ✓' : ''}`}
          description="Traditional editor layout"
          onClick={() => setViewMode('classic')}
        />
        <MenuItem
          icon={Workflow}
          label={`Node View${viewMode === 'nodes' ? '  ✓' : ''}`}
          description="Node-based canvas editor"
          onClick={() => setViewMode('nodes')}
        />

        {/* Navigate section */}
        <SectionHeader title="Navigate" />
        <MenuItem icon={Settings} label="Settings" description="App settings" onClick={() => setSettingsModalOpen(true)} />
        <MenuItem icon={Store} label="Marketplace" description="Templates & assets" onClick={() => setLibraryModalOpen(true)} />
        <MenuItem icon={Video} label="Recordings" description="Saved recordings" onClick={() => setRecordingsModalOpen(true)} />
        <MenuItem icon={LayoutDashboard} label="Dashboard" description="Clip dashboard" onClick={() => navigate('/dashboard')} />
        {isAdmin && (
          <MenuItem icon={Wrench} label="Dev Mode" description="Template developer tools" onClick={() => setTemplateDevModeOpen(true)} />
        )}

        {/* Account section */}
        <SectionHeader title="Account" />
        {!user ? (
          <MenuItem icon={LogIn} label="Sign In" description="Sign in or create account" onClick={() => setSignInModalOpen(true)} />
        ) : (
          <>
            <div className="px-4 py-2">
              <p className="text-[11px] text-zinc-500">{user.email}</p>
            </div>
            <MenuItem icon={CreditCard} label="Credits & Billing" description="Manage subscription" onClick={() => navigate('/billing')} />
            <MenuItem icon={Bell} label="Notifications" description="View notifications" onClick={() => {}} />
            <MenuItem icon={LogOut} label="Sign Out" onClick={() => signOut()} danger />
          </>
        )}
      </div>

      {showTemplateWizard && (
        <TemplateCreationWizard onClose={() => setShowTemplateWizard(false)} />
      )}
    </div>
  )
}
