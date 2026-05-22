import { useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { NotificationDropdown } from './NotificationDropdown'

export function NotificationBell() {
  const user = useAuthStore((s) => s.user)
  const { unreadCount, isDropdownOpen, setDropdownOpen, startPolling, stopPolling } = useNotificationStore()
  const bellRef = useRef<HTMLDivElement>(null)

  // Start polling when user is logged in
  useEffect(() => {
    if (user) {
      startPolling()
    } else {
      stopPolling()
    }
    return () => stopPolling()
  }, [user, startPolling, stopPolling])

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isDropdownOpen, setDropdownOpen])

  if (!user) return null

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => setDropdownOpen(!isDropdownOpen)}
        className="relative p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
        title="Notifications"
      >
        <Bell size={14} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center px-0.5 rounded-full bg-red-500 text-[8px] font-black text-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && <NotificationDropdown />}
    </div>
  )
}
