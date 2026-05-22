import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSupplementPlanConfig {
  title: string
  supplements: string[]
  timings: string[]
  dosages: string[]
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneSupplementPlanComponent({ config, progress }: MotionGraphicProps<SceneSupplementPlanConfig>) {
  const { title, supplements, timings, dosages, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.1 : 1

  const headerEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))

  const timingIcons: Record<string, string> = {
    'Morning': '\u2600\uFE0F',
    'Pre-Workout': '\u26A1',
    'Post-Workout': '\u{1F4AA}',
    'Evening': '\u{1F319}',
    'With Meals': '\u{1F37D}\uFE0F',
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle capsule pattern */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: 'clamp(40px, 8vw, 70px)',
          height: 'clamp(18px, 3.5vw, 30px)',
          borderRadius: '100px',
          background: `${accentColor}08`,
          transform: 'rotate(30deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '8%',
          width: 'clamp(30px, 6vw, 50px)',
          height: 'clamp(14px, 2.8vw, 22px)',
          borderRadius: '100px',
          background: `${accentColor}06`,
          transform: 'rotate(-20deg)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '6%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: 'clamp(12px, 2.5vw, 24px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * -20}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(20px, 5vw, 40px)',
              fontWeight: 900,
              color: textColor,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
          <div
            style={{
              width: `${headerEnter * 60}%`,
              height: '3px',
              background: `linear-gradient(90deg, ${accentColor}, transparent)`,
              borderRadius: '2px',
              marginTop: 'clamp(6px, 1vw, 10px)',
            }}
          />
        </div>

        {/* Supplement list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(6px, 1.3vw, 14px)' }}>
          {supplements.map((supplement, i) => {
            const itemDelay = 0.25 + i * 0.1
            const itemEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - itemDelay) / 0.4)))
            const isActive = progress >= 0.2 && progress < 0.8 && Math.floor(holdProgress * supplements.length) === i
            const timing = timings[i] || 'Morning'
            const icon = timingIcons[timing] || '\u{1F48A}'

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 16px)',
                  padding: 'clamp(10px, 2vw, 18px)',
                  background: isActive ? `${accentColor}10` : `${textColor}05`,
                  border: `1px solid ${isActive ? `${accentColor}35` : `${textColor}08`}`,
                  borderRadius: 'clamp(8px, 1.5vw, 14px)',
                  opacity: itemEnter,
                  transform: `translateY(${(1 - itemEnter) * 20}px)`,
                }}
              >
                {/* Timing icon */}
                <div
                  style={{
                    width: 'clamp(32px, 6vw, 48px)',
                    height: 'clamp(32px, 6vw, 48px)',
                    borderRadius: 'clamp(8px, 1.5vw, 12px)',
                    background: `${accentColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(14px, 2.5vw, 22px)',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'clamp(12px, 2.2vw, 18px)', fontWeight: 700, color: textColor, marginBottom: '2px' }}>
                    {supplement}
                  </div>
                  <div style={{ fontSize: 'clamp(9px, 1.5vw, 13px)', fontWeight: 600, color: `${textColor}55` }}>
                    {timing}
                  </div>
                </div>

                {/* Dosage */}
                <div
                  style={{
                    fontSize: 'clamp(11px, 1.8vw, 15px)',
                    fontWeight: 800,
                    color: accentColor,
                    background: `${accentColor}10`,
                    padding: 'clamp(3px, 0.5vw, 5px) clamp(8px, 1.5vw, 14px)',
                    borderRadius: '100px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {dosages[i] || '--'}
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
  id: 'tpl-scene-supplement-plan',
  title: 'Supplement Plan',
  description: 'Supplement schedule display with timing icons, dosages, and staggered entry animations. Items highlight sequentially during hold.',
  tags: ['scene', 'supplement', 'nutrition', 'fitness', 'gym', 'health', 'plan', 'stack'],
  category: 'scene-layout',
  component: SceneSupplementPlanComponent as any,
  defaultConfig: {
    title: 'Daily Stack',
    supplements: ['Creatine Monohydrate', 'Whey Protein', 'Pre-Workout', 'Fish Oil', 'Vitamin D3'],
    timings: ['Morning', 'Post-Workout', 'Pre-Workout', 'With Meals', 'Morning'],
    dosages: ['5g', '30g', '1 scoop', '2 caps', '5000 IU'],
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#FF5533',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Daily Stack', group: 'Content' },
    { key: 'supplements', label: 'Supplements', type: 'text-array', defaultValue: ['Creatine Monohydrate', 'Whey Protein', 'Pre-Workout', 'Fish Oil', 'Vitamin D3'], group: 'Content' },
    { key: 'timings', label: 'Timings', type: 'text-array', defaultValue: ['Morning', 'Post-Workout', 'Pre-Workout', 'With Meals', 'Morning'], group: 'Content' },
    { key: 'dosages', label: 'Dosages', type: 'text-array', defaultValue: ['5g', '30g', '1 scoop', '2 caps', '5000 IU'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF5533', group: 'Style' },
  ],
})
