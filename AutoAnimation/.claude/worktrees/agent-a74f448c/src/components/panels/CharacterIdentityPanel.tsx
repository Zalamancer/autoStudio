/**
 * CharacterIdentityPanel -- UI for managing persistent character identities.
 * Lists identities with thumbnails, name, linked voice, and edit/delete actions.
 */

import { useState, useCallback } from 'react'
import {
  User,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Volume2,
  Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSelect } from '@/components/ui/panel-controls'
import { useCharacterIdentityStore } from '@/stores/useCharacterIdentityStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import type { CharacterIdentity } from '@/types/characterIdentity'

function IdentityCard({
  identity,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
}: {
  identity: CharacterIdentity
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onUpdate: (updates: Partial<CharacterIdentity>) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(identity.name)
  const [editDesc, setEditDesc] = useState(identity.description)

  const voices = useVoiceStore((s) => s.availableVoices)
  const voiceName = voices.find((v) => v.voice_id === identity.voiceId)?.name || identity.voiceId || 'No voice'

  const handleSave = () => {
    onUpdate({ name: editName.trim() || identity.name, description: editDesc })
    setIsEditing(false)
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-3 space-y-2 cursor-pointer transition-colors',
        isSelected
          ? 'border-blue-500/40 bg-blue-500/5'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded bg-white/10 overflow-hidden shrink-0">
          {identity.thumbnailUrl ? (
            <img
              src={identity.thumbnailUrl}
              alt={identity.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-5 h-5 text-white/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2 py-0.5 text-xs rounded bg-white/10 border border-white/20 text-white"
                autoFocus
              />
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description..."
                className="w-full px-2 py-0.5 text-xs rounded bg-white/10 border border-white/20 text-white placeholder:text-white/30"
              />
              <div className="flex gap-1">
                <button onClick={handleSave} className="p-1 rounded hover:bg-green-500/20">
                  <Check className="w-3 h-3 text-green-400" />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-1 rounded hover:bg-red-500/20">
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm font-medium text-white/80 truncate">{identity.name}</div>
              {identity.description && (
                <div className="text-xs text-white/40 truncate">{identity.description}</div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs text-white/30">
                  <Volume2 className="w-3 h-3" /> {voiceName}
                </span>
                {identity.defaultEmotion && identity.defaultEmotion !== 'Neutral' && (
                  <span className="flex items-center gap-1 text-xs text-white/30">
                    <Palette className="w-3 h-3" /> {identity.defaultEmotion}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setEditName(identity.name)
              setEditDesc(identity.description)
              setIsEditing(true)
            }}
            className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function CharacterIdentityPanel() {
  const identities = useCharacterIdentityStore((s) => s.identities)
  const selectedIdentityId = useCharacterIdentityStore((s) => s.selectedIdentityId)
  const selectIdentity = useCharacterIdentityStore((s) => s.selectIdentity)
  const createIdentity = useCharacterIdentityStore((s) => s.createIdentity)
  const updateIdentity = useCharacterIdentityStore((s) => s.updateIdentity)
  const deleteIdentity = useCharacterIdentityStore((s) => s.deleteIdentity)

  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const saved3DCharacters = useSaved3DCharactersStore((s) => s.characters)

  const [showCreate, setShowCreate] = useState(false)
  const [createFromCharId, setCreateFromCharId] = useState('')
  const [createName, setCreateName] = useState('')

  const handleCreate = useCallback(() => {
    if (!createName.trim()) return

    // Check if creating from a 2D saved character
    const saved2D = savedCharacters.find((c) => c.id === createFromCharId)
    const saved3D = saved3DCharacters.find((c) => c.id === createFromCharId)

    const thumbnailUrl = saved2D?.referenceImage || saved2D?.bodyParts?.body?.[0] || saved3D?.thumbnailDataUrl || null

    createIdentity(
      createName.trim(),
      saved2D ? saved2D.id : null,
      null,
      {
        saved3DCharacterId: saved3D ? saved3D.id : null,
        thumbnailUrl,
      }
    )

    setCreateName('')
    setCreateFromCharId('')
    setShowCreate(false)
  }, [createName, createFromCharId, savedCharacters, saved3DCharacters, createIdentity])

  // Combine 2D and 3D characters for the selector
  const allSavedChars = [
    ...savedCharacters.map((c) => ({ id: c.id, name: c.name, type: '2D' as const })),
    ...saved3DCharacters.map((c) => ({ id: c.id, name: c.name, type: '3D' as const })),
  ]

  return (
    <div className="space-y-3 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white/80">Character Identities</span>
          <span className="text-xs text-white/40">({identities.length})</span>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Plus className="w-3 h-3" /> Create
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-2">
          <input
            type="text"
            placeholder="Identity name (e.g. Professor Max)"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            className="w-full px-2 py-1 text-xs rounded bg-white/10 border border-white/20 text-white placeholder:text-white/30"
            autoFocus
          />
          <PanelSelect
            value={createFromCharId}
            onChange={(v) => setCreateFromCharId(v)}
            options={[
              { value: '', label: 'Link to saved character (optional)' },
              ...allSavedChars.map((c) => ({ value: c.id, label: `${c.name} (${c.type})` })),
            ]}
            fullWidth
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!createName.trim()}
              className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white"
            >
              <Check className="w-3 h-3" /> Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Identity List */}
      {identities.length > 0 ? (
        <div className="space-y-2">
          {identities.map((identity) => (
            <IdentityCard
              key={identity.id}
              identity={identity}
              isSelected={identity.id === selectedIdentityId}
              onSelect={() => selectIdentity(identity.id)}
              onDelete={() => deleteIdentity(identity.id)}
              onUpdate={(updates) => updateIdentity(identity.id, updates)}
            />
          ))}
        </div>
      ) : (
        !showCreate && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <User className="w-8 h-8 text-white/20 mb-2" />
            <p className="text-xs text-white/40">
              Create character identities to ensure visual and voice consistency across series episodes.
            </p>
          </div>
        )
      )}
    </div>
  )
}
