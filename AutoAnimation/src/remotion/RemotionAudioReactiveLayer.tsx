import { useRef, useEffect } from 'react'
import { useFrame } from '@/engine'
import { generateSimulatedFrequencyData } from '@/stores/useAudioReactiveStore'
import type { AudioReactiveExportData } from './types'

interface RemotionAudioReactiveLayerProps {
  visualizers: AudioReactiveExportData[]
}

export function RemotionAudioReactiveLayer({ visualizers }: RemotionAudioReactiveLayerProps) {
  const frame = useFrame()

  return (
    <>
      {visualizers.map((viz) => {
        if (!viz.visible) return null
        if (frame < viz.startFrame || frame >= viz.endFrame) return null
        return <RemotionAudioReactiveItem key={viz.id} visualizer={viz} frame={frame} />
      })}
    </>
  )
}

function RemotionAudioReactiveItem({
  visualizer,
  frame,
}: {
  visualizer: AudioReactiveExportData
  frame: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const frequencyData = generateSimulatedFrequencyData(frame)
    const timeDomainData = new Uint8Array(128)
    for (let i = 0; i < 128; i++) {
      const t = frame * 0.1 + i * 0.05
      timeDomainData[i] = 128 + Math.sin(t) * 40 + Math.sin(t * 2.7) * 20
    }

    renderVisualizerToCanvas(ctx, visualizer, frequencyData, timeDomainData)
  }, [frame, visualizer])

  const style: React.CSSProperties = {
    position: 'absolute',
    left: visualizer.position.x,
    top: visualizer.position.y,
    width: visualizer.width,
    height: visualizer.height,
    opacity: visualizer.opacity,
    zIndex: visualizer.zIndex,
  }

  if (visualizer.rotation !== 0) {
    style.transform = `rotate(${visualizer.rotation}deg)`
  }

  return (
    <canvas
      ref={canvasRef}
      width={visualizer.width}
      height={visualizer.height}
      style={style}
    />
  )
}

// ── Rendering logic (mirrors AudioReactiveLayer.tsx) ──

function sampleFrequencyBins(
  data: Uint8Array,
  binCount: number,
  minFreq: number,
  maxFreq: number,
  sensitivity: number,
): number[] {
  const nyquist = 22050
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

function getColor(
  viz: AudioReactiveExportData,
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): string | CanvasGradient {
  if (!viz.useGradient || viz.gradientColors.length < 2) return viz.color
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
  viz.gradientColors.forEach((c: string, i: number) => {
    gradient.addColorStop(i / (viz.gradientColors.length - 1), c)
  })
  return gradient
}

function renderVisualizerToCanvas(
  ctx: CanvasRenderingContext2D,
  viz: AudioReactiveExportData,
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

function drawBars(ctx: CanvasRenderingContext2D, viz: AudioReactiveExportData, data: Uint8Array) {
  const { width, height, barCount, barWidth, barGap, barRadius, minAmplitude, maxAmplitude, mirrorY } = viz
  const bins = sampleFrequencyBins(data, barCount, viz.minFrequency, viz.maxFrequency, viz.sensitivity)

  const totalBarSpace = barCount * barWidth + (barCount - 1) * barGap
  const startX = (width - totalBarSpace) / 2
  const fill = getColor(viz, ctx, 0, height, 0, 0)

  ctx.fillStyle = fill

  for (let i = 0; i < barCount; i++) {
    const amplitude = Math.max(minAmplitude, Math.min(maxAmplitude, bins[i]))
    const barHeight = amplitude * height * 0.8
    const x = startX + i * (barWidth + barGap)

    if (mirrorY) {
      const halfBar = barHeight / 2
      const y = height / 2 - halfBar
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, barRadius)
      ctx.fill()
    } else {
      const y = height - barHeight
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, barRadius)
      ctx.fill()
    }
  }
}

function drawWaveform(ctx: CanvasRenderingContext2D, viz: AudioReactiveExportData, data: Uint8Array) {
  const { width, height, lineWidth, fillBelow, sensitivity } = viz
  const stroke = getColor(viz, ctx, 0, 0, width, 0)

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
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  if (fillBelow) {
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    const fillColor = getColor(viz, ctx, 0, height, 0, 0)
    ctx.fillStyle = fillColor
    ctx.globalAlpha = 0.3
    ctx.fill()
    ctx.globalAlpha = 1.0
  }
}

function drawPulse(ctx: CanvasRenderingContext2D, viz: AudioReactiveExportData, data: Uint8Array) {
  const { width, height, pulseScale, pulseShape, sensitivity } = viz
  let sum = 0
  for (let i = 0; i < data.length; i++) sum += data[i]
  const average = (sum / data.length / 255) * sensitivity
  const scale = 1 + average * (pulseScale - 1)

  const cx = width / 2
  const cy = height / 2
  const baseRadius = Math.min(width, height) * 0.3
  const fill = getColor(viz, ctx, cx - baseRadius, cy - baseRadius, cx + baseRadius, cy + baseRadius)

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
      break
    case 'square':
      ctx.fillStyle = fill
      ctx.fillRect(-baseRadius, -baseRadius, baseRadius * 2, baseRadius * 2)
      break
  }
  ctx.restore()
}

function drawCircular(ctx: CanvasRenderingContext2D, viz: AudioReactiveExportData, data: Uint8Array) {
  const { width, height, barCount, sensitivity, minAmplitude, maxAmplitude } = viz
  const bins = sampleFrequencyBins(data, barCount, viz.minFrequency, viz.maxFrequency, sensitivity)

  const cx = width / 2
  const cy = height / 2
  const innerRadius = Math.min(width, height) * 0.15
  const maxBarLength = Math.min(width, height) * 0.3

  const fill = getColor(viz, ctx, 0, 0, width, height)
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

function drawSpectrum(ctx: CanvasRenderingContext2D, viz: AudioReactiveExportData, data: Uint8Array) {
  const { width, height, lineWidth, fillBelow, sensitivity, minFrequency, maxFrequency } = viz
  const bins = sampleFrequencyBins(data, Math.min(data.length, 128), minFrequency, maxFrequency, sensitivity)

  const stroke = getColor(viz, ctx, 0, 0, width, 0)
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
    if (i === 0) ctx.moveTo(x, y)
    else ctx.quadraticCurveTo((i - 0.5) * sliceWidth, y, x, y)
  }
  ctx.stroke()

  if (fillBelow) {
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    const fillColor = getColor(viz, ctx, 0, height, 0, 0)
    ctx.fillStyle = fillColor
    ctx.globalAlpha = 0.2
    ctx.fill()
    ctx.globalAlpha = 1.0
  }
}
