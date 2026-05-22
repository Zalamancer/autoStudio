import type { CopilotContext } from '@/types/copilot'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useProjectSchemaStore } from '@/stores/useProjectSchemaStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'

/**
 * Build a compact project state snapshot for the copilot AI context.
 * Reads all stores via getState() — fresh for each message.
 */
export function buildCopilotContext(): CopilotContext {
  const canvas = useCanvasStore.getState()
  const editor = useEditorStore.getState()
  const timeline = useTimelineStore.getState()
  const multiChar = useMultiCharacterStore.getState()
  const textOverlays = useTextOverlayStore.getState()
  const shapes = useShapeStore.getState()
  const templates = useHTMLTemplateLayerStore.getState()
  const schemaStore = useProjectSchemaStore.getState()
  const animStore = useAnimationStore.getState()
  const svgStore = useSVGObjectStore.getState()
  const mediaStore = useMediaStore.getState()
  const charParts = useCharacterPartsStore.getState()

  // Build character summaries
  const characters = multiChar.characters.map((c) => ({
    id: c.id,
    name: c.name,
    voiceId: c.voiceId,
    dialogueLineCount: multiChar.dialogueLines.filter((l) => l.characterId === c.id).length,
  }))

  // Build dialogue line summaries
  const dialogueLines = multiChar.dialogueLines.map((l) => {
    const char = multiChar.characters.find((c) => c.id === l.characterId)
    return {
      id: l.id,
      characterName: char?.name || 'Unknown',
      script: l.script,
      hasVoice: !!l.audioUrl || !!l.generatedVoiceId,
    }
  })

  // Build text overlay summaries
  const overlays = textOverlays.overlays.map((o) => ({
    id: o.id,
    content: o.content,
    preset: o.presetType,
    color: o.color,
    fontSize: o.fontSize,
  }))

  // Build shape summaries
  const shapeSummaries = shapes.shapes.map((s) => ({
    id: s.id,
    type: s.type as string,
    fill: typeof s.fill === 'string' ? s.fill : s.fill?.stops?.[0]?.color ?? '#000000',
  }))

  // Build template summaries
  const templateSummaries = templates.templates.map((t) => ({
    id: t.id,
    name: t.name,
    configKeys: (t.customConfig || []).map((c) => c.key),
  }))

  // Build schema variable summaries
  const schemaVars = (schemaStore.schema?.variables || []).map((v) => ({
    key: v.key,
    type: v.type,
    label: v.label,
    value: v.value,
  }))

  // Lottie animation library
  const lottieAnimations = animStore.library.slice(0, 20).map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category,
  }))

  // SVG objects on canvas
  const svgObjects = (svgStore.composition?.objects || []).map((o) => ({
    id: o.id,
    name: o.name,
  }))

  // Media items on canvas
  const mediaItems = mediaStore.canvasItems.map((ci) => {
    const asset = mediaStore.assets.find((a) => a.id === ci.assetId)
    return {
      id: ci.id,
      name: asset?.name || 'Unknown',
      type: asset?.category || 'images',
    }
  })

  // Selection state
  const selection = getSelectionState()

  // Capabilities list
  const capabilities: string[] = [
    'text-overlays',
    'shapes',
    'characters',
    'dialogue',
    'svg-generation',
    'stock-image-search',
    'stock-video-search',
    'lottie-animations',
    'html-templates',
    'schema-variables',
  ]
  if (import.meta.env.VITE_ELEVENLABS_API_KEY) capabilities.push('voice-generation')
  if (import.meta.env.VITE_PIXABAY_API_KEY) capabilities.push('pixabay-search')

  // Character part visibility
  const characterPartsList = charParts.layerOrder.map((part) => ({
    part,
    visible: charParts.transforms[part]?.visible ?? true,
  }))

  return {
    canvas: {
      aspectRatio: editor.aspectRatio,
      width: canvas.canvasWidth,
      height: canvas.canvasHeight,
      fps: timeline.fps,
      totalFrames: timeline.totalFrames,
      currentFrame: timeline.currentFrame,
      isPlaying: timeline.isPlaying,
    },
    characters,
    characterParts: {
      parts: characterPartsList,
      layerOrder: charParts.layerOrder as string[],
    },
    textOverlays: overlays,
    shapes: shapeSummaries,
    dialogueLines,
    templates: templateSummaries,
    schema: schemaVars,
    lottieAnimations,
    svgObjects,
    mediaItems,
    selection,
    capabilities,
  }
}

function getSelectionState(): CopilotContext['selection'] {
  const textStore = useTextOverlayStore.getState()
  if (textStore.selectedId) return { type: 'text', id: textStore.selectedId }

  const shapeStore = useShapeStore.getState()
  if (shapeStore.selectedShapeId) return { type: 'shape', id: shapeStore.selectedShapeId }

  const templateStore = useHTMLTemplateLayerStore.getState()
  if (templateStore.selectedTemplateId) return { type: 'template', id: templateStore.selectedTemplateId }

  const multiChar = useMultiCharacterStore.getState()
  if (multiChar.activeCharacterId) return { type: 'character', id: multiChar.activeCharacterId }

  return { type: null, id: null }
}

/**
 * Serialize context to compact JSON string for the prompt (~500-1000 tokens).
 */
export function serializeCopilotContext(ctx: CopilotContext): string {
  return JSON.stringify(ctx, null, 0)
}
