import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MatchCutConfig extends KineticBaseConfig {
  shapeColor: string
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Shapes cycle: circle → square → diamond → triangle (each word gets one)
const SHAPE_SEQUENCE = ['circle', 'square', 'diamond', 'circle'] as const
type Shape = typeof SHAPE_SEQUENCE[number]

function renderShape(shape: Shape, progress: number, shapeColor: string, phase: string, size: number) {
  // Shape expands from center, then text is revealed through it — match cut geometry
  const shapeSize = size * (phase === 'enter' ? easeInOutCubic(progress) : phase === 'exit' ? 1 - easeInOutCubic(progress) : 1)

  if (shape === 'circle') {
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: shapeSize,
          height: shapeSize,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: `3px solid ${shapeColor}`,
          boxShadow: `0 0 20px ${shapeColor}50, inset 0 0 20px ${shapeColor}20`,
          pointerEvents: 'none',
        }}
      />
    )
  }
  if (shape === 'square') {
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: shapeSize,
          height: shapeSize,
          transform: 'translate(-50%, -50%)',
          border: `3px solid ${shapeColor}`,
          boxShadow: `0 0 20px ${shapeColor}50, inset 0 0 20px ${shapeColor}20`,
          pointerEvents: 'none',
        }}
      />
    )
  }
  if (shape === 'diamond') {
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: shapeSize * 0.85,
          height: shapeSize * 0.85,
          transform: 'translate(-50%, -50%) rotate(45deg)',
          border: `3px solid ${shapeColor}`,
          boxShadow: `0 0 20px ${shapeColor}50`,
          pointerEvents: 'none',
        }}
      />
    )
  }
  return null
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slow geometric grid lines — architectural feel
    const gridOffset = (time * 8) % 80

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Vertical grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 80px)`,
            backgroundPositionX: `${gridOffset}px`,
            pointerEvents: 'none',
          }}
        />
        {/* Horizontal grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 80px)`,
            backgroundPositionY: `${gridOffset}px`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const shapeIndex = index % SHAPE_SEQUENCE.length
    const shape = SHAPE_SEQUENCE[shapeIndex]
    const shapeColor = '#00DDFF'

    // Match cut: geometric shape expands to full size, word is revealed inside it
    // On exit, shape contracts and cuts to next shape (the "match")
    const shapeProgress = phase === 'enter' ? enterProgress : phase === 'exit' ? exitProgress : 1
    const maxShapeSize = Math.min(width * 0.85, 380)

    let wordOpacity = 0
    let wordScale = 1
    let wordClip = 'none'

    if (phase === 'enter') {
      // Word fades in as shape expands past 40%
      wordOpacity = enterProgress > 0.4 ? Math.min(1, (enterProgress - 0.4) / 0.3) : 0
      wordScale = 0.8 + easeInOutCubic(enterProgress) * 0.2
    } else if (phase === 'hold') {
      wordOpacity = 1
      wordScale = 1
    } else {
      // Word disappears before shape finishes contracting
      wordOpacity = exitProgress < 0.5 ? 1 - exitProgress / 0.5 * 0.7 : 0.3 - (exitProgress - 0.5) * 0.6
      wordOpacity = Math.max(0, wordOpacity)
      wordScale = 1 + exitProgress * 0.05
    }

    // Corner accent lines — 4 corners that draw in
    const cornerSize = 20 + easeInOutCubic(shapeProgress) * 20
    const cornerAlpha = phase === 'enter' ? easeInOutCubic(enterProgress) : phase === 'exit' ? 1 - easeInOutCubic(exitProgress) : 1

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Geometric shape outline */}
        {renderShape(shape, shapeProgress, shapeColor, phase, maxShapeSize)}

        {/* Corner bracket accents */}
        {[
          { top: '25%', left: '20%', borderTop: `2px solid rgba(255,255,255,${cornerAlpha * 0.4})`, borderLeft: `2px solid rgba(255,255,255,${cornerAlpha * 0.4})` },
          { top: '25%', right: '20%', borderTop: `2px solid rgba(255,255,255,${cornerAlpha * 0.4})`, borderRight: `2px solid rgba(255,255,255,${cornerAlpha * 0.4})` },
          { bottom: '25%', left: '20%', borderBottom: `2px solid rgba(255,255,255,${cornerAlpha * 0.4})`, borderLeft: `2px solid rgba(255,255,255,${cornerAlpha * 0.4})` },
          { bottom: '25%', right: '20%', borderBottom: `2px solid rgba(255,255,255,${cornerAlpha * 0.4})`, borderRight: `2px solid rgba(255,255,255,${cornerAlpha * 0.4})` },
        ].map((style, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: cornerSize,
              height: cornerSize,
              ...style,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${wordScale})`,
            opacity: wordOpacity,
            fontFamily: "'Futura', 'Century Gothic', 'Trebuchet MS', sans-serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            textShadow: `0 0 30px ${shapeColor}40`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MatchCutComponent(props: MotionGraphicProps<MatchCutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-match-cut',
  title: 'Kinetic Match Cut',
  description: 'Geometric shapes expand and contract around text to create visual match-cut transitions — circle, square, diamond cycling with corner accents',
  tags: ['kinetic', 'typography', 'match-cut', 'geometric', 'film', 'transition', 'cinematic'],
  category: 'captions',
  component: MatchCutComponent as any,
  defaultConfig: {
    words: ['MATCH', 'FORM', 'SHAPE', 'CUT'],
    colors: ['#FFFFFF', '#00DDFF', '#FFFFFF', '#00DDFF'],
    bgColor: '#050510',
    cycleDuration: 1.8,
    shapeColor: '#00DDFF',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MATCH', 'FORM', 'SHAPE', 'CUT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#00DDFF', '#FFFFFF', '#00DDFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 6, group: 'Timing' },
    { key: 'shapeColor', label: 'Shape Color', type: 'color', defaultValue: '#00DDFF', group: 'Animation' },
  ],
})
