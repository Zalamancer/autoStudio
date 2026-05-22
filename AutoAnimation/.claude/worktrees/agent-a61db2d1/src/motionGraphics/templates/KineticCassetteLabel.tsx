import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CassetteLabelConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const casW = Math.min(width * 0.85, height * 1.4)
    const casH = casW * 0.63

    // Tape reel rotation
    const reelAngle = time * 90

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Cassette body */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: casW,
            height: casH,
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(180deg, #2a2a2a 0%, #1e1e1e 50%, #252525 100%)',
            borderRadius: 8,
            boxShadow: '0 6px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Screw holes — four corners */}
          {[
            { top: '6%', left: '5%' },
            { top: '6%', right: '5%' },
            { bottom: '6%', left: '5%' },
            { bottom: '6%', right: '5%' },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                ...pos,
                width: casW * 0.025,
                height: casW * 0.025,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #555 30%, #333 70%)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
              } as any}
            />
          ))}

          {/* Label area — J-card paper strip */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '12%',
              right: '12%',
              height: '44%',
              background: 'linear-gradient(180deg, #f4ead5 0%, #e8dcc4 100%)',
              borderRadius: 3,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Ruled lines on label */}
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '8%',
                  right: '8%',
                  top: `${20 + i * 16}%`,
                  height: 1,
                  background: 'rgba(100,140,200,0.2)',
                }}
              />
            ))}
            {/* "SIDE A" tiny text */}
            <div
              style={{
                position: 'absolute',
                top: '6%',
                right: '6%',
                fontFamily: "'Courier New', monospace",
                fontSize: casW * 0.018,
                color: '#888',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Side A
            </div>
          </div>

          {/* Tape window */}
          <div
            style={{
              position: 'absolute',
              bottom: '14%',
              left: '25%',
              right: '25%',
              height: '28%',
              background: 'linear-gradient(180deg, #0a0a0a, #111)',
              borderRadius: '4px 4px 20px 20px',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            {/* Reels */}
            {[{ left: '22%', dir: 1 }, { right: '22%', dir: -1 }].map((reel, ri) => (
              <div
                key={ri}
                style={{
                  position: 'absolute',
                  top: '50%',
                  ...reel,
                  width: casW * 0.09,
                  height: casW * 0.09,
                  borderRadius: '50%',
                  border: '2px solid #444',
                  transform: `translate(${reel.dir === 1 ? '-50%' : '50%'}, -50%) rotate(${reelAngle * reel.dir}deg)`,
                  background: 'radial-gradient(circle, #222 40%, #1a1a1a 60%, #333 100%)',
                } as any}
              >
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: '80%', height: 2, background: '#555', transform: `translate(-50%, -50%) rotate(${i * 60}deg)` }} />
                ))}
              </div>
            ))}
            {/* Tape ribbon */}
            <div style={{ position: 'absolute', top: '46%', left: '18%', right: '18%', height: 3, background: 'linear-gradient(90deg, #3a2a1a, #4a3520, #3a2a1a)' }} />
          </div>
        </div>
      </div>
    )
  },

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
    let opacity = 0
    let clipPercent = 0

    if (phase === 'enter') {
      // Pen writing reveal — left to right
      clipPercent = enterProgress * 100
      opacity = Math.min(1, enterProgress * 4)
    } else if (phase === 'hold') {
      clipPercent = 100
      opacity = 1
    } else {
      clipPercent = 100
      opacity = 1 - exitProgress
    }

    // Position text on the J-card label
    const casW = Math.min(width * 0.85, height * 1.4)

    return (
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          clipPath: `inset(0 ${100 - clipPercent}% 0 0)`,
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', 'Segoe Script', 'Comic Sans MS', cursive",
            fontSize: `clamp(18px, ${casW * 0.055}px, 48px)`,
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 1,
            transform: 'skewX(-1deg)',
            textShadow: '0 0 0 transparent',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function CassetteLabelComponent(props: MotionGraphicProps<CassetteLabelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cassette-label',
  title: 'Kinetic Cassette Label',
  description:
    'Cassette tape with rotating reels and J-card label. Handwritten track names appear pen-stroke by pen-stroke on the ruled label paper.',
  tags: ['kinetic', 'typography', 'cassette', 'tape', 'analog', 'music', 'handwritten', 'retro'],
  category: 'captions',
  component: CassetteLabelComponent as any,
  defaultConfig: {
    words: ['SIDE A', 'MIX TAPE', 'REWIND', 'PLAY'],
    colors: ['#2a3d5c', '#2a3d5c', '#2a3d5c', '#2a3d5c'],
    bgColor: '#1a1a2e',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SIDE A', 'MIX TAPE', 'REWIND', 'PLAY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2a3d5c', '#2a3d5c', '#2a3d5c', '#2a3d5c'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
