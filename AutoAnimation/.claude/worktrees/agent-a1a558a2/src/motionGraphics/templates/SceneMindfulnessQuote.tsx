import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMindfulnessQuoteConfig {
  quote: string
  author: string
  bgColorStart: string
  bgColorEnd: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

function SceneMindfulnessQuoteComponent({ config, progress }: MotionGraphicProps<SceneMindfulnessQuoteConfig>) {
  const { quote, author, bgColorStart, bgColorEnd, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  const quoteMarkEnter = easeOutQuart(Math.min(1, enterProgress / 0.4))
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))
  const textEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6)))
  const authorEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))

  const isHolding = progress >= 0.2 && progress < 0.8
  const floatY = isHolding ? Math.sin(holdProgress * Math.PI * 4) * 4 : 0

  // Split quote into words for staggered fade
  const words = quote.split(' ')

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Georgia', 'Palatino Linotype', serif" }}>
      {/* Gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(145deg, ${bgColorStart} 0%, ${bgColorEnd} 100%)`,
        }}
      />

      {/* Decorative circle */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}06 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}04 0%, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(24px, 8vw, 64px)',
          opacity: exitOpacity,
          transform: `translateY(${floatY}px)`,
        }}
      >
        {/* Opening quote mark */}
        <div
          style={{
            fontSize: 'clamp(48px, 12vw, 100px)',
            fontWeight: 400,
            color: accentColor,
            lineHeight: 0.6,
            opacity: quoteMarkEnter * 0.3,
            transform: `scale(${0.5 + quoteMarkEnter * 0.5}) translateY(${(1 - quoteMarkEnter) * 20}px)`,
            marginBottom: 'clamp(8px, 2vw, 20px)',
          }}
        >
          {'\u201C'}
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: 'clamp(30px, 8vw, 60px)',
            height: 2,
            background: `${accentColor}50`,
            marginBottom: 'clamp(16px, 3vw, 30px)',
            transform: `scaleX(${lineEnter})`,
          }}
        />

        {/* Quote text with word stagger */}
        <div
          style={{
            fontSize: 'clamp(18px, 4.5vw, 38px)',
            fontWeight: 400,
            color: textColor,
            textAlign: 'center',
            lineHeight: 1.6,
            maxWidth: '85%',
            letterSpacing: '0.01em',
          }}
        >
          {words.map((word, i) => {
            const wordDelay = 0.2 + (i / words.length) * 0.3
            const wordProgress = Math.max(0, Math.min(1, (enterProgress - wordDelay) / 0.3))
            const wordEased = easeOutCubic(wordProgress)

            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: wordEased * textEnter,
                  transform: `translateY(${(1 - wordEased) * 8}px)`,
                  marginRight: '0.3em',
                }}
              >
                {word}
              </span>
            )
          })}
        </div>

        {/* Bottom decorative line */}
        <div
          style={{
            width: 'clamp(30px, 8vw, 60px)',
            height: 2,
            background: `${accentColor}50`,
            marginTop: 'clamp(16px, 3vw, 30px)',
            marginBottom: 'clamp(12px, 2vw, 20px)',
            transform: `scaleX(${lineEnter})`,
          }}
        />

        {/* Author */}
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 18px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: `${textColor}88`,
            letterSpacing: '0.05em',
            opacity: authorEnter,
            transform: `translateY(${(1 - authorEnter) * 10}px)`,
          }}
        >
          {'\u2014'} {author}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-mindfulness-quote',
  title: 'Mindfulness Quote',
  description: 'Serene quote card with gradient background, staggered word reveal, decorative elements, and gentle float animation',
  tags: ['scene', 'quote', 'mindfulness', 'meditation', 'inspiration', 'wellness', 'calm', 'zen'],
  category: 'scene-layout',
  component: SceneMindfulnessQuoteComponent as any,
  defaultConfig: {
    quote: 'The present moment is the only moment available to us, and it is the door to all moments.',
    author: 'Thich Nhat Hanh',
    bgColorStart: '#0f1a2e',
    bgColorEnd: '#1a1028',
    textColor: '#e8e4df',
    accentColor: '#8b9eb5',
  },
  configSchema: [
    { key: 'quote', label: 'Quote', type: 'text', defaultValue: 'The present moment is the only moment available to us, and it is the door to all moments.', group: 'Content' },
    { key: 'author', label: 'Author', type: 'text', defaultValue: 'Thich Nhat Hanh', group: 'Content' },
    { key: 'bgColorStart', label: 'BG Gradient Start', type: 'color', defaultValue: '#0f1a2e', group: 'Style' },
    { key: 'bgColorEnd', label: 'BG Gradient End', type: 'color', defaultValue: '#1a1028', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e4df', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8b9eb5', group: 'Style' },
  ],
})
