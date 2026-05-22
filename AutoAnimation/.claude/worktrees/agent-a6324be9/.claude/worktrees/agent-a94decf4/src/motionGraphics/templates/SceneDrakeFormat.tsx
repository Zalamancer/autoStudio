import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneDrakeFormatConfig {
  rejectedText: string
  approvedText: string
  bgColor: string
  rejectColor: string
  approveColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function SceneDrakeFormatComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneDrakeFormatConfig>) {
  const { rejectedText, approvedText, bgColor, rejectColor, approveColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Top row slides in first
  const topSlide = enterProgress < 0.5
    ? easeOutQuart(enterProgress / 0.5)
    : 1
  const topX = (1 - topSlide) * -100

  // Bottom row slides in second (staggered)
  const bottomSlide = enterProgress < 0.4
    ? 0
    : easeOutQuart((enterProgress - 0.4) / 0.6)
  const bottomX = (1 - bottomSlide) * 100

  // Exit: both slide out
  const exitSlide = easeOutCubic(exitProgress)
  const topExitX = exitSlide * -100
  const bottomExitX = exitSlide * 100

  // Glow on approved row during hold
  const glowIntensity = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 4) * 0.3 + 0.7 : 0
  const glowShadow = `0 0 ${20 * glowIntensity}px ${approveColor}80, 0 0 ${40 * glowIntensity}px ${approveColor}40`

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '50%',
    padding: '0 5%',
    gap: '4%',
  }

  const emojiStyle: React.CSSProperties = {
    fontSize: 'clamp(32px, 8vw, 80px)',
    flexShrink: 0,
    width: '15%',
    textAlign: 'center',
  }

  const textStyle: React.CSSProperties = {
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    fontSize: 'clamp(18px, 4.5vw, 48px)',
    fontWeight: 700,
    color: textColor,
    flex: 1,
    lineHeight: 1.2,
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor }}>
      {/* Top row: rejected */}
      <div
        style={{
          ...rowStyle,
          background: rejectColor,
          transform: `translateX(${topX + topExitX}%)`,
          borderBottom: '3px solid rgba(0,0,0,0.2)',
        }}
      >
        <div style={emojiStyle}>&#x274C;</div>
        <div style={{ ...textStyle, textDecoration: 'line-through', opacity: 0.85 }}>
          {rejectedText}
        </div>
      </div>

      {/* Bottom row: approved */}
      <div
        style={{
          ...rowStyle,
          background: approveColor,
          transform: `translateX(${bottomX + bottomExitX}%)`,
          boxShadow: holdProgress > 0 ? glowShadow : 'none',
          position: 'relative',
        }}
      >
        <div style={emojiStyle}>&#x2705;</div>
        <div style={{ ...textStyle, opacity: 1 }}>
          {approvedText}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-drake-format',
  title: 'Drake Format',
  description: 'Drake meme format with rejected top row and approved bottom row, sliding entrance and glow effect',
  tags: ['scene', 'meme', 'drake', 'viral', 'comparison', 'reject', 'approve'],
  category: 'scene-layout',
  component: SceneDrakeFormatComponent as any,
  defaultConfig: {
    rejectedText: 'Working hard all weekend',
    approvedText: 'Automating everything with AI',
    bgColor: '#0f0f0f',
    rejectColor: '#2a1015',
    approveColor: '#0a2a15',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'rejectedText', label: 'Rejected Text', type: 'text', defaultValue: 'Working hard all weekend', group: 'Content' },
    { key: 'approvedText', label: 'Approved Text', type: 'text', defaultValue: 'Automating everything with AI', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f0f', group: 'Style' },
    { key: 'rejectColor', label: 'Reject Row Color', type: 'color', defaultValue: '#2a1015', group: 'Style' },
    { key: 'approveColor', label: 'Approve Row Color', type: 'color', defaultValue: '#0a2a15', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
