import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneRaceLeaderboardConfig {
  title: string
  driver1: string
  driver2: string
  driver3: string
  driver4: string
  driver5: string
  gap1: string
  gap2: string
  gap3: string
  gap4: string
  gap5: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneRaceLeaderboardComponent({ config, progress }: MotionGraphicProps<SceneRaceLeaderboardConfig>) {
  const { title, driver1, driver2, driver3, driver4, driver5, gap1, gap2, gap3, gap4, gap5, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * 40

  const titleEnter = easeOutBack(Math.min(1, enterProgress / 0.5))

  const drivers = [
    { name: driver1, gap: gap1, pos: 1 },
    { name: driver2, gap: gap2, pos: 2 },
    { name: driver3, gap: gap3, pos: 3 },
    { name: driver4, gap: gap4, pos: 4 },
    { name: driver5, gap: gap5, pos: 5 },
  ]

  const posColors = ['#ffd700', '#c0c0c0', '#cd7f32', `${textColor}cc`, `${textColor}cc`]

  // Blinking lap indicator
  const isHolding = progress >= 0.2 && progress < 0.8
  const blink = isHolding ? Math.sin(holdProgress * Math.PI * 8) > 0 : true

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Side accent stripe */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 4,
          height: `${enterProgress * 100}%`,
          background: `linear-gradient(180deg, ${accentColor}, ${accentColor}40)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(16px, 4vw, 40px) clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
          transform: `translateY(${exitY}px)`,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            marginBottom: 'clamp(12px, 3vw, 28px)',
            opacity: titleEnter,
            transform: `translateX(${(1 - titleEnter) * -30}px)`,
          }}
        >
          {/* Live dot */}
          <div
            style={{
              width: 'clamp(8px, 1.2vw, 12px)',
              height: 'clamp(8px, 1.2vw, 12px)',
              borderRadius: '50%',
              background: '#ff2222',
              opacity: blink ? 1 : 0.3,
              boxShadow: '0 0 8px rgba(255,34,34,0.6)',
            }}
          />
          <div
            style={{
              fontSize: 'clamp(14px, 2.8vw, 24px)',
              fontWeight: 900,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {title}
          </div>
        </div>

        {/* Leaderboard rows */}
        {drivers.map((d, i) => {
          const rowEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2 - i * 0.08) / 0.5)))
          const isLeader = i === 0
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 18px)',
                marginBottom: 'clamp(3px, 0.6vw, 6px)',
                background: isLeader ? `${accentColor}15` : `${textColor}05`,
                borderRadius: 'clamp(6px, 1vw, 10px)',
                border: isLeader ? `1.5px solid ${accentColor}40` : '1.5px solid transparent',
                opacity: rowEnter,
                transform: `translateX(${(1 - rowEnter) * 40}px)`,
              }}
            >
              {/* Position */}
              <div
                style={{
                  fontSize: 'clamp(16px, 3.5vw, 30px)',
                  fontWeight: 900,
                  color: posColors[i],
                  width: 'clamp(28px, 5vw, 44px)',
                  textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {d.pos}
              </div>

              {/* Driver name */}
              <div
                style={{
                  flex: 1,
                  fontSize: 'clamp(12px, 2.2vw, 19px)',
                  fontWeight: 700,
                  color: textColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  paddingLeft: 'clamp(8px, 1.5vw, 14px)',
                }}
              >
                {d.name}
              </div>

              {/* Gap */}
              <div
                style={{
                  fontSize: 'clamp(10px, 1.6vw, 14px)',
                  fontWeight: 600,
                  color: isLeader ? accentColor : `${textColor}70`,
                  fontFamily: 'monospace',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {d.gap}
              </div>
            </div>
          )
        })}

        {/* Bottom timing bar */}
        <div
          style={{
            marginTop: 'clamp(10px, 2vw, 20px)',
            height: 2,
            background: `linear-gradient(90deg, ${accentColor}60, transparent)`,
            transform: `scaleX(${easeOutCubic(Math.max(0, enterProgress - 0.5) * 2)})`,
            transformOrigin: 'left',
          }}
        />
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-race-leaderboard',
  title: 'Race Leaderboard',
  description: 'F1-style race position leaderboard with staggered row reveals, position colors, gap times, and blinking live indicator.',
  tags: ['scene', 'race', 'leaderboard', 'F1', 'standings', 'motorsport', 'auto'],
  category: 'scene-layout',
  component: SceneRaceLeaderboardComponent as any,
  defaultConfig: {
    title: 'RACE STANDINGS',
    driver1: 'VER Verstappen',
    driver2: 'HAM Hamilton',
    driver3: 'LEC Leclerc',
    driver4: 'NOR Norris',
    driver5: 'SAI Sainz',
    gap1: 'LEADER',
    gap2: '+2.341',
    gap3: '+5.892',
    gap4: '+8.112',
    gap5: '+12.004',
    bgColor: '#0c0c14',
    accentColor: '#e10600',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'RACE STANDINGS', group: 'Content' },
    { key: 'driver1', label: 'P1 Driver', type: 'text', defaultValue: 'VER Verstappen', group: 'Drivers' },
    { key: 'driver2', label: 'P2 Driver', type: 'text', defaultValue: 'HAM Hamilton', group: 'Drivers' },
    { key: 'driver3', label: 'P3 Driver', type: 'text', defaultValue: 'LEC Leclerc', group: 'Drivers' },
    { key: 'driver4', label: 'P4 Driver', type: 'text', defaultValue: 'NOR Norris', group: 'Drivers' },
    { key: 'driver5', label: 'P5 Driver', type: 'text', defaultValue: 'SAI Sainz', group: 'Drivers' },
    { key: 'gap1', label: 'P1 Gap', type: 'text', defaultValue: 'LEADER', group: 'Gaps' },
    { key: 'gap2', label: 'P2 Gap', type: 'text', defaultValue: '+2.341', group: 'Gaps' },
    { key: 'gap3', label: 'P3 Gap', type: 'text', defaultValue: '+5.892', group: 'Gaps' },
    { key: 'gap4', label: 'P4 Gap', type: 'text', defaultValue: '+8.112', group: 'Gaps' },
    { key: 'gap5', label: 'P5 Gap', type: 'text', defaultValue: '+12.004', group: 'Gaps' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#e10600', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
