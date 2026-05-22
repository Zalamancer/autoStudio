import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LiquidConfig extends KineticBaseConfig {}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let scaleY = 1
    let scaleX = 1
    let opacity = 1
    let skewX = 0

    if (phase === 'enter') {
      // Stretch from thin horizontal line to full height
      const t = elasticOut(enterProgress)
      scaleY = 0.01 + t * 0.99
      // Slight horizontal wobble during stretch
      scaleX = 1 + Math.sin(enterProgress * Math.PI * 4) * 0.08 * (1 - enterProgress)
      skewX = Math.sin(enterProgress * Math.PI * 3) * 5 * (1 - enterProgress)
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      scaleY = 1
      // Subtle liquid wobble
      scaleX = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.02
      scaleY = 1 + Math.cos(holdProgress * Math.PI * 6) * 0.01
    } else {
      // Squash horizontally to thin vertical line
      const t = easeInBack(exitProgress)
      scaleX = 1 - t * 0.99
      scaleY = 1 + t * 0.3 // stretch tall as it narrows
      opacity = 1 - exitProgress * exitProgress
      skewX = Math.sin(exitProgress * Math.PI * 2) * 3 * exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY}) skewX(${skewX}deg)`,
          opacity,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          color,
          textShadow: `0 0 20px rgba(20,184,166,0.4), 0 4px 12px rgba(0,0,0,0.3)`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function LiquidTransitionComponent(props: MotionGraphicProps<LiquidConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-liquid-transition',
  title: 'Kinetic Liquid Stretch',
  description: 'Words stretch into view like liquid — elastic vertical expand with wobble, then compress horizontally to exit',
  tags: ['kinetic', 'typography', 'transition', 'liquid', 'elastic', 'stretch'],
  category: 'captions',
  component: LiquidTransitionComponent as any,
  defaultConfig: {
    words: ['FLUID', 'DRIP', 'FLOW', 'MELT'],
    colors: ['#2DD4BF', '#2DD4BF', '#2DD4BF', '#2DD4BF'],
    bgColor: '#0a1a1a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FLUID', 'DRIP', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2DD4BF', '#2DD4BF', '#2DD4BF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
