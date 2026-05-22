import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OpticalSizeConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

/**
 * Optical Size Shift — animates font-optical-size (opsz axis) from caption/small
 * sizes (6pt characteristics: high contrast, thin strokes, open apertures) to
 * display sizes (72pt: bold, tighter, more expressive). The transition is
 * combined with actual font size change, letterSpacing, and contrast shift
 * to mimic how optical sizing actually changes a typeface's personality.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
  }: WordRenderProps) => {
    // Caption optical size: small, light, open letterSpacing
    // Display optical size: large, heavy, tight
    let opsz: number // 6 (caption) → 72 (display)
    let fontWeight: number
    let letterSpacing: string
    let fontSize: number
    let opacity: number
    let textShadow: string

    const maxFontSize = Math.min(width * 0.16, height * 0.20, 140)
    const minFontSize = maxFontSize * 0.45

    if (phase === 'enter') {
      // Enter: shift from caption (small) to display (large)
      // First 30%: appear at caption size with light weight
      // 30-100%: grow to display
      if (enterProgress < 0.3) {
        const t = enterProgress / 0.3
        opsz = 6 + t * 8
        fontWeight = 200 + Math.round(t * 100)
        letterSpacing = '0.12em'
        fontSize = minFontSize * (0.5 + t * 0.5)
        opacity = t * 0.8
        textShadow = 'none'
      } else {
        const t = easeOutExpo((enterProgress - 0.3) / 0.7)
        opsz = 14 + t * 58 // 14 → 72
        fontWeight = Math.round(300 + t * 500) // 300 → 800
        const spacingEm = 0.12 - t * 0.14 // 0.12 → -0.02
        letterSpacing = `${spacingEm.toFixed(3)}em`
        fontSize = minFontSize + t * (maxFontSize - minFontSize)
        opacity = 0.8 + t * 0.2
        // Subtle text shadow grows with display size
        const shadowBlur = t * 20
        textShadow = `0 0 ${shadowBlur}px ${color}22`
      }
    } else if (phase === 'hold') {
      // Hold at display size with subtle opsz micro-oscillation
      const osc = Math.sin(holdProgress * Math.PI * 4) * 2
      opsz = 70 + osc
      fontWeight = 800
      letterSpacing = '-0.02em'
      fontSize = maxFontSize
      opacity = 1
      textShadow = `0 0 ${15 + osc}px ${color}18`
    } else {
      // Exit: collapse back toward caption
      const t = easeInExpo(exitProgress)
      opsz = 72 - t * 60
      fontWeight = Math.round(800 - t * 600)
      const spacingEm = -0.02 + t * 0.14
      letterSpacing = `${spacingEm.toFixed(3)}em`
      fontSize = maxFontSize - t * (maxFontSize - minFontSize)
      opacity = 1 - t * t
      textShadow = 'none'
    }

    const opszRound = Math.round(Math.max(6, Math.min(72, opsz)))
    const labelOpacity = phase === 'hold' ? 0.2 : phase === 'enter' && enterProgress > 0.6 ? (enterProgress - 0.6) / 0.4 * 0.2 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
            fontSize,
            fontWeight,
            letterSpacing,
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
            textShadow,
            // optical-size axis
            fontVariationSettings: `"opsz" ${opszRound}`,
          }}
        >
          {word}
        </div>
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: -20,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color,
            opacity: labelOpacity,
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
          }}
        >
          opsz {opszRound}pt
        </div>
      </div>
    )
  },
}

function OpticalSizeComponent(props: MotionGraphicProps<OpticalSizeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-optical-size',
  title: 'Optical Size Shift',
  description:
    'Animates the opsz (optical size) axis from caption characteristics (light, open, small) to display characteristics (heavy, tight, large). Font weight, letter-spacing, and size all shift in concert to demonstrate optical sizing.',
  tags: ['kinetic', 'typography', 'variable-font', 'optical-size', 'opsz', 'display', 'caption', 'craft', 'serif'],
  category: 'captions',
  component: OpticalSizeComponent as any,
  defaultConfig: {
    words: ['DISPLAY', 'OPTICAL', 'CAPTION', 'SIZE'],
    colors: ['#1a0a00', '#2d1600', '#1a0a00', '#3d2000'],
    bgColor: '#fdf6ec',
    cycleDuration: 2.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DISPLAY', 'OPTICAL', 'CAPTION', 'SIZE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a0a00', '#2d1600', '#1a0a00', '#3d2000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fdf6ec', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.4, min: 1.2, max: 6, group: 'Timing' },
  ],
})
