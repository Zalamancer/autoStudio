/**
 * ApiKeyManagement -- React component for API key CRUD in the settings panel.
 * Shows key list, create dialog, usage stats.
 */

import { useState, useEffect, useCallback } from 'react'
import { Key, Plus, Trash2, Copy, CheckCircle2, Loader2, BarChart3 } from 'lucide-react'
import { useApiKeyStore } from '@/stores/useApiKeyStore'
import { useConfirmDialog } from '@/stores/useConfirmDialogStore'

export function ApiKeyManagement() {
  const {
    keys,
    usage,
    isLoading,
    error,
    newlyCreatedKey,
    fetchKeys,
    fetchUsage,
    createKey,
    revokeKey,
    clearNewKey,
    clearError,
  } = useApiKeyStore()
  const confirmDialog = useConfirmDialog()

  const [newKeyName, setNewKeyName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchKeys()
    fetchUsage()
  }, [fetchKeys, fetchUsage])

  const handleCreate = useCallback(async () => {
    if (!newKeyName.trim()) return
    await createKey(newKeyName.trim())
    setNewKeyName('')
    setShowCreateForm(false)
  }, [newKeyName, createKey])

  const handleCopyKey = useCallback(() => {
    if (!newlyCreatedKey) return
    navigator.clipboard.writeText(newlyCreatedKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [newlyCreatedKey])

  const handleRevoke = useCallback(
    async (keyId: string) => {
      if (
        !(await confirmDialog({
          title: 'Revoke API key',
          description: 'Are you sure you want to revoke this API key? This action cannot be undone.',
          confirmLabel: 'Revoke',
        }))
      )
        return
      await revokeKey(keyId)
    },
    [revokeKey, confirmDialog],
  )

  const activeKeys = keys.filter((k) => k.is_active)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Key className="w-4 h-4" />
          API Keys
        </h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          New Key
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded px-3 py-2">
          {error}
          <button onClick={clearError} className="ml-2 underline">
            dismiss
          </button>
        </div>
      )}

      {/* Newly created key (show once) */}
      {newlyCreatedKey && (
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 space-y-2">
          <p className="text-xs text-green-400 font-medium">
            API key created! Copy it now -- it will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-zinc-900 px-2 py-1 rounded text-xs text-green-300 font-mono overflow-x-auto">
              {newlyCreatedKey.key}
            </code>
            <button
              onClick={handleCopyKey}
              className="shrink-0 p-1.5 rounded hover:bg-zinc-700 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-zinc-400" />
              )}
            </button>
          </div>
          <button onClick={clearNewKey} className="text-xs text-zinc-500 hover:text-zinc-300 underline">
            I have copied the key
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., Production)"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={isLoading || !newKeyName.trim()}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
          </button>
        </div>
      )}

      {/* Key list */}
      {isLoading && keys.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading keys...
        </div>
      ) : activeKeys.length === 0 ? (
        <p className="text-xs text-zinc-500">No API keys yet. Create one to start using the ProAnimate API.</p>
      ) : (
        <div className="space-y-2">
          {activeKeys.map((key) => {
            const keyUsage = usage.find((u) => u.key_id === key.id)
            return (
              <div
                key={key.id}
                className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-200 font-medium truncate">{key.name}</span>
                    <code className="text-xs text-zinc-500 font-mono">{key.key_prefix}...</code>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                    {key.last_used_at && <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>}
                    {keyUsage && (
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {keyUsage.total_calls} calls
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(key.id)}
                  className="shrink-0 p-1.5 rounded hover:bg-red-900/30 text-zinc-500 hover:text-red-400 transition-colors"
                  title="Revoke key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Usage summary */}
      {usage.length > 0 && (
        <div className="border-t border-zinc-800 pt-3 mt-3">
          <h4 className="text-xs text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Usage This Period
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-800/50 rounded px-3 py-2">
              <div className="text-lg font-bold text-zinc-200">{usage.reduce((a, u) => a + u.total_calls, 0)}</div>
              <div className="text-xs text-zinc-500">Total API Calls</div>
            </div>
            <div className="bg-zinc-800/50 rounded px-3 py-2">
              <div className="text-lg font-bold text-zinc-200">{usage.reduce((a, u) => a + u.total_credits, 0)}</div>
              <div className="text-xs text-zinc-500">Credits Used</div>
            </div>
          </div>
        </div>
      )}

      {/* API docs link */}
      <div className="border-t border-zinc-800 pt-3 mt-3">
        <a
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 underline"
        >
          View API Documentation (Swagger UI)
        </a>
      </div>
    </div>
  )
}
