import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSolarSystemConfig {
  title: string
  subtitle: string
  highlightPlanet: string
  bgColor: string
  textColor: string
  sunColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

const PLANETS = [
  { name: 'Mercury', color: '#B0A090', size: 4, orbit: 14 },
  { name: 'Venus', color: '#E8C080', size: 6, orbit: 20 },
  { name: 'Earth', color: '#4090D0', size: 6, orbit: 27 },
  { name: 'Mars', color: '#D06040', size: 5, orbit: 34 },
  { name: 'Jupiter', color: '#D8B070', size: 14, orbit: 46 },
  { name: 'Saturn', color: '#E8C860', size: 12, orbit: 58 },
  { name: 'Uranus', color: '#80C8D8', size: 9, orbit: 68 },
  { name: 'Neptune', color: '#4070C0', size: 8, orbit: 78 },
]

function SceneSolarSystemComponent({ config, progress }: MotionGraphicProps<SceneSolarSystemConfig>) {
  const { title, subtitle, highlightPlanet, bgColor, textColor, sunColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const sunScale = easeOutCubic(Math.min(1, enterProgress / 0.5))
  const titleEnter = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))

  // Background stars
  const stars = Array.from({ length: 40 }, (_, i) => ({
    x: ((i * 71 + 13) % 100),
    y: ((i * 47 + 29) % 100),
    size: 0.5 + ((i * 11) % 2),
    opacity: 0.15 + ((i * 23) % 4) / 15,
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

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: titleEnter,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(20px, 5vw, 36px)',
            fontWeight: 900,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.6vw, 5px)',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 'clamp(10px, 2vw, 16px)',
            color: `${textColor}80`,
            marginTop: 4,
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Solar system diagram — top-down view */}
      <div
        style={{
          position: 'absolute',
          left: '3%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '94%',
          height: '50%',
        }}
      >
        {/* Sun */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            width: 'clamp(16px, 4vw, 32px)',
            height: 'clamp(16px, 4vw, 32px)',
            borderRadius: '50%',
            background: `radial-gradient(circle at 40% 40%, #FFF8E0, ${sunColor})`,
            boxShadow: `0 0 20px ${sunColor}80, 0 0 40px ${sunColor}40`,
            transform: `translate(-50%, -50%) scale(${sunScale})`,
          }}
        />

        {/* Orbit lines and planets */}
        {PLANETS.map((planet, i) => {
          const planetEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1 - i * 0.08) / 0.3)))
          const isHighlighted = planet.name.toLowerCase() === highlightPlanet.toLowerCase()
          const orbitAngle = progress * (60 - i * 5) // Slower for outer planets
          const orbitX = planet.orbit
          const wobbleY = Math.sin(orbitAngle * Math.PI / 180) * 8

          return (
            <React.Fragment key={planet.name}>
              {/* Orbit line */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  width: `${planet.orbit}%`,
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${textColor}15)`,
                  opacity: planetEnter,
                  transform: 'translateY(-50%)',
                }}
              />
              {/* Planet */}
              <div
                style={{
                  position: 'absolute',
                  left: `${orbitX}%`,
                  top: `calc(50% + ${wobbleY}px)`,
                  width: planet.size,
                  height: planet.size,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${planet.color}CC, ${planet.color})`,
                  boxShadow: isHighlighted
                    ? `0 0 12px ${accentColor}80, 0 0 24px ${accentColor}40`
                    : `0 0 4px ${planet.color}40`,
                  transform: `translate(-50%, -50%) scale(${planetEnter})`,
                  border: isHighlighted ? `1.5px solid ${accentColor}` : 'none',
                }}
              />
              {/* Planet label */}
              <div
                style={{
                  position: 'absolute',
                  left: `${orbitX}%`,
                  top: `calc(50% + ${wobbleY + planet.size / 2 + 8}px)`,
                  transform: 'translateX(-50%)',
                  fontSize: 'clamp(7px, 1.5vw, 11px)',
                  color: isHighlighted ? accentColor : `${textColor}60`,
                  fontWeight: isHighlighted ? 700 : 400,
                  whiteSpace: 'nowrap',
                  opacity: planetEnter,
                  textAlign: 'center',
                }}
              >
                {planet.name}
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {/* Distance scale bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: titleEnter,
          textAlign: 'center',
        }}
      >
        <div style={{ width: 'clamp(60px, 15vw, 120px)', height: 1, background: `${textColor}40`, margin: '0 auto 4px' }} />
        <div style={{ fontSize: 'clamp(8px, 1.8vw, 12px)', color: `${textColor}50` }}>Not to scale</div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-solar-system',
  title: 'Solar System',
  description: 'Solar system planet diagram with orbiting planets, sun, labels, and optional planet highlighting on a starry deep space background',
  tags: ['scene', 'space', 'solar-system', 'planets', 'astronomy', 'educational', 'diagram'],
  category: 'scene-layout',
  component: SceneSolarSystemComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Our Solar System', group: 'Content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: '8 planets orbiting the Sun', group: 'Content' },
    { key: 'highlightPlanet', label: 'Highlight Planet', type: 'text', defaultValue: 'Earth', group: 'Content' },
    { key: 'sunColor', label: 'Sun Color', type: 'color', defaultValue: '#FFA500', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060818', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
  ],
  defaultConfig: {
    title: 'Our Solar System',
    subtitle: '8 planets orbiting the Sun',
    highlightPlanet: 'Earth',
    sunColor: '#FFA500',
    accentColor: '#60A5FA',
    bgColor: '#060818',
    textColor: '#E2E8F0',
  },
})
