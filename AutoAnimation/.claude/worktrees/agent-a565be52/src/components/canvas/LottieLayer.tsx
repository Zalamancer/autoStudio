import { useEffect, useRef, useCallback, memo } from 'react'
import lottie from 'lottie-web'
import type { AnimationItem as LottieAnimationItem } from 'lottie-web'
import type { ActiveAnimation } from '@/stores/useAnimationStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import JSZip from 'jszip'

// Cache extracted animation JSON to avoid repeated fetches
const dotLottieCache = new Map<string, object>()

/** Fetch a .lottie (dotLottie zip) URL and extract the animation JSON */
async function loadDotLottie(url: string): Promise<object> {
  const cached = dotLottieCache.get(url)
  if (cached) return cached

  const res = await fetch(url)
  const buf = await res.arrayBuffer()
  const zip = await JSZip.loadAsync(buf)

  // dotLottie spec: manifest.json lists animations; first animation is default
  const manifestFile = zip.file('manifest.json')
  if (manifestFile) {
    const manifest = JSON.parse(await manifestFile.async('string'))
    const firstAnim = manifest.animations?.[0]
    if (firstAnim?.id) {
      const animFile = zip.file(`animations/${firstAnim.id}.json`)
      if (animFile) {
        const json = JSON.parse(await animFile.async('string'))
        dotLottieCache.set(url, json)
        return json
      }
    }
  }

  // Fallback: find any .json file in the zip
  const jsonFiles = zip.filter((_, file) => file.name.endsWith('.json') && file.name !== 'manifest.json')
  if (jsonFiles.length > 0) {
    const json = JSON.parse(await jsonFiles[0].async('string'))
    dotLottieCache.set(url, json)
    return json
  }

  throw new Error('No animation JSON found in .lottie file')
}

// ── Shared wrapper + selection overlay ──

interface AnimationWrapperProps {
  activeAnimation: ActiveAnimation
  canvasWidth: number
  canvasHeight: number
  isSelected: boolean
  onSelect: () => void
  children: React.ReactNode
}

function AnimationWrapper({ activeAnimation, canvasWidth, canvasHeight, isSelected, onSelect, children }: AnimationWrapperProps) {
  const { position, scale, opacity, zIndex } = activeAnimation

  return (
    <div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        width: canvasWidth,
        height: canvasHeight,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        opacity,
        zIndex,
        pointerEvents: 'none',
      }}
    >
      {children}
      {/* Clickable overlay for selection */}
      <div
        data-canvas-element="animation"
        className="absolute inset-0 cursor-pointer"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      />
      {/* Selection ring */}
      {isSelected && (
        <div
          className="absolute inset-0 ring-2 ring-blue-500 rounded pointer-events-none"
        />
      )}
    </div>
  )
}

// ── SVG Animation Renderer (iframe with postMessage bridge) ──

