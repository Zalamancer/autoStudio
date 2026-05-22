import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FilmBurnRevealConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, progress }: BackgroundRenderProps) => {
    const time = frame / fps

    // Burn starts at center and expands outward — use overall progress to drive
    // For background we show the film frame burning
    const cycleTime = time % 3.0
    const burnProgress = Math.min(1, cycleTime / 1.5)  // 0..1 over 1.5s
    const burnRadius = burnProgress * 80  // % of screen

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Dark film frame base */}
        <div style={{ position: 'absolute', inset: 0, background: '#0a0805' }} />
        {/* Film frame texture — slight sepia */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(40,25,10,0.3) 0%, rgba(20,12,4,0.1) 50%, rgba(40,25,10,0.3) 100%)',
          }}
        />
        {/* Burn hole — radial mask from center */}
        {burnRadius > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse ${burnRadius}% ${burnRadius * 0.7}% at 50% 50%, transparent 60%, rgba(255,120,20,${Math.min(0.8, burnProgress * 1.2)}) 80%, rgba(180,60,0,0.6) 90%, transparent 100%)`,
            }}
          />
        )}
        {/* Burn glow — orange/amber emanating from hole edge */}
        {burnRadius > 5 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse ${burnRadius * 0.8}% ${burnRadius * 0.56}% at 50% 50%, rgba(255,200,50,${0.15 * burnProgress}) 0%, rgba(255,100,10,${0.3 * burnProgress}) 50%, transparent 80%)`,
            }}
          />
        )}
        {/* Embers — small bright dots at burn edge */}
        {burnRadius > 10 && [
          { x: 50, y: 50 - burnRadius * 0.65 },
          { x: 50 + burnRadius * 0.85, y: 50 },
          { x: 50 - burnRadius * 0.85, y: 50 },
          { x: 50, y: 50 + burnRadius * 0.65 },
          { x: 50 + burnRadius * 0.6, y: 50 - burnRadius * 0.46 },
          { x: 50 - burnRadius * 0.6, y: 50 + burnRadius * 0.46 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              borderRadius: '50%',
              background: `rgba(255,${180 + i * 10},${20 + i * 5},${0.8 + Math.sin(time * 23 + i) * 0.2})`,
              filter: 'blur(2px)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
        {/* Char edge — dark brown at burn boundary */}
        {burnRadius > 8 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse ${burnRadius * 0.9}% ${burnRadius * 0.63}% at 50% 50%, transparent 70%, rgba(80,30,0,0.7) 80%, transparent 90%)`,
            }}
          />
        )}
        {/* Film sprocket holes */}
        {[15, 35, 55, 75].map((y, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div
              style={{
                position: 'absolute',
                left: '1.5%',
                top: `${y}%`,
                width: 10,
                height: 14,
                borderRadius: 2,
                background: 'rgba(0,0,0,0.6)',
                transform: 'translateY(-50%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '1.5%',
                top: `${y}%`,
                width: 10,
                height: 14,
                borderRadius: 2,
                background: 'rgba(0,0,0,0.6)',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
        ))}
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 24

    // Text emerges through the burn hole — revealed as hole expands
    // Burn radius drives a clip-path-like reveal (we simulate with opacity/glow)
    let opacity = 0
    let burnGlow = 0
    let charBlur = 0

    if (phase === 'enter') {
      // Text appears as burn hole reveals it — chars at center first
      if (enterProgress < 0.3) {
        // Glow precedes text — fire light illuminates before text visible
        opacity = 0
        burnGlow = enterProgress / 0.3
      } else {
        const p = (enterProgress - 0.3) / 0.7
        opacity = p
        burnGlow = 1 - p * 0.5  // glow fades as text stabilizes
        charBlur = (1 - p) * 4
      }
    } else if (phase === 'hold') {
      opacity = 1
      burnGlow = 0.2 + 0.05 * Math.sin(time * 3.1)  // ember flicker
      charBlur = 0
    } else {
      opacity = 1 - exitProgress
      burnGlow = 0
      charBlur = exitProgress * 3
    }

    return (
      <>
        {/* Fire glow pre-reveal */}
        {burnGlow > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 900,
              color: `rgba(255,150,20,1)`,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: 5,
              filter: `blur(20px)`,
              opacity: burnGlow,
            }}
          >
            {word}
          </div>
        )}
        {/* Amber heat halo */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color: 'rgba(255,200,80,0.5)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
            filter: `blur(8px)`,
            opacity: opacity * 0.6,
          }}
        >
          {word}
        </div>
        {/* Main text — lit by the fire */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 5,
            filter: `blur(${charBlur}px)`,
            textShadow: `0 0 20px rgba(255,160,30,${opacity * 0.7}), 0 0 40px rgba(255,100,10,${opacity * 0.4})`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function FilmBurnRevealComponent(props: MotionGraphicProps<FilmBurnRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-film-burn-reveal',
  title: 'Kinetic Film Burn Reveal',
  description: 'Film burns from center outward with expanding char hole, ember glow, and text emerging through the burn as fire illuminates the frame',
  tags: ['kinetic', 'typography', 'film-burn', 'fire', 'cinema', 'burn', 'reveal', 'vintage', 'amber'],
  category: 'captions',
  component: FilmBurnRevealComponent as any,
  defaultConfig: {
    words: ['FIRE', 'BURN', 'REVEAL'],
    colors: ['#fff0d0', '#ffe8b0', '#fff0d0'],
    bgColor: '#0a0805',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FIRE', 'BURN', 'REVEAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#fff0d0', '#ffe8b0', '#fff0d0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0805', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.5, max: 6, group: 'Timing' },
  ],
})
