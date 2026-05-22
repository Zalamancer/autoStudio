import { useRef, useEffect, memo } from 'react'
import { useParticleStore } from '@/stores/useParticleStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { computeParticlesAtFrame, drawParticlesOnCanvas } from '@/services/particleEngine'

interface ParticleLayerProps {
  canvasWidth: number
  canvasHeight: number
}

export const ParticleLayer = memo(function ParticleLayer({
  canvasWidth,
  canvasHeight,
}: ParticleLayerProps) {
  const emitters = useParticleStore((s) => s.emitters)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true

    function tick() {
      if (!running || !ctx) return

      const currentFrame = usePlaybackStore.getState().currentFrame
      const currentEmitters = useParticleStore.getState().emitters

      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      for (const emitter of currentEmitters) {
        if (!emitter.visible) continue
        if (currentFrame < emitter.startFrame || currentFrame >= emitter.endFrame) continue

        const { particles } = computeParticlesAtFrame(
          emitter,
          currentFrame,
          canvasWidth,
          canvasHeight,
        )

        drawParticlesOnCanvas(ctx, particles, emitter.preset)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [canvasWidth, canvasHeight, emitters])

  if (emitters.length === 0) return null

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        zIndex: 9,
        pointerEvents: 'none',
      }}
    />
  )
})
