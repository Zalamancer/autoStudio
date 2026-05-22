import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMoonPhaseConfig {
  currentPhase: string
  date: string
  illumination: number
  nextFullMoon: string
  bgColor: string
  textColor: string
  moonColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const PHASES = [
  { name: 'New Moon', shadow: 100 },
  { name: 'Waxing Crescent', shadow: 75 },
  { name: 'First Quarter', shadow: 50 },
  { name: 'Waxing Gibbous', shadow: 25 },
  { name: 'Full Moon', shadow: 0 },
  { name: 'Waning Gibbous', shadow: 25 },
  { name: 'Last Quarter', shadow: 50 },
  { name: 'Waning Crescent', shadow: 75 },
]

function SceneMoonPhaseComponent({ config, progress }: MotionGraphicProps<SceneMoonPhaseConfig>) {
  const { currentPhase, date, illumination, nextFullMoon, bgColor, textColor, moonColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Main moon enters with bounce
  const moonEnter = easeOutBack(Math.min(1, enterProgress / 0.6))
  const textEnter = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))
  const phasesEnter = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))
  const detailEnter = easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4))

  // Find current phase shadow amount
  const currentPhaseData = PHASES.find(p => p.name.toLowerCase() === currentPhase.toLowerCase()) || PHASES[4]
  const shadowPercent = currentPhaseData.shadow

  // Subtle glow pulse during hold
  const isHolding = progress >= 0.2 && progress < 0.85
  const glowPulse = isHolding ? 0.8 + Math.sin(progress * Math.PI * 6) * 0.2 : 1

  // Stars
  const stars = Array.from({ length: 45 }, (_, i) => ({
    x: ((i * 73 + 17) % 100),
    y: ((i * 47 + 31) % 100),
    size: 0.5 + ((i * 13) % 2),
    opacity: 0.12 + ((i * 29) % 4) / 15 + Math.sin(progress * Math.PI * 8 + i) * 0.06,
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

      {/* Main moon */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${moonEnter})`,
        }}
      >
        <div
          style={{
            width: 'clamp(80px, 22vw, 160px)',
            height: 'clamp(80px, 22vw, 160px)',
            borderRadius: '50%',
            background: `radial-gradient(circle at 40% 35%, ${moonColor}, #C0C0C0, #A0A0A0)`,
            boxShadow: `0 0 ${30 * glowPulse}px ${moonColor}30, 0 0 ${60 * glowPulse}px ${moonColor}15`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Moon craters */}
          {[
            { x: 30, y: 25, s: 12 },
            { x: 60, y: 40, s: 8 },
            { x: 45, y: 65, s: 15 },
            { x: 70, y: 20, s: 6 },
            { x: 25, y: 55, s: 10 },
          ].map((crater, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${crater.x}%`,
                top: `${crater.y}%`,
                width: crater.s,
                height: crater.s,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.08)',
                boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.15)',
              }}
            />
          ))}
          {/* Shadow overlay for phase */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, rgba(0,0,0,0.85) ${shadowPercent}%, transparent ${shadowPercent}%)`,
              borderRadius: '50%',
            }}
          />
        </div>
      </div>

      {/* Phase name */}
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: textEnter,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(22px, 5.5vw, 42px)',
            fontWeight: 900,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.6vw, 5px)',
          }}
        >
          {currentPhase}
        </div>
        <div style={{ fontSize: 'clamp(11px, 2.2vw, 16px)', color: `${textColor}70`, marginTop: 4 }}>{date}</div>
      </div>

      {/* Phase cycle strip */}
      <div
        style={{
          position: 'absolute',
          top: '56%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 'clamp(6px, 1.5vw, 14px)',
          opacity: phasesEnter,
        }}
      >
        {PHASES.map((phase, i) => {
          const isCurrent = phase.name.toLowerCase() === currentPhase.toLowerCase()
          const miniSize = isCurrent ? 'clamp(18px, 4vw, 28px)' : 'clamp(12px, 3vw, 20px)'
          return (
            <div key={i} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: miniSize,
                  height: miniSize,
                  borderRadius: '50%',
                  background: moonColor,
                  position: 'relative',
                  overflow: 'hidden',
                  border: isCurrent ? `2px solid ${accentColor}` : `1px solid ${textColor}20`,
                  boxShadow: isCurrent ? `0 0 8px ${accentColor}40` : 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(90deg, rgba(0,0,0,0.85) ${phase.shadow}%, transparent ${phase.shadow}%)`,
                    borderRadius: '50%',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom details */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: 400,
          opacity: detailEnter,
          transform: `translateX(-50%) translateY(${(1 - detailEnter) * 15}px)`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2%' }}>
          <div style={{ fontSize: 'clamp(11px, 2vw, 15px)', color: `${textColor}70` }}>
            Illumination
          </div>
          <div style={{ fontSize: 'clamp(11px, 2vw, 15px)', color: accentColor, fontWeight: 700 }}>
            {illumination}%
          </div>
        </div>
        {/* Illumination bar */}
        <div
          style={{
            width: '100%',
            height: 4,
            background: `${textColor}15`,
            borderRadius: 2,
            marginBottom: '4%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${illumination * detailEnter}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${accentColor}, ${moonColor})`,
              borderRadius: 2,
            }}
          />
        </div>
        <div style={{ fontSize: 'clamp(10px, 2vw, 14px)', color: `${textColor}60` }}>
          Next full moon: <span style={{ color: accentColor }}>{nextFullMoon}</span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-moon-phase',
  title: 'Moon Phase',
  description: 'Moon phase calendar display with detailed moon visualization, phase cycle strip, illumination bar, and next full moon date',
  tags: ['scene', 'space', 'moon', 'lunar', 'astronomy', 'calendar', 'night-sky'],
  category: 'scene-layout',
  component: SceneMoonPhaseComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'currentPhase', label: 'Current Phase', type: 'text', defaultValue: 'Waxing Gibbous', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'March 19, 2026', group: 'Content' },
    { key: 'illumination', label: 'Illumination %', type: 'number', defaultValue: 78, min: 0, max: 100, group: 'Content' },
    { key: 'nextFullMoon', label: 'Next Full Moon', type: 'text', defaultValue: 'March 25, 2026', group: 'Content' },
    { key: 'moonColor', label: 'Moon Color', type: 'color', defaultValue: '#D4D4D8', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#A78BFA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08081A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
  ],
  defaultConfig: {
    currentPhase: 'Waxing Gibbous',
    date: 'March 19, 2026',
    illumination: 78,
    nextFullMoon: 'March 25, 2026',
    moonColor: '#D4D4D8',
    accentColor: '#A78BFA',
    bgColor: '#08081A',
    textColor: '#E2E8F0',
  },
})
