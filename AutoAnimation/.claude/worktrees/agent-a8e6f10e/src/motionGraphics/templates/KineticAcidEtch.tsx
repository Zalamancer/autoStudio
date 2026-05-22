import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AcidEtchConfig extends KineticBaseConfig {
  etchDepth: number
  drip: boolean
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Metal plate texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(200,200,220,0.03) 0px, rgba(200,200,220,0.03) 1px, transparent 1px, transparent 8px)',
          }}
        />
        {/* Acid warning */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            opacity: 0.2,
            fontFamily: 'monospace',
            fontSize: 8,
            color: '#FFCC44',
            letterSpacing: 1,
          }}
        >
          ⚠ FeCl₃ ETCH
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    let etchP = 0
    let liftP = 0

    if (phase === 'enter') {
      etchP = easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      etchP = 1
    } else {
      etchP = 1
      liftP = easeInCubic(exitProgress)
    }

    const seed = index * 89

    // Resist mask layer — applied as outline first
    const resistOpacity = Math.min(1, etchP / 0.2) * Math.max(0, 1 - (etchP - 0.2) / 0.3)
    // Etch front — acid eats away the exposed metal, revealing the resist-protected text
    const etchFrontP = Math.max(0, (etchP - 0.15) / 0.65)
    // Intaglio result — recessed text with dark shadow
    const intaglioP = Math.max(0, (etchP - 0.8) / 0.2)

    // Acid drip particles
    const drips = []
    const dripCount = 15
    for (let d = 0; d < dripCount; d++) {
      const p0 = pseudo(seed + d * 17)
      const p1 = pseudo(seed + d * 11 + 1)
      const p2 = pseudo(seed + d * 7 + 2)

      const dripDelay = p2 * 0.5
      const localDripP = Math.max(0, Math.min(1, (etchFrontP - dripDelay) / (1 - dripDelay + 0.01)))
      if (localDripP <= 0) continue

      const dripX = (p0 - 0.5) * width * 0.8
      // Drips run vertically, near the etch front
      const dripLength = 10 + p1 * 30
      const dripY = (p1 - 0.5) * height * 0.5 + localDripP * dripLength

      drips.push(
        <div
          key={d}
          style={{
            position: 'absolute',
            left: `calc(50% + ${dripX}px)`,
            top: `calc(50% + ${dripY}px)`,
            width: 3,
            height: dripLength * localDripP,
            background: `rgba(120,200,80,${0.4 + p0 * 0.3})`,
            borderRadius: '0 0 50% 50%',
            transform: 'translateX(-50%)',
            opacity: Math.min(1, localDripP * 3) * (1 - liftP),
          }}
        />,
      )
    }

    return (
      <>
        {drips}
        {/* Resist layer — yellow photoresist outline */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, resistOpacity),
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 13vw, 168px)',
              fontWeight: 900,
              color: 'transparent',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              WebkitTextStroke: '3px #DDCC44',
            }}
          >
            {word}
          </span>
        </div>

        {/* Etched copper halo */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${1 + etchFrontP * 0.08})`,
            opacity: easeOutCubic(etchFrontP) * 0.6 * (1 - intaglioP) * (1 - liftP),
            whiteSpace: 'nowrap',
            filter: `blur(${Math.max(0, (1 - etchFrontP) * 4)}px)`,
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 13vw, 168px)',
              fontWeight: 900,
              color: '#C87040',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        </div>

        {/* Final etched intaglio — deep recessed text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${liftP * -height * 0.1}px)`,
            opacity: Math.max(0, easeOutCubic(intaglioP) * (1 - liftP)),
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 13vw, 168px)',
              fontWeight: 900,
              color,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textShadow: `1px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(255,255,255,0.1)`,
            }}
          >
            {word}
          </span>
        </div>
      </>
    )
  },
}

function AcidEtchComponent(props: MotionGraphicProps<AcidEtchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-acid-etch',
  title: 'Kinetic Acid Etch',
  description:
    'Ferric chloride etching: yellow photoresist outlines the text, acid drips corrode the exposed copper-colored metal around it, and the protected text emerges in deep relief.',
  tags: [
    'kinetic',
    'typography',
    'acid',
    'etch',
    'ferric',
    'chloride',
    'chemistry',
    'process',
    'metal',
    'intaglio',
    'build',
  ],
  category: 'captions',
  component: AcidEtchComponent as any,
  defaultConfig: {
    words: ['ETCH', 'CORRODE', 'REVEAL', 'RESIST'],
    colors: ['#CCDDCC', '#AABBAA', '#DDEEDD', '#BBCCBB'],
    bgColor: '#1A1205',
    cycleDuration: 2.4,
    etchDepth: 1,
    drip: true,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ETCH', 'CORRODE', 'REVEAL', 'RESIST'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#CCDDCC', '#AABBAA', '#DDEEDD', '#BBCCBB'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1205', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.4,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
    { key: 'etchDepth', label: 'Etch Depth', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
    { key: 'drip', label: 'Show Drips', type: 'boolean', defaultValue: true, group: 'Animation' },
  ],
})
