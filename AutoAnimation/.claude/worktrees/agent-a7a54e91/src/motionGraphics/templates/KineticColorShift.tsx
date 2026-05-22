import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ColorShiftConfig extends KineticBaseConfig {
  shiftSpeed: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function lerpColor(a: string, b: string, t: number): string {
  const parseHex = (h: string) => {
    const hex = h.replace('#', '')
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
  }
  const [r1, g1, b1] = parseHex(a)
  const [r2, g2, b2] = parseHex(b)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const blue = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${blue})`
}

const neonPalette = ['#FF006E', '#8338EC', '#3A86FF', '#06D6A0', '#FFBE0B', '#FF006E']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = (frame / fps) * 0.3
    const idx = Math.floor(t % (neonPalette.length - 1))
    const frac = t % 1
    const bgTint = lerpColor(neonPalette[idx], neonPalette[idx + 1] || neonPalette[0], frac)
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, ${bgTint}15 0%, transparent 70%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let currentColor = color

    if (phase === 'enter') {
      opacity = easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      opacity = 1
      // Cycle through neon palette during hold
      const palLen = neonPalette.length - 1
      const cyclePos = holdProgress * palLen * 2
      const idx = Math.floor(cyclePos % palLen)
      const frac = cyclePos % 1
      currentColor = lerpColor(neonPalette[idx], neonPalette[(idx + 1) % neonPalette.length], frac)
    } else {
      opacity = 1 - easeInCubic(exitProgress)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 800,
          color: currentColor,
          textShadow: `0 0 30px ${currentColor}66, 0 0 60px ${currentColor}33`,
          whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}
      >
        {word}
      </div>
    )
  },
}

function ColorShiftComponent(props: MotionGraphicProps<ColorShiftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-color-shift',
  title: 'Kinetic Color Shift',
  description: 'Smooth neon color cycling text that flows through a vibrant palette with glowing effect',
  tags: ['kinetic', 'typography', 'color', 'neon', 'gradient', 'cycling'],
  category: 'captions',
  component: ColorShiftComponent as any,
  defaultConfig: {
    words: ['VIBE', 'CHECK', 'LETS', 'GO'],
    colors: ['#FF006E', '#8338EC', '#3A86FF', '#06D6A0'],
    bgColor: '#0D0D0D',
    cycleDuration: 1.2,
    shiftSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VIBE', 'CHECK', 'LETS', 'GO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF006E', '#8338EC', '#3A86FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0D0D', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'shiftSpeed', label: 'Shift Speed', type: 'number', defaultValue: 1, min: 0.2, max: 3, group: 'Animation' },
  ],
})
