import { useRef, useEffect, useCallback, memo } from 'react'
import { useAudioReactiveStore, getFrequencyData, getTimeDomainData, generateSimulatedFrequencyData } from '@/stores/useAudioReactiveStore'
import type { AudioReactiveVisualizer } from '@/stores/useAudioReactiveStore'
import { useEditorStore } from '@/stores'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { SelectionTransformBox, type LiveTransformValues } from './SelectionTransformBox'
import { useFrameVisibility } from '@/hooks/useFrameVisibility'
import { useKeyframeRecorder } from '@/hooks/useKeyframeRecorder'
import { useTimelineStore } from '@/stores'

interface AudioReactiveLayerProps {
  canvasWidth: number
  canvasHeight: number
}

export function AudioReactiveLayer({ canvasWidth: _canvasWidth, canvasHeight: _canvasHeight }: AudioReactiveLayerProps) {
  const visualizers = useAudioReactiveStore((s) => s.visualizers)
  const selectedVisualizerId = useAudioReactiveStore((s) => s.selectedVisualizerId)
  const setSelectedVisualizerId = useAudioReactiveStore((s) => s.setSelectedVisualizerId)
  const updateVisualizer = useAudioReactiveStore((s) => s.updateVisualizer)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  if (visualizers.length === 0) return null

  return (
    <>
      {visualizers.map((viz) => {
        if (!viz.visible) return null
        const isSelected = selectedVisualizerId === viz.id
        return (
          <AudioReactiveCanvasItem
            key={viz.id}
            visualizer={viz}
            isSelected={isSelected}
            onSelect={() => {
              setSelectedVisualizerId(viz.id)
              setRightPanelTab('audio-reactive-properties')
            }}
            onUpdate={(updates) => updateVisualizer(viz.id, updates)}
          />
        )
      })}
    </>
  )
}

interface AudioReactiveCanvasItemProps {
  visualizer: AudioReactiveVisualizer
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<AudioReactiveVisualizer>) => void
}

const AudioReactiveCanvasItem = memo(function AudioReactiveCanvasItem({
  visualizer,
  isSelected,
  onSelect,
  onUpdate,
}: AudioReactiveCanvasItemProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)
  const { recordIfEnabled } = useKeyframeRecorder()

  // Zero-re-render frame-range visibility
  useFrameVisibility(targetRef, visualizer.startFrame, visualizer.endFrame)

  // Animation loop: draw visualizer to canvas every frame
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const { currentFrame } = useTimelineStore.getState()

      // Try live audio data first, fall back to simulated
      let frequencyData = getFrequencyData()
      let timeDomainData = getTimeDomainData()

      if (!frequencyData) {
        frequencyData = generateSimulatedFrequencyData(currentFrame)
      }
      if (!timeDomainData) {
        // Generate simulated waveform (centered at 128)
        const simulated = new Uint8Array(128)
        for (let i = 0; i < 128; i++) {
          const t = currentFrame * 0.1 + i * 0.05
          simulated[i] = 128 + Math.sin(t) * 40 + Math.sin(t * 2.7) * 20
        }
        timeDomainData = simulated
      }

      renderVisualizer(ctx, visualizer, frequencyData, timeDomainData)
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [visualizer])

  const handleLiveTransform = useCallback(
    (values: LiveTransformValues) => {
      setLiveTransform({
        type: 'audio-reactive' as any,
        id: visualizer.id,
        x: values.left,
        y: values.top,
        rotation: Math.round(values.rotation),
        scale: values.width / visualizer.width,
      })
    },
    [visualizer.id, visualizer.width, setLiveTransform]
  )

  const handleTransformEnd = useCallback(
    (state: { translate: [number, number]; width: number; height: number; rotate: number }) => {
      const el = targetRef.current
      if (!el) return

      clearLiveTransform()

      const finalLeft = parseFloat(el.style.left) || visualizer.position.x
      const finalTop = parseFloat(el.style.top) || visualizer.position.y
      const finalWidth = el.offsetWidth
      const finalHeight = el.offsetHeight

      onUpdate({
        position: { x: finalLeft, y: finalTop },
        width: finalWidth,
        height: finalHeight,
        rotation: Math.round(state.rotate),
      })

      recordIfEnabled(
        { objectType: 'audio-reactive', objectId: visualizer.id },
        {
          x: finalLeft,
          y: finalTop,
          width: finalWidth,
          height: finalHeight,
          rotation: Math.round(state.rotate),
          opacity: visualizer.opacity,
        },
        {
          x: visualizer.position.x,
          y: visualizer.position.y,
          width: visualizer.width,
          height: visualizer.height,
          rotation: visualizer.rotation,
          opacity: visualizer.opacity,
        }
      )
    },
    [
      visualizer.id,
      visualizer.position.x,
      visualizer.position.y,
      visualizer.width,
      visualizer.height,
      visualizer.rotation,
      visualizer.opacity,
      onUpdate,
      clearLiveTransform,
      recordIfEnabled,
    ]
  )

  const style: React.CSSProperties = {
    position: 'absolute',
    left: visualizer.position.x,
    top: visualizer.position.y,
    width: visualizer.width,
    height: visualizer.height,
    opacity: visualizer.opacity,
    zIndex: visualizer.zIndex,
    cursor: 'move',
  }

  if (visualizer.rotation !== 0) {
    style.transform = `rotate(${visualizer.rotation}deg)`
  }

  return (
    <>
      <div
        ref={targetRef}
        style={style}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <canvas
          ref={canvasRef}
          width={visualizer.width}
          height={visualizer.height}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        />
      </div>

      {isSelected && (
        <SelectionTransformBox
          targetRef={targetRef}
          onTransformEnd={handleTransformEnd}
          onLiveTransform={handleLiveTransform}
          keepRatio={false}
          color="#f59e0b"
        />
      )}
    </>
  )
})

