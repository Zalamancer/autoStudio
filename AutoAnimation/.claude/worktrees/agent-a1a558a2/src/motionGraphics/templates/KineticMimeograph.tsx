import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MimeographConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Mimeograph paper texture — cheap pulp paper with slight yellowing
    const fibers: React.ReactNode[] = []
    for (let i = 0; i < 20; i++) {
      const x = hash(i * 39 + 11) * 100
      const y = hash(i * 57 + 23) * 100
      const len = 15 + hash(i * 21) * 30
      const angle = hash(i * 63) * 180
      fibers.push(
        <div
          key={`fiber-${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: len,
            height: 1,
            background: `rgba(180,170,150,${0.04 + hash(i * 33) * 0.03})`,
            transform: `rotate(${angle}deg)`,
          }}
        />
      )
    }

    // Ghost impressions from previous copies
    const ghostTexts: React.ReactNode[] = []
    for (let i = 0; i < 3; i++) {
      const x = 30 + hash(i * 47 + 5) * 40
      const y = 25 + hash(i * 61 + 17) * 50
      ghostTexts.push(
        <div
          key={`ghost-${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: 60 + hash(i * 31) * 80,
            height: 3,
            background: `rgba(100,60,130,${0.02 + hash(i * 29) * 0.015})`,
            borderRadius: 1,
            transform: `rotate(${hash(i * 43) * 4 - 2}deg)`,
          }}
        />
      )
    }

    // Roller drum hint at top
    const drumPhase = (time * 2) % 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Cheap paper grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 4px,
              rgba(160,150,130,0.015) 4px,
              rgba(160,150,130,0.015) 5px
            )`,
          }}
        />
        {fibers}
        {ghostTexts}
        {/* Roller drum shadow at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'linear-gradient(to bottom, rgba(100,60,130,0.04), transparent)',
          }}
        />
        {/* Paper edge — slightly off-center as typical of mimeograph */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 2px 1px 0 rgba(0,0,0,0.015), inset -1px 0 0 rgba(0,0,0,0.01)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const f = frame ?? 0

    // Mimeograph: each copy gets progressively lighter/more blurred
    // Simulate this with fading purple ink
    const copyNumber = index % 4 // which "copy" in the run
    const copyFade = 1 - copyNumber * 0.1 // later copies are fainter

    const renderedChars = chars.map((ch, ci) => {
      const charSeed = ci * 67 + index * 43
      const charDelay = ci / (chars.length + 1) * 0.25

      // Registration wobble — mimeo copies are never perfectly aligned
      const regOffsetX = (hash(charSeed + 5) - 0.5) * 2
      const regOffsetY = (hash(charSeed + 11) - 0.5) * 1.5
      const inkBleed = 0.3 + hash(charSeed + 17) * 0.5

      let opacity = 0
      let blur = 0
      let yOffset = 0
      let inkDensity = 0

      if (phase === 'enter') {
        // Text emerges from the drum — top-to-bottom reveal
        const cp = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.4)))
        opacity = Math.min(cp / 0.2, 1) * copyFade
        blur = (1 - cp) * 2.5
        yOffset = (1 - cp) * 10
        inkDensity = cp * copyFade
      } else if (phase === 'hold') {
        opacity = copyFade
        blur = 0.4 + (1 - copyFade) * 0.5 // copies get blurrier
        yOffset = 0
        inkDensity = copyFade
      } else {
        const cp = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.15) / 0.85))
        opacity = copyFade * (1 - cp * 0.8)
        blur = 0.4 + cp * 2
        yOffset = cp * -12
        inkDensity = copyFade * (1 - cp * 0.4)
      }

      // Spirit duplicator purple ink
      const purpleIntensity = inkDensity * 0.7
      const shadows = [
        `${regOffsetX}px ${regOffsetY}px 0 rgba(100,50,140,${purpleIntensity * 0.15})`,
        `0 0 ${inkBleed * 2}px rgba(100,50,140,${purpleIntensity * 0.1})`,
      ].join(', ')

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity,
            color,
            transform: `translate(${regOffsetX}px, ${yOffset + regOffsetY}px)`,
            textShadow: shadows,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            transition: 'none',
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 400,
          letterSpacing: 3,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}
      >
        {renderedChars}
      </div>
    )
  },
}

function MimeographComponent(props: MotionGraphicProps<MimeographConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mimeograph',
  title: 'Kinetic Mimeograph',
  description:
    'Mimeograph/spirit duplicator with fading purple ink copies, slightly blurred registration, ghost impressions, and cheap paper texture',
  tags: ['kinetic', 'typography', 'mimeograph', 'spirit', 'duplicator', 'purple', 'school', 'retro', 'office', 'copy'],
  category: 'captions',
  component: MimeographComponent as any,
  defaultConfig: {
    words: ['COPY', 'MEMO', 'FILE', 'PASS'],
    colors: ['#4a2870', '#5c3490', '#4a2870', '#6b40a8'],
    bgColor: '#f2ede4',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COPY', 'MEMO', 'FILE', 'PASS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#4a2870', '#5c3490', '#4a2870', '#6b40a8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f2ede4', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
