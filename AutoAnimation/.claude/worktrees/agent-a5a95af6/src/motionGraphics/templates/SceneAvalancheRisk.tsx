import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneAvalancheRiskConfig {
  riskLevel: number
  location: string
  elevation: string
  snowDepth: number
  windLoading: string
  advisory: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

const RISK_LEVELS = [
  { level: 1, label: 'Low', color: '#4ade80', desc: 'Generally safe' },
  { level: 2, label: 'Moderate', color: '#facc15', desc: 'Heightened conditions' },
  { level: 3, label: 'Considerable', color: '#fb923c', desc: 'Dangerous conditions' },
  { level: 4, label: 'High', color: '#ef4444', desc: 'Very dangerous' },
  { level: 5, label: 'Extreme', color: '#dc2626', desc: 'Avoid backcountry' },
]

function SceneAvalancheRiskComponent({ config, progress }: MotionGraphicProps<SceneAvalancheRiskConfig>) {
  const { riskLevel, location, elevation, snowDepth, windLoading, advisory, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const enterEased = easeOutCubic(enterProgress)

  const currentRisk = RISK_LEVELS[Math.min(Math.max(riskLevel - 1, 0), 4)]

  // Danger flash for high risk
  const dangerPulse = riskLevel >= 4 && progress >= 0.25 && progress < 0.8
    ? 0.5 + Math.sin(holdProgress * Math.PI * 6) * 0.5
    : 0

  // Mountain silhouette SVG
  const mtW = 300
  const mtH = 80
  const mountainPath = 'M 0 80 L 40 35 L 70 55 L 110 15 L 150 45 L 180 20 L 220 50 L 260 10 L 300 40 L 300 80 Z'

  // Snow particles
  const snowflakes = Array.from({ length: 20 }, (_, i) => {
    const seed = i * 61 + 19
    const x = (seed * 37) % 100
    const speed = 0.3 + ((seed * 11) % 10) / 20
    const y = ((progress * 150 * speed + seed * 31) % 110) - 10
    const size = 1.5 + (i % 4)
    const opacity = 0.1 + (i % 5) / 30
    return { x, y, size, opacity }
  })

  const getStatProgress = (index: number): number => {
    const start = 0.3 + index * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.5)))
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, #1a2030 60%, #2a3040 100%)`,
      }} />

      {/* Danger pulse overlay */}
      {dangerPulse > 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(220,38,38,${dangerPulse * 0.04})`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Snow particles */}
      {snowflakes.map((f, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: f.size,
            height: f.size,
            borderRadius: '50%',
            background: `rgba(255,255,255,${f.opacity})`,
          }}
        />
      ))}

      {/* Mountain silhouette at bottom */}
      <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '18%' }}
        viewBox={`0 0 ${mtW} ${mtH}`} preserveAspectRatio="none">
        <path d={mountainPath} fill={`${textColor}08`} />
      </svg>

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5% 5%',
        opacity: exitOpacity,
      }}>
        {/* Location & elevation */}
        <div style={{
          fontSize: 'clamp(10px, 1.8vw, 14px)',
          fontWeight: 600,
          color: `${textColor}77`,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          opacity: enterEased,
          marginBottom: 'clamp(2px, 0.5vh, 6px)',
        }}>
          {location} \u2022 {elevation}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 'clamp(16px, 4vw, 32px)',
          fontWeight: 800,
          color: textColor,
          opacity: enterEased,
          marginBottom: 'clamp(12px, 2.5vh, 24px)',
        }}>
          Avalanche Risk
        </div>

        {/* Risk level meter - 5 triangles */}
        <div style={{
          display: 'flex',
          gap: 'clamp(4px, 0.8vw, 8px)',
          marginBottom: 'clamp(8px, 1.5vh, 16px)',
          opacity: enterEased,
        }}>
          {RISK_LEVELS.map((level, i) => {
            const filled = i < riskLevel
            const fillProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2 - i * 0.08) / 0.4)))
            const size = 20 + i * 4

            return (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                opacity: fillProg,
                transform: `scale(${0.8 + fillProg * 0.2})`,
              }}>
                <svg width={size} height={size} viewBox="0 0 24 24"
                  style={{ width: `clamp(${14 + i * 3}px, ${2.5 + i * 0.5}vw, ${22 + i * 4}px)` }}>
                  <polygon
                    points="12,2 22,22 2,22"
                    fill={filled ? level.color : `${textColor}15`}
                    stroke={filled ? level.color : `${textColor}25`}
                    strokeWidth={1}
                    opacity={filled ? 1 : 0.5}
                    style={filled ? { filter: `drop-shadow(0 0 4px ${level.color}50)` } : undefined}
                  />
                </svg>
              </div>
            )
          })}
        </div>

        {/* Risk label */}
        <div style={{
          fontSize: 'clamp(22px, 6vw, 48px)',
          fontWeight: 900,
          color: currentRisk.color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textShadow: `0 0 20px ${currentRisk.color}40`,
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)),
          marginBottom: 'clamp(2px, 0.5vh, 6px)',
        }}>
          {currentRisk.label}
        </div>

        <div style={{
          fontSize: 'clamp(10px, 1.8vw, 14px)',
          fontWeight: 500,
          color: `${textColor}77`,
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)),
          marginBottom: 'clamp(14px, 2.5vh, 24px)',
        }}>
          {currentRisk.desc}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: 'clamp(10px, 2.5vw, 24px)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {[
            { label: 'Snow Depth', value: `${Math.round(snowDepth * getStatProgress(0))}"`, icon: '\u2744' },
            { label: 'Wind Loading', value: windLoading, icon: '\u{1F32C}' },
          ].map((stat, i) => (
            <div key={i} style={{
              textAlign: 'center',
              opacity: getStatProgress(i),
              transform: `translateY(${(1 - getStatProgress(i)) * 12}px)`,
              padding: 'clamp(4px, 0.8vw, 8px) clamp(8px, 1.5vw, 14px)',
              borderRadius: 8,
              background: `${textColor}08`,
              border: `1px solid ${textColor}12`,
            }}>
              <div style={{
                fontSize: 'clamp(14px, 2.5vw, 20px)',
                marginBottom: 2,
              }}>{stat.icon}</div>
              <div style={{
                fontSize: 'clamp(9px, 1.4vw, 11px)',
                fontWeight: 600,
                color: `${textColor}55`,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 2,
              }}>{stat.label}</div>
              <div style={{
                fontSize: 'clamp(14px, 3vw, 22px)',
                fontWeight: 800,
                color: textColor,
              }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Advisory */}
        <div style={{
          fontSize: 'clamp(9px, 1.6vw, 13px)',
          fontWeight: 500,
          color: `${currentRisk.color}CC`,
          textAlign: 'center',
          marginTop: 'clamp(10px, 2vh, 18px)',
          maxWidth: '85%',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4)),
          padding: 'clamp(4px, 0.8vh, 8px) clamp(8px, 1.5vw, 14px)',
          borderRadius: 8,
          background: `${currentRisk.color}0D`,
          border: `1px solid ${currentRisk.color}20`,
        }}>
          {advisory}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-avalanche-risk',
  title: 'Avalanche Risk',
  description: 'Avalanche and ski conditions display with risk level triangles, snow depth, and wind loading',
  tags: ['scene', 'weather', 'avalanche', 'ski', 'snow', 'mountain', 'safety', 'risk'],
  category: 'scene-layout',
  component: SceneAvalancheRiskComponent as any,
  defaultConfig: {
    riskLevel: 3,
    location: 'Tahoe Basin',
    elevation: '8,200 ft',
    snowDepth: 48,
    windLoading: 'Moderate',
    advisory: 'Human-triggered avalanches likely on steep slopes. Avoid terrain steeper than 35 degrees.',
    bgColor: '#0a0f1a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'riskLevel', label: 'Risk Level (1-5)', type: 'number', defaultValue: 3, min: 1, max: 5, group: 'Content' },
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'Tahoe Basin', group: 'Content' },
    { key: 'elevation', label: 'Elevation', type: 'text', defaultValue: '8,200 ft', group: 'Content' },
    { key: 'snowDepth', label: 'Snow Depth (inches)', type: 'number', defaultValue: 48, min: 0, max: 300, group: 'Content' },
    { key: 'windLoading', label: 'Wind Loading', type: 'text', defaultValue: 'Moderate', group: 'Content' },
    { key: 'advisory', label: 'Advisory Text', type: 'text', defaultValue: 'Human-triggered avalanches likely on steep slopes. Avoid terrain steeper than 35 degrees.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0f1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
