import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  Save,
  Download,
  Check,
  Loader2,
  AlertCircle,
  Circle,
  Film,
  LogIn,
  LogOut,
  Copy,
  Play,
  Pause,
  X,
  LayoutPanelLeft,
  Workflow,
} from 'lucide-react'
import { useEditorStore } from '@/stores'
import { useAuthStore } from '@/stores/useAuthStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useAutoSave, type AutoSaveStatus } from '@/hooks/useAutoSave'
import { CreditBadge } from '@/components/credits/CreditBadge'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { TemplateCreationWizard } from '@/components/templates/TemplateCreationWizard'
import { useNodeCanvasStore } from '@/stores/useNodeCanvasStore'

// ── Menu item types ─────────────────────────────────────────────────────
interface MenuItem {
  id: string
  label: string
  icon: typeof Save
  shortcut?: string
  onClick: () => void
  danger?: boolean
  separator?: false
}

interface MenuSeparator {
  separator: true
}

type MenuEntry = MenuItem | MenuSeparator

interface DropdownMenu {
  kind: 'dropdown'
  id: string
  label: string
  items: MenuEntry[]
}

interface DirectButton {
  kind: 'direct'
  id: string
  label: string
  onClick: () => void
}

type MenuDef = DropdownMenu | DirectButton

