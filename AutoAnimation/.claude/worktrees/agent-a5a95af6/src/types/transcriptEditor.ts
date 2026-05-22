/**
 * Transcript Editor Types — Slate.js custom elements for text-based video editing.
 */

export interface WordNode {
  text: string
  wordIndex: number
  startFrame: number
  endFrame: number
}

export interface ParagraphElement {
  type: 'paragraph'
  lineId: string
  characterId: string
  characterName: string
  color: string
  children: WordNode[]
}

export interface GapElement {
  type: 'gap'
  durationFrames: number
  children: [{ text: string }]
}

export type TranscriptElement = ParagraphElement | GapElement

export interface WordFrameMapping {
  wordIndex: number
  startFrame: number
  endFrame: number
  text: string
  /** Alias used in some codepaths */
  word: string
}

export interface TimelineOp {
  type: 'remove' | 'insert' | 'move' | 'silence' | 'delete-frames' | 'update-text' | 'move-frames'
  startFrame?: number
  endFrame?: number
  /** For insert/move operations */
  targetFrame?: number
  /** Line ID for line-based operations */
  lineId?: string
  /** New text for update-text operations */
  newText?: string
  /** Target index for move-frames operations */
  toIndex?: number
}
