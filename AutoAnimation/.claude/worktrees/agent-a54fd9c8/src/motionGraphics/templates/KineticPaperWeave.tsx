import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaperWeaveConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Paper weaving: strips of colored paper woven together — over/under pattern.
// The animation shows strips feeding in from alternating directions
// and interlacing to form the text/background.
// Key: alternating over/under creates distinctive shadow at each crossing.
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const f = frame ?? 0
    const stripH = 20  // Strip height in px
    const cols = Math.ceil(width / stripH)
    const rows = Math.ceil(height / stripH)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Woven background strips */}
        {Array.from({ length: rows }, (_, ri) => {
          const isHorizontal = true
          const stripColor = ri % 2 === 0
            ? `rgba(180,150,120,0.08)`
            : `rgba(150,120,100,0.05)`
          return (
            <div
              key={ri}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: ri * stripH,
                height: stripH,
                background: stripColor,
                borderBottom: '1px solid rgba(0,0,0,0.04)',
              }}
            />
          )
        })}
        {/* Vertical strips (the warp) */}
        {Array.from({ length: cols }, (_, ci) => (
          <div
            key={ci}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: ci * stripH,
              width: stripH,
              background: ci % 2 === 0 ? 'rgba(200,170,140,0.05)' : 'rgba(160,140,120,0.04)',
              borderRight: '1px solid rgba(0,0,0,0.03)',
            }}
          />
        ))}
        {/* Crossing shadow dots */}
        {Array.from({ length: Math.min(rows * cols, 120) }, (_, i) => {
          const row = Math.floor(i / cols)
          const col = i % cols
          const isOver = (row + col) % 2 === 0
          return isOver ? null : (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: col * stripH + stripH * 0.1,
                top: row * stripH + stripH * 0.1,
                width: stripH * 0.8,
                height: stripH * 0.8,
                background: 'rgba(0,0,0,0.04)',
                borderRadius: 2,
              }}
            />
          )
        })}
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
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const stripCount = 8  // Number of horizontal strips making up the text

    // Strip colors — alternating to show weave
    const stripColors = [color, `${color}CC`, color, `${color}AA`]

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Woven strips that form the text via clip masking */}
        {Array.from({ length: stripCount }, (_, si) => {
          const stripDelay = si * (si % 2 === 0 ? 0.07 : 0.09)
          let slideProgress = 0
          let opacity = 0
          let exitSlide = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - stripDelay) / (0.8 - stripDelay * 0.3)))
            slideProgress = easeOutCubic(p)
            opacity = Math.min(1, p * 3)
          } else if (phase === 'hold') {
            slideProgress = 1
            opacity = 1
          } else {
            const p = Math.max(0, Math.min(1, exitProgress + si * 0.05))
            slideProgress = 1 - easeOutCubic(p)
            opacity = Math.max(0, 1 - p * 1.5)
            exitSlide = p
          }

          // Alternate strips come from left and right
          const fromLeft = si % 2 === 0
          const slideX = fromLeft
            ? (1 - slideProgress) * -200
            : (1 - slideProgress) * 200

          const isOnTop = si % 2 === 0  // Over-under weave

          return (
            <div
              key={si}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${(si / stripCount) * 100}%`,
                height: `${100 / stripCount}%`,
                overflow: 'hidden',
                zIndex: isOnTop ? 2 : 1,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: `translateX(${slideX}px)`,
                  opacity,
                }}
              >
                {/* Strip background */}
                <div
                  style={{
                    position: 'absolute',
                    inset: isOnTop ? 0 : '5% 0',
                    background: isOnTop ? color : `${color}CC`,
                    boxShadow: isOnTop
                      ? '0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
                      : 'none',
                  }}
                />
                {/* Text clipped to this strip */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                      fontSize: 'clamp(52px, 13vw, 180px)',
                      fontWeight: 900,
                      letterSpacing: -1,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                      color: '#FFFFFF',
                      position: 'absolute',
                      top: `${-si * (100 / stripCount)}%`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      opacity: 0.9,
                      mixBlendMode: 'overlay',
                    }}
                  >
                    {word}
                  </div>
                </div>
                {/* Edge shadow for over/under depth */}
                {!isOnTop && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.08)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            </div>
          )
        })}

        {/* Ghost word for sizing */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(52px, 13vw, 180px)',
            fontWeight: 900,
            letterSpacing: -1,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            color: 'transparent',
            position: 'relative',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PaperWeaveComponent(props: MotionGraphicProps<PaperWeaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-paper-weave',
  title: 'Kinetic Paper Weave',
  description: 'Paper strips feed in from alternating left-right directions and interlace over-under to form text — each strip clipped to reveal its section, with weave shadow depth at crossings',
  tags: ['kinetic', 'typography', 'weave', 'paper', 'craft', 'interlace', 'strips', 'over-under', 'geometric', 'reveal'],
  category: 'captions',
  component: PaperWeaveComponent as any,
  defaultConfig: {
    words: ['WEAVE', 'LACE', 'OVER', 'UNDER'],
    colors: ['#1A4A8C', '#8C1A1A', '#1A8C4A', '#8C6A1A'],
    bgColor: '#EDE8E0',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WEAVE', 'LACE', 'OVER', 'UNDER'], group: 'Content' },
    { key: 'colors', label: 'Strip Colors', type: 'text-array', defaultValue: ['#1A4A8C', '#8C1A1A', '#1A8C4A', '#8C6A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#EDE8E0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.4, max: 5, group: 'Timing' },
  ],
})
