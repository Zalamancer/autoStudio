import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneConstellationMapConfig {
  constellationName: string
  starCount: number
  mythology: string
  bestViewing: string
  bgColor: string
  textColor: string
  accentColor: string
  lineColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneConstellationMapComponent({ config, progress }: MotionGraphicProps<SceneConstellationMapConfig>) {
  const { constellationName, starCount, mythology, bestViewing, bgColor, textColor, accentColor, lineColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Generate constellation star positions (seeded)
  const constellationStars = Array.from({ length: Math.min(starCount, 12) }, (_, i) => ({
    x: 25 + ((i * 47 + 13) % 50),
    y: 15 + ((i * 31 + 7) % 35),
    size: 3 + ((i * 17) % 4),
  }))

  // Constellation lines connecting stars
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = 0; i < constellationStars.length - 1; i++) {
    lines.push({
      x1: constellationStars[i].x,
      y1: constellationStars[i].y,
      x2: constellationStars[i + 1].x,
      y2: constellationStars[i + 1].y,
    })
  }

  // Background stars
  const bgStars = Array.from({ length: 60 }, (_, i) => ({
    x: ((i * 67 + 19) % 100),
    y: ((i * 43 + 31) % 100),
    size: 0.5 + ((i * 13) % 2),
    opacity: 0.15 + ((i * 29) % 4) / 15 + Math.sin(progress * Math.PI * 6 + i) * 0.08,
  }))

  // Star draw progress
  const starDrawProgress = easeOutCubic(enterProgress)
  const lineDrawProgress = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))
  const textEnter = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))
  const mythEnter = easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4))
  const viewEnter = easeOutCubic(Math.max(0, (enterProgress - 0.7) / 0.3))

  // Hold: subtle twinkle
  const twinkle = Math.sin(progress * Math.PI * 8)

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
      {/* Background stars */}
      {bgStars.map((s, i) => (
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

      {/* Constellation lines (SVG overlay) */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {lines.map((line, i) => {
          const lineProgress = Math.max(0, Math.min(1, (lineDrawProgress - i / lines.length * 0.5) / 0.5))
          const dx = line.x2 - line.x1
          const dy = line.y2 - line.y1
          return (
            <line
              key={i}
              x1={`${line.x1}%`}
              y1={`${line.y1}%`}
              x2={`${line.x1 + dx * lineProgress}%`}
              y2={`${line.y1 + dy * lineProgress}%`}
              stroke={lineColor}
              strokeWidth={1.5}
              opacity={0.5}
            />
          )
        })}
      </svg>

      {/* Constellation stars */}
      {constellationStars.map((star, i) => {
        const starProgress = Math.max(0, Math.min(1, (starDrawProgress - i / constellationStars.length * 0.5) / 0.5))
        const glow = i % 3 === 0 ? twinkle * 0.2 : 0
        return (
          <div
            key={`cs-${i}`}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              background: accentColor,
              boxShadow: `0 0 ${6 + glow * 4}px ${accentColor}80`,
              opacity: starProgress,
              transform: `translate(-50%, -50%) scale(${starProgress})`,
            }}
          />
        )
      })}

      {/* Info panel */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          maxWidth: 500,
        }}
      >
        {/* Constellation name */}
        <div
          style={{
            fontSize: 'clamp(28px, 7vw, 52px)',
            fontWeight: 900,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(3px, 0.8vw, 8px)',
            marginBottom: '2%',
            opacity: textEnter,
            transform: `translateY(${(1 - textEnter) * 20}px)`,
          }}
        >
          {constellationName}
        </div>

        {/* Star count */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.5vw, 18px)',
            color: `${textColor}90`,
            marginBottom: '3%',
            opacity: textEnter,
          }}
        >
          <span style={{ color: accentColor, fontWeight: 700 }}>{starCount}</span> main stars
        </div>

        {/* Divider */}
        <div
          style={{
            width: `${textEnter * 50}%`,
            height: 1,
            background: `linear-gradient(90deg, ${accentColor}80, transparent)`,
            marginBottom: '3%',
          }}
        />

        {/* Mythology */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.8vw, 20px)',
            color: textColor,
            lineHeight: 1.5,
            fontStyle: 'italic',
            marginBottom: '3%',
            opacity: mythEnter,
            transform: `translateY(${(1 - mythEnter) * 15}px)`,
            borderLeft: `2px solid ${accentColor}50`,
            paddingLeft: 'clamp(8px, 1.5vw, 14px)',
          }}
        >
          {mythology}
        </div>

        {/* Best viewing */}
        <div
          style={{
            fontSize: 'clamp(11px, 2.2vw, 16px)',
            color: `${textColor}80`,
            opacity: viewEnter,
            transform: `translateY(${(1 - viewEnter) * 10}px)`,
          }}
        >
          Best viewing: <span style={{ color: accentColor, fontWeight: 600 }}>{bestViewing}</span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-constellation-map',
  title: 'Constellation Map',
  description: 'Star constellation map with animated star placement, connecting lines, mythology text, and viewing info on a starry background',
  tags: ['scene', 'space', 'constellation', 'stars', 'astronomy', 'educational', 'night-sky'],
  category: 'scene-layout',
  component: SceneConstellationMapComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'constellationName', label: 'Constellation Name', type: 'text', defaultValue: 'Orion', group: 'Content' },
    { key: 'starCount', label: 'Star Count', type: 'number', defaultValue: 7, min: 3, max: 12, group: 'Content' },
    { key: 'mythology', label: 'Mythology', type: 'text', defaultValue: 'Named after the great hunter of Greek mythology, placed among the stars by Zeus.', group: 'Content' },
    { key: 'bestViewing', label: 'Best Viewing', type: 'text', defaultValue: 'December - February', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'lineColor', label: 'Line Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060818', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
  ],
  defaultConfig: {
    constellationName: 'Orion',
    starCount: 7,
    mythology: 'Named after the great hunter of Greek mythology, placed among the stars by Zeus.',
    bestViewing: 'December - February',
    accentColor: '#60A5FA',
    lineColor: '#60A5FA',
    bgColor: '#060818',
    textColor: '#E2E8F0',
  },
})
