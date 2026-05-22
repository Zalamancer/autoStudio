import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MonochromeConfig extends KineticBaseConfig {}

/**
 * Convert hex to HSL components
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const { h, s } = hexToHsl(bgColor)
    const time = frame / fps
    const lightShift = Math.sin(time * 0.3) * 3

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg,
            hsl(${h}, ${s}%, ${15 + lightShift}%) 0%,
            hsl(${h}, ${s}%, ${10 + lightShift}%) 100%)`,
        }}
      >
        {/* Subtle vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.3) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    const { h, s } = hexToHsl(color)

    let opacity = 1
    let lightness = 70
    let scale = 1

    if (phase === 'enter') {
      // Start with lightest shade, darken to target
      opacity = enterProgress
      lightness = 95 - enterProgress * 25 // 95 -> 70
      scale = 0.96 + enterProgress * 0.04
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle shade shift during hold
      lightness = 70 + Math.sin(holdProgress * Math.PI * 2) * 8
    } else {
      opacity = 1 - exitProgress
      lightness = 70 - exitProgress * 20 // darken on exit
      scale = 1 - exitProgress * 0.04
    }

    const textColor = `hsl(${h}, ${s}%, ${lightness}%)`
    const shadowLight = `hsl(${h}, ${s}%, ${lightness + 15}%)`
    const shadowDark = `hsl(${h}, ${s * 0.6}%, ${lightness - 25}%)`

    return (
      <>
        {/* Accent line above text */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% - clamp(35px, 8vw, 100px))',
            left: '50%',
            transform: 'translate(-50%, 0)',
            width: phase === 'enter' ? `${enterProgress * 60}px` : phase === 'exit' ? `${(1 - exitProgress) * 60}px` : 60,
            height: 2,
            background: textColor,
            opacity: opacity * 0.5,
          }}
        />
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 300,
            fontFamily: "'Helvetica Neue', 'Segoe UI', sans-serif",
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: textColor,
            textShadow: `0 1px 0 ${shadowLight}, 0 -1px 0 ${shadowDark}`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Accent line below text */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + clamp(30px, 7vw, 90px))',
            left: '50%',
            transform: 'translate(-50%, 0)',
            width: phase === 'enter' ? `${enterProgress * 60}px` : phase === 'exit' ? `${(1 - exitProgress) * 60}px` : 60,
            height: 2,
            background: textColor,
            opacity: opacity * 0.5,
          }}
        />
      </>
    )
  },
}

function MonochromeComponent(props: MotionGraphicProps<MonochromeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-monochrome',
  title: 'Kinetic Monochrome',
  description: 'Sophisticated single-hue monochrome palette with shifting shade transitions and minimal accent lines',
  tags: ['kinetic', 'typography', 'monochrome', 'minimal', 'elegant', 'shade'],
  category: 'captions',
  component: MonochromeComponent as any,
  defaultConfig: {
    words: ['MONO', 'CHROME', 'SHADE', 'TONE'],
    colors: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF'],
    bgColor: '#1E3A5F',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MONO', 'CHROME', 'SHADE', 'TONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1E3A5F', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
