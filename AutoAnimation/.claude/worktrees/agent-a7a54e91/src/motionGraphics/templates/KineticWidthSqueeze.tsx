import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WidthSqueezeConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/**
 * Width Squeeze — font-width animates from ultra-condensed (scaleX ~0.3)
 * to expanded (scaleX ~1.6) then settles at normal. The text is visually
 * squished then springs open via horizontal scale, demonstrating optical
 * width as primary animation property.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Width guide lines */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          top: '50%',
          width: 2,
          height: '30%',
          background: 'rgba(255,255,255,0.06)',
          transform: 'translateY(-50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '8%',
          top: '50%',
          width: 2,
          height: '30%',
          background: 'rgba(255,255,255,0.06)',
          transform: 'translateY(-50%)',
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
    width,
    height,
  }: WordRenderProps) => {
    const fontSize = Math.min(width * 0.14, height * 0.18, 120)

    // scaleX value: from ultra-condensed (0.28) to expanded (1.55) to normal (1.0)
    let scaleX: number
    let opacity: number
    let scaleY: number
    let letterSpacing: string
    let fontStretch: string

    if (phase === 'enter') {
      if (enterProgress < 0.4) {
        // Phase 1: appear ultra-condensed
        const t = enterProgress / 0.4
        scaleX = 0.28 + t * 0.07 // stay very condensed
        opacity = t * 0.9
        scaleY = 1 + (1 - t) * 0.3 // tall when condensed
        letterSpacing = '-0.08em'
        fontStretch = 'ultra-condensed'
      } else {
        // Phase 2: spring open to expanded, then settle at normal
        const t = easeOutBack(Math.min(1, (enterProgress - 0.4) / 0.6))
        // 0.35 → 1.55 → 1.0 via overshoot
        scaleX = 0.35 + t * 1.2 // peaks at 1.55 with easeOutBack overshoot
        opacity = 1
        scaleY = 1 + (1 - Math.min(1, t * 1.3)) * 0.2
        const spacingEm = -0.08 + t * 0.12
        letterSpacing = `${spacingEm.toFixed(3)}em`
        fontStretch = t < 0.6 ? 'condensed' : t < 0.85 ? 'normal' : 'expanded'
      }
    } else if (phase === 'hold') {
      // Gentle width oscillation — very subtle, reads as "breathing"
      const osc = Math.sin(holdProgress * Math.PI * 2) * 0.04
      scaleX = 1.0 + osc
      opacity = 1
      scaleY = 1 - osc * 0.5
      letterSpacing = '0.03em'
      fontStretch = 'normal'
    } else {
      // Exit: compress back inward
      const t = easeInOutCubic(exitProgress)
      scaleX = 1.0 - t * 0.72 // back to condensed
      opacity = 1 - exitProgress * exitProgress
      scaleY = 1 + t * 0.2
      letterSpacing = `${(0.03 - t * 0.11).toFixed(3)}em`
      fontStretch = t > 0.5 ? 'condensed' : 'normal'
    }

    // Width label
    const widthLabel = Math.round(scaleX * 100)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize,
            fontWeight: 700,
            fontStretch,
            fontVariationSettings: `"wdth" ${Math.round(Math.max(25, Math.min(200, scaleX * 100)))}`,
            letterSpacing,
            textTransform: 'uppercase',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {word}
        </div>
        {phase !== 'exit' && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -fontSize * 0.35,
              transform: 'translateX(-50%) scaleX(' + (1 / scaleX) + ')',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color,
              opacity: 0.25,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            wdth {widthLabel}%
          </div>
        )}
      </div>
    )
  },
}

function WidthSqueezeComponent(props: MotionGraphicProps<WidthSqueezeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-width-squeeze',
  title: 'Width Squeeze',
  description:
    'Font-width animates from ultra-condensed to expanded with a springy overshoot, demonstrating optical width variation as the primary effect. Width axis value is shown as a typographic annotation.',
  tags: ['kinetic', 'typography', 'variable-font', 'font-width', 'condensed', 'expanded', 'squeeze', 'craft'],
  category: 'captions',
  component: WidthSqueezeComponent as any,
  defaultConfig: {
    words: ['EXPAND', 'STRETCH', 'WIDE', 'SLIM'],
    colors: ['#ffffff', '#e0e0e0', '#ffffff', '#cccccc'],
    bgColor: '#0a0a0a',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EXPAND', 'STRETCH', 'WIDE', 'SLIM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#e0e0e0', '#ffffff', '#cccccc'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 1.0, max: 6, group: 'Timing' },
  ],
})
