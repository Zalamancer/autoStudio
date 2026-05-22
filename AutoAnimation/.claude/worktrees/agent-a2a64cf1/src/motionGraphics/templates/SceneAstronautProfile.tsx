import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneAstronautProfileConfig {
  astronautName: string
  rank: string
  mission: string
  totalEVAs: number
  daysInSpace: number
  specialization: string
  bgColor: string
  textColor: string
  accentColor: string
  badgeColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneAstronautProfileComponent({ config, progress }: MotionGraphicProps<SceneAstronautProfileConfig>) {
  const { astronautName, rank, mission, totalEVAs, daysInSpace, specialization, bgColor, textColor, accentColor, badgeColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Staggered animations
  const avatarEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const nameEnter = easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.4))
  const rankEnter = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.4))
  const statsEnter = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))
  const missionEnter = easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4))

  // Stars
  const stars = Array.from({ length: 30 }, (_, i) => ({
    x: ((i * 67 + 23) % 100),
    y: ((i * 53 + 17) % 100),
    size: 0.5 + ((i * 11) % 2),
    opacity: 0.1 + ((i * 29) % 3) / 12,
  }))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
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

      {/* Subtle gradient accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '40%',
          height: '40%',
          background: `radial-gradient(circle at top left, ${accentColor}08, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
        }}
      >
        {/* Astronaut avatar placeholder (helmet icon) */}
        <div
          style={{
            width: 'clamp(60px, 16vw, 110px)',
            height: 'clamp(60px, 16vw, 110px)',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
            border: `3px solid ${accentColor}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${avatarEnter})`,
            marginBottom: 'clamp(10px, 2.5vw, 20px)',
            position: 'relative',
          }}
        >
          {/* Helmet visor */}
          <div
            style={{
              width: '60%',
              height: '50%',
              borderRadius: '40% 40% 50% 50%',
              background: `linear-gradient(135deg, ${accentColor}50, #1a1a40)`,
              border: `1.5px solid ${accentColor}40`,
            }}
          />
          {/* Badge dot */}
          <div
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 'clamp(14px, 3.5vw, 22px)',
              height: 'clamp(14px, 3.5vw, 22px)',
              borderRadius: '50%',
              background: badgeColor,
              border: `2px solid ${bgColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(7px, 1.5vw, 10px)',
              color: '#FFFFFF',
              fontWeight: 800,
            }}
          >
            {totalEVAs}
          </div>
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 'clamp(24px, 6vw, 44px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.5vw, 5px)',
            opacity: nameEnter,
            transform: `translateY(${(1 - nameEnter) * 15}px)`,
            textAlign: 'center',
          }}
        >
          {astronautName}
        </div>

        {/* Rank */}
        <div
          style={{
            display: 'inline-block',
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}40`,
            borderRadius: 100,
            padding: 'clamp(3px, 0.5vw, 5px) clamp(10px, 2vw, 18px)',
            fontSize: 'clamp(9px, 1.8vw, 13px)',
            color: accentColor,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginTop: 'clamp(6px, 1.2vw, 10px)',
            marginBottom: 'clamp(14px, 3vw, 24px)',
            opacity: rankEnter,
          }}
        >
          {rank}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(16px, 4vw, 36px)',
            marginBottom: 'clamp(14px, 3vw, 24px)',
            opacity: statsEnter,
            transform: `translateY(${(1 - statsEnter) * 15}px)`,
          }}
        >
          {/* Days in space */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 'clamp(24px, 6vw, 42px)',
                fontWeight: 900,
                color: accentColor,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(daysInSpace * statsEnter)}
            </div>
            <div style={{ fontSize: 'clamp(8px, 1.6vw, 11px)', color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: 1 }}>
              Days in Space
            </div>
          </div>
          {/* EVAs */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 'clamp(24px, 6vw, 42px)',
                fontWeight: 900,
                color: accentColor,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(totalEVAs * statsEnter)}
            </div>
            <div style={{ fontSize: 'clamp(8px, 1.6vw, 11px)', color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: 1 }}>
              Total EVAs
            </div>
          </div>
        </div>

        {/* Mission & Specialization */}
        <div
          style={{
            textAlign: 'center',
            opacity: missionEnter,
            transform: `translateY(${(1 - missionEnter) * 10}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(11px, 2.2vw, 16px)', color: `${textColor}80`, marginBottom: 4 }}>
            Current Mission: <span style={{ color: accentColor, fontWeight: 700 }}>{mission}</span>
          </div>
          <div style={{ fontSize: 'clamp(10px, 2vw, 14px)', color: `${textColor}50` }}>
            Specialization: {specialization}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-astronaut-profile',
  title: 'Astronaut Profile',
  description: 'Astronaut mission profile card with helmet avatar, rank badge, days in space, EVA count, mission and specialization',
  tags: ['scene', 'space', 'astronaut', 'profile', 'mission', 'astronomy', 'crew'],
  category: 'scene-layout',
  component: SceneAstronautProfileComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'astronautName', label: 'Astronaut Name', type: 'text', defaultValue: 'Dr. Sarah Chen', group: 'Content' },
    { key: 'rank', label: 'Rank', type: 'text', defaultValue: 'Mission Commander', group: 'Content' },
    { key: 'mission', label: 'Mission', type: 'text', defaultValue: 'Artemis V', group: 'Content' },
    { key: 'totalEVAs', label: 'Total EVAs', type: 'number', defaultValue: 7, min: 0, max: 50, group: 'Content' },
    { key: 'daysInSpace', label: 'Days in Space', type: 'number', defaultValue: 342, min: 0, max: 1000, group: 'Content' },
    { key: 'specialization', label: 'Specialization', type: 'text', defaultValue: 'Geophysics & Robotics', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'badgeColor', label: 'Badge Color', type: 'color', defaultValue: '#22C55E', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080818', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
  ],
  defaultConfig: {
    astronautName: 'Dr. Sarah Chen',
    rank: 'Mission Commander',
    mission: 'Artemis V',
    totalEVAs: 7,
    daysInSpace: 342,
    specialization: 'Geophysics & Robotics',
    accentColor: '#60A5FA',
    badgeColor: '#22C55E',
    bgColor: '#080818',
    textColor: '#E2E8F0',
  },
})
