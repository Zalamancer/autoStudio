import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MenuChalkConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Chalkboard texture using layered pseudo-random noise
    const dustParticles = Array.from({ length: 40 }, (_, i) => {
      const seed = i * 43 + 17
      const x = ((seed * 7) % 100)
      const y = ((seed * 13) % 100)
      const size = 1 + (seed % 3)
      const opacity = 0.03 + (seed % 5) * 0.008
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(255,255,255,${opacity})`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#2A3B2A'
            ? 'linear-gradient(160deg, #1E2D1E 0%, #2A3B2A 40%, #243324 70%, #1A2A1A 100%)'
            : bgColor,
        }}
      >
        {dustParticles}
        {/* Wooden frame border */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '12px solid #5C3D1F',
            borderRadius: 4,
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4), inset 0 0 60px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
          }}
        />
        {/* Inner chalk border line */}
        <div
          style={{
            position: 'absolute',
            inset: 24,
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 2,
            pointerEvents: 'none',
          }}
        />
        {/* Top decorative text */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            fontFamily: "'Georgia', serif",
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          Today&apos;s Specials
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let scale = 1
    let rotate = 0

    if (phase === 'enter') {
      // Chalk writing effect - appears stroke by stroke
      const writeProgress = Math.min(1, enterProgress * 1.6)
      opacity = writeProgress
      // Slight hand-drawn wobble during writing
      if (enterProgress < 0.6) {
        rotate = Math.sin(enterProgress * 20) * 1.5
        scale = 0.95 + enterProgress * 0.08
      } else {
        scale = 1
        rotate = 0
      }
    } else if (phase === 'hold') {
      opacity = 0.92 + Math.sin(f * 0.05 + index) * 0.08
      // Very subtle chalk dust shimmer
      rotate = Math.sin(f * 0.02 + index * 3) * 0.3
    } else {
      // Eraser wipe effect
      opacity = 1 - Math.pow(exitProgress, 0.8)
      scale = 1 - exitProgress * 0.1
    }

    // Chalk texture: rough edges, slightly transparent
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          fontFamily: "'Courier New', 'Chalkduster', cursive, monospace",
          fontSize: 'clamp(36px, 11vw, 140px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 4,
          color,
          textShadow: `
            0 0 2px ${color},
            1px 1px 0 rgba(255,255,255,0.1),
            -1px -1px 0 rgba(0,0,0,0.3)
          `,
          whiteSpace: 'nowrap',
          filter: 'url(#chalk-rough)',
        }}
      >
        {word}
        {/* Chalk dust particles around text */}
        {phase === 'enter' && enterProgress < 0.7 && (
          <>
            {Array.from({ length: 6 }, (_, i) => {
              const dx = Math.cos(i * 1.05 + enterProgress * 8) * 20
              const dy = Math.sin(i * 1.3 + enterProgress * 6) * 15
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${dx}px)`,
                    top: `calc(50% + ${dy}px)`,
                    width: 2,
                    height: 2,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.3)',
                    pointerEvents: 'none',
                  }}
                />
              )
            })}
          </>
        )}
      </div>
    )
  },
}

function MenuChalkComponent(props: MotionGraphicProps<MenuChalkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-menu-chalk',
  title: 'Menu Chalk',
  description: 'Chalkboard menu style text with hand-drawn wobble writing animation, chalk dust particles, wooden frame border, and eraser wipe exit',
  tags: ['kinetic', 'food', 'restaurant', 'chalkboard', 'menu', 'chalk', 'cafe', 'handwritten'],
  category: 'captions',
  component: MenuChalkComponent as any,
  defaultConfig: {
    words: ['SPECIAL', 'FRESH', 'DAILY', 'MENU'],
    colors: ['#FFFFFF', '#F0E6C0', '#FFFFFF', '#F0E6C0'],
    bgColor: '#2A3B2A',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPECIAL', 'FRESH', 'DAILY', 'MENU'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#F0E6C0', '#FFFFFF', '#F0E6C0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2A3B2A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
