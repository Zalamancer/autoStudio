import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/services/supabase'
import { Loader2, CheckCircle } from 'lucide-react'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase auto-detects the recovery token from the URL hash and establishes a session
  useEffect(() => {
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // Also check if session already exists (page might have loaded fast)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!supabase) {
      setError('Authentication not configured')
      return
    }

    setIsLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        setTimeout(() => navigate('/dashboard'), 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">AutoAnimation</h1>
          <p className="text-sm text-zinc-400 mt-1">Set your new password</p>
        </div>

        <div className="bg-zinc-800 rounded-xl border border-zinc-700/50 p-6 space-y-5">
          {success ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle size={40} className="text-green-400 mx-auto" />
              <p className="text-zinc-200 font-medium">Password updated successfully</p>
              <p className="text-sm text-zinc-400">Redirecting to dashboard...</p>
            </div>
          ) : !sessionReady ? (
            <div className="text-center space-y-3 py-4">
              <Loader2 size={24} className="animate-spin text-zinc-400 mx-auto" />
              <p className="text-sm text-zinc-400">Verifying reset link...</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-medium text-zinc-200 text-center">New Password</h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full mt-1 bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                    placeholder="Min 6 characters"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full mt-1 bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                    placeholder="Repeat password"
                  />
                  {password !== confirmPassword && confirmPassword.length > 0 && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || password !== confirmPassword || password.length < 6}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  Update Password
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
