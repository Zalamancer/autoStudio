import {
  CheckCheck,
  Bell,
  Coins,
  Briefcase,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotificationStore } from '@/stores/useNotificationStore'
import type { AppNotification, NotificationType } from '@/types/promotions'

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  promo_request_match: { icon: Briefcase, color: 'text-amber-400' },
  submission_received: { icon: Send, color: 'text-blue-400' },
  submission_approved: { icon: CheckCircle2, color: 'text-emerald-400' },
  submission_rejected: { icon: XCircle, color: 'text-red-400' },
  escrow_refunded: { icon: Coins, color: 'text-purple-400' },
  request_completed: { icon: CheckCircle2, color: 'text-blue-400' },
  request_canceled: { icon: XCircle, color: 'text-zinc-400' },
}

export function NotificationDropdown() {
  const { notifications, isLoading, unreadCount, markRead, markAllRead } = useNotificationStore()

  return (
    <div className="absolute top-full right-0 z-50 w-80 mt-1.5 bg-zinc-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="text-xs font-bold text-white uppercase tracking-widest">Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
          >
            <CheckCheck size={12} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[350px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="text-zinc-500 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <Bell size={24} className="text-zinc-600" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">No notifications</span>
          </div>
        ) : (
          <>
            {notifications.map((notif) => (
              <NotificationItem key={notif.id} notification={notif} onRead={() => markRead(notif.id)} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function NotificationItem({ notification, onRead }: { notification: AppNotification; onRead: () => void }) {
  const config = typeConfig[notification.type as NotificationType] || { icon: Bell, color: 'text-zinc-400' }
  const Icon = config.icon

  const timeAgo = getTimeAgo(notification.created_at)

  return (
    <button
      onClick={() => {
        if (!notification.read) onRead()
      }}
      className={cn(
        'w-full text-left flex gap-3 px-4 py-3 transition-colors border-b border-white/[0.03]',
        notification.read
          ? 'bg-transparent hover:bg-white/[0.02]'
          : 'bg-white/[0.03] hover:bg-white/[0.05]'
      )}
    >
      {/* Icon */}
      <div className={cn('mt-0.5 shrink-0', config.color)}>
        <Icon size={14} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={cn(
          'text-[11px] leading-snug',
          notification.read ? 'text-zinc-400' : 'text-zinc-200 font-medium'
        )}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5">{notification.body}</p>
        )}
        <span className="text-[9px] text-zinc-600 mt-1 block">{timeAgo}</span>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="mt-1.5 shrink-0">
          <div className="w-2 h-2 rounded-full bg-purple-400" />
        </div>
      )}
    </button>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - then) / 1000)

  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}
