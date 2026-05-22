import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PixelHealthBarConfig {
  playerName: string
  healthPercent: number
  manaPercent: number
  level: string
  bgColor: string
  healthColor: string
  manaColor: string
  textColor: string
  frameColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function ScenePixelHealthBarComponent({ config, frame, fps, progress }: MotionGraphicProps<PixelHealthBarConfig>) {
  const { playerName, healthPercent, manaPercent, level, bgColor, healthColor, manaColor, textColor, frameColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const exitProgress = progress > 0.85 ? (progress - 0.85) / 0.15 : 0
  const mainOpacity = easeOutCubic(enterProgress) * (1 - easeOutCubic(exitProgress))

  // Animate bars filling up
  const barFillProgress = progress < 0.3 ? (progress - 0.1) / 0.2 : 1
  const healthFill = Math.max(0, Math.min(1, barFillProgress)) * healthPercent / 100
  const manaFill = Math.max(0, Math.min(1, barFillProgress)) * manaPercent / 100

  // Health bar flash when low
  const isLowHealth = healthPercent < 30
  const lowHealthFlash = isLowHealth && Math.floor(time * 4) % 2 === 0

  // Damage shake effect at midpoint
  const damagePhase = progress >= 0.45 && progress < 0.55
  const shakeX = damagePhase ? Math.sin(frame * 0.8) * 3 : 0
  const shakeY = damagePhase ? Math.cos(frame * 0.6) * 2 : 0

  // Pixel heart beat
  const heartScale = 1 + Math.sin(time * 6) * 0.08

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Courier New', 'Lucida Console', monospace",
        opacity: mainOpacity,
      }}
    >
      {/* Pixel grid background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            'linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '8px 8px',
          pointerEvents: 'none',
        }}
      />

      {/* HUD container */}
      <div
        style={{
          transform: `translate(${shakeX}px, ${shakeY}px)`,
          width: 'clamp(260px, 65vw, 480px)',
          padding: 'clamp(12px, 2.5vw, 24px)',
          background: `${frameColor}20`,
          border: `3px solid ${frameColor}`,
          imageRendering: 'pixelated' as any,
          position: 'relative',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(8px, 1.5vw, 14px)',
          }}
        >
          {/* Player name with pixel heart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 10px)' }}>
            {/* Pixel heart */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 4px)',
                gridTemplateRows: 'repeat(4, 4px)',
                transform: `scale(${heartScale})`,
                flexShrink: 0,
              }}
            >
              {[
                0, 1, 0, 1, 0,
                1, 1, 1, 1, 1,
                0, 1, 1, 1, 0,
                0, 0, 1, 0, 0,
              ].map((cell, i) => (
                <div
                  key={i}
                  style={{
                    width: 4,
                    height: 4,
                    background: cell ? (lowHealthFlash ? '#FF0000' : healthColor) : 'transparent',
                    imageRendering: 'pixelated' as any,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: 'clamp(14px, 3vw, 26px)',
                fontWeight: 700,
                color: textColor,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              {playerName}
            </div>
          </div>
          {/* Level */}
          <div
            style={{
              fontSize: 'clamp(11px, 2vw, 18px)',
              fontWeight: 700,
              color: `${textColor}AA`,
              letterSpacing: 1,
            }}
          >
            {`LV.${level}`}
          </div>
        </div>

        {/* Health bar */}
        <div style={{ marginBottom: 'clamp(6px, 1vw, 10px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <div style={{ fontSize: 'clamp(9px, 1.6vw, 13px)', color: healthColor, fontWeight: 700, letterSpacing: 1 }}>HP</div>
            <div style={{ fontSize: 'clamp(9px, 1.6vw, 13px)', color: textColor, fontWeight: 700 }}>
              {`${Math.round(healthFill * 100)}/100`}
            </div>
          </div>
          <div
            style={{
              width: '100%',
              height: 'clamp(14px, 2.5vw, 22px)',
              background: '#1a1a1a',
              border: `2px solid ${frameColor}80`,
              position: 'relative',
              overflow: 'hidden',
              imageRendering: 'pixelated' as any,
            }}
          >
            {/* Health fill with pixel segments */}
            <div
              style={{
                width: `${healthFill * 100}%`,
                height: '100%',
                background: lowHealthFlash
                  ? 'linear-gradient(90deg, #FF0000, #FF4400)'
                  : `linear-gradient(90deg, ${healthColor}, ${healthColor}CC)`,
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(0,0,0,0.15) 6px, rgba(0,0,0,0.15) 8px)`,
                transition: 'none',
              }}
            />
            {/* Highlight line */}
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: 2,
                right: 2,
                height: 2,
                background: 'rgba(255,255,255,0.2)',
              }}
            />
          </div>
        </div>

        {/* Mana bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <div style={{ fontSize: 'clamp(9px, 1.6vw, 13px)', color: manaColor, fontWeight: 700, letterSpacing: 1 }}>MP</div>
            <div style={{ fontSize: 'clamp(9px, 1.6vw, 13px)', color: textColor, fontWeight: 700 }}>
              {`${Math.round(manaFill * 100)}/100`}
            </div>
          </div>
          <div
            style={{
              width: '100%',
              height: 'clamp(10px, 2vw, 16px)',
              background: '#1a1a1a',
              border: `2px solid ${frameColor}80`,
              position: 'relative',
              overflow: 'hidden',
              imageRendering: 'pixelated' as any,
            }}
          >
            <div
              style={{
                width: `${manaFill * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${manaColor}, ${manaColor}CC)`,
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(0,0,0,0.15) 6px, rgba(0,0,0,0.15) 8px)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: 2,
                right: 2,
                height: 2,
                background: 'rgba(255,255,255,0.15)',
              }}
            />
          </div>
        </div>

        {/* Pixel corner brackets */}
        {[0, 1, 2, 3].map((c) => (
          <div
            key={c}
            style={{
              position: 'absolute',
              [c < 2 ? 'top' : 'bottom']: -3,
              [c % 2 === 0 ? 'left' : 'right']: -3,
              width: 8,
              height: 8,
              borderTop: c < 2 ? `3px solid ${frameColor}` : 'none',
              borderBottom: c >= 2 ? `3px solid ${frameColor}` : 'none',
              borderLeft: c % 2 === 0 ? `3px solid ${frameColor}` : 'none',
              borderRight: c % 2 !== 0 ? `3px solid ${frameColor}` : 'none',
            }}
          />
        ))}
      </div>

      {/* Scan lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-pixel-health-bar',
  title: 'Scene Pixel Health Bar',
  description: 'Pixel art RPG health and mana bars with animated fill, low-health flash, damage shake, and pixel heart indicator',
  tags: ['scene', 'health-bar', 'pixel', 'RPG', 'retro', 'gaming', 'HUD', 'mana'],
  category: 'scene-layout',
  component: ScenePixelHealthBarComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    playerName: 'HERO',
    healthPercent: 75,
    manaPercent: 60,
    level: '42',
    bgColor: '#0a0a14',
    healthColor: '#00CC00',
    manaColor: '#3366FF',
    textColor: '#FFFFFF',
    frameColor: '#888888',
  },
  configSchema: [
    { key: 'playerName', label: 'Player Name', type: 'text', defaultValue: 'HERO', group: 'Content' },
    { key: 'healthPercent', label: 'Health %', type: 'number', defaultValue: 75, min: 0, max: 100, group: 'Content' },
    { key: 'manaPercent', label: 'Mana %', type: 'number', defaultValue: 60, min: 0, max: 100, group: 'Content' },
    { key: 'level', label: 'Level', type: 'text', defaultValue: '42', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'healthColor', label: 'Health Color', type: 'color', defaultValue: '#00CC00', group: 'Style' },
    { key: 'manaColor', label: 'Mana Color', type: 'color', defaultValue: '#3366FF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'frameColor', label: 'Frame Color', type: 'color', defaultValue: '#888888', group: 'Style' },
  ],
})
