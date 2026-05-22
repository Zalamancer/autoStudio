/**
 * Non-hook version of useCompositionProps() from ExportPanel.tsx.
 *
 * Reads all stores via `.getState()` (no React hooks) so it can be called
 * from inside Zustand actions, timers, or other non-React contexts — e.g.
 * the dashboard auto-export pipeline in `useDashboardStore._processQueue`.
 */

import type { VideoCompositionProps, Character3DExportData, DialogueCharacterData, RigExportData, SVGCompositionExportData, CrowdExportData } from '@/remotion/types'
import type { VisemeEvent } from '@/types/voice'
import type { EmotionEvent } from '@/services/emotionTimeline'
import {
  useTimelineStore,
  useCharacterConfigStore,
  useCharacterPartsStore,
  useVoiceStore,
  useAnimationStore,
  useEditorStore,
  useVideoLayerStore,
  useKeyframeStore,
  useShapeStore,
  useArtCurveStore,
} from '@/stores'
import { useMediaStore } from '@/stores/useMediaStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { use3DAnimationStore } from '@/stores/use3DAnimationStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useRigStore } from '@/stores/useRigStore'
import { useRetentionHookStore } from '@/stores/useRetentionHookStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useWardrobeStore } from '@/stores/useWardrobeStore'
import { useAnnotationStore } from '@/stores/useAnnotationStore'
import { useCrowdStore } from '@/stores/useCrowdStore'
import { useParticleStore } from '@/stores/useParticleStore'
import { useAudioReactiveStore } from '@/stores/useAudioReactiveStore'
import { buildEmotionTimeline } from '@/services/emotionTimeline'
import type { RetentionHookData } from '@/remotion/types'

const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '21:9': { width: 2560, height: 1080 },
}

const fontWeightMap: Record<string, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
}

/**
 * Build VideoCompositionProps by reading all global stores synchronously.
 * Mirror of `useCompositionProps()` in ExportPanel.tsx but without React hooks.
 */
