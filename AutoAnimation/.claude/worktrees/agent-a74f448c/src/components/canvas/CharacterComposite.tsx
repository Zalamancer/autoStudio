import React, { useRef, useState, useCallback, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCanvasStore, useCharacterPartsStore, useCharacterConfigStore, useTimelineStore, useVoiceStore, getEyeVariantSprite, getEyebrowVariantSprite, hasEyeVariants, hasEyebrowVariants } from '@/stores'
import { useRigStore } from '@/stores/useRigStore'
import { RiggedCharacterCanvas } from './RiggedCharacterCanvas'
import type { SerializedRigData } from '@bonerigging/core'
import { getCurvatureFromEmotion } from '@/services/emotionMapping'
import type { Viseme } from '@/types/voice'
import type { MouthCurvature } from '@/types/nanoBanana'
import { useKeyframeRecorder } from '@/hooks/useKeyframeRecorder'
import { SelectionTransformBox, type LiveTransformValues } from './SelectionTransformBox'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { resolveVisemeSprite } from '@/services/visemeMapper'
import { getComposedFilterStyle } from '@/services/boilingLineEffect'
import { getPixelatedFromCache, preCachePixelArt, clearPixelArtCache, pixelateCanvasToOverlay } from '@/services/pixelArtEffect'
import { getEffectFromCache, preCacheEffect, clearEffectCache, processEffectOverlay, getAnimatedSeed, isEffectEnabled } from '@/services/effects/effectDispatcher'
import { isSVGFilterEffect, getStyleEffectFilterStyle } from '@/services/styleEffectFilters'

interface CharacterCompositeProps {
  isSelected: boolean
  containerWidth?: number
  containerHeight?: number
}

