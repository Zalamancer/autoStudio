import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneFitnessMilestoneConfig {
  achievement: string
  stat: string
  statLabel: string
  previousBest: string
  date: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
  glowColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneFitnessMilestoneComponent({ config, frame, durationInFrames }: MotionGraphicProps<SceneFitnessMilestoneConfig>) {
  const { achievement, stat, statLabel, previousBest, date, bgColor, cardColor, accentColor, textColor, glowColor } = config
  const progress = frame / durationInFrames
  const fps = 30
  const timeS = frame / fps

  const enterProgress = Math.min(1, progress / 0.25)
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Trophy icon drops in with elastic bounce
  const trophyDrop = easeOutElastic(Math.min(1, enterProgress / 0.4))
  const trophyY = (1 - trophyDrop) * -80

  // Radial burst rings
  const burstPhase = Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5))
  const rings = Array.from({ length: 3 }, (_, i) => {
    const ringDelay = i * 0.15
    const ringProgress = Math.max(0, Math.min(1, (burstPhase - ringDelay) / 0.6))
    return {
      scale: ringProgress * (3 + i),
      alpha: Math.max(0, 0.3 - ringProgress * 0.35),
    }
  })

  // Stat counter
  const statReveal = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.35)))

  // Achievement text
  const achieveReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3)))

  // Previous best
  const prevReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.3)))

  // Date
  const dateReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.25)))

  // Hold: trophy glow pulses
  const glowPulse = holdProgress > 0 ? 0.3 + Math.sin(holdProgress * Math.PI * 6) * 0.15 : 0

  // Sparkle particles during hold
  const sparkles = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 + timeS * 1.5
    const dist = 45 + Math.sin(timeS * 2 + i) * 10
    const x = 50 + Math.cos(angle) * dist * 0.4
    const y = 35 + Math.sin(angle) * dist * 0.3
    const alpha = holdProgress > 0 ? 0.3 + Math.sin(timeS * 4 + i * 1.2) * 0.2 : 0
    return { x, y, alpha }
  })

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
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Burst rings */}
      {rings.map((ring, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: `2px solid ${glowColor}`,
            transform: `translate(-50%, -50%) scale(${ring.scale})`,
            opacity: ring.alpha * exitOpacity,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Sparkles */}
      {sparkles.map((s, i) => (
        <div
          key={`s-${i}`}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: glowColor,
            boxShadow: `0 0 6px ${glowColor}`,
            opacity: s.alpha * exitOpacity,
            pointerEvents: 'none',
          }}
        />
      ))}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '85%',
          maxWidth: 400,
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.12})`,
        }}
      >
        {/* Trophy with glow */}
        <div
          style={{
            position: 'relative',
            marginBottom: 'clamp(8px, 1.5vw, 14px)',
            transform: `translateY(${trophyY}px)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-50%',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${glowColor}${Math.round(glowPulse * 255).toString(16).padStart(2, '0')}, transparent 60%)`,
            }}
          />
          <div style={{ fontSize: 'clamp(44px, 10vw, 76px)', position: 'relative', zIndex: 1 }}>{'🏆'}</div>
        </div>

        {/* NEW RECORD badge */}
        <div
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${glowColor})`,
            color: '#FFFFFF',
            fontSize: 'clamp(9px, 1.5vw, 13px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            padding: 'clamp(3px, 0.6vw, 6px) clamp(12px, 2vw, 22px)',
            borderRadius: 100,
            marginBottom: 'clamp(12px, 2.5vw, 20px)',
            transform: `scale(${easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3)))})`,
            boxShadow: `0 4px 16px ${accentColor}40`,
          }}
        >
          NEW RECORD
        </div>

        {/* Main stat */}
        <div
          style={{
            fontSize: 'clamp(36px, 10vw, 72px)',
            fontWeight: 900,
            color: accentColor,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            opacity: statReveal,
            transform: `scale(${statReveal}) translateY(${(1 - statReveal) * 20}px)`,
            marginBottom: 'clamp(2px, 0.5vw, 4px)',
            textShadow: `0 0 20px ${accentColor}30`,
          }}
        >
          {stat}
        </div>
        <div
          style={{
            fontSize: 'clamp(11px, 1.8vw, 15px)',
            fontWeight: 600,
            color: `${textColor}88`,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            opacity: statReveal,
            marginBottom: 'clamp(10px, 2vw, 18px)',
          }}
        >
          {statLabel}
        </div>

        {/* Achievement card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(12px, 2.5vw, 20px)',
            padding: 'clamp(14px, 3vw, 26px)',
            width: '100%',
            border: `1px solid ${accentColor}25`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(14px, 2.5vw, 20px)',
              fontWeight: 800,
              color: textColor,
              textAlign: 'center',
              opacity: achieveReveal,
              marginBottom: 'clamp(8px, 1.5vw, 14px)',
            }}
          >
            {achievement}
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `${accentColor}20`,
              marginBottom: 'clamp(8px, 1.5vw, 14px)',
              width: `${easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.2))) * 100}%`,
              margin: '0 auto clamp(8px, 1.5vw, 14px)',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ opacity: prevReveal }}>
              <div style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 700, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Previous Best</div>
              <div style={{ fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 700, color: `${textColor}aa` }}>{previousBest}</div>
            </div>
            <div style={{ opacity: dateReveal, textAlign: 'right' }}>
              <div style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 700, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Achieved</div>
              <div style={{ fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 700, color: `${textColor}aa` }}>{date}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-fitness-milestone',
  title: 'Fitness Milestone',
  description: 'Fitness achievement celebration with trophy drop, burst rings, new record badge, stat counter, and sparkle effects',
  tags: ['scene', 'fitness', 'milestone', 'achievement', 'trophy', 'record', 'celebrate'],
  category: 'scene-layout',
  component: SceneFitnessMilestoneComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    achievement: 'First 10K Run Completed!',
    stat: '48:32',
    statLabel: 'Finish Time',
    previousBest: '52:15',
    date: 'Mar 19, 2026',
    bgColor: '#0A0E1A',
    cardColor: '#141B2D',
    accentColor: '#F59E0B',
    textColor: '#F0F6FC',
    glowColor: '#FCD34D',
  },
  configSchema: [
    { key: 'achievement', label: 'Achievement', type: 'text', defaultValue: 'First 10K Run Completed!', group: 'Content' },
    { key: 'stat', label: 'Main Stat', type: 'text', defaultValue: '48:32', group: 'Content' },
    { key: 'statLabel', label: 'Stat Label', type: 'text', defaultValue: 'Finish Time', group: 'Content' },
    { key: 'previousBest', label: 'Previous Best', type: 'text', defaultValue: '52:15', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'Mar 19, 2026', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0E1A', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#141B2D', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F59E0B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F0F6FC', group: 'Style' },
    { key: 'glowColor', label: 'Glow Color', type: 'color', defaultValue: '#FCD34D', group: 'Style' },
  ],
})
