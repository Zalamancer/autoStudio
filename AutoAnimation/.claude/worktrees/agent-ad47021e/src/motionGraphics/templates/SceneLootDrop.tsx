import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneLootDropConfig {
  itemName: string
  rarity: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const RARITY_MAP: Record<string, { color: string; label: string; icon: string }> = {
  common: { color: '#9ca3af', label: 'COMMON', icon: '\u{1F4E6}' },
  uncommon: { color: '#22c55e', label: 'UNCOMMON', icon: '\u{1F381}' },
  rare: { color: '#3b82f6', label: 'RARE', icon: '\u{1F48E}' },
  epic: { color: '#a855f7', label: 'EPIC', icon: '\u{1F31F}' },
  legendary: { color: '#f59e0b', label: 'LEGENDARY', icon: '\u{1F451}' },
}

function SceneLootDropComponent({ config, progress }: MotionGraphicProps<SceneLootDropConfig>) {
  const { itemName, rarity, bgColor, textColor } = config

  const rarityInfo = RARITY_MAP[rarity.toLowerCase()] || RARITY_MAP.common
  const glowColor = rarityInfo.color
  const isLegendary = rarity.toLowerCase() === 'legendary'
  const isEpicOrAbove = ['epic', 'legendary'].includes(rarity.toLowerCase())

  const enterProgress = progress < 0.35 ? progress / 0.35 : 1
  const holdProgress = progress >= 0.35 && progress < 0.8 ? (progress - 0.35) / 0.45 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Phase 1: Chest appears (0 - 0.3 of enter)
  const chestReveal = easeOutBack(Math.min(1, enterProgress / 0.3))
  const chestScale = chestReveal

  // Phase 2: Chest opens / shake (0.3 - 0.6 of enter)
  const shakePhase = Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3))
  const shakeX = shakePhase < 1 ? Math.sin(shakePhase * Math.PI * 8) * (8 * (1 - shakePhase)) : 0

  // Phase 3: Item reveal burst (0.6 - 1 of enter)
  const revealPhase = Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.4))
  const itemScale = easeOutElastic(revealPhase)
  const itemOpacity = easeOutCubic(Math.min(1, revealPhase * 2))

  // Burst flash on reveal
  const burstFlash = revealPhase > 0 && revealPhase < 0.3
    ? Math.sin((revealPhase / 0.3) * Math.PI) * 0.4
    : 0

  // Rarity glow particles during hold
  const isHolding = progress >= 0.35 && progress < 0.8
  const particleCount = isEpicOrAbove ? 16 : 8
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2
    const time = holdProgress * 4 + i * 0.4
    const radius = 60 + Math.sin(time * 1.5) * 25
    const x = Math.cos(angle + time * 0.3) * radius
    const y = Math.sin(angle + time * 0.3) * radius - 20
    const size = 2 + Math.sin(time * 2 + i) * 1.5
    const alpha = isHolding ? 0.3 + Math.sin(time * 2.5 + i) * 0.2 : 0
    return { x, y, size, alpha }
  })

  // Glow pulse
  const glowPulse = isHolding ? 0.5 + Math.sin(holdProgress * Math.PI * 5) * 0.5 : revealPhase

  // Item name reveal
  const nameReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.25)))

  // Rarity label
  const rarityReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.15)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.3

  // Legendary beam of light
  const beamOpacity = isLegendary && revealPhase > 0
    ? (isHolding ? 0.1 + Math.sin(holdProgress * Math.PI * 4) * 0.05 : revealPhase * 0.15)
    : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Legendary beam of light */}
      {beamOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '40%',
            width: '20%',
            height: '100%',
            background: `linear-gradient(180deg, ${glowColor}00, ${glowColor}30, ${glowColor}00)`,
            opacity: beamOpacity * exitOpacity,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Burst flash */}
      {burstFlash > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: glowColor,
            opacity: burstFlash,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Glow particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: glowColor,
              boxShadow: `0 0 4px ${glowColor}`,
              transform: `translate(${p.x}px, ${p.y}px)`,
              opacity: p.alpha,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Chest / loot box */}
        <div
          style={{
            fontSize: 'clamp(50px, 14vw, 100px)',
            transform: `scale(${chestScale}) translateX(${shakeX}px)`,
            opacity: revealPhase > 0.5 ? 1 - (revealPhase - 0.5) * 1.5 : 1,
            lineHeight: 1,
            marginBottom: 'clamp(8px, 2vw, 16px)',
          }}
        >
          {revealPhase < 0.5 ? '\u{1F4E6}' : rarityInfo.icon}
        </div>

        {/* Item icon (replaces chest) */}
        {revealPhase > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '38%',
              fontSize: 'clamp(60px, 16vw, 110px)',
              transform: `scale(${itemScale})`,
              opacity: itemOpacity,
              lineHeight: 1,
              filter: `drop-shadow(0 0 ${16 * glowPulse}px ${glowColor})`,
            }}
          >
            {rarityInfo.icon}
          </div>
        )}

        {/* Item name */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(18px, 4.5vw, 36px)',
            fontWeight: 900,
            color: textColor,
            textAlign: 'center',
            marginTop: 'clamp(20px, 5vw, 40px)',
            opacity: nameReveal,
            transform: `translateY(${(1 - nameReveal) * 15}px)`,
            textShadow: `0 0 12px ${glowColor}40`,
          }}
        >
          {itemName}
        </div>

        {/* Rarity label */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(10px, 1.8vw, 15px)',
            fontWeight: 800,
            color: glowColor,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginTop: 'clamp(6px, 1.2vw, 12px)',
            opacity: rarityReveal,
            textShadow: `0 0 8px ${glowColor}60`,
          }}
        >
          {rarityInfo.label}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-loot-drop',
  title: 'Loot Drop',
  description: 'Loot box/item reveal with rarity tier (common to legendary), item name, glow color by rarity, chest-open animation',
  tags: ['scene', 'gaming', 'loot', 'drop', 'item', 'rarity', 'legendary', 'chest'],
  category: 'scene-layout',
  component: SceneLootDropComponent as any,
  defaultConfig: {
    itemName: 'Blade of Eternity',
    rarity: 'legendary',
    bgColor: '#0a0a14',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'itemName', label: 'Item Name', type: 'text', defaultValue: 'Blade of Eternity', group: 'Content' },
    { key: 'rarity', label: 'Rarity', type: 'select', defaultValue: 'legendary', options: ['common', 'uncommon', 'rare', 'epic', 'legendary'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
