/**
 * Build export data for animations, videos, media, text overlays, shapes,
 * HTML templates, background audio, captions, and keyframes.
 */

import type {
  AnimationData,
  VideoLayerData,
  MediaLayerData,
  TextOverlayData,
  ShapeLayerData,
  HTMLTemplateExportData,
  BackgroundAudioData,
  CaptionData,
  KeyframeExportData,
  DialogueCharacterData,
} from '@/remotion/types'
import type { WordEvent } from '@/types/voice'
import type { CompositionContext } from './compositionTypes'
import { fontWeightMap } from './compositionTypes'

// ── Animations ──

export function buildAnimations(ctx: CompositionContext): AnimationData[] {
  return ctx.activeAnimations.map((a) => {
    const lib = ctx.libraryMap.get(a.animationId)
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
    }
  })
}

// ── Videos ──

export function buildVideos(ctx: CompositionContext): VideoLayerData[] {
  return ctx.canvasVideos
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
    }))
}

// ── Media Items ──

export function buildMediaItems(
  ctx: CompositionContext,
  durationInFrames: number,
): MediaLayerData[] {
  return ctx.mediaCanvasItems
    .filter((item) => {
      const asset = ctx.mediaAssetMap.get(item.assetId)
      return asset && item.visible
    })
    .map((item) => {
      const asset = ctx.mediaAssetMap.get(item.assetId)!
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
    })
}

// ── Text Overlays ──

export function buildTextOverlays(
  ctx: CompositionContext,
  durationInFrames: number,
): TextOverlayData[] {
  return ctx.textOverlays
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
      textShadow: o.textShadow,
      webkitTextStroke: o.webkitTextStroke,
      opacity: o.opacity,
      zIndex: o.zIndex,
      rotation: o.rotation,
      width: o.width,
      height: o.height,
      startFrame: o.startFrame ?? 0,
      endFrame: o.endFrame ?? durationInFrames,
    }))
}

// ── Shapes ──

export function buildShapes(ctx: CompositionContext): ShapeLayerData[] {
  return ctx.shapes
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
    }))
}

// ── HTML Templates ──

export function buildHTMLTemplates(ctx: CompositionContext): HTMLTemplateExportData[] {
  return ctx.htmlTemplates
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
    }))
}

// ── Background Audio ──

export function buildBackgroundAudio(ctx: CompositionContext): BackgroundAudioData[] {
  return ctx.mediaCanvasItems
    .filter((item) => {
      const asset = ctx.mediaAssetMap.get(item.assetId)
      return asset && asset.category === 'audio' && item.visible && !item.muted
    })
    .map((item) => {
      const asset = ctx.mediaAssetMap.get(item.assetId)!
      return {
        id: item.id,
        url: asset.url,
        startFrame: item.startFrame,
        endFrame: item.endFrame,
        volume: item.volume ?? 1,
        fadeInFrames: item.fadeInFrames ?? 0,
        fadeOutFrames: item.fadeOutFrames ?? 0,
        loop: item.loop ?? false,
      }
    })
}

// ── Keyframe Data ──

export function buildKeyframeData(ctx: CompositionContext): KeyframeExportData | undefined {
  if (ctx.keyframeTracks.length === 0) return undefined
  return {
    tracks: ctx.keyframeTracks.map((t) => ({
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
}

// ── Captions ──

export function buildCaptions(
  ctx: CompositionContext,
  dialogueCharactersData: DialogueCharacterData[] | undefined,
): CaptionData {
  const {
    captionStyle,
    captionFontSize,
    captionPosition,
    captionPresetId,
    wordTimeline,
    sentenceTimeline,
    dialogueLines,
  } = ctx

  // For multi-character dialogue, build combined captions from dialogue lines
  if (dialogueCharactersData && dialogueCharactersData.length > 0) {
    const combinedWordTimeline = dialogueCharactersData.flatMap((dc) =>
      dc.dialogueLines.flatMap((line) =>
        (line.visemeTimeline.length > 0 ? dialogueLines : [])
          .filter((dl) => dl.id === line.id)
          .flatMap((dl) =>
            (dl.wordTimeline || []).map((w: WordEvent) => ({
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
        const lineWords = (dlSource?.wordTimeline || []).map((w: WordEvent) => ({
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
      presetId: captionPresetId || undefined,
    }
  }

  return {
    style: captionStyle,
    fontSize: captionFontSize,
    position: captionPosition,
    wordTimeline,
    sentenceTimeline,
    presetId: captionPresetId || undefined,
  }
}
