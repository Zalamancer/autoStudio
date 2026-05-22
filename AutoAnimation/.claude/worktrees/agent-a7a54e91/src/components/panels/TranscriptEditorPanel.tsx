/**
 * TranscriptEditorPanel -- Slate.js transcript editor for text-based video editing (#22).
 *
 * Renders a rich-text editor with paragraph-per-dialogue-line structure,
 * word-level click-to-seek, currently-playing word highlight, and toolbar
 * for cut/undo/redo/regenerate operations.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { createEditor, type Descendant } from 'slate'
import { Slate, Editable, withReact, type RenderElementProps, type RenderLeafProps } from 'slate-react'
import { withHistory } from 'slate-history'
import { Undo2, Redo2, RefreshCw, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useTranscriptSync, buildSlateDoc } from '@/hooks/useTranscriptSync'
import { buildTranscript } from '@/services/transcriptSync'
import type { ParagraphElement, GapElement, WordNode } from '@/types/transcriptEditor'

interface TranscriptEditorPanelProps {
  onBack: () => void
}

export function TranscriptEditorPanel({ onBack }: TranscriptEditorPanelProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const [editorValue, setEditorValue] = useState<Descendant[]>([
    {
      type: 'paragraph' as const,
      lineId: '',
      characterId: '',
      characterName: '',
      color: '#666',
      children: [{ text: 'Loading...', wordIndex: -1, startFrame: 0, endFrame: 0 }],
    },
  ])

  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const seekToFrame = useTimelineStore((s) => s.seekToFrame)

  const { handleSlateChange } = useTranscriptSync(setEditorValue)

  // Initialize the editor on mount
  useEffect(() => {
    const transcript = buildTranscript()
    const doc = buildSlateDoc(transcript)
    if (doc.length > 0) {
      setEditorValue(doc)
    }
  }, [])

  // Track modified lines that need voice regeneration
  const [modifiedLineIds, setModifiedLineIds] = useState<Set<string>>(new Set())

  // Handle editor changes
  const handleChange = useCallback(
    (value: Descendant[]) => {
      setEditorValue(value)
      handleSlateChange(value)
    },
    [handleSlateChange],
  )

  // Click on a word to seek to its start frame
  const handleWordClick = useCallback(
    (startFrame: number) => {
      if (startFrame >= 0) {
        seekToFrame(startFrame)
      }
    },
    [seekToFrame],
  )

  // Render paragraph elements (one per dialogue line)
  const renderElement = useCallback(
    (props: RenderElementProps) => {
      const { attributes, children, element } = props

      if (element.type === 'gap') {
        const gap = element as GapElement
        return (
          <div
            {...attributes}
            className="flex items-center gap-2 py-1 px-2 my-1"
            contentEditable={false}
          >
            <div className="flex-1 h-px bg-zinc-700" />
            <span className="text-[9px] text-zinc-600 shrink-0">
              {gap.durationFrames} frames gap
            </span>
            <div className="flex-1 h-px bg-zinc-700" />
            {children}
          </div>
        )
      }

      const para = element as ParagraphElement
      const isModified = modifiedLineIds.has(para.lineId)

      return (
        <div {...attributes} className="mb-2">
          {/* Character header */}
          <div className="flex items-center gap-2 mb-0.5" contentEditable={false}>
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: para.color }}
            />
            <span className="text-[10px] font-medium" style={{ color: para.color }}>
              {para.characterName}
            </span>
            {isModified && (
              <button
                className="text-[9px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                onClick={(e) => {
                  e.preventDefault()
                  setModifiedLineIds((prev) => {
                    const next = new Set(prev)
                    next.delete(para.lineId)
                    return next
                  })
                }}
              >
                <RefreshCw size={8} />
                Regenerate Voice
              </button>
            )}
          </div>
          {/* Paragraph text */}
          <div className="pl-4 text-xs text-zinc-200 leading-relaxed">{children}</div>
        </div>
      )
    },
    [modifiedLineIds],
  )

  // Render word leaves with click-to-seek and highlight behavior
  const renderLeaf = useCallback(
    (props: RenderLeafProps) => {
      const { attributes, children, leaf } = props
      const wordNode = leaf as unknown as WordNode

      // Highlight the currently playing word
      const isPlaying =
        wordNode.startFrame <= currentFrame &&
        currentFrame < wordNode.endFrame &&
        wordNode.wordIndex >= 0

      return (
        <span
          {...attributes}
          className={cn(
            'cursor-pointer transition-colors duration-100',
            isPlaying && 'bg-violet-500/30 rounded px-0.5',
          )}
          onClick={() => handleWordClick(wordNode.startFrame)}
        >
          {children}
        </span>
      )
    },
    [currentFrame, handleWordClick],
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5">
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Back to Dialogue Panel"
        >
          <ArrowLeft size={14} />
        </button>

        <div className="flex-1" />

        <button
          onClick={() => editor.undo()}
          className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Undo"
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={() => editor.redo()}
          className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Redo"
        >
          <Redo2 size={14} />
        </button>
      </div>

      {/* Slate Editor */}
      <div className="flex-1 overflow-auto px-3 py-2">
        <Slate editor={editor} initialValue={editorValue} onChange={handleChange}>
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder="No dialogue lines yet..."
            className="outline-none min-h-[200px]"
            spellCheck={false}
          />
        </Slate>
      </div>

      {/* Status bar */}
      <div className="px-3 py-1.5 border-t border-white/5 flex items-center justify-between">
        <span className="text-[9px] text-zinc-600">Click a word to seek playhead</span>
        {modifiedLineIds.size > 0 && (
          <span className="text-[9px] text-amber-400">
            {modifiedLineIds.size} line{modifiedLineIds.size > 1 ? 's' : ''} modified
          </span>
        )}
      </div>
    </div>
  )
}
