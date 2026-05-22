import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneNumberCounterConfig {
  targetNumber: number
  prefix: string
  suffix: string
  label: string
  numberColor: string
  labelColor: string
  bgColor: string
  numberSize: number
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  if (Number.isInteger(n)) return n.toLocaleString('en-US')
  return n.toFixed(1)
}

function SceneNumberCounterComponent({ config, progress }: MotionGraphicProps<SceneNumberCounterConfig>) {
  const { targetNumber, prefix, suffix, label, numberColor, labelColor, bgColor, numberSize } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Number counts up during enter with easeOutCubic
  const countEased = easeOutCubic(enterProgress)
  const currentValue = targetNumber * countEased
  const displayValue = enterProgress >= 1 ? formatNum(targetNumber) : formatNum(Math.floor(currentValue))

  // Label fades in after number
  const labelDelay = 0.4
  const labelEnter = enterProgress < 1 ? Math.max(0, (enterProgress - labelDelay) / (1 - labelDelay)) : 1
  const labelOpacity = easeOutCubic(labelEnter)

  // Hold: subtle scale pulse
  const isHolding = progress >= 0.2 && progress < 0.8
  const pulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 4) * 0.03 : 1

  // Exit: fade out and scale down
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.3 : 1

  const fontSize = `clamp(32px, ${numberSize}vw, 140px)`

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitOpacity,
          transform: `scale(${exitScale * pulse})`,
        }}
      >
        {/* Number */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize,
            fontWeight: 900,
            color: numberColor,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            opacity: easeOutCubic(enterProgress),
            transform: `translateY(${20 * (1 - easeOutCubic(enterProgress))}px)`,
          }}
        >
          {prefix}{displayValue}{suffix && <span style={{ fontSize: '0.6em', opacity: 0.85 }}>{suffix}</span>}
        </div>

        {/* Label */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(14px, 2.5vw, 28px)',
            fontWeight: 500,
            color: labelColor,
            opacity: labelOpacity * 0.85,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginTop: 'clamp(8px, 1.5vw, 20px)',
            transform: `translateY(${10 * (1 - labelOpacity)}px)`,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-number-counter',
  title: 'Number Counter',
  description: 'Large animated counter that rapidly counts from 0 to a target number with prefix/suffix support',
  tags: ['scene', 'data', 'counter', 'number', 'stats', 'animated'],
  category: 'scene-layout',
  component: SceneNumberCounterComponent as any,
  defaultConfig: {
    targetNumber: 2500000,
    prefix: '',
    suffix: '',
    label: 'Followers',
    numberColor: '#FFFFFF',
    labelColor: '#94a3b8',
    bgColor: '#0f172a',
    numberSize: 14,
  },
  configSchema: [
    { key: 'targetNumber', label: 'Target Number', type: 'number', defaultValue: 2500000, min: 0, max: 999999999, group: 'Content' },
    { key: 'prefix', label: 'Prefix', type: 'text', defaultValue: '', group: 'Content' },
    { key: 'suffix', label: 'Suffix', type: 'text', defaultValue: '', group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Followers', group: 'Content' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'labelColor', label: 'Label Color', type: 'color', defaultValue: '#94a3b8', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'numberSize', label: 'Number Size (vw)', type: 'number', defaultValue: 14, min: 4, max: 30, group: 'Layout' },
  ],
})
