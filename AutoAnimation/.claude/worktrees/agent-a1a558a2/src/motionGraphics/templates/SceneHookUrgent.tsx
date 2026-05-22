import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHookUrgentConfig {
  urgentText: string
  badgeText: string
  alertColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneHookUrgentComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneHookUrgentConfig>) {
  const { urgentText, badgeText, alertColor, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Fast typewriter text
  const typeSpeed = easeOutCubic(enterProgress)
  const visibleChars = Math.floor(typeSpeed * urgentText.length)
  const typedText = urgentText.slice(0, visibleChars)

  const textOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : enterProgress > 0.1 ? 1 : 0

  // Badge rotates in from corner
  const badgeDelay = 0.3
  const badgeEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - badgeDelay) / (1 - badgeDelay))
    : 1
  const badgeScale = badgeEnter < 1 ? elasticOut(badgeEnter) : 1
  const badgeRotation = badgeEnter < 1 ? -20 + elasticOut(badgeEnter) * 20 : 0
  const badgeOpacity = badgeEnter < 1
    ? easeOutCubic(badgeEnter)
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Hold: border pulses red
  const isHolding = progress >= 0.25 && progress < 0.8
  const borderPulse = isHolding
    ? 0.4 + Math.sin(holdProgress * Math.PI * 5) * 0.4
    : enterProgress < 1 ? easeOutCubic(enterProgress) * 0.4 : 0.4

  // Flashing border on hold
  const borderFlash = isHolding
    ? Math.sin(holdProgress * Math.PI * 8) > 0.3 ? 1 : 0.4
    : 1

  // Exit: slides down like news ticker
  const exitY = exitProgress > 0 ? 120 * easeInCubic(exitProgress) : 0

  // Alert bar at top
  const barWidth = enterProgress < 1 ? easeOutCubic(enterProgress) * 100 : 100

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      transform: `translateY(${exitY}px)`,
    }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Flashing border */}
      <div style={{
        position: 'absolute', inset: '3%',
        border: `3px solid ${alertColor}`,
        borderRadius: '8px',
        opacity: borderPulse * borderFlash,
        boxShadow: `inset 0 0 30px ${alertColor}15, 0 0 20px ${alertColor}20`,
      }} />

      {/* Alert bar at top */}
      <div style={{
        position: 'absolute', top: '6%', left: '50%',
        transform: 'translate(-50%, 0)',
        width: `${barWidth * 0.6}%`,
        height: '3px',
        background: `linear-gradient(90deg, transparent, ${alertColor}, transparent)`,
        opacity: textOpacity,
      }} />

      {/* URGENT badge in top-right corner */}
      <div style={{
        position: 'absolute', top: '8%', right: '8%',
        transform: `scale(${badgeScale}) rotate(${badgeRotation}deg)`,
        opacity: badgeOpacity,
        background: alertColor,
        padding: 'clamp(4px, 1vw, 10px) clamp(8px, 2vw, 18px)',
        borderRadius: '4px',
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(8px, 2vw, 16px)',
        fontWeight: 800,
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        boxShadow: `0 2px 12px ${alertColor}60`,
      }}>
        {badgeText}
      </div>

      {/* Urgent text with fast typewriter */}
      <div style={{
        position: 'absolute', top: '45%', left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: textOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(16px, 5vw, 42px)',
        fontWeight: 700,
        color: textColor,
        textAlign: 'center',
        width: '80%',
        lineHeight: 1.4,
      }}>
        {typedText}
        {enterProgress < 1 && (
          <span style={{
            display: 'inline-block',
            width: '3px',
            height: '1em',
            background: alertColor,
            marginLeft: '3px',
            verticalAlign: 'text-bottom',
            opacity: Math.sin((frame / fps) * Math.PI * 8) > 0 ? 1 : 0,
          }} />
        )}
      </div>

      {/* Alert bar at bottom */}
      <div style={{
        position: 'absolute', bottom: '6%', left: '50%',
        transform: 'translate(-50%, 0)',
        width: `${barWidth * 0.6}%`,
        height: '3px',
        background: `linear-gradient(90deg, transparent, ${alertColor}, transparent)`,
        opacity: textOpacity,
      }} />

      {/* Breaking news-style ticker line */}
      <div style={{
        position: 'absolute', bottom: '14%', left: '50%',
        transform: 'translate(-50%, 0)',
        opacity: textOpacity * 0.5,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(8px, 1.8vw, 13px)',
        fontWeight: 500,
        color: alertColor,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
      }}>
        {isHolding && Math.sin(holdProgress * Math.PI * 4) > 0 ? 'WATCH NOW' : 'DO NOT SKIP'}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hook-urgent',
  title: 'Hook: Urgent',
  description: '"You NEED to see this" urgency hook with flashing border, fast typewriter, rotating badge, and news ticker exit',
  tags: ['scene', 'hook', 'urgent', 'breaking', 'alert', 'attention', 'opener'],
  category: 'scene-hook',
  component: SceneHookUrgentComponent as any,
  defaultConfig: {
    urgentText: 'You need to see this before it gets deleted',
    badgeText: 'URGENT',
    alertColor: '#ff2222',
    bgColor: '#0a0a0f',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'urgentText', label: 'Urgent Text', type: 'text', defaultValue: 'You need to see this before it gets deleted', group: 'Content' },
    { key: 'badgeText', label: 'Badge Text', type: 'text', defaultValue: 'URGENT', group: 'Content' },
    { key: 'alertColor', label: 'Alert Color', type: 'color', defaultValue: '#ff2222', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0f', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
