import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MoodBoardConfig {
  moodWord: string
  quote: string
  swatchColors: string[]
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneMoodBoardComponent({ config, progress }: MotionGraphicProps<MoodBoardConfig>) {
  const { moodWord, quote, swatchColors, bgColor, textColor, accentColor } = config
  const swatches = swatchColors.slice(0, 4)
  while (swatches.length < 4) swatches.push('#888888')

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Swatch grid reveal (Pinterest-style: staggered scale-in)
  const getSwatchProgress = (index: number): number => {
    const order = [0, 2, 1, 3] // diagonal reveal
    const start = 0.05 + order[index] * 0.12
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - start) / 0.35)))
  }

  // Mood word enters
  const moodEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3)))

  // Quote reveals
  const quoteWords = quote.split(/\s+/)
  const quoteStart = 0.6
  const quoteReveal = Math.max(0, Math.min(1, (enterProgress - quoteStart) / (1 - quoteStart)))
  const visibleWords = Math.ceil(easeOutCubic(quoteReveal) * quoteWords.length)

  // Subtle sway during hold
  const sway = Math.sin(holdProgress * Math.PI * 3) * 1.5

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 30}px) rotate(${sway * 0.2}deg)`,
        }}
      >
        {/* Color swatch grid (2x2) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(6px, 1.2vw, 12px)',
            width: 'clamp(140px, 35vw, 280px)',
            height: 'clamp(140px, 35vw, 280px)',
            marginBottom: 'clamp(16px, 3vh, 32px)',
          }}
        >
          {swatches.map((color, i) => {
            const prog = getSwatchProgress(i)
            return (
              <div
                key={i}
                style={{
                  borderRadius: 'clamp(8px, 1.5vw, 16px)',
                  background: color,
                  transform: `scale(${prog})`,
                  opacity: prog,
                  boxShadow: `0 4px 16px ${color}40`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Hex label at bottom */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'clamp(4px, 0.8vh, 8px)',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: 'clamp(8px, 1.2vw, 12px)',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    opacity: prog > 0.8 ? 1 : 0,
                  }}
                >
                  {color.toUpperCase()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: 'clamp(40px, 8vw, 80px)',
            height: 2,
            background: accentColor,
            marginBottom: 'clamp(12px, 2vh, 24px)',
            transform: `scaleX(${moodEnter})`,
          }}
        />

        {/* Mood word */}
        <div
          style={{
            fontSize: 'clamp(28px, 8vw, 68px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            opacity: moodEnter,
            transform: `translateY(${(1 - moodEnter) * 20}px) rotate(${sway}deg)`,
            lineHeight: 1,
            marginBottom: 'clamp(10px, 2vh, 20px)',
          }}
        >
          {moodWord}
        </div>

        {/* Aesthetic quote */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 18px)',
            fontWeight: 400,
            color: `${textColor}aa`,
            lineHeight: 1.6,
            textAlign: 'center',
            maxWidth: '80%',
            fontStyle: 'italic',
          }}
        >
          {quoteWords.map((word, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: i < visibleWords ? 1 : 0,
                transform: i < visibleWords ? 'translateY(0)' : 'translateY(6px)',
                marginRight: '0.3em',
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-mood-board',
  title: 'Mood Board',
  description: 'Pinterest-style mood board with 4 color swatches, mood word, and aesthetic quote with staggered grid reveal',
  tags: ['scene', 'mood', 'aesthetic', 'lifestyle', 'color', 'personal', 'pinterest'],
  category: 'scene-layout',
  component: SceneMoodBoardComponent as any,
  defaultConfig: {
    moodWord: 'Serene',
    quote: 'Less is more. Find beauty in the quiet spaces between.',
    swatchColors: ['#a8dadc', '#457b9d', '#1d3557', '#f1faee'],
    bgColor: '#0d1117',
    textColor: '#f0f6fc',
    accentColor: '#a8dadc',
  },
  configSchema: [
    { key: 'moodWord', label: 'Mood Word', type: 'text', defaultValue: 'Serene', group: 'Content' },
    { key: 'quote', label: 'Quote', type: 'text', defaultValue: 'Less is more. Find beauty in the quiet spaces between.', group: 'Content' },
    { key: 'swatchColors', label: 'Swatch Colors', type: 'text-array', defaultValue: ['#a8dadc', '#457b9d', '#1d3557', '#f1faee'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d1117', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f0f6fc', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#a8dadc', group: 'Style' },
  ],
})
