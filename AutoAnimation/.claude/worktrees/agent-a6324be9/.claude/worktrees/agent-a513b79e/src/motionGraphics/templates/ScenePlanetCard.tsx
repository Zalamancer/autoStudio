import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PlanetCardConfig {
  planetName: string
  size: string
  distanceFromSun: string
  funFact: string
  planetColor: string
  ringColor: string
  hasRing: boolean
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePlanetCardComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<PlanetCardConfig>) {
  const { planetName, size, distanceFromSun, funFact, planetColor, ringColor, hasRing, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Star field (static positions seeded)
  const stars = Array.from({ length: 40 }, (_, i) => ({
    x: ((i * 73 + 17) % 100),
    y: ((i * 47 + 31) % 100),
    size: 1 + ((i * 13) % 3),
    opacity: 0.3 + ((i * 29) % 7) / 10,
  }))

  // Enter: planet scales in with bounce (0-0.2)
  const planetScale = progress < 0.2
    ? easeOutBack(Math.min(1, progress / 0.2))
    : 1

  // Orbit ring draws in (0.05-0.25)
  const orbitProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.05) / 0.2)))

  // Planet name slides in (0.15-0.3)
  const nameProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.15) / 0.15)))
  const nameSlideX = (1 - nameProgress) * 60

  // Data fields appear staggered (0.25-0.5)
  const sizeProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.25) / 0.12)))
  const distProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.32) / 0.12)))
  const factProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.4) / 0.15)))

  // Hold: planet rotates gently (0.3-0.8)
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const planetRotation = holdProgress * 360

  // Star twinkle
  const twinkle = Math.sin(progress * Math.PI * 8)

  // Exit: fade and scale down (0.85-1.0)
  const exitProgress = progress >= 0.85 ? easeOutCubic((progress - 0.85) / 0.15) : 0
  const exitScale = 1 - exitProgress * 0.3
  const exitOpacity = 1 - exitProgress

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        transform: `scale(${exitScale})`,
        opacity: exitOpacity,
      }}
    >
      {/* Star field */}
      {stars.map((star, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: '#FFFFFF',
            opacity: star.opacity + (i % 3 === 0 ? twinkle * 0.2 : 0),
          }}
        />
      ))}

      {/* Orbit ring */}
      <div
        style={{
          position: 'absolute',
          top: '28%',
          left: '50%',
          width: 'clamp(120px, 30vw, 260px)',
          height: 'clamp(120px, 30vw, 260px)',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: `1px solid ${planetColor}30`,
          opacity: orbitProgress,
        }}
      />

      {/* Planet */}
      <div
        style={{
          position: 'absolute',
          top: '28%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${planetScale})`,
        }}
      >
        <div
          style={{
            width: 'clamp(80px, 20vw, 160px)',
            height: 'clamp(80px, 20vw, 160px)',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${planetColor}CC, ${planetColor}, ${planetColor}88)`,
            boxShadow: `0 0 40px ${planetColor}40, inset -10px -10px 30px rgba(0,0,0,0.4)`,
            position: 'relative',
          }}
        >
          {/* Planet ring (for Saturn-like planets) */}
          {hasRing && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '180%',
                height: '40%',
                transform: `translate(-50%, -50%) rotateX(70deg) rotate(${planetRotation * 0.1}deg)`,
                borderRadius: '50%',
                border: `3px solid ${ringColor}80`,
                boxShadow: `0 0 8px ${ringColor}40`,
              }}
            />
          )}
        </div>
      </div>

      {/* Info card area */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: 500,
        }}
      >
        {/* Planet name */}
        <div
          style={{
            fontSize: 'clamp(28px, 7vw, 56px)',
            fontWeight: 900,
            color: planetColor,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(3px, 0.8vw, 8px)',
            marginBottom: '3%',
            opacity: nameProgress,
            transform: `translateX(${nameSlideX}px)`,
          }}
        >
          {planetName}
        </div>

        {/* Divider */}
        <div
          style={{
            width: `${nameProgress * 60}%`,
            height: 2,
            background: `linear-gradient(90deg, ${planetColor}, transparent)`,
            marginBottom: '4%',
          }}
        />

        {/* Size */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.5vw, 20px)',
            color: `${textColor}90`,
            marginBottom: '2%',
            opacity: sizeProgress,
            transform: `translateX(${(1 - sizeProgress) * 30}px)`,
          }}
        >
          <span style={{ color: planetColor, fontWeight: 700, marginRight: 8 }}>SIZE</span>
          {size}
        </div>

        {/* Distance */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.5vw, 20px)',
            color: `${textColor}90`,
            marginBottom: '4%',
            opacity: distProgress,
            transform: `translateX(${(1 - distProgress) * 30}px)`,
          }}
        >
          <span style={{ color: planetColor, fontWeight: 700, marginRight: 8 }}>DISTANCE</span>
          {distanceFromSun}
        </div>

        {/* Fun fact */}
        <div
          style={{
            fontSize: 'clamp(14px, 3vw, 24px)',
            color: textColor,
            lineHeight: 1.5,
            fontStyle: 'italic',
            opacity: factProgress,
            transform: `translateY(${(1 - factProgress) * 20}px)`,
            borderLeft: `3px solid ${planetColor}60`,
            paddingLeft: 'clamp(8px, 2vw, 16px)',
          }}
        >
          {funFact}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-planet-card',
  title: 'Planet Info Card',
  description:
    'Planet information card with visual planet, orbit ring, size/distance data, and fun fact on a starry deep space background',
  tags: ['scene', 'science', 'space', 'planet', 'astronomy', 'educational'],
  category: 'scene-layout',
  component: ScenePlanetCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'planetName', label: 'Planet Name', type: 'text', defaultValue: 'Saturn', group: 'Content' },
    { key: 'size', label: 'Size', type: 'text', defaultValue: '116,460 km diameter', group: 'Content' },
    { key: 'distanceFromSun', label: 'Distance from Sun', type: 'text', defaultValue: '1.4 billion km', group: 'Content' },
    { key: 'funFact', label: 'Fun Fact', type: 'text', defaultValue: 'Saturn could float in water because its density is lower than water!', group: 'Content' },
    { key: 'hasRing', label: 'Has Ring', type: 'boolean', defaultValue: true, group: 'Content' },
    { key: 'planetColor', label: 'Planet Color', type: 'color', defaultValue: '#E8B84B', group: 'Style' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#D4A843', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0E2A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    planetName: 'Saturn',
    size: '116,460 km diameter',
    distanceFromSun: '1.4 billion km',
    funFact: 'Saturn could float in water because its density is lower than water!',
    hasRing: true,
    planetColor: '#E8B84B',
    ringColor: '#D4A843',
    bgColor: '#0A0E2A',
    textColor: '#E8E8E8',
  },
})