const SVGAnimationRenderer = memo(function SVGAnimationRenderer({
  activeAnimation,
  canvasWidth,
  canvasHeight,
  svgHtml,
  isSelected,
  onSelect,
}: {
  activeAnimation: ActiveAnimation
  canvasWidth: number
  canvasHeight: number
  svgHtml: string
  isSelected: boolean
  onSelect: () => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)
  const isPlaying = useTimelineStore((s) => s.isPlaying)

  const postMsg = useCallback((msg: Record<string, unknown>) => {
    if (readyRef.current && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*')
    }
  }, [])

  // Listen for SVG_ANIM_READY
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SVG_ANIM_READY' && e.source === iframeRef.current?.contentWindow) {
        readyRef.current = true
        // Sync initial state
        if (!(isPlaying && activeAnimation.isPlaying)) {
          iframeRef.current?.contentWindow?.postMessage({ type: 'ANIM_PAUSE' }, '*')
        }
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'ANIM_SET_SPEED', speed: activeAnimation.speed },
          '*',
        )
      }
    }
    window.addEventListener('message', handler)
    return () => {
      window.removeEventListener('message', handler)
      readyRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAnimation.animationId])

  // Play/pause sync
  useEffect(() => {
    postMsg({ type: isPlaying && activeAnimation.isPlaying ? 'ANIM_PLAY' : 'ANIM_PAUSE' })
  }, [isPlaying, activeAnimation.isPlaying, postMsg])

  // Speed sync
  useEffect(() => {
    postMsg({ type: 'ANIM_SET_SPEED', speed: activeAnimation.speed })
  }, [activeAnimation.speed, postMsg])

  // Frame-range visibility
  useEffect(() => {
    let rafId: number
    let wasVisible = true
    const wrapperEl = iframeRef.current?.parentElement

    const startFrame = activeAnimation.startFrame ?? 0
    const endFrame = activeAnimation.endFrame ?? Infinity

    const check = () => {
      const frame = useTimelineStore.getState().currentFrame
      const visible = frame >= startFrame && frame < endFrame

      if (visible !== wasVisible) {
        if (wrapperEl) {
          wrapperEl.style.display = visible ? '' : 'none'
        }
        if (!visible) {
          postMsg({ type: 'ANIM_PAUSE' })
        } else if (useTimelineStore.getState().isPlaying && activeAnimation.isPlaying) {
          postMsg({ type: 'ANIM_PLAY' })
        }
        wasVisible = visible
      }
      rafId = requestAnimationFrame(check)
    }

    rafId = requestAnimationFrame(check)
    return () => cancelAnimationFrame(rafId)
  }, [activeAnimation.startFrame, activeAnimation.endFrame, activeAnimation.isPlaying, postMsg])

  return (
    <AnimationWrapper
      activeAnimation={activeAnimation}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <iframe
        ref={iframeRef}
        srcDoc={svgHtml}
        sandbox="allow-scripts"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          background: 'transparent',
          pointerEvents: 'none',
        }}
        title="SVG Animation"
      />
    </AnimationWrapper>
  )
})

// ── Lottie Renderer (existing lottie-web path) ──

