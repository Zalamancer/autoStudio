import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePoetryCardConfig {
  poemTitle: string
  poetName: string
  verseLines: string
  collection: string
  year: string
  bgColor: string
  textColor: string
  accentColor: string
  ornamentColor: string
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

function ScenePoetryCardComponent({ config, progress }: MotionGraphicProps<ScenePoetryCardConfig>) {
  const { poemTitle, poetName, verseLines, collection, year, bgColor, textColor, accentColor, ornamentColor } = config

  const lines = verseLines.split('\n').filter((l) => l.trim())
  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const ornamentReveal = easeOutBack(Math.min(1, enterProgress / 0.3))
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.35)))
  const poetReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.3)))
  const footerReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.2)))

  // Hold: gentle breathing on ornaments
  const breathScale = holdProgress > 0 ? 1 + Math.sin(holdProgress * Math.PI * 3) * 0.02 : 1

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8%',
      }}
    >
      {/* Aged paper texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 32px, rgba(139,109,76,0.03) 32px, rgba(139,109,76,0.03) 33px)',
        }}
      />
      {/* Left border accent */}
      <div
        style={{
          position: 'absolute',
          left: '5%',
          top: '10%',
          bottom: '10%',
          width: 1,
          background: `linear-gradient(180deg, transparent, ${ornamentColor}25, transparent)`,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(8px, 1.5vw, 16px)',
          maxWidth: '88%',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1})`,
        }}
      >
        {/* Top ornament */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: ornamentReveal,
            transform: `scale(${ornamentReveal * breathScale})`,
          }}
        >
          <div
            style={{
              width: 'clamp(30px, 6vw, 55px)',
              height: 1,
              background: `linear-gradient(90deg, transparent, ${ornamentColor}40)`,
            }}
          />
          <div
            style={{
              fontSize: 'clamp(10px, 2vw, 16px)',
              color: ornamentColor,
            }}
          >
            {'\u2726'}
          </div>
          <div
            style={{
              width: 'clamp(30px, 6vw, 55px)',
              height: 1,
              background: `linear-gradient(90deg, ${ornamentColor}40, transparent)`,
            }}
          />
        </div>

        {/* Poem title */}
        <div
          style={{
            fontSize: 'clamp(18px, 4.5vw, 32px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color: textColor,
            textAlign: 'center',
            lineHeight: 1.2,
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 12}px)`,
          }}
        >
          {poemTitle}
        </div>

        {/* Poet name */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 16px)',
            color: accentColor,
            opacity: poetReveal,
            transform: `translateY(${(1 - poetReveal) * 8}px)`,
            letterSpacing: '0.05em',
          }}
        >
          {poetName}
        </div>

        {/* Thin divider */}
        <div
          style={{
            width: 'clamp(24px, 5vw, 40px)',
            height: 1,
            background: `${ornamentColor}30`,
            opacity: poetReveal,
          }}
        />

        {/* Verse lines - each fades in one by one */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(4px, 0.8vw, 8px)',
          }}
        >
          {lines.slice(0, 8).map((line, i) => {
            const lineDelay = 0.3 + i * 0.06
            const lineReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - lineDelay) / 0.2)))
            const isIndented = line.startsWith('  ') || line.startsWith('\t')

            return (
              <div
                key={i}
                style={{
                  fontSize: 'clamp(12px, 2.2vw, 18px)',
                  fontStyle: 'italic',
                  color: textColor,
                  lineHeight: 1.6,
                  textAlign: 'center',
                  opacity: lineReveal,
                  transform: `translateY(${(1 - lineReveal) * 8}px)`,
                  paddingLeft: isIndented ? 'clamp(16px, 3vw, 28px)' : 0,
                }}
              >
                {line.trim()}
              </div>
            )
          })}
        </div>

        {/* Bottom ornament */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: footerReveal,
            transform: `scale(${footerReveal * breathScale})`,
          }}
        >
          <div
            style={{
              width: 'clamp(20px, 4vw, 35px)',
              height: 1,
              background: `linear-gradient(90deg, transparent, ${ornamentColor}30)`,
            }}
          />
          <div
            style={{
              fontSize: 'clamp(8px, 1.4vw, 12px)',
              color: ornamentColor,
            }}
          >
            {'\u2726'}
          </div>
          <div
            style={{
              width: 'clamp(20px, 4vw, 35px)',
              height: 1,
              background: `linear-gradient(90deg, ${ornamentColor}30, transparent)`,
            }}
          />
        </div>

        {/* Collection and year */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(8px, 1.5vw, 14px)',
            alignItems: 'center',
            opacity: footerReveal,
            transform: `translateY(${(1 - footerReveal) * 6}px)`,
          }}
        >
          {collection && (
            <div
              style={{
                fontSize: 'clamp(9px, 1.4vw, 12px)',
                fontStyle: 'italic',
                color: `${textColor}50`,
              }}
            >
              {collection}
            </div>
          )}
          {collection && year && (
            <div
              style={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: `${textColor}30`,
              }}
            />
          )}
          {year && (
            <div
              style={{
                fontSize: 'clamp(9px, 1.4vw, 12px)',
                fontFamily: "'Inter', sans-serif",
                color: `${textColor}40`,
              }}
            >
              {year}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-poetry-card',
  title: 'Poetry Card',
  description:
    'Poetry display card with verse lines that fade in one by one, ornamental dividers, poem title, poet name, and collection reference',
  tags: ['scene', 'poetry', 'poem', 'verse', 'literary', 'literature', 'book', 'reading'],
  category: 'scene-layout',
  component: ScenePoetryCardComponent as any,
  defaultConfig: {
    poemTitle: 'The Road Not Taken',
    poetName: 'Robert Frost',
    verseLines: 'Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;',
    collection: 'Mountain Interval',
    year: '1916',
    bgColor: '#1a150e',
    textColor: '#f5edd6',
    accentColor: '#C9A96E',
    ornamentColor: '#8B6D4C',
  },
  configSchema: [
    { key: 'poemTitle', label: 'Poem Title', type: 'text', defaultValue: 'The Road Not Taken', group: 'Content' },
    { key: 'poetName', label: 'Poet', type: 'text', defaultValue: 'Robert Frost', group: 'Content' },
    { key: 'verseLines', label: 'Verse (newline-separated)', type: 'text', defaultValue: 'Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;', group: 'Content' },
    { key: 'collection', label: 'Collection', type: 'text', defaultValue: 'Mountain Interval', group: 'Content' },
    { key: 'year', label: 'Year', type: 'text', defaultValue: '1916', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5edd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'ornamentColor', label: 'Ornament Color', type: 'color', defaultValue: '#8B6D4C', group: 'Style' },
  ],
})
