import { supabase, isSupabaseConfigured } from './supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export { isSupabaseConfigured }

export interface AuthResult {
  user: User | null
  session: Session | null
  error: AuthError | null
}

function getClient() {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await getClient().auth.signUp({ email, password })
  return { user: data.user, session: data.session, error }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password })
  return { user: data.user, session: data.session, error }
}

export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  const { error } = await getClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  return { error }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await getClient().auth.signOut()
  return { error }
}

export async function getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data, error } = await getClient().auth.getSession()
  return { session: data.session, error }
}

export async function getUser(): Promise<{ user: User | null; error: AuthError | null }> {
  const { data, error } = await getClient().auth.getUser()
  return { user: data.user, error }
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return getClient().auth.onAuthStateChange(callback)
}

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  const { error } = await getClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { error }
}
