import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneEpigraphConfig {
  quoteText: string
  authorName: string
  chapterRef: string
  bgColor: string
  textColor: string
  accentColor: string
  ornamentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

function SceneEpigraphComponent({ config, progress }: MotionGraphicProps<SceneEpigraphConfig>) {
  const { quoteText, authorName, chapterRef, bgColor, textColor, accentColor, ornamentColor } = config

  // Phases: enter 0-0.25, hold 0.25-0.8, exit 0.8-1
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Chapter reference fades in first
  const chapterOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const chapterY = (1 - chapterOpacity) * 12

  // Ornamental rule expands
  const ruleWidth = easeOutQuart(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.35)))

  // Quote text fades in with gentle upward drift
  const quoteOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.45)))
  const quoteY = (1 - quoteOpacity) * 20

  // Em-dash and author slide in
  const authorOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.35)))
  const authorX = (1 - authorOpacity) * 18

  // Hold: gentle text-shadow pulse for warmth
  const glowPulse = holdProgress > 0 ? 0.03 + 0.02 * Math.sin(holdProgress * Math.PI * 3) : 0

  // Exit: fade out and drift upward
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * -30

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
      {/* Subtle paper texture gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${accentColor}06 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Vignette edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: `inset 0 0 clamp(60px, 15vw, 120px) ${bgColor}`,
          pointerEvents: 'none',
        }}
      />

      {/* Content container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '75%',
          opacity: exitOpacity,
          transform: `translateY(${exitY}px)`,
        }}
      >
        {/* Chapter reference */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.6vw, 13px)',
            fontWeight: 400,
            color: `${textColor}60`,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            opacity: chapterOpacity,
            transform: `translateY(${chapterY}px)`,
            marginBottom: 'clamp(12px, 2.5vw, 24px)',
          }}
        >
          {chapterRef}
        </div>

        {/* Upper ornamental rule */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 12px)',
            marginBottom: 'clamp(16px, 3.5vw, 32px)',
          }}
        >
          <div
            style={{
              width: `clamp(20px, 5vw, 40px)`,
              height: 1,
              background: ornamentColor,
              transform: `scaleX(${ruleWidth})`,
              transformOrigin: 'right center',
            }}
          />
          <div
            style={{
              fontSize: 'clamp(8px, 1.5vw, 12px)',
              color: ornamentColor,
              opacity: ruleWidth,
            }}
          >
            {'\u2726'}
          </div>
          <div
            style={{
              width: `clamp(20px, 5vw, 40px)`,
              height: 1,
              background: ornamentColor,
              transform: `scaleX(${ruleWidth})`,
              transformOrigin: 'left center',
            }}
          />
        </div>

        {/* Quote text - italic serif */}
        <div
          style={{
            fontSize: 'clamp(16px, 3.8vw, 32px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: textColor,
            lineHeight: 1.65,
            textAlign: 'center',
            opacity: quoteOpacity,
            transform: `translateY(${quoteY}px)`,
            textShadow: glowPulse > 0 ? `0 0 ${glowPulse * 100}px ${accentColor}15` : 'none',
            maxWidth: '100%',
          }}
        >
          {'\u201C'}{quoteText}{'\u201D'}
        </div>

        {/* Em-dash + author name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(4px, 1vw, 8px)',
            marginTop: 'clamp(16px, 3vw, 28px)',
            opacity: authorOpacity,
            transform: `translateX(${authorX}px)`,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(14px, 3vw, 24px)',
              color: ornamentColor,
              fontWeight: 300,
            }}
          >
            {'\u2014'}
          </span>
          <span
            style={{
              fontSize: 'clamp(12px, 2.4vw, 20px)',
              fontWeight: 400,
              fontStyle: 'normal',
              color: `${textColor}CC`,
              letterSpacing: '0.06em',
              fontVariant: 'small-caps',
            }}
          >
            {authorName}
          </span>
        </div>

        {/* Lower ornamental rule */}
        <div
          style={{
            width: `clamp(30px, 7vw, 50px)`,
            height: 1,
            background: ornamentColor,
            marginTop: 'clamp(20px, 4vw, 36px)',
            transform: `scaleX(${ruleWidth})`,
            opacity: 0.5,
          }}
        />
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-epigraph',
  title: 'Book Epigraph',
  description: 'Elegant book epigraph with italic serif quote, em-dash author attribution, chapter reference, and ornamental flourishes',
  tags: ['scene', 'book', 'epigraph', 'quote', 'literary', 'serif', 'text', 'elegant'],
  category: 'scene-layout',
  component: SceneEpigraphComponent as any,
  defaultConfig: {
    quoteText: 'We are all in the gutter, but some of us are looking at the stars.',
    authorName: 'Oscar Wilde',
    chapterRef: 'Chapter One',
    bgColor: '#0E0D0B',
    textColor: '#E8E2D8',
    accentColor: '#C9A96E',
    ornamentColor: '#C9A96E66',
  },
  configSchema: [
    { key: 'quoteText', label: 'Quote Text', type: 'text', defaultValue: 'We are all in the gutter, but some of us are looking at the stars.', group: 'Content' },
    { key: 'authorName', label: 'Author Name', type: 'text', defaultValue: 'Oscar Wilde', group: 'Content' },
    { key: 'chapterRef', label: 'Chapter Reference', type: 'text', defaultValue: 'Chapter One', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0E0D0B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E2D8', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'ornamentColor', label: 'Ornament Color', type: 'color', defaultValue: '#C9A96E66', group: 'Style' },
  ],
})
