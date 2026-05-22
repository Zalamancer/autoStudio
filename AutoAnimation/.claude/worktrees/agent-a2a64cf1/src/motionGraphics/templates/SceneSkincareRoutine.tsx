import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SkincareRoutineConfig {
  routineTitle: string
  steps: string[]
  products: string[]
  bgColor: string
  textColor: string
  accentColor: string
  iconColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

const STEP_ICONS = ['💧', '🧴', '✨', '🧊', '☀️']

function SceneSkincareRoutineComponent({ config, progress }: MotionGraphicProps<SkincareRoutineConfig>) {
  const { routineTitle, steps, products, bgColor, textColor, accentColor, iconColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Title enters
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.25))

  // Subtitle line
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.2)))

  // Steps stagger
  const getStepProgress = (idx: number): number => {
    const stepStart = 0.3 + idx * 0.12
    return elasticOut(Math.max(0, Math.min(1, (enterProgress - stepStart) / 0.25)))
  }

  // Connecting line between steps
  const connectProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.4)))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Dewy gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${bgColor}, ${accentColor}10 40%, ${bgColor} 80%)`,
        }}
      />

      {/* Soft bubble decorations */}
      {[0.12, 0.85, 0.08, 0.75].map((x, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x * 100}%`,
            top: `${(i * 23 + 10) % 80}%`,
            width: 'clamp(30px, 6vw, 60px)',
            height: 'clamp(30px, 6vw, 60px)',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${accentColor}15, transparent)`,
            border: `1px solid ${accentColor}10`,
            opacity: titleEnter,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '5% 8%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * -40}px)`,
        }}
      >
        {/* Routine title */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 13px)',
            fontWeight: 500,
            color: accentColor,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            marginBottom: 'clamp(4px, 1vh, 8px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * -15}px)`,
          }}
        >
          MY ROUTINE
        </div>

        <div
          style={{
            fontSize: 'clamp(24px, 6vw, 44px)',
            fontWeight: 700,
            color: textColor,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 'clamp(4px, 1vh, 10px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 20}px)`,
            textAlign: 'center',
          }}
        >
          {routineTitle}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 'clamp(40px, 10vw, 70px)',
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            marginBottom: 'clamp(16px, 3vh, 30px)',
            transform: `scaleX(${lineEnter})`,
          }}
        />

        {/* Steps container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(6px, 1.5vh, 14px)',
            width: '100%',
            maxWidth: 380,
            position: 'relative',
          }}
        >
          {/* Connecting vertical line */}
          <div
            style={{
              position: 'absolute',
              left: 'clamp(16px, 3vw, 24px)',
              top: 'clamp(20px, 4vh, 32px)',
              bottom: 'clamp(20px, 4vh, 32px)',
              width: 1,
              background: `${accentColor}30`,
              transformOrigin: 'top',
              transform: `scaleY(${connectProgress})`,
            }}
          />

          {steps.slice(0, 5).map((step, i) => {
            const stepProg = getStepProgress(i)
            const product = products[i] || ''
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(10px, 2vw, 18px)',
                  transform: `translateX(${(1 - stepProg) * 40}px)`,
                  opacity: stepProg,
                }}
              >
                {/* Step number circle */}
                <div
                  style={{
                    width: 'clamp(32px, 6vw, 48px)',
                    height: 'clamp(32px, 6vw, 48px)',
                    borderRadius: '50%',
                    background: `${accentColor}20`,
                    border: `1.5px solid ${accentColor}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(14px, 2.5vw, 20px)',
                    flexShrink: 0,
                    transform: `scale(${stepProg})`,
                  }}
                >
                  {STEP_ICONS[i] || `${i + 1}`}
                </div>

                {/* Step content */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 'clamp(13px, 2.8vw, 20px)',
                      fontWeight: 600,
                      color: textColor,
                      lineHeight: 1.3,
                    }}
                  >
                    {step}
                  </div>
                  {product && (
                    <div
                      style={{
                        fontSize: 'clamp(10px, 1.8vw, 14px)',
                        fontWeight: 400,
                        color: `${textColor}80`,
                        marginTop: 2,
                      }}
                    >
                      {product}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-skincare-routine',
  title: 'Skincare Routine',
  description: 'Skincare routine steps with staggered icon reveals, connecting line, and dewy fresh aesthetic',
  tags: ['scene', 'skincare', 'beauty', 'routine', 'steps', 'self-care', 'fashion'],
  category: 'scene-layout',
  component: SceneSkincareRoutineComponent as any,
  defaultConfig: {
    routineTitle: 'Morning Glow',
    steps: ['Cleanse', 'Tone', 'Serum', 'Moisturize', 'SPF'],
    products: ['CeraVe Foaming', 'Paula\'s Choice BHA', 'The Ordinary Niacinamide', 'Tatcha Dewy Cream', 'Supergoop Unseen'],
    bgColor: '#0f1a17',
    textColor: '#f0faf5',
    accentColor: '#7dd3b8',
    iconColor: '#7dd3b8',
  },
  configSchema: [
    { key: 'routineTitle', label: 'Routine Title', type: 'text', defaultValue: 'Morning Glow', group: 'Content' },
    { key: 'steps', label: 'Steps', type: 'text-array', defaultValue: ['Cleanse', 'Tone', 'Serum', 'Moisturize', 'SPF'], group: 'Content' },
    { key: 'products', label: 'Products', type: 'text-array', defaultValue: ['CeraVe Foaming', "Paula's Choice BHA", 'The Ordinary Niacinamide', 'Tatcha Dewy Cream', 'Supergoop Unseen'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f1a17', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f0faf5', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#7dd3b8', group: 'Style' },
  ],
})
