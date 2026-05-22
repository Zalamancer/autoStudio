import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DesignerParadeConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

/**
 * Designer Parade — each word is rendered in a different historically
 * significant typeface with its designer era label. As words cycle, the
 * entire typographic character changes: the visual rhythm, weight distribution,
 * and personality of each typeface is distinct. This is a love letter to
 * type history — Garamond's oldstyle, Bodoni's contrast, Futura's geometry,
 * Gill's humanity, Helvetica's neutrality, Optima's flared stems.
 */

const TYPEFACE_SHOWCASE = [
  {
    family: "'Garamond', 'EB Garamond', 'Times New Roman', serif",
    weight: 400,
    label: "oldstyle · 1540s",
    letterSpacing: '0.04em',
    style: 'normal',
  },
  {
    family: "'Didot', 'Bodoni MT', 'Times New Roman', serif",
    weight: 700,
    label: "modern · 1780s",
    letterSpacing: '-0.01em',
    style: 'normal',
  },
  {
    family: "'Futura', 'Century Gothic', 'Helvetica Neue', sans-serif",
    weight: 400,
    label: "geometric · 1927",
    letterSpacing: '0.08em',
    style: 'normal',
  },
  {
    family: "'Gill Sans', 'Gill Sans MT', 'Calibri', sans-serif",
    weight: 600,
    label: "humanist · 1928",
    letterSpacing: '0.02em',
    style: 'normal',
  },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Subtle ruled line — like a type specimen book */}
      <div
        style={{
          position: 'absolute',
          left: '6%',
          right: '6%',
          bottom: '28%',
          height: 0.5,
          background: 'rgba(100,100,100,0.12)',
        }}
      />
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
  }: WordRenderProps) => {
    // Use index to cycle through typefaces
    const typeface = TYPEFACE_SHOWCASE[index % TYPEFACE_SHOWCASE.length]
    const fontSize = Math.min(width * 0.15, height * 0.19, 138)

    let opacity: number
    let translateY: number = 0
    let scale: number = 1

    if (phase === 'enter') {
      // Slide up from below — like a type specimen being slid into view
      const t = easeOutCubic(enterProgress)
      opacity = Math.min(1, enterProgress * 2.5)
      translateY = (1 - t) * height * 0.15
    } else if (phase === 'hold') {
      opacity = 1
      // Micro: very slow vertical settle (optical alignment feeling)
      translateY = Math.sin(holdProgress * Math.PI) * -4
    } else {
      const t = easeInQuad(exitProgress)
      opacity = 1 - t
      translateY = -t * height * 0.12
    }

    const labelFadeIn = phase === 'hold'
      ? Math.min(1, holdProgress / 0.25) * 0.28
      : phase === 'enter' ? enterProgress * 0.12 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          textAlign: 'center',
        }}
      >
        {/* Main word in historical typeface */}
        <div
          style={{
            fontFamily: typeface.family,
            fontSize,
            fontWeight: typeface.weight,
            fontStyle: typeface.style as 'normal' | 'italic',
            letterSpacing: typeface.letterSpacing,
            textTransform: 'uppercase',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {word}
        </div>

        {/* Era label */}
        <div
          style={{
            marginTop: fontSize * 0.25,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color,
            opacity: labelFadeIn,
            letterSpacing: '0.16em',
            textTransform: 'lowercase',
          }}
        >
          {typeface.label}
        </div>
      </div>
    )
  },
}

function DesignerParadeComponent(props: MotionGraphicProps<DesignerParadeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-designer-parade',
  title: 'Designer Parade',
  description:
    'Each word cycles through a historically significant typeface — oldstyle, modern, geometric, humanist — with its era label. A type specimen come to life: the visual personality of each era displayed in sequence.',
  tags: ['kinetic', 'typography', 'multi-font', 'history', 'type-specimen', 'parade', 'serif', 'sans', 'craft'],
  category: 'captions',
  component: DesignerParadeComponent as any,
  defaultConfig: {
    words: ['CRAFT', 'FORM', 'ORDER', 'PURE'],
    colors: ['#1c1c1c', '#2a2a2a', '#1c1c1c', '#2a2a2a'],
    bgColor: '#f4f1eb',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CRAFT', 'FORM', 'ORDER', 'PURE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1c1c1c', '#2a2a2a', '#1c1c1c', '#2a2a2a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f4f1eb', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 1.5, max: 6, group: 'Timing' },
  ],
})
