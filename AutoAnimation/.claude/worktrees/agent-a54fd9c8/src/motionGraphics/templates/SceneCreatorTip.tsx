import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CreatorTipConfig {
  tipNumber: number
  tipTitle: string
  tipBody: string
  category: string
  bgColor: string
  accentColor: string
  cardColor: string
  textColor: string
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

function SceneCreatorTipComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<CreatorTipConfig>) {
  const { tipNumber, tipTitle, tipBody, category, bgColor, accentColor, cardColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Category badge pops
  const badgePop = easeOutBack(Math.min(1, enterProgress / 0.25))

  // Tip number counter
  const numberScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Title reveals
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))

  // Body text reveals
  const bodyReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // Bookmark icon
  const bookmarkReveal = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.2)))

  // Hold: lightbulb glow pulse
  const glowPulse = 0.5 + Math.sin(holdProgress * Math.PI * 4) * 0.5

  // Hold: subtle card breathe
  const breathe = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.008

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.12

  // Progress indicator bar
  const tipProgressWidth = holdProgress > 0 ? holdProgress * 100 : enterProgress * 100 * 0.3

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      {/* Background glow from lightbulb */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          width: '40%',
          height: '30%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}${Math.round(glowPulse * 15).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          transform: 'translateX(-50%)',
          opacity: exitOpacity,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(14px, 2.5vh, 22px)',
          width: '100%',
          maxWidth: 420,
          transform: `scale(${exitScale * breathe})`,
          opacity: exitOpacity,
        }}
      >
        {/* Category badge */}
        <div
          style={{
            background: `${accentColor}15`,
            borderRadius: 20,
            padding: 'clamp(4px, 0.8vh, 8px) clamp(12px, 2vw, 18px)',
            fontSize: 'clamp(9px, 1.4vw, 11px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: 2,
            textTransform: 'uppercase',
            transform: `scale(${badgePop})`,
          }}
        >
          {category}
        </div>

        {/* Tip card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 2.5vw, 22px)',
            padding: 'clamp(20px, 4vh, 36px)',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(12px, 2vh, 20px)',
            border: `1px solid ${accentColor}15`,
            boxShadow: `0 16px 48px rgba(0,0,0,0.15)`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Progress bar at top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${tipProgressWidth}%`,
                background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
                borderRadius: '0 2px 2px 0',
              }}
            />
          </div>

          {/* Tip number + lightbulb */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(10px, 1.8vw, 16px)',
              transform: `scale(${numberScale})`,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(28px, 6vw, 44px)',
                filter: `drop-shadow(0 0 ${8 + glowPulse * 8}px ${accentColor}60)`,
              }}
            >
              {'💡'}
            </div>
            <div>
              <div
                style={{
                  fontSize: 'clamp(10px, 1.5vw, 12px)',
                  fontWeight: 600,
                  color: `${textColor}50`,
                  letterSpacing: 1,
                }}
              >
                CREATOR TIP
              </div>
              <div
                style={{
                  fontSize: 'clamp(28px, 6vw, 44px)',
                  fontWeight: 900,
                  color: accentColor,
                  lineHeight: 1,
                }}
              >
                #{tipNumber}
              </div>
            </div>
          </div>

          {/* Tip title */}
          <div
            style={{
              fontSize: 'clamp(18px, 3.5vw, 26px)',
              fontWeight: 800,
              color: textColor,
              lineHeight: 1.3,
              opacity: titleReveal,
              transform: `translateY(${(1 - titleReveal) * 12}px)`,
            }}
          >
            {tipTitle}
          </div>

          {/* Tip body */}
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 15px)',
              fontWeight: 500,
              color: `${textColor}80`,
              lineHeight: 1.6,
              opacity: bodyReveal,
              transform: `translateY(${(1 - bodyReveal) * 10}px)`,
            }}
          >
            {tipBody}
          </div>

          {/* Bottom row: bookmark + share */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: bookmarkReveal,
              transform: `translateY(${(1 - bookmarkReveal) * 10}px)`,
              paddingTop: 4,
              borderTop: `1px solid ${textColor}08`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 'clamp(10px, 1.5vw, 13px)',
                fontWeight: 600,
                color: accentColor,
              }}
            >
              {'🔖'} Save this tip
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 'clamp(10px, 1.5vw, 13px)',
                fontWeight: 600,
                color: `${textColor}50`,
              }}
            >
              {'↗'} Share
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-creator-tip',
  title: 'Scene Creator Tip',
  description:
    'Creator tip/tutorial card with lightbulb glow, tip number, progress bar, and save/share actions. Perfect for educational content series.',
  tags: ['scene', 'social-media', 'tip', 'tutorial', 'creator', 'education', 'advice', 'series'],
  category: 'scene-layout',
  component: SceneCreatorTipComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'tipNumber', label: 'Tip Number', type: 'number', defaultValue: 1, min: 1, max: 999, group: 'Content' },
    { key: 'tipTitle', label: 'Tip Title', type: 'text', defaultValue: 'Post at Peak Hours', group: 'Content' },
    { key: 'tipBody', label: 'Tip Body', type: 'text', defaultValue: 'Schedule your posts between 6-9 PM when your audience is most active for maximum engagement.', group: 'Content' },
    { key: 'category', label: 'Category', type: 'text', defaultValue: 'Growth Strategy', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F59E0B', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    tipNumber: 1,
    tipTitle: 'Post at Peak Hours',
    tipBody: 'Schedule your posts between 6-9 PM when your audience is most active for maximum engagement.',
    category: 'Growth Strategy',
    accentColor: '#F59E0B',
    cardColor: '#1A1A2E',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
