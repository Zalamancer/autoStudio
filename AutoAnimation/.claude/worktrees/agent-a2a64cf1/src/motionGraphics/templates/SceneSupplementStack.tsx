import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSupplementStackConfig {
  title: string
  supplements: string[]
  bgColor: string
  textColor: string
  accentColor: string
  cardColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/** Parse: "Creatine|5g|Pre-workout|Strength & power" */
function parseSupplement(s: string): { name: string; dosage: string; timing: string; benefit: string } {
  const parts = s.split('|')
  return {
    name: (parts[0] || '').trim(),
    dosage: (parts[1] || '').trim(),
    timing: (parts[2] || '').trim(),
    benefit: (parts[3] || '').trim(),
  }
}

const supplementIcons: Record<string, string> = {
  creatine: '\u26A1',
  protein: '\u{1F4AA}',
  vitamin: '\u2600\uFE0F',
  omega: '\u{1F41F}',
  magnesium: '\u{1FA99}',
  zinc: '\u{1F6E1}\uFE0F',
  default: '\u{1F48A}',
}

function getIcon(name: string): string {
  const lower = name.toLowerCase()
  for (const key of Object.keys(supplementIcons)) {
    if (lower.includes(key)) return supplementIcons[key]
  }
  return supplementIcons.default
}

function SceneSupplementStackComponent({ config, progress }: MotionGraphicProps<SceneSupplementStackConfig>) {
  const { title, supplements, bgColor, textColor, accentColor, cardColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  const parsed = supplements.map(parseSupplement)

  // Title enters
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Staggered item entrance
  const getItemEnter = (index: number): number => {
    const delay = 0.2 + index * 0.15
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - delay) / 0.5)))
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle gradient accent */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: `linear-gradient(180deg, transparent, ${accentColor}08)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(20px, 4.5vw, 36px)',
            fontWeight: 900,
            color: textColor,
            letterSpacing: '-0.01em',
            marginBottom: 'clamp(16px, 3vw, 32px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * -15}px)`,
          }}
        >
          {title}
        </div>

        {/* Supplement list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vw, 14px)' }}>
          {parsed.map((supp, i) => {
            const itemEnter = getItemEnter(i)
            const icon = getIcon(supp.name)

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(10px, 2vw, 18px)',
                  background: cardColor,
                  border: `1px solid ${accentColor}20`,
                  borderRadius: 'clamp(8px, 1.5vw, 14px)',
                  padding: 'clamp(10px, 2vw, 18px) clamp(14px, 2.5vw, 22px)',
                  opacity: itemEnter,
                  transform: `translateX(${(1 - itemEnter) * 40}px)`,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    fontSize: 'clamp(20px, 4vw, 32px)',
                    width: 'clamp(36px, 6vw, 48px)',
                    height: 'clamp(36px, 6vw, 48px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${accentColor}15`,
                    borderRadius: 'clamp(6px, 1vw, 10px)',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(6px, 1vw, 10px)', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 'clamp(14px, 2.5vw, 20px)',
                        fontWeight: 800,
                        color: textColor,
                      }}
                    >
                      {supp.name}
                    </span>
                    <span
                      style={{
                        fontSize: 'clamp(12px, 2vw, 16px)',
                        fontWeight: 700,
                        color: accentColor,
                      }}
                    >
                      {supp.dosage}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'clamp(6px, 1vw, 12px)',
                      marginTop: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'clamp(10px, 1.6vw, 13px)',
                        fontWeight: 600,
                        color: `${textColor}66`,
                      }}
                    >
                      {supp.timing}
                    </span>
                    {supp.benefit && (
                      <>
                        <span style={{ color: `${textColor}33` }}>|</span>
                        <span
                          style={{
                            fontSize: 'clamp(10px, 1.6vw, 13px)',
                            fontWeight: 500,
                            color: `${textColor}55`,
                          }}
                        >
                          {supp.benefit}
                        </span>
                      </>
                    )}
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
  id: 'tpl-scene-supplement-stack',
  title: 'Supplement Stack',
  description: 'Supplement recommendations with name, dosage, timing, and benefit. Items slide in staggered with icons.',
  tags: ['scene', 'fitness', 'supplements', 'health', 'wellness', 'nutrition', 'lifestyle'],
  category: 'scene-layout',
  component: SceneSupplementStackComponent as any,
  defaultConfig: {
    title: 'Daily Supplement Stack',
    supplements: [
      'Creatine|5g|Pre-workout|Strength & power',
      'Protein Whey|30g|Post-workout|Muscle recovery',
      'Vitamin D|5000 IU|Morning|Immunity & bones',
      'Omega-3|2g|With meal|Heart & brain health',
    ],
    bgColor: '#0f1117',
    textColor: '#f1f5f9',
    accentColor: '#34d399',
    cardColor: '#1a1d27',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Daily Supplement Stack', group: 'Content' },
    { key: 'supplements', label: 'Supplements (name|dosage|timing|benefit)', type: 'text-array', defaultValue: ['Creatine|5g|Pre-workout|Strength & power', 'Protein Whey|30g|Post-workout|Muscle recovery', 'Vitamin D|5000 IU|Morning|Immunity & bones', 'Omega-3|2g|With meal|Heart & brain health'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f1117', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f1f5f9', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#34d399', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1a1d27', group: 'Style' },
  ],
})
