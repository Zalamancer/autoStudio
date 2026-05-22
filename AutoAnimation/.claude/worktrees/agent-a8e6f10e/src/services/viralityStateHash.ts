/**
 * Virality State Hash -- computes a lightweight hash of project state
 * to determine when re-scoring is needed.
 *
 * Uses a simple string hash (djb2) for sub-millisecond performance.
 * Only triggers re-scoring when hash changes.
 */

import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useTimelineStore } from '@/stores/useTimelineStore'

/**
 * djb2 hash function -- fast, simple, good enough for change detection.
 */
function djb2Hash(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(36)
}

/**
 * Compute a lightweight hash of the project state relevant to virality scoring.
 * Includes: dialogue count/text, overlay count/types, character count,
 * duration, template IDs, media IDs.
 */
export function computeProjectStateHash(): string {
  const dialogueLines = useMultiCharacterStore.getState().dialogueLines
  const characters = useMultiCharacterStore.getState().characters
  const overlays = useTextOverlayStore.getState().overlays
  const canvasItems = useMediaStore.getState().canvasItems
  const templates = useHTMLTemplateLayerStore.getState().templates
  const svgObjects = useSVGObjectStore.getState().composition?.objects || []
  const totalFrames = useTimelineStore.getState().totalFrames
  const fps = useTimelineStore.getState().fps

  // Build a deterministic string representation of scoring-relevant state
  const parts: string[] = [
    `d:${dialogueLines.length}`,
    `c:${characters.length}`,
    `o:${overlays.length}`,
    `m:${canvasItems.length}`,
    `t:${templates.length}`,
    `s:${svgObjects.length}`,
    `f:${totalFrames}`,
    `fps:${fps}`,
    // Include dialogue scripts (truncated for speed)
    ...dialogueLines.map((l) => `dl:${l.script.slice(0, 40)}`),
    // Include overlay types
    ...overlays.map((o: { presetType?: string; content?: string }) =>
      `ot:${o.presetType || 'text'}:${(o.content || '').slice(0, 20)}`
    ),
    // Include template IDs
    ...templates.map((t) => `ti:${t.id}`),
    // Include media asset IDs
    ...canvasItems.map((ci) => `mi:${ci.assetId}`),
  ]

  return djb2Hash(parts.join('|'))
}
