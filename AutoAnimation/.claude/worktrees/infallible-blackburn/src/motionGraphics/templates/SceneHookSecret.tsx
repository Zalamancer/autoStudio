import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHookSecretConfig {
  secretText: string
  glowColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneHookSecretComponent({ config, progress }: MotionGraphicProps<SceneHookSecretConfig>) {
  const { secretText, glowColor, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Keyhole iris opens with elastic easing
  const irisSize = enterProgress < 1
    ? elasticOut(enterProgress) * 100
    : exitProgress > 0 ? 100 * (1 - easeInCubic(exitProgress)) : 100

  // Golden glow behind keyhole
  const glowIntensity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Shimmer during hold (CSS-driven golden particles)
  const isHolding = progress >= 0.25 && progress < 0.8
  const shimmerPhase = isHolding ? holdProgress * 360 : 0

  // Text opacity follows iris
  const textOpacity = enterProgress < 1
    ? easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const textScale = enterProgress < 1
    ? 0.8 + easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)) * 0.2
    : 1

  // The mask: a circle that starts small and expands
  const maskRadius = irisSize * 0.5

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Dark background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Golden glow behind the keyhole */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${maskRadius * 2.5}%`,
        height: `${maskRadius * 2.5}%`,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${glowColor}60 0%, ${glowColor}20 40%, transparent 70%)`,
        opacity: glowIntensity,
        filter: `blur(${20 - glowIntensity * 10}px)`,
      }} />

      {/* Shimmer particles (CSS-based golden dots) */}
      {isHolding && Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 360 + shimmerPhase
        const rad = (angle * Math.PI) / 180
        const dist = 15 + Math.sin(holdProgress * Math.PI * (2 + i * 0.5)) * 8
        const x = 50 + Math.cos(rad) * dist
        const y = 50 + Math.sin(rad) * dist
        const particleOpacity = 0.3 + Math.sin(holdProgress * Math.PI * (3 + i)) * 0.3
        return (
          <div key={i} style={{
            position: 'absolute',
            top: `${y}%`, left: `${x}%`,
            width: 'clamp(3px, 0.6vw, 6px)',
            height: 'clamp(3px, 0.6vw, 6px)',
            borderRadius: '50%',
            background: glowColor,
            opacity: particleOpacity,
            boxShadow: `0 0 8px ${glowColor}`,
            transform: 'translate(-50%, -50%)',
          }} />
        )
      })}

      {/* Circular mask / keyhole reveal */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 50%, transparent ${maskRadius}%, ${bgColor} ${maskRadius + 2}%)`,
        zIndex: 5,
      }} />

      {/* Keyhole border ring */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${maskRadius * 2 + 1}%`,
        height: `${maskRadius * 2 + 1}%`,
        borderRadius: '50%',
        border: `2px solid ${glowColor}50`,
        opacity: glowIntensity,
        boxShadow: `0 0 20px ${glowColor}30, inset 0 0 20px ${glowColor}20`,
        zIndex: 6,
      }} />

      {/* Secret text in center */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: `translate(-50%, -50%) scale(${textScale})`,
        opacity: textOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(16px, 5vw, 44px)',
        fontWeight: 700,
        color: textColor,
        textAlign: 'center',
        width: '70%',
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
        textShadow: `0 0 30px ${glowColor}40`,
        zIndex: 4,
      }}>
        {secretText}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hook-secret',
  title: 'Hook: Secret Reveal',
  description: '"The secret to..." reveal hook with expanding keyhole mask, golden glow, and shimmer particles',
  tags: ['scene', 'hook', 'secret', 'reveal', 'mystery', 'attention', 'opener'],
  category: 'scene-hook',
  component: SceneHookSecretComponent as any,
  defaultConfig: {
    secretText: 'The secret to going viral',
    glowColor: '#ffd700',
    bgColor: '#0a0a14',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'secretText', label: 'Secret Text', type: 'text', defaultValue: 'The secret to going viral', group: 'Content' },
    { key: 'glowColor', label: 'Glow Color', type: 'color', defaultValue: '#ffd700', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
