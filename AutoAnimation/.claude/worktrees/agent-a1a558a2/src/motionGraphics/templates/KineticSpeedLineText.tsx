import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpeedLineTextConfig extends KineticBaseConfig {}

// Manga speed lines radiate from text with action impact.
// Speed lines are drawn as radial stripes emanating from the text center —
// they blast outward on entry, hold vibrating, then collapse inward on exit.

const LINES = 32  // number of radial lines

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slow rotation on the ambient line field — gives energy without being distracting
    const rot = time * 8
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Slow-rotating ambient speed lines filling the whole panel */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '220%',
            height: '220%',
            transform: `translate(-50%, -50%) rotate(${rot}deg)`,
            backgroundImage: `repeating-conic-gradient(
              from 0deg,
              rgba(0,0,0,0.045) 0deg,
              rgba(0,0,0,0.045) 2deg,
              transparent 2deg,
              transparent ${360 / LINES}deg
            )`,
          }}
        />
        {/* Halftone texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
            backgroundSize: '9px 9px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame = 0 }: WordRenderProps) => {
    const seed = index * 59 + 11

    let textScale = 1
    let textOpacity = 0
    let lineLength = 0    // 0..1 fraction of max line length
    let lineOpacity = 0

    const maxLineLen = Math.max(width, height) * 0.75

    if (phase === 'enter') {
      // Lines blast out fast; text slams in right behind
      const eased = enterProgress < 0.5
        ? 2 * enterProgress * enterProgress
        : 1 - Math.pow(-2 * enterProgress + 2, 2) / 2
      lineLength = eased
      lineOpacity = Math.min(1, enterProgress * 4)
      textScale = 0.4 + eased * 0.6
      textOpacity = Math.min(1, (enterProgress - 0.2) / 0.4)
    } else if (phase === 'hold') {
      lineLength = 1
      lineOpacity = 0.85
      // Subtle pulse on lines
      const pulse = 1 + Math.sin((frame / 30) * 3 + seed) * 0.04
      textScale = pulse
      textOpacity = 1
    } else {
      // Lines retract; text shrinks back
      lineLength = 1 - exitProgress
      lineOpacity = 1 - exitProgress
      textScale = 1 - exitProgress * 0.3
      textOpacity = 1 - exitProgress * 1.5
    }

    const tilt = ((seed % 5) - 2) * 3

    // Build radial lines as absolutely positioned divs
    const lines: React.ReactNode[] = []
    for (let i = 0; i < LINES; i++) {
      const angle = (i / LINES) * 360
      const len = maxLineLen * lineLength
      // Vary thickness per line for natural manga look
      const thickness = 1 + ((seed + i * 7) % 4)
      const opacity = lineOpacity * (0.55 + ((seed + i * 3) % 10) * 0.04)

      lines.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${len}px`,
            height: `${thickness}px`,
            background: `rgba(0,0,0,${opacity})`,
            transformOrigin: '0 50%',
            transform: `rotate(${angle}deg)`,
            borderRadius: `0 ${thickness}px ${thickness}px 0`,
          }}
        />
      )
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
        }}
      >
        {/* Speed lines container — centered at text */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 }}>
          {lines}
        </div>

        {/* The text itself — on top of speed lines */}
        <div
          style={{
            position: 'relative',
            transform: `rotate(${tilt}deg) scale(${textScale})`,
            transformOrigin: 'center center',
            opacity: Math.max(0, textOpacity),
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(52px, 14vw, 185px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            fontStyle: 'italic',
            color: color,
            WebkitTextStroke: '3px #000000',
            textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            userSelect: 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function SpeedLineTextComponent(props: MotionGraphicProps<SpeedLineTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-speed-line-text',
  title: 'Kinetic Speed Line Text',
  description: 'Manga speed lines radiate outward from the text on impact — lines blast out as text slams in, then retract on exit — pure manga action panel energy',
  tags: ['kinetic', 'typography', 'comic', 'manga', 'speed-lines', 'radial', 'action', 'impact', 'blast'],
  category: 'captions',
  component: SpeedLineTextComponent as any,
  defaultConfig: {
    words: ['DASH!', 'ZOOM!', 'RUSH!', 'GO!'],
    colors: ['#FF2200', '#FF8800', '#FFCC00', '#0055FF'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DASH!', 'ZOOM!', 'RUSH!', 'GO!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FF2200', '#FF8800', '#FFCC00', '#0055FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.4, max: 5, group: 'Timing' },
  ],
})
