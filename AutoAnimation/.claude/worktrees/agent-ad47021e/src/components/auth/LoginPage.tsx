import { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { Loader2 } from 'lucide-react'

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { signIn, signUp, signInWithGoogle, resetPassword, isLoading, error, clearError } = useAuthStore()

  const confirmTouched = confirmPassword.length > 0
  const passwordMismatch = isSignUp && confirmTouched && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError(null)

    if (showResetPassword) {
      const success = await resetPassword(email)
      if (success) setResetSent(true)
      return
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setLocalError('Passwords don\'t match')
        return
      }
      await signUp(email, password)
    } else {
      await signIn(email, password)
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">AutoAnimation</h1>
          <p className="text-sm text-zinc-400 mt-1">AI-powered talking character videos</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-800 rounded-xl border border-zinc-700/50 p-6 space-y-5">
          <h2 className="text-lg font-medium text-zinc-200 text-center">
            {showResetPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          {/* Error */}
          {displayError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
              {displayError}
            </div>
          )}

          {/* Reset password success */}
          {resetSent && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-sm text-green-400">
              Password reset email sent. Check your inbox.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1 bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                placeholder="you@example.com"
              />
            </div>

            {!showResetPassword && (
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full mt-1 bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                  placeholder="Min 6 characters"
                />
              </div>
            )}

            {isSignUp && !showResetPassword && (
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wide">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(null) }}
                  required
                  minLength={6}
                  className={`w-full mt-1 bg-zinc-700/50 border rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                    passwordMismatch
                      ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50'
                      : 'border-zinc-600 focus:border-green-500/50 focus:ring-green-500/50'
                  }`}
                  placeholder="Repeat password"
                />
                {passwordMismatch && (
                  <p className="text-xs text-red-400 mt-1">Passwords don&apos;t match</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || passwordMismatch}
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {showResetPassword ? 'Send Reset Email' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Google OAuth */}
          {!showResetPassword && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-xs text-zinc-500">or</span>
                <div className="flex-1 h-px bg-zinc-700" />
              </div>

              <button
                onClick={() => signInWithGoogle()}
                disabled={isLoading}
                className="w-full py-2.5 bg-zinc-700/50 hover:bg-zinc-700 border border-zinc-600 rounded-lg text-sm text-zinc-300 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {/* Toggle sign-in / sign-up / forgot password */}
          <div className="text-center text-sm">
            {showResetPassword ? (
              <button
                onClick={() => { setShowResetPassword(false); setResetSent(false); clearError(); setLocalError(null) }}
                className="text-green-400 hover:text-green-300"
              >
                Back to sign in
              </button>
            ) : (
              <div className="space-y-1">
                <button
                  onClick={() => { setIsSignUp(!isSignUp); clearError(); setLocalError(null) }}
                  className="text-green-400 hover:text-green-300"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
                {!isSignUp && (
                  <div>
                    <button
                      onClick={() => { setShowResetPassword(true); clearError(); setLocalError(null) }}
                      className="text-zinc-500 hover:text-zinc-400 text-xs"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
