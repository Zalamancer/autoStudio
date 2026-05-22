import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BreakingNewsConfig {
  headline: string
  tickerText: string
  networkName: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneBreakingNewsComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<BreakingNewsConfig>) {
  const { headline, tickerText, networkName, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.15
  const holdEnd = 0.85
  const enterProgress = Math.min(1, progress / enterEnd)
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Banner slams in from top
  const bannerY = (1 - easeOutBack(Math.min(1, enterProgress))) * -120
  const bannerOpacity = easeOutCubic(Math.min(1, enterProgress / 0.6))

  // Headline text fades in after banner
  const headlineDelay = 0.3
  const headlineEnter = Math.max(0, Math.min(1, (enterProgress - headlineDelay) / (1 - headlineDelay)))
  const headlineOpacity = easeOutCubic(headlineEnter)
  const headlineX = (1 - easeOutCubic(headlineEnter)) * 40

  // Ticker scroll — continuous loop during hold phase
  const tickerRepeated = `${tickerText}     \u2022     ${tickerText}     \u2022     ${tickerText}     \u2022     ${tickerText}     \u2022     `
  const tickerOffset = progress >= enterEnd ? ((frame / fps) * 80) % 2000 : 0

  // Ticker bar slides up
  const tickerEnterDelay = 0.5
  const tickerEnter = Math.max(0, Math.min(1, (enterProgress - tickerEnterDelay) / (1 - tickerEnterDelay)))
  const tickerY = (1 - easeOutCubic(tickerEnter)) * 60

  // BREAKING tag pulse
  const holdProgress = progress >= enterEnd && progress < holdEnd
    ? (progress - enterEnd) / (holdEnd - enterEnd) : 0
  const pulseOpacity = 0.8 + Math.sin(holdProgress * Math.PI * 12) * 0.2

  // Exit: slides up
  const exitEased = easeInCubic(exitProgress)
  const exitY = exitEased * -200
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Full-screen container with exit animation */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${exitY}px)`,
          opacity: exitOpacity,
        }}
      >
        {/* Red banner bar at top */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: 0,
            right: 0,
            transform: `translateY(${bannerY}px)`,
            opacity: bannerOpacity,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          {/* BREAKING NEWS tag */}
          <div
            style={{
              background: bgColor,
              padding: 'clamp(8px, 1.5vw, 16px) clamp(12px, 2.5vw, 28px)',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1vw, 12px)',
            }}
          >
            {/* Pulsing red dot */}
            <div
              style={{
                width: 'clamp(8px, 1.2vw, 14px)',
                height: 'clamp(8px, 1.2vw, 14px)',
                borderRadius: '50%',
                background: accentColor,
                opacity: pulseOpacity,
                boxShadow: `0 0 8px ${accentColor}`,
              }}
            />
            <span
              style={{
                fontSize: 'clamp(14px, 2.5vw, 26px)',
                fontWeight: 900,
                color: textColor,
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}
            >
              BREAKING NEWS
            </span>
          </div>

          {/* Network name badge */}
          <div
            style={{
              background: accentColor,
              padding: 'clamp(8px, 1.5vw, 16px) clamp(10px, 2vw, 20px)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 'clamp(10px, 1.5vw, 16px)',
                fontWeight: 800,
                color: textColor,
                letterSpacing: '0.1em',
              }}
            >
              {networkName}
            </span>
          </div>
        </div>

        {/* Headline text */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(8% + clamp(44px, 7vw, 70px))',
            left: 0,
            right: 0,
            padding: 'clamp(10px, 2vw, 20px) clamp(12px, 2.5vw, 28px)',
            background: `${bgColor}ee`,
            opacity: headlineOpacity,
            transform: `translateX(${headlineX}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(18px, 4vw, 42px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.2,
            }}
          >
            {headline}
          </div>
        </div>

        {/* Scrolling ticker at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            left: 0,
            right: 0,
            background: bgColor,
            transform: `translateY(${tickerY}px)`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* BREAKING prefix tag */}
          <div
            style={{
              background: accentColor,
              padding: 'clamp(6px, 1vw, 12px) clamp(10px, 1.5vw, 18px)',
              flexShrink: 0,
              zIndex: 1,
            }}
          >
            <span
              style={{
                fontSize: 'clamp(10px, 1.5vw, 16px)',
                fontWeight: 900,
                color: textColor,
                letterSpacing: '0.1em',
              }}
            >
              BREAKING
            </span>
          </div>

          {/* Scrolling text */}
          <div
            style={{
              overflow: 'hidden',
              flex: 1,
              padding: 'clamp(6px, 1vw, 12px) 0',
            }}
          >
            <div
              style={{
                whiteSpace: 'nowrap',
                fontSize: 'clamp(11px, 1.8vw, 18px)',
                fontWeight: 600,
                color: textColor,
                transform: `translateX(-${tickerOffset}px)`,
                letterSpacing: '0.02em',
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
  id: 'tpl-scene-breaking-news',
  title: 'Breaking News Banner',
  description: 'CNN-style breaking news banner with headline, red background, pulsing live dot, and scrolling ticker at bottom',
  tags: ['scene', 'news', 'breaking', 'banner', 'broadcast', 'media', 'ticker'],
  category: 'scene-layout',
  component: SceneBreakingNewsComponent as any,
  defaultConfig: {
    headline: 'Major developments in global markets as stocks surge to record highs',
    tickerText: 'Markets rally on strong earnings reports across tech sector \u2022 Central bank holds interest rates steady',
    networkName: 'NEWS 24',
    bgColor: '#CC0000',
    textColor: '#FFFFFF',
    accentColor: '#FF0000',
  },
  configSchema: [
    { key: 'headline', label: 'Headline', type: 'text', defaultValue: 'Major developments in global markets as stocks surge to record highs', group: 'Content' },
    { key: 'tickerText', label: 'Ticker Text', type: 'text', defaultValue: 'Markets rally on strong earnings reports across tech sector \u2022 Central bank holds interest rates steady', group: 'Content' },
    { key: 'networkName', label: 'Network Name', type: 'text', defaultValue: 'NEWS 24', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#CC0000', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF0000', group: 'Style' },
  ],
})
