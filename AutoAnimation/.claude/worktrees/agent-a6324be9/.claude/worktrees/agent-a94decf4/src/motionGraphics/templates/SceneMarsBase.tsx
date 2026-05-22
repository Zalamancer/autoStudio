import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMarsBaseConfig {
  baseName: string
  population: number
  oxygenLevel: number
  powerOutput: string
  waterReserve: string
  solDay: number
  mission: string
  bgColor: string
  textColor: string
  accentColor: string
  marsColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneMarsBaseComponent({ config, progress }: MotionGraphicProps<SceneMarsBaseConfig>) {
  const { baseName, population, oxygenLevel, powerOutput, waterReserve, solDay, mission, bgColor, textColor, accentColor, marsColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const headerEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const statsEnter = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.4))
  const vitalsEnter = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))
  const missionEnter = easeOutCubic(Math.max(0, (enterProgress - 0.7) / 0.3))

  // O2 level color
  const o2Color = oxygenLevel >= 90 ? '#22C55E' : oxygenLevel >= 70 ? '#F59E0B' : '#EF4444'

  // Pulse for critical systems
  const isHolding = progress >= 0.2 && progress < 0.85
  const pulse = isHolding ? 0.5 + Math.sin(holdProgress * Math.PI * 8) * 0.5 : 1

  // Mars terrain at bottom
  const terrainPoints = Array.from({ length: 12 }, (_, i) => {
    const x = (i / 11) * 100
    const y = 78 + Math.sin(i * 0.8 + 2) * 4 + ((i * 17) % 5)
    return `${x}% ${y}%`
  })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, #1A0808 60%, ${marsColor}30 100%)`,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: exitOpacity,
      }}
    >
      {/* Stars (sparse, Martian sky) */}
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${((i * 67 + 19) % 100)}%`,
            top: `${((i * 43 + 11) % 50)}%`,
            width: 1,
            height: 1,
            borderRadius: '50%',
            background: '#FFFFFF',
            opacity: 0.15 + ((i * 23) % 3) / 15,
          }}
        />
      ))}

      {/* Mars terrain silhouette */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '25%',
          background: `linear-gradient(180deg, ${marsColor}40, ${marsColor}60)`,
          clipPath: `polygon(0% 100%, ${terrainPoints.join(', ')}, 100% 100%)`,
        }}
      />

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: headerEnter,
        }}
      >
        <div style={{ fontSize: 'clamp(8px, 1.6vw, 11px)', color: marsColor, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700 }}>
          Mars Colony
        </div>
        <div style={{ fontSize: 'clamp(24px, 6vw, 42px)', fontWeight: 900, color: textColor, textTransform: 'uppercase', letterSpacing: 'clamp(2px, 0.5vw, 5px)' }}>
          {baseName}
        </div>
        <div style={{ fontSize: 'clamp(10px, 2vw, 14px)', color: `${textColor}60`, marginTop: 2 }}>
          Sol {solDay}
        </div>
      </div>

      {/* Vital signs */}
      <div
        style={{
          position: 'absolute',
          top: '28%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '88%',
          maxWidth: 440,
          opacity: vitalsEnter,
        }}
      >
        {/* O2 Level */}
        <div style={{ marginBottom: 'clamp(8px, 2vw, 16px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 'clamp(9px, 1.8vw, 12px)', color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: 1 }}>Oxygen Level</span>
            <span style={{ fontSize: 'clamp(9px, 1.8vw, 12px)', color: o2Color, fontWeight: 700 }}>{oxygenLevel}%</span>
          </div>
          <div style={{ width: '100%', height: 'clamp(4px, 0.8vw, 6px)', background: `${textColor}10`, borderRadius: 3 }}>
            <div style={{ width: `${oxygenLevel * vitalsEnter}%`, height: '100%', background: o2Color, borderRadius: 3 }} />
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'clamp(6px, 1.5vw, 12px)' }}>
          {/* Population */}
          <div style={{ background: `${textColor}06`, borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(8px, 1.5vw, 14px)', border: `1px solid ${textColor}10` }}>
            <div style={{ fontSize: 'clamp(7px, 1.3vw, 9px)', color: `${textColor}45`, textTransform: 'uppercase', letterSpacing: 1 }}>Crew</div>
            <div style={{ fontSize: 'clamp(20px, 5vw, 34px)', fontWeight: 900, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(population * statsEnter)}
            </div>
          </div>
          {/* Power */}
          <div style={{ background: `${textColor}06`, borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(8px, 1.5vw, 14px)', border: `1px solid ${textColor}10` }}>
            <div style={{ fontSize: 'clamp(7px, 1.3vw, 9px)', color: `${textColor}45`, textTransform: 'uppercase', letterSpacing: 1 }}>Power</div>
            <div style={{ fontSize: 'clamp(13px, 3vw, 20px)', fontWeight: 800, color: '#F59E0B', marginTop: 2 }}>{powerOutput}</div>
          </div>
          {/* Water */}
          <div style={{ background: `${textColor}06`, borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(8px, 1.5vw, 14px)', border: `1px solid ${textColor}10` }}>
            <div style={{ fontSize: 'clamp(7px, 1.3vw, 9px)', color: `${textColor}45`, textTransform: 'uppercase', letterSpacing: 1 }}>Water</div>
            <div style={{ fontSize: 'clamp(13px, 3vw, 20px)', fontWeight: 800, color: '#38BDF8', marginTop: 2 }}>{waterReserve}</div>
          </div>
        </div>
      </div>

      {/* Dome structures on terrain */}
      <div style={{ position: 'absolute', bottom: '18%', left: '30%', opacity: statsEnter }}>
        <div style={{ width: 'clamp(24px, 6vw, 40px)', height: 'clamp(12px, 3vw, 20px)', borderRadius: '50% 50% 0 0', background: `linear-gradient(180deg, ${textColor}20, ${textColor}10)`, border: `1px solid ${textColor}15`, borderBottom: 'none' }} />
      </div>
      <div style={{ position: 'absolute', bottom: '19%', left: '42%', opacity: statsEnter }}>
        <div style={{ width: 'clamp(18px, 4.5vw, 30px)', height: 'clamp(9px, 2.2vw, 15px)', borderRadius: '50% 50% 0 0', background: `linear-gradient(180deg, ${textColor}15, ${textColor}08)`, border: `1px solid ${textColor}12`, borderBottom: 'none' }} />
      </div>
      <div style={{ position: 'absolute', bottom: '17%', left: '55%', opacity: statsEnter }}>
        <div style={{ width: 'clamp(30px, 7vw, 48px)', height: 'clamp(15px, 3.5vw, 24px)', borderRadius: '50% 50% 0 0', background: `linear-gradient(180deg, ${textColor}20, ${textColor}10)`, border: `1px solid ${textColor}15`, borderBottom: 'none' }} />
      </div>

      {/* Status indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 1.2vw, 10px)',
          opacity: missionEnter,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#22C55E',
            boxShadow: `0 0 ${4 + pulse * 4}px #22C55E80`,
          }}
        />
        <div style={{ fontSize: 'clamp(9px, 1.8vw, 13px)', color: `${textColor}60` }}>
          {mission} | All Systems Nominal
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-mars-base',
  title: 'Mars Base',
  description: 'Mars colony statistics dashboard with terrain, dome structures, crew/power/water stats, oxygen bar, and system status',
  tags: ['scene', 'space', 'mars', 'colony', 'base', 'astronomy', 'dashboard', 'sci-fi'],
  category: 'scene-layout',
  component: SceneMarsBaseComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'baseName', label: 'Base Name', type: 'text', defaultValue: 'Olympus Station', group: 'Content' },
    { key: 'population', label: 'Population', type: 'number', defaultValue: 48, min: 1, max: 1000, group: 'Content' },
    { key: 'oxygenLevel', label: 'Oxygen Level %', type: 'number', defaultValue: 94, min: 0, max: 100, group: 'Content' },
    { key: 'powerOutput', label: 'Power Output', type: 'text', defaultValue: '2.4 MW', group: 'Content' },
    { key: 'waterReserve', label: 'Water Reserve', type: 'text', defaultValue: '12,800 L', group: 'Content' },
    { key: 'solDay', label: 'Sol Day', type: 'number', defaultValue: 847, min: 1, max: 9999, group: 'Content' },
    { key: 'mission', label: 'Mission', type: 'text', defaultValue: 'Phase III Expansion', group: 'Content' },
    { key: 'marsColor', label: 'Mars Color', type: 'color', defaultValue: '#C0503A', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0610', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
  ],
  defaultConfig: {
    baseName: 'Olympus Station',
    population: 48,
    oxygenLevel: 94,
    powerOutput: '2.4 MW',
    waterReserve: '12,800 L',
    solDay: 847,
    mission: 'Phase III Expansion',
    marsColor: '#C0503A',
    accentColor: '#60A5FA',
    bgColor: '#0A0610',
    textColor: '#E2E8F0',
  },
})
