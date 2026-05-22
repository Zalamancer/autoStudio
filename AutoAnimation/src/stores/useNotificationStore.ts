import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { AppNotification } from '@/types/promotions'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllRead,
} from '@/services/notificationService'

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  isDropdownOpen: boolean
  pollingInterval: ReturnType<typeof setInterval> | null

  fetchNotifications: (page?: number) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  setDropdownOpen: (open: boolean) => void
  startPolling: () => void
  stopPolling: () => void
}

export const useNotificationStore = create<NotificationState>()(
  immer((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    isDropdownOpen: false,
    pollingInterval: null,

    fetchNotifications: async (page = 1) => {
      set((s) => { s.isLoading = true })
      try {
        const { notifications } = await fetchNotifications({ page, limit: 20 })
        set((s) => {
          s.notifications = notifications
          s.isLoading = false
        })
      } catch (err) {
        console.warn('[Notifications] Fetch failed:', err)
        set((s) => { s.isLoading = false })
      }
    },

    fetchUnreadCount: async () => {
      try {
        const count = await fetchUnreadCount()
        set((s) => { s.unreadCount = count })
      } catch {
        // Silently fail — polling will retry
      }
    },

    markRead: async (id) => {
      try {
        await markAsRead(id)
        set((s) => {
          const notif = s.notifications.find((n) => n.id === id)
          if (notif && !notif.read) {
            notif.read = true
            s.unreadCount = Math.max(0, s.unreadCount - 1)
          }
        })
      } catch (err) {
        console.error('[Notifications] Mark read failed:', err)
      }
    },

    markAllRead: async () => {
      try {
        await markAllRead()
        set((s) => {
          s.notifications.forEach((n) => { n.read = true })
          s.unreadCount = 0
        })
      } catch (err) {
        console.error('[Notifications] Mark all read failed:', err)
      }
    },

    setDropdownOpen: (open) => {
      set((s) => { s.isDropdownOpen = open })
      if (open) {
        // Fetch fresh notifications when dropdown opens
        get().fetchNotifications()
      }
    },

    startPolling: () => {
      const existing = get().pollingInterval
      if (existing) return // Already polling

      // Fetch immediately
      get().fetchUnreadCount()

      // Poll every 30 seconds
      const interval = setInterval(() => {
        get().fetchUnreadCount()
      }, 30_000)

      set((s) => { s.pollingInterval = interval as any })
    },

    stopPolling: () => {
      const interval = get().pollingInterval
      if (interval) {
        clearInterval(interval)
        set((s) => { s.pollingInterval = null })
      }
    },
  }))
)
