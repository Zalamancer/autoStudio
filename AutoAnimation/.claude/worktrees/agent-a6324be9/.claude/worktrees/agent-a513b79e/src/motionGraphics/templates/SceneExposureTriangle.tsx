import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ExposureTriangleConfig {
  title: string
  aperture: string
  shutterSpeed: string
  iso: string
  apertureDesc: string
  shutterDesc: string
  isoDesc: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneExposureTriangleComponent({ config, progress }: MotionGraphicProps<ExposureTriangleConfig>) {
  const { title, aperture, shutterSpeed, iso, apertureDesc, shutterDesc, isoDesc, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Triangle draw progress
  const triDraw = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))

  // Triangle vertices (equilateral, centered)
  // Top vertex, bottom-left, bottom-right
  const cx = 50 // center x %
  const cy = 42 // center y %
  const triSize = 30 // half-size in %
  const topX = cx
  const topY = cy - triSize
  const blX = cx - triSize * 0.866
  const blY = cy + triSize * 0.5
  const brX = cx + triSize * 0.866
  const brY = cy + triSize * 0.5

  // Highlight which vertex pulses during hold
  const activeVertex = Math.floor(holdProgress * 9) % 3
  const vertexPulse = 1 + Math.sin(holdProgress * Math.PI * 8) * 0.15

  const vertices = [
    { x: topX, y: topY, label: iso, desc: isoDesc, color: '#4CAF50', icon: 'ISO' },
    { x: blX, y: blY, label: aperture, desc: apertureDesc, color: '#2196F3', icon: 'f/' },
    { x: brX, y: brY, label: shutterSpeed, desc: shutterDesc, color: '#FF9800', icon: 'S' },
  ]

  // Connecting lines draw staggered
  const lines = [
    { x1: topX, y1: topY, x2: blX, y2: blY, delay: 0 },
    { x1: blX, y1: blY, x2: brX, y2: brY, delay: 0.15 },
    { x1: brX, y1: brY, x2: topX, y2: topY, delay: 0.3 },
  ]

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
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '4%',
      }}
    >
      <div
        style={{
          background: cardColor,
          borderRadius: 'clamp(14px, 2vw, 22px)',
          padding: 'clamp(18px, 3.5%, 32px)',
          maxWidth: 440,
          width: '100%',
          opacity: exitOpacity,
          transform: `translateY(${(1 - easeOutCubic(Math.min(1, enterProgress / 0.3))) * 60 + exitEased * -50}px)`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 'clamp(14px, 2.5vw, 20px)',
            fontWeight: 800,
            color: textColor,
            marginBottom: 'clamp(16px, 3vh, 28px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.25)),
          }}
        >
          {title}
        </div>

        {/* Triangle area */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/3',
            marginBottom: 'clamp(12px, 2vh, 20px)',
          }}
        >
          {/* Triangle edges */}
          {lines.map((line, i) => {
            const lineProg = easeOutCubic(Math.max(0, Math.min(1, (triDraw - line.delay) / 0.5)))
            const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * (180 / Math.PI)
            const length = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2))
            const isActive = activeVertex === i || activeVertex === (i + 1) % 3
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${line.x1}%`,
                  top: `${line.y1}%`,
                  width: `${length * lineProg}%`,
                  height: 2,
                  background: isActive && holdProgress > 0
                    ? `${accentColor}`
                    : `${textColor}30`,
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: '0 50%',
                  boxShadow: isActive && holdProgress > 0 ? `0 0 8px ${accentColor}40` : 'none',
                }}
              />
            )
          })}

          {/* Vertex nodes */}
          {vertices.map((v, i) => {
            const nodeEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2 - i * 0.1) / 0.3)))
            const isActive = activeVertex === i
            const nodeScale = isActive && holdProgress > 0 ? vertexPulse : 1

            return (
              <React.Fragment key={i}>
                {/* Node circle */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${v.x}%`,
                    top: `${v.y}%`,
                    transform: `translate(-50%, -50%) scale(${nodeEnter * nodeScale})`,
                  }}
                >
                  <div
                    style={{
                      width: 'clamp(40px, 8vw, 60px)',
                      height: 'clamp(40px, 8vw, 60px)',
                      borderRadius: '50%',
                      background: `${v.color}20`,
                      border: `2px solid ${v.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      boxShadow: isActive ? `0 0 16px ${v.color}40` : 'none',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'clamp(7px, 1vw, 9px)',
                        fontWeight: 700,
                        color: v.color,
                        letterSpacing: 1,
                        fontFamily: "'Courier New', monospace",
                      }}
                    >
                      {v.icon}
                    </div>
                    <div
                      style={{
                        fontSize: 'clamp(11px, 2vw, 16px)',
                        fontWeight: 800,
                        color: textColor,
                      }}
                    >
                      {v.label}
                    </div>
                  </div>
                </div>

                {/* Label below/above node */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${v.x}%`,
                    top: i === 0 ? `${v.y - 12}%` : `${v.y + 10}%`,
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    opacity: nodeEnter,
                    maxWidth: 100,
                  }}
                >
                  <div style={{ fontSize: 'clamp(8px, 1.2vw, 11px)', color: `${textColor}60`, fontWeight: 500, lineHeight: 1.3 }}>
                    {v.desc}
                  </div>
                </div>
              </React.Fragment>
            )
          })}

          {/* Center label */}
          <div
            style={{
              position: 'absolute',
              left: `${cx}%`,
              top: `${cy + 2}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: 'clamp(9px, 1.3vw, 12px)',
              fontWeight: 700,
              color: accentColor,
              letterSpacing: 1,
              opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3))),
              textAlign: 'center',
            }}
          >
            EXPOSURE
          </div>
        </div>

        {/* Bottom legend bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3))),
          }}
        >
          {[
            { label: 'Depth of Field', color: '#2196F3' },
            { label: 'Motion Blur', color: '#FF9800' },
            { label: 'Noise', color: '#4CAF50' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
              <span style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', color: `${textColor}50`, fontWeight: 500 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-exposure-triangle',
  title: 'Scene Exposure Triangle',
  description: 'Exposure triangle educational display with animated vertex nodes for aperture, shutter speed, and ISO',
  tags: ['scene', 'photography', 'exposure', 'education', 'triangle', 'aperture', 'iso', 'shutter'],
  category: 'scenes',
  component: SceneExposureTriangleComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'The Exposure Triangle',
    aperture: 'f/2.8',
    shutterSpeed: '1/250',
    iso: 'ISO 400',
    apertureDesc: 'Depth of field',
    shutterDesc: 'Motion freeze',
    isoDesc: 'Light sensitivity',
    bgColor: '#0F1419',
    cardColor: '#1C2128',
    accentColor: '#58A6FF',
    textColor: '#E6EDF3',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'The Exposure Triangle', group: 'Content' },
    { key: 'aperture', label: 'Aperture', type: 'text', defaultValue: 'f/2.8', group: 'Content' },
    { key: 'shutterSpeed', label: 'Shutter Speed', type: 'text', defaultValue: '1/250', group: 'Content' },
    { key: 'iso', label: 'ISO', type: 'text', defaultValue: 'ISO 400', group: 'Content' },
    { key: 'apertureDesc', label: 'Aperture Desc', type: 'text', defaultValue: 'Depth of field', group: 'Content' },
    { key: 'shutterDesc', label: 'Shutter Desc', type: 'text', defaultValue: 'Motion freeze', group: 'Content' },
    { key: 'isoDesc', label: 'ISO Desc', type: 'text', defaultValue: 'Light sensitivity', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F1419', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1C2128', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#58A6FF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E6EDF3', group: 'Style' },
  ],
})