export function buildCompositionPropsFromStores(): VideoCompositionProps {
  // ── Read all stores ──
  const aspectRatio = useEditorStore.getState().aspectRatio
  const { fps, totalFrames, tracks: timelineTracks } = useTimelineStore.getState()

  // 3D character data
  const chars3D = use3DCharacterStore.getState().characters
  const saved3DCharacters = useSaved3DCharactersStore.getState().characters
  const saved3DBlobUrls = useSaved3DCharactersStore.getState().blobUrls
  const anims3D = use3DAnimationStore.getState().animations
  const anim3DBlobUrls = use3DAnimationStore.getState().blobUrls

  const savedImages = useCharacterConfigStore.getState().savedImages
  const visemeMapping = useCharacterConfigStore.getState().visemeMapping
  const useCurvedVisemes = useCharacterConfigStore.getState().useCurvedVisemes
  const curvedVisemes = useCharacterConfigStore.getState().curvedVisemes

  const transforms = useCharacterPartsStore.getState().transforms
  const selectedSprites = useCharacterPartsStore.getState().selectedSprites

  const voiceState = useVoiceStore.getState()
  const activeVoiceId = voiceState.activeVoiceId
  const generatedVoices = voiceState.generatedVoices
  const visemeTimeline = voiceState.activeVisemeTimeline
  const emotionTimeline = voiceState.activeEmotionTimeline
  const wordTimeline = voiceState.activeWordTimeline
  const sentenceTimeline = voiceState.activeSentenceTimeline
  const captionStyle = voiceState.captionStyle
  const captionFontSize = voiceState.captionFontSize
  const captionPosition = voiceState.captionPosition

  const activeAnimations = useAnimationStore.getState().activeAnimations
  const library = useAnimationStore.getState().library
  // Build a Map for O(1) animation library lookups
  const libraryMap = new Map(library.map((l) => [l.id, l]))

  const canvasVideos = useVideoLayerStore.getState().videos
  const mediaCanvasItems = useMediaStore.getState().canvasItems
  const mediaAssets = useMediaStore.getState().assets
  // Build a Map for O(1) asset lookups instead of repeated O(n) .find() calls
  const mediaAssetMap = new Map(mediaAssets.map((a) => [a.id, a]))
  const textOverlays = useTextOverlayStore.getState().overlays
  const keyframeTracks = useKeyframeStore.getState().tracks
  const shapes = useShapeStore.getState().shapes
  const artCurves = useArtCurveStore.getState().compositions
  const htmlTemplates = useHTMLTemplateLayerStore.getState().templates
  const wardrobeLayers = useWardrobeStore.getState().layers
  const annotationItems = useAnnotationStore.getState().annotations
  // Crowd groups
  const crowdGroups = useCrowdStore.getState().groups
  const crowdMembersCache = useCrowdStore.getState().membersCache
  // Particle emitters
  const particleEmitters = useParticleStore.getState().emitters
  // Audio-reactive visualizers
  const audioReactiveVisualizers = useAudioReactiveStore.getState().visualizers
  // Multi-character dialogue data
  const dialogueCharacters = useMultiCharacterStore.getState().characters
  const dialogueLines = useMultiCharacterStore.getState().dialogueLines
  const savedCharacters = useSavedCharactersStore.getState().characters
  // Build Maps for O(1) lookups in dialogue building
  const savedCharacterMap = new Map(savedCharacters.map((sc) => [sc.id, sc]))
  const generatedVoiceMap = new Map(generatedVoices.map((v) => [v.id, v]))

  // ── Build DialogueCharacterData[] ──
  let dialogueCharactersData: DialogueCharacterData[] | undefined
  if (dialogueCharacters.length > 0) {
    const result: DialogueCharacterData[] = []
    for (const dChar of dialogueCharacters) {
      if (!dChar.visible || !dChar.savedCharacterId) continue

      const saved = savedCharacterMap.get(dChar.savedCharacterId)
      if (!saved) continue

      const bodyParts = saved.bodyParts || { viseme: [], eye: [], eyebrow: [], hair: [], body: [], head: [], shirt: [], pants: [], shoes: [] }
      const partTransforms = saved.partTransforms || {}
      const defaultTransform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true }
      const charPartTransforms = dChar.partTransforms

      const savedCharacterData = {
        savedImages: {
          viseme: bodyParts.viseme || [],
          eye: bodyParts.eye || [],
          eyebrow: bodyParts.eyebrow || [],
          hair: bodyParts.hair || [],
          body: bodyParts.body || [],
          head: bodyParts.head || [],
          shirt: bodyParts.shirt || [],
          pants: bodyParts.pants || [],
          shoes: bodyParts.shoes || [],
        },
        transforms: {
          group: {
            ...(partTransforms.group || defaultTransform),
            x: dChar.position.x,
            y: dChar.position.y,
          },
          eye: charPartTransforms?.eye || (partTransforms.eye as any) || defaultTransform,
          eyebrow: charPartTransforms?.eyebrow || (partTransforms.eyebrow as any) || defaultTransform,
          viseme: charPartTransforms?.viseme || (partTransforms.viseme as any) || defaultTransform,
          hair: charPartTransforms?.hair || (partTransforms.hair as any) || defaultTransform,
          body: charPartTransforms?.body || (partTransforms.body as any) || defaultTransform,
          head: charPartTransforms?.head || (partTransforms.head as any) || defaultTransform,
          shirt: charPartTransforms?.shirt || (partTransforms.shirt as any) || defaultTransform,
          pants: charPartTransforms?.pants || (partTransforms.pants as any) || defaultTransform,
          shoes: charPartTransforms?.shoes || (partTransforms.shoes as any) || defaultTransform,
        },
        selectedSprites: {
          viseme: saved.selectedSprites?.viseme ?? null,
          eye: dChar.defaultSpriteOverrides?.eye ?? saved.selectedSprites?.eye ?? null,
          eyebrow: dChar.defaultSpriteOverrides?.eyebrow ?? saved.selectedSprites?.eyebrow ?? null,
          hair: dChar.defaultSpriteOverrides?.hair ?? saved.selectedSprites?.hair ?? null,
          body: dChar.defaultSpriteOverrides?.body ?? saved.selectedSprites?.body ?? null,
          head: dChar.defaultSpriteOverrides?.head ?? saved.selectedSprites?.head ?? null,
          shirt: dChar.defaultSpriteOverrides?.shirt ?? saved.selectedSprites?.shirt ?? null,
          pants: dChar.defaultSpriteOverrides?.pants ?? saved.selectedSprites?.pants ?? null,
          shoes: dChar.defaultSpriteOverrides?.shoes ?? saved.selectedSprites?.shoes ?? null,
        },
        visemeMapping,
        useCurvedVisemes: true,
        curvedVisemes: saved.curvedVisemes || {},
        visemeSpriteMap: saved.visemeSpriteMap as Record<string, string | null> | undefined,
      }

      const charLines = dialogueLines
        .filter((l) => l.characterId === dChar.id)
        .sort((a, b) => a.order - b.order)
        .map((line) => {
          const voice = line.generatedVoiceId
            ? generatedVoiceMap.get(line.generatedVoiceId) ?? null
            : null

          const lineVisemeTimeline = line.visemeTimeline || []
          const lineEmotionTimeline =
            line.wordTimeline && line.wordTimeline.length > 0
              ? buildEmotionTimeline(line.script, line.wordTimeline)
              : []

          return {
            id: line.id,
            startFrame: line.startFrame,
            endFrame: line.endFrame,
            visemeTimeline: lineVisemeTimeline,
            emotionTimeline: lineEmotionTimeline,
            audioUrl: voice?.audioUrl || null,
          }
        })

      result.push({
        id: dChar.id,
        name: dChar.name,
        position: dChar.position,
        scale: dChar.scale,
        zIndex: dChar.zIndex,
        visible: dChar.visible,
        savedCharacter: savedCharacterData,
        dialogueLines: charLines,
        activeStyleEffect: dChar.activeStyleEffect,
      })
    }

    dialogueCharactersData = result.length > 0 ? result : undefined
  }

  // ── Build 3D character data ──
  let characters3DData: Character3DExportData[] | undefined
  const visible3D = chars3D.filter((c) => c.visible)
  if (visible3D.length > 0) {
    const saved3DCharMap = new Map(saved3DCharacters.map((sc) => [sc.id, sc]))
    const anim3DMap = new Map(anims3D.map((a) => [a.id, a]))
    const result: Character3DExportData[] = []
    for (const char of visible3D) {
      if (!char.saved3DCharacterId) continue
      const saved = saved3DCharMap.get(char.saved3DCharacterId)
      if (!saved) continue

      const glbUrl = saved3DBlobUrls[saved.glbBlobId]
      if (!glbUrl) continue

      let activeAnimationGlbUrl: string | undefined
      if (char.activeAnimationId) {
        const anim = anim3DMap.get(char.activeAnimationId)
        if (anim) {
          activeAnimationGlbUrl = anim3DBlobUrls[anim.glbBlobId]
        }
      }

      // Resolve expression face mapping data for export (eye/eyebrow sprites)
      let exportEyeVariantSpriteMap: Record<string, string | null> | undefined
      let exportEyebrowVariantSpriteMap: Record<string, string | null> | undefined

      if (char.faceExpressionMapping?.enabled) {
        const exSrc = char.faceExpressionMapping.expressionSource

        if (exSrc.type === 'character-config') {
          const cfg = useCharacterConfigStore.getState()
          const eyeSprites = cfg.eyeVariantSprites as Record<string, string | null>
          const browSprites = cfg.eyebrowVariantSprites as Record<string, string | null>
          if (Object.values(eyeSprites).some((v) => v != null)) {
            exportEyeVariantSpriteMap = eyeSprites
          }
          if (Object.values(browSprites).some((v) => v != null)) {
            exportEyebrowVariantSpriteMap = browSprites
          }
        } else if (exSrc.type === 'saved-2d-character') {
          const saved2D = savedCharacterMap.get(exSrc.characterId)
          if (saved2D) {
            if (saved2D.eyeVariants) {
              exportEyeVariantSpriteMap = saved2D.eyeVariants as Record<string, string | null>
            }
            if (saved2D.eyebrowVariants) {
              exportEyebrowVariantSpriteMap = saved2D.eyebrowVariants as Record<string, string | null>
            }
          }
        } else if (exSrc.type === 'custom') {
          exportEyeVariantSpriteMap = exSrc.eyeSprites as Record<string, string | null>
          exportEyebrowVariantSpriteMap = exSrc.eyebrowSprites as Record<string, string | null>
        }
      }

      // Resolve viseme face mapping data for export
      let exportVisemeSpriteMap: Record<string, string | null> | undefined
      let exportVisemeTimeline: VisemeEvent[] | undefined
      let exportEmotionTimeline: EmotionEvent[] | undefined

      if (char.visemeFaceMapping?.enabled) {
        const vfm = char.visemeFaceMapping
        const src = vfm.visemeSource

        if (src.type === 'character-config') {
          const cfg = useCharacterConfigStore.getState()
          exportVisemeSpriteMap = (cfg.visemeSpriteMap as Record<string, string | null>) ?? undefined
          if (!exportVisemeSpriteMap) {
            exportVisemeSpriteMap = cfg.curvedVisemes as Record<string, string | null>
          }
        } else if (src.type === 'saved-2d-character') {
          const saved2D = savedCharacterMap.get(src.characterId)
          if (saved2D) {
            exportVisemeSpriteMap = (saved2D.visemeSpriteMap as Record<string, string | null>) ?? (saved2D.curvedVisemes as Record<string, string | null>)
          }
        } else if (src.type === 'custom') {
          exportVisemeSpriteMap = src.sprites as Record<string, string | null>
        }

        // Resolve timeline
        if (vfm.dialogueCharacterId) {
          const dChar = dialogueCharacters.find((c) => c.id === vfm.dialogueCharacterId)
          if (dChar) {
            const charLines = dialogueLines
              .filter((l) => l.characterId === dChar.id)
              .sort((a, b) => a.order - b.order)
            const combinedV: VisemeEvent[] = []
            const combinedE: EmotionEvent[] = []
            for (const line of charLines) {
              if (line.visemeTimeline) combinedV.push(...line.visemeTimeline)
              if (line.wordTimeline?.length) {
                combinedE.push(...buildEmotionTimeline(line.script, line.wordTimeline))
              }
            }
            exportVisemeTimeline = combinedV
            exportEmotionTimeline = combinedE
          }
        } else {
          exportVisemeTimeline = visemeTimeline
          exportEmotionTimeline = emotionTimeline
        }
      }

      // If expression mapping is enabled but viseme mapping didn't resolve emotion timeline,
      // resolve it now so expression overlays have emotion data in export
      if (char.faceExpressionMapping?.enabled && !exportEmotionTimeline) {
        const exDialogueCharId = char.faceExpressionMapping.dialogueCharacterId
        if (exDialogueCharId) {
          const dChar = dialogueCharacters.find((c) => c.id === exDialogueCharId)
          if (dChar) {
            const charLines = dialogueLines
              .filter((l) => l.characterId === dChar.id)
              .sort((a, b) => a.order - b.order)
            const combinedE: EmotionEvent[] = []
            for (const line of charLines) {
              if (line.wordTimeline?.length) {
                combinedE.push(...buildEmotionTimeline(line.script, line.wordTimeline))
              }
            }
            exportEmotionTimeline = combinedE
          }
        } else {
          exportEmotionTimeline = emotionTimeline
        }
      }

      result.push({
        id: char.id,
        name: char.name,
        glbUrl,
        position: char.position,
        rotation: char.rotation,
        scale: char.scale,
        visible: char.visible,
        activeAnimationGlbUrl,
        animationStartFrame: 0,
        animationSpeed: char.animationSpeed,
        boneMapping: saved.boneMapping as Record<string, string> | undefined,
        visemeFaceMapping: char.visemeFaceMapping,
        visemeSpriteMap: exportVisemeSpriteMap,
        visemeTimeline: exportVisemeTimeline,
        emotionTimeline: exportEmotionTimeline,
        faceExpressionMapping: char.faceExpressionMapping,
        eyeVariantSpriteMap: exportEyeVariantSpriteMap,
        eyebrowVariantSpriteMap: exportEyebrowVariantSpriteMap,
      })
    }
    characters3DData = result.length > 0 ? result : undefined
  }

  // ── Build 2D rig export data ──
  let rigExportData: RigExportData[] | undefined
  const rigStore = useRigStore.getState()
  const allRigs = Object.values(rigStore.rigs)
  if (allRigs.length > 0) {
    const result: RigExportData[] = []
    for (const rig of allRigs) {
      result.push({
        id: rig.id,
        sourceImageUrl: rig.sourceImageUrl,
        imageWidth: rig.imageWidth,
        imageHeight: rig.imageHeight,
        skeleton: {
          joints: rig.skeleton.joints.map((j) => ({
            id: j.id,
            name: j.name,
            parentId: j.parentId,
            restPosition: j.restPosition,
            category: j.category,
          })),
          rootJointId: rig.skeleton.rootJointId,
        },
        meshGridSpacing: rig.meshGridSpacing,
        restPose: rig.restPose,
        poseTracks: rigStore.poseTracks
          .filter((t) => t.characterId === 'primary' || t.characterId === rig.id)
          .map((t) => ({
            characterId: t.characterId,
            keyframes: t.keyframes.map((kf) => ({
              frame: kf.frame,
              pose: kf.pose,
              easing: kf.easing,
            })),
          })),
        boneriggingSerializedData: rig.boneriggingSerializedData,
      })
    }
    rigExportData = result.length > 0 ? result : undefined
  }

  // ── Build retention hook data ──
  let retentionHooksData: RetentionHookData[] | undefined
  const retentionHooks = useRetentionHookStore.getState().hooks
  if (retentionHooks.length > 0) {
    // Compute dialogue line boundaries for step-counter stepBoundaries
    const lineBoundaries = dialogueLines
      .sort((a, b) => a.order - b.order)
      .map((l) => l.startFrame)

    retentionHooksData = retentionHooks.map((hook) => {
      const triggerFrame = hook.triggerPercent != null
        ? Math.round(hook.triggerPercent * totalFrames)
        : undefined

      const hookData: RetentionHookData = {
        type: hook.type,
        style: hook.style,
        position: hook.position,
        color: hook.color || undefined,
        countdownFrom: hook.countdownFrom,
        chapters: hook.chapters,
        triggerFrame,
        text: hook.text,
        totalSteps: hook.totalSteps,
      }

      // For step-counter, compute step boundaries from dialogue line starts
      if (hook.type === 'step-counter' && hook.totalSteps && lineBoundaries.length > 0) {
        const stepCount = hook.totalSteps
        const linesPerStep = Math.max(1, Math.floor(lineBoundaries.length / stepCount))
        const boundaries: number[] = []
        for (let i = 1; i < stepCount; i++) {
          const lineIdx = Math.min(i * linesPerStep, lineBoundaries.length - 1)
          boundaries.push(lineBoundaries[lineIdx])
        }
        hookData.stepBoundaries = boundaries
      }

      return hookData
    })
  }

  // ── Build SVG composition data ──
  let svgCompositionData: SVGCompositionExportData | undefined
  const svgComp = useSVGObjectStore.getState().composition
  if (svgComp && svgComp.objects.length > 0) {
    svgCompositionData = {
      width: svgComp.width,
      height: svgComp.height,
      background: svgComp.background,
      objects: svgComp.objects.map((obj) => ({
        id: obj.id,
        name: obj.name,
        zIndex: obj.zIndex,
        visible: obj.visible,
        colors: { ...obj.colors },
        svgMarkup: obj.svgMarkup,
        keyframes: obj.keyframes.map((kf) => ({
          time: kf.time,
          x: kf.x,
          y: kf.y,
          rotation: kf.rotation,
          scaleX: kf.scaleX,
          scaleY: kf.scaleY,
          opacity: kf.opacity,
          easing: kf.easing,
        })),
        startFrame: obj.startFrame,
        endFrame: obj.endFrame,
        opacity: obj.opacity,
      })),
    }
  }

  // ── Compute dimensions ──
  const dims = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS['16:9']

  const activeVoice = activeVoiceId ? generatedVoiceMap.get(activeVoiceId) : undefined
  const audioUrl = activeVoice?.audioUrl || null

  // ── Calculate duration ──
  let maxFrame = 30 // Minimum 1 second

  maxFrame = Math.max(maxFrame, totalFrames)

  if (activeVoice && (!dialogueCharactersData || dialogueCharactersData.length === 0)) {
    maxFrame = Math.max(maxFrame, Math.ceil(activeVoice.audioDuration * fps))
  }

  if (dialogueCharactersData) {
    for (const dc of dialogueCharactersData) {
      for (const line of dc.dialogueLines) {
        maxFrame = Math.max(maxFrame, line.endFrame)
      }
    }
  }

  for (const overlay of textOverlays) {
    if (overlay.visible && overlay.endFrame != null) {
      maxFrame = Math.max(maxFrame, overlay.endFrame)
    }
  }

  for (const shape of shapes) {
    if (shape.visible && shape.endFrame != null) {
      maxFrame = Math.max(maxFrame, shape.endFrame)
    }
  }

  for (const tpl of htmlTemplates) {
    if (tpl.visible) {
      maxFrame = Math.max(maxFrame, tpl.endFrame)
    }
  }

  const durationInFrames = maxFrame

  // ── Build and return props ──
  return {
    fps,
    durationInFrames,
    width: dims.width,
    height: dims.height,
    character: {
      savedImages,
      transforms,
      selectedSprites,
      visemeMapping,
      useCurvedVisemes,
      curvedVisemes,
    },
    audioUrl,
    visemeTimeline,
    emotionTimeline,
    captions: (() => {
      // For multi-character dialogue, build combined captions from dialogue lines
      if (dialogueCharactersData && dialogueCharactersData.length > 0) {
        const combinedWordTimeline = dialogueCharactersData.flatMap((dc) =>
          dc.dialogueLines.flatMap((line) =>
            (line.visemeTimeline.length > 0 ? dialogueLines : [])
              .filter((dl) => dl.id === line.id)
              .flatMap((dl) =>
                (dl.wordTimeline || []).map((w) => ({
                  ...w,
                  startFrame: w.startFrame + line.startFrame,
                  endFrame: w.endFrame + line.startFrame,
                })),
              ),
          ),
        )

        const combinedSentenceTimeline = dialogueCharactersData.flatMap((dc) =>
          dc.dialogueLines.map((line) => {
            const dlSource = dialogueLines.find((dl) => dl.id === line.id)
            const script = dlSource?.script || ''
            const cleanScript = script.replace(/\[.*?\]\s*/g, '').trim()
            const lineWords = (dlSource?.wordTimeline || []).map((w) => ({
              ...w,
              startFrame: w.startFrame + line.startFrame,
              endFrame: w.endFrame + line.startFrame,
            }))
            return {
              sentence: cleanScript,
              startFrame: line.startFrame,
              endFrame: line.endFrame,
              words: lineWords,
            }
          }),
        )

        return {
          style: captionStyle,
          fontSize: captionFontSize,
          position: captionPosition,
          wordTimeline: combinedWordTimeline,
          sentenceTimeline: combinedSentenceTimeline,
        }
      }

      return {
        style: captionStyle,
        fontSize: captionFontSize,
        position: captionPosition,
        wordTimeline,
        sentenceTimeline,
      }
    })(),
    animations: activeAnimations.map((a) => {
      const lib = libraryMap.get(a.animationId)
      return {
        id: a.id,
        url: lib?.url || '',
        category: (lib?.category || 'background') as 'background' | 'overlay',
        position: a.position,
        scale: a.scale,
        opacity: a.opacity,
        zIndex: a.zIndex,
        loop: a.loop,
        speed: a.speed,
        animationData: lib?.animationData,
        svgHtml: lib?.svgHtml,
      }
    }),
    videos: canvasVideos
      .filter((v) => v.visible)
      .map((v) => ({
        id: v.id,
        sourceUrl: v.sourceUrl,
        position: v.position,
        scale: v.scale,
        rotation: v.rotation ?? 0,
        opacity: v.opacity,
        zIndex: v.zIndex,
        visible: v.visible,
        loop: v.loop,
        durationSeconds: v.durationSeconds,
        width: v.width,
        height: v.height,
      })),
    mediaItems: mediaCanvasItems
      .filter((item) => {
        const asset = mediaAssetMap.get(item.assetId)
        return asset && item.visible
      })
      .map((item) => {
        const asset = mediaAssetMap.get(item.assetId)!
        return {
          id: item.id,
          imageUrl: item.recoloredUrl || asset.url,
          position: item.position,
          scale: item.scale,
          opacity: item.opacity,
          zIndex: item.zIndex,
          rotation: item.rotation,
          visible: item.visible,
          startFrame: item.startFrame ?? 0,
          endFrame: item.endFrame ?? durationInFrames,
        }
      }),
    textOverlays: textOverlays
      .filter((o) => o.visible)
      .map((o) => ({
        id: o.id,
        content: o.content,
        fontFamily: o.fontFamily,
        fontSize: o.fontSize,
        fontWeight: fontWeightMap[o.fontWeight] ?? 400,
        color: o.color,
        align: o.align,
        verticalAlign: o.verticalAlign,
        position: o.position,
        freeX: o.freeX,
        freeY: o.freeY,
        lineHeight: o.lineHeight,
        letterSpacing: o.letterSpacing,
        textCase: o.textCase,
        shadow: o.shadow,
        background: o.background,
        backgroundOpacity: o.backgroundOpacity,
        backgroundColor: o.backgroundColor,
        backgroundBorderRadius: o.backgroundBorderRadius,
        backgroundPaddingX: o.backgroundPaddingX,
        backgroundPaddingY: o.backgroundPaddingY,
        backgroundBorder: o.backgroundBorder,
        opacity: o.opacity,
        zIndex: o.zIndex,
        rotation: o.rotation,
        width: o.width,
        height: o.height,
        startFrame: o.startFrame ?? 0,
        endFrame: o.endFrame ?? durationInFrames,
        animationPreset: o.animationPreset,
        textShadow: o.textShadow,
        webkitTextStroke: o.webkitTextStroke,
      })),
    shapes: shapes
      .filter((s) => s.visible)
      .map((s) => ({
        id: s.id,
        type: s.type,
        name: s.name,
        position: s.position,
        width: s.width,
        height: s.height,
        rotation: s.rotation,
        fill: s.fill,
        stroke: s.stroke,
        strokeWidth: s.strokeWidth,
        opacity: s.opacity,
        zIndex: s.zIndex,
        visible: s.visible,
        startFrame: s.startFrame,
        endFrame: s.endFrame,
        borderRadius: s.borderRadius,
        points: s.points,
        innerRadius: s.innerRadius,
      })),
    annotations: annotationItems
      .filter((a) => a.visible)
      .map((a) => ({
        id: a.id,
        type: a.type,
        points: a.points.map((p) => ({ x: p.x, y: p.y })),
        color: a.color,
        thickness: a.thickness,
        opacity: a.opacity,
        startFrame: a.startFrame,
        endFrame: a.endFrame,
        animation: a.animation,
        visible: a.visible,
        textContent: a.textContent,
        blurRadius: a.blurRadius,
      })),
    artCurves: artCurves.filter((c) => c.visible),
    keyframeData:
      keyframeTracks.length > 0
        ? {
            tracks: keyframeTracks.map((t) => ({
              objectType: t.objectRef.objectType,
              objectId: t.objectRef.objectId,
              property: t.property,
              keyframes: t.keyframes.map((kf) => ({
                frame: kf.frame,
                value: kf.value,
                easing: kf.easing,
                bezierParams: kf.bezierParams,
              })),
            })),
          }
        : undefined,
    characters3D: characters3DData,
    svgComposition: svgCompositionData,
    rigData: rigExportData,
    retentionHooks: retentionHooksData,
    dialogueCharacters: dialogueCharactersData,
    htmlTemplates: htmlTemplates
      .filter((t) => t.visible)
      .map((t) => ({
        id: t.id,
        htmlContent: t.htmlContent,
        name: t.name,
        position: t.position,
        scale: t.scale,
        opacity: t.opacity,
        zIndex: t.zIndex,
        rotation: t.rotation,
        visible: t.visible,
        width: t.width,
        height: t.height,
        startFrame: t.startFrame,
        endFrame: t.endFrame,
        customConfig: t.customConfig.map((c) => ({ key: c.key, value: c.value })),
        frameSync: t.frameSync ?? false,
        templateAspectRatio: t.templateAspectRatio,
      })),
    backgroundAudio: mediaCanvasItems
      .filter((item) => {
        const asset = mediaAssetMap.get(item.assetId)
        return asset && asset.category === 'audio' && item.visible
      })
      .map((item) => {
        const asset = mediaAssetMap.get(item.assetId)!
        return {
          id: item.id,
          url: asset.url,
          startFrame: item.startFrame ?? 0,
          endFrame: item.endFrame ?? durationInFrames,
          volume: item.volume ?? 1,
        }
      }),
    wardrobeLayers: wardrobeLayers
      .filter((l) => l.visible)
      .map((l) => ({
        id: l.id,
        name: l.name,
        spriteUrl: l.spriteUrl,
        position: { ...l.position },
        rotation: l.rotation,
        scale: { ...l.scale },
        visible: l.visible,
        zOrder: l.zOrder,
      })),
    crowdGroups: crowdGroups
      .filter((g) => g.visible)
      .map((g): CrowdExportData => ({
        id: g.id,
        name: g.name,
        visible: g.visible,
        startFrame: g.startFrame,
        endFrame: g.endFrame,
        members: (crowdMembersCache[g.id] || []).map((m) => ({
          x: m.x,
          y: m.y,
          scale: m.scale,
          skinColor: m.skinColor,
          outfitColor: m.outfitColor,
          swayPhase: m.swayPhase,
          swaySpeed: m.swaySpeed,
          bobPhase: m.bobPhase,
          bobSpeed: m.bobSpeed,
          opacity: m.opacity,
          heightRatio: m.heightRatio,
        })),
      })),
    // Clip transitions — extract from timeline track clips
    clipTransitions: (() => {
      const result: import('@/remotion/types').ClipTransitionExportData[] = []
      for (const track of timelineTracks) {
        for (const clip of track.clips) {
          if (!clip.transitionIn && !clip.transitionOut) continue
          result.push({
            clipId: clip.id,
            startFrame: clip.startFrame,
            endFrame: clip.endFrame,
            transitionIn: clip.transitionIn ? {
              type: clip.transitionIn.type,
              durationFrames: Math.round(clip.transitionIn.duration * fps),
              easing: clip.transitionIn.easing,
            } : undefined,
            transitionOut: clip.transitionOut ? {
              type: clip.transitionOut.type,
              durationFrames: Math.round(clip.transitionOut.duration * fps),
              easing: clip.transitionOut.easing,
            } : undefined,
          })
        }
      }
      return result.length > 0 ? result : undefined
    })(),
    particleEmitters: particleEmitters.filter((e) => e.visible).length > 0
      ? particleEmitters.filter((e) => e.visible)
      : undefined,
    audioReactiveVisualizers: audioReactiveVisualizers.filter((v) => v.visible).length > 0
      ? audioReactiveVisualizers
          .filter((v) => v.visible)
          .map((v) => ({
            id: v.id,
            name: v.name,
            type: v.type,
            visible: v.visible,
            position: { ...v.position },
            width: v.width,
            height: v.height,
            rotation: v.rotation,
            opacity: v.opacity,
            zIndex: v.zIndex,
            startFrame: v.startFrame,
            endFrame: v.endFrame,
            audioSourceId: v.audioSourceId,
            barCount: v.barCount,
            barWidth: v.barWidth,
            barGap: v.barGap,
            barRadius: v.barRadius,
            color: v.color,
            gradientColors: v.gradientColors,
            useGradient: v.useGradient,
            mirrorX: v.mirrorX,
            mirrorY: v.mirrorY,
            sensitivity: v.sensitivity,
            smoothing: v.smoothing,
            minFrequency: v.minFrequency,
            maxFrequency: v.maxFrequency,
            minAmplitude: v.minAmplitude,
            maxAmplitude: v.maxAmplitude,
            pulseScale: v.pulseScale,
            pulseShape: v.pulseShape,
            lineWidth: v.lineWidth,
            fillBelow: v.fillBelow,
          }))
      : undefined,
  }
}

