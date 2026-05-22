import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSwipeUpConfig {
  ctaText: string
  arrowColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneSwipeUpComponent({ config, progress }: MotionGraphicProps<SceneSwipeUpConfig>) {
  const { ctaText, arrowColor, bgColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const isHolding = progress >= 0.2 && progress < 0.8

  // Background gradient
  const bgOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Chevrons bounce up continuously during hold
  const chevronBounce = isHolding
    ? (holdProgress * 8) % 1 // Repeating 0-1 cycle
    : 0
  const chevronBaseY = isHolding
    ? -20 * Math.abs(Math.sin(chevronBounce * Math.PI))
    : 0

  // Enter: chevrons slide up from below
  const chevronEnter = Math.min(1, enterProgress / 0.5)
  const chevronY = chevronEnter < 1
    ? 100 * (1 - easeOutBack(chevronEnter))
    : exitProgress > 0
      ? -200 * easeInCubic(exitProgress) // Slides up off screen on exit
      : chevronBaseY
  const chevronOpacity = chevronEnter < 1
    ? easeOutCubic(chevronEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Pulse attention during hold
  const pulseScale = isHolding
    ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.08
    : 1
  const pulseGlow = isHolding
    ? 10 + Math.sin(holdProgress * Math.PI * 6) * 10
    : 10

  // Text appears after chevrons
  const textDelay = 0.35
  const textEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - textDelay) / (1 - textDelay))
    : 1
  const textY = textEnter < 1
    ? 40 * (1 - easeOutCubic(textEnter))
    : exitProgress > 0
      ? -60 * easeInCubic(exitProgress)
      : 0
  const textOpacity = textEnter < 1
    ? easeOutCubic(textEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Gradient background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to top, ${bgColor}, #1a0a3e)`,
        opacity: bgOpacity,
      }} />

      {/* Bottom gradient hint */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '30%',
        background: `linear-gradient(to top, ${arrowColor}15, transparent)`,
        opacity: bgOpacity,
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '8%',
        gap: 'clamp(24px, 6vw, 48px)',
      }}>
        {/* Triple chevron arrows */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(4px, 1vw, 8px)',
          transform: `translateY(${chevronY}px) scale(${pulseScale})`,
          opacity: chevronOpacity,
          filter: `drop-shadow(0 0 ${pulseGlow}px ${arrowColor}80)`,
        }}>
          {[0, 1, 2].map((idx) => {
            // Stagger each chevron slightly
            const staggerOffset = isHolding
              ? Math.sin((holdProgress * 8 + idx * 0.15) * Math.PI) * 4
              : 0
            const staggerOpacity = 1 - idx * 0.2

            return (
              <div key={idx} style={{
                fontSize: 'clamp(36px, 10vw, 80px)',
                lineHeight: 0.6,
                color: arrowColor,
                fontWeight: 900,
                transform: `translateY(${staggerOffset}px)`,
                opacity: staggerOpacity,
              }}>
                {'\u25B2'}
              </div>
            )
          })}
        </div>

        {/* CTA Text */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(20px, 5vw, 44px)',
          fontWeight: 800,
          color: textColor,
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: '85%',
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
          textShadow: '0 2px 20px rgba(0,0,0,0.5)',
        }}>
          {ctaText}
        </div>

        {/* Subtle finger swipe hint */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(12px, 2.5vw, 18px)',
          color: `${textColor}60`,
          fontWeight: 500,
          transform: `translateY(${textY + 10}px)`,
          opacity: textOpacity * 0.7,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {'\u261D\uFE0F'} Swipe up
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-swipe-up',
  title: 'Swipe Up CTA',
  description: 'Animated swipe up call-to-action with bouncing chevrons, pulsing glow, and gradient background',
  tags: ['scene', 'social', 'cta', 'swipe', 'link', 'stories', 'engagement'],
  category: 'scene-layout',
  component: SceneSwipeUpComponent as any,
  defaultConfig: {
    ctaText: 'Swipe Up for the link!',
    arrowColor: '#A78BFA',
    bgColor: '#0a0a1a',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'ctaText', label: 'CTA Text', type: 'text', defaultValue: 'Swipe Up for the link!', group: 'Content' },
    { key: 'arrowColor', label: 'Arrow Color', type: 'color', defaultValue: '#A78BFA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
