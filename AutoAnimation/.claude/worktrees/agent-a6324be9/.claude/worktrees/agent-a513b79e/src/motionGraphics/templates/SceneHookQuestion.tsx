import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHookQuestionConfig {
  question: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneHookQuestionComponent({ config, progress }: MotionGraphicProps<SceneHookQuestionConfig>) {
  const { question, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Question text slams in from top with elastic bounce
  const textY = enterProgress < 1
    ? -120 + elasticOut(enterProgress) * 120
    : exitProgress > 0 ? -120 * easeInCubic(exitProgress) : 0
  const textOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Question mark animates separately with rotation wiggle
  const qMarkDelay = 0.3
  const qMarkEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - qMarkDelay) / (1 - qMarkDelay))
    : 1
  const qMarkScale = qMarkEnter < 1 ? elasticOut(qMarkEnter) : 1
  const qMarkRotation = qMarkEnter < 1
    ? 30 * (1 - elasticOut(qMarkEnter))
    : 0

  // Hold: subtle glow pulse on question mark
  const isHolding = progress >= 0.2 && progress < 0.8
  const glowPulse = isHolding ? 0.5 + Math.sin(holdProgress * Math.PI * 4) * 0.5 : 0

  // Radial gradient pulse on background
  const bgPulse = isHolding
    ? 50 + Math.sin(holdProgress * Math.PI * 3) * 10
    : enterProgress < 1 ? 30 + enterProgress * 20 : 50

  // Exit: text splits to sides
  const exitX = exitProgress > 0 ? 100 * easeInCubic(exitProgress) : 0
  const qMarkExitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background with radial gradient pulse */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 50%, ${accentColor}20 0%, ${bgColor} ${bgPulse}%)`,
      }} />

      {/* Question text */}
      <div style={{
        position: 'absolute', top: '38%', left: '50%',
        transform: `translate(calc(-50% + ${exitX}px), ${textY}px)`,
        opacity: textOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(24px, 7vw, 64px)',
        fontWeight: 800,
        color: textColor,
        textAlign: 'center',
        width: '85%',
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      }}>
        {question}
      </div>

      {/* Animated question mark */}
      <div style={{
        position: 'absolute', top: '58%', left: '50%',
        transform: `translate(-50%, 0) scale(${qMarkScale}) rotate(${qMarkRotation}deg)`,
        opacity: qMarkEnter < 1 ? easeOutCubic(qMarkEnter) : qMarkExitOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(48px, 14vw, 128px)',
        fontWeight: 900,
        color: accentColor,
        textShadow: `0 0 ${20 + glowPulse * 40}px ${accentColor}${Math.round(40 + glowPulse * 60).toString(16).padStart(2, '0')}`,
        lineHeight: 1,
      }}>
        ?
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hook-question',
  title: 'Hook: Question',
  description: '"Did you know...?" hook with elastic bounce entrance, wiggling question mark, and radial glow pulse',
  tags: ['scene', 'hook', 'question', 'attention', 'opener'],
  category: 'scene-hook',
  component: SceneHookQuestionComponent as any,
  defaultConfig: {
    question: 'Did you know?',
    bgColor: '#1a1a2e',
    textColor: '#ffffff',
    accentColor: '#ffd700',
  },
  configSchema: [
    { key: 'question', label: 'Question', type: 'text', defaultValue: 'Did you know?', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#ffd700', group: 'Style' },
  ],
})