export const CharacterComposite = React.memo(function CharacterComposite({
  isSelected,
}: CharacterCompositeProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const visemeImgRefA = useRef<HTMLImageElement>(null)
  const visemeImgRefB = useRef<HTMLImageElement>(null)
  const activeVisemeSlot = useRef<'A' | 'B'>('A')
  const eyeImgRef = useRef<HTMLImageElement>(null)
  const eyebrowImgRef = useRef<HTMLImageElement>(null)
  const [bounds, setBounds] = useState({ width: 128, height: 160, offsetX: 0, offsetY: 0 })
  const [imagesLoaded, setImagesLoaded] = useState(0)
  const handleImageLoad = useCallback(() => setImagesLoaded((c) => c + 1), [])

  const { selectCharacter } = useCanvasStore()
  const { transforms, updateTransform, selectedSprites, layerOrder, renderMode, rigId, showBones } = useCharacterPartsStore()
  const savedImages = useCharacterConfigStore((state) => state.savedImages)
  const { recordIfEnabled } = useKeyframeRecorder()
  const { setLiveTransform, clearLiveTransform } = useLiveTransformStore()

  // Auto-switch to rigged mode when a rig with valid serialized data exists
  const activeRigId = useRigStore((s) => s.activeRigId)
  const rigHasData = useRigStore((s) => {
    const rid = s.activeRigId
    return !!rid && !!s.rigs[rid]?.boneriggingSerializedData
  })
  useEffect(() => {
    if (rigHasData && activeRigId && (renderMode !== 'rigged' || rigId !== activeRigId)) {
      const partsStore = useCharacterPartsStore.getState()
      partsStore.setRenderMode('rigged')
      partsStore.setRigId(activeRigId)
    }
  }, [rigHasData, activeRigId, renderMode, rigId])

  // Subscribe to isPlaying but NOT currentFrame to avoid re-renders
  const isPlaying = useTimelineStore((s) => s.isPlaying)
  const fps = useTimelineStore((s) => s.fps)
  const { activeVoiceId, activeVisemeTimeline } = useVoiceStore()

  const groupTransform = transforms.group

  // Get sprite arrays
  const visemeImages = savedImages?.viseme || []
  const eyeImages = savedImages?.eye || []
  const eyebrowImages = savedImages?.eyebrow || []
  const hairImages = savedImages?.hair || []
  const bodyImages = savedImages?.body || []
  const headImages = savedImages?.head || []
  const shirtImages = savedImages?.shirt || []
  const pantsImages = savedImages?.pants || []
  const shoesImages = savedImages?.shoes || []

  const manualVisemeSprite = selectedSprites.viseme !== null ? visemeImages[selectedSprites.viseme] : null
  const eyeSprite = selectedSprites.eye !== null ? eyeImages[selectedSprites.eye] : null
  const eyebrowSprite = selectedSprites.eyebrow !== null ? eyebrowImages[selectedSprites.eyebrow] : null
  const hairSprite = selectedSprites.hair !== null ? hairImages[selectedSprites.hair] : null
  const bodySprite = selectedSprites.body !== null ? bodyImages[selectedSprites.body] : null
  const headSprite = selectedSprites.head !== null ? headImages[selectedSprites.head] : null
  const shirtSprite = selectedSprites.shirt !== null ? shirtImages[selectedSprites.shirt] : null
  const pantsSprite = selectedSprites.pants !== null ? pantsImages[selectedSprites.pants] : null
  const shoesSprite = selectedSprites.shoes !== null ? shoesImages[selectedSprites.shoes] : null

  // Use first sprite if none selected but sprites exist
  const displayEye = eyeSprite || (eyeImages.length > 0 ? eyeImages[0] : null)
  const displayEyebrow = eyebrowSprite || (eyebrowImages.length > 0 ? eyebrowImages[0] : null)
  const displayHair = hairSprite || (hairImages.length > 0 ? hairImages[0] : null)
  const displayBody = bodySprite || (bodyImages.length > 0 ? bodyImages[0] : null)
  const displayHead = headSprite || (headImages.length > 0 ? headImages[0] : null)
  const displayShirt = shirtSprite || (shirtImages.length > 0 ? shirtImages[0] : null)
  const displayPants = pantsSprite || (pantsImages.length > 0 ? pantsImages[0] : null)
  const displayShoes = shoesSprite || (shoesImages.length > 0 ? shoesImages[0] : null)

  // Check if we have curved visemes (27-sprite system) — subscribed for reactivity
  const useCurvedVisemes = useCharacterConfigStore((state) => state.useCurvedVisemes)
  const curvedVisemes = useCharacterConfigStore((state) => state.curvedVisemes)
  const visemeSpriteMap = useCharacterConfigStore((state) => state.visemeSpriteMap)
  const visemeMapping = useCharacterConfigStore((state) => state.visemeMapping)

  // Derive sprite availability from subscribed state (reactive)
  const hasCurvedSprites = useCurvedVisemes && Object.values(curvedVisemes).some(v => v !== null)
  const hasVisemeSpriteMap = visemeSpriteMap && Object.values(visemeSpriteMap).some(v => v !== null)

  // Get static viseme sprite (for when not playing)
  // Priority: manual selection → curved REST → visemeSpriteMap REST → first viseme image
  const staticVisemeSprite = manualVisemeSprite
    ? manualVisemeSprite
    : hasCurvedSprites
      ? (curvedVisemes['neutral_Rest'] || null)
      : hasVisemeSpriteMap
        ? (visemeSpriteMap['neutral_Rest' as keyof typeof visemeSpriteMap] || visemeSpriteMap['upward_Rest' as keyof typeof visemeSpriteMap] || visemeSpriteMap['downward_Rest' as keyof typeof visemeSpriteMap] || Object.values(visemeSpriteMap).find(v => v !== null) || null)
        : (visemeImages.length > 0 ? visemeImages[0] : null)

  // Unified viseme sprite resolver — uses 3-tier map when available
  const getVisemeSpriteForFrame = useCallback((viseme: Viseme, curvature: MouthCurvature): string | null => {
    return resolveVisemeSprite(viseme, curvature, visemeSpriteMap, curvedVisemes, visemeImages, visemeMapping)
  }, [visemeSpriteMap, curvedVisemes, visemeImages, visemeMapping])

  // Lip sync animation loop - runs independently of React render cycle
  // Supports both 8-sprite (legacy) and 24-sprite (emotion-aware) systems via resolveVisemeSprite
  useEffect(() => {
    const hasLegacySprites = visemeImages.length > 0
    const hasAnyVisemes = hasLegacySprites || hasCurvedSprites || hasVisemeSpriteMap

    if (!isPlaying || !activeVoiceId || !hasAnyVisemes) {
      // Reset both viseme refs to static sprite when not playing
      const resetSrc = staticVisemeSprite || resolveVisemeSprite('Rest', 'neutral', visemeSpriteMap, curvedVisemes, visemeImages, visemeMapping)
      if (resetSrc) {
        if (visemeImgRefA.current) {
          visemeImgRefA.current.style.transition = 'none'
          visemeImgRefA.current.src = resetSrc
          visemeImgRefA.current.style.opacity = '1'
        }
        if (visemeImgRefB.current) {
          visemeImgRefB.current.style.transition = 'none'
          visemeImgRefB.current.src = resetSrc
          visemeImgRefB.current.style.opacity = '0'
        }
        activeVisemeSlot.current = 'A'
      }
      return
    }

    let animationId: number
    let lastSpriteKey = ''
    let debugLogCount = 0

    console.log('[Viseme] RAF loop STARTED. Timeline has', activeVisemeTimeline.length, 'events')

    const updateViseme = () => {
      // Get current frame directly from store (not via subscription)
      const currentFrame = useTimelineStore.getState().currentFrame

      // Find current viseme from timeline
      const event = activeVisemeTimeline.find(
        (e) => currentFrame >= e.startFrame && currentFrame < e.endFrame
      )
      const currentViseme: Viseme = (event?.viseme as Viseme) || 'Rest'

      // Get curvature from emotion timeline (works for both curved and map-based)
      const currentEmotion = useVoiceStore.getState().getEmotionAtFrame(currentFrame)
      const curvature = getCurvatureFromEmotion(currentEmotion)

      const spriteKey = `${curvature}_${currentViseme}`

      // Only update DOM if sprite key changed
      if (spriteKey !== lastSpriteKey) {
        let newSrc = getVisemeSpriteForFrame(currentViseme, curvature)

        // DEBUG: Log every sprite change (first 30 only to avoid spam)
        if (debugLogCount < 30) {
          console.log(`[Viseme] frame=${currentFrame} ${lastSpriteKey} → ${spriteKey} src=${newSrc ? 'YES' : 'NULL'}`)
          debugLogCount++
        }

        if (newSrc) {
          // Apply style effect via sync cache lookup (RAF-safe)
          const ps = useCharacterPartsStore.getState()
          const ase = ps.activeStyleEffect
          if (ase && ase.settings?.enabled) {
            const seed = getAnimatedSeed(currentFrame, ase)
            newSrc = getEffectFromCache(newSrc, ase, seed) || newSrc
          } else if (ps.pixelArt?.enabled) {
            newSrc = getPixelatedFromCache(newSrc, ps.pixelArt) || newSrc
          }
          const transitionMs = useCharacterConfigStore.getState().visemeTransitionMs
          const incoming = activeVisemeSlot.current === 'A' ? visemeImgRefB : visemeImgRefA
          const outgoing = activeVisemeSlot.current === 'A' ? visemeImgRefA : visemeImgRefB
          if (incoming.current) {
            incoming.current.src = newSrc
            incoming.current.style.transition = `opacity ${transitionMs}ms ease-in-out`
            incoming.current.style.opacity = '1'
          }
          if (outgoing.current) {
            outgoing.current.style.transition = `opacity ${transitionMs}ms ease-in-out`
            outgoing.current.style.opacity = '0'
          }
          activeVisemeSlot.current = activeVisemeSlot.current === 'A' ? 'B' : 'A'
        }
        lastSpriteKey = spriteKey
      }

      // Continue loop if still playing
      if (useTimelineStore.getState().isPlaying) {
        animationId = requestAnimationFrame(updateViseme)
      }
    }

    animationId = requestAnimationFrame(updateViseme)

    return () => {
      cancelAnimationFrame(animationId)
      // Reset both viseme refs to static sprite when stopping
      const resetSrc = staticVisemeSprite || resolveVisemeSprite('Rest', 'neutral', visemeSpriteMap, curvedVisemes, visemeImages, visemeMapping)
      if (resetSrc) {
        if (visemeImgRefA.current) {
          visemeImgRefA.current.style.transition = 'none'
          visemeImgRefA.current.src = resetSrc
          visemeImgRefA.current.style.opacity = '1'
        }
        if (visemeImgRefB.current) {
          visemeImgRefB.current.style.transition = 'none'
          visemeImgRefB.current.src = resetSrc
          visemeImgRefB.current.style.opacity = '0'
        }
        activeVisemeSlot.current = 'A'
      }
    }
  }, [isPlaying, activeVoiceId, activeVisemeTimeline, visemeImages, staticVisemeSprite, getVisemeSpriteForFrame, fps, useCurvedVisemes, curvedVisemes, visemeSpriteMap, visemeMapping])

  // Eye/eyebrow expression animation loop - swaps eye & eyebrow sprites based on emotion timeline
  // Uses direct DOM manipulation (same pattern as viseme lip sync) to avoid React re-renders
  useEffect(() => {
    const eyeAvailable = hasEyeVariants()
    const eyebrowAvailable = hasEyebrowVariants()

    if (!isPlaying || !activeVoiceId || (!eyeAvailable && !eyebrowAvailable)) {
      // Reset to default sprites when not playing
      if (eyeImgRef.current && displayEye) {
        eyeImgRef.current.src = displayEye
      }
      if (eyebrowImgRef.current && displayEyebrow) {
        eyebrowImgRef.current.src = displayEyebrow
      }
      return
    }

    let animationId: number
    let lastEmotion = ''

    const updateExpression = () => {
      const currentFrame = useTimelineStore.getState().currentFrame
      const currentEmotion = useVoiceStore.getState().getEmotionAtFrame(currentFrame)

      // Only update DOM if emotion changed
      if (currentEmotion !== lastEmotion) {
        const ps = useCharacterPartsStore.getState()
        const ase = ps.activeStyleEffect
        const pa = ps.pixelArt
        const applySrc = (src: string): string => {
          if (ase && ase.settings?.enabled) {
            const seed = getAnimatedSeed(currentFrame, ase)
            return getEffectFromCache(src, ase, seed) || src
          }
          if (pa?.enabled) return getPixelatedFromCache(src, pa) || src
          return src
        }
        if (eyeImgRef.current && eyeAvailable) {
          let eyeSrc = getEyeVariantSprite(currentEmotion)
          if (eyeSrc) {
            eyeSrc = applySrc(eyeSrc)
            if (eyeImgRef.current.src !== eyeSrc) eyeImgRef.current.src = eyeSrc
          } else if (displayEye) {
            const fallback = applySrc(displayEye)
            if (eyeImgRef.current.src !== fallback) eyeImgRef.current.src = fallback
          }
        }
        if (eyebrowImgRef.current && eyebrowAvailable) {
          let eyebrowSrc = getEyebrowVariantSprite(currentEmotion)
          if (eyebrowSrc) {
            eyebrowSrc = applySrc(eyebrowSrc)
            if (eyebrowImgRef.current.src !== eyebrowSrc) eyebrowImgRef.current.src = eyebrowSrc
          } else if (displayEyebrow) {
            const fallback = applySrc(displayEyebrow)
            if (eyebrowImgRef.current.src !== fallback) eyebrowImgRef.current.src = fallback
          }
        }
        lastEmotion = currentEmotion
      }

      if (useTimelineStore.getState().isPlaying) {
        animationId = requestAnimationFrame(updateExpression)
      }
    }

    animationId = requestAnimationFrame(updateExpression)

    return () => {
      cancelAnimationFrame(animationId)
      if (eyeImgRef.current && displayEye) {
        eyeImgRef.current.src = displayEye
      }
      if (eyebrowImgRef.current && displayEyebrow) {
        eyebrowImgRef.current.src = displayEyebrow
      }
    }
  }, [isPlaying, activeVoiceId, displayEye, displayEyebrow])

  // Check if any parts have sprites (or if in rigged mode, the mesh renderer provides content)
  const isRigged = renderMode === 'rigged' && !!rigId
  const hasAnySprites = isRigged || displayEye || displayEyebrow || staticVisemeSprite || displayHair || displayBody || displayHead || displayShirt || displayPants || displayShoes

  // Calculate bounding box from ALL child elements (union of all layers)
  // Each layer may be offset via CSS transform, so we measure every child's
  // getBoundingClientRect and compute the min/max extents relative to the
  // content container's own origin.
  useEffect(() => {
    if (!contentRef.current) return

    const container = contentRef.current
    const children = container.children
    if (children.length === 0) return

    const containerRect = container.getBoundingClientRect()

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement
      const childRect = child.getBoundingClientRect()
      if (childRect.width === 0 && childRect.height === 0) continue

      // Get child bounds relative to the container's top-left
      const relLeft = childRect.left - containerRect.left
      const relTop = childRect.top - containerRect.top
      const relRight = relLeft + childRect.width
      const relBottom = relTop + childRect.height

      minX = Math.min(minX, relLeft)
      minY = Math.min(minY, relTop)
      maxX = Math.max(maxX, relRight)
      maxY = Math.max(maxY, relBottom)
    }

    if (minX < Infinity) {
      const totalWidth = maxX - minX
      const totalHeight = maxY - minY
      if (totalWidth > 0 && totalHeight > 0) {
        setBounds({
          width: Math.ceil(totalWidth),
          height: Math.ceil(totalHeight),
          offsetX: Math.round(minX),
          offsetY: Math.round(minY),
        })
      }
    }
  }, [displayEye, displayEyebrow, staticVisemeSprite, displayHair, displayBody, displayHead, displayShirt, displayPants, displayShoes, transforms, imagesLoaded])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      selectCharacter('composite')
    },
    [selectCharacter]
  )

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateTransform('group', { visible: false })
    selectCharacter(null)
  }

  // Moveable: natural (unscaled) pixel dimensions
  const baseWidth = hasAnySprites ? bounds.width : 128
  const baseHeight = hasAnySprites ? bounds.height : 160
  // Scaled pixel dimensions (what Moveable sees)
  const displayWidth = baseWidth * groupTransform.scaleX
  const displayHeight = baseHeight * groupTransform.scaleY

  // Moveable: live transform handler
  const handleLiveTransform = useCallback(
    (values: LiveTransformValues) => {
      setLiveTransform({
        type: 'media',
        id: 'composite',
        x: values.left + values.width / 2,
        y: values.top + values.height / 2,
        rotation: Math.round(values.rotation),
        scale: values.width / baseWidth,
      })
    },
    [setLiveTransform, baseWidth]
  )

  // Moveable: commit transform on drag/resize/rotate end
  const handleTransformEnd = useCallback(
    () => {
      const el = layerRef.current
      if (!el) return

      clearLiveTransform()

      const finalLeft = parseFloat(el.style.left) || 0
      const finalTop = parseFloat(el.style.top) || 0
      const finalWidth = el.offsetWidth

      // Read rotation from CSS transform
      const transformStr = el.style.transform || ''
      const rotateMatch = transformStr.match(/rotate\(([^)]+)deg\)/)
      const newRotation = rotateMatch ? Math.round(parseFloat(rotateMatch[1])) : (groupTransform.rotation || 0)

      // Convert top-left pixel position back to center coordinates
      const centerX = Math.round(finalLeft + finalWidth / 2)
      const centerY = Math.round(finalTop + el.offsetHeight / 2)

      // Scale factor from resize (compare to natural/unscaled base size)
      const newScaleX = Math.max(0.01, finalWidth / baseWidth)
      const newScaleY = Math.max(0.01, el.offsetHeight / baseHeight)

      const prevX = groupTransform.x
      const prevY = groupTransform.y

      updateTransform('group', {
        x: centerX,
        y: centerY,
        rotation: newRotation,
        scaleX: newScaleX,
        scaleY: newScaleY,
      })

      recordIfEnabled(
        { objectType: 'character', objectId: 'group' },
        { x: centerX, y: centerY },
        { x: prevX, y: prevY }
      )
    },
    [clearLiveTransform, baseWidth, baseHeight, groupTransform, updateTransform, recordIfEnabled]
  )

  // Boiling line + SVG style effect — imperatively cycle filter seed via RAF (single-character mode)
  // Composes both filter strings into one CSS filter property.
  const boilingLine = useCharacterPartsStore((s) => s.boilingLine)
  const svgStyleEffectForFilter = useCharacterPartsStore((s) => {
    const fx = s.activeStyleEffect
    return fx && fx.settings?.enabled && isSVGFilterEffect(fx.type) ? fx : undefined
  })
  useEffect(() => {
    const hasBoil = boilingLine?.enabled
    const hasSvgFx = !!svgStyleEffectForFilter
    if (!hasBoil && !hasSvgFx) {
      if (layerRef.current) layerRef.current.style.filter = ''
      return
    }
    let rafId: number
    let lastFilterStyle = ''
    const update = () => {
      const frame = useTimelineStore.getState().currentFrame
      const parts: string[] = []
      if (hasSvgFx) parts.push(getStyleEffectFilterStyle(frame, svgStyleEffectForFilter!))
      if (hasBoil) parts.push(getComposedFilterStyle(frame, boilingLine!))
      const filterStyle = parts.filter(Boolean).join(' ')
      if (filterStyle !== lastFilterStyle) {
        if (layerRef.current) layerRef.current.style.filter = filterStyle
        lastFilterStyle = filterStyle
      }
      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(rafId)
      if (layerRef.current) layerRef.current.style.filter = ''
    }
  }, [boilingLine, svgStyleEffectForFilter])

  // Pixel art / Canvas 2D effect — pre-cache all sprites when settings change
  // SVG-filter effects skip this entirely (handled via CSS filter on wrapper div).
  const pixelArt = useCharacterPartsStore((s) => s.pixelArt)
  const activeStyleEffect = useCharacterPartsStore((s) => s.activeStyleEffect)
  const hasStyleEffect = isEffectEnabled(activeStyleEffect)
  const hasSvgFilterEffect = hasStyleEffect && isSVGFilterEffect(activeStyleEffect!.type)
  const hasCanvasEffect = hasStyleEffect && !hasSvgFilterEffect
  const [pixelCacheTick, setPixelCacheTick] = useState(0)
  useEffect(() => {
    const hasPA = pixelArt?.enabled
    if (!hasPA && !hasCanvasEffect) { setPixelCacheTick(0); return }
    // Gather ALL possible sprite sources (including curved visemes and viseme sprite map)
    const configState = useCharacterConfigStore.getState()
    const sources = [
      displayBody, displayHead, displayShirt, displayPants, displayShoes,
      displayEye, displayEyebrow, displayHair, staticVisemeSprite,
      ...visemeImages,
      ...Object.values(configState.curvedVisemes || {}).filter(Boolean),
      ...Object.values(configState.visemeSpriteMap || {}).filter(Boolean),
    ].filter((s): s is string => !!s)
    if (hasCanvasEffect) {
      clearEffectCache(activeStyleEffect!.type)
      preCacheEffect(sources, activeStyleEffect!).then(() => setPixelCacheTick((t) => t + 1)).catch(() => {})
    } else if (hasPA) {
      clearPixelArtCache()
      preCachePixelArt(sources, pixelArt).then(() => setPixelCacheTick((t) => t + 1)).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixelArt?.enabled, pixelArt?.pixelSize, pixelArt?.colorLevels, pixelArt?.outline, activeStyleEffect])

  /** Get effective src: style-effected (from cache) or original.
   *  SVG-filter effects return the original src — the CSS filter handles the visual. */
  const getEffectiveSrc = useCallback((src: string | null): string | null => {
    if (!src) return src
    if (hasCanvasEffect) {
      const seed = getAnimatedSeed(useTimelineStore.getState().currentFrame, activeStyleEffect!)
      return getEffectFromCache(src, activeStyleEffect!, seed) || src
    }
    if (pixelArt?.enabled) return getPixelatedFromCache(src, pixelArt) || src
    return src
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixelArt, activeStyleEffect, pixelCacheTick])

  // Canvas overlay for rigged mode (pixel art or Canvas 2D style effects only).
  // SVG-filter effects are handled via CSS filter on wrapper div — no overlay needed.
  const effectOverlayRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const hasOverlay = isRigged && (pixelArt?.enabled || hasCanvasEffect)
    if (!hasOverlay || !contentRef.current) {
      if (effectOverlayRef.current) effectOverlayRef.current.style.display = 'none'
      return
    }
    let rafId: number
    const OVERLAY_ATTR = 'data-effect-overlay'
    const RIG_CANVAS_SELECTOR = `canvas:not([${OVERLAY_ATTR}])`
    const update = () => {
      const container = contentRef.current
      if (!container) { rafId = requestAnimationFrame(update); return }
      const rigCanvas = container.querySelector(RIG_CANVAS_SELECTOR) as HTMLCanvasElement | null
      if (!rigCanvas || rigCanvas.width === 0) { rafId = requestAnimationFrame(update); return }

      if (!effectOverlayRef.current) {
        const overlay = document.createElement('canvas')
        overlay.setAttribute(OVERLAY_ATTR, 'true')
        overlay.style.position = 'absolute'
        overlay.style.inset = '0'
        overlay.style.width = '100%'
        overlay.style.height = '100%'
        overlay.style.pointerEvents = 'none'
        overlay.style.imageRendering = 'pixelated'
        overlay.style.zIndex = '999'
        container.appendChild(overlay)
        effectOverlayRef.current = overlay
      }

      const overlay = effectOverlayRef.current
      overlay.style.display = ''
      let applied = false
      if (hasCanvasEffect) {
        const seed = getAnimatedSeed(useTimelineStore.getState().currentFrame, activeStyleEffect!)
        applied = processEffectOverlay(rigCanvas, overlay, activeStyleEffect!, seed)
      } else {
        applied = pixelateCanvasToOverlay(rigCanvas, overlay, pixelArt!)
      }
      rigCanvas.style.opacity = applied ? '0' : ''

      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(rafId)
      const container = contentRef.current
      if (container) {
        const rigCanvas = container.querySelector(RIG_CANVAS_SELECTOR) as HTMLCanvasElement | null
        if (rigCanvas) rigCanvas.style.opacity = ''
      }
      if (effectOverlayRef.current) {
        effectOverlayRef.current.style.display = 'none'
      }
    }
  }, [isRigged, pixelArt?.enabled, pixelArt?.pixelSize, pixelArt?.colorLevels, pixelArt?.outline, activeStyleEffect])

  if (!groupTransform.visible) return null

  return (
    <>
    <div
      ref={layerRef}
      data-canvas-element="character"
      onClick={handleClick}
      className="absolute cursor-move select-none"
      style={{
        left: groupTransform.x - displayWidth / 2,
        top: groupTransform.y - displayHeight / 2,
        width: displayWidth,
        height: displayHeight,
        transform: groupTransform.rotation !== 0 ? `rotate(${groupTransform.rotation}deg)` : undefined,
        overflow: 'visible',
      }}
    >
      {/* Character Parts Container — layer order driven by store */}
      {/* Scaled inner wrapper: sprites render at natural size, CSS scale fills the Moveable-managed outer div */}
      <div
        ref={contentRef}
        className="relative inline-block"
        style={{
          marginLeft: hasAnySprites ? `${-bounds.offsetX}px` : undefined,
          marginTop: hasAnySprites ? `${-bounds.offsetY}px` : undefined,
          transform: `scale(${groupTransform.scaleX}, ${groupTransform.scaleY})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Character Parts Container — 8 layers rendered in dynamic order */}
        {(() => {
          // Map part names to their display sprites and refs
          const pixelArtStyle = pixelArt?.enabled ? 'pixelated' as const : undefined
          const staticSpriteMap: Record<string, string | null> = {
            body: getEffectiveSrc(displayBody),
            head: getEffectiveSrc(displayHead),
            shirt: getEffectiveSrc(displayShirt),
            pants: getEffectiveSrc(displayPants),
            shoes: getEffectiveSrc(displayShoes),
            eye: getEffectiveSrc(displayEye),
            eyebrow: getEffectiveSrc(displayEyebrow),
            hair: getEffectiveSrc(displayHair),
          }
          const refMap: Record<string, React.RefObject<HTMLImageElement | null>> = {
            eye: eyeImgRef,
            eyebrow: eyebrowImgRef,
          }

          // In rigged mode, get rig data for body replacement
          let serializedData: SerializedRigData | null = null
          if (renderMode === 'rigged' && rigId) {
            const rigData = useRigStore.getState().rigs[rigId]
            if (rigData?.boneriggingSerializedData) {
              try {
                serializedData = JSON.parse(rigData.boneriggingSerializedData) as SerializedRigData
              } catch { /* parse error */ }
            }
          }

          return layerOrder.map((part, idx) => {
            const t = transforms[part]
            if (!t.visible) return null
            const isFirst = idx === 0

            // Body: rigged mode uses RiggedCharacterCanvas; sprite mode uses <img>
            if (part === 'body') {
              if (renderMode === 'rigged' && rigId && serializedData) {
                return (
                  <div
                    key="body"
                    className={cn('max-w-none pointer-events-none', 'absolute top-0 left-0')}
                    style={{
                      transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scaleX}, ${t.scaleY})`,
                      transformOrigin: 'center center',
                      zIndex: idx,
                    }}
                  >
                    <RiggedCharacterCanvas
                      data={serializedData}
                      width={bounds.width}
                      height={bounds.height}
                      showBones={showBones}
                      isPlaying={isPlaying}
                      loop={true}
                    />
                  </div>
                )
              }
              if (!displayBody) return null
              return (
                <img
                  key="body"
                  src={getEffectiveSrc(displayBody) || displayBody}
                  alt="Body"
                  onLoad={handleImageLoad}
                  className={cn('max-w-none pointer-events-none', isFirst ? 'block' : 'absolute top-0 left-0')}
                  draggable={false}
                  style={{
                    transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scaleX}, ${t.scaleY})`,
                    transformOrigin: 'center center',
                    zIndex: idx,
                    imageRendering: pixelArtStyle,
                  }}
                />
              )
            }

            // Viseme: cross-fade dual-image rendering
            if (part === 'viseme' && staticVisemeSprite) {
              const effectiveVisemeSrc = getEffectiveSrc(staticVisemeSprite) || staticVisemeSprite
              return (
                <React.Fragment key="viseme">
                  <img
                    ref={visemeImgRefA}
                    src={effectiveVisemeSrc}
                    alt="Viseme"
                    className="absolute top-0 left-0 max-w-none pointer-events-none"
                    draggable={false}
                    style={{
                      transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scaleX}, ${t.scaleY})`,
                      transformOrigin: 'center center',
                      zIndex: idx,
                      opacity: 1,
                      imageRendering: pixelArtStyle,
                    }}
                  />
                  <img
                    ref={visemeImgRefB}
                    src={effectiveVisemeSrc}
                    alt="Viseme"
                    className="absolute top-0 left-0 max-w-none pointer-events-none"
                    draggable={false}
                    style={{
                      transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scaleX}, ${t.scaleY})`,
                      transformOrigin: 'center center',
                      zIndex: idx,
                      opacity: 0,
                      imageRendering: pixelArtStyle,
                    }}
                  />
                </React.Fragment>
              )
            }

            // All other parts: static sprite with optional ref (eye/eyebrow get refs for animation)
            const sprite = staticSpriteMap[part]
            if (!sprite) return null
            const ref = refMap[part]
            return (
              <img
                key={part}
                ref={ref}
                src={sprite}
                alt={part.charAt(0).toUpperCase() + part.slice(1)}
                onLoad={handleImageLoad}
                className={cn('max-w-none pointer-events-none', isFirst ? 'block' : 'absolute top-0 left-0')}
                draggable={false}
                style={{
                  transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scaleX}, ${t.scaleY})`,
                  transformOrigin: 'center center',
                  zIndex: idx,
                  imageRendering: pixelArtStyle,
                }}
              />
            )
          })
        })()}

        {/* Placeholder if no sprites (only in sprite mode) */}
        {!hasAnySprites && (
          <div className="w-32 h-40 bg-gradient-to-b from-zinc-600 to-zinc-700 rounded-lg flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-zinc-500 rounded-full mb-2" />
            <span className="text-xs text-zinc-400">Character</span>
            <span className="text-[10px] text-zinc-500 mt-1">Add sprites</span>
          </div>
        )}
      </div>

      {/* Remove Button — centered above the rotate handle */}
      {isSelected && (
        <button
          onClick={handleRemove}
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-9 h-9 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg z-10"
        >
          <X size={18} />
        </button>
      )}
    </div>

    {/* Moveable control box — same as other canvas items */}
    {isSelected && (
      <SelectionTransformBox
        targetRef={layerRef}
        onTransformEnd={handleTransformEnd}
        onLiveTransform={handleLiveTransform}
        keepRatio={true}
        color="#4a7eff"
      />
    )}
    </>
  )
})
