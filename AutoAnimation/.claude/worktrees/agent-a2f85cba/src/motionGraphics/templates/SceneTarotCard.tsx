import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneTarotCardConfig {
  cardName: string
  cardNumber: string
  meaningUpright: string
  meaningReversed: string
  cardEmoji: string
  bgColor: string
  cardBgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneTarotCardComponent({ config, progress }: MotionGraphicProps<SceneTarotCardConfig>) {
  const { cardName, cardNumber, meaningUpright, meaningReversed, cardEmoji, bgColor, cardBgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const isHolding = progress >= 0.3 && progress < 0.8

  // Card flip from back (rotateY 180 -> 0)
  const flipAngle = enterProgress < 1 ? 180 * (1 - easeOutCubic(Math.min(1, enterProgress * 1.3))) : 0
  const isShowingBack = flipAngle > 90

  // Subtle glow during hold
  const glowSize = isHolding ? 20 + Math.sin(holdProgress * Math.PI * 3) * 12 : 20

  // Meaning reveals staggered
  const uprightEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.4)))
  const reversedEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.2)))

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const exitScale = exitProgress > 0 ? 1 - exitProgress * 0.2 : 1

  // Ornate border pattern (using box-shadow layers)
  const borderGlow = `inset 0 0 0 2px ${accentColor}, inset 0 0 0 4px ${cardBgColor}, inset 0 0 0 6px ${accentColor}66`

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 40%, ${bgColor} 0%, #050510 100%)` }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(10px, 2.5vw, 24px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
          perspective: 800,
        }}
      >
        {/* Tarot card */}
        <div
          style={{
            width: 'clamp(140px, 35vw, 260px)',
            height: 'clamp(220px, 55vw, 420px)',
            borderRadius: 'clamp(8px, 2vw, 16px)',
            transform: `rotateY(${flipAngle}deg)`,
            transformStyle: 'preserve-3d',
            position: 'relative',
            filter: `drop-shadow(0 0 ${glowSize}px ${accentColor}44)`,
          }}
        >
          {/* Card face */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background: isShowingBack
                ? `repeating-linear-gradient(45deg, ${accentColor}22 0px, ${accentColor}22 10px, ${cardBgColor} 10px, ${cardBgColor} 20px)`
                : cardBgColor,
              boxShadow: borderGlow,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(12px, 3vw, 28px)',
              gap: 'clamp(6px, 1.5vw, 14px)',
              backfaceVisibility: 'hidden',
            }}
          >
            {!isShowingBack && (
              <>
                {/* Card number */}
                <div
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: 'clamp(10px, 2vw, 16px)',
                    color: accentColor,
                    letterSpacing: '0.2em',
                    opacity: 0.7,
                  }}
                >
                  {cardNumber}
                </div>

                {/* Card emoji */}
                <div style={{ fontSize: 'clamp(40px, 10vw, 80px)', lineHeight: 1, margin: 'clamp(4px, 1vw, 10px) 0' }}>
                  {cardEmoji}
                </div>

                {/* Ornamental divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 'clamp(15px, 4vw, 30px)', height: 1, background: accentColor, opacity: 0.5 }} />
                  <div style={{ fontSize: 'clamp(8px, 1.5vw, 12px)', color: accentColor, opacity: 0.6 }}>✦</div>
                  <div style={{ width: 'clamp(15px, 4vw, 30px)', height: 1, background: accentColor, opacity: 0.5 }} />
                </div>

                {/* Card name */}
                <div
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: 'clamp(14px, 3.5vw, 28px)',
                    fontWeight: 700,
                    color: accentColor,
                    textAlign: 'center',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {cardName}
                </div>

                {/* Corner ornaments */}
                {[{ top: 8, left: 8 }, { top: 8, right: 8 }, { bottom: 8, left: 8 }, { bottom: 8, right: 8 }].map((pos, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      ...pos,
                      fontSize: 'clamp(6px, 1.2vw, 10px)',
                      color: accentColor,
                      opacity: 0.4,
                    } as React.CSSProperties}
                  >
                    ✦
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Meanings below card */}
        <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 30px)', maxWidth: '85%' }}>
          {/* Upright */}
          <div
            style={{
              textAlign: 'center',
              opacity: uprightEnter,
              transform: `translateY(${10 * (1 - uprightEnter)}px)`,
            }}
          >
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.5vw, 12px)', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4, fontWeight: 600 }}>
              Upright
            </div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 'clamp(10px, 2vw, 16px)', color: textColor, opacity: 0.8, lineHeight: 1.4 }}>
              {meaningUpright}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, background: `${accentColor}33`, opacity: Math.min(uprightEnter, reversedEnter) }} />

          {/* Reversed */}
          <div
            style={{
              textAlign: 'center',
              opacity: reversedEnter,
              transform: `translateY(${10 * (1 - reversedEnter)}px)`,
            }}
          >
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.5vw, 12px)', color: '#b06070', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4, fontWeight: 600 }}>
              Reversed
            </div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 'clamp(10px, 2vw, 16px)', color: textColor, opacity: 0.8, lineHeight: 1.4 }}>
              {meaningReversed}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-tarot-card',
  title: 'Tarot Card Reveal',
  description: 'Tarot card with flip reveal animation, ornate border, card name, upright and reversed meanings',
  tags: ['scene', 'tarot', 'card', 'mystical', 'astrology', 'reveal', 'flip'],
  category: 'scene-layout',
  component: SceneTarotCardComponent as any,
  defaultConfig: {
    cardName: 'The Star',
    cardNumber: 'XVII',
    meaningUpright: 'Hope, Faith, Renewal, Inspiration',
    meaningReversed: 'Despair, Disconnection, Lack of Faith',
    cardEmoji: '⭐',
    bgColor: '#0f0a25',
    cardBgColor: '#1a1538',
    accentColor: '#d4a843',
    textColor: '#e8e0f0',
  },
  configSchema: [
    { key: 'cardName', label: 'Card Name', type: 'text', defaultValue: 'The Star', group: 'Content' },
    { key: 'cardNumber', label: 'Card Number', type: 'text', defaultValue: 'XVII', group: 'Content' },
    { key: 'meaningUpright', label: 'Upright Meaning', type: 'text', defaultValue: 'Hope, Faith, Renewal, Inspiration', group: 'Content' },
    { key: 'meaningReversed', label: 'Reversed Meaning', type: 'text', defaultValue: 'Despair, Disconnection, Lack of Faith', group: 'Content' },
    { key: 'cardEmoji', label: 'Card Emoji', type: 'text', defaultValue: '⭐', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0a25', group: 'Style' },
    { key: 'cardBgColor', label: 'Card Background', type: 'color', defaultValue: '#1a1538', group: 'Style' },
    { key: 'accentColor', label: 'Accent (Gold)', type: 'color', defaultValue: '#d4a843', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e0f0', group: 'Style' },
  ],
})
