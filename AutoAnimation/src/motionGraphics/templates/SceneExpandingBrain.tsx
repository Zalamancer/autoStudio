import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneExpandingBrainConfig {
  level1: string
  level2: string
  level3: string
  level4: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneExpandingBrainComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneExpandingBrainConfig>) {
  const { level1, level2, level3, level4, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const levels = [
    { text: level1, energy: 0.15, color: '#666666', glow: false },
    { text: level2, energy: 0.30, color: '#9999ff', glow: false },
    { text: level3, energy: 0.55, color: '#ff99ff', glow: false },
    { text: level4, energy: 1.0, color: '#ffdd44', glow: true },
  ]

  const levelHeight = 25 // percentage

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor }}>
      {levels.map((level, i) => {
        // Stagger reveal: each level reveals sequentially during enter
        const levelDelay = i * 0.2
        const levelEnter = enterProgress < 1
          ? Math.max(0, Math.min(1, (enterProgress - levelDelay) / 0.3))
          : 1

        const revealProgress = easeOutBack(levelEnter)
        const opacity = levelEnter * (exitProgress > 0 ? 1 - easeOutCubic(exitProgress) : 1)

        // Brain energy circle size
        const baseRadius = 8 + level.energy * 30
        const pulseRadius = level.glow && holdProgress > 0
          ? baseRadius + Math.sin(holdProgress * Math.PI * 6) * 4
          : baseRadius

        // Glow on last level
        const glowFilter = level.glow && holdProgress > 0
          ? `drop-shadow(0 0 ${12 + Math.sin(holdProgress * Math.PI * 4) * 8}px ${level.color})`
          : 'none'

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${i * levelHeight}%`,
              left: 0,
              width: '100%',
              height: `${levelHeight}%`,
              display: 'flex',
              alignItems: 'center',
              padding: '0 5%',
              gap: '4%',
              opacity,
              transform: `translateX(${(1 - revealProgress) * -60}px)`,
              borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}
          >
            {/* Brain energy indicator */}
            <div
              style={{
                width: '18%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: `${pulseRadius * 2}px`,
                  height: `${pulseRadius * 2}px`,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${level.color}, ${level.color}40)`,
                  filter: glowFilter,
                  boxShadow: level.glow
                    ? `0 0 20px ${level.color}60, 0 0 40px ${level.color}30`
                    : `0 0 8px ${level.color}30`,
                  transition: 'width 0.1s, height 0.1s',
                }}
              />
            </div>

            {/* Level text */}
            <div
              style={{
                flex: 1,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: i === 3
                  ? 'clamp(16px, 4vw, 36px)'
                  : 'clamp(13px, 3vw, 28px)',
                fontWeight: i === 3 ? 800 : 600,
                color: textColor,
                lineHeight: 1.3,
                textShadow: level.glow ? `0 0 10px ${level.color}80` : 'none',
              }}
            >
              {level.text}
            </div>
          </div>
        )
      })}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-expanding-brain',
  title: 'Expanding Brain',
  description: 'Expanding brain meme with 4 levels of increasing brain energy, staggered reveal and glowing final level',
  tags: ['scene', 'meme', 'brain', 'expanding', 'viral', 'levels', 'absurd'],
  category: 'scene-layout',
  component: SceneExpandingBrainComponent as any,
  defaultConfig: {
    level1: 'Using a calculator',
    level2: 'Doing math in your head',
    level3: 'Counting on your fingers',
    level4: 'Asking ChatGPT what 2+2 is',
    bgColor: '#0a0a1a',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'level1', label: 'Level 1 (Basic)', type: 'text', defaultValue: 'Using a calculator', group: 'Content' },
    { key: 'level2', label: 'Level 2', type: 'text', defaultValue: 'Doing math in your head', group: 'Content' },
    { key: 'level3', label: 'Level 3', type: 'text', defaultValue: 'Counting on your fingers', group: 'Content' },
    { key: 'level4', label: 'Level 4 (Galaxy Brain)', type: 'text', defaultValue: 'Asking ChatGPT what 2+2 is', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
