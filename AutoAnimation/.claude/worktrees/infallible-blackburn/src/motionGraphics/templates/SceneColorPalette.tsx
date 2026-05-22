import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ColorPaletteConfig {
  paletteName: string
  colors: string[]
  bgColor: string
  textColor: string
  labelStyle: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneColorPaletteComponent({ config, progress }: MotionGraphicProps<ColorPaletteConfig>) {
  const { paletteName, colors, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Title enter
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Circle stagger
  const getCircleProgress = (idx: number): number => {
    const start = 0.2 + idx * 0.12
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - start) / 0.25)))
  }

  // Hex code fade in (delayed after circle)
  const getHexProgress = (idx: number): number => {
    const start = 0.35 + idx * 0.12
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Hold: gentle float
  const holdPhase = progress >= 0.25 && progress < 0.8

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Subtle grid background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${textColor}06 1px, transparent 1px), linear-gradient(90deg, ${textColor}06 1px, transparent 1px)`,
          backgroundSize: 'clamp(20px, 4vw, 40px) clamp(20px, 4vw, 40px)',
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
          padding: '6% 8%',
          gap: 'clamp(20px, 4vh, 40px)',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1})`,
        }}
      >
        {/* Palette name */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            fontWeight: 500,
            color: `${textColor}90`,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * -12}px)`,
          }}
        >
          COLOR PALETTE
        </div>

        <div
          style={{
            fontSize: 'clamp(22px, 5.5vw, 40px)',
            fontWeight: 700,
            color: textColor,
            letterSpacing: '0.06em',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 15}px)`,
            textAlign: 'center',
          }}
        >
          {paletteName}
        </div>

        {/* Color circles row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 3vw, 28px)',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {colors.slice(0, 5).map((color, i) => {
            const circleProg = getCircleProgress(i)
            const hexProg = getHexProgress(i)
            const floatOffset = holdPhase ? Math.sin((holdProgress * Math.PI * 4) + i * 1.2) * 4 : 0

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vh, 14px)',
                  transform: `translateY(${floatOffset}px)`,
                }}
              >
                {/* Color circle */}
                <div
                  style={{
                    width: 'clamp(48px, 12vw, 80px)',
                    height: 'clamp(48px, 12vw, 80px)',
                    borderRadius: '50%',
                    background: color,
                    transform: `scale(${circleProg})`,
                    boxShadow: `0 4px 20px ${color}40, inset 0 -3px 6px rgba(0,0,0,0.15)`,
                    border: `2px solid ${textColor}10`,
                  }}
                />

                {/* Hex code */}
                <div
                  style={{
                    fontSize: 'clamp(9px, 1.6vw, 13px)',
                    fontWeight: 500,
                    color: `${textColor}80`,
                    letterSpacing: '0.05em',
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    textTransform: 'uppercase',
                    opacity: hexProg,
                    transform: `translateY(${(1 - hexProg) * 8}px)`,
                  }}
                >
                  {color}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom decorative line */}
        <div
          style={{
            width: 'clamp(60px, 15vw, 120px)',
            height: 1,
            background: `linear-gradient(90deg, transparent, ${textColor}30, transparent)`,
            opacity: titleEnter,
          }}
        />
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-color-palette',
  title: 'Color Palette',
  description: 'Color palette swatch display with circles popping in staggered, hex codes fading, design/fashion aesthetic',
  tags: ['scene', 'color', 'palette', 'design', 'fashion', 'aesthetic', 'swatches'],
  category: 'scene-layout',
  component: SceneColorPaletteComponent as any,
  defaultConfig: {
    paletteName: 'Sunset Rosé',
    colors: ['#e8a0bf', '#f0c9a6', '#d4a574', '#9b6b8a', '#f5e6d3'],
    bgColor: '#141114',
    textColor: '#f5f0f2',
    labelStyle: 'hex',
  },
  configSchema: [
    { key: 'paletteName', label: 'Palette Name', type: 'text', defaultValue: 'Sunset Rosé', group: 'Content' },
    { key: 'colors', label: 'Colors (hex)', type: 'text-array', defaultValue: ['#e8a0bf', '#f0c9a6', '#d4a574', '#9b6b8a', '#f5e6d3'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#141114', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5f0f2', group: 'Style' },
  ],
})
