import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePlanetFactConfig {
  planetName: string
  diameter: string
  gravity: string
  dayLength: string
  yearLength: string
  moons: number
  funFact: string
  planetColor: string
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

function ScenePlanetFactComponent({ config, progress }: MotionGraphicProps<ScenePlanetFactConfig>) {
  const { planetName, diameter, gravity, dayLength, yearLength, moons, funFact, planetColor, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const planetEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const nameEnter = easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.4))
  const stat1Enter = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.3))
  const stat2Enter = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.3))
  const stat3Enter = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.3))
  const stat4Enter = easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.3))
  const factEnter = easeOutCubic(Math.max(0, (enterProgress - 0.7) / 0.3))

  // Planet slow rotation
  const isHolding = progress >= 0.2 && progress < 0.85
  const rotationHighlight = isHolding ? holdProgress * 30 : 0

  // Stars
  const stars = Array.from({ length: 35 }, (_, i) => ({
    x: ((i * 73 + 11) % 100),
    y: ((i * 47 + 29) % 100),
    size: 0.5 + ((i * 13) % 2),
    opacity: 0.12 + ((i * 29) % 4) / 15,
  }))

  const stats = [
    { label: 'Diameter', value: diameter, enter: stat1Enter },
    { label: 'Gravity', value: gravity, enter: stat2Enter },
    { label: 'Day Length', value: dayLength, enter: stat3Enter },
    { label: 'Year Length', value: yearLength, enter: stat4Enter },
  ]

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

      {/* Planet */}
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${planetEnter})`,
        }}
      >
        <div
          style={{
            width: 'clamp(70px, 18vw, 130px)',
            height: 'clamp(70px, 18vw, 130px)',
            borderRadius: '50%',
            background: `radial-gradient(circle at ${35 + rotationHighlight * 0.3}% 35%, ${planetColor}CC, ${planetColor}, ${planetColor}88)`,
            boxShadow: `0 0 30px ${planetColor}30, inset -8px -8px 20px rgba(0,0,0,0.35)`,
          }}
        />
        {/* Moons count indicator */}
        {moons > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -8,
              background: accentColor,
              color: bgColor,
              fontSize: 'clamp(8px, 1.5vw, 12px)',
              fontWeight: 800,
              borderRadius: 100,
              padding: '2px 6px',
              minWidth: 18,
              textAlign: 'center',
            }}
          >
            {moons} {moons === 1 ? 'moon' : 'moons'}
          </div>
        )}
      </div>

      {/* Planet name */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: nameEnter,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(26px, 6.5vw, 46px)',
            fontWeight: 900,
            color: planetColor,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(3px, 0.7vw, 7px)',
          }}
        >
          {planetName}
        </div>
        <div
          style={{
            width: `${nameEnter * 40}%`,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${planetColor}, transparent)`,
            margin: '8px auto 0',
          }}
        />
      </div>

      {/* Stats grid */}
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          maxWidth: 420,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(6px, 1.5vw, 12px)',
        }}
      >
        {stats.map((stat, i) => (
          <div
            key={i}
            style={{
              padding: 'clamp(8px, 1.5vw, 14px)',
              background: `${textColor}05`,
              borderRadius: 'clamp(6px, 1vw, 10px)',
              borderLeft: `3px solid ${planetColor}40`,
              opacity: stat.enter,
              transform: `translateX(${(1 - stat.enter) * 20}px)`,
            }}
          >
            <div style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', color: `${textColor}50`, textTransform: 'uppercase', letterSpacing: 1 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 'clamp(13px, 2.8vw, 20px)', color: textColor, fontWeight: 700, marginTop: 2 }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Fun fact */}
      <div
        style={{
          position: 'absolute',
          bottom: '7%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: 400,
          textAlign: 'center',
          opacity: factEnter,
          transform: `translateX(-50%) translateY(${(1 - factEnter) * 15}px)`,
        }}
      >
        <div style={{ fontSize: 'clamp(9px, 1.8vw, 12px)', color: accentColor, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>
          Did you know?
        </div>
        <div style={{ fontSize: 'clamp(12px, 2.5vw, 18px)', color: `${textColor}90`, lineHeight: 1.5, fontStyle: 'italic' }}>
          {funFact}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-planet-fact',
  title: 'Planet Fact Card',
  description: 'Planet fact card with 3D planet, stats grid (diameter, gravity, day/year length), moon count badge, and fun fact',
  tags: ['scene', 'space', 'planet', 'facts', 'astronomy', 'educational', 'stats'],
  category: 'scene-layout',
  component: ScenePlanetFactComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'planetName', label: 'Planet Name', type: 'text', defaultValue: 'Jupiter', group: 'Content' },
    { key: 'diameter', label: 'Diameter', type: 'text', defaultValue: '139,820 km', group: 'Content' },
    { key: 'gravity', label: 'Gravity', type: 'text', defaultValue: '24.79 m/s²', group: 'Content' },
    { key: 'dayLength', label: 'Day Length', type: 'text', defaultValue: '9h 56m', group: 'Content' },
    { key: 'yearLength', label: 'Year Length', type: 'text', defaultValue: '11.86 years', group: 'Content' },
    { key: 'moons', label: 'Number of Moons', type: 'number', defaultValue: 95, min: 0, max: 200, group: 'Content' },
    { key: 'funFact', label: 'Fun Fact', type: 'text', defaultValue: 'Jupiter has the shortest day of all planets, despite being the largest!', group: 'Content' },
    { key: 'planetColor', label: 'Planet Color', type: 'color', defaultValue: '#D8A860', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080820', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
  ],
  defaultConfig: {
    planetName: 'Jupiter',
    diameter: '139,820 km',
    gravity: '24.79 m/s²',
    dayLength: '9h 56m',
    yearLength: '11.86 years',
    moons: 95,
    funFact: 'Jupiter has the shortest day of all planets, despite being the largest!',
    planetColor: '#D8A860',
    accentColor: '#60A5FA',
    bgColor: '#080820',
    textColor: '#E2E8F0',
  },
})
