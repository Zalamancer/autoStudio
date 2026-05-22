import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCampaignTimelineConfig {
  milestones: string[]
  colors: string[]
  title: string
  bgColor: string
  textColor: string
  lineColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseMilestone(s: string): { date: string; label: string; detail: string } {
  const parts = s.split(':')
  return { date: (parts[0] || '').trim(), label: (parts[1] || '').trim(), detail: (parts[2] || '').trim() }
}

function SceneCampaignTimelineComponent({ config, progress }: MotionGraphicProps<SceneCampaignTimelineConfig>) {
  const { milestones, colors, title, bgColor, textColor, lineColor } = config
  const parsed = milestones.map(parseMilestone)

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Line draw progress
  const lineDrawProgress = easeOutCubic(enterProgress)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: '5% 8%',
        opacity: exitOpacity,
      }}>
        {/* Title */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(14px, 3vw, 22px)',
          fontWeight: 700,
          color: textColor,
          marginBottom: 'clamp(20px, 5vw, 40px)',
          opacity: easeOutCubic(enterProgress),
          letterSpacing: '-0.01em',
        }}>
          {title}
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative', paddingLeft: 'clamp(24px, 6vw, 44px)' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute',
            left: 'clamp(8px, 2vw, 14px)',
            top: 0,
            bottom: 0,
            width: 2,
            background: `${lineColor}15`,
          }}>
            {/* Animated fill */}
            <div style={{
              width: '100%',
              height: `${lineDrawProgress * 100}%`,
              background: `linear-gradient(180deg, ${lineColor}, ${lineColor}60)`,
              borderRadius: 1,
            }} />
          </div>

          {/* Milestones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 4vw, 30px)' }}>
            {parsed.map((ms, i) => {
              const stagger = i * 0.12
              const msEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger))))
              const color = colors[i % colors.length] || lineColor

              // Hold: dot pulse
              const dotPulse = progress >= 0.25 && progress < 0.8
                ? 1 + Math.sin(holdProgress * Math.PI * 3 + i * 1.2) * 0.15
                : 1

              return (
                <div key={i} style={{
                  position: 'relative',
                  opacity: msEnter,
                  transform: `translateX(${(1 - msEnter) * 20}px)`,
                }}>
                  {/* Dot on timeline */}
                  <div style={{
                    position: 'absolute',
                    left: `calc(-1 * clamp(16px, 4vw, 30px))`,
                    top: 'clamp(2px, 0.5vw, 6px)',
                    width: 'clamp(10px, 2.5vw, 16px)',
                    height: 'clamp(10px, 2.5vw, 16px)',
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 8px ${color}40`,
                    transform: `scale(${msEnter * dotPulse})`,
                    border: `2px solid ${bgColor}`,
                  }} />

                  {/* Content card */}
                  <div style={{
                    background: `${textColor}04`,
                    borderRadius: 'clamp(6px, 1vw, 10px)',
                    padding: 'clamp(10px, 2.5vw, 18px)',
                    borderLeft: `3px solid ${color}`,
                  }}>
                    {/* Date */}
                    <div style={{
                      fontFamily: "'SF Mono', monospace",
                      fontSize: 'clamp(8px, 1.4vw, 11px)',
                      fontWeight: 600,
                      color,
                      marginBottom: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      {ms.date}
                    </div>
                    {/* Label */}
                    <div style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 'clamp(11px, 2.2vw, 16px)',
                      fontWeight: 700,
                      color: textColor,
                      marginBottom: ms.detail ? 4 : 0,
                    }}>
                      {ms.label}
                    </div>
                    {/* Detail */}
                    {ms.detail && (
                      <div style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 'clamp(8px, 1.4vw, 11px)',
                        fontWeight: 400,
                        color: `${textColor}60`,
                        lineHeight: 1.4,
                      }}>
                        {ms.detail}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-campaign-timeline',
  title: 'Campaign Timeline',
  description: 'Marketing campaign timeline with vertical line draw animation, staggered milestone cards, pulsing dots, and date-labeled content cards.',
  tags: ['scene', 'campaign', 'timeline', 'marketing', 'milestones', 'roadmap', 'schedule', 'planning'],
  category: 'scene-layout',
  component: SceneCampaignTimelineComponent as any,
  defaultConfig: {
    milestones: ['Jan 15:Kickoff:Campaign strategy finalized', 'Feb 1:Content Launch:Blog posts and social assets go live', 'Mar 1:Paid Ads:Google and Meta campaigns start', 'Mar 15:Email Blast:Nurture sequence to 50K subscribers', 'Apr 1:Results:Analyze ROI and optimize'],
    colors: ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981'],
    title: 'Q1 Campaign Timeline',
    lineColor: '#3B82F6',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'milestones', label: 'Milestones (Date:Label:Detail)', type: 'text-array', defaultValue: ['Jan 15:Kickoff:Campaign strategy finalized', 'Feb 1:Content Launch:Blog posts and social assets go live', 'Mar 1:Paid Ads:Google and Meta campaigns start', 'Mar 15:Email Blast:Nurture sequence to 50K subscribers', 'Apr 1:Results:Analyze ROI and optimize'], group: 'Content' },
    { key: 'colors', label: 'Milestone Colors', type: 'text-array', defaultValue: ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981'], group: 'Style' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Q1 Campaign Timeline', group: 'Content' },
    { key: 'lineColor', label: 'Line Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
