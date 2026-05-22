import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GoldenRatioConfig {
  overlayType: string
  title: string
  description: string
  bgColor: string
  lineColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneGoldenRatioComponent({ config, progress }: MotionGraphicProps<GoldenRatioConfig>) {
  const { overlayType, title, description, bgColor, lineColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Line draw animation
  const lineDraw = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.6)))

  // Golden ratio constant
  const phi = 1.618

  // Fibonacci spiral segment angles for golden spiral
  const spiralProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6)))

  // Pulsing glow during hold
  const glowPulse = holdProgress > 0 ? 0.3 + Math.sin(holdProgress * Math.PI * 4) * 0.15 : 0.3

  const isRuleOfThirds = overlayType === 'Rule of Thirds'
  const isGoldenSpiral = overlayType === 'Golden Spiral'
  const isDiagonals = overlayType === 'Diagonals'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Background "photo" placeholder gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #1a2030 0%, #2a1a30 50%, #1a2a20 100%)',
          opacity: 0.4,
        }}
      />

      {/* Composition overlay */}
      <div
        style={{
          position: 'absolute',
          inset: '8%',
          opacity: exitOpacity,
        }}
      >
        {/* Rule of thirds grid */}
        {isRuleOfThirds && (
          <>
            {[1, 2].map((i) => (
              <React.Fragment key={`thirds-${i}`}>
                {/* Vertical lines */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${(i / 3) * 100}%`,
                    top: 0,
                    bottom: `${(1 - lineDraw) * 100}%`,
                    width: 1,
                    background: lineColor,
                    opacity: glowPulse,
                    boxShadow: `0 0 4px ${lineColor}40`,
                  }}
                />
                {/* Horizontal lines */}
                <div
                  style={{
                    position: 'absolute',
                    top: `${(i / 3) * 100}%`,
                    left: 0,
                    right: `${(1 - lineDraw) * 100}%`,
                    height: 1,
                    background: lineColor,
                    opacity: glowPulse,
                    boxShadow: `0 0 4px ${lineColor}40`,
                  }}
                />
              </React.Fragment>
            ))}
            {/* Intersection dots */}
            {[1, 2].map((row) =>
              [1, 2].map((col) => {
                const dotEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4 - (row + col) * 0.05) / 0.3)))
                return (
                  <div
                    key={`dot-${row}-${col}`}
                    style={{
                      position: 'absolute',
                      left: `${(col / 3) * 100}%`,
                      top: `${(row / 3) * 100}%`,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: accentColor,
                      transform: `translate(-50%, -50%) scale(${dotEnter})`,
                      boxShadow: `0 0 8px ${accentColor}60`,
                    }}
                  />
                )
              })
            )}
          </>
        )}

        {/* Golden Spiral */}
        {isGoldenSpiral && (
          <>
            {/* Fibonacci rectangles */}
            {[
              { x: 0, y: 0, w: 61.8, h: 100, delay: 0 },
              { x: 61.8, y: 0, w: 38.2, h: 61.8, delay: 0.08 },
              { x: 61.8, y: 61.8, w: 23.6, h: 38.2, delay: 0.16 },
              { x: 61.8, y: 61.8, w: 14.6, h: 23.6, delay: 0.24 },
              { x: 76.4, y: 61.8, w: 9, h: 14.6, delay: 0.32 },
            ].map((rect, i) => {
              const rectProg = easeOutCubic(Math.max(0, Math.min(1, (spiralProgress - rect.delay) / 0.4)))
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${rect.x}%`,
                    top: `${rect.y}%`,
                    width: `${rect.w}%`,
                    height: `${rect.h}%`,
                    border: `1px solid ${lineColor}`,
                    opacity: rectProg * glowPulse,
                  }}
                />
              )
            })}
            {/* Spiral arc approximation using quarter circles */}
            {[
              { cx: 61.8, cy: 100, r: 100, start: 270, delay: 0 },
              { cx: 100, cy: 61.8, r: 61.8, start: 180, delay: 0.1 },
              { cx: 61.8, cy: 61.8, r: 38.2, start: 90, delay: 0.2 },
              { cx: 61.8, cy: 85.4, r: 23.6, start: 0, delay: 0.3 },
            ].map((arc, i) => {
              const arcProg = easeOutCubic(Math.max(0, Math.min(1, (spiralProgress - arc.delay) / 0.5)))
              return (
                <div
                  key={`arc-${i}`}
                  style={{
                    position: 'absolute',
                    left: `${arc.cx - arc.r}%`,
                    top: `${arc.cy - arc.r}%`,
                    width: `${arc.r * 2}%`,
                    height: `${arc.r * 2}%`,
                    borderRadius: '50%',
                    border: `2px solid ${accentColor}`,
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((arc.start * Math.PI) / 180)}% ${50 + 50 * Math.sin((arc.start * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((arc.start + 90) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((arc.start + 90) * Math.PI) / 180)}%)`,
                    opacity: arcProg * glowPulse * 0.8,
                  }}
                />
              )
            })}
          </>
        )}

        {/* Diagonals */}
        {isDiagonals && (
          <>
            {[
              { x1: 0, y1: 0, x2: 100, y2: 100 },
              { x1: 100, y1: 0, x2: 0, y2: 100 },
              { x1: 0, y1: 0, x2: 100, y2: 61.8 },
              { x1: 0, y1: 38.2, x2: 100, y2: 100 },
            ].map((line, i) => {
              const lineProgress = easeOutCubic(Math.max(0, Math.min(1, (lineDraw - i * 0.15) / 0.5)))
              const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * (180 / Math.PI)
              const length = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2))
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${line.x1}%`,
                    top: `${line.y1}%`,
                    width: `${length * lineProgress}%`,
                    height: 1,
                    background: i < 2 ? lineColor : `${accentColor}60`,
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '0 0',
                    opacity: glowPulse,
                  }}
                />
              )
            })}
          </>
        )}

        {/* Frame border */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: `1px solid ${lineColor}30`,
            opacity: lineDraw,
          }}
        />
      </div>

      {/* Title overlay at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '4%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: exitOpacity * easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3))),
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.7)',
            borderRadius: 12,
            padding: 'clamp(10px, 2%, 18px) clamp(16px, 3%, 28px)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ fontSize: 'clamp(13px, 2.2vw, 18px)', fontWeight: 800, color: textColor, marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 'clamp(10px, 1.4vw, 13px)', color: `${textColor}70`, fontWeight: 500 }}>{description}</div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-golden-ratio',
  title: 'Scene Golden Ratio',
  description: 'Golden ratio, rule of thirds, or diagonals composition overlay with animated line drawing and intersection highlights',
  tags: ['scene', 'photography', 'composition', 'golden-ratio', 'rule-of-thirds', 'education'],
  category: 'scenes',
  component: SceneGoldenRatioComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    overlayType: 'Rule of Thirds',
    title: 'Rule of Thirds',
    description: 'Place subjects at intersection points for balanced composition',
    bgColor: '#111111',
    lineColor: 'rgba(255,255,255,0.35)',
    accentColor: '#FFD700',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'overlayType', label: 'Overlay (Rule of Thirds/Golden Spiral/Diagonals)', type: 'text', defaultValue: 'Rule of Thirds', group: 'Content' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Rule of Thirds', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Place subjects at intersection points for balanced composition', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'lineColor', label: 'Line Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
