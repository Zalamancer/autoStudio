import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AnamorphicFlareConfig extends KineticBaseConfig {
  flareColor: string
}

// Anamorphic lens flare: a horizontal streak of light (characteristic of
// anamorphic cinema lenses — Panavision, Hawk, etc.) sweeps across the frame
// left to right, and as it passes over the text it reveals it.
// The flare has the classic electric blue tint and lens iris reflections.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, enterProgress, holdProgress, exitProgress }: BackgroundRenderProps) => {
    const time = frame / fps
    const ep = enterProgress ?? 0
    const xp = exitProgress ?? 0
    const hp = holdProgress ?? 0

    // Flare sweep position: -10% to 110% during enter, reverse on exit
    const easeInOut = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    let flareX: number
    let flareOpacity: number

    if (hp > 0) {
      // Flare gone, residual glow
      flareX = 120
      flareOpacity = 0
    } else if (xp > 0) {
      // Re-enter from right on exit
      flareX = 110 - easeInOut(xp) * 120
      flareOpacity = Math.sin(xp * Math.PI) * 0.9
    } else {
      // Enter: sweep left to right
      flareX = -10 + easeInOut(ep) * 120
      flareOpacity = Math.sin(ep * Math.PI) * 0.95
    }

    // Anamorphic: extremely wide horizontal, very thin vertical
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Subtle background illumination from flare */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse ${Math.abs(flareOpacity) * 40 + 10}% 8% at ${flareX}% 50%, rgba(60,120,255,${flareOpacity * 0.12}) 0%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Main horizontal streak — ultra-wide, paper-thin */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${flareX}%`,
            transform: 'translate(-50%, -50%)',
            width: '200%',
            height: 3,
            background: `linear-gradient(90deg,
              transparent 0%,
              rgba(30,80,220,${flareOpacity * 0.3}) 20%,
              rgba(80,140,255,${flareOpacity * 0.9}) 45%,
              rgba(255,255,255,${flareOpacity}) 50%,
              rgba(80,140,255,${flareOpacity * 0.9}) 55%,
              rgba(30,80,220,${flareOpacity * 0.3}) 80%,
              transparent 100%
            )`,
            filter: 'blur(0.5px)',
            pointerEvents: 'none',
          }}
        />

        {/* Secondary faint streak */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${flareX}%`,
            transform: 'translate(-50%, -50%)',
            width: '180%',
            height: 1,
            marginTop: 6,
            background: `linear-gradient(90deg,
              transparent 0%,
              rgba(100,160,255,${flareOpacity * 0.4}) 30%,
              rgba(180,210,255,${flareOpacity * 0.7}) 50%,
              rgba(100,160,255,${flareOpacity * 0.4}) 70%,
              transparent 100%
            )`,
            pointerEvents: 'none',
          }}
        />

        {/* Iris reflection dots — characteristic anamorphic artefacts */}
        {[-30, -18, -8, 8, 18, 30].map((offset, i) => {
          const dotX = flareX + offset
          const dotOpacity = flareOpacity * (0.3 - Math.abs(offset) / 120)
          const dotSize = 4 + (Math.abs(offset) < 10 ? 8 : 0)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${dotX}%`,
                transform: 'translate(-50%, -50%)',
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                background: `rgba(120,180,255,${Math.max(0, dotOpacity)})`,
                filter: `blur(${dotSize * 0.4}px)`,
                pointerEvents: 'none',
              }}
            />
          )
        })}

        {/* Cinematic vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 2)

    let opacity: number
    let blur: number

    // Text fades in as flare passes over it
    if (phase === 'enter') {
      // Reveal is tied to flare sweep — text materialises in flare's wake
      const revealStart = 0.25
      const revealEnd = 0.75
      const revealT = Math.max(0, Math.min(1, (enterProgress - revealStart) / (revealEnd - revealStart)))
      opacity = easeOut(revealT)
      blur = (1 - revealT) * 4
    } else if (phase === 'hold') {
      opacity = 1
      blur = 0
    } else {
      opacity = 1 - easeOut(exitProgress)
      blur = exitProgress * 3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Blue flare tint overlay on text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 200,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: 'rgba(100,160,255,0.5)',
            filter: `blur(8px)`,
            opacity: opacity * 0.4,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 200,
            color,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity,
            filter: blur > 0.2 ? `blur(${blur}px)` : 'none',
            textShadow: opacity > 0.5 ? `0 0 30px rgba(100,160,255,0.2), 0 2px 8px rgba(0,0,0,0.8)` : 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function AnamorphicFlareComponent(props: MotionGraphicProps<AnamorphicFlareConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-anamorphic-flare',
  title: 'Kinetic Anamorphic Flare',
  description: 'Horizontal anamorphic lens flare sweeps across the frame revealing text in its wake — electric blue streak with iris reflection artefacts',
  tags: ['kinetic', 'typography', 'film', 'camera', 'anamorphic', 'flare', 'lens', 'cinematic', 'panavision', 'streak'],
  category: 'captions',
  component: AnamorphicFlareComponent as any,
  defaultConfig: {
    words: ['ANAMORPHIC', 'CINEMA', 'WIDE', 'SCOPE'],
    colors: ['#E8F0FF', '#FFFFFF', '#D0E4FF', '#F0F4FF'],
    bgColor: '#04060E',
    cycleDuration: 1.6,
    flareColor: '#4090FF',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ANAMORPHIC', 'CINEMA', 'WIDE', 'SCOPE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8F0FF', '#FFFFFF', '#D0E4FF', '#F0F4FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#04060E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'flareColor', label: 'Flare Color', type: 'color', defaultValue: '#4090FF', group: 'Animation' },
  ],
})
