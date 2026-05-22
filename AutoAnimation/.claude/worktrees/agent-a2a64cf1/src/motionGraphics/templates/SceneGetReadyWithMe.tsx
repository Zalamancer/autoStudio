import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GRWMConfig {
  title: string
  occasion: string
  date: string
  bgColor: string
  textColor: string
  accentColor: string
  frameColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneGetReadyWithMeComponent({ config, progress, frame, fps }: MotionGraphicProps<GRWMConfig>) {
  const { title, occasion, date, bgColor, textColor, accentColor, frameColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Frame border draws in
  const frameDraw = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // Title wipe reveal
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))

  // Subtitle elements
  const occasionEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.25)))
  const dateEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.25)))

  // Decorative sparkle
  const sparkleEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.2)))

  // Hold: gentle float
  const holdPhase = progress >= 0.25 && progress < 0.8
  const holdTime = holdPhase ? (progress - 0.25) / 0.55 : 0
  const floatY = Math.sin(holdTime * Math.PI * 3) * 3

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Soft gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${accentColor}15, transparent 70%)`,
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
          padding: '8%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * -40 + floatY}px)`,
        }}
      >
        {/* Aesthetic frame border */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            right: '10%',
            bottom: '10%',
            border: `1px solid ${frameColor}`,
            opacity: frameDraw,
            transform: `scale(${0.95 + frameDraw * 0.05})`,
          }}
        >
          {/* Corner accents */}
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
                width: 'clamp(16px, 3vw, 28px)',
                height: 'clamp(16px, 3vw, 28px)',
                borderTop: (pos.top !== undefined) ? `2px solid ${accentColor}` : undefined,
                borderBottom: (pos.bottom !== undefined) ? `2px solid ${accentColor}` : undefined,
                borderLeft: (pos.left !== undefined) ? `2px solid ${accentColor}` : undefined,
                borderRight: (pos.right !== undefined) ? `2px solid ${accentColor}` : undefined,
                opacity: frameDraw,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Sparkle decoration */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            right: '15%',
            fontSize: 'clamp(16px, 3vw, 28px)',
            transform: `scale(${sparkleEnter}) rotate(${sparkleEnter * 20}deg)`,
            opacity: sparkleEnter,
          }}
        >
          ✧
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            left: '16%',
            fontSize: 'clamp(12px, 2vw, 20px)',
            transform: `scale(${sparkleEnter})`,
            opacity: sparkleEnter * 0.7,
            color: accentColor,
          }}
        >
          ✦
        </div>

        {/* GRWM title with wipe reveal */}
        <div style={{ overflow: 'hidden', marginBottom: 'clamp(8px, 2vh, 20px)' }}>
          <div
            style={{
              fontSize: 'clamp(32px, 10vw, 80px)',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: textColor,
              transform: `translateY(${(1 - titleReveal) * 100}%)`,
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 'clamp(40px, 10vw, 80px)',
            height: 2,
            background: accentColor,
            marginBottom: 'clamp(12px, 2vh, 24px)',
            transform: `scaleX(${titleReveal})`,
          }}
        />

        {/* Occasion */}
        <div
          style={{
            fontSize: 'clamp(14px, 3vw, 24px)',
            fontWeight: 400,
            color: `${textColor}cc`,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: occasionEnter,
            transform: `translateY(${(1 - occasionEnter) * 15}px)`,
            marginBottom: 'clamp(4px, 1vh, 12px)',
          }}
        >
          {occasion}
        </div>

        {/* Date */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 16px)',
            fontWeight: 300,
            color: accentColor,
            letterSpacing: '0.2em',
            opacity: dateEnter,
            transform: `translateY(${(1 - dateEnter) * 10}px)`,
          }}
        >
          {date}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-grwm',
  title: 'Get Ready With Me',
  description: 'GRWM title card with aesthetic frame, text wipe reveal, and soft pink/gold beauty influencer style',
  tags: ['scene', 'grwm', 'beauty', 'fashion', 'influencer', 'aesthetic'],
  category: 'scene-layout',
  component: SceneGetReadyWithMeComponent as any,
  defaultConfig: {
    title: 'GET READY WITH ME',
    occasion: 'Date Night',
    date: 'March 2026',
    bgColor: '#1a1215',
    textColor: '#faf0f0',
    accentColor: '#d4a574',
    frameColor: '#d4a57440',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'GET READY WITH ME', group: 'Content' },
    { key: 'occasion', label: 'Occasion', type: 'text', defaultValue: 'Date Night', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'March 2026', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1215', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#faf0f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#d4a574', group: 'Style' },
    { key: 'frameColor', label: 'Frame Color', type: 'color', defaultValue: '#d4a57440', group: 'Style' },
  ],
})
