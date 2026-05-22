import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BossHealthBarConfig {
  bossName: string
  bossTitle: string
  healthPercent: number
  bgColor: string
  barColor: string
  dangerColor: string
  textColor: string
  frameColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneBossHealthBarComponent({ config, frame, fps, progress }: MotionGraphicProps<BossHealthBarConfig>) {
  const { bossName, bossTitle, healthPercent, bgColor, barColor, dangerColor, textColor, frameColor } = config
  const time = frame / fps

  // Boss bar slides in from top
  const enterProgress = progress < 0.12 ? progress / 0.12 : 1
  const exitProgress = progress > 0.85 ? (progress - 0.85) / 0.15 : 0
  const slideY = (1 - easeOutCubic(enterProgress)) * -60 + easeOutCubic(exitProgress) * -60
  const mainOpacity = (enterProgress > 0.05 ? 1 : enterProgress / 0.05) * (1 - easeOutCubic(exitProgress))

  // Health depletes during animation
  const healthDrainStart = 0.3
  const healthDrainEnd = 0.7
  const drainProgress = progress < healthDrainStart ? 0 : progress > healthDrainEnd ? 1 : (progress - healthDrainStart) / (healthDrainEnd - healthDrainStart)
  const currentHealth = healthPercent * (1 - drainProgress * 0.6)

  // Bar fill
  const barFillProgress = progress < 0.2 ? (progress - 0.08) / 0.12 : 1
  const displayHealth = Math.max(0, Math.min(100, currentHealth * Math.max(0, easeOutCubic(barFillProgress))))

  // Danger state
  const isDanger = displayHealth < 30
  const dangerFlash = isDanger && Math.floor(time * 6) % 2 === 0

  // Damage shake
  const takingDamage = progress >= healthDrainStart && progress <= healthDrainEnd
  const shakeX = takingDamage ? Math.sin(frame * 0.7) * 3 * (1 - drainProgress) : 0
  const shakeY = takingDamage ? Math.cos(frame * 0.5) * 2 * (1 - drainProgress) : 0

  // Skull pixel art (5x5)
  const skullPattern = [
    [0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
        fontFamily: "'Courier New', 'Lucida Console', monospace",
        opacity: mainOpacity,
      }}
    >
      {/* Dark dramatic overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center top, rgba(180,0,0,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* CRT lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Boss health bar UI - pinned to bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '50%',
          transform: `translateX(-50%) translateY(${slideY}px) translate(${shakeX}px, ${shakeY}px)`,
          width: 'clamp(280px, 75vw, 540px)',
        }}
      >
        {/* Boss name and title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
          }}
        >
          {/* Pixel skull */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 4px)',
              gridTemplateRows: 'repeat(5, 4px)',
              opacity: isDanger ? (dangerFlash ? 1 : 0.5) : 0.6,
            }}
          >
            {skullPattern.flat().map((cell, i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  background: cell ? (isDanger ? dangerColor : frameColor) : 'transparent',
                  imageRendering: 'pixelated' as any,
                }}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 'clamp(8px, 1.4vw, 11px)',
                color: `${textColor}60`,
                textTransform: 'uppercase',
                letterSpacing: 3,
              }}
            >
              {bossTitle}
            </div>
            <div
              style={{
                fontSize: 'clamp(16px, 3.5vw, 30px)',
                fontWeight: 700,
                color: isDanger && dangerFlash ? dangerColor : textColor,
                textTransform: 'uppercase',
                letterSpacing: 3,
                textShadow: isDanger ? `0 0 10px ${dangerColor}60` : 'none',
              }}
            >
              {bossName}
            </div>
          </div>

          {/* Mirror skull */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 4px)',
              gridTemplateRows: 'repeat(5, 4px)',
              opacity: isDanger ? (dangerFlash ? 1 : 0.5) : 0.6,
              transform: 'scaleX(-1)',
            }}
          >
            {skullPattern.flat().map((cell, i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  background: cell ? (isDanger ? dangerColor : frameColor) : 'transparent',
                  imageRendering: 'pixelated' as any,
                }}
              />
            ))}
          </div>
        </div>

        {/* Health bar frame */}
        <div
          style={{
            width: '100%',
            height: 'clamp(20px, 3.5vw, 32px)',
            border: `3px solid ${isDanger && dangerFlash ? dangerColor : frameColor}`,
            background: '#0a0a0a',
            position: 'relative',
            overflow: 'hidden',
            imageRendering: 'pixelated' as any,
            boxShadow: isDanger ? `0 0 12px ${dangerColor}30` : 'none',
          }}
        >
          {/* Damage flash (white flash where health was lost) */}
          {takingDamage && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${displayHealth}%`,
                width: `${healthPercent - displayHealth}%`,
                background: '#FFFFFF',
                opacity: 0.3 + Math.sin(frame * 0.3) * 0.2,
              }}
            />
          )}

          {/* Health fill */}
          <div
            style={{
              width: `${displayHealth}%`,
              height: '100%',
              background: isDanger
                ? `linear-gradient(90deg, ${dangerColor}, ${dangerColor}CC)`
                : `linear-gradient(90deg, ${barColor}, ${barColor}CC)`,
              position: 'relative',
              transition: 'none',
            }}
          >
            {/* Pixel segment lines */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.15) 8px, rgba(0,0,0,0.15) 10px)`,
              }}
            />
            {/* Top highlight */}
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: 2,
                right: 2,
                height: 3,
                background: 'rgba(255,255,255,0.2)',
              }}
            />
          </div>

          {/* HP text overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(10px, 1.8vw, 15px)',
              fontWeight: 700,
              color: '#FFFFFF',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              letterSpacing: 2,
            }}
          >
            {`${Math.round(displayHealth)} / 100`}
          </div>
        </div>

        {/* Decorative bottom line */}
        <div
          style={{
            width: '60%',
            height: 2,
            background: `${frameColor}30`,
            margin: '6px auto 0',
          }}
        />

        {/* Corner brackets */}
        {[0, 1, 2, 3].map((c) => (
          <div
            key={c}
            style={{
              position: 'absolute',
              [c < 2 ? 'top' : 'bottom']: -5,
              [c % 2 === 0 ? 'left' : 'right']: -5,
              width: 10,
              height: 10,
              borderTop: c < 2 ? `2px solid ${frameColor}` : 'none',
              borderBottom: c >= 2 ? `2px solid ${frameColor}` : 'none',
              borderLeft: c % 2 === 0 ? `2px solid ${frameColor}` : 'none',
              borderRight: c % 2 !== 0 ? `2px solid ${frameColor}` : 'none',
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-boss-health-bar',
  title: 'Scene Boss Health Bar',
  description: 'Boss fight health bar UI with drain animation, danger flash, damage shake, pixel skulls, and dramatic vignette',
  tags: ['scene', 'boss', 'health-bar', 'retro', 'gaming', 'pixel', 'fight', 'RPG'],
  category: 'scene-layout',
  component: SceneBossHealthBarComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    bossName: 'DARK LORD',
    bossTitle: 'WORLD BOSS',
    healthPercent: 100,
    bgColor: '#0a0008',
    barColor: '#CC0000',
    dangerColor: '#FF3300',
    textColor: '#FFFFFF',
    frameColor: '#666666',
  },
  configSchema: [
    { key: 'bossName', label: 'Boss Name', type: 'text', defaultValue: 'DARK LORD', group: 'Content' },
    { key: 'bossTitle', label: 'Boss Title', type: 'text', defaultValue: 'WORLD BOSS', group: 'Content' },
    { key: 'healthPercent', label: 'Starting Health %', type: 'number', defaultValue: 100, min: 10, max: 100, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0008', group: 'Style' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#CC0000', group: 'Style' },
    { key: 'dangerColor', label: 'Danger Color', type: 'color', defaultValue: '#FF3300', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'frameColor', label: 'Frame Color', type: 'color', defaultValue: '#666666', group: 'Style' },
  ],
})
