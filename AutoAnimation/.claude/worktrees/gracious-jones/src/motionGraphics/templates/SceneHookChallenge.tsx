import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHookChallengeConfig {
  challengeText: string
  timeSeconds: number
  accentColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneHookChallengeComponent({ config, progress }: MotionGraphicProps<SceneHookChallengeConfig>) {
  const { challengeText, timeSeconds, accentColor, bgColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Text scales in with bounce
  const textScale = enterProgress < 1 ? elasticOut(enterProgress) : 1
  const textOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Timer circle in corner - draws during enter and continues in hold
  const timerEnter = easeOutCubic(enterProgress)
  const timerDraw = enterProgress < 1
    ? timerEnter * 0.3
    : 0.3 + holdProgress * 0.7

  // Timer circle SVG params
  const circleR = 36
  const circumference = 2 * Math.PI * circleR
  const strokeDash = circumference * timerDraw
  const timerOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Countdown number
  const displaySeconds = exitProgress > 0
    ? 0
    : enterProgress < 1
      ? timeSeconds
      : Math.max(0, Math.ceil(timeSeconds * (1 - holdProgress)))

  // Exit: text slides out, timer flashes
  const textSlide = exitProgress > 0 ? -100 * easeInCubic(exitProgress) : 0
  const timerFlash = exitProgress > 0 ? Math.sin(exitProgress * Math.PI * 8) > 0 ? 1 : 0.3 : 1

  // Urgency pulse during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const urgencyPulse = isHolding && holdProgress > 0.7
    ? 1 + Math.sin(holdProgress * Math.PI * 12) * 0.05
    : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
      }} />

      {/* Challenge text */}
      <div style={{
        position: 'absolute', top: '42%', left: '50%',
        transform: `translate(-50%, -50%) scale(${textScale * urgencyPulse}) translateX(${textSlide}px)`,
        opacity: textOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(20px, 6vw, 52px)',
        fontWeight: 800,
        color: textColor,
        textAlign: 'center',
        width: '80%',
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      }}>
        {challengeText}
      </div>

      {/* Timer circle in top-right corner */}
      <div style={{
        position: 'absolute', top: '8%', right: '8%',
        opacity: timerOpacity * timerFlash,
      }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          {/* Background circle */}
          <circle
            cx="45" cy="45" r={circleR}
            fill="none"
            stroke={`${accentColor}30`}
            strokeWidth="4"
          />
          {/* Progress arc */}
          <circle
            cx="45" cy="45" r={circleR}
            fill="none"
            stroke={accentColor}
            strokeWidth="4"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(-90 45 45)"
            style={{ filter: `drop-shadow(0 0 6px ${accentColor}80)` }}
          />
          {/* Countdown number */}
          <text
            x="45" y="49"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={accentColor}
            fontFamily="'Inter', 'Helvetica Neue', sans-serif"
            fontSize="24"
            fontWeight="800"
          >
            {displaySeconds}
          </text>
        </svg>
      </div>

      {/* "Challenge" label */}
      <div style={{
        position: 'absolute', bottom: '18%', left: '50%',
        transform: `translate(-50%, 0) translateX(${textSlide}px)`,
        opacity: textOpacity * 0.6,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(10px, 2.2vw, 16px)',
        fontWeight: 600,
        color: accentColor,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
      }}>
        Challenge
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hook-challenge',
  title: 'Hook: Challenge',
  description: '"Can you...?" challenge hook with bounce entrance, animated countdown timer, and urgency pulse',
  tags: ['scene', 'hook', 'challenge', 'timer', 'countdown', 'attention', 'opener'],
  category: 'scene-hook',
  component: SceneHookChallengeComponent as any,
  defaultConfig: {
    challengeText: 'Can you guess what happens next?',
    timeSeconds: 5,
    accentColor: '#ff3b3b',
    bgColor: '#0d0d1a',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'challengeText', label: 'Challenge Text', type: 'text', defaultValue: 'Can you guess what happens next?', group: 'Content' },
    { key: 'timeSeconds', label: 'Timer Seconds', type: 'number', defaultValue: 5, min: 1, max: 30, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#ff3b3b', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
