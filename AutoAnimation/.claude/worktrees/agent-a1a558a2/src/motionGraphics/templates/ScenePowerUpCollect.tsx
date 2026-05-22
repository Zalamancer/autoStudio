import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PowerUpCollectConfig {
  powerUpName: string
  description: string
  icon: string
  bgColor: string
  glowColor: string
  textColor: string
  ringColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePowerUpCollectComponent({ config, frame, fps, progress }: MotionGraphicProps<PowerUpCollectConfig>) {
  const { powerUpName, description, icon, bgColor, glowColor, textColor, ringColor } = config
  const time = frame / fps

  // Phase: spawn (0-0.15), collect flash (0.15-0.3), display (0.3-0.8), fade (0.8-1)
  const spawnProgress = progress < 0.15 ? progress / 0.15 : 1
  const collectProgress = progress >= 0.15 && progress < 0.3 ? (progress - 0.15) / 0.15 : progress >= 0.3 ? 1 : 0
  const exitProgress = progress > 0.8 ? (progress - 0.8) / 0.2 : 0

  const mainOpacity = (progress < 0.05 ? progress / 0.05 : 1) * (1 - easeOutCubic(exitProgress))

  // Power-up bob
  const bobY = Math.sin(time * 4) * 6
  const itemRotation = time * 60

  // Flash on collect
  const flashOpacity = collectProgress > 0 && collectProgress < 0.5
    ? (0.5 - collectProgress) * 2 * 0.6
    : 0

  // Expanding rings
  const ringCount = 3
  const rings = Array.from({ length: ringCount }, (_, i) => {
    const ringDelay = 0.15 + i * 0.06
    const ringProgress = progress >= ringDelay ? Math.min(1, (progress - ringDelay) / 0.3) : 0
    return { progress: ringProgress, index: i }
  })

  // Sparkle particles
  const sparkleCount = 12
  const sparkles = Array.from({ length: sparkleCount }, (_, i) => {
    const angle = (i / sparkleCount) * Math.PI * 2 + time * 2
    const baseRadius = 40 + Math.sin(time * 3 + i) * 15
    const visible = progress > 0.2 && progress < 0.85
    return {
      x: Math.cos(angle) * baseRadius,
      y: Math.sin(angle) * baseRadius + bobY,
      visible,
      index: i,
    }
  })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Courier New', 'Lucida Console', monospace",
        opacity: mainOpacity,
      }}
    >
      {/* Background pixel grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            'linear-gradient(0deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '8px 8px',
          pointerEvents: 'none',
        }}
      />

      {/* Collect flash overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: glowColor,
          opacity: flashOpacity,
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />

      {/* Expanding rings */}
      {rings.map(({ progress: rp, index: ri }) => (
        <div
          key={`ring-${ri}`}
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            width: `${30 + rp * 120}px`,
            height: `${30 + rp * 120}px`,
            border: `2px solid ${ringColor}`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, 1 - rp) * 0.5,
            imageRendering: 'pixelated' as any,
          }}
        />
      ))}

      {/* Power-up item */}
      <div
        style={{
          transform: `translateY(${bobY}px) scale(${spawnProgress < 1 ? easeOutBack(spawnProgress) : 1})`,
          marginBottom: 'clamp(10px, 2vw, 20px)',
          position: 'relative',
        }}
      >
        {/* Glow behind item */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(80px, 16vw, 140px)',
            height: 'clamp(80px, 16vw, 140px)',
            background: `radial-gradient(circle, ${glowColor}40 0%, transparent 70%)`,
            borderRadius: '50%',
          }}
        />
        {/* Item container - pixel block */}
        <div
          style={{
            width: 'clamp(56px, 12vw, 96px)',
            height: 'clamp(56px, 12vw, 96px)',
            background: `${glowColor}20`,
            border: `3px solid ${glowColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(28px, 6vw, 52px)',
            position: 'relative',
            imageRendering: 'pixelated' as any,
            boxShadow: `0 0 20px ${glowColor}40, inset 0 0 10px ${glowColor}20`,
          }}
        >
          {icon}
          {/* Rotating highlight */}
          <div
            style={{
              position: 'absolute',
              top: 3,
              left: 3,
              width: '40%',
              height: 3,
              background: `rgba(255,255,255,${0.2 + Math.sin(time * 5) * 0.1})`,
            }}
          />
        </div>

        {/* Sparkle particles */}
        {sparkles.map((sp) => sp.visible ? (
          <div
            key={`sp-${sp.index}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 4,
              height: 4,
              background: sp.index % 3 === 0 ? glowColor : sp.index % 3 === 1 ? '#FFD700' : '#FFFFFF',
              transform: `translate(calc(-50% + ${sp.x}px), calc(-50% + ${sp.y}px))`,
              opacity: 0.5 + Math.sin(time * 8 + sp.index) * 0.3,
              imageRendering: 'pixelated' as any,
            }}
          />
        ) : null)}
      </div>

      {/* "POWER UP!" text */}
      <div
        style={{
          fontSize: 'clamp(10px, 2vw, 16px)',
          fontWeight: 700,
          color: glowColor,
          textTransform: 'uppercase',
          letterSpacing: 6,
          marginBottom: 'clamp(4px, 1vw, 10px)',
          opacity: collectProgress > 0 ? (Math.floor(time * 5) % 2 === 0 ? 1 : 0.5) : 0,
          textShadow: `0 0 8px ${glowColor}80`,
        }}
      >
        {'POWER UP!'}
      </div>

      {/* Power-up name */}
      <div
        style={{
          fontSize: 'clamp(20px, 5vw, 44px)',
          fontWeight: 700,
          color: textColor,
          textTransform: 'uppercase',
          letterSpacing: 3,
          textShadow: `0 0 10px ${glowColor}40`,
          opacity: collectProgress,
          transform: `translateY(${(1 - easeOutCubic(collectProgress)) * 20}px)`,
        }}
      >
        {powerUpName}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 'clamp(10px, 2vw, 16px)',
          color: `${textColor}99`,
          marginTop: 'clamp(4px, 0.8vw, 8px)',
          letterSpacing: 1,
          opacity: Math.min(1, Math.max(0, (progress - 0.3) / 0.1)),
        }}
      >
        {description}
      </div>

      {/* CRT overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-power-up-collect',
  title: 'Scene Power-Up Collect',
  description: 'Power-up collection animation with bobbing item, collect flash, expanding rings, sparkle particles, and pixel styling',
  tags: ['scene', 'power-up', 'collect', 'retro', 'gaming', 'item', 'pixel', 'glow'],
  category: 'scene-layout',
  component: ScenePowerUpCollectComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    powerUpName: 'FIRE FLOWER',
    description: 'Attack power doubled for 30 seconds',
    icon: '\u{1F525}',
    bgColor: '#0a0a14',
    glowColor: '#FF6600',
    textColor: '#FFFFFF',
    ringColor: '#FFD700',
  },
  configSchema: [
    { key: 'powerUpName', label: 'Power-Up Name', type: 'text', defaultValue: 'FIRE FLOWER', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Attack power doubled for 30 seconds', group: 'Content' },
    { key: 'icon', label: 'Icon', type: 'text', defaultValue: '\u{1F525}', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'glowColor', label: 'Glow Color', type: 'color', defaultValue: '#FF6600', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#FFD700', group: 'Style' },
  ],
})
