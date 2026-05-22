import { Link } from 'react-router-dom'
import { Clapperboard, PenTool, LogIn, LogOut, Building2 } from 'lucide-react'
import { Logo } from '@/components/landing/icons/Logo'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useEditorStore } from '@/stores'
import { CreditBadge } from '@/components/credits/CreditBadge'

export function DashboardHeader() {
  const clipCount = useDashboardStore((s) => s.clips.length)
  const executingClipId = useDashboardStore((s) => s.executingClipId)
  const queueLength = useDashboardStore((s) => s.executionQueue.length)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const setSignInModalOpen = useEditorStore((s) => s.setSignInModalOpen)

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b border-panel-surface bg-[#141414]">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <Logo size={24} />
          <h1 className="text-base sm:text-lg font-semibold text-white whitespace-nowrap">AI Clip Studio</h1>
        </div>
        {clipCount > 0 && (
          <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-panel-surface text-gray-400">
            {clipCount} clip{clipCount !== 1 ? 's' : ''}
          </span>
        )}
        {executingClipId && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
            <Clapperboard size={12} className="animate-pulse" />
            <span className="hidden sm:inline">Executing{queueLength > 0 ? ` (+${queueLength} queued)` : ''}</span>
          </span>
        )}
      </div>

      {/* Right: Auth + Credits + Nav */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {!user ? (
          <button
            onClick={() => setSignInModalOpen(true)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-panel-surface transition-colors"
          >
            <LogIn size={16} />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-gray-500 truncate max-w-[140px]">{user.email}</span>
            <button
              onClick={async () => {
                try {
                  await signOut()
                } catch (err) {
                  console.error('[DashboardHeader] Sign out failed:', err)
                }
              }}
              className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-panel-surface transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
        <CreditBadge />
        <Link
          to="/brand"
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-panel-surface transition-colors"
          title="Brand Intel"
        >
          <Building2 size={16} />
          <span className="hidden sm:inline">Brand Intel</span>
        </Link>
        <Link
          to="/editor"
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
          title="Open Editor"
        >
          <PenTool size={16} />
          <span className="hidden sm:inline">Open Editor</span>
        </Link>
      </div>
    </header>
  )
}
