import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CafeChalkConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const boardW = Math.min(width * 0.82, 650)
    const boardH = Math.min(height * 0.7, 450)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Sidewalk / brick background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              0deg,
              rgba(180,140,100,0.08) 0px,
              rgba(180,140,100,0.08) 20px,
              rgba(160,120,80,0.06) 20px,
              rgba(160,120,80,0.06) 21px
            )`,
          }}
        />
        {/* A-frame board */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: boardW,
            height: boardH,
          }}
        >
          {/* Wooden frame */}
          <div
            style={{
              position: 'absolute',
              inset: -8,
              background: 'linear-gradient(135deg, #5a3820, #7a4e30, #5a3820)',
              borderRadius: 6,
              boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
            }}
          />
          {/* Chalkboard surface */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(160deg, #2a3a2a, #1e2e1e, #263626)',
              borderRadius: 2,
            }}
          >
            {/* Chalk dust texture */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.03) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(255,255,255,0.02) 0%, transparent 40%)',
              }}
            />
            {/* Erased smudges */}
            <div
              style={{
                position: 'absolute',
                top: '20%',
                left: '15%',
                width: '30%',
                height: '15%',
                background: 'rgba(200,200,200,0.03)',
                borderRadius: '50%',
                filter: 'blur(8px)',
                transform: 'rotate(-5deg)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '25%',
                right: '20%',
                width: '25%',
                height: '12%',
                background: 'rgba(200,200,200,0.025)',
                borderRadius: '50%',
                filter: 'blur(6px)',
                transform: 'rotate(8deg)',
              }}
            />
          </div>
          {/* Decorative chalk line border */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              right: 12,
              bottom: 12,
              border: '2px dashed rgba(255,255,255,0.15)',
              borderRadius: 2,
              pointerEvents: 'none',
            }}
          />
          {/* Small chalk decoration: coffee cup */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              right: 24,
              fontFamily: "'Georgia', serif",
              fontSize: 16,
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            &#9749;
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const chars = word.split('')
    const opacity = phase === 'exit' ? 1 - exitProgress : 1

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
        {/* Chalk stroke drawing animation — each character draws in */}
        <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
          {chars.map((char, ci) => {
            // Staggered stroke drawing — like hand lettering left to right
            const totalChars = chars.length
            const charStart = (ci / totalChars) * 0.7
            const charEnd = charStart + 0.35
            const charDraw = phase === 'enter'
              ? Math.max(0, Math.min(1, (enterProgress - charStart) / (charEnd - charStart)))
              : 1

            // Chalk appears as if being drawn: clip from left
            const clipX = charDraw * 100
            const charOpacity = charDraw > 0 ? 0.6 + charDraw * 0.4 : 0

            // Slight hand-drawn jitter
            const jitterY = Math.sin(ci * 2.7 + index) * 2
            const jitterRot = Math.sin(ci * 1.3 + index * 0.7) * 1.5

            if (char === ' ') {
              return <div key={ci} style={{ width: 'clamp(10px, 2.5vw, 24px)' }} />
            }

            return (
              <div
                key={ci}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  transform: `translateY(${jitterY}px) rotate(${jitterRot}deg)`,
                  clipPath: `inset(0 ${100 - clipX}% 0 0)`,
                  opacity: charOpacity,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Permanent Marker', 'Comic Sans MS', 'Segoe Script', cursive",
                    fontSize: 'clamp(30px, 9vw, 110px)',
                    fontWeight: 400,
                    color,
                    textShadow: `1px 1px 0 rgba(255,255,255,0.08), -1px -1px 0 rgba(0,0,0,0.2)`,
                    letterSpacing: 2,
                    // Chalk rough texture
                    filter: 'url(#chalk-rough) drop-shadow(0 0 1px rgba(255,255,255,0.1))',
                  }}
                >
                  {char}
                </span>
              </div>
            )
          })}
        </div>
        {/* Chalk underline drawing in */}
        {phase !== 'exit' && (
          <div
            style={{
              position: 'relative',
              height: 3,
              marginTop: 6,
              marginLeft: '5%',
              marginRight: '5%',
              background: `linear-gradient(90deg, ${color}80, ${color}40)`,
              borderRadius: 2,
              clipPath: `inset(0 ${100 - Math.min(100, (phase === 'enter' ? enterProgress * 1.2 : 1) * 100)}% 0 0)`,
              opacity: 0.5,
            }}
          />
        )}
      </div>
    )
  },
}

function CafeChalkComponent(props: MotionGraphicProps<CafeChalkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cafe-chalk',
  title: 'Cafe Chalkboard',
  description:
    'Sidewalk cafe A-frame chalkboard with hand-lettered text drawing in character by character. Wooden frame, chalk dust smudges, and dashed border.',
  tags: ['kinetic', 'typography', 'cafe', 'chalk', 'chalkboard', 'handwritten', 'signage', 'restaurant'],
  category: 'captions',
  component: CafeChalkComponent as any,
  defaultConfig: {
    words: ['SPECIALS', 'LATTE', 'FRESH', 'OPEN'],
    colors: ['#f0e8d0', '#FFD700', '#f0e8d0', '#90EE90'],
    bgColor: '#4a3a2a',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPECIALS', 'LATTE', 'FRESH', 'OPEN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#f0e8d0', '#FFD700', '#f0e8d0', '#90EE90'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#4a3a2a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
