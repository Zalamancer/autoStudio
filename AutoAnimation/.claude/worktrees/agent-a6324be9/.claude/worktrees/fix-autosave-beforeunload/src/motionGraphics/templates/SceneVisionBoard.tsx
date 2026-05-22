import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneVisionBoardConfig {
  goals: string[]
  title: string
  bgColor: string
  cardColor: string
  textColor: string
  accentColor: string
  checkColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/** Simple deterministic icon for each goal based on index */
function goalIcon(index: number): string {
  const icons = ['\u2605', '\u2665', '\u2691', '\u2600', '\u266A', '\u2618', '\u2764', '\u2606'] // star, heart, flag, sun, note, shamrock, heart, star outline
  return icons[index % icons.length]
}

function SceneVisionBoardComponent({ config, progress }: MotionGraphicProps<SceneVisionBoardConfig>) {
  const { goals, title, bgColor, cardColor, textColor, accentColor, checkColor } = config

  // Phase calculations
  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const itemCount = Math.min(goals.length, 6)

  // Title entry
  const titleEnter = Math.min(1, enterProgress * 2.5)
  const titleOpacity = easeOutCubic(titleEnter)
  const titleY = (1 - easeOutCubic(titleEnter)) * -20

  // Exit
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const exitScale = exitProgress > 0 ? 1 - easeInCubic(exitProgress) * 0.1 : 1

  // Grid layout — 2 columns
  const cols = itemCount <= 2 ? 1 : 2

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${accentColor}08 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          opacity: exitOpacity,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '6% 8%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(16px, 4vw, 36px)',
            fontWeight: 800,
            color: accentColor,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            marginBottom: '1.2em',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {title}
        </div>

        {/* Goals grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 'clamp(10px, 2.5vw, 20px)',
            width: '100%',
            maxWidth: '700px',
          }}
        >
          {goals.slice(0, itemCount).map((goal, i) => {
            // Staggered pop-in
            const stagger = i * 0.12
            const itemEnter = enterProgress < (0.3 + stagger)
              ? Math.max(0, (enterProgress - 0.2 - stagger) / 0.4)
              : 1
            const itemEased = easeOutBack(Math.min(1, itemEnter))
            const itemScale = itemEased
            const itemOpacity = easeOutCubic(Math.min(1, itemEnter * 1.5))

            // Checkbox checks itself during hold with stagger
            const checkDelay = i * 0.15
            const checkProgress = holdProgress < checkDelay
              ? 0
              : Math.min(1, (holdProgress - checkDelay) / 0.25)
            const checkEased = easeOutCubic(checkProgress)

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 2vw, 16px)',
                  background: cardColor,
                  borderRadius: 'clamp(6px, 1.5vw, 12px)',
                  padding: 'clamp(10px, 2.5vw, 20px)',
                  opacity: itemOpacity,
                  transform: `scale(${itemScale})`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: 'clamp(20px, 4vw, 32px)',
                    height: 'clamp(20px, 4vw, 32px)',
                    borderRadius: 'clamp(4px, 1vw, 6px)',
                    border: `2px solid ${accentColor}`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 0,
                    background: checkProgress > 0 ? `${accentColor}${Math.round(checkEased * 30).toString(16).padStart(2, '0')}` : 'transparent',
                  }}
                >
                  {/* Checkmark */}
                  {checkProgress > 0 && (
                    <svg
                      width="60%"
                      height="60%"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ opacity: checkEased }}
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke={checkColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="24"
                        strokeDashoffset={24 * (1 - checkEased)}
                      />
                    </svg>
                  )}
                </div>

                {/* Icon + Goal text */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 'clamp(14px, 3vw, 22px)',
                      flexShrink: 0,
                    }}
                  >
                    {goalIcon(i)}
                  </span>
                  <div
                    style={{
                      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                      fontSize: 'clamp(11px, 2.5vw, 20px)',
                      fontWeight: 500,
                      color: textColor,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {goal}
                  </div>
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
  id: 'tpl-scene-vision-board',
  title: 'Scene Vision Board',
  description: 'Vision board layout with goal items in a grid, staggered pop-in, icons, and self-checking checkboxes.',
  tags: ['scene', 'vision', 'board', 'goals', 'checklist', 'motivational', 'inspirational'],
  category: 'scene-layout',
  component: SceneVisionBoardComponent as any,
  defaultConfig: {
    goals: ['Read 30 books', 'Launch my startup', 'Run a marathon', 'Learn a new language'],
    title: 'My 2026 Vision',
    bgColor: '#0F172A',
    cardColor: '#1E293B',
    textColor: '#E2E8F0',
    accentColor: '#A78BFA',
    checkColor: '#22C55E',
  },
  configSchema: [
    { key: 'goals', label: 'Goals', type: 'text-array', defaultValue: ['Read 30 books', 'Launch my startup', 'Run a marathon', 'Learn a new language'], group: 'Content' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'My 2026 Vision', group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#A78BFA', group: 'Style' },
    { key: 'checkColor', label: 'Check Color', type: 'color', defaultValue: '#22C55E', group: 'Style' },
  ],
})
