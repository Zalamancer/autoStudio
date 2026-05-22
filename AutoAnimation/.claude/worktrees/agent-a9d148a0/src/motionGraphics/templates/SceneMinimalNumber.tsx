import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMinimalNumberConfig {
  number: number
  label: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function SceneMinimalNumberComponent({ config, progress }: MotionGraphicProps<SceneMinimalNumberConfig>) {
  const { number, label, bgColor, textColor } = config

  // Phase calculations
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const easedEnter = easeOutCubic(enterProgress)
  const easedExit = easeInCubic(exitProgress)

  // Number counts up during enter
  const countProgress = easeOutQuart(enterProgress)
  const currentNumber = Math.round(number * countProgress)
  const displayNumber = enterProgress >= 1 ? number : currentNumber

  // Number opacity and position
  const numberOpacity = exitProgress > 0 ? 1 - easedExit : easedEnter
  const numberY = enterProgress < 1
    ? 20 * (1 - easedEnter)
    : exitProgress > 0
      ? -20 * easedExit
      : 0

  // Label appears with delay
  const labelDelay = 0.5
  const labelEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - labelDelay) / (1 - labelDelay))
    : 1
  const labelOpacity = exitProgress > 0
    ? easeOutCubic(labelEnter) * (1 - easedExit)
    : easeOutCubic(labelEnter)
  const labelY = labelEnter < 1
    ? 10 * (1 - easeOutCubic(labelEnter))
    : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Content centered */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5em',
        }}
      >
        {/* Massive number */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(60px, 20vw, 240px)',
            fontWeight: 200,
            color: textColor,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            opacity: numberOpacity,
            transform: `translateY(${numberY}px)`,
          }}
        >
          {displayNumber}
        </div>

        {/* Tiny label */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(10px, 2vw, 18px)',
            fontWeight: 400,
            color: textColor,
            opacity: labelOpacity * 0.5,
            transform: `translateY(${labelY}px)`,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-minimal-number',
  title: 'Scene Minimal Number',
  description: 'Single massive number that counts up with a tiny label below, ultra-minimal design with lots of whitespace',
  tags: ['scene', 'number', 'counter', 'minimal', 'clean', 'whitespace', 'stat'],
  category: 'scene-layout',
  component: SceneMinimalNumberComponent as any,
  defaultConfig: {
    number: 42,
    label: 'projects completed',
    bgColor: '#FFFFFF',
    textColor: '#000000',
  },
  configSchema: [
    { key: 'number', label: 'Number', type: 'number', defaultValue: 42, min: 0, max: 99999, group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'projects completed', group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#000000', group: 'Style' },
  ],
})
