import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TreeCounterConfig {
  treesPlanted: number
  goalTrees: number
  co2Absorbed: number
  organization: string
  location: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneTreeCounterComponent({ config, progress }: MotionGraphicProps<TreeCounterConfig>) {
  const { treesPlanted, goalTrees, co2Absorbed, organization, location, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Counter animation
  const counterProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.05) / 0.6)))
  const displayTrees = Math.round(counterProg * treesPlanted)
  const displayCO2 = Math.round(counterProg * co2Absorbed)

  // Tree grid
  const treeGridCount = 15
  const trees = Array.from({ length: treeGridCount }, (_, i) => {
    const seed = i * 7 + 42
    return {
      x: 10 + seededRandom(seed) * 80,
      y: 10 + seededRandom(seed + 1) * 80,
      size: 12 + seededRandom(seed + 2) * 14,
      delay: i * 0.04,
      shade: seededRandom(seed + 3) > 0.5 ? '\u{1F333}' : '\u{1F332}',
    }
  })

  const getTreeProg = (delay: number) =>
    easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1 - delay) / 0.3)))

  // Goal progress ring
  const ringProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const goalPercent = Math.min(treesPlanted / goalTrees, 1)
  const ringDash = ringProg * goalPercent * 283

  // Org and location
  const infoProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // Sway during hold
  const treeSway = progress >= 0.2 && progress < 0.8
    ? Math.sin(holdProgress * Math.PI * 5) * 2
    : 0

  // Ring pulse
  const ringPulse = progress >= 0.2 && progress < 0.8
    ? 1 + Math.sin(holdProgress * Math.PI * 4) * 0.02
    : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Forest floor */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20%',
          background: 'linear-gradient(180deg, transparent, #1B5E2020)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5%',
          opacity: exitOpacity,
          transform: `scale(${exitProgress > 0 ? 1 - exitEased * 0.08 : 1})`,
        }}
      >
        {/* Tree grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.25,
          }}
        >
          {trees.map((tree, i) => {
            const tProg = getTreeProg(tree.delay)
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${tree.x}%`,
                  top: `${tree.y}%`,
                  fontSize: `${tree.size}px`,
                  transform: `scale(${tProg}) rotate(${treeSway + i * 0.5}deg)`,
                  opacity: tProg * 0.7,
                }}
              >
                {tree.shade}
              </div>
            )
          })}
        </div>

        {/* Main counter */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(150px, 34vw, 220px)',
            height: 'clamp(150px, 34vw, 220px)',
            marginBottom: 'clamp(12px, 2vh, 20px)',
            transform: `scale(${ringPulse})`,
          }}
        >
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke={`${textColor}12`} strokeWidth="5" />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={accentColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${ringDash} 283`}
              style={{ filter: `drop-shadow(0 0 6px ${accentColor}50)` }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 'clamp(12px, 2.5vw, 18px)', marginBottom: '2px' }}>\u{1F333}</div>
            <div style={{ fontSize: 'clamp(32px, 8vw, 56px)', fontWeight: 900, color: textColor, lineHeight: 1 }}>
              {displayTrees.toLocaleString()}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', color: `${textColor}77`, fontWeight: 600, marginTop: '2px' }}>
              trees planted
            </div>
          </div>
        </div>

        {/* Goal text */}
        <div
          style={{
            fontSize: 'clamp(11px, 1.8vw, 14px)',
            fontWeight: 600,
            color: accentColor,
            marginBottom: 'clamp(12px, 2vh, 20px)',
            opacity: ringProg,
          }}
        >
          Goal: {goalTrees.toLocaleString()} trees ({Math.round(ringProg * goalPercent * 100)}%)
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 3vw, 24px)',
            marginBottom: 'clamp(10px, 2vh, 18px)',
            opacity: infoProg,
            transform: `translateY(${(1 - infoProg) * 10}px)`,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(20px, 5vw, 32px)', fontWeight: 900, color: '#81C784' }}>
              {displayCO2.toLocaleString()}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}77`, fontWeight: 500 }}>
              tons CO\u2082 absorbed
            </div>
          </div>
        </div>

        {/* Organization & location */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: infoProg,
            transform: `translateY(${(1 - infoProg) * 8}px)`,
          }}
        >
          <div
            style={{
              background: `${textColor}0a`,
              border: `1px solid ${textColor}15`,
              borderRadius: '100px',
              padding: 'clamp(4px, 0.8vw, 6px) clamp(10px, 2vw, 16px)',
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              color: `${textColor}aa`,
              fontWeight: 600,
            }}
          >
            \u{1F3E2} {organization}
          </div>
          <div
            style={{
              background: `${textColor}0a`,
              border: `1px solid ${textColor}15`,
              borderRadius: '100px',
              padding: 'clamp(4px, 0.8vw, 6px) clamp(10px, 2vw, 16px)',
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              color: `${textColor}aa`,
              fontWeight: 600,
            }}
          >
            \u{1F4CD} {location}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-tree-counter',
  title: 'Tree Counter',
  description: 'Trees planted counter with animated ring gauge, scattered tree grid background, CO2 stats, organization and location badges.',
  tags: ['scene', 'tree', 'counter', 'planting', 'eco', 'sustainability', 'forest', 'green'],
  category: 'scene-layout',
  component: SceneTreeCounterComponent as any,
  defaultConfig: {
    treesPlanted: 12450,
    goalTrees: 25000,
    co2Absorbed: 498,
    organization: 'One Tree Planted',
    location: 'Amazon Basin',
    bgColor: '#0D1F0D',
    textColor: '#E8F5E9',
    accentColor: '#4CAF50',
  },
  configSchema: [
    { key: 'treesPlanted', label: 'Trees Planted', type: 'number', defaultValue: 12450, min: 0, max: 999999, group: 'Content' },
    { key: 'goalTrees', label: 'Goal Trees', type: 'number', defaultValue: 25000, min: 1, max: 999999, group: 'Content' },
    { key: 'co2Absorbed', label: 'CO2 Absorbed (tons)', type: 'number', defaultValue: 498, min: 0, max: 99999, group: 'Content' },
    { key: 'organization', label: 'Organization', type: 'text', defaultValue: 'One Tree Planted', group: 'Content' },
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'Amazon Basin', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1F0D', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8F5E9', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4CAF50', group: 'Style' },
  ],
})
