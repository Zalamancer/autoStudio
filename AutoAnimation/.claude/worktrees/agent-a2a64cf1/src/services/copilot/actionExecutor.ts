import type { CopilotAction } from '@/types/copilot'
import { useEditorStore } from '@/stores/useEditorStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useProjectSchemaStore } from '@/stores/useProjectSchemaStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { pushUndo, undo as globalUndo, redo as globalRedo } from '@/services/undoManager'
import type { LeftPanelTab, CanvasOverlayId, AspectRatio } from '@/types/editor'

type Executor = (params: Record<string, unknown>) => void | Promise<void>

const EXECUTORS: Record<string, Executor> = {
  // Navigation
  'navigate-panel': (p) => {
    useEditorStore.getState().setLeftPanelActiveTab(p.tab as LeftPanelTab)
  },
  'open-overlay': (p) => {
    useEditorStore.getState().openCanvasOverlay(p.overlay as CanvasOverlayId)
  },
  'close-overlay': () => {
    useEditorStore.getState().closeCanvasOverlay()
  },

  // Playback
  'play': () => {
    useTimelineStore.getState().play()
  },
  'pause': () => {
    useTimelineStore.getState().pause()
  },
  'seek': (p) => {
    useTimelineStore.getState().seekToFrame(p.frame as number)
  },
  'set-fps': (p) => {
    useTimelineStore.getState().setFps(p.fps as number)
  },

  // Canvas
  'set-aspect-ratio': (p) => {
    useEditorStore.getState().setAspectRatio(p.ratio as AspectRatio)
  },
  'set-zoom': (p) => {
    useCanvasStore.getState().setCanvasZoom(p.zoom as number)
  },
  'set-duration': (p) => {
    useTimelineStore.getState().setTotalFrames(p.totalFrames as number)
  },

  // Text
  'add-text': (p) => {
    const store = useTextOverlayStore.getState()
    const id = crypto.randomUUID()
    store.addOverlay({
      id,
      presetType: (p.preset as string) || 'title',
      content: (p.content as string) || 'New Text',
      fontFamily: (p.fontFamily as string) || 'Inter',
      fontSize: (p.fontSize as number) || 48,
      fontWeight: 'bold',
      color: (p.color as string) || '#ffffff',
      align: 'center',
      verticalAlign: 'middle',
      position: (p.position as string) || 'center',
      freeX: 0,
      freeY: 0,
      lineHeight: 1.2,
      letterSpacing: 0,
      textCase: 'none',
      shadow: false,
      background: false,
      backgroundOpacity: 0.7,
      visible: true,
      opacity: 1,
      zIndex: 10,
      rotation: 0,
      width: null,
      height: null,
      startFrame: 0,
      endFrame: useTimelineStore.getState().totalFrames,
    } as never)
  },
  'update-text': (p) => {
    if (!p.id) return
    const updates = { ...p }
    delete updates.id
    useTextOverlayStore.getState().updateOverlay(p.id as string, updates)
  },
  'remove-text': (p) => {
    if (!p.id) return
    useTextOverlayStore.getState().removeOverlay(p.id as string)
  },

  // Shapes
  'add-shape': (p) => {
    useShapeStore.getState().addShape((p.shapeType as 'rectangle' | 'circle' | 'triangle' | 'star') || 'rectangle')
  },
  'update-shape': (p) => {
    if (!p.id) return
    const updates = { ...p }
    delete updates.id
    useShapeStore.getState().updateShape(p.id as string, updates)
  },
  'remove-shape': (p) => {
    if (!p.id) return
    useShapeStore.getState().removeShape(p.id as string)
  },

  // Characters
  'add-character': (p) => {
    useMultiCharacterStore.getState().addDialogueCharacter({
      name: (p.name as string) || 'New Character',
      savedCharacterId: null,
      position: { x: 0, y: 0 },
      scale: 1,
      zIndex: 1,
      visible: true,
      locked: false,
      voiceId: (p.voiceId as string) || null,
      color: '#4ade80',
    })
  },
  'update-character': (p) => {
    if (!p.id) return
    const updates = { ...p }
    delete updates.id
    useMultiCharacterStore.getState().updateDialogueCharacter(p.id as string, updates)
  },
  'remove-character': (p) => {
    if (!p.id) return
    useMultiCharacterStore.getState().removeDialogueCharacter(p.id as string)
  },

  // Character parts (head, body, hair, viseme, eye, eyebrow, etc.)
  'update-character-part': (p) => {
    const part = p.part as string
    if (!part) return
    const validParts: string[] = ['group', 'viseme', 'eye', 'eyebrow', 'hair', 'body', 'head', 'shirt', 'pants', 'shoes']
    if (!validParts.includes(part)) return
    if (p.visible !== undefined) {
      const wantVisible = p.visible === true || p.visible === 'true'
      const current = useCharacterPartsStore.getState().transforms[part as 'head']?.visible
      if (current !== wantVisible) {
        useCharacterPartsStore.getState().toggleVisibility(part as 'head')
      }
      return
    }
    const updates: Record<string, unknown> = {}
    if (p.x !== undefined) updates.x = Number(p.x)
    if (p.y !== undefined) updates.y = Number(p.y)
    if (p.rotation !== undefined) updates.rotation = Number(p.rotation)
    if (p.scaleX !== undefined) updates.scaleX = Number(p.scaleX)
    if (p.scaleY !== undefined) updates.scaleY = Number(p.scaleY)
    if (Object.keys(updates).length > 0) {
      useCharacterPartsStore.getState().updateTransform(part as 'head', updates)
    }
  },

  // Dialogue
  'add-dialogue': (p) => {
    const chars = useMultiCharacterStore.getState().characters
    const charId = (p.characterId as string) || chars[0]?.id
    if (!charId) return
    const lines = useMultiCharacterStore.getState().dialogueLines
    useMultiCharacterStore.getState().addDialogueLine({
      characterId: charId,
      script: (p.script as string) || '',
      generatedVoiceId: null,
      startFrame: 0,
      endFrame: 150,
      order: lines.length,
      visemeTimeline: [],
      wordTimeline: [],
    })
  },
  'update-dialogue': (p) => {
    if (!p.id) return
    const updates = { ...p }
    delete updates.id
    useMultiCharacterStore.getState().updateDialogueLine(p.id as string, updates)
  },
  'remove-dialogue': (p) => {
    if (!p.id) return
    useMultiCharacterStore.getState().removeDialogueLine(p.id as string)
  },

  // Templates
  'update-template-config': (p) => {
    if (!p.id || !p.key) return
    useHTMLTemplateLayerStore.getState().updateTemplateConfig(p.id as string, p.key as string, p.value)
  },
  'remove-template': (p) => {
    if (!p.id) return
    useHTMLTemplateLayerStore.getState().removeTemplate(p.id as string)
  },

  // Schema
  'set-schema-variable': (p) => {
    if (!p.key) return
    useProjectSchemaStore.getState().setVariable(p.key as string, p.value)
  },
  'set-schema-variable-batch': (p) => {
    if (!p.updates) return
    useProjectSchemaStore.getState().setVariableBatch(p.updates as Record<string, unknown>)
  },

  // Voice generation
  'generate-voice': async (p) => {
    const lineId = p.dialogueLineId as string
    if (!lineId) return
    const { getElevenLabsService } = await import('@/services/elevenlabs')
    const { LipSyncProcessor } = await import('@/services/lipSync')
    const { CaptionProcessor } = await import('@/services/captions')
    const multiChar = useMultiCharacterStore.getState()
    const line = multiChar.dialogueLines.find((l) => l.id === lineId)
    if (!line) return
    const char = multiChar.characters.find((c) => c.id === line.characterId)
    const voiceId = char?.voiceId
    if (!voiceId) return
    const service = getElevenLabsService()
    const fps = useTimelineStore.getState().fps
    const result = await service.generateWithAlignment(line.script, voiceId)
    const lipSync = new LipSyncProcessor(fps)
    const visemeTimeline = lipSync.processAlignment(result.alignment)
    const captions = new CaptionProcessor(fps)
    const wordTimeline = captions.extractWords(line.script, result.alignment)
    multiChar.updateDialogueLine(lineId, {
      audioUrl: result.audioUrl,
      generatedVoiceId: voiceId,
      visemeTimeline,
      wordTimeline,
    })
  },
  'generate-all-voices': async () => {
    const multiChar = useMultiCharacterStore.getState()
    const lines = multiChar.dialogueLines.filter((l) => !l.audioUrl && !l.generatedVoiceId)
    for (const line of lines) {
      await EXECUTORS['generate-voice']!({ dialogueLineId: line.id })
    }
  },

  // SVG generation
  'generate-svg': async (p) => {
    const { generateSVGObjects } = await import('@/services/svgObjectAnimation')
    const prompt = (p.prompt as string) || 'Simple icon'
    const canvas = useCanvasStore.getState()
    const width = (p.width as number) || canvas.canvasWidth || 1920
    const height = (p.height as number) || canvas.canvasHeight || 1080
    const response = await generateSVGObjects({ prompt, width, height })
    if (!response.objects || response.objects.length === 0) return
    const store = useSVGObjectStore.getState()
    const totalFrames = useTimelineStore.getState().totalFrames
    const existing = store.composition
    const newObjects = response.objects.map((obj) => ({
      id: `svg-obj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: obj.name,
      zIndex: obj.zIndex || 10,
      visible: true,
      colors: { ...obj.defaultColors },
      defaultColors: obj.defaultColors,
      svgMarkup: obj.svgMarkup,
      keyframes: obj.keyframes || [],
      startFrame: 0,
      endFrame: totalFrames,
      opacity: 1,
    }))
    store.setComposition(
      existing
        ? { ...existing, objects: [...existing.objects, ...newObjects] }
        : {
            id: `svg-comp-${Date.now()}`,
            prompt,
            background: response.background || 'transparent',
            width,
            height,
            objects: newObjects,
          }
    )
  },

  // Stock media search (Pixabay)
  'search-stock-image': async (p) => {
    const { getPixabayService, hasPixabayService } = await import('@/services/pixabay')
    if (!hasPixabayService()) throw new Error('Pixabay API key not configured')
    const service = getPixabayService()
    const results = await service.searchImages({
      q: (p.query as string) || '',
      per_page: 5,
      orientation: (p.orientation as 'all' | 'horizontal' | 'vertical') || 'all',
      category: p.category as never || undefined,
      order: 'popular',
    })
    if (!results.hits || results.hits.length === 0) throw new Error('No images found')
    const hit = results.hits[0]
    const blob = await service.downloadAsBlob(hit.largeImageURL)
    const mediaStore = useMediaStore.getState()
    const assetId = `media-${Date.now()}`
    mediaStore.addAsset({
      id: assetId,
      name: hit.tags?.split(',')[0]?.trim() || 'Stock image',
      type: 'image/jpeg',
      size: blob.size,
      category: 'images',
      url: URL.createObjectURL(blob),
      width: hit.imageWidth,
      height: hit.imageHeight,
      addedAt: Date.now(),
    }, blob)
    mediaStore.addToCanvas(assetId)
  },
  'search-stock-video': async (p) => {
    const { getPixabayService, hasPixabayService } = await import('@/services/pixabay')
    if (!hasPixabayService()) throw new Error('Pixabay API key not configured')
    const service = getPixabayService()
    const results = await service.searchVideos({
      q: (p.query as string) || '',
      per_page: 5,
      video_type: (p.video_type as 'all' | 'film' | 'animation') || 'all',
      order: 'popular',
    })
    if (!results.hits || results.hits.length === 0) throw new Error('No videos found')
    const hit = results.hits[0]
    const videoUrl = hit.videos?.medium?.url || hit.videos?.small?.url
    if (!videoUrl) throw new Error('No downloadable video URL')
    const blob = await service.downloadAsBlob(videoUrl)
    const mediaStore = useMediaStore.getState()
    const assetId = `media-${Date.now()}`
    mediaStore.addAsset({
      id: assetId,
      name: hit.tags?.split(',')[0]?.trim() || 'Stock video',
      type: 'video/mp4',
      size: blob.size,
      category: 'video',
      url: URL.createObjectURL(blob),
      duration: hit.duration,
      addedAt: Date.now(),
    }, blob)
    mediaStore.addToCanvas(assetId)
  },

  // Lottie animations
  'add-lottie-animation': (p) => {
    const store = useAnimationStore.getState()
    let animId = p.animationId as string | undefined
    if (!animId && p.name) {
      const searchName = (p.name as string).toLowerCase()
      const match = store.library.find((a) =>
        a.name.toLowerCase().includes(searchName)
        || a.tags?.some((t) => t.toLowerCase().includes(searchName))
      )
      if (match) animId = match.id
    }
    if (!animId && store.library.length > 0) {
      animId = store.library[0].id
    }
    if (animId) {
      store.addToCanvas(animId)
    }
  },

  // Remove/update media
  'update-media': (p) => {
    if (!p.id) return
    const updates = { ...p }
    delete updates.id
    useMediaStore.getState().updateCanvasItem(p.id as string, updates)
  },
  'remove-media': (p) => {
    if (!p.id) return
    useMediaStore.getState().removeFromCanvas(p.id as string)
  },

  // Remove lottie animation
  'remove-lottie-animation': (p) => {
    if (!p.id) return
    useAnimationStore.getState().removeFromCanvas(p.id as string)
  },

  // Remove/update SVG object
  'remove-svg-object': (p) => {
    if (!p.id) return
    useSVGObjectStore.getState().removeObject(p.id as string)
  },
  'update-svg-object': (p) => {
    if (!p.id) return
    const updates = { ...p }
    delete updates.id
    useSVGObjectStore.getState().updateObject(p.id as string, updates)
  },

  // Remove video layer
  'remove-video': async (p) => {
    if (!p.id) return
    const { useVideoLayerStore } = await import('@/stores/useVideoLayerStore')
    useVideoLayerStore.getState().removeVideo(p.id as string)
  },

  // AI video generation
  'generate-ai-video': async (p) => {
    const { useAIAnimationStore } = await import('@/stores/useAIAnimationStore')
    const store = useAIAnimationStore.getState()
    if (p.prompt) store.setPrompt(p.prompt as string)
    if (p.fps) store.setFps(p.fps as number)
    if (p.durationSeconds) store.setDurationSeconds(p.durationSeconds as number)
    if (p.width) store.setWidth(p.width as number)
    if (p.height) store.setHeight(p.height as number)
    await store.startGeneration()
  },

  // Add template from built-in library
  'add-template': async (p) => {
    const templateId = p.templateId as string
    if (!templateId) return
    const { BUILTIN_TEMPLATES, getTemplateContent } = await import('@/data/builtinTemplates')
    const tpl = BUILTIN_TEMPLATES.find((t) => t.id === templateId)
    if (!tpl) return
    const rawHtml = getTemplateContent(tpl.filename)
    if (!rawHtml) return
    const { injectMessageBridge } = await import('@/services/templateBridge')
    const { parseTemplateConfig } = await import('@/services/templateConfigParser')
    const bridgedHtml = injectMessageBridge(rawHtml)
    const customConfig = parseTemplateConfig(bridgedHtml)
    const canvas = useCanvasStore.getState()
    useHTMLTemplateLayerStore.getState().addTemplate({
      id: `template-${Date.now()}`,
      htmlContent: bridgedHtml,
      name: tpl.title,
      position: { x: 0, y: 0 },
      scale: 1,
      opacity: 1,
      zIndex: 1,
      rotation: 0,
      visible: true,
      width: canvas.canvasWidth || 1920,
      height: canvas.canvasHeight || 1080,
      startFrame: 0,
      endFrame: useTimelineStore.getState().totalFrames,
      customConfig,
    })
  },

  // Undo/Redo — uses the shared undo manager
  'undo': () => { globalUndo() },
  'redo': () => { globalRedo() },
}

/**
 * Execute a single copilot action by dispatching to the appropriate store.
 * Automatically snapshots state before execution for undo support.
 */
export async function executeAction(action: CopilotAction): Promise<void> {
  // Undo/redo don't need a snapshot push
  if (action.type === 'undo' || action.type === 'redo') {
    if (action.type === 'undo') globalUndo()
    else globalRedo()
    return
  }

  // Handle batch actions — single undo snapshot, then execute all sub-actions
  if (action.type === 'batch' && Array.isArray(action.params.actions)) {
    pushUndo()
    for (const subAction of action.params.actions as CopilotAction[]) {
      const subExec = EXECUTORS[subAction.type]
      if (subExec) await subExec(subAction.params)
    }
    return
  }

  const executor = EXECUTORS[action.type]
  if (!executor) {
    console.warn(`[copilot] No executor for action type: ${action.type}`)
    return
  }

  // Snapshot before executing (for undo via Cmd+Z or copilot undo)
  pushUndo()
  await executor(action.params)
}
