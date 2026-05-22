import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SidewalkChalkConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Concrete sidewalk texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle 0.5px, rgba(0,0,0,0.06) 0%, transparent 100%)',
          backgroundSize: '3px 3px',
        }}
      />

      {/* Sidewalk panel seam lines */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '25%',
          width: 2,
          height: '100%',
          background: 'rgba(0,0,0,0.08)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '75%',
          width: 2,
          height: '100%',
          background: 'rgba(0,0,0,0.08)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '33%',
          height: 2,
          width: '100%',
          background: 'rgba(0,0,0,0.06)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '66%',
          height: 2,
          width: '100%',
          background: 'rgba(0,0,0,0.06)',
        }}
      />

      {/* Rain smudge / water stain */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '20%',
          width: '25%',
          height: '30%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.04) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(6px)',
        }}
      />

      {/* Dried leaf stain */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '12%',
          width: 20,
          height: 16,
          borderRadius: '50% 0 50% 0',
          background: 'rgba(80,60,30,0.06)',
          transform: 'rotate(30deg)',
        }}
      />

      {/* Kid's doodle elements — small chalk drawings */}
      {/* Star */}
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: '8%',
          fontFamily: 'sans-serif',
          fontSize: 20,
          color: 'rgba(255,200,100,0.2)',
        }}
      >
        &#9733;
      </div>
      {/* Heart */}
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          fontFamily: 'sans-serif',
          fontSize: 18,
          color: 'rgba(255,130,150,0.2)',
        }}
      >
        &#9829;
      </div>
      {/* Arrow */}
      <div
        style={{
          position: 'absolute',
          top: '75%',
          left: '18%',
          width: 40,
          height: 2,
          background: 'rgba(100,180,255,0.15)',
          transform: 'rotate(-10deg)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index }: WordRenderProps) => {
    const chars = word.split('')
    const seed = index * 61 + 17

    let opacity = 1
    let smudgeAmount = 0

    if (phase === 'enter') {
      opacity = 1
    } else if (phase === 'hold') {
      smudgeAmount = holdProgress * 0.15
    } else {
      // Rain smudge dissolve on exit
      opacity = 1
      smudgeAmount = 0.15 + exitProgress * 0.5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        {/* Chalk color smudge halo */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '120%',
            height: '150%',
            background: `radial-gradient(ellipse, ${color}10 0%, transparent 60%)`,
            filter: `blur(${8 + smudgeAmount * 20}px)`,
            pointerEvents: 'none',
          }}
        />

        {/* Character-by-character chalk drawing */}
        <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
          {chars.map((char, ci) => {
            const cs = seed + ci * 23
            // Staggered drawing animation
            const totalChars = chars.length
            const charStart = (ci / totalChars) * 0.65
            const charEnd = charStart + 0.4
            const charDraw = phase === 'enter'
              ? Math.max(0, Math.min(1, (enterProgress - charStart) / (charEnd - charStart)))
              : phase === 'exit'
                ? Math.max(0, 1 - exitProgress * 1.5)
                : 1

            // Hand-drawn jitter — kids writing is wobbly
            const jitterY = Math.sin(ci * 3.1 + index) * 4 + (rand(cs) - 0.5) * 6
            const jitterRot = (rand(cs + 1) - 0.5) * 8
            const charScale = 0.9 + rand(cs + 2) * 0.2

            // Each character gets a slightly different chalk color tint
            const hueShift = (rand(cs + 3) - 0.5) * 15

            if (char === ' ') {
              return <div key={ci} style={{ width: 'clamp(12px, 3vw, 28px)' }} />
            }

            return (
              <div
                key={ci}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  transform: `translateY(${jitterY}px) rotate(${jitterRot}deg) scale(${charScale})`,
                  opacity: charDraw,
                }}
              >
                {/* Chalk dust underneath */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    left: '10%',
                    right: '10%',
                    height: 6,
                    background: `${color}18`,
                    borderRadius: '50%',
                    filter: 'blur(3px)',
                    opacity: charDraw,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Permanent Marker', 'Comic Sans MS', 'Segoe Script', cursive",
                    fontSize: 'clamp(40px, 11vw, 140px)',
                    fontWeight: 400,
                    color,
                    whiteSpace: 'nowrap',
                    // Chalk texture — grainy, semi-transparent
                    textShadow: `0 0 2px ${color}40, 1px 1px 0 rgba(0,0,0,0.1)`,
                    filter: `blur(${smudgeAmount * 3}px) hue-rotate(${hueShift}deg)`,
                    // Clip from bottom to simulate drawing stroke
                    clipPath: charDraw < 1
                      ? `inset(${(1 - charDraw) * 60}% 0 0 0)`
                      : 'none',
                  }}
                >
                  {char}
                </span>
              </div>
            )
          })}
        </div>

        {/* Hopscotch-style underline */}
        {phase !== 'exit' && (
          <div
            style={{
              position: 'relative',
              marginTop: 8,
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 'clamp(16px, 4vw, 35px)',
                  height: 3,
                  background: color,
                  opacity: 0.3 * (phase === 'enter' ? Math.min(1, enterProgress * 2) : 1),
                  borderRadius: 2,
                  transform: `rotate(${(rand(seed + i * 7) - 0.5) * 6}deg)`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  },
}

function SidewalkChalkComponent(props: MotionGraphicProps<SidewalkChalkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sidewalk-chalk',
  title: 'Kinetic Sidewalk Chalk',
  description: 'Colorful sidewalk chalk art on concrete pavement — wobbly hand-drawn characters, chalk dust, rain smudge dissolve, and playful kids drawing aesthetic',
  tags: ['kinetic', 'typography', 'chalk', 'sidewalk', 'kids', 'colorful', 'playful', 'street', 'handwritten'],
  category: 'captions',
  component: SidewalkChalkComponent as any,
  defaultConfig: {
    words: ['PLAY', 'DRAW', 'JUMP', 'LOVE'],
    colors: ['#ff6b8a', '#50c8ff', '#ffe040', '#70e080'],
    bgColor: '#9a9590',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PLAY', 'DRAW', 'JUMP', 'LOVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff6b8a', '#50c8ff', '#ffe040', '#70e080'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#9a9590', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
