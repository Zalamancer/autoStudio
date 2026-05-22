import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneNightSkyGuideConfig {
  title: string
  date: string
  highlight1: string
  highlight2: string
  highlight3: string
  moonPhase: string
  bestTime: string
  visibility: string
  bgColor: string
  textColor: string
  accentColor: string
  moonColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneNightSkyGuideComponent({ config, progress }: MotionGraphicProps<SceneNightSkyGuideConfig>) {
  const { title, date, highlight1, highlight2, highlight3, moonPhase, bestTime, visibility, bgColor, textColor, accentColor, moonColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const skyEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const headerEnter = easeOutCubic(Math.max(0, (enterProgress - 0.1) / 0.4))
  const hl1Enter = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.3))
  const hl2Enter = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.3))
  const hl3Enter = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.3))
  const footerEnter = easeOutCubic(Math.max(0, (enterProgress - 0.7) / 0.3))

  // Animated stars
  const isHolding = progress >= 0.2 && progress < 0.85
  const stars = Array.from({ length: 50 }, (_, i) => {
    const twinkle = isHolding ? Math.sin(holdProgress * Math.PI * 6 + i * 1.3) * 0.2 : 0
    return {
      x: ((i * 71 + 13) % 100),
      y: ((i * 47 + 23) % 55),
      size: 1 + ((i * 13) % 3),
      opacity: (0.15 + ((i * 29) % 5) / 10 + twinkle) * skyEnter,
    }
  })

  // Small moon in the sky
  const moonX = 75
  const moonY = 12

  // Horizon gradient
  const highlights = [
    { text: highlight1, enter: hl1Enter, icon: '\u2605' },
    { text: highlight2, enter: hl2Enter, icon: '\u2604' },
    { text: highlight3, enter: hl3Enter, icon: '\u263E' },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, #0A0820 50%, #141428 75%, #1E1E38 100%)`,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: exitOpacity,
      }}
    >
      {/* Stars */}
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: '#FFFFFF',
            opacity: s.opacity,
          }}
        />
      ))}

      {/* Moon */}
      <div
        style={{
          position: 'absolute',
          left: `${moonX}%`,
          top: `${moonY}%`,
          width: 'clamp(16px, 4vw, 28px)',
          height: 'clamp(16px, 4vw, 28px)',
          borderRadius: '50%',
          background: moonColor,
          boxShadow: `0 0 10px ${moonColor}30, 0 0 25px ${moonColor}15`,
          opacity: skyEnter,
          transform: `scale(${skyEnter})`,
        }}
      />

      {/* Horizon tree line silhouette */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '10%',
          background: '#0A0A14',
        }}
      />
      {/* Tree silhouettes */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = 5 + i * 13
        const h = 6 + ((i * 17) % 6)
        return (
          <div
            key={`tree-${i}`}
            style={{
              position: 'absolute',
              bottom: '10%',
              left: `${x}%`,
              width: 0,
              height: 0,
              borderLeft: 'clamp(6px, 1.5vw, 10px) solid transparent',
              borderRight: 'clamp(6px, 1.5vw, 10px) solid transparent',
              borderBottom: `clamp(${h * 3}px, ${h}vw, ${h * 5}px) solid #0A0A14`,
              transform: 'rotate(180deg)',
              opacity: skyEnter,
            }}
          />
        )
      })}

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          width: '85%',
          opacity: headerEnter,
        }}
      >
        <div style={{ fontSize: 'clamp(9px, 1.8vw, 12px)', color: accentColor, textTransform: 'uppercase', letterSpacing: 'clamp(2px, 0.5vw, 4px)', fontWeight: 700 }}>
          {title}
        </div>
        <div style={{ fontSize: 'clamp(20px, 5vw, 36px)', fontWeight: 900, color: textColor, marginTop: 4 }}>
          {date}
        </div>
      </div>

      {/* Highlights */}
      <div
        style={{
          position: 'absolute',
          top: '32%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '82%',
          maxWidth: 420,
        }}
      >
        <div style={{ fontSize: 'clamp(9px, 1.8vw, 12px)', color: `${textColor}50`, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 'clamp(8px, 2vw, 16px)', opacity: hl1Enter }}>
          Tonight's Highlights
        </div>
        {highlights.map((hl, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 2vw, 14px)',
              marginBottom: 'clamp(8px, 2vw, 14px)',
              opacity: hl.enter,
              transform: `translateX(${(1 - hl.enter) * 30}px)`,
            }}
          >
            <div
              style={{
                width: 'clamp(28px, 6vw, 40px)',
                height: 'clamp(28px, 6vw, 40px)',
                borderRadius: '50%',
                background: `${accentColor}15`,
                border: `1.5px solid ${accentColor}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(12px, 2.5vw, 18px)',
                flexShrink: 0,
              }}
            >
              {hl.icon}
            </div>
            <div style={{ fontSize: 'clamp(12px, 2.5vw, 18px)', color: textColor, lineHeight: 1.4 }}>
              {hl.text}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom info bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '14%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          maxWidth: 420,
          display: 'flex',
          justifyContent: 'space-around',
          background: `${textColor}05`,
          borderRadius: 'clamp(8px, 1.5vw, 12px)',
          padding: 'clamp(8px, 2vw, 14px)',
          border: `1px solid ${textColor}08`,
          opacity: footerEnter,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(7px, 1.3vw, 9px)', color: `${textColor}40`, textTransform: 'uppercase', letterSpacing: 1 }}>Moon</div>
          <div style={{ fontSize: 'clamp(11px, 2.2vw, 16px)', color: moonColor, fontWeight: 700, marginTop: 2 }}>{moonPhase}</div>
        </div>
        <div style={{ width: 1, background: `${textColor}10` }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(7px, 1.3vw, 9px)', color: `${textColor}40`, textTransform: 'uppercase', letterSpacing: 1 }}>Best Time</div>
          <div style={{ fontSize: 'clamp(11px, 2.2vw, 16px)', color: accentColor, fontWeight: 700, marginTop: 2 }}>{bestTime}</div>
        </div>
        <div style={{ width: 1, background: `${textColor}10` }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(7px, 1.3vw, 9px)', color: `${textColor}40`, textTransform: 'uppercase', letterSpacing: 1 }}>Visibility</div>
          <div style={{ fontSize: 'clamp(11px, 2.2vw, 16px)', color: '#22C55E', fontWeight: 700, marginTop: 2 }}>{visibility}</div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-night-sky-guide',
  title: 'Night Sky Guide',
  description: 'Tonight\'s sky viewing guide with highlighted celestial events, moon phase, best viewing time, tree-line horizon, and twinkling stars',
  tags: ['scene', 'space', 'night-sky', 'guide', 'astronomy', 'stargazing', 'viewing'],
  category: 'scene-layout',
  component: SceneNightSkyGuideComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: "Tonight's Sky", group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'March 19, 2026', group: 'Content' },
    { key: 'highlight1', label: 'Highlight 1', type: 'text', defaultValue: 'Jupiter & Saturn visible after sunset in the west', group: 'Content' },
    { key: 'highlight2', label: 'Highlight 2', type: 'text', defaultValue: 'Lyrid meteor shower peaks tonight — up to 20/hour', group: 'Content' },
    { key: 'highlight3', label: 'Highlight 3', type: 'text', defaultValue: 'ISS flyover at 9:42 PM, look northwest', group: 'Content' },
    { key: 'moonPhase', label: 'Moon Phase', type: 'text', defaultValue: 'Waxing Gibbous', group: 'Content' },
    { key: 'bestTime', label: 'Best Time', type: 'text', defaultValue: '9:30 - 11:00 PM', group: 'Content' },
    { key: 'visibility', label: 'Visibility', type: 'text', defaultValue: 'Excellent', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'moonColor', label: 'Moon Color', type: 'color', defaultValue: '#D4D4D8', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050512', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
  ],
  defaultConfig: {
    title: "Tonight's Sky",
    date: 'March 19, 2026',
    highlight1: 'Jupiter & Saturn visible after sunset in the west',
    highlight2: 'Lyrid meteor shower peaks tonight — up to 20/hour',
    highlight3: 'ISS flyover at 9:42 PM, look northwest',
    moonPhase: 'Waxing Gibbous',
    bestTime: '9:30 - 11:00 PM',
    visibility: 'Excellent',
    accentColor: '#60A5FA',
    moonColor: '#D4D4D8',
    bgColor: '#050512',
    textColor: '#E2E8F0',
  },
})
