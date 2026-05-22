import { create } from 'zustand'
import type { User, Session, Subscription } from '@supabase/supabase-js'
import * as auth from '@/services/auth'

const ALLOWED_EMAILS = ['duruihsan@gmail.com', 'tryproanimate@gmail.com']

let _authSubscription: Subscription | null = null

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<boolean>
  signIn: (email: string, password: string) => Promise<boolean>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()((set, _get) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    set({ isLoading: true })
    try {
      const { session } = await auth.getSession()
      if (session) {
        const { user } = await auth.getUser()
        const email = user?.email?.toLowerCase() ?? ''
        if (!ALLOWED_EMAILS.includes(email)) {
          await auth.signOut()
          set({
            user: null,
            session: null,
            isLoading: false,
            error: 'Access denied. Only authorized accounts can sign in.',
          })
          return
        }
        set({ user, session, isLoading: false })
      } else {
        set({ isLoading: false })
      }

      // Unsubscribe previous listener to prevent accumulating subscriptions
      if (_authSubscription) {
        _authSubscription.unsubscribe()
        _authSubscription = null
      }

      // Subscribe to auth changes
      const { data } = auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const email = session.user.email?.toLowerCase() ?? ''
          if (!ALLOWED_EMAILS.includes(email)) {
            await auth.signOut()
            set({ user: null, session: null, error: 'Access denied. Only authorized accounts can sign in.' })
            return
          }
        }
        set({
          session,
          user: session?.user ?? null,
        })
      })
      _authSubscription = data.subscription
    } catch {
      // Supabase not configured — skip auth
      set({ isLoading: false })
    }
  },

  signUp: async (email, password) => {
    set({ isLoading: true, error: null })
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      set({ error: 'Sign up is currently disabled.', isLoading: false })
      return false
    }
    try {
      const result = await auth.signUp(email, password)
      if (result.error) {
        set({ error: result.error.message, isLoading: false })
        return false
      }
      set({
        user: result.user,
        session: result.session,
        isLoading: false,
      })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      set({ error: message, isLoading: false })
      return false
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null })
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      set({ error: 'Access denied. Only authorized accounts can sign in.', isLoading: false })
      return false
    }
    try {
      const result = await auth.signIn(email, password)
      if (result.error) {
        set({ error: result.error.message, isLoading: false })
        return false
      }
      set({
        user: result.user,
        session: result.session,
        isLoading: false,
      })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      set({ error: message, isLoading: false })
      return false
    }
  },

  signInWithGoogle: async () => {
    set({ error: null })
    const { error } = await auth.signInWithGoogle()
    if (error) {
      set({ error: error.message })
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    await auth.signOut()
    set({ user: null, session: null, isLoading: false })
  },

  resetPassword: async (email) => {
    set({ error: null })
    const { error } = await auth.resetPassword(email)
    if (error) {
      set({ error: error.message })
      return false
    }
    return true
  },

  clearError: () => set({ error: null }),
}))
