import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSatelliteOrbitConfig {
  satelliteName: string
  orbitType: string
  altitude: string
  speed: string
  purpose: string
  operator: string
  bgColor: string
  textColor: string
  accentColor: string
  orbitColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneSatelliteOrbitComponent({ config, progress }: MotionGraphicProps<SceneSatelliteOrbitConfig>) {
  const { satelliteName, orbitType, altitude, speed, purpose, operator, bgColor, textColor, accentColor, orbitColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const earthEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const orbitEnter = easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.4))
  const dataEnter = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))

  // Satellite orbits around Earth
  const orbitAngle = (enterProgress * 0.3 + holdProgress * 0.7) * 360
  const orbitRadiusX = 38
  const orbitRadiusY = 12
  const satX = 50 + Math.cos(orbitAngle * Math.PI / 180) * orbitRadiusX
  const satY = 35 + Math.sin(orbitAngle * Math.PI / 180) * orbitRadiusY

  // Stars
  const stars = Array.from({ length: 35 }, (_, i) => ({
    x: ((i * 71 + 13) % 100),
    y: ((i * 43 + 37) % 100),
    size: 0.5 + ((i * 11) % 2),
    opacity: 0.12 + ((i * 23) % 4) / 15,
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

      {/* Earth */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${earthEnter})`,
        }}
      >
        <div
          style={{
            width: 'clamp(60px, 16vw, 100px)',
            height: 'clamp(60px, 16vw, 100px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #4DA6FF, #2070C0, #1A4A80)',
            boxShadow: '0 0 30px rgba(77,166,255,0.2), inset -6px -6px 15px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Continents (abstract green patches) */}
          <div style={{ position: 'absolute', left: '20%', top: '25%', width: '25%', height: '18%', background: 'rgba(40,140,60,0.4)', borderRadius: '60% 40% 50% 50%' }} />
          <div style={{ position: 'absolute', left: '50%', top: '40%', width: '20%', height: '25%', background: 'rgba(40,140,60,0.35)', borderRadius: '40% 60% 55% 45%' }} />
          <div style={{ position: 'absolute', left: '30%', top: '60%', width: '15%', height: '12%', background: 'rgba(40,140,60,0.3)', borderRadius: '50%' }} />
          {/* Atmosphere rim */}
          <div
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: '50%',
              border: '1px solid rgba(100,180,255,0.15)',
              boxShadow: '0 0 8px rgba(100,180,255,0.1)',
            }}
          />
        </div>
      </div>

      {/* Orbit ellipse */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          width: `${orbitRadiusX * 2}%`,
          height: `${orbitRadiusY * 2}%`,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: `1.5px dashed ${orbitColor}40`,
          opacity: orbitEnter,
        }}
      />

      {/* Satellite */}
      <div
        style={{
          position: 'absolute',
          left: `${satX}%`,
          top: `${satY}%`,
          transform: 'translate(-50%, -50%)',
          opacity: orbitEnter,
        }}
      >
        {/* Satellite body */}
        <div
          style={{
            width: 'clamp(6px, 1.5vw, 10px)',
            height: 'clamp(4px, 1vw, 7px)',
            background: '#C0C0C0',
            borderRadius: 2,
            position: 'relative',
          }}
        >
          {/* Solar panels */}
          <div style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', width: 8, height: 3, background: accentColor, opacity: 0.8 }} />
          <div style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 8, height: 3, background: accentColor, opacity: 0.8 }} />
        </div>
        {/* Signal cone */}
        <div
          style={{
            position: 'absolute',
            bottom: -15,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `12px solid ${accentColor}20`,
          }}
        />
      </div>

      {/* Satellite name */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: dataEnter,
        }}
      >
        <div style={{ fontSize: 'clamp(22px, 5.5vw, 38px)', fontWeight: 900, color: textColor, textTransform: 'uppercase', letterSpacing: 'clamp(2px, 0.5vw, 5px)' }}>
          {satelliteName}
        </div>
        <div style={{ fontSize: 'clamp(10px, 2vw, 14px)', color: accentColor, fontWeight: 600, marginTop: 2 }}>
          {orbitType}
        </div>
      </div>

      {/* Data row */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '50%',
          width: '85%',
          maxWidth: 420,
          display: 'flex',
          justifyContent: 'space-around',
          opacity: dataEnter,
          transform: `translateX(-50%) translateY(${(1 - dataEnter) * 15}px)`,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', color: `${textColor}50`, textTransform: 'uppercase', letterSpacing: 1 }}>Altitude</div>
          <div style={{ fontSize: 'clamp(14px, 3vw, 22px)', color: accentColor, fontWeight: 800, marginTop: 2 }}>{altitude}</div>
        </div>
        <div style={{ width: 1, background: `${textColor}15` }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', color: `${textColor}50`, textTransform: 'uppercase', letterSpacing: 1 }}>Speed</div>
          <div style={{ fontSize: 'clamp(14px, 3vw, 22px)', color: accentColor, fontWeight: 800, marginTop: 2 }}>{speed}</div>
        </div>
      </div>

      {/* Bottom info */}
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: dataEnter * 0.7,
        }}
      >
        <div style={{ fontSize: 'clamp(9px, 1.8vw, 12px)', color: `${textColor}50` }}>
          {purpose} | {operator}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-satellite-orbit',
  title: 'Satellite Orbit',
  description: 'Satellite orbital diagram with Earth, animated orbiting satellite, orbit path, altitude/speed stats, and mission info',
  tags: ['scene', 'space', 'satellite', 'orbit', 'astronomy', 'technology', 'diagram'],
  category: 'scene-layout',
  component: SceneSatelliteOrbitComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'satelliteName', label: 'Satellite Name', type: 'text', defaultValue: 'ISS Zarya', group: 'Content' },
    { key: 'orbitType', label: 'Orbit Type', type: 'text', defaultValue: 'Low Earth Orbit (LEO)', group: 'Content' },
    { key: 'altitude', label: 'Altitude', type: 'text', defaultValue: '408 km', group: 'Content' },
    { key: 'speed', label: 'Speed', type: 'text', defaultValue: '27,600 km/h', group: 'Content' },
    { key: 'purpose', label: 'Purpose', type: 'text', defaultValue: 'Research Station', group: 'Content' },
    { key: 'operator', label: 'Operator', type: 'text', defaultValue: 'NASA / Roscosmos', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'orbitColor', label: 'Orbit Color', type: 'color', defaultValue: '#A78BFA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060818', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
  ],
  defaultConfig: {
    satelliteName: 'ISS Zarya',
    orbitType: 'Low Earth Orbit (LEO)',
    altitude: '408 km',
    speed: '27,600 km/h',
    purpose: 'Research Station',
    operator: 'NASA / Roscosmos',
    accentColor: '#60A5FA',
    orbitColor: '#A78BFA',
    bgColor: '#060818',
    textColor: '#E2E8F0',
  },
})
