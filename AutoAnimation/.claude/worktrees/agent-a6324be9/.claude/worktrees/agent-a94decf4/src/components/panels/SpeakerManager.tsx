/**
 * SpeakerManager — Speaker management UI.
 *
 * Shows detected speakers with auto-generated colors.
 * Allows renaming, merging, and reassigning speakers.
 * "Map to Character" creates dialogue characters per speaker.
 */

import { useState, useCallback } from 'react'
import { Users, Edit3, Merge, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranscriptStore } from '@/stores/useTranscriptStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { toast } from '@/stores/useToastStore'

const SPEAKER_COLORS = [
  { text: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  { text: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  { text: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  { text: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  { text: 'text-pink-300', bg: 'bg-pink-500/15', border: 'border-pink-500/30' },
  { text: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' },
]

function getSpeakerStyle(index: number) {
  return SPEAKER_COLORS[index % SPEAKER_COLORS.length]
}

export function SpeakerManager() {
  const speakers = useTranscriptStore((s) => s.speakers)
  const editedSegments = useTranscriptStore((s) => s.editedSegments)
  const renameSpeaker = useTranscriptStore((s) => s.renameSpeaker)
  const mergeSpeakers = useTranscriptStore((s) => s.mergeSpeakers)
  const addDialogueCharacter = useMultiCharacterStore((s) => s.addDialogueCharacter)

  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [mergingFrom, setMergingFrom] = useState<string | null>(null)

  // Count segments per speaker
  const speakerCounts = speakers.reduce((acc, sp) => {
    acc[sp] = editedSegments.filter((seg) => seg.speaker === sp).length
    return acc
  }, {} as Record<string, number>)

  const handleStartRename = useCallback((speaker: string) => {
    setEditingSpeaker(speaker)
    setEditName(speaker)
    setMergingFrom(null)
  }, [])

  const handleRename = useCallback(() => {
    if (!editingSpeaker || !editName.trim()) return
    if (editName.trim() !== editingSpeaker) {
      renameSpeaker(editingSpeaker, editName.trim())
    }
    setEditingSpeaker(null)
  }, [editingSpeaker, editName, renameSpeaker])

  const handleMerge = useCallback((keepSpeaker: string) => {
    if (!mergingFrom || mergingFrom === keepSpeaker) return
    mergeSpeakers(keepSpeaker, mergingFrom)
    setMergingFrom(null)
    toast.success(`Merged "${mergingFrom}" into "${keepSpeaker}"`)
  }, [mergingFrom, mergeSpeakers])

  const handleMapToCharacters = useCallback(() => {
    for (let i = 0; i < speakers.length; i++) {
      const color = SPEAKER_COLORS[i % SPEAKER_COLORS.length]
      addDialogueCharacter({
        name: speakers[i],
        savedCharacterId: null,
        voiceId: null,
        position: { x: 0.3 + (i * 0.4) / Math.max(speakers.length - 1, 1), y: 0.5 },
        scale: 1,
        zIndex: i,
        visible: true,
        locked: false,
        color: color.text.replace('text-', '').replace('-300', ''),
      })
    }
    toast.success(`Created ${speakers.length} dialogue characters from speakers`)
  }, [speakers, addDialogueCharacter])

  if (speakers.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-3 text-zinc-500">
        <Users size={14} />
        <span className="text-[11px]">No speakers detected. Use Deepgram provider for diarization.</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-purple-400" />
          <span className="text-[11px] font-medium text-zinc-300">
            Speakers ({speakers.length})
          </span>
        </div>
        <button
          onClick={handleMapToCharacters}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
        >
          <UserPlus size={10} />
          Map to Characters
        </button>
      </div>

      {/* Speaker list */}
      <div className="space-y-1">
        {speakers.map((speaker, idx) => {
          const style = getSpeakerStyle(idx)
          const count = speakerCounts[speaker] || 0
          const isEditing = editingSpeaker === speaker
          const isMergeTarget = mergingFrom !== null && mergingFrom !== speaker

          return (
            <div
              key={speaker}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors',
                style.bg,
                style.border,
                isMergeTarget && 'ring-1 ring-purple-500/50 cursor-pointer',
              )}
              onClick={isMergeTarget ? () => handleMerge(speaker) : undefined}
            >
              {/* Color dot */}
              <div className={cn('w-2 h-2 rounded-full', style.text.replace('text-', 'bg-'))} />

              {/* Name (editable) */}
              {isEditing ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingSpeaker(null) }}
                  autoFocus
                  className="flex-1 bg-transparent text-xs text-zinc-200 outline-none border-b border-cyan-500/50"
                />
              ) : (
                <span className={cn('flex-1 text-xs font-medium', style.text)}>
                  {speaker}
                </span>
              )}

              {/* Segment count */}
              <span className="text-[9px] text-zinc-500 tabular-nums">
                {count} seg{count !== 1 ? 's' : ''}
              </span>

              {/* Actions */}
              {!isEditing && !mergingFrom && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStartRename(speaker) }}
                    className="p-0.5 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Rename"
                  >
                    <Edit3 size={10} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMergingFrom(speaker) }}
                    className="p-0.5 rounded text-zinc-500 hover:text-purple-400 transition-colors"
                    title="Merge into another speaker"
                  >
                    <Merge size={10} />
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Merge mode indicator */}
      {mergingFrom && (
        <div className="flex items-center justify-between px-2 py-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <span className="text-[10px] text-purple-300">
            Click a speaker to merge "{mergingFrom}" into it
          </span>
          <button
            onClick={() => setMergingFrom(null)}
            className="text-[10px] text-zinc-400 hover:text-zinc-300"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
