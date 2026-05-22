import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HistogramConfig {
  title: string
  channel: string
  meanValue: number
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/** Deterministic pseudo-random */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Generate histogram bar heights (bell-curve-ish distribution) */
function generateHistogramBars(barCount: number, mean: number, seed: number): number[] {
  const bars: number[] = []
  const sigma = barCount * 0.25
  const peak = mean / 255 * barCount
  for (let i = 0; i < barCount; i++) {
    const dist = Math.abs(i - peak)
    const gaussian = Math.exp(-(dist * dist) / (2 * sigma * sigma))
    const noise = rand(i * 37 + seed) * 0.3
    bars.push(Math.min(1, gaussian * 0.9 + noise * gaussian))
  }
  return bars
}

function SceneHistogramComponent({ config, progress }: MotionGraphicProps<HistogramConfig>) {
  const { title, channel, meanValue, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const barCount = 48
  const bars = generateHistogramBars(barCount, meanValue, 42)

  // Bars grow from bottom
  const barGrowProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.6)))

  // Channel colors
  const channelColors: Record<string, { fill: string; label: string }> = {
    RGB: { fill: '#FFFFFF', label: 'RGB' },
    Red: { fill: '#FF4444', label: 'Red' },
    Green: { fill: '#44DD44', label: 'Green' },
    Blue: { fill: '#4488FF', label: 'Blue' },
    Luminance: { fill: '#AAAAAA', label: 'Luma' },
  }
  const ch = channelColors[channel] || channelColors.RGB

  // Mean line position
  const meanPos = (meanValue / 255) * 100

  // Clipping warning indicators
  const shadowClip = bars[0] > 0.7
  const highlightClip = bars[barCount - 1] > 0.7

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          background: cardColor,
          borderRadius: 'clamp(12px, 2vw, 20px)',
          padding: 'clamp(18px, 3.5%, 32px)',
          maxWidth: 420,
          width: '100%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * -50}px) scale(${easeOutCubic(Math.min(1, enterProgress / 0.3))})`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(12px, 2vh, 20px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.25)),
          }}
        >
          <div style={{ fontSize: 'clamp(14px, 2.5vw, 20px)', fontWeight: 800, color: textColor }}>{title}</div>
          <div
            style={{
              background: `${ch.fill}20`,
              color: ch.fill,
              fontSize: 'clamp(9px, 1.3vw, 12px)',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 12,
              letterSpacing: 1,
            }}
          >
            {ch.label}
          </div>
        </div>

        {/* Histogram chart */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(100px, 22vw, 180px)',
            background: '#0A0A0A',
            borderRadius: 'clamp(6px, 1vw, 10px)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0 2px',
            gap: 1,
          }}
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((v, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${v * 100}%`,
                height: 1,
                background: `${textColor}08`,
              }}
            />
          ))}

          {/* Bars */}
          {bars.map((height, i) => {
            const barDelay = i / barCount
            const barProg = Math.max(0, Math.min(1, (barGrowProgress - barDelay * 0.3) / 0.7))
            const displayHeight = height * barProg * 100
            const isHighlighted = Math.abs(i - (meanValue / 255) * barCount) < 2

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${displayHeight}%`,
                  background: isHighlighted
                    ? ch.fill
                    : `${ch.fill}${channel === 'RGB' ? '80' : 'AA'}`,
                  borderRadius: '1px 1px 0 0',
                  minWidth: 1,
                }}
              />
            )
          })}

          {/* Mean line */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              top: 0,
              left: `${meanPos * barGrowProgress}%`,
              width: 1,
              background: accentColor,
              opacity: 0.7,
            }}
          />

          {/* Clipping indicators */}
          {shadowClip && (
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: 4,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#FF4444',
                opacity: 0.5 + Math.sin(holdProgress * Math.PI * 8) * 0.5,
              }}
            />
          )}
          {highlightClip && (
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#FF4444',
                opacity: 0.5 + Math.sin(holdProgress * Math.PI * 8) * 0.5,
              }}
            />
          )}
        </div>

        {/* Scale labels */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3))),
          }}
        >
          <span style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', color: `${textColor}40`, fontFamily: "'Courier New', monospace" }}>0</span>
          <span style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', color: `${textColor}40`, fontFamily: "'Courier New', monospace" }}>64</span>
          <span style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', color: `${textColor}40`, fontFamily: "'Courier New', monospace" }}>128</span>
          <span style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', color: `${textColor}40`, fontFamily: "'Courier New', monospace" }}>192</span>
          <span style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', color: `${textColor}40`, fontFamily: "'Courier New', monospace" }}>255</span>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginTop: 'clamp(10px, 1.5vh, 16px)',
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3))),
          }}
        >
          {[
            { label: 'Mean', value: String(Math.round(barGrowProgress * meanValue)) },
            { label: 'Median', value: String(Math.round(barGrowProgress * (meanValue * 0.95))) },
            { label: 'Std Dev', value: String(Math.round(barGrowProgress * 42)) },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', color: `${textColor}50`, fontWeight: 600, letterSpacing: 1, marginBottom: 2 }}>{stat.label}</div>
              <div style={{ fontSize: 'clamp(14px, 2.5vw, 20px)', fontWeight: 800, color: textColor, fontFamily: "'Courier New', monospace" }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-histogram',
  title: 'Scene Histogram',
  description: 'Photo histogram display with animated bar growth, channel selection, mean line, clipping indicators, and statistics',
  tags: ['scene', 'photography', 'histogram', 'data', 'exposure', 'technical', 'chart'],
  category: 'scenes',
  component: SceneHistogramComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'Exposure Histogram',
    channel: 'RGB',
    meanValue: 140,
    bgColor: '#0F1419',
    cardColor: '#1C2128',
    accentColor: '#F78166',
    textColor: '#E6EDF3',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Exposure Histogram', group: 'Content' },
    { key: 'channel', label: 'Channel (RGB/Red/Green/Blue/Luminance)', type: 'text', defaultValue: 'RGB', group: 'Content' },
    { key: 'meanValue', label: 'Mean Value (0-255)', type: 'number', defaultValue: 140, min: 0, max: 255, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F1419', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1C2128', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F78166', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E6EDF3', group: 'Style' },
  ],
})
