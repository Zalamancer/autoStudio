import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FilmLeaderConfig extends KineticBaseConfig {
  countdownStyle: number
}

/** Deterministic pseudo-random */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Countdown circle sweep (fills clockwise per word cycle)
    const sweepAngle = (time % 1.2) / 1.2 * 360
    // Crosshair lines
    const cx = width / 2
    const cy = height / 2
    // Film leader sprocket holes on sides
    const sprocketCount = 6
    // Film grain jitter
    const jitterX = (rand(frame * 13) - 0.5) * 2
    const jitterY = (rand(frame * 17) - 0.5) * 1.5

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          transform: `translate(${jitterX}px, ${jitterY}px)`,
        }}
      >
        {/* Countdown circle outline */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: Math.min(width, height) * 0.55,
            height: Math.min(width, height) * 0.55,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.6)',
            pointerEvents: 'none',
          }}
        />
        {/* Sweep arc — fills like a clock hand */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: Math.min(width, height) * 0.55,
            height: Math.min(width, height) * 0.55,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `conic-gradient(from -90deg, rgba(255,255,255,0.12) 0deg, rgba(255,255,255,0.12) ${sweepAngle}deg, transparent ${sweepAngle}deg)`,
            pointerEvents: 'none',
          }}
        />
        {/* Crosshair vertical line */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '15%',
            bottom: '15%',
            width: 1,
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.4)',
            pointerEvents: 'none',
          }}
        />
        {/* Crosshair horizontal line */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '15%',
            right: '15%',
            height: 1,
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.4)',
            pointerEvents: 'none',
          }}
        />
        {/* Small center dot */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 6,
            height: 6,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.7)',
            pointerEvents: 'none',
          }}
        />
        {/* Sprocket holes — left side */}
        {Array.from({ length: sprocketCount }, (_, i) => (
          <div
            key={`l-${i}`}
            style={{
              position: 'absolute',
              left: 8,
              top: `${12 + i * (76 / (sprocketCount - 1))}%`,
              width: 12,
              height: 18,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Sprocket holes — right side */}
        {Array.from({ length: sprocketCount }, (_, i) => (
          <div
            key={`r-${i}`}
            style={{
              position: 'absolute',
              right: 8,
              top: `${12 + i * (76 / (sprocketCount - 1))}%`,
              width: 12,
              height: 18,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Film grain specks */}
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={`grain-${i}`}
            style={{
              position: 'absolute',
              left: `${rand(frame * 7 + i * 43) * 100}%`,
              top: `${rand(frame * 11 + i * 67) * 100}%`,
              width: 2,
              height: 2,
              borderRadius: '50%',
              background: rand(frame * 3 + i) > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let scale = 1

    if (phase === 'enter') {
      // Snap in — hard cut appearance like each frame of leader film
      const step = Math.floor(enterProgress * 4) / 4
      opacity = step > 0 ? 1 : 0
      scale = 2 - enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Very slight projector vibration
    } else {
      // Hard cut out
      const step = Math.floor((1 - exitProgress) * 3) / 3
      opacity = step > 0 ? 1 : 0
      scale = 1 + exitProgress * 0.5
    }

    // Gate weave
    const weaveX = Math.sin(f * 0.5) * 1.5
    const weaveY = Math.cos(f * 0.35) * 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${weaveX}px), calc(-50% + ${weaveY}px)) scale(${scale})`,
          opacity,
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(60px, 18vw, 220px)',
          fontWeight: 800,
          color,
          whiteSpace: 'nowrap',
          textShadow: '0 0 6px rgba(255,255,255,0.2)',
          letterSpacing: -2,
        }}
      >
        {word}
      </div>
    )
  },
}

function FilmLeaderComponent(props: MotionGraphicProps<FilmLeaderConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-film-leader',
  title: 'Kinetic Film Leader',
  description: 'Film countdown leader style with circle sweep, crosshair marks, sprocket holes, gate weave, and hard-cut number transitions',
  tags: ['kinetic', 'typography', 'film', 'leader', 'countdown', 'cinema', 'projector', 'crosshair'],
  category: 'captions',
  component: FilmLeaderComponent as any,
  defaultConfig: {
    words: ['5', '4', '3', '2', '1'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.2,
    countdownStyle: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['5', '4', '3', '2', '1'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.5, max: 5, group: 'Timing' },
    { key: 'countdownStyle', label: 'Countdown Style', type: 'number', defaultValue: 1, min: 1, max: 3, group: 'Animation' },
  ],
})
