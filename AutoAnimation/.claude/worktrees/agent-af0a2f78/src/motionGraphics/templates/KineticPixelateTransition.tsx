import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PixelateConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const scanlineY = ((frame / fps) * 100) % 110
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scanlineY}%`,
            height: 2,
            background: 'rgba(0,255,65,0.08)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const pixelIntensity =
      phase === 'enter' ? 1 - easeOutCubic(enterProgress) : phase === 'exit' ? easeOutCubic(exitProgress) : 0

    const opacity = phase === 'enter' ? Math.min(1, enterProgress * 2) : phase === 'exit' ? 1 - exitProgress : 1

    // Generate offset shadow copies to simulate pixelation
    const copies = 8
    const shadows: string[] = []
    for (let i = 0; i < copies; i++) {
      const offsetX = (pseudoRandom(index * 50 + i * 7 + 1) - 0.5) * pixelIntensity * 20
      const offsetY = (pseudoRandom(index * 50 + i * 7 + 2) - 0.5) * pixelIntensity * 20
      const a = pixelIntensity * 0.6
      shadows.push(`${offsetX}px ${offsetY}px 0 rgba(0,255,65,${a})`)
    }

    const letterSpacing = pixelIntensity * 15
    const blurAmount = pixelIntensity * 3

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
          opacity,
          fontFamily: "'Courier New', 'Consolas', monospace",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          color,
          letterSpacing: letterSpacing,
          textShadow: shadows.length > 0 && pixelIntensity > 0.05 ? shadows.join(', ') : '0 0 10px rgba(0,255,65,0.4)',
          filter: blurAmount > 0.2 ? `blur(${blurAmount}px)` : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function PixelateTransitionComponent(props: MotionGraphicProps<PixelateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pixelate-transition',
  title: 'Kinetic Pixelate',
  description: 'Matrix-style pixelation — words resolve from scattered digital noise to sharp text and dissolve back',
  tags: ['kinetic', 'typography', 'transition', 'pixel', 'matrix', 'digital'],
  category: 'captions',
  component: PixelateTransitionComponent as any,
  defaultConfig: {
    words: ['DECODE', 'PIXEL', 'MATRIX', 'DATA'],
    colors: ['#00FF41', '#00FF41', '#00FF41', '#00FF41'],
    bgColor: '#000000',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DECODE', 'PIXEL', 'MATRIX'], group: 'Content' },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FF41', '#00FF41', '#00FF41'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
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
