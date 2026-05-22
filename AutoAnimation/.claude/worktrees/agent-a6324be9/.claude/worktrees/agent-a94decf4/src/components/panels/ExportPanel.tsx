import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { CompositionPlayer, type CompositionPlayerRef } from '@/engine'
import { Download, Film, Check, X, AlertTriangle, Info, Copy, CheckCheck, Share2, Clock, Box, Layers, HardDrive, FileText } from 'lucide-react'
import {
  PanelSection,
  PanelButtonGroup,
  PanelActionButton,
  PanelToggle,
  PanelSlider,
} from '@/components/ui/panel-controls'
import { VideoComposition } from '@/remotion/VideoComposition'
import type { VideoCompositionProps } from '@/remotion/types'
import { useTimelineStore, useCharacterConfigStore, useCharacterPartsStore, useVoiceStore, useAnimationStore, useEditorStore, useVideoLayerStore, useKeyframeStore, useShapeStore } from '@/stores'
import { useMediaStore } from '@/stores/useMediaStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { use3DAnimationStore } from '@/stores/use3DAnimationStore'
import type { Character3DExportData, DialogueCharacterData } from '@/remotion/types'
import { exportVideo, formatFileSize, isMp4Supported, getFileExtension, type ExportProgress, type ExportResult } from '@/services/videoExport'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useRigStore } from '@/stores/useRigStore'
import { buildEmotionTimeline } from '@/services/emotionTimeline'
import { useRecordingsStore } from '@/stores/useRecordingsStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { exportFCPXML, exportEDL, exportOTIO, exportWithAssets, getNLEFileExtension } from '@/services/nleExport'
import { ThumbnailPanel } from './ThumbnailPanel'
import { useWardrobeStore } from '@/stores/useWardrobeStore'

const FORMAT_OPTIONS = [
  { label: 'WebM', value: 'webm' as const },
  { label: 'MP4', value: 'mp4' as const },
  { label: 'GIF', value: 'gif' as const },
]

const FFMPEG_COMMAND = 'ffmpeg -i input.webm -c:v libx264 -c:a aac output.mp4'

const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '21:9': { width: 2560, height: 1080 },
}

const RESOLUTION_OPTIONS = [
  { label: '8K (4320p)', scale: 4.0 },
  { label: '4K (2160p)', scale: 2.0 },
  { label: '2K (1440p)', scale: 1.333 },
  { label: '1080p', scale: 1 },
  { label: '720p', scale: 0.667 },
  { label: '480p', scale: 0.444 },
]

const QUALITY_OPTIONS = [
  { label: 'High', value: 1.0 },
  { label: 'Medium', value: 0.6 },
  { label: 'Low', value: 0.3 },
]

const FORMAT_OPTIONS_UI = FORMAT_OPTIONS.map(o => ({ value: o.value, label: o.label }))
const RESOLUTION_OPTIONS_UI = RESOLUTION_OPTIONS.map((o, i) => ({ value: i.toString(), label: o.label }))
const QUALITY_OPTIONS_UI = QUALITY_OPTIONS.map((o, i) => ({ value: i.toString(), label: o.label }))

const EXPORT_FPS_OPTIONS = [
  { label: 'Project FPS', value: '0' },
  { label: '24 fps', value: '24' },
  { label: '30 fps', value: '30' },
  { label: '60 fps', value: '60' },
  { label: '120 fps', value: '120' },
]

const GIF_FRAME_SKIP_OPTIONS = [
  { label: 'Every frame', value: '1' },
  { label: 'Every 2nd', value: '2' },
  { label: 'Every 3rd', value: '3' },
]

const GIF_MAX_WIDTH_OPTIONS = [
  { label: '320px', value: '320' },
  { label: '480px', value: '480' },
  { label: '640px', value: '640' },
]

const fontWeightMap: Record<string, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
}

