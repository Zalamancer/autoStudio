import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZoomBlurConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let scale = 1
    let opacity = 1
    let blurShadows = ''

    if (phase === 'enter') {
      const t = easeOutCubic(enterProgress)
      scale = 5 - t * 4 // 5 → 1
      opacity = Math.min(1, enterProgress * 2.5)
      const blurIntensity = (1 - t) * 1
      const layers = 6
      const shadows: string[] = []
      for (let i = 1; i <= layers; i++) {
        const spread = blurIntensity * i * 4
        const a = 0.15 * (1 - t)
        shadows.push(`0 0 ${spread}px rgba(255,255,255,${a})`)
        shadows.push(`${spread * 0.7}px 0 ${spread}px rgba(255,255,255,${a * 0.5})`)
        shadows.push(`${-spread * 0.7}px 0 ${spread}px rgba(255,255,255,${a * 0.5})`)
      }
      blurShadows = shadows.join(', ')
    } else if (phase === 'hold') {
      scale = 1
      opacity = 1
      blurShadows = '0 2px 8px rgba(0,0,0,0.3)'
    } else {
      const t = easeInCubic(exitProgress)
      scale = 1 - t * 0.95 // 1 → 0.05
      opacity = 1 - t
      const blurIntensity = t * 1
      const layers = 6
      const shadows: string[] = []
      for (let i = 1; i <= layers; i++) {
        const spread = blurIntensity * i * 4
        const a = 0.15 * t
        shadows.push(`0 0 ${spread}px rgba(255,255,255,${a})`)
        shadows.push(`${spread * 0.5}px ${spread * 0.5}px ${spread}px rgba(255,255,255,${a * 0.3})`)
        shadows.push(`${-spread * 0.5}px ${-spread * 0.5}px ${spread}px rgba(255,255,255,${a * 0.3})`)
      }
      blurShadows = shadows.join(', ')
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          color,
          textShadow: blurShadows || 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function ZoomBlurTransitionComponent(props: MotionGraphicProps<ZoomBlurConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zoom-blur-transition',
  title: 'Kinetic Zoom Blur',
  description:
    'Words zoom in from massive scale with radial blur trails that sharpen to crisp text, then zoom out to vanish',
  tags: ['kinetic', 'typography', 'transition', 'zoom', 'blur', 'dramatic'],
  category: 'captions',
  component: ZoomBlurTransitionComponent as any,
  defaultConfig: {
    words: ['ZOOM', 'RUSH', 'SPEED', 'BLUR'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#0a1628',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ZOOM', 'RUSH', 'SPEED'], group: 'Content' },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1628', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