// ── Rendering functions ──

function renderVisualizer(
  ctx: CanvasRenderingContext2D,
  viz: AudioReactiveVisualizer,
  frequencyData: Uint8Array,
  timeDomainData: Uint8Array,
) {
  const { width, height } = viz
  ctx.clearRect(0, 0, width, height)

  switch (viz.type) {
    case 'bars':
      drawBars(ctx, viz, frequencyData)
      break
    case 'waveform':
      drawWaveform(ctx, viz, timeDomainData)
      break
    case 'pulse':
      drawPulse(ctx, viz, frequencyData)
      break
    case 'circular':
      drawCircular(ctx, viz, frequencyData)
      break
    case 'spectrum':
      drawSpectrum(ctx, viz, frequencyData)
      break
  }
}

function getVisualizerColor(viz: AudioReactiveVisualizer, ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): string | CanvasGradient {
  if (!viz.useGradient || viz.gradientColors.length < 2) return viz.color

  const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
  const stops = viz.gradientColors.length
  viz.gradientColors.forEach((c, i) => {
    gradient.addColorStop(i / (stops - 1), c)
  })
  return gradient
}

function sampleFrequencyBins(data: Uint8Array, binCount: number, minFreq: number, maxFreq: number, sensitivity: number): number[] {
  const nyquist = 22050 // approximate Nyquist frequency
  const startBin = Math.floor((minFreq / nyquist) * data.length)
  const endBin = Math.min(data.length - 1, Math.ceil((maxFreq / nyquist) * data.length))
  const range = endBin - startBin

  const result: number[] = []
  for (let i = 0; i < binCount; i++) {
    const binStart = startBin + Math.floor((i / binCount) * range)
    const binEnd = startBin + Math.floor(((i + 1) / binCount) * range)
    let sum = 0
    let count = 0
    for (let j = binStart; j <= binEnd && j < data.length; j++) {
      sum += data[j]
      count++
    }
    const avg = count > 0 ? sum / count : 0
    result.push((avg / 255) * sensitivity)
  }
  return result
}