function useCompositionProps(): VideoCompositionProps {
  const aspectRatio = useEditorStore(s => s.aspectRatio)
  const fps = useTimelineStore(s => s.fps)
  const totalFrames = useTimelineStore(s => s.totalFrames)
  const timelineTracks = useTimelineStore(s => s.tracks)

  // 3D character data
  const chars3D = use3DCharacterStore(s => s.characters)
  const saved3DCharacters = useSaved3DCharactersStore(s => s.characters)
  const saved3DBlobUrls = useSaved3DCharactersStore(s => s.blobUrls)
  const anims3D = use3DAnimationStore(s => s.animations)
  const anim3DBlobUrls = use3DAnimationStore(s => s.blobUrls)

  const savedImages = useCharacterConfigStore(s => s.savedImages)
  const visemeMapping = useCharacterConfigStore(s => s.visemeMapping)
  const useCurvedVisemes = useCharacterConfigStore(s => s.useCurvedVisemes)
  const curvedVisemes = useCharacterConfigStore(s => s.curvedVisemes)

  const transforms = useCharacterPartsStore(s => s.transforms)
  const selectedSprites = useCharacterPartsStore(s => s.selectedSprites)

  const activeVoiceId = useVoiceStore(s => s.activeVoiceId)
  const generatedVoices = useVoiceStore(s => s.generatedVoices)
  const visemeTimeline = useVoiceStore(s => s.activeVisemeTimeline)
  const emotionTimeline = useVoiceStore(s => s.activeEmotionTimeline)
  const wordTimeline = useVoiceStore(s => s.activeWordTimeline)
  const sentenceTimeline = useVoiceStore(s => s.activeSentenceTimeline)
  const captionStyle = useVoiceStore(s => s.captionStyle)
  const captionFontSize = useVoiceStore(s => s.captionFontSize)
  const captionPosition = useVoiceStore(s => s.captionPosition)

  const activeAnimations = useAnimationStore(s => s.activeAnimations)
  const library = useAnimationStore(s => s.library)

  // New layer stores
  const canvasVideos = useVideoLayerStore(s => s.videos)
  const mediaCanvasItems = useMediaStore(s => s.canvasItems)
  const mediaAssets = useMediaStore(s => s.assets)
  const textOverlays = useTextOverlayStore(s => s.overlays)

  // Keyframe animation data
  const keyframeTracks = useKeyframeStore(s => s.tracks)

  // Shape objects
  const shapes = useShapeStore(s => s.shapes)

  // HTML templates
  const htmlTemplates = useHTMLTemplateLayerStore(s => s.templates)

  // Wardrobe outfit layers
  const wardrobeLayers = useWardrobeStore(s => s.layers)

  // Multi-character dialogue data
  const dialogueCharacters = useMultiCharacterStore(s => s.characters)
  const dialogueLines = useMultiCharacterStore(s => s.dialogueLines)
  const savedCharacters = useSavedCharactersStore(s => s.characters)
  const rigs = useRigStore(s => s.rigs)
  const rigPoseTracks = useRigStore(s => s.poseTracks)
  // Also check useCharacterPartsStore for fallback rig mode
  const partsStoreRenderMode = useCharacterPartsStore(s => s.renderMode)
  const partsStoreRigId = useCharacterPartsStore(s => s.rigId)

  // Build DialogueCharacterData[] for the composition
  const dialogueCharactersData = useMemo(() => {
    if (dialogueCharacters.length === 0) return undefined

    const result: DialogueCharacterData[] = []
    for (const dChar of dialogueCharacters) {
      if (!dChar.visible || !dChar.savedCharacterId) continue

      const saved = savedCharacters.find(sc => sc.id === dChar.savedCharacterId)
      if (!saved) continue

      // Build CharacterSpriteData from saved character
      const bodyParts = saved.bodyParts || { body: [], head: [], viseme: [], eye: [], eyebrow: [], hair: [], shirt: [], pants: [], shoes: [] }
      const partTransforms = saved.partTransforms || {}
      const defaultTransform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true }

      // Use per-character part transforms if available, otherwise fall back to saved character
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
          viseme: charPartTransforms?.viseme || partTransforms.viseme as any || defaultTransform,
          eye: charPartTransforms?.eye || partTransforms.eye as any || defaultTransform,
          eyebrow: charPartTransforms?.eyebrow || partTransforms.eyebrow as any || defaultTransform,
          hair: charPartTransforms?.hair || partTransforms.hair as any || defaultTransform,
          body: charPartTransforms?.body || partTransforms.body as any || defaultTransform,
          head: charPartTransforms?.head || partTransforms.head as any || defaultTransform,
          shirt: charPartTransforms?.shirt || partTransforms.shirt as any || defaultTransform,
          pants: charPartTransforms?.pants || partTransforms.pants as any || defaultTransform,
          shoes: charPartTransforms?.shoes || partTransforms.shoes as any || defaultTransform,
        },
        selectedSprites: {
          viseme: saved.selectedSprites?.viseme ?? null,
          eye: dChar.defaultSpriteOverrides?.eye ?? saved.selectedSprites?.eye ?? null,
          eyebrow: dChar.defaultSpriteOverrides?.eyebrow ?? saved.selectedSprites?.eyebrow ?? null,
          hair: dChar.defaultSpriteOverrides?.hair ?? saved.selectedSprites?.hair ?? null,
          body: dChar.defaultSpriteOverrides?.body ?? saved.selectedSprites?.body ?? null,
          head: dChar.defaultSpriteOverrides?.head ?? (saved.selectedSprites as Record<string, number | null> | undefined)?.head ?? null,
          shirt: dChar.defaultSpriteOverrides?.shirt ?? saved.selectedSprites?.shirt ?? null,
          pants: dChar.defaultSpriteOverrides?.pants ?? saved.selectedSprites?.pants ?? null,
          shoes: dChar.defaultSpriteOverrides?.shoes ?? saved.selectedSprites?.shoes ?? null,
        },
        visemeMapping: visemeMapping, // Use global viseme mapping
        useCurvedVisemes: true,
        curvedVisemes: saved.curvedVisemes || {},
        visemeSpriteMap: saved.visemeSpriteMap as Record<string, string | null> | undefined,
      }

      // Build dialogue lines for this character
      const charLines = dialogueLines
        .filter(l => l.characterId === dChar.id)
        .sort((a, b) => a.order - b.order)
        .map(line => {
          // Find the generated voice to get audio URL
          const voice = line.generatedVoiceId
            ? generatedVoices.find(v => v.id === line.generatedVoiceId)
            : null

          // Use viseme timeline from the dialogue line (cached from generation)
          const lineVisemeTimeline = line.visemeTimeline || []

          // Build emotion timeline from script text + word timeline
          const lineEmotionTimeline = line.wordTimeline && line.wordTimeline.length > 0
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

      // Determine if this dialogue character should use rigged mode
      // Check dialogue character first, then fallback to partsStore
      const effectiveRenderMode = dChar.renderMode || (partsStoreRenderMode === 'rigged' ? 'rigged' : undefined)
      const effectiveRigId = dChar.rigId || partsStoreRigId

      // Build RigExportData if character is in rigged mode
      let rigExportData: import('@/remotion/types').RigExportData | undefined
      if (effectiveRenderMode === 'rigged' && effectiveRigId) {
        const rig = rigs[effectiveRigId]
        if (rig) {
          // Find pose tracks for this character (or primary)
          const charPoseTracks = rigPoseTracks.filter(
            (t) => t.characterId === dChar.id || t.characterId === 'primary'
          )

          rigExportData = {
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
            poseTracks: charPoseTracks.map((t) => ({
              characterId: t.characterId,
              keyframes: t.keyframes.map((kf) => ({
                frame: kf.frame,
                pose: kf.pose,
                easing: kf.easing || 'ease-in-out',
              })),
            })),
            boneriggingSerializedData: rig.boneriggingSerializedData,
          }
        }
      }

      result.push({
        id: dChar.id,
        name: dChar.name,
        position: dChar.position,
        scale: dChar.scale,
        zIndex: dChar.zIndex,
        visible: dChar.visible,
        savedCharacter: savedCharacterData,
        dialogueLines: charLines,
        renderMode: effectiveRenderMode as 'sprite' | 'rigged' | undefined,
        rigExportData,
        boundsWidth: dChar.boundsWidth,
        boundsHeight: dChar.boundsHeight,
      })
    }

    return result.length > 0 ? result : undefined
  }, [dialogueCharacters, dialogueLines, savedCharacters, generatedVoices, visemeMapping, rigs, rigPoseTracks, partsStoreRenderMode, partsStoreRigId])

  // Build 3D character data for preview using blob URLs (instant, no async needed)
  const characters3DData = useMemo(() => {
    const visible3D = chars3D.filter(c => c.visible)
    if (visible3D.length === 0) return undefined

    const result: Character3DExportData[] = []
    for (const char of visible3D) {
      const saved = saved3DCharacters.find(sc => sc.id === char.saved3DCharacterId)
      if (!saved) continue

      const glbUrl = saved3DBlobUrls[saved.glbBlobId]
      if (!glbUrl) continue

      // Find animation blob URL if active
      let activeAnimationGlbUrl: string | undefined
      if (char.activeAnimationId) {
        const anim = anims3D.find(a => a.id === char.activeAnimationId)
        if (anim) {
          activeAnimationGlbUrl = anim3DBlobUrls[anim.glbBlobId]
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
        boneMapping: saved.boneMapping,
      })
    }

    return result.length > 0 ? result : undefined
  }, [chars3D, saved3DCharacters, saved3DBlobUrls, anims3D, anim3DBlobUrls])

  const dims = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS['16:9']

  const activeVoice = generatedVoices.find(v => v.id === activeVoiceId)
  const audioUrl = activeVoice?.audioUrl || null

  // Calculate duration — use the maximum of all content end frames
  const durationInFrames = useMemo(() => {
    let maxFrame = 30 // Minimum 1 second

    // Timeline total frames (from store)
    maxFrame = Math.max(maxFrame, totalFrames)

    // Single voice audio duration (if active and no dialogue)
    if (activeVoice && (!dialogueCharactersData || dialogueCharactersData.length === 0)) {
      maxFrame = Math.max(maxFrame, Math.ceil(activeVoice.audioDuration * fps))
    }

    // Dialogue lines end frames
    if (dialogueCharactersData) {
      for (const dc of dialogueCharactersData) {
        for (const line of dc.dialogueLines) {
          maxFrame = Math.max(maxFrame, line.endFrame)
        }
      }
    }

    // Text overlay end frames
    for (const overlay of textOverlays) {
      if (overlay.visible && overlay.endFrame != null) {
        maxFrame = Math.max(maxFrame, overlay.endFrame)
      }
    }

    // Shape end frames
    for (const shape of shapes) {
      if (shape.visible) {
        maxFrame = Math.max(maxFrame, shape.endFrame)
      }
    }

    // HTML template end frames
    for (const tpl of htmlTemplates) {
      if (tpl.visible) {
        maxFrame = Math.max(maxFrame, tpl.endFrame)
      }
    }

    return maxFrame
  }, [totalFrames, activeVoice, fps, dialogueCharactersData, textOverlays, shapes, htmlTemplates])

  return useMemo((): any => ({
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
        // Combine all word timelines from all dialogue lines (with absolute frame offsets)
        const combinedWordTimeline = dialogueCharactersData.flatMap(dc =>
          dc.dialogueLines.flatMap(line =>
            (line.visemeTimeline.length > 0 ? dialogueLines : [])
              .filter(dl => dl.id === line.id)
              .flatMap(dl => (dl.wordTimeline || []).map(w => ({
                ...w,
                startFrame: w.startFrame + line.startFrame,
                endFrame: w.endFrame + line.startFrame,
              })))
          )
        )

        // Build sentence timeline from dialogue scripts
        const combinedSentenceTimeline = dialogueCharactersData.flatMap(dc =>
          dc.dialogueLines.map(line => {
            const dlSource = dialogueLines.find(dl => dl.id === line.id)
            const script = dlSource?.script || ''
            // Strip inline emotion cues like [happy]
            const cleanScript = script.replace(/\[.*?\]\s*/g, '').trim()
            const lineWords = (dlSource?.wordTimeline || []).map(w => ({
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
          })
        )

        return {
          style: captionStyle,
          fontSize: captionFontSize,
          position: captionPosition,
          wordTimeline: combinedWordTimeline,
          sentenceTimeline: combinedSentenceTimeline,
        }
      }

      // Single-character mode: use the voice store timelines
      return {
        style: captionStyle,
        fontSize: captionFontSize,
        position: captionPosition,
        wordTimeline,
        sentenceTimeline,
      }
    })(),
    animations: activeAnimations.map(a => {
      const lib = library.find(l => l.id === a.animationId)
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
      }
    }),
    // AI animation videos
    videos: canvasVideos
      .filter(v => v.visible)
      .map(v => ({
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
    // Media images on canvas
    mediaItems: mediaCanvasItems
      .filter(item => {
        const asset = mediaAssets.find(a => a.id === item.assetId)
        return asset && item.visible
      })
      .map(item => {
        const asset = mediaAssets.find(a => a.id === item.assetId)!
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
    // Text overlays
    textOverlays: textOverlays
      .filter(o => o.visible)
      .map(o => ({
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
        textShadow: o.textShadow,
        webkitTextStroke: o.webkitTextStroke,
        opacity: o.opacity,
        zIndex: o.zIndex,
        rotation: o.rotation,
        width: o.width,
        height: o.height,
        startFrame: o.startFrame ?? 0,
        endFrame: o.endFrame ?? durationInFrames,
        animationPreset: o.animationPreset,
      })),
    // Shape objects
    shapes: shapes
      .filter(s => s.visible)
      .map(s => ({
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
    // Keyframe animation data
    keyframeData: keyframeTracks.length > 0 ? {
      tracks: keyframeTracks.map(t => ({
        objectType: t.objectRef.objectType,
        objectId: t.objectRef.objectId,
        property: t.property,
        keyframes: t.keyframes.map(kf => ({
          frame: kf.frame,
          value: kf.value,
          easing: kf.easing,
          bezierParams: kf.bezierParams,
        })),
      })),
    } : undefined,
    // 3D characters (using blob URLs for preview)
    characters3D: characters3DData,
    // Wardrobe outfit layers
    wardrobeLayers: wardrobeLayers
      .filter(l => l.visible)
      .map(l => ({
        id: l.id,
        name: l.name,
        spriteUrl: l.spriteUrl,
        position: { ...l.position },
        rotation: l.rotation,
        scale: { ...l.scale },
        visible: l.visible,
        zOrder: l.zOrder,
      })),
    // Multi-character dialogue
    dialogueCharacters: dialogueCharactersData,
    // HTML templates
    htmlTemplates: htmlTemplates
      .filter(t => t.visible)
      .map(t => ({
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
        customConfig: t.customConfig.map(c => ({ key: c.key, value: c.value })),
        frameSync: t.frameSync ?? false,
        templateAspectRatio: t.templateAspectRatio,
      })),
    // Background audio (music tracks from media store)
    backgroundAudio: mediaCanvasItems
      .filter(item => {
        const asset = mediaAssets.find(a => a.id === item.assetId)
        return asset && asset.category === 'audio' && item.visible
      })
      .map(item => {
        const asset = mediaAssets.find(a => a.id === item.assetId)!
        return {
          id: item.id,
          url: asset.url,
          startFrame: item.startFrame,
          endFrame: item.endFrame,
        }
      }),
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
  }), [
    fps, durationInFrames, dims, savedImages, transforms, selectedSprites,
    visemeMapping, useCurvedVisemes, curvedVisemes, audioUrl, visemeTimeline,
    emotionTimeline, captionStyle, captionFontSize, captionPosition,
    wordTimeline, sentenceTimeline, activeAnimations, library,
    canvasVideos, mediaCanvasItems, mediaAssets, textOverlays,
    keyframeTracks, shapes, characters3DData, dialogueCharactersData, htmlTemplates, wardrobeLayers,
    timelineTracks,
  ])
}

export function ExportPanel() {
  const playerRef = useRef<CompositionPlayerRef>(null)
  const compositionRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [resolution, setResolution] = useState(3) // index into RESOLUTION_OPTIONS (default: 1080p)
  const [quality, setQuality] = useState(0) // index into QUALITY_OPTIONS
  const [format, setFormat] = useState<'webm' | 'mp4' | 'gif'>('mp4')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [copiedCommand, setCopiedCommand] = useState(false)
  const [useRangeExport, setUseRangeExport] = useState(false)
  const [startTime, setStartTime] = useState(0) // seconds
  const [endTime, setEndTime] = useState(0) // seconds (0 = full duration, set on mount)
  const [savedRecordingId, setSavedRecordingId] = useState<string | null>(null)
  // FPS override (0 = use project FPS)
  const [fpsOverride, setFpsOverride] = useState(0)
  // GIF-specific settings
  const [gifFrameSkip, setGifFrameSkip] = useState<1 | 2 | 3>(2)
  const [gifMaxWidth, setGifMaxWidth] = useState(480)
  const [gifDithering, setGifDithering] = useState(false)
  const [gifLoop, setGifLoop] = useState(true)
  // Transparent export
  const transparentExport = useSettingsStore((s) => s.transparentExport)
  const setTransparentExport = useCallback((v: boolean) => {
    useSettingsStore.getState().setSetting('transparentExport', v)
  }, [])
  const [transparentFormat, setTransparentFormat] = useState<'webm-alpha' | 'png-sequence'>('webm-alpha')
  // NLE export
  const [nleFormat, setNleFormat] = useState<'fcp-xml' | 'edl' | 'otio'>('fcp-xml')
  const [nleIncludeAssets, setNleIncludeAssets] = useState(false)
  const [nleExporting, setNleExporting] = useState(false)

  const compositionProps = useCompositionProps()
  const { width, height, fps, durationInFrames } = compositionProps

  // Initialize endTime when durationInFrames changes
  const totalDurationSec = durationInFrames / fps
  useEffect(() => {
    setEndTime(parseFloat(totalDurationSec.toFixed(1)))
  }, [totalDurationSec])

  // For GIF: cap resolution by max width instead of using the resolution scale
  const effectiveFps = fpsOverride > 0 ? fpsOverride : fps
  const baseExportWidth = Math.round(width * RESOLUTION_OPTIONS[resolution].scale)
  const baseExportHeight = Math.round(height * RESOLUTION_OPTIONS[resolution].scale)

  const exportWidth = format === 'gif'
    ? Math.min(baseExportWidth, gifMaxWidth)
    : baseExportWidth
  const exportHeight = format === 'gif'
    ? Math.round(baseExportHeight * (exportWidth / baseExportWidth))
    : baseExportHeight

  // Compute effective export range
  const exportStartFrame = useRangeExport ? Math.round(startTime * effectiveFps) : 0
  const exportEndFrame = useRangeExport ? Math.round(endTime * effectiveFps) : Math.round((durationInFrames / fps) * effectiveFps)
  const exportFrameCount = Math.max(1, exportEndFrame - exportStartFrame)

  const mp4Supported = useMemo(() => isMp4Supported(), [])

  const handleCopyFfmpegCommand = useCallback(() => {
    navigator.clipboard.writeText(FFMPEG_COMMAND).then(() => {
      setCopiedCommand(true)
      setTimeout(() => setCopiedCommand(false), 2000)
    })
  }, [])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setExportProgress(null)
    setDownloadUrl(null)
    setExportResult(null)

    // Create abort controller for cancellation
    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const effectiveFormat = transparentExport ? transparentFormat : format
      const exportOpts: import('@/services/videoExport').ExportOptions = {
          width: exportWidth,
          height: exportHeight,
          fps: effectiveFps,
          durationInFrames: exportFrameCount,
          startFrame: exportStartFrame,
          format: effectiveFormat,
          quality: QUALITY_OPTIONS[quality].value,
          alpha: transparentExport,
          ...(format === 'gif' && !transparentExport ? {
            gifSettings: {
              frameSkip: gifFrameSkip as number,
              maxWidth: gifMaxWidth,
              dithering: gifDithering,
              loop: gifLoop,
            },
          } : {}),
        }
      const result = await exportVideo(
        compositionProps,
        exportOpts,
        setExportProgress,
        abortController.signal,
      )

      setDownloadUrl(result.url)
      setExportResult(result)

      // Auto-save recording to library
      try {
        const resp = await fetch(result.url)
        const blob = await resp.blob()
        const projectId = useProjectStore.getState().currentProjectId
        const projectName = useProjectStore.getState().currentProjectName
        const recId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

        // Generate thumbnail from first frame
        let thumbnailBlob: Blob | undefined
        try {
          const video = document.createElement('video')
          video.src = result.url
          video.muted = true
          video.preload = 'auto'
          await new Promise<void>((res, rej) => {
            video.onloadeddata = () => res()
            video.onerror = () => rej()
            setTimeout(rej, 5000)
          })
          video.currentTime = 0
          await new Promise<void>((res) => {
            video.onseeked = () => res()
            setTimeout(res, 2000)
          })
          const canvas = document.createElement('canvas')
          canvas.width = 320
          canvas.height = Math.round(320 * (exportHeight / exportWidth))
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            thumbnailBlob = await new Promise<Blob | undefined>((res) =>
              canvas.toBlob((b) => res(b ?? undefined), 'image/jpeg', 0.7)
            )
          }
        } catch {
          // thumbnail generation failed, proceed without it
        }

        useRecordingsStore.getState().addRecording(
          {
            id: recId,
            name: `Export ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`,
            format: result.actualFormat as 'webm' | 'mp4' | 'gif',
            width: exportWidth,
            height: exportHeight,
            fps,
            durationSec: exportFrameCount / fps,
            fileSize: blob.size,
            createdAt: new Date().toISOString(),
            projectId,
            projectName,
            thumbnailUrl: null,
            videoUrl: null,
          },
          blob,
          thumbnailBlob,
        )
        setSavedRecordingId(recId)
      } catch {
        // Recording save failed silently — download still works
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — no error display needed
        return
      }
      setExportProgress({
        status: 'error',
        currentFrame: 0,
        totalFrames: exportFrameCount,
        percentage: 0,
        estimatedTimeRemaining: 0,
        error: err instanceof Error ? err.message : 'Export failed',
      })
    } finally {
      abortRef.current = null
      setIsExporting(false)
    }
  }, [compositionProps, exportWidth, exportHeight, effectiveFps, exportFrameCount, exportStartFrame, quality, format, gifFrameSkip, gifMaxWidth, gifDithering, gifLoop, transparentExport, transparentFormat])

  const handleNLEExport = useCallback(async () => {
    setNleExporting(true)
    try {
      let blob: Blob
      let ext: string
      if (nleIncludeAssets) {
        blob = await exportWithAssets(nleFormat)
        ext = 'zip'
      } else if (nleFormat === 'fcp-xml') {
        blob = await exportFCPXML()
        ext = getNLEFileExtension('fcp-xml')
      } else if (nleFormat === 'edl') {
        blob = await exportEDL()
        ext = getNLEFileExtension('edl')
      } else {
        blob = await exportOTIO()
        ext = getNLEFileExtension('otio')
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `autoanimation-timeline-${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[NLE Export] Failed:', err)
    } finally {
      setNleExporting(false)
    }
  }, [nleFormat, nleIncludeAssets])

  const handleDownload = useCallback(() => {
    if (!downloadUrl || !exportResult) return
    const ext = getFileExtension(exportResult.actualFormat)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `autoanimation-export-${Date.now()}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [downloadUrl, exportResult])

  const handleCancel = useCallback(() => {
    // Abort the export via AbortController
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsExporting(false)
    setExportProgress(null)
  }, [])

  const handleShare = useCallback(() => {
    if (!savedRecordingId) return
    useEditorStore.getState().setShareRecordingId(savedRecordingId)
    useEditorStore.getState().setShareModalOpen(true)
  }, [savedRecordingId])

  const exportDurationSec = exportFrameCount / effectiveFps
  const estimatedDuration = `${exportDurationSec.toFixed(1)}s`
  const estimatedSize = format === 'gif'
    ? `~${formatFileSize(exportWidth * exportHeight * exportDurationSec * 0.02 / gifFrameSkip)}`
    : `~${formatFileSize(exportWidth * exportHeight * exportDurationSec * QUALITY_OPTIONS[quality].value * 0.05)}`

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-0">
      {/* Left Column: Player & Stats */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div ref={compositionRef} className="bg-black/40 rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative group min-h-[300px] flex items-center justify-center">
          <CompositionPlayer
            ref={playerRef}
            component={VideoComposition as unknown as React.ComponentType<Record<string, unknown>>}
            inputProps={compositionProps as unknown as Record<string, unknown>}
            durationInFrames={Math.max(durationInFrames, 1)}
            fps={fps}
            compositionWidth={width}
            compositionHeight={height}
            style={{
              width: '100%',
              aspectRatio: `${width}/${height}`,
              maxHeight: 'calc(100vh - 350px)'
            }}
            controls
            autoPlay={false}
            loop
            initialFrame={0}
            clickToPlay
          />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-1.5 transition-colors hover:bg-white/[0.05]">
            <div className="flex items-center gap-2 text-zinc-500">
              <Clock size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Duration</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-white">{estimatedDuration}</span>
              {useRangeExport && <span className="text-[10px] text-zinc-500">/ {totalDurationSec.toFixed(1)}s</span>}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-1.5 transition-colors hover:bg-white/[0.05]">
            <div className="flex items-center gap-2 text-zinc-500">
              <Layers size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Frames</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-white">{exportFrameCount}</span>
              {useRangeExport && <span className="text-[10px] text-zinc-500">/ {durationInFrames}</span>}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-1.5 transition-colors hover:bg-white/[0.05]">
            <div className="flex items-center gap-2 text-zinc-500">
              <Box size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">FPS</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-white">{effectiveFps}</span>
              {fpsOverride > 0 && fpsOverride !== fps && <span className="text-[10px] text-zinc-500">/ {fps}</span>}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-1.5 transition-colors hover:bg-white/[0.05]">
            <div className="flex items-center gap-2 text-zinc-500">
              <HardDrive size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Est. Size</span>
            </div>
            <div>
              <span className="text-base font-bold text-white">{estimatedSize}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Settings */}
      <div className="w-full lg:w-[380px] lg:min-w-[380px] lg:shrink-0 flex flex-col bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl min-h-0">
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-8 custom-scrollbar">
          {/* Format Section */}
          <PanelSection title="Export Format" noBorder>
            <PanelButtonGroup
              options={FORMAT_OPTIONS_UI}
              value={format}
              onChange={(v) => setFormat(v as 'webm' | 'mp4' | 'gif')}
            />

            {format === 'mp4' && (
              <div className={cn(
                "mt-3 p-3 rounded-2xl text-[11px] leading-relaxed border animate-in fade-in slide-in-from-top-2 duration-300",
                mp4Supported
                  ? "bg-green-500/10 border-green-500/20 text-green-300/90"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-300/90"
              )}>
                <div className="flex gap-2">
                  {mp4Supported ? <Check size={14} className="shrink-0" /> : <Info size={14} className="shrink-0" />}
                  <div>
                    {mp4Supported
                      ? "Your browser supports native MP4 recording. Optimized for compatibility."
                      : "MP4 export is not natively supported in this browser. WebM will be used with conversion help."
                    }
                  </div>
                </div>
                {!mp4Supported && (
                  <button
                    onClick={handleCopyFfmpegCommand}
                    className="mt-2.5 flex items-center justify-center gap-2 w-full bg-amber-500/10 hover:bg-amber-500/20 py-2 rounded-xl transition-colors font-medium text-amber-400"
                  >
                    {copiedCommand ? <CheckCheck size={12} /> : <Copy size={12} />}
                    {copiedCommand ? 'Copied FFmpeg Command' : 'Copy FFmpeg Command'}
                  </button>
                )}
              </div>
            )}

            {format === 'gif' && (
              <div className="mt-3 space-y-4 p-4 bg-black/20 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex gap-2 text-[11px] text-amber-300/90">
                  <Info size={14} className="shrink-0 text-amber-400" />
                  <span>GIF does not support audio. Resolution is capped to keep file size manageable.</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Frame Skip</label>
                  <PanelButtonGroup
                    options={GIF_FRAME_SKIP_OPTIONS}
                    value={gifFrameSkip.toString()}
                    onChange={(v) => setGifFrameSkip(parseInt(v) as 1 | 2 | 3)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Max Width</label>
                  <PanelButtonGroup
                    options={GIF_MAX_WIDTH_OPTIONS}
                    value={gifMaxWidth.toString()}
                    onChange={(v) => setGifMaxWidth(parseInt(v))}
                  />
                </div>

                <PanelToggle
                  label="Dithering"
                  description="Better color gradients, slightly larger file"
                  checked={gifDithering}
                  onChange={setGifDithering}
                />

                <PanelToggle
                  label="Loop"
                  description="GIF plays continuously"
                  checked={gifLoop}
                  onChange={setGifLoop}
                />
              </div>
            )}
          </PanelSection>

          {/* Transparent Export Section */}
          <PanelSection title="Transparent Background" noBorder className="space-y-4">
            <PanelToggle
              label="Export with Alpha Channel"
              description="Remove background for overlay compositing"
              checked={transparentExport}
              onChange={setTransparentExport}
            />

            {transparentExport && (
              <div className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Format</label>
                  <PanelButtonGroup
                    options={[
                      { value: 'webm-alpha', label: 'VP9 WebM' },
                      { value: 'png-sequence', label: 'PNG Sequence' },
                    ]}
                    value={transparentFormat}
                    onChange={(v) => setTransparentFormat(v as 'webm-alpha' | 'png-sequence')}
                  />
                </div>
                <div className="flex gap-2 text-[11px] text-blue-300/90">
                  <Info size={14} className="shrink-0 text-blue-400 mt-0.5" />
                  <span>
                    {transparentFormat === 'webm-alpha'
                      ? 'VP9 WebM with alpha. Imports into After Effects, DaVinci, and Premiere.'
                      : 'PNG sequence in a ZIP. Universal NLE compatibility. Larger file size.'
                    }
                  </span>
                </div>
                <div className="flex gap-2 text-[10px] text-amber-300/80">
                  <AlertTriangle size={12} className="shrink-0 text-amber-400 mt-0.5" />
                  <span>Background color and background animations will be excluded. Audio is not included.</span>
                </div>
              </div>
            )}
          </PanelSection>

          {/* Resolution & Quality Section */}
          <PanelSection title="Output Quality" noBorder className="space-y-4">
            {format !== 'gif' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Resolution</label>
                <PanelButtonGroup
                  options={RESOLUTION_OPTIONS_UI}
                  value={resolution.toString()}
                  onChange={(v) => setResolution(parseInt(v))}
                />
                <div className="text-[10px] text-zinc-600 px-1 italic">
                  {exportWidth} x {exportHeight} px
                </div>

                {/* 8K memory warning */}
                {resolution === 0 && (
                  <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-300/90 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertTriangle size={14} className="shrink-0 text-red-400 mt-0.5" />
                    <span>8K export (7680x4320) requires 16GB+ RAM and a modern GPU. Each frame is ~132MB uncompressed. Export will be very slow on most hardware. Tiled rendering is used automatically.</span>
                  </div>
                )}

                {/* 4K memory warning */}
                {resolution === 1 && (
                  <div className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertTriangle size={14} className="shrink-0 text-amber-400 mt-0.5" />
                    <span>4K export requires significant memory. GPU acceleration is recommended. Export may be slow on older hardware.</span>
                  </div>
                )}
              </div>
            )}

            {format === 'gif' && (
              <div className="text-[10px] text-zinc-600 px-1 italic">
                Output: {exportWidth} x {exportHeight} px (capped by max width)
              </div>
            )}

            {format !== 'gif' && (
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Quality Preset</label>
                <PanelButtonGroup
                  options={QUALITY_OPTIONS_UI}
                  value={quality.toString()}
                  onChange={(v) => setQuality(parseInt(v))}
                />
              </div>
            )}

            {/* FPS Override */}
            {format !== 'gif' && (
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Export FPS</label>
                <PanelButtonGroup
                  options={EXPORT_FPS_OPTIONS}
                  value={fpsOverride.toString()}
                  onChange={(v) => setFpsOverride(parseInt(v))}
                />
                {fpsOverride > 0 && fpsOverride !== fps && (
                  <div className="text-[10px] text-zinc-500 px-1 italic">
                    Project: {fps} fps — Export: {fpsOverride} fps ({Math.round(exportFrameCount)} frames)
                  </div>
                )}
                {fpsOverride >= 120 && (
                  <div className="flex gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-300/90 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Info size={14} className="shrink-0 text-blue-400 mt-0.5" />
                    <span>120fps produces ultra-smooth motion. Export time and file size will be significantly larger.</span>
                  </div>
                )}
              </div>
            )}
          </PanelSection>

          {/* Time Range Section */}
          <PanelSection title="Export Range" noBorder className="space-y-4">
            <PanelToggle
              label="Use Custom Range"
              description="Export a specific segment"
              checked={useRangeExport}
              onChange={setUseRangeExport}
            />

            {useRangeExport && (
              <div className="space-y-4 p-4 bg-black/20 rounded-2xl border border-white/5 animate-in zoom-in-95 duration-200">
                <PanelSlider
                  label="Start"
                  value={startTime}
                  onChange={setStartTime}
                  min={0}
                  max={Math.max(0, endTime - 0.1)}
                  step={0.1}
                  precision={1}
                  suffix="s"
                  compact
                />

                <PanelSlider
                  label="End"
                  value={endTime}
                  onChange={setEndTime}
                  min={Math.max(0.1, startTime + 0.1)}
                  max={totalDurationSec}
                  step={0.1}
                  precision={1}
                  suffix="s"
                  compact
                />

                <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-green-500/40 rounded-full"
                    style={{
                      left: `${(startTime / totalDurationSec) * 100}%`,
                      width: `${((endTime - startTime) / totalDurationSec) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </PanelSection>

          {/* NLE Export Section */}
          <PanelSection title="Export for NLE" noBorder className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Timeline Format</label>
              <PanelButtonGroup
                options={[
                  { value: 'fcp-xml', label: 'FCP XML' },
                  { value: 'edl', label: 'EDL' },
                  { value: 'otio', label: 'OTIO' },
                ]}
                value={nleFormat}
                onChange={(v) => setNleFormat(v as 'fcp-xml' | 'edl' | 'otio')}
              />
              <div className="text-[10px] text-zinc-600 px-1 italic">
                {nleFormat === 'fcp-xml' && 'Premiere Pro, DaVinci Resolve, Final Cut Pro'}
                {nleFormat === 'edl' && 'CMX 3600 — basic cuts-only interchange'}
                {nleFormat === 'otio' && 'OpenTimelineIO — DaVinci 18+, emerging standard'}
              </div>
            </div>

            <PanelToggle
              label="Include Media Assets"
              description="Bundle audio/video files into a ZIP"
              checked={nleIncludeAssets}
              onChange={setNleIncludeAssets}
            />

            <PanelActionButton
              variant="secondary"
              onClick={handleNLEExport}
              loading={nleExporting}
              icon={FileText}
              fullWidth
            >
              {nleExporting ? 'Exporting...' : `Export ${nleFormat.toUpperCase()}`}
            </PanelActionButton>
          </PanelSection>

          {/* Fallback Notice */}
          {exportResult?.didFallback && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
              <div className="flex gap-2">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <p className="text-[11px] text-amber-200/90 leading-relaxed font-medium">
                  MP4 was not supported. Video exported as WebM. Use FFmpeg to convert if needed.
                </p>
              </div>
              <button
                onClick={handleCopyFfmpegCommand}
                className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs rounded-xl transition-all"
              >
                <Copy size={12} /> Copy FFmpeg Command
              </button>
            </div>
          )}
        </div>

        {/* Progress & Actions Footer */}
        <div className="mt-8 pt-6 border-t border-white/5 space-y-5 shrink-0">
          {exportProgress && exportProgress.status !== 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className={cn(
                  exportProgress?.status === 'error' ? 'text-red-400' :
                    exportProgress?.status === 'complete' ? 'text-green-400' :
                      'text-zinc-400'
                )}>
                  {exportProgress?.status === 'preparing' && 'Preparing Assets...'}
                  {exportProgress?.status === 'rendering' && `Rendering: ${exportProgress.currentFrame}/${exportProgress.totalFrames}`}
                  {exportProgress?.status === 'encoding' && 'Finalizing Video...'}
                  {exportProgress?.status === 'complete' && 'Export Complete'}
                  {exportProgress?.status === 'error' && 'Export Failed'}
                </span>
                {exportProgress?.status === 'rendering' && (
                  <span className="text-zinc-500">~{exportProgress.estimatedTimeRemaining}s</span>
                )}
              </div>

              <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300 relative overflow-hidden",
                    exportProgress?.status === 'error' ? 'bg-red-500' :
                      exportProgress?.status === 'complete' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]' :
                        'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                  )}
                  style={{ width: `${exportProgress?.percentage ?? 0}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>

              {exportProgress?.status === 'error' && (
                <p className="text-[10px] text-red-400/80 italic text-center px-2">{exportProgress.error}</p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {downloadUrl ? (
              <>
                <PanelActionButton
                  variant="primary"
                  onClick={handleDownload}
                  icon={Download}
                  fullWidth
                  className="h-12 text-base shadow-glow-green"
                >
                  Download {(exportResult?.actualFormat || format).toUpperCase()}
                </PanelActionButton>
                {savedRecordingId && (
                  <PanelActionButton
                    variant="secondary"
                    onClick={handleShare}
                    icon={Share2}
                    className="h-12 px-5"
                  >
                    <></>
                  </PanelActionButton>
                )}
              </>
            ) : (
              <>
                <PanelActionButton
                  variant="primary"
                  onClick={handleExport}
                  loading={isExporting}
                  icon={Film}
                  fullWidth
                  className="h-12 text-base shadow-glow-green"
                >
                  {isExporting ? 'Exporting...' : transparentExport ? `Export ${transparentFormat === 'webm-alpha' ? 'WebM Alpha' : 'PNG Seq'}` : `Export ${format.toUpperCase()}`}
                </PanelActionButton>
                {isExporting && (
                  <PanelActionButton
                    variant="secondary"
                    onClick={handleCancel}
                    icon={X}
                    className="h-12 px-5"
                  >
                    <></>
                  </PanelActionButton>
                )}
              </>
            )}
          </div>

          <p className="text-[10px] text-zinc-600 text-center leading-relaxed italic">
            {format === 'gif'
              ? 'GIF for sharing on Discord, Slack, email. No audio.'
              : format === 'webm'
                ? 'WebM offers high quality with smaller file sizes.'
                : mp4Supported
                  ? 'Standard MP4 format using native browser encoding.'
                  : 'MP4 not native. Will export as WebM with conversion help.'
            }
          </p>
        </div>

        {/* Thumbnails Section */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <ThumbnailPanel />
        </div>
      </div>
    </div>
  )
}
