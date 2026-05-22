import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMonsterProfileConfig {
  monsterName: string
  monsterEmoji: string
  classification: string
  origin: string
  weakness: string
  dangerLevel: number
  description: string
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

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneMonsterProfileComponent({ config, progress, frame }: MotionGraphicProps<SceneMonsterProfileConfig>) {
  const { monsterName, monsterEmoji, classification, origin, weakness, dangerLevel, description, bgColor, textColor, accentColor } = config
  const f = frame ?? 0

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Glitch on profile reveal
  const isGlitch = rand(Math.floor(f / 5)) > 0.9
  const glitchX = isGlitch ? (rand(f * 3) - 0.5) * 6 : 0

  // Danger bar animation
  const dangerFill = easeOutCubic(Math.min(1, enterProgress * 1.4)) * (dangerLevel / 10)

  const getDangerColor = (level: number) => {
    if (level <= 3) return '#44AA44'
    if (level <= 5) return '#CCAA00'
    if (level <= 7) return '#DD6600'
    return accentColor
  }
  const dangerColor = getDangerColor(dangerLevel)

  // Breathing animation for monster emoji
  const breathScale = 1 + Math.sin(f * 0.05) * 0.04

  const avatarEnter = easeOutBack(Math.min(1, enterProgress * 1.3))
  const cardEnter = easeOutCubic(enterProgress)
  const nameEnter = easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8))
  const detailEnter = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))
  const statsEnter = easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4))

  // Static noise
  const staticBars = Array.from({ length: 3 }, (_, i) => ({
    y: rand(f * 7 + i * 41) * 100,
    opacity: 0.03,
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 30%, #100c14, ${bgColor})` }} />
      {/* Static */}
      {staticBars.map((bar, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${bar.y}%`, height: 1, background: `rgba(255,255,255,${bar.opacity})` }} />
      ))}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `translateX(${glitchX}px)`,
        }}
      >
        {/* Classified header */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(8px, 1.4vw, 10px)',
            fontWeight: 800,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            marginBottom: 'clamp(10px, 2.5vw, 18px)',
            opacity: cardEnter * 0.7,
          }}
        >
          {'\u26a0'} Classified Creature File
        </div>

        {/* Card */}
        <div
          style={{
            width: 'clamp(280px, 75vw, 460px)',
            background: 'rgba(10, 8, 14, 0.88)',
            borderRadius: 'clamp(10px, 2.5vw, 18px)',
            border: `1px solid ${accentColor}22`,
            padding: 'clamp(20px, 5vw, 36px)',
            opacity: cardEnter,
            boxShadow: `0 0 30px rgba(0,0,0,0.4), 0 0 40px ${accentColor}06`,
          }}
        >
          {/* Monster avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 20px)', marginBottom: 'clamp(14px, 3.5vw, 22px)' }}>
            <div
              style={{
                width: 'clamp(50px, 13vw, 80px)',
                height: 'clamp(50px, 13vw, 80px)',
                borderRadius: 'clamp(10px, 2.5vw, 16px)',
                background: `${accentColor}11`,
                border: `2px solid ${accentColor}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(24px, 6vw, 40px)',
                transform: `scale(${avatarEnter * breathScale})`,
                opacity: avatarEnter,
                boxShadow: `inset 0 0 15px ${accentColor}11`,
              }}
            >
              {monsterEmoji}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "Impact, 'Arial Black', sans-serif",
                  fontSize: 'clamp(18px, 4.5vw, 30px)',
                  fontWeight: 900,
                  color: textColor,
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  opacity: nameEnter,
                  transform: `translateX(${(1 - nameEnter) * 15}px)`,
                  textShadow: `0 0 12px ${accentColor}22`,
                }}
              >
                {monsterName}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(9px, 1.8vw, 13px)',
                  color: accentColor,
                  marginTop: 2,
                  opacity: nameEnter * 0.8,
                }}
              >
                {classification}
              </div>
            </div>
          </div>

          {/* Description */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(11px, 2.3vw, 17px)',
              color: `${textColor}99`,
              lineHeight: 1.6,
              marginBottom: 'clamp(16px, 4vw, 26px)',
              opacity: detailEnter,
              transform: `translateY(${(1 - detailEnter) * 8}px)`,
            }}
          >
            {description}
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'clamp(10px, 2.5vw, 16px)',
              marginBottom: 'clamp(14px, 3.5vw, 22px)',
              opacity: statsEnter,
            }}
          >
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(7px, 1.2vw, 9px)', color: `${textColor}44`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Origin</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(10px, 2vw, 14px)', fontWeight: 600, color: textColor }}>{origin}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(7px, 1.2vw, 9px)', color: `${textColor}44`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Weakness</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(10px, 2vw, 14px)', fontWeight: 600, color: '#44AA88' }}>{weakness}</div>
            </div>
          </div>

          {/* Danger level bar */}
          <div style={{ opacity: statsEnter }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(4px, 1vw, 8px)' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 10px)', color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Danger Level</span>
              <span style={{ fontFamily: "'SF Mono', monospace", fontSize: 'clamp(12px, 2.5vw, 18px)', fontWeight: 800, color: dangerColor }}>{dangerLevel}/10</span>
            </div>
            <div style={{ width: '100%', height: 'clamp(6px, 1.5vw, 10px)', borderRadius: 5, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${dangerFill * 100}%`,
                  height: '100%',
                  borderRadius: 5,
                  background: `linear-gradient(90deg, #44AA44, ${dangerColor})`,
                  boxShadow: `0 0 8px ${dangerColor}44`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse, transparent 35%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none' }} />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-monster-profile',
  title: 'Monster Profile Card',
  description: 'Classified creature profile card with avatar, classification, origin, weakness, danger level bar, and static interference',
  tags: ['scene', 'horror', 'monster', 'creature', 'profile', 'bestiary', 'dark', 'classification'],
  category: 'scene-layout',
  component: SceneMonsterProfileComponent as any,
  defaultConfig: {
    monsterName: 'Wendigo',
    monsterEmoji: '\ud83e\udddf',
    classification: 'Class IV - Apex Predator',
    origin: 'Native American Folklore',
    weakness: 'Fire / Silver',
    dangerLevel: 9,
    description: 'A malevolent supernatural entity born from cannibalism and greed. Impossibly tall with antlers, sunken eyes, and an insatiable hunger for human flesh.',
    bgColor: '#060408',
    textColor: '#d0cce0',
    accentColor: '#CC0000',
  },
  configSchema: [
    { key: 'monsterName', label: 'Monster Name', type: 'text', defaultValue: 'Wendigo', group: 'Content' },
    { key: 'monsterEmoji', label: 'Monster Emoji', type: 'text', defaultValue: '\ud83e\udddf', group: 'Content' },
    { key: 'classification', label: 'Classification', type: 'text', defaultValue: 'Class IV - Apex Predator', group: 'Content' },
    { key: 'origin', label: 'Origin', type: 'text', defaultValue: 'Native American Folklore', group: 'Content' },
    { key: 'weakness', label: 'Weakness', type: 'text', defaultValue: 'Fire / Silver', group: 'Content' },
    { key: 'dangerLevel', label: 'Danger Level (1-10)', type: 'number', defaultValue: 9, min: 1, max: 10, group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'A malevolent supernatural entity...', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060408', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d0cce0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#CC0000', group: 'Style' },
  ],
})
