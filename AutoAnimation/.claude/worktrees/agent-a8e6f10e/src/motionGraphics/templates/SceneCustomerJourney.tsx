import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCustomerJourneyConfig {
  stages: string[]
  colors: string[]
  title: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseStage(s: string): { icon: string; label: string; detail: string } {
  const parts = s.split(':')
  return { icon: (parts[0] || '').trim(), label: (parts[1] || '').trim(), detail: (parts[2] || '').trim() }
}

function SceneCustomerJourneyComponent({ config, progress }: MotionGraphicProps<SceneCustomerJourneyConfig>) {
  const { stages, colors, title, bgColor, textColor } = config
  const parsed = stages.map(parseStage)

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Horizontal line draw
  const lineDrawProgress = easeOutCubic(enterProgress)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Subtle bottom gradient */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '20%',
        background: `linear-gradient(0deg, ${textColor}03, transparent)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '5% 6%',
        opacity: exitOpacity,
      }}>
        {/* Title */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(14px, 3vw, 22px)',
          fontWeight: 700,
          color: textColor,
          marginBottom: 'clamp(24px, 6vw, 48px)',
          opacity: easeOutCubic(enterProgress),
          letterSpacing: '-0.01em',
        }}>
          {title}
        </div>

        {/* Journey path */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 560 }}>
          {/* Horizontal connecting line */}
          <div style={{
            position: 'absolute',
            top: 'clamp(20px, 5vw, 36px)',
            left: '8%',
            right: '8%',
            height: 2,
            background: `${textColor}08`,
          }}>
            <div style={{
              height: '100%',
              width: `${lineDrawProgress * 100}%`,
              background: `linear-gradient(90deg, ${colors[0] || '#3B82F6'}, ${colors[colors.length - 1] || '#10B981'})`,
              borderRadius: 1,
            }} />
          </div>

          {/* Stage nodes */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
          }}>
            {parsed.map((stage, i) => {
              const stagger = i * (0.7 / parsed.length)
              const nodeEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger))))
              const color = colors[i % colors.length] || '#3B82F6'

              // Hold: node breathe
              const nodeBreathe = progress >= 0.25 && progress < 0.8
                ? 1 + Math.sin(holdProgress * Math.PI * 3 + i * 1.5) * 0.06
                : 1

              return (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  opacity: nodeEnter,
                  transform: `translateY(${(1 - nodeEnter) * 20}px)`,
                }}>
                  {/* Node circle */}
                  <div style={{
                    width: 'clamp(36px, 9vw, 64px)',
                    height: 'clamp(36px, 9vw, 64px)',
                    borderRadius: '50%',
                    background: `${color}15`,
                    border: `2px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(14px, 3.5vw, 24px)',
                    boxShadow: `0 0 12px ${color}20`,
                    transform: `scale(${nodeEnter * nodeBreathe})`,
                    marginBottom: 'clamp(8px, 2vw, 14px)',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {stage.icon}
                  </div>

                  {/* Arrow between nodes */}
                  {i < parsed.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      top: 'clamp(16px, 4vw, 28px)',
                      left: `${((i + 0.5) / parsed.length) * 100 + 2}%`,
                      fontSize: 'clamp(10px, 2vw, 16px)',
                      color: `${textColor}20`,
                      opacity: nodeEnter,
                    }}>
                      {'\u203A'}
                    </div>
                  )}

                  {/* Label */}
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 'clamp(8px, 1.6vw, 12px)',
                    fontWeight: 700,
                    color,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: 4,
                  }}>
                    {stage.label}
                  </div>

                  {/* Detail */}
                  {stage.detail && (
                    <div style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 'clamp(7px, 1.2vw, 10px)',
                      fontWeight: 400,
                      color: `${textColor}50`,
                      textAlign: 'center',
                      lineHeight: 1.3,
                      maxWidth: 'clamp(60px, 14vw, 100px)',
                    }}>
                      {stage.detail}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom summary */}
        <div style={{
          marginTop: 'clamp(24px, 6vw, 44px)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 1.5vw, 12px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4)),
        }}>
          <div style={{
            height: 2,
            width: 'clamp(20px, 5vw, 40px)',
            background: `linear-gradient(90deg, ${colors[0] || '#3B82F6'}, ${colors[colors.length - 1] || '#10B981'})`,
            borderRadius: 1,
          }} />
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(8px, 1.4vw, 11px)',
            fontWeight: 500,
            color: `${textColor}40`,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            {parsed.length} Touchpoints
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-customer-journey',
  title: 'Customer Journey',
  description: 'Customer journey map with horizontal connecting line draw, icon nodes for each stage, staggered entrance, and breathing animation during hold.',
  tags: ['scene', 'customer', 'journey', 'map', 'marketing', 'funnel', 'touchpoints', 'ux'],
  category: 'scene-layout',
  component: SceneCustomerJourneyComponent as any,
  defaultConfig: {
    stages: ['\u{1F50D}:Awareness:Social ads & SEO', '\u{1F914}:Consider:Compare options', '\u{1F6D2}:Purchase:Buy product', '\u{2B50}:Retain:Loyalty program', '\u{1F4E3}:Advocate:Refer friends'],
    colors: ['#6366F1', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'],
    title: 'Customer Journey Map',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'stages', label: 'Stages (Icon:Label:Detail)', type: 'text-array', defaultValue: ['\u{1F50D}:Awareness:Social ads & SEO', '\u{1F914}:Consider:Compare options', '\u{1F6D2}:Purchase:Buy product', '\u{2B50}:Retain:Loyalty program', '\u{1F4E3}:Advocate:Refer friends'], group: 'Content' },
    { key: 'colors', label: 'Stage Colors', type: 'text-array', defaultValue: ['#6366F1', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'], group: 'Style' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Customer Journey Map', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