function drawBars(ctx: CanvasRenderingContext2D, viz: AudioReactiveVisualizer, data: Uint8Array) {
  const { width, height, barCount, barWidth, barGap, barRadius, minAmplitude, maxAmplitude, mirrorY } = viz
  const bins = sampleFrequencyBins(data, barCount, viz.minFrequency, viz.maxFrequency, viz.sensitivity)

  const totalBarSpace = barCount * barWidth + (barCount - 1) * barGap
  const startX = (width - totalBarSpace) / 2
  const fill = getVisualizerColor(viz, ctx, 0, height, 0, 0)

  ctx.fillStyle = fill

  for (let i = 0; i < barCount; i++) {
    const amplitude = Math.max(minAmplitude, Math.min(maxAmplitude, bins[i]))
    const barHeight = amplitude * height * 0.8
    const x = startX + i * (barWidth + barGap)

    if (mirrorY) {
      // Mirror from center
      const halfBar = barHeight / 2
      const y = height / 2 - halfBar
      roundRect(ctx, x, y, barWidth, barHeight, barRadius)
    } else {
      // Bottom-aligned
      const y = height - barHeight
      roundRect(ctx, x, y, barWidth, barHeight, barRadius)
    }
  }

  if (viz.mirrorX) {
    // Draw mirrored copy
    ctx.save()
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
    ctx.fillStyle = fill

    for (let i = 0; i < barCount; i++) {
      const amplitude = Math.max(minAmplitude, Math.min(maxAmplitude, bins[i]))
      const barHeight = amplitude * height * 0.8
      const x = startX + i * (barWidth + barGap)

      if (mirrorY) {
        const halfBar = barHeight / 2
        const y = height / 2 - halfBar
        roundRect(ctx, x, y, barWidth, barHeight, barRadius)
      } else {
        const y = height - barHeight
        roundRect(ctx, x, y, barWidth, barHeight, barRadius)
      }
    }
    ctx.restore()
  }
}

function drawWaveform(ctx: CanvasRenderingContext2D, viz: AudioReactiveVisualizer, data: Uint8Array) {
  const { width, height, lineWidth, fillBelow, sensitivity } = viz

  const stroke = getVisualizerColor(viz, ctx, 0, 0, width, 0)

  ctx.beginPath()
  ctx.strokeStyle = stroke as string
  ctx.lineWidth = lineWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  const sliceWidth = width / data.length

  for (let i = 0; i < data.length; i++) {
    const v = (data[i] / 128.0 - 1.0) * sensitivity
    const y = height / 2 + v * height * 0.4
    const x = i * sliceWidth

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.stroke()

  if (fillBelow) {
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    const fillColor = getVisualizerColor(viz, ctx, 0, 0, 0, height)
    ctx.fillStyle = fillColor
    ctx.globalAlpha = 0.3
    ctx.fill()
    ctx.globalAlpha = 1.0
  }
}

function drawPulse(ctx: CanvasRenderingContext2D, viz: AudioReactiveVisualizer, data: Uint8Array) {
  const { width, height, pulseScale, pulseShape, sensitivity } = viz

  // Calculate average amplitude
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += data[i]
  }
  const average = (sum / data.length / 255) * sensitivity
  const scale = 1 + average * (pulseScale - 1)

  const cx = width / 2
  const cy = height / 2
  const baseRadius = Math.min(width, height) * 0.3

  const fill = getVisualizerColor(viz, ctx, cx - baseRadius, cy - baseRadius, cx + baseRadius, cy + baseRadius)

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(scale, scale)

  switch (pulseShape) {
    case 'circle':
      ctx.beginPath()
      ctx.arc(0, 0, baseRadius, 0, Math.PI * 2)
      ctx.fillStyle = fill
      ctx.fill()
      break

    case 'ring':
      ctx.beginPath()
      ctx.arc(0, 0, baseRadius, 0, Math.PI * 2)
      ctx.strokeStyle = fill as string
      ctx.lineWidth = 4
      ctx.stroke()
      // Inner glow
      ctx.beginPath()
      ctx.arc(0, 0, baseRadius * 0.7, 0, Math.PI * 2)
      ctx.strokeStyle = fill as string
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.5
      ctx.stroke()
      ctx.globalAlpha = 1
      break

    case 'square':
      ctx.fillStyle = fill
      ctx.fillRect(-baseRadius, -baseRadius, baseRadius * 2, baseRadius * 2)
      break
  }

  ctx.restore()
}

