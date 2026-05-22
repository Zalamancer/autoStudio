import { useRef, useEffect } from 'react'
import { useFrame } from '@/engine'
import { computeParticlesAtFrame, drawParticlesOnCanvas } from '@/services/particleEngine'
import type { ParticleEmitterExportData } from './types'

interface RemotionParticleLayerProps {
  particleEmitters: ParticleEmitterExportData[]
  canvasWidth: number
  canvasHeight: number
}

export function RemotionParticleLayer({
  particleEmitters,
  canvasWidth,
  canvasHeight,
}: RemotionParticleLayerProps) {
  const frame = useFrame()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    for (const emitter of particleEmitters) {
      if (!emitter.visible) continue
      if (frame < emitter.startFrame || frame >= emitter.endFrame) continue

      const { particles } = computeParticlesAtFrame(
        emitter,
        frame,
        canvasWidth,
        canvasHeight,
      )

      drawParticlesOnCanvas(ctx, particles, emitter.preset)
    }
  }, [frame, particleEmitters, canvasWidth, canvasHeight])

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
}