const LottieRenderer = memo(function LottieRenderer({
  activeAnimation,
  canvasWidth,
  canvasHeight,
  libraryItem,
  isSelected,
  onSelect,
}: {
  activeAnimation: ActiveAnimation
  canvasWidth: number
  canvasHeight: number
  libraryItem: { animationData?: object; url: string }
  isSelected: boolean
  onSelect: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<LottieAnimationItem | null>(null)
  const isPlaying = useTimelineStore((s) => s.isPlaying)

  const hasInlineData = !!libraryItem.animationData
  const libraryUrl = libraryItem.url

  // Load lottie-web animation
  useEffect(() => {
    if (!containerRef.current) return
    if (!hasInlineData && !libraryUrl) return

    let cancelled = false

    const init = async () => {
      try {
        let animConfig: Parameters<typeof lottie.loadAnimation>[0]

        if (hasInlineData) {
          const lib = useAnimationStore.getState().library
          const item = lib.find((a) => a.id === activeAnimation.animationId)
          if (!item?.animationData) return
          animConfig = {
            container: containerRef.current!,
            renderer: 'svg',
            loop: activeAnimation.loop,
            autoplay: activeAnimation.isPlaying,
            animationData: JSON.parse(JSON.stringify(item.animationData)),
          }
        } else if (libraryUrl.endsWith('.lottie')) {
          const animationData = await loadDotLottie(libraryUrl)
          if (cancelled) return
          animConfig = {
            container: containerRef.current!,
            renderer: 'svg',
            loop: activeAnimation.loop,
            autoplay: activeAnimation.isPlaying,
            animationData: JSON.parse(JSON.stringify(animationData)),
          }
        } else {
          animConfig = {
            container: containerRef.current!,
            renderer: 'svg',
            loop: activeAnimation.loop,
            autoplay: activeAnimation.isPlaying,
            path: libraryUrl,
          }
        }

        const anim = lottie.loadAnimation(animConfig)
        animRef.current = anim
        anim.setSpeed(activeAnimation.speed)
      } catch (err) {
        console.warn('[LottieLayer] Failed to load animation:', libraryUrl, err)
      }
    }

    init()

    return () => {
      cancelled = true
      if (animRef.current) {
        animRef.current.destroy()
        animRef.current = null
      }
    }
  }, [activeAnimation.animationId, hasInlineData, libraryUrl, activeAnimation.loop])

  // Sync play/pause
  useEffect(() => {
    const anim = animRef.current
    if (!anim) return
    if (isPlaying && activeAnimation.isPlaying) {
      anim.play()
    } else {
      anim.pause()
    }
  }, [isPlaying, activeAnimation.isPlaying])

  // Speed
  useEffect(() => {
    animRef.current?.setSpeed(activeAnimation.speed)
  }, [activeAnimation.speed])

  // Frame-range visibility
  useEffect(() => {
    let rafId: number
    let wasVisible = true

    const startFrame = activeAnimation.startFrame ?? 0
    const endFrame = activeAnimation.endFrame ?? Infinity

    const check = () => {
      const frame = useTimelineStore.getState().currentFrame
      const visible = frame >= startFrame && frame < endFrame

      if (visible !== wasVisible) {
        if (containerRef.current) {
          containerRef.current.style.display = visible ? '' : 'none'
        }
        const anim = animRef.current
        if (anim) {
          if (!visible) {
            anim.pause()
          } else if (useTimelineStore.getState().isPlaying && activeAnimation.isPlaying) {
            anim.play()
          }
        }
        wasVisible = visible
      }
      rafId = requestAnimationFrame(check)
    }

    rafId = requestAnimationFrame(check)
    return () => cancelAnimationFrame(rafId)
  }, [activeAnimation.startFrame, activeAnimation.endFrame, activeAnimation.isPlaying])

  return (
    <AnimationWrapper
      activeAnimation={activeAnimation}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </AnimationWrapper>
  )
})

// ── Main LottieLayer: branches on svgHtml vs lottie-web ──

interface LottieLayerProps {
  activeAnimation: ActiveAnimation
  canvasWidth: number
  canvasHeight: number
}

export const LottieLayer = memo(function LottieLayer({ activeAnimation, canvasWidth, canvasHeight }: LottieLayerProps) {
  const library = useAnimationStore((s) => s.library)
  const selectedActiveId = useAnimationStore((s) => s.selectedActiveId)
  const setSelectedActiveId = useAnimationStore((s) => s.setSelectedActiveId)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const libraryItem = library.find((a) => a.id === activeAnimation.animationId)
  const isSelected = selectedActiveId === activeAnimation.id

  if (!libraryItem) return null

  const handleSelect = () => {
    setSelectedActiveId(activeAnimation.id)
    setRightPanelTab('animation-properties')
  }

  // SVG+CSS animation → iframe
  if (libraryItem.svgHtml) {
    return (
      <SVGAnimationRenderer
        activeAnimation={activeAnimation}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        svgHtml={libraryItem.svgHtml}
        isSelected={isSelected}
        onSelect={handleSelect}
      />
    )
  }

  // Lottie animation → lottie-web
  return (
    <LottieRenderer
      activeAnimation={activeAnimation}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      libraryItem={{ animationData: libraryItem.animationData, url: libraryItem.url }}
      isSelected={isSelected}
      onSelect={handleSelect}
    />
  )
})

// Container for all Lottie layers
interface LottieLayersProps {
  canvasWidth: number
  canvasHeight: number
  type: 'background' | 'overlay'
}

export function LottieLayers({ canvasWidth, canvasHeight, type }: LottieLayersProps) {
  const activeAnimations = useAnimationStore((s) => s.activeAnimations)
  const library = useAnimationStore((s) => s.library)

  // Filter animations by type only — frame-range visibility handled per-child via RAF
  const filteredAnimations = activeAnimations.filter((active) => {
    const libraryItem = library.find((a) => a.id === active.animationId)
    return libraryItem?.category === type
  })

  if (filteredAnimations.length === 0) return null

  return (
    <>
      {filteredAnimations.map((animation) => (
        <LottieLayer
          key={animation.id}
          activeAnimation={animation}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      ))}
    </>
  )
}
