import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DuotoneConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle gradient shift between the two duotone colors
    const splitPos = 50 + Math.sin(time * 0.5) * 5
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, rgba(255,255,255,0.03) ${splitPos}%, transparent ${splitPos}%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width }: WordRenderProps) => {
    // Two-tone palette: main color and its complement
    const toneA = color
    const toneB = '#F5F0E8' // warm off-white for editorial contrast

    let opacity = 1
    let clipX = 100 // percentage of text revealed (horizontal wipe)

    if (phase === 'enter') {
      // Horizontal wipe reveal
      clipX = enterProgress * 100
      opacity = 1
    } else if (phase === 'hold') {
      clipX = 100
      opacity = 1
    } else {
      // Reverse wipe out
      clipX = (1 - exitProgress) * 100
      opacity = 1
    }

    return (
      <>
        {/* Background tone layer (full word in tone B) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 700,
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: toneB,
            opacity: 0.15,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Foreground tone layer (clipped wipe in tone A) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 700,
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: toneA,
            clipPath: `inset(0 ${100 - clipX}% 0 0)`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Thin accent line */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + clamp(30px, 7vw, 90px))',
            left: '50%',
            transform: 'translate(-50%, 0)',
            width: `${clipX * 0.6}%`,
            maxWidth: 200,
            height: 2,
            background: toneA,
            opacity: phase === 'hold' ? 0.6 : clipX / 100 * 0.6,
          }}
        />
      </>
    )
  },
}

function DuotoneComponent(props: MotionGraphicProps<DuotoneConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-duotone',
  title: 'Kinetic Duotone',
  description: 'Clean editorial duotone aesthetic with horizontal wipe reveal using a strict two-color palette',
  tags: ['kinetic', 'typography', 'duotone', 'editorial', 'minimal', 'wipe'],
  category: 'captions',
  component: DuotoneComponent as any,
  defaultConfig: {
    words: ['DUOTONE', 'EDITORIAL', 'STYLE', 'CLEAN'],
    colors: ['#1A1A2E', '#E94560', '#0F3460', '#16213E'],
    bgColor: '#F5F0E8',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DUOTONE', 'EDITORIAL', 'STYLE', 'CLEAN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A2E', '#E94560', '#0F3460', '#16213E'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
