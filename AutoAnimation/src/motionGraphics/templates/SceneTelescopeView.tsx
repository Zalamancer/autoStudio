import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneTelescopeViewConfig {
  objectName: string
  objectType: string
  magnitude: number
  distance: string
  description: string
  bgColor: string
  textColor: string
  accentColor: string
  crosshairColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneTelescopeViewComponent({ config, progress }: MotionGraphicProps<SceneTelescopeViewConfig>) {
  const { objectName, objectType, magnitude, distance, description, bgColor, textColor, accentColor, crosshairColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Viewfinder circle iris opens
  const irisOpen = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // Crosshairs draw in
  const crosshairProgress = easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.4))
  const dataProgress = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))
  const descProgress = easeOutCubic(Math.max(0, (enterProgress - 0.7) / 0.3))

  // Subtle tracking drift during hold
  const isHolding = progress >= 0.2 && progress < 0.85
  const driftX = isHolding ? Math.sin(holdProgress * Math.PI * 4) * 1.5 : 0
  const driftY = isHolding ? Math.cos(holdProgress * Math.PI * 3) * 1 : 0

  // Stars visible through eyepiece
  const stars = Array.from({ length: 30 }, (_, i) => ({
    x: 20 + ((i * 61 + 17) % 60),
    y: 15 + ((i * 47 + 23) % 70),
    size: 0.5 + ((i * 13) % 3),
    opacity: 0.2 + ((i * 29) % 5) / 10,
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
      {/* Stars through viewfinder */}
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `calc(${s.x}% + ${driftX}px)`,
            top: `calc(${s.y}% + ${driftY}px)`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: '#FFFFFF',
            opacity: s.opacity * irisOpen,
          }}
        />
      ))}

      {/* Central observed object glow */}
      <div
        style={{
          position: 'absolute',
          left: `calc(50% + ${driftX}px)`,
          top: `calc(40% + ${driftY}px)`,
          width: 'clamp(20px, 5vw, 40px)',
          height: 'clamp(20px, 5vw, 40px)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}90 0%, ${accentColor}40 40%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          opacity: irisOpen,
          boxShadow: `0 0 20px ${accentColor}50`,
        }}
      />

      {/* Viewfinder circular vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, transparent ${irisOpen * 40}%, rgba(0,0,0,0.95) ${irisOpen * 50 + 10}%)`,
        }}
      />

      {/* Crosshairs */}
      {/* Horizontal */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: `${50 - crosshairProgress * 18}%`,
          width: `${crosshairProgress * 36}%`,
          height: 1,
          background: crosshairColor,
          opacity: 0.5,
        }}
      />
      {/* Vertical */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: `${40 - crosshairProgress * 15}%`,
          height: `${crosshairProgress * 30}%`,
          width: 1,
          background: crosshairColor,
          opacity: 0.5,
        }}
      />
      {/* Center circle */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '40%',
          width: 'clamp(20px, 5vw, 36px)',
          height: 'clamp(20px, 5vw, 36px)',
          borderRadius: '50%',
          border: `1px solid ${crosshairColor}60`,
          transform: `translate(-50%, -50%) scale(${crosshairProgress})`,
        }}
      />

      {/* HUD data overlay — top left */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '8%',
          opacity: dataProgress,
        }}
      >
        <div style={{ fontSize: 'clamp(8px, 1.6vw, 11px)', color: `${crosshairColor}80`, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>
          Target
        </div>
        <div style={{ fontSize: 'clamp(18px, 4.5vw, 32px)', color: accentColor, fontWeight: 800 }}>
          {objectName}
        </div>
        <div style={{ fontSize: 'clamp(9px, 1.8vw, 13px)', color: `${textColor}60`, marginTop: 2 }}>
          {objectType}
        </div>
      </div>

      {/* HUD data — top right */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          right: '8%',
          textAlign: 'right',
          opacity: dataProgress,
        }}
      >
        <div style={{ fontSize: 'clamp(8px, 1.6vw, 11px)', color: `${crosshairColor}80`, textTransform: 'uppercase', letterSpacing: 1 }}>
          MAG {magnitude.toFixed(1)}
        </div>
        <div style={{ fontSize: 'clamp(9px, 1.8vw, 13px)', color: `${textColor}60`, marginTop: 2 }}>
          {distance}
        </div>
      </div>

      {/* Description — bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          width: '75%',
          maxWidth: 400,
          textAlign: 'center',
          opacity: descProgress,
          transform: `translateX(-50%) translateY(${(1 - descProgress) * 10}px)`,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(11px, 2.2vw, 16px)',
            color: `${textColor}80`,
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
        >
          {description}
        </div>
      </div>

      {/* Viewfinder ring border */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 'clamp(200px, 60vw, 450px)',
          height: 'clamp(200px, 60vw, 450px)',
          borderRadius: '50%',
          border: `2px solid ${crosshairColor}30`,
          transform: `translate(-50%, -50%) scale(${irisOpen})`,
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-telescope-view',
  title: 'Telescope View',
  description: 'Telescope viewfinder display with iris opening, crosshairs, HUD data overlay, target identification, and tracking drift',
  tags: ['scene', 'space', 'telescope', 'viewfinder', 'astronomy', 'observation', 'HUD'],
  category: 'scene-layout',
  component: SceneTelescopeViewComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'objectName', label: 'Object Name', type: 'text', defaultValue: 'Andromeda Galaxy', group: 'Content' },
    { key: 'objectType', label: 'Object Type', type: 'text', defaultValue: 'Spiral Galaxy', group: 'Content' },
    { key: 'magnitude', label: 'Magnitude', type: 'number', defaultValue: 3.4, min: -5, max: 30, group: 'Content' },
    { key: 'distance', label: 'Distance', type: 'text', defaultValue: '2.537 million light-years', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'The nearest large galaxy to the Milky Way, visible to the naked eye in dark skies.', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'crosshairColor', label: 'Crosshair Color', type: 'color', defaultValue: '#22C55E', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040410', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
  ],
  defaultConfig: {
    objectName: 'Andromeda Galaxy',
    objectType: 'Spiral Galaxy',
    magnitude: 3.4,
    distance: '2.537 million light-years',
    description: 'The nearest large galaxy to the Milky Way, visible to the naked eye in dark skies.',
    accentColor: '#60A5FA',
    crosshairColor: '#22C55E',
    bgColor: '#040410',
    textColor: '#E2E8F0',
  },
})