/**
 * Build VideoCompositionProps from raw plan data without Zustand dependencies.
 * Used by server-side rendering and CLI tool.
 */
export function buildCompositionFromPlan(
  plan: Record<string, unknown>,
  voiceData: Array<{ lineIndex: number; audioUrl: string }>,
  fps: number = 30,
): VideoCompositionProps {
  const canvas = (plan as any).canvas || {}
  const dialogue = (plan as any).dialogue || []
  const captionsConfig = (plan as any).captions || {}
  const textOverlaysRaw = (plan as any).textOverlays || []

  const width = canvas.width || 1080
  const height = canvas.height || 1920

  const dialogueCharacters: DialogueCharacterData[] = dialogue.map((line: any, idx: number) => {
    const voice = voiceData.find((v) => v.lineIndex === idx)
    return {
      id: `char_${idx}`,
      name: line.characterName || `Character ${idx + 1}`,
      visible: true,
      position: { x: width / 2, y: height * 0.6 },
      scale: 1,
      zIndex: 10 + idx,
      dialogueLines: [{
        id: `line_${idx}`,
        script: line.script || '',
        audioUrl: voice?.audioUrl || null,
        startFrame: idx * fps * 4,
        endFrame: (idx + 1) * fps * 4,
        visemeTimeline: [],
        emotionTimeline: [],
        wordTimeline: [],
      }],
      savedCharacter: null as any,
      renderMode: 'sprite' as const,
    }
  })

  return {
    fps,
    width,
    height,
    durationInFrames: (canvas.durationFrames || canvas.totalFrames || dialogue.length * fps * 4) || fps * 10,
    character: null as any,
    audioUrl: null as any,
    visemeTimeline: [],
    emotionTimeline: [],
    captions: {
      style: captionsConfig.style || 'word-by-word',
      position: captionsConfig.position || 'bottom',
      fontSize: 48,
      color: '#ffffff',
      bgOpacity: 0.7,
      wordTimeline: [],
      sentenceTimeline: [],
    },
    animations: [],
    dialogueCharacters,
    videos: [],
    mediaItems: [],
    textOverlays: textOverlaysRaw.map((t: any, idx: number) => ({
      id: `text_${idx}`,
      text: t.text || '',
      type: t.type || 'title',
      position: t.position || { x: width / 2, y: 100 },
      fontSize: t.fontSize || 48,
      color: t.color || '#ffffff',
      fontFamily: t.fontFamily || 'Inter',
      visible: true,
      startFrame: t.startFrame || 0,
      endFrame: t.endFrame || fps * 5,
    })),
    shapes: [],
    artCurves: [],
    keyframeData: { tracks: [] },
    characters3D: [],
    backgroundAudio: [],
    rigData: [],
    htmlTemplates: [],
    svgComposition: { objects: [], keyframes: {} } as any,
    retentionHooks: [],
    pixelArtCharacters: [],
    avatarCharacters: [],
  }
}
