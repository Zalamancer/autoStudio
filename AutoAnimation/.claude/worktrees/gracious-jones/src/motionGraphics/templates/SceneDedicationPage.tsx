import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneDedicationPageConfig {
  dedicationText: string
  recipientName: string
  closingLine: string
  bgColor: string
  textColor: string
  accentColor: string
  flourishColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuint(t: number): number { return 1 - Math.pow(1 - t, 5) }

function SceneDedicationPageComponent({ config, progress }: MotionGraphicProps<SceneDedicationPageConfig>) {
  const { dedicationText, recipientName, closingLine, bgColor, textColor, accentColor, flourishColor } = config

  // Phases: enter 0-0.3, hold 0.3-0.8, exit 0.8-1
  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // "For..." fades in with scale
  const forOpacity = easeOutQuint(Math.min(1, enterProgress / 0.35))
  const forScale = 0.85 + 0.15 * forOpacity

  // Recipient name appears with upward motion
  const nameOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))
  const nameY = (1 - nameOpacity) * 25

  // Top flourish expands outward
  const flourishScale = easeOutQuint(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.4)))

  // Dedication text reveals
  const textOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.35)))
  const textY = (1 - textOpacity) * 15

  // Closing line fades last
  const closingOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3)))

  // Bottom flourish
  const bottomFlourishScale = easeOutQuint(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.35)))

  // Hold: subtle warm glow
  const holdGlow = holdProgress > 0 ? 0.5 + 0.3 * Math.sin(holdProgress * Math.PI * 2) : 0

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.08

  // Ornamental flourish component
  const renderFlourish = (scale: number, flip: boolean) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(4px, 1vw, 8px)',
        transform: `scaleX(${scale}) ${flip ? 'scaleY(-1)' : ''}`,
        opacity: scale,
      }}
    >
      <div style={{ width: 'clamp(25px, 6vw, 50px)', height: 1, background: `linear-gradient(to right, transparent, ${flourishColor})` }} />
      <div style={{ fontSize: 'clamp(10px, 2vw, 16px)', color: flourishColor }}>
        {'\u2767'}
      </div>
      <div style={{ width: 'clamp(25px, 6vw, 50px)', height: 1, background: `linear-gradient(to left, transparent, ${flourishColor})` }} />
    </div>
  )

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Garamond', 'Times New Roman', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Soft radial warmth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${accentColor}08 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Page content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(10px, 2.5vw, 22px)',
          maxWidth: '70%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Top flourish */}
        {renderFlourish(flourishScale, false)}

        {/* "For" prefix */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.8vw, 22px)',
            fontStyle: 'italic',
            color: `${textColor}88`,
            letterSpacing: '0.1em',
            opacity: forOpacity,
            transform: `scale(${forScale})`,
            marginTop: 'clamp(6px, 1.5vw, 14px)',
          }}
        >
          For
        </div>

        {/* Recipient name */}
        <div
          style={{
            fontSize: 'clamp(26px, 6vw, 52px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: textColor,
            letterSpacing: '0.04em',
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
            textAlign: 'center',
            lineHeight: 1.2,
            textShadow: holdGlow > 0 ? `0 0 ${holdGlow * 30}px ${accentColor}12` : 'none',
          }}
        >
          {recipientName}
        </div>

        {/* Thin separator */}
        <div
          style={{
            width: 'clamp(20px, 4vw, 35px)',
            height: 1,
            background: flourishColor,
            opacity: nameOpacity * 0.6,
            margin: 'clamp(4px, 1vw, 8px) 0',
          }}
        />

        {/* Dedication text */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.4vw, 20px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: `${textColor}BB`,
            lineHeight: 1.7,
            textAlign: 'center',
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            maxWidth: '90%',
          }}
        >
          {dedicationText}
        </div>

        {/* Closing line */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 17px)',
            fontWeight: 400,
            fontStyle: 'normal',
            color: `${textColor}77`,
            letterSpacing: '0.08em',
            opacity: closingOpacity,
            marginTop: 'clamp(4px, 1vw, 8px)',
            fontVariant: 'small-caps',
          }}
        >
          {closingLine}
        </div>

        {/* Bottom flourish */}
        {renderFlourish(bottomFlourishScale, true)}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-dedication-page',
  title: 'Book Dedication Page',
  description: 'Elegant book dedication with centered "For..." text, recipient name in italic serif, ornamental flourishes above and below',
  tags: ['scene', 'book', 'dedication', 'literary', 'elegant', 'text', 'serif', 'minimal'],
  category: 'scene-layout',
  component: SceneDedicationPageComponent as any,
  defaultConfig: {
    dedicationText: 'who taught me that the best stories are the ones we live',
    recipientName: 'my mother',
    closingLine: 'with love, always',
    bgColor: '#0D0C0A',
    textColor: '#E5DFD3',
    accentColor: '#B8976A',
    flourishColor: '#B8976A55',
  },
  configSchema: [
    { key: 'dedicationText', label: 'Dedication Text', type: 'text', defaultValue: 'who taught me that the best stories are the ones we live', group: 'Content' },
    { key: 'recipientName', label: 'Recipient Name', type: 'text', defaultValue: 'my mother', group: 'Content' },
    { key: 'closingLine', label: 'Closing Line', type: 'text', defaultValue: 'with love, always', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0C0A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E5DFD3', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#B8976A', group: 'Style' },
    { key: 'flourishColor', label: 'Flourish Color', type: 'color', defaultValue: '#B8976A55', group: 'Style' },
  ],
})
