import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TypeSampleConfig extends KineticBaseConfig {}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Type specimen: render the word at multiple sizes, then converge to one
const SPECIMEN_SIZES_FACTOR = [0.12, 0.22, 0.36, 0.54, 0.76, 1.0] // relative to final size

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Subtle baseline rule */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          bottom: '22%',
          height: 1,
          background: 'rgba(255,255,255,0.06)',
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
    const finalFontSize = Math.min(width * 0.18, height * 0.22, 140)
    const centerX = width / 2
    const centerY = height / 2

    // Vertical positions for each specimen copy — spread top-to-bottom
    const specimenCount = SPECIMEN_SIZES_FACTOR.length
    const spreadRange = height * 0.6
    const baseY = centerY - spreadRange / 2

    const els: React.ReactNode[] = []

    for (let i = 0; i < specimenCount; i++) {
      const sizeFactor = SPECIMEN_SIZES_FACTOR[i]
      const fontSize = finalFontSize * sizeFactor
      const isLargest = i === specimenCount - 1

      // Converged Y: all snap to center
      const specimenSpreadY = baseY + (spreadRange / (specimenCount - 1)) * i
      const specimenConvergedY = centerY

      // During enter: letters are spread, converging to center
      let y: number
      let opacity: number
      let scale: number = 1

      if (phase === 'enter') {
        const t = easeInOutQuart(enterProgress)
        y = specimenSpreadY + (specimenConvergedY - specimenSpreadY) * t
        // Smaller copies fade out as they converge, largest fades in
        if (isLargest) {
          opacity = enterProgress
          scale = 0.6 + easeOutBack(enterProgress) * 0.4
        } else {
          opacity = 1 - easeInOutQuart(enterProgress)
        }
      } else if (phase === 'hold') {
        y = specimenConvergedY
        opacity = isLargest ? 1 : 0
        if (isLargest) {
          scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.015
        }
      } else {
        y = specimenConvergedY
        if (isLargest) {
          // Final copy: expand and fade
          scale = 1 + exitProgress * 0.2
          opacity = 1 - exitProgress
        } else {
          opacity = 0
        }
      }

      if (opacity <= 0.01) continue

      // Type specimen: show size label below smaller copies during enter
      const showLabel = !isLargest && phase === 'enter' && opacity > 0.1
      const ptSize = Math.round(fontSize * 0.75)

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: centerX,
            top: y,
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize,
            fontWeight: isLargest ? 900 : 400,
            color,
            letterSpacing: isLargest ? '0.04em' : '0.02em',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {word}
          {showLabel && (
            <span
              style={{
                display: 'block',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: Math.max(8, fontSize * 0.22),
                fontWeight: 400,
                color: `rgba(200,200,200,0.4)`,
                letterSpacing: '0.15em',
                textAlign: 'right',
                marginTop: 2,
              }}
            >
              {ptSize}pt
            </span>
          )}
        </div>
      )
    }

    return <div style={{ position: 'absolute', inset: 0 }}>{els}</div>
  },
}

function TypeSampleComponent(props: MotionGraphicProps<TypeSampleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-type-sample',
  title: 'Type Sample',
  description:
    'Type specimen layout: the word appears simultaneously at 6 sizes from tiny to large, each labelled with its point size. All copies converge and collapse into the final large-scale word.',
  tags: ['kinetic', 'typography', 'type-specimen', 'sizes', 'grid', 'typesetting', 'editorial'],
  category: 'captions',
  component: TypeSampleComponent as any,
  defaultConfig: {
    words: ['SERIF', 'SCALE', 'POINT', 'SIZE'],
    colors: ['#F8F4EF', '#E8D5B0', '#D4A853', '#FFFFFF'],
    bgColor: '#1a1510',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SERIF', 'SCALE', 'POINT', 'SIZE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F8F4EF', '#E8D5B0', '#D4A853', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1510', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.8,
      max: 6,
      group: 'Timing',
    },
  ],
})
