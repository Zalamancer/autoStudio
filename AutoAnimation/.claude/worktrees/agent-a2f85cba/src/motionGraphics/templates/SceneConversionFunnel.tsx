import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneConversionFunnelConfig {
  stages: string[]
  colors: string[]
  title: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseStage(s: string): { label: string; value: number; count: string } {
  const parts = s.split(':')
  return { label: (parts[0] || '').trim(), value: parseFloat(parts[1] || '0'), count: (parts[2] || '').trim() }
}

function SceneConversionFunnelComponent({ config, progress }: MotionGraphicProps<SceneConversionFunnelConfig>) {
  const { stages, colors, title, bgColor, textColor } = config
  const parsed = stages.map(parseStage)
  const maxValue = Math.max(...parsed.map(s => s.value)) || 1

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Subtle vertical lines */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(90deg, ${textColor} 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: '6% 8%',
        opacity: exitOpacity,
      }}>
        {/* Title */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(14px, 3vw, 24px)',
          fontWeight: 700,
          color: textColor,
          marginBottom: 'clamp(16px, 4vw, 36px)',
          opacity: easeOutCubic(enterProgress),
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </div>

        {/* Funnel stages */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(4px, 1vw, 8px)',
        }}>
          {parsed.map((stage, i) => {
            const stagger = i * 0.15
            const stageEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger))))
            const widthPercent = 30 + (stage.value / maxValue) * 60
            const color = colors[i % colors.length] || '#3B82F6'

            // Count up animation
            const countedValue = Math.round(stage.value * stageEnter)

            // Hold: gentle pulse per row
            const holdScale = progress >= 0.25 && progress < 0.8
              ? 1 + Math.sin(holdProgress * Math.PI * 3 + i * 0.8) * 0.005
              : 1

            return (
              <div key={i} style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 2vw, 16px)',
                opacity: stageEnter,
                transform: `translateY(${(1 - stageEnter) * 15}px) scaleX(${holdScale})`,
              }}>
                {/* Label */}
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(9px, 1.8vw, 14px)',
                  fontWeight: 600,
                  color: `${textColor}90`,
                  width: 'clamp(60px, 18vw, 100px)',
                  textAlign: 'right',
                  flexShrink: 0,
                }}>
                  {stage.label}
                </div>

                {/* Bar */}
                <div style={{
                  flex: 1,
                  height: 'clamp(28px, 6vw, 48px)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${widthPercent * stageEnter}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                    borderRadius: 'clamp(4px, 1vw, 8px)',
                    boxShadow: `0 2px 12px ${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: 'clamp(6px, 1.5vw, 12px)',
                    overflow: 'hidden',
                  }}>
                    {/* Inner shimmer */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '50%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.1), transparent)',
                      borderRadius: 'clamp(4px, 1vw, 8px) clamp(4px, 1vw, 8px) 0 0',
                    }} />
                  </div>
                  {/* Value label */}
                  <div style={{
                    position: 'absolute',
                    left: `${widthPercent * stageEnter + 2}%`,
                    fontFamily: "'SF Mono', monospace",
                    fontSize: 'clamp(10px, 2vw, 15px)',
                    fontWeight: 700,
                    color,
                  }}>
                    {stage.count ? `${countedValue.toLocaleString()} (${stage.count})` : countedValue.toLocaleString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Conversion rate footer */}
        {parsed.length >= 2 && (
          <div style={{
            marginTop: 'clamp(16px, 4vw, 32px)',
            textAlign: 'center',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)),
          }}>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 2vw, 15px)',
              fontWeight: 500,
              color: `${textColor}50`,
            }}>
              Overall Conversion:
            </span>
            <span style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 'clamp(12px, 2.5vw, 18px)',
              fontWeight: 800,
              color: colors[colors.length - 1] || '#10B981',
              marginLeft: 8,
            }}>
              {parsed.length >= 2
                ? `${((parsed[parsed.length - 1].value / parsed[0].value) * 100 * easeOutCubic(enterProgress)).toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-conversion-funnel',
  title: 'Conversion Funnel',
  description: 'Marketing conversion funnel with animated horizontal bars narrowing from top to bottom. Staggered reveal, counting values, and overall conversion rate.',
  tags: ['scene', 'funnel', 'conversion', 'marketing', 'analytics', 'sales', 'pipeline'],
  category: 'scene-layout',
  component: SceneConversionFunnelComponent as any,
  defaultConfig: {
    stages: ['Visitors:50000', 'Leads:12000', 'Qualified:4800', 'Proposals:1900', 'Closed:680'],
    colors: ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#10B981'],
    title: 'Sales Conversion Funnel',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'stages', label: 'Stages (Label:Value)', type: 'text-array', defaultValue: ['Visitors:50000', 'Leads:12000', 'Qualified:4800', 'Proposals:1900', 'Closed:680'], group: 'Content' },
    { key: 'colors', label: 'Stage Colors', type: 'text-array', defaultValue: ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#10B981'], group: 'Style' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Sales Conversion Funnel', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
