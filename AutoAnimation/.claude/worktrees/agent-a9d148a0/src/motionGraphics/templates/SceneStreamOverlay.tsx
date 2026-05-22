import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneStreamOverlayConfig {
  label: string
  gameTitle: string
  viewerCount: number
  bgColor: string
  accentColor: string
  cardColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function formatViewers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toLocaleString('en-US')
}

function SceneStreamOverlayComponent({ config, progress }: MotionGraphicProps<SceneStreamOverlayConfig>) {
  const { label, gameTitle, viewerCount, bgColor, accentColor, cardColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Card slide in from left
  const slideIn = easeOutBack(Math.min(1, enterProgress / 0.5))
  const slideX = (1 - slideIn) * -120

  // Label reveal
  const labelReveal = easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.3)))

  // Title reveal
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))

  // Viewer count
  const viewerReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.4)))
  const displayViewers = Math.round(viewerCount * viewerReveal)

  // Animated accent border (top and bottom lines)
  const isHolding = progress >= 0.2 && progress < 0.8
  const borderPulse = isHolding ? 0.6 + Math.sin(holdProgress * Math.PI * 5) * 0.4 : 1
  const borderWidth = easeOutCubic(Math.min(1, enterProgress / 0.4)) * 100

  // Live dot blink
  const dotBlink = isHolding ? Math.sin(holdProgress * Math.PI * 8) > 0 ? 1 : 0.3 : 1

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitSlideX = exitEased * -120

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Animated corner accents */}
      {/* Top-left */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          left: '4%',
          width: 'clamp(30px, 6vw, 60px)',
          height: 2,
          background: accentColor,
          opacity: borderPulse * slideIn * exitOpacity,
          boxShadow: `0 0 8px ${accentColor}80`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '6%',
          left: '4%',
          width: 2,
          height: 'clamp(30px, 6vw, 60px)',
          background: accentColor,
          opacity: borderPulse * slideIn * exitOpacity,
          boxShadow: `0 0 8px ${accentColor}80`,
        }}
      />
      {/* Bottom-right */}
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          right: '4%',
          width: 'clamp(30px, 6vw, 60px)',
          height: 2,
          background: accentColor,
          opacity: borderPulse * slideIn * exitOpacity,
          boxShadow: `0 0 8px ${accentColor}80`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          right: '4%',
          width: 2,
          height: 'clamp(30px, 6vw, 60px)',
          background: accentColor,
          opacity: borderPulse * slideIn * exitOpacity,
          boxShadow: `0 0 8px ${accentColor}80`,
        }}
      />

      {/* Main overlay card */}
      <div
        style={{
          position: 'absolute',
          bottom: '14%',
          left: '6%',
          transform: `translateX(${slideX + exitSlideX}px)`,
          opacity: exitOpacity,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(8px, 1.5vw, 14px)',
            padding: 'clamp(12px, 2.2vw, 22px) clamp(16px, 3vw, 28px)',
            boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 0 0 1px ${accentColor}20`,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(4px, 0.8vw, 8px)',
            minWidth: 'clamp(180px, 40vw, 320px)',
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              width: `${borderWidth * 0.8}%`,
              height: 2,
              background: `linear-gradient(90deg, ${accentColor}, transparent)`,
              borderRadius: '0 0 2px 2px',
              boxShadow: `0 0 8px ${accentColor}60`,
            }}
          />

          {/* NOW PLAYING label + live dot */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1vw, 10px)',
              opacity: labelReveal,
            }}
          >
            {/* Live dot */}
            <div
              style={{
                width: 'clamp(6px, 1vw, 8px)',
                height: 'clamp(6px, 1vw, 8px)',
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 6px #ef4444',
                opacity: dotBlink,
              }}
            />
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(8px, 1.2vw, 11px)',
                fontWeight: 700,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
              }}
            >
              {label}
            </div>
          </div>

          {/* Game title */}
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(16px, 3.5vw, 28px)',
              fontWeight: 800,
              color: textColor,
              lineHeight: 1.2,
              opacity: titleReveal,
              transform: `translateX(${(1 - titleReveal) * 15}px)`,
            }}
          >
            {gameTitle}
          </div>

          {/* Viewer count */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(4px, 0.8vw, 8px)',
              opacity: viewerReveal,
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(10px, 1.6vw, 14px)',
                fontWeight: 600,
                color: `${textColor}70`,
              }}
            >
              {'\u{1F441}'} {formatViewers(displayViewers)} viewers
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-stream-overlay',
  title: 'Stream Overlay',
  description: 'Twitch/stream-style overlay with "NOW PLAYING", game title, viewer count, animated accent borders',
  tags: ['scene', 'gaming', 'stream', 'twitch', 'overlay', 'live', 'viewer'],
  category: 'scene-layout',
  component: SceneStreamOverlayComponent as any,
  defaultConfig: {
    label: 'NOW PLAYING',
    gameTitle: 'Elden Ring',
    viewerCount: 12400,
    bgColor: '#0a0a14',
    accentColor: '#9147ff',
    cardColor: '#18181b',
    textColor: '#efeff1',
  },
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'NOW PLAYING', group: 'Content' },
    { key: 'gameTitle', label: 'Game Title', type: 'text', defaultValue: 'Elden Ring', group: 'Content' },
    { key: 'viewerCount', label: 'Viewer Count', type: 'number', defaultValue: 12400, min: 0, max: 9999999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#9147ff', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#18181b', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#efeff1', group: 'Style' },
  ],
})