function drawCircular(ctx: CanvasRenderingContext2D, viz: AudioReactiveVisualizer, data: Uint8Array) {
  const { width, height, barCount, sensitivity, minAmplitude, maxAmplitude } = viz
  const bins = sampleFrequencyBins(data, barCount, viz.minFrequency, viz.maxFrequency, sensitivity)

  const cx = width / 2
  const cy = height / 2
  const innerRadius = Math.min(width, height) * 0.15
  const maxBarLength = Math.min(width, height) * 0.3

  const fill = getVisualizerColor(viz, ctx, 0, 0, width, height)
  ctx.strokeStyle = fill as string
  ctx.lineWidth = Math.max(2, (Math.PI * 2 * innerRadius) / barCount * 0.6)
  ctx.lineCap = 'round'

  for (let i = 0; i < barCount; i++) {
    const amplitude = Math.max(minAmplitude, Math.min(maxAmplitude, bins[i]))
    const barLength = amplitude * maxBarLength
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2

    const x1 = cx + Math.cos(angle) * innerRadius
    const y1 = cy + Math.sin(angle) * innerRadius
    const x2 = cx + Math.cos(angle) * (innerRadius + barLength)
    const y2 = cy + Math.sin(angle) * (innerRadius + barLength)

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
}

function drawSpectrum(ctx: CanvasRenderingContext2D, viz: AudioReactiveVisualizer, data: Uint8Array) {
  const { width, height, lineWidth, fillBelow, sensitivity, minFrequency, maxFrequency } = viz
  const bins = sampleFrequencyBins(data, Math.min(data.length, 128), minFrequency, maxFrequency, sensitivity)

  const stroke = getVisualizerColor(viz, ctx, 0, 0, width, 0)

  ctx.beginPath()
  ctx.strokeStyle = stroke as string
  ctx.lineWidth = lineWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  const sliceWidth = width / bins.length

  for (let i = 0; i < bins.length; i++) {
    const amplitude = Math.min(1.0, bins[i])
    const y = height - amplitude * height * 0.9
    const x = i * sliceWidth

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      // Use quadratic curve for smoother appearance
      ctx.quadraticCurveTo((i - 1) * sliceWidth + sliceWidth * 0.5, y, x, y)
    }
  }

  ctx.stroke()

  if (fillBelow) {
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    const fillColor = getVisualizerColor(viz, ctx, 0, height, 0, 0)
    ctx.fillStyle = fillColor
    ctx.globalAlpha = 0.2
    ctx.fill()
    ctx.globalAlpha = 1.0
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

/**
 * Export-friendly rendering function used by canvas2dRenderer.
 * Draws the visualizer at the given position using simulated frequency data.
 */
export function drawAudioReactiveVisualizer(
  ctx: CanvasRenderingContext2D,
  viz: AudioReactiveVisualizer,
  frame: number,
) {
  const frequencyData = generateSimulatedFrequencyData(frame)
  const timeDomainData = new Uint8Array(128)
  for (let i = 0; i < 128; i++) {
    const t = frame * 0.1 + i * 0.05
    timeDomainData[i] = 128 + Math.sin(t) * 40 + Math.sin(t * 2.7) * 20
  }

  ctx.save()
  ctx.globalAlpha = viz.opacity
  ctx.translate(viz.position.x, viz.position.y)

  if (viz.rotation !== 0) {
    ctx.translate(viz.width / 2, viz.height / 2)
    ctx.rotate((viz.rotation * Math.PI) / 180)
    ctx.translate(-viz.width / 2, -viz.height / 2)
  }

  // Create an offscreen canvas for the visualizer so it clips properly
  const offscreen = new OffscreenCanvas(viz.width, viz.height)
  const offCtx = offscreen.getContext('2d')
  if (offCtx) {
    renderVisualizer(offCtx as unknown as CanvasRenderingContext2D, viz, frequencyData, timeDomainData)
    ctx.drawImage(offscreen as unknown as ImageBitmapSource as any, 0, 0)
  }

  ctx.restore()
}
