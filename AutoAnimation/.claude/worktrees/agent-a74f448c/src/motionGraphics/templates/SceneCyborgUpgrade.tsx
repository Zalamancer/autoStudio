import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCyborgUpgradeConfig {
  implantName: string
  implantType: string
  tier: string
  powerBoost: number
  compatibility: number
  manufacturer: string
  installTime: string
  sideEffects: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneCyborgUpgradeComponent({ config, progress }: MotionGraphicProps<SceneCyborgUpgradeConfig>) {
  const { implantName, implantType, tier, powerBoost, compatibility, manufacturer, installTime, sideEffects, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const frame = Math.floor(progress * 300)

  const cardScale = easeOutBack(Math.min(1, enterProgress / 0.6))
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const displayPower = Math.round(powerBoost * easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)))
  const displayCompat = Math.round(compatibility * easeOutCubic(Math.max(0, (enterProgress - 0.35) / 0.65)))

  // Shimmer effect during hold
  const shimmerX = holdProgress * 200 - 50

  // Tier color mapping
  const tierColors: Record<string, string> = {
    'TIER-1': '#00FF88',
    'TIER-2': '#00FFFF',
    'TIER-3': '#FF00FF',
    'TIER-4': '#FFD700',
    'TIER-5': '#FF4444',
  }
  const tierColor = tierColors[tier] || accentColor

  // Glitch on upgrade reveal
  const isGlitching = enterProgress > 0.3 && enterProgress < 0.4

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Cyber circuit lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {Array.from({ length: 4 }, (_, i) => {
          const y = 20 + i * 20
          const startX = 5 + i * 8
          const midX = 30 + i * 10
          const endX = 95 - i * 5
          const opacity = easeOutCubic(Math.max(0, (enterProgress - i * 0.1) / 0.5)) * 0.06
          return (
            <path
              key={i}
              d={`M ${startX} ${y} L ${midX} ${y} L ${midX + 5} ${y + 5} L ${endX} ${y + 5}`}
              fill="none"
              stroke={`rgba(0,255,255,${opacity})`}
              strokeWidth={0.5}
            />
          )
        })}
      </svg>

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '6%',
        opacity: exitOpacity,
      }}>
        <div style={{
          width: 'clamp(280px, 75vw, 460px)',
          background: 'linear-gradient(145deg, rgba(12,8,28,0.96), rgba(6,3,18,0.98))',
          border: `1px solid ${accentColor}25`,
          borderRadius: 'clamp(8px, 2vw, 16px)',
          padding: 'clamp(16px, 4vw, 32px)',
          transform: `scale(${cardScale}) ${isGlitching ? 'translateX(3px)' : ''}`,
          opacity: cardOpacity,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 40px ${accentColor}10`,
        }}>
          {/* Shimmer */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(105deg, transparent 40%, ${accentColor}08 50%, transparent 60%)`,
            transform: `translateX(${shimmerX}%)`,
            pointerEvents: 'none',
          }} />

          {/* Top: Tier badge */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            background: `linear-gradient(135deg, ${tierColor}20, ${tierColor}10)`,
            borderLeft: `1px solid ${tierColor}30`,
            borderBottom: `1px solid ${tierColor}30`,
            borderRadius: '0 clamp(8px, 2vw, 16px) 0 8px',
            padding: 'clamp(4px, 1vw, 8px) clamp(10px, 2vw, 18px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.15) / 0.85)),
          }}>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(9px, 1.6vw, 12px)',
              fontWeight: 700,
              color: tierColor,
              letterSpacing: 2,
              textShadow: `0 0 8px ${tierColor}40`,
            }}>
              {tier}
            </div>
          </div>

          {/* Implant name + Type */}
          <div style={{
            marginBottom: 'clamp(14px, 3vw, 22px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.05) / 0.95)),
          }}>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              color: `${textColor}35`,
              letterSpacing: 2,
              marginBottom: 4,
            }}>
              CYBERNETIC IMPLANT
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(18px, 4.5vw, 30px)',
              fontWeight: 700,
              color: accentColor,
              letterSpacing: 3,
              textShadow: `0 0 12px ${accentColor}40`,
            }}>
              {implantName}
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(9px, 1.6vw, 11px)',
              color: `${textColor}50`,
              letterSpacing: 1,
              marginTop: 2,
            }}>
              TYPE: {implantType}
            </div>
          </div>

          {/* Power + Compatibility bars */}
          {[
            { label: 'POWER BOOST', value: displayPower, color: '#FF00FF' },
            { label: 'COMPATIBILITY', value: displayCompat, color: compatibility > 70 ? '#00FF88' : '#FFAA00' },
          ].map((bar, i) => {
            const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.25 - i * 0.08) / 0.5))
            return (
              <div key={i} style={{ marginBottom: 'clamp(8px, 1.5vw, 12px)', opacity: stagger }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.2vw, 9px)', color: `${textColor}40`, letterSpacing: 2 }}>
                    {bar.label}
                  </span>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700, color: bar.color }}>
                    +{bar.value}%
                  </span>
                </div>
                <div style={{ height: 'clamp(3px, 0.6vw, 5px)', background: `${textColor}08`, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${bar.value}%`,
                    background: `linear-gradient(90deg, ${bar.color}60, ${bar.color})`,
                    borderRadius: 3,
                    boxShadow: `0 0 6px ${bar.color}30`,
                  }} />
                </div>
              </div>
            )
          })}

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}20, transparent)`, margin: 'clamp(8px, 1.5vw, 12px) 0' }} />

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 1.2vw, 10px)' }}>
            {[
              { label: 'MANUFACTURER', value: manufacturer },
              { label: 'INSTALL TIME', value: installTime },
            ].map((item, i) => {
              const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.5 - i * 0.08) / 0.4))
              return (
                <div key={i} style={{
                  background: `${accentColor}06`,
                  borderRadius: 6,
                  padding: 'clamp(6px, 1.2vw, 10px)',
                  border: `1px solid ${accentColor}10`,
                  opacity: stagger,
                }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(6px, 1vw, 8px)', color: `${textColor}30`, letterSpacing: 1, marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700, color: textColor }}>
                    {item.value}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Warning */}
          <div style={{
            marginTop: 'clamp(8px, 1.5vw, 12px)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(7px, 1.1vw, 9px)',
            color: '#FF4466',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.7) / 0.3)) * 0.7,
            letterSpacing: 1,
          }}>
            SIDE EFFECTS: {sideEffects}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-cyborg-upgrade',
  title: 'Cyborg Upgrade Card',
  description: 'Cyborg upgrade/modification card with tier badge, power boost, compatibility bars, and circuit line background',
  tags: ['scene', 'cyborg', 'upgrade', 'implant', 'cyberpunk', 'futuristic', 'modification'],
  category: 'scene-layout',
  component: SceneCyborgUpgradeComponent as any,
  defaultConfig: {
    implantName: 'REFLEX AMP',
    implantType: 'NEURAL',
    tier: 'TIER-3',
    powerBoost: 85,
    compatibility: 92,
    manufacturer: 'ARASAKA',
    installTime: '4.2 hrs',
    sideEffects: 'Minor neural jitter',
    bgColor: '#0a0518',
    accentColor: '#FF00FF',
    textColor: '#e0e4ea',
  },
  configSchema: [
    { key: 'implantName', label: 'Implant Name', type: 'text', defaultValue: 'REFLEX AMP', group: 'Content' },
    { key: 'implantType', label: 'Type', type: 'text', defaultValue: 'NEURAL', group: 'Content' },
    { key: 'tier', label: 'Tier', type: 'text', defaultValue: 'TIER-3', group: 'Content' },
    { key: 'powerBoost', label: 'Power Boost %', type: 'number', defaultValue: 85, min: 0, max: 100, group: 'Stats' },
    { key: 'compatibility', label: 'Compatibility %', type: 'number', defaultValue: 92, min: 0, max: 100, group: 'Stats' },
    { key: 'manufacturer', label: 'Manufacturer', type: 'text', defaultValue: 'ARASAKA', group: 'Content' },
    { key: 'installTime', label: 'Install Time', type: 'text', defaultValue: '4.2 hrs', group: 'Content' },
    { key: 'sideEffects', label: 'Side Effects', type: 'text', defaultValue: 'Minor neural jitter', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0518', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#FF00FF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e4ea', group: 'Style' },
  ],
})
