/**
 * Frame-exact Lottie / SVG animation renderer for Remotion export.
 *
 * Lottie path: uses lottie-web's canvas renderer with goToAndStop()
 * SVG+CSS path: uses iframe with ANIM_PAUSE + ANIM_SEEK for frame-accurate export
 */
import { useEffect, useRef, useCallback } from 'react'
import { useFrame, useComposition } from '@/engine'
import lottie from 'lottie-web'
import type { AnimationItem as LottieAnimationItem } from 'lottie-web'
import type { AnimationData } from './types'

interface RemotionLottieLayerProps {
  animations: AnimationData[]
  canvasWidth: number
  canvasHeight: number
}

export const RemotionLottieLayer = ({
  animations,
  canvasWidth,
  canvasHeight,
}: RemotionLottieLayerProps) => {
  if (animations.length === 0) return null

  return (
    <>
      {animations.map((anim) =>
        anim.svgHtml ? (
          <RemotionSVGAnimItem
            key={anim.id}
            animation={anim}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
        ) : (
          <RemotionLottieItem
            key={anim.id}
            animation={anim}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
        ),
      )}
    </>
  )
}

// ── SVG+CSS Animation Item (iframe with seek) ──

function RemotionSVGAnimItem({
  animation,
  canvasWidth,
  canvasHeight,
}: {
  animation: AnimationData
  canvasWidth: number
  canvasHeight: number
}) {
  const frame = useFrame()
  const { fps } = useComposition()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)

  const postMsg = useCallback((msg: Record<string, unknown>) => {
    if (readyRef.current && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*')
    }
  }, [])

  // Wait for iframe to signal ready
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SVG_ANIM_READY' && e.source === iframeRef.current?.contentWindow) {
        readyRef.current = true
        // Immediately pause — frame seeking controls playback
        iframeRef.current?.contentWindow?.postMessage({ type: 'ANIM_PAUSE' }, '*')
      }
    }

    window.addEventListener('message', handler)
    return () => {
      window.removeEventListener('message', handler)
      readyRef.current = false
    }
   
  }, [animation.id])

  // Seek to exact time on every Remotion frame
  useEffect(() => {
    if (!readyRef.current) return
    const timeInSeconds = (frame / fps) * animation.speed
    postMsg({ type: 'ANIM_SEEK', time: timeInSeconds })
  }, [frame, fps, animation.speed, postMsg])

  return (
    <div
      style={{
        position: 'absolute',
        left: animation.position.x,
        top: animation.position.y,
        width: canvasWidth,
        height: canvasHeight,
        transform: `scale(${animation.scale})`,
        transformOrigin: 'top left',
        opacity: animation.opacity,
        zIndex: animation.zIndex,
      }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={animation.svgHtml}
        sandbox="allow-scripts"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          background: 'transparent',
        }}
        title="SVG Animation"
      />
    </div>
  )
}

// ── Lottie Animation Item (existing lottie-web path) ──

function RemotionLottieItem({
  animation,
  canvasWidth,
  canvasHeight,
}: {
  animation: AnimationData
  canvasWidth: number
  canvasHeight: number
}) {
  const frame = useFrame()
  const { fps } = useComposition()
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<LottieAnimationItem | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current) return
    if (!animation.animationData && !animation.url) return

    const config: Parameters<typeof lottie.loadAnimation>[0] = animation.animationData
      ? {
          container: containerRef.current,
          renderer: 'svg',
          loop: false,
          autoplay: false,
          animationData: JSON.parse(JSON.stringify(animation.animationData)),
        }
      : {
          container: containerRef.current,
          renderer: 'svg',
          loop: false,
          autoplay: false,
          path: animation.url,
        }

    const anim = lottie.loadAnimation(config)

    anim.addEventListener('DOMLoaded', () => {
      loadedRef.current = true
    })

    animRef.current = anim

    return () => {
      anim.destroy()
      animRef.current = null
      loadedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animation.id, animation.url])

  // Seek to exact frame
  useEffect(() => {
    const anim = animRef.current
    if (!anim || !loadedRef.current) return

    const totalLottieFrames = anim.totalFrames
    const lottieFrameRate = anim.frameRate || 30
    const lottieDuration = totalLottieFrames / lottieFrameRate

    const timeInSeconds = frame / fps
    const animTimeSeconds = timeInSeconds * animation.speed

    let lottieFrame: number
    if (animation.loop) {
      const lottieTime = animTimeSeconds % lottieDuration
      lottieFrame = (lottieTime / lottieDuration) * totalLottieFrames
    } else {
      lottieFrame = Math.min(
        (animTimeSeconds / lottieDuration) * totalLottieFrames,
        totalLottieFrames - 1
      )
    }

    anim.goToAndStop(Math.max(0, lottieFrame), true)
  }, [frame, fps, animation.speed, animation.loop])

  return (
    <div
      style={{
        position: 'absolute',
        left: animation.position.x,
        top: animation.position.y,
        width: canvasWidth,
        height: canvasHeight,
        transform: `scale(${animation.scale})`,
        transformOrigin: 'top left',
        opacity: animation.opacity,
        zIndex: animation.zIndex,
      }}
    >
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
