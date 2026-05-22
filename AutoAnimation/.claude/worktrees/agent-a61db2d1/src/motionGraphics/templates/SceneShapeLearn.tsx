import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneShapeLearnConfig {
  shapeName: string
  sides: number
  shapeColor: string
  funFact: string
  bgColor: string
  cardColor: string
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

function easeInCubic(t: number): number {
  return t * t * t
}

// Generate polygon points for SVG
function getPolygonPoints(sides: number, radius: number, cx: number, cy: number): string {
  if (sides <= 0) return ''
  const points: string[] = []
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return points.join(' ')
}

function SceneShapeLearnComponent({ config, progress }: MotionGraphicProps<SceneShapeLearnConfig>) {
  const { shapeName, sides, shapeColor, funFact, bgColor, cardColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardScale = enterProgress < 1
    ? easeOutBack(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.2
      : 1
  const cardOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : easeOutCubic(enterProgress)

  // Shape drawing animation - stroke dashoffset
  const shapeDrawProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.8)))

  // Shape rotation during hold
  const shapeRotate = holdProgress * 360

  // Shape fill appears after draw
  const shapeFillOpacity = enterProgress >= 1 ? easeOutCubic(Math.min(1, holdProgress / 0.3)) : 0

  // Info reveals
  const nameReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))
  const sidesReveal = holdProgress > 0.1 ? easeOutCubic(Math.min(1, (holdProgress - 0.1) / 0.3)) : 0
  const factReveal = holdProgress > 0.4 ? easeOutCubic(Math.min(1, (holdProgress - 0.4) / 0.3)) : 0

  // Side count dots
  const revealedSides = Math.min(sides, Math.floor(holdProgress * (sides + 2)))

  const svgSize = 140
  const radius = 55
  const cx = svgSize / 2
  const cy = svgSize / 2

  // Special handling for circle
  const isCircle = sides <= 2 || sides > 20

  // Calculate circumference for stroke animation
  const circumference = isCircle ? 2 * Math.PI * radius : sides * 2 * radius * Math.sin(Math.PI / sides)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
      }}
    >
      {/* Scattered shapes background */}
      {Array.from({ length: 6 }).map((_, i) => {
        const shapes = ['\u25B3', '\u25A1', '\u25CB', '\u2B21', '\u25C7', '\u2B22']
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${10 + (i * 18) % 80}%`,
              top: `${8 + (i * 23) % 80}%`,
              fontSize: 'clamp(16px, 3vw, 28px)',
              color: shapeColor,
              opacity: 0.08,
              transform: `rotate(${i * 40}deg)`,
            }}
          >
            {shapes[i]}
          </div>
        )
      })}

      <div
        style={{
          transform: `scale(${cardScale})`,
          opacity: cardOpacity,
          width: '85%',
          maxWidth: '480px',
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 3vw, 28px)',
            padding: 'clamp(20px, 5vw, 40px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            border: `3px solid ${shapeColor}25`,
            textAlign: 'center',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'inline-block',
              background: `${shapeColor}15`,
              color: shapeColor,
              fontSize: 'clamp(9px, 1.8vw, 14px)',
              fontWeight: 700,
              padding: 'clamp(3px, 0.6vw, 6px) clamp(12px, 2.5vw, 22px)',
              borderRadius: '100px',
              marginBottom: 'clamp(14px, 3vw, 24px)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {'\u{1F4D0}'} Shape of the Day
          </div>

          {/* SVG shape */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 'clamp(12px, 3vw, 24px)',
              transform: `rotate(${shapeRotate * 0.02}deg)`,
            }}
          >
            <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
              {isCircle ? (
                <>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={shapeColor}
                    fillOpacity={shapeFillOpacity * 0.2}
                    stroke={shapeColor}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - shapeDrawProgress)}
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <polygon
                  points={getPolygonPoints(sides, radius, cx, cy)}
                  fill={shapeColor}
                  fillOpacity={shapeFillOpacity * 0.2}
                  stroke={shapeColor}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - shapeDrawProgress)}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </div>

          {/* Shape name */}
          <div
            style={{
              fontSize: 'clamp(28px, 7vw, 52px)',
              fontWeight: 700,
              color: shapeColor,
              marginBottom: 'clamp(6px, 1.5vw, 12px)',
              opacity: nameReveal,
              transform: `translateY(${(1 - nameReveal) * 15}px)`,
              textShadow: `2px 2px 0 ${shapeColor}20`,
            }}
          >
            {shapeName}
          </div>

          {/* Side count dots */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(4px, 0.8vw, 8px)',
              marginBottom: 'clamp(12px, 3vw, 20px)',
              opacity: sidesReveal,
            }}
          >
            {Array.from({ length: isCircle ? 0 : sides }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 'clamp(10px, 2vw, 16px)',
                  height: 'clamp(10px, 2vw, 16px)',
                  borderRadius: '50%',
                  background: i < revealedSides ? shapeColor : `${shapeColor}30`,
                  transform: `scale(${i === revealedSides - 1 ? 1.3 : 1})`,
                }}
              />
            ))}
            <span
              style={{
                fontSize: 'clamp(11px, 2vw, 16px)',
                color: `${textColor}88`,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                marginLeft: '4px',
                alignSelf: 'center',
              }}
            >
              {isCircle ? '0 corners' : `${sides} sides`}
            </span>
          </div>

          {/* Fun fact */}
          <div
            style={{
              fontSize: 'clamp(12px, 2.5vw, 18px)',
              fontWeight: 500,
              color: textColor,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              lineHeight: 1.5,
              opacity: factReveal,
              transform: `translateY(${(1 - factReveal) * 10}px)`,
              padding: '0 3%',
            }}
          >
            {funFact}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-shape-learn',
  title: 'Shape Learn',
  description: 'Shapes learning card with animated SVG shape drawing, side counter dots, and fun fact. Shape fills in after stroke animation.',
  tags: ['scene', 'kids', 'education', 'shapes', 'geometry', 'learning', 'cartoon'],
  category: 'scene-layout',
  component: SceneShapeLearnComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    shapeName: 'Triangle',
    sides: 3,
    shapeColor: '#FF6B6B',
    funFact: 'A triangle is the strongest shape! That is why bridges and buildings use triangles to stay strong.',
    bgColor: '#FFF5F5',
    cardColor: '#FFFFFF',
    textColor: '#2D3436',
  },
  configSchema: [
    { key: 'shapeName', label: 'Shape Name', type: 'text', defaultValue: 'Triangle', group: 'Content' },
    { key: 'sides', label: 'Number of Sides', type: 'number', defaultValue: 3, min: 0, max: 12, group: 'Content' },
    { key: 'shapeColor', label: 'Shape Color', type: 'color', defaultValue: '#FF6B6B', group: 'Style' },
    { key: 'funFact', label: 'Fun Fact', type: 'text', defaultValue: 'A triangle is the strongest shape! That is why bridges and buildings use triangles to stay strong.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF5F5', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
  ],
})
