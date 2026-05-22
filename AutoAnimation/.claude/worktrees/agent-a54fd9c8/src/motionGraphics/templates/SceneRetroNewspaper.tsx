import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RetroNewspaperConfig {
  masthead: string
  headline: string
  subheadline: string
  date: string
  bgColor: string
  paperColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneRetroNewspaperComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<RetroNewspaperConfig>) {
  const { masthead, headline, subheadline, date, bgColor, paperColor, textColor, accentColor } = config
  const progress = frame / durationInFrames
  const time = frame / fps

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Paper unfurls — scale Y from center
  const unfurl = easeOutExpo(Math.min(1, enterProgress / 0.4))
  const paperScaleY = unfurl
  const paperOpacity = easeOutCubic(Math.min(1, enterProgress / 0.2))

  // Masthead appears
  const mastheadProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.25)))

  // Headline stamps in
  const headlineProgress = easeOutExpo(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))
  const headlineScale = 1.3 - headlineProgress * 0.3

  // Subheadline slides in
  const subProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.25)))
  const subY = (1 - subProgress) * 15

  // Column text reveals
  const colProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.2)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.1

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Newspaper page */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(290px, 72vw, 480px)',
          padding: 'clamp(20px, 4vw, 36px)',
          background: paperColor,
          transform: `scaleY(${paperScaleY}) scale(${exitScale})`,
          opacity: paperOpacity * exitOpacity,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3), inset 0 0 15px rgba(140,110,50,0.06)',
        }}
      >
        {/* Age stain overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 20%, rgba(160,130,70,0.05) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(140,110,50,0.04) 0%, transparent 40%)',
            pointerEvents: 'none',
          }}
        />

        {/* Masthead */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 'clamp(28px, 7vw, 52px)',
            fontWeight: 900,
            color: textColor,
            fontStyle: 'italic',
            letterSpacing: 2,
            lineHeight: 1,
            opacity: mastheadProgress,
            borderBottom: `3px double ${textColor}`,
            paddingBottom: 'clamp(6px, 1.2vw, 10px)',
            marginBottom: 'clamp(4px, 0.8vw, 6px)',
          }}
        >
          {masthead}
        </div>

        {/* Date and edition line */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'clamp(8px, 1.3vw, 11px)',
            color: `${textColor}80`,
            borderBottom: `1px solid ${textColor}30`,
            paddingBottom: 'clamp(4px, 0.8vw, 6px)',
            marginBottom: 'clamp(12px, 2.5vw, 20px)',
            opacity: mastheadProgress,
          }}
        >
          <span>{date}</span>
          <span>MORNING EDITION</span>
          <span>PRICE 5 CENTS</span>
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: 'clamp(24px, 6.5vw, 48px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            lineHeight: 1,
            letterSpacing: 1,
            textAlign: 'center',
            transform: `scale(${headlineScale})`,
            opacity: headlineProgress,
            marginBottom: 'clamp(8px, 1.5vw, 14px)',
          }}
        >
          {headline}
        </div>

        {/* Thin rule */}
        <div
          style={{
            height: 1,
            background: textColor,
            marginBottom: 'clamp(8px, 1.5vw, 12px)',
            opacity: subProgress * 0.4,
          }}
        />

        {/* Subheadline */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.2vw, 17px)',
            fontStyle: 'italic',
            color: `${textColor}CC`,
            textAlign: 'center',
            opacity: subProgress,
            transform: `translateY(${subY}px)`,
            marginBottom: 'clamp(14px, 3vw, 22px)',
            lineHeight: 1.4,
          }}
        >
          {subheadline}
        </div>

        {/* Column divider line */}
        <div
          style={{
            height: 1,
            background: `${textColor}40`,
            marginBottom: 'clamp(10px, 2vw, 16px)',
            opacity: colProgress,
          }}
        />

        {/* Fake column text — two columns */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(10px, 2vw, 18px)',
            opacity: colProgress,
          }}
        >
          {[0, 1].map((col) => (
            <div key={col} style={{ flex: 1 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={`line-${col}-${i}`}
                  style={{
                    height: 'clamp(5px, 0.9vw, 7px)',
                    background: `${textColor}${i === 0 ? '20' : '12'}`,
                    marginBottom: 'clamp(3px, 0.6vw, 5px)',
                    borderRadius: 1,
                    width: i === 4 ? '70%' : '100%',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-retro-newspaper',
  title: 'Scene Retro Newspaper',
  description: 'Vintage newspaper front page with masthead, headline stamp-in, date line, subheadline, faux columns, and aged paper stains',
  tags: ['scene', 'retro', 'newspaper', 'vintage', 'headline', 'press', 'print', 'journalism'],
  category: 'scene-layout',
  component: SceneRetroNewspaperComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    masthead: 'The Daily Chronicle',
    headline: 'EXTRA! EXTRA!',
    subheadline: 'Momentous events unfold as the world watches with bated breath',
    date: 'WEDNESDAY, MARCH 19, 1952',
    bgColor: '#1A1408',
    paperColor: '#F0E4CC',
    textColor: '#2C1A0E',
    accentColor: '#8B6914',
  },
  configSchema: [
    { key: 'masthead', label: 'Masthead', type: 'text', defaultValue: 'The Daily Chronicle', group: 'Content' },
    { key: 'headline', label: 'Headline', type: 'text', defaultValue: 'EXTRA! EXTRA!', group: 'Content' },
    { key: 'subheadline', label: 'Subheadline', type: 'text', defaultValue: 'Momentous events unfold as the world watches with bated breath', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'WEDNESDAY, MARCH 19, 1952', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1408', group: 'Style' },
    { key: 'paperColor', label: 'Paper Color', type: 'color', defaultValue: '#F0E4CC', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C1A0E', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B6914', group: 'Style' },
  ],
})