export function TopMenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [hoverMode, setHoverMode] = useState(false)
  const [showTemplateWizard, setShowTemplateWizard] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()
  const { setLibraryModalOpen, setProjectsModalOpen, setSettingsModalOpen, setExportModalOpen, setRecordingsModalOpen, setSignInModalOpen } = useEditorStore()
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const { status, lastSaved, saveNow, isSaving } = useAutoSave(5000)
  const currentProjectId = useProjectStore((s) => s.currentProjectId)
  const currentProjectName = useProjectStore((s) => s.currentProjectName)

  // ── Close on outside click ──
  useEffect(() => {
    if (!openMenu) return
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
        setHoverMode(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenu])

  // ── Close on Escape ──
  useEffect(() => {
    if (!openMenu) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null)
        setHoverMode(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [openMenu])

  const handleMenuClick = useCallback((menuId: string) => {
    setOpenMenu((prev) => {
      if (prev === menuId) {
        setHoverMode(false)
        return null
      }
      setHoverMode(true)
      return menuId
    })
  }, [])

  const handleMenuHover = useCallback(
    (menuId: string) => {
      if (hoverMode && openMenu) {
        setOpenMenu(menuId)
      }
    },
    [hoverMode, openMenu]
  )

  const handleItemClick = useCallback((item: MenuItem) => {
    item.onClick()
    setOpenMenu(null)
    setHoverMode(false)
  }, [])

  const handleDirectClick = useCallback((def: DirectButton) => {
    setOpenMenu(null)
    setHoverMode(false)
    def.onClick()
  }, [])

  // ── Admin check ──────────────────────────────────────────────────────
  const ADMIN_EMAILS = ['tryproanimate@gmail.com', 'duruihsan@gmail.com']
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email)
  const setTemplateDevModeOpen = useEditorStore((s) => s.setTemplateDevModeOpen)
  const viewMode = useNodeCanvasStore((s) => s.viewMode)
  const setViewMode = useNodeCanvasStore((s) => s.setViewMode)

  // ── Menu definitions ──────────────────────────────────────────────────
  const menus: MenuDef[] = [
    {
      kind: 'dropdown',
      id: 'file',
      label: 'File',
      items: [
        {
          id: 'projects',
          label: 'Projects',
          icon: FolderOpen,
          shortcut: '',
          onClick: () => setProjectsModalOpen(true),
        },
        { separator: true },
        {
          id: 'save',
          label: isSaving ? 'Saving...' : 'Save',
          icon: Save,
          shortcut: '⌘S',
          onClick: () => saveNow(),
        },
        {
          id: 'export',
          label: 'Export',
          icon: Download,
          shortcut: '',
          onClick: () => setExportModalOpen(true),
        },
        { separator: true },
        {
          id: 'save-as-template',
          label: 'Save as Template',
          icon: Copy,
          shortcut: '',
          onClick: () => {
            setOpenMenu(null)
            setShowTemplateWizard(true)
          },
        },
      ],
    },
    {
      kind: 'dropdown',
      id: 'view',
      label: 'View',
      items: [
        {
          id: 'view-classic',
          label: viewMode === 'classic' ? 'Classic  ✓' : 'Classic',
          icon: LayoutPanelLeft,
          onClick: () => setViewMode('classic'),
        },
        {
          id: 'view-nodes',
          label: viewMode === 'nodes' ? 'Node View  ✓' : 'Node View',
          icon: Workflow,
          onClick: () => setViewMode('nodes'),
        },
      ],
    },
    {
      kind: 'direct',
      id: 'settings',
      label: 'Settings',
      onClick: () => setSettingsModalOpen(true),
    },
    {
      kind: 'direct',
      id: 'marketplace',
      label: 'Marketplace',
      onClick: () => setLibraryModalOpen(true),
    },
    {
      kind: 'direct',
      id: 'recordings',
      label: 'Recordings',
      onClick: () => setRecordingsModalOpen(true),
    },
    {
      kind: 'direct',
      id: 'dashboard',
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    ...(isAdmin
      ? [
          {
            kind: 'direct' as const,
            id: 'dev-mode',
            label: 'Dev Mode',
            onClick: () => setTemplateDevModeOpen(true),
          },
        ]
      : []),
  ]

  return (
    <div
      ref={barRef}
      className="relative z-50 flex items-center h-8 bg-zinc-900/60 backdrop-blur-xl border border-white/[0.06] rounded-xl shrink-0 select-none shadow-sm"
    >
      {/* Menu buttons */}
      <div className="flex items-center">
        {menus.map((menu) => {
          const hideOnMobile = menu.id === 'marketplace' || menu.id === 'recordings' || menu.id === 'dashboard' || menu.id === 'dev-mode'
          return menu.kind === 'dropdown' ? (
            <DropdownMenuButton
              key={menu.id}
              menu={menu}
              isOpen={openMenu === menu.id}
              onClick={() => handleMenuClick(menu.id)}
              onHover={() => handleMenuHover(menu.id)}
              onItemClick={handleItemClick}
            />
          ) : (
            <div key={menu.id} className={hideOnMobile ? 'hidden md:block' : ''}>
              <DirectMenuButton
                menu={menu}
                onClick={() => handleDirectClick(menu)}
                onHover={() => handleMenuHover(menu.id)}
              />
            </div>
          )
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: Auth + Credits + Preview + Render button + project name + save status */}
      <div className="flex items-center gap-3 pr-3">
        <PreviewButton />
        {!user ? (
          <button
            onClick={() => setSignInModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
          >
            <LogIn size={13} />
            Sign In
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">{user.email}</span>
            <button
              onClick={() => signOut()}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
              title="Sign out"
            >
              <LogOut size={12} />
            </button>
          </div>
        )}
        <div className="hidden md:block">
          <NotificationBell />
        </div>
        <div className="hidden md:block">
          <CreditBadge />
        </div>
        {currentProjectId && currentProjectName && (
          <span className="text-xs text-zinc-500 truncate max-w-[180px]">
            {currentProjectName}
          </span>
        )}
        {currentProjectId && (
          <SaveStatus status={status} lastSaved={lastSaved} />
        )}
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-green-500 hover:bg-green-400 text-white transition-colors"
        >
          <Film size={12} />
          Render
        </button>
      </div>

      {/* Save as Template wizard */}
      {showTemplateWizard && (
        <TemplateCreationWizard
          onClose={() => setShowTemplateWizard(false)}
        />
      )}
    </div>
  )
}

// ── Dropdown menu button ────────────────────────────────────────────────
function DropdownMenuButton({
  menu,
  isOpen,
  onClick,
  onHover,
  onItemClick,
}: {
  menu: DropdownMenu
  isOpen: boolean
  onClick: () => void
  onHover: () => void
  onItemClick: (item: MenuItem) => void
}) {
  return (
    <div className="relative" onMouseEnter={onHover}>
      <button
        onClick={onClick}
        className={`px-3 h-8 text-xs font-medium transition-all duration-200 rounded-md mx-0.5 mt-0.5 h-7 flex items-center ${isOpen
          ? 'bg-zinc-800/80 text-zinc-50 shadow-sm'
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
          }`}
      >
        {menu.label}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 min-w-[200px] py-1.5 bg-zinc-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-glass mt-1">
          {menu.items.map((entry, i) => {
            if (entry.separator) {
              return (
                <div
                  key={`sep-${i}`}
                  className="my-1 border-t border-zinc-700/50"
                />
              )
            }
            const item = entry as MenuItem
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                className={`flex items-center gap-3 px-3 py-2 text-xs transition-colors rounded-md mx-1.5 w-[calc(100%-12px)] ${item.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-zinc-300 hover:bg-zinc-700/60 hover:text-zinc-50'
                  }`}
              >
                <Icon size={14} className="shrink-0 text-zinc-500" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-zinc-600 ml-4">
                    {item.shortcut}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Direct action button (no dropdown) ──────────────────────────────────
function DirectMenuButton({
  menu,
  onClick,
  onHover,
}: {
  menu: DirectButton
  onClick: () => void
  onHover: () => void
}) {
  return (
    <div onMouseEnter={onHover}>
      <button
        onClick={onClick}
        className="px-3 h-8 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200 rounded-md mx-0.5 mt-0.5 h-7 flex items-center"
      >
        {menu.label}
      </button>
    </div>
  )
}

// ── Compact save status ─────────────────────────────────────────────────
function SaveStatus({
  status,
  lastSaved,
}: {
  status: AutoSaveStatus
  lastSaved: Date | null
}) {
  const icon = (() => {
    switch (status) {
      case 'saving':
        return <Loader2 size={11} className="animate-spin text-blue-400" />
      case 'saved':
        return <Check size={11} className="text-green-400" />
      case 'dirty':
        return (
          <Circle size={7} className="text-yellow-400 fill-yellow-400" />
        )
      case 'error':
        return <AlertCircle size={11} className="text-red-400" />
      default:
        return null
    }
  })()

  const label = (() => {
    if (status === 'saving') return 'Saving...'
    if (status === 'saved' && lastSaved) {
      const diffMs = Date.now() - lastSaved.getTime()
      const diffSec = Math.floor(diffMs / 1000)
      if (diffSec < 10) return 'Saved'
      if (diffSec < 60) return `${diffSec}s ago`
      const diffMin = Math.floor(diffSec / 60)
      if (diffMin < 60) return `${diffMin}m ago`
      return `${Math.floor(diffMin / 60)}h ago`
    }
    if (status === 'dirty') return 'Unsaved'
    if (status === 'error') return 'Error'
    return ''
  })()

  if (!label) return null

  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span
        className={`text-[10px] ${status === 'error'
          ? 'text-red-400'
          : status === 'dirty'
            ? 'text-yellow-400'
            : status === 'saving'
              ? 'text-blue-400'
              : 'text-zinc-500'
          }`}
      >
        {label}
      </span>
    </div>
  )
}

// ── Fullscreen preview (nodes mode only) ─────────────────────────────────
function PreviewButton() {
  const viewMode = useNodeCanvasStore((s) => s.viewMode)
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const togglePlayback = usePlaybackStore((s) => s.togglePlayback)
  const [open, setOpen] = useState(false)
  const aspectRatio = useEditorStore((s) => s.aspectRatio)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  if (viewMode !== 'nodes') return null

  const [aw, ah] = aspectRatio.split(':').map(Number)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
        title="Preview"
      >
        <Play size={12} />
        Preview
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
          onClick={() => setOpen(false)}
        >
          {/* Fullscreen canvas area — fits viewport while preserving aspect ratio */}
          <div
            className="relative overflow-hidden"
            style={{
              width: `${(aw / ah) * 100}vh`,
              height: `${(ah / aw) * 100}vw`,
              maxWidth: '100vw',
              maxHeight: '100vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <LazyVideoCanvas />
          </div>

          {/* Floating controls */}
          <div className="fixed top-4 right-4 flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); togglePlayback() }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 backdrop-blur-sm border border-white/10 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg bg-zinc-900/80 backdrop-blur-sm border border-white/10 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Lazy-load VideoCanvas only when popup opens to avoid circular import issues
import { lazy, Suspense } from 'react'
const VideoCanvasLazy = lazy(() => import('@/components/canvas/VideoCanvas').then(m => ({ default: m.VideoCanvas })))
function LazyVideoCanvas() {
  return (
    <Suspense fallback={<div className="w-full h-full bg-zinc-950" />}>
      <VideoCanvasLazy />
    </Suspense>
  )
}
