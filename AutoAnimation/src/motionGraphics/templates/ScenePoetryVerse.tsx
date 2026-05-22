import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePoetryVerseConfig {
  line1: string
  line2: string
  line3: string
  line4: string
  poetName: string
  verseNumber: string
  bgColor: string
  textColor: string
  accentColor: string
  numberColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

function ScenePoetryVerseComponent({ config, progress }: MotionGraphicProps<ScenePoetryVerseConfig>) {
  const { line1, line2, line3, line4, poetName, verseNumber, bgColor, textColor, accentColor, numberColor } = config

  // Phases: enter 0-0.35, hold 0.35-0.8, exit 0.8-1
  const enterProgress = progress < 0.35 ? progress / 0.35 : 1
  const holdProgress = progress >= 0.35 && progress < 0.8 ? (progress - 0.35) / 0.45 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const lines = [line1, line2, line3, line4]

  // Verse number fades in first
  const verseNumOpacity = easeOutCubic(Math.min(1, enterProgress / 0.2))

  // Each line reveals staggered - line by line
  const lineReveal = (index: number) => {
    const start = 0.1 + index * 0.18
    const end = start + 0.22
    return easeOutQuart(Math.max(0, Math.min(1, (enterProgress - start) / (end - start))))
  }

  // Poet name appears last
  const poetOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.15)))
  const poetY = (1 - poetOpacity) * 10

  // Hold: subtle breathing effect on left accent bar
  const breathe = holdProgress > 0 ? 0.6 + 0.3 * Math.sin(holdProgress * Math.PI * 2.5) : 0.6

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * -20

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Garamond', 'Times New Roman', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Ambient gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 30% 50%, ${accentColor}06 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 'clamp(16px, 4vw, 36px)',
          maxWidth: '80%',
          opacity: exitOpacity,
          transform: `translateY(${exitY}px)`,
        }}
      >
        {/* Left side: verse number + accent bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(6px, 1.2vw, 10px)',
            minWidth: 'clamp(24px, 4vw, 40px)',
          }}
        >
          {/* Verse number */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 400,
              color: numberColor,
              letterSpacing: '0.15em',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              textTransform: 'uppercase',
              opacity: verseNumOpacity,
              whiteSpace: 'nowrap',
            }}
          >
            {verseNumber}
          </div>

          {/* Vertical accent bar */}
          <div
            style={{
              width: 2,
              flex: 1,
              background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}22 100%)`,
              opacity: breathe * verseNumOpacity,
              borderRadius: 1,
            }}
          />
        </div>

        {/* Right side: lines + poet */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(8px, 2vw, 18px)',
          }}
        >
          {/* Poetry lines */}
          {lines.map((line, i) => {
            const reveal = lineReveal(i)
            return (
              <div
                key={i}
                style={{
                  fontSize: 'clamp(15px, 3.4vw, 28px)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: textColor,
                  lineHeight: 1.5,
                  opacity: reveal,
                  transform: `translateX(${(1 - reveal) * 20}px)`,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {line}
              </div>
            )
          })}

          {/* Stanza break indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1.2vw, 10px)',
              margin: 'clamp(4px, 1vw, 10px) 0',
              opacity: poetOpacity * 0.4,
            }}
          >
            <div style={{ width: 'clamp(8px, 1.5vw, 14px)', height: 1, background: accentColor }} />
            <div style={{ width: 'clamp(4px, 0.8vw, 6px)', height: 'clamp(4px, 0.8vw, 6px)', borderRadius: '50%', background: `${accentColor}44` }} />
            <div style={{ width: 'clamp(8px, 1.5vw, 14px)', height: 1, background: accentColor }} />
          </div>

          {/* Poet attribution */}
          <div
            style={{
              fontSize: 'clamp(11px, 2vw, 17px)',
              fontWeight: 400,
              fontStyle: 'normal',
              color: `${textColor}88`,
              letterSpacing: '0.06em',
              fontVariant: 'small-caps',
              opacity: poetOpacity,
              transform: `translateY(${poetY}px)`,
            }}
          >
            {'\u2014'} {poetName}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-poetry-verse',
  title: 'Poetry Verse',
  description: 'Poetry layout with line-by-line reveal, verse numbering, left accent bar, stanza breaks, and poet attribution',
  tags: ['scene', 'poetry', 'verse', 'poem', 'literary', 'text', 'stanza', 'line-reveal'],
  category: 'scene-layout',
  component: ScenePoetryVerseComponent as any,
  defaultConfig: {
    line1: 'I have been one acquainted with the night.',
    line2: 'I have walked out in rain\u2014and back in rain.',
    line3: 'I have outwalked the furthest city light.',
    line4: 'I have looked down the saddest city lane.',
    poetName: 'Robert Frost',
    verseNumber: 'I',
    bgColor: '#0A0B10',
    textColor: '#DDD8CF',
    accentColor: '#6B8FA3',
    numberColor: '#6B8FA366',
  },
  configSchema: [
    { key: 'line1', label: 'Line 1', type: 'text', defaultValue: 'I have been one acquainted with the night.', group: 'Content' },
    { key: 'line2', label: 'Line 2', type: 'text', defaultValue: 'I have walked out in rain\u2014and back in rain.', group: 'Content' },
    { key: 'line3', label: 'Line 3', type: 'text', defaultValue: 'I have outwalked the furthest city light.', group: 'Content' },
    { key: 'line4', label: 'Line 4', type: 'text', defaultValue: 'I have looked down the saddest city lane.', group: 'Content' },
    { key: 'poetName', label: 'Poet Name', type: 'text', defaultValue: 'Robert Frost', group: 'Content' },
    { key: 'verseNumber', label: 'Verse Number', type: 'text', defaultValue: 'I', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0B10', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#DDD8CF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6B8FA3', group: 'Style' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#6B8FA366', group: 'Style' },
  ],
})
