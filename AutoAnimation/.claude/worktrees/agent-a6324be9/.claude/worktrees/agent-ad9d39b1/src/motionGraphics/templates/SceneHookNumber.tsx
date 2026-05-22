import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHookNumberConfig {
  number: number
  suffix: string
  subtitle: string
  numberColor: string
  textColor: string
  bgColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneHookNumberComponent({ config, progress }: MotionGraphicProps<SceneHookNumberConfig>) {
  const { number: targetNumber, suffix, subtitle, numberColor, textColor, bgColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Number counts up during enter
  const countProgress = easeOutQuart(enterProgress)
  const currentNumber = Math.round(targetNumber * countProgress)
  const numberScale = enterProgress < 1
    ? elasticOut(enterProgress)
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) * 0.5 : 1
  const numberOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Subtitle fades in after number lands
  const subtitleDelay = 0.6
  const subtitleEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - subtitleDelay) / (1 - subtitleDelay))
    : 1
  const subtitleOpacity = subtitleEnter < 1
    ? easeOutCubic(subtitleEnter)
    : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const subtitleY = subtitleEnter < 1
    ? 30 * (1 - easeOutCubic(subtitleEnter))
    : exitProgress > 0 ? 40 * easeInCubic(exitProgress) : 0

  // Hold: subtle scale pulse on number
  const isHolding = progress >= 0.25 && progress < 0.8
  const pulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 3) * 0.03 : 1

  // Exit: slide out
  const exitSlide = exitProgress > 0 ? 80 * easeInCubic(exitProgress) : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Accent glow behind number */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%',
        width: 'clamp(100px, 40vw, 300px)', height: 'clamp(100px, 40vw, 300px)',
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${numberColor}25 0%, transparent 70%)`,
        opacity: numberOpacity,
      }} />

      {/* Big number */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%',
        transform: `translate(-50%, calc(-50% + ${exitSlide}px)) scale(${numberScale * pulse})`,
        opacity: numberOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(48px, 18vw, 160px)',
        fontWeight: 900,
        color: numberColor,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}>
        {currentNumber}<span style={{ fontSize: '0.6em' }}>{suffix}</span>
      </div>

      {/* Subtitle */}
      <div style={{
        position: 'absolute', top: '58%', left: '50%',
        transform: `translate(-50%, ${subtitleY}px)`,
        opacity: subtitleOpacity,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        fontSize: 'clamp(14px, 4vw, 32px)',
        fontWeight: 500,
        color: textColor,
        textAlign: 'center',
        width: '80%',
        lineHeight: 1.4,
      }}>
        {subtitle}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hook-number',
  title: 'Hook: Number',
  description: '"97% of people..." number hook with slot-machine counting animation and subtitle reveal',
  tags: ['scene', 'hook', 'number', 'statistic', 'attention', 'opener'],
  category: 'scene-hook',
  component: SceneHookNumberComponent as any,
  defaultConfig: {
    number: 97,
    suffix: '%',
    subtitle: "of people don't know this",
    numberColor: '#ff6b6b',
    textColor: '#e0e0e0',
    bgColor: '#0d0d1a',
  },
  configSchema: [
    { key: 'number', label: 'Number', type: 'number', defaultValue: 97, min: 0, max: 99999, group: 'Content' },
    { key: 'suffix', label: 'Suffix', type: 'text', defaultValue: '%', group: 'Content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: "of people don't know this", group: 'Content' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#ff6b6b', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e0e0', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d1a', group: 'Style' },
  ],
})
