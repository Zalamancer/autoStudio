import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneWisdomCardConfig {
  wisdom: string
  source: string
  bgColor: string
  textColor: string
  borderColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneWisdomCardComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneWisdomCardConfig>) {
  const { wisdom, source, bgColor, textColor, borderColor, accentColor } = config
  const time = frame / fps

  // Phase calculations
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Border draw-in animation (top -> right -> bottom -> left)
  const borderDraw = easeOutCubic(Math.min(1, enterProgress * 1.5))

  // Text fade in after border (delayed)
  const textDelay = 0.4
  const textEnter = enterProgress < textDelay ? 0 : (enterProgress - textDelay) / (1 - textDelay)
  const textOpacity = easeOutCubic(textEnter)

  // Candlelight flicker during hold — subtle opacity variation
  const isHolding = progress >= 0.25 && progress < 0.8
  const flickerBase = isHolding
    ? 0.85 + Math.sin(time * 7.3) * 0.05 + Math.sin(time * 11.7) * 0.03 + Math.sin(time * 19.1) * 0.02
    : 1

  // Source line entry
  const sourceDelay = 0.7
  const sourceEnter = enterProgress < sourceDelay ? 0 : (enterProgress - sourceDelay) / (1 - sourceDelay)
  const sourceOpacity = easeOutCubic(sourceEnter)

  // Exit
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const exitScale = exitProgress > 0 ? 1 - easeInCubic(exitProgress) * 0.05 : 1

  // Border segments — draw sequentially
  const topBorder = Math.min(1, borderDraw * 4) // 0-25% of draw
  const rightBorder = Math.max(0, Math.min(1, (borderDraw - 0.25) * 4)) // 25-50%
  const bottomBorder = Math.max(0, Math.min(1, (borderDraw - 0.5) * 4)) // 50-75%
  const leftBorder = Math.max(0, Math.min(1, (borderDraw - 0.75) * 4)) // 75-100%

  // Parchment gradient background
  const parchmentBg = `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}f0 50%, ${bgColor}e0 100%)`

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Base background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Parchment texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: parchmentBg,
          opacity: flickerBase,
        }}
      />

      {/* Subtle warm vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
          opacity: exitOpacity,
        }}
      />

      {/* Candlelight glow (center warm spot) */}
      {isHolding && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            width: '60%',
            height: '40%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(ellipse, ${accentColor}08 0%, transparent 70%)`,
            opacity: flickerBase,
          }}
        />
      )}

      {/* Content with ornate border */}
      <div
        style={{
          position: 'absolute',
          inset: '10%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Border segments */}
        {/* Top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${topBorder * 100}%`,
            height: '2px',
            background: borderColor,
          }}
        />
        {/* Right */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '2px',
            height: `${rightBorder * 100}%`,
            background: borderColor,
          }}
        />
        {/* Bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: `${bottomBorder * 100}%`,
            height: '2px',
            background: borderColor,
            transformOrigin: 'right',
          }}
        />
        {/* Left */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '2px',
            height: `${leftBorder * 100}%`,
            background: borderColor,
            transformOrigin: 'bottom',
          }}
        />

        {/* Corner ornaments */}
        {borderDraw >= 1 && (
          <>
            {[
              { top: -4, left: -4 },
              { top: -4, right: -4 },
              { bottom: -4, left: -4 },
              { bottom: -4, right: -4 },
            ].map((pos, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  ...pos,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: borderColor,
                  opacity: exitOpacity * 0.6,
                } as React.CSSProperties}
              />
            ))}
          </>
        )}

        {/* Wisdom text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '12% 10%',
          }}
        >
          {/* Decorative flourish */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(20px, 4vw, 36px)',
              color: accentColor,
              opacity: textOpacity * 0.4,
              marginBottom: '0.8em',
              letterSpacing: '0.3em',
            }}
          >
            {'\u2022 \u2022 \u2022'}
          </div>

          {/* Main wisdom text */}
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(16px, 4vw, 40px)',
              fontWeight: 400,
              color: textColor,
              lineHeight: 1.8,
              textAlign: 'center',
              maxWidth: '90%',
              opacity: textOpacity * flickerBase,
              letterSpacing: '0.01em',
            }}
          >
            {wisdom}
          </div>

          {/* Divider */}
          <div
            style={{
              width: `${sourceOpacity * 50}px`,
              height: '1px',
              background: accentColor,
              margin: '1.5em 0',
              opacity: sourceOpacity * 0.6,
            }}
          />

          {/* Source */}
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(10px, 2vw, 18px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: accentColor,
              opacity: sourceOpacity * 0.7,
              letterSpacing: '0.08em',
            }}
          >
            {source}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-wisdom-card',
  title: 'Scene Wisdom Card',
  description: 'Ancient wisdom aesthetic with ornate border, parchment tones, serif text, and candlelight flicker effect.',
  tags: ['scene', 'wisdom', 'quote', 'ancient', 'parchment', 'scholarly', 'timeless', 'motivational'],
  category: 'scene-layout',
  component: SceneWisdomCardComponent as any,
  defaultConfig: {
    wisdom: 'The unexamined life is not worth living.',
    source: 'Socrates',
    bgColor: '#2C2416',
    textColor: '#E8DCC8',
    borderColor: '#8B7355',
    accentColor: '#C4A265',
  },
  configSchema: [
    { key: 'wisdom', label: 'Wisdom Text', type: 'text', defaultValue: 'The unexamined life is not worth living.', group: 'Content' },
    { key: 'source', label: 'Source / Author', type: 'text', defaultValue: 'Socrates', group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#2C2416', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8DCC8', group: 'Style' },
    { key: 'borderColor', label: 'Border Color', type: 'color', defaultValue: '#8B7355', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C4A265', group: 'Style' },
  ],
})
