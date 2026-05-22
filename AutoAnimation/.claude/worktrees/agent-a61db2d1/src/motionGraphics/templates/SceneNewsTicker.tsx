import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NewsTickerConfig {
  tickerText: string
  prefixLabel: string
  barColor: string
  prefixColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneNewsTickerComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<NewsTickerConfig>) {
  const { tickerText, prefixLabel, barColor, prefixColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.12
  const holdEnd = 0.88
  const enterProgress = Math.min(1, progress / enterEnd)
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Bar slides up from bottom
  const barY = (1 - easeOutCubic(enterProgress)) * 80
  const barOpacity = easeOutCubic(Math.min(1, enterProgress / 0.5))

  // Continuous scroll during hold
  const scrollSpeed = 100
  const tickerRepeated = Array(8).fill(`${tickerText}     \u2022     `).join('')
  const scrollOffset = (frame / fps) * scrollSpeed

  // Prefix label pops in
  const prefixDelay = 0.4
  const prefixEnter = Math.max(0, Math.min(1, (enterProgress - prefixDelay) / (1 - prefixDelay)))
  const prefixScale = easeOutCubic(prefixEnter)

  // Thin accent line on top
  const lineWidth = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6))) * 100

  // Exit: slides down
  const exitEased = easeInCubic(exitProgress)
  const exitY = exitEased * 80
  const exitOpacity = 1 - exitEased

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Ticker bar at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '3%',
          left: 0,
          right: 0,
          transform: `translateY(${barY + exitY}px)`,
          opacity: barOpacity * exitOpacity,
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            height: 3,
            background: prefixColor,
            width: `${lineWidth}%`,
            marginBottom: 0,
          }}
        />

        {/* Main ticker bar */}
        <div
          style={{
            background: barColor,
            display: 'flex',
            alignItems: 'center',
            height: 'clamp(32px, 5vw, 50px)',
          }}
        >
          {/* BREAKING prefix tag */}
          <div
            style={{
              background: prefixColor,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '0 clamp(10px, 1.8vw, 22px)',
              flexShrink: 0,
              zIndex: 2,
              transform: `scaleX(${prefixScale})`,
              transformOrigin: 'left center',
              boxShadow: '4px 0 12px rgba(0,0,0,0.3)',
            }}
          >
            <span
              style={{
                fontSize: 'clamp(10px, 1.5vw, 16px)',
                fontWeight: 900,
                color: textColor,
                letterSpacing: '0.12em',
                fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
                whiteSpace: 'nowrap',
              }}
            >
              {prefixLabel}
            </span>
          </div>

          {/* Scrolling text area */}
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                whiteSpace: 'nowrap',
                transform: `translateX(-${scrollOffset % 3000}px)`,
                fontSize: 'clamp(11px, 1.7vw, 17px)',
                fontWeight: 600,
                color: textColor,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                letterSpacing: '0.03em',
                paddingLeft: 'clamp(8px, 1.5vw, 16px)',
              }}
            >
              {tickerRepeated}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-news-ticker',
  title: 'News Ticker',
  description: 'Scrolling news ticker bar at bottom of screen with BREAKING prefix tag, continuous horizontal scroll, and slide-in/out animation',
  tags: ['scene', 'news', 'ticker', 'scroll', 'broadcast', 'media', 'breaking'],
  category: 'scene-layout',
  component: SceneNewsTickerComponent as any,
  defaultConfig: {
    tickerText: 'Global markets surge as tech earnings exceed expectations \u2022 Central bank holds rates steady amid inflation concerns \u2022 Space agency announces new lunar mission for 2027',
    prefixLabel: 'BREAKING',
    barColor: '#1a1a2e',
    prefixColor: '#CC0000',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'tickerText', label: 'Ticker Text', type: 'text', defaultValue: 'Global markets surge as tech earnings exceed expectations \u2022 Central bank holds rates steady amid inflation concerns', group: 'Content' },
    { key: 'prefixLabel', label: 'Prefix Label', type: 'text', defaultValue: 'BREAKING', group: 'Content' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'prefixColor', label: 'Prefix Color', type: 'color', defaultValue: '#CC0000', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
