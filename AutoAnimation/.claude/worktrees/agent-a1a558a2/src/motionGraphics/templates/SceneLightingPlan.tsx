import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LightingPlanConfig {
  roomName: string
  lights: string[]
  lightTypes: string[]
  lightPositions: string[]
  lumens: number
  colorTemp: number
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

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneLightingPlanComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<LightingPlanConfig>) {
  const { roomName, lights, lightTypes, lightPositions, lumens, colorTemp, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.28
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Title
  const titleProgress = easeOutCubic(Math.min(1, enterProgress / 0.3))
  // Room plan
  const planProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))
  // Light fixtures appear
  const getLightProgress = (idx: number) => {
    const delay = 0.4 + idx * 0.12
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.25)))
  }
  // Specs
  const specProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.2)))

  // Hold: lights pulse glow
  const glowPulse = 0.6 + Math.sin(holdProgress * Math.PI * 5) * 0.4

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Color temperature to color
  const tempToColor = (k: number) => {
    if (k <= 3000) return '#FFD280'
    if (k <= 4000) return '#FFE4B5'
    if (k <= 5000) return '#FFFAF0'
    return '#F0F5FF'
  }
  const glowColor = tempToColor(colorTemp)

  // Fixture positions within the room plan SVG
  const svgW = 300
  const svgH = 200
  const fixturePlacements = [
    { cx: 75, cy: 50 },
    { cx: 225, cy: 50 },
    { cx: 150, cy: 100 },
    { cx: 75, cy: 150 },
    { cx: 225, cy: 150 },
    { cx: 150, cy: 50 },
  ]

  // Light type icons
  const typeIcons: Record<string, string> = {
    'Pendant': '💡', 'Recessed': '🔆', 'Track': '🔦', 'Sconce': '🕯️',
    'Floor Lamp': '🪔', 'Chandelier': '✨', 'Under Cabinet': '💫', 'Spot': '🔅',
  }

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
        padding: '5%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(10px, 2vh, 18px)',
          width: '100%',
          maxWidth: 420,
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * 10}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 700, color: accentColor, letterSpacing: 3, textTransform: 'uppercase' }}>
            LIGHTING PLAN
          </div>
          <div style={{ fontSize: 'clamp(20px, 4.5vw, 32px)', fontWeight: 800, color: textColor, marginTop: 4, lineHeight: 1.1 }}>
            {roomName}
          </div>
        </div>

        {/* Room plan with light positions */}
        <div
          style={{
            width: '100%',
            position: 'relative',
            opacity: planProgress,
            transform: `scale(${0.92 + planProgress * 0.08})`,
          }}
        >
          <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto' }}>
            {/* Room outline */}
            <rect
              x={10} y={10} width={280} height={180}
              fill={`${cardColor}`}
              stroke={`${textColor}20`}
              strokeWidth={1.5}
              rx={4}
            />
            {/* Interior wall */}
            <line x1={10} y1={100} x2={100} y2={100} stroke={`${textColor}15`} strokeWidth={1} />
            <line x1={200} y1={10} x2={200} y2={80} stroke={`${textColor}15`} strokeWidth={1} />

            {/* Light fixtures */}
            {lights.slice(0, 6).map((light, i) => {
              const pos = fixturePlacements[i] || { cx: 150, cy: 100 }
              const p = getLightProgress(i)

              return (
                <g key={i} opacity={p}>
                  {/* Glow circle */}
                  <circle
                    cx={pos.cx} cy={pos.cy}
                    r={18 + glowPulse * 6}
                    fill={glowColor}
                    opacity={0.08 * glowPulse * p}
                  />
                  <circle
                    cx={pos.cx} cy={pos.cy}
                    r={10 + glowPulse * 3}
                    fill={glowColor}
                    opacity={0.15 * glowPulse * p}
                  />
                  {/* Fixture marker */}
                  <circle
                    cx={pos.cx} cy={pos.cy}
                    r={5}
                    fill={accentColor}
                    opacity={p}
                  />
                  <circle
                    cx={pos.cx} cy={pos.cy}
                    r={2}
                    fill="#FFFFFF"
                    opacity={p}
                  />
                  {/* Label */}
                  <text
                    x={pos.cx} y={pos.cy + 16}
                    textAnchor="middle"
                    fontSize={7}
                    fill={`${textColor}60`}
                    fontFamily="Helvetica, Arial, sans-serif"
                    fontWeight={600}
                  >
                    {light}
                  </text>
                </g>
              )
            })}

            {/* Compass indicator */}
            <text x={275} y={25} fontSize={8} fill={`${textColor}30`} textAnchor="middle" fontWeight={700} fontFamily="Helvetica, Arial, sans-serif">
              N
            </text>
            <line x1={275} y1={27} x2={275} y2={35} stroke={`${textColor}20`} strokeWidth={1} />
          </svg>
        </div>

        {/* Light fixture list */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(4px, 0.8vw, 8px)',
            justifyContent: 'center',
          }}
        >
          {lights.slice(0, 6).map((light, i) => {
            const p = getLightProgress(i)
            const type = lightTypes[i] || 'Spot'
            const icon = typeIcons[type] || '💡'
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 'clamp(3px, 0.5vh, 6px) clamp(8px, 1.4vw, 12px)',
                  borderRadius: 16,
                  background: cardColor,
                  fontSize: 'clamp(9px, 1.3vw, 11px)',
                  fontWeight: 600,
                  color: textColor,
                  opacity: p,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ fontSize: 'clamp(10px, 1.6vw, 14px)' }}>{icon}</span>
                {light}
              </div>
            )
          })}
        </div>

        {/* Specs row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(10px, 2vw, 20px)',
            opacity: specProgress,
            transform: `translateY(${(1 - specProgress) * 8}px)`,
          }}
        >
          {[
            { label: 'TOTAL LUMENS', value: `${Math.round(lumens * specProgress).toLocaleString()}`, icon: '🔆' },
            { label: 'COLOR TEMP', value: `${colorTemp}K`, icon: '🌡️' },
            { label: 'FIXTURES', value: `${lights.length}`, icon: '💡' },
          ].map((spec, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(12px, 2vw, 18px)', marginBottom: 2 }}>{spec.icon}</div>
              <div style={{ fontSize: 'clamp(16px, 3vw, 24px)', fontWeight: 900, color: accentColor, lineHeight: 1 }}>
                {spec.value}
              </div>
              <div style={{ fontSize: 'clamp(7px, 1vw, 9px)', fontWeight: 700, color: `${textColor}40`, letterSpacing: 1.5, marginTop: 3 }}>
                {spec.label}
              </div>
            </div>
          ))}
        </div>

        {/* Color temperature bar */}
        <div
          style={{
            width: '80%',
            height: 'clamp(6px, 1vh, 10px)',
            borderRadius: 20,
            background: 'linear-gradient(90deg, #FF8C00, #FFD280, #FFFAF0, #F0F5FF, #CCE0FF)',
            position: 'relative',
            opacity: specProgress,
          }}
        >
          {/* Indicator */}
          <div
            style={{
              position: 'absolute',
              top: -3,
              left: `${Math.max(5, Math.min(95, ((colorTemp - 2000) / 5000) * 100))}%`,
              width: 'clamp(10px, 1.8vw, 16px)',
              height: 'clamp(10px, 1.8vw, 16px)',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: `2px solid ${accentColor}`,
              transform: 'translateX(-50%)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-lighting-plan',
  title: 'Scene Lighting Plan',
  description: 'Room lighting layout plan with fixture positions, glow animations, color temperature bar, lumen stats, and fixture type tags',
  tags: ['scene', 'lighting', 'plan', 'interior', 'design', 'architecture', 'fixtures', 'room'],
  category: 'scene-layout',
  component: SceneLightingPlanComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'roomName', label: 'Room Name', type: 'text', defaultValue: 'Open Plan Kitchen', group: 'Content' },
    { key: 'lights', label: 'Light Names', type: 'text-array', defaultValue: ['Island Pendant', 'Recessed A', 'Recessed B', 'Under Cabinet', 'Track Light', 'Sconce'], group: 'Content' },
    { key: 'lightTypes', label: 'Light Types', type: 'text-array', defaultValue: ['Pendant', 'Recessed', 'Recessed', 'Under Cabinet', 'Track', 'Sconce'], group: 'Content' },
    { key: 'lightPositions', label: 'Positions', type: 'text-array', defaultValue: ['Center Island', 'Ceiling NW', 'Ceiling NE', 'Counter', 'Dining', 'Entry'], group: 'Content' },
    { key: 'lumens', label: 'Total Lumens', type: 'number', defaultValue: 4800, min: 100, max: 50000, group: 'Content' },
    { key: 'colorTemp', label: 'Color Temp (K)', type: 'number', defaultValue: 3000, min: 2000, max: 7000, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D97706', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E5E5EA', group: 'Style' },
  ],
  defaultConfig: {
    roomName: 'Open Plan Kitchen',
    lights: ['Island Pendant', 'Recessed A', 'Recessed B', 'Under Cabinet', 'Track Light', 'Sconce'],
    lightTypes: ['Pendant', 'Recessed', 'Recessed', 'Under Cabinet', 'Track', 'Sconce'],
    lightPositions: ['Center Island', 'Ceiling NW', 'Ceiling NE', 'Counter', 'Dining', 'Entry'],
    lumens: 4800,
    colorTemp: 3000,
    accentColor: '#D97706',
    cardColor: '#FFFFFF',
    bgColor: '#1A1A2E',
    textColor: '#E5E5EA',
  },
})
