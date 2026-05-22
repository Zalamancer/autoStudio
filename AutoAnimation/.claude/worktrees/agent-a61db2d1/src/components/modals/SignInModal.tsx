import { useState, useEffect, useCallback } from 'react'
import { LogIn, AlertCircle, Loader2 } from 'lucide-react'
import { useEditorStore } from '@/stores'
import { useAuthStore } from '@/stores/useAuthStore'
import { ModalShell } from './ModalShell'

export function SignInModal() {
  const open = useEditorStore((s) => s.signInModalOpen)
  const close = useEditorStore((s) => s.setSignInModalOpen)
  const onClose = useCallback(() => close(false), [close])
  const user = useAuthStore((s) => s.user)

  // Auto-close when user signs in
  useEffect(() => {
    if (user && open) close(false)
  }, [user, open, close])

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Sign In"
      icon={LogIn}
      iconColor="text-green-400"
      gradientFrom="from-green-900/20"
      size="compact"
    >
      <SignInForm />
    </ModalShell>
  )
}

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const { signIn, signUp, signInWithGoogle, resetPassword, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (resetMode) {
      const ok = await resetPassword(email)
      if (ok) setResetSent(true)
      return
    }
    if (isSignUp) {
      await signUp(email, password)
    } else {
      await signIn(email, password)
    }
  }

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      {error && (
        <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
          <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-red-300">{error}</p>
        </div>
      )}

      {resetSent ? (
        <div className="text-center py-6">
          <p className="text-sm text-zinc-300">Check your email for a password reset link.</p>
          <button
            onClick={() => { setResetMode(false); setResetSent(false); clearError() }}
            className="text-green-400 hover:text-green-300 text-xs mt-3"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500/50"
            />
            {!resetMode && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Password"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500/50"
              />
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 rounded-lg text-xs font-medium text-white transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {resetMode ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {!resetMode && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-[10px] text-zinc-500">or</span>
                <div className="flex-1 h-px bg-zinc-700" />
              </div>

              <button
                onClick={() => signInWithGoogle()}
                disabled={isLoading}
                className="w-full py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-xl text-xs text-zinc-300 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setResetMode(false); clearError() }}
              className="text-green-400 hover:text-green-300 text-[10px]"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
            {!isSignUp && !resetMode && (
              <button
                onClick={() => { setResetMode(true); clearError() }}
                className="text-zinc-500 hover:text-zinc-300 text-[10px]"
              >
                Forgot password?
              </button>
            )}
            {resetMode && (
              <button
                onClick={() => { setResetMode(false); clearError() }}
                className="text-zinc-500 hover:text-zinc-300 text-[10px]"
              >
                Back to sign in
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
